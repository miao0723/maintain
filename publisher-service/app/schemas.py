"""请求 / 响应数据结构。"""
from __future__ import annotations

from typing import Any, List, Optional

from pydantic import BaseModel, Field, field_validator


class PublishRequest(BaseModel):
    """后端 PHP 提交的发布请求。"""

    platform: str = Field(..., description="douyin / xiaohongshu / kuaishou / bilibili")
    biz_id: int = Field(..., description="业务侧内容 ID（marketing_douyin_content.id）")
    video_path: str = Field(..., description="视频在本机的绝对路径")

    title: str = Field("", description="标题")
    description: str = Field("", description="正文文案")
    tags: List[str] = Field(default_factory=list, description="话题标签，不含 # 号")

    cover_path: Optional[str] = Field(None, description="自定义封面图本地路径，可空")
    account: str = Field("default", description="账号标识，同平台多账号时区分")
    callback_url: Optional[str] = Field(None, description="发布完成后回调地址")

    # 平台可选设置
    visibility: str = Field("public", description="public / friend / private")
    allow_download: bool = Field(True, description="是否允许他人下载/保存")
    scheduled_at: Optional[str] = Field(None, description="定时发布时间 YYYY-MM-DD HH:MM，空则立即发布")
    extra: dict[str, Any] = Field(default_factory=dict, description="平台专属参数，如 B站分区 tid")

    @field_validator("tags", mode="before")
    @classmethod
    def _normalize_tags(cls, value: Any) -> List[str]:
        """兼容后端可能传 "a,b,c" 字符串或 ["#a", "b"] 的情况。"""
        if value is None or value == "":
            return []
        if isinstance(value, str):
            raw = value.replace("，", ",").replace("#", ",").replace(" ", ",")
            parts = [p.strip() for p in raw.split(",")]
        elif isinstance(value, (list, tuple)):
            parts = [str(p).strip().lstrip("#").strip() for p in value]
        else:
            return []
        seen: List[str] = []
        for part in parts:
            part = part.lstrip("#").strip()
            if part and part not in seen:
                seen.append(part)
        return seen

    @field_validator("platform")
    @classmethod
    def _check_platform(cls, value: str) -> str:
        from .config import PLATFORMS

        value = (value or "").strip().lower()
        if value not in PLATFORMS:
            raise ValueError(f"不支持的平台: {value}，可选 {', '.join(PLATFORMS)}")
        return value


class PublishResponse(BaseModel):
    task_id: str
    status: str
    message: str


class TaskDetail(BaseModel):
    task_id: str
    platform: str
    biz_id: int
    account: str
    status: str
    stage: str
    progress: int
    message: str
    result_url: str
    attempts: int
    screenshot: str
    created_at: str
    updated_at: str
    finished_at: str


class AccountStatus(BaseModel):
    platform: str
    label: str
    account: str
    logged_in: bool
    nickname: str
    last_check_at: str
    message: str


class LoginStartResponse(BaseModel):
    session_id: str
    platform: str
    status: str
    message: str


class LoginSessionStatus(BaseModel):
    session_id: str
    platform: str
    status: str  # pending / waiting_scan / scanned / success / failed / expired
    message: str
    qrcode: str = ""  # base64 png，data URI
    nickname: str = ""
