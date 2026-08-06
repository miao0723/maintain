-- ----------------------------
-- Table structure for quotation_orders
-- ----------------------------
DROP TABLE IF EXISTS `quotation_orders`;
CREATE TABLE `quotation_orders` (
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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '报价单主表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for quotation_items
-- ----------------------------
DROP TABLE IF EXISTS `quotation_items`;
CREATE TABLE `quotation_items` (
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
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '报价单项目明细表' ROW_FORMAT = DYNAMIC;
