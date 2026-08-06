/*
CMMS 系统表迁移脚本
功能：添加 RBAC 权限管理、单位管理、人员管理、系统参数、系统日志等系统表
创建日期：2026-03-31
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 添加 role_id 字段到 users 表
-- ----------------------------
ALTER TABLE `users`
ADD COLUMN `role_id` int UNSIGNED NULL DEFAULT NULL COMMENT '角色 ID' AFTER `role_type`,
ADD INDEX `idx_role_id`(`role_id` ASC) USING BTREE;

-- ----------------------------
-- 2. 重构 permissions 表（先备份旧数据）
-- ----------------------------
DROP TABLE IF EXISTS `permissions_backup`;
CREATE TABLE `permissions_backup` AS SELECT * FROM `permissions`;

-- 删除旧权限表
DROP TABLE IF EXISTS `permissions`;

-- 创建新的权限表（支持树形结构）
CREATE TABLE `permissions` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '权限 ID',
  `parent_id` int UNSIGNED NULL DEFAULT NULL COMMENT '父权限 ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限名称',
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限代码',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'menu' COMMENT '类型：menu 菜单 button 按钮',
  `path` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '路由路径',
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '图标',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1 启用 0 禁用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
  INDEX `idx_parent`(`parent_id` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表' ROW_FORMAT=Dynamic;

-- ----------------------------
-- 3. 创建 roles 表（角色表）
-- ----------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色 ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色代码',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '角色描述',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1 启用 0 禁用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表' ROW_FORMAT=Dynamic;

-- ----------------------------
-- 4. 创建 role_permissions 表（角色权限关联表）
-- ----------------------------
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `role_id` int UNSIGNED NOT NULL COMMENT '角色 ID',
  `permission_id` int UNSIGNED NOT NULL COMMENT '权限 ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_role_permission`(`role_id` ASC, `permission_id` ASC) USING BTREE,
  INDEX `idx_permission`(`permission_id` ASC) USING BTREE,
  INDEX `idx_role`(`role_id` ASC) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表' ROW_FORMAT=Dynamic;

-- ----------------------------
-- 5. 创建 organizations 表（单位管理表）
-- ----------------------------
DROP TABLE IF EXISTS `organizations`;
CREATE TABLE `organizations` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '单位 ID',
  `parent_id` int UNSIGNED NULL DEFAULT NULL COMMENT '父单位 ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '单位名称',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '单位代码',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'company' COMMENT '单位类型：company 公司 department 部门 project 项目组',
  `contact` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '联系人',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '联系电话',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '地址',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1 启用 0 禁用',
  `notes` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
  INDEX `idx_parent`(`parent_id` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='单位表' ROW_FORMAT=Dynamic;

-- ----------------------------
-- 6. 创建 personnel 表（人员管理表）
-- ----------------------------
DROP TABLE IF EXISTS `personnel`;
CREATE TABLE `personnel` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '人员 ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '姓名',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '工号',
  `department_id` int UNSIGNED NULL DEFAULT NULL COMMENT '部门 ID',
  `position` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '岗位：engineer 工程师 supervisor 主管经理 manager 经理',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '手机号',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '邮箱',
  `entry_date` date NULL DEFAULT NULL COMMENT '入职日期',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1 在职 0 离职',
  `notes` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
  INDEX `idx_department`(`department_id` ASC) USING BTREE,
  INDEX `idx_position`(`position` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='人员表' ROW_FORMAT=Dynamic;

-- ----------------------------
-- 7. 创建 system_params 表（系统参数表）
-- ----------------------------
DROP TABLE IF EXISTS `system_params`;
CREATE TABLE `system_params` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '参数 ID',
  `group_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '参数分组',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '参数名称',
  `param_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '参数键',
  `param_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '参数值',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '参数描述',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_param_key`(`param_key` ASC) USING BTREE,
  INDEX `idx_group`(`group_name` ASC) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统参数表' ROW_FORMAT=Dynamic;

-- ----------------------------
-- 8. 创建 system_logs 表（系统日志表）
-- ----------------------------
DROP TABLE IF EXISTS `system_logs`;
CREATE TABLE `system_logs` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志 ID',
  `log_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '日志类型：login, operation, error, system',
  `user_id` int UNSIGNED NULL DEFAULT NULL COMMENT '用户 ID',
  `operator` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '操作人',
  `module` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '模块',
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '操作动作',
  `ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'IP 地址',
  `params` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '请求参数',
  `result` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '操作结果',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_type`(`log_type` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_module`(`module` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统日志表' ROW_FORMAT=Dynamic;

-- ----------------------------
-- 插入初始数据
-- ----------------------------

-- 插入角色数据
INSERT INTO `roles` (`name`, `code`, `description`, `status`) VALUES
('超级管理员', 'admin', '拥有系统所有权限', 1),
('系统管理员', 'system_admin', '系统管理员权限', 1),
('部门经理', 'department_manager', '部门经理权限', 1),
('维修主管', 'supervisor', '维修主管权限', 1),
('维修工程师', 'engineer', '维修工程师权限', 1),
('普通用户', 'user', '普通用户权限', 1);

-- 插入权限数据（菜单权限）
INSERT INTO `permissions` (`parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(NULL, '系统管理', 'system', 'menu', '/system', 'Setting', 100, 1),
(NULL, '用户管理', 'system:users', 'menu', '/system/users', 'User', 101, 1),
(NULL, '角色管理', 'system:roles', 'menu', '/system/roles', 'UserFilled', 102, 1),
(NULL, '权限管理', 'system:permissions', 'menu', '/system/permissions', 'Lock', 103, 1),
(NULL, '部门管理', 'system:departments', 'menu', '/system/departments', 'OfficeBuilding', 104, 1),
(NULL, '单位管理', 'system:organizations', 'menu', '/system/organizations', 'Building', 105, 1),
(NULL, '人员管理', 'system:personnel', 'menu', '/system/personnel', 'User', 106, 1),
(NULL, '系统参数', 'system:params', 'menu', '/system/params', 'Cpu', 107, 1),
(NULL, '系统日志', 'system:logs', 'menu', '/system/logs', 'Document', 108, 1);

-- 插入按钮权限
INSERT INTO `permissions` (`parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(2, '用户查看', 'system:users:view', 'button', NULL, NULL, 1, 1),
(2, '用户创建', 'system:users:create', 'button', NULL, NULL, 2, 1),
(2, '用户编辑', 'system:users:update', 'button', NULL, NULL, 3, 1),
(2, '用户删除', 'system:users:delete', 'button', NULL, NULL, 4, 1),
(3, '角色查看', 'system:roles:view', 'button', NULL, NULL, 1, 1),
(3, '角色创建', 'system:roles:create', 'button', NULL, NULL, 2, 1),
(3, '角色编辑', 'system:roles:update', 'button', NULL, NULL, 3, 1),
(3, '角色删除', 'system:roles:delete', 'button', NULL, NULL, 4, 1),
(3, '角色权限', 'system:roles:permissions', 'button', NULL, NULL, 5, 1);

-- 为 admin 角色分配所有权限
SET @admin_role_id = (SELECT id FROM roles WHERE code = 'admin');
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT @admin_role_id, id FROM `permissions`;

-- 插入系统参数数据
INSERT INTO `system_params` (`group_name`, `name`, `param_key`, `param_value`, `description`) VALUES
('系统设置', '系统名称', 'system_name', 'CMMS 设备维修管理系统', '系统显示名称'),
('系统设置', '系统 Logo', 'system_logo', '/logo.png', '系统 Logo 路径'),
('系统设置', '默认分页大小', 'page_size', '20', '默认每页显示条数'),
('工单设置', '工单前缀', 'workorder_prefix', 'WO', '工单号前缀'),
('工单设置', '自动派单', 'auto_assign', '0', '是否开启自动派单 0 关闭 1 开启'),
('通知设置', '邮件通知', 'email_notify', '1', '是否开启邮件通知 0 关闭 1 开启');

SET FOREIGN_KEY_CHECKS = 1;

-- 迁移完成提示
SELECT '系统表迁移完成！' AS message;
