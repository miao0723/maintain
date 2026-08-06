-- 知识库模块数据库表
-- 执行时间: 2026-04-27

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 知识库集合表
-- ----------------------------
DROP TABLE IF EXISTS `kb_collections`;
CREATE TABLE `kb_collections` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '知识库名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '知识库描述',
  `milvus_collection_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Milvus集合名',
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '图标标识',
  `file_count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '文件数量',
  `chunk_count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '文档块数量',
  `total_chars` bigint UNSIGNED NOT NULL DEFAULT 0 COMMENT '总字符数',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:0禁用 1启用',
  `created_by` int UNSIGNED NOT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_created_by` (`created_by`) USING BTREE,
  INDEX `idx_status` (`status`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库集合表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- 知识库文件表
-- ----------------------------
DROP TABLE IF EXISTS `kb_files`;
CREATE TABLE `kb_files` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `collection_id` int UNSIGNED NOT NULL COMMENT '所属知识库ID',
  `original_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '原始文件名',
  `stored_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '存储文件名',
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件相对路径',
  `file_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件扩展名',
  `file_size` bigint UNSIGNED NOT NULL DEFAULT 0 COMMENT '文件大小(字节)',
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'MIME类型',
  `extracted_text` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '提取的文本内容',
  `text_char_count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '提取文本字符数',
  `chunk_count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '分块数量',
  `chunk_status` tinyint NOT NULL DEFAULT 0 COMMENT '分块状态:0待处理 1处理中 2已完成 3失败',
  `chunk_error` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '分块错误信息',
  `uploaded_by` int UNSIGNED NOT NULL COMMENT '上传人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_collection_id` (`collection_id`) USING BTREE,
  INDEX `idx_chunk_status` (`chunk_status`) USING BTREE,
  INDEX `idx_uploaded_by` (`uploaded_by`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库文件表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- 知识库文本块表
-- ----------------------------
DROP TABLE IF EXISTS `kb_chunks`;
CREATE TABLE `kb_chunks` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `file_id` int UNSIGNED NOT NULL COMMENT '所属文件ID',
  `collection_id` int UNSIGNED NOT NULL COMMENT '所属知识库ID',
  `chunk_index` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '块序号',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '块文本内容',
  `char_count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '字符数',
  `milvus_id` bigint NULL DEFAULT NULL COMMENT 'Milvus中的向量ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_file_id` (`file_id`) USING BTREE,
  INDEX `idx_collection_id` (`collection_id`) USING BTREE,
  INDEX `idx_milvus_id` (`milvus_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库文本块表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- 知识库聊天会话表
-- ----------------------------
DROP TABLE IF EXISTS `kb_chat_sessions`;
CREATE TABLE `kb_chat_sessions` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `collection_id` int UNSIGNED NOT NULL COMMENT '关联知识库ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '会话标题',
  `message_count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '消息数量',
  `last_message_at` datetime NULL DEFAULT NULL COMMENT '最后消息时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_collection_id` (`collection_id`) USING BTREE,
  INDEX `idx_user_id` (`user_id`) USING BTREE,
  INDEX `idx_last_message_at` (`last_message_at`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库聊天会话表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- 知识库聊天消息表
-- ----------------------------
DROP TABLE IF EXISTS `kb_chat_messages`;
CREATE TABLE `kb_chat_messages` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `session_id` int UNSIGNED NOT NULL COMMENT '所属会话ID',
  `role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色:user/assistant',
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息内容',
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '用户上传图片URL',
  `source_refs` json NULL COMMENT '引用的知识库块ID列表',
  `model_used` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '使用的AI模型',
  `token_count` int UNSIGNED NULL DEFAULT NULL COMMENT '估算token数',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_session_id` (`session_id`) USING BTREE,
  INDEX `idx_created_at` (`created_at`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库聊天消息表' ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
