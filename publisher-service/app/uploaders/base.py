"""上传器基类 + 页面操作工具。

平台前端改版很勤，硬编码单一选择器必然会碎。所以这里所有关键元素都走
「候选选择器列表 + 逐个尝试 + 明确报错」的方式，改版时只需在对应平台文件
的选择器列表里补一条，不用改流程代码。
"""
from __future__ import annotations

import asyncio
import re
from pathlib import Path
from typing import Any, Awaitable, Callable, Dict, List, Optional, Sequence

from playwright.async_api import ElementHandle, Locator, Page, TimeoutError as PWTimeout

from ..config import settings
from ..logger import get_logger

log = get_logger("uploader")

ProgressCb = Callable[[str, int, str], Awaitable[None]]


class PublishError(RuntimeError):
    """发布流程中的可预期错误，消息会直接回传给管理后台。"""


class NotLoggedInError(PublishError):
    """登录态失效，需要重新扫码。"""


# ------------------------------------------------------------------ 页面工具

async def first_visible(page: Page, selectors: Sequence[str], timeout: int = 8000,
                        label: str = "元素") -> Locator:
    """按顺序尝试候选选择器，返回第一个可见的。"""
    last_error: Optional[Exception] = None
    per_try = max(1200, int(timeout / max(1, len(selectors))))
    for selector in selectors:
        try:
            locator = page.locator(selector).first
            await locator.wait_for(state="visible", timeout=per_try)
            return locator
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            continue
    raise PublishError(
        f"页面上找不到{label}，平台可能已改版。已尝试的选择器：{selectors}"
    ) from last_error


async def try_click(page: Page, selectors: Sequence[str], timeout: int = 5000,
                    label: str = "按钮") -> bool:
    """尽力点击，找不到就返回 False（用于可选步骤，比如关闭弹窗）。"""
    for selector in selectors:
        try:
            locator = page.locator(selector).first
            await locator.wait_for(state="visible", timeout=timeout)
            await locator.click()
            log.info("已点击%s: %s", label, selector)
            return True
        except Exception:  # noqa: BLE001
            continue
    return False


async def find_file_input(page: Page, selectors: Sequence[str], timeout: int = 15000) -> ElementHandle:
    """拿到 <input type=file>。注意它常常是 hidden 的，不能用 visible 等待。"""
    deadline = asyncio.get_event_loop().time() + timeout / 1000
    while asyncio.get_event_loop().time() < deadline:
        for selector in selectors:
            handle = await page.query_selector(selector)
            if handle:
                return handle
        await asyncio.sleep(0.4)
    raise PublishError(f"找不到文件上传输入框，已尝试：{selectors}")


async def fill_editor(page: Page, locator: Locator, text: str) -> None:
    """往富文本/contenteditable 里写内容。

    这些编辑器基本都监听 input 事件做受控渲染，直接 innerHTML 赋值不会触发框架
    更新，所以必须走键盘输入。
    """
    await locator.click()
    await asyncio.sleep(0.3)
    # 清空已有内容（比如 B站会自动把文件名填成标题）
    await page.keyboard.press("Control+A")
    await page.keyboard.press("Delete")
    await asyncio.sleep(0.2)
    if text:
        await locator.type(text, delay=18)
    await asyncio.sleep(0.3)


async def type_topics(page: Page, locator: Locator, tags: Sequence[str],
                      suggestion_selectors: Sequence[str], *,
                      commit_key: str = "Enter", per_tag_wait: float = 1.2) -> int:
    """在正文编辑器里逐个输入 #话题 并从联想列表中选中。

    只是打字打出 "#维修" 而不选中联想项，平台不会把它识别成真正的话题，
    所以这里必须等下拉出现再确认。下拉没出现时退化为直接敲空格提交纯文本
    标签（大部分平台仍会识别），并记录告警。
    """
    committed = 0
    for tag in tags:
        tag = tag.strip().lstrip("#").strip()
        if not tag:
            continue
        await locator.click()
        await page.keyboard.press("End")
        await page.keyboard.type(" ", delay=40)
        await page.keyboard.type(f"#{tag}", delay=70)
        await asyncio.sleep(per_tag_wait)

        picked = False
        for selector in suggestion_selectors:
            try:
                option = page.locator(selector).first
                await option.wait_for(state="visible", timeout=2500)
                await option.click()
                picked = True
                break
            except Exception:  # noqa: BLE001
                continue

        if not picked:
            # 联想没出来，用回车/空格收尾，让平台自己解析
            await page.keyboard.press(commit_key)
            log.warning("话题「%s」未匹配到联想项，已退化为文本标签", tag)
        committed += 1
        await asyncio.sleep(0.4)
    return committed


def clamp(text: str, limit: int) -> str:
    """按平台上限截断，避免超长导致按钮置灰。"""
    text = (text or "").strip()
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def build_caption(description: str, tags: Sequence[str], limit: int) -> str:
    """把文案和话题拼成一段正文（用于不支持联想选择的兜底场景）。"""
    tail = " ".join(f"#{t}" for t in tags if t)
    body = (description or "").strip()
    if not tail:
        return clamp(body, limit)
    room = limit - len(tail) - 1
    if room <= 0:
        return clamp(tail, limit)
    return f"{clamp(body, room)} {tail}".strip()


# ------------------------------------------------------------------ 基类

class BaseUploader:
    """所有平台上传器的统一接口。"""

    platform: str = ""
    label: str = ""
    home_url: str = ""
    login_url: str = ""
    upload_url: str = ""

    # 判定已登录 / 未登录的标志元素
    logged_in_selectors: Sequence[str] = ()
    login_page_selectors: Sequence[str] = ()
    qrcode_selectors: Sequence[str] = ()

    title_limit: int = 30
    caption_limit: int = 1000

    # ---------------------------------------------------------- 登录相关

    async def goto_login(self, page: Page) -> None:
        await page.goto(self.login_url, wait_until="domcontentloaded",
                        timeout=settings.action_timeout * 2)
        await asyncio.sleep(1.5)

    async def is_logged_in(self, page: Page) -> bool:
        """打开创作首页，看是否被踢到登录页。"""
        await page.goto(self.home_url, wait_until="domcontentloaded",
                        timeout=settings.action_timeout * 2)
        await asyncio.sleep(2.0)

        for selector in self.login_page_selectors:
            try:
                if await page.locator(selector).first.is_visible(timeout=1500):
                    return False
            except Exception:  # noqa: BLE001
                continue

        for selector in self.logged_in_selectors:
            try:
                if await page.locator(selector).first.is_visible(timeout=2500):
                    return True
            except Exception:  # noqa: BLE001
                continue
        # 兜底：URL 里带 login 就是没登录
        return "login" not in (page.url or "").lower()

    async def fetch_nickname(self, page: Page) -> str:
        return ""

    async def locate_qrcode(self, page: Page) -> Optional[Locator]:
        for selector in self.qrcode_selectors:
            try:
                locator = page.locator(selector).first
                await locator.wait_for(state="visible", timeout=4000)
                return locator
            except Exception:  # noqa: BLE001
                continue
        return None

    # ---------------------------------------------------------- 发布相关

    async def publish(self, page: Page, task: Dict[str, Any], progress: ProgressCb) -> Dict[str, Any]:
        raise NotImplementedError

    # ---------------------------------------------------------- 公共小工具

    @staticmethod
    def check_video(task: Dict[str, Any]) -> Path:
        path = Path(task.get("video_path") or "")
        if not path.exists():
            raise PublishError(f"视频文件不存在：{path}")
        if path.stat().st_size == 0:
            raise PublishError(f"视频文件为空：{path}")
        return path

    async def wait_upload_done(self, page: Page, done_selectors: Sequence[str],
                              progress: ProgressCb, *,
                              progress_text_selectors: Sequence[str] = ()) -> None:
        """轮询等待视频转码/上传完成。"""
        timeout = settings.upload_timeout
        step = 3
        waited = 0
        last_report = ""
        while waited < timeout:
            for selector in done_selectors:
                try:
                    if await page.locator(selector).first.is_visible(timeout=1200):
                        await progress("uploading", 55, "视频上传完成")
                        return
                except Exception:  # noqa: BLE001
                    continue

            # 读一下平台自己的进度文字，回显给管理后台
            for selector in progress_text_selectors:
                try:
                    text = (await page.locator(selector).first.inner_text(timeout=1000)).strip()
                    if text and text != last_report:
                        last_report = text
                        pct = 20
                        match = re.search(r"(\d{1,3})\s*%", text)
                        if match:
                            pct = 20 + int(int(match.group(1)) * 0.3)
                        await progress("uploading", min(pct, 54), f"上传中：{text}")
                    break
                except Exception:  # noqa: BLE001
                    continue

            await asyncio.sleep(step)
            waited += step

        raise PublishError(f"视频上传超时（{timeout}s），请检查网络或视频大小")
