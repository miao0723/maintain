-- =============================================
-- 合同项目明细表
-- =============================================

CREATE TABLE IF NOT EXISTS `repair_contract_items` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `contract_id` int(11) unsigned NOT NULL COMMENT '合同ID',
    `item_name` varchar(200) NOT NULL COMMENT '项目名称',
    `item_code` varchar(50) DEFAULT NULL COMMENT '项目编号',
    `specification` varchar(255) DEFAULT NULL COMMENT '规格型号',
    `unit` varchar(20) DEFAULT '次' COMMENT '单位',
    `unit_price` decimal(10, 2) DEFAULT 0.00 COMMENT '单价',
    `quantity` decimal(10, 2) DEFAULT 1.00 COMMENT '数量',
    `total_price` decimal(10, 2) DEFAULT 0.00 COMMENT '小计金额',
    `remark` text DEFAULT NULL COMMENT '备注',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_contract_id` (`contract_id`),
    KEY `idx_item_code` (`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同项目明细表';
