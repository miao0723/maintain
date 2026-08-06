-- 为 repair_reports 表添加 order_no 和 source_order_id 字段
-- 用于支持从电子维修库导入订单案例

ALTER TABLE `repair_reports` 
ADD COLUMN `order_no` VARCHAR(50) NULL DEFAULT NULL COMMENT '订单号（来自电子维修库）' AFTER `order_id`,
ADD COLUMN `source_order_id` INT(11) NULL DEFAULT NULL COMMENT '电子维修库原订单ID' AFTER `order_no`,
ADD INDEX `idx_order_no` (`order_no`),
ADD INDEX `idx_source_order_id` (`source_order_id`);
