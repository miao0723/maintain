# 小程序订单对外只读同步接口（Open Order Sync API）

> 供外部系统（如数据中台、ERP、BI）**定时拉取**小程序维修/回收订单的只读接口。
> 复用现有 `RepairOrderService` 的查询与字段映射逻辑，数据结构与后台「小程序订单」页面（`/repair/orders/miniprogram`）保持一致。
> **所有接口均为只读 SELECT，不写入、不修改任何业务数据。**

---

## 1. 数据模型与核心字段

订单数据来自 **`repair` 数据库**的 `orders` 表（小程序端订单库，与 CMMS 主库 `cmms_db` 分离）。

### 订单类型（`order_type`）
| 取值 | 含义 | 对应接口 |
|------|------|----------|
| `repair` | 维修订单 | `/api/open/orders/repair` |
| `recycle` | 回收订单 | `/api/open/orders/recycle` |

### 订单状态（`status` 枚举）
`pending`(待处理) / `quoted`(待确认报价) / `confirmed`(已确认报价) / `processing`(维修中) / `review`(待验收) / `completed`(已完成) / `cancelled`(已取消)

### 金额字段
- `estimated_price` 预估金额
- `actual_price` 实付金额（为空时取预估）
- 接口统一归并为 `amount.estimated / amount.actual / amount.final`（实付优先）

### 用户信息
来自 `repair.users` 表，经 `RepairOrderService::enrichOrderList` 关联补全：
`user.id / name(昵称或真实姓名) / phone / email`。

---

## 2. 接口鉴权

采用**固定 Token** 机制（`SyncAuth` 中间件），未携带或 Token 无效一律返回 `401`。

Token 从以下位置按优先级读取：
1. `Authorization: Bearer <token>`（HTTP Header）
2. `X-Api-Key: <token>`（HTTP Header）
3. `?access_token=<token>`（Query 参数，便于脚本/调试）

合法 Token 由环境变量 `SYNC_API_KEY` 配置（**逗号分隔可配多个**）。当前 `.env` 默认值为：

```
SYNC_API_KEY=openSyncToken_7c3f9a2e5b8410d6f2a9c7e1b3d5f8a0
```

> ⚠️ 生产环境请替换为高强度随机串，并通过密钥管理下发，不要明文提交到代码仓库。
> 留空 `SYNC_API_KEY` 时接口拒绝一切外部访问（fail-closed）。

**Token 存放位置（部署注意）**：`SYNC_API_KEY` 可放在项目根 `.env` 文件的**任意位置**（含已有的 `[DATABASE]` / `[JWT]` 等节内均可），中间件会直接解析原始 `.env` 文件，不依赖 ThinkPHP 的 INI 节解析；也支持容器环境变量（docker-compose `env_file` / `.env.docker`）与 `PHP_` 前缀。多来源取并集，任一配置即可生效。

**鉴权失败排查**：返回 `401 UNAUTHORIZED` 时，响应 `data` 会附带两个布尔字段帮助定位：
- `configured=false` → 服务端没读到 Token 配置（`SYNC_API_KEY` 未设置或未生效，需检查 `.env` / 容器环境变量并重启 PHP）。
- `received=false` → 请求未携带任何凭证（检查是否带了 `access_token` 或对应 Header）。
- `received=true` 且 `configured=true` → Token 不匹配（复制时多了空格 / 换行）。

---

## 3. 统一响应格式

**成功：**
```json
{
  "code": 0,
  "error_code": "SUCCESS",
  "message": "success",
  "data": {
    "list": [ /* 订单数组，见第 5 节 */ ],
    "total": 51,
    "page": 1,
    "page_size": 20,
    "has_more": true,
    "time_field": "updated_at"
  }
}
```

**失败：**
```json
{
  "code": 1,
  "error_code": "INVALID_PARAM",   // 或 UNAUTHORIZED / INTERNAL_ERROR
  "message": "参数错误：status 非法，可选值：pending,quoted,...",
  "data": null
}
```

| 字段 | 说明 |
|------|------|
| `code` | 业务状态码：`0`=成功，非 `0`=失败 |
| `error_code` | 机器可读错误码（`SUCCESS` / `UNAUTHORIZED` / `INVALID_PARAM` / `INTERNAL_ERROR`） |
| `message` | 人类可读消息 |
| `data.list` | 订单数据数组 |
| `data.total` | 满足条件的总数（用于判断分页拉取是否结束） |
| `data.has_more` | 是否还有下一页（`page*page_size < total`） |
| `data.time_field` | 本次增量同步依据的时间字段 |

**错误码与 HTTP 状态对照：**
| error_code | HTTP | 触发场景 |
|------------|------|----------|
| `UNAUTHORIZED` | 401 | 缺少/无效 Token |
| `INVALID_PARAM` | 400 | 参数非法（status / time_field / 时间格式 / 区间） |
| `INTERNAL_ERROR` | 500 | 服务内部异常（已兜底，不暴露细节） |

---

## 4. 接口清单

> 所有路径前缀为 `/api`（线上经网关 `zych.net.cn`；本地 `http://localhost:8080/api`）。

### 4.1 维修订单同步
- **请求路径**：`/api/open/orders/repair`
- **请求方式**：`GET`

### 4.2 回收订单同步
- **请求路径**：`/api/open/orders/recycle`
- **请求方式**：`GET`

### 4.3 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `access_token` | string | 否* | - | 鉴权 Token（也可放 Header）。*建议放 Header，Query 仅调试用 |
| `page` | int | 否 | 1 | 页码，从 1 开始；<1 时按 1 处理 |
| `page_size` | int | 否 | 20 | 每页条数；范围 1–100，超出自动截断为 100 |
| `status` | string | 否 | - | 按状态筛选，取值见第 1 节枚举 |
| `time_field` | string | 否 | `updated_at` | 增量同步依据：`created_at` 或 `updated_at` |
| `start_time` | string | 否 | - | 增量起始时间，格式 `Y-m-d` 或 `Y-m-d H:i:s` |
| `end_time` | string | 否 | - | 增量结束时间，需 ≥ `start_time` |
| `order_no` | string | 否 | - | 订单号模糊搜索（匹配 `orders.order_id`） |

### 4.4 参数校验与异常处理
- `page` / `page_size` 非法时按安全默认值处理（不报错中断）。
- `status` 不在枚举内 → `INVALID_PARAM`。
- `time_field` 非 `created_at`/`updated_at` → `INVALID_PARAM`。
- `start_time` / `end_time` 格式非法或 `start_time > end_time` → `INVALID_PARAM`。
- 未携带/无效 Token → `UNAUTHORIZED`（401）。
- 任何未预期异常 → `INTERNAL_ERROR`（500），并记录日志，不向调用方泄露内部细节。

---

## 5. 返回字段示例（单条订单对象）

```json
{
  "id": 109,
  "order_no": "ORD1787274787805FNER30",
  "order_type": "repair",
  "order_type_label": "维修",
  "status": "completed",
  "status_label": "已完成",
  "progress": 0,
  "user": {
    "id": 27,
    "name": "在路上",
    "phone": "13632804119",
    "email": ""
  },
  "device": {
    "type": 2,
    "type_label": "电脑",
    "model": "MacBook Pro 14\"",
    "brand": "苹果",
    "condition": "normal"
  },
  "service_type": "shop",
  "service_type_label": "到店",
  "priority": 0,
  "priority_label": "未设置",
  "amount": {
    "estimated": 584,
    "actual": 600,
    "final": 600
  },
  "problem_description": "屏幕破损/花屏/闪屏",
  "custom_description": "",
  "images": [],
  "contact": {
    "name": null,
    "phone": null,
    "address": null
  },
  "assigned_user_name": null,
  "created_at": "2026-08-21 09:13:07",
  "updated_at": "2026-08-24 14:19:08",
  "completed_at": null
}
```

> `images` 已做路径归一化（统一为 `/uploads/...` 可访问路径）；`device.type_label` 仅对 1–5 有内置中文映射，其它值返回 `null`。

### 5.1 单条订单字段说明表

`list[]` 中每个对象字段如下（维修 / 回收完全一致，仅 `order_type` 取值不同）：

| 字段路径 | 类型 | 说明 |
|----------|------|------|
| `id` | int | 订单主键 ID（repair 库 orders 表自增 ID） |
| `order_no` | string | 订单号（对应 `orders.order_id`） |
| `order_type` | string | 订单类型：`repair`=维修 / `recycle`=回收 |
| `order_type_label` | string | 类型中文名：维修 / 回收 |
| `status` | string | 订单状态英文（枚举见第 1 节） |
| `status_label` | string | 状态中文名 |
| `progress` | int | 进度百分比（0–100） |
| `user.id` | int\|null | 下单用户 ID |
| `user.name` | string\|null | 用户昵称 / 姓名 |
| `user.phone` | string\|null | 用户手机号 |
| `user.email` | string\|null | 用户邮箱 |
| `device.type` | int\|null | 设备类型枚举值 |
| `device.type_label` | string\|null | 设备类型中文名（1–5 有内置映射，其余为 `null`） |
| `device.model` | string | 设备型号 |
| `device.brand` | string\|null | 品牌 |
| `device.condition` | string\|null | 成色（如 normal/new/old/poor） |
| `service_type` | string\|null | 服务方式（如 shop=到店） |
| `service_type_label` | string\|null | 服务方式中文名 |
| `priority` | int\|null | 优先级（0 未设置 / 1 低 / 2 中 / 3 高） |
| `priority_label` | string\|null | 优先级中文名 |
| `amount.estimated` | float\|null | 预估金额（元） |
| `amount.actual` | float\|null | 实付金额（未支付 / 未结算为 `null`） |
| `amount.final` | float\|null | 最终金额（实付优先，无则取预估） |
| `problem_description` | string | 故障 / 问题描述 |
| `custom_description` | string | 自定义描述 |
| `images` | string[] | 图片路径数组（已归一化为 `/uploads/...` 可访问路径，可能为空 `[]`） |
| `contact.name` | string\|null | 联系人姓名 |
| `contact.phone` | string\|null | 联系人电话 |
| `contact.address` | string\|null | 收货 / 联系地址 |
| `assigned_user_name` | string\|null | 指派处理人姓名 |
| `created_at` | string | 创建时间 `Y-m-d H:i:s` |
| `updated_at` | string | 更新时间 `Y-m-d H:i:s` |
| `completed_at` | string\|null | 完成时间（未完成为 `null`） |

> 金额单位为**元（人民币）**。`amount.final` 是给外部系统的最简字段：有实付取实付，否则取预估。

### 5.2 回收订单真实返回示例

`GET /api/open/orders/recycle?page=1&page_size=1` 的真实响应（已脱敏）：

```json
{
  "code": 0,
  "error_code": "SUCCESS",
  "message": "success",
  "data": {
    "list": [
      {
        "id": 162,
        "order_no": "RECTEST20260914154086",
        "order_type": "recycle",
        "order_type_label": "回收",
        "status": "completed",
        "status_label": "已完成",
        "progress": 100,
        "user": {
          "id": 3,
          "name": "王五",
          "phone": "13800138003",
          "email": "wangwu@example.com"
        },
        "device": {
          "type": 5,
          "type_label": "其他",
          "model": "AirPods Pro 2",
          "brand": null,
          "condition": "poor"
        },
        "service_type": "shop",
        "service_type_label": "到店",
        "priority": 0,
        "priority_label": "未设置",
        "amount": {
          "estimated": 573,
          "actual": 504,
          "final": 504
        },
        "problem_description": "耳机音频回收：屏幕划痕明显/电池效率低",
        "custom_description": "",
        "images": [],
        "contact": {
          "name": null,
          "phone": null,
          "address": null
        },
        "assigned_user_name": null,
        "created_at": "2026-09-14 15:40:01",
        "updated_at": "2026-09-17 15:41:49",
        "completed_at": null
      }
    ],
    "total": 111,
    "page": 1,
    "page_size": 1,
    "has_more": true,
    "time_field": "updated_at"
  }
}
```

> 回收与维修接口**返回结构完全一致**，差异仅在 `order_type` / `order_type_label`。外部系统可共用同一套解析逻辑，按 `order_type` 分流即可。

---

## 6. 对接示例（外部系统定时增量拉取）

以「每小时拉取一次最近更新的维修订单」为例：

```bash
# 拉取 2026-10-19 09:00 之后有更新的维修订单（第 1 页）
curl -G "https://zych.net.cn/api/open/orders/repair" \
  -H "Authorization: Bearer openSyncToken_7c3f9a2e5b8410d6f2a9c7e1b3d5f8a0" \
  -d "time_field=updated_at" \
  -d "start_time=2026-10-19 09:00:00" \
  -d "page=1" -d "page_size=100"
```

**推荐拉取策略（增量同步）：**
1. 维护本地「上次同步的最大 `updated_at`」。
2. 每次按 `time_field=updated_at & start_time=<上次最大时间>` 分页拉取，直到 `has_more=false`。
3. 以 `order_no` 为主键 upsert 到本地表。
4. 若需回查历史，可改用 `time_field=created_at` + 创建时间区间。

**回收订单拉取（仅换路径）：**
```bash
curl -G "https://zych.net.cn/api/open/orders/recycle" \
  -H "Authorization: Bearer openSyncToken_7c3f9a2e5b8410d6f2a9c7e1b3d5f8a0" \
  -d "time_field=updated_at" \
  -d "start_time=2026-09-01 00:00:00" \
  -d "page=1" -d "page_size=100"
```

**Python 增量拉取示例（维修 / 回收通用）：**
```python
import requests, time

BASE = "https://zych.net.cn/api/open/orders"
TOKEN = "openSyncToken_7c3f9a2e5b8410d6f2a9c7e1b3d5f8a0"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

def pull(order_type: str, since: str):
    """分页拉取某类型订单，返回全部订单列表。since 为上次最大 updated_at。"""
    all_rows, page = [], 1
    while True:
        r = requests.get(f"{BASE}/{order_type}", headers=HEADERS, params={
            "time_field": "updated_at",
            "start_time": since,
            "page": page,
            "page_size": 100,
        }, timeout=30)
        r.raise_for_status()
        body = r.json()
        if body["code"] != 0:
            raise RuntimeError(f"API 错误: {body}")
        rows = body["data"]["list"]
        all_rows.extend(rows)
        if not body["data"]["has_more"]:
            break
        page += 1
        time.sleep(0.2)  # 礼貌限速
    return all_rows

# 维修 + 回收一起拉
repair_orders = pull("repair", "2026-09-01 00:00:00")
recycle_orders = pull("recycle", "2026-09-01 00:00:00")
print(f"维修 {len(repair_orders)} 条，回收 {len(recycle_orders)} 条")
```

> 调用频率建议 ≤ 1 次 / 分钟（或按业务实际设置定时任务）；单次 `page_size` 最大 100。

---

## 7. 部署与缓存注意
- 后端 PHP 源码通过卷挂载，但 `SyncAuth.php` 等类文件可能被 **OPcache 缓存**，修改接口代码后需在 PHP 容器内 **重启 PHP（FPM）进程** 才能生效：
  ```bash
  # 容器内执行（或 docker compose restart php）
  docker compose restart php
  ```
- 若生产环境开启了路由缓存（`route_cache`），修改 `route/app.php` 后需执行：
  ```bash
  php think clear        # 或 php think route:clear
  ```
- **Token（`.env` 中的 `SYNC_API_KEY`）改动无需清缓存**：中间件每次请求都重新读取原始 `.env` 与容器环境变量，下次请求即时生效；改完 `.env` 后建议顺手重启一次 PHP 以防 OPcache 命中旧进程环境。

---

## 8. 涉及文件
| 文件 | 作用 |
|------|------|
| `app/middleware/SyncAuth.php` | 固定 Token 鉴权中间件 |
| `app/common/SyncResult.php` | 统一响应封装（code/error_code/message/data） |
| `app/service/OrderSyncService.php` | 只读同步查询（继承 `RepairOrderService`，复用 `enrichOrderList` 字段映射） |
| `app/controller/OrderSyncController.php` | `repair()` / `recycle()` 两个只读接口 + 参数校验 + 输出格式化 |
| `route/app.php` | 注册 `open/orders` 路由组（含 `SyncAuth` 中间件 + 跨域） |
| `.env` | `SYNC_API_KEY` 鉴权 Token 配置 |
