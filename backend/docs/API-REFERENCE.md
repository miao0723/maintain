# API Reference Documentation

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://api.yourdomain.com`

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer {access_token}
```

### Token Lifecycle

- **Access Token**: Valid for 2 hours
- **Refresh Token**: Valid for 7 days
- Use the refresh endpoint to get a new access token without re-authenticating

---

## Response Format

All API responses follow this structure:

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### Error Response

```json
{
  "code": 400,
  "message": "Error message",
  "data": null
}
```

---

## API Endpoints

### Authentication

#### Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "Bearer",
    "expires_in": 7200,
    "user": {
      "id": 1,
      "username": "admin",
      "real_name": "管理员",
      "role_type": "admin",
      "department_id": 1
    }
  }
}
```

#### Refresh Token
```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Get Profile
```
GET /api/auth/profile
```

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "real_name": "管理员",
    "phone": "13800138000",
    "email": "admin@example.com",
    "role_type": "admin",
    "department_id": 1,
    "department_name": "技术部",
    "last_login_at": "2025-03-24 10:30:00"
  }
}
```

#### Logout
```
POST /api/auth/logout
```

---

### Users

#### List Users
```
GET /api/users?page=1&pageSize=20&keyword=&role_type=&department_id=&status=
```

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `pageSize` (integer, default: 20) - Items per page
- `keyword` (string) - Search by username or real name
- `role_type` (string) - Filter by role type (admin/engineer/user)
- `department_id` (integer) - Filter by department
- `status` (integer) - Filter by status (1=active, 0=inactive)

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "username": "admin",
        "real_name": "管理员",
        "phone": "13800138000",
        "email": "admin@example.com",
        "role_type": "admin",
        "department_id": 1,
        "department_name": "技术部",
        "status": 1,
        "created_at": "2025-01-01 00:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

#### Get User Details
```
GET /api/users/{id}
```

#### Create User
```
POST /api/users
```

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "real_name": "新用户",
  "phone": "13900139000",
  "email": "newuser@example.com",
  "role_type": "engineer",
  "department_id": 2
}
```

#### Update User
```
PUT /api/users/{id}
```

**Request Body:**
```json
{
  "real_name": "更新姓名",
  "phone": "13900139000",
  "email": "updated@example.com",
  "role_type": "engineer",
  "department_id": 2,
  "status": 1
}
```

#### Delete User
```
DELETE /api/users/{id}
```

#### Reset Password
```
POST /api/users/{id}/reset-password
```

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

---

### Departments

#### List Departments
```
GET /api/departments
```

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "技术部",
        "description": "负责技术支持",
        "parent_id": null,
        "created_at": "2025-01-01 00:00:00"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20
  }
}
```

#### Get Department Details
```
GET /api/departments/{id}
```

#### Create Department
```
POST /api/departments
```

**Request Body:**
```json
{
  "name": "新部门",
  "description": "部门描述",
  "parent_id": null
}
```

#### Update Department
```
PUT /api/departments/{id}
```

#### Delete Department
```
DELETE /api/departments/{id}
```

---

### Devices

#### List Devices
```
GET /api/devices?page=1&pageSize=20&category_id=&department_id=&status=&keyword=
```

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `pageSize` (integer, default: 20) - Items per page
- `category_id` (integer) - Filter by category
- `department_id` (integer) - Filter by department
- `status` (string) - Filter by status (normal/fault/maintenance/scrapped)
- `keyword` (string) - Search by name or serial number

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "设备001",
        "serial_number": "SN001",
        "category_id": 1,
        "category_name": "数控机床",
        "department_id": 1,
        "department_name": "生产部",
        "status": "normal",
        "location": "车间A",
        "purchase_date": "2025-01-01",
        "warranty_expiry": "2026-01-01",
        "created_at": "2025-01-01 00:00:00"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

#### Get Device Details
```
GET /api/devices/{id}
```

#### Create Device
```
POST /api/devices
```

**Request Body:**
```json
{
  "name": "新设备",
  "serial_number": "SN002",
  "category_id": 1,
  "department_id": 1,
  "location": "车间B",
  "purchase_date": "2025-03-24",
  "warranty_expiry": "2026-03-24"
}
```

#### Update Device
```
PUT /api/devices/{id}
```

#### Delete Device
```
DELETE /api/devices/{id}
```

#### Get Device History
```
GET /api/devices/{id}/history
```

---

### Device Categories

#### List Categories
```
GET /api/devices/categories
```

#### Create Category
```
POST /api/devices/categories
```

**Request Body:**
```json
{
  "name": "新分类",
  "description": "分类描述"
}
```

#### Update Category
```
PUT /api/devices/categories/{id}
```

#### Delete Category
```
DELETE /api/devices/categories/{id}
```

---

### Work Orders

#### List Work Orders
```
GET /api/workorders?page=1&pageSize=20&status=&priority=&device_id=&assigned_to=&reporter_id=&start_date=&end_date=&keyword=
```

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `pageSize` (integer, default: 20) - Items per page
- `status` (string) - Filter by status (pending/assigned/in_progress/completed/verified/closed)
- `priority` (string) - Filter by priority (low/medium/high/urgent)
- `device_id` (integer) - Filter by device
- `assigned_to` (integer) - Filter by assigned engineer
- `reporter_id` (integer) - Filter by reporter
- `start_date` (date) - Filter by start date
- `end_date` (date) - Filter by end date
- `keyword` (string) - Search by title or description

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "设备故障维修",
        "description": "设备出现异常噪音",
        "device_id": 1,
        "device_name": "设备001",
        "status": "in_progress",
        "priority": "high",
        "reporter_id": 1,
        "reporter_name": "张三",
        "assigned_to": 2,
        "assigned_to_name": "李四",
        "estimated_cost": 500.00,
        "actual_cost": 0,
        "created_at": "2025-03-24 10:00:00"
      }
    ],
    "total": 30,
    "page": 1,
    "limit": 20
  }
}
```

#### Get Work Order Details
```
GET /api/workorders/{id}
```

#### Create Work Order
```
POST /api/workorders
```

**Request Body:**
```json
{
  "title": "设备故障维修",
  "description": "设备出现异常噪音，需要紧急处理",
  "device_id": 1,
  "priority": "high",
  "estimated_cost": 500.00
}
```

#### Update Work Order
```
PUT /api/workorders/{id}
```

#### Delete Work Order
```
DELETE /api/workorders/{id}
```

#### Assign Work Order
```
POST /api/workorders/{id}/assign
```

**Request Body:**
```json
{
  "assigned_to": 2
}
```

#### Accept Work Order
```
POST /api/workorders/{id}/accept
```

#### Start Work Order
```
POST /api/workorders/{id}/start
```

#### Complete Work Order
```
POST /api/workorders/{id}/complete
```

**Request Body:**
```json
{
  "completion_note": "维修完成，更换零件",
  "actual_cost": 450.00,
  "parts_used": [
    {
      "part_id": 1,
      "quantity": 2
    }
  ]
}
```

#### Verify Work Order
```
POST /api/workorders/{id}/verify
```

**Request Body:**
```json
{
  "verification_result": "passed",
  "verification_note": "验收合格"
}
```

#### Close Work Order
```
POST /api/workorders/{id}/close
```

#### Get My Work Orders
```
GET /api/workorders/my?page=1&pageSize=20
```

#### Get Work Order Statistics
```
GET /api/workorders/statistics?start_date=&end_date=
```

---

### Engineers

#### List Engineers
```
GET /api/engineers?page=1&pageSize=20
```

#### Get Engineer Details
```
GET /api/engineers/{id}
```

#### Create Engineer
```
POST /api/engineers
```

**Request Body:**
```json
{
  "user_id": 5,
  "specialization": "电气维修",
  "skill_level": "senior",
  "phone": "13900139000",
  "is_available": 1
}
```

#### Update Engineer
```
PUT /api/engineers/{id}
```

#### Delete Engineer
```
DELETE /api/engineers/{id}
```

#### Get Available Engineers
```
GET /api/engineers/available
```

#### Get Recommended Engineers
```
GET /api/engineers/recommend?device_id=1
```

#### Get Engineer Performance
```
GET /api/engineers/{id}/performance
```

---

### Schedules

#### List Schedules
```
GET /api/schedules?page=1&pageSize=20
```

#### Get Schedule Details
```
GET /api/schedules/{id}
```

#### Create Schedule
```
POST /api/schedules
```

**Request Body:**
```json
{
  "engineer_id": 1,
  "shift_date": "2025-03-25",
  "shift_type": "morning",
  "start_time": "08:00",
  "end_time": "12:00"
}
```

#### Update Schedule
```
PUT /api/schedules/{id}
```

#### Delete Schedule
```
DELETE /api/schedules/{id}
```

#### Get Schedule Overview
```
GET /api/schedules/overview?start_date=&end_date=
```

#### Batch Create Schedules
```
POST /api/schedules/batch
```

---

### Inspection Tasks

#### List Inspection Tasks
```
GET /api/inspections?page=1&pageSize=20
```

#### Get Inspection Task Details
```
GET /api/inspections/{id}
```

#### Create Inspection Task
```
POST /api/inspections
```

**Request Body:**
```json
{
  "device_id": 1,
  "task_type": "routine",
  "scheduled_date": "2025-03-25",
  "checklist": ["检查电源", "检查润滑", "检查安全装置"]
}
```

#### Update Inspection Task
```
PUT /api/inspections/{id}
```

#### Delete Inspection Task
```
DELETE /api/inspections/{id}
```

#### Execute Inspection
```
POST /api/inspections/{id}/execute
```

**Request Body:**
```json
{
  "result": "passed",
  "notes": "设备运行正常",
  "images": []
}
```

#### Get My Inspections
```
GET /api/inspections/my?page=1&pageSize=20
```

#### Get Overdue Inspections
```
GET /api/inspections/overdue
```

#### Get Inspection Statistics
```
GET /api/inspections/statistics
```

---

### Maintenance Plans

#### List Maintenance Plans
```
GET /api/maintenance/plans?page=1&pageSize=20
```

#### Get Maintenance Plan Details
```
GET /api/maintenance/plans/{id}
```

#### Create Maintenance Plan
```
POST /api/maintenance/plans
```

**Request Body:**
```json
{
  "device_id": 1,
  "plan_type": "preventive",
  "frequency": "monthly",
  "next_due_date": "2025-04-01",
  "description": "月度保养"
}
```

#### Update Maintenance Plan
```
PUT /api/maintenance/plans/{id}
```

#### Delete Maintenance Plan
```
DELETE /api/maintenance/plans/{id}
```

#### Execute Maintenance
```
POST /api/maintenance/plans/{id}/execute
```

#### Get Maintenance History
```
GET /api/maintenance/history?device_id=1
```

#### Get Due Maintenance
```
GET /api/maintenance/due
```

#### Get Maintenance Statistics
```
GET /api/maintenance/statistics
```

---

### Spare Parts

#### List Spare Parts
```
GET /api/parts?page=1&pageSize=20
```

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "轴承",
        "part_number": "P001",
        "category": "机械零件",
        "specification": "型号ABC",
        "unit": "个",
        "quantity": 50,
        "min_stock": 10,
        "unit_price": 100.00,
        "supplier_id": 1,
        "supplier_name": "供应商A",
        "location": "仓库A-01",
        "created_at": "2025-01-01 00:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

#### Get Spare Part Details
```
GET /api/parts/{id}
```

#### Create Spare Part
```
POST /api/parts
```

**Request Body:**
```json
{
  "name": "新配件",
  "part_number": "P002",
  "category": "电气零件",
  "specification": "规格XYZ",
  "unit": "个",
  "quantity": 20,
  "min_stock": 5,
  "unit_price": 150.00,
  "supplier_id": 1,
  "location": "仓库A-02"
}
```

#### Update Spare Part
```
PUT /api/parts/{id}
```

#### Delete Spare Part
```
DELETE /api/parts/{id}
```

#### Stock In
```
POST /api/parts/{id}/in
```

**Request Body:**
```json
{
  "quantity": 10,
  "note": "采购入库"
}
```

#### Stock Out
```
POST /api/parts/{id}/out
```

**Request Body:**
```json
{
  "quantity": 5,
  "note": "领料出库"
}
```

#### Get Stock Alerts
```
GET /api/parts/alerts
```

#### Get Stock Records
```
GET /api/parts/records?page=1&pageSize=20
```

#### Get Spare Part Statistics
```
GET /api/parts/statistics
```

---

### Suppliers

#### List Suppliers
```
GET /api/suppliers?page=1&pageSize=20
```

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "供应商A",
        "contact_person": "张三",
        "phone": "13800138000",
        "email": "contact@supplier-a.com",
        "address": "北京市朝阳区",
        "rating": 4.5,
        "status": "active",
        "created_at": "2025-01-01 00:00:00"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 20
  }
}
```

#### Get Supplier Details
```
GET /api/suppliers/{id}
```

#### Create Supplier
```
POST /api/suppliers
```

**Request Body:**
```json
{
  "name": "新供应商",
  "contact_person": "李四",
  "phone": "13900139000",
  "email": "contact@new-supplier.com",
  "address": "上海市浦东新区"
}
```

#### Update Supplier
```
PUT /api/suppliers/{id}
```

#### Delete Supplier
```
DELETE /api/suppliers/{id}
```

#### Get Supplier Statistics
```
GET /api/suppliers/statistics
```

#### Get Supplier Parts
```
GET /api/suppliers/{id}/parts
```

---

### Knowledge Base

#### List Knowledge Articles
```
GET /api/knowledge?page=1&pageSize=20
```

#### Get Article Details
```
GET /api/knowledge/{id}
```

#### Create Article
```
POST /api/knowledge
```

**Request Body:**
```json
{
  "title": "设备维修指南",
  "category": "维修技术",
  "content": "详细的维修步骤...",
  "tags": ["维修", "指南"],
  "device_category_id": 1
}
```

#### Update Article
```
PUT /api/knowledge/{id}
```

#### Delete Article
```
DELETE /api/knowledge/{id}
```

#### Search Knowledge
```
GET /api/knowledge/search?keyword=维修
```

#### Get Hot Articles
```
GET /api/knowledge/hot
```

#### Get Knowledge Statistics
```
GET /api/knowledge/statistics
```

---

### Cost Analysis

#### Get Cost Overview
```
GET /api/costs/overview?start_date=&end_date=
```

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total_cost": 50000.00,
    "maintenance_cost": 30000.00,
    "parts_cost": 15000.00,
    "labor_cost": 5000.00,
    "period": "2025-01-01 to 2025-03-24"
  }
}
```

#### Get Cost Trend
```
GET /api/costs/trend?dimension=day&limit=30&start_date=&end_date=
```

#### Get Top Devices by Cost
```
GET /api/costs/top-devices?limit=10&start_date=&end_date=
```

#### Get Department Cost Statistics
```
GET /api/costs/department-stats?start_date=&end_date=
```

#### Get Cost Type Analysis
```
GET /api/costs/cost-type-analysis?start_date=&end_date=
```

#### Get Top Parts by Cost
```
GET /api/costs/top-parts?limit=10&start_date=&end_date=
```

#### Get Comprehensive Report
```
GET /api/costs/comprehensive?start_date=&end_date=
```

---

### Reports

#### Get Report Types
```
GET /api/reports/types
```

#### Generate Device Report
```
GET /api/reports/device?start_date=&end_date=&department_id=
```

#### Generate Maintenance Report
```
GET /api/reports/maintenance?start_date=&end_date=
```

#### Generate Inventory Report
```
GET /api/reports/inventory
```

#### Generate Cost Report
```
GET /api/reports/cost?start_date=&end_date=
```

#### Generate Custom Report
```
GET /api/reports/{type}?params=
```

---

### Notifications

#### List Notifications
```
GET /api/notifications?page=1&pageSize=20
```

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "工单待处理",
        "content": "您有新的工单待处理",
        "type": "workorder",
        "is_read": false,
        "created_at": "2025-03-24 10:00:00"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

#### Get Unread Count
```
GET /api/notifications/unread-count
```

#### Mark as Read
```
POST /api/notifications/mark-read/{id}
```

#### Mark All as Read
```
POST /api/notifications/mark-all-read
```

#### Delete Notification
```
DELETE /api/notifications/{id}
```

#### Clear Read Notifications
```
DELETE /api/notifications/clear-read
```

#### Create Notification
```
POST /api/notifications/create
```

#### Batch Create Notifications
```
POST /api/notifications/create-batch
```

#### Check Stock Alerts
```
POST /api/notifications/check-stock-alerts
```

#### Check Maintenance Due
```
POST /api/notifications/check-maintenance
```

#### Get Notification Statistics
```
GET /api/notifications/statistics
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "code": 401,
  "message": "Token已过期或无效",
  "data": null
}
```

### 422 Validation Error
```json
{
  "code": 422,
  "message": "用户名不能为空",
  "data": null
}
```

### 500 Server Error
```json
{
  "code": 500,
  "message": "服务器内部错误",
  "data": null
}
```

---

## Rate Limiting

- **Default Limit**: 100 requests per minute per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Pagination

All list endpoints support pagination:

- `page` (default: 1) - Page number
- `pageSize` (default: 20) - Items per page (max: 100)

**Response includes:**
- `total` - Total number of items
- `page` - Current page number
- `pageSize` or `limit` - Items per page

---

## Filtering and Sorting

Most list endpoints support filtering:
- Use query parameters for filtering
- Multiple filters can be combined
- Date ranges use `start_date` and `end_date`

---

## Webhooks (Future)

Coming soon: Real-time notifications via webhooks.
