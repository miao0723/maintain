# Device Management API

## Base URL
```
http://your-domain/api
```

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer {access_token}
```

## Permissions
- `devices:view` - View devices and categories
- `devices:create` - Create devices and categories
- `devices:update` - Update devices and categories
- `devices:delete` - Delete devices and categories

---

## Device Endpoints

### List Devices
```http
GET /api/devices?page=1&limit=20&category_id=1&department_id=1&status=1&keyword=pump
```

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20
- `category_id` (optional): Filter by category
- `department_id` (optional): Filter by department
- `status` (optional): Filter by status (1=正常, 2=维修中, 3=停用)
- `keyword` (optional): Search in device_name or device_code

**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Get Device Detail
```http
GET /api/devices/{id}
```

### Create Device
```http
POST /api/devices
Content-Type: application/json

{
  "device_code": "DEV001",
  "device_name": "离心泵",
  "model": "IS50-32-125",
  "category_id": 1,
  "department_id": 1,
  "location": "车间A区",
  "purchase_date": "2024-01-15",
  "warranty_date": "2026-01-15",
  "status": 1
}
```

### Update Device
```http
PUT /api/devices/{id}
Content-Type: application/json

{
  "location": "车间B区",
  "status": 2
}
```

### Delete Device
```http
DELETE /api/devices/{id}
```

### Get Device History
```http
GET /api/devices/{id}/history
```

---

## Category Endpoints

### List Categories
```http
GET /api/devices/categories
```

### Create Category
```http
POST /api/devices/categories
Content-Type: application/json

{
  "name": "泵类",
  "icon": "pump"
}
```

### Update Category
```http
PUT /api/devices/categories/{id}
Content-Type: application/json

{
  "name": "水泵",
  "icon": "water-pump"
}
```

### Delete Category
```http
DELETE /api/devices/categories/{id}
```
