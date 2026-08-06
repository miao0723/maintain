-- 修改 role_permissions 表，添加细粒度权限字段
ALTER TABLE `role_permissions` ADD COLUMN `permissions` json NOT NULL COMMENT '细粒度权限配置 {"canView": true, "canEdit": false, "canDelete": false}' AFTER `permission_id`;
