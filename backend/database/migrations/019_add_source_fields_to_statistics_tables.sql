-- 添加源数据追踪字段到统计表
-- 这样可以从实际业务数据同步到统计表

USE cmms_db;

ALTER TABLE `statistics_income_records`
ADD COLUMN `source_type` VARCHAR(20) DEFAULT NULL COMMENT '来源类型: online/transfer/invoice' AFTER `remark`,
ADD COLUMN `source_id` INT DEFAULT NULL COMMENT '来源记录ID' AFTER `source_type`,
ADD INDEX `idx_source` (`source_type`, `source_id`);

ALTER TABLE `statistics_order_records`
ADD COLUMN `source_type` VARCHAR(20) DEFAULT NULL COMMENT '来源类型: order/quotation' AFTER `created_at`,
ADD COLUMN `source_id` INT DEFAULT NULL COMMENT '来源记录ID' AFTER `source_type`,
ADD INDEX `idx_source` (`source_type`, `source_id`);
