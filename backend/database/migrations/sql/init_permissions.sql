-- 初始化完整的权限数据
-- 清空现有权限
TRUNCATE TABLE `permissions`;

-- 系统管理模块权限
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(1, NULL, '系统管理', 'system', 'menu', '/system', 'Setting', 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(2, 1, '用户管理', 'system.users', 'menu', '/system/users', 'User', 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(3, 2, '查看用户', 'system.users.view', 'button', NULL, NULL, 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(4, 2, '新增用户', 'system.users.create', 'button', NULL, NULL, 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(5, 2, '编辑用户', 'system.users.update', 'button', NULL, NULL, 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(6, 2, '删除用户', 'system.users.delete', 'button', NULL, NULL, 4, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(7, 1, '角色管理', 'system.roles', 'menu', '/system/roles', 'UserFilled', 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(8, 7, '查看角色', 'system.roles.view', 'button', NULL, NULL, 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(9, 7, '新增角色', 'system.roles.create', 'button', NULL, NULL, 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(10, 7, '编辑角色', 'system.roles.update', 'button', NULL, NULL, 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(11, 7, '删除角色', 'system.roles.delete', 'button', NULL, NULL, 4, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(12, 1, '权限管理', 'system.permissions', 'menu', '/system/permissions', 'Lock', 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(13, 12, '查看权限', 'system.permissions.view', 'button', NULL, NULL, 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(14, 12, '新增权限', 'system.permissions.create', 'button', NULL, NULL, 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(15, 12, '编辑权限', 'system.permissions.update', 'button', NULL, NULL, 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(16, 12, '删除权限', 'system.permissions.delete', 'button', NULL, NULL, 4, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(17, 1, '部门管理', 'system.departments', 'menu', '/system/departments', 'OfficeBuilding', 4, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(18, 17, '查看部门', 'system.departments.view', 'button', NULL, NULL, 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(19, 17, '新增部门', 'system.departments.create', 'button', NULL, NULL, 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(20, 17, '编辑部门', 'system.departments.update', 'button', NULL, NULL, 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(21, 17, '删除部门', 'system.departments.delete', 'button', NULL, NULL, 4, 1);

-- 设备管理模块权限
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(22, NULL, '设备管理', 'device', 'menu', '/devices', 'Odometer', 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(23, 22, '设备列表', 'device.list', 'menu', '/devices/list', 'List', 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(24, 23, '查看设备', 'device.view', 'button', NULL, NULL, 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(25, 23, '新增设备', 'device.create', 'button', NULL, NULL, 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(26, 23, '编辑设备', 'device.update', 'button', NULL, NULL, 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(27, 23, '删除设备', 'device.delete', 'button', NULL, NULL, 4, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(28, 22, '设备分类', 'device.categories', 'menu', '/devices/categories', 'Folder', 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(29, 28, '查看分类', 'device.categories.view', 'button', NULL, NULL, 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(30, 28, '新增分类', 'device.categories.create', 'button', NULL, NULL, 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(31, 28, '编辑分类', 'device.categories.update', 'button', NULL, NULL, 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(32, 28, '删除分类', 'device.categories.delete', 'button', NULL, NULL, 4, 1);

-- 维修管理模块权限
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(33, NULL, '维修管理', 'repair', 'menu', '/repair', 'Tools', 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(34, 33, '工单管理', 'repair.workorders', 'menu', '/repair/workorders', 'Document', 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(35, 34, '查看工单', 'repair.workorders.view', 'button', NULL, NULL, 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(36, 34, '新增工单', 'repair.workorders.create', 'button', NULL, NULL, 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(37, 34, '编辑工单', 'repair.workorders.update', 'button', NULL, NULL, 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(38, 34, '删除工单', 'repair.workorders.delete', 'button', NULL, NULL, 4, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(39, 33, '维修人员', 'repair.engineers', 'menu', '/repair/engineers', 'User', 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(40, 39, '查看人员', 'repair.engineers.view', 'button', NULL, NULL, 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(41, 39, '新增人员', 'repair.engineers.create', 'button', NULL, NULL, 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(42, 39, '编辑人员', 'repair.engineers.update', 'button', NULL, NULL, 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(43, 39, '删除人员', 'repair.engineers.delete', 'button', NULL, NULL, 4, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(44, 33, '排班管理', 'repair.schedules', 'menu', '/repair/schedules', 'Calendar', 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(45, 44, '查看排班', 'repair.schedules.view', 'button', NULL, NULL, 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(46, 44, '新增排班', 'repair.schedules.create', 'button', NULL, NULL, 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(47, 44, '编辑排班', 'repair.schedules.update', 'button', NULL, NULL, 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(48, 44, '删除排班', 'repair.schedules.delete', 'button', NULL, NULL, 4, 1);

-- 配件管理模块权限
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(49, NULL, '配件管理', 'spare', 'menu', '/spare', 'Box', 4, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(50, 49, '配件列表', 'spare.list', 'menu', '/spare/list', 'List', 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(51, 50, '查看配件', 'spare.view', 'button', NULL, NULL, 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(52, 50, '新增配件', 'spare.create', 'button', NULL, NULL, 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(53, 50, '编辑配件', 'spare.update', 'button', NULL, NULL, 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(54, 50, '删除配件', 'spare.delete', 'button', NULL, NULL, 4, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(55, 49, '库存管理', 'spare.stock', 'menu', '/spare/stock', 'Goods', 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(56, 55, '查看库存', 'spare.stock.view', 'button', NULL, NULL, 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(57, 55, '入库操作', 'spare.stock.in', 'button', NULL, NULL, 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(58, 55, '出库操作', 'spare.stock.out', 'button', NULL, NULL, 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(59, 49, '供应商管理', 'spare.suppliers', 'menu', '/spare/suppliers', 'Shop', 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(60, 59, '查看供应商', 'spare.suppliers.view', 'button', NULL, NULL, 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(61, 59, '新增供应商', 'spare.suppliers.create', 'button', NULL, NULL, 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(62, 59, '编辑供应商', 'spare.suppliers.update', 'button', NULL, NULL, 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(63, 59, '删除供应商', 'spare.suppliers.delete', 'button', NULL, NULL, 4, 1);

-- 统计报表模块权限
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(64, NULL, '统计报表', 'report', 'menu', '/report', 'DataAnalysis', 5, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(65, 64, '收入统计', 'report.income', 'menu', '/report/income', 'Money', 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(66, 65, '查看收入', 'report.income.view', 'button', NULL, NULL, 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(67, 64, '支出统计', 'report.expense', 'menu', '/report/expense', 'Wallet', 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(68, 67, '查看支出', 'report.expense.view', 'button', NULL, NULL, 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(69, 64, '订单统计', 'report.orders', 'menu', '/report/orders', 'Tickets', 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(70, 69, '查看订单', 'report.orders.view', 'button', NULL, NULL, 1, 1);

-- 知识库模块权限
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(71, NULL, '知识库', 'knowledge', 'menu', '/knowledge', 'Reading', 6, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(72, 71, '知识库管理', 'knowledge.manage', 'menu', '/knowledge/manage', 'Document', 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(73, 72, '查看知识', 'knowledge.view', 'button', NULL, NULL, 1, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(74, 72, '新增知识', 'knowledge.create', 'button', NULL, NULL, 2, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(75, 72, '编辑知识', 'knowledge.update', 'button', NULL, NULL, 3, 1);
INSERT INTO `permissions` (`id`, `parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(76, 72, '删除知识', 'knowledge.delete', 'button', NULL, NULL, 4, 1);

-- 重置自增ID
`ALTER TABLE `permissions` AUTO_INCREMENT = 77;`
