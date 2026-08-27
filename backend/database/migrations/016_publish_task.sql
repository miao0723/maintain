-- 自动发布任务表：脚本模式下，每个平台的每次发布都会在这里留痕，
-- 前端轮询 checkPublishStatus 时读这张表拿实时进度，发布成功/失败也写回这里。
-- 与 publisher-service 自带的 SQLite（publish_task）无关，这是后端 MySQL 侧的镜像。

DROP TABLE IF EXISTS `marketing_publish_task`;
CREATE TABLE `marketing_publish_task`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `content_id` int NOT NULL COMMENT '关联 marketing_douyin_content.id',
  `platform` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '平台: douyin/xiaohongshu/kuaishou/bilibili',
  `task_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'publisher-service 返回的任务ID',
  `status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT 'pending/running/success/failed/cancelled',
  `stage` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '当前阶段描述',
  `progress` int NOT NULL DEFAULT 0 COMMENT '进度百分比 0-100',
  `message` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '状态说明/报错信息',
  `result_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '发布成功后的作品链接',
  `screenshot` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '失败现场截图路径（发布服务侧）',
  `attempts` int NOT NULL DEFAULT 0 COMMENT '已重试次数',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_task_id`(`task_id` ASC) USING BTREE,
  INDEX `idx_content_platform`(`content_id` ASC, `platform` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '自动发布任务表（脚本模式）' ROW_FORMAT = DYNAMIC;
