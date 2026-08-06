USE `cmms_db`;
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

DELETE FROM `work_order_logs` WHERE `id` >= 1000;
DELETE FROM `work_orders` WHERE `id` >= 1000;
DELETE FROM `stock_records` WHERE `id` >= 1000;
DELETE FROM `maintenance_records` WHERE `id` >= 1000;
DELETE FROM `maintenance_plans` WHERE `id` >= 1000;
DELETE FROM `inspection_tasks` WHERE `id` >= 1000;
DELETE FROM `notifications` WHERE `id` >= 1000;
DELETE FROM `schedules` WHERE `id` >= 1000;
DELETE FROM `engineers` WHERE `id` >= 1000;
DELETE FROM `knowledge_base` WHERE `id` >= 1000;
DELETE FROM `spare_parts` WHERE `id` >= 1000;
DELETE FROM `suppliers` WHERE `id` >= 1000;
DELETE FROM `devices` WHERE `id` >= 1000;
DELETE FROM `users` WHERE `id` >= 1000;
DELETE FROM `organizations` WHERE `id` >= 1000;
DELETE FROM `personnel` WHERE `id` >= 1000;
DELETE FROM `departments` WHERE `id` >= 1000;

INSERT INTO `departments` (`id`, `name`, `parent_id`, `manager_id`, `sort_order`, `status`, `created_at`) VALUES
(1000, '测试总部部门', NULL, NULL, 10, 1, '2026-04-01 09:40:00'),
(1001, '测试技术部', 1000, NULL, 11, 1, '2026-04-01 09:40:00'),
(1002, '测试维修组', 1000, NULL, 12, 1, '2026-04-01 09:40:00');

INSERT INTO `organizations` (`id`, `parent_id`, `name`, `code`, `type`, `contact`, `phone`, `address`, `sort`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(1000, NULL, '测试集团', 'T_COMP_001', 'company', '测试联系人', '13800000001', '北京市朝阳区测试路 1 号', 10, 1, '用于演示的测试单位', '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1001, 1000, '测试技术部', 'T_DEPT_001', 'department', '技术负责人', '13800000002', '北京市朝阳区测试路 1 号', 11, 1, '用于演示的测试部门', '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1002, 1000, '测试维修组', 'T_DEPT_002', 'department', '维修负责人', '13800000003', '北京市朝阳区测试路 1 号', 12, 1, '用于演示的维修组', '2026-04-01 09:40:00', '2026-04-01 09:40:00');

INSERT INTO `users` (`id`, `username`, `password`, `real_name`, `email`, `phone`, `department_id`, `position`, `status`, `role_type`, `role_id`, `last_login_at`, `last_login_ip`, `created_at`, `updated_at`) VALUES
(1000, 'test_admin', '$2y$10$7fqtuZ42xSFfInCmmysBXO/vkJSKLQuOHh8GAS0UkWg9x1LNZoWR6', '测试管理员', 'test_admin@cmms.com', '13800001000', 1000, '管理员', 1, 1, 1, NULL, NULL, '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1001, 'test_supervisor', '$2y$10$7fqtuZ42xSFfInCmmysBXO/vkJSKLQuOHh8GAS0UkWg9x1LNZoWR6', '测试主管', 'test_supervisor@cmms.com', '13800001001', 1002, '主管', 1, 2, 4, NULL, NULL, '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1002, 'test_engineer', '$2y$10$7fqtuZ42xSFfInCmmysBXO/vkJSKLQuOHh8GAS0UkWg9x1LNZoWR6', '测试工程师', 'test_engineer@cmms.com', '13800001002', 1002, '工程师', 1, 3, 5, NULL, NULL, '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1003, 'test_user', '$2y$10$7fqtuZ42xSFfInCmmysBXO/vkJSKLQuOHh8GAS0UkWg9x1LNZoWR6', '测试普通用户', 'test_user@cmms.com', '13800001003', 1001, '普通用户', 1, 4, 6, NULL, NULL, '2026-04-01 09:40:00', '2026-04-01 09:40:00');

INSERT INTO `engineers` (`id`, `user_id`, `skill_level`, `specialties`, `work_years`, `certification`, `status`, `created_at`, `updated_at`) VALUES
(1000, 1002, 3, '[\"电气\",\"机械\"]', 5, '高压电工证', 1, '2026-04-01 09:40:00', '2026-04-01 09:40:00');

INSERT INTO `suppliers` (`id`, `name`, `code`, `contact_person`, `contact_phone`, `contact_email`, `address`, `status`, `description`, `created_at`, `updated_at`) VALUES
(1000, '测试供应商A', 'SUP_T_001', '王供应', '13800002000', 'sup_a@cmms.com', '上海市浦东新区测试路 8 号', 1, '演示供应商A', '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1001, '测试供应商B', 'SUP_T_002', '李供应', '13800002001', 'sup_b@cmms.com', '深圳市福田区测试路 9 号', 1, '演示供应商B', '2026-04-01 09:40:00', '2026-04-01 09:40:00');

INSERT INTO `spare_parts` (`id`, `part_code`, `part_name`, `category_id`, `specification`, `unit`, `supplier_id`, `purchase_price`, `sale_price`, `stock_quantity`, `min_stock`, `warehouse_id`, `status`, `description`, `created_at`, `updated_at`) VALUES
(1000, 'PART_T_001', '空气滤芯', 1, 'AF-100', '个', 1000, 25.00, 35.00, 120, 20, NULL, 1, '演示用配件', '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1001, 'PART_T_002', '机油滤芯', 1, 'OF-200', '个', 1000, 30.00, 45.00, 80, 15, NULL, 1, '演示用配件', '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1002, 'PART_T_003', '皮带', 1, 'B-300', '条', 1001, 18.00, 28.00, 50, 10, NULL, 1, '演示用配件', '2026-04-01 09:40:00', '2026-04-01 09:40:00');

INSERT INTO `devices` (`id`, `name`, `code`, `category_id`, `department_id`, `specification`, `manufacturer`, `purchase_date`, `warranty_expiry`, `status`, `location`, `responsible_person`, `purchase_price`, `supplier`, `notes`, `created_at`, `updated_at`) VALUES
(1000, '数控机床A', 'DEV_T_001', 1, 1001, 'CNC-01', '测试设备厂', '2024-01-10', '2026-01-10', 1, '车间A-01', '测试工程师', 120000.00, '测试供应商A', '演示设备', '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1001, '空压机B', 'DEV_T_002', 3, 1002, 'AIR-02', '测试设备厂', '2023-06-18', '2025-06-18', 2, '机房B-02', '测试主管', 68000.00, '测试供应商B', '演示设备', '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1002, '检测仪C', 'DEV_T_003', 2, 1001, 'TEST-03', '测试仪器厂', '2022-03-05', '2024-03-05', 1, '实验室C-03', '测试管理员', 32000.00, '测试供应商A', '演示设备', '2026-04-01 09:40:00', '2026-04-01 09:40:00');

INSERT INTO `personnel` (`id`, `name`, `code`, `department_id`, `position`, `phone`, `email`, `entry_date`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(1000, '测试管理员', 'PER_T_001', 1000, 'manager', '13800003000', 'test_admin@cmms.com', '2024-01-01', 1, '测试人员', '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1001, '测试主管', 'PER_T_002', 1002, 'supervisor', '13800003001', 'test_supervisor@cmms.com', '2024-02-01', 1, '测试人员', '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1002, '测试工程师', 'PER_T_003', 1002, 'engineer', '13800003002', 'test_engineer@cmms.com', '2024-03-01', 1, '测试人员', '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1003, '测试普通用户', 'PER_T_004', 1001, 'engineer', '13800003003', 'test_user@cmms.com', '2024-04-01', 1, '测试人员', '2026-04-01 09:40:00', '2026-04-01 09:40:00');

INSERT INTO `work_orders` (`id`, `order_no`, `device_id`, `reporter_id`, `assigned_to`, `fault_type`, `fault_description`, `priority`, `status`, `start_time`, `complete_time`, `repair_record`, `repair_images`, `used_parts`, `cost_parts`, `cost_labor`, `total_cost`, `reporter_rating`, `reporter_feedback`, `version`, `created_at`, `updated_at`) VALUES
(1000, 'WO202604010001', 1000, 1003, 1002, '电气故障', '设备无法启动，疑似电源异常', 3, 1, NULL, NULL, NULL, '[\"/uploads/demo/wo1000_1.png\"]', '[{\"partId\":1000,\"quantity\":1}]', 25.00, 80.00, 105.00, NULL, NULL, 1, '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1001, 'WO202604010002', 1001, 1003, 1002, '机械故障', '异响明显，皮带松弛', 2, 2, '2026-04-01 10:05:00', NULL, NULL, '[\"/uploads/demo/wo1001_1.png\"]', '[{\"partId\":1002,\"quantity\":1}]', 18.00, 50.00, 68.00, NULL, NULL, 1, '2026-04-01 09:55:00', '2026-04-01 10:05:00'),
(1002, 'WO202604010003', 1002, 1000, 1002, '巡检异常', '检测数据漂移，需要校准', 1, 4, '2026-04-01 08:30:00', '2026-04-01 09:20:00', '完成校准并复测通过', '[\"/uploads/demo/wo1002_1.png\",\"/uploads/demo/wo1002_2.png\"]', '[]', 0.00, 60.00, 60.00, 5, '处理及时，满意', 1, '2026-04-01 08:10:00', '2026-04-01 09:20:00');

INSERT INTO `work_order_logs` (`id`, `order_id`, `action`, `operator_id`, `remark`, `created_at`) VALUES
(1000, 1000, 'created', 1003, '用户提交工单', '2026-04-01 09:40:00'),
(1001, 1000, 'assigned', 1001, '指派给测试工程师', '2026-04-01 09:45:00'),
(1002, 1001, 'created', 1003, '用户提交工单', '2026-04-01 09:55:00'),
(1003, 1001, 'accepted', 1002, '工程师接单', '2026-04-01 10:00:00'),
(1004, 1002, 'completed', 1002, '完成维修并提交验收', '2026-04-01 09:20:00');

INSERT INTO `stock_records` (`id`, `part_id`, `type`, `quantity`, `before_quantity`, `after_quantity`, `order_id`, `operator_id`, `remark`, `created_at`) VALUES
(1000, 1000, 2, 1, 120, 119, 1000, 1002, '工单 WO202604010001 使用配件', '2026-04-01 10:00:00'),
(1001, 1002, 2, 1, 50, 49, 1001, 1002, '工单 WO202604010002 使用配件', '2026-04-01 10:10:00'),
(1002, 1001, 1, 20, 80, 100, NULL, 1000, '采购入库', '2026-04-01 09:50:00');

INSERT INTO `inspection_tasks` (`id`, `task_name`, `device_id`, `inspector_id`, `plan_time`, `actual_time`, `status`, `result`, `images`, `is_abnormal`, `created_at`, `updated_at`) VALUES
(1000, '月度巡检-数控机床A', 1000, 1002, '2026-04-05', NULL, 0, NULL, NULL, 0, '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1001, '月度巡检-空压机B', 1001, 1002, '2026-04-06', '2026-04-06', 2, '发现皮带磨损，建议更换', '[\"/uploads/demo/insp1001_1.png\"]', 1, '2026-04-01 09:40:00', '2026-04-06 10:00:00');

INSERT INTO `maintenance_plans` (`id`, `plan_name`, `device_id`, `type`, `cycle_type`, `cycle_value`, `next_execute_time`, `executor_id`, `status`, `last_execute_time`, `description`, `created_at`, `updated_at`) VALUES
(1000, '空压机B 每月保养', 1001, 1, 'month', 1, '2026-05-01', 1002, 1, '2026-04-01', '检查油位、滤芯、皮带张力', '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1001, '数控机床A 季度保养', 1000, 2, 'month', 3, '2026-07-01', 1002, 1, '2026-04-01', '清洁、润滑、紧固检查', '2026-04-01 09:40:00', '2026-04-01 09:40:00');

INSERT INTO `maintenance_records` (`id`, `plan_id`, `device_id`, `executor_id`, `execute_time`, `content`, `images`, `cost`, `created_at`) VALUES
(1000, 1000, 1001, 1002, '2026-04-01', '完成空压机例行保养，更换机油滤芯', '[\"/uploads/demo/maint1000_1.png\"]', 30.00, '2026-04-01 11:00:00'),
(1001, 1001, 1000, 1002, '2026-04-01', '完成机床清洁与润滑', '[]', 0.00, '2026-04-01 11:10:00');

INSERT INTO `knowledge_base` (`id`, `title`, `fault_symptom`, `fault_cause`, `solution`, `category_id`, `device_id`, `related_part_ids`, `tags`, `difficulty_level`, `usage_count`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1000, '数控机床无法启动排查', '按下启动按钮无反应', '电源接触不良或急停未复位', '检查急停按钮；检查电源线与接线端子；确认电控柜供电正常', 1, 1000, '[1000]', '[\"电气\",\"启动\"]', 2, 3, 1, 1000, '2026-04-01 09:40:00', '2026-04-01 09:40:00'),
(1001, '空压机异响处理', '运行中异响明显', '皮带松弛或轴承磨损', '先检查皮带张力并调整/更换；若无效再检查轴承', 3, 1001, '[1002]', '[\"机械\",\"异响\"]', 2, 1, 1, 1000, '2026-04-01 09:40:00', '2026-04-01 09:40:00');

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `content`, `related_type`, `related_id`, `priority`, `is_read`, `read_at`, `extra_data`, `created_at`) VALUES
(1000, 1002, 'work_order', '新工单指派', '工单 WO202604010001 已指派给你', 'work_order', 1000, 3, 0, NULL, '{\"order_no\":\"WO202604010001\"}', '2026-04-01 09:45:00'),
(1001, 1003, 'work_order', '工单进度更新', '工单 WO202604010002 已开始处理', 'work_order', 1001, 2, 0, NULL, '{\"order_no\":\"WO202604010002\"}', '2026-04-01 10:05:00');

INSERT INTO `schedules` (`id`, `engineer_id`, `work_date`, `shift_type`, `status`, `created_at`) VALUES
(1000, 1000, '2026-04-01', 'morning', 1, '2026-04-01 09:40:00'),
(1001, 1000, '2026-04-02', 'afternoon', 1, '2026-04-01 09:40:00'),
(1002, 1000, '2026-04-03', 'night', 1, '2026-04-01 09:40:00');

-- 插入维修内容分类测试数据
INSERT INTO `maintenance_categories` (`id`, `name`, `code`, `description`, `sort`, `status`) VALUES
(1, '空调维修', 'MAINT_AC', '空调相关维修项目', 1, 1),
(2, '冰箱维修', 'MAINT_FRIDGE', '冰箱相关维修项目', 2, 1),
(3, '洗衣机维修', 'MAINT_WASHER', '洗衣机相关维修项目', 3, 1),
(4, '热水器维修', 'MAINT_WATER_HEATER', '热水器相关维修项目', 4, 1),
(5, '电视机维修', 'MAINT_TV', '电视机相关维修项目', 5, 1),
(6, '电脑维修', 'MAINT_COMPUTER', '电脑相关维修项目', 6, 1),
(7, '网络设备维修', 'MAINT_NETWORK', '网络设备相关维修项目', 7, 1),
(8, '其他维修', 'MAINT_OTHER', '其他维修项目', 99, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 插入维修内容测试数据
INSERT INTO `maintenance_items` (`id`, `code`, `name`, `category_id`, `unit`, `price`, `description`, `sort`, `status`) VALUES
-- 空调维修
(1000, 'AC-001', '空调清洗', 1, '次', 100.00, '空调内机深度清洗服务，包括蒸发器、风轮等部件', 1, 1),
(1001, 'AC-002', '空调加氟', 1, '次', 150.00, '空调制冷剂补充服务', 2, 1),
(1002, 'AC-003', '空调维修 - 不制冷', 1, '次', 200.00, '空调不制冷故障排查与维修', 3, 1),
(1003, 'AC-004', '空调维修 - 不制热', 1, '次', 200.00, '空调不制热故障排查与维修', 4, 1),
(1004, 'AC-005', '空调漏水维修', 1, '次', 180.00, '空调漏水问题排查与修复', 5, 1),
(1005, 'AC-006', '空调异响处理', 1, '次', 150.00, '空调运行异响排查与处理', 6, 1),
-- 冰箱维修
(2000, 'FR-001', '冰箱清洗消毒', 2, '次', 120.00, '冰箱内外清洁与消毒服务', 1, 1),
(2001, 'FR-002', '冰箱不制冷维修', 2, '次', 250.00, '冰箱不制冷故障排查与维修', 2, 1),
(2002, 'FR-003', '冰箱门封更换', 2, '个', 100.00, '冰箱门封条更换服务', 3, 1),
(2003, 'FR-004', '冰箱温控器维修', 2, '次', 200.00, '冰箱温控器故障维修', 4, 1),
(2004, 'FR-005', '冰箱除霜维修', 2, '次', 150.00, '冰箱除霜系统故障维修', 5, 1),
-- 洗衣机维修
(3000, 'WS-001', '洗衣机清洗', 3, '次', 100.00, '洗衣机内筒深度清洗', 1, 1),
(3001, 'WS-002', '洗衣机不排水维修', 3, '次', 180.00, '洗衣机排水故障维修', 2, 1),
(3002, 'WS-003', '洗衣机不转动维修', 3, '次', 220.00, '洗衣机滚筒不转动故障维修', 3, 1),
(3003, 'WS-004', '洗衣机漏水维修', 3, '次', 200.00, '洗衣机漏水问题排查与修复', 4, 1),
(3004, 'WS-005', '洗衣机异响处理', 3, '次', 150.00, '洗衣机运行异响排查与处理', 5, 1),
-- 热水器维修
(4000, 'WH-001', '热水器清洗保养', 4, '次', 150.00, '热水器内胆清洗与保养', 1, 1),
(4001, 'WH-002', '热水器不加热维修', 4, '次', 200.00, '热水器加热故障维修', 2, 1),
(4002, 'WH-003', '热水器漏水维修', 4, '次', 180.00, '热水器漏水问题排查与修复', 3, 1),
(4003, 'WH-004', '热水器温控器更换', 4, '个', 120.00, '热水器温控器更换服务', 4, 1),
-- 电视机维修
(5000, 'TV-001', '电视机黑屏维修', 5, '次', 300.00, '电视机黑屏故障排查与维修', 1, 1),
(5001, 'TV-002', '电视机无声音维修', 5, '次', 200.00, '电视机无声音故障维修', 2, 1),
(5002, 'TV-003', '电视机无法开机维修', 5, '次', 250.00, '电视机无法开机故障维修', 3, 1),
(5003, 'TV-004', '电视机画面异常维修', 5, '次', 280.00, '电视机画面异常故障维修', 4, 1),
-- 电脑维修
(6000, 'PC-001', '电脑系统重装', 6, '次', 150.00, '电脑操作系统安装与配置', 1, 1),
(6001, 'PC-002', '电脑无法开机维修', 6, '次', 200.00, '电脑无法开机故障排查与维修', 2, 1),
(6002, 'PC-003', '电脑蓝屏维修', 6, '次', 180.00, '电脑蓝屏故障排查与修复', 3, 1),
(6003, 'PC-004', '电脑硬件升级', 6, '次', 100.00, '电脑硬件升级安装服务', 4, 1),
(6004, 'PC-005', '电脑病毒查杀', 6, '次', 80.00, '电脑病毒查杀与清理', 5, 1),
-- 网络设备维修
(7000, 'NET-001', '路由器维修', 7, '次', 150.00, '路由器故障排查与维修', 1, 1),
(7001, 'NET-002', '交换机维修', 7, '次', 200.00, '交换机故障排查与维修', 2, 1),
(7002, 'NET-003', '网络布线', 7, '米', 30.00, '网络综合布线服务', 3, 1),
(7003, 'NET-004', '网络调试', 7, '次', 100.00, '网络配置与调试服务', 4, 1),
-- 其他维修
(9000, 'OTH-001', '家电维修咨询', 8, '次', 50.00, '家电维修技术咨询', 1, 1),
(9001, 'OTH-002', '上门检测费', 8, '次', 80.00, '上门故障检测服务费', 2, 1),
(9002, 'OTH-003', '配件更换安装', 8, '次', 100.00, '配件更换与安装服务', 3, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
