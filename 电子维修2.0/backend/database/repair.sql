/*
 Navicat Premium Dump SQL

 Source Server         : mysql
 Source Server Type    : MySQL
 Source Server Version : 80045 (8.0.45)
 Source Host           : localhost:3306
 Source Schema         : repair

 Target Server Type    : MySQL
 Target Server Version : 80045 (8.0.45)
 File Encoding         : 65001

 Date: 10/06/2026 17:29:32
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
-- Records of brands
-- ----------------------------
INSERT INTO `brands` VALUES (1, '苹果', '2026-03-23 10:10:39');
INSERT INTO `brands` VALUES (2, '华为', '2026-03-23 10:10:39');
INSERT INTO `brands` VALUES (3, '小米', '2026-03-23 10:10:39');
INSERT INTO `brands` VALUES (4, 'OPPO', '2026-03-23 10:10:39');
INSERT INTO `brands` VALUES (5, 'vivo', '2026-03-23 10:10:39');
INSERT INTO `brands` VALUES (6, '三星', '2026-03-23 10:10:39');
INSERT INTO `brands` VALUES (7, '联想', '2026-03-23 10:10:39');
INSERT INTO `brands` VALUES (8, '其他', '2026-03-23 10:10:39');

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
-- Records of chat_conversations
-- ----------------------------
INSERT INTO `chat_conversations` VALUES ('1780970178643', '4', 'ooXtD3SSOG_AfbSlmM4wrl8D27Mg', '2026-06-09 01:56:24', '2026-06-09 01:56:24', '2026-06-09 01:56:24', 'active', NULL, '{}', NULL);
INSERT INTO `chat_conversations` VALUES ('1780970201544', '4', 'ooXtD3SSOG_AfbSlmM4wrl8D27Mg', '2026-06-09 02:00:29', '2026-06-09 02:00:29', '2026-06-09 02:00:29', 'active', NULL, '{}', '无人机能维修吗');
INSERT INTO `chat_conversations` VALUES ('1780970440671', '4', 'ooXtD3SSOG_AfbSlmM4wrl8D27Mg', '2026-06-09 02:03:59', '2026-06-09 02:03:59', '2026-06-09 02:03:59', 'active', NULL, '{}', '耳机充不上电怎么办？');
INSERT INTO `chat_conversations` VALUES ('1781055416842', '4', 'ooXtD3SSOG_AfbSlmM4wrl8D27Mg', '2026-06-10 01:37:56', '2026-06-10 01:37:56', '2026-06-10 01:37:56', 'active', NULL, '{}', '你好');
INSERT INTO `chat_conversations` VALUES ('1781059295141', '4', 'ooXtD3SSOG_AfbSlmM4wrl8D27Mg', '2026-06-10 02:41:37', '2026-06-10 02:41:37', '2026-06-10 02:41:37', 'active', NULL, '{}', '我刚做了故障自检，设备信息如下：\n设备：苹果 手机\n故障：摄像头故障\n\n诊断结论：根据您提供的有限信...');
INSERT INTO `chat_conversations` VALUES ('conv_001', '1', 'wx_openid_demo_001', '2026-03-23 10:10:50', '2026-03-23 14:33:07', '2026-03-23 14:26:06', 'completed', NULL, '{\"intent\": \"repair_inquiry\", \"device_type\": \"phone\"}', NULL);
INSERT INTO `chat_conversations` VALUES ('conv_002', '2', 'wx_openid_demo_002', '2026-03-23 10:10:50', '2026-03-23 14:33:07', '2026-03-23 14:26:06', 'active', NULL, '{\"intent\": \"recycle_price\", \"device_model\": \"iPhone 12\"}', NULL);

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
-- Records of chat_messages
-- ----------------------------
INSERT INTO `chat_messages` VALUES ('mq5znxhi428b97e9', '1780970178643', NULL, 'user', '你好', NULL, '{}', 'general', 0.50, '2026-06-09 01:56:24', 'text', 0);
INSERT INTO `chat_messages` VALUES ('mq5znxjyb274f96e', '1780970178643', NULL, 'ai', '您好！我是修小宝，您的电子维修智能助手😊。有什么手机、电脑、平板或其他电子设备的问题需要帮忙吗？请随时告诉我，我会尽力提供专业建议和帮助！', '[{\"text\": \"营业时间\", \"type\": \"quick_reply\"}, {\"text\": \"维修流程\", \"type\": \"quick_reply\"}, {\"text\": \"转人工客服\", \"type\": \"button\", \"action\": \"transfer_human\"}]', NULL, NULL, NULL, '2026-06-09 01:56:24', 'text', 1);
INSERT INTO `chat_messages` VALUES ('mq5zt6pvb5ec9849', '1780970201544', NULL, 'user', '无人机能维修吗', NULL, '{\"problemDescription\": \"无人机能维修吗\"}', 'repair', 0.60, '2026-06-09 02:00:30', 'text', 0);
INSERT INTO `chat_messages` VALUES ('mq5zt6s115601190', '1780970201544', NULL, 'ai', '您好！我们目前主要维修手机、电脑、平板等常见电子设备，无人机维修暂不包含在标准服务范围内。建议您联系无人机品牌官方售后或专业无人机维修机构，他们会有更专业的设备和技术支持。如果您有其他设备问题，随时可以问我哦！😊', '[{\"text\": \"预约维修\", \"type\": \"button\", \"action\": \"book_repair\"}]', NULL, NULL, NULL, '2026-06-09 02:00:30', 'text', 1);
INSERT INTO `chat_messages` VALUES ('mq5zxo2w0b3ec731', '1780970440671', NULL, 'user', '耳机充不上电怎么办？', NULL, '{\"deviceType\": \"AirPods\"}', 'general', 0.50, '2026-06-09 02:03:59', 'text', 0);
INSERT INTO `chat_messages` VALUES ('mq5zxo4xcd250f02', '1780970440671', NULL, 'ai', '您好！耳机充不上电可能是充电口、电池或充电线的问题。建议您先检查充电线和接口是否干净、接触良好，尝试换根线或充电头测试。如果问题依旧，可能是电池老化或电路故障。方便的话可以带设备到店检测，我们提供免费初步诊断哦！需要预约服务吗？😊', '[{\"text\": \"营业时间\", \"type\": \"quick_reply\"}, {\"text\": \"维修流程\", \"type\": \"quick_reply\"}, {\"text\": \"转人工客服\", \"type\": \"button\", \"action\": \"transfer_human\"}]', NULL, NULL, NULL, '2026-06-09 02:03:59', 'text', 1);
INSERT INTO `chat_messages` VALUES ('mq7eg0nd164b7559', '1781055416842', NULL, 'user', '你好', NULL, '{}', 'general', 0.50, '2026-06-10 01:37:56', 'text', 0);
INSERT INTO `chat_messages` VALUES ('mq7eg0ql9969efa6', '1781055416842', NULL, 'ai', '您好！我是修小宝，您的电子维修服务智能助手😊 有什么需要帮忙的吗？无论是手机、电脑、平板还是其他设备的问题，我都可以为您提供专业建议或预约服务哦！', '[{\"text\": \"营业时间\", \"type\": \"quick_reply\"}, {\"text\": \"维修流程\", \"type\": \"quick_reply\"}, {\"text\": \"转人工客服\", \"type\": \"button\", \"action\": \"transfer_human\"}]', NULL, NULL, NULL, '2026-06-10 01:37:56', 'text', 0);
INSERT INTO `chat_messages` VALUES ('mq7gpxmr6bbb8a64', '1781059295141', NULL, 'user', '我刚做了故障自检，设备信息如下：\n设备：苹果 手机\n故障：摄像头故障\n\n诊断结论：根据您提供的有限信息，苹果手机摄像头故障可能由硬件损坏、软件问题或连接松动引起，但需要更多细节才能精准判断。\n可能原因：\n1. 摄像头模块硬件损坏（50%）\n2. 系统软件或应用冲突（30%）\n3. 排线连接松动或损坏（20%）\n维修建议：建议先尝试重启手机或更新系统；若无效，请前往苹果授权服务中心检测，可能需要更换摄像头模块或重新连接排线。\n预估费用：更换摄像头模块约300-800元（根据型号），排线修复约100-300元，软件修复免费。\n注意事项：请提供更多细节，如故障具体表现（黑屏、模糊、无法打开）、是否有摔落或进水史、手机型号和系统版本，以便更准确诊断。切勿自行拆机，以免损坏保修。\n\n请问这个情况维修下来大概需要多少钱？需要多长时间？', NULL, '{\"symptom\": \"摄像头故障\", \"faultType\": \"摄像头故障\", \"deviceType\": \"手机\", \"repairPlan\": \"建议先尝试重启手机或更新系统；若无效，请前往苹果授权服务中心检测，可能需要更换摄像头模块或重新连接排线。\", \"deviceBrand\": \"苹果\", \"estimatedCost\": \"更换摄像头模块约300-800元（根据型号），排线修复约100-300元，软件修复免费。\", \"diagnoseConclusion\": \"根据您提供的有限信息，苹果手机摄像头故障可能由硬件损坏、软件问题或连接松动引起，但需要更多细节才能精准判断。\", \"problemDescription\": \"苹果 手机，故障：摄像头故障，结论：根据您提供的有限信息，苹果手机摄像头故障可能由硬件损坏、软件问题或连接松动引起，但需要更多细节才能精准判断。\"}', 'pricing', 0.95, '2026-06-10 02:41:37', 'text', 0);
INSERT INTO `chat_messages` VALUES ('mq7gpxr03bab2322', '1781059295141', NULL, 'ai', '了解到您的苹果手机出现摄像头故障了，别担心！根据诊断信息，如果只是软件问题或排线松动，费用约100-300元，当天可取；如果需要更换摄像头模块，费用在300-800元之间（具体看型号），一般1-2小时完成。建议您先尝试重启或更新系统。方便的话提交订单，我们可为您精确报价哦~ 📱🔧', '[{\"text\": \"查看价格表\", \"type\": \"button\", \"action\": \"show_pricing\"}, {\"text\": \"免费检测\", \"type\": \"quick_reply\"}]', NULL, NULL, NULL, '2026-06-10 02:41:38', 'text', 0);
INSERT INTO `chat_messages` VALUES ('msg_001', 'conv_001', NULL, 'user', '你好,我想咨询手机维修', NULL, NULL, NULL, NULL, '2026-03-23 10:00:00', 'text', 0);
INSERT INTO `chat_messages` VALUES ('msg_002', 'conv_001', NULL, 'ai', '您好!请问您的手机出现了什么问题?', NULL, NULL, NULL, NULL, '2026-03-23 10:00:01', 'text', 0);
INSERT INTO `chat_messages` VALUES ('msg_003', 'conv_001', NULL, 'user', '电池续航很差,大概只能用半天', NULL, NULL, NULL, NULL, '2026-03-23 10:00:10', 'text', 0);
INSERT INTO `chat_messages` VALUES ('msg_004', 'conv_001', NULL, 'ai', '电池更换起步价99元,建议您到店检测具体报价', NULL, NULL, NULL, NULL, '2026-03-23 10:00:11', 'text', 0);

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
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'CMMS同步日志表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of cmms_sync_log
-- ----------------------------
INSERT INTO `cmms_sync_log` VALUES (1, 59, 'photo', NULL, 'success', NULL, '2026-05-25 09:15:01');
INSERT INTO `cmms_sync_log` VALUES (2, 59, 'video', NULL, 'success', NULL, '2026-05-25 09:15:01');
INSERT INTO `cmms_sync_log` VALUES (3, 59, 'photo', NULL, 'success', NULL, '2026-05-25 09:21:54');
INSERT INTO `cmms_sync_log` VALUES (4, 59, 'video', NULL, 'success', NULL, '2026-05-25 09:21:55');
INSERT INTO `cmms_sync_log` VALUES (5, 62, 'photo', NULL, 'success', NULL, '2026-05-26 02:27:25');
INSERT INTO `cmms_sync_log` VALUES (6, 62, 'photo', NULL, 'success', NULL, '2026-05-26 02:27:25');
INSERT INTO `cmms_sync_log` VALUES (7, 62, 'video', NULL, 'success', NULL, '2026-05-26 02:27:26');
INSERT INTO `cmms_sync_log` VALUES (8, 59, 'photo', NULL, 'success', NULL, '2026-05-26 02:28:23');
INSERT INTO `cmms_sync_log` VALUES (9, 59, 'photo', NULL, 'success', NULL, '2026-05-26 02:28:23');
INSERT INTO `cmms_sync_log` VALUES (10, 60, 'photo', NULL, 'success', NULL, '2026-06-04 09:49:05');
INSERT INTO `cmms_sync_log` VALUES (11, 60, 'video', NULL, 'success', NULL, '2026-06-04 09:49:06');
INSERT INTO `cmms_sync_log` VALUES (12, 60, 'photo', NULL, 'success', NULL, '2026-06-04 15:50:56');
INSERT INTO `cmms_sync_log` VALUES (13, 60, 'video', NULL, 'success', NULL, '2026-06-04 15:50:58');
INSERT INTO `cmms_sync_log` VALUES (14, 60, 'photo', NULL, 'success', NULL, '2026-06-04 16:19:17');

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
-- Records of common_problems
-- ----------------------------
INSERT INTO `common_problems` VALUES (1, 1, '电池问题', '🔋', 99.00, '99元起', '2026-03-23 10:10:39');
INSERT INTO `common_problems` VALUES (2, 1, '屏幕碎裂', '📱', 199.00, '199元起', '2026-03-23 10:10:39');
INSERT INTO `common_problems` VALUES (3, 1, '声音异常', '🔊', 149.00, '149元起', '2026-03-23 10:10:39');
INSERT INTO `common_problems` VALUES (4, 1, '摄像头故障', '📷', 179.00, '179元起', '2026-03-23 10:10:39');
INSERT INTO `common_problems` VALUES (5, 1, '无法充电', '⚡', 89.00, '89元起', '2026-03-23 10:10:39');
INSERT INTO `common_problems` VALUES (6, 1, '主板故障', '🔧', 299.00, '299元起', '2026-03-23 10:10:39');
INSERT INTO `common_problems` VALUES (7, 2, '屏幕问题', '💻', 399.00, '399元起', '2026-03-23 10:10:39');
INSERT INTO `common_problems` VALUES (8, 2, '键盘故障', '⌨️', 149.00, '149元起', '2026-03-23 10:10:39');
INSERT INTO `common_problems` VALUES (9, 2, '电池更换', '🔋', 199.00, '199元起', '2026-03-23 10:10:39');
INSERT INTO `common_problems` VALUES (10, 2, '硬盘故障', '💾', 299.00, '299元起', '2026-03-23 10:10:39');
INSERT INTO `common_problems` VALUES (11, 3, '屏幕碎裂', '📟', 299.00, '299元起', '2026-03-23 10:10:39');
INSERT INTO `common_problems` VALUES (12, 3, '电池问题', '🔋', 179.00, '179元起', '2026-03-23 10:10:39');
INSERT INTO `common_problems` VALUES (13, 3, '声音故障', '🔊', 129.00, '129元起', '2026-03-23 10:10:39');
INSERT INTO `common_problems` VALUES (14, 1, '电池问题', '🔋', 99.00, '99元起', '2026-03-23 14:26:06');
INSERT INTO `common_problems` VALUES (15, 1, '屏幕碎裂', '📱', 199.00, '199元起', '2026-03-23 14:26:06');
INSERT INTO `common_problems` VALUES (16, 1, '声音异常', '🔊', 149.00, '149元起', '2026-03-23 14:26:06');
INSERT INTO `common_problems` VALUES (17, 1, '摄像头故障', '📷', 179.00, '179元起', '2026-03-23 14:26:06');
INSERT INTO `common_problems` VALUES (18, 1, '无法充电', '⚡', 89.00, '89元起', '2026-03-23 14:26:06');
INSERT INTO `common_problems` VALUES (19, 1, '主板故障', '🔧', 299.00, '299元起', '2026-03-23 14:26:06');
INSERT INTO `common_problems` VALUES (20, 2, '屏幕问题', '💻', 399.00, '399元起', '2026-03-23 14:26:06');
INSERT INTO `common_problems` VALUES (21, 2, '键盘故障', '⌨️', 149.00, '149元起', '2026-03-23 14:26:06');
INSERT INTO `common_problems` VALUES (22, 2, '电池更换', '🔋', 199.00, '199元起', '2026-03-23 14:26:06');
INSERT INTO `common_problems` VALUES (23, 2, '硬盘故障', '💾', 299.00, '299元起', '2026-03-23 14:26:06');
INSERT INTO `common_problems` VALUES (24, 3, '屏幕碎裂', '📟', 299.00, '299元起', '2026-03-23 14:26:06');
INSERT INTO `common_problems` VALUES (25, 3, '电池问题', '🔋', 179.00, '179元起', '2026-03-23 14:26:06');
INSERT INTO `common_problems` VALUES (26, 3, '声音故障', '🔊', 129.00, '129元起', '2026-03-23 14:26:06');
INSERT INTO `common_problems` VALUES (27, 1, '电池问题', '🔋', 99.00, '99元起', '2026-03-23 14:33:07');
INSERT INTO `common_problems` VALUES (28, 1, '屏幕碎裂', '📱', 199.00, '199元起', '2026-03-23 14:33:07');
INSERT INTO `common_problems` VALUES (29, 1, '声音异常', '🔊', 149.00, '149元起', '2026-03-23 14:33:07');
INSERT INTO `common_problems` VALUES (30, 1, '摄像头故障', '📷', 179.00, '179元起', '2026-03-23 14:33:07');
INSERT INTO `common_problems` VALUES (31, 1, '无法充电', '⚡', 89.00, '89元起', '2026-03-23 14:33:07');
INSERT INTO `common_problems` VALUES (32, 1, '主板故障', '🔧', 299.00, '299元起', '2026-03-23 14:33:07');
INSERT INTO `common_problems` VALUES (33, 2, '屏幕问题', '💻', 399.00, '399元起', '2026-03-23 14:33:07');
INSERT INTO `common_problems` VALUES (34, 2, '键盘故障', '⌨️', 149.00, '149元起', '2026-03-23 14:33:07');
INSERT INTO `common_problems` VALUES (35, 2, '电池更换', '🔋', 199.00, '199元起', '2026-03-23 14:33:07');
INSERT INTO `common_problems` VALUES (36, 2, '硬盘故障', '💾', 299.00, '299元起', '2026-03-23 14:33:07');
INSERT INTO `common_problems` VALUES (37, 3, '屏幕碎裂', '📟', 299.00, '299元起', '2026-03-23 14:33:07');
INSERT INTO `common_problems` VALUES (38, 3, '电池问题', '🔋', 179.00, '179元起', '2026-03-23 14:33:07');
INSERT INTO `common_problems` VALUES (39, 3, '声音故障', '🔊', 129.00, '129元起', '2026-03-23 14:33:07');
INSERT INTO `common_problems` VALUES (40, 1, '电池问题', '🔋', 99.00, '99元起', '2026-03-23 14:35:05');
INSERT INTO `common_problems` VALUES (41, 1, '屏幕碎裂', '📱', 199.00, '199元起', '2026-03-23 14:35:05');
INSERT INTO `common_problems` VALUES (42, 1, '声音异常', '🔊', 149.00, '149元起', '2026-03-23 14:35:05');
INSERT INTO `common_problems` VALUES (43, 1, '摄像头故障', '📷', 179.00, '179元起', '2026-03-23 14:35:05');
INSERT INTO `common_problems` VALUES (44, 1, '无法充电', '⚡', 89.00, '89元起', '2026-03-23 14:35:05');
INSERT INTO `common_problems` VALUES (45, 1, '主板故障', '🔧', 299.00, '299元起', '2026-03-23 14:35:05');
INSERT INTO `common_problems` VALUES (46, 2, '屏幕问题', '💻', 399.00, '399元起', '2026-03-23 14:35:05');
INSERT INTO `common_problems` VALUES (47, 2, '键盘故障', '⌨️', 149.00, '149元起', '2026-03-23 14:35:05');
INSERT INTO `common_problems` VALUES (48, 2, '电池更换', '🔋', 199.00, '199元起', '2026-03-23 14:35:05');
INSERT INTO `common_problems` VALUES (49, 2, '硬盘故障', '💾', 299.00, '299元起', '2026-03-23 14:35:05');
INSERT INTO `common_problems` VALUES (50, 3, '屏幕碎裂', '📟', 299.00, '299元起', '2026-03-23 14:35:05');
INSERT INTO `common_problems` VALUES (51, 3, '电池问题', '🔋', 179.00, '179元起', '2026-03-23 14:35:05');
INSERT INTO `common_problems` VALUES (52, 3, '声音故障', '🔊', 129.00, '129元起', '2026-03-23 14:35:05');
INSERT INTO `common_problems` VALUES (53, 1, '电池问题', '🔋', 99.00, '99元起', '2026-03-23 14:39:01');
INSERT INTO `common_problems` VALUES (54, 1, '屏幕碎裂', '📱', 199.00, '199元起', '2026-03-23 14:39:01');
INSERT INTO `common_problems` VALUES (55, 1, '声音异常', '🔊', 149.00, '149元起', '2026-03-23 14:39:01');
INSERT INTO `common_problems` VALUES (56, 1, '摄像头故障', '📷', 179.00, '179元起', '2026-03-23 14:39:01');
INSERT INTO `common_problems` VALUES (57, 1, '无法充电', '⚡', 89.00, '89元起', '2026-03-23 14:39:01');
INSERT INTO `common_problems` VALUES (58, 1, '主板故障', '🔧', 299.00, '299元起', '2026-03-23 14:39:01');
INSERT INTO `common_problems` VALUES (59, 2, '屏幕问题', '💻', 399.00, '399元起', '2026-03-23 14:39:01');
INSERT INTO `common_problems` VALUES (60, 2, '键盘故障', '⌨️', 149.00, '149元起', '2026-03-23 14:39:01');
INSERT INTO `common_problems` VALUES (61, 2, '电池更换', '🔋', 199.00, '199元起', '2026-03-23 14:39:01');
INSERT INTO `common_problems` VALUES (62, 2, '硬盘故障', '💾', 299.00, '299元起', '2026-03-23 14:39:01');
INSERT INTO `common_problems` VALUES (63, 3, '屏幕碎裂', '📟', 299.00, '299元起', '2026-03-23 14:39:01');
INSERT INTO `common_problems` VALUES (64, 3, '电池问题', '🔋', 179.00, '179元起', '2026-03-23 14:39:01');
INSERT INTO `common_problems` VALUES (65, 3, '声音故障', '🔊', 129.00, '129元起', '2026-03-23 14:39:01');
INSERT INTO `common_problems` VALUES (66, 1, '电池问题', '🔋', 99.00, '99元起', '2026-03-23 14:51:52');
INSERT INTO `common_problems` VALUES (67, 1, '屏幕碎裂', '📱', 199.00, '199元起', '2026-03-23 14:51:52');
INSERT INTO `common_problems` VALUES (68, 1, '声音异常', '🔊', 149.00, '149元起', '2026-03-23 14:51:52');
INSERT INTO `common_problems` VALUES (69, 1, '摄像头故障', '📷', 179.00, '179元起', '2026-03-23 14:51:52');
INSERT INTO `common_problems` VALUES (70, 1, '无法充电', '⚡', 89.00, '89元起', '2026-03-23 14:51:52');
INSERT INTO `common_problems` VALUES (71, 1, '主板故障', '🔧', 299.00, '299元起', '2026-03-23 14:51:52');
INSERT INTO `common_problems` VALUES (72, 2, '屏幕问题', '💻', 399.00, '399元起', '2026-03-23 14:51:52');
INSERT INTO `common_problems` VALUES (73, 2, '键盘故障', '⌨️', 149.00, '149元起', '2026-03-23 14:51:52');
INSERT INTO `common_problems` VALUES (74, 2, '电池更换', '🔋', 199.00, '199元起', '2026-03-23 14:51:52');
INSERT INTO `common_problems` VALUES (75, 2, '硬盘故障', '💾', 299.00, '299元起', '2026-03-23 14:51:52');
INSERT INTO `common_problems` VALUES (76, 3, '屏幕碎裂', '📟', 299.00, '299元起', '2026-03-23 14:51:52');
INSERT INTO `common_problems` VALUES (77, 3, '电池问题', '🔋', 179.00, '179元起', '2026-03-23 14:51:52');
INSERT INTO `common_problems` VALUES (78, 3, '声音故障', '🔊', 129.00, '129元起', '2026-03-23 14:51:52');
INSERT INTO `common_problems` VALUES (79, 9, '空调清洗', '🔧', 100.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (80, 9, '空调加氟', '🔧', 150.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (81, 9, '空调维修 - 不制冷', '🔧', 200.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (82, 9, '空调维修 - 不制热', '🔧', 200.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (83, 9, '空调漏水维修', '🔧', 180.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (84, 9, '空调异响处理', '🔧', 150.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (85, 9, '冰箱清洗消毒', '🔧', 120.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (86, 9, '冰箱不制冷维修', '🔧', 250.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (87, 9, '冰箱门封更换', '🔧', 100.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (88, 9, '冰箱温控器维修', '🔧', 200.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (89, 9, '冰箱除霜维修', '🔧', 150.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (90, 9, '洗衣机清洗', '🔧', 100.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (91, 9, '洗衣机不排水维修', '🔧', 180.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (92, 9, '洗衣机不转动维修', '🔧', 220.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (93, 9, '洗衣机漏水维修', '🔧', 200.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (94, 9, '洗衣机异响处理', '🔧', 150.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (95, 9, '热水器清洗保养', '🔧', 150.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (96, 9, '热水器不加热维修', '🔧', 200.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (97, 9, '热水器漏水维修', '🔧', 180.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (98, 9, '热水器温控器更换', '🔧', 120.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (99, 9, '电视机黑屏维修', '🔧', 300.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (100, 9, '电视机无声音维修', '🔧', 200.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (101, 9, '电视机无法开机维修', '🔧', 250.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (102, 9, '电视机画面异常维修', '🔧', 280.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (103, 9, '电脑系统重装', '🔧', 150.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (104, 9, '电脑无法开机维修', '🔧', 200.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (105, 9, '电脑蓝屏维修', '🔧', 180.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (106, 9, '电脑硬件升级', '🔧', 100.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (107, 9, '电脑病毒查杀', '🔧', 80.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (108, 9, '路由器维修', '🔧', 150.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (109, 9, '交换机维修', '🔧', 200.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (110, 9, '网络布线', '🔧', 30.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (111, 9, '网络调试', '🔧', 100.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (112, 9, '家电维修咨询', '🔧', 50.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (113, 9, '上门检测费', '🔧', 80.00, '', '2026-06-02 09:23:48');
INSERT INTO `common_problems` VALUES (114, 9, '配件更换安装', '🔧', 100.00, '', '2026-06-02 09:23:48');

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
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '配送员表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of delivery_persons
-- ----------------------------

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
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '设备类型表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of device_types
-- ----------------------------
INSERT INTO `device_types` VALUES (0, '自定义设备', '✏️', '2026-06-10 08:39:00');
INSERT INTO `device_types` VALUES (1, '手机', '📱', '2026-03-23 10:10:39');
INSERT INTO `device_types` VALUES (2, '电脑', '💻', '2026-03-23 10:10:39');
INSERT INTO `device_types` VALUES (3, '平板', '📟', '2026-03-23 10:10:39');
INSERT INTO `device_types` VALUES (4, '手表', '⌚', '2026-03-23 10:10:39');
INSERT INTO `device_types` VALUES (5, '耳机', '🎧', '2026-03-23 10:10:39');
INSERT INTO `device_types` VALUES (6, '相机', '📷', '2026-03-23 10:10:39');
INSERT INTO `device_types` VALUES (7, '游戏机', '🎮', '2026-03-23 10:10:39');
INSERT INTO `device_types` VALUES (8, '其他', '🔧', '2026-03-23 10:10:39');
INSERT INTO `device_types` VALUES (9, '通用', '🔧', '2026-06-02 09:23:48');
INSERT INTO `device_types` VALUES (10, '智能家居', '🏠', '2026-06-10 08:39:00');
INSERT INTO `device_types` VALUES (11, '打印机/办公设备', '🖨️', '2026-06-10 08:39:00');
INSERT INTO `device_types` VALUES (12, '服务器', '🖥️', '2026-06-10 08:39:00');
INSERT INTO `device_types` VALUES (13, '路由器/网络设备', '📡', '2026-06-10 08:39:00');
INSERT INTO `device_types` VALUES (14, '显卡/电脑硬件', '🎛️', '2026-06-10 08:39:00');

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
-- Records of human_agents
-- ----------------------------
INSERT INTO `human_agents` VALUES (1, '客服小王', '手机维修', 4.8, 1, NULL, '2026-03-23 10:10:50', '2026-03-23 10:10:50');
INSERT INTO `human_agents` VALUES (2, '客服小李', '电脑维修', 4.6, 1, NULL, '2026-03-23 10:10:50', '2026-03-23 10:10:50');
INSERT INTO `human_agents` VALUES (3, '客服小张', '平板设备', 4.5, 0, NULL, '2026-03-23 10:10:50', '2026-03-23 10:10:50');

-- ----------------------------
-- Table structure for human_queue
-- ----------------------------
DROP TABLE IF EXISTS `human_queue`;
CREATE TABLE `human_queue`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '队列ID',
  `conversation_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '会话ID',
  `user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户ID',
  `priority` enum('normal','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'normal' COMMENT '优先级:普通/高/紧急',
  `estimated_wait_time` int NULL DEFAULT NULL COMMENT '预估等待时间(秒)',
  `queue_position` int NULL DEFAULT NULL COMMENT '队列位置',
  `status` enum('waiting','assigned','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'waiting' COMMENT '状态:等待中/已分配/已完成',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_human_queue_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_human_queue_status`(`status` ASC) USING BTREE,
  INDEX `idx_human_queue_priority`(`priority` ASC) USING BTREE,
  INDEX `idx_human_queue_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_human_queue_status_priority`(`status` ASC, `priority` ASC, `created_at` ASC) USING BTREE,
  INDEX `fk_queue_conversation`(`conversation_id` ASC) USING BTREE,
  INDEX `idx_queue_status_priority`(`status` ASC, `priority` ASC, `created_at` ASC) USING BTREE,
  CONSTRAINT `fk_queue_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '人工客服队列表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of human_queue
-- ----------------------------

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
-- Records of knowledge_base
-- ----------------------------
INSERT INTO `knowledge_base` VALUES (1, '维修流程', '维修服务流程', '1. 在线咨询或到店检测\n2. 技师诊断故障\n3. 报价确认\n4. 开始维修\n5. 质量检测\n6. 交付使用\n7. 享受质保', '[\"流程\", \"步骤\", \"怎么修\", \"维修时间\"]', '[1, 2, 13, 14, 15, 16]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `knowledge_base` VALUES (2, '质保政策', '维修质保说明', '所有维修服务均享受90天质保期，质保期内同一故障免费返修。主板维修享受180天质保。原厂配件享受厂家质保。', '[\"质保\", \"保修\", \"返修\", \"免费\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `knowledge_base` VALUES (3, '服务时间', '营业时间说明', '门店营业时间：周一至周日 9:00-21:00\n节假日正常营业\n紧急维修服务：24小时接单，次日处理', '[\"时间\", \"营业\", \"几点开门\", \"关门\", \"营业时间\"]', '[]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `knowledge_base` VALUES (4, '价格说明', '维修价格说明', '维修价格包含：配件费、人工费、检测费\n价格透明，维修前明确报价\n检测免费，不满意不收费\n不同型号价格不同，请以实际检测为准', '[\"价格\", \"费用\", \"多少钱\", \"收费\", \"报价\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `knowledge_base` VALUES (5, '配件质量', '配件质量说明', '所有配件均为原厂或高品质第三方配件\n原厂配件：与原机一致，质量保证\n第三方配件：价格实惠，经过严格测试\n客户可自由选择配件类型', '[\"配件\", \"零件\", \"质量\", \"原装\", \"真伪\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `knowledge_base` VALUES (6, '上门服务', '上门维修服务', '提供上门维修服务，服务范围：市区内\n预约时间：提前1天预约\n服务费用：上门费50元（维修费用另算）\n适用设备：手机、平板、笔记本电脑', '[\"上门\", \"到家\", \"上门维修\", \"上门服务\"]', '[1, 2, 5, 6, 13, 14, 15, 16]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `knowledge_base` VALUES (7, '数据安全', '数据保护说明', '维修过程中严格保护客户数据\n敏感数据建议客户自行备份\n如需数据恢复，请提前告知\n主板维修时数据可能丢失，请知悉', '[\"数据\", \"隐私\", \"备份\", \"数据丢失\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `knowledge_base` VALUES (8, '屏幕维修', '屏幕维修说明', '屏幕维修包括外屏更换和内屏维修\n外屏碎裂：更换外屏，显示正常\n内屏损坏：更换总成，价格较高\n维修时间：1-2小时\n维修前会进行显示和触控检测', '[\"屏幕\", \"碎屏\", \"外屏\", \"内屏\", \"显示\"]', '[1, 2, 5, 6, 13, 14, 15, 16]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `knowledge_base` VALUES (9, '电池更换', '电池更换说明', '电池老化症状：续航短、充电慢、自动关机\n更换原厂电池，恢复续航\n维修时间：30分钟-1小时\n支持第三方电池，价格更优惠', '[\"电池\", \"续航\", \"充电\", \"电量\"]', '[1, 2, 5, 6, 7, 8, 13, 14, 15, 16]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `knowledge_base` VALUES (10, '主板维修', '主板维修说明', '主板故障症状：无法开机、自动重启、功能异常\n专业芯片级维修，修复主板\n维修时间：1-3天\n复杂故障可能需要更长时间', '[\"主板\", \"芯片\", \"无法开机\", \"重启\", \"死机\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `knowledge_base` VALUES (11, '防水处理', '进水维修说明', '设备进水后：立即关机，不要充电\n进水维修流程：拆机清洗、腐蚀检测、更换损坏部件\n维修时间：1-3天\n进水设备主板维修180天质保', '[\"进水\", \"防水\", \"腐蚀\", \"淋雨\"]', '[1, 2, 3, 4, 5, 6, 7, 13, 14, 15, 16]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `knowledge_base` VALUES (12, '维修流程', '维修服务流程', '1. 在线咨询或到店检测\n2. 技师诊断故障\n3. 报价确认\n4. 开始维修\n5. 质量检测\n6. 交付使用\n7. 享受质保', '[\"流程\", \"步骤\", \"怎么修\", \"维修时间\"]', '[1, 2, 13, 14, 15, 16]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `knowledge_base` VALUES (13, '质保政策', '维修质保说明', '所有维修服务均享受90天质保期，质保期内同一故障免费返修。主板维修享受180天质保。原厂配件享受厂家质保。', '[\"质保\", \"保修\", \"返修\", \"免费\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `knowledge_base` VALUES (14, '服务时间', '营业时间说明', '门店营业时间：周一至周日 9:00-21:00\n节假日正常营业\n紧急维修服务：24小时接单，次日处理', '[\"时间\", \"营业\", \"几点开门\", \"关门\", \"营业时间\"]', '[]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `knowledge_base` VALUES (15, '价格说明', '维修价格说明', '维修价格包含：配件费、人工费、检测费\n价格透明，维修前明确报价\n检测免费，不满意不收费\n不同型号价格不同，请以实际检测为准', '[\"价格\", \"费用\", \"多少钱\", \"收费\", \"报价\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `knowledge_base` VALUES (16, '配件质量', '配件质量说明', '所有配件均为原厂或高品质第三方配件\n原厂配件：与原机一致，质量保证\n第三方配件：价格实惠，经过严格测试\n客户可自由选择配件类型', '[\"配件\", \"零件\", \"质量\", \"原装\", \"真伪\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `knowledge_base` VALUES (17, '上门服务', '上门维修服务', '提供上门维修服务，服务范围：市区内\n预约时间：提前1天预约\n服务费用：上门费50元（维修费用另算）\n适用设备：手机、平板、笔记本电脑', '[\"上门\", \"到家\", \"上门维修\", \"上门服务\"]', '[1, 2, 5, 6, 13, 14, 15, 16]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `knowledge_base` VALUES (18, '数据安全', '数据保护说明', '维修过程中严格保护客户数据\n敏感数据建议客户自行备份\n如需数据恢复，请提前告知\n主板维修时数据可能丢失，请知悉', '[\"数据\", \"隐私\", \"备份\", \"数据丢失\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `knowledge_base` VALUES (19, '屏幕维修', '屏幕维修说明', '屏幕维修包括外屏更换和内屏维修\n外屏碎裂：更换外屏，显示正常\n内屏损坏：更换总成，价格较高\n维修时间：1-2小时\n维修前会进行显示和触控检测', '[\"屏幕\", \"碎屏\", \"外屏\", \"内屏\", \"显示\"]', '[1, 2, 5, 6, 13, 14, 15, 16]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `knowledge_base` VALUES (20, '电池更换', '电池更换说明', '电池老化症状：续航短、充电慢、自动关机\n更换原厂电池，恢复续航\n维修时间：30分钟-1小时\n支持第三方电池，价格更优惠', '[\"电池\", \"续航\", \"充电\", \"电量\"]', '[1, 2, 5, 6, 7, 8, 13, 14, 15, 16]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `knowledge_base` VALUES (21, '主板维修', '主板维修说明', '主板故障症状：无法开机、自动重启、功能异常\n专业芯片级维修，修复主板\n维修时间：1-3天\n复杂故障可能需要更长时间', '[\"主板\", \"芯片\", \"无法开机\", \"重启\", \"死机\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `knowledge_base` VALUES (22, '防水处理', '进水维修说明', '设备进水后：立即关机，不要充电\n进水维修流程：拆机清洗、腐蚀检测、更换损坏部件\n维修时间：1-3天\n进水设备主板维修180天质保', '[\"进水\", \"防水\", \"腐蚀\", \"淋雨\"]', '[1, 2, 3, 4, 5, 6, 7, 13, 14, 15, 16]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `knowledge_base` VALUES (23, '维修流程', '维修服务流程', '1. 在线咨询或到店检测\n2. 技师诊断故障\n3. 报价确认\n4. 开始维修\n5. 质量检测\n6. 交付使用\n7. 享受质保', '[\"流程\", \"步骤\", \"怎么修\", \"维修时间\"]', '[1, 2, 13, 14, 15, 16]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `knowledge_base` VALUES (24, '质保政策', '维修质保说明', '所有维修服务均享受90天质保期，质保期内同一故障免费返修。主板维修享受180天质保。原厂配件享受厂家质保。', '[\"质保\", \"保修\", \"返修\", \"免费\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `knowledge_base` VALUES (25, '服务时间', '营业时间说明', '门店营业时间：周一至周日 9:00-21:00\n节假日正常营业\n紧急维修服务：24小时接单，次日处理', '[\"时间\", \"营业\", \"几点开门\", \"关门\", \"营业时间\"]', '[]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `knowledge_base` VALUES (26, '价格说明', '维修价格说明', '维修价格包含：配件费、人工费、检测费\n价格透明，维修前明确报价\n检测免费，不满意不收费\n不同型号价格不同，请以实际检测为准', '[\"价格\", \"费用\", \"多少钱\", \"收费\", \"报价\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `knowledge_base` VALUES (27, '配件质量', '配件质量说明', '所有配件均为原厂或高品质第三方配件\n原厂配件：与原机一致，质量保证\n第三方配件：价格实惠，经过严格测试\n客户可自由选择配件类型', '[\"配件\", \"零件\", \"质量\", \"原装\", \"真伪\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `knowledge_base` VALUES (28, '上门服务', '上门维修服务', '提供上门维修服务，服务范围：市区内\n预约时间：提前1天预约\n服务费用：上门费50元（维修费用另算）\n适用设备：手机、平板、笔记本电脑', '[\"上门\", \"到家\", \"上门维修\", \"上门服务\"]', '[1, 2, 5, 6, 13, 14, 15, 16]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `knowledge_base` VALUES (29, '数据安全', '数据保护说明', '维修过程中严格保护客户数据\n敏感数据建议客户自行备份\n如需数据恢复，请提前告知\n主板维修时数据可能丢失，请知悉', '[\"数据\", \"隐私\", \"备份\", \"数据丢失\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `knowledge_base` VALUES (30, '屏幕维修', '屏幕维修说明', '屏幕维修包括外屏更换和内屏维修\n外屏碎裂：更换外屏，显示正常\n内屏损坏：更换总成，价格较高\n维修时间：1-2小时\n维修前会进行显示和触控检测', '[\"屏幕\", \"碎屏\", \"外屏\", \"内屏\", \"显示\"]', '[1, 2, 5, 6, 13, 14, 15, 16]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `knowledge_base` VALUES (31, '电池更换', '电池更换说明', '电池老化症状：续航短、充电慢、自动关机\n更换原厂电池，恢复续航\n维修时间：30分钟-1小时\n支持第三方电池，价格更优惠', '[\"电池\", \"续航\", \"充电\", \"电量\"]', '[1, 2, 5, 6, 7, 8, 13, 14, 15, 16]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `knowledge_base` VALUES (32, '主板维修', '主板维修说明', '主板故障症状：无法开机、自动重启、功能异常\n专业芯片级维修，修复主板\n维修时间：1-3天\n复杂故障可能需要更长时间', '[\"主板\", \"芯片\", \"无法开机\", \"重启\", \"死机\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `knowledge_base` VALUES (33, '防水处理', '进水维修说明', '设备进水后：立即关机，不要充电\n进水维修流程：拆机清洗、腐蚀检测、更换损坏部件\n维修时间：1-3天\n进水设备主板维修180天质保', '[\"进水\", \"防水\", \"腐蚀\", \"淋雨\"]', '[1, 2, 3, 4, 5, 6, 7, 13, 14, 15, 16]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `knowledge_base` VALUES (34, '维修流程', '维修服务流程', '1. 在线咨询或到店检测\n2. 技师诊断故障\n3. 报价确认\n4. 开始维修\n5. 质量检测\n6. 交付使用\n7. 享受质保', '[\"流程\", \"步骤\", \"怎么修\", \"维修时间\"]', '[1, 2, 13, 14, 15, 16]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `knowledge_base` VALUES (35, '质保政策', '维修质保说明', '所有维修服务均享受90天质保期，质保期内同一故障免费返修。主板维修享受180天质保。原厂配件享受厂家质保。', '[\"质保\", \"保修\", \"返修\", \"免费\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `knowledge_base` VALUES (36, '服务时间', '营业时间说明', '门店营业时间：周一至周日 9:00-21:00\n节假日正常营业\n紧急维修服务：24小时接单，次日处理', '[\"时间\", \"营业\", \"几点开门\", \"关门\", \"营业时间\"]', '[]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `knowledge_base` VALUES (37, '价格说明', '维修价格说明', '维修价格包含：配件费、人工费、检测费\n价格透明，维修前明确报价\n检测免费，不满意不收费\n不同型号价格不同，请以实际检测为准', '[\"价格\", \"费用\", \"多少钱\", \"收费\", \"报价\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `knowledge_base` VALUES (38, '配件质量', '配件质量说明', '所有配件均为原厂或高品质第三方配件\n原厂配件：与原机一致，质量保证\n第三方配件：价格实惠，经过严格测试\n客户可自由选择配件类型', '[\"配件\", \"零件\", \"质量\", \"原装\", \"真伪\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `knowledge_base` VALUES (39, '上门服务', '上门维修服务', '提供上门维修服务，服务范围：市区内\n预约时间：提前1天预约\n服务费用：上门费50元（维修费用另算）\n适用设备：手机、平板、笔记本电脑', '[\"上门\", \"到家\", \"上门维修\", \"上门服务\"]', '[1, 2, 5, 6, 13, 14, 15, 16]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `knowledge_base` VALUES (40, '数据安全', '数据保护说明', '维修过程中严格保护客户数据\n敏感数据建议客户自行备份\n如需数据恢复，请提前告知\n主板维修时数据可能丢失，请知悉', '[\"数据\", \"隐私\", \"备份\", \"数据丢失\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `knowledge_base` VALUES (41, '屏幕维修', '屏幕维修说明', '屏幕维修包括外屏更换和内屏维修\n外屏碎裂：更换外屏，显示正常\n内屏损坏：更换总成，价格较高\n维修时间：1-2小时\n维修前会进行显示和触控检测', '[\"屏幕\", \"碎屏\", \"外屏\", \"内屏\", \"显示\"]', '[1, 2, 5, 6, 13, 14, 15, 16]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `knowledge_base` VALUES (42, '电池更换', '电池更换说明', '电池老化症状：续航短、充电慢、自动关机\n更换原厂电池，恢复续航\n维修时间：30分钟-1小时\n支持第三方电池，价格更优惠', '[\"电池\", \"续航\", \"充电\", \"电量\"]', '[1, 2, 5, 6, 7, 8, 13, 14, 15, 16]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `knowledge_base` VALUES (43, '主板维修', '主板维修说明', '主板故障症状：无法开机、自动重启、功能异常\n专业芯片级维修，修复主板\n维修时间：1-3天\n复杂故障可能需要更长时间', '[\"主板\", \"芯片\", \"无法开机\", \"重启\", \"死机\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `knowledge_base` VALUES (44, '防水处理', '进水维修说明', '设备进水后：立即关机，不要充电\n进水维修流程：拆机清洗、腐蚀检测、更换损坏部件\n维修时间：1-3天\n进水设备主板维修180天质保', '[\"进水\", \"防水\", \"腐蚀\", \"淋雨\"]', '[1, 2, 3, 4, 5, 6, 7, 13, 14, 15, 16]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `knowledge_base` VALUES (45, '维修流程', '维修服务流程', '1. 在线咨询或到店检测\n2. 技师诊断故障\n3. 报价确认\n4. 开始维修\n5. 质量检测\n6. 交付使用\n7. 享受质保', '[\"流程\", \"步骤\", \"怎么修\", \"维修时间\"]', '[1, 2, 13, 14, 15, 16]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `knowledge_base` VALUES (46, '质保政策', '维修质保说明', '所有维修服务均享受90天质保期，质保期内同一故障免费返修。主板维修享受180天质保。原厂配件享受厂家质保。', '[\"质保\", \"保修\", \"返修\", \"免费\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `knowledge_base` VALUES (47, '服务时间', '营业时间说明', '门店营业时间：周一至周日 9:00-21:00\n节假日正常营业\n紧急维修服务：24小时接单，次日处理', '[\"时间\", \"营业\", \"几点开门\", \"关门\", \"营业时间\"]', '[]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `knowledge_base` VALUES (48, '价格说明', '维修价格说明', '维修价格包含：配件费、人工费、检测费\n价格透明，维修前明确报价\n检测免费，不满意不收费\n不同型号价格不同，请以实际检测为准', '[\"价格\", \"费用\", \"多少钱\", \"收费\", \"报价\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `knowledge_base` VALUES (49, '配件质量', '配件质量说明', '所有配件均为原厂或高品质第三方配件\n原厂配件：与原机一致，质量保证\n第三方配件：价格实惠，经过严格测试\n客户可自由选择配件类型', '[\"配件\", \"零件\", \"质量\", \"原装\", \"真伪\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `knowledge_base` VALUES (50, '上门服务', '上门维修服务', '提供上门维修服务，服务范围：市区内\n预约时间：提前1天预约\n服务费用：上门费50元（维修费用另算）\n适用设备：手机、平板、笔记本电脑', '[\"上门\", \"到家\", \"上门维修\", \"上门服务\"]', '[1, 2, 5, 6, 13, 14, 15, 16]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `knowledge_base` VALUES (51, '数据安全', '数据保护说明', '维修过程中严格保护客户数据\n敏感数据建议客户自行备份\n如需数据恢复，请提前告知\n主板维修时数据可能丢失，请知悉', '[\"数据\", \"隐私\", \"备份\", \"数据丢失\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `knowledge_base` VALUES (52, '屏幕维修', '屏幕维修说明', '屏幕维修包括外屏更换和内屏维修\n外屏碎裂：更换外屏，显示正常\n内屏损坏：更换总成，价格较高\n维修时间：1-2小时\n维修前会进行显示和触控检测', '[\"屏幕\", \"碎屏\", \"外屏\", \"内屏\", \"显示\"]', '[1, 2, 5, 6, 13, 14, 15, 16]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `knowledge_base` VALUES (53, '电池更换', '电池更换说明', '电池老化症状：续航短、充电慢、自动关机\n更换原厂电池，恢复续航\n维修时间：30分钟-1小时\n支持第三方电池，价格更优惠', '[\"电池\", \"续航\", \"充电\", \"电量\"]', '[1, 2, 5, 6, 7, 8, 13, 14, 15, 16]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `knowledge_base` VALUES (54, '主板维修', '主板维修说明', '主板故障症状：无法开机、自动重启、功能异常\n专业芯片级维修，修复主板\n维修时间：1-3天\n复杂故障可能需要更长时间', '[\"主板\", \"芯片\", \"无法开机\", \"重启\", \"死机\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `knowledge_base` VALUES (55, '防水处理', '进水维修说明', '设备进水后：立即关机，不要充电\n进水维修流程：拆机清洗、腐蚀检测、更换损坏部件\n维修时间：1-3天\n进水设备主板维修180天质保', '[\"进水\", \"防水\", \"腐蚀\", \"淋雨\"]', '[1, 2, 3, 4, 5, 6, 7, 13, 14, 15, 16]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `knowledge_base` VALUES (56, '维修流程', '维修服务流程', '1. 在线咨询或到店检测\n2. 技师诊断故障\n3. 报价确认\n4. 开始维修\n5. 质量检测\n6. 交付使用\n7. 享受质保', '[\"流程\", \"步骤\", \"怎么修\", \"维修时间\"]', '[1, 2, 13, 14, 15, 16]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `knowledge_base` VALUES (57, '质保政策', '维修质保说明', '所有维修服务均享受90天质保期，质保期内同一故障免费返修。主板维修享受180天质保。原厂配件享受厂家质保。', '[\"质保\", \"保修\", \"返修\", \"免费\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `knowledge_base` VALUES (58, '服务时间', '营业时间说明', '门店营业时间：周一至周日 9:00-21:00\n节假日正常营业\n紧急维修服务：24小时接单，次日处理', '[\"时间\", \"营业\", \"几点开门\", \"关门\", \"营业时间\"]', '[]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `knowledge_base` VALUES (59, '价格说明', '维修价格说明', '维修价格包含：配件费、人工费、检测费\n价格透明，维修前明确报价\n检测免费，不满意不收费\n不同型号价格不同，请以实际检测为准', '[\"价格\", \"费用\", \"多少钱\", \"收费\", \"报价\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `knowledge_base` VALUES (60, '配件质量', '配件质量说明', '所有配件均为原厂或高品质第三方配件\n原厂配件：与原机一致，质量保证\n第三方配件：价格实惠，经过严格测试\n客户可自由选择配件类型', '[\"配件\", \"零件\", \"质量\", \"原装\", \"真伪\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `knowledge_base` VALUES (61, '上门服务', '上门维修服务', '提供上门维修服务，服务范围：市区内\n预约时间：提前1天预约\n服务费用：上门费50元（维修费用另算）\n适用设备：手机、平板、笔记本电脑', '[\"上门\", \"到家\", \"上门维修\", \"上门服务\"]', '[1, 2, 5, 6, 13, 14, 15, 16]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `knowledge_base` VALUES (62, '数据安全', '数据保护说明', '维修过程中严格保护客户数据\n敏感数据建议客户自行备份\n如需数据恢复，请提前告知\n主板维修时数据可能丢失，请知悉', '[\"数据\", \"隐私\", \"备份\", \"数据丢失\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `knowledge_base` VALUES (63, '屏幕维修', '屏幕维修说明', '屏幕维修包括外屏更换和内屏维修\n外屏碎裂：更换外屏，显示正常\n内屏损坏：更换总成，价格较高\n维修时间：1-2小时\n维修前会进行显示和触控检测', '[\"屏幕\", \"碎屏\", \"外屏\", \"内屏\", \"显示\"]', '[1, 2, 5, 6, 13, 14, 15, 16]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `knowledge_base` VALUES (64, '电池更换', '电池更换说明', '电池老化症状：续航短、充电慢、自动关机\n更换原厂电池，恢复续航\n维修时间：30分钟-1小时\n支持第三方电池，价格更优惠', '[\"电池\", \"续航\", \"充电\", \"电量\"]', '[1, 2, 5, 6, 7, 8, 13, 14, 15, 16]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `knowledge_base` VALUES (65, '主板维修', '主板维修说明', '主板故障症状：无法开机、自动重启、功能异常\n专业芯片级维修，修复主板\n维修时间：1-3天\n复杂故障可能需要更长时间', '[\"主板\", \"芯片\", \"无法开机\", \"重启\", \"死机\"]', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `knowledge_base` VALUES (66, '防水处理', '进水维修说明', '设备进水后：立即关机，不要充电\n进水维修流程：拆机清洗、腐蚀检测、更换损坏部件\n维修时间：1-3天\n进水设备主板维修180天质保', '[\"进水\", \"防水\", \"腐蚀\", \"淋雨\"]', '[1, 2, 3, 4, 5, 6, 7, 13, 14, 15, 16]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');

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
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '维修进度照片表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of order_progress_photos
-- ----------------------------
INSERT INTO `order_progress_photos` VALUES (1, 59, 'fb_1779671701387_rzbcrbxng', '正在维修', '[\"/uploads/progress/59/1779671701483-965705402.jpg\"]', 4, '俊', '2026-05-25 09:15:01', '2026-05-25 09:15:01');
INSERT INTO `order_progress_photos` VALUES (2, 59, 'fb_1779672114870_2brw2nqsi', '一半了', '[\"/uploads/progress/59/1779672114921-894488266.png\"]', 4, '俊', '2026-05-25 09:21:54', '2026-05-25 09:21:54');
INSERT INTO `order_progress_photos` VALUES (3, 62, 'fb_1779762445641_i99id07ib', '正在维修', '[\"/uploads/progress/62/1779762445718-945308602.jpg\"]', 4, '俊', '2026-05-26 02:27:25', '2026-05-26 02:27:25');
INSERT INTO `order_progress_photos` VALUES (4, 62, 'fb_1779762445641_i99id07ib', '正在维修', '[\"/uploads/progress/62/1779762445835-846228180.png\"]', 4, '俊', '2026-05-26 02:27:25', '2026-05-26 02:27:25');
INSERT INTO `order_progress_photos` VALUES (5, 59, 'fb_1779762503439_z26o5sysw', '还在维修', '[\"/uploads/progress/59/1779762503526-424257413.png\"]', 4, '俊', '2026-05-26 02:28:23', '2026-05-26 02:28:23');
INSERT INTO `order_progress_photos` VALUES (6, 59, 'fb_1779762503439_z26o5sysw', '还在维修', '[\"/uploads/progress/59/1779762503702-991179826.png\"]', 4, '俊', '2026-05-26 02:28:23', '2026-05-26 02:28:23');
INSERT INTO `order_progress_photos` VALUES (8, 60, 'fb_1780537745324_jvli9xoax', '正在维修', '[\"/uploads/progress/60/1780537745498-387477448.jpg\"]', 4, '俊', '2026-06-04 09:49:05', '2026-06-04 09:49:05');
INSERT INTO `order_progress_photos` VALUES (12, 59, 'fb_1780542793609_0b377c0d1', '123', '[\"/uploads/progress/59/6a20ed466e577_1780542790.png\"]', 2, 'admin', '2026-06-04 11:13:13', '2026-06-04 11:13:13');
INSERT INTO `order_progress_photos` VALUES (13, 60, 'fb_1780559459022_ajvsmde94', '马上了', '[\"/uploads/progress/60/1780559456348-852292522.jpg\"]', 4, '俊', '2026-06-04 15:50:56', '2026-06-04 15:50:56');
INSERT INTO `order_progress_photos` VALUES (14, 60, 'fb_1780561156723_5310n7u7j', '今日维修', '[\"/uploads/progress/60/1780561156890-292594875.jpg\"]', 4, '俊', '2026-06-04 16:19:17', '2026-06-04 16:19:17');

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
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '维修进度视频表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of order_progress_videos
-- ----------------------------
INSERT INTO `order_progress_videos` VALUES (1, 59, 'fb_1779671701387_rzbcrbxng', '维修视频 05/25上午09:14', '', '/uploads/progress/59/1779671701684-498623151.mp4', '', 1, 106673, 4, '俊', '2026-05-25 09:15:01', '2026-05-25 09:15:01');
INSERT INTO `order_progress_videos` VALUES (2, 59, 'fb_1779672114870_2brw2nqsi', '维修视频 05/25上午09:21', '', '/uploads/progress/59/1779672114994-974879907.mp4', '', 1, 106673, 4, '俊', '2026-05-25 09:21:55', '2026-05-25 09:21:55');
INSERT INTO `order_progress_videos` VALUES (3, 62, 'fb_1779762445641_i99id07ib', '维修视频 05/26上午10:27', '', '/uploads/progress/62/1779762445943-578969924.mp4', '', 1, 106673, 4, '俊', '2026-05-26 02:27:25', '2026-05-26 02:27:25');
INSERT INTO `order_progress_videos` VALUES (5, 60, 'fb_1780559459022_ajvsmde94', '维修视频 06/04 15:50', '', '/uploads/progress/60/1780559458200-148169270.mp4', '', 2, 536224, 4, '俊', '2026-06-04 15:50:58', '2026-06-04 15:50:58');

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
) ENGINE = InnoDB AUTO_INCREMENT = 24 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '订单评价表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of order_reviews
-- ----------------------------
INSERT INTO `order_reviews` VALUES (1, 3, 2, 5, '回收价格很公道,服务态度很好!', NULL, '2026-03-23 10:10:50');
INSERT INTO `order_reviews` VALUES (2, 4, 3, 4, '维修很专业,就是等待时间有点长', NULL, '2026-03-23 10:10:50');
INSERT INTO `order_reviews` VALUES (20, 12, 4, 5, '测试评价内容', '[]', '2026-03-24 09:17:11');
INSERT INTO `order_reviews` VALUES (21, 30, 4, 5, '这是一个测试评价', '[]', '2026-03-24 09:27:55');
INSERT INTO `order_reviews` VALUES (22, 49, 4, 5, '很好', '[]', '2026-03-24 09:33:58');
INSERT INTO `order_reviews` VALUES (23, 53, 4, 5, '满意', '[]', '2026-03-27 10:33:54');

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单号',
  `user_id` int NOT NULL COMMENT '用户ID',
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
  `status` enum('pending','quoted','confirmed','processing','completed','review','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending',
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
) ENGINE = InnoDB AUTO_INCREMENT = 69 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '订单表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of orders
-- ----------------------------
INSERT INTO `orders` VALUES (2, 'WX20260323002', 1, 'repair', 2, NULL, '屏幕问题', '笔记本屏幕有坏点', '[]', 'home', 7, 'ThinkPad X1', 'fair', 399.00, NULL, 0, 0, NULL, 0, NULL, 0, 'processing', 2, NULL, '2026-03-23 10:10:50', '2026-03-23 10:10:50', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (3, 'WX20260323003', 2, 'recycle', 1, NULL, NULL, 'iPhone 12回收,电池健康度85%', '[\"https://example.com/image2.jpg\", \"https://example.com/image3.jpg\"]', NULL, 1, 'iPhone 12', 'good', 1800.00, 1800.00, 0, 0, NULL, 0, NULL, 0, 'completed', 3, NULL, '2026-03-23 10:10:50', '2026-03-23 10:10:50', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (4, 'WX20260323004', 3, 'repair', 3, NULL, '屏幕碎裂', 'iPad屏幕摔碎了,触控不灵敏', '[\"https://example.com/image4.jpg\"]', 'shop', 1, 'iPad Air 4', 'poor', 299.00, 299.00, 0, 0, NULL, 0, NULL, 0, 'completed', 4, NULL, '2026-03-23 10:10:50', '2026-03-23 10:10:50', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (9, 'ORD202603230001', 4, 'repair', 1, NULL, '电池问题', '手机电池续航严重下降，一天需要充电3-4次', '[\"https://example.com/img1.jpg\", \"https://example.com/img2.jpg\"]', 'shop', 1, 'iPhone 13', 'normal', 299.00, NULL, 0, 0, NULL, 0, NULL, 0, 'pending', 1, NULL, '2026-03-20 10:30:00', '2026-03-20 10:30:00', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (10, 'ORD202603230002', 4, 'repair', 1, NULL, '屏幕碎裂', '手机从桌子上掉落，屏幕左上角碎裂，触摸正常', '[\"https://example.com/screen1.jpg\"]', 'shop', 1, 'iPhone 12', 'fair', 599.00, NULL, 0, 0, NULL, 0, NULL, 0, 'processing', 1, NULL, '2026-03-18 14:20:00', '2026-03-19 09:00:00', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (11, 'ORD202603230003', 4, 'repair', 2, NULL, '电池更换', '笔记本电池鼓包，需要更换新电池', '[\"https://example.com/laptop1.jpg\"]', 'shop', 3, 'ThinkPad X1', 'good', 399.00, 380.00, 0, 0, NULL, 0, NULL, 0, 'completed', 2, NULL, '2026-03-10 16:45:00', '2026-03-11 18:30:00', '2026-03-11 18:30:00', NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (12, 'ORD202603230004', 4, 'repair', 3, NULL, '声音故障', '平板听筒没有声音，外放正常', '[\"https://example.com/tablet1.jpg\"]', 'home', 2, 'iPad Pro 12.9', 'normal', 229.00, 199.00, 0, 0, NULL, 0, NULL, 0, 'completed', 1, NULL, '2026-03-15 09:15:00', '2026-03-24 09:17:11', '2026-03-16 15:00:00', NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (13, 'REC202603230001', 4, 'recycle', 1, NULL, NULL, NULL, '[\"https://example.com/phone2.jpg\"]', 'shop', 1, 'iPhone 11', 'good', 2500.00, NULL, 0, 0, NULL, 0, NULL, 0, 'pending', 1, NULL, '2026-03-21 11:00:00', '2026-03-21 11:00:00', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (14, 'REC202603230002', 4, 'recycle', 1, NULL, NULL, NULL, '[\"https://example.com/phone3.jpg\"]', 'shop', 2, '华为 Mate 40 Pro', 'normal', 3200.00, NULL, 0, 0, NULL, 0, NULL, 0, 'processing', 1, NULL, '2026-03-19 13:30:00', '2026-03-20 10:00:00', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (15, 'REC202603230003', 4, 'recycle', 2, NULL, NULL, NULL, '[\"https://example.com/laptop2.jpg\"]', 'shop', 4, 'MacBook Pro 13\"', 'good', 6500.00, 6200.00, 0, 0, NULL, 0, NULL, 0, 'completed', 2, NULL, '2026-03-08 10:20:00', '2026-03-09 16:45:00', '2026-03-09 16:45:00', NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (28, 'REP20250318001', 4, 'repair', 1, NULL, 'iPhone 14 Pro 屏幕损坏', NULL, NULL, NULL, NULL, NULL, NULL, 1288.00, NULL, 0, 0, NULL, 0, NULL, 0, 'completed', 1, NULL, '2025-03-18 10:30:00', '2025-03-19 16:20:00', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (29, 'REP20250320002', 4, 'repair', 1, NULL, '电池续航短，需要更换电池', NULL, NULL, NULL, NULL, NULL, NULL, 298.00, NULL, 0, 0, NULL, 0, NULL, 0, 'processing', 1, NULL, '2025-03-20 09:15:00', '2026-03-23 14:39:01', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (30, 'REP20250321003', 4, 'repair', 1, NULL, '充电口接触不良，需要维修', NULL, NULL, NULL, NULL, NULL, NULL, 188.00, NULL, 0, 0, NULL, 0, NULL, 0, 'completed', 2, NULL, '2025-03-21 14:00:00', '2026-03-24 09:27:55', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (31, 'REP20250315004', 4, 'repair', 1, NULL, '后盖碎裂', NULL, NULL, NULL, NULL, NULL, NULL, 158.00, NULL, 0, 0, NULL, 0, NULL, 0, 'cancelled', 1, NULL, '2025-03-15 11:20:00', '2025-03-15 14:30:00', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (44, 'REC20250310001', 4, 'recycle', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'iPhone 13', 'good', 3288.00, NULL, 0, 0, NULL, 0, NULL, 0, 'completed', NULL, NULL, '2025-03-10 16:00:00', '2025-03-11 10:30:00', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (45, 'REC20250322002', 4, 'recycle', 1, NULL, NULL, NULL, NULL, NULL, NULL, '小米12', 'fair', 1588.00, NULL, 0, 0, NULL, 0, NULL, 0, 'pending', NULL, NULL, '2025-03-22 09:00:00', '2026-03-23 15:27:39', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (46, 'REC20250319003', 4, 'recycle', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'Mate 50 Pro', 'excellent', 4288.00, NULL, 0, 0, NULL, 0, NULL, 0, 'review', NULL, NULL, '2025-03-19 15:30:00', '2026-03-23 15:27:39', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (47, 'REP20250331001', 4, 'repair', 1, NULL, 'iPhone 15 Pro Max 信号问题', NULL, NULL, NULL, 1, 'iPhone 15 Pro Max', NULL, 199.00, NULL, 0, 0, NULL, 0, NULL, 0, 'pending', NULL, NULL, '2026-03-23 16:34:36', '2026-03-23 16:34:36', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (48, 'REP20250401002', 4, 'repair', 2, NULL, '台式电脑无法开机', NULL, NULL, NULL, 8, 'Dell XPS', NULL, 499.00, 500.00, 0, 0, NULL, 100, NULL, 0, 'completed', NULL, NULL, '2026-03-23 16:34:36', '2026-06-01 08:43:39', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (49, 'REP20250402003', 4, 'repair', 3, NULL, '华为MatePad Pro 触控失灵', NULL, NULL, NULL, 2, 'MatePad Pro', NULL, 699.00, NULL, 0, 0, NULL, 0, NULL, 0, 'completed', NULL, NULL, '2026-03-23 16:34:36', '2026-03-24 09:33:58', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (50, 'REP20250403004', 4, 'repair', 4, NULL, '小米手表心率监测不准', NULL, NULL, NULL, 3, '小米手表', NULL, 189.00, NULL, 0, 0, NULL, 0, NULL, 0, 'completed', NULL, NULL, '2026-03-23 16:34:36', '2026-03-23 16:34:36', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (51, 'REP20250404005', 4, 'repair', 5, NULL, '索尼降噪耳机一边无声', NULL, NULL, NULL, 8, 'Sony XM5', NULL, 399.00, NULL, 0, 4, NULL, 0, NULL, 0, 'quoted', NULL, NULL, '2026-03-23 16:34:36', '2026-06-02 02:27:47', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, 2000.00, '', NULL, 'pending', '2026-06-02 02:27:47', 4, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (52, 'REP20250405006', 4, 'repair', 6, NULL, '佳能相机对焦不准', NULL, NULL, NULL, 8, 'Canon R6', NULL, 899.00, NULL, 0, 0, NULL, 0, NULL, 0, 'processing', NULL, NULL, '2026-03-23 16:34:36', '2026-03-23 16:34:36', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (53, 'REP20250406007', 4, 'repair', 7, NULL, '任天堂Switch手柄漂移', NULL, NULL, NULL, 8, 'Nintendo Switch', NULL, 299.00, NULL, 0, 0, NULL, 0, NULL, 0, 'completed', NULL, NULL, '2026-03-23 16:34:36', '2026-03-27 10:33:54', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (54, 'REP20250407008', 4, 'repair', 1, NULL, '三星折叠屏折痕明显', NULL, NULL, NULL, 6, 'Samsung Fold 5', NULL, 1299.00, NULL, 0, 0, NULL, 0, NULL, 0, 'completed', NULL, NULL, '2026-03-23 16:34:36', '2026-03-23 16:34:36', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (55, 'ORD202603240944535900', 4, 'repair', 1, NULL, '3', '声音很小', '[]', 'shop', NULL, '', '', 149.00, 200.00, 0, 0, NULL, 0, NULL, 0, 'pending', NULL, NULL, '2026-03-24 09:44:53', '2026-03-27 09:50:41', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (56, 'ORD202603240959131248', 4, 'recycle', 1, NULL, '设备回收', '', '[]', 'shop', 1, '14pro', '', 1800.00, NULL, 0, 0, NULL, 0, NULL, 0, 'pending', NULL, NULL, '2026-03-24 09:59:13', '2026-03-24 09:59:13', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (57, 'ORD202603241024055268', 4, 'repair', 1, NULL, '无法充电', '充电口坏了', '[]', 'shop', 8, '一加12', '', 111.00, NULL, 0, 1, NULL, 0, NULL, 0, 'pending', NULL, NULL, '2026-03-24 10:24:05', '2026-06-03 02:33:48', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (58, 'ORD202603241524548822', 4, 'repair', 1, NULL, '主板故障', '', '[]', 'shop', 0, 'iPhone 16 Pro Max', '', 448.50, NULL, 0, 1, NULL, 0, NULL, 0, 'pending', NULL, NULL, '2026-03-24 15:24:54', '2026-05-26 02:25:18', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'rejected', NULL, NULL, '太贵了', NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (59, 'ORD202603241734029125', 4, 'repair', 1, NULL, '电池问题', '', '[]', 'shop', 0, 'iPhone 16 Pro Max', '', 148.50, 150.00, 0, 4, NULL, 50, NULL, 0, 'completed', NULL, NULL, '2026-03-24 17:34:02', '2026-06-01 06:27:55', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (60, 'ORD17746023213890EE6LN', 4, 'repair', 1, NULL, '主板故障', '', '[]', 'home', 2, 'P50 Pro', '', 343.80, NULL, 2, 0, NULL, 50, '2026-06-04 08:19:16', 0, 'processing', 21, NULL, '2026-03-27 17:05:21', '2026-06-05 01:52:15', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'accepted', NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (61, 'ORD1774660026672XFDOYB', 4, 'repair', 1, NULL, '主板故障', '不能开机', '[]', 'home', 1, 'iPhone 16 Pro Max', '', 448.50, NULL, 2, 0, NULL, 0, NULL, 0, 'cancelled', 22, NULL, '2026-03-28 09:07:06', '2026-03-28 10:11:01', NULL, 'not_want', '不需要了', 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (62, 'ORD1777011906387KIDLDJ', 4, 'repair', 99, NULL, '摄像头损坏', '摄像头损坏', '[]', 'home', NULL, '无人机2号', '', 1000.00, 1000.00, 2, 0, NULL, 25, NULL, 0, 'completed', 21, NULL, '2026-04-24 14:25:06', '2026-06-01 06:27:35', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'accepted', NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (63, 'ORD1779698506537R4FFJK', 4, 'recycle', 8, NULL, '无人机', '回收类型：无人机，品牌：大疆，型号：大疆3，成色：九成新。备注：只使用过3次', '[\"http://tmp/6HMHhZC9nAt756eddb3bea6826fac79c3e4e236c6211.png\", \"http://tmp/6LjVaA1u65wEfc2b490b93dcc8add443e4640b66f6ee.png\"]', 'shop', NULL, '大疆3', 'good', 0.00, 500.00, 0, 4, NULL, 0, NULL, 0, 'confirmed', NULL, NULL, '2026-05-25 16:41:46', '2026-06-01 01:23:16', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, 500.00, '需要原件', NULL, 'accepted', '2026-05-27 08:16:23', 4, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (64, 'ORD178047285424316EZUX', 4, 'repair', 8, NULL, '无法开机', '无法开机', '[]', 'home', NULL, '大疆', 'normal', 0.00, NULL, 0, 4, NULL, 0, NULL, 0, 'pending', 27, NULL, '2026-06-03 07:47:34', '2026-06-03 07:48:55', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (65, 'ORD1780478514214BHTZ0J', 4, 'repair', 1, NULL, '声音/扬声器问题', '', '[]', 'home', NULL, 'Magic6', 'normal', 186.30, NULL, 0, 0, NULL, 0, NULL, 0, 'pending', 27, NULL, '2026-06-03 09:21:54', '2026-06-03 09:21:54', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (66, 'ORD17805594132132MKAO7', 4, 'repair', 1, NULL, '无法开机/系统故障', '', '[]', 'home', 1, 'iPhone 16 Pro', 'normal', 278.60, NULL, 0, 0, NULL, 0, NULL, 0, 'pending', 27, NULL, '2026-06-04 07:50:13', '2026-06-04 07:50:13', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (67, 'ORD1780713176141FDI6KW', 4, 'repair', 1, NULL, '主板故障', '', '[]', 'home', 3, '小米14 Pro', 'normal', 648.70, 650.00, 0, 4, NULL, 0, NULL, 0, 'processing', 27, NULL, '2026-06-06 02:32:56', '2026-06-06 02:40:38', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, 650.00, '需要购买原件', NULL, 'accepted', '2026-06-06 02:40:10', 4, NULL, NULL, 1, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);
INSERT INTO `orders` VALUES (68, 'ORD1780740136952VV0ODT', 4, 'repair', 1, NULL, '电池续航/充电问题', '', '[]', 'home', 1, 'iPhone 16 Pro', 'normal', 138.60, NULL, 0, 0, NULL, 0, NULL, 0, 'pending', 27, NULL, '2026-06-06 10:02:17', '2026-06-06 10:02:17', NULL, NULL, NULL, 'none', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 'unpaid', 0.00, NULL, NULL, 'wechat_miniapp', NULL, NULL, 'none', NULL, NULL, 0.00, NULL, NULL);

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
-- Records of parts_inventory
-- ----------------------------
INSERT INTO `parts_inventory` VALUES (1, 'iPhone电池', 'iPhone 13/14通用', '电池', 50, 49.00, 20, '官方配件供应商', 'A区-01', 'active', '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `parts_inventory` VALUES (2, '屏幕总成', 'iPhone 13', '屏幕', 30, 299.00, 10, '官方配件供应商', 'A区-02', 'active', '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `parts_inventory` VALUES (3, '屏幕总成', 'iPhone 14', '屏幕', 25, 349.00, 10, '官方配件供应商', 'A区-03', 'active', '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `parts_inventory` VALUES (4, '主板维修芯片组', '通用型', '芯片', 15, 199.00, 5, '芯片供应商', 'B区-01', 'active', '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `parts_inventory` VALUES (5, '内存条', 'DDR4 8GB', '内存', 20, 150.00, 10, '内存供应商', 'C区-01', 'active', '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `parts_inventory` VALUES (6, '固态硬盘', '256GB SATA', '硬盘', 18, 299.00, 8, '硬盘供应商', 'C区-02', 'active', '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `parts_inventory` VALUES (7, '充电器', '20W快充', '配件', 40, 49.00, 15, '配件供应商', 'D区-01', 'active', '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `parts_inventory` VALUES (8, '数据线', 'Type-C', '配件', 60, 19.00, 25, '配件供应商', 'D区-02', 'active', '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `parts_inventory` VALUES (9, '耳机', 'AirPods仿制', '配件', 25, 89.00, 10, '配件供应商', 'D区-03', 'active', '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `parts_inventory` VALUES (10, '充电宝', '10000mAh', '配件', 35, 69.00, 15, '配件供应商', 'D区-04', 'active', '2026-03-25 10:14:30', '2026-03-25 10:14:30');

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
-- Records of products
-- ----------------------------
INSERT INTO `products` VALUES (1, 'iPhone 15 Pro', '📱', '手机维修', '¥5999起', '苹果最新旗舰手机，钛金属边框，A17 Pro芯片', 'Apple', 'iPhone 15 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\", \"Face ID维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\", \"Face ID失灵\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (2, 'iPhone 14 Pro', '📱', '手机维修', '¥4999起', '苹果次旗舰手机，灵动岛设计，A16芯片', 'Apple', 'iPhone 14 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\", \"Face ID维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"灵动岛故障\", \"无法开机\", \"相机对焦失败\", \"Face ID失灵\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (3, 'MacBook Pro', '💻', '电脑维修', '¥8999起', '苹果专业笔记本电脑，M系列芯片', 'Apple', 'MacBook Pro', '[\"屏幕维修\", \"键盘更换\", \"主板维修\", \"电池更换\", \"接口维修\", \"数据恢复\"]', '[\"屏幕显示异常\", \"键盘失灵\", \"无法开机\", \"电池鼓包\", \"USB接口失效\", \"硬盘数据丢失\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (4, 'MacBook Air', '💻', '电脑维修', '¥6999起', '苹果轻薄笔记本电脑', 'Apple', 'MacBook Air', '[\"屏幕维修\", \"键盘更换\", \"主板维修\", \"电池更换\", \"接口维修\"]', '[\"屏幕显示异常\", \"键盘失灵\", \"无法开机\", \"电池不耐用\", \"接口失效\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (5, 'iPad Pro', '📟', '平板维修', '¥4999起', '苹果专业平板电脑，M系列芯片', 'Apple', 'iPad Pro', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"摄像头维修\", \"Home键维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"相机故障\", \"Home键失灵\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (6, 'iPad Air', '📟', '平板维修', '¥3999起', '苹果中端平板电脑', 'Apple', 'iPad Air', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"相机故障\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (7, 'Apple Watch', '⌚', '手表维修', '¥1999起', '苹果智能手表', 'Apple', 'Apple Watch', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"表带更换\", \"传感器维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"心率传感器失灵\", \"表带断裂\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (8, 'AirPods Pro', '🎧', '耳机维修', '¥1299起', '苹果无线降噪耳机', 'Apple', 'AirPods Pro', '[\"充电盒维修\", \"电池更换\", \"主板维修\", \"麦克风维修\", \"扬声器维修\"]', '[\"无法充电\", \"降噪失效\", \"一只耳机无声\", \"电池不耐用\", \"连接不稳定\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (9, 'AirPods', '🎧', '耳机维修', '¥899起', '苹果无线耳机', 'Apple', 'AirPods', '[\"充电盒维修\", \"电池更换\", \"主板维修\", \"麦克风维修\"]', '[\"无法充电\", \"一只耳机无声\", \"电池不耐用\", \"连接不稳定\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (10, 'Sony A7M4', '📷', '相机维修', '¥12999起', '索尼全画幅微单相机', 'Sony', 'A7M4', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (11, 'Canon R5', '📷', '相机维修', '¥15999起', '佳能全画幅微单相机', 'Canon', 'R5', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (12, 'Nikon Z6II', '📷', '相机维修', '¥9999起', '尼康全画幅微单相机', 'Nikon', 'Z6II', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (13, '小米14 Ultra', '📱', '手机维修', '¥4999起', '小米旗舰手机，徕卡影像系统', 'Xiaomi', '14 Ultra', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (14, '华为Mate 60 Pro', '📱', '手机维修', '¥5499起', '华为旗舰手机，麒麟芯片', 'Huawei', 'Mate 60 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (15, 'OPPO Find X7 Ultra', '📱', '手机维修', '¥4499起', 'OPPO旗舰手机，哈苏影像', 'OPPO', 'Find X7 Ultra', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (16, 'vivo X100 Pro', '📱', '手机维修', '¥4299起', 'vivo旗舰手机，蔡司影像', 'vivo', 'X100 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 11:18:43', '2026-03-23 11:18:43');
INSERT INTO `products` VALUES (17, 'iPhone 15 Pro', '📱', '手机维修', '¥5999起', '苹果最新旗舰手机，钛金属边框，A17 Pro芯片', 'Apple', 'iPhone 15 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\", \"Face ID维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\", \"Face ID失灵\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (18, 'iPhone 14 Pro', '📱', '手机维修', '¥4999起', '苹果次旗舰手机，灵动岛设计，A16芯片', 'Apple', 'iPhone 14 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\", \"Face ID维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"灵动岛故障\", \"无法开机\", \"相机对焦失败\", \"Face ID失灵\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (19, 'MacBook Pro', '💻', '电脑维修', '¥8999起', '苹果专业笔记本电脑，M系列芯片', 'Apple', 'MacBook Pro', '[\"屏幕维修\", \"键盘更换\", \"主板维修\", \"电池更换\", \"接口维修\", \"数据恢复\"]', '[\"屏幕显示异常\", \"键盘失灵\", \"无法开机\", \"电池鼓包\", \"USB接口失效\", \"硬盘数据丢失\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (20, 'MacBook Air', '💻', '电脑维修', '¥6999起', '苹果轻薄笔记本电脑', 'Apple', 'MacBook Air', '[\"屏幕维修\", \"键盘更换\", \"主板维修\", \"电池更换\", \"接口维修\"]', '[\"屏幕显示异常\", \"键盘失灵\", \"无法开机\", \"电池不耐用\", \"接口失效\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (21, 'iPad Pro', '📟', '平板维修', '¥4999起', '苹果专业平板电脑，M系列芯片', 'Apple', 'iPad Pro', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"摄像头维修\", \"Home键维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"相机故障\", \"Home键失灵\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (22, 'iPad Air', '📟', '平板维修', '¥3999起', '苹果中端平板电脑', 'Apple', 'iPad Air', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"相机故障\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (23, 'Apple Watch', '⌚', '手表维修', '¥1999起', '苹果智能手表', 'Apple', 'Apple Watch', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"表带更换\", \"传感器维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"心率传感器失灵\", \"表带断裂\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (24, 'AirPods Pro', '🎧', '耳机维修', '¥1299起', '苹果无线降噪耳机', 'Apple', 'AirPods Pro', '[\"充电盒维修\", \"电池更换\", \"主板维修\", \"麦克风维修\", \"扬声器维修\"]', '[\"无法充电\", \"降噪失效\", \"一只耳机无声\", \"电池不耐用\", \"连接不稳定\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (25, 'AirPods', '🎧', '耳机维修', '¥899起', '苹果无线耳机', 'Apple', 'AirPods', '[\"充电盒维修\", \"电池更换\", \"主板维修\", \"麦克风维修\"]', '[\"无法充电\", \"一只耳机无声\", \"电池不耐用\", \"连接不稳定\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (26, 'Sony A7M4', '📷', '相机维修', '¥12999起', '索尼全画幅微单相机', 'Sony', 'A7M4', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (27, 'Canon R5', '📷', '相机维修', '¥15999起', '佳能全画幅微单相机', 'Canon', 'R5', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (28, 'Nikon Z6II', '📷', '相机维修', '¥9999起', '尼康全画幅微单相机', 'Nikon', 'Z6II', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (29, '小米14 Ultra', '📱', '手机维修', '¥4999起', '小米旗舰手机，徕卡影像系统', 'Xiaomi', '14 Ultra', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (30, '华为Mate 60 Pro', '📱', '手机维修', '¥5499起', '华为旗舰手机，麒麟芯片', 'Huawei', 'Mate 60 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (31, 'OPPO Find X7 Ultra', '📱', '手机维修', '¥4499起', 'OPPO旗舰手机，哈苏影像', 'OPPO', 'Find X7 Ultra', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (32, 'vivo X100 Pro', '📱', '手机维修', '¥4299起', 'vivo旗舰手机，蔡司影像', 'vivo', 'X100 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `products` VALUES (33, 'iPhone 15 Pro', '📱', '手机维修', '¥5999起', '苹果最新旗舰手机，钛金属边框，A17 Pro芯片', 'Apple', 'iPhone 15 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\", \"Face ID维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\", \"Face ID失灵\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (34, 'iPhone 14 Pro', '📱', '手机维修', '¥4999起', '苹果次旗舰手机，灵动岛设计，A16芯片', 'Apple', 'iPhone 14 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\", \"Face ID维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"灵动岛故障\", \"无法开机\", \"相机对焦失败\", \"Face ID失灵\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (35, 'MacBook Pro', '💻', '电脑维修', '¥8999起', '苹果专业笔记本电脑，M系列芯片', 'Apple', 'MacBook Pro', '[\"屏幕维修\", \"键盘更换\", \"主板维修\", \"电池更换\", \"接口维修\", \"数据恢复\"]', '[\"屏幕显示异常\", \"键盘失灵\", \"无法开机\", \"电池鼓包\", \"USB接口失效\", \"硬盘数据丢失\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (36, 'MacBook Air', '💻', '电脑维修', '¥6999起', '苹果轻薄笔记本电脑', 'Apple', 'MacBook Air', '[\"屏幕维修\", \"键盘更换\", \"主板维修\", \"电池更换\", \"接口维修\"]', '[\"屏幕显示异常\", \"键盘失灵\", \"无法开机\", \"电池不耐用\", \"接口失效\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (37, 'iPad Pro', '📟', '平板维修', '¥4999起', '苹果专业平板电脑，M系列芯片', 'Apple', 'iPad Pro', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"摄像头维修\", \"Home键维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"相机故障\", \"Home键失灵\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (38, 'iPad Air', '📟', '平板维修', '¥3999起', '苹果中端平板电脑', 'Apple', 'iPad Air', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"相机故障\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (39, 'Apple Watch', '⌚', '手表维修', '¥1999起', '苹果智能手表', 'Apple', 'Apple Watch', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"表带更换\", \"传感器维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"心率传感器失灵\", \"表带断裂\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (40, 'AirPods Pro', '🎧', '耳机维修', '¥1299起', '苹果无线降噪耳机', 'Apple', 'AirPods Pro', '[\"充电盒维修\", \"电池更换\", \"主板维修\", \"麦克风维修\", \"扬声器维修\"]', '[\"无法充电\", \"降噪失效\", \"一只耳机无声\", \"电池不耐用\", \"连接不稳定\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (41, 'AirPods', '🎧', '耳机维修', '¥899起', '苹果无线耳机', 'Apple', 'AirPods', '[\"充电盒维修\", \"电池更换\", \"主板维修\", \"麦克风维修\"]', '[\"无法充电\", \"一只耳机无声\", \"电池不耐用\", \"连接不稳定\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (42, 'Sony A7M4', '📷', '相机维修', '¥12999起', '索尼全画幅微单相机', 'Sony', 'A7M4', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (43, 'Canon R5', '📷', '相机维修', '¥15999起', '佳能全画幅微单相机', 'Canon', 'R5', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (44, 'Nikon Z6II', '📷', '相机维修', '¥9999起', '尼康全画幅微单相机', 'Nikon', 'Z6II', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (45, '小米14 Ultra', '📱', '手机维修', '¥4999起', '小米旗舰手机，徕卡影像系统', 'Xiaomi', '14 Ultra', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (46, '华为Mate 60 Pro', '📱', '手机维修', '¥5499起', '华为旗舰手机，麒麟芯片', 'Huawei', 'Mate 60 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (47, 'OPPO Find X7 Ultra', '📱', '手机维修', '¥4499起', 'OPPO旗舰手机，哈苏影像', 'OPPO', 'Find X7 Ultra', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (48, 'vivo X100 Pro', '📱', '手机维修', '¥4299起', 'vivo旗舰手机，蔡司影像', 'vivo', 'X100 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `products` VALUES (49, 'iPhone 15 Pro', '📱', '手机维修', '¥5999起', '苹果最新旗舰手机，钛金属边框，A17 Pro芯片', 'Apple', 'iPhone 15 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\", \"Face ID维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\", \"Face ID失灵\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (50, 'iPhone 14 Pro', '📱', '手机维修', '¥4999起', '苹果次旗舰手机，灵动岛设计，A16芯片', 'Apple', 'iPhone 14 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\", \"Face ID维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"灵动岛故障\", \"无法开机\", \"相机对焦失败\", \"Face ID失灵\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (51, 'MacBook Pro', '💻', '电脑维修', '¥8999起', '苹果专业笔记本电脑，M系列芯片', 'Apple', 'MacBook Pro', '[\"屏幕维修\", \"键盘更换\", \"主板维修\", \"电池更换\", \"接口维修\", \"数据恢复\"]', '[\"屏幕显示异常\", \"键盘失灵\", \"无法开机\", \"电池鼓包\", \"USB接口失效\", \"硬盘数据丢失\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (52, 'MacBook Air', '💻', '电脑维修', '¥6999起', '苹果轻薄笔记本电脑', 'Apple', 'MacBook Air', '[\"屏幕维修\", \"键盘更换\", \"主板维修\", \"电池更换\", \"接口维修\"]', '[\"屏幕显示异常\", \"键盘失灵\", \"无法开机\", \"电池不耐用\", \"接口失效\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (53, 'iPad Pro', '📟', '平板维修', '¥4999起', '苹果专业平板电脑，M系列芯片', 'Apple', 'iPad Pro', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"摄像头维修\", \"Home键维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"相机故障\", \"Home键失灵\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (54, 'iPad Air', '📟', '平板维修', '¥3999起', '苹果中端平板电脑', 'Apple', 'iPad Air', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"相机故障\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (55, 'Apple Watch', '⌚', '手表维修', '¥1999起', '苹果智能手表', 'Apple', 'Apple Watch', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"表带更换\", \"传感器维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"心率传感器失灵\", \"表带断裂\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (56, 'AirPods Pro', '🎧', '耳机维修', '¥1299起', '苹果无线降噪耳机', 'Apple', 'AirPods Pro', '[\"充电盒维修\", \"电池更换\", \"主板维修\", \"麦克风维修\", \"扬声器维修\"]', '[\"无法充电\", \"降噪失效\", \"一只耳机无声\", \"电池不耐用\", \"连接不稳定\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (57, 'AirPods', '🎧', '耳机维修', '¥899起', '苹果无线耳机', 'Apple', 'AirPods', '[\"充电盒维修\", \"电池更换\", \"主板维修\", \"麦克风维修\"]', '[\"无法充电\", \"一只耳机无声\", \"电池不耐用\", \"连接不稳定\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (58, 'Sony A7M4', '📷', '相机维修', '¥12999起', '索尼全画幅微单相机', 'Sony', 'A7M4', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (59, 'Canon R5', '📷', '相机维修', '¥15999起', '佳能全画幅微单相机', 'Canon', 'R5', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (60, 'Nikon Z6II', '📷', '相机维修', '¥9999起', '尼康全画幅微单相机', 'Nikon', 'Z6II', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (61, '小米14 Ultra', '📱', '手机维修', '¥4999起', '小米旗舰手机，徕卡影像系统', 'Xiaomi', '14 Ultra', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (62, '华为Mate 60 Pro', '📱', '手机维修', '¥5499起', '华为旗舰手机，麒麟芯片', 'Huawei', 'Mate 60 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (63, 'OPPO Find X7 Ultra', '📱', '手机维修', '¥4499起', 'OPPO旗舰手机，哈苏影像', 'OPPO', 'Find X7 Ultra', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (64, 'vivo X100 Pro', '📱', '手机维修', '¥4299起', 'vivo旗舰手机，蔡司影像', 'vivo', 'X100 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `products` VALUES (65, 'iPhone 15 Pro', '📱', '手机维修', '¥5999起', '苹果最新旗舰手机，钛金属边框，A17 Pro芯片', 'Apple', 'iPhone 15 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\", \"Face ID维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\", \"Face ID失灵\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (66, 'iPhone 14 Pro', '📱', '手机维修', '¥4999起', '苹果次旗舰手机，灵动岛设计，A16芯片', 'Apple', 'iPhone 14 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\", \"Face ID维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"灵动岛故障\", \"无法开机\", \"相机对焦失败\", \"Face ID失灵\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (67, 'MacBook Pro', '💻', '电脑维修', '¥8999起', '苹果专业笔记本电脑，M系列芯片', 'Apple', 'MacBook Pro', '[\"屏幕维修\", \"键盘更换\", \"主板维修\", \"电池更换\", \"接口维修\", \"数据恢复\"]', '[\"屏幕显示异常\", \"键盘失灵\", \"无法开机\", \"电池鼓包\", \"USB接口失效\", \"硬盘数据丢失\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (68, 'MacBook Air', '💻', '电脑维修', '¥6999起', '苹果轻薄笔记本电脑', 'Apple', 'MacBook Air', '[\"屏幕维修\", \"键盘更换\", \"主板维修\", \"电池更换\", \"接口维修\"]', '[\"屏幕显示异常\", \"键盘失灵\", \"无法开机\", \"电池不耐用\", \"接口失效\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (69, 'iPad Pro', '📟', '平板维修', '¥4999起', '苹果专业平板电脑，M系列芯片', 'Apple', 'iPad Pro', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"摄像头维修\", \"Home键维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"相机故障\", \"Home键失灵\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (70, 'iPad Air', '📟', '平板维修', '¥3999起', '苹果中端平板电脑', 'Apple', 'iPad Air', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"相机故障\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (71, 'Apple Watch', '⌚', '手表维修', '¥1999起', '苹果智能手表', 'Apple', 'Apple Watch', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"表带更换\", \"传感器维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"心率传感器失灵\", \"表带断裂\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (72, 'AirPods Pro', '🎧', '耳机维修', '¥1299起', '苹果无线降噪耳机', 'Apple', 'AirPods Pro', '[\"充电盒维修\", \"电池更换\", \"主板维修\", \"麦克风维修\", \"扬声器维修\"]', '[\"无法充电\", \"降噪失效\", \"一只耳机无声\", \"电池不耐用\", \"连接不稳定\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (73, 'AirPods', '🎧', '耳机维修', '¥899起', '苹果无线耳机', 'Apple', 'AirPods', '[\"充电盒维修\", \"电池更换\", \"主板维修\", \"麦克风维修\"]', '[\"无法充电\", \"一只耳机无声\", \"电池不耐用\", \"连接不稳定\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (74, 'Sony A7M4', '📷', '相机维修', '¥12999起', '索尼全画幅微单相机', 'Sony', 'A7M4', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (75, 'Canon R5', '📷', '相机维修', '¥15999起', '佳能全画幅微单相机', 'Canon', 'R5', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (76, 'Nikon Z6II', '📷', '相机维修', '¥9999起', '尼康全画幅微单相机', 'Nikon', 'Z6II', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (77, '小米14 Ultra', '📱', '手机维修', '¥4999起', '小米旗舰手机，徕卡影像系统', 'Xiaomi', '14 Ultra', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (78, '华为Mate 60 Pro', '📱', '手机维修', '¥5499起', '华为旗舰手机，麒麟芯片', 'Huawei', 'Mate 60 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (79, 'OPPO Find X7 Ultra', '📱', '手机维修', '¥4499起', 'OPPO旗舰手机，哈苏影像', 'OPPO', 'Find X7 Ultra', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (80, 'vivo X100 Pro', '📱', '手机维修', '¥4299起', 'vivo旗舰手机，蔡司影像', 'vivo', 'X100 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `products` VALUES (81, 'iPhone 15 Pro', '📱', '手机维修', '¥5999起', '苹果最新旗舰手机，钛金属边框，A17 Pro芯片', 'Apple', 'iPhone 15 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\", \"Face ID维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\", \"Face ID失灵\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `products` VALUES (82, 'iPhone 14 Pro', '📱', '手机维修', '¥4999起', '苹果次旗舰手机，灵动岛设计，A16芯片', 'Apple', 'iPhone 14 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\", \"Face ID维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"灵动岛故障\", \"无法开机\", \"相机对焦失败\", \"Face ID失灵\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `products` VALUES (83, 'MacBook Pro', '💻', '电脑维修', '¥8999起', '苹果专业笔记本电脑，M系列芯片', 'Apple', 'MacBook Pro', '[\"屏幕维修\", \"键盘更换\", \"主板维修\", \"电池更换\", \"接口维修\", \"数据恢复\"]', '[\"屏幕显示异常\", \"键盘失灵\", \"无法开机\", \"电池鼓包\", \"USB接口失效\", \"硬盘数据丢失\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `products` VALUES (84, 'MacBook Air', '💻', '电脑维修', '¥6999起', '苹果轻薄笔记本电脑', 'Apple', 'MacBook Air', '[\"屏幕维修\", \"键盘更换\", \"主板维修\", \"电池更换\", \"接口维修\"]', '[\"屏幕显示异常\", \"键盘失灵\", \"无法开机\", \"电池不耐用\", \"接口失效\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `products` VALUES (85, 'iPad Pro', '📟', '平板维修', '¥4999起', '苹果专业平板电脑，M系列芯片', 'Apple', 'iPad Pro', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"摄像头维修\", \"Home键维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"相机故障\", \"Home键失灵\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `products` VALUES (86, 'iPad Air', '📟', '平板维修', '¥3999起', '苹果中端平板电脑', 'Apple', 'iPad Air', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"相机故障\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `products` VALUES (87, 'Apple Watch', '⌚', '手表维修', '¥1999起', '苹果智能手表', 'Apple', 'Apple Watch', '[\"屏幕维修\", \"电池更换\", \"主板维修\", \"表带更换\", \"传感器维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"无法开机\", \"心率传感器失灵\", \"表带断裂\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `products` VALUES (88, 'AirPods Pro', '🎧', '耳机维修', '¥1299起', '苹果无线降噪耳机', 'Apple', 'AirPods Pro', '[\"充电盒维修\", \"电池更换\", \"主板维修\", \"麦克风维修\", \"扬声器维修\"]', '[\"无法充电\", \"降噪失效\", \"一只耳机无声\", \"电池不耐用\", \"连接不稳定\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `products` VALUES (89, 'AirPods', '🎧', '耳机维修', '¥899起', '苹果无线耳机', 'Apple', 'AirPods', '[\"充电盒维修\", \"电池更换\", \"主板维修\", \"麦克风维修\"]', '[\"无法充电\", \"一只耳机无声\", \"电池不耐用\", \"连接不稳定\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `products` VALUES (90, 'Sony A7M4', '📷', '相机维修', '¥12999起', '索尼全画幅微单相机', 'Sony', 'A7M4', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `products` VALUES (91, 'Canon R5', '📷', '相机维修', '¥15999起', '佳能全画幅微单相机', 'Canon', 'R5', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `products` VALUES (92, 'Nikon Z6II', '📷', '相机维修', '¥9999起', '尼康全画幅微单相机', 'Nikon', 'Z6II', '[\"传感器清洁\", \"镜头维修\", \"主板维修\", \"取景器维修\", \"接口维修\"]', '[\"传感器有灰尘\", \"镜头对焦异常\", \"无法开机\", \"取景器故障\", \"USB接口失效\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `products` VALUES (93, '小米14 Ultra', '📱', '手机维修', '¥4999起', '小米旗舰手机，徕卡影像系统', 'Xiaomi', '14 Ultra', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `products` VALUES (94, '华为Mate 60 Pro', '📱', '手机维修', '¥5499起', '华为旗舰手机，麒麟芯片', 'Huawei', 'Mate 60 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `products` VALUES (95, 'OPPO Find X7 Ultra', '📱', '手机维修', '¥4499起', 'OPPO旗舰手机，哈苏影像', 'OPPO', 'Find X7 Ultra', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `products` VALUES (96, 'vivo X100 Pro', '📱', '手机维修', '¥4299起', 'vivo旗舰手机，蔡司影像', 'vivo', 'X100 Pro', '[\"屏幕维修\", \"电池更换\", \"后壳更换\", \"主板维修\", \"摄像头维修\"]', '[\"屏幕碎裂\", \"电池不耐用\", \"后壳刮花\", \"无法开机\", \"相机对焦失败\"]', '2026-03-23 14:51:52', '2026-03-23 14:51:52');

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
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '进度申请表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of progress_apply
-- ----------------------------
INSERT INTO `progress_apply` VALUES (1, 'PA20260527104858940', 2, 1, '测试用户', '13800138000', '', 'ThinkPad X1', 'repairing', '想了解一下维修进度', NULL, 'approved', '同意申请', '2026-05-27 02:49:06', 1, '2026-05-27 02:48:58', '2026-05-27 02:49:06');
INSERT INTO `progress_apply` VALUES (2, 'PA20260527105018896', 62, 4, '俊', '13800138000', '无人机2号', '无人机2号', 'repairing', '维修还需要多久', '2026-05-28 00:00:00', 'approved', '同意申请', '2026-05-27 07:08:29', 4, '2026-05-27 02:50:18', '2026-05-27 07:08:29');
INSERT INTO `progress_apply` VALUES (3, 'PA20260527110411354', 60, 4, '俊', '13800138000', 'P50 Pro', 'P50 Pro', 'parts_waiting', '查看维修进度', '2026-05-28 00:00:00', 'approved', '同意申请', '2026-06-01 08:43:50', 4, '2026-05-27 03:04:11', '2026-06-01 08:43:50');
INSERT INTO `progress_apply` VALUES (4, 'PA20260603103249254', 52, 4, '俊', '13800138000', 'Canon R6', 'Canon R6', 'repairing', '急用', NULL, 'approved', '', '2026-06-04 09:14:51', 2, '2026-06-03 02:32:49', '2026-06-04 09:14:51');

-- ----------------------------
-- Table structure for repair_notifications
-- ----------------------------
DROP TABLE IF EXISTS `repair_notifications`;
CREATE TABLE `repair_notifications`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `order_id` int NOT NULL COMMENT '订单ID',
  `user_id` int NOT NULL COMMENT '接收通知的用户ID',
  `type` enum('order_created','quote_pending','quote_accepted','quote_rejected','repair_started','repair_completed','delivery_assigned','delivery_shipped','delivery_delivered') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知类型',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '通知内容',
  `is_read` tinyint(1) NULL DEFAULT 0 COMMENT '是否已读',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '通知时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_notif_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_notif_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_notif_is_read`(`is_read` ASC) USING BTREE,
  INDEX `idx_notif_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `fk_notif_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '维修通知表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of repair_notifications
-- ----------------------------

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
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '维修记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of repair_records
-- ----------------------------

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
-- Records of reviews
-- ----------------------------
INSERT INTO `reviews` VALUES (1, 'REP20250318001', 4, 5, '服务非常好，维修速度快，屏幕质量很好，强烈推荐！', NULL, '2025-03-19 16:25:00');
INSERT INTO `reviews` VALUES (2, 'REC20250310001', 4, 4, '回收价格公道，质检很快，就是有点久才打款', NULL, '2025-03-11 10:35:00');
INSERT INTO `reviews` VALUES (3, 'REP20250321003', 4, 5, '充电口问题完美解决，技术人员专业，态度好', NULL, '2025-03-21 18:00:00');
INSERT INTO `reviews` VALUES (4, 'REP20250318001', 4, 5, '服务非常好，维修速度快，屏幕质量很好，强烈推荐！', NULL, '2025-03-19 16:25:00');
INSERT INTO `reviews` VALUES (5, 'REC20250310001', 4, 4, '回收价格公道，质检很快，就是有点久才打款', NULL, '2025-03-11 10:35:00');
INSERT INTO `reviews` VALUES (6, 'REP20250321003', 4, 5, '充电口问题完美解决，技术人员专业，态度好', NULL, '2025-03-21 18:00:00');

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
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '备件表（从 parts_inventory 同步）' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of spare_parts
-- ----------------------------
INSERT INTO `spare_parts` VALUES (1, 'SP0001', 'iPhone电池', 'iPhone 13/14通用', '电池', '件', NULL, 49.00, 73.50, 50, 20, NULL, 'A区-01', 1, '/uploads/general/6a17eb0686099_1779952390.png', '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `spare_parts` VALUES (2, 'SP0002', '屏幕总成', 'iPhone 13', '屏幕', '件', NULL, 299.00, 448.50, 30, 10, NULL, 'A区-02', 1, NULL, '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `spare_parts` VALUES (3, 'SP0003', '屏幕总成', 'iPhone 14', '屏幕', '件', NULL, 349.00, 523.50, 25, 10, NULL, 'A区-03', 1, NULL, '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `spare_parts` VALUES (4, 'SP0004', '主板维修芯片组', '通用型', '芯片', '件', NULL, 199.00, 298.50, 15, 5, NULL, 'B区-01', 1, '/uploads/general/6a17ec081c6ae_1779952648.jpg', '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `spare_parts` VALUES (5, 'SP0005', '内存条', 'DDR4 8GB', '内存', '件', NULL, 150.00, 225.00, 20, 10, NULL, 'C区-01', 1, NULL, '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `spare_parts` VALUES (6, 'SP0006', '固态硬盘', '256GB SATA', '硬盘', '件', NULL, 299.00, 448.50, 18, 8, NULL, 'C区-02', 1, NULL, '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `spare_parts` VALUES (7, 'SP0007', '充电器', '20W快充', '配件', '件', NULL, 49.00, 73.50, 40, 15, NULL, 'D区-01', 1, NULL, '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `spare_parts` VALUES (8, 'SP0008', '数据线', 'Type-C', '配件', '件', NULL, 19.00, 28.50, 61, 25, NULL, 'D区-02', 1, NULL, '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `spare_parts` VALUES (9, 'SP0009', '耳机', 'AirPods仿制', '配件', '件', NULL, 89.00, 133.50, 25, 10, NULL, 'D区-03', 1, NULL, '2026-03-25 10:14:30', '2026-03-25 10:14:30');
INSERT INTO `spare_parts` VALUES (10, 'SP0010', '充电宝', '10000mAh', '配件', '件', NULL, 69.00, 103.50, 35, 15, NULL, 'D区-04', 1, NULL, '2026-03-25 10:14:30', '2026-03-25 10:14:30');

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
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '库存记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of stock_records
-- ----------------------------
INSERT INTO `stock_records` VALUES (1, 8, 1, 1, 60, 61, NULL, NULL, 2, '', '2026-05-28 06:42:03');

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
-- Records of system_config
-- ----------------------------
INSERT INTO `system_config` VALUES (1, 'app_name', '电子维修', '应用名称', '2026-03-23 10:10:39', '2026-03-23 10:10:39');
INSERT INTO `system_config` VALUES (2, 'app_version', '1.0.0', '应用版本', '2026-03-23 10:10:39', '2026-03-23 10:10:39');
INSERT INTO `system_config` VALUES (3, 'service_phone', '400-888-8888', '客服电话', '2026-03-23 10:10:39', '2026-03-23 10:10:39');
INSERT INTO `system_config` VALUES (4, 'service_hours', '9:00-21:00', '营业时间', '2026-03-23 10:10:39', '2026-03-23 10:10:39');

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
) ENGINE = InnoDB AUTO_INCREMENT = 28 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户收货地址表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of user_addresses
-- ----------------------------
INSERT INTO `user_addresses` VALUES (1, 1, '张三', '13800138001', '广东省', '深圳市', '南山区', '科技园南区123号', '518000', '[\"家\"]', 1, '2026-03-23 10:10:50', '2026-03-23 10:10:50');
INSERT INTO `user_addresses` VALUES (2, 1, '张三', '13800138001', '广东省', '深圳市', '福田区', '华强北456号', '518000', '[\"公司\"]', 0, '2026-03-23 10:10:50', '2026-03-23 10:10:50');
INSERT INTO `user_addresses` VALUES (3, 2, '李四', '13800138002', '北京市', '北京市', '朝阳区', '国贸大厦789号', '100000', '[\"家\"]', 1, '2026-03-23 10:10:50', '2026-03-23 10:10:50');
INSERT INTO `user_addresses` VALUES (4, 3, '王五', '13800138003', '上海市', '上海市', '浦东新区', '陆家嘴金融中心901号', '200120', '[\"公司\"]', 1, '2026-03-23 10:10:50', '2026-03-23 10:10:50');
INSERT INTO `user_addresses` VALUES (5, 1, '张三', '13800138001', '广东省', '深圳市', '南山区', '科技园南区123号', '518000', '[\"家\"]', 1, '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `user_addresses` VALUES (6, 1, '张三', '13800138001', '广东省', '深圳市', '福田区', '华强北456号', '518000', '[\"公司\"]', 0, '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `user_addresses` VALUES (7, 2, '李四', '13800138002', '北京市', '北京市', '朝阳区', '国贸大厦789号', '100000', '[\"家\"]', 1, '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `user_addresses` VALUES (8, 3, '王五', '13800138003', '上海市', '上海市', '浦东新区', '陆家嘴金融中心901号', '200120', '[\"公司\"]', 1, '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `user_addresses` VALUES (9, 1, '张三', '13800138001', '广东省', '深圳市', '南山区', '科技园南区123号', '518000', '[\"家\"]', 1, '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `user_addresses` VALUES (10, 1, '张三', '13800138001', '广东省', '深圳市', '福田区', '华强北456号', '518000', '[\"公司\"]', 0, '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `user_addresses` VALUES (11, 2, '李四', '13800138002', '北京市', '北京市', '朝阳区', '国贸大厦789号', '100000', '[\"家\"]', 1, '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `user_addresses` VALUES (12, 3, '王五', '13800138003', '上海市', '上海市', '浦东新区', '陆家嘴金融中心901号', '200120', '[\"公司\"]', 1, '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `user_addresses` VALUES (13, 1, '张三', '13800138001', '广东省', '深圳市', '南山区', '科技园南区123号', '518000', '[\"家\"]', 1, '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `user_addresses` VALUES (14, 1, '张三', '13800138001', '广东省', '深圳市', '福田区', '华强北456号', '518000', '[\"公司\"]', 0, '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `user_addresses` VALUES (15, 2, '李四', '13800138002', '北京市', '北京市', '朝阳区', '国贸大厦789号', '100000', '[\"家\"]', 1, '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `user_addresses` VALUES (16, 3, '王五', '13800138003', '上海市', '上海市', '浦东新区', '陆家嘴金融中心901号', '200120', '[\"公司\"]', 1, '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `user_addresses` VALUES (17, 1, '张三', '13800138001', '广东省', '深圳市', '南山区', '科技园南区123号', '518000', '[\"家\"]', 1, '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `user_addresses` VALUES (18, 1, '张三', '13800138001', '广东省', '深圳市', '福田区', '华强北456号', '518000', '[\"公司\"]', 0, '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `user_addresses` VALUES (19, 2, '李四', '13800138002', '北京市', '北京市', '朝阳区', '国贸大厦789号', '100000', '[\"家\"]', 1, '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `user_addresses` VALUES (20, 3, '王五', '13800138003', '上海市', '上海市', '浦东新区', '陆家嘴金融中心901号', '200120', '[\"公司\"]', 1, '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `user_addresses` VALUES (21, 4, '张三', '13800138000', '广东省', '深圳市', '南山区', '科技园南区1001室', NULL, NULL, 0, '2026-03-23 14:39:01', '2026-06-03 07:35:52');
INSERT INTO `user_addresses` VALUES (22, 4, '张三', '13800138000', '广东省', '深圳市', '南山区', '科技园南区1002室', '', '[]', 0, '2026-03-23 14:39:01', '2026-05-26 03:12:41');
INSERT INTO `user_addresses` VALUES (23, 1, '张三', '13800138001', '广东省', '深圳市', '南山区', '科技园南区123号', '518000', '[\"家\"]', 1, '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `user_addresses` VALUES (24, 1, '张三', '13800138001', '广东省', '深圳市', '福田区', '华强北456号', '518000', '[\"公司\"]', 0, '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `user_addresses` VALUES (25, 2, '李四', '13800138002', '北京市', '北京市', '朝阳区', '国贸大厦789号', '100000', '[\"家\"]', 1, '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `user_addresses` VALUES (26, 3, '王五', '13800138003', '上海市', '上海市', '浦东新区', '陆家嘴金融中心901号', '200120', '[\"公司\"]', 1, '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `user_addresses` VALUES (27, 4, '刘仁俊', '15570836828', '广东省', '深圳市', '南山区', '深圳市众云信息科技有限公司（西丽街道西丽社区打石一路深圳国际创新谷1栋B座1101室）', '', '[\"家\", \"学校\"]', 1, '2026-06-03 03:45:12', '2026-06-03 07:35:52');

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
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_device_type_id`(`device_type_id` ASC) USING BTREE,
  INDEX `idx_is_default`(`user_id` ASC, `is_default` ASC) USING BTREE,
  CONSTRAINT `fk_user_devices_device_type` FOREIGN KEY (`device_type_id`) REFERENCES `device_types` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_user_devices_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户设备绑定表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_devices
-- ----------------------------
INSERT INTO `user_devices` VALUES (1, 4, 8, '其他', '其他电子设备', '无人机二号', '44651254846', '正常', '2026-02-13', 0, '2026-06-10 07:08:20', '2026-06-10 07:08:20', NULL);
INSERT INTO `user_devices` VALUES (2, 4, 0, '大疆', '大疆3', '无人机一号', '455621391735', '可以正常使用', '2026-01-08', 0, '2026-06-10 08:43:39', '2026-06-10 08:43:39', '无人机');

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
) ENGINE = InnoDB AUTO_INCREMENT = 20 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户维修单位表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of user_units
-- ----------------------------
INSERT INTO `user_units` VALUES (1, 1, '腾讯科技', '深圳市南山区科技园', '张三', '13800138001', 1, '2026-03-23 10:10:50', '2026-03-23 10:10:50');
INSERT INTO `user_units` VALUES (2, 2, '百度', '北京市海淀区上地', '李四', '13800138002', 1, '2026-03-23 10:10:50', '2026-03-23 10:10:50');
INSERT INTO `user_units` VALUES (3, 3, '阿里巴巴', '上海市浦东新区', '王五', '13800138003', 1, '2026-03-23 10:10:50', '2026-03-23 10:10:50');
INSERT INTO `user_units` VALUES (4, 1, '腾讯科技', '深圳市南山区科技园', '张三', '13800138001', 1, '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `user_units` VALUES (5, 2, '百度', '北京市海淀区上地', '李四', '13800138002', 1, '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `user_units` VALUES (6, 3, '阿里巴巴', '上海市浦东新区', '王五', '13800138003', 1, '2026-03-23 14:26:06', '2026-03-23 14:26:06');
INSERT INTO `user_units` VALUES (7, 1, '腾讯科技', '深圳市南山区科技园', '张三', '13800138001', 1, '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `user_units` VALUES (8, 2, '百度', '北京市海淀区上地', '李四', '13800138002', 1, '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `user_units` VALUES (9, 3, '阿里巴巴', '上海市浦东新区', '王五', '13800138003', 1, '2026-03-23 14:33:07', '2026-03-23 14:33:07');
INSERT INTO `user_units` VALUES (10, 1, '腾讯科技', '深圳市南山区科技园', '张三', '13800138001', 1, '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `user_units` VALUES (11, 2, '百度', '北京市海淀区上地', '李四', '13800138002', 1, '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `user_units` VALUES (12, 3, '阿里巴巴', '上海市浦东新区', '王五', '13800138003', 1, '2026-03-23 14:35:05', '2026-03-23 14:35:05');
INSERT INTO `user_units` VALUES (13, 1, '腾讯科技', '深圳市南山区科技园', '张三', '13800138001', 1, '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `user_units` VALUES (14, 2, '百度', '北京市海淀区上地', '李四', '13800138002', 1, '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `user_units` VALUES (15, 3, '阿里巴巴', '上海市浦东新区', '王五', '13800138003', 1, '2026-03-23 14:39:01', '2026-03-23 14:39:01');
INSERT INTO `user_units` VALUES (16, 1, '腾讯科技', '深圳市南山区科技园', '张三', '13800138001', 1, '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `user_units` VALUES (17, 2, '百度', '北京市海淀区上地', '李四', '13800138002', 1, '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `user_units` VALUES (18, 3, '阿里巴巴', '上海市浦东新区', '王五', '13800138003', 1, '2026-03-23 14:51:52', '2026-03-23 14:51:52');
INSERT INTO `user_units` VALUES (19, 4, '众云信息科技有限公司', '1111', '刘仁俊', '15570836828', 1, '2026-04-24 14:04:14', '2026-04-24 14:04:14');

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
  `role` enum('user','admin','super_admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'user' COMMENT '用户角色: user-普通用户, admin-管理员, super_admin-超级管理员',
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
) ENGINE = InnoDB AUTO_INCREMENT = 18 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'wx_openid_demo_001', NULL, '张三', 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLJ7PzJ9ibicibvI8kqibI6GqyI6GqyI6GqyI6GqyI6Gqy/132', '张三丰', '13800138001', 'zhangsan@example.com', 1, '中国', '广东省', '深圳市', 'zh_CN', 1, 'admin', '2026-03-23 10:10:50', '2026-03-27 11:35:07', NULL);
INSERT INTO `users` VALUES (2, 'wx_openid_demo_002', NULL, '李四', 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLJ7PzJ9ibicibvI8kqibI6GqyI6GqyI6GqyI6GqyI6Gqy/132', '李四光', '13800138002', 'lisi@example.com', 1, '中国', '北京市', '北京市', 'zh_CN', 1, 'user', '2026-03-23 10:10:50', '2026-03-23 10:10:50', NULL);
INSERT INTO `users` VALUES (3, 'wx_openid_demo_003', NULL, '王五', 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLJ7PzJ9ibicibvI8kqibI6GqyI6GqyI6GqyI6GqyI6Gqy/132', '王五', '13800138003', 'wangwu@example.com', 2, '中国', '上海市', '上海市', 'zh_CN', 1, 'user', '2026-03-23 10:10:50', '2026-03-23 10:10:50', NULL);
INSERT INTO `users` VALUES (4, 'ooXtD3SSOG_AfbSlmM4wrl8D27Mg', NULL, '俊', 'http://tmp/7DaIs4dX05RWa65dd8fe061ac296a8cfbd258195ad78.jpeg', '', '13800138000', 'test@example.com', 0, '', '', '', 'zh_CN', 1, 'super_admin', '2026-03-23 10:17:32', '2026-06-10 06:22:22', '2026-06-10 06:22:22');

SET FOREIGN_KEY_CHECKS = 1;
