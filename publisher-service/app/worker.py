"""发布任务调度器。

- 每个平台一条串行队列：同一平台同时只跑一个任务（浏览器 profile 独占）；
  不同平台之间并行，互不阻塞。
- 每一步进度都写回 SQLite，后端 PHP 轮询 /api/tasks/{id} 就能拿到实时状态。
- 失败自动截图存档，并把截图路径回传，方便定位是风控、验证码还是改版。
- 终态时回调后端 callback_url，后端据此更新 marketing_douyin_content.status。
"""
from __future__ import annotations

import asyncio
import traceback
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import httpx

from .browser import hub
from .config import PLATFORMS, settings
from .logger import get_logger
from .store import get_task, pending_tasks, update_task, upsert_account
from .uploaders import PublishError, get_uploader

log = get_logger("worker")


class PublishWorker:
    def __init__(self) -> None:
        self._queues: Dict[str, asyncio.Queue[str]] = {p: asyncio.Queue() for p in PLATFORMS}
        self._runners: list[asyncio.Task] = []
        self._started = False

    # ------------------------------------------------------------ 生命周期

    async def start(self) -> None:
        if self._started:
            return
        self._started = True
        for platform in PLATFORMS:
            self._runners.append(asyncio.create_task(self._run_loop(platform)))
        log.info("发布调度器已启动，平台队列: %s", ", ".join(PLATFORMS))
        await self._requeue_unfinished()

    async def stop(self) -> None:
        for runner in self._runners:
            runner.cancel()
        for runner in self._runners:
            try:
                await runner
            except asyncio.CancelledError:
                pass
        self._runners.clear()
        self._started = False
        log.info("发布调度器已停止")

    async def _requeue_unfinished(self) -> None:
        """服务重启后，把 pending/running 的任务重新入队。"""
        restored = 0
        for task in pending_tasks():
            if task["platform"] not in self._queues:
                continue
            if task["status"] == "running":
                update_task(task["task_id"], status="pending", stage="已排队",
                            message="服务重启，任务重新排队")
            await self._queues[task["platform"]].put(task["task_id"])
            restored += 1
        if restored:
            log.info("已恢复 %d 个未完成任务", restored)

    # ------------------------------------------------------------ 入队

    async def submit(self, task_id: str, platform: str) -> int:
        queue = self._queues.get(platform)
        if queue is None:
            raise PublishError(f"不支持的平台: {platform}")
        await queue.put(task_id)
        return queue.qsize()

    def queue_size(self, platform: str) -> int:
        queue = self._queues.get(platform)
        return queue.qsize() if queue else 0

    # ------------------------------------------------------------ 执行循环

    async def _run_loop(self, platform: str) -> None:
        while True:
            try:
                task_id = await self._queues[platform].get()
            except asyncio.CancelledError:
                raise
            try:
                await self._execute(task_id)
            except asyncio.CancelledError:
                raise
            except Exception:  # noqa: BLE001  pragma: no cover
                log.error("任务 %s 执行时出现未捕获异常:\n%s", task_id, traceback.format_exc())
            finally:
                self._queues[platform].task_done()

    async def _execute(self, task_id: str) -> None:
        task = get_task(task_id)
        if not task:
            log.warning("任务 %s 不存在，跳过", task_id)
            return
        if task["status"] in ("success", "cancelled"):
            return

        platform = task["platform"]
        account = task["account"]
        uploader = get_uploader(platform)
        attempts = int(task.get("attempts") or 0)

        async def progress(stage: str, percent: int, message: str) -> None:
            update_task(task_id, stage=stage, progress=percent, message=message)
            log.info("[%s#%s] %d%% %s - %s", platform, task["biz_id"], percent, stage, message)

        max_attempts = settings.max_retry + 1
        last_error: Optional[str] = None

        while attempts < max_attempts:
            attempts += 1
            update_task(task_id, status="running", attempts=attempts,
                        stage="启动浏览器", progress=2,
                        message=f"第 {attempts}/{max_attempts} 次尝试")
            try:
                async with hub.session(platform, account) as (_ctx, page):
                    result = await asyncio.wait_for(
                        uploader.publish(page, task, progress),
                        timeout=settings.task_timeout,
                    )
                update_task(
                    task_id, status="success", stage="done", progress=100,
                    message="发布成功", result_url=result.get("result_url", ""),
                    screenshot="",
                )
                upsert_account(platform, account, logged_in=True, message="发布成功")
                await self._callback(task, "success", result)
                log.info("[%s#%s] 发布成功", platform, task["biz_id"])
                return

            except asyncio.TimeoutError:
                last_error = f"任务超时（{settings.task_timeout}s）"
            except PublishError as exc:
                last_error = str(exc)
                if "登录态已失效" in last_error or "重新扫码" in last_error:
                    upsert_account(platform, account, logged_in=False, message=last_error)
                    break  # 登录问题重试无意义
            except Exception as exc:  # noqa: BLE001
                last_error = f"{type(exc).__name__}: {exc}"
                log.error("[%s#%s] 异常:\n%s", platform, task["biz_id"], traceback.format_exc())

            shot = await self._capture_failure(platform, account, task_id)
            update_task(task_id, stage="retrying", message=f"{last_error}", screenshot=shot)

            if attempts < max_attempts:
                log.warning("[%s#%s] 第 %d 次失败：%s，5 秒后重试",
                            platform, task["biz_id"], attempts, last_error)
                await asyncio.sleep(5)

        update_task(task_id, status="failed", stage="failed",
                    message=last_error or "发布失败", attempts=attempts)
        await self._callback(task, "failed", {"error": last_error})
        log.error("[%s#%s] 最终失败：%s", platform, task["biz_id"], last_error)

    # ------------------------------------------------------------ 辅助

    async def _capture_failure(self, platform: str, account: str, task_id: str) -> str:
        """失败现场截图，便于判断是风控/验证码/改版。"""
        try:
            key = hub.key_of(platform, account)
            context = hub._contexts.get(key)  # noqa: SLF001 内部复用
            if not context or not context.pages:
                return ""
            page = context.pages[-1]
            stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            path = settings.shots_dir / f"fail_{platform}_{task_id[:8]}_{stamp}.png"
            await page.screenshot(path=str(path), full_page=False)
            log.info("失败截图已保存: %s", path)
            return str(path)
        except Exception as exc:  # noqa: BLE001
            log.warning("截图失败: %s", exc)
            return ""

    async def _callback(self, task: Dict[str, Any], status: str, result: Dict[str, Any]) -> None:
        url = (task.get("callback_url") or "").strip()
        if not url:
            return
        body = {
            "id": task["biz_id"],
            "task_id": task["task_id"],
            "platform": task["platform"],
            "status": status,
            "result": result or {},
        }
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(url, json=body,
                                         headers={"X-Publisher-Token": settings.token})
            log.info("回调 %s -> HTTP %s", url, resp.status_code)
        except Exception as exc:  # noqa: BLE001
            log.warning("回调 %s 失败: %s", url, exc)


worker = PublishWorker()
