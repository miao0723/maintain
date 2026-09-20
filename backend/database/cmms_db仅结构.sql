/*
 Navicat Premium Dump SQL

 Source Server         : sql
 Source Server Type    : MySQL
 Source Server Version : 80027 (8.0.27)
 Source Host           : 8.155.24.202:3306
 Source Schema         : cmms_db

 Target Server Type    : MySQL
 Target Server Version : 80027 (8.0.27)
 File Encoding         : 65001

 Date: 19/09/2026 09:55:29
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for agreements
-- ----------------------------
DROP TABLE IF EXISTS `agreements`;
CREATE TABLE `agreements`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '协议标题',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '协议编码',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '协议内容 (HTML)',
  `version` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '1.0' COMMENT '版本号',
  `status` tinyint(1) NULL DEFAULT 1 COMMENT '状态：1 启用 0 禁用',
  `effective_date` date NULL DEFAULT NULL COMMENT '生效日期',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注',
  `created_by` int NULL DEFAULT NULL COMMENT '创建人 ID',
  `updated_by` int NULL DEFAULT NULL COMMENT '更新人 ID',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '免责协议表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for attachments
-- ----------------------------
DROP TABLE IF EXISTS `attachments`;
CREATE TABLE `attachments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `target_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'æ‰€å±žæ¨¡å—(sales/purchases/employeeç­‰)',
  `target_id` int NOT NULL COMMENT 'å…³è”è®°å½•ID',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'æ–‡ä»¶åˆ†ç±»(contract_attachmentsç­‰)',
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'åŽŸå§‹æ–‡ä»¶å',
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'å­˜å‚¨ç›¸å¯¹è·¯å¾„',
  `file_size` int NULL DEFAULT NULL COMMENT 'æ–‡ä»¶å¤§å°(å­—èŠ‚)',
  `folder_id` int NULL DEFAULT NULL COMMENT 'æ‰€å±žæ–‡ä»¶å¤¹ID(å¯é€‰ï¼Œèµ„æ–™ç®¡ç†ç”¨)',
  `tags` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'æ ‡ç­¾',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT 'å¤‡æ³¨',
  `is_active` tinyint(1) NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for cmms_invoices
-- ----------------------------
DROP TABLE IF EXISTS `cmms_invoices`;
CREATE TABLE `cmms_invoices`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `invoice_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '发票号码',
  `type` enum('special','normal','electronic') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal' COMMENT '发票类型: special-增值税专用发票, normal-增值税普通发票, electronic-电子发票',
  `amount` decimal(12, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '金额（不含税）',
  `tax_rate` decimal(5, 4) UNSIGNED NOT NULL DEFAULT 0.1300 COMMENT '税率',
  `tax_amount` decimal(12, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '税额',
  `total_amount` decimal(12, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '价税合计',
  `issue_date` date NULL DEFAULT NULL COMMENT '开票日期',
  `status` enum('pending','issued','void') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '状态: pending-待开具, issued-已开具, void-已作废',
  `company_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '购买方名称',
  `tax_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '纳税人识别号',
  `address_phone` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '地址电话',
  `bank_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '开户银行',
  `bank_account` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '银行账号',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `related_order_id` int UNSIGNED NULL DEFAULT NULL COMMENT '关联订单ID',
  `related_order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '关联订单号',
  `created_by` int UNSIGNED NULL DEFAULT NULL COMMENT '创建人ID',
  `issued_by` int UNSIGNED NULL DEFAULT NULL COMMENT '开票人ID',
  `issued_at` datetime NULL DEFAULT NULL COMMENT '开票操作时间',
  `voided_by` int UNSIGNED NULL DEFAULT NULL COMMENT '作废人ID',
  `voided_at` datetime NULL DEFAULT NULL COMMENT '作废操作时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_invoice_no`(`invoice_no` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_company_name`(`company_name` ASC) USING BTREE,
  INDEX `idx_tax_no`(`tax_no` ASC) USING BTREE,
  INDEX `idx_issue_date`(`issue_date` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '发票管理表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for cmms_online_payments
-- ----------------------------
DROP TABLE IF EXISTS `cmms_online_payments`;
CREATE TABLE `cmms_online_payments`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单编号',
  `trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '第三方交易流水号',
  `customer_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '客户姓名',
  `customer_id` int UNSIGNED NULL DEFAULT NULL COMMENT '客户ID',
  `amount` decimal(12, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '支付金额',
  `payment_method` enum('wechat','alipay','unionpay') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '支付方式: wechat-微信支付, alipay-支付宝, unionpay-云闪付',
  `status` enum('pending','paid','cancelled','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '支付状态: pending-待支付, paid-已支付, cancelled-已取消, refunded-已退款',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `paid_at` datetime NULL DEFAULT NULL COMMENT '支付时间',
  `cancelled_at` datetime NULL DEFAULT NULL COMMENT '取消时间',
  `refund_at` datetime NULL DEFAULT NULL COMMENT '退款时间',
  `refund_amount` decimal(12, 2) UNSIGNED NULL DEFAULT NULL COMMENT '退款金额',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `created_by` int UNSIGNED NULL DEFAULT NULL COMMENT '创建人ID',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_order_no`(`order_no` ASC) USING BTREE,
  INDEX `idx_trade_no`(`trade_no` ASC) USING BTREE,
  INDEX `idx_customer_id`(`customer_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_payment_method`(`payment_method` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 22 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '在线支付表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for cmms_transfer_payments
-- ----------------------------
DROP TABLE IF EXISTS `cmms_transfer_payments`;
CREATE TABLE `cmms_transfer_payments`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单号',
  `payee_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '收款人姓名',
  `payee_account` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '收款账户（银行账号或支付宝号）',
  `bank_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '开户银行',
  `amount` decimal(12, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '转账金额',
  `transfer_time` datetime NOT NULL COMMENT '转账时间',
  `voucher` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '转账凭证图片URL',
  `status` enum('pending','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '状态: pending-待确认, completed-已完成, cancelled-已取消',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `created_by` int UNSIGNED NULL DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_order_no`(`order_no` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_transfer_time`(`transfer_time` ASC) USING BTREE,
  INDEX `idx_created_by`(`created_by` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 18 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '转账支付表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for contract_templates
-- ----------------------------
DROP TABLE IF EXISTS `contract_templates`;
CREATE TABLE `contract_templates`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '模板名称',
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'repair_contract' COMMENT '模板类型：repair_contract维修合同 service_agreement服务协议 confidentiality保密协议',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '模板描述',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '模板内容（支持变量占位符）',
  `variables` json NULL COMMENT '可用变量列表',
  `custom_variables` json NULL COMMENT '自定义变量列表',
  `created_by` int NULL DEFAULT NULL COMMENT '创建人 ID',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_created_by`(`created_by` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '合同模板表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for departments
-- ----------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '部门ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '部门名称',
  `parent_id` int UNSIGNED NULL DEFAULT NULL COMMENT '父部门ID',
  `manager_id` int UNSIGNED NULL DEFAULT NULL COMMENT '负责人ID',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1正常 0禁用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_parent`(`parent_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '部门表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for device_categories
-- ----------------------------
DROP TABLE IF EXISTS `device_categories`;
CREATE TABLE `device_categories`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '分类描述',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 109 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '设备分类表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for devices
-- ----------------------------
DROP TABLE IF EXISTS `devices`;
CREATE TABLE `devices`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '设备ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设备名称',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设备编号',
  `category_id` int UNSIGNED NOT NULL COMMENT '设备分类ID',
  `department_id` int UNSIGNED NOT NULL COMMENT '所属部门ID',
  `specification` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '规格型号',
  `manufacturer` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '制造商',
  `purchase_date` date NULL DEFAULT NULL COMMENT '购买日期',
  `warranty_expiry` date NULL DEFAULT NULL COMMENT '保修截止日期',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1正常 2维修 3报废',
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '存放位置',
  `responsible_person` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '责任人',
  `purchase_price` decimal(10, 2) NULL DEFAULT NULL COMMENT '购买价格',
  `supplier` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '供应商',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
  INDEX `idx_category`(`category_id` ASC) USING BTREE,
  INDEX `idx_department`(`department_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_responsible_person`(`responsible_person` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '设备表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for engineers
-- ----------------------------
DROP TABLE IF EXISTS `engineers`;
CREATE TABLE `engineers`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '工程师ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `skill_level` tinyint UNSIGNED NOT NULL DEFAULT 3 COMMENT '技能等级:1初级 2中级 3高级 4专家',
  `specialties` json NULL COMMENT '专长领域[\"电气\",\"机械\",\"空调\"]',
  `work_years` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '工作年限',
  `certification` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '专业认证',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1在岗 2休假 3离职',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_skill_level`(`skill_level` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '维修人员表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for external_repairs
-- ----------------------------
DROP TABLE IF EXISTS `external_repairs`;
CREATE TABLE `external_repairs`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int NOT NULL COMMENT '订单ID',
  `external_unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '外部单位',
  `contact_person` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '联系电话',
  `repair_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '维修内容',
  `amount` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '维修金额',
  `status` enum('pending','in_progress','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '状态：pending-待处理，in_progress-进行中，completed-已完成',
  `start_date` date NULL DEFAULT NULL COMMENT '开始日期',
  `end_date` date NULL DEFAULT NULL COMMENT '完成日期',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_external_unit`(`external_unit` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '联动维修表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for inspection_tasks
-- ----------------------------
DROP TABLE IF EXISTS `inspection_tasks`;
CREATE TABLE `inspection_tasks`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `task_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务名称',
  `device_id` int UNSIGNED NOT NULL COMMENT '设备ID',
  `inspector_id` int UNSIGNED NOT NULL COMMENT '巡检员ID',
  `plan_time` date NOT NULL COMMENT '计划日期',
  `actual_time` date NULL DEFAULT NULL COMMENT '实际日期',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态:0待执行 1进行中 2已完成 3已逾期',
  `result` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '巡检结果',
  `images` json NULL COMMENT '照片[\"url1\",\"url2\"]',
  `is_abnormal` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否异常:0正常 1异常',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_device`(`device_id` ASC) USING BTREE,
  INDEX `idx_inspector`(`inspector_id` ASC) USING BTREE,
  INDEX `idx_plan_time`(`plan_time` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '巡检任务表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for kb_chat_messages
-- ----------------------------
DROP TABLE IF EXISTS `kb_chat_messages`;
CREATE TABLE `kb_chat_messages`  (
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
  INDEX `idx_session_id`(`session_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 63 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库聊天消息表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for kb_chat_sessions
-- ----------------------------
DROP TABLE IF EXISTS `kb_chat_sessions`;
CREATE TABLE `kb_chat_sessions`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `collection_id` int UNSIGNED NOT NULL COMMENT '关联知识库ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '会话标题',
  `message_count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '消息数量',
  `last_message_at` datetime NULL DEFAULT NULL COMMENT '最后消息时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_collection_id`(`collection_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_last_message_at`(`last_message_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 37 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库聊天会话表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for kb_chunks
-- ----------------------------
DROP TABLE IF EXISTS `kb_chunks`;
CREATE TABLE `kb_chunks`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `file_id` int UNSIGNED NOT NULL COMMENT '所属文件ID',
  `collection_id` int UNSIGNED NOT NULL COMMENT '所属知识库ID',
  `chunk_index` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '块序号',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '块文本内容',
  `char_count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '字符数',
  `milvus_id` bigint NULL DEFAULT NULL COMMENT 'Milvus中的向量ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_file_id`(`file_id` ASC) USING BTREE,
  INDEX `idx_collection_id`(`collection_id` ASC) USING BTREE,
  INDEX `idx_milvus_id`(`milvus_id` ASC) USING BTREE,
  FULLTEXT INDEX `idx_content_fulltext`(`content`) WITH PARSER `ngram`
) ENGINE = InnoDB AUTO_INCREMENT = 53 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库文本块表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for kb_collections
-- ----------------------------
DROP TABLE IF EXISTS `kb_collections`;
CREATE TABLE `kb_collections`  (
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
  INDEX `idx_created_by`(`created_by` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库集合表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for kb_files
-- ----------------------------
DROP TABLE IF EXISTS `kb_files`;
CREATE TABLE `kb_files`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `collection_id` int UNSIGNED NOT NULL COMMENT '所属知识库ID',
  `original_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '原始文件名',
  `stored_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '存储文件名',
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件相对路径',
  `local_path` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '本地完整路径',
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
  INDEX `idx_collection_id`(`collection_id` ASC) USING BTREE,
  INDEX `idx_chunk_status`(`chunk_status` ASC) USING BTREE,
  INDEX `idx_uploaded_by`(`uploaded_by` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库文件表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for knowledge_base
-- ----------------------------
DROP TABLE IF EXISTS `knowledge_base`;
CREATE TABLE `knowledge_base`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '知识ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '知识标题',
  `fault_symptom` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '故障现象',
  `fault_cause` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '故障原因',
  `solution` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '解决方案',
  `category_id` int UNSIGNED NULL DEFAULT NULL COMMENT '设备分类ID',
  `device_id` int UNSIGNED NULL DEFAULT NULL COMMENT '设备ID',
  `related_part_ids` json NULL COMMENT '关联配件IDs',
  `tags` json NULL COMMENT '标签',
  `difficulty_level` tinyint UNSIGNED NOT NULL DEFAULT 2 COMMENT '难度等级:1简单 2中等 3困难',
  `usage_count` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '使用次数',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态:0草稿 1已发布 2已归档',
  `created_by` int UNSIGNED NOT NULL COMMENT '创建人ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_category`(`category_id` ASC) USING BTREE,
  INDEX `idx_device`(`device_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_difficulty`(`difficulty_level` ASC) USING BTREE,
  INDEX `idx_usage`(`usage_count` ASC) USING BTREE,
  INDEX `idx_created_by`(`created_by` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '故障知识库表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for maintenance_categories
-- ----------------------------
DROP TABLE IF EXISTS `maintenance_categories`;
CREATE TABLE `maintenance_categories`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分类名称',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '分类编码',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '分类描述',
  `sort` int NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) NULL DEFAULT 1 COMMENT '状态 1 启用 0 禁用',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
  INDEX `idx_sort`(`sort` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '维修内容分类表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for maintenance_items
-- ----------------------------
DROP TABLE IF EXISTS `maintenance_items`;
CREATE TABLE `maintenance_items`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '维修项目编号',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '维修项目名称',
  `category_id` int NULL DEFAULT NULL COMMENT '分类 ID',
  `unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '次' COMMENT '单位',
  `price` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '参考价格',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '说明',
  `sort` int NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) NULL DEFAULT 1 COMMENT '状态 1 启用 0 禁用',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
  INDEX `idx_category_id`(`category_id` ASC) USING BTREE,
  INDEX `idx_sort`(`sort` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9016 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '维修内容表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for maintenance_plans
-- ----------------------------
DROP TABLE IF EXISTS `maintenance_plans`;
CREATE TABLE `maintenance_plans`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '计划ID',
  `plan_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '计划名称',
  `device_id` int UNSIGNED NOT NULL COMMENT '设备ID',
  `type` tinyint UNSIGNED NOT NULL COMMENT '类型:1预防性 2计划性',
  `cycle_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '周期类型:day/week/month/year',
  `cycle_value` int UNSIGNED NOT NULL COMMENT '周期值',
  `next_execute_time` date NOT NULL COMMENT '下次执行时间',
  `executor_id` int UNSIGNED NOT NULL COMMENT '执行人ID',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1启用 0停用',
  `last_execute_time` date NULL DEFAULT NULL COMMENT '上次执行时间',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '保养内容描述',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_device`(`device_id` ASC) USING BTREE,
  INDEX `idx_executor`(`executor_id` ASC) USING BTREE,
  INDEX `idx_next_time`(`next_execute_time` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '保养计划表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for maintenance_records
-- ----------------------------
DROP TABLE IF EXISTS `maintenance_records`;
CREATE TABLE `maintenance_records`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `plan_id` int UNSIGNED NOT NULL COMMENT '计划ID',
  `device_id` int UNSIGNED NOT NULL COMMENT '设备ID',
  `executor_id` int UNSIGNED NOT NULL COMMENT '执行人ID',
  `execute_time` date NOT NULL COMMENT '执行日期',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '保养内容',
  `images` json NULL COMMENT '照片',
  `cost` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '费用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_plan`(`plan_id` ASC) USING BTREE,
  INDEX `idx_device`(`device_id` ASC) USING BTREE,
  INDEX `idx_executor`(`executor_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '保养记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for marketing_cases
-- ----------------------------
DROP TABLE IF EXISTS `marketing_cases`;
CREATE TABLE `marketing_cases`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '案例ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '案例标题',
  `client_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '客户名称',
  `industry` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '行业',
  `cover_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '封面图片URL',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '案例详细内容',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态:1显示 0隐藏',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_industry`(`industry` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '案例管理表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for marketing_douyin_content
-- ----------------------------
DROP TABLE IF EXISTS `marketing_douyin_content`;
CREATE TABLE `marketing_douyin_content`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '内容ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '视频标题',
  `video_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '视频链接',
  `local_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'æœ¬åœ°å­˜å‚¨è·¯å¾„',
  `local_filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'æœ¬åœ°æ–‡ä»¶å',
  `cover` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '封面图片URL',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '视频描述/文案',
  `tags` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '话题标签，逗号分隔',
  `views` int NOT NULL DEFAULT 0 COMMENT '播放量',
  `likes` int NOT NULL DEFAULT 0 COMMENT '点赞数',
  `comments` int NOT NULL DEFAULT 0 COMMENT '评论数',
  `shares` int NOT NULL DEFAULT 0 COMMENT '分享数',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '状态:1发布 0草稿',
  `publish_time` timestamp NULL DEFAULT NULL COMMENT '发布时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_publish_time`(`publish_time` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '抖音内容表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for marketing_partners
-- ----------------------------
DROP TABLE IF EXISTS `marketing_partners`;
CREATE TABLE `marketing_partners`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '企业ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '企业名称',
  `logo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '企业Logo URL',
  `industry` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '所属行业',
  `contact_person` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '联系人',
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '联系电话',
  `cooperation_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '合作类型:供应商/客户/服务商/战略伙伴',
  `start_date` date NULL DEFAULT NULL COMMENT '合作开始日期',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '企业简介',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态:1合作中 0已终止',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_industry`(`industry` ASC) USING BTREE,
  INDEX `idx_cooperation_type`(`cooperation_type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '合作伙伴表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for marketing_publish_task
-- ----------------------------
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

-- ----------------------------
-- Table structure for marketing_service_config
-- ----------------------------
DROP TABLE IF EXISTS `marketing_service_config`;
CREATE TABLE `marketing_service_config`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '客服电话',
  `wechat` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '客服微信',
  `qq` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '客服QQ',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '客服邮箱',
  `work_time` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '工作时间',
  `qrcode` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '客服二维码URL',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '服务说明',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态:1启用 0禁用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '客服配置表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for mini_admin_permissions
-- ----------------------------
DROP TABLE IF EXISTS `mini_admin_permissions`;
CREATE TABLE `mini_admin_permissions`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `code` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'menu',
  `path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `icon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `sort` int NOT NULL DEFAULT 0,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_mini_admin_permissions_code`(`code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for mini_admin_role_permissions
-- ----------------------------
DROP TABLE IF EXISTS `mini_admin_role_permissions`;
CREATE TABLE `mini_admin_role_permissions`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id` int UNSIGNED NOT NULL,
  `permission_id` int UNSIGNED NOT NULL,
  `permissions` json NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_mini_admin_role_permission`(`role_id` ASC, `permission_id` ASC) USING BTREE,
  INDEX `fk_mini_admin_role_permissions_permission_id`(`permission_id` ASC) USING BTREE,
  CONSTRAINT `fk_mini_admin_role_permissions_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `mini_admin_permissions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_mini_admin_role_permissions_role_id` FOREIGN KEY (`role_id`) REFERENCES `mini_admin_roles` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for mini_admin_roles
-- ----------------------------
DROP TABLE IF EXISTS `mini_admin_roles`;
CREATE TABLE `mini_admin_roles`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_mini_admin_roles_code`(`code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for mini_admin_users
-- ----------------------------
DROP TABLE IF EXISTS `mini_admin_users`;
CREATE TABLE `mini_admin_users`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `real_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `role_id` int UNSIGNED NOT NULL,
  `last_login_at` datetime NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_mini_admin_users_username`(`username` ASC) USING BTREE,
  INDEX `idx_mini_admin_users_role_id`(`role_id` ASC) USING BTREE,
  CONSTRAINT `fk_mini_admin_users_role_id` FOREIGN KEY (`role_id`) REFERENCES `mini_admin_roles` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for miniprogram_order_mapping
-- ----------------------------
DROP TABLE IF EXISTS `miniprogram_order_mapping`;
CREATE TABLE `miniprogram_order_mapping`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `miniprogram_order_id` int NOT NULL COMMENT '小程序订单ID',
  `miniprogram_order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '小程序订单号',
  `cmms_order_id` int NULL DEFAULT NULL COMMENT 'CMMS后台订单ID',
  `sync_status` enum('not_synced','synced','sync_failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'not_synced' COMMENT '同步状态',
  `last_synced_at` datetime NULL DEFAULT NULL COMMENT '最后同步时间',
  `sync_error` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '同步错误信息',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_mp_order_id`(`miniprogram_order_id` ASC) USING BTREE,
  INDEX `uk_mp_order_no`(`miniprogram_order_no` ASC) USING BTREE,
  INDEX `idx_cmms_order_id`(`cmms_order_id` ASC) USING BTREE,
  INDEX `idx_sync_status`(`sync_status` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '小程序订单关联表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for miniprogram_progress_photo_sync
-- ----------------------------
DROP TABLE IF EXISTS `miniprogram_progress_photo_sync`;
CREATE TABLE `miniprogram_progress_photo_sync`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `miniprogram_order_id` int NOT NULL COMMENT '小程序订单ID',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '照片说明',
  `images` json NULL COMMENT '图片JSON数组',
  `uploaded_by` int NULL DEFAULT NULL COMMENT '上传人ID',
  `uploaded_by_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '上传人姓名',
  `synced_to_cmms` tinyint(1) NULL DEFAULT 0 COMMENT '是否已同步到CMMS:0-未同步,1-已同步',
  `cmms_progress_photo_id` int NULL DEFAULT NULL COMMENT 'CMMS进度照片ID',
  `synced_at` datetime NULL DEFAULT NULL COMMENT '同步时间',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_mp_order_id`(`miniprogram_order_id` ASC) USING BTREE,
  INDEX `idx_synced_to_cmms`(`synced_to_cmms` ASC) USING BTREE,
  INDEX `idx_cmms_photo_id`(`cmms_progress_photo_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '小程序进度照片同步记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for miniprogram_progress_sync
-- ----------------------------
DROP TABLE IF EXISTS `miniprogram_progress_sync`;
CREATE TABLE `miniprogram_progress_sync`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `miniprogram_order_id` int NOT NULL COMMENT '小程序订单ID',
  `progress` int NOT NULL DEFAULT 0 COMMENT '进度百分比(0-100)',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '订单状态',
  `synced_to_cmms` tinyint(1) NULL DEFAULT 0 COMMENT '是否已同步到CMMS:0-未同步,1-已同步',
  `synced_at` datetime NULL DEFAULT NULL COMMENT '同步时间',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_mp_order_id`(`miniprogram_order_id` ASC) USING BTREE,
  INDEX `idx_synced_to_cmms`(`synced_to_cmms` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '小程序进度同步记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for miniprogram_progress_video_sync
-- ----------------------------
DROP TABLE IF EXISTS `miniprogram_progress_video_sync`;
CREATE TABLE `miniprogram_progress_video_sync`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `miniprogram_order_id` int NOT NULL COMMENT '小程序订单ID',
  `video_title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '视频标题',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '视频说明',
  `video_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '视频URL',
  `cover_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '封面URL',
  `duration` int NULL DEFAULT 0 COMMENT '视频时长(秒)',
  `file_size` bigint NULL DEFAULT 0 COMMENT '文件大小(字节)',
  `uploaded_by` int NULL DEFAULT NULL COMMENT '上传人ID',
  `uploaded_by_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '上传人姓名',
  `synced_to_cmms` tinyint(1) NULL DEFAULT 0 COMMENT '是否已同步到CMMS:0-未同步,1-已同步',
  `cmms_progress_video_id` int NULL DEFAULT NULL COMMENT 'CMMS进度视频ID',
  `synced_at` datetime NULL DEFAULT NULL COMMENT '同步时间',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_mp_order_id`(`miniprogram_order_id` ASC) USING BTREE,
  INDEX `idx_synced_to_cmms`(`synced_to_cmms` ASC) USING BTREE,
  INDEX `idx_cmms_video_id`(`cmms_progress_video_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '小程序进度视频同步记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for notifications
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知类型',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知内容',
  `related_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '关联类型(work_order,spare_part等)',
  `related_id` int UNSIGNED NULL DEFAULT NULL COMMENT '关联ID',
  `priority` tinyint UNSIGNED NOT NULL DEFAULT 2 COMMENT '优先级:1低 2普通 3高 4紧急',
  `is_read` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否已读:0未读 1已读',
  `read_at` datetime NULL DEFAULT NULL COMMENT '阅读时间',
  `extra_data` json NULL COMMENT '额外数据',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_read`(`is_read` ASC) USING BTREE,
  INDEX `idx_priority`(`priority` ASC) USING BTREE,
  INDEX `idx_related`(`related_type` ASC, `related_id` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 352 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '通知表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for order_devices
-- ----------------------------
DROP TABLE IF EXISTS `order_devices`;
CREATE TABLE `order_devices`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_id` int NOT NULL COMMENT '关联订单ID（repair.orders.id）',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '设备名称',
  `serial_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '序列号（同一设备可能出现在多订单，不全局唯一）',
  `source` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '设备来源：采购/客户自备/租赁/调拨/赠送',
  `quantity` decimal(10, 2) NOT NULL DEFAULT 1.00 COMMENT '数量',
  `unit` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '单位（默认 台）',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'normal' COMMENT '状态：normal正常/maintenance维修中/idle闲置/scrapped报废',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 64 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '订单设备明细表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for order_engineers
-- ----------------------------
DROP TABLE IF EXISTS `order_engineers`;
CREATE TABLE `order_engineers`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int UNSIGNED NOT NULL COMMENT '来源订单ID/展示用订单ID',
  `engineer_id` int UNSIGNED NOT NULL COMMENT '维修工程师ID',
  `role` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '角色:1主维修 2协助维修',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order`(`order_id` ASC) USING BTREE,
  INDEX `idx_engineer`(`engineer_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '工单工程师关联表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for organizations
-- ----------------------------
DROP TABLE IF EXISTS `organizations`;
CREATE TABLE `organizations`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '单位 ID',
  `parent_id` int UNSIGNED NULL DEFAULT NULL COMMENT '父单位 ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '单位名称',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '单位代码',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'company' COMMENT '单位类型：company 公司 department 部门 project 项目组',
  `contact` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '联系人',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '联系电话',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '地址',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1 启用 0 禁用',
  `notes` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
  INDEX `idx_parent`(`parent_id` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '单位表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for permissions
-- ----------------------------
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '权限 ID',
  `parent_id` int UNSIGNED NULL DEFAULT NULL COMMENT '父权限 ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限名称',
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限代码',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'menu' COMMENT '类型：menu 菜单 button 按钮',
  `path` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '路由路径',
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '图标',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1 启用 0 禁用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
  INDEX `idx_parent`(`parent_id` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 738 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '权限表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for personnel
-- ----------------------------
DROP TABLE IF EXISTS `personnel`;
CREATE TABLE `personnel`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '人员 ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '姓名',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '工号',
  `department_id` int UNSIGNED NULL DEFAULT NULL COMMENT '部门 ID',
  `position` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '岗位：engineer 工程师 supervisor 主管经理 manager 经理',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '手机号',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '邮箱',
  `entry_date` date NULL DEFAULT NULL COMMENT '入职日期',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1 在职 0 离职',
  `notes` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
  INDEX `idx_department`(`department_id` ASC) USING BTREE,
  INDEX `idx_position`(`position` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '人员表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for progress_apply
-- ----------------------------
DROP TABLE IF EXISTS `progress_apply`;
CREATE TABLE `progress_apply`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `apply_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '申请单号',
  `order_id` int NULL DEFAULT NULL COMMENT '关联订单ID',
  `customer_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '客户姓名',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '联系电话',
  `device_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '设备名称',
  `progress_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '进度类型: repair-维修进度, parts-配件到货, support-技术支援, inspection-验收申请, other-其他',
  `apply_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '申请原因',
  `expected_time` datetime NULL DEFAULT NULL COMMENT '期望完成时间',
  `approval_status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '审核状态',
  `approval_remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '审核意见',
  `approval_by` int NULL DEFAULT NULL COMMENT '审核人ID',
  `approval_at` datetime NULL DEFAULT NULL COMMENT '审核时间',
  `created_by` int NULL DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_apply_no`(`apply_no` ASC) USING BTREE,
  INDEX `idx_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_progress_type`(`progress_type` ASC) USING BTREE,
  INDEX `idx_approval_status`(`approval_status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '进度申请表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for progress_photo
-- ----------------------------
DROP TABLE IF EXISTS `progress_photo`;
CREATE TABLE `progress_photo`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int NOT NULL COMMENT '订单ID',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '照片说明',
  `images` json NULL COMMENT '图片JSON数组',
  `uploaded_by` int NULL DEFAULT NULL COMMENT '上传人ID',
  `uploaded_by_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '上传人姓名',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order_id`(`order_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '进度照片表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for progress_video
-- ----------------------------
DROP TABLE IF EXISTS `progress_video`;
CREATE TABLE `progress_video`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int NOT NULL COMMENT '订单ID',
  `video_title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '视频标题',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '视频说明',
  `video_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '视频URL',
  `cover_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '封面URL',
  `duration` int NULL DEFAULT 0 COMMENT '视频时长(秒)',
  `file_size` bigint NULL DEFAULT 0 COMMENT '文件大小(字节)',
  `uploaded_by` int NULL DEFAULT NULL COMMENT '上传人ID',
  `uploaded_by_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '上传人姓名',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order_id`(`order_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '进度视频表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for quotation_items
-- ----------------------------
DROP TABLE IF EXISTS `quotation_items`;
CREATE TABLE `quotation_items`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '项目 ID',
  `quotation_id` int UNSIGNED NOT NULL COMMENT '报价单 ID',
  `item_type` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '项目类型:1 维修费 2 配件费 3 材料费 4 上门费 5 其他',
  `item_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '项目名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '项目描述',
  `quantity` decimal(10, 2) UNSIGNED NOT NULL DEFAULT 1.00 COMMENT '数量',
  `unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '项' COMMENT '单位',
  `unit_price` decimal(10, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '单价',
  `total_price` decimal(10, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '总价',
  `sort` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_quotation`(`quotation_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '报价单项目明细表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for quotation_orders
-- ----------------------------
DROP TABLE IF EXISTS `quotation_orders`;
CREATE TABLE `quotation_orders`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '报价单 ID',
  `quotation_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '报价单号 QT+YYYYMMDD+4 位序号',
  `order_id` int UNSIGNED NOT NULL COMMENT '关联订单 ID',
  `order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单号（冗余字段，便于查询）',
  `customer_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '客户名称',
  `customer_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '客户电话',
  `device_model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '设备型号',
  `fault_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '故障描述',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态:0 草稿 1 已提交 2 已接受 3 已拒绝 4 已转为工单',
  `total_amount` decimal(10, 2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '总金额',
  `discount` decimal(5, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '折扣率（百分比）',
  `discount_amount` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '折扣金额',
  `final_amount` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '最终金额',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '备注',
  `valid_until` date NULL DEFAULT NULL COMMENT '报价有效期',
  `accepted_by` int UNSIGNED NULL DEFAULT NULL COMMENT '接受人 ID',
  `accepted_at` timestamp NULL DEFAULT NULL COMMENT '接受时间',
  `rejected_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '拒绝原因',
  `created_by` int UNSIGNED NULL DEFAULT NULL COMMENT '创建人 ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_quotation_no`(`quotation_no` ASC) USING BTREE,
  UNIQUE INDEX `uk_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_order_no`(`order_no` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '报价单主表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for repair_categories
-- ----------------------------
DROP TABLE IF EXISTS `repair_categories`;
CREATE TABLE `repair_categories`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类 ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类编码',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '描述',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：1 启用 0 禁用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_sort`(`sort` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '机械分类表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for repair_contract_items
-- ----------------------------
DROP TABLE IF EXISTS `repair_contract_items`;
CREATE TABLE `repair_contract_items`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `contract_id` int UNSIGNED NOT NULL COMMENT '合同ID',
  `item_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '项目名称',
  `item_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '项目编号',
  `specification` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '规格型号',
  `unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '次' COMMENT '单位',
  `unit_price` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '单价',
  `quantity` decimal(10, 2) NULL DEFAULT 1.00 COMMENT '数量',
  `total_price` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '小计金额',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_contract_id`(`contract_id` ASC) USING BTREE,
  INDEX `idx_item_code`(`item_code` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '合同项目明细表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for repair_contracts
-- ----------------------------
DROP TABLE IF EXISTS `repair_contracts`;
CREATE TABLE `repair_contracts`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `contract_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '合同编号',
  `customer_id` int NULL DEFAULT NULL COMMENT '客户 ID',
  `customer_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '客户名称',
  `customer_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '客户电话',
  `machine_id` int NULL DEFAULT NULL COMMENT '机械 ID',
  `machine_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '机械类型',
  `start_date` date NOT NULL COMMENT '开始日期',
  `end_date` date NOT NULL COMMENT '结束日期',
  `sign_date` date NULL DEFAULT NULL COMMENT '签订日期',
  `annual_fee` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '合同金额',
  `service_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '服务内容',
  `service_terms` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '服务条款',
  `status` enum('draft','active','expired','terminated') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'draft' COMMENT '状态：draft-草稿，active-执行中，expired-已过期，terminated-已终止',
  `contract_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '合同文件路径',
  `attachments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '附件 (JSON 格式)',
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '图片 (JSON 格式)',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_contract_number`(`contract_number` ASC) USING BTREE,
  INDEX `idx_customer_id`(`customer_id` ASC) USING BTREE,
  INDEX `idx_customer_name`(`customer_name` ASC) USING BTREE,
  INDEX `idx_machine_id`(`machine_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_start_date`(`start_date` ASC) USING BTREE,
  INDEX `idx_end_date`(`end_date` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '维修合同表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for repair_machines
-- ----------------------------
DROP TABLE IF EXISTS `repair_machines`;
CREATE TABLE `repair_machines`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '机械 ID',
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '机械名称',
  `model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '型号',
  `category_id` int UNSIGNED NOT NULL COMMENT '分类 ID',
  `manufacturer` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '制造商',
  `power` decimal(10, 2) NULL DEFAULT NULL COMMENT '功率 (kW)',
  `weight` decimal(10, 2) NULL DEFAULT NULL COMMENT '工作重量 (吨)',
  `specifications` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '规格参数',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：1 启用 0 禁用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_category`(`category_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '机械名称表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for repair_progress
-- ----------------------------
DROP TABLE IF EXISTS `repair_progress`;
CREATE TABLE `repair_progress`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` int NOT NULL COMMENT '订单ID',
  `repair_report_id` int NULL DEFAULT NULL COMMENT '关联维修报告ID',
  `stage` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '阶段标识（中文）',
  `stage_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '阶段名称',
  `status` enum('pending','in_progress','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '状态：pending-待开始，in_progress-进行中，completed-已完成',
  `progress` int NULL DEFAULT 0 COMMENT '进度百分比',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '阶段描述',
  `handler_id` int NULL DEFAULT NULL COMMENT '处理人ID',
  `handler_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '处理人姓名',
  `start_time` datetime NULL DEFAULT NULL COMMENT '开始时间',
  `end_time` datetime NULL DEFAULT NULL COMMENT '结束时间',
  `attachments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '附件(JSON)',
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '图片(JSON)',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_repair_report_id`(`repair_report_id` ASC) USING BTREE,
  INDEX `idx_stage`(`stage` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '维修进度表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for repair_reminders
-- ----------------------------
DROP TABLE IF EXISTS `repair_reminders`;
CREATE TABLE `repair_reminders`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `repair_report_id` int NULL DEFAULT NULL COMMENT '关联维修报告 ID',
  `contract_id` int NULL DEFAULT NULL COMMENT '关联合同 ID',
  `machine_id` int NOT NULL COMMENT '机械 ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '提醒标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '提醒内容',
  `type` enum('maintenance','inspection','contract') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'maintenance' COMMENT '提醒类型：maintenance-保养，inspection-检测，contract-合同',
  `remind_date` date NOT NULL COMMENT '提醒日期',
  `remind_time` time NULL DEFAULT NULL COMMENT '提醒时间',
  `status` enum('pending','sent','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '状态：pending-待提醒，sent-已发送，completed-已完成，cancelled-已取消',
  `handler_id` int NULL DEFAULT NULL COMMENT '处理人 ID',
  `handler_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '处理人姓名',
  `completed_date` date NULL DEFAULT NULL COMMENT '完成日期',
  `notify_method` enum('system','email','sms','wechat') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'system' COMMENT '通知方式：system-系统通知，email-邮件，sms-短信，wechat-微信',
  `notify_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '通知内容',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `toaddrs` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '通知目标地址',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_repair_report_id`(`repair_report_id` ASC) USING BTREE,
  INDEX `idx_contract_id`(`contract_id` ASC) USING BTREE,
  INDEX `idx_machine_id`(`machine_id` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_remind_date`(`remind_date` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_handler_id`(`handler_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '维修提醒表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for repair_reports
-- ----------------------------
DROP TABLE IF EXISTS `repair_reports`;
CREATE TABLE `repair_reports`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `order_id` int NOT NULL COMMENT '订单 ID',
  `order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '订单号（来自电子维修库）',
  `source_order_id` int NULL DEFAULT NULL COMMENT '电子维修库原订单ID',
  `machine_id` int NULL DEFAULT NULL COMMENT '机械 ID',
  `report_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '报告编号',
  `machine_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '机械名称',
  `fault_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '故障描述',
  `repair_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '维修内容',
  `repairer_id` int NULL DEFAULT NULL COMMENT '维修人 ID',
  `repairer_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '维修人姓名',
  `repair_date` date NULL DEFAULT NULL COMMENT '维修日期',
  `completion_date` datetime NULL DEFAULT NULL COMMENT '完成时间',
  `repair_hours` decimal(5, 2) NULL DEFAULT NULL COMMENT '维修工时',
  `parts_used` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '使用配件 (JSON 格式)',
  `amount` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '维修金额',
  `status` enum('pending','repairing','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '状态：pending-待处理，repairing-维修中，completed-已完成',
  `attachments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '附件 (JSON 格式)',
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '图片 (JSON 格式)',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_report_number`(`report_number` ASC) USING BTREE,
  INDEX `idx_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_machine_id`(`machine_id` ASC) USING BTREE,
  INDEX `idx_repairer_id`(`repairer_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_repair_date`(`repair_date` ASC) USING BTREE,
  INDEX `idx_order_no`(`order_no` ASC) USING BTREE,
  INDEX `idx_source_order_id`(`source_order_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '维修报告表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for role_permissions
-- ----------------------------
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `role_id` int UNSIGNED NOT NULL COMMENT '角色 ID',
  `permission_id` int UNSIGNED NOT NULL COMMENT '权限 ID',
  `permissions` json NOT NULL COMMENT '细粒度权限配置 {\"canView\": true, \"canEdit\": false, \"canDelete\": false}',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_role_permission`(`role_id` ASC, `permission_id` ASC) USING BTREE,
  INDEX `idx_permission`(`permission_id` ASC) USING BTREE,
  INDEX `idx_role`(`role_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1521 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '角色权限关联表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for roles
-- ----------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色 ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色代码',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '角色描述',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1 启用 0 禁用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '角色表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for schedules
-- ----------------------------
DROP TABLE IF EXISTS `schedules`;
CREATE TABLE `schedules`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '排班ID',
  `engineer_id` int UNSIGNED NOT NULL COMMENT '工程师ID',
  `work_date` date NOT NULL COMMENT '工作日期',
  `shift_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '班次类型:morning/afternoon/night',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1正常 2请假',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_engineer_date`(`engineer_id` ASC, `work_date` ASC) USING BTREE,
  INDEX `idx_date`(`work_date` ASC) USING BTREE,
  INDEX `idx_engineer`(`engineer_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '排班表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for spare_parts
-- ----------------------------
DROP TABLE IF EXISTS `spare_parts`;
CREATE TABLE `spare_parts`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '配件ID',
  `part_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配件编号',
  `part_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配件名称',
  `category_id` int UNSIGNED NOT NULL COMMENT '分类ID',
  `specification` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '规格型号',
  `unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '单位',
  `supplier_id` int UNSIGNED NULL DEFAULT NULL COMMENT '供应商ID',
  `purchase_price` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '进货价',
  `sale_price` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '销售价',
  `stock_quantity` int NOT NULL DEFAULT 0 COMMENT '库存数量',
  `min_stock` int NOT NULL DEFAULT 0 COMMENT '最低库存预警',
  `warehouse_id` int UNSIGNED NULL DEFAULT NULL COMMENT '仓库ID',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1正常 0停用',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '描述',
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '配件图片URL',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`part_code` ASC) USING BTREE,
  INDEX `idx_category`(`category_id` ASC) USING BTREE,
  INDEX `idx_supplier`(`supplier_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 207 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '配件表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for statistics_expense_records
-- ----------------------------
DROP TABLE IF EXISTS `statistics_expense_records`;
CREATE TABLE `statistics_expense_records`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `expense_date` date NOT NULL COMMENT '支出日期',
  `category` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分类：purchase/salary/operation/other',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '支出说明',
  `amount` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '支出金额',
  `payment_method` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '支付方式',
  `operator` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '经办人',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_expense_date`(`expense_date` ASC) USING BTREE,
  INDEX `idx_category`(`category` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 21 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '开支统计记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for statistics_income_records
-- ----------------------------
DROP TABLE IF EXISTS `statistics_income_records`;
CREATE TABLE `statistics_income_records`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `record_date` date NOT NULL COMMENT '收入日期',
  `payment_method` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '收款方式：online/transfer',
  `order_count` int NOT NULL DEFAULT 1 COMMENT '订单数',
  `amount` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '收入金额',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '备注',
  `source_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'æ¥æºç±»åž‹: online/transfer/invoice',
  `source_id` int NULL DEFAULT NULL COMMENT 'æ¥æºè®°å½•ID',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_record_date`(`record_date` ASC) USING BTREE,
  INDEX `idx_payment_method`(`payment_method` ASC) USING BTREE,
  INDEX `idx_source`(`source_type` ASC, `source_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 54 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '收入统计记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for statistics_order_records
-- ----------------------------
DROP TABLE IF EXISTS `statistics_order_records`;
CREATE TABLE `statistics_order_records`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '订单号',
  `customer_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '客户名称',
  `machine_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '机械类型',
  `fault_desc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '故障描述',
  `amount` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '订单金额',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending' COMMENT '状态：pending/processing/completed/cancelled',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `source_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'æ¥æºç±»åž‹: order/quotation',
  `source_id` int NULL DEFAULT NULL COMMENT 'æ¥æºè®°å½•ID',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_order_no`(`order_no` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_source`(`source_type` ASC, `source_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 21 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '订单统计记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for statistics_timeout_records
-- ----------------------------
DROP TABLE IF EXISTS `statistics_timeout_records`;
CREATE TABLE `statistics_timeout_records`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '订单号',
  `customer_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '客户名称',
  `timeout_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '超时类型：response/repair/delivery',
  `timeout_minutes` int NOT NULL DEFAULT 0 COMMENT '超时分钟数',
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '超时原因',
  `responsible` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '责任人',
  `solution` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '处理方案',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_timeout_type`(`timeout_type` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '超时统计记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for stock_records
-- ----------------------------
DROP TABLE IF EXISTS `stock_records`;
CREATE TABLE `stock_records`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `part_id` int UNSIGNED NOT NULL COMMENT '配件ID',
  `type` tinyint UNSIGNED NOT NULL COMMENT '类型:1入库 2出库 3盘点',
  `quantity` int NOT NULL COMMENT '数量',
  `before_quantity` int UNSIGNED NOT NULL COMMENT '变更前数量',
  `after_quantity` int UNSIGNED NOT NULL COMMENT '变更后数量',
  `order_id` int UNSIGNED NULL DEFAULT NULL COMMENT '关联工单ID',
  `operator_id` int UNSIGNED NOT NULL COMMENT '操作人ID',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_part`(`part_id` ASC) USING BTREE,
  INDEX `idx_order`(`order_id` ASC) USING BTREE,
  INDEX `idx_operator`(`operator_id` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 308 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '库存记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for suppliers
-- ----------------------------
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '供应商ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '供应商名称',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '供应商编码',
  `contact_person` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '联系电话',
  `contact_email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '联系邮箱',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '地址',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1正常 0停用',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '描述',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 104 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '供应商表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for system_logs
-- ----------------------------
DROP TABLE IF EXISTS `system_logs`;
CREATE TABLE `system_logs`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志 ID',
  `log_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '日志类型：login, operation, error, system',
  `user_id` int UNSIGNED NULL DEFAULT NULL COMMENT '用户 ID',
  `operator` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '操作人',
  `module` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '模块',
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '操作动作',
  `ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'IP 地址',
  `params` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '请求参数',
  `result` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '操作结果',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_type`(`log_type` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_module`(`module` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 338 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '系统日志表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for system_params
-- ----------------------------
DROP TABLE IF EXISTS `system_params`;
CREATE TABLE `system_params`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '参数 ID',
  `group_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '参数分组',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '参数名称',
  `param_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '参数键',
  `param_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '参数值',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '参数描述',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_param_key`(`param_key` ASC) USING BTREE,
  INDEX `idx_group`(`group_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '系统参数表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for test_reports
-- ----------------------------
DROP TABLE IF EXISTS `test_reports`;
CREATE TABLE `test_reports`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `order_id` int NULL DEFAULT NULL COMMENT '订单 ID',
  `customer_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '客户名称',
  `machine_id` int NULL DEFAULT NULL COMMENT '机械 ID',
  `report_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '报告编号',
  `machine_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '机械名称',
  `machine_model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '机械型号',
  `test_date` date NULL DEFAULT NULL COMMENT '检测日期',
  `tester_id` int NULL DEFAULT NULL COMMENT '检测人 ID',
  `tester_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '检测人姓名',
  `test_items` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '检测项目 (JSON 格式)',
  `test_results` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '检测结果 (JSON 格式)',
  `test_result` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'qualified' COMMENT '检测结果 qualified/unqualified/partial',
  `test_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '检测描述',
  `suggestion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '处理建议',
  `conclusion` enum('qualified','unqualified','maintenance_required') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'qualified' COMMENT '检测结论：qualified-合格，unqualified-不合格，maintenance_required-需维修',
  `test_flow_status` enum('pending','testing','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending' COMMENT '检测流程状态',
  `status` tinyint(1) NULL DEFAULT 1 COMMENT '状态：1-正常，0-删除',
  `attachments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '附件 (JSON 格式)',
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '图片 (JSON 格式)',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_report_number`(`report_number` ASC) USING BTREE,
  INDEX `idx_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_machine_id`(`machine_id` ASC) USING BTREE,
  INDEX `idx_tester_id`(`tester_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_test_date`(`test_date` ASC) USING BTREE,
  INDEX `idx_customer_name`(`customer_name`(50) ASC) USING BTREE,
  INDEX `idx_test_flow_status`(`test_flow_status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '检测报告表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for user_roles
-- ----------------------------
DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE `user_roles`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int UNSIGNED NOT NULL COMMENT 'ç”¨æˆ· ID',
  `role_id` int UNSIGNED NOT NULL COMMENT 'è§’è‰² ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'åˆ›å»ºæ—¶é—´',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_role`(`user_id` ASC, `role_id` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_role`(`role_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'ç”¨æˆ·è§’è‰²å…³è”è¡¨' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码',
  `real_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '真实姓名',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '电话',
  `department_id` int UNSIGNED NULL DEFAULT NULL COMMENT '部门ID',
  `position` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '职位',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态:1正常 0禁用',
  `role_type` tinyint UNSIGNED NOT NULL DEFAULT 1,
  `role_id` int UNSIGNED NULL DEFAULT NULL COMMENT '角色 ID',
  `last_login_at` datetime NULL DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '最后登录IP',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_username`(`username` ASC) USING BTREE,
  INDEX `idx_department`(`department_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_role_id`(`role_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for work_order_logs
-- ----------------------------
DROP TABLE IF EXISTS `work_order_logs`;
CREATE TABLE `work_order_logs`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `order_id` int UNSIGNED NOT NULL COMMENT '工单ID',
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作类型:created/assigned/accepted/started/completed/verified/closed',
  `operator_id` int UNSIGNED NOT NULL COMMENT '操作人ID',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '备注',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order`(`order_id` ASC) USING BTREE,
  INDEX `idx_operator`(`operator_id` ASC) USING BTREE,
  INDEX `idx_action`(`action` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '工单日志表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for work_orders
-- ----------------------------
DROP TABLE IF EXISTS `work_orders`;
CREATE TABLE `work_orders`  (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '工单ID',
  `order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '工单号 WO+YYYYMMDD+4位序号',
  `device_id` int UNSIGNED NOT NULL COMMENT '设备ID',
  `reporter_id` int UNSIGNED NOT NULL COMMENT '报修人ID',
  `assigned_to` int UNSIGNED NULL DEFAULT NULL COMMENT '指派维修人ID',
  `fault_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '故障类型',
  `fault_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '故障描述',
  `priority` tinyint UNSIGNED NOT NULL DEFAULT 2 COMMENT '优先级:1低 2中 3高 4紧急',
  `status` tinyint UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态:0待派单 1已派单 2维修中 3待验收 4已完成 5已关闭',
  `start_time` timestamp NULL DEFAULT NULL COMMENT '开始维修时间',
  `complete_time` timestamp NULL DEFAULT NULL COMMENT '完成时间',
  `repair_record` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '维修记录',
  `repair_images` json NULL COMMENT '维修照片[\"url1\",\"url2\"]',
  `used_parts` json NULL COMMENT '使用配件[{\"partId\":1,\"quantity\":2}]',
  `cost_parts` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '配件成本',
  `cost_labor` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '人工成本',
  `total_cost` decimal(10, 2) UNSIGNED NULL DEFAULT 0.00 COMMENT '总成本',
  `reporter_rating` tinyint UNSIGNED NULL DEFAULT NULL COMMENT '报修人评分(1-5)',
  `reporter_feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '报修人反馈',
  `version` int UNSIGNED NOT NULL DEFAULT 1 COMMENT '版本号(乐观锁)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_order_no`(`order_no` ASC) USING BTREE,
  INDEX `idx_device`(`device_id` ASC) USING BTREE,
  INDEX `idx_reporter`(`reporter_id` ASC) USING BTREE,
  INDEX `idx_assigned`(`assigned_to` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_priority`(`priority` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE,
  INDEX `idx_status_priority`(`status` ASC, `priority` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '工单表' ROW_FORMAT = DYNAMIC;

SET FOREIGN_KEY_CHECKS = 1;
