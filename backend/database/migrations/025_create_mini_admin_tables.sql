CREATE TABLE IF NOT EXISTS `mini_admin_roles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mini_admin_roles_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mini_admin_permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(120) NOT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'menu',
  `path` varchar(255) DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `sort` int NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mini_admin_permissions_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mini_admin_users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `real_name` varchar(100) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `role_id` int unsigned NOT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mini_admin_users_username` (`username`),
  KEY `idx_mini_admin_users_role_id` (`role_id`),
  CONSTRAINT `fk_mini_admin_users_role_id` FOREIGN KEY (`role_id`) REFERENCES `mini_admin_roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mini_admin_role_permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `role_id` int unsigned NOT NULL,
  `permission_id` int unsigned NOT NULL,
  `permissions` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mini_admin_role_permission` (`role_id`,`permission_id`),
  CONSTRAINT `fk_mini_admin_role_permissions_role_id` FOREIGN KEY (`role_id`) REFERENCES `mini_admin_roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mini_admin_role_permissions_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `mini_admin_permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `mini_admin_roles` (`id`, `name`, `code`, `description`, `status`)
VALUES
  (1, '超级管理员', 'super_admin', '拥有小程序后台全部权限', 1),
  (2, '运营管理员', 'operator', '拥有常规运营权限', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`), `status` = VALUES(`status`);

INSERT INTO `mini_admin_permissions` (`id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`)
VALUES
  (1, '仪表盘', 'dashboard:list', 'menu', '/mini-admin/dashboard', 'DataBoard', 1, 1),
  (2, '订单管理', 'orders:*', 'menu', '/mini-admin/orders', 'Tickets', 2, 1),
  (3, '进度申请', 'progress_apply:*', 'menu', '/mini-admin/progress-apply', 'Clock', 3, 1),
  (4, '进度媒体', 'progress_media:*', 'menu', '/mini-admin/progress-media', 'Film', 4, 1),
  (5, '评价管理', 'reviews:*', 'menu', '/mini-admin/reviews', 'ChatDotRound', 5, 1),
  (6, '用户管理', 'users:*', 'menu', '/mini-admin/users', 'User', 6, 1),
  (7, '地址管理', 'addresses:*', 'menu', '/mini-admin/addresses', 'Location', 7, 1),
  (8, '单位管理', 'units:*', 'menu', '/mini-admin/units', 'OfficeBuilding', 8, 1),
  (9, '品牌管理', 'brands:*', 'menu', '/mini-admin/brands', 'CollectionTag', 9, 1),
  (10, '设备类型', 'device_types:*', 'menu', '/mini-admin/device-types', 'Cpu', 10, 1),
  (11, '常见问题', 'common_problems:*', 'menu', '/mini-admin/common-problems', 'QuestionFilled', 11, 1),
  (12, '客服会话', 'chats:*', 'menu', '/mini-admin/chats', 'Service', 12, 1),
  (13, '支付记录', 'payments:*', 'menu', '/mini-admin/payments', 'Wallet', 13, 1),
  (14, '系统配置', 'configs:*', 'menu', '/mini-admin/configs', 'Tools', 14, 1),
  (15, '同步日志', 'sync_logs:*', 'menu', '/mini-admin/sync-logs', 'Document', 15, 1)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `type` = VALUES(`type`),
  `path` = VALUES(`path`),
  `icon` = VALUES(`icon`),
  `sort` = VALUES(`sort`),
  `status` = VALUES(`status`);

INSERT INTO `mini_admin_role_permissions` (`role_id`, `permission_id`, `permissions`)
SELECT 1, p.id, JSON_OBJECT('canView', true, 'canEdit', true, 'canDelete', true)
FROM `mini_admin_permissions` p
WHERE NOT EXISTS (
  SELECT 1 FROM `mini_admin_role_permissions` rp WHERE rp.role_id = 1 AND rp.permission_id = p.id
);

INSERT INTO `mini_admin_users` (`id`, `username`, `password`, `real_name`, `status`, `role_id`)
VALUES
  (1, 'miniadmin', '$2y$10$GkY682c6BQniFDUXaXszpeeWx0f7FgOG0pwpPBkeGMIFlGE8GIMSm', '小程序后台管理员', 1, 1)
ON DUPLICATE KEY UPDATE
  `real_name` = VALUES(`real_name`),
  `status` = VALUES(`status`),
  `role_id` = VALUES(`role_id`);
