-- 007: 公司内部人员免付款订单支持
-- 可直接在 Navicat 查询窗口中运行
--
-- 说明：
-- 1. users.role 增加 'internal'（公司内部人员）
-- 2. orders.status 增加 'internal_pending'（内部免付款申请，待管理员确认）
-- 3. orders 增加 is_internal / confirmed_by / confirmed_at 字段
-- 4. payment_status 约定新增 'waived' 表示「免付款」（内部订单确认后使用）

-- ============================================
-- 1. 扩展 users.role 枚举
-- ============================================
SET @db = DATABASE();

-- 通过修改列的方式扩展枚举（兼容已存在数据）
ALTER TABLE users
  MODIFY COLUMN `role` enum('user','admin','super_admin','internal')
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'user'
  COMMENT '用户角色: user-普通用户, admin-管理员, super_admin-超级管理员, internal-公司内部人员';

-- ============================================
-- 2. 扩展 orders.status 枚举
-- ============================================
ALTER TABLE orders
  MODIFY COLUMN `status` enum('pending','quoted','confirmed','processing','completed','review','cancelled','internal_pending')
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending'
  COMMENT '订单状态: pending-待处理, quoted-待确认报价, confirmed-已确认报价, processing-维修/处理中, completed-已完成, review-待评价, cancelled-已取消, internal_pending-内部免付款申请待确认';

-- ============================================
-- 3. orders 增加内部订单相关字段
-- ============================================
ALTER TABLE orders
  ADD COLUMN `is_internal` TINYINT(1) NULL DEFAULT 0 COMMENT '是否内部人员免付款订单: 0-否, 1-是'
  AFTER `payment_status`;

ALTER TABLE orders
  ADD COLUMN `confirmed_by` INT NULL COMMENT '内部订单确认管理员ID'
  AFTER `is_internal`;

ALTER TABLE orders
  ADD COLUMN `confirmed_at` TIMESTAMP NULL COMMENT '内部订单确认时间'
  AFTER `confirmed_by`;

-- ============================================
-- 4. 内部订单确认记录表（审计用）
-- ============================================
DROP TABLE IF EXISTS `internal_orders_log`;
CREATE TABLE `internal_orders_log`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int NOT NULL COMMENT '关联订单ID',
  `confirmed_by` int NULL DEFAULT NULL COMMENT '确认管理员ID',
  `confirmed_at` datetime NULL DEFAULT NULL COMMENT '确认时间',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '确认备注',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_internal_log_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_internal_log_confirmed_by`(`confirmed_by` ASC) USING BTREE,
  CONSTRAINT `fk_internal_log_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '内部免付款订单确认记录表' ROW_FORMAT = DYNAMIC;

-- ============================================
-- 完成
-- ============================================
SELECT '迁移 007 执行完成（内部人员免付款订单支持）' AS result;
