/*
CMMS 系统测试数据插入脚本
功能：为人员管理、单位管理、日志管理添加测试数据
创建日期：2026-03-31
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 插入单位数据 (organizations)
-- ----------------------------
INSERT INTO `organizations` (`parent_id`, `name`, `code`, `type`, `contact`, `phone`, `address`, `sort`, `status`, `notes`) VALUES
(NULL, '总公司', 'COMP001', 'company', '张总', '13800138000', '北京市朝阳区 CBD 商务中心 A 座 1 层', 1, 1, '公司总部'),
(1, '上海分公司', 'COMP002', 'company', '李经理', '13800138001', '上海市浦东新区陆家嘴金融大厦 B 座 5 层', 1, 1, '上海地区分公司'),
(1, '深圳分公司', 'COMP003', 'company', '王经理', '13800138002', '深圳市福田区科技园 C 座 3 层', 2, 1, '深圳地区分公司'),
(2, '上海技术部', 'DEPT001', 'department', '赵主管', '13800138003', '上海市浦东新区陆家嘴金融大厦 B 座 5 层', 1, 1, '上海分公司技术部门'),
(2, '上海销售部', 'DEPT002', 'department', '钱主管', '13800138004', '上海市浦东新区陆家嘴金融大厦 B 座 5 层', 2, 1, '上海分公司销售部门'),
(3, '深圳技术部', 'DEPT003', 'department', '孙主管', '13800138005', '深圳市福田区科技园 C 座 3 层', 1, 1, '深圳分公司技术部门'),
(1, '北京研发中心', 'PROJ001', 'project', '周经理', '13800138006', '北京市海淀区中关村 D 座 10 层', 3, 1, '北京研发项目组');

-- ----------------------------
-- 2. 插入人员数据 (personnel)
-- ----------------------------
INSERT INTO `personnel` (`name`, `code`, `department_id`, `position`, `phone`, `email`, `entry_date`, `status`, `notes`) VALUES
('张三', 'PER001', 4, 'manager', '13800138100', 'zhangsan@company.com', '2020-01-15', 1, '上海技术部经理'),
('李四', 'PER002', 4, 'engineer', '13800138101', 'lisi@company.com', '2020-03-20', 1, '高级开发工程师'),
('王五', 'PER003', 4, 'engineer', '13800138102', 'wangwu@company.com', '2021-06-01', 1, '中级开发工程师'),
('赵六', 'PER004', 5, 'supervisor', '13800138103', 'zhaoliu@company.com', '2019-08-10', 1, '销售主管'),
('钱七', 'PER005', 5, 'engineer', '13800138104', 'qianqi@company.com', '2022-02-15', 1, '销售代表'),
('孙八', 'PER006', 6, 'manager', '13800138105', 'sunba@company.com', '2018-11-01', 1, '深圳技术部经理'),
('周九', 'PER007', 6, 'engineer', '13800138106', 'zhoujiu@company.com', '2021-09-20', 1, '高级开发工程师'),
('吴十', 'PER008', 7, 'supervisor', '13800138107', 'wushi@company.com', '2020-05-10', 1, '研发项目组长'),
('郑十一', 'PER009', 7, 'engineer', '13800138108', 'zhengshi@company.com', '2022-08-01', 1, '研发工程师'),
('王十二', 'PER010', NULL, 'manager', '13800138109', 'wangshi@company.com', '2017-03-01', 0, '已离职人员');

-- ----------------------------
-- 3. 插入系统日志数据 (system_logs)
-- ----------------------------
INSERT INTO `system_logs` (`log_type`, `user_id`, `operator`, `module`, `action`, `ip`, `params`, `result`, `created_at`) VALUES
('login', 2, 'admin', '系统', '登录', '192.168.1.100', NULL, '登录成功', '2026-03-31 09:00:00'),
('operation', 2, 'admin', '用户管理', '创建用户', '192.168.1.100', '{"username":"test001","real_name":"测试用户"}', '操作成功', '2026-03-31 09:15:00'),
('operation', 2, 'admin', '角色管理', '更新角色', '192.168.1.100', '{"id":1,"name":"超级管理员"}', '操作成功', '2026-03-31 09:30:00'),
('operation', 2, 'admin', '权限管理', '配置权限', '192.168.1.100', '{"role_id":2,"permission_ids":[1,2,3]}', '操作成功', '2026-03-31 09:45:00'),
('operation', 1, '张三', '部门管理', '创建部门', '192.168.1.101', '{"name":"测试部门","code":"TEST001"}', '操作成功', '2026-03-31 10:00:00'),
('operation', 1, '张三', '单位管理', '更新单位', '192.168.1.101', '{"id":1,"name":"总公司"}', '操作成功', '2026-03-31 10:15:00'),
('error', 2, 'admin', '系统', '登录失败', '192.168.1.102', '{"username":"wrong_user"}', '密码错误', '2026-03-31 10:30:00'),
('operation', 1, '李四', '人员管理', '创建人员', '192.168.1.103', '{"name":"新员工","code":"PER011"}', '操作成功', '2026-03-31 10:45:00'),
('operation', 1, '张三', '人员管理', '删除人员', '192.168.1.101', '{"id":10}', '操作成功', '2026-03-31 11:00:00'),
('system', NULL, '系统', '定时任务', '数据备份', '127.0.0.1', NULL, '备份成功', '2026-03-31 11:00:00'),
('operation', 2, 'admin', '系统参数', '更新参数', '192.168.1.100', '{"param_key":"system_name","param_value":"新系统名称"}', '操作成功', '2026-03-31 11:15:00'),
('login', 1, '张三', '系统', '登录', '192.168.1.101', NULL, '登录成功', '2026-03-31 08:30:00'),
('login', 1, '李四', '系统', '登录', '192.168.1.103', NULL, '登录成功', '2026-03-31 08:35:00'),
('operation', 1, '王五', '工单管理', '创建工单', '192.168.1.104', '{"device_id":1,"fault_description":"设备故障"}', '操作成功', '2026-03-31 11:30:00'),
('operation', 1, '赵六', '库存管理', '出库操作', '192.168.1.105', '{"part_id":1,"quantity":2}', '操作成功', '2026-03-31 11:45:00');

-- ----------------------------
-- 4. 插入更多权限数据（业务管理、引流模块等）
-- ----------------------------

-- 业务管理菜单
INSERT INTO `permissions` (`parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(NULL, '业务管理', 'business', 'menu', '/business', 'Shop', 200, 1);

-- 业务管理子菜单
INSERT INTO `permissions` (`parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(100, '工单管理', 'business:workorders', 'menu', '/business/workorders', 'Document', 201, 1),
(100, '设备管理', 'business:devices', 'menu', '/business/devices', 'Monitor', 202, 1),
(100, '巡检管理', 'business:inspections', 'menu', '/business/inspections', 'Check', 203, 1),
(100, '保养管理', 'business:maintenance', 'menu', '/business/maintenance', 'Calendar', 204, 1),
(100, '知识库', 'business:knowledge', 'menu', '/business/knowledge', 'Reading', 205, 1);

-- 业务管理按钮权限
INSERT INTO `permissions` (`parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(101, '工单查看', 'business:workorders:view', 'button', NULL, NULL, 1, 1),
(101, '工单创建', 'business:workorders:create', 'button', NULL, NULL, 2, 1),
(101, '工单编辑', 'business:workorders:update', 'button', NULL, NULL, 3, 1),
(101, '工单删除', 'business:workorders:delete', 'button', NULL, NULL, 4, 1),
(102, '设备查看', 'business:devices:view', 'button', NULL, NULL, 1, 1),
(102, '设备创建', 'business:devices:create', 'button', NULL, NULL, 2, 1),
(102, '设备编辑', 'business:devices:update', 'button', NULL, NULL, 3, 1),
(102, '设备删除', 'business:devices:delete', 'button', NULL, NULL, 4, 1);

-- 引流模块菜单
INSERT INTO `permissions` (`parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(NULL, '引流模块', 'marketing', 'menu', '/marketing', 'Promotion', 300, 1);

-- 引流模块子菜单
INSERT INTO `permissions` (`parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(120, '内容管理', 'marketing:content', 'menu', '/marketing/content', 'Edit', 301, 1),
(120, '活动管理', 'marketing:activity', 'menu', '/marketing/activity', 'Trophy', 302, 1),
(120, '数据分析', 'marketing:analysis', 'menu', '/marketing/analysis', 'DataAnalysis', 303, 1);

-- 引流模块按钮权限
INSERT INTO `permissions` (`parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(121, '内容发布', 'marketing:content:publish', 'button', NULL, NULL, 1, 1),
(121, '内容编辑', 'marketing:content:edit', 'button', NULL, NULL, 2, 1),
(122, '活动创建', 'marketing:activity:create', 'button', NULL, NULL, 1, 1),
(122, '活动编辑', 'marketing:activity:update', 'button', NULL, NULL, 2, 1);

-- 库存管理菜单
INSERT INTO `permissions` (`parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(NULL, '库存管理', 'inventory', 'menu', '/inventory', 'Box', 400, 1);

-- 库存管理子菜单
INSERT INTO `permissions` (`parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(140, '配件管理', 'inventory:parts', 'menu', '/inventory/parts', 'Goods', 401, 1),
(140, '供应商管理', 'inventory:suppliers', 'menu', '/inventory/suppliers', 'Business', 402, 1),
(140, '入库管理', 'inventory:inbound', 'menu', '/inventory/inbound', 'Upload', 403, 1),
(140, '出库管理', 'inventory:outbound', 'menu', '/inventory/outbound', 'Download', 404, 1);

-- 库存管理按钮权限
INSERT INTO `permissions` (`parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(141, '配件查看', 'inventory:parts:view', 'button', NULL, NULL, 1, 1),
(141, '配件创建', 'inventory:parts:create', 'button', NULL, NULL, 2, 1),
(141, '配件编辑', 'inventory:parts:update', 'button', NULL, NULL, 3, 1),
(141, '配件删除', 'inventory:parts:delete', 'button', NULL, NULL, 4, 1),
(143, '入库操作', 'inventory:inbound:operate', 'button', NULL, NULL, 1, 1),
(144, '出库操作', 'inventory:outbound:operate', 'button', NULL, NULL, 1, 1);

-- 报表中心菜单
INSERT INTO `permissions` (`parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(NULL, '报表中心', 'report', 'menu', '/report', 'TrendCharts', 500, 1);

-- 报表中心子菜单
INSERT INTO `permissions` (`parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(160, '设备报表', 'report:device', 'menu', '/report/device', 'Document', 501, 1),
(160, '维修报表', 'report:maintenance', 'menu', '/report/maintenance', 'EditPen', 502, 1),
(160, '成本分析', 'report:cost', 'menu', '/report/cost', 'Money', 503, 1);

-- 报表中心按钮权限
INSERT INTO `permissions` (`parent_id`, `name`, `code`, `type`, `path`, `icon`, `sort`, `status`) VALUES
(161, '报表查看', 'report:device:view', 'button', NULL, NULL, 1, 1),
(161, '报表导出', 'report:device:export', 'button', NULL, NULL, 2, 1),
(163, '成本报告', 'report:cost:generate', 'button', NULL, NULL, 1, 1);

SET FOREIGN_KEY_CHECKS = 1;

-- 插入完成提示
SELECT '测试数据插入完成！' AS message;
