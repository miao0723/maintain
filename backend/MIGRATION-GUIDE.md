# CMMS Backend - 迁移指南

本指南帮助您从旧的维护管理系统迁移到新的CMMS后端API系统。

## 📋 目录

1. [迁移前准备](#迁移前准备)
2. [数据迁移](#数据迁移)
3. [客户端集成](#客户端集成)
4. [功能映射](#功能映射)
5. [API迁移示例](#api迁移示例)
6. [常见问题](#常见问题)
7. [回滚计划](#回滚计划)

## 🔍 迁移前准备

### 1. 环境评估

在开始迁移之前，请确认：

- [ ] 旧系统版本和架构
- [ ] 数据库类型和版本
- [ ] 数据量（用户、设备、工单数量）
- [ ] 自定义功能和模块
- [ ] 第三方集成依赖
- [ ] 现有API使用情况

### 2. 备份策略

**必须备份的内容**:

```bash
# 1. 数据库备份
mysqldump -u username -p old_database > backup_$(date +%Y%m%d).sql

# 2. 文件备份（如果有上传文件）
cp -r /path/to/old/uploads /backup/uploads_$(date +%Y%m%d)

# 3. 配置文件备份
cp -r /path/to/old/config /backup/config_$(date +%Y%m%d)
```

**备份验证**:
- [ ] 数据库备份文件完整性
- [ ] 文件备份完整性
- [ ] 备份文件可恢复性测试

### 3. 新环境准备

**系统要求**:
- PHP 8.1+
- MySQL 5.7+ / MariaDB 10.3+
- Redis 5.0+
- Nginx/Apache

**配置检查**:
```bash
# 检查PHP版本
php -v

# 检查PHP扩展
php -m | grep -E "mysqli|redis|json|openssl"

# 检查MySQL
mysql --version

# 检查Redis
redis-cli --version
```

## 🗄️ 数据迁移

### 1. 数据库结构对比

| 旧系统表 | 新系统表 | 迁移难度 | 说明 |
|---------|---------|---------|------|
| users | users | ⭐ 简单 | 字段基本对应 |
| departments | departments | ⭐ 简单 | 直接映射 |
| devices | devices | ⭐⭐ 中等 | 增加新字段 |
| work_orders | work_orders | ⭐⭐ 中等 | 状态枚举值调整 |
| staff | engineers | ⭐⭐ 中等 | 字段重命名 |
| inventory | spare_parts | ⭐⭐⭐ 复杂 | 需数据转换 |

### 2. 数据迁移脚本

创建迁移脚本 `migrate-data.php`:

```php
<?php
/**
 * 数据迁移脚本
 * 从旧系统迁移数据到新CMMS系统
 */

// 配置
$oldDbConfig = [
    'host' => 'localhost',
    'database' => 'old_cmms',
    'username' => 'root',
    'password' => 'password'
];

$newDbConfig = [
    'host' => 'localhost',
    'database' => 'cmms_db',
    'username' => 'root',
    'password' => 'password'
];

try {
    // 连接数据库
    $oldDb = new PDO(
        "mysql:host={$oldDbConfig['host']};dbname={$oldDbConfig['database']}",
        $oldDbConfig['username'],
        $oldDbConfig['password']
    );

    $newDb = new PDO(
        "mysql:host={$newDbConfig['host']};dbname={$newDbConfig['database']}",
        $newDbConfig['username'],
        $newDbConfig['password']
    );

    echo "开始数据迁移...\n";

    // 1. 迁移用户数据
    migrateUsers($oldDb, $newDb);

    // 2. 迁移部门数据
    migrateDepartments($oldDb, $newDb);

    // 3. 迁移设备数据
    migrateDevices($oldDb, $newDb);

    // 4. 迁移工单数据
    migrateWorkOrders($oldDb, $newDb);

    // 5. 迁移维修人员数据
    migrateEngineers($oldDb, $newDb);

    echo "数据迁移完成！\n";

} catch (Exception $e) {
    echo "迁移失败: " . $e->getMessage() . "\n";
    exit(1);
}

/**
 * 迁移用户数据
 */
function migrateUsers($oldDb, $newDb)
{
    echo "迁移用户数据...\n";

    $stmt = $oldDb->query("SELECT * FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $insert = $newDb->prepare("
        INSERT INTO users (
            id, username, password, real_name, email, phone,
            department_id, role, status, created_at, updated_at
        ) VALUES (
            :id, :username, :password, :real_name, :email, :phone,
            :department_id, :role, :status, :created_at, :updated_at
        )
        ON DUPLICATE KEY UPDATE
            username = VALUES(username),
            email = VALUES(email)
    ");

    foreach ($users as $user) {
        $insert->execute([
            ':id' => $user['id'],
            ':username' => $user['username'],
            ':password' => $user['password'], // 假设密码已加密
            ':real_name' => $user['name'] ?? '',
            ':email' => $user['email'] ?? '',
            ':phone' => $user['phone'] ?? '',
            ':department_id' => $user['dept_id'] ?? null,
            ':role' => mapUserRole($user['role'] ?? 'user'),
            ':status' => $user['status'] ?? 1,
            ':created_at' => $user['created_at'] ?? date('Y-m-d H:i:s'),
            ':updated_at' => $user['updated_at'] ?? date('Y-m-d H:i:s')
        ]);
    }

    echo "用户数据迁移完成: " . count($users) . " 条记录\n";
}

/**
 * 迁移部门数据
 */
function migrateDepartments($oldDb, $newDb)
{
    echo "迁移部门数据...\n";

    $stmt = $oldDb->query("SELECT * FROM departments");
    $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $insert = $newDb->prepare("
        INSERT INTO departments (
            id, name, parent_id, description, sort_order,
            status, created_at, updated_at
        ) VALUES (
            :id, :name, :parent_id, :description, :sort_order,
            :status, :created_at, :updated_at
        )
        ON DUPLICATE KEY UPDATE name = VALUES(name)
    ");

    foreach ($departments as $dept) {
        $insert->execute([
            ':id' => $dept['id'],
            ':name' => $dept['name'],
            ':parent_id' => $dept['parent_id'] ?? 0,
            ':description' => $dept['description'] ?? '',
            ':sort_order' => $dept['sort'] ?? 0,
            ':status' => $dept['status'] ?? 1,
            ':created_at' => $dept['created_at'] ?? date('Y-m-d H:i:s'),
            ':updated_at' => $dept['updated_at'] ?? date('Y-m-d H:i:s')
        ]);
    }

    echo "部门数据迁移完成: " . count($departments) . " 条记录\n";
}

/**
 * 迁移设备数据
 */
function migrateDevices($oldDb, $newDb)
{
    echo "迁移设备数据...\n";

    $stmt = $oldDb->query("SELECT * FROM devices");
    $devices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $insert = $newDb->prepare("
        INSERT INTO devices (
            id, name, code, category_id, department_id,
            model, manufacturer, purchase_date, warranty_date,
            location, status, created_at, updated_at
        ) VALUES (
            :id, :name, :code, :category_id, :department_id,
            :model, :manufacturer, :purchase_date, :warranty_date,
            :location, :status, :created_at, :updated_at
        )
        ON DUPLICATE KEY UPDATE name = VALUES(name)
    ");

    foreach ($devices as $device) {
        $insert->execute([
            ':id' => $device['id'],
            ':name' => $device['name'],
            ':code' => $device['code'] ?? '',
            ':category_id' => $device['category_id'] ?? null,
            ':department_id' => $device['dept_id'] ?? null,
            ':model' => $device['model'] ?? '',
            ':manufacturer' => $device['manufacturer'] ?? '',
            ':purchase_date' => $device['purchase_date'] ?? null,
            ':warranty_date' => $device['warranty_date'] ?? null,
            ':location' => $device['location'] ?? '',
            ':status' => mapDeviceStatus($device['status'] ?? 'active'),
            ':created_at' => $device['created_at'] ?? date('Y-m-d H:i:s'),
            ':updated_at' => $device['updated_at'] ?? date('Y-m-d H:i:s')
        ]);
    }

    echo "设备数据迁移完成: " . count($devices) . " 条记录\n";
}

/**
 * 迁移工单数据
 */
function migrateWorkOrders($oldDb, $newDb)
{
    echo "迁移工单数据...\n";

    $stmt = $oldDb->query("SELECT * FROM work_orders");
    $workOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $insert = $newDb->prepare("
        INSERT INTO work_orders (
            id, title, description, device_id, department_id,
            engineer_id, priority, status, created_by,
            created_at, updated_at, completed_at
        ) VALUES (
            :id, :title, :description, :device_id, :department_id,
            :engineer_id, :priority, :status, :created_by,
            :created_at, :updated_at, :completed_at
        )
        ON DUPLICATE KEY UPDATE title = VALUES(title)
    ");

    foreach ($workOrders as $order) {
        $insert->execute([
            ':id' => $order['id'],
            ':title' => $order['title'],
            ':description' => $order['description'] ?? '',
            ':device_id' => $order['device_id'] ?? null,
            ':department_id' => $order['dept_id'] ?? null,
            ':engineer_id' => $order['staff_id'] ?? null,
            ':priority' => mapPriority($order['priority'] ?? 'normal'),
            ':status' => mapWorkOrderStatus($order['status'] ?? 'pending'),
            ':created_by' => $order['creator_id'] ?? null,
            ':created_at' => $order['created_at'] ?? date('Y-m-d H:i:s'),
            ':updated_at' => $order['updated_at'] ?? date('Y-m-d H:i:s'),
            ':completed_at' => $order['completed_at'] ?? null
        ]);
    }

    echo "工单数据迁移完成: " . count($workOrders) . " 条记录\n";
}

/**
 * 迁移维修人员数据
 */
function migrateEngineers($oldDb, $newDb)
{
    echo "迁移维修人员数据...\n";

    $stmt = $oldDb->query("SELECT * FROM staff WHERE type = 'engineer'");
    $engineers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $insert = $newDb->prepare("
        INSERT INTO engineers (
            id, user_id, employee_no, skills, level,
            status, created_at, updated_at
        ) VALUES (
            :id, :user_id, :employee_no, :skills, :level,
            :status, :created_at, :updated_at
        )
        ON DUPLICATE KEY UPDATE employee_no = VALUES(employee_no)
    ");

    foreach ($engineers as $eng) {
        $insert->execute([
            ':id' => $eng['id'],
            ':user_id' => $eng['user_id'] ?? null,
            ':employee_no' => $eng['employee_no'] ?? '',
            ':skills' => $eng['skills'] ?? '',
            ':level' => $eng['level'] ?? 'junior',
            ':status' => $eng['status'] ?? 'available',
            ':created_at' => $eng['created_at'] ?? date('Y-m-d H:i:s'),
            ':updated_at' => $eng['updated_at'] ?? date('Y-m-d H:i:s')
        ]);
    }

    echo "维修人员数据迁移完成: " . count($engineers) . " 条记录\n";
}

/**
 * 映射用户角色
 */
function mapUserRole($oldRole)
{
    $map = [
        'admin' => 'admin',
        'manager' => 'manager',
        'user' => 'user',
        'guest' => 'user'
    ];

    return $map[$oldRole] ?? 'user';
}

/**
 * 映射设备状态
 */
function mapDeviceStatus($oldStatus)
{
    $map = [
        'active' => 1,
        'maintenance' => 2,
        'broken' => 3,
        'retired' => 0
    ];

    return $map[$oldStatus] ?? 1;
}

/**
 * 映射工单优先级
 */
function mapPriority($oldPriority)
{
    $map = [
        'low' => 1,
        'normal' => 2,
        'high' => 3,
        'urgent' => 4
    ];

    return $map[$oldPriority] ?? 2;
}

/**
 * 映射工单状态
 */
function mapWorkOrderStatus($oldStatus)
{
    $map = [
        'pending' => 0,      // 待处理
        'assigned' => 1,     // 已派单
        'accepted' => 2,     // 已接单
        'processing' => 3,   // 处理中
        'completed' => 4,    // 待审核
        'verified' => 5,     // 已完成
        'closed' => 6        // 已关闭
    ];

    return $map[$oldStatus] ?? 0;
}
```

### 3. 执行数据迁移

```bash
# 1. 备份现有数据
mysqldump -u root -p cmms_db > backup_before_migration.sql

# 2. 运行迁移脚本
php migrate-data.php

# 3. 验证数据
mysql -u root -p cmms_db -e "
    SELECT COUNT(*) as user_count FROM users;
    SELECT COUNT(*) as device_count FROM devices;
    SELECT COUNT(*) as workorder_count FROM work_orders;
"

# 4. 检查数据完整性
mysql -u root -p cmms_db -e "
    SELECT '孤立用户（无部门）' as check_type, COUNT(*) as count
    FROM users WHERE department_id IS NULL;
    SELECT '孤立设备（无部门）' as check_type, COUNT(*) as count
    FROM devices WHERE department_id IS NULL;
"
```

## 🔌 客户端集成

### 1. API基础URL变更

**旧系统**:
```
http://old-system.com/api/
```

**新系统**:
```
http://new-system.com/api/v1/
```

### 2. 认证方式变更

**旧系统（Session认证）**:
```javascript
// 旧方式
fetch('/api/users', {
    credentials: 'include'  // 使用Session
})
```

**新系统（JWT认证）**:
```javascript
// 新方式
const login = async (username, password) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
};

// 使用令牌访问API
const getUsers = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/users', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
};
```

### 3. 响应格式变更

**旧系统响应**:
```json
{
    "success": true,
    "data": [...],
    "message": "Success"
}
```

**新系统响应**:
```json
{
    "code": 200,
    "message": "success",
    "data": [...]
}
```

### 4. 错误处理变更

**旧系统错误响应**:
```json
{
    "success": false,
    "error": "Error message"
}
```

**新系统错误响应**:
```json
{
    "code": 400,
    "message": "error message",
    "data": null
}
```

## 🔄 功能映射

### API端点映射表

| 旧API | 新API | 变更说明 |
|-------|-------|---------|
| POST /api/login | POST /api/auth/login | 认证方式改为JWT |
| GET /api/users | GET /api/users | 路径不变，响应格式改变 |
| POST /api/users | POST /api/users | 路径不变 |
| GET /api/devices | GET /api/devices | 路径不变 |
| GET /api/workorders | GET /api/workorders | 路径不变 |
| POST /api/workorders/:id/assign | POST /api/workorders/:id/assign | 路径不变 |
| - | GET /api/workorders/my | 新增：我的工单 |
| - | GET /api/workorders/statistics | 新增：工单统计 |
| GET /api/staff | GET /api/engineers | 重命名：staff → engineers |
| - | GET /api/engineers/available | 新增：可用人员 |
| - | GET /api/inspections | 新增：巡检任务 |
| - | GET /api/maintenance/plans | 新增：保养计划 |
| GET /api/inventory | GET /api/parts | 重命名：inventory → parts |
| - | GET /api/parts/alerts | 新增：库存预警 |
| - | GET /api/knowledge | 新增：知识库 |
| - | GET /api/costs/overview | 新增：成本分析 |
| - | GET /api/reports | 新增：报表中心 |
| - | GET /api/notifications | 新增：通知中心 |

## 💻 API迁移示例

### 示例1: 登录功能迁移

**旧系统代码**:
```javascript
function login(username, password) {
    return fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        credentials: 'include'  // Session认证
    }).then(res => res.json());
}
```

**新系统代码**:
```javascript
async function login(username, password) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.code === 200) {
        // 保存令牌
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);

        // 设置令牌刷新定时器
        setupTokenRefresh();
    }

    return data;
}

// 令牌刷新
async function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`
        }
    });

    const data = await response.json();
    if (data.code === 200) {
        localStorage.setItem('access_token', data.data.access_token);
        return data.data.access_token;
    }
}

// 设置自动刷新
function setupTokenRefresh() {
    // 每1.5小时刷新一次（令牌有效期2小时）
    setInterval(refreshToken, 90 * 60 * 1000);
}
```

### 示例2: 获取工单列表

**旧系统代码**:
```javascript
function getWorkOrders(page = 1) {
    return fetch(`/api/workorders?page=${page}`, {
        credentials: 'include'
    }).then(res => res.json());
}
```

**新系统代码**:
```javascript
async function getWorkOrders(page = 1, pageSize = 20) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(
        `/api/workorders?page=${page}&page_size=${pageSize}`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    if (data.code === 200) {
        return {
            list: data.data.list,
            total: data.data.total,
            page: data.data.page,
            pageSize: data.data.page_size
        };
    }

    throw new Error(data.message);
}
```

### 示例3: 创建工单

**旧系统代码**:
```javascript
function createWorkOrder(workOrder) {
    return fetch('/api/workorders', {
        method: 'POST',
        body: JSON.stringify(workOrder),
        credentials: 'include'
    }).then(res => res.json());
}
```

**新系统代码**:
```javascript
async function createWorkOrder(workOrder) {
    const token = localStorage.getItem('access_token');
    const response = await fetch('/api/workorders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            title: workOrder.title,
            description: workOrder.description,
            device_id: workOrder.deviceId,
            department_id: workOrder.departmentId,
            priority: workOrder.priority,
            // 其他字段...
        })
    });

    const data = await response.json();

    if (data.code === 200) {
        return data.data;
    }

    throw new Error(data.message);
}
```

## ❓ 常见问题

### Q1: 令牌过期如何处理？

**A**: 实现自动刷新机制：

```javascript
// 响应拦截器
async function fetchWithAuth(url, options = {}) {
    let token = localStorage.getItem('access_token');
    let response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    });

    // 401错误，尝试刷新令牌
    if (response.status === 401) {
        token = await refreshToken();
        if (token) {
            // 重试原请求
            response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    }

    return response;
}
```

### Q2: 如何处理分页参数变更？

**A**: 更新分页参数名称：

```javascript
// 旧系统
{ page: 1, per_page: 20 }

// 新系统
{ page: 1, page_size: 20 }
```

### Q3: 文件上传如何迁移？

**A**: 使用FormData添加认证头：

```javascript
async function uploadFile(file) {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
            // 不要设置Content-Type，让浏览器自动设置
        },
        body: formData
    });

    return response.json();
}
```

### Q4: 如何处理状态码变更？

**A**: 创建状态码映射：

```javascript
const STATUS_MAP = {
    // 工单状态
    'pending': 0,
    'assigned': 1,
    'processing': 3,
    'completed': 5,
    // 其他映射...
};

function mapStatus(oldStatus) {
    return STATUS_MAP[oldStatus] ?? 0;
}
```

## 🔄 回滚计划

### 回滚步骤

如果迁移出现问题，按以下步骤回滚：

1. **停止新系统**
   ```bash
   docker-compose down
   # 或
   systemctl stop nginx
   ```

2. **恢复数据库**
   ```bash
   mysql -u root -p cmms_db < backup_before_migration.sql
   ```

3. **恢复旧系统**
   ```bash
   cd /path/to/old/system
   systemctl start old-system-service
   ```

4. **验证回滚**
   ```bash
   curl http://old-system.com/api/health
   ```

### 回滚决策

**立即回滚的情况**:
- 数据丢失或损坏
- 系统无法访问
- 关键功能失效
- 性能严重下降

**评估后回滚的情况**:
- 部分功能异常
- 性能下降
- 用户体验问题

## ✅ 迁移检查清单

### 迁移前

- [ ] 完成数据备份
- [ ] 验证备份完整性
- [ ] 准备回滚方案
- [ ] 通知相关人员
- [ ] 选择迁移时间窗口

### 迁移中

- [ ] 停止旧系统写入
- [ ] 执行数据迁移
- [ ] 验证数据完整性
- [ ] 部署新系统
- [ ] 执行冒烟测试

### 迁移后

- [ ] 功能验证测试
- [ ] 性能监控
- [ ] 用户反馈收集
- [ ] 问题修复
- [ ] 文档更新

## 📞 获取帮助

如果遇到迁移问题：

1. 查看系统日志: `runtime/log/error.log`
2. 查阅API文档
3. 参考实现示例
4. 联系技术支持

---

**文档版本**: 1.0
**最后更新**: 2026-03-24
**适用版本**: CMMS Backend v1.0
