-- Add local_path column to marketing_douyin_content
ALTER TABLE `marketing_douyin_content`
ADD COLUMN `local_path` varchar(500) NULL DEFAULT NULL COMMENT '本地存储路径' AFTER `video_url`;

-- Add local_filename column to marketing_douyin_content
ALTER TABLE `marketing_douyin_content`
ADD COLUMN `local_filename` varchar(255) NULL DEFAULT NULL COMMENT '本地文件名' AFTER `local_path`;