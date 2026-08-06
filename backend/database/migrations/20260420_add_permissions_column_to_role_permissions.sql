-- 更新 role_permissions 表，添加 permissions JSON 字段
-- 用于存储细粒度权限配置：可查看、可编辑、可删除

ALTER TABLE `role_permissions`
ADD COLUMN `permissions` JSON NULL COMMENT '细粒度权限配置 {canView, canEdit, canDelete}' AFTER `permission_id`;
