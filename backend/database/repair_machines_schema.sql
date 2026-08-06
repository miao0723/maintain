-- ============================================================
-- 维修业务 - 机械分类和机械名称表
-- 执行时间：2026-04-03
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 机械分类表 (repair_categories)
-- ----------------------------
DROP TABLE IF EXISTS `repair_categories`;
CREATE TABLE `repair_categories` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类 ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类编码',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '描述',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：1 启用 0 禁用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_sort`(`sort` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '机械分类表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- 2. 机械名称表 (repair_machines)
-- ----------------------------
DROP TABLE IF EXISTS `repair_machines`;
CREATE TABLE `repair_machines` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '机械 ID',
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '机械名称',
  `model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '型号',
  `category_id` int UNSIGNED NOT NULL COMMENT '分类 ID',
  `manufacturer` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '制造商',
  `power` decimal(10, 2) NULL DEFAULT NULL COMMENT '功率 (kW)',
  `weight` decimal(10, 2) NULL DEFAULT NULL COMMENT '工作重量 (吨)',
  `specifications` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '规格参数',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：1 启用 0 禁用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_category`(`category_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '机械名称表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- 3. 插入机械分类测试数据 (6 条)
-- ----------------------------
INSERT INTO `repair_categories` (`id`, `name`, `code`, `description`, `sort`, `status`, `created_at`, `updated_at`) VALUES
(1, '挖掘机械', 'EXCAVATOR', '各类挖掘机设备，包括履带式、轮式挖掘机等', 1, 1, NOW(), NOW()),
(2, '起重机械', 'CRANE', '各类起重机、吊车设备，包括塔吊、汽车吊等', 2, 1, NOW(), NOW()),
(3, '混凝土机械', 'CONCRETE', '混凝土泵车、搅拌车、搅拌站等设备', 3, 1, NOW(), NOW()),
(4, '路面机械', 'ROAD', '压路机、摊铺机、平地机等路面施工设备', 4, 1, NOW(), NOW()),
(5, '桩工机械', 'PILE', '打桩机、钻机等基础施工设备', 5, 1, NOW(), NOW()),
(6, '铲土运输机械', 'EARTH', '装载机、推土机、铲运机等铲土运输设备', 6, 1, NOW(), NOW());

-- ----------------------------
-- 4. 插入机械名称测试数据 (12 条)
-- ----------------------------
INSERT INTO `repair_machines` (`id`, `name`, `model`, `category_id`, `manufacturer`, `power`, `weight`, `specifications`, `status`, `created_at`, `updated_at`) VALUES
-- 挖掘机械 (3 条)
(1, '履带式挖掘机', 'CAT320D', 1, '卡特彼勒', 103.00, 20.50, '斗容 1.2m³，挖掘深度 6.5m，发动机功率 103kW', 1, NOW(), NOW()),
(2, '液压挖掘机', 'SY215C', 1, '三一重工', 114.00, 21.50, '斗容 1.0m³，挖掘深度 6.2m，液压系统压力 34.3MPa', 1, NOW(), NOW()),
(3, '小型挖掘机', 'KUBOTA U35', 1, '久保田', 22.00, 3.50, '微型挖掘机，适合狭小空间作业，履带宽度 350mm', 1, NOW(), NOW()),

-- 起重机械 (2 条)
(4, '汽车起重机', 'QY25K5', 2, '徐工集团', 260.00, 32.00, '最大起重量 25 吨，主臂长度 40m，五节臂', 1, NOW(), NOW()),
(5, '塔式起重机', 'QTZ80', 2, '中联重科', 75.00, 45.00, '最大起重力矩 800kN·m，最大起重量 8 吨，臂长 50m', 0, NOW(), NOW()),

-- 混凝土机械 (2 条)
(6, '混凝土泵车', 'HBT60.13.130RS', 3, '三一重工', 160.00, 28.00, '最大理论输送量 60m³/h，输送压力 13MPa，臂长 43m', 1, NOW(), NOW()),
(7, '混凝土搅拌车', 'JS12', 3, '东风汽车', 210.00, 18.00, '搅拌容量 12 立方米，额定载重 18 吨', 1, NOW(), NOW()),

-- 路面机械 (2 条)
(8, '单钢轮压路机', 'XS203J', 4, '徐工集团', 129.00, 20.00, '工作质量 20 吨，振动频率 28-45Hz，振幅 1.8/0.9mm', 1, NOW(), NOW()),
(9, '沥青摊铺机', 'RP953', 4, '三一重工', 118.00, 12.50, '摊铺宽度 2.5-9m，最大摊铺厚度 300mm', 1, NOW(), NOW()),

-- 桩工机械 (2 条)
(10, '旋挖钻机', 'SR280', 5, '山河智能', 280.00, 80.00, '最大钻孔直径 2.5m，最大钻孔深度 80m，扭矩 280kN·m', 1, NOW(), NOW()),
(11, '打桩机', 'DZJ-90', 5, '上海机械', 90.00, 35.00, '最大打桩深度 45m，锤击能量 90kJ', 1, NOW(), NOW()),

-- 铲土运输机械 (1 条)
(12, '轮式装载机', 'LW300KN', 6, '徐工集团', 162.00, 11.00, '额定载重量 3 吨，斗容 1.8m³，卸载高度 3.2m', 1, NOW(), NOW());

-- ----------------------------
-- 统计信息
-- ----------------------------
SELECT '=== 机械分类和机械名称数据导入完成 ===' as message;
SELECT COUNT(*) as 分类数量 FROM repair_categories;
SELECT COUNT(*) as 机械数量 FROM repair_machines;

SET FOREIGN_KEY_CHECKS = 1;
