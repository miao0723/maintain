-- ============================================================
-- 010_add_order_admin_remark.sql
-- 超级管理员订单「备注」功能：orders 表新增 admin_remark 列
-- 管理员在超级管理员页面的订单卡片上备注（含「我的订单」列表），
-- 备注内容直接展示在对应订单上，支持反复查看与编辑。
-- ------------------------------------------------------------
-- 用法（在服务器上执行，或放回 backend/database/migrations 后
-- 由你习惯的方式执行）：
--   mysql -h 127.0.0.1 -u cmms_user -p repair_system < 010_add_order_admin_remark.sql
-- 幂等：列已存在时自动跳过，不会报错。
-- ============================================================

SET @db_name = DATABASE();
SET @has_col = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'admin_remark'
);

SET @ddl = IF(@has_col = 0,
  'ALTER TABLE orders ADD COLUMN admin_remark TEXT NULL COMMENT ''管理员备注（超级管理员页订单卡片）''',
  'SELECT 1');

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
