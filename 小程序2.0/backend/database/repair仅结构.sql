/*
 Navicat Premium Dump SQL

 Source Server         : sql
 Source Server Type    : MySQL
 Source Server Version : 80027 (8.0.27)
 Source Host           : 8.155.24.202:3306
 Source Schema         : repair

 Target Server Type    : MySQL
 Target Server Version : 80027 (8.0.27)
 File Encoding         : 65001

 Date: 19/09/2026 09:56:23
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for after_sales_requests
-- ----------------------------
DROP TABLE IF EXISTS `after_sales_requests`;
CREATE TABLE `after_sales_requests`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL COMMENT '关联订单ID',
  `user_id` int NOT NULL COMMENT '发起人ID(用户或管理员)',
  `product_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '具体产品名称',
  `product_model` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '产品型号',
  `type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'repair' COMMENT '售后类型: repair维修/replace换货/return退货/other其他',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '问题描述',
  `contact_phone` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '联系电话',
  `images` json NULL COMMENT '图片凭证',
  `status` enum('pending','processing','resolved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '状态',
  `admin_remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '处理说明/解决方案',
  `resolved_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for brands
-- ----------------------------
DROP TABLE IF EXISTS `brands`;
CREATE TABLE `brands`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '品牌ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '品牌名称',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_brands_name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '品牌表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for chat_conversations
-- ----------------------------
DROP TABLE IF EXISTS `chat_conversations`;
CREATE TABLE `chat_conversations`  (
  `id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '会话ID',
  `user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户ID',
  `user_openid` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '用户微信openid',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最后活动时间',
  `status` enum('active','transferred','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active',
  `end_reason` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '结束原因:user_logout/timeout/inactivity/transfer',
  `context` json NULL COMMENT '会话上下文',
  `summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '会话摘要',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_chat_conversations_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_chat_conversations_status`(`status` ASC) USING BTREE,
  INDEX `idx_chat_conversations_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_user_openid`(`user_openid` ASC) USING BTREE,
  INDEX `idx_last_activity`(`last_activity` ASC) USING BTREE,
  INDEX `idx_conversations_openid`(`user_openid` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '聊天会话表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for chat_messages
-- ----------------------------
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages`  (
  `id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息ID',
  `conversation_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '会话ID',
  `reply_to_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '回复的消息ID',
  `sender_type` enum('user','ai','human','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '消息内容',
  `suggested_actions` json NULL COMMENT '建议操作',
  `entities` json NULL COMMENT '实体信息',
  `intent` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '意图',
  `confidence` decimal(3, 2) NULL DEFAULT NULL COMMENT '置信度',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `message_type` enum('text','image','file') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'text' COMMENT '消息类型:文本/图片/文件',
  `is_read` tinyint(1) NULL DEFAULT 0 COMMENT '是否已读',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_chat_messages_conversation_id`(`conversation_id` ASC) USING BTREE,
  INDEX `idx_chat_messages_sender_type`(`sender_type` ASC) USING BTREE,
  INDEX `idx_chat_messages_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_chat_messages_conv_created`(`conversation_id` ASC, `created_at` ASC) USING BTREE,
  INDEX `idx_chat_messages_conversation_created`(`conversation_id` ASC, `created_at` ASC) USING BTREE,
  INDEX `idx_sender_created`(`sender_type` ASC, `created_at` ASC) USING BTREE,
  INDEX `idx_conversation_sender`(`conversation_id` ASC, `sender_type` ASC, `created_at` ASC) USING BTREE,
  INDEX `idx_reply_to`(`reply_to_id` ASC) USING BTREE,
  INDEX `idx_messages_conversation`(`conversation_id` ASC) USING BTREE,
  INDEX `idx_conversation_id`(`conversation_id` ASC) USING BTREE,
  INDEX `idx_sender_type`(`sender_type` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '聊天消息表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for cmms_sync_log
-- ----------------------------
DROP TABLE IF EXISTS `cmms_sync_log`;
CREATE TABLE `cmms_sync_log`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int NOT NULL COMMENT '小程序订单ID',
  `sync_type` enum('progress','photo','video') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'progress' COMMENT '同步类型',
  `cmms_order_id` int NULL DEFAULT NULL COMMENT 'CMMS订单ID',
  `sync_status` enum('success','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'success' COMMENT '同步状态',
  `sync_error` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '同步错误信息',
  `synced_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '同步时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_sync_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_sync_type`(`sync_type` ASC) USING BTREE,
  INDEX `idx_sync_status`(`sync_status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 35 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'CMMS同步日志表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for common_problems
-- ----------------------------
DROP TABLE IF EXISTS `common_problems`;
CREATE TABLE `common_problems`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '问题ID',
  `device_type_id` int NOT NULL COMMENT '设备类型ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '问题名称',
  `icon` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '图标emoji',
  `base_price` decimal(10, 2) NOT NULL COMMENT '基础价格',
  `price_range` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '价格范围描述',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_problems_device_type`(`device_type_id` ASC) USING BTREE,
  INDEX `idx_problems_name`(`name` ASC) USING BTREE,
  CONSTRAINT `fk_problems_device_type` FOREIGN KEY (`device_type_id`) REFERENCES `device_types` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 115 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '常见问题表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for delivery_persons
-- ----------------------------
DROP TABLE IF EXISTS `delivery_persons`;
CREATE TABLE `delivery_persons`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '配送员ID',
  `user_id` int NOT NULL COMMENT '关联用户ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配送员姓名',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '联系电话',
  `id_card` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '身份证号',
  `vehicle_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '车辆类型',
  `vehicle_plate` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '车牌号',
  `is_available` tinyint(1) NULL DEFAULT 1 COMMENT '是否可用',
  `rating` decimal(2, 1) NULL DEFAULT 5.0 COMMENT '评分',
  `total_deliveries` int NULL DEFAULT 0 COMMENT '总配送次数',
  `current_orders` int NULL DEFAULT 0 COMMENT '当前配送单数',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入职时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_dp_phone`(`phone` ASC) USING BTREE,
  INDEX `idx_dp_is_available`(`is_available` ASC) USING BTREE,
  CONSTRAINT `fk_delivery_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '配送员表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for device_types
-- ----------------------------
DROP TABLE IF EXISTS `device_types`;
CREATE TABLE `device_types`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '设备类型ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设备类型名称',
  `icon` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '图标emoji',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_device_types_name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 118 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '设备类型表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for feedback
-- ----------------------------
DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '提交用户ID',
  `type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'suggestion' COMMENT '反馈类型: suggestion功能建议/complaint问题投诉/other其他',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '反馈内容',
  `contact` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '联系方式（手机号/微信号）',
  `status` enum('pending','replied','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '状态: pending待处理/replied已回复/closed已关闭',
  `admin_reply` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '管理员回复内容',
  `replied_by` int NULL DEFAULT NULL COMMENT '回复管理员ID',
  `replied_at` datetime NULL DEFAULT NULL COMMENT '回复时间',
  `closed_by` int NULL DEFAULT NULL COMMENT '关闭操作管理员ID',
  `closed_at` datetime NULL DEFAULT NULL COMMENT '关闭时间',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for human_agents
-- ----------------------------
DROP TABLE IF EXISTS `human_agents`;
CREATE TABLE `human_agents`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '坐席ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '坐席名称',
  `specialty` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '专长领域',
  `rating` decimal(2, 1) NULL DEFAULT 4.5 COMMENT '评分',
  `is_online` tinyint(1) NULL DEFAULT 0 COMMENT '是否在线',
  `current_conversation_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '当前会话ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_agents_conversation`(`current_conversation_id` ASC) USING BTREE,
  CONSTRAINT `fk_agents_conversation` FOREIGN KEY (`current_conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '人工客服坐席表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for human_queue
-- ----------------------------
DROP TABLE IF EXISTS `human_queue`;
CREATE TABLE `human_queue`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '队列ID',
  `conversation_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '会话ID',
  `user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户ID',
  `priority` enum('normal','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'normal' COMMENT '优先级:普通/高/紧急',
  `reason` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `estimated_wait_time` int NULL DEFAULT NULL COMMENT '预估等待时间(秒)',
  `assigned_admin_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `assigned_admin_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `connected_at` datetime NULL DEFAULT NULL,
  `completed_at` datetime NULL DEFAULT NULL,
  `queue_position` int NULL DEFAULT NULL COMMENT '队列位置',
  `status` enum('waiting','assigned','connected','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'waiting',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uniq_conversation`(`conversation_id` ASC) USING BTREE,
  INDEX `idx_human_queue_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_human_queue_status`(`status` ASC) USING BTREE,
  INDEX `idx_human_queue_priority`(`priority` ASC) USING BTREE,
  INDEX `idx_human_queue_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_human_queue_status_priority`(`status` ASC, `priority` ASC, `created_at` ASC) USING BTREE,
  INDEX `fk_queue_conversation`(`conversation_id` ASC) USING BTREE,
  INDEX `idx_queue_status_priority`(`status` ASC, `priority` ASC, `created_at` ASC) USING BTREE,
  INDEX `idx_assigned_admin_id`(`assigned_admin_id` ASC) USING BTREE,
  CONSTRAINT `fk_queue_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '人工客服队列表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for internal_orders_log
-- ----------------------------
DROP TABLE IF EXISTS `internal_orders_log`;
CREATE TABLE `internal_orders_log`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int NOT NULL COMMENT '关联订单ID',
  `confirmed_by` int NULL DEFAULT NULL COMMENT '确认管理员ID',
  `confirmed_at` datetime NULL DEFAULT NULL COMMENT '确认时间',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '确认备注',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_internal_log_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_internal_log_confirmed_by`(`confirmed_by` ASC) USING BTREE,
  CONSTRAINT `fk_internal_log_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '内部免付款订单确认记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for knowledge_base
-- ----------------------------
DROP TABLE IF EXISTS `knowledge_base`;
CREATE TABLE `knowledge_base`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '知识分类',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '知识标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '知识内容',
  `keywords` json NULL COMMENT '关键词列表',
  `related_products` json NULL COMMENT '相关产品ID列表',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 67 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for order_progress_photos
-- ----------------------------
DROP TABLE IF EXISTS `order_progress_photos`;
CREATE TABLE `order_progress_photos`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int NOT NULL COMMENT '订单ID',
  `feedback_group_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '反馈组ID，关联同一次提交的照片和视频',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '照片说明',
  `images` json NULL COMMENT '图片URL的JSON数组',
  `uploaded_by` int NULL DEFAULT NULL COMMENT '上传人ID',
  `uploaded_by_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '上传人姓名',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_uploaded_by`(`uploaded_by` ASC) USING BTREE,
  INDEX `idx_photos_fgid`(`feedback_group_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 32 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '维修进度照片表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for order_progress_videos
-- ----------------------------
DROP TABLE IF EXISTS `order_progress_videos`;
CREATE TABLE `order_progress_videos`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int NOT NULL COMMENT '订单ID',
  `feedback_group_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '反馈组ID，关联同一次提交的照片和视频',
  `video_title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '视频标题',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '视频说明',
  `video_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '视频URL',
  `cover_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '封面URL',
  `duration` int NULL DEFAULT 0 COMMENT '视频时长(秒)',
  `file_size` bigint NULL DEFAULT 0 COMMENT '文件大小(字节)',
  `uploaded_by` int NULL DEFAULT NULL COMMENT '上传人ID',
  `uploaded_by_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '上传人姓名',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_uploaded_by`(`uploaded_by` ASC) USING BTREE,
  INDEX `idx_videos_fgid`(`feedback_group_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '维修进度视频表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for order_reviews
-- ----------------------------
DROP TABLE IF EXISTS `order_reviews`;
CREATE TABLE `order_reviews`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '评价ID',
  `order_id` int NOT NULL COMMENT '订单ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `rating` tinyint NOT NULL COMMENT '评分:1-5星',
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '评价内容',
  `images` json NULL COMMENT '评价图片',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_order_review`(`order_id` ASC) USING BTREE,
  INDEX `idx_reviews_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_reviews_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_reviews_rating`(`rating` ASC) USING BTREE,
  INDEX `idx_reviews_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `fk_reviews_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 25 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '订单评价表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单号',
  `user_id` int NOT NULL COMMENT '用户ID',
  `device_id` int NULL DEFAULT NULL COMMENT '关联用户设备ID(user_devices.id)',
  `order_type` enum('repair','recycle') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单类型:维修/回收',
  `device_type` int NOT NULL COMMENT '设备类型:1-手机,2-电脑,3-平板,4-手表等',
  `device_type_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '自定义设备类型名称（仅 device_type=0 时使用）',
  `problem_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '问题描述',
  `custom_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '自定义描述',
  `images` json NULL COMMENT '图片列表',
  `service_type` enum('shop','home') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '服务方式:到店/上门',
  `brand_id` int NULL DEFAULT NULL COMMENT '品牌ID(回收时使用)',
  `device_model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '设备型号',
  `device_condition` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '设备状态:good/normal/fair/poor',
  `estimated_price` decimal(10, 2) NULL DEFAULT NULL COMMENT '预估价格',
  `actual_price` decimal(10, 2) NULL DEFAULT NULL COMMENT '实际价格',
  `priority` int NULL DEFAULT 0 COMMENT '维修进度(0-100)',
  `assigned_to` int NULL DEFAULT 0 COMMENT '维修进度(0-100)',
  `assigned_at` timestamp NULL DEFAULT NULL COMMENT '分配时间',
  `progress` int NULL DEFAULT 0 COMMENT '维修进度(0-100)',
  `progress_updated_at` timestamp NULL DEFAULT NULL COMMENT '进度最后更新时间',
  `progress_unread` tinyint(1) NULL DEFAULT 0 COMMENT '用户是否有未读进度更新: 0-已读, 1-未读',
  `status` enum('pending','quoted','confirmed','processing','completed','review','cancelled','internal_pending') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending' COMMENT '订单状态: pending-待处理, quoted-待确认报价, confirmed-已确认报价, processing-维修/处理中, completed-已完成, review-待评价, cancelled-已取消, internal_pending-内部免付款申请待确认',
  `address_id` int NULL DEFAULT NULL COMMENT '收货地址ID',
  `unit_id` int NULL DEFAULT NULL COMMENT '维修单位ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `completed_at` timestamp NULL DEFAULT NULL COMMENT '完成时间',
  `cancel_reason` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `cancel_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `delivery_status` enum('none','pending','assigned','shipped','delivered','returned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'none' COMMENT '配送状态',
  `delivery_address_id` int NULL DEFAULT NULL COMMENT '配送地址ID',
  `delivery_person_id` int NULL DEFAULT NULL COMMENT '配送员ID',
  `delivery_person_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '配送员姓名',
  `delivery_person_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '配送员电话',
  `tracking_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '物流单号',
  `delivery_fee` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '配送费',
  `delivery_assigned_at` timestamp NULL DEFAULT NULL COMMENT '分配配送员时间',
  `delivery_shipped_at` timestamp NULL DEFAULT NULL COMMENT '发货时间',
  `delivery_delivered_at` timestamp NULL DEFAULT NULL COMMENT '送达时间',
  `delivery_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '配送备注',
  `quote_price` decimal(10, 2) NULL DEFAULT NULL COMMENT '报价金额',
  `quote_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '报价说明',
  `quote_files` json NULL COMMENT '报价报告文件列表',
  `quote_status` enum('pending','accepted','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '报价状态',
  `quote_created_at` timestamp NULL DEFAULT NULL COMMENT '报价创建时间',
  `quote_created_by` int NULL DEFAULT NULL COMMENT '报价管理员ID',
  `quote_rejected_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '拒绝原因',
  `cancelled_at` timestamp NULL DEFAULT NULL COMMENT '取消时间',
  `quote_unread` tinyint(1) NULL DEFAULT 0 COMMENT '用户是否有未读报价提醒: 0-已读, 1-未读',
  `payment_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'unpaid' COMMENT '支付状态: unpaid/paying/paid/refunding/refunded/failed',
  `is_internal` tinyint(1) NULL DEFAULT 0 COMMENT '是否内部人员免付款订单: 0-否, 1-是',
  `confirmed_by` int NULL DEFAULT NULL COMMENT '内部订单确认管理员ID',
  `confirmed_at` timestamp NULL DEFAULT NULL COMMENT '内部订单确认时间',
  `pay_amount` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '待支付金额',
  `out_trade_no` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '商户支付单号',
  `wechat_transaction_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信支付单号',
  `payment_channel` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'wechat_miniapp' COMMENT '支付渠道',
  `paid_at` datetime NULL DEFAULT NULL COMMENT '支付成功时间',
  `payment_notify_raw` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '支付回调原始报文',
  `refund_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'none' COMMENT '退款状态: none/refunding/refunded/failed',
  `refund_no` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '商户退款单号',
  `wechat_refund_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信退款单号',
  `refund_amount` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '退款金额',
  `refund_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '退款原因',
  `refunded_at` datetime NULL DEFAULT NULL COMMENT '退款成功时间',
  `warranty_start_date` date NULL DEFAULT NULL COMMENT '质保起始日',
  `warranty_end_date` date NULL DEFAULT NULL COMMENT '质保到期日',
  `warranty_period_days` int NULL DEFAULT NULL COMMENT '质保天数',
  `warranty_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '质保类型: 整备/返修',
  `is_warranty` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否质保/返修单',
  `original_order_id` int NULL DEFAULT NULL COMMENT '原始订单ID(返修关联)',
  `user_unread` tinyint(1) NULL DEFAULT 0 COMMENT '用户未读标记: 1-有更新未查看, 0-已读',
  `admin_unread` tinyint(1) NULL DEFAULT 0 COMMENT '管理员未读标记: 1-有更新未查看, 0-已读',
  `reject_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '内部申请驳回或订单取消原因',
  `is_admin_created` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否管理员代客下单（跳过报价环节，直接设定金额）',
  `admin_created_by` int NULL DEFAULT NULL COMMENT '代客下单的管理员ID',
  `admin_created_at` datetime NULL DEFAULT NULL COMMENT '代客下单时间',
  `refund_notify_raw` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '退款回调原始报文',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_orders_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_orders_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_orders_status`(`status` ASC) USING BTREE,
  INDEX `idx_orders_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_orders_type_status`(`order_type` ASC, `status` ASC) USING BTREE,
  INDEX `idx_orders_address_id`(`address_id` ASC) USING BTREE,
  INDEX `idx_assigned_to`(`assigned_to` ASC) USING BTREE,
  INDEX `idx_priority`(`priority` ASC) USING BTREE,
  INDEX `idx_delivery_status`(`delivery_status` ASC) USING BTREE,
  INDEX `idx_delivery_person_id`(`delivery_person_id` ASC) USING BTREE,
  INDEX `idx_quote_status`(`quote_status` ASC) USING BTREE,
  INDEX `idx_progress_unread`(`user_id` ASC, `progress_unread` ASC, `status` ASC) USING BTREE,
  CONSTRAINT `fk_orders_address` FOREIGN KEY (`address_id`) REFERENCES `user_addresses` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 209 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '订单表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for parts_inventory
-- ----------------------------
DROP TABLE IF EXISTS `parts_inventory`;
CREATE TABLE `parts_inventory`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '备件名称',
  `model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '型号规格',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '分类',
  `quantity` int NULL DEFAULT 0 COMMENT '库存数量',
  `unit_price` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '单价',
  `min_quantity` int NULL DEFAULT 5 COMMENT '最小库存预警值',
  `supplier` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '供应商',
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '存放位置',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active' COMMENT '状态: active-启用, inactive-停用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_category`(`category` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_quantity`(`quantity` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '备件库存表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for prices
-- ----------------------------
DROP TABLE IF EXISTS `prices`;
CREATE TABLE `prices`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '价格项ID',
  `device_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设备类型（如 手机/电脑）',
  `fault_category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '故障类别（如 屏幕/电池）',
  `device_model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '设备型号（可选，留空表示通用）',
  `price` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '参考价格',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '说明',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_prices_device_type`(`device_type` ASC) USING BTREE,
  INDEX `idx_prices_fault`(`fault_category` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '维修价格参考表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for products
-- ----------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '产品名称',
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '产品图标',
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '产品分类',
  `price_range` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '价格区间',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '产品描述',
  `brand` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '品牌',
  `model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '型号',
  `repair_types` json NULL COMMENT '维修类型列表',
  `common_issues` json NULL COMMENT '常见问题列表',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 97 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '产品信息表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for progress_apply
-- ----------------------------
DROP TABLE IF EXISTS `progress_apply`;
CREATE TABLE `progress_apply`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `apply_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '申请编号',
  `order_id` int NOT NULL COMMENT '关联订单ID',
  `user_id` int NOT NULL COMMENT '申请用户ID',
  `customer_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '客户姓名',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '联系电话',
  `device_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '设备名称',
  `device_model` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '设备型号',
  `progress_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '进度类型: parts_waiting-配件等待, repairing-维修中, testing-测试中, other-其他',
  `apply_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '申请原因',
  `expected_time` datetime NULL DEFAULT NULL COMMENT '期望时间',
  `approval_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending' COMMENT '审批状态: pending-待审核, approved-已通过, rejected-已拒绝',
  `approval_remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '审批备注',
  `approval_at` datetime NULL DEFAULT NULL COMMENT '审批时间',
  `approver_id` int NULL DEFAULT NULL COMMENT '审批人ID',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_apply_no`(`apply_no` ASC) USING BTREE,
  INDEX `idx_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_approval_status`(`approval_status` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '进度申请表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for qc_grade_rules
-- ----------------------------
DROP TABLE IF EXISTS `qc_grade_rules`;
CREATE TABLE `qc_grade_rules`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_id` int NOT NULL,
  `grade_key` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'good/normal/fair/poor',
  `grade_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `min_score` decimal(5, 2) NOT NULL DEFAULT 0.00,
  `max_score` decimal(5, 2) NOT NULL DEFAULT 100.00,
  `price_coefficient` decimal(5, 2) NOT NULL DEFAULT 1.00 COMMENT '回收价系数',
  `fault_standard` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '判定标准',
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_qc_grades_template`(`template_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '成色/故障定级标准' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qc_items
-- ----------------------------
DROP TABLE IF EXISTS `qc_items`;
CREATE TABLE `qc_items`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '质检项名称',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '分类：外观/屏幕/功能/电池等',
  `check_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '检查方式',
  `scoring_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pass_fail' COMMENT 'pass_fail/score',
  `fault_options` json NULL COMMENT '可选故障标签',
  `required` tinyint NOT NULL DEFAULT 1,
  `sort_order` int NOT NULL DEFAULT 0,
  `status` tinyint NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_qc_items_template`(`template_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '质检项' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qc_media
-- ----------------------------
DROP TABLE IF EXISTS `qc_media`;
CREATE TABLE `qc_media`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `qc_order_id` int NOT NULL,
  `type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'image',
  `url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_qc_media_order`(`qc_order_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '质检图片/视频' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qc_orders
-- ----------------------------
DROP TABLE IF EXISTS `qc_orders`;
CREATE TABLE `qc_orders`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `qc_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` int NOT NULL COMMENT '关联 orders.id(回收单)',
  `template_id` int NOT NULL,
  `standard_id` int NULL DEFAULT NULL COMMENT '锁定使用的标准版本',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `inspector_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '质检员',
  `grade_score` decimal(5, 2) NULL DEFAULT NULL,
  `graded_condition` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `final_price` decimal(10, 2) NULL DEFAULT NULL COMMENT '建议回收价',
  `grade_note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `started_at` datetime NULL DEFAULT NULL,
  `graded_at` datetime NULL DEFAULT NULL,
  `completed_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_qc_no`(`qc_no` ASC) USING BTREE,
  INDEX `idx_qc_orders_order`(`order_id` ASC) USING BTREE,
  INDEX `idx_qc_orders_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '质检单' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qc_results
-- ----------------------------
DROP TABLE IF EXISTS `qc_results`;
CREATE TABLE `qc_results`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `qc_order_id` int NOT NULL,
  `qc_item_id` int NOT NULL,
  `item_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `result` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fault_tag` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `fault_note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `deduction` decimal(5, 2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_qc_results_order`(`qc_order_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 19 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '质检项结果' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qc_reviews
-- ----------------------------
DROP TABLE IF EXISTS `qc_reviews`;
CREATE TABLE `qc_reviews`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `qc_order_id` int NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'review' COMMENT 'review/dispute',
  `reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open' COMMENT 'open/agreed/rejected/resolved',
  `handler_remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `resolved_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_qc_reviews_order`(`qc_order_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '质检复核/争议' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qc_standards
-- ----------------------------
DROP TABLE IF EXISTS `qc_standards`;
CREATE TABLE `qc_standards`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_id` int NOT NULL,
  `version_no` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `snapshot` json NOT NULL COMMENT 'items+grades 快照',
  `changelog` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT 'active/archived',
  `published_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_qc_standards_template`(`template_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '质检标准版本' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for qc_templates
-- ----------------------------
DROP TABLE IF EXISTS `qc_templates`;
CREATE TABLE `qc_templates`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '模板名称',
  `device_category_id` int NULL DEFAULT NULL COMMENT '适用配价库分类(recycle_categories.id)，空=通用',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '质检模板' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for recycle_admins
-- ----------------------------
DROP TABLE IF EXISTS `recycle_admins`;
CREATE TABLE `recycle_admins`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '登录账号',
  `password_hash` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'bcrypt密码',
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '姓名',
  `role` enum('super','admin','viewer') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin' COMMENT '角色: super超管/admin管理员/viewer只读',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态: 1启用 0禁用',
  `last_login_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uniq_username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '回收后台管理员' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for recycle_brands
-- ----------------------------
DROP TABLE IF EXISTS `recycle_brands`;
CREATE TABLE `recycle_brands`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL COMMENT '所属分类ID',
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '品牌名称',
  `logo_text` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '品牌字标',
  `logo_color` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '#666666' COMMENT '品牌色',
  `sort_order` int NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_category`(`category_id` ASC) USING BTREE,
  CONSTRAINT `fk_recycle_brand_cat` FOREIGN KEY (`category_id`) REFERENCES `recycle_categories` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 73 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '回收设备品牌' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for recycle_categories
-- ----------------------------
DROP TABLE IF EXISTS `recycle_categories`;
CREATE TABLE `recycle_categories`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类编码',
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `icon` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '图标(emoji)',
  `color` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '#5B9E8A' COMMENT '主题色',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态: 1上架 0下架',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uniq_code`(`code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '回收设备分类' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for recycle_click_logs
-- ----------------------------
DROP TABLE IF EXISTS `recycle_click_logs`;
CREATE TABLE `recycle_click_logs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `target_type` enum('platform','link') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` int NOT NULL,
  `target_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `source` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'admin' COMMENT '来源: admin后台/mini小程序',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_target`(`target_type` ASC, `target_id` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '跳转点击日志' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for recycle_condition_rates
-- ----------------------------
DROP TABLE IF EXISTS `recycle_condition_rates`;
CREATE TABLE `recycle_condition_rates`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `factor_key` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '因子: condition/screen/function/version/accessories/repair_history',
  `factor_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '因子名称',
  `label` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '选项文案',
  `value` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '选项值',
  `rate` decimal(5, 2) NOT NULL DEFAULT 1.00 COMMENT '价格系数',
  `sort_order` int NULL DEFAULT 0,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_factor`(`factor_key` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 37 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '估价系数配置' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for recycle_models
-- ----------------------------
DROP TABLE IF EXISTS `recycle_models`;
CREATE TABLE `recycle_models`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `brand_id` int NOT NULL COMMENT '所属品牌ID',
  `name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '型号名称',
  `specs` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '规格说明',
  `base_price` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '回收基准价(最高回收价)',
  `market_price` decimal(10, 2) NULL DEFAULT NULL COMMENT '二手市场参考价',
  `hot` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否热门机型',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态: 1上架 0下架',
  `sort_order` int NULL DEFAULT 0,
  `updated_by` int NULL DEFAULT NULL COMMENT '最后调价管理员',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_brand`(`brand_id` ASC) USING BTREE,
  INDEX `idx_status_hot`(`status` ASC, `hot` ASC) USING BTREE,
  CONSTRAINT `fk_recycle_model_brand` FOREIGN KEY (`brand_id`) REFERENCES `recycle_brands` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 324 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '回收设备型号配价' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for recycle_operation_logs
-- ----------------------------
DROP TABLE IF EXISTS `recycle_operation_logs`;
CREATE TABLE `recycle_operation_logs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NULL DEFAULT NULL,
  `admin_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `module` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '模块: order/catalog/platform/link/setting/auth',
  `action` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作',
  `detail` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `ip` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_module`(`module` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 41 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '后台操作日志' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for recycle_platforms
-- ----------------------------
DROP TABLE IF EXISTS `recycle_platforms`;
CREATE TABLE `recycle_platforms`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '平台名称',
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '平台网址',
  `type` enum('recycle','procurement','compare') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'recycle' COMMENT '类型: recycle回收平台/procurement采购渠道/compare比价参考',
  `logo_text` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `logo_color` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '#5B9E8A',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '平台说明',
  `service_mode` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '服务方式: 上门/邮寄/到店',
  `settlement` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '结算方式',
  `commission_desc` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '佣金/费率说明',
  `contact` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '联系方式',
  `click_count` int NOT NULL DEFAULT 0 COMMENT '跳转点击量',
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int NULL DEFAULT 0,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '回收/采购平台信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for recycle_price_logs
-- ----------------------------
DROP TABLE IF EXISTS `recycle_price_logs`;
CREATE TABLE `recycle_price_logs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `model_id` int NOT NULL,
  `model_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `old_price` decimal(10, 2) NULL DEFAULT NULL,
  `new_price` decimal(10, 2) NOT NULL,
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `admin_id` int NULL DEFAULT NULL,
  `admin_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_model`(`model_id` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '配价调整记录' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for recycle_procurement_links
-- ----------------------------
DROP TABLE IF EXISTS `recycle_procurement_links`;
CREATE TABLE `recycle_procurement_links`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '链接名称',
  `url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '链接地址',
  `category_id` int NULL DEFAULT NULL COMMENT '适用设备分类(空=通用)',
  `platform_id` int NULL DEFAULT NULL COMMENT '关联平台',
  `model_keyword` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '适用型号关键词',
  `price_range` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '参考价格区间',
  `notes` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '' COMMENT '备注',
  `click_count` int NOT NULL DEFAULT 0 COMMENT '跳转点击量',
  `last_click_at` datetime NULL DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int NULL DEFAULT 0,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_category`(`category_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '采购网站平台链接' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for recycle_settings
-- ----------------------------
DROP TABLE IF EXISTS `recycle_settings`;
CREATE TABLE `recycle_settings`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '',
  `updated_by` int NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uniq_key`(`config_key` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 299 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '回收系统参数' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for repair_records
-- ----------------------------
DROP TABLE IF EXISTS `repair_records`;
CREATE TABLE `repair_records`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `order_id` int NOT NULL COMMENT '订单ID',
  `admin_id` int NOT NULL COMMENT '维修人员ID',
  `stage` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '维修阶段：接单/检测/维修/测试/完成',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '记录标题',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '详细描述',
  `images` json NULL COMMENT '维修图片列表',
  `videos` json NULL COMMENT '维修视频列表',
  `parts_used` json NULL COMMENT '使用的配件 [{id, name, quantity, price}]',
  `duration` int NULL DEFAULT NULL COMMENT '耗时（分钟）',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_repair_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_repair_admin_id`(`admin_id` ASC) USING BTREE,
  INDEX `idx_repair_stage`(`stage` ASC) USING BTREE,
  INDEX `idx_repair_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `fk_repair_records_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_repair_records_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '维修记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for reviews
-- ----------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '评价ID',
  `order_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '订单ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `rating` tinyint(1) NOT NULL COMMENT '评分 1-5',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '评价内容',
  `images` json NULL COMMENT '评价图片',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order`(`order_id` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '订单评价表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for spare_parts
-- ----------------------------
DROP TABLE IF EXISTS `spare_parts`;
CREATE TABLE `spare_parts`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '备件ID',
  `part_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '备件编码',
  `part_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '备件名称',
  `specification` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '规格型号',
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '分类',
  `unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '件' COMMENT '单位',
  `supplier_id` int UNSIGNED NULL DEFAULT NULL COMMENT '供应商ID',
  `purchase_price` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '采购价格',
  `selling_price` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '销售价格',
  `stock_quantity` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '库存数量',
  `min_stock` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '最小库存',
  `max_stock` int UNSIGNED NULL DEFAULT NULL COMMENT '最大库存',
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '存放位置',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态:1正常 2停用',
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '配件图片URL',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_part_code`(`part_code` ASC) USING BTREE,
  INDEX `idx_part_name`(`part_name` ASC) USING BTREE,
  INDEX `idx_category`(`category` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '备件表（从 parts_inventory 同步）' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for stock_records
-- ----------------------------
DROP TABLE IF EXISTS `stock_records`;
CREATE TABLE `stock_records`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `spare_part_id` int UNSIGNED NOT NULL COMMENT '备件ID',
  `record_type` tinyint(1) NOT NULL COMMENT '记录类型:1入库 2出库 3盘点',
  `quantity` int UNSIGNED NOT NULL COMMENT '数量',
  `before_stock` int UNSIGNED NOT NULL COMMENT '变动前库存',
  `after_stock` int UNSIGNED NOT NULL COMMENT '变动后库存',
  `related_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '关联类型',
  `related_id` int UNSIGNED NULL DEFAULT NULL COMMENT '关联ID',
  `operator_id` int UNSIGNED NOT NULL COMMENT '操作人ID',
  `notes` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_spare_part`(`spare_part_id` ASC) USING BTREE,
  INDEX `idx_record_type`(`record_type` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '库存记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for system_config
-- ----------------------------
DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置键',
  `config_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '配置值',
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '描述',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `config_key`(`config_key` ASC) USING BTREE,
  INDEX `idx_config_key`(`config_key` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 22 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '系统配置表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for transaction_income
-- ----------------------------
DROP TABLE IF EXISTS `transaction_income`;
CREATE TABLE `transaction_income`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `order_no` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `user_id` int NULL DEFAULT NULL,
  `order_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'repair/recycle',
  `service_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'shop/door-to-door',
  `income_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'order' COMMENT 'order/adjust/compensation',
  `amount` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '实际入账金额(已扣除退款)',
  `currency` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'CNY',
  `payment_channel` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `payment_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'paid' COMMENT 'paid/partial_refunded/refunded',
  `out_trade_no` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `wechat_transaction_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `paid_at` datetime NULL DEFAULT NULL,
  `refunded_at` datetime NULL DEFAULT NULL,
  `settle_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'unsettled' COMMENT 'unsettled/settled',
  `settled_at` datetime NULL DEFAULT NULL,
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_paid_at`(`paid_at` ASC) USING BTREE,
  INDEX `idx_order_type`(`order_type` ASC) USING BTREE,
  INDEX `idx_settle_status`(`settle_status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 90 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '交易收入表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_addresses
-- ----------------------------
DROP TABLE IF EXISTS `user_addresses`;
CREATE TABLE `user_addresses`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '地址ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `contact_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '联系人姓名',
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '联系电话',
  `province` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '省份',
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '城市',
  `district` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '区县',
  `detail_address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '详细地址',
  `postal_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '邮政编码',
  `tags` json NULL COMMENT '地址标签: [\"家\", \"公司\", \"学校\"]',
  `is_default` tinyint(1) NULL DEFAULT 0 COMMENT '是否默认地址',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_addresses_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_addresses_default`(`user_id` ASC, `is_default` ASC) USING BTREE,
  CONSTRAINT `fk_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 33 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户收货地址表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_devices
-- ----------------------------
DROP TABLE IF EXISTS `user_devices`;
CREATE TABLE `user_devices`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` int NOT NULL COMMENT '用户ID，关联users表',
  `device_type_id` int NOT NULL COMMENT '设备类型ID，关联device_types表(1手机 2电脑 3平板 4手表 5耳机 6相机 7游戏机 8其他)',
  `brand_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '品牌名称(冗余字段，方便列表展示)',
  `device_model` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设备型号(如iPhone 15 Pro)',
  `device_nickname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '用户自定义设备昵称(如\"我的工作手机\")',
  `serial_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '序列号/IMEI/SN码',
  `device_condition` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '设备现状描述(如\"屏幕右上角轻微裂痕\")',
  `purchase_date` date NULL DEFAULT NULL COMMENT '购买日期',
  `is_default` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否默认设备: 0否 1是',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `device_type_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '自定义设备类型名称（仅 device_type_id=0 时使用）',
  `warranty_months` int NULL DEFAULT 3 COMMENT '默认质保月数',
  `device_purpose` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'both' COMMENT '设备用途: repair维修/recycle回收/both均可',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_device_type_id`(`device_type_id` ASC) USING BTREE,
  INDEX `idx_is_default`(`user_id` ASC, `is_default` ASC) USING BTREE,
  CONSTRAINT `fk_user_devices_device_type` FOREIGN KEY (`device_type_id`) REFERENCES `device_types` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_user_devices_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户设备绑定表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_units
-- ----------------------------
DROP TABLE IF EXISTS `user_units`;
CREATE TABLE `user_units`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '单位ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '单位名称',
  `address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '单位地址',
  `contact_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '联系人',
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '联系电话',
  `is_default` tinyint(1) NULL DEFAULT 0 COMMENT '是否默认单位',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_units_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_units_default`(`user_id` ASC, `is_default` ASC) USING BTREE,
  CONSTRAINT `fk_units_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 23 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户维修单位表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `openid` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '微信openid',
  `unionid` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信unionid(可选)',
  `nickname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户昵称',
  `avatar_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '头像URL',
  `real_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '真实姓名',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '手机号',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '邮箱',
  `gender` tinyint NULL DEFAULT NULL COMMENT '性别:0-未知,1-男,2-女',
  `country` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '国家',
  `province` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '省份',
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '城市',
  `language` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '语言',
  `status` tinyint NULL DEFAULT 1 COMMENT '状态:0-禁用,1-正常',
  `role` enum('user','admin','super_admin','internal') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'user' COMMENT '用户角色: user-普通用户, admin-管理员, super_admin-超级管理员, internal-公司内部人员',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `last_login_at` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `openid`(`openid` ASC) USING BTREE,
  UNIQUE INDEX `unionid`(`unionid` ASC) USING BTREE,
  INDEX `idx_users_openid`(`openid` ASC) USING BTREE,
  INDEX `idx_users_phone`(`phone` ASC) USING BTREE,
  INDEX `idx_users_status`(`status` ASC) USING BTREE,
  INDEX `idx_users_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_users_role`(`role` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 31 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户表' ROW_FORMAT = DYNAMIC;

SET FOREIGN_KEY_CHECKS = 1;
