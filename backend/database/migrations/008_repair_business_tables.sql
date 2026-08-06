-- =============================================
-- 联动维修 + 维修进度（Navicat 直接执行版）
-- 说明：
-- 1. 仅重建 external_repairs、repair_progress 两张表
-- 2. 不包含跨库 SQL，不依赖 repair.orders 库名
-- 3. 如果你已经删除这两张表，直接整段执行即可
-- =============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- 1. 删除旧表（如果存在）
-- =============================================
DROP TABLE IF EXISTS `repair_progress`;
DROP TABLE IF EXISTS `external_repairs`;

-- =============================================
-- 2. 联动维修表
-- =============================================
CREATE TABLE `external_repairs` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int(11) NOT NULL COMMENT '订单ID',
  `external_unit` varchar(100) NOT NULL COMMENT '外部单位',
  `contact_person` varchar(50) DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `repair_content` text COMMENT '维修内容',
  `amount` decimal(10,2) DEFAULT 0.00 COMMENT '维修金额',
  `status` enum('pending','in_progress','completed') DEFAULT 'pending' COMMENT '状态：pending-待处理，in_progress-进行中，completed-已完成',
  `start_date` date DEFAULT NULL COMMENT '开始日期',
  `end_date` date DEFAULT NULL COMMENT '完成日期',
  `remark` text COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_external_unit` (`external_unit`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='联动维修表';

-- =============================================
-- 3. 维修进度表
-- =============================================
CREATE TABLE `repair_progress` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int(11) NOT NULL COMMENT '订单ID',
  `repair_report_id` int(11) DEFAULT NULL COMMENT '关联维修报告ID',
  `stage` varchar(50) NOT NULL COMMENT '阶段标识（中文）',
  `stage_name` varchar(100) DEFAULT NULL COMMENT '阶段名称',
  `status` enum('pending','in_progress','completed') DEFAULT 'pending' COMMENT '状态：pending-待开始，in_progress-进行中，completed-已完成',
  `progress` int(11) DEFAULT 0 COMMENT '进度百分比',
  `description` text COMMENT '阶段描述',
  `handler_id` int(11) DEFAULT NULL COMMENT '处理人ID',
  `handler_name` varchar(50) DEFAULT NULL COMMENT '处理人姓名',
  `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '结束时间',
  `attachments` text COMMENT '附件(JSON)',
  `images` text COMMENT '图片(JSON)',
  `remark` text COMMENT '备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_repair_report_id` (`repair_report_id`),
  KEY `idx_stage` (`stage`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修进度表';

-- =============================================
-- 4. 联动维修测试数据
-- 说明：order_id 请按你系统已有订单ID调整；若 1、2 存在可直接使用
-- =============================================
INSERT INTO `external_repairs`
(`order_id`, `external_unit`, `contact_person`, `contact_phone`, `repair_content`, `amount`, `status`, `start_date`, `end_date`, `remark`)
VALUES
(1, '华南精密协作中心', '陈工', '13800138111', '外协更换主轴轴承并做动平衡校准', 3200.00, 'completed', '2024-01-18', '2024-01-21', '已回传维修结果'),
(2, '智维激光服务站', '刘工', '13800138222', '激光管更换与光路校准', 5600.00, 'in_progress', '2024-02-23', NULL, '等待最终验收确认'),
(2, '远程检测支持中心', '周工', '13800138333', '协助完成故障复测与参数调整', 1800.00, 'pending', '2024-02-25', NULL, '待安排到场');

-- =============================================
-- 5. 维修进度测试数据
-- stage / stage_name 全部使用中文，避免看到英文标识
-- =============================================
INSERT INTO `repair_progress`
(`order_id`, `repair_report_id`, `stage`, `stage_name`, `status`, `progress`, `description`, `handler_name`, `start_time`, `end_time`, `remark`)
VALUES
(1, 1, '故障诊断', '故障诊断', 'completed', 100, '完成主轴异响检测，确认轴承磨损。', '王五', '2024-01-18 09:00:00', '2024-01-18 11:00:00', '检测完成'),
(1, 1, '维修实施', '维修实施', 'completed', 100, '完成轴承更换、润滑和精度校准。', '王五', '2024-01-19 09:30:00', '2024-01-20 16:30:00', '维修完成'),
(1, 1, '测试验收', '测试验收', 'completed', 100, '连续运行测试通过，设备恢复正常。', '质检组', '2024-01-21 09:00:00', '2024-01-21 10:30:00', '已交付'),
(2, 2, '故障诊断', '故障诊断', 'completed', 100, '确认激光功率衰减，需要更换激光管。', '赵六', '2024-02-23 10:00:00', '2024-02-23 12:00:00', '已定位问题'),
(2, 2, '维修实施', '维修实施', 'in_progress', 65, '正在更换激光管并重新标定光路。', '赵六', '2024-02-24 09:00:00', NULL, '维修进行中'),
(2, 2, '测试验收', '测试验收', 'pending', 0, '待维修完成后进行整机测试与验收。', '质检组', NULL, NULL, '未开始');

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- 执行完成
-- =============================================
