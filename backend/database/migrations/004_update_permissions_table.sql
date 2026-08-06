-- Update permissions table structure for RBAC
-- 更新permissions表结构以支持RBAC

-- 首先备份现有数据（如果需要）
-- CREATE TABLE permissions_backup AS SELECT * FROM permissions;

-- 删除旧表并重建
DROP TABLE IF EXISTS `permissions`;

-- 创建新的permissions表
CREATE TABLE `permissions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) DEFAULT 0 COMMENT '父权限ID',
  `name` varchar(50) NOT NULL COMMENT '权限名称',
  `code` varchar(100) NOT NULL COMMENT '权限编码',
  `type` enum('menu','button','api') DEFAULT 'api' COMMENT '权限类型',
  `path` varchar(255) DEFAULT NULL COMMENT '菜单路径',
  `icon` varchar(50) DEFAULT NULL COMMENT '图标',
  `component` varchar(255) DEFAULT NULL COMMENT '组件路径',
  `sort` int(11) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 1启用 0禁用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- 插入基础权限数据
INSERT INTO `permissions` (`name`, `code`, `type`, `parent_id`, `sort`, `status`) VALUES
-- 用户管理权限
('用户管理', 'user', 'menu', 0, 1, 1),
('查看用户', 'user:list', 'api', 1, 1, 1),
('读取用户', 'user:read', 'api', 1, 2, 1),
('创建用户', 'user:create', 'api', 1, 3, 1),
('更新用户', 'user:update', 'api', 1, 4, 1),
('删除用户', 'user:delete', 'api', 1, 5, 1),

-- 角色管理权限
('角色管理', 'role', 'menu', 0, 2, 1),
('查看角色', 'role:list', 'api', 7, 1, 1),
('读取角色', 'role:read', 'api', 7, 2, 1),
('创建角色', 'role:create', 'api', 7, 3, 1),
('更新角色', 'role:update', 'api', 7, 4, 1),
('删除角色', 'role:delete', 'api', 7, 5, 1),

-- 权限管理权限
('权限管理', 'permission', 'menu', 0, 3, 1),
('查看权限', 'permission:list', 'api', 13, 1, 1),
('读取权限', 'permission:read', 'api', 13, 2, 1),
('创建权限', 'permission:create', 'api', 13, 3, 1),
('更新权限', 'permission:update', 'api', 13, 4, 1),
('删除权限', 'permission:delete', 'api', 13, 5, 1),

-- 机械管理权限
('机械管理', 'machine', 'menu', 0, 4, 1),
('查看机械', 'machine:list', 'api', 19, 1, 1),
('读取机械', 'machine:read', 'api', 19, 2, 1),
('创建机械', 'machine:create', 'api', 19, 3, 1),
('更新机械', 'machine:update', 'api', 19, 4, 1),
('删除机械', 'machine:delete', 'api', 19, 5, 1),

-- 订单管理权限
('订单管理', 'order', 'menu', 0, 5, 1),
('查看订单', 'order:list', 'api', 25, 1, 1),
('读取订单', 'order:read', 'api', 25, 2, 1),
('创建订单', 'order:create', 'api', 25, 3, 1),
('更新订单', 'order:update', 'api', 25, 4, 1),
('删除订单', 'order:delete', 'api', 25, 5, 1),

-- 支付管理权限
('支付管理', 'payment', 'menu', 0, 6, 1),
('查看转账', 'transfer:list', 'api', 31, 1, 1),
('创建转账', 'transfer:create', 'api', 31, 2, 1),
('查看支付', 'payment:list', 'api', 31, 3, 1),
('查看发票', 'invoice:list', 'api', 31, 4, 1),
('创建发票', 'invoice:create', 'api', 31, 5, 1),

-- 统计分析权限
('统计分析', 'statistics', 'menu', 0, 7, 1),
('收入统计', 'statistics:income', 'api', 37, 1, 1),
('开支统计', 'statistics:expense', 'api', 37, 2, 1),
('订单统计', 'statistics:orders', 'api', 37, 3, 1),
('超时统计', 'statistics:timeout', 'api', 37, 4, 1),

-- 系统管理权限
('系统管理', 'system', 'menu', 0, 8, 1),
('人员管理', 'personnel:list', 'api', 42, 1, 1),
('系统日志', 'log:view', 'api', 42, 2, 1),
('系统参数', 'param:view', 'api', 42, 3, 1),

-- 营销管理权限
('营销管理', 'marketing', 'menu', 0, 9, 1),
('案例管理', 'case:list', 'api', 46, 1, 1),
('客服配置', 'service:view', 'api', 46, 2, 1),
('抖音内容', 'douyin:list', 'api', 46, 3, 1),
('合作企业', 'partner:list', 'api', 46, 4, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 为超级管理员角色分配所有权限
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, id FROM `permissions`
WHERE NOT EXISTS (
    SELECT 1 FROM `role_permissions` rp
    WHERE rp.role_id = 1 AND rp.permission_id = permissions.id
);
