# CMMS Backend API - 测试指南

## 📖 目录

1. [快速开始](#快速开始)
2. [环境设置](#环境设置)
3. [使用 Postman 测试](#使用-postman-测试)
4. [使用 Pest 测试框架](#使用-pest-测试框架)
5. [API 端点列表](#api-端点列表)
6. [常见问题](#常见问题)

---

## 🚀 快速开始

### 1. 启动 Docker 容器

```bash
cd docker
docker-compose up -d
```

### 2. 验证服务运行

```bash
# 检查容器状态
docker-compose ps

# 应该看到以下容器正在运行：
# - docker-mysql-1
# - docker-redis-1
# - docker-php-1
# - docker-nginx-1
```

### 3. 快速测试登录

```bash
# 使用 curl 测试登录
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 🔧 环境设置

### 开发环境

- **Base URL**: `http://localhost/api`
- **测试账号**: admin / admin123
- **数据库**: cmms_db (Docker MySQL)

### 生产环境

- **Base URL**: `https://api.yourdomain.com/api`
- **JWT Secret**: 请修改 `.env` 文件中的 `JWT_SECRET`

---

## 📮 使用 Postman 测试

### 1. 导入 Collection

1. 下载 Postman: https://www.postman.com/downloads/
2. 打开 Postman 应用
3. 点击 `Import` 按钮
4. 选择 `backend/docs/postman-collection.json`
5. 选择 `backend/docs/postman-environment.json`

### 2. 配置环境变量

导入的环境变量包含：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `base_url` | `http://localhost` | API 基础 URL |
| `access_token` | *(自动设置)* | 登录后自动获取 |

### 3. 运行测试

1. **单个请求测试**:
   - 展开 "Authentication" 文件夹
   - 点击 "Login" 请求
   - 点击 "Send" 按钮
   - 检查响应中的 `access_token`

2. **批量测试**:
   - 选择 Collection 名称
   - 点击 "Run" 按钮
   - 选择要运行的请求
   - 点击 "Run [Collection]"

### 4. 自动 Token 更新

Login 请求包含测试脚本，会自动：
- 保存 `access_token` 到环境变量
- 保存 `refresh_token` 到环境变量
- 验证响应状态

---

## 🧪 使用 Pest 测试框架

### 1. 运行所有测试

```bash
# 进入 Docker 容器
docker exec -it docker-php-1 bash

# 运行所有测试
./vendor/bin/pest

# 运行带详细输出的测试
./vendor/bin/pest --testdox

# 运行特定测试文件
./vendor/bin/pest tests/Feature/AuthTest.php

# 运行单元测试
./vendor/bin/pest --testsuite=Unit

# 运行功能测试
./vendor/bin/pest --testsuite=Feature
```

### 2. 从主机运行测试

```bash
# 使用 docker exec
docker exec docker-php-1 sh -c "cd /var/www/html && ./vendor/bin/pest"

# 使用 composer script
docker exec docker-php-1 sh -c "cd /var/www/html && composer test"
```

### 3. 生成测试覆盖率报告

```bash
docker exec docker-php-1 sh -c "cd /var/www/html && composer test:coverage"
```

### 4. 测试文件结构

```
backend/tests/
├── Unit/              # 单元测试
│   └── ExampleTest.php
├── Feature/           # 功能测试
│   ├── AuthTest.php       # 认证测试
│   ├── DepartmentTest.php # 部门测试
│   └── ExampleTest.php
├── BaseTestCase.php   # 基础测试类
├── TestCase.php       # Pest 基础类
└── Pest.php          # Pest 配置
```

---

## 📚 API 端点列表

### 认证模块

| 方法 | 端点 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/login` | 用户登录 | ❌ |
| POST | `/api/auth/refresh` | 刷新令牌 | ❌ |
| GET | `/api/auth/profile` | 获取个人信息 | ✅ |
| POST | `/api/auth/logout` | 用户登出 | ✅ |

### 用户管理

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/users` | 获取用户列表 | user:list |
| GET | `/api/users/:id` | 获取用户详情 | user:read |
| POST | `/api/users` | 创建用户 | user:create |
| PUT | `/api/users/:id` | 更新用户 | user:update |
| DELETE | `/api/users/:id` | 删除用户 | user:delete |

### 角色管理

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/roles` | 获取角色列表 | role:list |
| GET | `/api/roles/:id` | 获取角色详情 | role:read |
| POST | `/api/roles` | 创建角色 | role:create |
| PUT | `/api/roles/:id` | 更新角色 | role:update |
| DELETE | `/api/roles/:id` | 删除角色 | role:delete |
| POST | `/api/roles/:id/permissions` | 设置角色权限 | role:update |

### 机械管理

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/machine-categories` | 获取机械分类列表 | category:list |
| POST | `/api/machine-categories` | 创建机械分类 | category:create |
| PUT | `/api/machine-categories/:id` | 更新机械分类 | category:update |
| DELETE | `/api/machine-categories/:id` | 删除机械分类 | category:delete |
| GET | `/api/machines` | 获取机械列表 | machine:list |
| POST | `/api/machines` | 创建机械 | machine:create |
| PUT | `/api/machines/:id` | 更新机械 | machine:update |
| DELETE | `/api/machines/:id` | 删除机械 | machine:delete |

### 报告管理

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/test-reports` | 获取检测报告列表 | test_report:list |
| POST | `/api/test-reports` | 创建检测报告 | test_report:create |
| PUT | `/api/test-reports/:id` | 更新检测报告 | test_report:update |
| DELETE | `/api/test-reports/:id` | 删除检测报告 | test_report:delete |
| GET | `/api/repair-reports` | 获取维修报告列表 | repair_report:list |
| POST | `/api/repair-reports` | 创建维修报告 | repair_report:create |
| PUT | `/api/repair-reports/:id` | 更新维修报告 | repair_report:update |
| DELETE | `/api/repair-reports/:id` | 删除维修报告 | repair_report:delete |

### 支付管理

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/transfers` | 获取转账列表 | transfer:list |
| POST | `/api/transfers` | 创建转账记录 | transfer:create |
| PUT | `/api/transfers/:id` | 更新转账记录 | transfer:update |
| DELETE | `/api/transfers/:id` | 删除转账记录 | transfer:delete |
| GET | `/api/online-payments` | 获取在线支付列表 | payment:list |
| POST | `/api/online-payments` | 创建在线支付 | payment:create |
| PUT | `/api/online-payments/:id` | 更新在线支付 | payment:update |
| GET | `/api/invoices` | 获取发票列表 | invoice:list |
| POST | `/api/invoices` | 创建发票 | invoice:create |
| PUT | `/api/invoices/:id` | 更新发票 | invoice:update |
| DELETE | `/api/invoices/:id` | 删除发票 | invoice:delete |

### 统计分析

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/statistics/income` | 收入统计 | statistics:view |
| GET | `/api/statistics/expense` | 开支统计 | statistics:view |
| GET | `/api/statistics/orders` | 订单统计 | statistics:view |
| GET | `/api/statistics/timeout` | 超时统计 | statistics:view |

### 营销模块

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/cases` | 获取成功案例列表 | case:list |
| POST | `/api/cases` | 创建成功案例 | case:create |
| PUT | `/api/cases/:id` | 更新成功案例 | case:update |
| DELETE | `/api/cases/:id` | 删除成功案例 | case:delete |
| GET | `/api/customer-service` | 获取客服配置 | service:view |
| POST | `/api/customer-service` | 更新客服配置 | service:update |
| GET | `/api/douyin` | 获取抖音内容列表 | douyin:list |
| POST | `/api/douyin` | 创建抖音内容 | douyin:create |
| PUT | `/api/douyin/:id` | 更新抖音内容 | douyin:update |
| DELETE | `/api/douyin/:id` | 删除抖音内容 | douyin:delete |
| GET | `/api/partners` | 获取合作企业列表 | partner:list |
| POST | `/api/partners` | 创建合作企业 | partner:create |
| PUT | `/api/partners/:id` | 更新合作企业 | partner:update |
| DELETE | `/api/partners/:id` | 删除合作企业 | partner:delete |

### 系统管理

| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/personnel` | 获取人员列表 | personnel:list |
| POST | `/api/personnel` | 创建人员 | personnel:create |
| PUT | `/api/personnel/:id` | 更新人员 | personnel:update |
| DELETE | `/api/personnel/:id` | 删除人员 | personnel:delete |
| GET | `/api/system-logs` | 获取系统日志 | log:view |
| GET | `/api/system-params` | 获取系统参数 | param:view |
| POST | `/api/system-params` | 创建系统参数 | param:create |
| PUT | `/api/system-params/:id` | 更新系统参数 | param:update |
| DELETE | `/api/system-params/:id` | 删除系统参数 | param:delete |

---

## ❓ 常见问题

### Q1: 如何查看 Docker 容器日志？

```bash
# 查看所有容器日志
docker-compose logs

# 查看特定容器日志
docker-compose logs php
docker-compose logs nginx
docker-compose logs mysql

# 实时查看日志
docker-compose logs -f php
```

### Q2: 如何进入容器调试？

```bash
# 进入 PHP 容器
docker exec -it docker-php-1 bash

# 进入 Nginx 容器
docker exec -it docker-nginx-1 sh

# 进入 MySQL 容器
docker exec -it docker-mysql-1 bash
```

### Q3: 如何重置数据库？

```bash
# 进入 MySQL 容器
docker exec -it docker-mysql-1 bash

# 登录 MySQL
mysql -u root -p

# 删除并重建数据库
DROP DATABASE cmms_db;
CREATE DATABASE cmms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 导入数据
docker exec -i docker-mysql-1 mysql -u root -proot123 cmms_db < database/migrations/001_create_tables.sql
docker exec -i docker-mysql-1 mysql -u root -proot123 cmms_db < database/migrations/002_create_new_tables.sql
```

### Q4: Token 过期怎么办？

使用 refresh token 获取新的 access token：

```bash
curl -X POST http://localhost/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"your_refresh_token"}'
```

### Q5: 如何检查权限？

登录后的响应会包含用户的权限列表。你也可以：

```bash
# 获取当前用户信息（包含权限）
curl -X GET http://localhost/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Q6: Pest 测试失败怎么办？

1. 确保容器正在运行
2. 检查数据库连接配置
3. 确保测试数据已准备
4. 查看详细错误信息：

```bash
docker exec docker-php-1 sh -c "cd /var/www/html && ./vendor/bin/pest --debug"
```

### Q7: 如何查看 API 响应格式？

所有 API 响应遵循统一格式：

**成功响应:**
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

**错误响应:**
```json
{
  "code": 400,
  "message": "错误信息",
  "data": null
}
```

---

## 📞 获取帮助

- 📖 查看完整 API 文档: `backend/docs/API-REFERENCE.md`
- 📮 查看 API 设计文档: `docs/API-DESIGN.md`
- 🧪 查看测试框架配置: `backend/phpunit.xml`
- 🔧 查看环境配置: `backend/.env`

---

**最后更新**: 2026-03-25
**版本**: 1.0.0
