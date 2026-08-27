"""B站 —— member.bilibili.com 创作中心自动投稿。

和另外三家不同：B站的标签是**独立输入框**（输入后按回车成为标签），
不是在正文里打 # 触发联想，所以这里单独实现 _fill_tags。
另外 B站上传后会把文件名自动塞进标题，必须先清空再填。
"""
from __future__ import annotations

import asyncio
from typing import Any, Dict, Sequence

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
)

log = get_logger("uploader.bilibili")


class BilibiliUploader(BaseUploader):
    platform = "bilibili"
    label = "B站"
    home_url = "https://member.bilibili.com/platform/upload/video/frame"
    login_url = "https://passport.bilibili.com/login"
    upload_url = "https://member.bilibili.com/platform/upload/video/frame"

    logged_in_selectors = (
        'text=上传视频',
        'div[class*="upload-btn"]',
        'div[class*="nav-user"]',
        'text=投稿',
    )
    login_page_selectors = (
        'div[class*="login-scan"]',
        'text=密码登录',
        'input[placeholder*="请输入账号"]',
    )
    qrcode_selectors = (
        'div[class*="login-scan"] img',
        'div[class*="qrcode"] img',
        'img[class*="qrcode"]',
        'div[class*="login-scan-wrp"]',
    )

    # B站标题上限 80 字，简介 2000 字，标签最多 10 个
    title_limit = 80
    caption_limit = 2000
    max_tags = 10

    FILE_INPUT = (
        'input[type="file"][accept*="video"]',
        'input[name="buploader"]',
        'input[type="file"]',
    )
    TITLE_INPUT = (
        'input[placeholder*="请输入稿件标题"]',
        'div[class*="video-title"] input',
        'input[maxlength="80"]',
    )
    CAPTION_EDITOR = (
        'div[class*="video-desc"] div[contenteditable="true"]',
        'div.ql-editor[contenteditable="true"]',
        'div[contenteditable="true"][data-placeholder]',
        'div[contenteditable="true"]',
    )
    TAG_INPUT = (
        'input[placeholder*="按回车键Enter创建标签"]',
        'div[class*="tag-container"] input',
        'input[placeholder*="创建标签"]',
        'div[class*="video-tag"] input',
    )
    UPLOAD_DONE = (
        'text=上传完成',
        'text=Upload complete',
        'div[class*="upload-success"]',
        'text=重新上传',
    )
    UPLOAD_PROGRESS_TEXT = (
        'div[class*="upload-progress"] span',
        'div[class*="progress-text"]',
        'div[class*="percent"]',
    )
    PUBLISH_BUTTON = (
        'span:has-text("立即投稿")',
        'button:has-text("立即投稿")',
        'div[class*="submit-add"]:has-text("立即投稿")',
        'button:has-text("投稿"):not([disabled])',
    )
    PUBLISH_SUCCESS = (
        'text=稿件投递成功',
        'text=投稿成功',
        'text=已提交审核',
    )

    async def fetch_nickname(self, page: Page) -> str:
        for selector in ('div[class*="nav-user"] span[class*="name"]',
                         'span[class*="nickname"]', 'div[class*="user-name"]'):
            try:
                text = (await page.locator(selector).first.inner_text(timeout=2000)).strip()
                if text:
                    return text
            except Exception:  # noqa: BLE001
                continue
        return ""

    async def publish(self, page: Page, task: Dict[str, Any], progress: ProgressCb) -> Dict[str, Any]:
        video = self.check_video(task)

        await progress("opening", 5, "打开B站创作中心")
        await page.goto(self.upload_url, wait_until="domcontentloaded",
                        timeout=settings.action_timeout * 3)
        await asyncio.sleep(3.0)

        url = (page.url or "").lower()
        if "passport" in url or "login" in url:
            raise PublishError("B站登录态已失效，请到「发布账号管理」重新扫码登录")

        await try_click(page, ('button:has-text("我知道了")', 'div[class*="guide"] button',
                               'div[class*="dialog"] button[class*="close"]'),
                        timeout=1500, label="引导弹窗")

        await progress("uploading", 15, "开始上传视频")
        file_input = await find_file_input(page, self.FILE_INPUT, timeout=20000)
        await file_input.set_input_files(str(video))
        log.info("已投喂视频文件: %s", video)
        await asyncio.sleep(3.0)

        await progress("uploading", 25, "等待视频上传")
        await self.wait_upload_done(page, self.UPLOAD_DONE, progress,
                                   progress_text_selectors=self.UPLOAD_PROGRESS_TEXT)

        # ---------------- 标题（务必先清空 B站自动填的文件名）
        title = clamp(task.get("title") or "", self.title_limit)
        if title:
            await progress("filling", 58, "填写标题")
            title_input = await first_visible(page, self.TITLE_INPUT, timeout=15000, label="标题输入框")
            await title_input.click()
            await page.keyboard.press("Control+A")
            await page.keyboard.press("Delete")
            await asyncio.sleep(0.3)
            await title_input.type(title, delay=25)
            log.info("标题已填写: %s", title)

        # ---------------- 简介
        description = (task.get("description") or "").strip()
        if description:
            await progress("filling", 66, "填写简介")
            try:
                editor = await first_visible(page, self.CAPTION_EDITOR, timeout=10000, label="简介编辑器")
                await fill_editor(page, editor, clamp(description, self.caption_limit))
                log.info("简介已填写，%d 字", len(description))
            except PublishError as exc:
                log.warning("简介编辑器未找到，跳过：%s", exc)

        # ---------------- 标签（独立输入框 + 回车）
        tags: Sequence[str] = (task.get("tags") or [])[: self.max_tags]
        if tags:
            await progress("filling", 74, f"添加 {len(tags)} 个标签")
            await self._fill_tags(page, tags)

        # ---------------- 分区（B站必填，默认「生活 → 生活记录」，可用 extra.partition 覆盖）
        payload = task.get("payload") or {}
        partition = (payload.get("extra") or {}).get("partition")
        if partition:
            await progress("filling", 80, f"选择分区 {partition}")
            await self._select_partition(page, str(partition))

        scheduled = payload.get("scheduled_at")
        if scheduled:
            await progress("filling", 82, f"设置定时发布 {scheduled}")
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

        await progress("publishing", 88, "提交投稿")
        publish_btn = await first_visible(page, self.PUBLISH_BUTTON, timeout=15000, label="投稿按钮")
        await publish_btn.click()
        await asyncio.sleep(3.0)

        await try_click(page, ('div[class*="dialog"] button:has-text("确定")',
                               'div[class*="modal"] button:has-text("继续")'),
                        timeout=3000, label="投稿确认")

        ok = await self._wait_published(page)
        if not ok:
            raise PublishError("已点击投稿但未检测到成功状态，请登录B站创作中心确认稿件是否已提交")

        await progress("done", 100, "投稿成功")
        return {"platform": self.platform,
                "result_url": "https://member.bilibili.com/platform/upload-manager/article"}

    async def _fill_tags(self, page: Page, tags: Sequence[str]) -> None:
        try:
            tag_input = await first_visible(page, self.TAG_INPUT, timeout=10000, label="标签输入框")
        except PublishError as exc:
            log.warning("标签输入框未找到，跳过标签：%s", exc)
            return

        # B站会预置推荐标签，先清掉以免占满 10 个额度
        for _ in range(10):
            removed = await try_click(page, ('div[class*="tag-item"] i[class*="close"]',
                                             'div[class*="tag"] span[class*="close"]'),
                                      timeout=600, label="移除预置标签")
            if not removed:
                break

        for tag in tags:
            tag = str(tag).strip().lstrip("#").strip()
            if not tag:
                continue
            await tag_input.click()
            await tag_input.type(tag, delay=45)
            await asyncio.sleep(0.4)
            await page.keyboard.press("Enter")
            await asyncio.sleep(0.5)
            log.info("已添加标签: %s", tag)

    async def _select_partition(self, page: Page, partition: str) -> None:
        """分区形如「生活>生活记录」，用 > 分隔父子级。"""
        parts = [p.strip() for p in partition.replace("／", ">").split(">") if p.strip()]
        if not parts:
            return
        if not await try_click(page, ('div[class*="select-container"]', 'div[class*="type-list"]',
                                      'div[class*="partition"]'),
                               timeout=4000, label="分区选择器"):
            log.warning("分区选择器未找到，使用平台默认分区")
            return
        for part in parts:
            clicked = await try_click(page, (f'div[class*="item"]:has-text("{part}")',
                                             f'li:has-text("{part}")',
                                             f'text={part}'),
                                      timeout=4000, label=f"分区[{part}]")
            if not clicked:
                log.warning("分区「%s」未找到，停止逐级选择", part)
                break
            await asyncio.sleep(0.6)

    async def _wait_published(self, page: Page) -> bool:
        for _ in range(20):
            for selector in self.PUBLISH_SUCCESS:
                try:
                    if await page.locator(selector).first.is_visible(timeout=800):
                        return True
                except Exception:  # noqa: BLE001
                    continue
            if "upload-manager" in (page.url or "").lower():
                return True
            await asyncio.sleep(1.5)
        return False
