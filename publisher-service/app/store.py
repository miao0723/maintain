"""SQLite 持久化：发布任务 + 账号状态。

用 SQLite 而不是内存，是为了服务重启后任务记录不丢，后端轮询仍能拿到结果。
"""
from __future__ import annotations

import json
import sqlite3
import threading
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from .config import settings

_LOCK = threading.RLock()

_SCHEMA = """
CREATE TABLE IF NOT EXISTS publish_task (
    task_id       TEXT PRIMARY KEY,
    platform      TEXT NOT NULL,
    biz_id        INTEGER NOT NULL,
    account       TEXT NOT NULL DEFAULT 'default',
    title         TEXT DEFAULT '',
    description   TEXT DEFAULT '',
    tags          TEXT DEFAULT '[]',
    video_path    TEXT DEFAULT '',
    cover_path    TEXT DEFAULT '',
    payload       TEXT DEFAULT '{}',
    callback_url  TEXT DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'pending',
    stage         TEXT DEFAULT '',
    progress      INTEGER DEFAULT 0,
    message       TEXT DEFAULT '',
    result_url    TEXT DEFAULT '',
    screenshot    TEXT DEFAULT '',
    attempts      INTEGER DEFAULT 0,
    created_at    TEXT DEFAULT '',
    updated_at    TEXT DEFAULT '',
    finished_at   TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_task_biz ON publish_task (platform, biz_id);
CREATE INDEX IF NOT EXISTS idx_task_status ON publish_task (status);

CREATE TABLE IF NOT EXISTS publish_account (
    platform      TEXT NOT NULL,
    account       TEXT NOT NULL DEFAULT 'default',
    nickname      TEXT DEFAULT '',
    logged_in     INTEGER DEFAULT 0,
    message       TEXT DEFAULT '',
    last_check_at TEXT DEFAULT '',
    PRIMARY KEY (platform, account)
);
"""


def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.db_path, timeout=15, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    with _LOCK, _connect() as conn:
        conn.executescript(_SCHEMA)


# ---------------------------------------------------------------- 任务

def create_task(req: Any) -> str:
    task_id = uuid.uuid4().hex
    now = _now()
    payload = {
        "visibility": req.visibility,
        "allow_download": req.allow_download,
        "scheduled_at": req.scheduled_at,
        "extra": req.extra,
    }
    with _LOCK, _connect() as conn:
        conn.execute(
            """INSERT INTO publish_task
               (task_id, platform, biz_id, account, title, description, tags,
                video_path, cover_path, payload, callback_url, status, stage,
                progress, message, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                task_id, req.platform, req.biz_id, req.account, req.title,
                req.description, json.dumps(req.tags, ensure_ascii=False),
                req.video_path, req.cover_path or "",
                json.dumps(payload, ensure_ascii=False),
                req.callback_url or "", "pending", "已排队", 0,
                "任务已创建，等待浏览器空闲", now, now,
            ),
        )
    return task_id


def update_task(task_id: str, **fields: Any) -> None:
    if not fields:
        return
    fields["updated_at"] = _now()
    if fields.get("status") in ("success", "failed", "cancelled"):
        fields.setdefault("finished_at", _now())
    columns = ", ".join(f"{key} = ?" for key in fields)
    values = list(fields.values()) + [task_id]
    with _LOCK, _connect() as conn:
        conn.execute(f"UPDATE publish_task SET {columns} WHERE task_id = ?", values)


def get_task(task_id: str) -> Optional[Dict[str, Any]]:
    with _LOCK, _connect() as conn:
        row = conn.execute("SELECT * FROM publish_task WHERE task_id = ?", (task_id,)).fetchone()
    return _row_to_task(row) if row else None


def latest_task_by_biz(platform: str, biz_id: int) -> Optional[Dict[str, Any]]:
    """后端只知道业务 ID 时，用它查最近一次发布结果。"""
    with _LOCK, _connect() as conn:
        row = conn.execute(
            """SELECT * FROM publish_task
               WHERE platform = ? AND biz_id = ?
               ORDER BY created_at DESC, rowid DESC LIMIT 1""",
            (platform, biz_id),
        ).fetchone()
    return _row_to_task(row) if row else None


def pending_tasks() -> List[Dict[str, Any]]:
    """服务重启后把中断的任务重新捞回队列。"""
    with _LOCK, _connect() as conn:
        rows = conn.execute(
            """SELECT * FROM publish_task
               WHERE status IN ('pending', 'running')
               ORDER BY created_at ASC""",
        ).fetchall()
    return [_row_to_task(r) for r in rows]


def running_count(platform: str) -> int:
    with _LOCK, _connect() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS c FROM publish_task WHERE platform = ? AND status = 'running'",
            (platform,),
        ).fetchone()
    return int(row["c"]) if row else 0


def _row_to_task(row: sqlite3.Row) -> Dict[str, Any]:
    task = dict(row)
    try:
        task["tags"] = json.loads(task.get("tags") or "[]")
    except json.JSONDecodeError:
        task["tags"] = []
    try:
        task["payload"] = json.loads(task.get("payload") or "{}")
    except json.JSONDecodeError:
        task["payload"] = {}
    return task


# ---------------------------------------------------------------- 账号

def upsert_account(platform: str, account: str = "default", *, logged_in: Optional[bool] = None,
                   nickname: Optional[str] = None, message: Optional[str] = None) -> None:
    now = _now()
    with _LOCK, _connect() as conn:
        conn.execute(
            """INSERT INTO publish_account (platform, account, nickname, logged_in, message, last_check_at)
               VALUES (?,?,?,?,?,?)
               ON CONFLICT(platform, account) DO UPDATE SET
                 nickname      = COALESCE(?, publish_account.nickname),
                 logged_in     = COALESCE(?, publish_account.logged_in),
                 message       = COALESCE(?, publish_account.message),
                 last_check_at = ?""",
            (
                platform, account, nickname or "", int(bool(logged_in)), message or "", now,
                nickname, None if logged_in is None else int(logged_in), message, now,
            ),
        )


def get_account(platform: str, account: str = "default") -> Optional[Dict[str, Any]]:
    with _LOCK, _connect() as conn:
        row = conn.execute(
            "SELECT * FROM publish_account WHERE platform = ? AND account = ?",
            (platform, account),
        ).fetchone()
    return dict(row) if row else None


def list_accounts() -> List[Dict[str, Any]]:
    with _LOCK, _connect() as conn:
        rows = conn.execute("SELECT * FROM publish_account ORDER BY platform, account").fetchall()
    return [dict(r) for r in rows]


def delete_account(platform: str, account: str = "default") -> None:
    with _LOCK, _connect() as conn:
        conn.execute(
            "DELETE FROM publish_account WHERE platform = ? AND account = ?",
            (platform, account),
        )
