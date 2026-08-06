-- =============================================
-- 进度申请、进度照片、进度视频表结构
-- =============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- 1. 进度申请表
-- =============================================
DROP TABLE IF EXISTS `progress_apply`;
CREATE TABLE `progress_apply` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `apply_no` varchar(50) NOT NULL COMMENT '申请单号',
  `order_id` int(11) DEFAULT NULL COMMENT '关联订单ID',
  `customer_name` varchar(50) NOT NULL COMMENT '客户姓名',
  `phone` varchar(20) NOT NULL COMMENT '联系电话',
  `device_name` varchar(100) DEFAULT NULL COMMENT '设备名称',
  `progress_type` varchar(20) NOT NULL COMMENT '进度类型: repair-维修进度, parts-配件到货, support-技术支援, inspection-验收申请, other-其他',
  `apply_reason` text NOT NULL COMMENT '申请原因',
  `expected_time` datetime DEFAULT NULL COMMENT '期望完成时间',
  `approval_status` enum('pending','approved','rejected') DEFAULT 'pending' COMMENT '审核状态',
  `approval_remark` text COMMENT '审核意见',
  `approval_by` int(11) DEFAULT NULL COMMENT '审核人ID',
  `approval_at` datetime DEFAULT NULL COMMENT '审核时间',
  `created_by` int(11) DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_apply_no` (`apply_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_progress_type` (`progress_type`),
  KEY `idx_approval_status` (`approval_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='进度申请表';

-- =============================================
-- 2. 进度照片表
-- =============================================
DROP TABLE IF EXISTS `progress_photo`;
CREATE TABLE `progress_photo` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int(11) NOT NULL COMMENT '订单ID',
  `description` varchar(500) DEFAULT NULL COMMENT '照片说明',
  `images` json DEFAULT NULL COMMENT '图片JSON数组',
  `uploaded_by` int(11) DEFAULT NULL COMMENT '上传人ID',
  `uploaded_by_name` varchar(50) DEFAULT NULL COMMENT '上传人姓名',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='进度照片表';

-- =============================================
-- 3. 进度视频表
-- =============================================
DROP TABLE IF EXISTS `progress_video`;
CREATE TABLE `progress_video` (
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
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='进度视频表';

-- =============================================
-- 4. 进度申请测试数据
-- =============================================
INSERT INTO `progress_apply` (`apply_no`, `order_id`, `customer_name`, `phone`, `device_name`, `progress_type`, `apply_reason`, `expected_time`, `approval_status`) VALUES
('PA20260410001', 1, '张三', '13800138000', '挖掘机 CAT320', 'parts', '液压泵配件已到货，申请更换', '2026-04-11 10:00:00', 'pending'),
('PA20260410002', 2, '李四', '13900139000', '装载机 ZL50', 'inspection', '维修已完成，申请验收', '2026-04-11 15:00:00', 'approved');

-- =============================================
-- 5. 进度照片测试数据
-- =============================================
INSERT INTO `progress_photo` (`order_id`, `description`, `images`, `uploaded_by`, `uploaded_by_name`) VALUES
(1, '液压泵更换进度照片', '["https://via.placeholder.com/300x200?text=Photo1","https://via.placeholder.com/300x200?text=Photo2","https://via.placeholder.com/300x200?text=Photo3"]', 1, '李工程师'),
(2, '维修完成后的设备照片', '["https://via.placeholder.com/300x200?text=Photo1","https://via.placeholder.com/300x200?text=Photo2"]', 1, '王工程师');

-- =============================================
-- 6. 进度视频测试数据
-- =============================================
INSERT INTO `progress_video` (`order_id`, `video_title`, `description`, `video_url`, `cover_url`, `duration`, `file_size`, `uploaded_by`, `uploaded_by_name`) VALUES
(1, '液压泵更换过程', '液压泵拆卸和安装的全过程', 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', 'https://via.placeholder.com/400x300?text=Cover', 180, 52428800, 1, '李工程师'),
(2, '维修完成测试', '维修完成后的功能测试', 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', 'https://via.placeholder.com/400x300?text=Cover', 120, 31457280, 1, '王工程师');

SET FOREIGN_KEY_CHECKS = 1;