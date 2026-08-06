-- =============================================
-- 小程序维修进度同步表
-- 用于关联小程序订单与后台维修进度系统
-- =============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- 1. 小程序订单关联表
-- =============================================
DROP TABLE IF EXISTS `miniprogram_order_mapping`;
CREATE TABLE `miniprogram_order_mapping` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `miniprogram_order_id` int(11) NOT NULL COMMENT '小程序订单ID',
  `miniprogram_order_no` varchar(50) NOT NULL COMMENT '小程序订单号',
  `cmms_order_id` int(11) DEFAULT NULL COMMENT 'CMMS后台订单ID',
  `sync_status` enum('not_synced','synced','sync_failed') DEFAULT 'not_synced' COMMENT '同步状态',
  `last_synced_at` datetime DEFAULT NULL COMMENT '最后同步时间',
  `sync_error` text COMMENT '同步错误信息',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mp_order_id` (`miniprogram_order_id`),
  KEY `uk_mp_order_no` (`miniprogram_order_no`),
  KEY `idx_cmms_order_id` (`cmms_order_id`),
  KEY `idx_sync_status` (`sync_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小程序订单关联表';

-- =============================================
-- 2. 小程序进度同步记录表
-- =============================================
DROP TABLE IF EXISTS `miniprogram_progress_sync`;
CREATE TABLE `miniprogram_progress_sync` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `miniprogram_order_id` int(11) NOT NULL COMMENT '小程序订单ID',
  `progress` int(11) NOT NULL DEFAULT 0 COMMENT '进度百分比(0-100)',
  `status` varchar(20) DEFAULT NULL COMMENT '订单状态',
  `synced_to_cmms` tinyint(1) DEFAULT 0 COMMENT '是否已同步到CMMS:0-未同步,1-已同步',
  `synced_at` datetime DEFAULT NULL COMMENT '同步时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_mp_order_id` (`miniprogram_order_id`),
  KEY `idx_synced_to_cmms` (`synced_to_cmms`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小程序进度同步记录表';

-- =============================================
-- 3. 小程序进度照片同步记录表
-- =============================================
DROP TABLE IF EXISTS `miniprogram_progress_photo_sync`;
CREATE TABLE `miniprogram_progress_photo_sync` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `miniprogram_order_id` int(11) NOT NULL COMMENT '小程序订单ID',
  `description` varchar(500) DEFAULT NULL COMMENT '照片说明',
  `images` json DEFAULT NULL COMMENT '图片JSON数组',
  `uploaded_by` int(11) DEFAULT NULL COMMENT '上传人ID',
  `uploaded_by_name` varchar(50) DEFAULT NULL COMMENT '上传人姓名',
  `synced_to_cmms` tinyint(1) DEFAULT 0 COMMENT '是否已同步到CMMS:0-未同步,1-已同步',
  `cmms_progress_photo_id` int(11) DEFAULT NULL COMMENT 'CMMS进度照片ID',
  `synced_at` datetime DEFAULT NULL COMMENT '同步时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_mp_order_id` (`miniprogram_order_id`),
  KEY `idx_synced_to_cmms` (`synced_to_cmms`),
  KEY `idx_cmms_photo_id` (`cmms_progress_photo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小程序进度照片同步记录表';

-- =============================================
-- 4. 小程序进度视频同步记录表
-- =============================================
DROP TABLE IF EXISTS `miniprogram_progress_video_sync`;
CREATE TABLE `miniprogram_progress_video_sync` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `miniprogram_order_id` int(11) NOT NULL COMMENT '小程序订单ID',
  `video_title` varchar(100) NOT NULL COMMENT '视频标题',
  `description` varchar(500) DEFAULT NULL COMMENT '视频说明',
  `video_url` varchar(500) NOT NULL COMMENT '视频URL',
  `cover_url` varchar(500) DEFAULT NULL COMMENT '封面URL',
  `duration` int(11) DEFAULT 0 COMMENT '视频时长(秒)',
  `file_size` bigint(20) DEFAULT 0 COMMENT '文件大小(字节)',
  `uploaded_by` int(11) DEFAULT NULL COMMENT '上传人ID',
  `uploaded_by_name` varchar(50) DEFAULT NULL COMMENT '上传人姓名',
  `synced_to_cmms` tinyint(1) DEFAULT 0 COMMENT '是否已同步到CMMS:0-未同步,1-已同步',
  `cmms_progress_video_id` int(11) DEFAULT NULL COMMENT 'CMMS进度视频ID',
  `synced_at` datetime DEFAULT NULL COMMENT '同步时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_mp_order_id` (`miniprogram_order_id`),
  KEY `idx_synced_to_cmms` (`synced_to_cmms`),
  KEY `idx_cmms_video_id` (`cmms_progress_video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小程序进度视频同步记录表';

SET FOREIGN_KEY_CHECKS = 1;
