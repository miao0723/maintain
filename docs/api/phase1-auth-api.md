# Phase 1 API Documentation - Authentication & User Management

## Base URL
```
http://localhost/api/v1
```

## Authentication

All endpoints except `/auth/login` and `/auth/refresh` require JWT authentication.

### Headers
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

---

## Authentication Endpoints

### 1. Login
**POST** `/auth/login`

Login with username and password.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
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
      "real_name": "系统管理员",
      "role_type": 1,
      "department_id": null
    }
  }
}
```

**Errors:**
- 401: 用户名或密码错误
- 403: 账号已被禁用

---

### 2. Refresh Token
**POST** `/auth/refresh`

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "Token 刷新成功",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "Bearer",
    "expires_in": 7200
  }
}
```

---

### 3. Logout
**POST** `/auth/logout`

Logout current user and revoke refresh token.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "登出成功",
  "data": null
}
```

---

### 4. Get Profile
**GET** `/auth/profile`

Get current user profile.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "real_name": "系统管理员",
    "phone": "13800138000",
    "email": "admin@cmms.com",
    "role_type": 1,
    "department_id": null,
    "department_name": null,
    "last_login_at": "2026-03-19 10:30:00"
  }
}
```

---

## User Management Endpoints

### 5. Get User List
**GET** `/users`

Get paginated list of users.

**Query Parameters:**
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 20)
- `keyword`: Search by username, real name, or phone
- `role_type`: Filter by role type (1: Admin, 2: Dept Manager, 3: Engineer, 4: User)
- `department_id`: Filter by department
- `status`: Filter by status (1: Active, 0: Disabled)

**Response (200):**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "username": "admin",
        "real_name": "系统管理员",
        "phone": "13800138000",
        "email": "admin@cmms.com",
        "role_type": 1,
        "department_id": null,
        "status": 1,
        "created_at": "2026-03-19 00:00:00"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 6. Get User Detail
**GET** `/users/{id}`

Get detailed information about a specific user.

**Response (200):**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "real_name": "系统管理员",
    "phone": "13800138000",
    "email": "admin@cmms.com",
    "role_type": 1,
    "department_id": null,
    "department": null,
    "status": 1,
    "created_at": "2026-03-19 00:00:00"
  }
}
```

---

### 7. Create User
**POST** `/users`

Create a new user.

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "real_name": "新用户",
  "phone": "13900139000",
  "email": "newuser@example.com",
  "role_type": 4,
  "department_id": 1
}
```

**Response (201):**
```json
{
  "code": 201,
  "message": "用户创建成功",
  "data": {
    "id": 2,
    "username": "newuser",
    "real_name": "新用户",
    "phone": "13900139000",
    "email": "newuser@example.com",
    "role_type": 4,
    "department_id": 1,
    "status": 1
  }
}
```

**Errors:**
- 422: Validation error
- 500: Username already exists

---

### 8. Update User
**PUT** `/users/{id}`

Update user information.

**Request Body:**
```json
{
  "real_name": "更新姓名",
  "phone": "13900139999",
  "email": "updated@example.com",
  "role_type": 3,
  "department_id": 2,
  "status": 1
}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "用户更新成功",
  "data": {
    "id": 2,
    "real_name": "更新姓名",
    "phone": "13900139999",
    "email": "updated@example.com",
    "role_type": 3,
    "department_id": 2
  }
}
```

---

### 9. Delete User
**DELETE** `/users/{id}`

Delete a user.

**Response (200):**
```json
{
  "code": 200,
  "message": "用户删除成功",
  "data": null
}
```

**Errors:**
- 500: Cannot delete admin user

---

### 10. Reset Password
**POST** `/users/{id}/reset-password`

Reset user password.

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

**Response (200):**
```json
{
  "code": 200,
  "message": "密码重置成功",
  "data": null
}
```

---

## Department Management Endpoints

### 11. Get Department List
**GET** `/departments`

Get tree structure of all departments.

**Response (200):**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "技术部",
      "parent_id": null,
      "manager_id": 1,
      "sort_order": 1,
      "status": 1,
      "children": [
        {
          "id": 2,
          "name": "维修组",
          "parent_id": 1,
          "manager_id": 2,
          "sort_order": 1,
          "status": 1,
          "children": []
        }
      ]
    }
  ]
}
```

---

### 12. Create Department
**POST** `/departments`

Create a new department.

**Request Body:**
```json
{
  "name": "新部门",
  "parent_id": 1,
  "manager_id": 2,
  "sort_order": 1
}
```

**Response (201):**
```json
{
  "code": 201,
  "message": "部门创建成功",
  "data": {
    "id": 3,
    "name": "新部门",
    "parent_id": 1,
    "manager_id": 2,
    "sort_order": 1,
    "status": 1
  }
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "code": 400,
  "message": "Error message",
  "data": null
}
```

### Common Error Codes
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized / Token expired
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error