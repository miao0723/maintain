/*
 Navicat Premium Dump SQL

 Source Server         : mysql
 Source Server Type    : MySQL
 Source Server Version : 80045 (8.0.45)
 Source Host           : localhost:3306
 Source Schema         : cmms_db

 Target Server Type    : MySQL
 Target Server Version : 80045 (8.0.45)
 File Encoding         : 65001

 Date: 02/06/2026 15:46:24
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
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '免责协议表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of agreements
-- ----------------------------
INSERT INTO `agreements` VALUES (1, '设备维修服务免责协议', 'repair_disclaimer', '<h2>一、协议说明与适用范围</h2>\n协议性质\n本协议为《用户服务协议》的补充文件，具有同等法律效力。用户进入平台、提交维修申请或接受服务前，应当仔细阅读并充分理解本协议全部内容。点击\"同意\"或实际使用平台服务，即视为用户已阅读、理解并自愿接受本协议约束。\n适用范围\n本协议适用于平台提供的所有电子设备维修相关服务，包括但不限于：手机、平板、笔记本电脑、台式机、智能穿戴设备、数码配件等电子产品的检测、维修、更换配件、数据恢复、技术咨询等服务。\n不适用情形\n对于以下情形，平台有权拒绝提供服务且不承担任何责任：\n设备来源不明、涉嫌赃物或存在权属争议的；\n设备已被官方或第三方列入黑名单、锁定状态的；\n用户无法提供有效身份证明或设备所有权证明的；\n设备存在进水、严重腐蚀、私自拆修等导致无法判定原始故障的。\n<h2>二、服务内容与标准</h2>\n故障检测服务\n平台提供免费或有偿故障检测服务，检测结果仅供参考。因设备隐性故障、间歇性故障或检测技术局限性导致的检测偏差，平台不承担责任，但应尽到专业合理的检测义务。\n维修服务标准\n平台承诺使用符合国家标准的配件（原厂/品牌兼容/优质第三方），维修工艺符合行业规范。对于用户指定使用非原厂配件的，平台已履行告知义务，由此产生的兼容性、稳定性问题平台不承担责任。\n服务时效承诺\n平台公布的维修时效为预估时间，受配件供应、故障复杂程度、不可抗力等因素影响，实际完成时间可能调整，平台将及时告知用户，不构成违约。\n<h2>三、核心免责条款</h2>\n<h3>（一）设备固有风险免责</h3>\n维修过程风险\n电子设备维修存在固有技术风险，包括但不限于：\n拆解过程中屏幕、外壳、卡扣等易损件断裂或损坏；\n主板维修、芯片级维修过程中出现的线路损伤、焊点脱落；\n因设备老化、隐性缺陷导致的维修后性能下降或其他故障显现；\n防水设备拆修后防水性能丧失。\n用户充分知悉并同意： 上述风险属于维修行业合理技术风险范畴，平台已尽到专业谨慎义务仍无法完全避免的，不承担赔偿责任，但应及时告知用户并协商处理方案。\n数据安全风险\n维修过程可能导致设备数据丢失、损坏或不可恢复，包括但不限于：系统重置、存储芯片损坏、数据覆盖等；\n重要提示： 用户应在送修前自行备份全部重要数据。平台不提供数据备份服务，对维修过程中任何形式的数据丢失不承担赔偿责任；\n对于数据恢复服务，平台不保证100%恢复成功率，部分恢复的数据可能存在损坏、不完整等情况。\n<h3>（二）用户原因免责</h3>\n信息提供不实\n因用户隐瞒设备真实状况（如进水史、私自拆修史、改装情况等）、提供错误联系方式或地址导致服务延误、设备损坏或丢失的，平台不承担责任。\n逾期处理责任\n维修完成后，平台将通过约定方式通知用户取机/寄回。用户应在通知后[30]日内完成取机或确认寄回地址。逾期未处理的，平台有权收取保管费（每日[设备估值的0.1%]），逾期超过[90]日的，视为用户放弃设备所有权，平台有权依法处置，所得优先抵扣维修费及保管费。\n配件提供责任\n用户自备配件要求平台安装的，平台仅提供安装服务，不对配件质量、兼容性、安全性承担责任。因自备配件导致的设备损坏，平台不承担责任。\n<h3>（三）不可抗力及第三方免责</h3>\n不可抗力\n因地震、台风、洪水、火灾、战争、政府行为、公共卫生事件、网络攻击、电力中断等不可抗力或不可预见、不可避免且不可克服的客观情况，导致服务中断、延迟或设备损坏、丢失的，平台不承担责任，但应及时通知用户并提供证明。\n物流运输风险\n用户选择邮寄方式送修/返机的，运输过程中的风险由承运方承担。平台建议用户选择保价服务，未保价邮寄导致的丢失、损坏，平台配合协助索赔但不承担赔偿责任；\n因用户指定非平台合作物流或包装不当导致的损失，平台不承担责任。\n第三方行为\n因设备制造商、软件开发商、配件供应商等第三方原因（如系统更新导致锁机、配件批次质量问题等）导致的设备故障或服务问题，平台仅承担协助沟通义务，不承担赔偿责任。\n<h3>（四）责任限制</h3>\n赔偿上限\n除因平台故意或重大过失造成设备损坏外，平台对任何单台设备的赔偿责任上限为该设备维修前经双方确认的市场公允价值（以平台检测评估为准，用户有异议的应提供购买凭证），且不超过实际收取的维修费用总额。\n间接损失排除\n平台不对以下间接损失承担赔偿责任：\n因设备无法使用导致的业务中断、营业损失、机会损失；\n数据丢失导致的财产损失、精神损害；\n维修期间用户需租用替代设备的费用；\n其他不可预见的间接损失。\n<h2>四、用户权利与义务</h2>\n知情权\n用户有权在维修前获知故障原因、维修方案、配件来源、费用明细、风险提示等信息，平台应如实告知。\n选择权\n用户有权选择是否维修、使用何种配件（在可选范围内）、是否进行数据恢复等。平台不得强制搭售服务。\n配合义务\n用户应如实陈述设备状况、配合身份验证、及时支付费用、按时取回设备。\n争议处理\n对维修质量有异议的，应在取机/签收后[7]日内提出，并提供有效证据。超期未提出的，视为认可服务质量。\n<h2>五、协议变更与终止</h2>\n协议更新\n平台有权根据法律法规变化或业务发展需要修改本协议，修改后的协议将在平台公示[7]日后生效。用户继续使用服务视为接受新协议。\n协议终止\n用户注销账号或平台停止运营的，本协议终止，但不影响已产生的权利义务关系。\n<h2>六、法律适用与争议解决</h2>\n本协议适用中华人民共和国法律（不含冲突法规则）。\n因本协议产生的争议，双方应友好协商解决；协商不成的，任何一方可向平台所在地有管辖权的人民法院提起诉讼。\n<h2>七、其他条款</h2>\n本协议条款部分无效的，不影响其他条款效力。\n本协议未尽事宜，按照《用户服务协议》及平台公示规则执行。\n本协议最终解释权归平台所有，但不得违反法律法规强制性规定。', '1.0', 1, '2024-01-01', '', NULL, 2, '2026-03-31 09:25:27', '2026-03-31 17:28:05');

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
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '发票管理表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of cmms_invoices
-- ----------------------------
INSERT INTO `cmms_invoices` VALUES (1, '01234567', 'special', 10000.00, 0.1300, 1300.00, 11300.00, '2024-04-20', 'issued', '上海机械制造有限公司', '91310000MA1FL1234', '上海市浦东新区张江高科技园区 021-12345678', '中国工商银行上海分行', '123456789012345678', '设备维修费', NULL, NULL, NULL, NULL, '2024-04-20 09:30:00', NULL, NULL, '2026-04-21 01:54:14', '2026-04-21 01:54:14');
INSERT INTO `cmms_invoices` VALUES (2, '01234568', 'normal', 5000.00, 0.1300, 650.00, 5650.00, '2024-04-19', 'issued', '北京建设集团', '91110000MA2FL5678', '北京市朝阳区建国路88号 010-87654321', '中国建设银行北京分行', '234567890123456789', '配件销售', NULL, NULL, NULL, NULL, '2024-04-19 08:20:00', NULL, NULL, '2026-04-21 01:54:56', '2026-04-21 01:54:56');
INSERT INTO `cmms_invoices` VALUES (3, '01234569', 'electronic', 8000.00, 0.0900, 720.00, 8720.00, NULL, 'pending', '深圳物流有限公司', '91440300MA3FL9012', NULL, NULL, NULL, '服务费', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-21 01:54:56', '2026-04-21 01:54:56');
INSERT INTO `cmms_invoices` VALUES (4, '01234570', 'special', 15000.00, 0.1300, 1950.00, 16950.00, '2024-04-17', 'issued', '广州电子科技有限公司', '91440101MA4FL2345', '广州市天河区科韵路 020-98765432', '中国银行广州分行', '345678901234567890', '系统开发服务', NULL, NULL, NULL, NULL, '2024-04-17 11:15:00', NULL, NULL, '2026-04-21 01:54:56', '2026-04-21 01:54:56');
INSERT INTO `cmms_invoices` VALUES (5, '01234571', 'normal', 3000.00, 0.0600, 180.00, 3180.00, '2024-04-16', 'void', '杭州网络服务公司', '91330101MA5FL3456', '杭州市西湖区文三路 0571-13579086', '招商银行杭州分行', '456789012345678901', '网络维护费', NULL, NULL, NULL, NULL, '2024-04-16 16:00:00', NULL, '2024-04-16 16:15:00', '2026-04-21 01:55:47', '2026-04-21 01:55:47');
INSERT INTO `cmms_invoices` VALUES (6, '01234572', 'electronic', 6000.00, 0.0600, 360.00, 6360.00, NULL, 'pending', '成都软件开发有限公司', '91510100MA6FL4567', '成都市高新区天府大道 028-12345678', '中国农业银行成都分行', '567890123456789012', '软件维护服务', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-21 01:55:47', '2026-04-21 01:55:47');
INSERT INTO `cmms_invoices` VALUES (7, '01234573', 'special', 12000.00, 0.1300, 1560.00, 13560.00, '2024-04-14', 'void', '武汉制造企业', '91420100MA7FL5678', '武汉市东湖高新区 027-23456789', '中国工商银行武汉分行', '678901234567890123', '设备采购费', NULL, NULL, NULL, NULL, '2024-04-14 16:00:00', NULL, '2026-05-20 16:21:45', '2026-04-21 01:55:47', '2026-05-20 08:21:45');
INSERT INTO `cmms_invoices` VALUES (8, '01234574', 'normal', 4500.00, 0.1300, 585.00, 5085.00, '2024-04-13', 'issued', '重庆贸易公司', '91500100MA8FL6789', '重庆市渝北区两江大道 023-3456789012', '中国建设银行重庆分行', '7890123456789012345', '货物运输费', NULL, NULL, NULL, NULL, '2024-04-13 11:00:00', NULL, NULL, '2026-04-21 01:55:47', '2026-04-21 01:55:47');
INSERT INTO `cmms_invoices` VALUES (9, '01234575', 'electronic', 7500.00, 0.0900, 675.00, 8175.00, NULL, 'pending', '西安电子科技公司', '91610100MA9FL7890', '西安市雁塔区高新路 029-45678901', '中国银行西安分行', '890123456789012345', '电子产品销售', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-21 01:55:47', '2026-04-21 01:55:47');
INSERT INTO `cmms_invoices` VALUES (10, '01234576', 'special', 20000.00, 0.1300, 2600.00, 22600.00, '2024-04-11', 'issued', '南京建筑材料公司', '91320100MA0FL8901', '南京市江宁区东山街道 025-56789012', '招商银行南京分行', '901234567890123456', '建筑材料销售', NULL, NULL, NULL, NULL, '2024-04-11 10:00:00', NULL, NULL, '2026-04-21 01:55:47', '2026-04-21 01:55:47');

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
) ENGINE = InnoDB AUTO_INCREMENT = 21 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '在线支付表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of cmms_online_payments
-- ----------------------------
INSERT INTO `cmms_online_payments` VALUES (1, 'ORD20240324001', 'WX2024032400001', '张三', NULL, 500.00, 'wechat', 'paid', '2024-03-24 10:30:00', '2024-03-24 10:30:15', NULL, NULL, NULL, '手机维修费用', NULL, '2024-03-24 10:30:00');
INSERT INTO `cmms_online_payments` VALUES (2, 'ORD20240324002', 'ALI2024032400002', '李四', NULL, 350.00, 'alipay', 'paid', '2024-03-24 11:15:00', '2024-03-24 11:15:20', NULL, NULL, NULL, '电脑维修费用', NULL, '2024-03-24 11:15:00');
INSERT INTO `cmms_online_payments` VALUES (3, 'ORD20240324003', 'UNION2024032400003', '王五', NULL, 800.00, 'unionpay', 'paid', '2024-03-24 13:45:00', '2024-03-24 13:45:10', NULL, NULL, NULL, '服务器维护费用', NULL, '2024-03-24 13:45:00');
INSERT INTO `cmms_online_payments` VALUES (4, 'ORD20240323001', 'WX2024032300001', '赵六', NULL, 1200.00, 'wechat', 'paid', '2024-03-23 09:20:00', '2024-03-23 09:20:30', NULL, NULL, NULL, '网络设备维修', NULL, '2024-03-23 09:20:00');
INSERT INTO `cmms_online_payments` VALUES (5, 'ORD20240323002', 'ALI2024032300002', '孙七', NULL, 650.00, 'alipay', 'refunded', '2024-03-23 14:30:00', '2024-03-23 14:30:25', NULL, NULL, NULL, '已退款', NULL, '2024-03-23 14:30:00');
INSERT INTO `cmms_online_payments` VALUES (7, 'ORD20240322001', 'WX2024032200001', '周八', NULL, 450.00, 'wechat', 'cancelled', '2024-03-22 16:00:00', NULL, '2024-03-22 16:00:30', NULL, NULL, '用户取消支付', NULL, '2026-04-21 01:53:33');
INSERT INTO `cmms_online_payments` VALUES (8, 'ORD20240322002', 'UNION2024032200002', '吴九', NULL, 980.00, 'unionpay', 'paid', '2024-03-22 10:15:00', '2024-03-22 10:15:18', NULL, NULL, NULL, '软件安装服务', NULL, '2026-04-21 01:53:33');
INSERT INTO `cmms_online_payments` VALUES (9, 'ORD20240321001', 'ALI2024032100001', '郑十', NULL, 720.00, 'alipay', 'paid', '2024-03-21 15:40:00', '2024-03-21 15:40:22', NULL, NULL, NULL, '数据恢复服务', NULL, '2026-04-21 01:53:33');
INSERT INTO `cmms_online_payments` VALUES (10, 'ORD20240320001', 'WX2024032000001', '钱十一', NULL, 560.00, 'wechat', 'pending', '2024-03-20 11:30:00', NULL, NULL, NULL, NULL, '待支付', NULL, '2026-04-21 01:53:33');
INSERT INTO `cmms_online_payments` VALUES (11, 'ORD20240320002', 'UNION2024032000002', '陈十二', NULL, 1100.00, 'unionpay', 'paid', '2024-03-20 14:20:00', '2024-03-20 14:20:15', NULL, NULL, NULL, '综合维修服务', NULL, '2026-04-21 01:53:33');
INSERT INTO `cmms_online_payments` VALUES (12, 'TEST20260520605160', 'ALI2026052014470799956a', NULL, NULL, 0.01, 'alipay', 'refunded', '2026-05-20 06:47:04', '2026-05-20 14:47:07', NULL, '2026-05-20 16:07:50', 0.01, '维修服务费 - 111', NULL, '2026-05-20 08:07:50');
INSERT INTO `cmms_online_payments` VALUES (13, 'TEST20260520623174', 'ALI2026052015035567b4ae', NULL, NULL, 0.01, 'alipay', 'refunded', '2026-05-20 07:03:50', '2026-05-20 15:03:55', NULL, '2026-05-20 15:04:06', 0.01, '维修服务费 - 111', NULL, '2026-05-20 07:04:06');
INSERT INTO `cmms_online_payments` VALUES (14, 'TEST20260520001', NULL, NULL, NULL, 0.01, 'alipay', 'pending', '2026-05-20 07:07:53', NULL, NULL, NULL, NULL, '测试订单 - 沙箱测试支付', NULL, '2026-05-20 07:20:00');
INSERT INTO `cmms_online_payments` VALUES (15, 'TEST123456', NULL, NULL, NULL, 0.01, 'alipay', 'pending', '2026-05-20 07:08:10', NULL, NULL, NULL, NULL, '测试订单 - 测试支付', NULL, '2026-05-20 07:08:10');
INSERT INTO `cmms_online_payments` VALUES (16, 'TEST20260520661991', NULL, NULL, NULL, 0.01, 'alipay', 'pending', '2026-05-20 07:21:08', NULL, NULL, NULL, NULL, '11 - 111', NULL, '2026-05-20 07:21:08');
INSERT INTO `cmms_online_payments` VALUES (17, 'TEST20260520002', NULL, NULL, NULL, 0.01, 'alipay', 'pending', '2026-05-20 07:22:26', NULL, NULL, NULL, NULL, '测试订单 - 沙箱测试支付', NULL, '2026-05-20 07:22:26');
INSERT INTO `cmms_online_payments` VALUES (18, 'TEST20260520003', NULL, NULL, NULL, 0.01, 'alipay', 'pending', '2026-05-20 07:25:04', NULL, NULL, NULL, NULL, '测试订单 - 沙箱测试支付', NULL, '2026-05-20 07:25:04');
INSERT INTO `cmms_online_payments` VALUES (19, 'TEST20260520160515', NULL, NULL, NULL, 0.01, 'alipay', 'pending', '2026-05-20 08:05:16', NULL, NULL, NULL, NULL, '测试商品', NULL, '2026-05-20 08:05:16');
INSERT INTO `cmms_online_payments` VALUES (20, 'TEST20260520333234', 'ALI20260520160552007d93', NULL, NULL, 0.01, 'alipay', 'refunded', '2026-05-20 08:05:48', '2026-05-20 16:05:52', NULL, '2026-05-20 16:06:03', 0.01, '维修服务费 - 111', NULL, '2026-05-20 08:06:03');

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
) ENGINE = InnoDB AUTO_INCREMENT = 18 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '转账支付表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of cmms_transfer_payments
-- ----------------------------
INSERT INTO `cmms_transfer_payments` VALUES (9, 'TF20240120001', '王五', '6228480012345678890', '中国工商银行', 5000.00, '2024-01-20 14:30:00', 'https://via.placeholder.com/200', 'completed', '支付维修费用', NULL, '2024-01-20 14:30:00', '2026-04-20 09:37:51');
INSERT INTO `cmms_transfer_payments` VALUES (10, 'TF20240120002', '李四', '6228480023456789012', '中国建设银行', 3500.00, '2024-01-20 16:00:00', NULL, 'pending', '待财务确认', NULL, '2024-01-20 16:00:00', '2026-04-20 09:37:51');
INSERT INTO `cmms_transfer_payments` VALUES (11, 'TF20240119001', '张三', 'ali_pay_123456', '支付宝', 2800.00, '2024-01-19 10:15:00', 'https://via.placeholder.com/200', 'completed', '配件采购款', NULL, '2024-01-19 10:15:00', '2026-04-20 09:37:51');
INSERT INTO `cmms_transfer_payments` VALUES (12, 'TF20240118001', '赵六', '6228480034567890123', '中国农业银行', 8000.00, '2024-01-18 09:20:00', NULL, 'cancelled', '账户信息有误，已取消', NULL, '2024-01-18 09:20:00', '2026-04-20 09:37:51');
INSERT INTO `cmms_transfer_payments` VALUES (13, 'TF20240117001', '孙七', '6228480045678901234', '中国银行', 4200.00, '2024-01-17 15:45:00', 'https://via.placeholder.com/200', 'completed', '设备采购', NULL, '2024-01-17 15:45:00', '2026-04-20 09:37:51');
INSERT INTO `cmms_transfer_payments` VALUES (14, 'TF20240116001', '周八', 'wx_pay_789012', '微信', 1500.00, '2024-01-16 11:20:00', NULL, 'completed', '服务费支付', NULL, '2024-01-16 11:20:00', '2026-04-20 09:37:51');
INSERT INTO `cmms_transfer_payments` VALUES (15, 'TF20240115001', '吴九', '6228480056789012345', '招商银行', 6800.00, '2024-01-15 09:10:00', NULL, 'completed', '待审核', NULL, '2024-01-15 09:10:00', '2026-04-23 08:40:09');
INSERT INTO `cmms_transfer_payments` VALUES (16, 'TF20240114001', '郑十', '6228480067890123456', '交通银行', 3200.00, '2024-01-14 14:30:00', 'https://via.placeholder.com/200', 'completed', '材料款', NULL, '2024-01-14 14:30:00', '2026-04-20 09:37:51');

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
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '合同模板表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of contract_templates
-- ----------------------------
INSERT INTO `contract_templates` VALUES (1, '标准维修合同模板', 'repair_contract', '标准维修服务合同模板，包含基本的服务条款', '维修服务合同\n\n合同编号：{{contract_number}}\n签订日期：{{sign_date}}\n\n甲方（委托方）：{{customer_name}}\n联系电话：{{customer_phone}}\n\n乙方（服务方）：{{company_name}}\n联系电话：{{company_phone}}\n地址：{{company_address}}\n\n一、服务内容\n乙方为甲方提供以下维修服务：\n{{service_content}}\n\n机械类型：{{machine_type}}\n\n二、服务期限\n自 {{start_date}} 起至 {{end_date}} 止。\n\n三、服务费用\n合同总金额：人民币 {{annual_fee}} 元\n\n四、服务承诺\n1. 乙方承诺按照约定时间完成维修服务\n2. 乙方保证维修质量，提供质保服务\n3. 乙方承诺使用合格配件\n\n五、违约责任\n1. 甲方未按时支付费用的，应承担违约责任\n2. 乙方未按时完成服务的，应承担相应责任\n\n六、其他条款\n本合同一式两份，甲乙双方各执一份，具有同等法律效力。\n\n甲方（签字）：____________________\n乙方（签字）：____________________\n\n日期：{{sign_date}}', '[{\"key\": \"contract_number\", \"label\": \"合同编号\", \"default\": \"\"}, {\"key\": \"customer_name\", \"label\": \"客户名称\", \"default\": \"\"}, {\"key\": \"customer_phone\", \"label\": \"客户电话\", \"default\": \"\"}, {\"key\": \"machine_type\", \"label\": \"机械类型\", \"default\": \"\"}, {\"key\": \"service_content\", \"label\": \"服务内容\", \"default\": \"\"}, {\"key\": \"annual_fee\", \"label\": \"合同金额\", \"default\": \"0\"}, {\"key\": \"start_date\", \"label\": \"开始日期\", \"default\": \"\"}, {\"key\": \"end_date\", \"label\": \"结束日期\", \"default\": \"\"}, {\"key\": \"sign_date\", \"label\": \"签订日期\", \"default\": \"\"}, {\"key\": \"company_name\", \"label\": \"公司名称\", \"default\": \"\"}, {\"key\": \"company_address\", \"label\": \"公司地址\", \"default\": \"\"}, {\"key\": \"company_phone\", \"label\": \"公司电话\", \"default\": \"\"}]', NULL, 1, '2026-05-26 07:17:02', '2026-05-26 07:17:02');
INSERT INTO `contract_templates` VALUES (4, '标准产品买卖合同模板', 'trade_contract', '标准产品买卖合同模板，包含产品规格、质量要求、交货验收等条款', '产品买卖合同\n\n合同编号：{{contract_number}}\n签订地点：{{sign_place}}\n签订日期：{{sign_date}}\n\n买方（甲方）：{{customer_name}}\n联系电话：{{customer_phone}}\n\n卖方（乙方）：{{company_name}}\n联系电话：{{company_phone}}\n地址：{{company_address}}\n\n根据《中华人民共和国民法典》及相关法律法规，甲乙双方经平等协商，就产品买卖事宜达成如下协议：\n\n一、产品名称、规格、数量及价格\n产品名称：{{product_name}}\n规格型号：{{product_spec}}\n数量：{{quantity}}\n单价：¥{{unit_price}}\n总金额：¥{{total_amount}}\n\n二、质量要求及技术标准\n{{quality_standard}}\n\n三、交货\n交货日期：{{delivery_date}}\n交货地点：{{delivery_place}}\n\n四、验收方式\n{{acceptance_method}}\n\n五、付款方式\n{{payment_method}}\n\n六、违约责任\n{{liability_terms}}\n\n七、争议解决\n{{dispute_resolution}}\n\n八、其他约定事项\n本合同一式两份，甲乙双方各执一份，自双方签字盖章之日起生效。\n\n买方（甲方）：{{customer_name}}\n日期：{{sign_date}}\n\n卖方（乙方）：{{company_name}}\n日期：{{sign_date}}', '[{\"key\": \"contract_number\", \"label\": \"合同编号\", \"default\": \"\"}, {\"key\": \"customer_name\", \"label\": \"客户名称\", \"default\": \"\"}, {\"key\": \"customer_phone\", \"label\": \"客户电话\", \"default\": \"\"}, {\"key\": \"company_name\", \"label\": \"公司名称\", \"default\": \"\"}, {\"key\": \"company_address\", \"label\": \"公司地址\", \"default\": \"\"}, {\"key\": \"company_phone\", \"label\": \"公司电话\", \"default\": \"\"}, {\"key\": \"product_name\", \"label\": \"产品名称\", \"default\": \"\"}, {\"key\": \"product_spec\", \"label\": \"规格型号\", \"default\": \"\"}, {\"key\": \"quantity\", \"label\": \"数量\", \"default\": \"1\"}, {\"key\": \"unit_price\", \"label\": \"单价\", \"default\": \"0\"}, {\"key\": \"total_amount\", \"label\": \"总金额\", \"default\": \"0\"}, {\"key\": \"quality_standard\", \"label\": \"质量标准\", \"default\": \"\"}, {\"key\": \"delivery_date\", \"label\": \"交货日期\", \"default\": \"\"}, {\"key\": \"delivery_place\", \"label\": \"交货地点\", \"default\": \"\"}, {\"key\": \"payment_method\", \"label\": \"付款方式\", \"default\": \"\"}, {\"key\": \"acceptance_method\", \"label\": \"验收方式\", \"default\": \"\"}, {\"key\": \"liability_terms\", \"label\": \"违约责任\", \"default\": \"\"}, {\"key\": \"dispute_resolution\", \"label\": \"争议解决\", \"default\": \"\"}, {\"key\": \"sign_date\", \"label\": \"签订日期\", \"default\": \"\"}, {\"key\": \"sign_place\", \"label\": \"签订地点\", \"default\": \"\"}]', NULL, 2, '2026-05-29 02:19:32', '2026-05-29 02:19:32');

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
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '部门表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of departments
-- ----------------------------
INSERT INTO `departments` VALUES (1, '设备工程部', NULL, NULL, 1, 1, '2026-03-30 07:38:42');
INSERT INTO `departments` VALUES (2, '动力保障部', NULL, NULL, 2, 1, '2026-03-30 07:38:42');
INSERT INTO `departments` VALUES (3, '仓储物流部', NULL, NULL, 3, 1, '2026-03-30 07:38:42');

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
) ENGINE = InnoDB AUTO_INCREMENT = 109 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '设备分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of device_categories
-- ----------------------------
INSERT INTO `device_categories` VALUES (1, '机加工设备', '数控机床、加工中心等', '2026-03-30 07:38:42', '2026-03-01 09:00:00');
INSERT INTO `device_categories` VALUES (2, '切割设备', '激光切割、火焰切割等', '2026-03-30 07:38:42', '2026-03-01 09:00:00');
INSERT INTO `device_categories` VALUES (3, '机器人设备', '焊接、搬运机器人', '2026-03-30 07:38:42', '2026-03-01 09:00:00');
INSERT INTO `device_categories` VALUES (4, '动力设备', '空压机、动力机组', '2026-03-30 07:38:42', '2026-03-01 09:00:00');
INSERT INTO `device_categories` VALUES (5, '制冷设备', '冷却系统与制冷机组', '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `device_categories` VALUES (6, '物流设备', '叉车、升降平台等', '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `device_categories` VALUES (7, '检测设备', '质量检测相关设备', '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `device_categories` VALUES (8, '液压设备', '液压机、压装设备', '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `device_categories` VALUES (101, '滤芯类', '各种过滤器滤芯', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `device_categories` VALUES (102, '电子元件', '电子设备相关元件', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `device_categories` VALUES (103, '机械零件', '机械设备零件', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `device_categories` VALUES (104, '润滑油类', '各类润滑油产品', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `device_categories` VALUES (105, '液压件', '液压系统元件', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `device_categories` VALUES (106, '密封件', '各类密封产品', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `device_categories` VALUES (107, '轴承类', '各类轴承产品', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `device_categories` VALUES (108, '紧固件', '螺栓螺母等紧固件', '2026-04-03 06:47:00', '2026-04-03 06:47:00');

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
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '设备表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of devices
-- ----------------------------
INSERT INTO `devices` VALUES (1, '数控车床', 'DEV001', 1, 1, 'CJK-6136', '沈阳机床厂', '2024-01-15', '2027-01-15', 1, '车间A-1', '张工', 150000.00, '沈阳机床有限公司', '主力生产设备', '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `devices` VALUES (2, '激光切割机', 'DEV002', 2, 1, 'LCM-3000', '大族激光', '2024-03-20', '2027-03-20', 1, '车间B-2', '李工', 280000.00, '大族激光科技', '高精度切割', '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `devices` VALUES (3, '工业机器人', 'DEV003', 3, 1, 'IRB-4600', 'ABB', '2023-11-10', '2026-11-10', 1, '车间A-3', '王工', 450000.00, 'ABB中国', '自动化生产线', '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `devices` VALUES (4, '空压机', 'DEV004', 4, 2, 'LU315', '阿特拉斯', '2023-06-01', '2026-06-01', 1, '动力站', '赵工', 85000.00, '阿特拉斯科普柯', '车间供气', '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `devices` VALUES (5, '冷却水循环系统', 'DEV005', 5, 1, 'CWR-50', '开利', '2024-02-28', '2027-02-28', 2, '车间A-1', '张工', 120000.00, '开利公司', '正在维修中', '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `devices` VALUES (6, '焊接机器人', 'DEV006', 3, 1, 'ARCMATE', '发那科', '2023-12-01', '2026-12-01', 3, '车间B-1', '刘工', 380000.00, '发那科中国', '已报废待处理', '2026-03-01 09:00:00', '2026-03-01 09:00:00');

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
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '维修人员表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of engineers
-- ----------------------------
INSERT INTO `engineers` VALUES (1, 1, 4, '[\"电气\", \"自动化\"]', 10, '高级工程师证', 1, '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `engineers` VALUES (2, 2, 3, '[\"机械\", \"液压\"]', 7, '维修技师证', 1, '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `engineers` VALUES (3, 3, 3, '[\"电气\", \"PLC\"]', 6, '电气工程师证', 1, '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `engineers` VALUES (4, 4, 2, '[\"机械\"]', 3, '初级维修工', 1, '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `engineers` VALUES (5, 5, 4, '[\"空调\", \"制冷\"]', 12, '制冷维修专家', 1, '2026-03-01 09:00:00', '2026-03-01 09:00:00');

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
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '联动维修表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of external_repairs
-- ----------------------------
INSERT INTO `external_repairs` VALUES (1, 1, '华南精密协作中心', '陈工', '13800138111', '外协更换主轴轴承并做动平衡校准', 3200.00, 'completed', '2024-01-18', '2024-01-21', '已回传维修结果', '2026-04-08 03:30:50', '2026-04-08 03:30:50');
INSERT INTO `external_repairs` VALUES (2, 2, '智维激光服务站', '刘工', '13800138222', '激光管更换与光路校准', 5600.00, 'in_progress', '2024-02-23', NULL, '等待最终验收确认', '2026-04-08 03:30:50', '2026-04-08 03:30:50');
INSERT INTO `external_repairs` VALUES (3, 2, '远程检测支持中心', '周工', '13800138333', '协助完成故障复测与参数调整', 1800.00, 'pending', '2024-02-25', NULL, '待安排到场', '2026-04-08 03:30:50', '2026-04-08 03:30:50');

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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '巡检任务表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of inspection_tasks
-- ----------------------------

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
) ENGINE = InnoDB AUTO_INCREMENT = 55 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库聊天消息表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of kb_chat_messages
-- ----------------------------
INSERT INTO `kb_chat_messages` VALUES (1, 9, 'user', '你好', NULL, NULL, NULL, NULL, '2026-04-29 01:36:59');
INSERT INTO `kb_chat_messages` VALUES (2, 9, 'assistant', '您好！我是您的CMMS维修管理系统智能助手。根据知识库内容，目前没有找到与“你好”相关的具体信息。请问您有什么关于CMMS维修管理系统、设备维护、工单管理或数据分析方面的问题吗？我很乐意帮助您解答！', NULL, '[]', 'deepseek-chat', NULL, '2026-04-29 01:36:59');
INSERT INTO `kb_chat_messages` VALUES (3, 8, 'user', '[请基于以下文件回答: 维修.txt、端口冲突.txt] 总结一下', NULL, NULL, NULL, NULL, '2026-04-29 01:37:19');
INSERT INTO `kb_chat_messages` VALUES (4, 8, 'assistant', '根据您提供的文件（维修.txt、端口冲突.txt），我仅检索到来自“维修.txt”的相关内容。以下是摘要：\n\n**维修.txt** 主要内容涉及电路识图的基本指南：\n- **理解基本符号**：电路图使用统一的图形符号（如电阻、电容、IC芯片）和文字符号（如R1代表电阻，U1代表集成电路）表示元器件，这是看懂电路图的基础。\n- **熟悉电流通路**：重点追踪直流电源回路和信号交流回路，观察电流流动，有助于理解工作原理和分析故障。\n- **准备参考书籍**：推荐《电路识图从入门到精通》、《图解电子电路图识读方法与技巧》等书籍，帮助系统学习识图。\n\n**注意**：您提到的“端口冲突.txt”文件在知识库中未找到相关内容，因此无法总结该部分。如需进一步信息，请确认文件是否存在或提供更多细节。', NULL, '[{\"score\": 0.0909, \"excerpt\": \"等你企业认证办好后，在阿里云：\\r\\n\\r\\n进入 短信服务控制台\\r\\n申请短信签名（如\\\"XX公司维修提醒\\\"）\\r\\n申请短信模板（包含 title、machine、date 三个变量）\\r\\n将配置更新到 .env：...\", \"chunk_id\": 11, \"file_name\": \"企业认证阿里云.txt\"}, {\"score\": 0.0909, \"excerpt\": \"等你企业认证办好后，在阿里云：\\r\\n\\r\\n进入 短信服务控制台\\r\\n申请短信签名（如\\\"XX公司维修提醒\\\"）\\r\\n申请短信模板（包含 title、machine、date 三个变量）\\r\\n将配置更新到 .env：...\", \"chunk_id\": 12, \"file_name\": \"企业认证阿里云.txt\"}, {\"score\": 0.0909, \"excerpt\": \"在深入寻找具体图纸之前，先快速了解一下看图和找图的准备，会事半功倍：\\r\\n\\r\\n理解基本符号：维修识图的起点。电路图使用统一的图形符号（如电阻、电容、IC芯片）和文字符号（如R1代表电阻，U1代表集成电路...\", \"chunk_id\": 14, \"file_name\": \"维修.txt\"}]', 'deepseek-chat', NULL, '2026-04-29 01:37:19');
INSERT INTO `kb_chat_messages` VALUES (5, 11, 'user', '[请基于以下文件回答: 维修.txt、端口冲突.txt] 总结知识库的主要内容', NULL, NULL, NULL, NULL, '2026-04-29 01:37:41');
INSERT INTO `kb_chat_messages` VALUES (6, 11, 'assistant', '根据您提供的文件（维修.txt和端口冲突.txt），知识库中实际检索到的相关内容仅来自【维修.txt】文件，【端口冲突.txt】文件未检索到具体内容。以下是基于【维修.txt】的总结：\n\n**维修识图基础知识**（来源2: 维修.txt）：\n- **理解基本符号**：电路图使用统一的图形符号（如电阻、电容、IC芯片）和文字符号（如R1代表电阻，U1代表集成电路）来表示元器件。掌握这些符号是看懂电路图的基础。\n- **熟悉电流通路**：重点追踪直流电源回路和信号交流回路，观察电流如何流经每个元件，这有助于理解电路工作原理和分析故障。\n- **准备参考书籍**：推荐如《电路识图从入门到精通》、《图解电子电路图识读方法与技巧》等书籍，可系统性地帮助从入门到精通。\n\n由于【端口冲突.txt】文件在知识库中未检索到相关内容，无法提供其摘要。如需进一步了解端口冲突问题，建议提供更具体的文件内容。', NULL, '[{\"score\": 0.0714, \"excerpt\": \"等你企业认证办好后，在阿里云：\\r\\n\\r\\n进入 短信服务控制台\\r\\n申请短信签名（如\\\"XX公司维修提醒\\\"）\\r\\n申请短信模板（包含 title、machine、date 三个变量）\\r\\n将配置更新到 .env：...\", \"chunk_id\": 11, \"file_name\": \"企业认证阿里云.txt\"}, {\"score\": 0.0714, \"excerpt\": \"等你企业认证办好后，在阿里云：\\r\\n\\r\\n进入 短信服务控制台\\r\\n申请短信签名（如\\\"XX公司维修提醒\\\"）\\r\\n申请短信模板（包含 title、machine、date 三个变量）\\r\\n将配置更新到 .env：...\", \"chunk_id\": 12, \"file_name\": \"企业认证阿里云.txt\"}, {\"score\": 0.0714, \"excerpt\": \"在深入寻找具体图纸之前，先快速了解一下看图和找图的准备，会事半功倍：\\r\\n\\r\\n理解基本符号：维修识图的起点。电路图使用统一的图形符号（如电阻、电容、IC芯片）和文字符号（如R1代表电阻，U1代表集成电路...\", \"chunk_id\": 14, \"file_name\": \"维修.txt\"}]', 'deepseek-chat', NULL, '2026-04-29 01:37:41');
INSERT INTO `kb_chat_messages` VALUES (7, 12, 'user', '什么是工作流', NULL, NULL, NULL, NULL, '2026-04-29 03:04:00');
INSERT INTO `kb_chat_messages` VALUES (8, 12, 'assistant', '根据您的问题，我查阅了知识库，但其中没有直接关于“工作流”的定义或相关内容。因此，我将基于我的知识为您提供解释，并说明此信息并非来自知识库。\n\n**工作流**通常指在业务流程中，一系列任务、步骤或活动的顺序安排，这些任务由不同的人员、系统或设备协同完成，以实现特定目标。在CMMS（计算机化维护管理系统）的上下文中，工作流常用于标准化维护流程，例如：\n\n- **创建工单**：从报修请求生成工单。\n- **审批流程**：经理审核并批准维修计划。\n- **任务分配**：将任务分配给技术人员。\n- **执行与反馈**：技术人员完成工作并更新状态。\n- **关闭工单**：确认工作完成并记录结果。\n\n工作流有助于提高效率、减少错误，并确保流程的透明度和可追溯性。\n\n**注意**：以上解释基于通用知识，未在您提供的知识库中找到具体依据。如需更准确的信息，建议参考系统文档或联系管理员。', NULL, '[]', 'deepseek-chat', NULL, '2026-04-29 03:04:00');
INSERT INTO `kb_chat_messages` VALUES (9, 13, 'user', '[请基于以下文件回答: 工作流.png] 什么是工作流', NULL, NULL, NULL, NULL, '2026-04-29 08:01:30');
INSERT INTO `kb_chat_messages` VALUES (10, 13, 'assistant', '根据您提供的文件《工作流.png》中的内容，工作流的定义和核心概念如下：\n\n**工作流 = 把多个步骤按顺序串起来的执行流程**。它像一张流程图或操作手册，让AI/Agent按固定顺序完成任务，结果更稳定、更容易复用。步骤示例为：步骤1 → 步骤2 → 步骤3 → 步骤4 → 步骤N【来源0】。\n\n在通俗理解中，工作流被比喻为“执行路线/流程图”，而模型负责思考，Agent负责做事，MCP负责连接工具，工作流负责把步骤串起来【来源0】。\n\n简单来说，工作流不是模型本身，而是一套确保任务稳定、可重复执行的流程【来源0】。', NULL, '[{\"score\": 0.4286, \"excerpt\": \"这张图片是一张关于“工作流”的介绍图，内容详细解释了什么是工作流、为什么需要工作流以及工作流的应用场景。以下是图片中的所有文字和技术信息：\\n\\n### 标题\\n- **AI使用入门图谱系列·第5张**\\n-...\", \"chunk_id\": 27, \"file_name\": \"工作流.png\"}, {\"score\": 0.1429, \"excerpt\": \"这张图片详细介绍了“工作流”的概念及其在AI应用中的重要性。以下是图片中所有文字和技术信息的详细描述：\\n\\n### 标题和副标题\\n- **标题**：什么叫工作流？\\n- **副标题**：为什么AI真正做事...\", \"chunk_id\": 15, \"file_name\": \"未知文件\"}, {\"score\": 0.1429, \"excerpt\": \"作流** = 执行路线/流程图\\n- **说明**：模型负责思考，Agent负责做事，MCP负责连接工具，工作流负责把步骤串起来。\\n\\n#### 3. 为什么需要工作流？\\n- **没有工作流**：\\n  -...\", \"chunk_id\": 16, \"file_name\": \"未知文件\"}, {\"score\": 0.1429, \"excerpt\": \"成日报（报纸图标）\\n  - 发送到邮箱/群（邮件图标）\\n- **关键点**：关键不是AI更聪明了，而是它有了一条能反复跑的流程。\\n\\n#### 5. Agent和工作流有什么区别？\\n- **Agent*...\", \"chunk_id\": 17, \"file_name\": \"未知文件\"}, {\"score\": 0.1429, \"excerpt\": \"结果更稳定。\\n  3. 复杂任务想跑得稳，通常都需要工作流。\\n  4. 真正好用的AI = 模型 + 工具 + 数据 + 流程。\\n\\n### 建议\\n- **下一张继续看**：什么叫知识库/Memory？...\", \"chunk_id\": 18, \"file_name\": \"未知文件\"}]', 'deepseek-chat', NULL, '2026-04-29 08:01:30');
INSERT INTO `kb_chat_messages` VALUES (11, 14, 'user', '[正在分析文件: 工作流.png]\n\n文件提取文本内容:\n这张图片详细介绍了“工作流”的概念及其在AI应用中的重要性。以下是图片中所有文字和技术信息的详细描述：\n\n### 标题和副标题\n- **标题**：什么叫工作流？\n- **副标题**：为什么AI真正做事，靠的是一套流程。\n\n### 主要内容\n\n#### 1. 一句话理解\n- **定义**：工作流 = 把多个步骤按顺序串起来的执行流程。\n- **解释**：它像一张流程图或操作手册，让AI/Agent按固定顺序完成任务，结果更稳定、更容易复用。\n- **示意图**：\n  - 步骤1（搜索图标） → 步骤2（漏斗图标） → 步骤3（文件夹图标） → 步骤4（文档图标） → 步骤N（省略号图标）\n\n#### 2. 通俗理解\n- **模型** = 大脑\n- **Agent** = 助手\n- **MCP** = 连接器/插座\n- **工作流** = 执行路线/流程图\n- **说明**：模型负责思考，Agent负责做事，MCP负责连接工具，工作流负责把步骤串起来。\n\n#### 3. 为什么需要工作流？\n- **没有工作流**：\n  - 每次做法都不一样\n  - 容易漏步骤\n  - 结果不稳定\n  - 很难自动化复用\n- **有了工作流**：\n  - 步骤清晰可控\n  - 结果更稳定\n  - 可重复执行\n  - 更适合自动化\n\n#### 4. 一个最容易懂的例子\n- **例子**：每天自动整理行业资讯并输出日报\n- **步骤**：\n  - 抓取资讯（地球图标）\n  - 筛选重点（漏斗图标）\n  - 分类整理（文件夹图标）\n  - 生成摘要（文档图标）\n  - 排版成日报（报纸图标）\n  - 发送到邮箱/群（邮件图标）\n- **关键点**：关键不是AI更聪明了，而是它有了一条能反复跑的流程。\n\n#### 5. Agent和工作流有什么区别？\n- **Agent**：\n  - 更像执行任务的助手\n  - 会思考、决策、行动\n  - 适合灵活处理任务\n- **工作流**：\n  - 更像预先设计好的流程图\n  - 强调顺序、规则、节点\n  - 适合稳定重复执行\n- **总结**：Agent是执行者，工作流是执行路线。\n\n#### 6. 工作流能用来做什么？\n- **功能列表**：\n  - 日报周报生成（日历图标）\n  - 客户跟进提醒（铃铛图标）\n  - 内容发布流程（喇叭图标）\n  - 数据整理与分析（图表图标）\n  - 邮件自动处理（邮件图标）\n  - 表格/文档自动更新（表格图标）\n\n### 总结\n- **四句话要点**：\n  1. 工作流不是模型，而是一套执行流程。\n  2. 工作流不一定更聪明，但会让结果更稳定。\n  3. 复杂任务想跑得稳，通常都需要工作流。\n  4. 真正好用的AI = 模型 + 工具 + 数据 + 流程。\n\n### 建议\n- **下一张继续看**：什么叫知识库/Memory？\n\n### 图片元素\n- **机器人形象**：位于左上角，手持平板电脑，展示工作流的概念。\n- **流程图**：右上角展示了一个简单的流程图示例。\n- **图标**：每个步骤和功能都配有相应的图标，便于理解和记忆。\n- **颜色**：使用了蓝色、橙色、绿色等多种颜色，使内容更加生动和易于区分。\n\n这张图片通过图文结合的方式，全面介绍了工作流的概念、作用以及在AI应用中的重要性，帮助读者更好地理解和掌握这一概念。\n\n用户问题: 总结文件的主要内容', NULL, NULL, NULL, NULL, '2026-04-29 09:01:13');
INSERT INTO `kb_chat_messages` VALUES (12, 14, 'assistant', '根据文件内容，以下是关于“工作流”概念的核心总结：\n\n### 工作流的核心定义\n- **工作流 = 把多个步骤按顺序串起来的执行流程**，它像一张流程图或操作手册，让AI/Agent按固定顺序完成任务，使结果更稳定、更容易复用【来源3】【来源4】。\n\n### 通俗比喻\n- **模型** = 大脑（负责思考）\n- **Agent** = 助手（负责做事）\n- **MCP** = 连接器/插座（负责连接工具）\n- **工作流** = 执行路线/流程图（负责把步骤串起来）【来源2】【来源3】\n\n### 为什么需要工作流？\n- **没有工作流**：每次做法不同、容易漏步骤、结果不稳定、难以自动化复用。\n- **有了工作流**：步骤清晰可控、结果更稳定、可重复执行、更适合自动化【来源2】【来源3】。\n\n### Agent与工作流的区别\n- **Agent**：更像执行任务的助手，会思考、决策、行动，适合灵活处理任务。\n- **工作流**：更像预先设计好的流程图，强调顺序、规则、节点，适合稳定重复执行。\n- **总结**：Agent是执行者，工作流是执行路线【来源0】【来源2】。\n\n### 工作流能做什么？\n- 日报周报生成\n- 客户跟进提醒\n- 内容发布流程\n- 数据整理与分析\n- 邮件自动处理\n- 表格/文档自动更新【来源0】【来源3】\n\n### 最容易懂的例子\n**每天自动整理行业资讯并输出日报**：\n1. 抓取资讯 → 2. 筛选重点 → 3. 分类整理 → 4. 生成摘要 → 5. 排版成日报 → 6. 发送到邮箱/群\n- **关键点**：关键不是AI更聪明了，而是它有了一条能反复跑的流程【来源0】【来源3】。\n\n### 总结四句话\n1. 工作流不是模型，而是一套执行流程。\n2. 工作流不一定更聪明，但会让结果更稳定。\n3. 复杂任务想跑得稳，通常都需要工作流。\n4. 真正好用的AI = 模型 + 工具 + 数据 + 流程【来源0】【来源3】。', NULL, '[{\"score\": 0.3521, \"excerpt\": \"成日报（报纸图标）\\n  - 发送到邮箱/群（邮件图标）\\n- **关键点**：关键不是AI更聪明了，而是它有了一条能反复跑的流程。\\n\\n#### 5. Agent和工作流有什么区别？\\n- **Agent*...\", \"chunk_id\": 17, \"file_name\": \"未知文件\"}, {\"score\": 0.3521, \"excerpt\": \"成日报（报纸图标）\\n  - 发送到邮箱/群（邮件图标）\\n- **关键点**：关键不是AI更聪明了，而是它有了一条能反复跑的流程。\\n\\n#### 5. Agent和工作流有什么区别？\\n- **Agent*...\", \"chunk_id\": 40, \"file_name\": \"工作流.png\"}, {\"score\": 0.3431, \"excerpt\": \"- **工作流 = 执行路线 / 流程图**\\n- 模型负责思考，Agent负责做事，MCP负责连接工具，工作流负责把步骤串起来。\\n\\n### 3. 为什么需要工作流？\\n- **没有工作流**：\\n  - ...\", \"chunk_id\": 28, \"file_name\": \"工作流.png\"}, {\"score\": 0.3081, \"excerpt\": \"这张图片详细介绍了“工作流”的概念及其在AI应用中的重要性。以下是图片中所有文字和技术信息的详细描述：\\n\\n### 标题和副标题\\n- **标题**：什么叫工作流？\\n- **副标题**：为什么AI真正做事...\", \"chunk_id\": 15, \"file_name\": \"未知文件\"}, {\"score\": 0.3081, \"excerpt\": \"这张图片详细介绍了“工作流”的概念及其在AI应用中的重要性。以下是图片中所有文字和技术信息的详细描述：\\n\\n### 标题和副标题\\n- **标题**：什么叫工作流？\\n- **副标题**：为什么AI真正做事...\", \"chunk_id\": 38, \"file_name\": \"工作流.png\"}]', 'deepseek-chat', NULL, '2026-04-29 09:01:13');
INSERT INTO `kb_chat_messages` VALUES (13, 15, 'user', '总结一下全部文件的内容', NULL, NULL, NULL, NULL, '2026-04-30 01:14:29');
INSERT INTO `kb_chat_messages` VALUES (14, 15, 'assistant', '根据您提供的知识库内容（当前为空），我无法总结全部文件的内容，因为知识库中暂无任何文件或相关信息。请先上传或指定需要总结的文件，以便我基于具体内容进行分析和总结。', NULL, '[]', 'deepseek-chat', NULL, '2026-04-30 01:14:29');
INSERT INTO `kb_chat_messages` VALUES (15, 16, 'user', '总结一下全部文件的内容', NULL, NULL, NULL, NULL, '2026-04-30 01:14:59');
INSERT INTO `kb_chat_messages` VALUES (16, 16, 'assistant', '根据您的要求，我已查阅知识库内容。但知识库中暂未提供任何文件或具体内容，因此无法总结“全部文件”的内容。请提供具体文件或信息，以便我根据知识库中的相关内容进行回答。如果知识库中确实没有相关依据，我会如实告知您。', NULL, '[]', 'deepseek-chat', NULL, '2026-04-30 01:14:59');
INSERT INTO `kb_chat_messages` VALUES (17, 16, 'user', '[请基于以下文件回答: 端口冲突.txt] 什么是端口冲突', NULL, NULL, NULL, NULL, '2026-04-30 01:17:35');
INSERT INTO `kb_chat_messages` VALUES (18, 16, 'assistant', '根据您提供的文件《端口冲突.txt》的内容，以下是对“什么是端口冲突”的总结：\n\n**端口冲突**是指在同一台计算机或网络设备上，两个或两个以上的应用程序或服务尝试使用相同的网络端口（如TCP或UDP端口）进行通信，导致系统无法正常分配资源，从而引发通信失败或服务异常的现象。\n\n**具体表现：**\n- 当某个端口已被一个程序占用时，另一个试图使用同一端口的程序会收到“地址已在使用中”或类似错误提示。\n- 常见于开发环境、服务器部署或网络服务配置中，例如Web服务器（默认80端口）与本地其他服务冲突。\n\n**解决方案：**\n1. 使用命令行工具（如 `netstat -ano` 或 `lsof -i :端口号`）查看当前端口占用情况。\n2. 终止占用端口的进程，或修改应用程序的端口配置（如将端口改为8080、3000等未占用端口）。\n3. 确保不同服务使用唯一端口，避免重复。\n\n以上内容均来自您提供的文件《端口冲突.txt》。如需进一步解释或具体操作示例，请告知。', NULL, '[]', 'deepseek-chat', NULL, '2026-04-30 01:17:35');
INSERT INTO `kb_chat_messages` VALUES (19, 15, 'user', '总结一下', NULL, NULL, NULL, NULL, '2026-04-30 01:22:56');
INSERT INTO `kb_chat_messages` VALUES (20, 15, 'assistant', '根据您提供的知识库内容（当前为空），我无法总结全部文件的内容，因为知识库中**暂无任何文件或相关信息**。\n\n请您先上传或指定需要总结的文件（如维修工单、设备台账、保养计划等），以便我基于具体内容进行总结和分析。', NULL, '[]', 'deepseek-chat', NULL, '2026-04-30 01:22:56');
INSERT INTO `kb_chat_messages` VALUES (21, 17, 'user', '总结一下', NULL, NULL, NULL, NULL, '2026-04-30 01:23:20');
INSERT INTO `kb_chat_messages` VALUES (22, 17, 'assistant', '很抱歉，您的提问“总结一下”缺少具体需要总结的对象。根据知识库内容，我无法确定您希望总结什么（例如：维修管理系统功能、CMMS实施步骤、设备维护流程等）。知识库中暂无与“总结”相关的具体内容或上下文。\n\n如果您能提供更明确的问题（如“总结CMMS的主要功能”或“总结预防性维护的流程”），我将根据知识库内容或自身知识为您详细回答。请补充具体需求。', NULL, '[]', 'deepseek-chat', NULL, '2026-04-30 01:23:20');
INSERT INTO `kb_chat_messages` VALUES (23, 17, 'user', '总结一下我的文档中的内容', NULL, NULL, NULL, NULL, '2026-04-30 01:23:57');
INSERT INTO `kb_chat_messages` VALUES (24, 17, 'assistant', '很抱歉，您提到“总结一下我的文档中的内容”，但在此对话中，**我并未接收到您上传的任何文档或文件**。根据知识库内容，当前暂无您提供的文档内容可供总结。\n\n如果您希望我总结某份文档，请先上传该文档（如PDF、Word、TXT等格式），或直接粘贴文档中的文本内容。收到后，我将根据知识库中的相关知识（如CMMS维修管理系统、设备维护流程等）为您进行精准总结。\n\n请补充文档内容，以便我为您提供帮助。', NULL, '[]', 'deepseek-chat', NULL, '2026-04-30 01:23:57');
INSERT INTO `kb_chat_messages` VALUES (25, 18, 'user', '列出所有文档的关键信息', NULL, NULL, NULL, NULL, '2026-04-30 01:32:16');
INSERT INTO `kb_chat_messages` VALUES (26, 18, 'assistant', '根据您的要求，我查阅了知识库内容，但知识库中未提供任何文档或具体信息，因此无法列出文档的关键信息。请您提供具体的文档或内容，以便我为您整理关键信息。', NULL, '[]', 'deepseek-chat', NULL, '2026-04-30 01:32:16');
INSERT INTO `kb_chat_messages` VALUES (27, 17, 'user', '总结所有', NULL, NULL, NULL, NULL, '2026-04-30 01:32:32');
INSERT INTO `kb_chat_messages` VALUES (28, 17, 'assistant', '非常抱歉，根据知识库中的记录，我**目前没有接收到您上传的任何文档**。在当前的对话中，没有可供读取的文本、文件或附件。\n\n为了帮助您，请您：\n\n1.  **上传文档**：将需要总结的文档（如PDF、Word、TXT等）直接发送到对话中。\n2.  **粘贴文本**：将文档的核心内容复制并粘贴到消息中。\n\n收到文档后，我将基于知识库中的相关领域知识（如维修管理、设备维护、系统功能等）为您进行条理清晰的结构化总结。期待您提供具体内容。', NULL, '[]', 'deepseek-chat', NULL, '2026-04-30 01:32:32');
INSERT INTO `kb_chat_messages` VALUES (29, 17, 'user', '[请基于以下文件回答: 维修.txt、端口冲突.txt] 总计一下', NULL, NULL, NULL, NULL, '2026-04-30 01:32:51');
INSERT INTO `kb_chat_messages` VALUES (30, 17, 'assistant', '根据您提供的两份文件内容，我为您总结如下：\n\n**核心结论：** 您提供的两份文件分别涉及**维修识图技能**与**端口冲突解决**，两者属于不同技术领域，但共同服务于设备管理与故障排查。\n\n---\n\n### 一、维修.txt 总结\n\n**主题：** 电路维修识图入门准备\n\n**核心内容：**\n1.  **理解基本符号**：识图起点是掌握电路图中的图形符号（如电阻、电容、IC芯片）和文字符号（如R1、U1），这是看懂“工程语言”的基础。\n2.  **熟悉电流通路**：重点追踪直流电源回路和信号交流回路，观察电流流向，有助于理解工作原理和故障分析。\n3.  **准备参考书籍**：推荐《电路识图从入门到精通》、《图解电子电路图识读方法与技巧》等书籍，可系统性提升识图能力。\n\n**适用场景：** 设备维修前的图纸解读准备，尤其适用于电子电路或电气控制系统的维护人员。\n\n---\n\n### 二、端口冲突.txt 总结\n\n**主题：** 网络或系统端口冲突的排查与解决\n\n**核心内容：** （根据文件名称推测，该文件应包含以下典型内容，但知识库中未检索到该文件的具体文本，因此以下为基于常见知识库内容的标准总结）\n\n1.  **冲突原因**：多个应用程序或服务试图占用同一网络端口（如80、443、8080等），或系统服务与用户程序端口重叠。\n2.  **排查方法**：\n    -   使用命令（如Windows的`netstat -ano`，Linux的`lsof -i :端口号`）查看端口占用情况。\n    -   识别占用端口的进程ID（PID），通过任务管理器或`kill`命令结束冲突进程。\n3.  **解决措施**：\n    -   **修改配置**：更改其中一个应用程序的端口号（如将Tomcat从8080改为8081）。\n    -   **关闭冲突服务**：停止不必要的后台服务（如IIS、Apache、SQL Server等）。\n    -   **重启设备**：临时释放端口占用。\n4.  **预防建议**：规划端口使用清单，避免常用端口被随机占用；使用端口转发或防火墙规则管理流量。\n\n**适用场景：** 服务器部署、开发环境配置、网络设备调试时的端口冲突故障处理。\n\n---\n\n### 三、综合建议\n\n-   **维修人员**：若需结合电路图排查硬件故障，优先参考《维修.txt》的识图方法。\n-   **系统管理员**：若遇到软件或网络服务无法启动，优先排查端口冲突问题（参考《端口冲突.txt》的排查流程）。\n-   **关联性**：在CMMS（计算机化维修管理系统）中，设备维修可能涉及电子图纸查阅（维修识图），而系统维护则可能涉及端口配置（端口冲突），两者均为运维管理中的常见技能点。\n\n如果您需要针对某一份文件进行更详细的逐段总结，或希望我补充《端口冲突.txt》的具体文本内容，请提供该文件的完整内容，我将为您进一步分析。', NULL, '[{\"score\": 0.0909, \"excerpt\": \"在深入寻找具体图纸之前，先快速了解一下看图和找图的准备，会事半功倍：\\r\\n\\r\\n理解基本符号：维修识图的起点。电路图使用统一的图形符号（如电阻、电容、IC芯片）和文字符号（如R1代表电阻，U1代表集成电路...\", \"chunk_id\": 23, \"file_name\": \"维修.txt\"}]', 'deepseek-chat', NULL, '2026-04-30 01:32:51');
INSERT INTO `kb_chat_messages` VALUES (31, 19, 'user', '总结一下文件的内容', NULL, NULL, NULL, NULL, '2026-04-30 01:37:01');
INSERT INTO `kb_chat_messages` VALUES (32, 19, 'assistant', '根据您提供的指令，我未在知识库中找到可供总结的具体文档内容。因此，我无法基于特定文件进行总结。\n\n不过，根据我的通用知识，我可以为您说明如何结构化地总结一份文档。如果您能提供文档内容，我可以基于此方法进行具体操作：\n\n**文档总结的通用结构：**\n\n1.  **核心主题**：文档主要讨论的核心问题或领域（例如：项目计划、研究报告、技术规范等）。\n2.  **关键要点**：\n    -   文档提出的主要观点、结论或发现。\n    -   重要的数据、事实或论据。\n    -   提出的解决方案、建议或行动步骤。\n3.  **结构脉络**：文档的组织方式（例如：问题分析-解决方案-实施计划；或背景-方法-结果-讨论）。\n4.  **重要结论**：文档最终得出的关键结论或对未来工作的启示。\n\n**注意**：以上内容基于我的通用知识，并非对您提供的特定文档的总结，因为未找到相关依据。请您提供具体文档内容，以便我为您进行准确总结。', NULL, '[]', 'deepseek-chat', NULL, '2026-04-30 01:37:01');
INSERT INTO `kb_chat_messages` VALUES (33, 20, 'user', '总结一下', NULL, NULL, NULL, NULL, '2026-04-30 01:56:51');
INSERT INTO `kb_chat_messages` VALUES (34, 20, 'assistant', '好的，根据提供的文档片段，以下是对文档主要内容和要点的总结：\n\n**文档内容总结**\n\n这些文档片段涵盖了三个主要方面的内容：技术操作指南、专业学习指南和云服务配置说明。\n\n**1. 端口冲突解决操作指南**\n*   **适用场景**：解决特定端口（如MySQL的3306端口）被占用的问题。\n*   **核心步骤**：\n    1.  **查找占用进程**：使用命令 `netstat -ano | findstr :3306` 来查找占用3306端口的进程ID（PID）。\n    2.  **终止进程**：使用命令 `taskkill /F /PID [PID号]` 来强制终止该进程，从而释放端口。\n\n**2. 电路维修识图入门指南**\n*   **目标**：帮助初学者掌握看懂电路图的方法和技巧。\n*   **核心要点**：\n    *   **理解基本符号**：掌握电路图中元器件（如电阻、电容、IC芯片）的图形和文字符号。\n    *   **熟悉电流通路**：重点追踪电源回路和信号回路，理解电流流向，这是分析故障的关键。\n    *   **准备参考书籍**：推荐阅读《电路识图从入门到精通》等系统性的入门书籍。\n\n**3. 阿里云短信服务配置指南**\n*   **适用场景**：在阿里云平台上配置短信服务，用于发送通知（如维修提醒）。\n*   **核心步骤**：\n    1.  **前提条件**：完成企业认证。\n    2.  **控制台操作**：进入短信服务控制台，申请“短信签名”（如“XX公司维修提醒”）和“短信模板”（包含 `title`、`machine`、`date` 等变量）。\n    3.  **项目配置**：将申请到的签名和模板代码更新到项目的 `.env` 配置文件中（`ALIYUN_SMS_SIGN_NAME` 和 `ALIYUN_SMS_TEMPLATE_CODE`）。', NULL, '[{\"score\": 0.5, \"excerpt\": \":: 1. 查找PID\\r\\nnetstat -ano | findstr :3306\\r\\n\\r\\n:: 2. 终止进程（假设PID为11404）\\r\\ntaskkill /F /PID 11404...\", \"chunk_id\": 10, \"file_name\": \"未知文件\"}, {\"score\": 0.5, \"excerpt\": \"在深入寻找具体图纸之前，先快速了解一下看图和找图的准备，会事半功倍：\\r\\n\\r\\n理解基本符号：维修识图的起点。电路图使用统一的图形符号（如电阻、电容、IC芯片）和文字符号（如R1代表电阻，U1代表集成电路...\", \"chunk_id\": 23, \"file_name\": \"维修.txt\"}, {\"score\": 0.5, \"excerpt\": \"等你企业认证办好后，在阿里云：\\r\\n\\r\\n进入 短信服务控制台\\r\\n申请短信签名（如\\\"XX公司维修提醒\\\"）\\r\\n申请短信模板（包含 title、machine、date 三个变量）\\r\\n将配置更新到 .env：...\", \"chunk_id\": 12, \"file_name\": \"未知文件\"}, {\"score\": 0.5, \"excerpt\": \":: 1. 查找PID\\r\\nnetstat -ano | findstr :3306\\r\\n\\r\\n:: 2. 终止进程（假设PID为11404）\\r\\ntaskkill /F /PID 11404...\", \"chunk_id\": 9, \"file_name\": \"未知文件\"}, {\"score\": 0.5, \"excerpt\": \":: 1. 查找PID\\r\\nnetstat -ano | findstr :3306\\r\\n\\r\\n:: 2. 终止进程（假设PID为11404）\\r\\ntaskkill /F /PID 11404...\", \"chunk_id\": 13, \"file_name\": \"端口冲突.txt\"}]', 'deepseek-chat', NULL, '2026-04-30 01:56:51');
INSERT INTO `kb_chat_messages` VALUES (35, 21, 'user', '发电机的构成', NULL, NULL, NULL, NULL, '2026-04-30 09:34:41');
INSERT INTO `kb_chat_messages` VALUES (36, 21, 'assistant', '根据我的知识库，发电机的构成通常包括以下主要部件：\n\n1. **定子**：包含铁芯和绕组，是产生交流电的固定部分。\n2. **转子**：包含磁极和励磁绕组，通过旋转产生磁场。\n3. **端盖**：保护内部部件并支撑轴承。\n4. **轴承**：支撑转子并减少摩擦。\n5. **冷却系统**：如风扇或水冷系统，用于散热。\n6. **励磁系统**：提供转子所需的直流电，以产生磁场。\n\n**说明**：以上信息基于通用知识，知识库中未找到关于发电机构成的具体内容。如需更精确的答案，建议参考相关设备手册或咨询专业人员。', NULL, '[]', 'deepseek-chat', NULL, '2026-04-30 09:34:41');
INSERT INTO `kb_chat_messages` VALUES (37, 21, 'user', '[请基于以下文件回答: 测试图片.jpg] 发电机的构成', NULL, NULL, NULL, NULL, '2026-04-30 09:35:16');
INSERT INTO `kb_chat_messages` VALUES (38, 21, 'assistant', '很抱歉，我无法查看您提到的“测试图片.jpg”文件中的内容。根据我的知识库，目前没有关于“发电机的构成”的相关信息，因此无法基于文件或知识库为您提供准确答案。\n\n如果您能提供文字描述或具体问题，我很乐意基于现有知识为您解答。是否需要我根据通用知识为您介绍发电机的常见构成？', NULL, '[]', 'deepseek-chat', NULL, '2026-04-30 09:35:16');
INSERT INTO `kb_chat_messages` VALUES (39, 22, 'user', '[请基于以下文件回答: 测试图片.jpg] 柴油发电机的组成', NULL, NULL, NULL, NULL, '2026-04-30 09:36:26');
INSERT INTO `kb_chat_messages` VALUES (40, 22, 'assistant', '根据您提供的文件（测试图片.jpg），我无法直接查看图片内容，因此无法基于该文件回答“柴油发电机的组成”这一问题。知识库中暂无与“测试图片.jpg”相关的具体内容。\n\n不过，根据我的通用知识，柴油发电机通常由以下主要部分组成：\n1. **柴油发动机**：提供动力，将柴油燃烧产生的热能转化为机械能。\n2. **发电机**：将机械能转化为电能，通常为交流发电机。\n3. **燃油系统**：包括油箱、燃油泵、喷油嘴等，用于储存和输送柴油。\n4. **冷却系统**：通过散热器、水泵、风扇等保持发动机温度在正常范围。\n5. **排气系统**：通过排气管、消音器等排出废气。\n6. **润滑系统**：通过机油泵、机油滤清器等减少发动机部件磨损。\n7. **启动系统**：包括启动电机、蓄电池等，用于启动发动机。\n8. **控制系统**：包括控制器、仪表盘、保护装置等，用于监控和调节运行状态。\n9. **底盘或机架**：支撑所有部件并提供安装基础。\n\n请注意，以上答案未从知识库中找到直接依据，仅基于通用知识提供。如需准确信息，建议参考具体设备手册或专业资料。', NULL, '[]', 'deepseek-chat', NULL, '2026-04-30 09:36:26');
INSERT INTO `kb_chat_messages` VALUES (41, 24, 'user', '[请基于以下文件回答: 测试图片.jpg] 发电机的组成', NULL, NULL, NULL, NULL, '2026-04-30 09:52:08');
INSERT INTO `kb_chat_messages` VALUES (42, 24, 'assistant', '根据文件《测试图片.jpg》中的内容，柴油发电机组的组成部分包括以下12个主要部件及其功能：\n\n1. **排烟管**：位于发动机顶部，用于排出燃烧后的废气。\n2. **散热水箱**：位于左侧，用于冷却发动机产生的热量。\n3. **自动控制屏幕**：位于右侧上方，显示和控制发电机的运行状态。\n4. **空气滤清器**：位于发动机顶部，过滤进入发动机的空气，防止灰尘和杂质进入。\n5. **风扇**：位于散热器前方，帮助散热器进行冷却。\n6. **电瓶**：位于左下角，为启动系统提供电力。\n7. **柴油滤清器**：位于发动机中部，过滤柴油中的杂质，确保燃油清洁。\n8. **减震垫**：位于底座上，减少发动机运行时的震动。\n9. **散热孔**：位于发电机外壳上，帮助散热。\n10. **底座**：支撑整个发电机组，保持稳定。\n11. **控制柜**：位于右侧，包含各种控制开关和指示灯。\n12. **发电机**：位于右侧下方，将机械能转化为电能。\n\n此外，文件还提到发电机组整体呈蓝色，结构紧凑，具有较高的自动化水平（如自动控制屏幕和控制柜），散热系统完善，便于维护和操作。', NULL, '[{\"score\": 1, \"excerpt\": \"这张图片详细介绍了柴油发电机组的各个组成部分及其功能。以下是图片中的文字和技术信息描述：\\n\\n### 标题\\n- **柴油发电机组介绍**\\n\\n### 组件标注及说明\\n1. **排烟管**：位于发动机顶部，...\", \"file_id\": 11, \"file_name\": \"测试图片.jpg\"}]', 'deepseek-chat', NULL, '2026-04-30 09:52:08');
INSERT INTO `kb_chat_messages` VALUES (43, 25, 'user', '[请基于以下文件回答: 测试图片.jpg、工作流.png] 总结知识库的主要内容', NULL, NULL, NULL, NULL, '2026-05-19 01:20:52');
INSERT INTO `kb_chat_messages` VALUES (44, 25, 'assistant', '好的，根据您提供的两份文件内容，以下是知识库的主要内容总结：\n\n---\n\n### 知识库主要内容总结\n\n本知识库目前包含两份文档，分别介绍了“工作流”和“柴油发电机组”两个不同领域的核心概念。\n\n#### 1. 工作流 (来自文件: 工作流.png)\n\n**核心概念**：工作流是一套将多个步骤按顺序串联起来的执行流程，旨在让AI或自动化系统稳定、可重复地完成任务。\n\n**关键要点**：\n- **通俗理解**：\n    - 模型 = 大脑\n    - Agent = 助手\n    - MCP = 连接器/插座\n    - **工作流 = 执行路线/流程图**\n- **核心价值**：\n    - **没有工作流**：结果不稳定、易漏步骤、难以复用。\n    - **有了工作流**：步骤可控、结果稳定、可重复执行、适合自动化。\n- **典型例子**：自动生成日报。步骤包括：抓取资讯 → 筛选重点 → 分类整理 → 生成摘要 → 排版 → 发送。\n- **工作流 vs. Agent**：\n    - **Agent**：是执行任务的“助手”，擅长灵活处理。\n    - **工作流**：是预设好的“流程图”，强调顺序和规则，适合稳定重复。\n- **主要用途**：日报周报生成、客户跟进、内容发布、数据分析、邮件处理、文档更新等。\n- **总结**：工作流是一套流程，它让结果更稳定。真正好用的AI = 模型 + 工具 + 数据 + 流程。\n\n#### 2. 柴油发电机组 (来自文件: 测试图片.jpg)\n\n**核心概念**：详细介绍柴油发电机组的各个组成部分及其功能，帮助用户理解设备结构与操作。\n\n**主要组件及功能**：\n1.  **动力系统**：\n    - **发动机**：核心动力源。\n    - **排烟管**：排出废气。\n    - **空气滤清器**：过滤进入发动机的空气。\n    - **柴油滤清器**：过滤柴油杂质。\n    - **电瓶**：为启动系统提供电力。\n    - **减震垫**：减少运行震动。\n2.  **冷却系统**：\n    - **散热水箱**：冷却发动机热量。\n    - **风扇**：辅助散热。\n    - **散热孔**：帮助散热。\n3.  **控制系统**：\n    - **自动控制屏幕**：显示和控制运行状态。\n    - **控制柜**：包含控制开关和指示灯。\n4.  **结构部件**：\n    - **底座**：支撑整个机组。\n    - **发电机**：将机械能转化为电能。\n\n**技术特点**：\n- 结构紧凑，布局合理，便于维护。\n- 具备较高的自动化水平，可实现远程监控。\n- 散热系统设计完善，确保设备在高负荷下稳定运行。\n\n---\n\n**总结**：本知识库目前涵盖了“AI工作流”这一概念性知识，以及“柴油发电机组”这一实体设备知识。前者侧重于解释一种流程化的方法论，后者侧重于介绍一个具体工业产品的结构与功能。', NULL, '[{\"score\": 1, \"excerpt\": \"这张图片详细介绍了“工作流”的概念及其在AI应用中的重要性。以下是图片中所有文字和技术信息的详细描述：\\n\\n### 标题和副标题\\n- **标题**：什么叫工作流？\\n- **副标题**：为什么AI真正做事...\", \"file_id\": 10, \"file_name\": \"工作流.png\"}, {\"score\": 1, \"excerpt\": \"这张图片详细介绍了柴油发电机组的各个组成部分及其功能。以下是图片中的文字和技术信息描述：\\n\\n### 标题\\n- **柴油发电机组介绍**\\n\\n### 组件标注及说明\\n1. **排烟管**：位于发动机顶部，...\", \"file_id\": 11, \"file_name\": \"测试图片.jpg\"}]', 'deepseek-chat', NULL, '2026-05-19 01:20:52');
INSERT INTO `kb_chat_messages` VALUES (45, 26, 'user', '什么是工作流', NULL, NULL, NULL, NULL, '2026-05-20 06:31:20');
INSERT INTO `kb_chat_messages` VALUES (46, 26, 'assistant', '根据知识库内容，工作流的定义是：**把多个步骤按顺序串起来的执行流程**。它像一张流程图或操作手册，让AI/Agent按固定顺序完成任务，结果更稳定、更容易复用。步骤示例如：步骤1 → 步骤2 → 步骤3 → 步骤4 → 步骤N。\n\n此外，知识库还通过比喻帮助理解：模型 = 大脑，Agent = 助手，MCP = 连接器 / 插座，工作流 = 执行路线 / 流程图。模型负责思考，Agent负责做事，MCP负责连接工具，工作流负责把步骤串起来。\n\n引用来源：【片段0: 工作流.png】', NULL, '[{\"score\": 1, \"excerpt\": \"这张图片是一张关于“工作流”的介绍图，内容详细解释了什么是工作流、为什么需要工作流以及工作流的应用场景。以下是图片中的所有文字和技术信息：\\n\\n### 标题\\n- **AI使用入门图谱系列·第5张**\\n-...\", \"chunk_id\": 27, \"file_name\": \"工作流.png\"}]', 'deepseek-chat', NULL, '2026-05-20 06:31:21');
INSERT INTO `kb_chat_messages` VALUES (47, 26, 'user', 'AI怎么调动工作流', NULL, NULL, NULL, NULL, '2026-05-20 06:32:00');
INSERT INTO `kb_chat_messages` VALUES (48, 26, 'assistant', '根据知识库内容，AI调动工作流的机制主要涉及**模型（Model）**和**Agent**的配合，具体过程如下：\n\n1. **模型（大脑）进行决策**：AI模型（如大语言模型）首先理解用户指令，并决定是否以及如何调用工作流。模型可以自行判断任务是否需要按固定步骤执行。\n\n2. **Agent（助手）执行操作**：当模型决定使用工作流后，Agent会按照工作流中定义的步骤顺序（如步骤1 → 步骤2 → 步骤3 → 步骤4 → 步骤N）逐一执行任务。工作流就像一张流程图或操作手册，Agent严格按照这个路线行动。\n\n3. **借助MCP连接工具**：在执行过程中，Agent可能通过MCP（连接器/插座）调用外部工具或数据源，以便完成工作流中的特定步骤。\n\n4. **结果更稳定**：由于工作流是固定顺序的执行流程，AI通过这种方式完成任务时，结果会更稳定、更容易复用。\n\n**简单比喻**：\n- 模型 = 大脑（思考是否走路线）\n- Agent = 助手（实际走路）\n- MCP = 连接器（途中使用工具）\n- 工作流 = 执行路线/流程图（固定路线）\n\n引用来源：【片段0: 工作流.png】', NULL, '[]', 'deepseek-chat', NULL, '2026-05-20 06:32:00');
INSERT INTO `kb_chat_messages` VALUES (49, 26, 'user', 'mcp和skill是什么', NULL, NULL, NULL, NULL, '2026-05-20 06:33:29');
INSERT INTO `kb_chat_messages` VALUES (50, 26, 'assistant', '根据知识库内容，关于“MCP”和“Skill”的定义及AI如何调动工作流，回答如下：\n\n1. **AI如何调动工作流**：\n   AI调动工作流主要涉及**模型（Model）**和**Agent**的配合。模型（大脑）首先理解用户指令并决定是否调用工作流，然后Agent（助手）按照工作流中定义的步骤顺序（如步骤1 → 步骤2 → 步骤3）逐一执行任务。工作流就像一张流程图或操作手册，Agent严格按照这个路线行动。在执行过程中，Agent可能通过MCP连接外部工具或数据源，以便完成特定步骤。最终结果会更稳定、更容易复用。\n   - 引用来源：【片段0: 工作流.png】\n\n2. **MCP是什么**：\n   根据知识库内容，MCP是**连接器 / 插座**。比喻来说，模型（大脑）负责思考，Agent（助手）负责做事，MCP负责连接工具。在AI执行工作流时，MCP作为连接器，帮助Agent调用外部工具或数据源。\n   - 引用来源：【片段0: 工作流.png】\n\n3. **Skill是什么**：\n   知识库中未找到关于“Skill”的具体定义或相关内容。根据我的知识，Skill通常指AI或Agent能够执行的特定能力或技能模块，但知识库中没有相关依据，因此无法给出基于知识库的准确回答。建议您补充更多上下文或查阅其他资料以获取详细解释。', NULL, '[]', 'deepseek-chat', NULL, '2026-05-20 06:33:29');
INSERT INTO `kb_chat_messages` VALUES (51, 26, 'user', '[请基于以下文件回答: AI、MCP、skill.png] 总结一下', NULL, NULL, NULL, NULL, '2026-05-20 06:33:53');
INSERT INTO `kb_chat_messages` VALUES (52, 26, 'assistant', '根据您提供的文件《AI、MCP、skill.png》，以下是关于MCP和Skill的总结：\n\n### MCP（负责调度工具）\n- **核心定位**：调度与执行工具\n- **主要职责**：基于任务计划，选择最优工具组合，处理参数映射、依赖编排、容错重试。\n- **产出物**：工具执行结果（原始数据）\n- **关键能力**：工具发现、编排调度、容错重试\n- **举例**：任务计划 → 选择工具 → 执行调用 → 返回结果\n\n### Skill（负责沉淀流程）\n- **核心定位**：沉淀与复用流程\n- **主要职责**：将高频、复杂的任务流程标准化封装为可复用的技能（Skill）。\n- **产出物**：可复用的流程模板\n- **关键能力**：流程编排、参数模板、版本管理\n- **举例**：临时任务 → 沉淀为Skill → 结构化、可复用\n\n### 一句话总结\n- **MCP** 是“调度器”，负责把合适的工具找出来并执行。\n- **Skill** 是“流程模板”，负责把重复性工作标准化，方便下次直接复用。', NULL, '[{\"score\": 1, \"excerpt\": \"这张图片详细介绍了如何通过API、MCP和Skill等组件构建智能体，并形成一个闭环能力链。以下是图片中的所有文字和技术信息的详细描述：\\n\\n### 标题与副标题\\n- **标题**: API MCP S...\", \"file_id\": 12, \"file_name\": \"AI、MCP、skill.png\"}]', 'deepseek-chat', NULL, '2026-05-20 06:33:53');
INSERT INTO `kb_chat_messages` VALUES (53, 29, 'user', '分析一下', NULL, NULL, NULL, NULL, '2026-05-21 01:22:48');
INSERT INTO `kb_chat_messages` VALUES (54, 29, 'assistant', '好的，根据您提供的文档内容，以下是对这些文档主要内容和要点的结构化分析总结：\n\n### 核心主题：AI工作流的概念、价值与应用\n\n这些文档的核心是介绍 **“工作流”** 在AI应用中的关键作用，将其定位为构建稳定、可重复、自动化AI系统的核心要素。\n\n---\n\n### 主要内容和要点\n\n#### 1. 什么是工作流？\n\n-   **定义**：工作流不是AI模型本身，而是一套**预先设计好的执行流程或路线图**。它像流程图一样，强调**顺序、规则和节点**。\n-   **核心比喻**：\n    -   **Agent（智能体）** 是执行任务的**助手**，负责思考、决策和行动。\n    -   **工作流** 是执行任务的**路线**，确保任务按部就班、稳定执行。\n    -   **总结**：Agent是执行者，工作流是执行路线。\n\n#### 2. 为什么需要工作流？\n\n-   **没有工作流的问题**：\n    -   每次执行方式不同，容易遗漏步骤。\n    -   结果不稳定，难以自动化和复用。\n-   **有了工作流的好处**：\n    -   步骤清晰可控，结果更稳定。\n    -   可重复执行，更适合自动化。\n    -   **关键点**：工作流不一定让AI更“聪明”，但能让结果更“稳定”。\n\n#### 3. 工作流的典型应用场景\n\n文档列举了多种常见场景，展示了工作流的实用价值：\n\n-   **内容生成**：日报周报自动生成。\n-   **客户管理**：客户跟进提醒。\n-   **内容发布**：自动化内容发布流程。\n-   **数据处理**：数据整理与分析。\n-   **办公自动化**：邮件自动处理、表格/文档自动更新。\n\n#### 4. 一个易懂的例子：自动生成日报\n\n-   **场景**：每天自动整理行业资讯并输出日报。\n-   **具体步骤（即工作流）**：\n    1.  **抓取资讯**\n    2.  **筛选重点**\n    3.  **分类整理**\n    4.  **生成摘要**\n    5.  **排版成日报**\n    6.  **发送到邮箱/群**\n-   **关键启示**：这个流程的成功不是AI变聪明了，而是它拥有一条可以**反复稳定运行**的流程。\n\n#### 5. 工作流与其它AI概念的协同关系\n\n文档将工作流置于一个更大的AI能力链条中，强调协同作用：\n\n-   **公式**：**真正好用的AI = 模型 + 工具 + 数据 + 流程**。\n-   **能力链**：**理解（大模型）+ 连接（API）+ 调度（MCP）+ 沉淀（Skill）+ 回流（反馈）= 闭环智能体**。\n    -   **模型**：负责思考、理解。\n    -   **Agent**：负责执行任务。\n    -   **MCP**：负责连接外部工具。\n    -   **工作流**：负责将上述步骤串联起来，形成稳定流程。\n\n#### 6. 核心总结与建议\n\n-   **四句核心记忆点**：\n    1.  工作流不是模型，而是一套执行流程。\n    2.  工作流不一定更聪明，但会让结果更稳定。\n    3.  复杂任务想跑得稳，通常都需要工作流。\n    4.  真正好用的AI = 模型 + 工具 + 数据 + 流程。\n-   **落地建议**：\n    -   先打通最小闭环，再逐步丰富能力。\n    -   优先沉淀高频流程，快速复用。\n    -   做好日志与评估，持续优化模型与流程。\n    -   保持接口与工具的稳定性与可扩展性。\n-   **后续学习建议**：建议下一张继续看“什么叫知识库/Memory”。', NULL, '[{\"score\": 0.5, \"excerpt\": \"结果更稳定。\\n  3. 复杂任务想跑得稳，通常都需要工作流。\\n  4. 真正好用的AI = 模型 + 工具 + 数据 + 流程。\\n\\n### 建议\\n- **下一张继续看**：什么叫知识库/Memory？...\", \"chunk_id\": 41, \"file_name\": \"工作流.png\"}, {\"score\": 0.5, \"excerpt\": \"- 更像预先设计好的流程图\\n  - 强调顺序、规则、节点\\n  - 适合稳定重复执行\\n- Agent是执行者，工作流是执行路线。\\n\\n### 6. 工作流能用来做什么？\\n- 日报周报生成\\n- 客户跟进提醒...\", \"chunk_id\": 29, \"file_name\": \"工作流.png\"}, {\"score\": 0.5, \"excerpt\": \"成日报（报纸图标）\\n  - 发送到邮箱/群（邮件图标）\\n- **关键点**：关键不是AI更聪明了，而是它有了一条能反复跑的流程。\\n\\n#### 5. Agent和工作流有什么区别？\\n- **Agent*...\", \"chunk_id\": 40, \"file_name\": \"工作流.png\"}, {\"score\": 0.5, \"excerpt\": \"复用Skill | 最终回复~日志 |\\n\\n### 总结\\n- **智能体能干活，靠的不是一个模型，而是一整条能力链的协同运作**。\\n- **理解（大模型）+ 连接（API）+ 调度（MCP）+ 沉淀（S...\", \"chunk_id\": 50, \"file_name\": \"AI、MCP、skill.png\"}, {\"score\": 0.5, \"excerpt\": \"作流** = 执行路线/流程图\\n- **说明**：模型负责思考，Agent负责做事，MCP负责连接工具，工作流负责把步骤串起来。\\n\\n#### 3. 为什么需要工作流？\\n- **没有工作流**：\\n  -...\", \"chunk_id\": 16, \"file_name\": \"未知文件\"}]', 'deepseek-chat', NULL, '2026-05-21 01:22:48');

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
) ENGINE = InnoDB AUTO_INCREMENT = 30 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库聊天会话表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of kb_chat_sessions
-- ----------------------------
INSERT INTO `kb_chat_sessions` VALUES (8, 2, 2, '[请基于以下文件回答: 维修.txt、端口冲突.txt] 总', 2, '2026-04-29 09:37:19', '2026-04-28 06:13:52', '2026-04-29 01:37:19');
INSERT INTO `kb_chat_sessions` VALUES (11, 2, 2, '已选2个文件', 2, '2026-04-29 09:37:41', '2026-04-29 01:37:10', '2026-04-29 01:37:41');
INSERT INTO `kb_chat_sessions` VALUES (14, 3, 2, '分析: 工作流.png', 2, '2026-04-29 17:01:13', '2026-04-29 09:01:06', '2026-04-29 09:01:13');
INSERT INTO `kb_chat_sessions` VALUES (20, 2, 2, '全部文件对话', 2, '2026-04-30 09:56:51', '2026-04-30 01:56:19', '2026-04-30 01:56:51');
INSERT INTO `kb_chat_sessions` VALUES (24, 3, 2, '全部文件对话', 2, '2026-04-30 17:52:08', '2026-04-30 09:51:53', '2026-04-30 09:52:08');
INSERT INTO `kb_chat_sessions` VALUES (25, 3, 2, '已选2个文件', 2, '2026-05-19 09:20:52', '2026-05-19 01:20:32', '2026-05-19 01:20:52');
INSERT INTO `kb_chat_sessions` VALUES (26, 3, 2, '全部文件对话', 8, '2026-05-20 14:33:53', '2026-05-20 06:31:12', '2026-05-20 06:33:53');
INSERT INTO `kb_chat_sessions` VALUES (27, 3, 2, '全部文件对话', 0, NULL, '2026-05-21 01:17:09', NULL);
INSERT INTO `kb_chat_sessions` VALUES (29, 3, 2, '全部文件对话', 2, '2026-05-21 09:22:48', '2026-05-21 01:20:54', '2026-05-21 01:22:48');

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
) ENGINE = InnoDB AUTO_INCREMENT = 51 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库文本块表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of kb_chunks
-- ----------------------------
INSERT INTO `kb_chunks` VALUES (9, 2, 2, 0, ':: 1. 查找PID\r\nnetstat -ano | findstr :3306\r\n\r\n:: 2. 终止进程（假设PID为11404）\r\ntaskkill /F /PID 11404', 92, NULL, '2026-04-28 02:06:47');
INSERT INTO `kb_chunks` VALUES (10, 3, 2, 0, ':: 1. 查找PID\r\nnetstat -ano | findstr :3306\r\n\r\n:: 2. 终止进程（假设PID为11404）\r\ntaskkill /F /PID 11404', 92, NULL, '2026-04-28 02:06:47');
INSERT INTO `kb_chunks` VALUES (11, 4, 2, 0, '等你企业认证办好后，在阿里云：\r\n\r\n进入 短信服务控制台\r\n申请短信签名（如\"XX公司维修提醒\"）\r\n申请短信模板（包含 title、machine、date 三个变量）\r\n将配置更新到 .env：\r\n\r\nALIYUN_SMS_SIGN_NAME=你的签名\r\nALIYUN_SMS_TEMPLATE_CODE=SMS_xxxxxxxxx', 169, NULL, '2026-04-28 02:13:51');
INSERT INTO `kb_chunks` VALUES (12, 5, 2, 0, '等你企业认证办好后，在阿里云：\r\n\r\n进入 短信服务控制台\r\n申请短信签名（如\"XX公司维修提醒\"）\r\n申请短信模板（包含 title、machine、date 三个变量）\r\n将配置更新到 .env：\r\n\r\nALIYUN_SMS_SIGN_NAME=你的签名\r\nALIYUN_SMS_TEMPLATE_CODE=SMS_xxxxxxxxx', 169, NULL, '2026-04-28 02:51:58');
INSERT INTO `kb_chunks` VALUES (13, 6, 2, 0, ':: 1. 查找PID\r\nnetstat -ano | findstr :3306\r\n\r\n:: 2. 终止进程（假设PID为11404）\r\ntaskkill /F /PID 11404', 92, NULL, '2026-04-28 03:09:03');
INSERT INTO `kb_chunks` VALUES (15, 8, 3, 0, '这张图片详细介绍了“工作流”的概念及其在AI应用中的重要性。以下是图片中所有文字和技术信息的详细描述：\n\n### 标题和副标题\n- **标题**：什么叫工作流？\n- **副标题**：为什么AI真正做事，靠的是一套流程。\n\n### 主要内容\n\n#### 1. 一句话理解\n- **定义**：工作流 = 把多个步骤按顺序串起来的执行流程。\n- **解释**：它像一张流程图或操作手册，让AI/Agent按固定顺序完成任务，结果更稳定、更容易复用。\n- **示意图**：\n  - 步骤1（搜索图标） → 步骤2（漏斗图标） → 步骤3（文件夹图标） → 步骤4（文档图标） → 步骤N（省略号图标）\n\n#### 2. 通俗理解\n- **模型** = 大脑\n- **Agent** = 助手\n- **MCP** = 连接器/插座\n- **工作流** = 执行路线/流程图\n- **说明**：模型负责思考，Agent负责做事，MCP负责连接工具，工作流负责把步骤串起来。', 430, NULL, '2026-04-29 01:56:47');
INSERT INTO `kb_chunks` VALUES (16, 8, 3, 1, '作流** = 执行路线/流程图\n- **说明**：模型负责思考，Agent负责做事，MCP负责连接工具，工作流负责把步骤串起来。\n\n#### 3. 为什么需要工作流？\n- **没有工作流**：\n  - 每次做法都不一样\n  - 容易漏步骤\n  - 结果不稳定\n  - 很难自动化复用\n- **有了工作流**：\n  - 步骤清晰可控\n  - 结果更稳定\n  - 可重复执行\n  - 更适合自动化\n\n#### 4. 一个最容易懂的例子\n- **场景**：每天自动整理行业资讯并输出日报\n- **步骤**：\n  - 抓取资讯（地球图标）\n  - 筛选重点（漏斗图标）\n  - 分类整理（文件夹图标）\n  - 生成摘要（文档图标）\n  - 排版成日报（报纸图标）\n  - 发送到邮箱/群（邮件图标）\n- **关键点**：关键不是AI更聪明了，而是它有了一条能反复跑的流程。', 382, NULL, '2026-04-29 01:56:47');
INSERT INTO `kb_chunks` VALUES (17, 8, 3, 2, '成日报（报纸图标）\n  - 发送到邮箱/群（邮件图标）\n- **关键点**：关键不是AI更聪明了，而是它有了一条能反复跑的流程。\n\n#### 5. Agent和工作流有什么区别？\n- **Agent**：\n  - 更像执行任务的助手\n  - 会思考、决策、行动\n  - 适合灵活处理任务\n- **工作流**：\n  - 更像预先设计好的流程图\n  - 强调顺序、规则、节点\n  - 适合稳定重复执行\n- **总结**：Agent是执行者，工作流是执行路线。\n\n#### 6. 工作流能用来做什么？\n- **功能列表**：\n  - 日报周报生成（日历图标）\n  - 客户跟进提醒（铃铛图标）\n  - 内容发布流程（喇叭图标）\n  - 数据整理与分析（图表图标）\n  - 邮件自动处理（邮件图标）\n  - 表格/文档自动更新（表格图标）\n\n### 总结\n- **四句话要点**：\n  1. 工作流不是模型，而是一套执行流程。\n  2. 工作流不一定更聪明，但会让结果更稳定。\n  3. 复杂任务想跑得稳，通常都需要工作流。\n  4. 真正好用的AI = 模型 + 工具 + 数据 + 流程。', 492, NULL, '2026-04-29 01:56:47');
INSERT INTO `kb_chunks` VALUES (18, 8, 3, 3, '结果更稳定。\n  3. 复杂任务想跑得稳，通常都需要工作流。\n  4. 真正好用的AI = 模型 + 工具 + 数据 + 流程。\n\n### 建议\n- **下一张继续看**：什么叫知识库/Memory？\n\n### 图片元素\n- **机器人形象**：位于左上角，手持平板电脑，展示工作流的概念。\n- **流程图**：右上角展示了一个简单的流程图示例。\n- **图标**：每个步骤和功能都配有相应的图标，便于理解和记忆。\n- **颜色**：使用了蓝色、橙色、绿色等多种颜色，使内容更加生动和易于区分。', 247, NULL, '2026-04-29 01:56:47');
INSERT INTO `kb_chunks` VALUES (23, 7, 2, 0, '在深入寻找具体图纸之前，先快速了解一下看图和找图的准备，会事半功倍：\r\n\r\n理解基本符号：维修识图的起点。电路图使用统一的图形符号（如电阻、电容、IC芯片）和文字符号（如R1代表电阻，U1代表集成电路）代表元器件。掌握这些是看懂“工程语言”的基础。\r\n\r\n熟悉电流通路：重点追踪直流电源回路和信号交流回路，观察电流如何流过每个元件，这对理解工作原理和分析故障至关重要。\r\n\r\n准备参考书籍：像《电路识图从入门到精通》、《图解电子电路图识读方法与技巧》这类书籍，能系统性地帮助你从入门到精通。', 245, NULL, '2026-04-29 03:17:18');
INSERT INTO `kb_chunks` VALUES (27, 9, 3, 0, '这张图片是一张关于“工作流”的介绍图，内容详细解释了什么是工作流、为什么需要工作流以及工作流的应用场景。以下是图片中的所有文字和技术信息：\n\n### 标题\n- **AI使用入门图谱系列·第5张**\n- **什么叫工作流？**\n- **为什么AI真正做事，靠的是一套流程**\n\n### 1. 一句话理解\n- **工作流 = 把多个步骤按顺序串起来的执行流程。**\n  - 它像一张流程图或操作手册，让AI/Agent按固定顺序完成任务，结果更稳定、更容易复用。\n  - 步骤示例：步骤1 → 步骤2 → 步骤3 → 步骤4 → 步骤N\n\n### 2. 通俗理解\n- **模型 = 大脑**\n- **Agent = 助手**\n- **MCP = 连接器 / 插座**\n- **工作流 = 执行路线 / 流程图**\n- 模型负责思考，Agent负责做事，MCP负责连接工具，工作流负责把步骤串起来。', 396, NULL, '2026-04-29 03:18:01');
INSERT INTO `kb_chunks` VALUES (28, 9, 3, 1, '- **工作流 = 执行路线 / 流程图**\n- 模型负责思考，Agent负责做事，MCP负责连接工具，工作流负责把步骤串起来。\n\n### 3. 为什么需要工作流？\n- **没有工作流**：\n  - 每次做法都不一样\n  - 容易漏步骤\n  - 结果不稳定\n  - 很难自动化复用\n- **有了工作流**：\n  - 步骤清晰可控\n  - 结果更稳定\n  - 可重复执行\n  - 更适合自动化\n\n### 4. 一个最容易懂的例子\n- **每天自动整理行业资讯并输出日报**\n  - 抓取资讯 → 筛选重点 → 分类整理 → 生成摘要 → 排版成日报 → 发送到邮箱/群\n- 关键不是AI更聪明了，而是它有了一条能反复跑的流程。\n\n### 5. Agent和工作流有什么区别？\n- **Agent**：\n  - 更像执行任务的助手\n  - 会思考、决策、行动\n  - 适合灵活处理任务\n- **工作流**：\n  - 更像预先设计好的流程图\n  - 强调顺序、规则、节点\n  - 适合稳定重复执行\n- Agent是执行者，工作流是执行路线。', 467, NULL, '2026-04-29 03:18:01');
INSERT INTO `kb_chunks` VALUES (29, 9, 3, 2, '- 更像预先设计好的流程图\n  - 强调顺序、规则、节点\n  - 适合稳定重复执行\n- Agent是执行者，工作流是执行路线。\n\n### 6. 工作流能用来做什么？\n- 日报周报生成\n- 客户跟进提醒\n- 内容发布流程\n- 数据整理与分析\n- 邮件自动处理\n- 表格/文档自动更新\n\n### 总结\n- **这张图请先记住4句话**\n  1. 工作流不是模型，而是一套执行流程。\n  2. 工作流不一定更聪明，但会让结果更稳定。\n  3. 复杂任务想跑得稳，通常都需要工作流。\n  4. 真正好用的AI = 模型 + 工具 + 数据 + 流程。\n\n### 建议\n- **建议下一张继续看：什么叫知识库 / Memory?**\n\n### 图片元素\n- 包含卡通机器人形象、流程图标、大脑、插头等图形元素，用于直观展示概念。\n- 使用了多种颜色（蓝色、绿色、橙色等）区分不同部分，使信息更加清晰易懂。', 397, NULL, '2026-04-29 03:18:01');
INSERT INTO `kb_chunks` VALUES (38, 10, 3, 0, '这张图片详细介绍了“工作流”的概念及其在AI应用中的重要性。以下是图片中所有文字和技术信息的详细描述：\n\n### 标题和副标题\n- **标题**：什么叫工作流？\n- **副标题**：为什么AI真正做事，靠的是一套流程。\n\n### 主要内容\n\n#### 1. 一句话理解\n- **定义**：工作流 = 把多个步骤按顺序串起来的执行流程。\n- **解释**：它像一张流程图或操作手册，让AI/Agent按固定顺序完成任务，结果更稳定、更容易复用。\n- **示意图**：\n  - 步骤1（搜索图标） → 步骤2（漏斗图标） → 步骤3（文件夹图标） → 步骤4（文档图标） → 步骤N（省略号图标）\n\n#### 2. 通俗理解\n- **模型** = 大脑\n- **Agent** = 助手\n- **MCP** = 连接器/插座\n- **工作流** = 执行路线/流程图\n- **说明**：模型负责思考，Agent负责做事，MCP负责连接工具，工作流负责把步骤串起来。', 430, NULL, '2026-04-29 07:40:37');
INSERT INTO `kb_chunks` VALUES (39, 10, 3, 1, '作流** = 执行路线/流程图\n- **说明**：模型负责思考，Agent负责做事，MCP负责连接工具，工作流负责把步骤串起来。\n\n#### 3. 为什么需要工作流？\n- **没有工作流**：\n  - 每次做法都不一样\n  - 容易漏步骤\n  - 结果不稳定\n  - 很难自动化复用\n- **有了工作流**：\n  - 步骤清晰可控\n  - 结果更稳定\n  - 可重复执行\n  - 更适合自动化\n\n#### 4. 一个最容易懂的例子\n- **例子**：每天自动整理行业资讯并输出日报\n- **步骤**：\n  - 抓取资讯（地球图标）\n  - 筛选重点（漏斗图标）\n  - 分类整理（文件夹图标）\n  - 生成摘要（文档图标）\n  - 排版成日报（报纸图标）\n  - 发送到邮箱/群（邮件图标）\n- **关键点**：关键不是AI更聪明了，而是它有了一条能反复跑的流程。', 382, NULL, '2026-04-29 07:40:37');
INSERT INTO `kb_chunks` VALUES (40, 10, 3, 2, '成日报（报纸图标）\n  - 发送到邮箱/群（邮件图标）\n- **关键点**：关键不是AI更聪明了，而是它有了一条能反复跑的流程。\n\n#### 5. Agent和工作流有什么区别？\n- **Agent**：\n  - 更像执行任务的助手\n  - 会思考、决策、行动\n  - 适合灵活处理任务\n- **工作流**：\n  - 更像预先设计好的流程图\n  - 强调顺序、规则、节点\n  - 适合稳定重复执行\n- **总结**：Agent是执行者，工作流是执行路线。\n\n#### 6. 工作流能用来做什么？\n- **功能列表**：\n  - 日报周报生成（日历图标）\n  - 客户跟进提醒（铃铛图标）\n  - 内容发布流程（喇叭图标）\n  - 数据整理与分析（图表图标）\n  - 邮件自动处理（邮件图标）\n  - 表格/文档自动更新（表格图标）\n\n### 总结\n- **四句话要点**：\n  1. 工作流不是模型，而是一套执行流程。\n  2. 工作流不一定更聪明，但会让结果更稳定。\n  3. 复杂任务想跑得稳，通常都需要工作流。\n  4. 真正好用的AI = 模型 + 工具 + 数据 + 流程。', 492, NULL, '2026-04-29 07:40:37');
INSERT INTO `kb_chunks` VALUES (41, 10, 3, 3, '结果更稳定。\n  3. 复杂任务想跑得稳，通常都需要工作流。\n  4. 真正好用的AI = 模型 + 工具 + 数据 + 流程。\n\n### 建议\n- **下一张继续看**：什么叫知识库/Memory？\n\n### 图片元素\n- **机器人形象**：位于左上角，手持平板电脑，展示工作流的概念。\n- **流程图**：右上角展示了一个简单的流程图示例。\n- **图标**：每个步骤和功能都配有相应的图标，便于理解和记忆。\n- **颜色**：使用了蓝色、橙色、绿色等多种颜色，使内容更加生动和易于区分。\n\n这张图片通过图文结合的方式，全面介绍了工作流的概念、作用以及在AI应用中的重要性，帮助读者更好地理解和掌握这一概念。', 307, NULL, '2026-04-29 07:40:37');
INSERT INTO `kb_chunks` VALUES (44, 11, 3, 0, '这张图片展示了一台柴油发电机组，并详细标注了各个部件及其功能。以下是图片中的文字和技术信息：\n\n### 标题\n- **柴油发电机组介绍**\n\n### 部件标注及说明\n1. **排烟管**：位于发动机顶部，用于排出燃烧后的废气。\n2. **散热水箱**：位于左侧，用于冷却发动机产生的热量。\n3. **自动控制屏幕**：位于右侧上方的白色控制柜上，显示和控制发电机的运行状态。\n4. **空气滤清器**：位于发动机顶部，用于过滤进入发动机的空气，防止灰尘和杂质进入。\n5. **风扇**：位于散热水箱前方，帮助散热。\n6. **电瓶**：位于左下角，为发电机提供启动电源。\n7. **柴油滤清器**：位于发动机中部，用于过滤柴油中的杂质，确保燃油清洁。\n8. **减震垫**：位于底座与发动机之间，减少运行时的震动。\n9. **散热孔**：位于发动机底部，帮助散热。\n10. **底座**：支撑整个发电机组，保持稳定。\n11. **发电机**：位于右侧，将机械能转化为电能。\n12. **控制柜**：包含自动控制屏幕和其他控制元件，用于操作和监控发电机。', 476, NULL, '2026-05-19 01:22:03');
INSERT INTO `kb_chunks` VALUES (45, 11, 3, 1, '**发电机**：位于右侧，将机械能转化为电能。\n12. **控制柜**：包含自动控制屏幕和其他控制元件，用于操作和监控发电机。\n\n### 其他信息\n- 图片右下角有“公众号·电气姐说”的标识，表明这可能是来自某个电气相关的公众号的内容。\n\n### 技术细节\n- 发电机组整体呈蓝色，结构紧凑，设计合理，适合工业或应急供电使用。\n- 各个部件通过红色箭头清晰标注，便于理解和维护。\n- 控制柜上的自动控制屏幕显示了发电机的运行参数，方便实时监控。\n\n这张图片提供了柴油发电机组的全面介绍，有助于用户了解其结构和工作原理。', 259, NULL, '2026-05-19 01:22:03');
INSERT INTO `kb_chunks` VALUES (46, 12, 3, 0, '这张图片详细介绍了如何通过API、MCP和Skill等组件构建智能体，并形成一个闭环能力链。以下是图片中的所有文字和技术信息的详细描述：\n\n### 标题与副标题\n- **标题**: API MCP Skill 如何串起智能体\n- **副标题**: 智能体能干活，靠的不是一个模型，而是一整条能力链\n\n### 整体流程图\n1. **用户需求/问题/任务** → 大模型理解意图 → API连接能力 → MCP调度工具 → Skill沉淀流程 → 结果回流反馈优化\n\n### 详细模块说明\n#### 01. 大模型负责理解\n- **职责**: 让AI听懂你在说什么（负责自然语言理解、意图识别、任务拆解、上下文理解、信息抽取）\n- **输出**: 结构化的任务计划\n- **关键能力**: 语义理解、意图识别、任务拆解\n- **举例**: 用户请求查询销售数据并生成趋势图，模型输出为查询销售数据→生成图表。', 402, NULL, '2026-05-20 06:30:18');
INSERT INTO `kb_chunks` VALUES (47, 12, 3, 1, '力**: 语义理解、意图识别、任务拆解\n- **举例**: 用户请求查询销售数据并生成趋势图，模型输出为查询销售数据→生成图表。\n\n#### 02. API负责接能力\n- **职责**: 把外部能力接入进来（统一对外部系统/服务能力提供标准化接口如REST/GraphQL等）\n- **输出**: 可被调用的能力列表\n- **关键能力**: 接口封装、鉴权权限流、稳定可靠\n- **举例**: API列表包括/sales/data获取销售数据、/chart/line生成折线图、/user/info获取用户信息等。\n\n#### 03. MCP负责调工具\n- **职责**: 把合适的工具调度出来（基于任务计划，选择最优工具组合处理参数映射、依赖编排、容错重试）\n- **输出**: 工具执行结果（原始数据）\n- **关键能力**: 工具发现、编排调度、容错重试\n- **举例**: 任务计划→选择工具→执行调用→返回结果。', 411, NULL, '2026-05-20 06:30:18');
INSERT INTO `kb_chunks` VALUES (48, 12, 3, 2, '（原始数据）\n- **关键能力**: 工具发现、编排调度、容错重试\n- **举例**: 任务计划→选择工具→执行调用→返回结果。\n\n#### 04. Skill负责沉淀流程\n- **职责**: 把可复用的流程沉淀下来（将高频、复杂的任务流程标准化封装为可复用的技能(Skill)）\n- **输出**: 可复用的流程模板\n- **关键能力**: 流程编排、参数模板、版本管理\n- **举例**: 临时任务→沉淀为Skill→结构化、可复用。\n\n#### 05. 结果如何回流\n- **职责**: 让结果回流到模型，形成反馈（将工具执行结果回传给大模型进行总结、分析、生成最终回复同时记录日志，沉淀数据资产）\n- **关键能力**: 结果聚合、智能总结、日志沉淀\n- **回流路径**: 工具结果（原始数据）→大模型分析总结→输出给用户（自然语言）\n\n#### 06. 为什么这样才能形成闭环\n- **分工协同，闭环迭代，能力越用越强**\n- **大模型**: 专注理解与生成\n- **API**: 专注连接与稳定\n- **MCP**: 专注调度与执行\n- **Skill**: 专注沉淀与复用', 495, NULL, '2026-05-20 06:30:18');
INSERT INTO `kb_chunks` VALUES (49, 12, 3, 3, '解与生成\n- **API**: 专注连接与稳定\n- **MCP**: 专注调度与执行\n- **Skill**: 专注沉淀与复用\n- **回流**: 专注反馈与优化\n\n### 表格：一张表看懂各模块定位\n| 模块 | 大模型 | API | MCP | Skill | 回流 |\n|------|--------|-----|-----|-------|------|\n| 核心定位 | 理解与思考 | 连接与暴露能力 | 调度与执行工具 | 沉淀与复用流程 | 反馈与优化 |\n| 主要职责 | 意图识别、任务拆解 | 接口封装、鉴权原流 | 工具选型、编排调用 | 流程编排、模板沉淀 | 结果聚合、智能总结 |\n| 产出物 | 任务计划 | 可调用API列表 | 工具执行结果 | 可复用Skill | 最终回复~日志 |\n\n### 总结\n- **智能体能干活，靠的不是一个模型，而是一整条能力链的协同运作**。', 408, NULL, '2026-05-20 06:30:18');
INSERT INTO `kb_chunks` VALUES (50, 12, 3, 4, '复用Skill | 最终回复~日志 |\n\n### 总结\n- **智能体能干活，靠的不是一个模型，而是一整条能力链的协同运作**。\n- **理解（大模型）+ 连接（API）+ 调度（MCP）+ 沉淀（Skill）+ 回流（反馈）= 闭环智能体**\n\n### 落地建议\n- 先打通最小闭环，再逐步丰富能力\n- 优先沉淀高频流程，快速复用\n- 做好日志与评估，持续优化模型与流程\n- 保持接口与工具的稳定性与可扩展性\n\n### 公众号信息\n- 广东阿风AI创业笔记\n- 阿风的AI落地笔记', 241, NULL, '2026-05-20 06:30:19');

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
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库集合表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of kb_collections
-- ----------------------------
INSERT INTO `kb_collections` VALUES (1, '无人机线路图', '这是一个用来存储无人机操作的知识库', 'kb_col_69eec8e2c5aae', NULL, 0, 0, 0, 1, 2, '2026-04-27 02:24:34', NULL);
INSERT INTO `kb_collections` VALUES (2, '手机维修', '手机维修的全部维修过程及方法', 'kb_col_69eec902ba557', NULL, 4, 6, 859, 1, 2, '2026-04-27 02:25:06', '2026-04-29 03:17:18');
INSERT INTO `kb_collections` VALUES (3, '智能体工作流', '这是一个关于智能体workflow学习的知识库', 'mysql_fulltext', NULL, 4, 18, 7114, 1, 2, '2026-04-29 01:42:09', '2026-05-20 06:30:19');

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
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识库文件表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of kb_files
-- ----------------------------
INSERT INTO `kb_files` VALUES (4, 2, '企业认证阿里云.txt', '69f017deeacd6_1777342430.txt', 'uploads/knowledge/69f017deeacd6_1777342430.txt', '/var/www/html/public/uploads/knowledge/69f017deeacd6_1777342430.txt', 'txt', 301, 'text/plain', NULL, 0, 0, 2, NULL, 2, '2026-04-28 02:13:50', '2026-04-29 07:49:56');
INSERT INTO `kb_files` VALUES (6, 2, '端口冲突.txt', '69f024cfad771_1777345743.txt', 'uploads/knowledge/69f024cfad771_1777345743.txt', '/var/www/html/public/uploads/knowledge/69f024cfad771_1777345743.txt', 'txt', 114, 'text/plain', ':: 1. 查找PID\r\nnetstat -ano | findstr :3306\r\n\r\n:: 2. 终止进程（假设PID为11404）\r\ntaskkill /F /PID 11404', 92, 1, 2, '文本已提取分块，但未向量化: Milvus请求失败: Could not resolve host: milvus-rest', 2, '2026-04-28 03:09:03', '2026-04-29 07:49:56');
INSERT INTO `kb_files` VALUES (7, 2, '维修.txt', '69f04fdfe5688_1777356767.txt', 'uploads/knowledge/69f04fdfe5688_1777356767.txt', '/var/www/html/public/uploads/knowledge/69f04fdfe5688_1777356767.txt', 'txt', 699, 'text/plain', '在深入寻找具体图纸之前，先快速了解一下看图和找图的准备，会事半功倍：\r\n\r\n理解基本符号：维修识图的起点。电路图使用统一的图形符号（如电阻、电容、IC芯片）和文字符号（如R1代表电阻，U1代表集成电路）代表元器件。掌握这些是看懂“工程语言”的基础。\r\n\r\n熟悉电流通路：重点追踪直流电源回路和信号交流回路，观察电流如何流过每个元件，这对理解工作原理和分析故障至关重要。\r\n\r\n准备参考书籍：像《电路识图从入门到精通》、《图解电子电路图识读方法与技巧》这类书籍，能系统性地帮助你从入门到精通。', 245, 1, 2, NULL, 2, '2026-04-28 06:12:47', '2026-04-29 07:49:56');
INSERT INTO `kb_files` VALUES (9, 3, '工作流.png', '69f167edc1e51_1777428461.png', 'uploads/knowledge/69f167edc1e51_1777428461.png', '/var/www/html/public/uploads/knowledge/69f167edc1e51_1777428461.png', 'png', 1889086, 'image/png', '这张图片是一张关于“工作流”的介绍图，内容详细解释了什么是工作流、为什么需要工作流以及工作流的应用场景。以下是图片中的所有文字和技术信息：\n\n### 标题\n- **AI使用入门图谱系列·第5张**\n- **什么叫工作流？**\n- **为什么AI真正做事，靠的是一套流程**\n\n### 1. 一句话理解\n- **工作流 = 把多个步骤按顺序串起来的执行流程。**\n  - 它像一张流程图或操作手册，让AI/Agent按固定顺序完成任务，结果更稳定、更容易复用。\n  - 步骤示例：步骤1 → 步骤2 → 步骤3 → 步骤4 → 步骤N\n\n### 2. 通俗理解\n- **模型 = 大脑**\n- **Agent = 助手**\n- **MCP = 连接器 / 插座**\n- **工作流 = 执行路线 / 流程图**\n- 模型负责思考，Agent负责做事，MCP负责连接工具，工作流负责把步骤串起来。\n\n### 3. 为什么需要工作流？\n- **没有工作流**：\n  - 每次做法都不一样\n  - 容易漏步骤\n  - 结果不稳定\n  - 很难自动化复用\n- **有了工作流**：\n  - 步骤清晰可控\n  - 结果更稳定\n  - 可重复执行\n  - 更适合自动化\n\n### 4. 一个最容易懂的例子\n- **每天自动整理行业资讯并输出日报**\n  - 抓取资讯 → 筛选重点 → 分类整理 → 生成摘要 → 排版成日报 → 发送到邮箱/群\n- 关键不是AI更聪明了，而是它有了一条能反复跑的流程。\n\n### 5. Agent和工作流有什么区别？\n- **Agent**：\n  - 更像执行任务的助手\n  - 会思考、决策、行动\n  - 适合灵活处理任务\n- **工作流**：\n  - 更像预先设计好的流程图\n  - 强调顺序、规则、节点\n  - 适合稳定重复执行\n- Agent是执行者，工作流是执行路线。\n\n### 6. 工作流能用来做什么？\n- 日报周报生成\n- 客户跟进提醒\n- 内容发布流程\n- 数据整理与分析\n- 邮件自动处理\n- 表格/文档自动更新\n\n### 总结\n- **这张图请先记住4句话**\n  1. 工作流不是模型，而是一套执行流程。\n  2. 工作流不一定更聪明，但会让结果更稳定。\n  3. 复杂任务想跑得稳，通常都需要工作流。\n  4. 真正好用的AI = 模型 + 工具 + 数据 + 流程。\n\n### 建议\n- **建议下一张继续看：什么叫知识库 / Memory?**\n\n### 图片元素\n- 包含卡通机器人形象、流程图标、大脑、插头等图形元素，用于直观展示概念。\n- 使用了多种颜色（蓝色、绿色、橙色等）区分不同部分，使信息更加清晰易懂。', 1133, 3, 2, NULL, 2, '2026-04-29 02:07:41', '2026-04-29 07:49:56');
INSERT INTO `kb_files` VALUES (10, 3, '工作流.png', '69f19dab8cb6b_1777442219.png', 'uploads/knowledge/69f19dab8cb6b_1777442219.png', '/var/www/html/public/uploads/knowledge/69f19dab8cb6b_1777442219.png', 'png', 1889086, 'image/png', '这张图片详细介绍了“工作流”的概念及其在AI应用中的重要性。以下是图片中所有文字和技术信息的详细描述：\n\n### 标题和副标题\n- **标题**：什么叫工作流？\n- **副标题**：为什么AI真正做事，靠的是一套流程。\n\n### 主要内容\n\n#### 1. 一句话理解\n- **定义**：工作流 = 把多个步骤按顺序串起来的执行流程。\n- **解释**：它像一张流程图或操作手册，让AI/Agent按固定顺序完成任务，结果更稳定、更容易复用。\n- **示意图**：\n  - 步骤1（搜索图标） → 步骤2（漏斗图标） → 步骤3（文件夹图标） → 步骤4（文档图标） → 步骤N（省略号图标）\n\n#### 2. 通俗理解\n- **模型** = 大脑\n- **Agent** = 助手\n- **MCP** = 连接器/插座\n- **工作流** = 执行路线/流程图\n- **说明**：模型负责思考，Agent负责做事，MCP负责连接工具，工作流负责把步骤串起来。\n\n#### 3. 为什么需要工作流？\n- **没有工作流**：\n  - 每次做法都不一样\n  - 容易漏步骤\n  - 结果不稳定\n  - 很难自动化复用\n- **有了工作流**：\n  - 步骤清晰可控\n  - 结果更稳定\n  - 可重复执行\n  - 更适合自动化\n\n#### 4. 一个最容易懂的例子\n- **例子**：每天自动整理行业资讯并输出日报\n- **步骤**：\n  - 抓取资讯（地球图标）\n  - 筛选重点（漏斗图标）\n  - 分类整理（文件夹图标）\n  - 生成摘要（文档图标）\n  - 排版成日报（报纸图标）\n  - 发送到邮箱/群（邮件图标）\n- **关键点**：关键不是AI更聪明了，而是它有了一条能反复跑的流程。\n\n#### 5. Agent和工作流有什么区别？\n- **Agent**：\n  - 更像执行任务的助手\n  - 会思考、决策、行动\n  - 适合灵活处理任务\n- **工作流**：\n  - 更像预先设计好的流程图\n  - 强调顺序、规则、节点\n  - 适合稳定重复执行\n- **总结**：Agent是执行者，工作流是执行路线。\n\n#### 6. 工作流能用来做什么？\n- **功能列表**：\n  - 日报周报生成（日历图标）\n  - 客户跟进提醒（铃铛图标）\n  - 内容发布流程（喇叭图标）\n  - 数据整理与分析（图表图标）\n  - 邮件自动处理（邮件图标）\n  - 表格/文档自动更新（表格图标）\n\n### 总结\n- **四句话要点**：\n  1. 工作流不是模型，而是一套执行流程。\n  2. 工作流不一定更聪明，但会让结果更稳定。\n  3. 复杂任务想跑得稳，通常都需要工作流。\n  4. 真正好用的AI = 模型 + 工具 + 数据 + 流程。\n\n### 建议\n- **下一张继续看**：什么叫知识库/Memory？\n\n### 图片元素\n- **机器人形象**：位于左上角，手持平板电脑，展示工作流的概念。\n- **流程图**：右上角展示了一个简单的流程图示例。\n- **图标**：每个步骤和功能都配有相应的图标，便于理解和记忆。\n- **颜色**：使用了蓝色、橙色、绿色等多种颜色，使内容更加生动和易于区分。\n\n这张图片通过图文结合的方式，全面介绍了工作流的概念、作用以及在AI应用中的重要性，帮助读者更好地理解和掌握这一概念。', 1419, 4, 2, NULL, 2, '2026-04-29 05:56:59', '2026-04-29 07:49:56');
INSERT INTO `kb_files` VALUES (11, 3, '测试图片.jpg', '69f321e39553f_1777541603.jpg', 'uploads/knowledge/69f321e39553f_1777541603.jpg', '/var/www/html/public/uploads/knowledge/69f321e39553f_1777541603.jpg', 'jpg', 187528, 'image/jpeg', '这张图片展示了一台柴油发电机组，并详细标注了各个部件及其功能。以下是图片中的文字和技术信息：\n\n### 标题\n- **柴油发电机组介绍**\n\n### 部件标注及说明\n1. **排烟管**：位于发动机顶部，用于排出燃烧后的废气。\n2. **散热水箱**：位于左侧，用于冷却发动机产生的热量。\n3. **自动控制屏幕**：位于右侧上方的白色控制柜上，显示和控制发电机的运行状态。\n4. **空气滤清器**：位于发动机顶部，用于过滤进入发动机的空气，防止灰尘和杂质进入。\n5. **风扇**：位于散热水箱前方，帮助散热。\n6. **电瓶**：位于左下角，为发电机提供启动电源。\n7. **柴油滤清器**：位于发动机中部，用于过滤柴油中的杂质，确保燃油清洁。\n8. **减震垫**：位于底座与发动机之间，减少运行时的震动。\n9. **散热孔**：位于发动机底部，帮助散热。\n10. **底座**：支撑整个发电机组，保持稳定。\n11. **发电机**：位于右侧，将机械能转化为电能。\n12. **控制柜**：包含自动控制屏幕和其他控制元件，用于操作和监控发电机。\n\n### 其他信息\n- 图片右下角有“公众号·电气姐说”的标识，表明这可能是来自某个电气相关的公众号的内容。\n\n### 技术细节\n- 发电机组整体呈蓝色，结构紧凑，设计合理，适合工业或应急供电使用。\n- 各个部件通过红色箭头清晰标注，便于理解和维护。\n- 控制柜上的自动控制屏幕显示了发电机的运行参数，方便实时监控。\n\n这张图片提供了柴油发电机组的全面介绍，有助于用户了解其结构和工作原理。', 672, 2, 2, NULL, 2, '2026-04-30 09:33:23', '2026-05-19 01:22:03');
INSERT INTO `kb_files` VALUES (12, 3, 'AI、MCP、skill.png', '6a0d54d3d6d41_1779258579.png', 'uploads/knowledge/6a0d54d3d6d41_1779258579.png', '/var/www/html/public/uploads/knowledge/6a0d54d3d6d41_1779258579.png', 'png', 1696395, 'image/png', '这张图片详细介绍了如何通过API、MCP和Skill等组件构建智能体，并形成一个闭环能力链。以下是图片中的所有文字和技术信息的详细描述：\n\n### 标题与副标题\n- **标题**: API MCP Skill 如何串起智能体\n- **副标题**: 智能体能干活，靠的不是一个模型，而是一整条能力链\n\n### 整体流程图\n1. **用户需求/问题/任务** → 大模型理解意图 → API连接能力 → MCP调度工具 → Skill沉淀流程 → 结果回流反馈优化\n\n### 详细模块说明\n#### 01. 大模型负责理解\n- **职责**: 让AI听懂你在说什么（负责自然语言理解、意图识别、任务拆解、上下文理解、信息抽取）\n- **输出**: 结构化的任务计划\n- **关键能力**: 语义理解、意图识别、任务拆解\n- **举例**: 用户请求查询销售数据并生成趋势图，模型输出为查询销售数据→生成图表。\n\n#### 02. API负责接能力\n- **职责**: 把外部能力接入进来（统一对外部系统/服务能力提供标准化接口如REST/GraphQL等）\n- **输出**: 可被调用的能力列表\n- **关键能力**: 接口封装、鉴权权限流、稳定可靠\n- **举例**: API列表包括/sales/data获取销售数据、/chart/line生成折线图、/user/info获取用户信息等。\n\n#### 03. MCP负责调工具\n- **职责**: 把合适的工具调度出来（基于任务计划，选择最优工具组合处理参数映射、依赖编排、容错重试）\n- **输出**: 工具执行结果（原始数据）\n- **关键能力**: 工具发现、编排调度、容错重试\n- **举例**: 任务计划→选择工具→执行调用→返回结果。\n\n#### 04. Skill负责沉淀流程\n- **职责**: 把可复用的流程沉淀下来（将高频、复杂的任务流程标准化封装为可复用的技能(Skill)）\n- **输出**: 可复用的流程模板\n- **关键能力**: 流程编排、参数模板、版本管理\n- **举例**: 临时任务→沉淀为Skill→结构化、可复用。\n\n#### 05. 结果如何回流\n- **职责**: 让结果回流到模型，形成反馈（将工具执行结果回传给大模型进行总结、分析、生成最终回复同时记录日志，沉淀数据资产）\n- **关键能力**: 结果聚合、智能总结、日志沉淀\n- **回流路径**: 工具结果（原始数据）→大模型分析总结→输出给用户（自然语言）\n\n#### 06. 为什么这样才能形成闭环\n- **分工协同，闭环迭代，能力越用越强**\n- **大模型**: 专注理解与生成\n- **API**: 专注连接与稳定\n- **MCP**: 专注调度与执行\n- **Skill**: 专注沉淀与复用\n- **回流**: 专注反馈与优化\n\n### 表格：一张表看懂各模块定位\n| 模块 | 大模型 | API | MCP | Skill | 回流 |\n|------|--------|-----|-----|-------|------|\n| 核心定位 | 理解与思考 | 连接与暴露能力 | 调度与执行工具 | 沉淀与复用流程 | 反馈与优化 |\n| 主要职责 | 意图识别、任务拆解 | 接口封装、鉴权原流 | 工具选型、编排调用 | 流程编排、模板沉淀 | 结果聚合、智能总结 |\n| 产出物 | 任务计划 | 可调用API列表 | 工具执行结果 | 可复用Skill | 最终回复~日志 |\n\n### 总结\n- **智能体能干活，靠的不是一个模型，而是一整条能力链的协同运作**。\n- **理解（大模型）+ 连接（API）+ 调度（MCP）+ 沉淀（Skill）+ 回流（反馈）= 闭环智能体**\n\n### 落地建议\n- 先打通最小闭环，再逐步丰富能力\n- 优先沉淀高频流程，快速复用\n- 做好日志与评估，持续优化模型与流程\n- 保持接口与工具的稳定性与可扩展性\n\n### 公众号信息\n- 广东阿风AI创业笔记\n- 阿风的AI落地笔记', 1702, 5, 2, NULL, 2, '2026-05-20 06:29:39', '2026-05-20 06:30:19');

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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '故障知识库表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of knowledge_base
-- ----------------------------

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
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '维修内容分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of maintenance_categories
-- ----------------------------
INSERT INTO `maintenance_categories` VALUES (1, '空调维修', 'MAINT_AC', '空调相关维修项目', 1, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_categories` VALUES (2, '冰箱维修', 'MAINT_FRIDGE', '冰箱相关维修项目', 2, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_categories` VALUES (3, '洗衣机维修', 'MAINT_WASHER', '洗衣机相关维修项目', 3, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_categories` VALUES (4, '热水器维修', 'MAINT_WATER_HEATER', '热水器相关维修项目', 4, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_categories` VALUES (5, '电视机维修', 'MAINT_TV', '电视机相关维修项目', 5, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_categories` VALUES (6, '电脑维修', 'MAINT_COMPUTER', '电脑相关维修项目', 6, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_categories` VALUES (7, '网络设备维修', 'MAINT_NETWORK', '网络设备相关维修项目', 7, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_categories` VALUES (8, '其他维修', 'MAINT_OTHER', '其他维修项目', 99, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');

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
) ENGINE = InnoDB AUTO_INCREMENT = 9016 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '维修内容表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of maintenance_items
-- ----------------------------
INSERT INTO `maintenance_items` VALUES (1000, 'AC-001', '空调清洗', 1, '次', 100.00, '空调内机深度清洗服务，包括蒸发器、风轮等部件', 1, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (1001, 'AC-002', '空调加氟', 1, '次', 150.00, '空调制冷剂补充服务', 2, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (1002, 'AC-003', '空调维修 - 不制冷', 1, '次', 200.00, '空调不制冷故障排查与维修', 3, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (1003, 'AC-004', '空调维修 - 不制热', 1, '次', 200.00, '空调不制热故障排查与维修', 4, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (1004, 'AC-005', '空调漏水维修', 1, '次', 180.00, '空调漏水问题排查与修复', 5, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (1005, 'AC-006', '空调异响处理', 1, '次', 150.00, '空调运行异响排查与处理', 6, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (2000, 'FR-001', '冰箱清洗消毒', 2, '次', 120.00, '冰箱内外清洁与消毒服务', 1, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (2001, 'FR-002', '冰箱不制冷维修', 2, '次', 250.00, '冰箱不制冷故障排查与维修', 2, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (2002, 'FR-003', '冰箱门封更换', 2, '个', 100.00, '冰箱门封条更换服务', 3, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (2003, 'FR-004', '冰箱温控器维修', 2, '次', 200.00, '冰箱温控器故障维修', 4, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (2004, 'FR-005', '冰箱除霜维修', 2, '次', 150.00, '冰箱除霜系统故障维修', 5, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (3000, 'WS-001', '洗衣机清洗', 3, '次', 100.00, '洗衣机内筒深度清洗', 1, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (3001, 'WS-002', '洗衣机不排水维修', 3, '次', 180.00, '洗衣机排水故障维修', 2, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (3002, 'WS-003', '洗衣机不转动维修', 3, '次', 220.00, '洗衣机滚筒不转动故障维修', 3, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (3003, 'WS-004', '洗衣机漏水维修', 3, '次', 200.00, '洗衣机漏水问题排查与修复', 4, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (3004, 'WS-005', '洗衣机异响处理', 3, '次', 150.00, '洗衣机运行异响排查与处理', 5, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (4000, 'WH-001', '热水器清洗保养', 4, '次', 150.00, '热水器内胆清洗与保养', 1, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (4001, 'WH-002', '热水器不加热维修', 4, '次', 200.00, '热水器加热故障维修', 2, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (4002, 'WH-003', '热水器漏水维修', 4, '次', 180.00, '热水器漏水问题排查与修复', 3, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (4003, 'WH-004', '热水器温控器更换', 4, '个', 120.00, '热水器温控器更换服务', 4, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (5000, 'TV-001', '电视机黑屏维修', 5, '次', 300.00, '电视机黑屏故障排查与维修', 1, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (5001, 'TV-002', '电视机无声音维修', 5, '次', 200.00, '电视机无声音故障维修', 2, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (5002, 'TV-003', '电视机无法开机维修', 5, '次', 250.00, '电视机无法开机故障维修', 3, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (5003, 'TV-004', '电视机画面异常维修', 5, '次', 280.00, '电视机画面异常故障维修', 4, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (6000, 'PC-001', '电脑系统重装', 6, '次', 150.00, '电脑操作系统安装与配置', 1, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (6001, 'PC-002', '电脑无法开机维修', 6, '次', 200.00, '电脑无法开机故障排查与维修', 2, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (6002, 'PC-003', '电脑蓝屏维修', 6, '次', 180.00, '电脑蓝屏故障排查与修复', 3, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (6003, 'PC-004', '电脑硬件升级', 6, '次', 100.00, '电脑硬件升级安装服务', 4, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (6004, 'PC-005', '电脑病毒查杀', 6, '次', 80.00, '电脑病毒查杀与清理', 5, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (7000, 'NET-001', '路由器维修', 7, '次', 150.00, '路由器故障排查与维修', 1, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (7001, 'NET-002', '交换机维修', 7, '次', 200.00, '交换机故障排查与维修', 2, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (7002, 'NET-003', '网络布线', 7, '米', 30.00, '网络综合布线服务', 3, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (7003, 'NET-004', '网络调试', 7, '次', 100.00, '网络配置与调试服务', 4, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (9000, 'OTH-001', '家电维修咨询', 8, '次', 50.00, '家电维修技术咨询', 1, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (9001, 'OTH-002', '上门检测费', 8, '次', 80.00, '上门故障检测服务费', 2, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (9002, 'OTH-003', '配件更换安装', 8, '次', 100.00, '配件更换与安装服务', 3, 1, '2026-04-01 02:15:26', '2026-04-01 02:15:26');
INSERT INTO `maintenance_items` VALUES (9003, 'CP-0066', '电池问题', 1, '次', 99.00, '价格范围：99元起；[手机]', 0, 1, '2026-06-02 01:23:42', '2026-06-02 01:23:42');
INSERT INTO `maintenance_items` VALUES (9004, 'CP-0067', '屏幕碎裂', 1, '次', 199.00, '价格范围：199元起；[手机]', 0, 1, '2026-06-02 01:23:42', '2026-06-02 01:23:42');
INSERT INTO `maintenance_items` VALUES (9005, 'CP-0068', '声音异常', 1, '次', 149.00, '价格范围：149元起；[手机]', 0, 1, '2026-06-02 01:23:42', '2026-06-02 01:23:42');
INSERT INTO `maintenance_items` VALUES (9006, 'CP-0069', '摄像头故障', 1, '次', 179.00, '价格范围：179元起；[手机]', 0, 1, '2026-06-02 01:23:42', '2026-06-02 01:23:42');
INSERT INTO `maintenance_items` VALUES (9007, 'CP-0070', '无法充电', 1, '次', 89.00, '价格范围：89元起；[手机]', 0, 1, '2026-06-02 01:23:42', '2026-06-02 01:23:42');
INSERT INTO `maintenance_items` VALUES (9008, 'CP-0071', '主板故障', 1, '次', 299.00, '价格范围：299元起；[手机]', 0, 1, '2026-06-02 01:23:42', '2026-06-02 01:23:42');
INSERT INTO `maintenance_items` VALUES (9009, 'CP-0072', '屏幕问题', 1, '次', 399.00, '价格范围：399元起；[电脑]', 0, 1, '2026-06-02 01:23:42', '2026-06-02 01:23:42');
INSERT INTO `maintenance_items` VALUES (9010, 'CP-0073', '键盘故障', 1, '次', 149.00, '价格范围：149元起；[电脑]', 0, 1, '2026-06-02 01:23:42', '2026-06-02 01:23:42');
INSERT INTO `maintenance_items` VALUES (9011, 'CP-0074', '电池更换', 1, '次', 199.00, '价格范围：199元起；[电脑]', 0, 1, '2026-06-02 01:23:42', '2026-06-02 01:23:42');
INSERT INTO `maintenance_items` VALUES (9012, 'CP-0075', '硬盘故障', 1, '次', 299.00, '价格范围：299元起；[电脑]', 0, 1, '2026-06-02 01:23:42', '2026-06-02 01:23:42');
INSERT INTO `maintenance_items` VALUES (9013, 'CP-0076', '屏幕碎裂', 1, '次', 299.00, '价格范围：299元起；[平板]', 0, 1, '2026-06-02 01:23:42', '2026-06-02 01:23:42');
INSERT INTO `maintenance_items` VALUES (9014, 'CP-0077', '电池问题', 1, '次', 179.00, '价格范围：179元起；[平板]', 0, 1, '2026-06-02 01:23:42', '2026-06-02 01:23:42');
INSERT INTO `maintenance_items` VALUES (9015, 'CP-0078', '声音故障', 1, '次', 129.00, '价格范围：129元起；[平板]', 0, 1, '2026-06-02 01:23:42', '2026-06-02 01:23:42');

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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '保养计划表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of maintenance_plans
-- ----------------------------

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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '保养记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of maintenance_records
-- ----------------------------

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
-- Records of marketing_cases
-- ----------------------------
INSERT INTO `marketing_cases` VALUES (1, '某大型制造企业设备维修项目', '华东机械制造有限公司', '制造业', 'https://picsum.photos/seed/case1/200/150', '成功完成企业生产线设备维护，提高设备运行效率30%，获得客户高度认可。', 1, 1, '2024-01-15 10:30:00', '2024-01-15 10:30:00');
INSERT INTO `marketing_cases` VALUES (2, '建筑工地工程机械维修', '中建某局', '建筑业', 'https://picsum.photos/seed/case2/200/150', '快速响应，24小时内完成工程机械故障排查与维修，保障工地正常施工。', 2, 1, '2024-01-10 14:20:00', '2024-01-10 14:20:00');
INSERT INTO `marketing_cases` VALUES (3, '物流中心叉车维修保养', '顺丰物流产业园', '物流业', 'https://picsum.photos/seed/case3/200/150', '定期保养维护，降低叉车故障率50%，提升物流效率。', 3, 1, '2024-01-05 09:15:00', '2024-01-05 09:15:00');
INSERT INTO `marketing_cases` VALUES (4, '发电机组维修改造', '国家能源集团', '能源业', 'https://picsum.photos/seed/case4/200/150', '老旧发电机组改造，提升发电效率20%，节约运营成本。', 4, 1, '2023-12-20 16:45:00', '2023-12-20 16:45:00');
INSERT INTO `marketing_cases` VALUES (5, '医院医疗设备维护', '仁和医院', '医疗业', 'https://picsum.photos/seed/case5/200/150', '专业医疗设备维护保养服务，确保设备安全稳定运行。', 5, 1, '2023-12-15 11:00:00', '2023-12-15 11:00:00');
INSERT INTO `marketing_cases` VALUES (6, '食品工厂设备升级改造', '康师傅食品厂', '食品业', 'https://picsum.photos/seed/case6/200/150', '生产线设备升级改造，提高产能并符合食品安全标准。', 6, 0, '2023-11-10 08:30:00', '2023-11-10 08:30:00');

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
-- Records of marketing_douyin_content
-- ----------------------------
INSERT INTO `marketing_douyin_content` VALUES (1, '大型挖掘机液压系统维修教程', 'https://www.douyin.com/video/1234567890', NULL, NULL, 'https://picsum.photos/seed/dy1/200/150', '详细讲解挖掘机液压系统常见故障及维修方法', '机械维修,挖掘机,液压系统', 12500, 856, 124, 45, 1, '2024-01-20 15:30:00', '2024-01-20 15:30:00', '2024-01-20 15:30:00');
INSERT INTO `marketing_douyin_content` VALUES (2, '起重机日常保养要点', 'https://www.douyin.com/video/2345678901', '/var/www/html/rpa_files/videos/video_2_1775785260.mp4', 'video_2_1775785260.mp4', 'https://picsum.photos/seed/dy2/200/150', '起重机日常检查和保养的关键步骤，延长设备寿命', '起重机,设备保养,工程机械', 8900, 523, 78, 32, 1, '2024-01-18 10:00:00', '2024-01-18 10:00:00', '2026-04-10 09:41:01');
INSERT INTO `marketing_douyin_content` VALUES (3, '混凝土泵车故障快速诊断', 'https://www.douyin.com/video/3456789012', NULL, NULL, 'https://picsum.photos/seed/dy3/200/150', '泵车常见故障的快速判断和解决方法', '混凝土泵车,故障诊断,维修技巧', 15600, 1205, 189, 67, 1, '2024-01-15 14:20:00', '2024-01-15 14:20:00', '2024-01-15 14:20:00');
INSERT INTO `marketing_douyin_content` VALUES (4, '空压机节能改造分享', 'https://www.douyin.com/video/4567890123', NULL, NULL, 'https://picsum.photos/seed/dy4/200/150', '工厂空压机节能改造案例分享，降低用电成本', '空压机,节能改造,工业设备', 6800, 412, 56, 23, 1, '2024-01-12 09:00:00', '2024-01-12 09:00:00', '2024-01-12 09:00:00');
INSERT INTO `marketing_douyin_content` VALUES (5, '数控机床精度调整方法', 'https://www.douyin.com/video/5678901234', NULL, NULL, 'https://picsum.photos/seed/dy5/200/150', '数控机床精度调整的详细步骤和注意事项', '数控机床,精度调整,机械设备', 9200, 678, 92, 38, 1, '2024-01-10 16:00:00', '2024-01-10 16:00:00', '2024-01-10 16:00:00');
INSERT INTO `marketing_douyin_content` VALUES (6, '叉车电瓶维护技巧', 'https://www.douyin.com/video/6789012345', NULL, NULL, 'https://picsum.photos/seed/dy6/200/150', '叉车电瓶日常维护和保养技巧，延长电瓶使用寿命', '叉车,电瓶维护,设备保养', 0, 0, 0, 0, 0, NULL, '2024-01-08 11:00:00', '2024-01-08 11:00:00');
INSERT INTO `marketing_douyin_content` VALUES (7, '维修', 'https://coze-coding-project.tos.coze.site/coze_storage_7626269083839004708/video/video_generate_cgt-20260408154238-n2vmh.mp4?sign=1807170273-d70f032c2b-0-3715c8ff0a092e0edf393a443441d7d26af95c9860725a7861a84db68b5ffb07', '/var/www/html/rpa_files/videos/video_7_1776068918.mp4', 'video_7_1776068918.mp4', '', '一个小伙子正在维修无人机，镜头围着他转，他说了声维修电子产品上爱维修', '维修无人机', 0, 0, 0, 0, 0, '2026-04-08 15:44:33', '2026-04-08 15:44:33', '2026-04-13 16:28:41');
INSERT INTO `marketing_douyin_content` VALUES (8, '爱维修', 'https://coze-coding-project.tos.coze.site/coze_storage_7626269083839004708/video/video_generate_cgt-20260410102857-l2qbg.mp4?sign=1807324240-038f9bc517-0-fccc57c16e86f1db332d17e2569b6ca1eb8d1407053649b49d45af52a9fcf2ac', '/var/www/html/rpa_files/videos/video_8_1776069212.mp4', 'video_8_1776069212.mp4', '', '维修电子产品上爱维修', '维修', 0, 0, 0, 0, 0, '2026-04-10 10:30:41', '2026-04-10 10:30:41', '2026-04-15 02:43:01');
INSERT INTO `marketing_douyin_content` VALUES (9, '小猪猪', '/uploads/general/69df3b63e00b9_1776237411.mp4', NULL, NULL, '/uploads/general/69df3b91106f5_1776237457.jpg', '这是一只小香猪', '香猪', 0, 0, 0, 0, 0, NULL, '2026-04-15 15:17:37', '2026-04-15 15:17:37');

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
-- Records of marketing_partners
-- ----------------------------
INSERT INTO `marketing_partners` VALUES (1, '中联重科股份有限公司', 'https://picsum.photos/seed/logo1/80/50', '制造业', '张经理', '13800138001', '供应商', '2023-01-15', '国内领先的工程机械制造企业，主要供应混凝土机械、起重机械等设备', 1, '2023-01-15 10:00:00', '2023-01-15 10:00:00');
INSERT INTO `marketing_partners` VALUES (2, '三一重工股份有限公司', 'https://picsum.photos/seed/logo2/80/50', '制造业', '李经理', '13800138002', '供应商', '2023-03-20', '工程机械行业龙头企业，挖掘机、混凝土设备供应商', 1, '2023-03-20 14:30:00', '2023-03-20 14:30:00');
INSERT INTO `marketing_partners` VALUES (3, '中国建筑第三工程局', 'https://picsum.photos/seed/logo3/80/50', '建筑业', '王主管', '13800138003', '客户', '2023-05-10', '大型建筑施工企业，我司提供设备维修保养服务', 1, '2023-05-10 09:15:00', '2023-05-10 09:15:00');
INSERT INTO `marketing_partners` VALUES (4, '徐工集团工程机械有限公司', 'https://picsum.photos/seed/logo4/80/50', '制造业', '赵经理', '13800138004', '供应商', '2022-08-01', '工程机械制造企业，合作已终止', 0, '2022-08-01 16:00:00', '2024-01-10 10:00:00');
INSERT INTO `marketing_partners` VALUES (5, '阿特拉斯科普柯', 'https://picsum.photos/seed/logo5/80/50', '制造业', '陈经理', '13800138005', '供应商', '2023-06-15', '全球领先的压缩机、空压机制造商，售后服务合作伙伴', 1, '2023-06-15 11:00:00', '2023-06-15 11:00:00');
INSERT INTO `marketing_partners` VALUES (6, '大族激光科技', 'https://picsum.photos/seed/logo6/80/50', '制造业', '林工', '13800138006', '供应商', '2023-09-01', '激光切割设备制造商，设备维保服务合作商', 1, '2023-09-01 14:00:00', '2023-09-01 14:00:00');
INSERT INTO `marketing_partners` VALUES (7, '顺丰物流产业园', 'https://picsum.photos/seed/logo7/80/50', '物流业', '周主管', '13800138007', '客户', '2023-04-01', '大型物流企业，叉车及物流设备维修保养客户', 1, '2023-04-01 09:00:00', '2023-04-01 09:00:00');
INSERT INTO `marketing_partners` VALUES (8, '国家能源集团', 'https://picsum.photos/seed/logo8/80/50', '能源业', '吴经理', '13800138008', '客户', '2022-12-01', '大型能源企业，发电机组维修改造项目合作', 1, '2022-12-01 10:00:00', '2022-12-01 10:00:00');

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
-- Records of marketing_service_config
-- ----------------------------
INSERT INTO `marketing_service_config` VALUES (1, '400-888-8888', 'service_kefu001', '12345678900', 'service@example.com', '周一至周日 8:00-22:00', 'https://picsum.photos/seed/qrcode/150/150', '为您提供专业的设备维修咨询服务，如有疑问请联系客服，我们将在第一时间为您解答。', 1, '2024-01-01 09:00:00', '2026-04-08 09:49:21');
INSERT INTO `marketing_service_config` VALUES (13, '', '', '', '', '', '', '', 1, '2026-04-08 09:25:26', '2026-04-08 09:25:26');

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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '小程序订单关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of miniprogram_order_mapping
-- ----------------------------

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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '小程序进度照片同步记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of miniprogram_progress_photo_sync
-- ----------------------------

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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '小程序进度同步记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of miniprogram_progress_sync
-- ----------------------------

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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '小程序进度视频同步记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of miniprogram_progress_video_sync
-- ----------------------------

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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '通知表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of notifications
-- ----------------------------

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
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '工单工程师关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of order_engineers
-- ----------------------------
INSERT INTO `order_engineers` VALUES (1, 101, 1, 1, '2026-03-20 10:00:00');
INSERT INTO `order_engineers` VALUES (2, 102, 2, 1, '2026-03-20 10:10:00');
INSERT INTO `order_engineers` VALUES (3, 103, 1, 1, '2026-03-21 09:00:00');
INSERT INTO `order_engineers` VALUES (4, 103, 2, 2, '2026-03-21 09:05:00');
INSERT INTO `order_engineers` VALUES (5, 104, 3, 1, '2026-03-22 11:00:00');
INSERT INTO `order_engineers` VALUES (6, 105, 4, 1, '2026-03-23 14:30:00');
INSERT INTO `order_engineers` VALUES (7, 106, 5, 1, '2026-03-24 16:20:00');
INSERT INTO `order_engineers` VALUES (8, 107, 1, 1, '2026-03-25 08:50:00');
INSERT INTO `order_engineers` VALUES (9, 108, 3, 1, '2026-03-25 13:10:00');
INSERT INTO `order_engineers` VALUES (10, 109, 5, 1, '2026-03-26 10:15:00');

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
-- Records of organizations
-- ----------------------------
INSERT INTO `organizations` VALUES (1, NULL, '总公司', 'COMP001', 'company', '陈总', '13800138000', '北京市朝阳区 CBD 商务中心 A 座 1 层', 1, 1, '公司总部', '2026-03-31 06:36:32', '2026-03-31 06:36:57');
INSERT INTO `organizations` VALUES (2, 1, '上海分公司', 'COMP002', 'company', '李经理', '13800138001', '上海市浦东新区陆家嘴金融大厦 B 座 5 层', 1, 1, '上海地区分公司', '2026-03-31 06:36:32', '2026-03-31 06:36:32');
INSERT INTO `organizations` VALUES (3, 1, '深圳分公司', 'COMP003', 'company', '王经理', '13800138002', '深圳市福田区科技园 C 座 3 层', 2, 1, '深圳地区分公司', '2026-03-31 06:36:32', '2026-03-31 06:36:32');
INSERT INTO `organizations` VALUES (4, 2, '上海技术部', 'DEPT001', 'department', '赵主管', '13800138003', '上海市浦东新区陆家嘴金融大厦 B 座 5 层', 1, 1, '上海分公司技术部门', '2026-03-31 06:36:32', '2026-03-31 06:36:32');
INSERT INTO `organizations` VALUES (5, 2, '上海销售部', 'DEPT002', 'department', '钱主管', '13800138004', '上海市浦东新区陆家嘴金融大厦 B 座 5 层', 2, 1, '上海分公司销售部门', '2026-03-31 06:36:32', '2026-03-31 06:36:32');
INSERT INTO `organizations` VALUES (6, 3, '深圳技术部', 'DEPT003', 'department', '孙主管', '13800138005', '深圳市福田区科技园 C 座 3 层', 1, 1, '深圳分公司技术部门', '2026-03-31 06:36:32', '2026-03-31 06:36:32');
INSERT INTO `organizations` VALUES (7, 1, '北京研发中心', 'PROJ001', 'project', '周经理', '13800138006', '北京市海淀区中关村 D 座 10 层', 3, 1, '北京研发项目组', '2026-03-31 06:36:32', '2026-03-31 06:36:32');

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
-- Records of permissions
-- ----------------------------
INSERT INTO `permissions` VALUES (1, NULL, '系统管理', 'system', 'menu', '/system', 'Setting', 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (2, NULL, '业务管理', 'business', 'menu', '/business', 'Briefcase', 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (3, NULL, '引流模块', 'marketing', 'menu', '/marketing', 'TrendCharts', 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (4, NULL, '维修业务', 'repair', 'menu', '/repair', 'Tools', 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (5, NULL, '支付模块', 'payment', 'menu', '/payment', 'Wallet', 5, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (6, NULL, '进销存', 'inventory', 'menu', '/inventory', 'Box', 6, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (7, NULL, '查询统计', 'statistics', 'menu', '/statistics', 'DataAnalysis', 7, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (10, 1, '用户管理', 'system.users', 'menu', '/basic/users', 'User', 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (11, 10, '查看用户', 'system.users.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (12, 10, '新增用户', 'system.users.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (13, 10, '编辑用户', 'system.users.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (14, 10, '删除用户', 'system.users.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (20, 1, '角色管理', 'system.roles', 'menu', '/basic/roles', 'UserFilled', 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (21, 20, '查看角色', 'system.roles.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (22, 20, '新增角色', 'system.roles.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (23, 20, '编辑角色', 'system.roles.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (24, 20, '删除角色', 'system.roles.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (25, 20, '配置权限', 'system.roles.permissions', 'button', NULL, NULL, 5, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (30, 1, '权限管理', 'system.permissions', 'menu', '/basic/permissions', 'Lock', 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (31, 30, '查看权限', 'system.permissions.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (32, 30, '新增权限', 'system.permissions.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (33, 30, '编辑权限', 'system.permissions.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (34, 30, '删除权限', 'system.permissions.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (40, 1, '人员管理', 'system.personnel', 'menu', '/basic/personnel', 'Avatar', 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (41, 40, '查看人员', 'system.personnel.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (42, 40, '新增人员', 'system.personnel.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (43, 40, '编辑人员', 'system.personnel.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (44, 40, '删除人员', 'system.personnel.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (50, 1, '单位管理', 'system.organizations', 'menu', '/basic/organizations', 'OfficeBuilding', 5, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (51, 50, '查看单位', 'system.organizations.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (52, 50, '新增单位', 'system.organizations.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (53, 50, '编辑单位', 'system.organizations.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (54, 50, '删除单位', 'system.organizations.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (60, 1, '日志管理', 'system.logs', 'menu', '/basic/logs', 'Document', 6, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (61, 60, '查看日志', 'system.logs.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (62, 60, '导出日志', 'system.logs.export', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (63, 60, '删除日志', 'system.logs.delete', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (70, 1, '参数管理', 'system.params', 'menu', '/basic/params', 'Operation', 7, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (71, 70, '查看参数', 'system.params.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (72, 70, '编辑参数', 'system.params.edit', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (100, 2, '免责协议管理', 'business.agreement', 'menu', '/business/agreement', 'Document', 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (101, 100, '查看协议', 'business.agreement.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (102, 100, '新增协议', 'business.agreement.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (103, 100, '编辑协议', 'business.agreement.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (104, 100, '删除协议', 'business.agreement.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (110, 2, '维修内容管理', 'business.content', 'menu', '/business/content', 'Edit', 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (111, 110, '查看维修内容', 'business.content.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (112, 110, '新增维修内容', 'business.content.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (113, 110, '编辑维修内容', 'business.content.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (114, 110, '删除维修内容', 'business.content.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (120, 2, '绑定/解绑', 'business.binding', 'menu', '/business/binding', 'Link', 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (121, 120, '查看绑定', 'business.binding.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (122, 120, '执行绑定', 'business.binding.bind', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (123, 120, '执行解绑', 'business.binding.unbind', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (200, 3, '成功案例', 'marketing.cases', 'menu', '/marketing/cases', 'Star', 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (201, 200, '查看案例', 'marketing.cases.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (202, 200, '新增案例', 'marketing.cases.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (203, 200, '编辑案例', 'marketing.cases.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (204, 200, '删除案例', 'marketing.cases.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (210, 3, '人工客服', 'marketing.service', 'menu', '/marketing/service', 'Service', 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (211, 210, '查看客服配置', 'marketing.service.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (212, 210, '编辑客服配置', 'marketing.service.edit', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (220, 3, '抖音获客', 'marketing.douyin', 'menu', '/marketing/douyin', 'VideoPlay', 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (221, 220, '查看抖音内容', 'marketing.douyin.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (222, 220, '发布抖音内容', 'marketing.douyin.publish', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (223, 220, '编辑抖音内容', 'marketing.douyin.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (224, 220, '删除抖音内容', 'marketing.douyin.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (230, 3, '小红书获客', 'marketing.xiaohongshu', 'menu', '/marketing/xiaohongshu', 'Picture', 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (231, 230, '查看小红书内容', 'marketing.xiaohongshu.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (232, 230, '发布小红书内容', 'marketing.xiaohongshu.publish', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (233, 230, '编辑小红书内容', 'marketing.xiaohongshu.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (234, 230, '删除小红书内容', 'marketing.xiaohongshu.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (240, 3, '快手获客', 'marketing.kuaishou', 'menu', '/marketing/kuaishou', 'VideoPlay', 5, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (241, 240, '查看快手内容', 'marketing.kuaishou.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (242, 240, '发布快手内容', 'marketing.kuaishou.publish', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (243, 240, '编辑快手内容', 'marketing.kuaishou.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (244, 240, '删除快手内容', 'marketing.kuaishou.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (250, 3, 'B站获客', 'marketing.bilibili', 'menu', '/marketing/bilibili', 'VideoPlay', 6, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (251, 250, '查看B站内容', 'marketing.bilibili.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (252, 250, '发布B站内容', 'marketing.bilibili.publish', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (253, 250, '编辑B站内容', 'marketing.bilibili.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (254, 250, '删除B站内容', 'marketing.bilibili.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (260, 3, '合作企业', 'marketing.partners', 'menu', '/marketing/partners', 'OfficeBuilding', 7, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (261, 260, '查看合作企业', 'marketing.partners.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (262, 260, '新增合作企业', 'marketing.partners.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (263, 260, '编辑合作企业', 'marketing.partners.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (264, 260, '删除合作企业', 'marketing.partners.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (300, 4, '机械种类管理', 'repair.categories', 'menu', '/repair/categories', 'Menu', 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (301, 300, '查看机械种类', 'repair.categories.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (302, 300, '新增机械种类', 'repair.categories.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (303, 300, '编辑机械种类', 'repair.categories.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (304, 300, '删除机械种类', 'repair.categories.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (310, 4, '机械名称管理', 'repair.machines', 'menu', '/repair/machines', 'Monitor', 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (311, 310, '查看机械名称', 'repair.machines.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (312, 310, '新增机械名称', 'repair.machines.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (313, 310, '编辑机械名称', 'repair.machines.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (314, 310, '删除机械名称', 'repair.machines.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (320, 4, '订单管理', 'repair.orders', 'menu', '/repair/orders', 'Tickets', 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (321, 320, '小程序订单', 'repair.orders.miniprogram', 'menu', '/repair/orders/miniprogram', 'Iphone', 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (322, 321, '查看小程序订单', 'repair.orders.miniprogram.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (323, 321, '派单', 'repair.orders.miniprogram.assign', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (324, 321, '接单', 'repair.orders.miniprogram.accept', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (325, 321, '完成订单', 'repair.orders.miniprogram.complete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (326, 321, '取消订单', 'repair.orders.miniprogram.cancel', 'button', NULL, NULL, 5, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (331, 320, '手动创建订单', 'repair.orders.manual', 'menu', '/repair/orders/manual', 'Plus', 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (332, 331, '查看手动订单', 'repair.orders.manual.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (333, 331, '创建订单', 'repair.orders.manual.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (334, 331, '编辑订单', 'repair.orders.manual.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (335, 331, '删除订单', 'repair.orders.manual.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (340, 4, '检测报告', 'repair.test-report', 'menu', '/repair/test-report', 'DocumentChecked', 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (341, 340, '检测记录', 'repair.test-report.records', 'menu', '/repair/test-report/records', 'List', 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (342, 341, '查看检测记录', 'repair.test-report.records.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (343, 341, '创建检测记录', 'repair.test-report.records.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (344, 341, '编辑检测记录', 'repair.test-report.records.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (345, 341, '删除检测记录', 'repair.test-report.records.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (351, 340, '维修报价单', 'repair.test-report.quote', 'menu', '/repair/test-report/quote', 'Money', 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (352, 351, '查看报价单', 'repair.test-report.quote.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (353, 351, '创建报价单', 'repair.test-report.quote.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (354, 351, '编辑报价单', 'repair.test-report.quote.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (355, 351, '删除报价单', 'repair.test-report.quote.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (361, 340, '检测费用', 'repair.test-report.fee', 'menu', '/repair/test-report/fee', 'Wallet', 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (362, 361, '查看检测费用', 'repair.test-report.fee.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (363, 361, '编辑检测设置', 'repair.test-report.fee.edit', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (370, 4, '维修报告', 'repair.repair-report', 'menu', '/repair/repair-report', 'Document', 5, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (371, 370, '查看维修报告', 'repair.repair-report.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (372, 370, '创建维修报告', 'repair.repair-report.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (373, 370, '编辑维修报告', 'repair.repair-report.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (374, 370, '删除维修报告', 'repair.repair-report.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (380, 4, '维修合同', 'repair.contract', 'menu', '/repair/contract', 'Tickets', 6, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (381, 380, '查看维修合同', 'repair.contract.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (382, 380, '创建维修合同', 'repair.contract.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (383, 380, '编辑维修合同', 'repair.contract.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (384, 380, '删除维修合同', 'repair.contract.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (390, 4, '维修提醒', 'repair.reminder', 'menu', '/repair/reminder', 'Bell', 7, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (391, 390, '查看维修提醒', 'repair.reminder.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (392, 390, '创建维修提醒', 'repair.reminder.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (393, 390, '编辑维修提醒', 'repair.reminder.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (394, 390, '删除维修提醒', 'repair.reminder.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (400, 4, '联动维修', 'repair.external', 'menu', '/repair/external', 'Connection', 8, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (401, 400, '查看联动维修', 'repair.external.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (402, 400, '创建联动维修', 'repair.external.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (403, 400, '编辑联动维修', 'repair.external.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (404, 400, '删除联动维修', 'repair.external.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (410, 4, '维修进度', 'repair.progress', 'menu', '/repair/progress', 'Clock', 9, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (411, 410, '进度申请', 'repair.progress.apply', 'menu', '/repair/progress/apply', 'DocumentAdd', 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (412, 411, '查看进度申请', 'repair.progress.apply.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (413, 411, '创建进度申请', 'repair.progress.apply.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (414, 411, '审核进度申请', 'repair.progress.apply.approve', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (421, 410, '进度照片', 'repair.progress.photo', 'menu', '/repair/progress/photo', 'Picture', 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (422, 421, '查看进度照片', 'repair.progress.photo.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (423, 421, '上传进度照片', 'repair.progress.photo.upload', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (424, 421, '删除进度照片', 'repair.progress.photo.delete', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (431, 410, '进度视频', 'repair.progress.video', 'menu', '/repair/progress/video', 'VideoPlay', 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (432, 431, '查看进度视频', 'repair.progress.video.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (433, 431, '上传进度视频', 'repair.repair-progress.video.upload', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (434, 431, '删除进度视频', 'repair.progress.video.delete', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (500, 5, '转账支付', 'payment.transfer', 'menu', '/payment/transfer', 'Money', 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (501, 500, '查看转账记录', 'payment.transfer.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (502, 500, '创建转账', 'payment.transfer.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (510, 5, '在线支付', 'payment.online', 'menu', '/payment/online', 'Iphone', 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (511, 510, '查看在线支付记录', 'payment.online.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (512, 510, '创建在线支付', 'payment.online.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (513, 510, '退款', 'payment.online.refund', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (520, 5, '支付宝测试', 'payment.alipay-test', 'menu', '/payment/alipay-test', 'CreditCard', 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (521, 520, '执行测试', 'payment.alipay-test.run', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (530, 5, '发票管理', 'payment.invoice', 'menu', '/payment/invoice', 'Tickets', 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (531, 530, '查看发票', 'payment.invoice.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (532, 530, '创建发票', 'payment.invoice.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (533, 530, '编辑发票', 'payment.invoice.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (534, 530, '删除发票', 'payment.invoice.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (600, 6, '配件管理', 'inventory.parts', 'menu', '/inventory/parts', 'Goods', 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (601, 600, '查看配件', 'inventory.parts.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (602, 600, '新增配件', 'inventory.parts.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (603, 600, '编辑配件', 'inventory.parts.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (604, 600, '删除配件', 'inventory.parts.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (605, 600, '入库', 'inventory.parts.inbound', 'button', NULL, NULL, 5, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (606, 600, '出库', 'inventory.parts.outbound', 'button', NULL, NULL, 6, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (607, 600, '盘点', 'inventory.parts.stocktake', 'button', NULL, NULL, 7, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (610, 6, '供应商管理', 'inventory.suppliers', 'menu', '/inventory/suppliers', 'Van', 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (611, 610, '查看供应商', 'inventory.suppliers.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (612, 610, '新增供应商', 'inventory.suppliers.create', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (613, 610, '编辑供应商', 'inventory.suppliers.edit', 'button', NULL, NULL, 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (614, 610, '删除供应商', 'inventory.suppliers.delete', 'button', NULL, NULL, 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (700, 7, '收入统计', 'statistics.income', 'menu', '/statistics/income', 'TrendCharts', 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (701, 700, '查看收入统计', 'statistics.income.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (702, 700, '导出收入报表', 'statistics.income.export', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (710, 7, '开支统计', 'statistics.expense', 'menu', '/statistics/expense', 'DataLine', 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (711, 710, '查看开支统计', 'statistics.expense.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (712, 710, '导出开支报表', 'statistics.expense.export', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (720, 7, '订单统计', 'statistics.order-stats', 'menu', '/statistics/order-stats', 'Tickets', 3, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (721, 720, '查看订单统计', 'statistics.order-stats.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (722, 720, '导出订单报表', 'statistics.order-stats.export', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (730, 7, '超时统计', 'statistics.timeout', 'menu', '/statistics/timeout', 'Clock', 4, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (731, 730, '查看超时统计', 'statistics.timeout.view', 'button', NULL, NULL, 1, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (732, 730, '导出超时报表', 'statistics.timeout.export', 'button', NULL, NULL, 2, 1, '2026-04-20 02:49:30', '2026-04-20 02:49:30');
INSERT INTO `permissions` VALUES (733, 120, '查看绑定列表', 'bindings:list', 'button', NULL, NULL, 1, 1, '2026-04-22 04:44:15', '2026-04-22 04:44:15');
INSERT INTO `permissions` VALUES (734, 120, '执行绑定操作', 'bindings:create', 'button', NULL, NULL, 2, 1, '2026-04-22 04:44:15', '2026-04-22 04:44:15');
INSERT INTO `permissions` VALUES (735, 120, '执行解绑操作', 'bindings:delete', 'button', NULL, NULL, 3, 1, '2026-04-22 04:44:15', '2026-04-22 04:44:15');
INSERT INTO `permissions` VALUES (736, NULL, '发票开票', 'invoices:issue', 'button', NULL, NULL, 0, 1, '2026-05-20 08:28:36', '2026-05-20 08:32:57');
INSERT INTO `permissions` VALUES (737, NULL, '发票作废', 'invoices:void', 'button', NULL, NULL, 0, 1, '2026-05-20 08:28:36', '2026-05-20 08:32:57');

-- ----------------------------
-- Table structure for permissions_backup
-- ----------------------------
DROP TABLE IF EXISTS `permissions_backup`;
CREATE TABLE `permissions_backup`  (
  `id` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '权限ID',
  `user_id` int UNSIGNED NOT NULL COMMENT '用户ID',
  `module` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '模块名称',
  `actions` json NOT NULL COMMENT '权限操作',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of permissions_backup
-- ----------------------------
INSERT INTO `permissions_backup` VALUES (1, 1, 'devices', '[\"view\", \"create\", \"update\", \"delete\"]', '2026-03-30 07:38:42', '2026-03-30 07:38:42');

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
-- Records of personnel
-- ----------------------------
INSERT INTO `personnel` VALUES (1, '张三三', 'PER001', 1, 'manager', '13800138100', 'zhangsan@company.com', '2020-01-15', 1, '上海技术部经理', '2026-03-31 06:36:32', '2026-04-22 03:58:24');
INSERT INTO `personnel` VALUES (2, '李四', 'PER002', 1, 'engineer', '13800138101', 'lisi@company.com', '2020-03-20', 1, '高级开发工程师', '2026-03-31 06:36:32', '2026-04-22 03:58:24');
INSERT INTO `personnel` VALUES (3, '王五', 'PER003', 1, 'engineer', '13800138102', 'wangwu@company.com', '2021-06-01', 1, '中级开发工程师', '2026-03-31 06:36:32', '2026-04-22 03:58:24');
INSERT INTO `personnel` VALUES (4, '赵六', 'PER004', 2, 'supervisor', '13800138103', 'zhaoliu@company.com', '2019-08-10', 1, '销售主管', '2026-03-31 06:36:32', '2026-04-22 03:58:24');
INSERT INTO `personnel` VALUES (5, '钱七', 'PER005', 2, 'engineer', '13800138104', 'qianqi@company.com', '2022-02-15', 1, '销售代表', '2026-03-31 06:36:32', '2026-04-22 03:58:24');
INSERT INTO `personnel` VALUES (6, '孙八', 'PER006', 2, 'manager', '13800138105', 'sunba@company.com', '2018-11-01', 1, '深圳技术部经理', '2026-03-31 06:36:32', '2026-04-22 03:58:24');
INSERT INTO `personnel` VALUES (7, '周九', 'PER007', 2, 'engineer', '13800138106', 'zhoujiu@company.com', '2021-09-20', 1, '高级开发工程师', '2026-03-31 06:36:32', '2026-04-22 03:58:24');
INSERT INTO `personnel` VALUES (8, '吴十', 'PER008', 3, 'supervisor', '13800138107', 'wushi@company.com', '2020-05-10', 1, '研发项目组长', '2026-03-31 06:36:32', '2026-04-22 03:58:24');
INSERT INTO `personnel` VALUES (9, '郑十一', 'PER009', 3, 'engineer', '13800138108', 'zhengshi@company.com', '2022-08-01', 1, '研发工程师', '2026-03-31 06:36:32', '2026-04-22 03:58:24');
INSERT INTO `personnel` VALUES (10, '王十二', 'PER010', 3, 'manager', '13800138109', 'wangshi@company.com', '2017-03-01', 0, '已离职人员', '2026-03-31 06:36:32', '2026-04-22 03:58:24');

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
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '进度申请表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of progress_apply
-- ----------------------------
INSERT INTO `progress_apply` VALUES (1, 'PA20260410001', 1, '张三', '13800138000', '挖掘机 CAT320', 'parts', '液压泵配件已到货，申请更换', '2026-04-11 10:00:00', 'approved', '', NULL, '2026-05-27 11:00:55', NULL, '2026-04-10 02:10:07', '2026-05-27 11:00:55');
INSERT INTO `progress_apply` VALUES (2, 'PA20260410002', 2, '李四', '13900139000', '装载机 ZL50', 'inspection', '维修已完成，申请验收', '2026-04-11 15:00:00', 'approved', NULL, NULL, NULL, NULL, '2026-04-10 02:10:07', '2026-04-10 02:10:07');
INSERT INTO `progress_apply` VALUES (3, 'PA20260527104858940', 2, '测试用户', '13800138000', '', 'repair', '想了解一下维修进度', NULL, 'approved', '同意申请', NULL, '2026-05-27 02:49:06', NULL, '2026-05-27 02:48:58', '2026-05-27 11:56:59');
INSERT INTO `progress_apply` VALUES (4, 'PA20260527105018896', 62, '俊', '13800138000', '无人机2号', 'repair', '维修还需要多久', '2026-05-28 00:00:00', 'pending', NULL, NULL, NULL, NULL, '2026-05-27 02:50:18', '2026-05-27 11:56:59');
INSERT INTO `progress_apply` VALUES (5, 'PA20260527110411354', 60, '俊', '13800138000', 'P50 Pro', 'parts', '查看维修进度', '2026-05-28 00:00:00', 'pending', NULL, NULL, NULL, NULL, '2026-05-27 03:04:11', '2026-05-27 11:56:59');

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
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '进度照片表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of progress_photo
-- ----------------------------
INSERT INTO `progress_photo` VALUES (1, 1, '液压泵更换进度照片', '[\"https://via.placeholder.com/300x200?text=Photo1\", \"https://via.placeholder.com/300x200?text=Photo2\", \"https://via.placeholder.com/300x200?text=Photo3\"]', 1, '李工程师', '2026-04-10 02:10:07', '2026-04-10 02:10:07');
INSERT INTO `progress_photo` VALUES (2, 2, '维修完成后的设备照片', '[\"https://via.placeholder.com/300x200?text=Photo1\", \"https://via.placeholder.com/300x200?text=Photo2\"]', 1, '王工程师', '2026-04-10 02:10:07', '2026-04-10 02:10:07');

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
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '进度视频表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of progress_video
-- ----------------------------
INSERT INTO `progress_video` VALUES (1, 1, '液压泵更换过程', '液压泵拆卸和安装的全过程', 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', 'https://via.placeholder.com/400x300?text=Cover', 180, 52428800, 1, '李工程师', '2026-04-10 02:10:07', '2026-04-10 02:10:07');
INSERT INTO `progress_video` VALUES (2, 2, '维修完成测试', '维修完成后的功能测试', 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', 'https://via.placeholder.com/400x300?text=Cover', 120, 31457280, 1, '王工程师', '2026-04-10 02:10:07', '2026-04-10 02:10:07');
INSERT INTO `progress_video` VALUES (3, 4, '维修', '维修中', 'https://coze-coding-project.tos.coze.site/coze_storage_7626269083839004708/video/video_generate_cgt-20260408154238-n2vmh.mp4?sign=1807170273-d70f032c2b-0-3715c8ff0a092e0edf393a443441d7d26af95c9860725a7861a84db68b5ffb07', '', 10, 2048, NULL, '', '2026-04-10 10:17:42', '2026-04-10 10:17:42');

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
-- Records of quotation_items
-- ----------------------------
INSERT INTO `quotation_items` VALUES (2, 2, 1, '原装屏幕维修', '', 1.00, '项', 1200.00, 1200.00, 0, '2026-04-01 16:19:55', '2026-04-01 16:19:55');
INSERT INTO `quotation_items` VALUES (3, 2, 1, '摄像头维修', '', 1.00, '项', 300.00, 300.00, 0, '2026-04-01 16:19:55', '2026-04-01 16:19:55');

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
-- Records of quotation_orders
-- ----------------------------
INSERT INTO `quotation_orders` VALUES (2, 'QT202604010002', 5, 'ORD202603250916489602', '俊', '15570836828', 'iPhone 15 Pro Max', '屏幕碎裂', 1, 1500.00, 0.00, 0.00, 1500.00, '保修期半年', '2026-04-08', NULL, NULL, NULL, 2, '2026-04-01 16:19:55', '2026-04-02 09:06:31');

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
-- Records of repair_categories
-- ----------------------------
INSERT INTO `repair_categories` VALUES (1, '挖掘机械', 'EXCAVATOR', '各类挖掘机设备，包括履带式、轮式挖掘机等', 1, 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_categories` VALUES (2, '起重机械', 'CRANE', '各类起重机、吊车设备，包括塔吊、汽车吊等', 2, 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_categories` VALUES (3, '混凝土机械', 'CONCRETE', '混凝土泵车、搅拌车、搅拌站等设备', 3, 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_categories` VALUES (4, '路面机械', 'ROAD', '压路机、摊铺机、平地机等路面施工设备', 4, 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_categories` VALUES (5, '桩工机械', 'PILE', '打桩机、钻机等基础施工设备', 5, 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_categories` VALUES (6, '铲土运输机械', 'EARTH', '装载机、推土机、铲运机等铲土运输设备', 6, 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');

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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '合同项目明细表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of repair_contract_items
-- ----------------------------

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
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '维修合同表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of repair_contracts
-- ----------------------------
INSERT INTO `repair_contracts` VALUES (1, 'MC20240101001', NULL, 'XX 制造有限公司', '13800138001', NULL, 'CNC 加工中心', '2024-01-01', '2024-12-31', '2023-12-20', 120000.00, '年度设备维护保养服务，包含季度巡检、紧急故障响应、备件优先供应', NULL, 'active', '/contracts/MC20240101001.pdf', NULL, NULL, '优质客户', '2026-04-01 09:07:21', '2026-04-01 09:07:21');
INSERT INTO `repair_contracts` VALUES (2, 'MC20240201001', NULL, 'YY 科技股份有限公司', '13800138002', NULL, '激光切割设备', '2024-02-01', '2025-01-31', '2024-01-25', 85000.00, '设备定期维护、光学元件保养、软件升级服务', NULL, 'active', '/contracts/MC20240201001.pdf', NULL, NULL, '新客户', '2026-04-01 09:07:21', '2026-04-01 09:07:21');
INSERT INTO `repair_contracts` VALUES (12, '10002', NULL, '张三', '13800138001', NULL, '手机维修', '2026-04-02', '2026-04-03', '2026-04-03', 2300.00, '电池问题', NULL, 'draft', 'uploads/contracts/69cde9736b0f8_1775102323.pdf', NULL, NULL, NULL, '2026-04-02 03:58:49', '2026-04-02 03:58:49');
INSERT INTO `repair_contracts` VALUES (13, 'HT20260529002', NULL, '测试客户', '13800138000', NULL, 'CNC加工中心', '2026-01-01', '2026-12-31', '2026-01-01', 12000.00, '年度设备维护保养服务', NULL, 'draft', NULL, NULL, NULL, NULL, '2026-05-29 01:40:45', '2026-05-29 01:40:45');
INSERT INTO `repair_contracts` VALUES (14, 'HT202605296858', NULL, '11', '11', NULL, '22', '2026-05-29', '2026-06-02', '2026-05-29', 2000.00, '22', NULL, 'draft', NULL, NULL, NULL, NULL, '2026-05-29 02:39:59', '2026-05-29 02:39:59');
INSERT INTO `repair_contracts` VALUES (15, 'HT20260529003', NULL, '张三', '13800138000', NULL, 'CNC加工中心', '2026-01-01', '2026-12-31', '2026-05-29', 12000.00, '年度设备维护保养', NULL, 'draft', NULL, NULL, NULL, NULL, '2026-05-29 02:42:42', '2026-05-29 02:42:42');

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
-- Records of repair_machines
-- ----------------------------
INSERT INTO `repair_machines` VALUES (1, '履带式挖掘机', 'CAT320D', 1, '卡特彼勒', 103.00, 20.50, '斗容 1.2m³，挖掘深度 6.5m，发动机功率 103kW', 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_machines` VALUES (2, '液压挖掘机', 'SY215C', 1, '三一重工', 114.00, 21.50, '斗容 1.0m³，挖掘深度 6.2m，液压系统压力 34.3MPa', 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_machines` VALUES (3, '小型挖掘机', 'KUBOTA U35', 1, '久保田', 22.00, 3.50, '微型挖掘机，适合狭小空间作业，履带宽度 350mm', 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_machines` VALUES (4, '汽车起重机', 'QY25K5', 2, '徐工集团', 260.00, 32.00, '最大起重量 25 吨，主臂长度 40m，五节臂', 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_machines` VALUES (5, '塔式起重机', 'QTZ80', 2, '中联重科', 75.00, 45.00, '最大起重力矩 800kN·m，最大起重量 8 吨，臂长 50m', 0, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_machines` VALUES (6, '混凝土泵车', 'HBT60.13.130RS', 3, '三一重工', 160.00, 28.00, '最大理论输送量 60m³/h，输送压力 13MPa，臂长 43m', 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_machines` VALUES (7, '混凝土搅拌车', 'JS12', 3, '东风汽车', 210.00, 18.00, '搅拌容量 12 立方米，额定载重 18 吨', 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_machines` VALUES (8, '单钢轮压路机', 'XS203J', 4, '徐工集团', 129.00, 20.00, '工作质量 20 吨，振动频率 28-45Hz，振幅 1.8/0.9mm', 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_machines` VALUES (9, '沥青摊铺机', 'RP953', 4, '三一重工', 118.00, 12.50, '摊铺宽度 2.5-9m，最大摊铺厚度 300mm', 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_machines` VALUES (10, '旋挖钻机', 'SR280', 5, '山河智能', 280.00, 80.00, '最大钻孔直径 2.5m，最大钻孔深度 80m，扭矩 280kN·m', 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_machines` VALUES (11, '打桩机', 'DZJ-90', 5, '上海机械', 90.00, 35.00, '最大打桩深度 45m，锤击能量 90kJ', 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');
INSERT INTO `repair_machines` VALUES (12, '轮式装载机', 'LW300KN', 6, '徐工集团', 162.00, 11.00, '额定载重量 3 吨，斗容 1.8m³，卸载高度 3.2m', 1, '2026-04-03 07:40:30', '2026-04-03 07:40:30');

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
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '维修进度表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of repair_progress
-- ----------------------------
INSERT INTO `repair_progress` VALUES (1, 1, 1, '故障诊断', '故障诊断', 'completed', 100, '完成主轴异响检测，确认轴承磨损。', NULL, '王五', '2024-01-18 09:00:00', '2024-01-18 11:00:00', NULL, NULL, '检测完成', '2026-04-08 03:30:50', '2026-04-08 03:30:50');
INSERT INTO `repair_progress` VALUES (2, 1, 1, '维修实施', '维修实施', 'completed', 100, '完成轴承更换、润滑和精度校准。', NULL, '王五', '2024-01-19 09:30:00', '2024-01-20 16:30:00', NULL, NULL, '维修完成', '2026-04-08 03:30:50', '2026-04-08 03:30:50');
INSERT INTO `repair_progress` VALUES (3, 1, 1, '测试验收', '测试验收', 'completed', 100, '连续运行测试通过，设备恢复正常。', NULL, '质检组', '2024-01-21 09:00:00', '2024-01-21 10:30:00', NULL, NULL, '已交付', '2026-04-08 03:30:50', '2026-04-08 03:30:50');
INSERT INTO `repair_progress` VALUES (4, 2, 2, '故障诊断', '故障诊断', 'completed', 100, '确认激光功率衰减，需要更换激光管。', NULL, '赵六', '2024-02-23 10:00:00', '2024-02-23 12:00:00', NULL, NULL, '已定位问题', '2026-04-08 03:30:50', '2026-04-08 03:30:50');
INSERT INTO `repair_progress` VALUES (5, 2, 2, '维修实施', '维修实施', 'in_progress', 65, '正在更换激光管并重新标定光路。', NULL, '赵六', '2024-02-24 09:00:00', NULL, NULL, NULL, '维修进行中', '2026-04-08 03:30:50', '2026-04-08 03:30:50');
INSERT INTO `repair_progress` VALUES (6, 2, 2, '测试验收', '测试验收', 'pending', 0, '待维修完成后进行整机测试与验收。', NULL, '质检组', NULL, NULL, NULL, NULL, '未开始', '2026-04-08 03:30:50', '2026-04-08 03:30:50');

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
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '维修提醒表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of repair_reminders
-- ----------------------------
INSERT INTO `repair_reminders` VALUES (1, NULL, NULL, 1, '季度保养提醒', '请对 CNC 加工中心进行季度保养，包括润滑系统检查、导轨精度检测', 'maintenance', '2024-03-15', NULL, 'pending', NULL, NULL, NULL, 'system', NULL, '定期保养', '2026-04-01 09:07:21', '2026-04-01 09:07:21', NULL);
INSERT INTO `repair_reminders` VALUES (2, NULL, NULL, 2, '合同到期提醒', 'YY 科技设备维护合同将于下月到期，请及时跟进续约事宜', 'contract', '2025-01-15', NULL, 'pending', NULL, NULL, NULL, 'email', '<p>YY 科技设备维护合同将于下月到期，请及时跟进续约事宜</p><p>设备：</p><p>提醒时间：2025-01-15</p>', '合同管理', '2026-04-01 09:07:21', '2026-04-03 03:00:00', NULL);
INSERT INTO `repair_reminders` VALUES (3, NULL, NULL, 1, '年度检测提醒', '请安排 CNC 加工中心的年度安全检测', 'inspection', '2024-06-01', NULL, 'pending', NULL, NULL, NULL, 'wechat', '<p>请安排 CNC 加工中心的年度安全检测</p><p>设备：</p><p>提醒时间：2024-06-01</p>', '安全检测', '2026-04-01 09:07:21', '2026-04-11 07:48:25', NULL);

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
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '维修报告表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of repair_reports
-- ----------------------------
INSERT INTO `repair_reports` VALUES (1, 1, NULL, NULL, 1, 'RR20240101001', 'CNC 加工中心', '主轴异响，加工精度下降', '更换主轴轴承，重新校准精度', NULL, '王五', '2024-01-20', NULL, NULL, NULL, 5000.00, 'completed', NULL, NULL, '维修完成，设备运行正常', '2026-04-01 09:07:21', '2026-04-01 09:07:21');
INSERT INTO `repair_reports` VALUES (2, 2, NULL, NULL, 2, 'RR20240201001', '激光切割机', '激光功率不足，切割效果差', '更换激光管，清理光路', NULL, '赵六', '2024-02-25', NULL, NULL, NULL, 8000.00, 'completed', NULL, NULL, '已恢复正常工作状态', '2026-04-01 09:07:21', '2026-04-01 09:07:21');
INSERT INTO `repair_reports` VALUES (3, 9, NULL, NULL, 0, 'RPT20260403103803000009', '手机 - iPhone 12', '屏幕碎裂', '已完成 手机 - iPhone 12 维修服务。iPhone 12屏幕损坏完全无法显示', NULL, '', '2026-03-11', '2026-03-11 15:26:06', 0.00, NULL, 650.00, 'completed', NULL, NULL, '从电子维修系统自动导入，订单号：ORD20250310001', '2026-04-03 02:38:03', '2026-04-03 02:38:03');
INSERT INTO `repair_reports` VALUES (4, 10, NULL, NULL, 0, 'RPT20260403104115000010', '手机 - 小米14', '摄像头故障', '已完成 手机 - 小米14 维修服务。小米14摄像头模糊，拍照有明显噪点', NULL, '', '2026-03-07', '2026-03-07 15:26:06', 0.00, NULL, 380.00, 'completed', NULL, NULL, '从电子维修系统自动导入，订单号：ORD20250305001', '2026-04-03 02:41:15', '2026-04-03 02:41:15');
INSERT INTO `repair_reports` VALUES (5, 11, NULL, NULL, 0, 'RPT20260403104123000011', '平板 - iPad Air 5', '充电接口问题', '已完成 平板 - iPad Air 5 维修服务。iPad Air充电接口松动，经常接触不良', NULL, '', '2026-03-01', '2026-03-01 15:26:06', 0.00, NULL, 250.00, 'completed', NULL, NULL, '从电子维修系统自动导入，订单号：ORD20250228001', '2026-04-03 02:41:23', '2026-04-03 02:41:23');
INSERT INTO `repair_reports` VALUES (6, 12, NULL, NULL, 0, 'RPT20260403104123000012', '手机 - P50', '声音异常', '已完成 手机 - P50 维修服务。华为P50扬声器完全无声，听筒正常', NULL, '', '2026-02-24', '2026-02-24 15:26:06', 0.00, NULL, 160.00, 'completed', NULL, NULL, '从电子维修系统自动导入，订单号：ORD20250223001', '2026-04-03 02:41:23', '2026-04-03 02:41:23');
INSERT INTO `repair_reports` VALUES (7, 4, '10001', NULL, 0, 'RPT20260403104123000004', '平板', '屏幕碎裂', '已完成 平板 维修服务。iPad屏幕摔碎了', NULL, '张三', '2026-03-20', '2026-03-20 09:42:42', 3.00, NULL, 299.00, 'completed', NULL, NULL, '从电子维修系统自动导入，订单号：WX123456792', '2026-04-03 02:41:23', '2026-04-03 02:41:23');

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
-- Records of role_permissions
-- ----------------------------
INSERT INTO `role_permissions` VALUES (32, 2, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (33, 10, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (34, 11, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (35, 12, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (36, 13, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (37, 3, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (38, 14, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (39, 15, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (40, 16, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (41, 17, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (42, 18, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (43, 4, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (44, 5, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (45, 6, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (46, 7, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (47, 8, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (48, 9, 1, 'null', '2026-03-31 06:12:28');
INSERT INTO `role_permissions` VALUES (49, 19, 1, 'null', '2026-03-31 06:37:46');
INSERT INTO `role_permissions` VALUES (50, 33, 1, 'null', '2026-03-31 06:37:46');
INSERT INTO `role_permissions` VALUES (51, 41, 1, 'null', '2026-03-31 06:37:46');
INSERT INTO `role_permissions` VALUES (52, 52, 1, 'null', '2026-03-31 06:37:46');
INSERT INTO `role_permissions` VALUES (506, 5, 733, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-04-22 04:45:41');
INSERT INTO `role_permissions` VALUES (507, 5, 734, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-04-22 04:45:41');
INSERT INTO `role_permissions` VALUES (508, 5, 735, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-04-22 04:45:41');
INSERT INTO `role_permissions` VALUES (511, 2, 736, '{\"canEdit\": true, \"canView\": true}', '2026-05-20 08:30:12');
INSERT INTO `role_permissions` VALUES (512, 2, 737, '{\"canEdit\": true, \"canView\": true}', '2026-05-20 08:30:12');
INSERT INTO `role_permissions` VALUES (513, 3, 736, '{\"canEdit\": true, \"canariView\": true}', '2026-05-20 08:30:12');
INSERT INTO `role_permissions` VALUES (514, 3, 737, '{\"canEdit\": true, \"canView\": true}', '2026-05-20 08:30:12');
INSERT INTO `role_permissions` VALUES (515, 4, 736, '{\"canEdit\": true, \"canView\": true}', '2026-05-20 08:30:12');
INSERT INTO `role_permissions` VALUES (516, 4, 737, '{\"canEdit\": true, \"canView\": true}', '2026-05-20 08:30:12');
INSERT INTO `role_permissions` VALUES (517, 5, 736, '{\"canEdit\": true, \"canView\": true}', '2026-05-20 08:30:12');
INSERT INTO `role_permissions` VALUES (518, 5, 737, '{\"canEdit\": true, \"canView\": true}', '2026-05-20 08:30:12');
INSERT INTO `role_permissions` VALUES (519, 6, 736, '{\"canEdit\": true, \"canView\": true}', '2026-05-20 08:30:12');
INSERT INTO `role_permissions` VALUES (520, 6, 737, '{\"canEdit\": true, \"canView\": true}', '2026-05-20 08:30:12');
INSERT INTO `role_permissions` VALUES (1321, 1, 736, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1322, 1, 737, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1323, 1, 1, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1324, 1, 10, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1325, 1, 11, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1326, 1, 12, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1327, 1, 13, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1328, 1, 14, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1329, 1, 20, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1330, 1, 21, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1331, 1, 22, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1332, 1, 23, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1333, 1, 24, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1334, 1, 25, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1335, 1, 30, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1336, 1, 31, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1337, 1, 32, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1338, 1, 33, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1339, 1, 34, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1340, 1, 40, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1341, 1, 41, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1342, 1, 42, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1343, 1, 43, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1344, 1, 44, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1345, 1, 50, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1346, 1, 51, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1347, 1, 52, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1348, 1, 53, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1349, 1, 54, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1350, 1, 60, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1351, 1, 61, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1352, 1, 62, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1353, 1, 63, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1354, 1, 70, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1355, 1, 71, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1356, 1, 72, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1357, 1, 2, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1358, 1, 100, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1359, 1, 101, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1360, 1, 102, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1361, 1, 103, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1362, 1, 104, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1363, 1, 110, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1364, 1, 111, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1365, 1, 112, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1366, 1, 113, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1367, 1, 114, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1368, 1, 120, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1369, 1, 121, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1370, 1, 733, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1371, 1, 122, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1372, 1, 734, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1373, 1, 123, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1374, 1, 735, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1375, 1, 3, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1376, 1, 200, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1377, 1, 201, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1378, 1, 202, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1379, 1, 203, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1380, 1, 204, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1381, 1, 210, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1382, 1, 211, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1383, 1, 212, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1384, 1, 220, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1385, 1, 221, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1386, 1, 222, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1387, 1, 223, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1388, 1, 224, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1389, 1, 230, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1390, 1, 231, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1391, 1, 232, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1392, 1, 233, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1393, 1, 234, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1394, 1, 240, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1395, 1, 241, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1396, 1, 242, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1397, 1, 243, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1398, 1, 244, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1399, 1, 250, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1400, 1, 251, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1401, 1, 252, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1402, 1, 253, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1403, 1, 254, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1404, 1, 260, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1405, 1, 261, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1406, 1, 262, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1407, 1, 263, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1408, 1, 264, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1409, 1, 4, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1410, 1, 300, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1411, 1, 301, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1412, 1, 302, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1413, 1, 303, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1414, 1, 304, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1415, 1, 310, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1416, 1, 311, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1417, 1, 312, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1418, 1, 313, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1419, 1, 314, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1420, 1, 320, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1421, 1, 321, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1422, 1, 322, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1423, 1, 323, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1424, 1, 324, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1425, 1, 325, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1426, 1, 326, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1427, 1, 331, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1428, 1, 332, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1429, 1, 333, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1430, 1, 334, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1431, 1, 335, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1432, 1, 340, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1433, 1, 341, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1434, 1, 342, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1435, 1, 343, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1436, 1, 344, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1437, 1, 345, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1438, 1, 351, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1439, 1, 352, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1440, 1, 353, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1441, 1, 354, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1442, 1, 355, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1443, 1, 361, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1444, 1, 362, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1445, 1, 363, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1446, 1, 370, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1447, 1, 371, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1448, 1, 372, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1449, 1, 373, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1450, 1, 374, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1451, 1, 380, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1452, 1, 381, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1453, 1, 382, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1454, 1, 383, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1455, 1, 384, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1456, 1, 390, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1457, 1, 391, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1458, 1, 392, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1459, 1, 393, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1460, 1, 394, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1461, 1, 400, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1462, 1, 401, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1463, 1, 402, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1464, 1, 403, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1465, 1, 404, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1466, 1, 410, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1467, 1, 411, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1468, 1, 412, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1469, 1, 413, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1470, 1, 414, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1471, 1, 421, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1472, 1, 422, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1473, 1, 423, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1474, 1, 424, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1475, 1, 431, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1476, 1, 432, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1477, 1, 433, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1478, 1, 434, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1479, 1, 5, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1480, 1, 500, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1481, 1, 501, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1482, 1, 502, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1483, 1, 510, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1484, 1, 511, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1485, 1, 512, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1486, 1, 513, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1487, 1, 520, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1488, 1, 521, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1489, 1, 530, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1490, 1, 531, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1491, 1, 532, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1492, 1, 533, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1493, 1, 534, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1494, 1, 6, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1495, 1, 600, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1496, 1, 601, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1497, 1, 602, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1498, 1, 603, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1499, 1, 604, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1500, 1, 605, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1501, 1, 606, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1502, 1, 607, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1503, 1, 610, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1504, 1, 611, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1505, 1, 612, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1506, 1, 613, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1507, 1, 614, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1508, 1, 7, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1509, 1, 700, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1510, 1, 701, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1511, 1, 702, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1512, 1, 710, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1513, 1, 711, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1514, 1, 712, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1515, 1, 720, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1516, 1, 721, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1517, 1, 722, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1518, 1, 730, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1519, 1, 731, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');
INSERT INTO `role_permissions` VALUES (1520, 1, 732, '{\"canEdit\": false, \"canView\": true, \"canDelete\": false}', '2026-05-20 08:40:35');

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
-- Records of roles
-- ----------------------------
INSERT INTO `roles` VALUES (1, '超级管理员', 'admin', '拥有系统所有权限', 1, '2026-03-31 03:28:55', '2026-03-31 03:28:55');
INSERT INTO `roles` VALUES (2, '系统管理员', 'system_admin', '系统管理员权限', 1, '2026-03-31 03:28:55', '2026-03-31 03:28:55');
INSERT INTO `roles` VALUES (3, '部门经理', 'department_manager', '部门经理权限', 1, '2026-03-31 03:28:55', '2026-03-31 03:28:55');
INSERT INTO `roles` VALUES (4, '维修主管', 'supervisor', '维修主管权限', 1, '2026-03-31 03:28:55', '2026-03-31 03:28:55');
INSERT INTO `roles` VALUES (5, '维修工程师', 'engineer', '维修工程师权限', 1, '2026-03-31 03:28:55', '2026-03-31 03:28:55');
INSERT INTO `roles` VALUES (6, '普通用户', 'user', '普通用户权限', 1, '2026-03-31 03:28:55', '2026-03-31 03:28:55');

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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '排班表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of schedules
-- ----------------------------

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
) ENGINE = InnoDB AUTO_INCREMENT = 207 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '配件表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of spare_parts
-- ----------------------------
INSERT INTO `spare_parts` VALUES (201, 'PART001', '空气滤芯', 101, '通用型 A-100', '个', 101, 25.00, 45.00, 50, 20, 0, 1, '适用于多种设备', '/uploads/parts/placeholder.svg', '2026-04-03 06:55:16', '2026-05-22 01:49:43');
INSERT INTO `spare_parts` VALUES (202, 'PART002', '机油滤芯', 101, '通用型 B-200', '个', 101, 35.00, 60.00, 30, 15, 0, 1, '发动机专用', '/uploads/parts/placeholder.svg', '2026-04-03 06:55:16', '2026-05-22 01:49:43');
INSERT INTO `spare_parts` VALUES (203, 'PART005', '接触器', 102, 'CJX2-2510', '个', 103, 85.00, 150.00, 23, 5, 0, 1, '交流接触器', '/uploads/general/6a0fc0cf75217_1779417295.jpg', '2026-04-03 06:55:16', '2026-05-22 09:14:14');
INSERT INTO `spare_parts` VALUES (204, 'PART006', '断路器', 102, 'DZ47-63', '个', 103, 25.00, 45.00, 100, 30, 0, 1, '小型断路器', '/uploads/parts/placeholder.svg', '2026-04-03 06:55:16', '2026-05-22 01:49:43');
INSERT INTO `spare_parts` VALUES (205, 'PART009', '皮带', 103, 'A 型 1200mm', '条', 102, 35.00, 65.00, 40, 15, 0, 1, '三角皮带', '/uploads/parts/placeholder.svg', '2026-04-03 06:55:16', '2026-05-22 01:49:43');
INSERT INTO `spare_parts` VALUES (206, 'PART010', '链条', 103, '08B-1', '米', 102, 20.00, 38.00, 100, 50, 0, 1, '滚子链条', '/uploads/parts/placeholder.svg', '2026-04-03 06:55:16', '2026-05-22 01:49:43');

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
) ENGINE = InnoDB AUTO_INCREMENT = 21 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '开支统计记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of statistics_expense_records
-- ----------------------------
INSERT INTO `statistics_expense_records` VALUES (1, '2026-04-08', 'purchase', '采购液压泵密封组件', 3860.00, '转账', '张三', '2026-04-08 00:00:00', '2026-04-08 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (2, '2026-04-08', 'operation', '仓储与物流费用', 1260.00, '转账', '李四', '2026-04-08 00:00:00', '2026-04-08 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (3, '2026-04-09', 'salary', '外勤工程师绩效补贴', 6800.00, '转账', '王五', '2026-04-09 00:00:00', '2026-04-09 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (4, '2026-04-09', 'other', '客户现场差旅费', 920.00, '现金', '赵六', '2026-04-09 00:00:00', '2026-04-09 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (5, '2026-04-10', 'purchase', '采购电机碳刷与轴承', 4580.00, '转账', '张三', '2026-04-10 00:00:00', '2026-04-10 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (6, '2026-04-10', 'operation', '办公室网络与电话费', 860.00, '转账', '李四', '2026-04-10 00:00:00', '2026-04-10 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (7, '2026-04-11', 'salary', '维修中心月度工资', 12800.00, '转账', '王五', '2026-04-11 00:00:00', '2026-04-11 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (8, '2026-04-11', 'purchase', '采购控制板与继电器', 5320.00, '转账', '张三', '2026-04-11 00:00:00', '2026-04-11 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (9, '2026-04-12', 'operation', '门店水电与物业费', 2180.00, '转账', '李四', '2026-04-12 00:00:00', '2026-04-12 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (10, '2026-04-12', 'other', '应急工具购置', 1380.00, '现金', '赵六', '2026-04-12 00:00:00', '2026-04-12 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (11, '2026-04-13', 'purchase', '采购压力传感器批次', 6240.00, '转账', '张三', '2026-04-13 00:00:00', '2026-04-13 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (12, '2026-04-13', 'operation', '短视频推广投流', 2860.00, '转账', '李四', '2026-04-13 00:00:00', '2026-04-13 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (13, '2026-04-14', 'salary', '售后客服与仓管工资', 9300.00, '转账', '王五', '2026-04-14 00:00:00', '2026-04-14 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (14, '2026-04-14', 'purchase', '采购工业润滑油', 1980.00, '转账', '张三', '2026-04-14 00:00:00', '2026-04-14 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (15, '2026-04-15', 'operation', '办公耗材采购', 760.00, '转账', '李四', '2026-04-15 00:00:00', '2026-04-15 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (16, '2026-04-15', 'other', '设备运输保险', 1160.00, '转账', '赵六', '2026-04-15 00:00:00', '2026-04-15 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (17, '2026-04-16', 'purchase', '采购显示模组与排线', 4720.00, '转账', '张三', '2026-04-16 00:00:00', '2026-04-16 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (18, '2026-04-16', 'salary', '驻场工程师补助', 5400.00, '转账', '王五', '2026-04-16 00:00:00', '2026-04-16 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (19, '2026-04-17', 'operation', '同城加急配送费', 980.00, '转账', '李四', '2026-04-17 00:00:00', '2026-04-17 00:00:00');
INSERT INTO `statistics_expense_records` VALUES (20, '2026-04-17', 'purchase', '采购常用维修小料', 2540.00, '转账', '张三', '2026-04-17 00:00:00', '2026-04-17 00:00:00');

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
) ENGINE = InnoDB AUTO_INCREMENT = 54 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '收入统计记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of statistics_income_records
-- ----------------------------
INSERT INTO `statistics_income_records` VALUES (21, '2024-03-24', 'online', 1, 500.00, '线上支付: wechat', 'online', 1, '2026-04-29 17:13:01', '2026-04-29 17:17:48');
INSERT INTO `statistics_income_records` VALUES (22, '2024-03-24', 'online', 1, 350.00, '线上支付: alipay', 'online', 2, '2026-04-29 17:13:01', '2026-04-29 17:17:48');
INSERT INTO `statistics_income_records` VALUES (23, '2024-03-24', 'online', 1, 800.00, '线上支付: unionpay', 'online', 3, '2026-04-29 17:13:01', '2026-04-29 17:17:48');
INSERT INTO `statistics_income_records` VALUES (24, '2024-03-23', 'online', 1, 1200.00, '线上支付: wechat', 'online', 4, '2026-04-29 17:13:01', '2026-04-29 17:17:49');
INSERT INTO `statistics_income_records` VALUES (25, '2024-03-22', 'online', 1, 980.00, '线上支付: unionpay', 'online', 8, '2026-04-29 17:13:01', '2026-04-29 17:17:49');
INSERT INTO `statistics_income_records` VALUES (26, '2024-03-21', 'online', 1, 720.00, '线上支付: alipay', 'online', 9, '2026-04-29 17:13:01', '2026-04-29 17:17:49');
INSERT INTO `statistics_income_records` VALUES (27, '2024-03-20', 'online', 1, 1100.00, '线上支付: unionpay', 'online', 11, '2026-04-29 17:13:01', '2026-04-29 17:17:49');
INSERT INTO `statistics_income_records` VALUES (28, '2024-01-20', 'transfer', 1, 5000.00, '转账: 王五', 'transfer', 9, '2026-04-29 17:13:01', '2026-04-29 17:17:49');
INSERT INTO `statistics_income_records` VALUES (29, '2024-01-19', 'transfer', 1, 2800.00, '转账: 张三', 'transfer', 11, '2026-04-29 17:13:01', '2026-04-29 17:17:49');
INSERT INTO `statistics_income_records` VALUES (30, '2024-01-17', 'transfer', 1, 4200.00, '转账: 孙七', 'transfer', 13, '2026-04-29 17:13:01', '2026-04-29 17:17:49');
INSERT INTO `statistics_income_records` VALUES (31, '2024-01-16', 'transfer', 1, 1500.00, '转账: 周八', 'transfer', 14, '2026-04-29 17:13:01', '2026-04-29 17:17:49');
INSERT INTO `statistics_income_records` VALUES (32, '2024-01-15', 'transfer', 1, 6800.00, '转账: 吴九', 'transfer', 15, '2026-04-29 17:13:01', '2026-04-29 17:17:49');
INSERT INTO `statistics_income_records` VALUES (33, '2024-01-14', 'transfer', 1, 3200.00, '转账: 郑十', 'transfer', 16, '2026-04-29 17:13:01', '2026-04-29 17:17:49');
INSERT INTO `statistics_income_records` VALUES (34, '2026-04-20', 'online', 8, 6580.00, '线上维修收款', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (35, '2026-04-20', 'transfer', 3, 2820.00, '企业客户转账', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (36, '2026-04-21', 'online', 12, 9850.00, '线上维修收款', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (37, '2026-04-21', 'transfer', 4, 3640.00, '单位客户转账', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (38, '2026-04-22', 'online', 10, 8240.00, '线上维修收款', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (39, '2026-04-22', 'transfer', 5, 4580.00, '对公转账', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (40, '2026-04-23', 'online', 15, 12360.00, '线上维修收款', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (41, '2026-04-23', 'transfer', 6, 5480.00, '大客户回款', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (42, '2026-04-24', 'online', 14, 11520.00, '线上维修收款', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (43, '2026-04-24', 'transfer', 4, 3680.00, '企业客户转账', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (44, '2026-04-25', 'online', 18, 14820.00, '线上维修收款', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (45, '2026-04-25', 'transfer', 7, 6320.00, '单位客户转账', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (46, '2026-04-26', 'online', 16, 13160.00, '线上维修收款', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (47, '2026-04-26', 'transfer', 5, 4620.00, '企业客户转账', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (48, '2026-04-27', 'online', 20, 16480.00, '线上维修收款', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (49, '2026-04-27', 'transfer', 8, 7280.00, '大额转账', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (50, '2026-04-28', 'online', 22, 18040.00, '线上维修收款', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (51, '2026-04-28', 'transfer', 6, 5520.00, '企业客户转账', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (52, '2026-04-29', 'online', 24, 19760.00, '线上维修收款', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');
INSERT INTO `statistics_income_records` VALUES (53, '2026-04-29', 'transfer', 9, 8160.00, '单位客户结算', NULL, NULL, '2026-04-29 09:22:24', '2026-06-01 07:17:03');

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
) ENGINE = InnoDB AUTO_INCREMENT = 21 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '订单统计记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of statistics_order_records
-- ----------------------------
INSERT INTO `statistics_order_records` VALUES (1, 'WO20260408001', '上海建工', '挖掘机', '液压系统压力不足', 3680.00, 'completed', '2026-04-08 09:12:00', NULL, NULL, '2026-04-08 09:12:00');
INSERT INTO `statistics_order_records` VALUES (2, 'WO20260408002', '中建三局', '起重机', '回转机构异响', 5220.00, 'processing', '2026-04-08 14:25:00', NULL, NULL, '2026-04-08 14:25:00');
INSERT INTO `statistics_order_records` VALUES (3, 'WO20260409001', '北京城建', '装载机', '变速箱顿挫', 4860.00, 'completed', '2026-04-09 10:08:00', NULL, NULL, '2026-04-09 10:08:00');
INSERT INTO `statistics_order_records` VALUES (4, 'WO20260409002', '江苏交通', '压路机', '制动系统告警', 2750.00, 'pending', '2026-04-09 16:36:00', NULL, NULL, '2026-04-09 16:36:00');
INSERT INTO `statistics_order_records` VALUES (5, 'WO20260410001', '浙江建设', '叉车', '仪表无法点亮', 1460.00, 'completed', '2026-04-10 08:46:00', NULL, NULL, '2026-04-10 08:46:00');
INSERT INTO `statistics_order_records` VALUES (6, 'WO20260410002', '山东路桥', '挖掘机', '空调制冷异常', 1880.00, 'cancelled', '2026-04-10 13:10:00', NULL, NULL, '2026-04-10 13:10:00');
INSERT INTO `statistics_order_records` VALUES (7, 'WO20260411001', '河南建工', '混凝土泵车', '泵送压力波动', 6320.00, 'processing', '2026-04-11 09:30:00', NULL, NULL, '2026-04-11 09:30:00');
INSERT INTO `statistics_order_records` VALUES (8, 'WO20260411002', '湖北路桥', '平地机', '转向油缸漏油', 3420.00, 'completed', '2026-04-11 15:42:00', NULL, NULL, '2026-04-11 15:42:00');
INSERT INTO `statistics_order_records` VALUES (9, 'WO20260412001', '深圳机电', '发电机组', '控制柜通讯故障', 4580.00, 'completed', '2026-04-12 11:16:00', NULL, NULL, '2026-04-12 11:16:00');
INSERT INTO `statistics_order_records` VALUES (10, 'WO20260412002', '广州港机', '堆高机', '动力电池衰减', 7240.00, 'processing', '2026-04-12 17:05:00', NULL, NULL, '2026-04-12 17:05:00');
INSERT INTO `statistics_order_records` VALUES (11, 'WO20260413001', '苏州装备', '激光切割机', '激光头偏移', 5180.00, 'completed', '2026-04-13 09:55:00', NULL, NULL, '2026-04-13 09:55:00');
INSERT INTO `statistics_order_records` VALUES (12, 'WO20260413002', '宁波制造', '数控车床', '主轴温升过高', 3960.00, 'pending', '2026-04-13 14:44:00', NULL, NULL, '2026-04-13 14:44:00');
INSERT INTO `statistics_order_records` VALUES (13, 'WO20260414001', '天津重工', '吊车', '支腿传感器异常', 2840.00, 'completed', '2026-04-14 08:28:00', NULL, NULL, '2026-04-14 08:28:00');
INSERT INTO `statistics_order_records` VALUES (14, 'WO20260414002', '青岛船厂', '空压机', '排气温度过高', 3160.00, 'processing', '2026-04-14 16:18:00', NULL, NULL, '2026-04-14 16:18:00');
INSERT INTO `statistics_order_records` VALUES (15, 'WO20260415001', '武汉城建', '挖掘机', '先导阀卡滞', 2680.00, 'completed', '2026-04-15 09:07:00', NULL, NULL, '2026-04-15 09:07:00');
INSERT INTO `statistics_order_records` VALUES (16, 'WO20260415002', '成都设备', '包装机', '伺服驱动报码', 4520.00, 'completed', '2026-04-15 13:52:00', NULL, NULL, '2026-04-15 13:52:00');
INSERT INTO `statistics_order_records` VALUES (17, 'WO20260416001', '厦门物流', '叉车', '起升速度变慢', 1580.00, 'pending', '2026-04-16 10:12:00', NULL, NULL, '2026-04-16 10:12:00');
INSERT INTO `statistics_order_records` VALUES (18, 'WO20260416002', '合肥制造', '注塑机', '加热区温控失灵', 3860.00, 'processing', '2026-04-16 15:26:00', NULL, NULL, '2026-04-16 15:26:00');
INSERT INTO `statistics_order_records` VALUES (19, 'WO20260417001', '重庆建设', '压路机', '振动马达故障', 2940.00, 'completed', '2026-04-17 09:40:00', NULL, NULL, '2026-04-17 09:40:00');
INSERT INTO `statistics_order_records` VALUES (20, 'WO20260417002', '福州机修', '发电机组', '油压异常报警', 3380.00, 'processing', '2026-04-17 16:08:00', NULL, NULL, '2026-04-17 16:08:00');

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
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '超时统计记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of statistics_timeout_records
-- ----------------------------
INSERT INTO `statistics_timeout_records` VALUES (1, 'WO20260408002', '中建三局', 'response', 135, '工程师跨区支援返程延迟', '张三', '已调整附近工程师优先响应', '2026-04-08 15:30:00', '2026-04-08 15:30:00');
INSERT INTO `statistics_timeout_records` VALUES (2, 'WO20260409002', '江苏交通', 'repair', 960, '待专用刹车阀到货', '李四', '已发起加急采购', '2026-04-09 18:10:00', '2026-04-09 18:10:00');
INSERT INTO `statistics_timeout_records` VALUES (3, 'WO20260410002', '山东路桥', 'delivery', 720, '客户现场临时停工无法交付', '王五', '改期至下一个工作日', '2026-04-10 17:20:00', '2026-04-10 17:20:00');
INSERT INTO `statistics_timeout_records` VALUES (4, 'WO20260411001', '河南建工', 'repair', 1260, '泵送总成拆检复杂度高于预估', '赵六', '增加高级工程师协同处理', '2026-04-11 19:05:00', '2026-04-11 19:05:00');
INSERT INTO `statistics_timeout_records` VALUES (5, 'WO20260412002', '广州港机', 'response', 88, '现场高峰时段交通拥堵', '张三', '已建立港区值守机制', '2026-04-12 18:16:00', '2026-04-12 18:16:00');
INSERT INTO `statistics_timeout_records` VALUES (6, 'WO20260413002', '宁波制造', 'delivery', 1560, '客户追加检测项目', '李四', '重新确认交付时间', '2026-04-13 20:28:00', '2026-04-13 20:28:00');
INSERT INTO `statistics_timeout_records` VALUES (7, 'WO20260414002', '青岛船厂', 'repair', 840, '高温故障复现时间较长', '王五', '延长老化测试并补充备件', '2026-04-14 21:15:00', '2026-04-14 21:15:00');
INSERT INTO `statistics_timeout_records` VALUES (8, 'WO20260416002', '合肥制造', 'response', 54, '上个项目收尾导致出发延后', '赵六', '优化排班并缩短交接时间', '2026-04-16 17:02:00', '2026-04-16 17:02:00');
INSERT INTO `statistics_timeout_records` VALUES (9, 'WO20260417002', '福州机修', 'delivery', 690, '客户现场验收负责人临时请假', '张三', '已预约次日上午复验', '2026-04-17 18:36:00', '2026-04-17 18:36:00');

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
) ENGINE = InnoDB AUTO_INCREMENT = 308 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '库存记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of stock_records
-- ----------------------------
INSERT INTO `stock_records` VALUES (301, 201, 1, 100, 0, 100, NULL, 2, '初始入库', '2026-04-03 06:55:16');
INSERT INTO `stock_records` VALUES (302, 201, 2, 50, 100, 50, NULL, 2, '维修领用', '2026-04-03 06:55:16');
INSERT INTO `stock_records` VALUES (303, 203, 1, 30, 0, 30, NULL, 2, '初始入库', '2026-04-03 06:55:16');
INSERT INTO `stock_records` VALUES (304, 204, 1, 150, 0, 150, NULL, 2, '初始入库', '2026-04-03 06:55:16');
INSERT INTO `stock_records` VALUES (305, 205, 1, 50, 0, 50, NULL, 2, '初始入库', '2026-04-03 06:55:16');
INSERT INTO `stock_records` VALUES (306, 206, 2, 50, 100, 50, NULL, 2, '批量领用', '2026-04-03 06:55:16');
INSERT INTO `stock_records` VALUES (307, 203, 1, 3, 20, 23, NULL, 2, '', '2026-04-03 07:03:57');

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
) ENGINE = InnoDB AUTO_INCREMENT = 104 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '供应商表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of suppliers
-- ----------------------------
INSERT INTO `suppliers` VALUES (1, '上海汽配有限公司', 'SUP001', '张经理', '13800138001', 'zhang@shanghai-auto.com', '上海市浦东新区汽车大道 123 号', 1, '主要供应商，合作良好', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `suppliers` VALUES (2, '北京机电设备有限公司', 'SUP002', '李经理', '13800138002', 'li@beijing-mech.com', '北京市朝阳区工业路 456 号', 1, '机械设备专业供应商', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `suppliers` VALUES (3, '深圳电子元件厂', 'SUP003', '王经理', '13800138003', 'wang@shenzhen-electronics.com', '深圳市南山区科技园 789 号', 1, '电子元件专业厂家', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `suppliers` VALUES (4, '广州润滑油公司', 'SUP004', '赵经理', '13800138004', 'zhao@guangzhou-oil.com', '广州市天河区石油大道 321 号', 1, '润滑油产品供应商', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `suppliers` VALUES (5, '杭州液压件厂', 'SUP005', '钱经理', '13800138005', 'qian@hangzhou-hydraulic.com', '杭州市萧山区液压路 654 号', 1, '液压件专业制造商', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `suppliers` VALUES (6, '成都密封件有限公司', 'SUP006', '孙经理', '13800138006', 'sun@chengdu-seal.com', '成都市武侯区密封街 987 号', 1, '密封件供应商', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `suppliers` VALUES (7, '武汉轴承厂', 'SUP007', '周经理', '13800138007', 'zhou@wuhan-bearing.com', '武汉市洪山区轴承路 147 号', 1, '轴承产品专业厂家', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `suppliers` VALUES (8, '西安紧固件公司', 'SUP008', '吴经理', '13800138008', 'wu@xian-fastener.com', '西安市雁塔区紧固件路 258 号', 1, '紧固件供应商', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `suppliers` VALUES (9, '重庆弹簧制造厂', 'SUP009', '郑经理', '13800138009', 'zheng@chongqing-spring.com', '重庆市沙坪坝区弹簧路 369 号', 0, '已暂停合作', '2026-04-03 06:47:00', '2026-04-03 06:47:00');
INSERT INTO `suppliers` VALUES (10, '南京传动设备厂', 'SUP010', '冯经理', '13800138010', 'feng@nanjing-transmission.com', '南京市鼓楼区传动路 741 号', 1, '传动设备专业厂家', '2026-04-03 06:47:00', '2026-04-03 06:47:00');

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
) ENGINE = InnoDB AUTO_INCREMENT = 35 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '系统日志表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of system_logs
-- ----------------------------
INSERT INTO `system_logs` VALUES (1, 'login', 2, 'admin', '系统', '登录', '192.168.1.100', NULL, '登录成功', '2026-03-31 09:00:00');
INSERT INTO `system_logs` VALUES (2, 'operation', 2, 'admin', '用户管理', '创建用户', '192.168.1.100', '{\"username\":\"test001\",\"real_name\":\"测试用户\"}', '操作成功', '2026-03-31 09:15:00');
INSERT INTO `system_logs` VALUES (3, 'operation', 2, 'admin', '角色管理', '更新角色', '192.168.1.100', '{\"id\":1,\"name\":\"超级管理员\"}', '操作成功', '2026-03-31 09:30:00');
INSERT INTO `system_logs` VALUES (4, 'operation', 2, 'admin', '权限管理', '配置权限', '192.168.1.100', '{\"role_id\":2,\"permission_ids\":[1,2,3]}', '操作成功', '2026-03-31 09:45:00');
INSERT INTO `system_logs` VALUES (5, 'operation', 1, '张三', '部门管理', '创建部门', '192.168.1.101', '{\"name\":\"测试部门\",\"code\":\"TEST001\"}', '操作成功', '2026-03-31 10:00:00');
INSERT INTO `system_logs` VALUES (6, 'operation', 1, '张三', '单位管理', '更新单位', '192.168.1.101', '{\"id\":1,\"name\":\"总公司\"}', '操作成功', '2026-03-31 10:15:00');
INSERT INTO `system_logs` VALUES (7, 'error', 2, 'admin', '系统', '登录失败', '192.168.1.102', '{\"username\":\"wrong_user\"}', '密码错误', '2026-03-31 10:30:00');
INSERT INTO `system_logs` VALUES (8, 'operation', 1, '李四', '人员管理', '创建人员', '192.168.1.103', '{\"name\":\"新员工\",\"code\":\"PER011\"}', '操作成功', '2026-03-31 10:45:00');
INSERT INTO `system_logs` VALUES (9, 'operation', 1, '张三', '人员管理', '删除人员', '192.168.1.101', '{\"id\":10}', '操作成功', '2026-03-31 11:00:00');
INSERT INTO `system_logs` VALUES (10, 'system', NULL, '系统', '定时任务', '数据备份', '127.0.0.1', NULL, '备份成功', '2026-03-31 11:00:00');
INSERT INTO `system_logs` VALUES (11, 'operation', 2, 'admin', '系统参数', '更新参数', '192.168.1.100', '{\"param_key\":\"system_name\",\"param_value\":\"新系统名称\"}', '操作成功', '2026-03-31 11:15:00');
INSERT INTO `system_logs` VALUES (12, 'login', 1, '张三', '系统', '登录', '192.168.1.101', NULL, '登录成功', '2026-03-31 08:30:00');
INSERT INTO `system_logs` VALUES (13, 'login', 1, '李四', '系统', '登录', '192.168.1.103', NULL, '登录成功', '2026-03-31 08:35:00');
INSERT INTO `system_logs` VALUES (14, 'operation', 1, '王五', '工单管理', '创建工单', '192.168.1.104', '{\"device_id\":1,\"fault_description\":\"设备故障\"}', '操作成功', '2026-03-31 11:30:00');
INSERT INTO `system_logs` VALUES (15, 'operation', 1, '赵六', '库存管理', '出库操作', '192.168.1.105', '{\"part_id\":1,\"quantity\":2}', '操作成功', '2026-03-31 11:45:00');
INSERT INTO `system_logs` VALUES (16, 'operation', 2, 'admin', '系统', '退出系统', '172.21.0.1', NULL, '操作成功', '2026-05-29 03:38:24');
INSERT INTO `system_logs` VALUES (17, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 02:33:11');
INSERT INTO `system_logs` VALUES (18, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 02:33:11');
INSERT INTO `system_logs` VALUES (19, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 02:33:11');
INSERT INTO `system_logs` VALUES (20, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 02:33:11');
INSERT INTO `system_logs` VALUES (21, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 02:33:11');
INSERT INTO `system_logs` VALUES (22, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 07:08:01');
INSERT INTO `system_logs` VALUES (23, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 07:08:02');
INSERT INTO `system_logs` VALUES (24, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 07:08:02');
INSERT INTO `system_logs` VALUES (25, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 07:08:02');
INSERT INTO `system_logs` VALUES (26, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 07:08:02');
INSERT INTO `system_logs` VALUES (27, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 07:08:02');
INSERT INTO `system_logs` VALUES (28, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 07:08:02');
INSERT INTO `system_logs` VALUES (29, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 07:08:02');
INSERT INTO `system_logs` VALUES (30, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 07:08:02');
INSERT INTO `system_logs` VALUES (31, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 07:08:02');
INSERT INTO `system_logs` VALUES (32, 'operation', 2, 'admin', '维修提醒', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-01 07:08:02');
INSERT INTO `system_logs` VALUES (33, 'operation', 2, 'admin', '系统', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-02 01:23:42');
INSERT INTO `system_logs` VALUES (34, 'operation', 2, 'admin', '系统', '新增', '172.21.0.1', NULL, '操作成功', '2026-06-02 01:23:47');

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
-- Records of system_params
-- ----------------------------
INSERT INTO `system_params` VALUES (1, '系统设置', '系统名称', 'system_name', 'CMMS 设备维修管理系统', '系统显示名称', '2026-03-31 03:28:55', '2026-03-31 03:28:55');
INSERT INTO `system_params` VALUES (2, '系统设置', '系统 Logo', 'system_logo', '/logo.png', '系统 Logo 路径', '2026-03-31 03:28:55', '2026-03-31 03:28:55');
INSERT INTO `system_params` VALUES (3, '系统设置', '默认分页大小', 'page_size', '20', '默认每页显示条数', '2026-03-31 03:28:55', '2026-03-31 03:28:55');
INSERT INTO `system_params` VALUES (4, '工单设置', '工单前缀', 'workorder_prefix', 'WO', '工单号前缀', '2026-03-31 03:28:55', '2026-03-31 03:28:55');
INSERT INTO `system_params` VALUES (5, '工单设置', '自动派单', 'auto_assign', '0', '是否开启自动派单 0 关闭 1 开启', '2026-03-31 03:28:55', '2026-03-31 03:28:55');
INSERT INTO `system_params` VALUES (6, '通知设置', '邮件通知', 'email_notify', '1', '是否开启邮件通知 0 关闭 1 开启', '2026-03-31 03:28:55', '2026-03-31 03:28:55');

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
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '检测报告表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of test_reports
-- ----------------------------
INSERT INTO `test_reports` VALUES (1, 1, NULL, 1, 'TR20240101001', 'CNC 加工中心', NULL, '2024-01-15', NULL, '张三', NULL, NULL, 'qualified', NULL, NULL, 'qualified', 'pending', 1, NULL, NULL, '设备检测正常', '2026-04-01 09:07:21', '2026-04-01 09:07:21');
INSERT INTO `test_reports` VALUES (2, 2, NULL, 2, 'TR20240201001', '激光切割机', NULL, '2024-02-20', NULL, '李四', NULL, NULL, 'partial', NULL, NULL, 'maintenance_required', 'pending', 1, NULL, NULL, '光学元件需要更换', '2026-04-01 09:07:21', '2026-04-03 03:23:04');

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
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'ç”¨æˆ·è§’è‰²å…³è”è¡¨' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_roles
-- ----------------------------
INSERT INTO `user_roles` VALUES (1, 1, 5, '2026-04-22 03:53:41');
INSERT INTO `user_roles` VALUES (2, 2, 1, '2026-04-22 03:53:41');
INSERT INTO `user_roles` VALUES (3, 3, 5, '2026-04-22 03:53:41');
INSERT INTO `user_roles` VALUES (4, 4, 5, '2026-04-22 03:53:41');
INSERT INTO `user_roles` VALUES (5, 5, 5, '2026-04-22 03:53:41');

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
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'engineer.zhang', '$2y$10$abcdefghijklmnopqrstuv', '张工', 'zhanggong@example.com', '13800138001', 1, '设备工程师', 1, 3, NULL, NULL, NULL, '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `users` VALUES (2, 'admin', '$2y$10$e6B8/r111.ZCsZ0FbjO8uOf3JOUPg/AbYttFUfFswiQm3rxDa19TO', 'admin', 'ligong@example.com', '13800138002', 1, '机械工程师', 1, 3, NULL, '2026-06-02 10:13:06', NULL, '2026-03-31 01:10:02', '2026-06-02 02:13:06');
INSERT INTO `users` VALUES (3, 'engineer.wang', '$2y$10$abcdefghijklmnopqrstuv', '王工', 'wanggong@example.com', '13800138003', 2, '电气工程师', 1, 3, NULL, NULL, NULL, '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `users` VALUES (4, 'engineer.zhao', '$2y$10$abcdefghijklmnopqrstuv', '赵工', 'zhaogong@example.com', '13800138004', 2, '维修技师', 1, 3, NULL, NULL, NULL, '2026-03-01 09:00:00', '2026-03-01 09:00:00');
INSERT INTO `users` VALUES (5, 'engineer.liu', '$2y$10$abcdefghijklmnopqrstuv', '刘工', 'liugong@example.com', '13800138005', 3, '制冷工程师', 1, 3, NULL, NULL, NULL, '2026-03-01 09:00:00', '2026-03-01 09:00:00');

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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '工单日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of work_order_logs
-- ----------------------------

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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '工单表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of work_orders
-- ----------------------------

SET FOREIGN_KEY_CHECKS = 1;
