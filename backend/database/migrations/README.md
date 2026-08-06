# 权限系统迁移文件

## 文件说明

本目录包含权限系统的数据库迁移文件，用于初始化和更新权限数据。

### 迁移文件列表

1. **20250420_alter_role_permissions.sql**
   - 更新 `role_permissions` 表结构
   - 添加 `permissions` 字段用于存储细粒度权限配置
   - 格式: `{"canView": true, "canEdit": false, "canDelete": false}`

2. **20250420_seed_permissions.sql**
   - 初始化完整的权限树数据
   - 基于前端路由结构生成
   - 包含所有模块的菜单和按钮权限

3. **20250420_seed_admin_role_permissions.sql**
   - 为管理员角色（ID=1）分配所有权限
   - 菜单权限默认只有查看权限
   - 按钮权限默认拥有完整权限（查看/编辑/删除）

## 执行顺序

请按照以下顺序执行迁移文件：

1. `20250420_alter_role_permissions.sql` - 更新表结构
2. `20250420_seed_permissions.sql` - 初始化权限数据
3. `20250420_seed_admin_role_permissions.sql` - 配置管理员权限

## 执行方法

### 方法一：使用 MySQL 命令行

```bash
mysql -u root -p cmms_db < 20250420_alter_role_permissions.sql
mysql -u root -p cmms_db < 20250420_seed_permissions.sql
mysql -u root -p cmms_db < 20250420_seed_admin_role_permissions.sql
```

### 方法二：使用数据库管理工具

1. 打开 Navicat、phpMyAdmin 或其他数据库管理工具
2. 连接到 `cmms_db` 数据库
3. 依次执行上述 SQL 文件

### 方法三：使用 PHP artisan（如果配置了）

```bash
php think migrate:run 20250420_alter_role_permissions
php think migrate:run 20250420_seed_permissions
php think migrate:run 20250420_seed_admin_role_permissions
```

## 注意事项

1. **清空现有权限数据**
   - `20250420_seed_permissions.sql` 文件中有一行被注释的 `TRUNCATE TABLE permissions;`
   - 如果需要清空现有权限数据，请取消该注释
   - 执行清空操作前请确保已备份重要数据

2. **管理员角色ID**
   - `20250420_seed_admin_role_permissions.sql` 假设管理员角色ID为1
   - 如果系统中管理员角色ID不是1，请修改该文件中的 `role_id` 值

3. **权限编码规范**
   - 菜单权限: `module.submodule` (如 `system.users`)
   - 按钮权限: `module.submodule.action` (如 `system.users.create`)
   - 所有权限使用小写字母和点号分隔

## 权限树结构

```
系统管理 (1)
├── 用户管理 (10)
│   ├── 查看用户 (11)
│   ├── 新增用户 (12)
│   ├── 编辑用户 (13)
│   └── 删除用户 (14)
├── 角色管理 (20)
│   ├── 查看角色 (21)
│   ├── 新增角色 (22)
│   ├── 编辑角色 (23)
│   ├── 删除角色 (24)
│   └── 配置权限 (25)
└── ...其他模块

业务管理 (2)
├── 免责协议管理 (100)
├── 维修内容管理 (110)
└── 绑定/解绑 (120)

引流模块 (3)
├── 成功案例 (200)
├── 人工客服 (210)
├── 抖音获客 (220)
├── 小红书获获 (230)
├── 快手获客 (240)
├── B站获客 (250)
└── 合作企业 (260)

维修业务 (4)
├── 机械种类管理 (300)
├── 机械名称管理 (310)
├── 订单管理 (320)
│   ├── 小程序订单 (321)
│   └── 手动创建订单 (331)
├── 检测报告 (340)
├── 维修报告 (370)
├── 维修合同 (380)
├── 维修提醒 (390)
├── 联动维修 (400)
└── 维修进度 (410)

支付模块 (5)
├── 转账支付 (500)
├── 在线支付 (510)
├── 支付宝测试 (520)
└── 发票管理 (530)

进销存 (6)
├── 配件管理 (600)
└── 供应商管理 (610)

查询统计 (7)
├── 收入统计 (700)
├── 开支统计 (710)
├── 订单统计 (720)
└── 超时统计 (730)
```

## 细粒度权限配置

每个权限节点可以配置以下操作权限：

- `canView`: 查看权限（布尔值）
- `canEdit`: 编辑权限（布尔值）
- `canDelete`: 删除权限（布尔值）

示例配置：
```json
{
  "canView": true,
  "canEdit": false,
  "canDelete": false
}
```

## 回滚

如果需要回滚迁移，请执行以下操作：

1. 删除 role_permissions 中的权限关联记录
2. 清空 permissions 表

```sql
DELETE FROM role_permissions WHERE role_id = 1;
TRUNCATE TABLE permissions;
```

注意：回滚操作将删除所有权限数据，请谨慎操作。
