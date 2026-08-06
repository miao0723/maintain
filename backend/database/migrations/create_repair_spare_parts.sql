-- =============================================
-- 在 repair 数据库中创建 spare_parts 表
-- 映射小程序 parts_inventory 表的数据
-- =============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 创建 spare_parts 表（字段名适配后台管理系统）
-- ----------------------------
DROP TABLE IF EXISTS `spare_parts`;
CREATE TABLE `spare_parts` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '备件ID',
  `part_code` varchar(50) NOT NULL COMMENT '备件编码',
  `part_name` varchar(200) NOT NULL COMMENT '备件名称',
  `specification` varchar(200) DEFAULT NULL COMMENT '规格型号',
  `category` varchar(100) DEFAULT NULL COMMENT '分类',
  `unit` varchar(20) NOT NULL DEFAULT '件' COMMENT '单位',
  `supplier_id` int(11) unsigned DEFAULT NULL COMMENT '供应商ID',
  `purchase_price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '采购价格',
  `selling_price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '销售价格',
  `stock_quantity` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '库存数量',
  `min_stock` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '最小库存',
  `max_stock` int(11) unsigned DEFAULT NULL COMMENT '最大库存',
  `location` varchar(100) DEFAULT NULL COMMENT '存放位置',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态:1正常 2停用',
  `image_url` varchar(500) DEFAULT NULL COMMENT '配件图片URL',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_code` (`part_code`),
  KEY `idx_part_name` (`part_name`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='备件表（从 parts_inventory 同步）';

-- ----------------------------
-- 2. 创建 stock_records 表（库存记录表）
-- ----------------------------
DROP TABLE IF EXISTS `stock_records`;
CREATE TABLE `stock_records` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `spare_part_id` int(11) unsigned NOT NULL COMMENT '备件ID',
  `record_type` tinyint(1) NOT NULL COMMENT '记录类型:1入库 2出库 3盘点',
  `quantity` int(11) unsigned NOT NULL COMMENT '数量',
  `before_stock` int(11) unsigned NOT NULL COMMENT '变动前库存',
  `after_stock` int(11) unsigned NOT NULL COMMENT '变动后库存',
  `related_type` varchar(50) DEFAULT NULL COMMENT '关联类型',
  `related_id` int(11) unsigned DEFAULT NULL COMMENT '关联ID',
  `operator_id` int(11) unsigned NOT NULL COMMENT '操作人ID',
  `notes` varchar(500) DEFAULT NULL COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_spare_part` (`spare_part_id`),
  KEY `idx_record_type` (`record_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存记录表';

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------
-- 3. 从 parts_inventory 同步数据到 spare_parts
-- ----------------------------
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

SELECT CONCAT('已从 parts_inventory 同步 spare_parts: ', COUNT(*), ' 条') AS result FROM spare_parts;