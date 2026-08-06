-- 为 repair_reports 表添加 machine_id 字段的默认值允许 NULL
ALTER TABLE `repair_reports` MODIFY COLUMN `machine_id` int(11) DEFAULT NULL COMMENT '机械 ID';
