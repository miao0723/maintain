-- 检测报告表与 Web 管理端 TestReport.vue 字段对齐
-- 请在测试环境执行并备份；若列已存在可跳过对应 ALTER

ALTER TABLE `test_reports`
  MODIFY COLUMN `machine_id` int(11) DEFAULT NULL COMMENT '机械 ID';

ALTER TABLE `test_reports`
  ADD COLUMN `customer_name` varchar(100) DEFAULT NULL COMMENT '客户名称' AFTER `order_id`;

ALTER TABLE `test_reports`
  ADD COLUMN `machine_model` varchar(100) DEFAULT NULL COMMENT '机械型号' AFTER `machine_name`;

ALTER TABLE `test_reports`
  ADD COLUMN `test_result` varchar(20) DEFAULT 'qualified' COMMENT '检测结果 qualified/unqualified/partial' AFTER `test_results`;

ALTER TABLE `test_reports`
  ADD COLUMN `test_description` text COMMENT '检测描述' AFTER `test_result`;

ALTER TABLE `test_reports`
  ADD COLUMN `suggestion` text COMMENT '处理建议' AFTER `test_description`;

ALTER TABLE `test_reports`
  ADD COLUMN `test_flow_status` enum('pending','testing','completed') NOT NULL DEFAULT 'pending' COMMENT '检测流程状态' AFTER `conclusion`;

-- 以下语句仅适用于含 conclusion 列的库（如 008_repair_business_tables）；若无该列请整段注释
UPDATE `test_reports` SET `test_result` = CASE `conclusion`
  WHEN 'qualified' THEN 'qualified'
  WHEN 'unqualified' THEN 'unqualified'
  WHEN 'maintenance_required' THEN 'partial'
  ELSE 'qualified' END
WHERE `conclusion` IS NOT NULL;

ALTER TABLE `test_reports`
  ADD KEY `idx_customer_name` (`customer_name`(50)),
  ADD KEY `idx_test_flow_status` (`test_flow_status`);
