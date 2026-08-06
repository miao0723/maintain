-- =============================================
-- 同步 repair 数据库 parts_inventory → spare_parts
-- 当小程序的备件数据更新后，执行此 SQL 同步到 spare_parts 表
-- 使用方式：mysql -u root -proot123 repair < sync_parts_inventory_to_spare_parts.sql
-- =============================================

SET NAMES utf8mb4;

-- 清空并重新同步 spare_parts（保留 stock_records）
TRUNCATE TABLE `spare_parts`;

INSERT IGNORE INTO `spare_parts`
  (`id`, `part_code`, `part_name`, `specification`, `category`, `unit`,
   `purchase_price`, `selling_price`, `stock_quantity`, `min_stock`,
   `location`, `status`, `created_at`, `updated_at`)
SELECT
  `id`,
  CONCAT('SP', LPAD(id, 4, '0')) AS `part_code`,
  `name` AS `part_name`,
  `model` AS `specification`,
  `category`,
  '件' AS `unit`,
  `unit_price` AS `purchase_price`,
  ROUND(`unit_price` * 1.5, 2) AS `selling_price`,
  `quantity` AS `stock_quantity`,
  `min_quantity` AS `min_stock`,
  `location`,
  CASE WHEN `status` = 'active' THEN 1 ELSE 2 END AS `status`,
  `created_at`,
  `updated_at`
FROM `parts_inventory`;

SELECT CONCAT('同步完成: spare_parts 共 ', COUNT(*), ' 条记录') AS result FROM spare_parts;