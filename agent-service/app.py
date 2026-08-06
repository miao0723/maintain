import time
import uuid
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from graph_agent import invoke_agent, log_debug


MAX_MESSAGE_LENGTH = 4000
MAX_HISTORY_MESSAGES = 12
MAX_HISTORY_CONTENT_LENGTH = 2000
ALLOWED_HISTORY_ROLES = {"user", "assistant"}


class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = Field(default_factory=list)
    user_id: int | None = None


app = FastAPI(title="CMMS Agent Service")


def normalize_message(value: str) -> str:
    message = (value or "").strip()
    if not message:
        raise ValueError("消息内容不能为空")
    if len(message) > MAX_MESSAGE_LENGTH:
        raise ValueError(f"消息内容不能超过 {MAX_MESSAGE_LENGTH} 个字符")
    return message


def normalize_history(history: List[Dict[str, str]]) -> List[Dict[str, str]]:
    normalized: List[Dict[str, str]] = []
    for item in history[-MAX_HISTORY_MESSAGES:]:
        if not isinstance(item, dict):
            continue
        role = str(item.get("role", "")).strip()
        content = str(item.get("content", "")).strip()
        if role not in ALLOWED_HISTORY_ROLES or not content:
            continue
        normalized.append(
            {
                "role": role,
                "content": content[:MAX_HISTORY_CONTENT_LENGTH],
            }
        )
    return normalized


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/chat")
def chat(request: ChatRequest) -> Dict[str, Any]:
    request_id = uuid.uuid4().hex[:12]
    started_at = time.perf_counter()
    try:
        message = normalize_message(request.message)
        history = normalize_history(request.history)
        log_debug(
            "chat-request",
            {
                "request_id": request_id,
                "message": message,
                "history_count": len(history),
                "user_id": request.user_id,
            },
        )
        response = invoke_agent(
            message=message,
            history=history,
            user_id=request.user_id,
        )
        log_debug(
            "chat-response",
            {
                "request_id": request_id,
                "message": message,
                "tools_used": response.get("tools_used", []),
                "scenario": response.get("scenario"),
                "duration_ms": int((time.perf_counter() - started_at) * 1000),
            },
        )
        return {
            **response,
            "request_id": request_id,
        }
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


if __name__ == "__main__":
    import os

    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("AGENT_SERVICE_PORT", "8001")))
