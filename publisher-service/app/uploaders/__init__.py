"""平台上传器注册表。新增平台只需在这里补一行。"""
from __future__ import annotations

from typing import Dict

from .base import BaseUploader, NotLoggedInError, PublishError
from .bilibili import BilibiliUploader
from .douyin import DouyinUploader
from .kuaishou import KuaishouUploader
from .xiaohongshu import XiaohongshuUploader

_REGISTRY: Dict[str, BaseUploader] = {
    DouyinUploader.platform: DouyinUploader(),
    XiaohongshuUploader.platform: XiaohongshuUploader(),
    KuaishouUploader.platform: KuaishouUploader(),
    BilibiliUploader.platform: BilibiliUploader(),
}


def get_uploader(platform: str) -> BaseUploader:
    platform = (platform or "").strip().lower()
    uploader = _REGISTRY.get(platform)
    if uploader is None:
        raise PublishError(f"不支持的平台: {platform}，可选 {', '.join(_REGISTRY)}")
    return uploader


def all_uploaders() -> Dict[str, BaseUploader]:
    return dict(_REGISTRY)


__all__ = ["get_uploader", "all_uploaders", "BaseUploader", "PublishError", "NotLoggedInError"]
