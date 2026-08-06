/*
 Navicat 可直接执行的首页看板迁移 SQL
 作用：
 1. 补充 cmms_db 的部门、设备分类、用户、设备、工程师测试数据
 2. 创建 order_engineers 表并插入工程师工单量测试数据
 3. 用于首页设备总数、设备状态分布、维修工程师工单量图表

 使用方法：
 - 在 Navicat 中连接 cmms_db 数据库后直接执行本文件
 - 如果你的 repair 库已经有 orders 数据，则首页其余卡片/图表会自动读取 repair.orders
*/

USE `cmms_db`;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 部门测试数据
-- ----------------------------
INSERT INTO `departments` (`id`, `name`, `parent_id`, `manager_id`, `sort_order`, `status`, `created_at`) VALUES
(1, '设备工程部', NULL, NULL, 1, 1, '2026-03-01 09:00:00'),
(2, '动力保障部', NULL, NULL, 2, 1, '2026-03-01 09:00:00'),
(3, '仓储物流部', NULL, NULL, 3, 1, '2026-03-01 09:00:00')
ON DUPLICATE KEY UPDATE
`name` = VALUES(`name`),
`status` = VALUES(`status`);

-- ----------------------------
-- 设备分类测试数据
-- ----------------------------
INSERT INTO `device_categories` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, '机加工设备', '数控机床、加工中心等', '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(2, '切割设备', '激光切割、火焰切割等', '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(3, '机器人设备', '焊接、搬运机器人', '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(4, '动力设备', '空压机、动力机组', '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(5, '制冷设备', '冷却系统与制冷机组', '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(6, '物流设备', '叉车、升降平台等', '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(7, '检测设备', '质量检测相关设备', '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(8, '液压设备', '液压机、压装设备', '2026-03-01 09:00:00', '2026-03-01 09:00:00')
ON DUPLICATE KEY UPDATE
`name` = VALUES(`name`),
`description` = VALUES(`description`),
`updated_at` = VALUES(`updated_at`);

-- ----------------------------
-- 工程师用户测试数据
-- role_type = 3 表示工程师
-- ----------------------------
INSERT INTO `users` (`id`, `username`, `password`, `real_name`, `email`, `phone`, `department_id`, `position`, `status`, `role_type`, `role_id`, `last_login_at`, `last_login_ip`, `created_at`, `updated_at`) VALUES
(1, 'engineer.zhang', '$2y$10$abcdefghijklmnopqrstuv', '张工', 'zhanggong@example.com', '13800138001', 1, '设备工程师', 1, 3, NULL, NULL, NULL, '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(2, 'engineer.li', '$2y$10$abcdefghijklmnopqrstuv', '李工', 'ligong@example.com', '13800138002', 1, '机械工程师', 1, 3, NULL, NULL, NULL, '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(3, 'engineer.wang', '$2y$10$abcdefghijklmnopqrstuv', '王工', 'wanggong@example.com', '13800138003', 2, '电气工程师', 1, 3, NULL, NULL, NULL, '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(4, 'engineer.zhao', '$2y$10$abcdefghijklmnopqrstuv', '赵工', 'zhaogong@example.com', '13800138004', 2, '维修技师', 1, 3, NULL, NULL, NULL, '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(5, 'engineer.liu', '$2y$10$abcdefghijklmnopqrstuv', '刘工', 'liugong@example.com', '13800138005', 3, '制冷工程师', 1, 3, NULL, NULL, NULL, '2026-03-01 09:00:00', '2026-03-01 09:00:00')
ON DUPLICATE KEY UPDATE
`real_name` = VALUES(`real_name`),
`email` = VALUES(`email`),
`phone` = VALUES(`phone`),
`department_id` = VALUES(`department_id`),
`position` = VALUES(`position`),
`status` = VALUES(`status`),
`role_type` = VALUES(`role_type`),
`updated_at` = VALUES(`updated_at`);

-- ----------------------------
-- 设备测试数据
-- status: 1正常 2维修中 3报废
-- ----------------------------
INSERT INTO `devices` (`id`, `name`, `code`, `category_id`, `department_id`, `specification`, `manufacturer`, `purchase_date`, `warranty_expiry`, `status`, `location`, `responsible_person`, `purchase_price`, `supplier`, `notes`, `created_at`, `updated_at`) VALUES
(1, '数控车床', 'DEV001', 1, 1, 'CJK-6136', '沈阳机床厂', '2024-01-15', '2027-01-15', 1, '车间A-1', '张工', 150000.00, '沈阳机床有限公司', '主力生产设备', '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(2, '激光切割机', 'DEV002', 2, 1, 'LCM-3000', '大族激光', '2024-03-20', '2027-03-20', 1, '车间B-2', '李工', 280000.00, '大族激光科技', '高精度切割', '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(3, '工业机器人', 'DEV003', 3, 1, 'IRB-4600', 'ABB', '2023-11-10', '2026-11-10', 1, '车间A-3', '王工', 450000.00, 'ABB中国', '自动化生产线', '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(4, '空压机', 'DEV004', 4, 2, 'LU315', '阿特拉斯', '2023-06-01', '2026-06-01', 1, '动力站', '赵工', 85000.00, '阿特拉斯科普柯', '车间供气', '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(5, '冷却水循环系统', 'DEV005', 5, 1, 'CWR-50', '开利', '2024-02-28', '2027-02-28', 2, '车间A-1', '张工', 120000.00, '开利公司', '正在维修中', '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(6, '焊接机器人', 'DEV006', 3, 1, 'ARCMATE', '发那科', '2023-12-01', '2026-12-01', 3, '车间B-1', '刘工', 380000.00, '发那科中国', '已报废待处理', '2026-03-01 09:00:00', '2026-03-01 09:00:00')
ON DUPLICATE KEY UPDATE
`name` = VALUES(`name`),
`category_id` = VALUES(`category_id`),
`department_id` = VALUES(`department_id`),
`status` = VALUES(`status`),
`location` = VALUES(`location`),
`responsible_person` = VALUES(`responsible_person`),
`updated_at` = VALUES(`updated_at`);

-- ----------------------------
-- 工程师资料测试数据
-- ----------------------------
INSERT INTO `engineers` (`id`, `user_id`, `skill_level`, `specialties`, `work_years`, `certification`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 4, '["电气","自动化"]', 10, '高级工程师证', 1, '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(2, 2, 3, '["机械","液压"]', 7, '维修技师证', 1, '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(3, 3, 3, '["电气","PLC"]', 6, '电气工程师证', 1, '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(4, 4, 2, '["机械"]', 3, '初级维修工', 1, '2026-03-01 09:00:00', '2026-03-01 09:00:00'),
(5, 5, 4, '["空调","制冷"]', 12, '制冷维修专家', 1, '2026-03-01 09:00:00', '2026-03-01 09:00:00')
ON DUPLICATE KEY UPDATE
`user_id` = VALUES(`user_id`),
`skill_level` = VALUES(`skill_level`),
`specialties` = VALUES(`specialties`),
`work_years` = VALUES(`work_years`),
`certification` = VALUES(`certification`),
`status` = VALUES(`status`),
`updated_at` = VALUES(`updated_at`);

-- ----------------------------
-- 工程师工单量关联表
-- 用于首页“维修工程师工单量”图表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `order_engineers` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int UNSIGNED NOT NULL COMMENT '来源订单ID/展示用订单ID',
  `engineer_id` int UNSIGNED NOT NULL COMMENT '维修工程师ID',
  `role` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '角色:1主维修 2协助维修',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_order` (`order_id`) USING BTREE,
  KEY `idx_engineer` (`engineer_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单工程师关联表';

INSERT INTO `order_engineers` (`id`, `order_id`, `engineer_id`, `role`, `created_at`) VALUES
(1, 101, 1, 1, '2026-03-20 10:00:00'),
(2, 102, 2, 1, '2026-03-20 10:10:00'),
(3, 103, 1, 1, '2026-03-21 09:00:00'),
(4, 103, 2, 2, '2026-03-21 09:05:00'),
(5, 104, 3, 1, '2026-03-22 11:00:00'),
(6, 105, 4, 1, '2026-03-23 14:30:00'),
(7, 106, 5, 1, '2026-03-24 16:20:00'),
(8, 107, 1, 1, '2026-03-25 08:50:00'),
(9, 108, 3, 1, '2026-03-25 13:10:00'),
(10, 109, 5, 1, '2026-03-26 10:15:00')
ON DUPLICATE KEY UPDATE
`order_id` = VALUES(`order_id`),
`engineer_id` = VALUES(`engineer_id`),
`role` = VALUES(`role`),
`created_at` = VALUES(`created_at`);

SET FOREIGN_KEY_CHECKS = 1;
