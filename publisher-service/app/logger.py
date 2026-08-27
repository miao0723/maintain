"""日志：控制台 + 按天切分的文件日志。"""
from __future__ import annotations

import logging
from logging.handlers import TimedRotatingFileHandler

from .config import settings

_FMT = "[%(asctime)s] %(levelname)-7s %(name)-22s %(message)s"


def setup_logging() -> None:
    root = logging.getLogger()
    if root.handlers:
        return
    root.setLevel(logging.INFO)

    console = logging.StreamHandler()
    console.setFormatter(logging.Formatter(_FMT))
    root.addHandler(console)

    file_handler = TimedRotatingFileHandler(
        settings.logs_dir / "publisher.log",
        when="midnight",
        backupCount=14,
        encoding="utf-8",
    )
    file_handler.setFormatter(logging.Formatter(_FMT))
    root.addHandler(file_handler)

    # Playwright 内部日志太吵，压到 WARNING
    logging.getLogger("asyncio").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
