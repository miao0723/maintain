-- 维修内容管理表
-- 用于业务管理下的维修内容管理模块

-- 维修内容分类表
CREATE TABLE IF NOT EXISTS `maintenance_categories` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '分类名称',
  `code` varchar(50) DEFAULT NULL COMMENT '分类编码',
  `description` varchar(255) DEFAULT NULL COMMENT '分类描述',
  `sort` int(11) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 1 启用 0 禁用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_sort` (`sort`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修内容分类表';

-- 维修内容表
CREATE TABLE IF NOT EXISTS `maintenance_items` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL COMMENT '维修项目编号',
  `name` varchar(100) NOT NULL COMMENT '维修项目名称',
  `category_id` int(11) DEFAULT NULL COMMENT '分类 ID',
  `unit` varchar(20) DEFAULT '次' COMMENT '单位',
  `price` decimal(10,2) DEFAULT 0.00 COMMENT '参考价格',
  `description` text COMMENT '说明',
  `sort` int(11) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 1 启用 0 禁用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_sort` (`sort`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修内容表';

-- 初始化维修内容分类数据
INSERT INTO `maintenance_categories` (`id`, `name`, `code`, `description`, `sort`, `status`) VALUES
(1, '空调维修', 'MAINT_AC', '空调相关维修项目', 1, 1),
(2, '冰箱维修', 'MAINT_FRIDGE', '冰箱相关维修项目', 2, 1),
(3, '洗衣机维修', 'MAINT_WASHER', '洗衣机相关维修项目', 3, 1),
(4, '热水器维修', 'MAINT_WATER_HEATER', '热水器相关维修项目', 4, 1),
(5, '电视机维修', 'MAINT_TV', '电视机相关维修项目', 5, 1),
(6, '电脑维修', 'MAINT_COMPUTER', '电脑相关维修项目', 6, 1),
(7, '网络设备维修', 'MAINT_NETWORK', '网络设备相关维修项目', 7, 1),
(8, '其他维修', 'MAINT_OTHER', '其他维修项目', 99, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 初始化维修内容测试数据
INSERT INTO `maintenance_items` (`id`, `code`, `name`, `category_id`, `unit`, `price`, `description`, `sort`, `status`) VALUES
-- 空调维修
(1000, 'AC-001', '空调清洗', 1, '次', 100.00, '空调内机深度清洗服务，包括蒸发器、风轮等部件', 1, 1),
(1001, 'AC-002', '空调加氟', 1, '次', 150.00, '空调制冷剂补充服务', 2, 1),
(1002, 'AC-003', '空调维修 - 不制冷', 1, '次', 200.00, '空调不制冷故障排查与维修', 3, 1),
(1003, 'AC-004', '空调维修 - 不制热', 1, '次', 200.00, '空调不制热故障排查与维修', 4, 1),
(1004, 'AC-005', '空调漏水维修', 1, '次', 180.00, '空调漏水问题排查与修复', 5, 1),
(1005, 'AC-006', '空调异响处理', 1, '次', 150.00, '空调运行异响排查与处理', 6, 1),

-- 冰箱维修
(2000, 'FR-001', '冰箱清洗消毒', 2, '次', 120.00, '冰箱内外清洁与消毒服务', 1, 1),
(2001, 'FR-002', '冰箱不制冷维修', 2, '次', 250.00, '冰箱不制冷故障排查与维修', 2, 1),
(2002, 'FR-003', '冰箱门封更换', 2, '个', 100.00, '冰箱门封条更换服务', 3, 1),
(2003, 'FR-004', '冰箱温控器维修', 2, '次', 200.00, '冰箱温控器故障维修', 4, 1),
(2004, 'FR-005', '冰箱除霜维修', 2, '次', 150.00, '冰箱除霜系统故障维修', 5, 1),

-- 洗衣机维修
(3000, 'WS-001', '洗衣机清洗', 3, '次', 100.00, '洗衣机内筒深度清洗', 1, 1),
(3001, 'WS-002', '洗衣机不排水维修', 3, '次', 180.00, '洗衣机排水故障维修', 2, 1),
(3002, 'WS-003', '洗衣机不转动维修', 3, '次', 220.00, '洗衣机滚筒不转动故障维修', 3, 1),
(3003, 'WS-004', '洗衣机漏水维修', 3, '次', 200.00, '洗衣机漏水问题排查与修复', 4, 1),
(3004, 'WS-005', '洗衣机异响处理', 3, '次', 150.00, '洗衣机运行异响排查与处理', 5, 1),

-- 热水器维修
(4000, 'WH-001', '热水器清洗保养', 4, '次', 150.00, '热水器内胆清洗与保养', 1, 1),
(4001, 'WH-002', '热水器不加热维修', 4, '次', 200.00, '热水器加热故障维修', 2, 1),
(4002, 'WH-003', '热水器漏水维修', 4, '次', 180.00, '热水器漏水问题排查与修复', 3, 1),
(4003, 'WH-004', '热水器温控器更换', 4, '个', 120.00, '热水器温控器更换服务', 4, 1),

-- 电视机维修
(5000, 'TV-001', '电视机黑屏维修', 5, '次', 300.00, '电视机黑屏故障排查与维修', 1, 1),
(5001, 'TV-002', '电视机无声音维修', 5, '次', 200.00, '电视机无声音故障维修', 2, 1),
(5002, 'TV-003', '电视机无法开机维修', 5, '次', 250.00, '电视机无法开机故障维修', 3, 1),
(5003, 'TV-004', '电视机画面异常维修', 5, '次', 280.00, '电视机画面异常故障维修', 4, 1),

-- 电脑维修
(6000, 'PC-001', '电脑系统重装', 6, '次', 150.00, '电脑操作系统安装与配置', 1, 1),
(6001, 'PC-002', '电脑无法开机维修', 6, '次', 200.00, '电脑无法开机故障排查与维修', 2, 1),
(6002, 'PC-003', '电脑蓝屏维修', 6, '次', 180.00, '电脑蓝屏故障排查与修复', 3, 1),
(6003, 'PC-004', '电脑硬件升级', 6, '次', 100.00, '电脑硬件升级安装服务', 4, 1),
(6004, 'PC-005', '电脑病毒查杀', 6, '次', 80.00, '电脑病毒查杀与清理', 5, 1),

-- 网络设备维修
(7000, 'NET-001', '路由器维修', 7, '次', 150.00, '路由器故障排查与维修', 1, 1),
(7001, 'NET-002', '交换机维修', 7, '次', 200.00, '交换机故障排查与维修', 2, 1),
(7002, 'NET-003', '网络布线', 7, '米', 30.00, '网络综合布线服务', 3, 1),
(7003, 'NET-004', '网络调试', 7, '次', 100.00, '网络配置与调试服务', 4, 1),

-- 其他维修
(9000, 'OTH-001', '家电维修咨询', 8, '次', 50.00, '家电维修技术咨询', 1, 1),
(9001, 'OTH-002', '上门检测费', 8, '次', 80.00, '上门故障检测服务费', 2, 1),
(9002, 'OTH-003', '配件更换安装', 8, '次', 100.00, '配件更换与安装服务', 3, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);
