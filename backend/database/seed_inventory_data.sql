-- ============================================================
-- 进销存测试数据迁移文件（精简版）
-- 执行时间：2026-04-03
-- 使用 INSERT IGNORE 避免重复数据报错
-- ============================================================

SET NAMES utf8mb4;

-- ----------------------------
-- 1. 供应商测试数据 (仅 3 条)
-- ----------------------------
INSERT IGNORE INTO `suppliers` (`id`, `name`, `code`, `contact_person`, `contact_phone`, `contact_email`, `address`, `status`, `description`, `created_at`, `updated_at`) VALUES
(101, '上海汽配有限公司', 'SUP001', '张经理', '13800138001', 'zhang@shanghai-auto.com', '上海市浦东新区汽车大道 123 号', 1, '主要供应商，合作良好', NOW(), NOW()),
(102, '北京机电设备有限公司', 'SUP002', '李经理', '13800138002', 'li@beijing-mech.com', '北京市朝阳区工业路 456 号', 1, '机械设备专业供应商', NOW(), NOW()),
(103, '深圳电子元件厂', 'SUP003', '王经理', '13800138003', 'wang@shenzhen-electronics.com', '深圳市南山区科技园 789 号', 1, '电子元件专业厂家', NOW(), NOW());

-- ----------------------------
-- 2. 配件分类测试数据 (仅 3 条)
-- ----------------------------
INSERT IGNORE INTO `device_categories` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(101, '滤芯类', '各种过滤器滤芯', NOW(), NOW()),
(102, '电子元件', '电子设备相关元件', NOW(), NOW()),
(103, '机械零件', '机械设备零件', NOW(), NOW());

-- ----------------------------
-- 3. 配件测试数据 (仅 6 条，每个分类 2 条)
-- ----------------------------
INSERT IGNORE INTO `spare_parts` (`id`, `part_code`, `part_name`, `category_id`, `specification`, `unit`, `supplier_id`, `purchase_price`, `sale_price`, `stock_quantity`, `min_stock`, `warehouse_id`, `status`, `description`, `created_at`, `updated_at`) VALUES
-- 滤芯类 (2 条)
(201, 'PART001', '空气滤芯', 101, '通用型 A-100', '个', 101, 25.00, 45.00, 50, 20, 'A 区 -01', 1, '适用于多种设备', NOW(), NOW()),
(202, 'PART002', '机油滤芯', 101, '通用型 B-200', '个', 101, 35.00, 60.00, 30, 15, 'A 区 -02', 1, '发动机专用', NOW(), NOW()),

-- 电子元件 (2 条)
(203, 'PART005', '接触器', 102, 'CJX2-2510', '个', 103, 85.00, 150.00, 20, 5, 'B 区 -01', 1, '交流接触器', NOW(), NOW()),
(204, 'PART006', '断路器', 102, 'DZ47-63', '个', 103, 25.00, 45.00, 100, 30, 'B 区 -02', 1, '小型断路器', NOW(), NOW()),

-- 机械零件 (2 条)
(205, 'PART009', '皮带', 103, 'A 型 1200mm', '条', 102, 35.00, 65.00, 40, 15, 'C 区 -01', 1, '三角皮带', NOW(), NOW()),
(206, 'PART010', '链条', 103, '08B-1', '米', 102, 20.00, 38.00, 100, 50, 'C 区 -02', 1, '滚子链条', NOW(), NOW());

-- ----------------------------
-- 4. 库存记录测试数据 (仅 6 条)
-- ----------------------------
INSERT IGNORE INTO `stock_records` (`id`, `part_id`, `type`, `quantity`, `before_quantity`, `after_quantity`, `order_id`, `operator_id`, `remark`, `created_at`) VALUES
(301, 201, 1, 100, 0, 100, NULL, 2, '初始入库', NOW()),
(302, 201, 2, 50, 100, 50, NULL, 2, '维修领用', NOW()),
(303, 203, 1, 30, 0, 30, NULL, 2, '初始入库', NOW()),
(304, 204, 1, 150, 0, 150, NULL, 2, '初始入库', NOW()),
(305, 205, 1, 50, 0, 50, NULL, 2, '初始入库', NOW()),
(306, 206, 2, 50, 100, 50, NULL, 2, '批量领用', NOW());

-- 显示统计信息
SELECT '=== 数据导入完成 ===' as message;
SELECT COUNT(*) as 供应商数量 FROM suppliers WHERE id >= 101;
SELECT COUNT(*) as 配件分类数量 FROM device_categories WHERE id >= 101;
SELECT COUNT(*) as 配件数量 FROM spare_parts WHERE id >= 201;
SELECT COUNT(*) as 库存记录数量 FROM stock_records WHERE id >= 301;
