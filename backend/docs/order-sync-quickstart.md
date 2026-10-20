# 小程序订单同步接口（服务器 zych.net.cn / 本地 8080，实测 2026-10-19）

## 基本信息

| 项 | 值 |
|----|----|
| 接口地址 | `https://zych.net.cn/api/open/orders/repair`（维修）<br>`https://zych.net.cn/api/open/orders/recycle`（回收） |
| 方法 | GET |
| 鉴权 | 固定 Bearer Token（**无需登录**，直接带 Token 调用） |
| 本地调试地址 | `http://localhost:8080/api/open/orders/repair` 等同理 |
| 服务 Token | 来自 `.env` 的 `SYNC_API_KEY`，向管理员获取（默认 `openSyncToken_7c3f9a2e5b8410d6f2a9c7e1b3d5f8a0`） |
| 订单类型 | `repair`=维修订单；`recycle`=回收订单（对应上面两个地址） |

## 调用（一步，无需登录）

Token 有三种传法，任选其一：HTTP 头 `Authorization: Bearer <token>`（推荐）、HTTP 头 `X-Api-Key: <token>`、或查询参数 `?access_token=<token>`。

```bash
# 维修订单：分页 + 增量（按更新时间）
curl -sk "https://zych.net.cn/api/open/orders/repair?page=1&page_size=100&time_field=updated_at&start_time=2026-10-19%2009:00:00" \
  -H "Authorization: Bearer openSyncToken_7c3f9a2e5b8410d6f2a9c7e1b3d5f8a0"

# 回收订单：按状态筛选
curl -sk "https://zych.net.cn/api/open/orders/recycle?status=completed&page=1&page_size=50" \
  -H "Authorization: Bearer openSyncToken_7c3f9a2e5b8410d6f2a9c7e1b3d5f8a0"
```

> 不带 Token 会直接返回 `401 UNAUTHORIZED`。本地调试可把 `-H "Authorization: ..."` 换成 `?access_token=...`。

## 返回结构

```json
{
  "code": 0,
  "error_code": "SUCCESS",
  "message": "success",
  "data": {
    "list": [ /* 订单数组，见下方单人字段 */ ],
    "total": 51,
    "page": 1,
    "page_size": 20,
    "has_more": true,
    "time_field": "updated_at"
  }
}
```

失败示例（如 Token 无效 / 参数非法）：

```json
{ "code": 1, "error_code": "UNAUTHORIZED", "message": "缺少或无效的访问令牌", "data": null }
```

错误码对照：`UNAUTHORIZED`→401（Token 问题）、`INVALID_PARAM`→400（参数非法）、`INTERNAL_ERROR`→500（服务异常）。

## 单条订单字段（list[] 内，常用字段加粗）

| 字段 | 说明 | 实测值示例 |
|------|------|-----------|
| **order_no** | 订单号（业务关联主键，upsert 用它） | `ORD1787274787805FNER30` |
| **status** / status_label | 状态 / 中文标签 | `completed` / 已完成 |
| **order_type** / order_type_label | 订单类型 / 中文标签 | `repair` / 维修 |
| **user** | 用户对象（id / name / phone / email） | `{id:27, name:"在路上", phone:"136...", email:""}` |
| **amount** | 金额对象（estimated / actual / final 三档，final 实付优先） | `{estimated:584, actual:600, final:600}` |
| **created_at** / **updated_at** / completed_at | 创建 / 更新 / 完成时间 | `2026-08-21 09:13:07` |
| device | 设备（type/type_label/model/brand/condition） | 电脑 / MacBook Pro 14" / 苹果 |
| service_type / service_type_label | 服务方式（shop 到店等）/ 中文标签 | `shop` / 到店 |
| progress | 进度 | 0 |
| priority / priority_label | 优先级 / 中文标签 | 0 / 未设置 |
| problem_description | 故障描述 | 屏幕破损/花屏/闪屏 |
| custom_description | 自定义描述 | 空 |
| images | 图片（已归一为 `/uploads/...` 路径数组） | `[]` |
| contact | 联系人（name/phone/address） | 可能为 null |
| assigned_user_name | 指派人员姓名 | 可能为 null |

## Python 示例

```python
import requests

base = "https://zych.net.cn/api"
TOKEN = "openSyncToken_7c3f9a2e5b8410d6f2a9c7e1b3d5f8a0"
headers = {"Authorization": f"Bearer {TOKEN}"}

# 增量拉取：按 updated_at 分页直到 has_more=False
last_time = "2026-10-19 09:00:00"
page = 1
while True:
    r = requests.get(f"{base}/open/orders/repair", headers=headers,
                     params={"time_field": "updated_at", "start_time": last_time,
                             "page": page, "page_size": 100})
    data = r.json()["data"]
    for o in data["list"]:
        print(o["order_no"], o["status"], o["amount"]["final"], o["user"]["name"])
        # 以 order_no 为主键 upsert 到你的本地库
    if not data["has_more"]:
        break
    page += 1
```

## 三个注意事项

1. **Token 安全**：接口用固定 Token（不是 JWT 登录），泄露即等于开放只读访问。生产环境请改 `.env` 的 `SYNC_API_KEY` 为高强度随机串，通过密钥管理下发，**不要明文进代码仓库或前端页面**；Token 改动即时生效，无需清缓存。
2. **只读、不影响业务**：接口仅做 SELECT 查询，不写入、不修改任何订单数据，与后台「小程序订单」页面同源（`repair` 库 `orders` 表），可放心集成；若生产开启了路由缓存，改 `route/app.php` 后需执行 `php think clear`。
3. **增量与分页**：定时同步建议维护「上次最大更新时间」，用 `time_field=updated_at & start_time=<上次时间>` 拉取，以 `order_no` 为主键 upsert；分页是否结束看 `data.has_more` 或比较 `page*page_size < total`；回查历史可改用 `time_field=created_at` + 创建时间区间。状态筛选取值：`pending/quoted/confirmed/processing/review/completed/cancelled`。

数据源头就是 `repair` 库这一张 `orders` 表（维修 + 回收同表、靠 `order_type` 区分），后台「小程序订单」页面、智能体查单用的都是它。
