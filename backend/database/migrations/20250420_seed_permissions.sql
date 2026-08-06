-- 权限数据种子文件
-- 基于前端路由结构生成完整的权限树
-- 执行此文件前请清空 permissions 表：TRUNCATE TABLE permissions;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 清空现有权限数据（谨慎使用）
-- TRUNCATE TABLE permissions;

-- ==================== 根权限 ====================
INSERT INTO permissions (id, parent_id, name, code, type, path, icon, sort, status) VALUES
(1, NULL, '系统管理', 'system', 'menu', '/system', 'Setting', 1, 1),
(2, NULL, '业务管理', 'business', 'menu', '/business', 'Briefcase', 2, 1),
(3, NULL, '引流模块', 'marketing', 'menu', '/marketing', 'TrendCharts', 3, 1),
(4, NULL, '维修业务', 'repair', 'menu', '/repair', 'Tools', 4, 1),
(5, NULL, '支付模块', 'payment', 'menu', '/payment', 'Wallet', 5, 1),
(6, NULL, '进销存', 'inventory', 'menu', '/inventory', 'Box', 6, 1),
(7, NULL, '查询统计', 'statistics', 'menu', '/statistics', 'DataAnalysis', 7, 1);

-- ==================== 1. 系统管理模块 ====================
INSERT INTO permissions (id, parent_id, name, code, type, path, icon, sort, status) VALUES
-- 用户管理
(10, 1, '用户管理', 'system.users', 'menu', '/basic/users', 'User', 1, 1),
(11, 10, '查看用户', 'system.users.view', 'button', NULL, NULL, 1, 1),
(12, 10, '新增用户', 'system.users.create', 'button', NULL, NULL, 2, 1),
(13, 10, '编辑用户', 'system.users.edit', 'button', NULL, NULL, 3, 1),
(14, 10, '删除用户', 'system.users.delete', 'button', NULL, NULL, 4, 1),

-- 角色管理
(20, 1, '角色管理', 'system.roles', 'menu', '/basic/roles', 'UserFilled', 2, 1),
(21, 20, '查看角色', 'system.roles.view', 'button', NULL, NULL, 1, 1),
(22, 20, '新增角色', 'system.roles.create', 'button', NULL, NULL, 2, 1),
(23, 20, '编辑角色', 'system.roles.edit', 'button', NULL, NULL, 3, 1),
(24, 20, '删除角色', 'system.roles.delete', 'button', NULL, NULL, 4, 1),
(25, 20, '配置权限', 'system.roles.permissions', 'button', NULL, NULL, 5, 1),

-- 权限管理
(30, 1, '权限管理', 'system.permissions', 'menu', '/basic/permissions', 'Lock', 3, 1),
(31, 30, '查看权限', 'system.permissions.view', 'button', NULL, NULL, 1, 1),
(32, 30, '新增权限', 'system.permissions.create', 'button', NULL, NULL, 2, 1),
(33, 30, '编辑权限', 'system.permissions.edit', 'button', NULL, NULL, 3, 1),
(34, 30, '删除权限', 'system.permissions.delete', 'button', NULL, NULL, 4, 1),

-- 人员管理
(40, 1, '人员管理', 'system.personnel', 'menu', '/basic/personnel', 'Avatar', 4, 1),
(41, 40, '查看人员', 'system.personnel.view', 'button', NULL, NULL, 1, 1),
(42, 40, '新增人员', 'system.personnel.create', 'button', NULL, NULL, 2, 1),
(43, 40, '编辑人员', 'system.personnel.edit', 'button', NULL, NULL, 3, 1),
(44, 40, '删除人员', 'system.personnel.delete', 'button', NULL, NULL, 4, 1),

-- 单位管理
(50, 1, '单位管理', 'system.organizations', 'menu', '/basic/organizations', 'OfficeBuilding', 5, 1),
(51, 50, '查看单位', 'system.organizations.view', 'button', NULL, NULL, 1, 1),
(52, 50, '新增单位', 'system.organizations.create', 'button', NULL, NULL, 2, 1),
(53, 50, '编辑单位', 'system.organizations.edit', 'button', NULL, NULL, 3, 1),
(54, 50, '删除单位', 'system.organizations.delete', 'button', NULL, NULL, 4, 1),

-- 日志管理
(60, 1, '日志管理', 'system.logs', 'menu', '/basic/logs', 'Document', 6, 1),
(61, 60, '查看日志', 'system.logs.view', 'button', NULL, NULL, 1, 1),
(62, 60, '导出日志', 'system.logs.export', 'button', NULL, NULL, 2, 1),
(63, 60, '删除日志', 'system.logs.delete', 'button', NULL, NULL, 3, 1),

-- 参数管理
(70, 1, '参数管理', 'system.params', 'menu', '/basic/params', 'Operation', 7, 1),
(71, 70, '查看参数', 'system.params.view', 'button', NULL, NULL, 1, 1),
(72, 70, '编辑参数', 'system.params.edit', 'button', NULL, NULL, 2, 1);

-- ==================== 2. 业务管理模块 ====================
INSERT INTO permissions (id, parent_id, name, code, type, path, icon, sort, status) VALUES
-- 免责协议管理
(100, 2, '免责协议管理', 'business.agreement', 'menu', '/business/agreement', 'Document', 1, 1),
(101, 100, '查看协议', 'business.agreement.view', 'button', NULL, NULL, 1, 1),
(102, 100, '新增协议', 'business.agreement.create', 'button', NULL, NULL, 2, 1),
(103, 100, '编辑协议', 'business.agreement.edit', 'button', NULL, NULL, 3, 1),
(104, 100, '删除协议', 'business.agreement.delete', 'button', NULL, NULL, 4, 1),

-- 维修内容管理
(110, 2, '维修内容管理', 'business.content', 'menu', '/business/content', 'Edit', 2, 1),
(111, 110, '查看维修内容', 'business.content.view', 'button', NULL, NULL, 1, 1),
(112, 110, '新增维修内容', 'business.content.create', 'button', NULL, NULL, 2, 1),
(113, 110, '编辑维修内容', 'business.content.edit', 'button', NULL, NULL, 3, 1),
(114, 110, '删除维修内容', 'business.content.delete', 'button', NULL, NULL, 4, 1),

-- 绑定/解绑
(120, 2, '绑定/解绑', 'business.binding', 'menu', '/business/binding', 'Link', 3, 1),
(121, 120, '查看绑定', 'business.binding.view', 'button', NULL, NULL, 1, 1),
(122, 120, '执行绑定', 'business.binding.bind', 'button', NULL, NULL, 2, 1),
(123, 120, '执行解绑', 'business.binding.unbind', 'button', NULL, NULL, 3, 1);

-- ==================== 3. 引流模块 ====================
INSERT INTO permissions (id, parent_id, name, code, type, path, icon, sort, status) VALUES
-- 成功案例
(200, 3, '成功案例', 'marketing.cases', 'menu', '/marketing/cases', 'Star', 1, 1),
(201, 200, '查看案例', 'marketing.cases.view', 'button', NULL, NULL, 1, 1),
(202, 200, '新增案例', 'marketing.cases.create', 'button', NULL, NULL, 2, 1),
(203, 200, '编辑案例', 'marketing.cases.edit', 'button', NULL, NULL, 3, 1),
(204, 200, '删除案例', 'marketing.cases.delete', 'button', NULL, NULL, 4, 1),

-- 人工客服
(210, 3, '人工客服', 'marketing.service', 'menu', '/marketing/service', 'Service', 2, 1),
(211, 210, '查看客服配置', 'marketing.service.view', 'button', NULL, NULL, 1, 1),
(212, 210, '编辑客服配置', 'marketing.service.edit', 'button', NULL, NULL, 2, 1),

-- 抖音获客

(220, 3, '抖音获客', 'marketing.douyin', 'menu', '/marketing/douyin', 'VideoPlay', 3, 1),
(221, 220, '查看抖音内容', 'marketing.douyin.view', 'button', NULL, NULL, 1, 1),
(222, 220, '发布抖音内容', 'marketing.douyin.publish', 'button', NULL, NULL, 2, 1),
(223, 220, '编辑抖音内容', 'marketing.douyin.edit', 'button', NULL, NULL, 3, 1),
(224, 220, '删除抖音内容', 'marketing.douyin.delete', 'button', NULL, NULL, 4, 1),

-- 小红书获客
(230, 3, '小红书获客', 'marketing.xiaohongshu', 'menu', '/marketing/xiaohongshu', 'Picture', 4, 1),
(231, 230, '查看小红书内容', 'marketing.xiaohongshu.view', 'button', NULL, NULL, 1, 1),
(232, 230, '发布小红书内容', 'marketing.xiaohongshu.publish', 'button', NULL, NULL, 2, 1),
(233, 230, '编辑小红书内容', 'marketing.xiaohongshu.edit', 'button', NULL, NULL, 3, 1),
(234, 230, '删除小红书内容', 'marketing.xiaohongshu.delete', 'button', NULL, NULL, 4, 1),

-- 快手获客
(240, 3, '快手获客', 'marketing.kuaishou', 'menu', '/marketing/kuaishou', 'VideoPlay', 5, 1),
(241, 240, '查看快手内容', 'marketing.kuaishou.view', 'button', NULL, NULL, 1, 1),
(242, 240, '发布快手内容', 'marketing.kuaishou.publish', 'button', NULL, NULL, 2, 1),
(243, 240, '编辑快手内容', 'marketing.kuaishou.edit', 'button', NULL, NULL, 3, 1),
(244, 240, '删除快手内容', 'marketing.kuaishou.delete', 'button', NULL, NULL, 4, 1),

-- B站获客
(250, 3, 'B站获客', 'marketing.bilibili', 'menu', '/marketing/bilibili', 'VideoPlay', 6, 1),
(251, 250, '查看B站内容', 'marketing.bilibili.view', 'button', NULL, NULL, 1, 1),
(252, 250, '发布B站内容', 'marketing.bilibili.publish', 'button', NULL, NULL, 2, 1),
(253, 250, '编辑B站内容', 'marketing.bilibili.edit', 'button', NULL, NULL, 3, 1),
(254, 250, '删除B站内容', 'marketing.bilibili.delete', 'button', NULL, NULL, 4, 1),

-- 合作企业
(260, 3, '合作企业', 'marketing.partners', 'menu', '/marketing/partners', 'OfficeBuilding', 7, 1),
(261, 260, '查看合作企业', 'marketing.partners.view', 'button', NULL, NULL, 1, 1),
(262, 260, '新增合作企业', 'marketing.partners.create', 'button', NULL, NULL, 2, 1),
(263, 260, '编辑合作企业', 'marketing.partners.edit', 'button', NULL, NULL, 3, 1),
(264, 260, '删除合作企业', 'marketing.partners.delete', 'button', NULL, NULL, 4, 1);

-- ==================== 4. 维修业务模块 ====================
INSERT INTO permissions (id, parent_id, name, code, type, path, icon, sort, status) VALUES
-- 机械种类管理
(300, 4, '机械种类管理', 'repair.categories', 'menu', '/repair/categories', 'Menu', 1, 1),
(301, 300, '查看机械种类', 'repair.categories.view', 'button', NULL, NULL, 1, 1),
(302, 300, '新增机械种类', 'repair.categories.create', 'button', NULL, NULL, 2, 1),
(303, 300, '编辑机械种类', 'repair.categories.edit', 'button', NULL, NULL, 3, 1),
(304, 300, '删除机械种类', 'repair.categories.delete', 'button', NULL, NULL, 4, 1),

-- 机械名称管理
(310, 4, '机械名称管理', 'repair.machines', 'menu', '/repair/machines', 'Monitor', 2, 1),
(311, 310, '查看机械名称', 'repair.machines.view', 'button', NULL, NULL, 1, 1),
(312, 310, '新增机械名称', 'repair.machines.create', 'button', NULL, NULL, 2, 1),
(313, 310, '编辑机械名称', 'repair.machines.edit', 'button', NULL, NULL, 3, 1),
(314, 310, '删除机械名称', 'repair.machines.delete', 'button', NULL, NULL, 4, 1),

-- 订单管理
(320, 4, '订单管理', 'repair.orders', 'menu', '/repair/orders', 'Tickets', 3, 1),
-- 小程序订单
(321, 320, '小程序订单', 'repair.orders.miniprogram', 'menu', '/repair/orders/miniprogram', 'Iphone', 1, 1),
(322, 321, '查看小程序订单', 'repair.orders.miniprogram.view', 'button', NULL, NULL, 1, 1),
(323, 321, '派单', 'repair.orders.miniprogram.assign', 'button', NULL, NULL, 2, 1),
(324, 321, '接单', 'repair.orders.miniprogram.accept', 'button', NULL, NULL, 3, 1),
(325, 321, '完成订单', 'repair.orders.miniprogram.complete', 'button', NULL, NULL, 4, 1),
(326, 321, '取消订单', 'repair.orders.miniprogram.cancel', 'button', NULL, NULL, 5, 1),
-- 手动创建订单
(331, 320, '手动创建订单', 'repair.orders.manual', 'menu', '/repair/orders/manual', 'Plus', 2, 1),
(332, 331, '查看手动订单', 'repair.orders.manual.view', 'button', NULL, NULL, 1, 1),
(333, 331, '创建订单', 'repair.orders.manual.create', 'button', NULL, NULL, 2, 1),
(334, 331, '编辑订单', 'repair.orders.manual.edit', 'button', NULL, NULL, 3, 1),
(335, 331, '删除订单', 'repair.orders.manual.delete', 'button', NULL, NULL, 4, 1),

-- 检测报告
(340, 4, '检测报告', 'repair.test-report', 'menu', '/repair/test-report', 'DocumentChecked', 4, 1),
-- 检测记录
(341, 340, '检测记录', 'repair.test-report.records', 'menu', '/repair/test-report/records', 'List', 1, 1),
(342, 341, '查看检测记录', 'repair.test-report.records.view', 'button', NULL, NULL, 1, 1),
(343, 341, '创建检测记录', 'repair.test-report.records.create', 'button', NULL, NULL, 2, 1),
(344, 341, '编辑检测记录', 'repair.test-report.records.edit', 'button', NULL, NULL, 3, 1),
(345, 341, '删除检测记录', 'repair.test-report.records.delete', 'button', NULL, NULL, 4, 1),
-- 维修报价单
(351, 340, '维修报价单', 'repair.test-report.quote', 'menu', '/repair/test-report/quote', 'Money', 2, 1),
(352, 351, '查看报价单', 'repair.test-report.quote.view', 'button', NULL, NULL, 1, 1),
(353, 351, '创建报价单', 'repair.test-report.quote.create', 'button', NULL, NULL, 2, 1),
(354, 351, '编辑报价单', 'repair.test-report.quote.edit', 'button', NULL, NULL, 3, 1),
(355, 351, '删除报价单', 'repair.test-report.quote.delete', 'button', NULL, NULL, 4, 1),
-- 检测费用
(361, 340, '检测费用', 'repair.test-report.fee', 'menu', '/repair/test-report/fee', 'Wallet', 3, 1),
(362, 361, '查看检测费用', 'repair.test-report.fee.view', 'button', NULL, NULL, 1, 1),
(363, 361, '编辑检测设置', 'repair.test-report.fee.edit', 'button', NULL, NULL, 2, 1),

-- 维修报告
(370, 4, '维修报告', 'repair.repair-report', 'menu', '/repair/repair-report', 'Document', 5, 1),
(371, 370, '查看维修报告', 'repair.repair-report.view', 'button', NULL, NULL, 1, 1),
(372, 370, '创建维修报告', 'repair.repair-report.create', 'button', NULL, NULL, 2, 1),
(373, 370, '编辑维修报告', 'repair.repair-report.edit', 'button', NULL, NULL, 3, 1),
(374, 370, '删除维修报告', 'repair.repair-report.delete', 'button', NULL, NULL, 4, 1),

-- 维修合同
(380, 4, '维修合同', 'repair.contract', 'menu', '/repair/contract', 'Tickets', 6, 1),
(381, 380, '查看维修合同', 'repair.contract.view', 'button', NULL, NULL, 1, 1),
(382, 380, '创建维修合同', 'repair.contract.create', 'button', NULL, NULL, 2, 1),
(383, 380, '编辑维修合同', 'repair.contract.edit', 'button', NULL, NULL, 3, 1),
(384, 380, '删除维修合同', 'repair.contract.delete', 'button', NULL, NULL, 4, 1),

-- 维修提醒
(390, 4, '维修提醒', 'repair.reminder', 'menu', '/repair/reminder', 'Bell', 7, 1),
(391, 390, '查看维修提醒', 'repair.reminder.view', 'button', NULL, NULL, 1, 1),
(392, 390, '创建维修提醒', 'repair.reminder.create', 'button', NULL, NULL, 2, 1),
(393, 390, '编辑维修提醒', 'repair.reminder.edit', 'button', NULL, NULL, 3, 1),
(394, 390, '删除维修提醒', 'repair.reminder.delete', 'button', NULL, NULL, 4, 1),

-- 联动维修
(400, 4, '联动维修', 'repair.external', 'menu', '/repair/external', 'Connection', 8, 1),
(401, 400, '查看联动维修', 'repair.external.view', 'button', NULL, NULL, 1, 1),
(402, 400, '创建联动维修', 'repair.external.create', 'button', NULL, NULL, 2, 1),
(403, 400, '编辑联动维修', 'repair.external.edit', 'button', NULL, NULL, 3, 1),
(404, 400, '删除联动维修', 'repair.external.delete', 'button', NULL, NULL, 4, 1),

-- 维修进度
(410, 4, '维修进度', 'repair.progress', 'menu', '/repair/progress', 'Clock', 9, 1),
-- 进度申请
(411, 410, '进度申请', 'repair.progress.apply', 'menu', '/repair/progress/apply', 'DocumentAdd', 1, 1),
(412, 411, '查看进度申请', 'repair.progress.apply.view', 'button', NULL, NULL, 1, 1),
(413, 411, '创建进度申请', 'repair.progress.apply.create', 'button', NULL, NULL, 2, 1),
(414, 411, '审核进度申请', 'repair.progress.apply.approve', 'button', NULL, NULL, 3, 1),
-- 进度照片
(421, 410, '进度照片', 'repair.progress.photo', 'menu', '/repair/progress/photo', 'Picture', 2, 1),
(422, 421, '查看进度照片', 'repair.progress.photo.view', 'button', NULL, NULL, 1, 1),
(423, 421, '上传进度照片', 'repair.progress.photo.upload', 'button', NULL, NULL, 2, 1),
(424, 421, '删除进度照片', 'repair.progress.photo.delete', 'button', NULL, NULL, 3, 1),
-- 进度视频
(431, 410, '进度视频', 'repair.progress.video', 'menu', '/repair/progress/video', 'VideoPlay', 3, 1),
(432, 431, '查看进度视频', 'repair.progress.video.view', 'button', NULL, NULL, 1, 1),
(433, 431, '上传进度视频', 'repair.repair-progress.video.upload', 'button', NULL, NULL, 2, 1),
(434, 431, '删除进度视频', 'repair.progress.video.delete', 'button', NULL, NULL, 3, 1);

-- ==================== 5. 支付模块 ====================
INSERT INTO permissions (id, parent_id, name, code, type, path, icon, sort, status) VALUES
-- 转账支付
(500, 5, '转账支付', 'payment.transfer', 'menu', '/payment/transfer', 'Money', 1, 1),
(501, 500, '查看转账记录', 'payment.transfer.view', 'button', NULL, NULL, 1, 1),
(502, 500, '创建转账', 'payment.transfer.create', 'button', NULL, NULL, 2, 1),

-- 在线支付
(510, 5, '在线支付', 'payment.online', 'menu', '/payment/online', 'Iphone', 2, 1),
(511, 510, '查看在线支付记录', 'payment.online.view', 'button', NULL, NULL, 1, 1),
(512, 510, '创建在线支付', 'payment.online.create', 'button', NULL, NULL, 2, 1),
(513, 510, '退款', 'payment.online.refund', 'button', NULL, NULL, 3, 1),

-- 支付宝测试
(520, 5, '支付宝测试', 'payment.alipay-test', 'menu', '/payment/alipay-test', 'CreditCard', 3, 1),
(521, 520, '执行测试', 'payment.alipay-test.run', 'button', NULL, NULL, 1, 1),

-- 发票管理
(530, 5, '发票管理', 'payment.invoice', 'menu', '/payment/invoice', 'Tickets', 4, 1),
(531, 530, '查看发票', 'payment.invoice.view', 'button', NULL, NULL, 1, 1),
(532, 530, '创建发票', 'payment.invoice.create', 'button', NULL, NULL, 2, 1),
(533, 530, '编辑发票', 'payment.invoice.edit', 'button', NULL, NULL, 3, 1),
(534, 530, '删除发票', 'payment.invoice.delete', 'button', NULL, NULL, 4, 1);

-- ==================== 6. 进销存模块 ====================
INSERT INTO permissions (id, parent_id, name, code, type, path, icon, sort, status) VALUES
-- 配件管理
(600, 6, '配件管理', 'inventory.parts', 'menu', '/inventory/parts', 'Goods', 1, 1),
(601, 600, '查看配件', 'inventory.parts.view', 'button', NULL, NULL, 1, 1),
(602, 600, '新增配件', 'inventory.parts.create', 'button', NULL, NULL, 2, 1),
(603, 600, '编辑配件', 'inventory.parts.edit', 'button', NULL, NULL, 3, 1),
(604, 600, '删除配件', 'inventory.parts.delete', 'button', NULL, NULL, 4, 1),
(605, 600, '入库', 'inventory.parts.inbound', 'button', NULL, NULL, 5, 1),
(606, 600, '出库', 'inventory.parts.outbound', 'button', NULL, NULL, 6, 1),
(607, 600, '盘点', 'inventory.parts.stocktake', 'button', NULL, NULL, 7, 1),

-- 供应商管理
(610, 6, '供应商管理', 'inventory.suppliers', 'menu', '/inventory/suppliers', 'Van', 2, 1),
(611, 610, '查看供应商', 'inventory.suppliers.view', 'button', NULL, NULL, 1, 1),
(612, 610, '新增供应商', 'inventory.suppliers.create', 'button', NULL, NULL, 2, 1),
(613, 610, '编辑供应商', 'inventory.suppliers.edit', 'button', NULL, NULL, 3, 1),
(614, 610, '删除供应商', 'inventory.suppliers.delete', 'button', NULL, NULL, 4, 1);

-- ==================== 7. 查询统计模块 ====================
INSERT INTO permissions (id, parent_id, name, code, type, path, icon, sort, status) VALUES
-- 收入统计
(700, 7, '收入统计', 'statistics.income', 'menu', '/statistics/income', 'TrendCharts', 1, 1),
(701, 700, '查看收入统计', 'statistics.income.view', 'button', NULL, NULL, 1, 1),
(702, 700, '导出收入报表', 'statistics.income.export', 'button', NULL, NULL, 2, 1),

-- 开支统计
(710, 7, '开支统计', 'statistics.expense', 'menu', '/statistics/expense', 'DataLine', 2, 1),
(711, 710, '查看开支统计', 'statistics.expense.view', 'button', NULL, NULL, 1, 1),
(712, 710, '导出开支报表', 'statistics.expense.export', 'button', NULL, NULL, 2, 1),

-- 订单统计
(720, 7, '订单统计', 'statistics.order-stats', 'menu', '/statistics/order-stats', 'Tickets', 3, 1),
(721, 720, '查看订单统计', 'statistics.order-stats.view', 'button', NULL, NULL, 1, 1),
(722, 720, '导出订单报表', 'statistics.order-stats.export', 'button', NULL, NULL, 2, 1),

-- 超时统计
(730, 7, '超时统计', 'statistics.timeout', 'menu', '/statistics/timeout', 'Clock', 4, 1),
(731, 730, '查看超时统计', 'statistics.timeout.view', 'button', NULL, NULL, 1, 1),
(732, 730, '导出超时报表', 'statistics.timeout.export', 'button', NULL, NULL, 2, 1);

SET FOREIGN_KEY_CHECKS = 1;
