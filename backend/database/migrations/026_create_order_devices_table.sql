-- =============================================================
-- 订单设备明细表 (order_devices)
-- 日期: 2026-08-22
-- 说明: 关联小程序订单(repair.orders.id)的设备明细。
--       采用「独立新表 + order_id 逻辑关联订单」方案，
--       不直接把设备字段塞进订单表，避免违反范式与一订单多设备的冲突。
--       本表建在后台库(cmms_db)；order_id 逻辑指向 repair.orders.id，
--       不跨库建物理外键，避免改动小程序库结构。
-- =============================================================

CREATE TABLE IF NOT EXISTS `order_devices` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_id` int(11) NOT NULL COMMENT '关联订单ID（repair.orders.id）',
  `name` varchar(100) NOT NULL COMMENT '设备名称',
  `serial_no` varchar(100) DEFAULT NULL COMMENT '序列号（同一设备可能出现在多订单，不全局唯一）',
  `source` varchar(50) DEFAULT NULL COMMENT '设备来源：采购/客户自备/租赁/调拨/赠送',
  `quantity` decimal(10,2) NOT NULL DEFAULT 1.00 COMMENT '数量',
  `unit` varchar(10) DEFAULT NULL COMMENT '单位（默认 台）',
  `remarks` text COMMENT '备注',
  `status` varchar(20) NOT NULL DEFAULT 'normal' COMMENT '状态：normal正常/maintenance维修中/idle闲置/scrapped报废',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单设备明细表';
