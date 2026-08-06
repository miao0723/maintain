# 权限配置功能实现总结

## 实现的功能

### 1. 数据库结构更新
- `role_permissions` 表已添加 `permissions` JSON 字段
- 字段格式：`{"canView": true, "canEdit": false, "canDelete": false}`

### 2. 后端实现

#### RoleController.php
- `getPermissions()` 方法：获取角色的所有权限及其细粒度配置
- `setPermissions()` 方法：设置角色权限，支持细粒度权限配置

#### PermissionCheck.php 中间件
- 更新权限检查逻辑，支持细粒度权限验证
- 新增 `hasPermissionAction()` 方法用于检查具体操作权限

### 3. 前端实现

#### Roles.vue
- 权限配置对话框支持：
  - 查看现有权限（已勾选的权限）
  - 细粒度权限配置（查看/编辑/删除）
  - 权限状态持久化（下次打开保持勾选状态）
  - 美化的权限树展示

## 细粒度权限说明

每个权限可以配置三个操作权限：
- `canView`：查看权限
- `canEdit`：编辑权限
- `canDelete`：删除权限

默认行为：
- 勾选权限时，默认有查看权限
- 未勾选的权限不会被保存
- 父权限的细粒度配置不会影响子权限

## API 接口

### 获取角色权限
```
GET /api/roles/{id}/permissions
```

响应格式：
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "permissions": [
      {
        "id": 1,
        "code": "system.users",
        "permissions": {
          "canView": true,
          "canEdit": false,
          "canDelete": false
        }
      }
    ]
  }
}
```

### 设置角色权限
```
POST /api/roles/{id}/permissions
```

请求格式：
```json
{
  "permissions": [
    {
      "id": 1,
      "permissions": {
        "canView": true,
        "canEdit": true,
        "canDelete": false
      }
    }
  ]
}
```

## 使用说明

1. 在角色管理页面点击"权限配置"按钮
2. 勾选需要分配给角色的权限
3. 对于每个勾选的权限，配置具体的操作权限
4. 点击"保存"按钮提交配置

## 用户权限检查

用户登录时，系统会自动检查其角色的权限配置：
- 只有勾选的权限才能访问对应资源
- 细粒度权限控制具体的操作（查看/编辑/删除）
- 超级管理员拥有所有权限

## 数据库迁移

如需在新的数据库环境中部署，执行以下 SQL：

```sql
ALTER TABLE `role_permissions`
ADD COLUMN `permissions` JSON NULL COMMENT '细粒度权限配置 {canView, canEdit, canDelete}' AFTER `permission_id`;
```
