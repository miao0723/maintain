"""全局配置：从 .env 读取，提供默认值。"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _bool(key: str, default: bool = False) -> bool:
    raw = os.getenv(key)
    if raw is None or raw == "":
        return default
    return str(raw).strip().lower() in ("1", "true", "yes", "on")


def _int(key: str, default: int) -> int:
    raw = os.getenv(key)
    try:
        return int(str(raw).strip())
    except (TypeError, ValueError):
        return default


class Settings:
    host: str = os.getenv("PUBLISHER_HOST", "0.0.0.0")
    port: int = _int("PUBLISHER_PORT", 8899)
    token: str = os.getenv("PUBLISHER_TOKEN", "")

    data_dir: Path = Path(os.getenv("PUBLISHER_DATA_DIR") or (BASE_DIR / "data"))

    headless: bool = _bool("PUBLISHER_HEADLESS", False)
    browser_channel: str = os.getenv("PUBLISHER_BROWSER_CHANNEL", "msedge").strip()

    task_timeout: int = _int("PUBLISHER_TASK_TIMEOUT", 1800)
    upload_timeout: int = _int("PUBLISHER_UPLOAD_TIMEOUT", 900)
    login_timeout: int = _int("PUBLISHER_LOGIN_TIMEOUT", 300)
    action_timeout: int = _int("PUBLISHER_ACTION_TIMEOUT", 20000)
    max_retry: int = _int("PUBLISHER_MAX_RETRY", 1)
    keep_browser_on_error: bool = _bool("PUBLISHER_KEEP_BROWSER_ON_ERROR", False)

    callback_base: str = os.getenv("PUBLISHER_CALLBACK_BASE", "http://localhost").rstrip("/")

    @property
    def db_path(self) -> Path:
        return self.data_dir / "publisher.db"

    @property
    def profiles_dir(self) -> Path:
        """每个平台一个浏览器用户数据目录，Cookie 天然持久化在这里。"""
        return self.data_dir / "profiles"

    @property
    def shots_dir(self) -> Path:
        """二维码 / 报错现场截图。"""
        return self.data_dir / "screenshots"

    @property
    def logs_dir(self) -> Path:
        return self.data_dir / "logs"

    def ensure_dirs(self) -> None:
        for path in (self.data_dir, self.profiles_dir, self.shots_dir, self.logs_dir):
            path.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_dirs()

# 支持的平台，与后端路由 / 前端菜单一一对应
PLATFORMS = ("douyin", "xiaohongshu", "kuaishou", "bilibili")

PLATFORM_LABELS = {
    "douyin": "抖音",
    "xiaohongshu": "小红书",
    "kuaishou": "快手",
    "bilibili": "B站",
}
