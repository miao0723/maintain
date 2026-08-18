-- 维修价格参考表（供管理员在「价格管理」中维护标准报价）
CREATE TABLE IF NOT EXISTS `prices` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '价格项ID',
  `device_type` varchar(50) NOT NULL COMMENT '设备类型（如 手机/电脑）',
  `fault_category` varchar(100) NOT NULL COMMENT '故障类别（如 屏幕/电池）',
  `device_model` varchar(100) DEFAULT '' COMMENT '设备型号（可选，留空表示通用）',
  `price` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '参考价格',
  `description` varchar(255) DEFAULT '' COMMENT '说明',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_prices_device_type`(`device_type`),
  INDEX `idx_prices_fault`(`fault_category`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '维修价格参考表';
