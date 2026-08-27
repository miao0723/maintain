"""抖音 —— creator.douyin.com 创作者平台自动发布。"""
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

log = get_logger("uploader.douyin")


class DouyinUploader(BaseUploader):
    platform = "douyin"
    label = "抖音"
    home_url = "https://creator.douyin.com/creator-micro/content/upload"
    login_url = "https://creator.douyin.com/"
    upload_url = "https://creator.douyin.com/creator-micro/content/upload"

    logged_in_selectors = (
        'div[class*="upload-btn"]',
        'text=发布视频',
        'div[class*="container-drag"]',
        'div[class*="semi-navigation"]',
    )
    login_page_selectors = (
        'div[class*="login-scan-code"]',
        'text=扫码登录',
        'div[class*="account-center"] >> text=登录',
    )
    qrcode_selectors = (
        'div[class*="qrcode"] canvas',
        'div[class*="qrcode"] img',
        'canvas[class*="qrcode"]',
        'img[class*="qrcode"]',
        'div[class*="login-scan-code"]',
    )

    title_limit = 30
    caption_limit = 1000

    FILE_INPUT = (
        'input[type="file"][accept*="video"]',
        'input[type="file"]',
    )
    TITLE_INPUT = (
        'input[placeholder*="填写作品标题"]',
        'input[placeholder*="作品标题"]',
        'div[class*="title"] input.semi-input',
        'input.semi-input[maxlength="30"]',
    )
    CAPTION_EDITOR = (
        'div[data-placeholder*="作品简介"]',
        'div.zone-container[contenteditable="true"]',
        'div[contenteditable="true"][data-line-wrapper]',
        'div.editor-kit-container div[contenteditable="true"]',
        'div[contenteditable="true"]',
    )
    TOPIC_SUGGESTION = (
        'div[class*="mention-list"] div[class*="item"]',
        'div[class*="semi-popover"] div[class*="item"]:visible',
        'div[class*="topic"] li',
    )
    UPLOAD_DONE = (
        'text=重新上传',
        'div[class*="video-preview"]',
        'text=上传成功',
        'div[class*="preview-video"] video',
    )
    UPLOAD_PROGRESS_TEXT = (
        'div[class*="progress-text"]',
        'div[class*="percent"]',
        'text=/上传中.*%/',
    )
    PUBLISH_BUTTON = (
        'button[class*="button-primary"]:has-text("发布")',
        'button:has-text("发布"):not([disabled])',
        'div[class*="content-confirm"] button:has-text("发布")',
    )
    PUBLISH_SUCCESS = (
        'text=发布成功',
        'text=作品发布成功',
        'div[class*="success"]',
    )

    async def fetch_nickname(self, page: Page) -> str:
        for selector in ('div[class*="name"] span', 'div[class*="user-name"]', 'span[class*="nickname"]'):
            try:
                text = (await page.locator(selector).first.inner_text(timeout=2000)).strip()
                if text:
                    return text
            except Exception:  # noqa: BLE001
                continue
        return ""

    async def publish(self, page: Page, task: Dict[str, Any], progress: ProgressCb) -> Dict[str, Any]:
        video = self.check_video(task)

        await progress("opening", 5, "打开抖音创作者平台")
        await page.goto(self.upload_url, wait_until="domcontentloaded",
                        timeout=settings.action_timeout * 3)
        await asyncio.sleep(2.5)

        if "login" in (page.url or "").lower():
            raise PublishError("抖音登录态已失效，请到「发布账号管理」重新扫码登录")

        # 偶发的引导浮层，挡住上传区域
        await try_click(page, ('button:has-text("我知道了")', 'div[class*="guide"] button',
                               'div[class*="mask"] button:has-text("跳过")'),
                        timeout=1500, label="引导弹窗")

        await progress("uploading", 15, "开始上传视频")
        file_input = await find_file_input(page, self.FILE_INPUT, timeout=20000)
        await file_input.set_input_files(str(video))
        log.info("已投喂视频文件: %s", video)

        # 上传后会跳到发布编辑页
        try:
            await page.wait_for_url("**/content/post/video**", timeout=60000)
        except Exception:  # noqa: BLE001
            log.info("未检测到 URL 跳转，继续按当前页面处理")
        await asyncio.sleep(2.0)

        await progress("uploading", 25, "等待视频上传与转码")
        await self.wait_upload_done(page, self.UPLOAD_DONE, progress,
                                    progress_text_selectors=self.UPLOAD_PROGRESS_TEXT)

        # ---------------- 标题
        title = clamp(task.get("title") or "", self.title_limit)
        if title:
            await progress("filling", 60, "填写标题")
            title_input = await first_visible(page, self.TITLE_INPUT, timeout=15000, label="标题输入框")
            await title_input.click()
            await page.keyboard.press("Control+A")
            await page.keyboard.press("Delete")
            await title_input.type(title, delay=25)
            log.info("标题已填写: %s", title)

        # ---------------- 正文文案
        editor = await first_visible(page, self.CAPTION_EDITOR, timeout=15000, label="作品简介编辑器")
        description = (task.get("description") or "").strip()
        if description:
            await progress("filling", 68, "填写文案")
            await fill_editor(page, editor, clamp(description, self.caption_limit))
            log.info("文案已填写，%d 字", len(description))

        # ---------------- 话题标签
        tags = task.get("tags") or []
        if tags:
            await progress("filling", 75, f"添加 {len(tags)} 个话题")
            count = await type_topics(page, editor, tags, self.TOPIC_SUGGESTION)
            log.info("已添加话题 %d 个: %s", count, tags)

        # ---------------- 可选设置
        payload = task.get("payload") or {}
        if payload.get("visibility") == "private":
            await try_click(page, ('text=仅自己可见', 'label:has-text("仅自己可见")'),
                            timeout=2500, label="可见范围")
        if payload.get("allow_download") is False:
            await try_click(page, ('text=不允许下载', 'label:has-text("不允许")'),
                            timeout=2500, label="下载权限")

        scheduled = payload.get("scheduled_at")
        if scheduled:
            await progress("filling", 80, f"设置定时发布 {scheduled}")
            if await try_click(page, ('text=定时发布', 'label:has-text("定时发布")'),
                               timeout=3000, label="定时发布"):
                try:
                    time_input = await first_visible(
                        page, ('input[placeholder*="日期"]', 'div[class*="date-picker"] input'),
                        timeout=5000, label="定时时间输入框")
                    await time_input.click()
                    await page.keyboard.press("Control+A")
                    await time_input.type(scheduled, delay=30)
                    await page.keyboard.press("Enter")
                except PublishError:
                    log.warning("定时发布控件未找到，改为立即发布")

        await asyncio.sleep(1.0)

        # ---------------- 点发布
        await progress("publishing", 88, "提交发布")
        publish_btn = await first_visible(page, self.PUBLISH_BUTTON, timeout=15000, label="发布按钮")
        await publish_btn.click()
        await asyncio.sleep(3.0)

        # 二次确认弹窗
        await try_click(page, ('div[class*="modal"] button:has-text("确定")',
                               'div[class*="modal"] button:has-text("发布")'),
                        timeout=3000, label="发布确认")

        ok = await self._wait_published(page)
        if not ok:
            raise PublishError("已点击发布但未检测到成功状态，请登录抖音创作者平台确认作品是否已提交")

        await progress("done", 100, "发布成功")
        return {"platform": self.platform, "result_url": "https://creator.douyin.com/creator-micro/content/manage"}

    async def _wait_published(self, page: Page) -> bool:
        """成功判定：出现成功提示，或被跳转到作品管理页。"""
        for _ in range(20):
            for selector in self.PUBLISH_SUCCESS:
                try:
                    if await page.locator(selector).first.is_visible(timeout=800):
                        return True
                except Exception:  # noqa: BLE001
                    continue
            url = (page.url or "").lower()
            if "content/manage" in url or "content/post/success" in url:
                return True
            await asyncio.sleep(1.5)
        return False
