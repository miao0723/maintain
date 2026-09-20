-- 备份时间: 2026-09-19T14:39:12.869398
-- 目的: 删除前备份两张确认未被任何代码引用的表（结构 + 数据）
SET NAMES utf8mb4;

-- ---- cmms_db.permissions_backup （1 行） ----
CREATE DATABASE IF NOT EXISTS `cmms_db` DEFAULT CHARACTER SET utf8mb4;
USE `cmms_db`;
DROP TABLE IF EXISTS `permissions_backup`;
CREATE TABLE `permissions_backup` (
  `id` int unsigned NOT NULL DEFAULT '0' COMMENT '权限ID',
  `user_id` int unsigned NOT NULL COMMENT '用户ID',
  `module` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '模块名称',
  `actions` json NOT NULL COMMENT '权限操作',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC;
INSERT INTO `permissions_backup` (`id`, `user_id`, `module`, `actions`, `created_at`, `updated_at`) VALUES
(1, 1, 'devices', '["view", "create", "update", "delete"]', '2026-03-30 23:38:42', '2026-03-30 23:38:42');

-- ---- repair.repair_notifications （0 行） ----
CREATE DATABASE IF NOT EXISTS `repair` DEFAULT CHARACTER SET utf8mb4;
USE `repair`;
DROP TABLE IF EXISTS `repair_notifications`;
CREATE TABLE `repair_notifications` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `order_id` int NOT NULL COMMENT '订单ID',
  `user_id` int NOT NULL COMMENT '接收通知的用户ID',
  `type` enum('order_created','quote_pending','quote_accepted','quote_rejected','repair_started','repair_completed','delivery_assigned','delivery_shipped','delivery_delivered') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知类型',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '通知内容',
  `is_read` tinyint(1) DEFAULT '0' COMMENT '是否已读',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '通知时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_notif_user_id` (`user_id`) USING BTREE,
  KEY `idx_notif_order_id` (`order_id`) USING BTREE,
  KEY `idx_notif_is_read` (`is_read`) USING BTREE,
  KEY `idx_notif_created_at` (`created_at`) USING BTREE,
  CONSTRAINT `fk_notif_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC COMMENT='维修通知表';
