"""publisher-service 入口。

启动：  python main.py
或：    uvicorn main:app --host 0.0.0.0 --port 8899

对外 HTTP 接口全部挂在 /api 下，需要 X-Publisher-Token 头（与后端 .env 共享密钥）。
"""
from __future__ import annotations

import asyncio
import contextlib
from pathlib import Path
from typing import Any, Dict, Optional

import uvicorn
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from app import __version__
from app.browser import hub
from app.config import PLATFORM_LABELS, PLATFORMS, settings
from app.login import check_login_status, login_manager
from app.logger import get_logger, setup_logging
from app.schemas import PublishRequest
from app.store import (
    create_task,
    delete_account,
    get_account,
    get_task,
    init_db,
    latest_task_by_biz,
    list_accounts,
)
from app.uploaders import PublishError, all_uploaders
from app.worker import worker

setup_logging()
log = get_logger("main")


# ------------------------------------------------------------------ 鉴权

async def require_token(x_publisher_token: Optional[str] = Header(None)) -> None:
    if not settings.token:
        # 未配置密钥时放行，仅适合内网调试
        return
    if x_publisher_token != settings.token:
        raise HTTPException(status_code=401, detail="X-Publisher-Token 无效")


# ------------------------------------------------------------------ 生命周期

@contextlib.asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    await hub.start()
    await worker.start()
    log.info("publisher-service v%s 已就绪，监听 %s:%s", __version__, settings.host, settings.port)
    log.info("浏览器模式：%s，通道：%s", "无头" if settings.headless else "有头", settings.browser_channel)
    yield
    await worker.stop()
    await hub.stop()


app = FastAPI(title="爱维修 · 自动发布服务", version=__version__, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ok(data: Any = None, message: str = "success") -> JSONResponse:
    return JSONResponse({"code": 0, "message": message, "data": data})


def fail(message: str, code: int = 500) -> JSONResponse:
    return JSONResponse({"code": code, "message": message, "data": None}, status_code=200)


# ------------------------------------------------------------------ 健康检查

@app.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "code": 0,
        "message": "ok",
        "data": {
            "service": "publisher-service",
            "version": __version__,
            "headless": settings.headless,
            "browser_channel": settings.browser_channel,
            "platforms": list(PLATFORMS),
            "queues": {p: worker.queue_size(p) for p in PLATFORMS},
        },
    }


# ------------------------------------------------------------------ 发布

@app.post("/api/publish", dependencies=[Depends(require_token)])
async def submit_publish(req: PublishRequest) -> JSONResponse:
    video = Path(req.video_path)
    if not video.exists():
        return fail(f"视频文件不存在或本服务无权访问：{req.video_path}。"
                    f"请确认路径是【运行本服务的这台机器】上的绝对路径。", 404)

    account = get_account(req.platform, req.account)
    if account is not None and not account.get("logged_in"):
        log.warning("%s 登录态标记为失效，仍尝试发布（可能已在浏览器里续期）", req.platform)

    task_id = create_task(req)
    position = await worker.submit(task_id, req.platform)
    log.info("已受理发布任务 %s（%s#%s），队列位置 %d",
             task_id, req.platform, req.biz_id, position)

    return ok({
        "task_id": task_id,
        "platform": req.platform,
        "biz_id": req.biz_id,
        "status": "pending",
        "queue_position": position,
        "tags": req.tags,
    }, "发布任务已提交")


@app.get("/api/tasks/{task_id}", dependencies=[Depends(require_token)])
async def task_detail(task_id: str) -> JSONResponse:
    task = get_task(task_id)
    if not task:
        return fail("任务不存在", 404)
    return ok(_task_view(task))


@app.get("/api/tasks/latest", dependencies=[Depends(require_token)])
async def task_latest(platform: str = Query(...), biz_id: int = Query(...)) -> JSONResponse:
    """后端只有内容 ID 时用这个查最近一次发布结果。"""
    task = latest_task_by_biz(platform, biz_id)
    if not task:
        return ok(None, "该内容尚无发布记录")
    return ok(_task_view(task))


def _task_view(task: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "task_id": task["task_id"],
        "platform": task["platform"],
        "biz_id": task["biz_id"],
        "account": task["account"],
        "status": task["status"],
        "stage": task["stage"],
        "progress": task["progress"],
        "message": task["message"],
        "result_url": task["result_url"],
        "attempts": task["attempts"],
        "screenshot": task["screenshot"],
        "title": task["title"],
        "tags": task["tags"],
        "created_at": task["created_at"],
        "updated_at": task["updated_at"],
        "finished_at": task["finished_at"],
    }


# ------------------------------------------------------------------ 账号管理

@app.get("/api/accounts", dependencies=[Depends(require_token)])
async def accounts() -> JSONResponse:
    stored = {(a["platform"], a["account"]): a for a in list_accounts()}
    result = []
    for platform, uploader in all_uploaders().items():
        record = stored.get((platform, "default"), {})
        has_profile = hub.has_profile(platform, "default")
        result.append({
            "platform": platform,
            "label": PLATFORM_LABELS.get(platform, uploader.label),
            "account": "default",
            "logged_in": bool(record.get("logged_in")) if record else False,
            "has_profile": has_profile,
            "nickname": record.get("nickname", "") or "",
            "message": record.get("message", "") or ("尚未登录，请点击扫码登录" if not has_profile else "登录态未校验"),
            "last_check_at": record.get("last_check_at", "") or "",
            "busy": hub.is_busy(platform, "default"),
            "queue_size": worker.queue_size(platform),
            "login_url": uploader.login_url,
        })
    return ok(result)


@app.post("/api/accounts/{platform}/login", dependencies=[Depends(require_token)])
async def start_login(platform: str, account: str = Query("default")) -> JSONResponse:
    if platform not in PLATFORMS:
        return fail(f"不支持的平台：{platform}", 400)
    session = await login_manager.start(platform, account)
    return ok({
        "session_id": session.session_id,
        "platform": platform,
        "status": session.status,
        "message": session.message,
    }, "登录会话已创建，请轮询二维码")


@app.get("/api/accounts/{platform}/login/{session_id}", dependencies=[Depends(require_token)])
async def login_status(platform: str, session_id: str) -> JSONResponse:
    session = login_manager.get(session_id)
    if not session:
        return fail("登录会话不存在或已过期，请重新发起", 404)
    return ok(session.to_dict())


@app.post("/api/accounts/{platform}/login/{session_id}/cancel", dependencies=[Depends(require_token)])
async def cancel_login(platform: str, session_id: str) -> JSONResponse:
    done = await login_manager.cancel(session_id)
    return ok({"cancelled": done}, "已取消" if done else "会话不存在")


@app.post("/api/accounts/{platform}/check", dependencies=[Depends(require_token)])
async def check_account(platform: str, account: str = Query("default")) -> JSONResponse:
    if platform not in PLATFORMS:
        return fail(f"不支持的平台：{platform}", 400)
    if hub.is_busy(platform, account):
        return fail("该平台浏览器正忙（有任务或登录进行中），请稍后再试", 409)
    data = await check_login_status(platform, account)
    return ok(data, data["message"])


@app.delete("/api/accounts/{platform}", dependencies=[Depends(require_token)])
async def logout_account(platform: str, account: str = Query("default")) -> JSONResponse:
    if platform not in PLATFORMS:
        return fail(f"不支持的平台：{platform}", 400)
    await hub.clear_profile(platform, account)
    delete_account(platform, account)
    return ok(None, "已退出登录并清空本地 Cookie")


# ------------------------------------------------------------------ 截图

@app.get("/api/screenshot", dependencies=[Depends(require_token)])
async def screenshot(path: str = Query(...)) -> Any:
    target = Path(path)
    # 只允许读服务自己的截图目录，防目录穿越
    try:
        target.resolve().relative_to(settings.shots_dir.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="非法路径")
    if not target.exists():
        raise HTTPException(status_code=404, detail="截图不存在")
    return FileResponse(str(target), media_type="image/png")


# ------------------------------------------------------------------ 异常兜底

@app.exception_handler(PublishError)
async def publish_error_handler(_request: Any, exc: PublishError) -> JSONResponse:
    return fail(str(exc), 400)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
        log_config=None,
    )
