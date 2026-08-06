# 支付宝模拟支付功能测试说明

## 功能概述

本次更新为支付模块的支付宝测试页面添加了完整的模拟支付功能，允许开发者在不需要真实支付宝环境的情况下测试支付流程。

## 实现的功能

### 后端功能

#### 1. 创建订单时写入数据库
- 接口: `POST /api/payment/alipay/create`
- 功能: 创建支付订单时，将订单信息保存到 `cmms_online_payments` 表

#### 2. 模拟支付
- 接口: `POST /api/payment/alipay/mock`
- 功能: 将指定订单的状态改为"已支付"，生成模拟交易号
- 请求体:
```json
{
  "out_trade_no": "订单编号"
}
```

#### 3. 模拟取消订单
- 接口: `POST /api/payment/alipay/mock-cancel`
- 功能: 将指定订单的状态改为"已取消"
- 请求体:
```json
{
  "out_trade_no": "订单编号"
}
```

#### 4. 查询支付状态（已更新）
- 接口: `GET /api/payment/alipay/query?out_trade_no=订单编号`
- 功能: 从数据库读取真实的支付状态返回

### 前端功能

#### 1. 支付测试页面
- 路径: `/payment/alipay-test`
- 新增按钮:
  - **模拟支付**: 点击后调用模拟支付接口，将订单标记为已支付
  - **取消订单**: 点击后调用模拟取消接口，将订单标记为已取消（仅在订单为待支付状态时显示）

#### 2. 支付流程
1. 填写订单信息（标题、金额、描述）
2. 点击"创建支付订单"生成订单
3. 点击"模拟支付"按钮完成支付
4. 点击"查询支付状态"查看支付结果

## 测试步骤

### 1. 启动后端服务
```bash
cd d:/maintain/backend
php think run
```

### 2. 启动前端服务
```bash
cd d:/maintain/frontend-web
npm run dev
```

### 3. 访问测试页面
打开浏览器访问: `http://localhost:5173/payment/alipay-test`

### 4. 测试流程
1. 填写订单标题（如："维修服务费"）
2. 设置金额（默认 0.01 元）
3. 点击"创建支付订单"
4. 点击"模拟支付"按钮
5. 查看支付结果，状态应显示为"支付成功"
6. 点击"查询支付状态"再次验证

### 5. 测试取消订单流程
1. 创建新的订单
2. 点击"取消订单"按钮
3. 查看结果，状态应显示为"已取消"

## 数据库表结构

支付记录保存在 `cmms_online_payments` 表中：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键ID |
| order_no | VARCHAR(50) | 订单编号 |
| trade_no | VARCHAR(100) | 第三方交易流水号 |
| amount | DECIMAL(12,2) | 支付金额 |
| payment_method | ENUM | 支付方式（wechat/alipay/unionpay） |
| status | ENUM | 支付状态（pending/paid/cancelled/refunded） |
| paid_at | DATETIME | 支付时间 |
| cancelled_at | DATETIME | 取消时间 |
| remark | VARCHAR(500) | 备注 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

## 配置说明

在 `backend/.env` 文件中配置：

```env
# 支付宝配置
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=
ALIPAY_GATEWAY=https://openapi-sandbox.dl.alipaydev.com/gateway.do
ALIPAY_NOTIFY_URL=
ALIPAY_RETURN_URL=
ALIPAY_SANDBOX=true
ALIPAY_MOCK_MODE=true  # 设置为 true 启用模拟模式
```

## API 响应示例

### 模拟支付成功响应
```json
{
  "code": 200,
  "message": "模拟支付成功",
  "data": {
    "out_trade_no": "TEST2026052000001",
    "trade_no": "ALI20260520144530abc123",
    "total_amount": "0.01",
    "trade_status": "TRADE_SUCCESS",
    "gmt_payment": "2026-05-20 14:45:30",
    "mock_mode": true
  }
}
```

### 查询支付状态响应
```json
{
  "code": 200,
  "message": "查询成功（模拟数据）",
  "data": {
    "out_trade_no": "TEST2026052000001",
    "trade_no": "ALI20260520144530abc123",
    "subject": "维修服务费",
    "total_amount": "0.01",
    "buyer_logon_id": "sandboxbt01@sandbox.com",
    "trade_status": "TRADE_SUCCESS",
    "gmt_payment": "2026-05-20 14:45:30",
    "mock_mode": true
  }
}
```

## 代码文件清单

### 后端文件
- `backend/app/controller/AlipayTestController.php` - 支付宝测试控制器
- `backend/app/model/OnlinePayment.php` - 在线支付模型
- `backend/route/app.php` - 路由配置

### 前端文件
- `frontend-web/src/views/payment/AlipayTest.vue` - 支付宝测试页面

## 注意事项

1. 模拟模式仅在 `ALIPAY_MOCK_MODE=true` 时可用
2. 已支付的订单无法再次支付
3. 已支付的订单无法取消
4. 已退款的订单无法支付
5. 订单编号在系统中唯一，重复创建同一编号会更新原有订单

## 扩展建议

如需扩展功能，可以考虑：

1. 添加模拟退款功能
2. 支持批量模拟支付
3. 添加支付超时自动取消
4. 支付成功后自动关联业务订单
5. 添加支付通知回调接口
