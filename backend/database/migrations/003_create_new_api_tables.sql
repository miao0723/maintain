-- CMMS Backend API - New Tables Migration
-- 创建新模块所需的22个数据库表
-- 日期: 2026-03-25

-- =============================================
-- 1. 角色和权限管理表 (3个表)
-- =============================================

-- 角色表
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '角色名称',
  `code` varchar(50) NOT NULL COMMENT '角色编码',
  `description` varchar(255) DEFAULT NULL COMMENT '角色描述',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 1启用 0禁用',
  `sort` int(11) DEFAULT 0 COMMENT '排序',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL COMMENT '角色ID',
  `permission_id` int(11) NOT NULL COMMENT '权限ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_id` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- =============================================
-- 2. 人员管理表 (1个表)
-- =============================================

-- 人员表
CREATE TABLE IF NOT EXISTS `personnel` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL COMMENT '关联用户ID',
  `employee_no` varchar(50) DEFAULT NULL COMMENT '员工编号',
  `real_name` varchar(50) NOT NULL COMMENT '真实姓名',
  `gender` enum('male','female','other') DEFAULT 'male' COMMENT '性别',
  `phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `department_id` int(11) DEFAULT NULL COMMENT '部门ID',
  `position` varchar(50) DEFAULT NULL COMMENT '职位',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 1在职 0离职',
  `hire_date` date DEFAULT NULL COMMENT '入职日期',
  `leave_date` date DEFAULT NULL COMMENT '离职日期',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employee_no` (`employee_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_department_id` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='人员表';

-- =============================================
-- 3. 系统管理表 (2个表)
-- =============================================

-- 系统日志表
CREATE TABLE IF NOT EXISTS `system_logs` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL COMMENT '操作用户ID',
  `module` varchar(50) DEFAULT NULL COMMENT '模块名称',
  `action` varchar(50) DEFAULT NULL COMMENT '操作动作',
  `method` varchar(10) DEFAULT NULL COMMENT '请求方法',
  `url` varchar(255) DEFAULT NULL COMMENT '请求URL',
  `ip` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` varchar(500) DEFAULT NULL COMMENT '用户代理',
  `request_data` text COMMENT '请求数据',
  `response_code` int(11) DEFAULT NULL COMMENT '响应状态码',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_module` (`module`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统日志表';

-- 系统参数表
CREATE TABLE IF NOT EXISTS `system_params` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `group` varchar(50) NOT NULL COMMENT '参数分组',
  `name` varchar(50) NOT NULL COMMENT '参数名称',
  `code` varchar(50) NOT NULL COMMENT '参数编码',
  `value` text COMMENT '参数值',
  `type` enum('string','number','boolean','json') DEFAULT 'string' COMMENT '值类型',
  `description` varchar(255) DEFAULT NULL COMMENT '参数描述',
  `is_system` tinyint(1) DEFAULT 0 COMMENT '是否系统参数',
  `sort` int(11) DEFAULT 0 COMMENT '排序',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_group` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统参数表';

-- =============================================
-- 4. 机械管理表 (2个表)
-- =============================================

-- 机械分类表
CREATE TABLE IF NOT EXISTS `machine_categories` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) DEFAULT 0 COMMENT '父分类ID',
  `name` varchar(50) NOT NULL COMMENT '分类名称',
  `code` varchar(50) DEFAULT NULL COMMENT '分类编码',
  `description` varchar(255) DEFAULT NULL COMMENT '分类描述',
  `icon` varchar(255) DEFAULT NULL COMMENT '图标',
  `sort` int(11) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机械分类表';

-- 机械表
CREATE TABLE IF NOT EXISTS `machines` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL COMMENT '分类ID',
  `name` varchar(100) NOT NULL COMMENT '机械名称',
  `model` varchar(100) DEFAULT NULL COMMENT '型号',
  `manufacturer` varchar(100) DEFAULT NULL COMMENT '制造商',
  `specifications` varchar(255) DEFAULT NULL COMMENT '规格',
  `purchase_date` date DEFAULT NULL COMMENT '购买日期',
  `price` decimal(10,2) DEFAULT NULL COMMENT '价格',
  `status` enum('normal','maintenance','repair','scrapped') DEFAULT 'normal' COMMENT '状态',
  `location` varchar(100) DEFAULT NULL COMMENT '存放位置',
  `description` text COMMENT '描述',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机械表';

-- =============================================
-- 5. 订单表 (1个表)
-- =============================================

-- 订单表
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `order_no` varchar(50) NOT NULL COMMENT '订单编号',
  `customer_name` varchar(50) NOT NULL COMMENT '客户名称',
  `customer_phone` varchar(20) DEFAULT NULL COMMENT '客户电话',
  `machine_id` int(11) DEFAULT NULL COMMENT '机械ID',
  `type` enum('repair','maintenance','inspection') DEFAULT 'repair' COMMENT '订单类型',
  `status` enum('pending','processing','completed','cancelled') DEFAULT 'pending' COMMENT '订单状态',
  `amount` decimal(10,2) DEFAULT 0.00 COMMENT '订单金额',
  `description` text COMMENT '订单描述',
  `created_by` int(11) DEFAULT NULL COMMENT '创建人',
  `assigned_to` int(11) DEFAULT NULL COMMENT '指派给',
  `completed_at` datetime DEFAULT NULL COMMENT '完成时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_customer_name` (`customer_name`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- =============================================
-- 6. 报告表 (2个表)
-- =============================================

-- 检测报告表
CREATE TABLE IF NOT EXISTS `test_reports` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(11) DEFAULT NULL COMMENT '订单ID',
  `machine_id` int(11) NOT NULL COMMENT '机械ID',
  `report_no` varchar(50) NOT NULL COMMENT '报告编号',
  `test_items` text COMMENT '测试项目',
  `test_result` text COMMENT '测试结果',
  `conclusion` enum('qualified','unqualified','maintenance_required') DEFAULT 'qualified' COMMENT '结论',
  `tester` varchar(50) DEFAULT NULL COMMENT '测试人',
  `test_date` date DEFAULT NULL COMMENT '测试日期',
  `attachments` text COMMENT '附件',
  `remark` text COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_report_no` (`report_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_machine_id` (`machine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='检测报告表';

-- 维修报告表
CREATE TABLE IF NOT EXISTS `repair_reports` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL COMMENT '订单ID',
  `machine_id` int(11) NOT NULL COMMENT '机械ID',
  `report_no` varchar(50) NOT NULL COMMENT '报告编号',
  `fault_description` text COMMENT '故障描述',
  `repair_content` text COMMENT '维修内容',
  `parts_used` text COMMENT '使用配件',
  `repair_hours` decimal(5,2) DEFAULT NULL COMMENT '维修工时',
  `amount` decimal(10,2) DEFAULT 0.00 COMMENT '维修金额',
  `repairer` varchar(50) DEFAULT NULL COMMENT '维修人',
  `repair_date` date DEFAULT NULL COMMENT '维修日期',
  `attachments` text COMMENT '附件',
  `remark` text COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_report_no` (`report_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_machine_id` (`machine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修报告表';

-- =============================================
-- 7. 维修业务表 (4个表)
-- =============================================

-- 维修合同表
CREATE TABLE IF NOT EXISTS `repair_contracts` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `contract_no` varchar(50) NOT NULL COMMENT '合同编号',
  `customer_name` varchar(50) NOT NULL COMMENT '客户名称',
  `customer_phone` varchar(20) DEFAULT NULL COMMENT '客户电话',
  `start_date` date NOT NULL COMMENT '开始日期',
  `end_date` date NOT NULL COMMENT '结束日期',
  `amount` decimal(10,2) NOT NULL COMMENT '合同金额',
  `service_content` text COMMENT '服务内容',
  `status` enum('active','expired','terminated') DEFAULT 'active' COMMENT '合同状态',
  `attachments` text COMMENT '附件',
  `remark` text COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_contract_no` (`contract_no`),
  KEY `idx_customer_name` (`customer_name`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修合同表';

-- 维修提醒表
CREATE TABLE IF NOT EXISTS `repair_reminders` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `machine_id` int(11) NOT NULL COMMENT '机械ID',
  `type` enum('maintenance','inspection','repair') DEFAULT 'maintenance' COMMENT '提醒类型',
  `remind_date` date NOT NULL COMMENT '提醒日期',
  `content` text COMMENT '提醒内容',
  `status` enum('pending','sent','completed') DEFAULT 'pending' COMMENT '状态',
  `handler` varchar(50) DEFAULT NULL COMMENT '处理人',
  `handled_at` datetime DEFAULT NULL COMMENT '处理时间',
  `remark` text COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_machine_id` (`machine_id`),
  KEY `idx_remind_date` (`remind_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修提醒表';

-- 联动维修表
CREATE TABLE IF NOT EXISTS `external_repairs` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL COMMENT '订单ID',
  `external_unit` varchar(100) NOT NULL COMMENT '外部单位',
  `contact_person` varchar(50) DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `repair_content` text COMMENT '维修内容',
  `amount` decimal(10,2) DEFAULT 0.00 COMMENT '维修金额',
  `status` enum('pending','in_progress','completed') DEFAULT 'pending' COMMENT '状态',
  `start_date` date DEFAULT NULL COMMENT '开始日期',
  `end_date` date DEFAULT NULL COMMENT '结束日期',
  `remark` text COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_external_unit` (`external_unit`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='联动维修表';

-- 维修进度表
CREATE TABLE IF NOT EXISTS `repair_progress` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL COMMENT '订单ID',
  `stage` varchar(50) NOT NULL COMMENT '阶段',
  `status` enum('pending','in_progress','completed') DEFAULT 'pending' COMMENT '状态',
  `progress` int(11) DEFAULT 0 COMMENT '进度百分比',
  `description` text COMMENT '描述',
  `handler` varchar(50) DEFAULT NULL COMMENT '处理人',
  `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '结束时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_stage` (`stage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修进度表';

-- =============================================
-- 8. 支付模块表 (3个表)
-- =============================================

-- 转账支付表
CREATE TABLE IF NOT EXISTS `transfers` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `transfer_no` varchar(50) NOT NULL COMMENT '转账编号',
  `order_id` int(11) DEFAULT NULL COMMENT '订单ID',
  `payer_name` varchar(50) NOT NULL COMMENT '付款人姓名',
  `payer_account` varchar(50) DEFAULT NULL COMMENT '付款人账户',
  `amount` decimal(10,2) NOT NULL COMMENT '转账金额',
  `transfer_date` date NOT NULL COMMENT '转账日期',
  `bank_name` varchar(100) DEFAULT NULL COMMENT '银行名称',
  `voucher` varchar(255) DEFAULT NULL COMMENT '凭证',
  `status` enum('pending','confirmed','rejected') DEFAULT 'pending' COMMENT '状态',
  `remark` text COMMENT '备注',
  `confirmed_by` int(11) DEFAULT NULL COMMENT '确认人',
  `confirmed_at` datetime DEFAULT NULL COMMENT '确认时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_transfer_no` (`transfer_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='转账支付表';

-- 在线支付表
CREATE TABLE IF NOT EXISTS `online_payments` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `payment_no` varchar(50) NOT NULL COMMENT '支付编号',
  `order_id` int(11) NOT NULL COMMENT '订单ID',
  `amount` decimal(10,2) NOT NULL COMMENT '支付金额',
  `payment_method` enum('alipay','wechat','unionpay') DEFAULT 'alipay' COMMENT '支付方式',
  `transaction_id` varchar(100) DEFAULT NULL COMMENT '第三方交易号',
  `status` enum('pending','success','failed','refunded') DEFAULT 'pending' COMMENT '状态',
  `paid_at` datetime DEFAULT NULL COMMENT '支付时间',
  `refund_amount` decimal(10,2) DEFAULT 0.00 COMMENT '退款金额',
  `refund_reason` varchar(255) DEFAULT NULL COMMENT '退款原因',
  `remark` text COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_no` (`payment_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='在线支付表';

-- 发票表
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(50) NOT NULL COMMENT '发票号码',
  `order_id` int(11) NOT NULL COMMENT '订单ID',
  `type` enum('ordinary','special','electronic') DEFAULT 'ordinary' COMMENT '发票类型',
  `title` varchar(200) NOT NULL COMMENT '发票抬头',
  `tax_no` varchar(50) DEFAULT NULL COMMENT '税号',
  `amount` decimal(10,2) NOT NULL COMMENT '发票金额',
  `tax_amount` decimal(10,2) DEFAULT 0.00 COMMENT '税额',
  `content` text COMMENT '发票内容',
  `status` enum('draft','issued','void') DEFAULT 'draft' COMMENT '状态',
  `issued_at` date DEFAULT NULL COMMENT '开票日期',
  `attachments` text COMMENT '附件',
  `remark` text COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_invoice_no` (`invoice_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发票表';

-- =============================================
-- 9. 营销模块表 (4个表)
-- =============================================

-- 成功案例表
CREATE TABLE IF NOT EXISTS `cases` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL COMMENT '案例标题',
  `customer` varchar(100) NOT NULL COMMENT '客户名称',
  `industry` varchar(50) DEFAULT NULL COMMENT '所属行业',
  `cover_image` varchar(255) DEFAULT NULL COMMENT '封面图片',
  `images` text COMMENT '案例图片',
  `content` text COMMENT '案例内容',
  `tags` varchar(255) DEFAULT NULL COMMENT '标签',
  `views` int(11) DEFAULT 0 COMMENT '浏览次数',
  `sort` int(11) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_industry` (`industry`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成功案例表';

-- 客服配置表
CREATE TABLE IF NOT EXISTS `customer_service` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `service_phone` varchar(20) DEFAULT NULL COMMENT '客服电话',
  `service_wechat` varchar(100) DEFAULT NULL COMMENT '客服微信号',
  `service_qq` varchar(20) DEFAULT NULL COMMENT '客服QQ',
  `service_email` varchar(100) DEFAULT NULL COMMENT '客服邮箱',
  `work_time` varchar(100) DEFAULT NULL COMMENT '工作时间',
  `qr_code` varchar(255) DEFAULT NULL COMMENT '二维码',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客服配置表';

-- 抖音内容表
CREATE TABLE IF NOT EXISTS `douyin_contents` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL COMMENT '内容标题',
  `video_url` varchar(500) DEFAULT NULL COMMENT '视频链接',
  `cover_image` varchar(255) DEFAULT NULL COMMENT '封面图片',
  `description` text COMMENT '内容描述',
  `tags` varchar(255) DEFAULT NULL COMMENT '标签',
  `views` int(11) DEFAULT 0 COMMENT '浏览次数',
  `likes` int(11) DEFAULT 0 COMMENT '点赞次数',
  `shares` int(11) DEFAULT 0 COMMENT '分享次数',
  `publish_date` date DEFAULT NULL COMMENT '发布日期',
  `sort` int(11) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_publish_date` (`publish_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='抖音内容表';

-- 合作企业表
CREATE TABLE IF NOT EXISTS `partners` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '企业名称',
  `logo` varchar(255) DEFAULT NULL COMMENT '企业logo',
  `industry` varchar(50) DEFAULT NULL COMMENT '所属行业',
  `contact_person` varchar(50) DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `contact_email` varchar(100) DEFAULT NULL COMMENT '联系邮箱',
  `address` varchar(255) DEFAULT NULL COMMENT '企业地址',
  `website` varchar(255) DEFAULT NULL COMMENT '企业网站',
  `cooperation_type` enum('supplier','customer','partner') DEFAULT 'partner' COMMENT '合作类型',
  `status` enum('active','inactive','terminated') DEFAULT 'active' COMMENT '状态',
  `cooperation_date` date DEFAULT NULL COMMENT '合作开始日期',
  `description` text COMMENT '企业描述',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_industry` (`industry`),
  KEY `idx_cooperation_type` (`cooperation_type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合作企业表';

-- =============================================
-- 初始化数据
-- =============================================

-- 插入默认角色
INSERT INTO `roles` (`name`, `code`, `description`, `status`, `sort`) VALUES
('超级管理员', 'admin', '拥有所有权限', 1, 1),
('管理员', 'manager', '拥有大部分管理权限', 1, 2),
('操作员', 'operator', '拥有基础操作权限', 1, 3)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 插入默认系统参数
INSERT INTO `system_params` (`group`, `name`, `code`, `value`, `type`, `description`, `is_system`, `sort`) VALUES
('system', '站点名称', 'site_name', 'CMMS维修管理系统', 'string', '系统站点名称', 1, 1),
('system', '站点描述', 'site_description', '设备维修全流程管理系统', 'string', '系统站点描述', 1, 2),
('payment', '支付方式', 'payment_methods', 'alipay,wechat,unionpay', 'json', '支持的支付方式', 0, 10)
ON DUPLICATE KEY UPDATE value=VALUES(value);

-- 插入默认客服配置
INSERT INTO `customer_service` (`service_phone`, `service_wechat`, `work_time`, `status`) VALUES
('400-123-4567', 'cmms_service', '周一至周五 9:00-18:00', 1)
ON DUPLICATE KEY UPDATE service_phone=VALUES(service_phone);

-- =============================================
-- 完成
-- =============================================
