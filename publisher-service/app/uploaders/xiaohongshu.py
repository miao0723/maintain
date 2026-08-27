"""小红书 —— creator.xiaohongshu.com 创作服务平台自动发布。"""
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

log = get_logger("uploader.xiaohongshu")


class XiaohongshuUploader(BaseUploader):
    platform = "xiaohongshu"
    label = "小红书"
    home_url = "https://creator.xiaohongshu.com/publish/publish?target=video"
    login_url = "https://creator.xiaohongshu.com/login"
    upload_url = "https://creator.xiaohongshu.com/publish/publish?target=video"

    logged_in_selectors = (
        'text=上传视频',
        'div[class*="upload-wrapper"]',
        'div[class*="creator-tab"]',
        'text=发布笔记',
    )
    login_page_selectors = (
        'text=手机号登录',
        'div[class*="login-box"]',
        'text=扫码登录',
    )
    qrcode_selectors = (
        'div[class*="qrcode"] img',
        'img[class*="qrcode"]',
        'div[class*="css-qr"] img',
        'div[class*="qrcode-img"]',
    )

    # 小红书标题上限 20 字，正文 1000 字
    title_limit = 20
    caption_limit = 1000

    FILE_INPUT = (
        'input[type="file"][accept*="video"]',
        'input.upload-input',
        'input[type="file"]',
    )
    TITLE_INPUT = (
        'input[placeholder*="填写标题"]',
        'input[placeholder*="标题"]',
        'div[class*="titleInput"] input',
        'input.d-text',
    )
    CAPTION_EDITOR = (
        'div.ql-editor[contenteditable="true"]',
        'div[contenteditable="true"][data-placeholder]',
        'div[class*="ql-editor"]',
        'div[contenteditable="true"]',
    )
    TOPIC_SUGGESTION = (
        '#quill-mention-list div[class*="item"]',
        'div[class*="mention-list"] div[class*="item"]',
        'div[class*="topic-container"] div[class*="item"]',
        'ul[class*="mention"] li',
    )
    UPLOAD_DONE = (
        'text=上传成功',
        'text=重新上传',
        'div[class*="preview"] video',
        'div[class*="video-preview"]',
    )
    UPLOAD_PROGRESS_TEXT = (
        'div[class*="progress"] span',
        'div[class*="percent"]',
    )
    PUBLISH_BUTTON = (
        'div[class*="submit"] button:has-text("发布")',
        'button:has-text("发布"):not([disabled])',
        'button.publishBtn',
        'button[class*="publish"]',
    )
    PUBLISH_SUCCESS = (
        'text=发布成功',
        'text=笔记发布成功',
        'text=发布完成',
    )

    async def fetch_nickname(self, page: Page) -> str:
        for selector in ('div[class*="name"]', 'span[class*="nickname"]', 'div[class*="user-info"] span'):
            try:
                text = (await page.locator(selector).first.inner_text(timeout=2000)).strip()
                if text:
                    return text
            except Exception:  # noqa: BLE001
                continue
        return ""

    async def publish(self, page: Page, task: Dict[str, Any], progress: ProgressCb) -> Dict[str, Any]:
        video = self.check_video(task)

        await progress("opening", 5, "打开小红书创作服务平台")
        await page.goto(self.upload_url, wait_until="domcontentloaded",
                        timeout=settings.action_timeout * 3)
        await asyncio.sleep(3.0)

        if "login" in (page.url or "").lower():
            raise PublishError("小红书登录态已失效，请到「发布账号管理」重新扫码登录")

        # 确保停在「上传视频」这个 tab 上
        await try_click(page, ('div[class*="creator-tab"]:has-text("上传视频")',
                               'text=上传视频',
                               'div[class*="tab"]:has-text("上传视频")'),
                        timeout=3000, label="上传视频 Tab")
        await asyncio.sleep(1.0)

        await progress("uploading", 15, "开始上传视频")
        file_input = await find_file_input(page, self.FILE_INPUT, timeout=20000)
        await file_input.set_input_files(str(video))
        log.info("已投喂视频文件: %s", video)
        await asyncio.sleep(2.0)

        await progress("uploading", 25, "等待视频上传与转码")
        await self.wait_upload_done(page, self.UPLOAD_DONE, progress,
                                    progress_text_selectors=self.UPLOAD_PROGRESS_TEXT)

        # ---------------- 标题（小红书只有 20 字）
        title = clamp(task.get("title") or "", self.title_limit)
        if title:
            await progress("filling", 60, "填写标题")
            title_input = await first_visible(page, self.TITLE_INPUT, timeout=15000, label="标题输入框")
            await title_input.click()
            await page.keyboard.press("Control+A")
            await page.keyboard.press("Delete")
            await title_input.type(title, delay=30)
            log.info("标题已填写: %s", title)

        # ---------------- 正文
        editor = await first_visible(page, self.CAPTION_EDITOR, timeout=15000, label="正文编辑器")
        description = (task.get("description") or "").strip()
        if description:
            await progress("filling", 68, "填写文案")
            await fill_editor(page, editor, clamp(description, self.caption_limit))
            log.info("文案已填写，%d 字", len(description))

        # ---------------- 话题
        tags = task.get("tags") or []
        if tags:
            await progress("filling", 76, f"添加 {len(tags)} 个话题")
            count = await type_topics(page, editor, tags, self.TOPIC_SUGGESTION, per_tag_wait=1.5)
            log.info("已添加话题 %d 个: %s", count, tags)

        payload = task.get("payload") or {}
        scheduled = payload.get("scheduled_at")
        if scheduled:
            await progress("filling", 80, f"设置定时发布 {scheduled}")
            if await try_click(page, ('text=定时发布', 'label:has-text("定时发布")'),
                               timeout=3000, label="定时发布"):
                try:
                    time_input = await first_visible(
                        page, ('input[placeholder*="请选择"]', 'div[class*="date"] input'),
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

        await try_click(page, ('div[class*="modal"] button:has-text("确定")',
                               'div[class*="dialog"] button:has-text("发布")'),
                        timeout=3000, label="发布确认")

        ok = await self._wait_published(page)
        if not ok:
            raise PublishError("已点击发布但未检测到成功状态，请登录小红书创作平台确认笔记是否已提交")

        await progress("done", 100, "发布成功")
        return {"platform": self.platform,
                "result_url": "https://creator.xiaohongshu.com/publish/success"}

    async def _wait_published(self, page: Page) -> bool:
        for _ in range(20):
            for selector in self.PUBLISH_SUCCESS:
                try:
                    if await page.locator(selector).first.is_visible(timeout=800):
                        return True
                except Exception:  # noqa: BLE001
                    continue
            url = (page.url or "").lower()
            if "success" in url or "/publish/note" in url or "notemanager" in url:
                return True
            await asyncio.sleep(1.5)
        return False
