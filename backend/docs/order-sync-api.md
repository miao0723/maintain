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

---

## 7. 部署与缓存注意
- 后端 PHP 源码通过卷挂载，**改动即时生效**，无需重建镜像。
- 若生产环境开启了路由缓存（`route_cache`），修改 `route/app.php` 后需执行：
  ```bash
  php think clear        # 或 php think route:clear
  ```
- Token 修改后无需清缓存，下次请求即时生效（读 `env('SYNC_API_KEY')`）。

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
