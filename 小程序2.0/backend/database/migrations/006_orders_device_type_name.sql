-- 006: orders 表支持自定义设备类型名称
-- 可以直接在 Navicat 查询窗口中运行

-- ============================================
-- 给 orders 表添加 device_type_name 字段（如果不存在）
-- ============================================

DROP PROCEDURE IF EXISTS add_order_column_if_not_exists;

DELIMITER $$

CREATE PROCEDURE add_order_column_if_not_exists()
BEGIN
    DECLARE col_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO col_exists
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME = 'device_type_name';

    IF col_exists = 0 THEN
        ALTER TABLE orders
        ADD COLUMN device_type_name VARCHAR(50) DEFAULT NULL COMMENT '自定义设备类型名称（仅 device_type=0 时使用）'
        AFTER device_type;
    END IF;
END$$

DELIMITER ;

CALL add_order_column_if_not_exists();

DROP PROCEDURE IF EXISTS add_order_column_if_not_exists;

-- ============================================
-- 完成
-- ============================================
SELECT '迁移 006 执行完成' AS result;
