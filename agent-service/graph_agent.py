import json
import os
import re
from datetime import datetime
from functools import lru_cache
from typing import Any, Dict, List, Literal, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph

from data_access import (
    env,
    query_business_overview,
    query_inventory,
    query_knowledge_overview,
    query_orders,
    query_personnel,
    query_progress,
    query_rag,
    query_repair_order_detail,
    query_repair_order_workload,
    query_repair_personnel,
    query_supplier_inventory_ranking,
    query_suppliers,
    query_user_context,
    query_work_orders,
)


SYSTEM_FEATURES = {
    "基础管理": ["用户管理", "角色管理", "权限管理", "人员管理", "单位管理", "日志管理", "参数管理"],
    "业务管理": ["免责协议管理", "常见问题管理", "绑定/解绑"],
    "引流模块": ["成功案例", "人工客服", "抖音获客", "小红书获客", "快手获客", "B站获客", "合作企业"],
    "维修业务": ["机械种类管理", "机械名称管理", "订单管理", "检测报告", "维修报告", "合同管理", "维修提醒", "联动维修", "维修进度"],
    "支付模块": ["转账支付", "在线支付", "支付宝测试", "发票管理"],
    "进销存": ["配件管理", "供应商管理"],
    "查询统计": ["收入统计", "开支统计", "订单统计", "超时统计"],
    "知识库": ["知识库管理", "AI 对话"],
    "Agent": ["系统智能体"],
}

MODULE_ALIASES = {
    "基础管理": ["基础管理", "基础模块", "用户管理", "角色管理", "权限管理", "人员管理", "单位管理", "日志管理", "参数管理"],
    "业务管理": ["业务管理", "业务模块", "免责协议", "常见问题", "绑定", "解绑"],
    "引流模块": ["引流模块", "引流", "营销模块", "成功案例", "人工客服", "抖音获客", "小红书获客", "快手获客", "b站获客", "合作企业"],
    "维修业务": ["维修业务", "维修模块", "维修系统", "维修功能", "机械种类", "机械名称", "订单管理", "检测报告", "维修报告", "合同管理", "维修提醒", "联动维修", "维修进度"],
    "支付模块": ["支付模块", "支付", "转账支付", "在线支付", "支付宝测试", "发票管理"],
    "进销存": ["进销存", "库存模块", "库存管理", "配件管理", "供应商管理", "配件", "备件", "库存", "供应商"],
    "查询统计": ["查询统计", "统计模块", "统计", "收入统计", "开支统计", "订单统计", "超时统计"],
    "知识库": ["知识库", "知识库模块", "知识内容", "知识文件", "知识库管理", "ai 对话", "文档"],
    "Agent": ["agent", "智能体", "系统智能体"],
}

STOP_WORDS = [
    "查询", "查一下", "查一查", "帮我查", "帮忙查", "请问", "请", "一下", "现在", "当前", "目前",
    "所有", "全部", "有哪些", "有什么", "信息", "情况", "数据", "记录", "列表", "内容", "状态",
    "分析", "统计", "概括", "看看", "显示", "列出", "帮我", "关于", "相关", "里面", "一下子", "的",
    "请基于", "基于", "列出", "说明", "总结", "排序", "优先", "并按", "并给出", "当前到哪个阶段",
    "最近一次更新", "负责人是谁", "前", "名", "系统里", "页面入口", "关键流程节点", "小程序",
    "repair", "cmms_db", "数据库",
]

SUGGESTION_NORMALIZERS = [
    (["低库存", "库存"], "请优先说明当前库存、最低库存和补货优先级。"),
    (["订单", "进度"], "请先回答当前状态，再给最近更新时间、负责人和下一步阶段。"),
    (["供应商", "库存金额"], "请按库存金额排序，并补充配件种类数。"),
    (["知识库", "维修流程"], "请先概括主流程，再列关键节点和注意事项。"),
    (["系统", "模块"], "请按模块说明入口、能力和常见用途。"),
]

SCENARIO_PROMPTS = {
    "repair_order": "这是企业维修订单场景。先给结论，再说明订单状态、负责人、进度、更新时间、异常点和下一步建议。",
    "work_order": "这是企业 CMMS 工单场景。优先给出工单状态、优先级、故障描述、责任人和处理建议。",
    "inventory": "这是企业库存或供应商场景。优先给出结论、查询范围、关键数据、风险判断以及补货或供应建议。",
    "personnel": "这是企业人员场景。优先给出人员身份、角色、联系方式、工作负载和适合的管理动作。",
    "knowledge": "这是企业知识库或流程说明场景。优先基于知识库给出摘要、适用模块、关键流程节点和落地建议。",
    "overview": "这是企业系统模块概览场景。优先按侧边栏模块、页面入口、核心能力、关联数据和使用场景来组织回答。",
    "general": "这是企业综合问答场景。回答要像后台管理智能助手，先结论，再依据，再建议。",
}

ENTERPRISE_SYSTEM_PROMPT = """你是企业级维修管理系统的系统智能体，服务对象是管理员、运营人员、仓库人员和维修负责人。

回答要求：
1. 回答风格必须专业、克制、可执行，像企业后台智能助手，不要像泛用聊天机器人。
2. 始终优先依据系统真实数据回答，禁止编造业务数据、人员、订单、库存或流程结果。
3. 默认回答结构：
   - 先给结论
   - 再给关键依据
   - 最后给下一步建议或可继续追问方向
4. 如果结果为空，不要只说“未查到”。
   需要明确：
   - 本次查询查了什么范围
   - 当前为什么没有命中结果
   - 用户下一步可以怎么查
5. 如果结果不完整，要明确说“当前仅查到部分数据”或“当前结果主要来自某个数据库”。
6. repair 数据库侧重维修订单、维修进度、库存、供应商、维修用户；cmms_db 侧重系统模块、知识库、CMMS 工单、维修业务配置。
7. 输出使用简洁中文，但信息密度要高，适合企业管理场景。"""

STATUS_LABELS = {
    "pending": "待处理",
    "quoted": "待确认报价",
    "confirmed": "已确认报价",
    "processing": "处理中",
    "completed": "已完成",
    "cancelled": "已取消",
}

MAX_AGENT_HISTORY = 12
MAX_HISTORY_ITEM_LENGTH = 2000


class AgentState(TypedDict, total=False):
    user_id: int | None
    user_profile: Dict[str, Any]
    history: List[Dict[str, str]]
    message: str
    normalized_message: str
    analysis: Dict[str, Any]
    tool_outputs: List[Dict[str, Any]]
    tools_used: List[str]
    tool_errors: List[Dict[str, Any]]
    answer: str


def is_sidebar_module_question(message: str) -> bool:
    module_tokens = ["侧边栏", "菜单", "模块", "页面", "页面入口", "系统里", "系统中", "功能入口"]
    return any(token in message for token in module_tokens)


def is_miniprogram_repair_question(message: str) -> bool:
    miniprogram_tokens = ["小程序", "客户订单", "维修订单", "维修人员", "维修工程师", "维修负责人", "报价"]
    return any(token in message for token in miniprogram_tokens)


def extract_order_search_keyword(message: str) -> str:
    explicit_no = re.search(r"(?:订单号?|工单号?)\s*[:：#]?\s*([A-Za-z0-9\-_]+)", message)
    if explicit_no:
        return explicit_no.group(1)
    numeric_no = re.search(r"(?:订单|工单)\s*([0-9]{1,10})", message)
    if numeric_no:
        return numeric_no.group(1)
    keyword = extract_named_keyword(
        message,
        [
            "订单", "工单", "维修单", "小程序", "维修订单", "客户订单", "当前", "最近", "状态", "进度",
            "负责人", "维修人员", "最近一次更新", "当前到哪个阶段", "说明", "列出", "所有", "全部",
        ],
    )
    return keyword


def is_general_order_lookup(message: str) -> bool:
    broad_patterns = [
        "订单有哪些",
        "有哪些订单",
        "订单信息",
        "查看订单",
        "订单列表",
        "订单情况",
        "订单状态",
        "订单量",
    ]
    return any(token in message for token in broad_patterns)


def log_debug(event: str, payload: Dict[str, Any]) -> None:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        print(f"[agent-service][{timestamp}][{event}] {json.dumps(payload, ensure_ascii=False, default=str)}")
    except Exception:
        print(f"[agent-service][{timestamp}][{event}] {payload}")


def cleanup_keyword(text_value: str) -> str:
    value = text_value.strip()
    for token in STOP_WORDS:
        value = value.replace(token, " ")
    value = re.sub(r"[，。！？；：,.!?;:/\\()（）【】\\[\\]\"'“”‘’]+", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value if len(value) > 1 else ""


def normalize_message(message: str) -> str:
    normalized = message.strip()
    compact = cleanup_keyword(normalized)
    for tokens, enhancement in SUGGESTION_NORMALIZERS:
        if all(token in normalized for token in tokens) or all(token in compact for token in tokens):
            return f"{normalized}\n\n补充要求：{enhancement}"
    return normalized


def detect_modules(message: str) -> List[str]:
    normalized = cleanup_keyword(message).lower() or message.strip().lower()
    matched: List[str] = []
    for module_name, aliases in MODULE_ALIASES.items():
        alias_pool = [module_name.lower(), *[alias.lower() for alias in aliases]]
        if any(alias and alias in normalized for alias in alias_pool):
            if module_name == "业务管理" and any(token in normalized for token in ["维修业务", "维修模块", "维修业务模块"]):
                continue
            matched.append(module_name)
    return matched


def detect_order_id(message: str) -> int | None:
    match = re.search(r"(?:订单|工单)\s*([0-9]{1,10})", message)
    if match:
        return int(match.group(1))
    return None


def extract_status_keyword(message: str) -> str:
    status_map = {
        "待处理": "pending",
        "处理中": "processing",
        "待维修": "pending",
        "已完成": "completed",
        "完成": "completed",
        "已取消": "cancelled",
        "取消": "cancelled",
    }
    for token, mapped in status_map.items():
        if token in message:
            return mapped
    return ""


def extract_named_keyword(message: str, domain_tokens: List[str]) -> str:
    value = cleanup_keyword(message)
    for token in domain_tokens:
        value = value.replace(token, " ")
    return re.sub(r"\s+", " ", value).strip()


def should_use_broad_query(message: str) -> bool:
    broad_tokens = ["所有", "全部", "当前", "现在", "最近", "有哪些", "有什么", "列表", "统计", "情况", "查看订单", "查看维修人员"]
    return any(token in message for token in broad_tokens)


def is_repair_order_analytics_query(message: str) -> bool:
    if not any(token in message for token in ["订单", "工单", "维修单", "接单", "报价"]):
        return False
    patterns = [r"谁.*最多", r"哪个.*最多", r"订单最多", r"接单最多", r"报价最多", r"完成最多", r"排行", r"排名", r"top", r"统计"]
    return any(re.search(pattern, message, re.IGNORECASE) for pattern in patterns)


def is_supplier_inventory_ranking_query(message: str) -> bool:
    if "供应商" not in message and "供货商" not in message:
        return False
    patterns = [r"库存金额最高", r"金额最高", r"排名", r"排行", r"top", r"最高"]
    return any(re.search(pattern, message, re.IGNORECASE) for pattern in patterns)


def is_cmms_work_order_query(message: str) -> bool:
    lower = message.lower()
    cmms_tokens = ["派单", "报修工单", "系统工单", "故障工单", "work order", "fault"]
    repair_tokens = ["维修订单", "用户订单", "报价", "小程序订单", "客户订单"]
    if any(token in lower for token in ["work order", "fault"]):
        return True
    if any(token in message for token in cmms_tokens):
        return True
    if any(token in message for token in repair_tokens):
        return False
    return "工单" in message and "订单" not in message


def is_knowledge_content_question(message: str) -> bool:
    knowledge_tokens = ["知识库", "文档", "文件", "知识内容", "知识库内容", "知识库文件"]
    content_tokens = ["内容", "全文", "文档", "文件", "知识", "说明", "定义", "流程", "规范", "制度", "里面"]
    return any(token in message for token in knowledge_tokens) and any(token in message for token in content_tokens)


def query_system_features(question: str = "", modules: List[str] | None = None) -> Dict[str, List[str]]:
    matched_modules = modules or detect_modules(question)
    if matched_modules:
        return {module_name: SYSTEM_FEATURES[module_name] for module_name in matched_modules if module_name in SYSTEM_FEATURES}
    normalized = cleanup_keyword(question)
    if not normalized:
        return SYSTEM_FEATURES
    matched: Dict[str, List[str]] = {}
    for module_name, features in SYSTEM_FEATURES.items():
        if normalized in module_name or any(normalized in feature for feature in features):
            matched[module_name] = features
            continue
        for token in normalized.split():
            if token and len(token) >= 2 and (token in module_name or any(token in feature for feature in features)):
                matched[module_name] = features
                break
    return matched or SYSTEM_FEATURES


@tool("analyze_user_message")
def analyze_user_message(payload: str) -> str:
    """
    分析用户消息并输出场景、关键词、模块和数据需求。
    """
    data = json.loads(payload)
    message = data.get("message", "")
    normalized = normalize_message(message)
    matched_modules = detect_modules(normalized)
    sidebar_question = is_sidebar_module_question(normalized)
    miniprogram_question = is_miniprogram_repair_question(normalized)
    scores = {
        "repair_order": 0,
        "work_order": 0,
        "inventory": 0,
        "personnel": 0,
        "knowledge": 0,
        "overview": 0,
        "general": 1,
    }
    if any(token in normalized for token in ["订单", "维修单", "报价", "进度", "维修负责人"]):
        scores["repair_order"] += 4
    if miniprogram_question:
        scores["repair_order"] += 4
    if is_repair_order_analytics_query(normalized):
        scores["repair_order"] += 3
    if is_cmms_work_order_query(normalized):
        scores["work_order"] += 4
    if any(token in normalized for token in ["库存", "配件", "备件", "供应商", "低库存"]):
        scores["inventory"] += 4
    if any(token in normalized for token in ["人员", "员工", "工程师", "负责人", "部门"]):
        scores["personnel"] += 3
    if miniprogram_question and any(token in normalized for token in ["维修人员", "维修工程师", "维修负责人", "人员"]):
        scores["personnel"] += 6
    if any(token in normalized for token in ["知识库", "文档", "流程", "规范", "制度"]) or is_knowledge_content_question(normalized):
        scores["knowledge"] += 4
    if matched_modules or sidebar_question or any(token in normalized for token in ["模块", "菜单", "功能", "入口", "介绍"]):
        scores["overview"] += 4
    if sidebar_question:
        scores["overview"] += 5
    if "请基于 cmms_db" in normalized or "cmms_db" in normalized:
        scores["overview"] += 3
        scores["knowledge"] += 2
    if "请基于 repair" in normalized or "repair 数据库" in normalized:
        scores["repair_order"] += 2
        scores["inventory"] += 2
        scores["personnel"] += 2
    if is_general_order_lookup(normalized):
        scores["repair_order"] += 3

    primary = max(scores, key=scores.get)
    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    secondary = [name for name, score in ranked if name != primary and score >= 3][:2]
    response = {
        "primary_scenario": primary,
        "secondary_scenarios": secondary,
        "matched_modules": matched_modules,
        "sidebar_question": sidebar_question,
        "miniprogram_question": miniprogram_question,
        "db_preference": (
            "cmms_db"
            if sidebar_question or "cmms_db" in normalized
            else "repair"
            if miniprogram_question or "repair 数据库" in normalized
            else "auto"
        ),
        "order_id": detect_order_id(normalized),
        "status_keyword": extract_status_keyword(normalized),
        "inventory_keyword": extract_named_keyword(normalized, ["低库存", "库存", "配件", "备件", "供应商", "供货商", "紧急程度", "排序"]),
        "personnel_keyword": extract_named_keyword(normalized, ["人员", "员工", "负责人", "工程师", "部门", "维修人员", "维修工程师"]),
        "knowledge_keyword": extract_named_keyword(normalized, ["知识库", "文档", "文件内容", "知识内容", "知识库内容", "知识库文件", "里面", "内容", "查询"]),
        "needs_rag": any(token in normalized for token in ["流程", "规范", "制度", "说明"]) or is_knowledge_content_question(normalized),
        "needs_progress": "进度" in normalized or "阶段" in normalized,
        "needs_order_detail": detect_order_id(normalized) is not None,
        "needs_workload": is_repair_order_analytics_query(normalized),
        "needs_supplier_ranking": is_supplier_inventory_ranking_query(normalized),
        "use_broad_query": should_use_broad_query(normalized),
    }
    return json.dumps(response, ensure_ascii=False)


def convert_history(history: List[Dict[str, str]]) -> List[BaseMessage]:
    messages: List[BaseMessage] = []
    for item in sanitize_history(history):
        role = item.get("role")
        content = item.get("content", "")
        if not content:
            continue
        if role == "assistant":
            messages.append(AIMessage(content=content))
        else:
            messages.append(HumanMessage(content=content))
    return messages


def sanitize_history(history: List[Dict[str, str]]) -> List[Dict[str, str]]:
    normalized: List[Dict[str, str]] = []
    for item in history[-MAX_AGENT_HISTORY:]:
        if not isinstance(item, dict):
            continue
        role = str(item.get("role", "")).strip()
        if role not in {"user", "assistant"}:
            continue
        content = str(item.get("content", "")).strip()
        if not content:
            continue
        normalized.append({"role": role, "content": content[:MAX_HISTORY_ITEM_LENGTH]})
    return normalized


@lru_cache(maxsize=1)
def build_llm() -> ChatOpenAI:
    api_key = env("DEEPSEEK_API_KEY")
    if not api_key:
        raise RuntimeError("DEEPSEEK_API_KEY 未配置")
    return ChatOpenAI(
        api_key=api_key,
        model=env("AGENT_MODEL", "deepseek-chat"),
        base_url=env("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"),
        temperature=0.1,
    )


def format_status_label(status: str | None) -> str:
    if not status:
        return "未知"
    return STATUS_LABELS.get(status, status)


def build_empty_result_answer(domain: str, scope: str, next_steps: List[str]) -> str:
    return (
        f"当前未查到{domain}。\n"
        f"本次查询范围：{scope}。\n"
        "可能原因：当前数据中没有符合条件的记录，或查询关键词过宽/过窄，或相关业务数据尚未录入。\n"
        f"建议下一步：{'；'.join(next_steps)}。"
    )


def sample_names(rows: List[Dict[str, Any]], key: str, limit: int = 3) -> str:
    values = [str(row.get(key)).strip() for row in rows[:limit] if row.get(key)]
    return "、".join(values)


def append_tool(state: AgentState, tool_name: str, data: Any) -> None:
    if tool_name in state.get("tools_used", []):
        return
    state.setdefault("tool_outputs", []).append({"tool": tool_name, "data": data})
    state.setdefault("tools_used", []).append(tool_name)


def append_tool_error(state: AgentState, tool_name: str, error: Exception | str) -> None:
    state.setdefault("tool_errors", []).append({"tool": tool_name, "error": str(error)})


def safe_append_tool(state: AgentState, tool_name: str, func) -> None:
    try:
        data = func()
        append_tool(state, tool_name, data)
    except Exception as exc:
        append_tool_error(state, tool_name, exc)
        log_debug("tool-error", {"tool": tool_name, "error": str(exc)})


def has_meaningful_data(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, list):
        return len(value) > 0
    if isinstance(value, dict):
        return any(has_meaningful_data(item) for item in value.values())
    return True


def append_module_context_tools(local_state: AgentState, matched_modules: List[str], message: str) -> None:
    for module_name in matched_modules:
        if module_name == "维修业务":
            keyword = extract_named_keyword(message, ["维修业务", "维修模块", "维修系统", "功能", "模块", "侧边栏", "页面", "包含哪些内容", "包含", "内容", "查看"])
            if is_sidebar_module_question(message) or should_use_broad_query(message) or not keyword:
                keyword = ""
            safe_append_tool(local_state, "query_business_overview", lambda: query_business_overview(keyword=keyword, limit=8))
            safe_append_tool(local_state, "query_orders", lambda: query_orders(keyword="", limit=8))
            safe_append_tool(local_state, "query_repair_personnel", lambda: query_repair_personnel(keyword="", limit=8))
        elif module_name == "进销存":
            safe_append_tool(local_state, "query_inventory", lambda: query_inventory(keyword="", low_stock_only=False, limit=8))
            safe_append_tool(local_state, "query_suppliers", lambda: query_suppliers(keyword="", limit=8))
            safe_append_tool(local_state, "query_supplier_inventory_ranking", lambda: query_supplier_inventory_ranking(limit=5))
        elif module_name == "知识库":
            safe_append_tool(local_state, "query_knowledge_overview", lambda: query_knowledge_overview(keyword="", limit=8))
            safe_append_tool(local_state, "query_rag", lambda: query_rag(question=cleanup_keyword(message) or message, limit=5))
        elif module_name == "基础管理":
            safe_append_tool(local_state, "query_personnel", lambda: query_personnel(keyword="", limit=8))
        elif module_name == "查询统计":
            safe_append_tool(local_state, "query_repair_order_workload", lambda: query_repair_order_workload(message="订单统计 排名", limit=5))
            safe_append_tool(local_state, "query_work_orders", lambda: query_work_orders(keyword="", limit=8))
        elif module_name == "Agent":
            safe_append_tool(local_state, "query_system_features", lambda: query_system_features(message, [module_name]))


def initialize_state(state: AgentState) -> AgentState:
    return {
        "normalized_message": normalize_message(state["message"]),
        "history": sanitize_history(state.get("history", [])),
        "tool_outputs": [],
        "tools_used": [],
        "tool_errors": [],
    }


def load_user_state(state: AgentState) -> AgentState:
    user_id = state.get("user_id")
    user_profile = query_user_context(user_id) if user_id else {}
    return {"user_profile": user_profile}


def analyze_state(state: AgentState) -> AgentState:
    payload = {
        "message": state["normalized_message"],
        "history": state.get("history", []),
        "user_id": state.get("user_id"),
        "user_profile": state.get("user_profile", {}),
    }
    analysis = json.loads(analyze_user_message.invoke(json.dumps(payload, ensure_ascii=False)))
    log_debug("analysis", analysis)
    return {"analysis": analysis}


def repair_order_node(state: AgentState) -> AgentState:
    message = state["normalized_message"]
    analysis = state["analysis"]
    local_state: AgentState = {"tool_outputs": [], "tools_used": [], "tool_errors": []}

    if analysis.get("needs_workload"):
        safe_append_tool(local_state, "query_repair_order_workload", lambda: query_repair_order_workload(message=message, limit=5))

    if analysis.get("needs_order_detail") and analysis.get("order_id"):
        detail_rows: List[Dict[str, Any]] = []
        try:
            detail_rows = query_repair_order_detail(order_id=analysis["order_id"])
            append_tool(local_state, "query_repair_order_detail", detail_rows)
        except Exception as exc:
            append_tool_error(local_state, "query_repair_order_detail", exc)
            log_debug("tool-error", {"tool": "query_repair_order_detail", "error": str(exc)})
        if not detail_rows:
            safe_append_tool(local_state, "query_orders_by_reference", lambda: query_orders(keyword=str(analysis["order_id"]), limit=10))

    order_keyword = analysis.get("status_keyword") or extract_order_search_keyword(message)
    if (
        analysis.get("use_broad_query")
        or analysis.get("miniprogram_question")
        or is_general_order_lookup(message)
        or ("repair 数据库" in message and not analysis.get("order_id"))
    ) and not analysis.get("status_keyword"):
        order_keyword = ""
    safe_append_tool(local_state, "query_orders", lambda: query_orders(keyword=order_keyword, limit=10))

    if analysis.get("needs_progress") and analysis.get("order_id"):
        safe_append_tool(local_state, "query_progress", lambda: query_progress(order_id=analysis["order_id"]))

    if is_cmms_work_order_query(message) and analysis.get("db_preference") != "repair":
        work_order_keyword = extract_named_keyword(message, ["工单", "维修工单", "派单"])
        if analysis.get("use_broad_query"):
            work_order_keyword = ""
        safe_append_tool(local_state, "query_work_orders", lambda: query_work_orders(keyword=work_order_keyword, limit=8))

    if analysis.get("needs_rag"):
        safe_append_tool(local_state, "query_rag", lambda: query_rag(question=cleanup_keyword(message), limit=5))

    return local_state


def inventory_node(state: AgentState) -> AgentState:
    message = state["normalized_message"]
    analysis = state["analysis"]
    local_state: AgentState = {"tool_outputs": [], "tools_used": [], "tool_errors": []}

    keyword = analysis.get("inventory_keyword", "")
    if analysis.get("use_broad_query"):
        keyword = ""
    safe_append_tool(
        local_state,
        "query_inventory",
        lambda: query_inventory(keyword=keyword, low_stock_only="低库存" in message, limit=10),
    )

    if "供应商" in message or "供货商" in message:
        supplier_keyword = extract_named_keyword(message, ["供应商", "供货商", "库存金额", "金额最高", "最高", "最近"])
        if analysis.get("use_broad_query"):
            supplier_keyword = ""
        safe_append_tool(local_state, "query_suppliers", lambda: query_suppliers(keyword=supplier_keyword, limit=10))

    if analysis.get("needs_supplier_ranking"):
        safe_append_tool(local_state, "query_supplier_inventory_ranking", lambda: query_supplier_inventory_ranking(limit=5))

    return local_state


def personnel_node(state: AgentState) -> AgentState:
    message = state["normalized_message"]
    analysis = state["analysis"]
    local_state: AgentState = {"tool_outputs": [], "tools_used": [], "tool_errors": []}

    keyword = analysis.get("personnel_keyword", "")
    if analysis.get("use_broad_query") or analysis.get("miniprogram_question"):
        keyword = ""
    if "维修人员" in message or "维修工程师" in message or "维修负责人" in message:
        safe_append_tool(local_state, "query_repair_personnel", lambda: query_repair_personnel(keyword=keyword, limit=10))

    if analysis.get("db_preference") != "repair":
        safe_append_tool(local_state, "query_personnel", lambda: query_personnel(keyword=keyword, limit=10))

    if is_repair_order_analytics_query(message):
        safe_append_tool(local_state, "query_repair_order_workload", lambda: query_repair_order_workload(message=message, limit=5))

    return local_state


def knowledge_node(state: AgentState) -> AgentState:
    message = state["normalized_message"]
    analysis = state["analysis"]
    local_state: AgentState = {"tool_outputs": [], "tools_used": [], "tool_errors": []}

    keyword = analysis.get("knowledge_keyword", "")
    if analysis.get("use_broad_query"):
        keyword = ""
    safe_append_tool(local_state, "query_knowledge_overview", lambda: query_knowledge_overview(keyword=keyword, limit=10))
    safe_append_tool(local_state, "query_rag", lambda: query_rag(question=cleanup_keyword(message) or message, limit=5))

    if analysis.get("matched_modules"):
        safe_append_tool(local_state, "query_system_features", lambda: query_system_features(message, analysis["matched_modules"]))
        append_module_context_tools(local_state, analysis["matched_modules"], message)

    return local_state


def overview_node(state: AgentState) -> AgentState:
    message = state["normalized_message"]
    analysis = state["analysis"]
    local_state: AgentState = {"tool_outputs": [], "tools_used": [], "tool_errors": []}

    matched_modules = analysis.get("matched_modules", [])
    safe_append_tool(local_state, "query_system_features", lambda: query_system_features(message, matched_modules))
    if matched_modules:
        append_module_context_tools(local_state, matched_modules, message)
    else:
        if any(token in message for token in ["维修业务", "维修模块", "维修系统", "维修功能", "合同", "报告", "机械"]):
            keyword = extract_named_keyword(message, ["维修业务", "维修模块", "维修系统", "里面", "有什么", "功能", "包含", "内容", "查看"])
            if analysis.get("sidebar_question") or analysis.get("use_broad_query") or not keyword:
                keyword = ""
            safe_append_tool(local_state, "query_business_overview", lambda: query_business_overview(keyword=keyword, limit=10))
        if any(token in message for token in ["知识库", "流程", "文档"]):
            safe_append_tool(local_state, "query_knowledge_overview", lambda: query_knowledge_overview(keyword="", limit=5))
            safe_append_tool(local_state, "query_rag", lambda: query_rag(question=cleanup_keyword(message) or message, limit=5))
    return local_state


def general_node(state: AgentState) -> AgentState:
    message = state["normalized_message"]
    analysis = state["analysis"]
    local_state: AgentState = {"tool_outputs": [], "tools_used": [], "tool_errors": []}
    matched_modules = analysis.get("matched_modules", [])
    safe_append_tool(local_state, "query_system_features", lambda: query_system_features(message, matched_modules))
    if matched_modules:
        append_module_context_tools(local_state, matched_modules, message)
    if any(token in message for token in ["订单", "维修单", "进度"]):
        safe_append_tool(local_state, "query_orders", lambda: query_orders(keyword="", limit=8))
    if any(token in message for token in ["人员", "员工", "工程师"]):
        safe_append_tool(local_state, "query_personnel", lambda: query_personnel(keyword="", limit=8))
        safe_append_tool(local_state, "query_repair_personnel", lambda: query_repair_personnel(keyword="", limit=8))
    if any(token in message for token in ["库存", "配件", "供应商"]):
        safe_append_tool(local_state, "query_inventory", lambda: query_inventory(keyword="", low_stock_only="低库存" in message, limit=8))
        safe_append_tool(local_state, "query_suppliers", lambda: query_suppliers(keyword="", limit=8))
    safe_append_tool(local_state, "query_knowledge_overview", lambda: query_knowledge_overview(keyword="", limit=5))
    safe_append_tool(local_state, "query_rag", lambda: query_rag(question=cleanup_keyword(message) or message, limit=5))
    return local_state


def route_scenario(state: AgentState) -> Literal["repair_order", "inventory", "personnel", "knowledge", "overview", "general"]:
    scenario = state["analysis"]["primary_scenario"]
    if scenario not in {"repair_order", "work_order", "inventory", "personnel", "knowledge", "overview"}:
        return "general"
    if scenario == "work_order":
        return "repair_order"
    return scenario


def merge_branch_results(state: AgentState) -> AgentState:
    return state


def route_post_query(state: AgentState) -> Literal["no_data_node", "answer_node"]:
    tool_outputs = state.get("tool_outputs", [])
    tool_errors = state.get("tool_errors", [])
    if tool_errors and not tool_outputs:
        return "no_data_node"
    if not tool_outputs:
        return "no_data_node"
    if not any(has_meaningful_data(item.get("data")) for item in tool_outputs):
        return "no_data_node"
    return "answer_node"


def no_data_node(state: AgentState) -> AgentState:
    analysis = state.get("analysis", {})
    scenario = analysis.get("primary_scenario", "general")
    tool_errors = state.get("tool_errors", [])
    if tool_errors:
        error_tools = "；".join(f"{item.get('tool')}: {item.get('error')}" for item in tool_errors[:3])
        return {
            "answer": (
                "本次查询没有返回可用结果，系统已自动进入无数据处理。\n"
                f"当前场景：{scenario}。\n"
                f"异常信息：{error_tools}。\n"
                "建议下一步：请缩小查询范围、补充更精确的订单号/人员名/模块名，或确认相关业务数据是否已同步入库。"
            )
        }

    no_data_messages = {
        "repair_order": "当前未查到符合条件的维修订单或订单进度。建议提供准确订单号，或先查看当前订单列表。",
        "inventory": "当前未查到符合条件的库存或供应商数据。建议先查看全部库存、低库存列表或供应商排行。",
        "personnel": "当前未查到符合条件的人员数据。建议提供人员姓名、手机号或角色关键词继续查询。",
        "knowledge": "当前未查到相关知识库资料。建议补充更具体的流程、制度或文档关键词。",
        "overview": "当前已识别到模块查询，但没有拿到可展示的业务数据。建议继续查看某个模块的明细页面或关联数据。",
        "general": "当前没有查到与该问题直接相关的数据。建议明确查询对象，例如订单、人员、库存、知识库或系统模块。",
    }
    return {"answer": no_data_messages.get(scenario, no_data_messages["general"])}


def build_direct_answer(message: str, tool_outputs: List[Dict[str, Any]]) -> str | None:
    tool_map = {item["tool"]: item.get("data") for item in tool_outputs if item.get("tool")}

    if (
        "query_system_features" in tool_map
        and "query_business_overview" in tool_map
        and any(token in message for token in ["维修业务", "维修模块", "侧边栏"])
    ):
        feature_map = tool_map["query_system_features"] or {}
        business_data = tool_map["query_business_overview"] or {}
        module_features = feature_map.get("维修业务", []) if isinstance(feature_map, dict) else []
        category_rows = business_data.get("repair_categories", []) if isinstance(business_data, dict) else []
        machine_rows = business_data.get("repair_machines", []) if isinstance(business_data, dict) else []
        contract_rows = business_data.get("repair_contracts", []) if isinstance(business_data, dict) else []
        report_rows = business_data.get("repair_reports", []) if isinstance(business_data, dict) else []
        feature_text = "、".join(module_features[:8]) if module_features else "机械种类管理、机械名称管理、订单管理、检测报告、维修报告、合同管理、维修提醒、维修进度"
        return (
            "结论：系统侧边栏中的维修业务模块既有页面能力，也已经关联到实际业务数据。\n"
            f"关键依据：该模块当前包含 {feature_text}。"
            f" 同时查到机械分类 {len(category_rows)} 条、机械档案 {len(machine_rows)} 条、维修合同 {len(contract_rows)} 条、维修报告 {len(report_rows)} 条。"
            f"{' 例如机械分类有：' + sample_names(category_rows, 'name') + '。' if category_rows else ''}"
            f"{' 例如机械档案有：' + sample_names(machine_rows, 'name') + '。' if machine_rows else ''}"
            f"{' 例如合同编号有：' + sample_names(contract_rows, 'contract_number') + '。' if contract_rows else ''}"
            f"{' 例如维修报告有：' + sample_names(report_rows, 'report_number') + '。' if report_rows else ''}\n"
            "下一步建议：你可以继续让我查看维修订单列表、机械档案明细、维修合同列表，或某一张维修报告的详情。"
        )

    if "query_orders" in tool_map and any(token in message for token in ["订单", "维修订单", "小程序订单", "查看订单"]):
        rows = tool_map["query_orders"] or []
        if rows:
            parts = []
            for row in rows[:5]:
                label = format_status_label(row.get("repair_status"))
                parts.append(
                    f"{row.get('order_no') or row.get('id')}(状态{label}, 设备{row.get('machine_name') or '未知'})"
                )
            return f"当前查到的维修订单有：{'；'.join(parts)}。"
        return build_empty_result_answer(
            "维修订单信息",
            "repair 数据库中的 orders 订单列表",
            ["改为指定订单号查询", "补充客户名称、设备名称或订单状态", "继续追问某张订单的负责人或进度"],
        )

    if "query_repair_personnel" in tool_map and any(token in message for token in ["维修人员", "维修工程师", "维修负责人"]):
        rows = tool_map["query_repair_personnel"] or []
        if rows:
            parts = [f"{row.get('name')}(角色{row.get('role') or '未知'}, 电话{row.get('phone') or '暂无'})" for row in rows[:5]]
            return f"当前查到的维修人员有：{'；'.join(parts)}。"
        return build_empty_result_answer(
            "维修人员信息",
            "repair 数据库中的 users 维修管理用户",
            ["改为查询具体姓名或手机号", "确认维修人员是否已在小程序用户库中创建", "继续查询某张订单的负责人"],
        )

    if "query_personnel" in tool_map and any(token in message for token in ["人员", "员工", "部门"]):
        rows = tool_map["query_personnel"] or []
        if rows:
            parts = [f"{row.get('name')}(角色{row.get('role') or '未知'}, 电话{row.get('phone') or '暂无'})" for row in rows[:5]]
            return f"当前查到的人员有：{'；'.join(parts)}。"

    if "query_suppliers" in tool_map and "供应商" in message and "最高" not in message and "金额" not in message:
        rows = tool_map["query_suppliers"] or []
        if rows:
            parts = [f"{row.get('name')}(编码{row.get('code') or '暂无'}, 电话{row.get('phone') or '暂无'})" for row in rows[:5]]
            return f"当前查到的供应商有：{'；'.join(parts)}。"
        return build_empty_result_answer(
            "供应商信息",
            "repair 数据库中的 suppliers 供应商档案",
            ["改为查询具体供应商名称", "查看库存金额最高的供应商排行", "确认供应商资料是否已建档"],
        )

    if "query_work_orders" in tool_map and any(token in message for token in ["工单", "派单", "故障工单"]):
        rows = tool_map["query_work_orders"] or []
        if rows:
            parts = [f"{row.get('order_no')}(状态{row.get('status') or '未知'}, 故障{row.get('fault_type') or '未填写'})" for row in rows[:5]]
            return f"当前查到的系统工单有：{'；'.join(parts)}。"
        return build_empty_result_answer(
            "系统工单",
            "cmms_db 数据库中的 work_orders 工单列表",
            ["补充工单号或故障类型", "改问维修订单而不是系统工单", "确认工单是否已进入 CMMS 工单库"],
        )

    if "query_business_overview" in tool_map and any(token in message for token in ["维修业务", "维修模块", "维修系统"]):
        data = tool_map["query_business_overview"] or {}
        if isinstance(data, dict):
            category_rows = data.get("repair_categories", []) or []
            machine_rows = data.get("repair_machines", []) or []
            contract_rows = data.get("repair_contracts", []) or []
            report_rows = data.get("repair_reports", []) or []
            categories = len(category_rows)
            machines = len(machine_rows)
            contracts = len(contract_rows)
            reports = len(report_rows)
            if categories == 0 and machines == 0 and contracts == 0 and reports == 0:
                return (
                    "维修业务模块已识别成功，但当前这次按业务概览条件未命中明细数据。"
                    "这通常意味着问句中的描述被当成筛选词后没有匹配到记录，并不等于模块本身没有数据。"
                    "建议继续直接查看维修业务模块包含的机械分类、机械档案、维修合同或维修报告明细。"
                )
            category_examples = sample_names(category_rows, "name")
            machine_examples = sample_names(machine_rows, "name")
            contract_examples = sample_names(contract_rows, "contract_number")
            report_examples = sample_names(report_rows, "report_number")
            return (
                "结论：维修业务模块已经关联到完整的业务数据面，可用于查看机械分类、机械档案、维修合同和维修报告。\n"
                f"关键依据：当前查到机械分类 {categories} 条、机械档案 {machines} 条、维修合同 {contracts} 条、维修报告 {reports} 条。"
                f"{' 例如机械分类有：' + category_examples + '。' if category_examples else ''}"
                f"{' 例如机械档案有：' + machine_examples + '。' if machine_examples else ''}"
                f"{' 例如合同编号有：' + contract_examples + '。' if contract_examples else ''}"
                f"{' 例如维修报告有：' + report_examples + '。' if report_examples else ''}\n"
                "下一步建议：你可以继续让我分别查看“机械分类明细”“机械档案列表”“维修合同列表”或“维修报告列表”。"
            )

    if "query_inventory" in tool_map and "低库存" in message:
        rows = tool_map["query_inventory"] or []
        if not rows:
            return build_empty_result_answer(
                "低库存配件",
                "repair 数据库中的 spare_parts，筛选条件为 stock_quantity <= min_stock",
                ["改为查看全部配件库存", "查看某个配件名称或编码", "确认最低库存阈值是否已维护"],
            )
        parts = [f"{row.get('part_name') or row.get('part_code')}(库存{row.get('stock_quantity', 0)}, 最低{row.get('min_stock', 0)})" for row in rows[:5]]
        return f"当前低库存配件已按紧急程度优先列出：{'；'.join(parts)}。"

    if "query_repair_order_detail" in tool_map:
        rows = tool_map["query_repair_order_detail"] or []
        if rows:
            row = rows[0]
            progress_value = row.get("progress")
            progress_text = f"{progress_value}%" if progress_value is not None else "暂无"
            return (
                f"订单 {row.get('id')} 当前处于“{format_status_label(row.get('status'))}”阶段，"
                f"当前进度 {progress_text}，最近一次更新是 {row.get('progress_updated_at') or row.get('updated_at') or '暂无'}，"
                f"当前维修人员是 {row.get('assigned_to_name') or '未分配'}。"
            )
        reference_rows = tool_map.get("query_orders_by_reference") or []
        if reference_rows:
            parts = []
            for row in reference_rows[:5]:
                parts.append(f"{row.get('order_no') or row.get('id')}(状态{format_status_label(row.get('repair_status'))})")
            return (
                f"当前未查到 ID 为 {detect_order_id(message) or '该编号'} 的精确维修订单。"
                f" 但在 repair 订单库中查到了与该编号相关的候选订单：{'；'.join(parts)}。"
                " 你可以继续指定准确订单号，或直接让我查看其中某一张订单的状态、进度和负责人。"
            )
        return build_empty_result_answer(
            "该维修订单明细",
            "repair 数据库中的指定订单详情",
            ["确认订单 ID 是否正确", "先查看当前订单列表", "改为按订单号或设备名称查询"],
        )

    if "query_repair_order_workload" in tool_map:
        rows = tool_map["query_repair_order_workload"] or []
        if rows:
            top = rows[0]
            ranking = "；".join(f"{row.get('technician_name', '未知人员')} {row.get('order_count', 0)} 单" for row in rows[:5])
            return f"当前订单量最高的人员是 {top.get('technician_name', '未知人员')}，共 {top.get('order_count', 0)} 单。排行参考：{ranking}。"

    if "query_supplier_inventory_ranking" in tool_map:
        rows = tool_map["query_supplier_inventory_ranking"] or []
        if rows:
            parts = [f"{row.get('name')}(库存金额{float(row.get('inventory_value', 0)):.2f}元, 配件{row.get('part_count', 0)}种)" for row in rows[:5]]
            return f"最近库存金额最高的供应商如下：{'；'.join(parts)}。"

    if "query_system_features" in tool_map and any(token in message for token in ["模块", "菜单", "功能", "入口", "侧边栏", "页面"]):
        data = tool_map["query_system_features"] or {}
        if data:
            parts = [f"{module}：{'、'.join(features[:6])}" for module, features in list(data.items())[:4]]
            return (
                "结论：当前问题已命中系统侧边栏模块定义。\n"
                f"关键依据：{'；'.join(parts)}。\n"
                "下一步建议：如果你要看某个模块的真实业务数据，我可以继续展开对应模块的明细，例如维修业务、进销存或知识库。"
            )
        return build_empty_result_answer(
            "系统模块内容",
            "cmms_db 侧的系统模块能力映射",
            ["直接问某个侧边栏模块", "改问维修业务、进销存或知识库模块", "补充页面入口或功能关键词"],
        )

    if "query_knowledge_overview" in tool_map and any(token in message for token in ["知识库", "维修流程"]):
        data = tool_map["query_knowledge_overview"] or {}
        files = data.get("files", []) if isinstance(data, dict) else []
        chunks = data.get("chunks", []) if isinstance(data, dict) else []
        if files or chunks:
            names = [item.get("original_name") for item in files[:3] if item.get("original_name")]
            excerpt = chunks[0].get("excerpt") if chunks else ""
            if names:
                return (
                    "结论：知识库中已经存在与当前问题相关的资料。\n"
                    f"关键依据：相关资料包括 {'、'.join(names)}。"
                    f"{' 其中一条摘要为：' + excerpt if excerpt else ''}\n"
                    "下一步建议：你可以继续让我总结维修流程、解释某一份文档，或者提取某个流程节点的操作要求。"
                )
        return build_empty_result_answer(
            "知识库相关资料",
            "cmms_db 中的 kb_collections、kb_files、kb_chunks",
            ["补充更具体的流程名称", "改问某个模块相关文档", "确认相关文档是否已入库并完成切分"],
        )

    return None


def answer_node(state: AgentState) -> AgentState:
    tool_outputs = state.get("tool_outputs", [])
    message = state["message"]
    direct_answer = build_direct_answer(state["normalized_message"], tool_outputs)
    if direct_answer:
        return {"answer": direct_answer}

    llm = build_llm()
    scenario = state["analysis"]["primary_scenario"]
    system_prompt = (
        f"{ENTERPRISE_SYSTEM_PROMPT}\n"
        f"当前场景要求：{SCENARIO_PROMPTS.get(scenario, SCENARIO_PROMPTS['general'])}"
    )
    prompt = [
        SystemMessage(content=system_prompt),
        *convert_history(state.get("history", [])),
        HumanMessage(
            content=(
                f"当前用户ID：{state.get('user_id')}\n"
                f"用户上下文：{json.dumps(state.get('user_profile', {}), ensure_ascii=False, default=str)}\n"
                f"用户原始问题：{message}\n"
                f"归一化问题：{state['normalized_message']}\n"
                f"场景分析：{json.dumps(state['analysis'], ensure_ascii=False)}\n"
                f"数据库查询结果：{json.dumps(tool_outputs, ensure_ascii=False, default=str)}\n\n"
                "请基于这些结果直接作答。如果多组数据冲突，优先说明差异，不要自行杜撰。"
            )
        ),
    ]
    response = llm.invoke(prompt)
    answer = response.content if isinstance(response, AIMessage) else str(response)
    return {"answer": answer}


@lru_cache(maxsize=1)
def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("initialize_state", initialize_state)
    graph.add_node("load_user_state", load_user_state)
    graph.add_node("analyze_state", analyze_state)
    graph.add_node("repair_order", repair_order_node)
    graph.add_node("inventory", inventory_node)
    graph.add_node("personnel", personnel_node)
    graph.add_node("knowledge", knowledge_node)
    graph.add_node("overview", overview_node)
    graph.add_node("general", general_node)
    graph.add_node("merge_branch_results", merge_branch_results)
    graph.add_node("no_data_node", no_data_node)
    graph.add_node("answer_node", answer_node)

    graph.add_edge(START, "initialize_state")
    graph.add_edge("initialize_state", "load_user_state")
    graph.add_edge("load_user_state", "analyze_state")
    graph.add_conditional_edges(
        "analyze_state",
        route_scenario,
        {
            "repair_order": "repair_order",
            "inventory": "inventory",
            "personnel": "personnel",
            "knowledge": "knowledge",
            "overview": "overview",
            "general": "general",
        },
    )
    graph.add_edge("repair_order", "merge_branch_results")
    graph.add_edge("inventory", "merge_branch_results")
    graph.add_edge("personnel", "merge_branch_results")
    graph.add_edge("knowledge", "merge_branch_results")
    graph.add_edge("overview", "merge_branch_results")
    graph.add_edge("general", "merge_branch_results")
    graph.add_conditional_edges(
        "merge_branch_results",
        route_post_query,
        {
            "no_data_node": "no_data_node",
            "answer_node": "answer_node",
        },
    )
    graph.add_edge("no_data_node", END)
    graph.add_edge("answer_node", END)
    return graph.compile()


def invoke_agent(message: str, history: List[Dict[str, str]], user_id: int | None) -> Dict[str, Any]:
    graph = build_graph()
    state = graph.invoke(
        {
            "message": (message or "").strip(),
            "history": sanitize_history(history),
            "user_id": user_id,
        }
    )
    return {
        "answer": state.get("answer", ""),
        "tools_used": state.get("tools_used", []),
        "scenario": state.get("analysis", {}).get("primary_scenario", "general"),
        "analysis": state.get("analysis", {}),
    }
