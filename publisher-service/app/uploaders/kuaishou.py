"""快手 —— cp.kuaishou.com 创作者中心自动发布。

快手没有独立标题字段，标题会并入「作品描述」的首行。
"""
from __future__ import annotations

import asyncio
from typing import Any, Dict

from playwright.async_api import Page

from ..config import settings
from ..logger import get_logger
from .base import (
    BaseUploader,
    ProgressCb,
    PublishError,
    clamp,
    fill_editor,
    find_file_input,
    first_visible,
    try_click,
    type_topics,
)

log = get_logger("uploader.kuaishou")


class KuaishouUploader(BaseUploader):
    platform = "kuaishou"
    label = "快手"
    home_url = "https://cp.kuaishou.com/article/publish/video"
    login_url = "https://cp.kuaishou.com/"
    upload_url = "https://cp.kuaishou.com/article/publish/video"

    logged_in_selectors = (
        'text=发布作品',
        'div[class*="upload-wrapper"]',
        'text=上传视频',
        'div[class*="side-bar"]',
    )
    login_page_selectors = (
        'text=扫码登录',
        'div[class*="login"] input[placeholder*="手机号"]',
        'text=手机号登录',
    )
    qrcode_selectors = (
        'div[class*="qrcode"] img',
        'div[class*="qrcode"] canvas',
        'img[class*="qrcode"]',
        'div[class*="scan"] img',
    )

    title_limit = 30
    caption_limit = 500

    FILE_INPUT = (
        'input[type="file"][accept*="video"]',
        'input[type="file"]',
    )
    # 快手把标题和文案合并在「描述」编辑器里
    CAPTION_EDITOR = (
        'div#work-description-edit',
        'div[class*="description"] div[contenteditable="true"]',
        'div[contenteditable="true"][data-placeholder]',
        'div[contenteditable="true"]',
    )
    TOPIC_SUGGESTION = (
        'div[class*="ant-select-dropdown"] div[class*="item"]:visible',
        'div[class*="topic-list"] div[class*="item"]',
        'div[class*="mention"] li',
        'div[class*="dropdown"] div[class*="option"]',
    )
    UPLOAD_DONE = (
        'text=上传成功',
        'text=重新上传',
        'div[class*="video-preview"] video',
        'div[class*="preview"] video',
    )
    UPLOAD_PROGRESS_TEXT = (
        'div[class*="progress"] span',
        'div[class*="percent"]',
    )
    PUBLISH_BUTTON = (
        'div[class*="footer"] button:has-text("发布")',
        'button:has-text("发布"):not([disabled])',
        'button[class*="submit"]:has-text("发布")',
    )
    PUBLISH_SUCCESS = (
        'text=发布成功',
        'text=作品发布成功',
        'text=已发布',
    )

    async def fetch_nickname(self, page: Page) -> str:
        for selector in ('div[class*="user-name"]', 'span[class*="nickname"]', 'div[class*="name"] span'):
            try:
                text = (await page.locator(selector).first.inner_text(timeout=2000)).strip()
                if text:
                    return text
            except Exception:  # noqa: BLE001
                continue
        return ""

    async def publish(self, page: Page, task: Dict[str, Any], progress: ProgressCb) -> Dict[str, Any]:
        video = self.check_video(task)

        await progress("opening", 5, "打开快手创作者中心")
        await page.goto(self.upload_url, wait_until="domcontentloaded",
                        timeout=settings.action_timeout * 3)
        await asyncio.sleep(3.0)

        if "login" in (page.url or "").lower() or "passport" in (page.url or "").lower():
            raise PublishError("快手登录态已失效，请到「发布账号管理」重新扫码登录")

        await try_click(page, ('button:has-text("我知道了")', 'div[class*="guide"] button',
                               'div[class*="ant-modal"] button[class*="close"]'),
                        timeout=1500, label="引导弹窗")

        await progress("uploading", 15, "开始上传视频")
        file_input = await find_file_input(page, self.FILE_INPUT, timeout=20000)
        await file_input.set_input_files(str(video))
        log.info("已投喂视频文件: %s", video)
        await asyncio.sleep(2.5)

        await progress("uploading", 25, "等待视频上传与转码")
        await self.wait_upload_done(page, self.UPLOAD_DONE, progress,
                                    progress_text_selectors=self.UPLOAD_PROGRESS_TEXT)

        # ---------------- 描述：标题在首行，文案跟在后面
        editor = await first_visible(page, self.CAPTION_EDITOR, timeout=15000, label="作品描述编辑器")

        title = clamp(task.get("title") or "", self.title_limit)
        description = (task.get("description") or "").strip()
        if title and description and not description.startswith(title):
            body = f"{title}\n{description}"
        else:
            body = description or title
        body = clamp(body, self.caption_limit)

        if body:
            await progress("filling", 62, "填写标题与文案")
            await fill_editor(page, editor, body)
            log.info("描述已填写，%d 字", len(body))

        # ---------------- 话题
        tags = task.get("tags") or []
        if tags:
            await progress("filling", 74, f"添加 {len(tags)} 个话题")
            count = await type_topics(page, editor, tags, self.TOPIC_SUGGESTION, per_tag_wait=1.4)
            log.info("已添加话题 %d 个: %s", count, tags)

        payload = task.get("payload") or {}
        if payload.get("visibility") == "private":
            await try_click(page, ('text=仅自己可见', 'label:has-text("私密")'),
                            timeout=2500, label="可见范围")

        scheduled = payload.get("scheduled_at")
        if scheduled:
            await progress("filling", 80, f"设置定时发布 {scheduled}")
            if await try_click(page, ('text=定时发布', 'label:has-text("定时发布")'),
                               timeout=3000, label="定时发布"):
                try:
                    time_input = await first_visible(
                        page, ('input[placeholder*="选择日期"]', 'div[class*="picker"] input'),
                        timeout=5000, label="定时时间输入框")
                    await time_input.click()
                    await page.keyboard.press("Control+A")
                    await time_input.type(scheduled, delay=30)
                    await page.keyboard.press("Enter")
                except PublishError:
                    log.warning("定时发布控件未找到，改为立即发布")

        await asyncio.sleep(1.2)

        await progress("publishing", 88, "提交发布")
        publish_btn = await first_visible(page, self.PUBLISH_BUTTON, timeout=15000, label="发布按钮")
        await publish_btn.click()
        await asyncio.sleep(3.0)

        await try_click(page, ('div[class*="ant-modal"] button:has-text("确定")',
                               'div[class*="modal"] button:has-text("发布")'),
                        timeout=3000, label="发布确认")

        ok = await self._wait_published(page)
        if not ok:
            raise PublishError("已点击发布但未检测到成功状态，请登录快手创作者中心确认作品是否已提交")

        await progress("done", 100, "发布成功")
        return {"platform": self.platform,
                "result_url": "https://cp.kuaishou.com/article/manage/video"}

    async def _wait_published(self, page: Page) -> bool:
        for _ in range(20):
            for selector in self.PUBLISH_SUCCESS:
                try:
                    if await page.locator(selector).first.is_visible(timeout=800):
                        return True
                except Exception:  # noqa: BLE001
                    continue
            if "manage" in (page.url or "").lower():
                return True
            await asyncio.sleep(1.5)
        return False
