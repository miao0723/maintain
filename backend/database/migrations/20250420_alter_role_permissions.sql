-- 更新 role_permissions 表结构，添加 permissions 字段用于存储细粒度权限配置

-- MySQL 8.0 不支持 ADD COLUMN IF NOT EXISTS，使用存储过程方式
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'role_permissions'
    AND COLUMN_NAME = 'permissions'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE `role_permissions` ADD COLUMN `permissions` json NULL COMMENT ''细粒度权限配置 {"canView": true, "canEdit": false, "canDelete": false}'' AFTER `permission_id`',
    'SELECT ''Column permissions already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 更新现有记录的默认值
UPDATE `role_permissions`
SET `permissions` = JSON_OBJECT('canView', true, 'canEdit', false, 'canDelete', false)
WHERE `permissions` IS NULL;
