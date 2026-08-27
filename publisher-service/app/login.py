"""扫码登录管理。

流程：
1. 管理后台点「登录」→ POST /api/accounts/{platform}/login，服务端开一个登录会话，
   在宿主机拉起浏览器打开平台登录页。
2. 后台每秒轮询 GET /api/accounts/{platform}/login/{session_id}，
   拿到二维码截图的 base64 直接显示在网页上，运营用手机 App 扫。
3. 服务端持续检测登录是否完成，成功后 Cookie 自动沉淀在浏览器 user_data_dir，
   后续发布任务无需再登录。

二维码找不到时会退化成整页截图 —— 这样验证码、滑块、异常提示也能在后台看到。
"""
from __future__ import annotations

import asyncio
import base64
import contextlib
import time
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from playwright.async_api import Page

from .browser import hub
from .config import settings
from .logger import get_logger
from .store import upsert_account
from .uploaders import get_uploader

log = get_logger("login")

# 会话状态：pending → waiting_scan → success / failed / expired
SESSION_TTL = 60 * 10


class LoginSession:
    def __init__(self, platform: str, account: str) -> None:
        self.session_id = uuid.uuid4().hex
        self.platform = platform
        self.account = account
        self.status = "pending"
        self.message = "正在启动浏览器…"
        self.qrcode = ""
        self.nickname = ""
        self.created_at = time.time()
        self.task: Optional[asyncio.Task] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "platform": self.platform,
            "status": self.status,
            "message": self.message,
            "qrcode": self.qrcode,
            "nickname": self.nickname,
        }


class LoginManager:
    def __init__(self) -> None:
        self._sessions: Dict[str, LoginSession] = {}

    def get(self, session_id: str) -> Optional[LoginSession]:
        self._gc()
        return self._sessions.get(session_id)

    def find_active(self, platform: str, account: str) -> Optional[LoginSession]:
        self._gc()
        for session in self._sessions.values():
            if (session.platform == platform and session.account == account
                    and session.status in ("pending", "waiting_scan", "scanned")):
                return session
        return None

    def _gc(self) -> None:
        now = time.time()
        for sid in [s for s, v in self._sessions.items() if now - v.created_at > SESSION_TTL]:
            self._sessions.pop(sid, None)

    async def start(self, platform: str, account: str = "default") -> LoginSession:
        existing = self.find_active(platform, account)
        if existing:
            return existing

        session = LoginSession(platform, account)
        self._sessions[session.session_id] = session
        session.task = asyncio.create_task(self._run(session))
        log.info("已创建 %s/%s 的登录会话 %s", platform, account, session.session_id)
        return session

    async def cancel(self, session_id: str) -> bool:
        session = self._sessions.get(session_id)
        if not session or not session.task:
            return False
        session.task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await session.task
        session.status = "failed"
        session.message = "已取消登录"
        return True

    # ------------------------------------------------------------ 核心流程

    async def _run(self, session: LoginSession) -> None:
        uploader = get_uploader(session.platform)
        deadline = time.time() + settings.login_timeout

        try:
            async with hub.session(session.platform, session.account) as (_ctx, page):
                # 先看是不是本来就登录着，省一次扫码
                session.message = "检查现有登录态…"
                if await uploader.is_logged_in(page):
                    session.nickname = await uploader.fetch_nickname(page)
                    session.status = "success"
                    session.message = "该账号已处于登录状态"
                    upsert_account(session.platform, session.account, logged_in=True,
                                   nickname=session.nickname, message="已登录")
                    log.info("%s 已登录，无需扫码", session.platform)
                    return

                session.status = "waiting_scan"
                session.message = "请用手机 App 扫描二维码"
                await uploader.goto_login(page)

                while time.time() < deadline:
                    # 抓二维码
                    await self._grab_qrcode(session, page, uploader)

                    # 检测是否登录成功
                    if await self._logged_in_now(page, uploader):
                        session.status = "success"
                        session.qrcode = ""
                        session.nickname = await uploader.fetch_nickname(page)
                        session.message = f"登录成功{('：' + session.nickname) if session.nickname else ''}"
                        upsert_account(session.platform, session.account, logged_in=True,
                                       nickname=session.nickname, message="扫码登录成功")
                        log.info("%s 扫码登录成功 %s", session.platform, session.nickname)
                        # 多停 2 秒，确保 Cookie 落盘
                        await asyncio.sleep(2.5)
                        return

                    await asyncio.sleep(2.0)

                session.status = "expired"
                session.message = "二维码超时未扫描，请重新发起登录"
                upsert_account(session.platform, session.account, logged_in=False,
                               message="扫码超时")

        except asyncio.CancelledError:
            session.status = "failed"
            session.message = "登录已取消"
            raise
        except Exception as exc:  # noqa: BLE001
            session.status = "failed"
            session.message = f"登录异常：{exc}"
            log.exception("%s 登录流程异常", session.platform)
            upsert_account(session.platform, session.account, logged_in=False,
                           message=f"登录异常：{exc}")

    async def _grab_qrcode(self, session: LoginSession, page: Page, uploader: Any) -> None:
        """优先截二维码元素，失败则截整页（能顺带看到验证码/风控提示）。"""
        try:
            locator = await uploader.locate_qrcode(page)
            if locator is not None:
                png = await locator.screenshot(timeout=6000)
            else:
                png = await page.screenshot(timeout=8000, full_page=False)
                session.message = "未识别到二维码区域，已回传整页截图，请在图中扫码"
            session.qrcode = "data:image/png;base64," + base64.b64encode(png).decode()
        except Exception as exc:  # noqa: BLE001
            log.debug("抓取二维码失败: %s", exc)

    @staticmethod
    async def _logged_in_now(page: Page, uploader: Any) -> bool:
        """轻量判定：不跳转页面，只看当前 URL 和标志元素。"""
        url = (page.url or "").lower()
        if "login" not in url and "passport" not in url:
            for selector in uploader.logged_in_selectors:
                with contextlib.suppress(Exception):
                    if await page.locator(selector).first.is_visible(timeout=800):
                        return True
        for selector in ("text=登录成功", "text=扫码成功"):
            with contextlib.suppress(Exception):
                if await page.locator(selector).first.is_visible(timeout=500):
                    return True
        return False


async def check_login_status(platform: str, account: str = "default") -> Dict[str, Any]:
    """主动校验某平台登录态，结果写库。"""
    uploader = get_uploader(platform)
    try:
        async with hub.session(platform, account) as (_ctx, page):
            logged_in = await uploader.is_logged_in(page)
            nickname = await uploader.fetch_nickname(page) if logged_in else ""
        message = "登录有效" if logged_in else "未登录或登录已失效，请重新扫码"
        upsert_account(platform, account, logged_in=logged_in, nickname=nickname, message=message)
        return {
            "platform": platform, "account": account, "logged_in": logged_in,
            "nickname": nickname, "message": message,
            "last_check_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
    except Exception as exc:  # noqa: BLE001
        message = f"检测失败：{exc}"
        upsert_account(platform, account, logged_in=False, message=message)
        return {"platform": platform, "account": account, "logged_in": False,
                "nickname": "", "message": message,
                "last_check_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}


login_manager = LoginManager()
