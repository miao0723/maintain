-- =============================================
-- 免责协议表
-- =============================================

CREATE TABLE IF NOT EXISTS `agreements` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
    `title` varchar(200) NOT NULL COMMENT '协议标题',
    `code` varchar(50) NOT NULL COMMENT '协议编码',
    `content` text COMMENT '协议内容 (HTML)',
    `version` varchar(20) DEFAULT '1.0' COMMENT '版本号',
    `status` tinyint(1) DEFAULT 1 COMMENT '状态：1 启用 0 禁用',
    `effective_date` date DEFAULT NULL COMMENT '生效日期',
    `remark` text COMMENT '备注',
    `created_by` int(11) DEFAULT NULL COMMENT '创建人 ID',
    `updated_by` int(11) DEFAULT NULL COMMENT '更新人 ID',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='免责协议表';

-- 插入默认数据
INSERT INTO `agreements` (`title`, `code`, `content`, `version`, `status`, `effective_date`, `remark`) VALUES
('设备维修服务免责协议', 'repair_disclaimer', '<h2>设备维修服务免责协议</h2><h3>一、服务范围</h3><p>1. 本协议适用于本公司提供的所有设备维修服务。</p><p>2. 服务范围包括但不限于故障诊断、维修、保养、更换配件等。</p><h3>二、免责条款</h3><p>1. 因不可抗力因素（如自然灾害、战争、政府行为等）导致的设备损坏，本公司不承担责任。</p><p>2. 客户未按设备使用说明书操作导致的损坏，本公司不承担责任。</p><p>3. 维修过程中因设备自身老化、磨损等原因导致的二次损坏，本公司不承担责任。</p><h3>三、维修保证</h3><p>1. 本公司对维修部位提供 30 天的质量保证期。</p><p>2. 质量保证期内，因维修质量问题导致的故障，本公司免费重新维修。</p><h3>四、其他</h3><p>1. 本协议自客户签字确认之日起生效。</p><p>2. 本协议的最终解释权归本公司所有。</p>', '1.0', 1, '2024-01-01', '设备维修服务标准免责协议')
ON DUPLICATE KEY UPDATE title=VALUES(title);
