import os
import socket
from typing import Any, Dict, List

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

BASE_DIR = os.path.dirname(__file__)

# 优先使用系统环境变量；本地开发时再从 .env 文件补齐缺失配置。
load_dotenv(os.path.join(BASE_DIR, ".env"), override=False)
load_dotenv(os.path.join(BASE_DIR, "..", "backend", ".env"), override=False)


def env(name: str, default: str = "") -> str:
    return os.getenv(name, default)


def can_resolve(host: str) -> bool:
    try:
        socket.gethostbyname(host)
        return True
    except OSError:
        return False


def resolve_db_host(host: str) -> str:
    if host in {"mysql", "mariadb"} and not can_resolve(host):
        return env("AGENT_DB_HOST_FALLBACK", "127.0.0.1")
    return host


def mysql_url(prefix: str) -> str:
    host = resolve_db_host(env(f"{prefix}_HOSTNAME", "127.0.0.1"))
    port = env(f"{prefix}_HOSTPORT", "3306")
    database = env(f"{prefix}_DATABASE", "")
    username = env(f"{prefix}_USERNAME", "root")
    password = env(f"{prefix}_PASSWORD", "")
    return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}?charset=utf8mb4"


CMMS_ENGINE = create_engine(mysql_url("DATABASE"), pool_pre_ping=True)
REPAIR_ENGINE = create_engine(mysql_url("REPAIR_DB"), pool_pre_ping=True)


def fetch_rows(engine, sql: str, params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
    with engine.connect() as conn:
        result = conn.execute(text(sql), params or {})
        return [dict(row._mapping) for row in result]


def fetch_one(engine, sql: str, params: Dict[str, Any] | None = None) -> Dict[str, Any] | None:
    rows = fetch_rows(engine, sql, params)
    return rows[0] if rows else None


def safe_fetch_rows(engine, sql: str, params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
    try:
        return fetch_rows(engine, sql, params)
    except Exception:
        return []


def fetch_rows_with_fallback(
    primary_engine,
    sql: str,
    params: Dict[str, Any] | None = None,
    *,
    fallback_engine=None,
) -> List[Dict[str, Any]]:
    try:
        return fetch_rows(primary_engine, sql, params)
    except Exception:
        if fallback_engine is None:
            raise
        return fetch_rows(fallback_engine, sql, params)


def query_user_context(user_id: int) -> Dict[str, Any]:
    repair_user = safe_fetch_rows(
        REPAIR_ENGINE,
        """
        SELECT id, username, nickname, real_name, phone, email, role, status
        FROM users
        WHERE id = :user_id
        LIMIT 1
        """,
        {"user_id": user_id},
    )
    recent_repair_orders = safe_fetch_rows(
        REPAIR_ENGINE,
        """
        SELECT id, order_id AS order_no, status, updated_at, device_model
        FROM orders
        WHERE assigned_to = :user_id OR quote_created_by = :user_id
        ORDER BY updated_at DESC, id DESC
        LIMIT 5
        """,
        {"user_id": user_id},
    )
    recent_cmms_orders = safe_fetch_rows(
        CMMS_ENGINE,
        """
        SELECT id, order_no, status, updated_at, fault_type
        FROM work_orders
        WHERE assigned_to = :user_id OR reporter_id = :user_id
        ORDER BY updated_at DESC, id DESC
        LIMIT 5
        """,
        {"user_id": user_id},
    )
    return {
        "repair_user": repair_user[0] if repair_user else None,
        "recent_repair_orders": recent_repair_orders,
        "recent_cmms_work_orders": recent_cmms_orders,
    }


def query_personnel(keyword: str, limit: int = 10) -> List[Dict[str, Any]]:
    return fetch_rows_with_fallback(
        REPAIR_ENGINE,
        """
        SELECT
            u.id,
            COALESCE(u.real_name, u.nickname, CONCAT('用户#', u.id)) AS name,
            u.nickname,
            u.real_name,
            u.phone,
            u.email,
            u.status,
            u.role,
            NULL AS department_name
        FROM users u
        WHERE
            COALESCE(u.real_name, '') LIKE :kw
            OR COALESCE(u.nickname, '') LIKE :kw
            OR COALESCE(u.phone, '') LIKE :kw
            OR COALESCE(u.email, '') LIKE :kw
            OR COALESCE(u.role, '') LIKE :kw
        ORDER BY u.role DESC, u.status DESC, u.id DESC
        LIMIT :limit
        """,
        {"kw": f"%{keyword}%", "limit": limit},
        fallback_engine=CMMS_ENGINE,
    )


def query_repair_personnel(keyword: str = "", limit: int = 10) -> List[Dict[str, Any]]:
    return fetch_rows_with_fallback(
        REPAIR_ENGINE,
        """
        SELECT
            u.id,
            COALESCE(u.real_name, u.nickname, CONCAT('用户#', u.id)) AS name,
            u.nickname,
            u.real_name,
            u.phone,
            u.email,
            u.status,
            u.role,
            NULL AS department_name
        FROM users u
        WHERE
            u.role IN ('admin', 'super_admin')
            AND (
                :kw = ''
                OR COALESCE(u.real_name, '') LIKE :like_kw
                OR COALESCE(u.nickname, '') LIKE :like_kw
                OR COALESCE(u.phone, '') LIKE :like_kw
                OR COALESCE(u.email, '') LIKE :like_kw
                OR COALESCE(u.role, '') LIKE :like_kw
            )
        ORDER BY
            CASE WHEN u.role = 'super_admin' THEN 0 ELSE 1 END,
            u.status DESC,
            u.id DESC
        LIMIT :limit
        """,
        {"kw": keyword, "like_kw": f"%{keyword}%", "limit": limit},
        fallback_engine=CMMS_ENGINE,
    )


def query_orders(keyword: str, limit: int = 10) -> List[Dict[str, Any]]:
    return fetch_rows(
        REPAIR_ENGINE,
        """
        SELECT
            id,
            order_id AS order_no,
            NULL AS customer_name,
            device_model AS machine_name,
            order_type AS repair_type,
            status AS repair_status,
            created_at,
            updated_at
        FROM orders
        WHERE order_id LIKE :kw
           OR device_model LIKE :kw
           OR problem_description LIKE :kw
           OR status LIKE :kw
        ORDER BY updated_at DESC, id DESC
        LIMIT :limit
        """,
        {"kw": f"%{keyword}%", "limit": limit},
    )


def query_repair_order_detail(order_id: int) -> List[Dict[str, Any]]:
    return fetch_rows(
        REPAIR_ENGINE,
        """
        SELECT
            o.id,
            o.order_id AS order_no,
            o.status,
            o.updated_at,
            o.created_at,
            o.progress,
            o.progress_updated_at,
            o.device_model,
            o.problem_description,
            o.assigned_to,
            COALESCE(u.real_name, u.nickname, CONCAT('用户#', o.assigned_to)) AS assigned_to_name
        FROM orders o
        LEFT JOIN users u ON u.id = o.assigned_to
        WHERE o.id = :order_id
        LIMIT 1
        """,
        {"order_id": order_id},
    )


def query_repair_order_workload(message: str, limit: int = 5) -> List[Dict[str, Any]]:
    wants_completed = any(token in message for token in ["完成", "已完成", "完工", "修好"])
    wants_quoted = "报价" in message or "quote" in message.lower()
    wants_pending = any(token in message for token in ["待处理", "待接单", "未完成", "处理中"])
    wants_top = not any(token in message for token in ["最少", "倒数"])
    aggregate_field = "quote_created_by" if wants_quoted else "assigned_to"

    extra_where = " AND o.order_type = 'repair' "
    if wants_completed:
        extra_where += " AND o.status = 'completed' "
    elif wants_quoted:
        extra_where += " AND o.quote_created_by IS NOT NULL "
    elif wants_pending:
        extra_where += " AND o.status IN ('pending', 'quoted', 'confirmed', 'processing') "

    return fetch_rows(
        REPAIR_ENGINE,
        f"""
        SELECT
            o.{aggregate_field} AS technician_id,
            COALESCE(u.real_name, u.nickname, CONCAT('用户#', o.{aggregate_field})) AS technician_name,
            COUNT(*) AS order_count,
            SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
            SUM(CASE WHEN o.status = 'processing' THEN 1 ELSE 0 END) AS processing_count,
            SUM(CASE WHEN o.status = 'quoted' THEN 1 ELSE 0 END) AS quoted_count
        FROM orders o
        LEFT JOIN users u ON u.id = o.{aggregate_field}
        WHERE o.{aggregate_field} IS NOT NULL
          AND o.{aggregate_field} <> 0
          {extra_where}
        GROUP BY o.{aggregate_field}, technician_name
        ORDER BY order_count {"DESC" if wants_top else "ASC"}, technician_id ASC
        LIMIT :limit
        """,
        {"limit": limit},
    )


def query_work_orders(keyword: str = "", limit: int = 10) -> List[Dict[str, Any]]:
    return fetch_rows(
        CMMS_ENGINE,
        """
        SELECT
            wo.id,
            wo.order_no,
            wo.fault_type,
            wo.fault_description,
            wo.priority,
            wo.status,
            wo.total_cost,
            wo.created_at,
            wo.updated_at,
            reporter.name AS reporter_name,
            assignee.name AS assigned_to_name
        FROM work_orders wo
        LEFT JOIN personnel reporter ON reporter.id = wo.reporter_id
        LEFT JOIN personnel assignee ON assignee.id = wo.assigned_to
        WHERE (:kw = '' OR wo.order_no LIKE :like_kw OR wo.fault_type LIKE :like_kw OR wo.fault_description LIKE :like_kw)
        ORDER BY wo.updated_at DESC, wo.id DESC
        LIMIT :limit
        """,
        {"kw": keyword, "like_kw": f"%{keyword}%", "limit": limit},
    )


def query_progress(order_id: int) -> List[Dict[str, Any]]:
    return fetch_rows_with_fallback(
        REPAIR_ENGINE,
        """
        SELECT
            id,
            order_id,
            stage AS progress_stage,
            stage_name AS progress_title,
            status,
            progress AS progress_percent,
            description,
            handler_name AS assigned_to_name,
            start_time AS started_at,
            end_time AS completed_at,
            updated_at
        FROM repair_progress
        WHERE order_id = :order_id
        ORDER BY id ASC
        """,
        {"order_id": order_id},
        fallback_engine=CMMS_ENGINE,
    )


def query_inventory(keyword: str = "", low_stock_only: bool = False, limit: int = 10) -> List[Dict[str, Any]]:
    conditions = []
    params: Dict[str, Any] = {"limit": limit}
    if keyword:
        conditions.append("(sp.part_name LIKE :kw OR sp.part_code LIKE :kw OR sp.specification LIKE :kw OR sp.description LIKE :kw)")
        params["kw"] = f"%{keyword}%"
    if low_stock_only:
        conditions.append("sp.stock_quantity <= sp.min_stock")

    where_sql = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    return fetch_rows_with_fallback(
        REPAIR_ENGINE,
        f"""
        SELECT
            sp.id,
            sp.part_code,
            sp.part_name,
            sp.specification,
            sp.stock_quantity,
            sp.min_stock,
            sp.purchase_price,
            s.name AS supplier_name
        FROM spare_parts sp
        LEFT JOIN suppliers s ON s.id = sp.supplier_id
        {where_sql}
        ORDER BY (sp.stock_quantity <= sp.min_stock) DESC, sp.stock_quantity ASC, sp.id DESC
        LIMIT :limit
        """,
        params,
        fallback_engine=CMMS_ENGINE,
    )


def query_suppliers(keyword: str = "", limit: int = 10) -> List[Dict[str, Any]]:
    return fetch_rows_with_fallback(
        REPAIR_ENGINE,
        """
        SELECT id, name, code, contact_person, contact_phone AS phone, contact_email AS email, status
        FROM suppliers
        WHERE (:kw = '' OR name LIKE :like_kw OR code LIKE :like_kw)
        ORDER BY status DESC, id DESC
        LIMIT :limit
        """,
        {"kw": keyword, "like_kw": f"%{keyword}%", "limit": limit},
        fallback_engine=CMMS_ENGINE,
    )


def query_supplier_inventory_ranking(limit: int = 10) -> List[Dict[str, Any]]:
    return fetch_rows_with_fallback(
        REPAIR_ENGINE,
        """
        SELECT
            s.id,
            s.name,
            s.code,
            COUNT(sp.id) AS part_count,
            COALESCE(SUM(sp.stock_quantity * sp.purchase_price), 0) AS inventory_value,
            COALESCE(SUM(sp.stock_quantity), 0) AS total_stock_quantity
        FROM suppliers s
        LEFT JOIN spare_parts sp ON sp.supplier_id = s.id
        GROUP BY s.id, s.name, s.code
        HAVING COUNT(sp.id) > 0
        ORDER BY inventory_value DESC, part_count DESC, s.id DESC
        LIMIT :limit
        """,
        {"limit": limit},
        fallback_engine=CMMS_ENGINE,
    )


def query_business_overview(keyword: str = "", limit: int = 10) -> Dict[str, Any]:
    return {
        "repair_categories": safe_fetch_rows(
            CMMS_ENGINE,
            """
            SELECT id, name, code, description, status
            FROM repair_categories
            WHERE (:kw = '' OR name LIKE :like_kw OR description LIKE :like_kw)
            ORDER BY sort ASC, id ASC
            LIMIT :limit
            """,
            {"kw": keyword, "like_kw": f"%{keyword}%", "limit": limit},
        ),
        "repair_machines": safe_fetch_rows(
            CMMS_ENGINE,
            """
            SELECT rm.id, rm.name, rm.model, rm.manufacturer, rm.status, rc.name AS category_name
            FROM repair_machines rm
            LEFT JOIN repair_categories rc ON rc.id = rm.category_id
            WHERE (:kw = '' OR rm.name LIKE :like_kw OR rm.model LIKE :like_kw OR rc.name LIKE :like_kw)
            ORDER BY rm.id DESC
            LIMIT :limit
            """,
            {"kw": keyword, "like_kw": f"%{keyword}%", "limit": limit},
        ),
        "repair_contracts": safe_fetch_rows(
            CMMS_ENGINE,
            """
            SELECT id, contract_number, customer_name, machine_type, annual_fee, status, sign_date, updated_at
            FROM repair_contracts
            WHERE (:kw = '' OR contract_number LIKE :like_kw OR customer_name LIKE :like_kw OR machine_type LIKE :like_kw OR service_content LIKE :like_kw)
            ORDER BY updated_at DESC, id DESC
            LIMIT :limit
            """,
            {"kw": keyword, "like_kw": f"%{keyword}%", "limit": limit},
        ),
        "repair_reports": safe_fetch_rows(
            CMMS_ENGINE,
            """
            SELECT
                id,
                order_id,
                order_no,
                report_number,
                machine_name,
                fault_description,
                repair_content,
                repairer_name,
                repair_date,
                completion_date,
                amount,
                status,
                remark,
                created_at
            FROM repair_reports
            WHERE (
                :kw = ''
                OR report_number LIKE :like_kw
                OR machine_name LIKE :like_kw
                OR fault_description LIKE :like_kw
                OR repair_content LIKE :like_kw
                OR repairer_name LIKE :like_kw
                OR remark LIKE :like_kw
            )
            ORDER BY id DESC
            LIMIT :limit
            """,
            {"kw": keyword, "like_kw": f"%{keyword}%", "limit": limit},
        ),
    }


def query_knowledge_overview(keyword: str = "", limit: int = 10) -> Dict[str, Any]:
    return {
        "collections": safe_fetch_rows(
            CMMS_ENGINE,
            """
            SELECT id, name, description, file_count, chunk_count, total_chars, status, created_at, updated_at
            FROM kb_collections
            WHERE (:kw = '' OR name LIKE :like_kw OR description LIKE :like_kw)
            ORDER BY id DESC
            LIMIT :limit
            """,
            {"kw": keyword, "like_kw": f"%{keyword}%", "limit": limit},
        ),
        "files": safe_fetch_rows(
            CMMS_ENGINE,
            """
            SELECT
                kf.id,
                kf.collection_id,
                kc.name AS collection_name,
                kf.original_name,
                kf.file_type,
                kf.file_size,
                kf.text_char_count,
                kf.chunk_count,
                kf.chunk_status,
                kf.created_at
            FROM kb_files kf
            LEFT JOIN kb_collections kc ON kc.id = kf.collection_id
            WHERE (
                :kw = ''
                OR kc.name LIKE :like_kw
                OR kf.original_name LIKE :like_kw
                OR kf.extracted_text LIKE :like_kw
            )
            ORDER BY kf.id DESC
            LIMIT :limit
            """,
            {"kw": keyword, "like_kw": f"%{keyword}%", "limit": limit},
        ),
        "chunks": safe_fetch_rows(
            CMMS_ENGINE,
            """
            SELECT
                kc.id,
                kc.collection_id,
                kf.original_name,
                LEFT(kc.content, 220) AS excerpt,
                kc.chunk_index,
                kc.created_at
            FROM kb_chunks kc
            LEFT JOIN kb_files kf ON kf.id = kc.file_id
            WHERE (
                :kw = ''
                OR kc.content LIKE :like_kw
                OR kf.original_name LIKE :like_kw
            )
            ORDER BY kc.id DESC
            LIMIT :limit
            """,
            {"kw": keyword, "like_kw": f"%{keyword}%", "limit": limit},
        ),
    }


def query_rag(question: str, limit: int = 5) -> List[Dict[str, Any]]:
    tokens = [token for token in question.split() if len(token) >= 2]
    if not tokens:
        tokens = [question[:20]] if question.strip() else ["知识库"]

    where_parts = []
    params: Dict[str, Any] = {"limit": limit}
    for index, token in enumerate(tokens[:4]):
        key = f"kw{index}"
        where_parts.append(f"(kc.content LIKE :{key} OR kf.original_name LIKE :{key})")
        params[key] = f"%{token}%"

    where_sql = " OR ".join(where_parts) if where_parts else "1=1"
    return fetch_rows(
        CMMS_ENGINE,
        f"""
        SELECT kc.content, kf.original_name
        FROM kb_chunks kc
        LEFT JOIN kb_files kf ON kf.id = kc.file_id
        WHERE {where_sql}
        ORDER BY kc.id DESC
        LIMIT :limit
        """,
        params,
    )
