"""Playwright 浏览器管理。

关键设计：
1. 用 ``launch_persistent_context`` + 每个「平台/账号」独立的 user_data_dir。
   Cookie、localStorage、指纹都天然沉淀在目录里，扫码登录一次可长期复用，
   不需要手工导出 Cookie。
2. 同一个 user_data_dir 不允许两个进程同时打开，所以按 key 加 asyncio 锁，
   发布任务和扫码登录会互相排队而不是把浏览器搞崩。
3. 默认有头 + 复用本机 Chrome 通道，配合反检测脚本，抖音/小红书的风控
   命中率远低于 headless Chromium。
4. 上下文用完不立刻关，缓存住给下次复用；空闲超时由后台协程回收。
"""
from __future__ import annotations

import asyncio
import contextlib
import time
from pathlib import Path
from typing import AsyncIterator, Dict, Optional, Tuple

from playwright.async_api import BrowserContext, Page, Playwright, async_playwright

from .config import settings
from .logger import get_logger

log = get_logger("browser")

# 反自动化检测：抹掉 webdriver 痕迹，补齐 headless 缺失的浏览器特征
STEALTH_JS = """
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en'] });
Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
if (!window.chrome) { window.chrome = {}; }
if (!window.chrome.runtime) { window.chrome.runtime = {}; }
Object.defineProperty(navigator, 'plugins', {
  get: () => [1, 2, 3, 4, 5].map(i => ({ name: 'Chrome PDF Plugin ' + i })),
});
const origQuery = window.navigator.permissions && window.navigator.permissions.query;
if (origQuery) {
  window.navigator.permissions.query = (params) =>
    params && params.name === 'notifications'
      ? Promise.resolve({ state: Notification.permission })
      : origQuery(params);
}
try {
  const getParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function (p) {
    if (p === 37445) return 'Intel Inc.';
    if (p === 37446) return 'Intel Iris OpenGL Engine';
    return getParameter.call(this, p);
  };
} catch (e) {}
"""

_LAUNCH_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--no-default-browser-check",
    "--no-first-run",
    "--disable-infobars",
    "--disable-popup-blocking",
    "--disable-features=IsolateOrigins,site-per-process",
    "--start-maximized",
]

IDLE_TTL_SECONDS = 180


class BrowserHub:
    """全局唯一的浏览器上下文池。"""

    def __init__(self) -> None:
        self._pw: Optional[Playwright] = None
        self._contexts: Dict[str, BrowserContext] = {}
        self._locks: Dict[str, asyncio.Lock] = {}
        self._last_used: Dict[str, float] = {}
        self._busy: set[str] = set()
        self._reaper: Optional[asyncio.Task] = None

    # ------------------------------------------------------------ 生命周期

    async def start(self) -> None:
        if self._pw is None:
            self._pw = await async_playwright().start()
            log.info("Playwright 已启动")
        if self._reaper is None:
            self._reaper = asyncio.create_task(self._reap_idle())

    async def stop(self) -> None:
        if self._reaper:
            self._reaper.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._reaper
            self._reaper = None
        for key in list(self._contexts):
            await self._close_context(key)
        if self._pw:
            await self._pw.stop()
            self._pw = None
            log.info("Playwright 已停止")

    # ------------------------------------------------------------ 对外接口

    @staticmethod
    def key_of(platform: str, account: str = "default") -> str:
        return f"{platform}__{account}"

    def profile_dir(self, platform: str, account: str = "default") -> Path:
        path = settings.profiles_dir / self.key_of(platform, account)
        path.mkdir(parents=True, exist_ok=True)
        return path

    def is_busy(self, platform: str, account: str = "default") -> bool:
        return self.key_of(platform, account) in self._busy

    def has_profile(self, platform: str, account: str = "default") -> bool:
        """判断是否曾经登录过（用户数据目录里有 Cookie 文件）。"""
        path = settings.profiles_dir / self.key_of(platform, account)
        return (path / "Default" / "Cookies").exists() or (path / "Cookies").exists()

    async def clear_profile(self, platform: str, account: str = "default") -> None:
        """退出登录 = 关掉上下文并删掉用户数据目录。"""
        import shutil

        key = self.key_of(platform, account)
        await self._close_context(key)
        path = settings.profiles_dir / key
        if path.exists():
            await asyncio.to_thread(shutil.rmtree, path, True)
        log.info("已清空 %s 的登录数据", key)

    @contextlib.asynccontextmanager
    async def session(self, platform: str, account: str = "default") -> AsyncIterator[Tuple[BrowserContext, Page]]:
        """独占获取某平台的浏览器上下文与一个新页面。"""
        await self.start()
        key = self.key_of(platform, account)
        lock = self._locks.setdefault(key, asyncio.Lock())

        async with lock:
            self._busy.add(key)
            context = await self._get_context(key, platform, account)
            page = await context.new_page()
            page.set_default_timeout(settings.action_timeout)
            try:
                yield context, page
            finally:
                self._busy.discard(key)
                self._last_used[key] = time.time()
                with contextlib.suppress(Exception):
                    if not page.is_closed():
                        await page.close()

    # ------------------------------------------------------------ 内部

    async def _get_context(self, key: str, platform: str, account: str) -> BrowserContext:
        context = self._contexts.get(key)
        if context is not None:
            try:
                # 探活：拿一下 pages 属性，上下文已崩会抛异常
                _ = context.pages
                return context
            except Exception:
                log.warning("%s 的浏览器上下文已失效，重新创建", key)
                self._contexts.pop(key, None)

        assert self._pw is not None
        profile = self.profile_dir(platform, account)

        launch_kwargs: dict = {
            "user_data_dir": str(profile),
            "headless": settings.headless,
            "args": _LAUNCH_ARGS,
            "viewport": {"width": 1600, "height": 900},
            "locale": "zh-CN",
            "timezone_id": "Asia/Shanghai",
            "accept_downloads": True,
            "ignore_default_args": ["--enable-automation"],
        }

        # 通道降级链：配置值 → msedge → chrome → 内置 Chromium
        # 真实浏览器内核的风控命中率远低于 Playwright 自带 Chromium，
        # 所以优先用系统已装的 Edge/Chrome。
        candidates: list[Optional[str]] = []
        configured = (settings.browser_channel or "").strip().lower()
        if configured and configured != "chromium":
            candidates.append(configured)
        for fallback in ("msedge", "chrome"):
            if fallback not in candidates:
                candidates.append(fallback)
        candidates.append(None)  # None = Playwright 内置 Chromium

        context = None
        last_error: Optional[Exception] = None
        used_channel = "chromium"
        for channel in candidates:
            attempt = dict(launch_kwargs)
            if channel:
                attempt["channel"] = channel
            try:
                context = await self._pw.chromium.launch_persistent_context(**attempt)
                used_channel = channel or "chromium"
                break
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                log.warning("以 %s 通道启动失败：%s", channel or "chromium", exc)
                continue

        if context is None:
            raise RuntimeError(
                "所有浏览器通道都启动失败。请确认已装 Edge/Chrome，"
                "或执行 `.venv\\Scripts\\python -m playwright install chromium`。"
                f"最后一次错误：{last_error}"
            )
        launch_kwargs["channel"] = used_channel

        await context.add_init_script(STEALTH_JS)
        context.set_default_timeout(settings.action_timeout)
        self._contexts[key] = context
        self._last_used[key] = time.time()
        log.info("已为 %s 启动浏览器（headless=%s, channel=%s）", key, settings.headless,
                 launch_kwargs.get("channel", "chromium"))
        return context

    async def _close_context(self, key: str) -> None:
        context = self._contexts.pop(key, None)
        self._last_used.pop(key, None)
        if context is not None:
            with contextlib.suppress(Exception):
                await context.close()
            log.info("已关闭 %s 的浏览器", key)

    async def _reap_idle(self) -> None:
        """回收空闲上下文，避免一直占着内存和 Chrome 窗口。"""
        while True:
            try:
                await asyncio.sleep(30)
                now = time.time()
                for key, last in list(self._last_used.items()):
                    if key in self._busy:
                        continue
                    if now - last > IDLE_TTL_SECONDS:
                        await self._close_context(key)
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # pragma: no cover
                log.warning("空闲回收异常: %s", exc)


hub = BrowserHub()
