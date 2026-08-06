-- ========================================
-- 支付模块数据库表创建迁移文件
-- 执行时间: 2026-04-20
-- ========================================

-- 1. 转账支付表
CREATE TABLE IF NOT EXISTS `cmms_transfer_payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单号',
  `payee_name` VARCHAR(100) NOT NULL COMMENT '收款人姓名',
  `payee_account` VARCHAR(200) NOT NULL COMMENT '收款账户（银行账号或支付宝号）',
  `bank_name` VARCHAR(100) NOT NULL COMMENT '开户银行',
  `amount` DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '转账金额',
  `transfer_time` DATETIME NOT NULL COMMENT '转账时间',
  `voucher` VARCHAR(500) DEFAULT NULL COMMENT '转账凭证图片URL',
  `status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '状态: pending-待确认, completed-已完成, cancelled-已取消',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_by` INT UNSIGNED DEFAULT NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_status` (`status`),
  KEY `idx_transfer_time` (`transfer_time`),
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='转账支付表';

-- 2. 在线支付表
CREATE TABLE IF NOT EXISTS `cmms_online_payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单编号',
  `trade_no` VARCHAR(100) DEFAULT NULL COMMENT '第三方交易流水号',
  `customer_name` VARCHAR(100) DEFAULT NULL COMMENT '客户姓名',
  `customer_id` INT UNSIGNED DEFAULT NULL COMMENT '客户ID',
  `amount` DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '支付金额',
  `payment_method` ENUM('wechat', 'alipay', 'unionpay') NOT NULL COMMENT '支付方式: wechat-微信支付, alipay-支付宝, unionpay-云闪付',
  `status` ENUM('pending', 'paid', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending' COMMENT '支付状态: pending-待支付, paid-已支付, cancelled-已取消, refunded-已退款',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `paid_at` DATETIME DEFAULT NULL COMMENT '支付时间',
  `cancelled_at` DATETIME DEFAULT NULL COMMENT '取消时间',
  `refund_at` DATETIME DEFAULT NULL COMMENT '退款时间',
  `refund_amount` DECIMAL(12,2) UNSIGNED DEFAULT NULL COMMENT '退款金额',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_by` INT UNSIGNED DEFAULT NULL COMMENT '创建人ID',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_trade_no` (`trade_no`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_method` (`payment_method`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='在线支付表';

-- 3. 发票管理表
CREATE TABLE IF NOT EXISTS `cmms_invoices` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `invoice_no` VARCHAR(50) NOT NULL COMMENT '发票号码',
  `type` ENUM('special', 'normal', 'electronic') NOT NULL DEFAULT 'normal' COMMENT '发票类型: special-增值税专用发票, normal-增值税普通发票, electronic-电子发票',
  `amount` DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '金额（不含税）',
  `tax_rate` DECIMAL(5,4) UNSIGNED NOT NULL DEFAULT 0.1300 COMMENT '税率',
  `tax_amount` DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '税额',
  `total_amount` DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '价税合计',
  `issue_date` DATE DEFAULT NULL COMMENT '开票日期',
  `status` ENUM('pending', 'issued', 'void') NOT NULL DEFAULT 'pending' COMMENT '状态: pending-待开具, issued-已开具, void-已作废',
  `company_name` VARCHAR(200) NOT NULL COMMENT '购买方名称',
  `tax_no` VARCHAR(50) NOT NULL COMMENT '纳税人识别号',
  `address_phone` VARCHAR(200) DEFAULT NULL COMMENT '地址电话',
  `bank_name` VARCHAR(100) DEFAULT NULL COMMENT '开户银行',
  `bank_account` VARCHAR(50) DEFAULT NULL COMMENT '银行账号',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `related_order_id` INT UNSIGNED DEFAULT NULL COMMENT '关联订单ID',
  `related_order_no` VARCHAR(50) DEFAULT NULL COMMENT '关联订单号',
  `created_by` INT UNSIGNED DEFAULT NULL COMMENT '创建人ID',
  `issued_by` INT UNSIGNED DEFAULT NULL COMMENT '开票人ID',
  `issued_at` DATETIME DEFAULT NULL COMMENT '开票操作时间',
  `voided_by` INT UNSIGNED DEFAULT NULL COMMENT '作废人ID',
  `voided_at` DATETIME DEFAULT NULL COMMENT '作废操作时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_invoice_no` (`invoice_no`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_company_name` (`company_name`),
  KEY `idx_tax_no` (`tax_no`),
  KEY `idx_issue_date` (`issue_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发票管理表';

-- ========================================
-- 测试数据
-- ========================================

-- 转账支付测试数据
INSERT INTO `cmms_transfer_payments` (`order_no`, `payee_name`, `payee_account`, `bank_name`, `amount`, `transfer_time`, `voucher`, `status`, `remark`, `created_at`) VALUES
('TF20240120001', '王五', '6228480012345678890', '中国工商银行', 5000.00, '2024-01-20 14:30:00', 'https://via.placeholder.com/200', 'completed', '支付维修费用', '2024-01-20 14:30:00'),
('TF20240120002', '李四', '6228480023456789012', '中国建设银行', 3500.00, '2024-01-20 16:00:00', NULL, 'pending', '待财务确认', '2024-01-20 16:00:00'),
('TF20240119001', '张三', 'ali_pay_123456', '支付宝', 2800.00, '2024-01-19 10:15:00', 'https://via.placeholder.com/200', 'completed', '配件采购款', '2024-01-19 10:15:00'),
('TF20240118001', '赵六', '6228480034567890123', '中国农业银行', 8000.00, '2024-01-18 09:20:00', NULL, 'cancelled', '账户信息有误，已取消', '2024-01-18 09:20:00'),
('TF20240117001', '孙七', '6228480045678901234', '中国银行', 4200.00, '2024-01-17 15:45:00', 'https://via.placeholder.com/200', 'completed', '设备采购', '2024-01-17 15:45:00'),
('TF20240116001', '周八', 'wx_pay_789012', '微信', 1500.00, '2024-01-16 11:20:00', NULL, 'completed', '服务费支付', '2024-01-16 11:20:00'),
('TF20240115001', '吴九', '6228480056789012345', '招商银行', 6800.00, '2024-01-15 09:10:00', NULL, 'pending', '待审核', '2024-01-15 09:10:00'),
('TF20240114001', '郑十', '6228480067890123456', '交通银行', 3200.00, '2024-01-14 14:30:00', 'https://via.placeholder.com/200', 'completed', '材料款', '2024-01-14 14:30:00');

-- 在线支付测试数据
INSERT INTO `cmms_online_payments` (`order_no`, `trade_no`, `customer_name`, `amount`, `payment_method`, `status`, `created_at`, `paid_at`, `remark`) VALUES
('ORD20240324001', 'WX2024032400001', '张三', 500.00, 'wechat', 'paid', '2024-03-24 10:30:00', '2024-03-24 10:30:15', '手机维修费用'),
('ORD20240324002', 'ALI2024032400002', '李四', 350.00, 'alipay', 'paid', '2024-03-24 11:15:00', '2024-03-24 11:15:20', '电脑维修费用'),
('ORD20240324003', 'UNION2024032400003', '王五', 800.00, 'unionpay', 'paid', '2024-03-24 13:45:00', '2024-03-24 13:45:10', '服务器维护费用'),
('ORD20240323001', 'WX2024032300001', '赵六', 1200.00, 'wechat', 'paid', '2024-03-23 09:20:00', '2024-03-23 09:20:30', '网络设备维修'),
('ORD20240323002', 'ALI2024032300002', '孙七', 650.00, 'alipay', 'refunded', '2024-03-23 14:30:00', '2024-03-23 14:30:25', '已退款'),
('ORD20240322001', 'WX2024032200001', '周八', 450.00, 'wechat', 'cancelled', '2024-03-22 16:00:00', NULL, '用户取消支付'),
('ORD20240322002', 'UNION2024032200002', '吴九', 980.00, 'unionpay', 'paid', '2024-03-22 10:15:00', '2024-03-22 10:15:18', '软件安装服务'),
('ORD20240321001', 'ALI2024032100001', '郑十', 720.00, 'alipay', 'paid', '2024-03-21 15:40:00', '2024-03-21 15:40:22', '数据恢复服务'),
('ORD20240320001', 'WX2024032000001', '钱十一', 560.00, 'wechat', 'pending', '2024-03-20 11:30:00', NULL, '待支付'),
('ORD20240320002', 'UNION2024032000002', '陈十二', 1100.00, 'unionpay', 'paid', '2024-03-20 14:20:00', '2024-03-20 14:20:15', '综合维修服务');

-- 发票管理测试数据
INSERT INTO `cmms_invoices` (`invoice_no`, `type`, `amount`, `tax_rate`, `tax_amount`, `total_amount`, `issue_date`, `status`, `company_name`, `tax_no`, `address_phone`, `bank_name`, `bank_account`, `remark`, `created_at`, `issued_at`) VALUES
('01234567', 'special', 10000.00, 0.1300, 1300.00, 11300.00, '2024-01-20', 'issued', '上海机械制造有限公司', '91310000MA1FL1234', '上海市浦东新区张江高科技园区 021-12345678', '中国工商银行上海分行', '123456789012345678', '设备维修费', '2024-01-20 09:00:00', '2024-01-20 09:30:00'),
('01234568', 'normal', 5000.00, 0.1300, 650.00, 5650.00, '2024-01-19', 'issued', '北京建设集团', '91110000MA2FL5678', '北京市朝阳区建国路88号 010-87654321', '中国建设银行北京分行', '234567890123456789', '配件销售', '2024-01-19 08:00:00', '2024-01-19 08:20:00'),
('01234569', 'electronic', 8000.00, 0.0900, 720.00, 8720.00, NULL, 'pending', '深圳物流有限公司', '91440300MA3FL9012', '', '', '', '服务费', '2024-01-18 10:00:00', NULL),
('01234570', 'special', 15000.00, 0.1300, 1950.00, 16950.00, '2024-01-17', 'issued', '广州电子科技有限公司', '91440101MA4FL2345', '广州市天河区科韵路 020-98765432', '中国银行广州分行', '345678901234567890', '系统开发服务', '2024-01-17 11:00:00', '2024-01-17 11:15:00'),
('01234571', 'normal', 3000.00, 0.0600, 180.00, 3180.00, '2024-01-16', 'void', '杭州网络服务公司', '91330101MA5FL3456', '杭州市西湖区文三路 0571-13579086', '招商银行杭州分行', '456789012345678901', '网络维护费', '2024-01-16 09:30:00', '2024-01-16 09:45:00'),
('01234572', 'electronic', 12000.00, 0.0900, 1080.00, 13080.00, NULL, 'pending', '成都数据中心', '91510101MA6FL4567', '', '', '', '云服务费', '2024-01-15 14:00:00', NULL),
('01234573', 'special', 20000.00, 0.1300, 2600.00, 22600.00, '2024-01-14', 'issued', '武汉智能制造有限公司', '91420101MA7FL5678', '武汉市东湖高新区光谷大道 027-24681357', '交通银行武汉分行', '567890123456789012', '智能制造系统', '2024-01-14 10:00:00', '2024-01-14 10:25:00'),
('01234574', 'normal', 4500.00, 0.0300, 135.00, 4635.00, '2024-01-13', 'issued', '南京软件开发公司', '91320101MA8FL6789', '南京市江宁区麒麟科技创新园 025-11223344', '工商银行南京分行', '678901234567890123', '软件定制开发', '2024-01-13 15:00:00', '2024-01-13 15:10:00');

-- ========================================
-- 完成提示
-- ========================================
SELECT '支付模块表创建完成！' AS message;
SELECT '转账支付表记录数:' AS info, COUNT(*) AS count FROM cmms_transfer_payments;
SELECT '在线支付表记录数:' AS info, COUNT(*) AS count FROM cmms_online_payments;
SELECT '发票管理表记录数:' AS info, COUNT(*) AS count FROM cmms_invoices;
