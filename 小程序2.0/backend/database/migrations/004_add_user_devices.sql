-- ============================================================
-- 迁移: 004_add_user_devices
-- 描述: 新增用户设备绑定表，支持用户在"我的"页面管理个人设备
-- 日期: 2026-06-10
-- 在 Navicat 中直接运行此 SQL 即可
-- ============================================================

-- 创建 user_devices 表
CREATE TABLE IF NOT EXISTS `user_devices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `user_id` INT NOT NULL COMMENT '用户ID，关联users表',
  `device_type_id` INT NOT NULL COMMENT '设备类型ID，关联device_types表(1手机 2电脑 3平板 4手表 5耳机 6相机 7游戏机 8其他)',
  `brand_name` VARCHAR(100) DEFAULT NULL COMMENT '品牌名称(冗余字段，方便列表展示)',
  `device_model` VARCHAR(200) NOT NULL COMMENT '设备型号(如iPhone 15 Pro)',
  `device_nickname` VARCHAR(100) DEFAULT NULL COMMENT '用户自定义设备昵称(如"我的工作手机")',
  `serial_number` VARCHAR(100) DEFAULT NULL COMMENT '序列号/IMEI/SN码',
  `device_condition` VARCHAR(500) DEFAULT NULL COMMENT '设备现状描述(如"屏幕右上角轻微裂痕")',
  `purchase_date` DATE DEFAULT NULL COMMENT '购买日期',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否默认设备: 0否 1是',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_device_type_id` (`device_type_id`),
  INDEX `idx_is_default` (`user_id`, `is_default`),
  CONSTRAINT `fk_user_devices_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_devices_device_type` FOREIGN KEY (`device_type_id`) REFERENCES `device_types`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设备绑定表';
