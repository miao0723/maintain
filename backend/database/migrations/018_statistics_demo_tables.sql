-- =============================================
-- 统计模块演示数据（收入/开支/订单/超时）
-- 执行方式：在 cmms_db 数据库中直接执行
-- =============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `statistics_timeout_records`;
DROP TABLE IF EXISTS `statistics_order_records`;
DROP TABLE IF EXISTS `statistics_expense_records`;
DROP TABLE IF EXISTS `statistics_income_records`;

CREATE TABLE `statistics_income_records` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `record_date` date NOT NULL COMMENT '收入日期',
  `payment_method` varchar(20) NOT NULL COMMENT '收款方式：online/transfer',
  `order_count` int NOT NULL DEFAULT 1 COMMENT '订单数',
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '收入金额',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_record_date` (`record_date`),
  KEY `idx_payment_method` (`payment_method`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收入统计记录表';

CREATE TABLE `statistics_expense_records` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `expense_date` date NOT NULL COMMENT '支出日期',
  `category` varchar(20) NOT NULL COMMENT '分类：purchase/salary/operation/other',
  `description` varchar(255) DEFAULT NULL COMMENT '支出说明',
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '支出金额',
  `payment_method` varchar(20) DEFAULT NULL COMMENT '支付方式',
  `operator` varchar(50) DEFAULT NULL COMMENT '经办人',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expense_date` (`expense_date`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='开支统计记录表';

CREATE TABLE `statistics_order_records` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_no` varchar(50) NOT NULL COMMENT '订单号',
  `customer_name` varchar(100) NOT NULL COMMENT '客户名称',
  `machine_type` varchar(100) DEFAULT NULL COMMENT '机械类型',
  `fault_desc` varchar(255) DEFAULT NULL COMMENT '故障描述',
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '订单金额',
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '状态：pending/processing/completed/cancelled',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单统计记录表';

CREATE TABLE `statistics_timeout_records` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_no` varchar(50) NOT NULL COMMENT '订单号',
  `customer_name` varchar(100) NOT NULL COMMENT '客户名称',
  `timeout_type` varchar(20) NOT NULL COMMENT '超时类型：response/repair/delivery',
  `timeout_minutes` int NOT NULL DEFAULT 0 COMMENT '超时分钟数',
  `reason` varchar(255) DEFAULT NULL COMMENT '超时原因',
  `responsible` varchar(50) DEFAULT NULL COMMENT '责任人',
  `solution` varchar(255) DEFAULT NULL COMMENT '处理方案',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_timeout_type` (`timeout_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='超时统计记录表';

INSERT INTO `statistics_income_records` (`record_date`, `payment_method`, `order_count`, `amount`, `remark`) VALUES
('2026-04-08', 'online', 14, 12680.00, '线上维修收款'),
('2026-04-08', 'transfer', 5, 4180.00, '企业客户转账'),
('2026-04-09', 'online', 16, 13850.00, '线上维修收款'),
('2026-04-09', 'transfer', 4, 3620.00, '单位客户转账'),
('2026-04-10', 'online', 15, 13240.00, '线上维修收款'),
('2026-04-10', 'transfer', 6, 5220.00, '对公转账'),
('2026-04-11', 'online', 18, 14960.00, '线上维修收款'),
('2026-04-11', 'transfer', 5, 4560.00, '大客户回款'),
('2026-04-12', 'online', 17, 14380.00, '周末订单收款'),
('2026-04-12', 'transfer', 6, 5480.00, '单位客户转账'),
('2026-04-13', 'online', 19, 15620.00, '线上维修收款'),
('2026-04-13', 'transfer', 5, 4730.00, '企业客户转账'),
('2026-04-14', 'online', 20, 16840.00, '线上维修收款'),
('2026-04-14', 'transfer', 7, 5960.00, '大额转账'),
('2026-04-15', 'online', 21, 17250.00, '线上维修收款'),
('2026-04-15', 'transfer', 6, 5320.00, '企业客户转账'),
('2026-04-16', 'online', 22, 18160.00, '线上维修收款'),
('2026-04-16', 'transfer', 8, 6480.00, '单位客户结算'),
('2026-04-17', 'online', 24, 19580.00, '线上维修收款'),
('2026-04-17', 'transfer', 7, 6120.00, '企业客户转账');

INSERT INTO `statistics_expense_records` (`expense_date`, `category`, `description`, `amount`, `payment_method`, `operator`) VALUES
('2026-04-08', 'purchase', '采购液压泵密封组件', 3860.00, '转账', '张三'),
('2026-04-08', 'operation', '仓储与物流费用', 1260.00, '转账', '李四'),
('2026-04-09', 'salary', '外勤工程师绩效补贴', 6800.00, '转账', '王五'),
('2026-04-09', 'other', '客户现场差旅费', 920.00, '现金', '赵六'),
('2026-04-10', 'purchase', '采购电机碳刷与轴承', 4580.00, '转账', '张三'),
('2026-04-10', 'operation', '办公室网络与电话费', 860.00, '转账', '李四'),
('2026-04-11', 'salary', '维修中心月度工资', 12800.00, '转账', '王五'),
('2026-04-11', 'purchase', '采购控制板与继电器', 5320.00, '转账', '张三'),
('2026-04-12', 'operation', '门店水电与物业费', 2180.00, '转账', '李四'),
('2026-04-12', 'other', '应急工具购置', 1380.00, '现金', '赵六'),
('2026-04-13', 'purchase', '采购压力传感器批次', 6240.00, '转账', '张三'),
('2026-04-13', 'operation', '短视频推广投流', 2860.00, '转账', '李四'),
('2026-04-14', 'salary', '售后客服与仓管工资', 9300.00, '转账', '王五'),
('2026-04-14', 'purchase', '采购工业润滑油', 1980.00, '转账', '张三'),
('2026-04-15', 'operation', '办公耗材采购', 760.00, '转账', '李四'),
('2026-04-15', 'other', '设备运输保险', 1160.00, '转账', '赵六'),
('2026-04-16', 'purchase', '采购显示模组与排线', 4720.00, '转账', '张三'),
('2026-04-16', 'salary', '驻场工程师补助', 5400.00, '转账', '王五'),
('2026-04-17', 'operation', '同城加急配送费', 980.00, '转账', '李四'),
('2026-04-17', 'purchase', '采购常用维修小料', 2540.00, '转账', '张三');

INSERT INTO `statistics_order_records` (`order_no`, `customer_name`, `machine_type`, `fault_desc`, `amount`, `status`, `created_at`) VALUES
('WO20260408001', '上海建工', '挖掘机', '液压系统压力不足', 3680.00, 'completed', '2026-04-08 09:12:00'),
('WO20260408002', '中建三局', '起重机', '回转机构异响', 5220.00, 'processing', '2026-04-08 14:25:00'),
('WO20260409001', '北京城建', '装载机', '变速箱顿挫', 4860.00, 'completed', '2026-04-09 10:08:00'),
('WO20260409002', '江苏交通', '压路机', '制动系统告警', 2750.00, 'pending', '2026-04-09 16:36:00'),
('WO20260410001', '浙江建设', '叉车', '仪表无法点亮', 1460.00, 'completed', '2026-04-10 08:46:00'),
('WO20260410002', '山东路桥', '挖掘机', '空调制冷异常', 1880.00, 'cancelled', '2026-04-10 13:10:00'),
('WO20260411001', '河南建工', '混凝土泵车', '泵送压力波动', 6320.00, 'processing', '2026-04-11 09:30:00'),
('WO20260411002', '湖北路桥', '平地机', '转向油缸漏油', 3420.00, 'completed', '2026-04-11 15:42:00'),
('WO20260412001', '深圳机电', '发电机组', '控制柜通讯故障', 4580.00, 'completed', '2026-04-12 11:16:00'),
('WO20260412002', '广州港机', '堆高机', '动力电池衰减', 7240.00, 'processing', '2026-04-12 17:05:00'),
('WO20260413001', '苏州装备', '激光切割机', '激光头偏移', 5180.00, 'completed', '2026-04-13 09:55:00'),
('WO20260413002', '宁波制造', '数控车床', '主轴温升过高', 3960.00, 'pending', '2026-04-13 14:44:00'),
('WO20260414001', '天津重工', '吊车', '支腿传感器异常', 2840.00, 'completed', '2026-04-14 08:28:00'),
('WO20260414002', '青岛船厂', '空压机', '排气温度过高', 3160.00, 'processing', '2026-04-14 16:18:00'),
('WO20260415001', '武汉城建', '挖掘机', '先导阀卡滞', 2680.00, 'completed', '2026-04-15 09:07:00'),
('WO20260415002', '成都设备', '包装机', '伺服驱动报码', 4520.00, 'completed', '2026-04-15 13:52:00'),
('WO20260416001', '厦门物流', '叉车', '起升速度变慢', 1580.00, 'pending', '2026-04-16 10:12:00'),
('WO20260416002', '合肥制造', '注塑机', '加热区温控失灵', 3860.00, 'processing', '2026-04-16 15:26:00'),
('WO20260417001', '重庆建设', '压路机', '振动马达故障', 2940.00, 'completed', '2026-04-17 09:40:00'),
('WO20260417002', '福州机修', '发电机组', '油压异常报警', 3380.00, 'processing', '2026-04-17 16:08:00');

INSERT INTO `statistics_timeout_records` (`order_no`, `customer_name`, `timeout_type`, `timeout_minutes`, `reason`, `responsible`, `solution`, `created_at`) VALUES
('WO20260408002', '中建三局', 'response', 135, '工程师跨区支援返程延迟', '张三', '已调整附近工程师优先响应', '2026-04-08 15:30:00'),
('WO20260409002', '江苏交通', 'repair', 960, '待专用刹车阀到货', '李四', '已发起加急采购', '2026-04-09 18:10:00'),
('WO20260410002', '山东路桥', 'delivery', 720, '客户现场临时停工无法交付', '王五', '改期至下一个工作日', '2026-04-10 17:20:00'),
('WO20260411001', '河南建工', 'repair', 1260, '泵送总成拆检复杂度高于预估', '赵六', '增加高级工程师协同处理', '2026-04-11 19:05:00'),
('WO20260412002', '广州港机', 'response', 88, '现场高峰时段交通拥堵', '张三', '已建立港区值守机制', '2026-04-12 18:16:00'),
('WO20260413002', '宁波制造', 'delivery', 1560, '客户追加检测项目', '李四', '重新确认交付时间', '2026-04-13 20:28:00'),
('WO20260414002', '青岛船厂', 'repair', 840, '高温故障复现时间较长', '王五', '延长老化测试并补充备件', '2026-04-14 21:15:00'),
('WO20260416002', '合肥制造', 'response', 54, '上个项目收尾导致出发延后', '赵六', '优化排班并缩短交接时间', '2026-04-16 17:02:00'),
('WO20260417002', '福州机修', 'delivery', 690, '客户现场验收负责人临时请假', '张三', '已预约次日上午复验', '2026-04-17 18:36:00');

SET FOREIGN_KEY_CHECKS = 1;
