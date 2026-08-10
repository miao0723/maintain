# 后端 API 修复说明

## 问题描述
用户选择地址后提交订单时报错：
```
POST http://192.168.8.72:3000/api/orders/create 404 (Not Found)
```

## 原因分析
后端缺少创建订单的 API 路由 `/orders/create`。

## 解决方案

### 1. 添加创建订单的路由
在 `backend/routes/orderRoutes.js` 中添加了 `POST /api/orders/create` 路由。

### 2. 路由功能
- ✅ 接收订单创建请求
- ✅ 验证必填字段（userId, orderType, deviceType, problem）
- ✅ 生成唯一订单号
- ✅ 处理品牌信息（查找或创建品牌ID）
- ✅ 处理地址信息（上门取件时）
  - 查找匹配的现有地址
  - 如果没有匹配，创建新地址
- ✅ 处理图片数据（JSON 格式）
- ✅ 插入订单到数据库
- ✅ 返回创建的订单信息

### 3. 请求参数
```javascript
{
  userId: number,              // 用户ID（自动从token获取）
  orderType: string,          // 订单类型（repair/recycle）
  deviceType: number,         // 设备类型ID
  problem: string,            // 问题描述
  description: string,        // 详细描述（可选）
  images: array,              // 图片列表（可选）
  serviceType: string,        // 服务类型（shop/home）
  brand: string,              // 品牌名称（可选）
  model: string,              // 型号（可选）
  estimatedPrice: number,     // 预估价格（可选）
  address: object,            // 地址信息（上门服务时需要）
  deviceCondition: string     // 设备状态（回收订单）
}
```

### 4. 地址对象格式
```javascript
{
  contactName: string,  // 联系人姓名
  contactPhone: string, // 联系电话
  province: string,     // 省份
  city: string,         // 城市
  district: string,     // 区县
  detail: string        // 详细地址
}
```

### 5. 响应格式
成功响应：
```json
{
  "success": true,
  "message": "订单创建成功",
  "data": {
    "order_id": "ORD1234567890ABCDEF",
    "order_id_numeric": 123,
    "estimated_price": 199,
    "order": {
      "id": 123,
      "order_no": "ORD1234567890ABCDEF",
      "user_id": 4,
      "order_type": "repair",
      "device_type": 1,
      "problem_description": "屏幕碎裂",
      // ... 其他订单字段
    }
  }
}
```

错误响应：
```json
{
  "success": false,
  "error": "缺少必填字段"
}
```

## 测试步骤

### 测试1：创建到店维修订单
1. 进入维修服务页面
2. 选择设备类型、品牌、型号、故障问题
3. 选择"到店维修"服务方式
4. 提交订单
5. 检查是否成功创建订单

### 测试2：创建上门取件订单（有地址）
1. 进入维修服务页面
2. 选择设备类型、品牌、型号、故障问题
3. 选择"上门取件"服务方式
4. 从地址列表中选择一个地址
5. 提交订单
6. 检查订单是否成功创建，地址信息是否正确保存

### 测试3：创建上门取件订单（新地址）
1. 进入维修服务页面
2. 选择设备类型、品牌、型号、故障问题
3. 选择"上门取件"服务方式
4. 点击"添加新地址"，创建一个新地址
5. 选择新地址
6. 提交订单
7. 检查订单是否成功创建，新地址是否同时保存到地址表

### 测试4：创建回收订单
1. 进入物品回收页面
2. 选择回收类型、品牌、输入型号、选择成色
3. 提交回收订单
4. 检查订单是否成功创建

## 注意事项

1. **服务器重启**：修改后端代码后需要重启 Node.js 服务器才能生效
   ```bash
   # 停止服务器（按 Ctrl+C）
   # 然后重新启动
   cd d:\电子维修2.0\backend
   node server.js
   ```

2. **地址处理逻辑**：
   - 如果选择了上门取件，地址会自动保存到 `user_addresses` 表
   - 系统会先查找是否有匹配的现有地址
   - 如果没有匹配，会创建新的地址记录
   - 订单表中会保存 `address_id` 关联

3. **订单号生成规则**：
   - 格式：`ORD` + 时间戳 + 随机字符串
   - 示例：`ORD1719435200000ABCDEF`

4. **订单默认值**：
   - 状态：`pending`
   - 进度：0
   - 优先级：`medium`

5. **错误处理**：
   - 缺少必填字段返回 400 错误
   - 服务器内部错误返回 500 错误
   - 错误信息会包含具体的错误原因

## 数据库表结构

### orders 表相关字段
```sql
- id: 订单ID（主键）
- order_id: 订单号（字符串）
- user_id: 用户ID
- order_type: 订单类型（repair/recycle）
- device_type: 设备类型ID
- problem_description: 问题描述
- custom_description: 详细描述
- images: 图片（JSON）
- service_type: 服务类型（shop/home）
- brand_id: 品牌ID
- device_model: 设备型号
- device_condition: 设备状态
- estimated_price: 预估价格
- actual_price: 实际价格
- status: 订单状态
- address_id: 地址ID（上门服务时）
- created_at: 创建时间
- updated_at: 更新时间
- progress: 进度（0-100）
- priority: 优先级
```

### user_addresses 表
```sql
- id: 地址ID（主键）
- user_id: 用户ID
- contact_name: 联系人姓名
- contact_phone: 联系电话
- province: 省份
- city: 城市
- district: 区县
- detail_address: 详细地址
- postal_code: 邮编
- is_default: 是否默认
- tags: 标签（JSON）
- created_at: 创建时间
- updated_at: 更新时间
```

## 验证方法

1. **查看后端日志**：检查是否有错误信息
2. **查看数据库**：检查 orders 表和 user_addresses 表是否有新记录
3. **查看小程序**：检查订单列表是否显示新创建的订单
4. **查看网络请求**：检查小程序开发者工具的网络面板，确认 API 调用成功
