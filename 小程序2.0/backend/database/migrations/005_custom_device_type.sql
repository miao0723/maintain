-- 005: 支持自定义设备类型
-- 可以直接在 Navicat 查询窗口中运行
-- 1. 插入 id=0 的记录到 device_types，用于自定义设备类型的基础 FK 引用
-- 2. 给 user_devices 添加 device_type_name 列，存储用户自定义的设备类型名称

-- ============================================
-- 第1步：插入 id=0 的自定义设备类型
-- ============================================

-- 先保存当前的 sql_mode，然后临时启用 NO_AUTO_VALUE_ON_ZERO
SET @saved_sql_mode = @@sql_mode;
SET SESSION sql_mode = CONCAT(@@sql_mode, ',NO_AUTO_VALUE_ON_ZERO');

INSERT INTO device_types (id, name, icon) VALUES (0, '自定义设备', '✏️')
ON DUPLICATE KEY UPDATE name = '自定义设备', icon = '✏️';

-- 恢复原来的 sql_mode
SET SESSION sql_mode = @saved_sql_mode;

-- ============================================
-- 第2步：给 user_devices 添加 device_type_name 字段（如果不存在）
-- ============================================

-- Navicat 兼容写法：通过存储过程实现 IF NOT EXISTS
DROP PROCEDURE IF EXISTS add_column_if_not_exists;

DELIMITER $$

CREATE PROCEDURE add_column_if_not_exists()
BEGIN
    DECLARE col_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO col_exists
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user_devices'
      AND COLUMN_NAME = 'device_type_name';

    IF col_exists = 0 THEN
        ALTER TABLE user_devices
        ADD COLUMN device_type_name VARCHAR(50) DEFAULT NULL COMMENT '自定义设备类型名称（仅 device_type_id=0 时使用）';
    END IF;
END$$

DELIMITER ;

CALL add_column_if_not_exists();

DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- ============================================
-- 完成
-- ============================================
SELECT '迁移 005 执行完成' AS result;
