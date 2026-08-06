-- =============================================
-- 小程序 repair 数据库进度照片和视频表
-- 用于存储维修人员上传的进度照片和视频
-- =============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- 1. 维修进度照片表
-- =============================================
DROP TABLE IF EXISTS `order_progress_photos`;
CREATE TABLE `order_progress_photos` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int(11) NOT NULL COMMENT '订单ID',
  `description` varchar(500) DEFAULT NULL COMMENT '照片说明',
  `images` json DEFAULT NULL COMMENT '图片JSON数组',
  `uploaded_by` int(11) DEFAULT NULL COMMENT '上传人ID',
  `uploaded_by_name` varchar(50) DEFAULT NULL COMMENT '上传人姓名',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_uploaded_by` (`uploaded_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修进度照片表';

-- =============================================
-- 2. 维修进度视频表
-- =============================================
DROP TABLE IF EXISTS `order_progress_videos`;
CREATE TABLE `order_progress_videos` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int(11) NOT NULL COMMENT '订单ID',
  `video_title` varchar(100) NOT NULL COMMENT '视频标题',
  `description` varchar(500) DEFAULT NULL COMMENT '视频说明',
  `video_url` varchar(500) NOT NULL COMMENT '视频URL',
  `cover_url` varchar(500) DEFAULT NULL COMMENT '封面URL',
  `duration` int(11) DEFAULT 0 COMMENT '视频时长(秒)',
  `file_size` bigint(20) DEFAULT 0 COMMENT '文件大小(字节)',
  `uploaded_by` int(11) DEFAULT NULL COMMENT '上传人ID',
  `uploaded_by_name` varchar(50) DEFAULT NULL COMMENT '上传人姓名',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_uploaded_by` (`uploaded_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修进度视频表';

-- =============================================
-- 3. CMMS同步日志表（可选）
-- =============================================
DROP TABLE IF EXISTS `cmms_sync_log`;
CREATE TABLE `cmms_sync_log` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int(11) NOT NULL COMMENT '小程序订单ID',
  `sync_type` enum('progress','photo','video') DEFAULT 'progress' COMMENT '同步类型',
  `cmms_order_id` int(11) DEFAULT NULL COMMENT 'CMMS订单ID',
  `sync_status` enum('success','failed') DEFAULT 'success' COMMENT '同步状态',
  `sync_error` text COMMENT '同步错误信息',
  `synced_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '同步时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_sync_type` (`sync_type`),
  KEY `idx_sync_status` (`sync_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='CMMS同步日志表';

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- 执行完成
-- =============================================
SELECT '小程序进度照片和视频表创建完成！' AS message;
