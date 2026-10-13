-- ============================================================
-- 外部系统人员同步 + 同步日志 表
-- 依赖：cmms_db
-- 说明：external_personnel 以外部系统 id 为唯一键做 upsert 幂等同步；
--       phone / id_card / address 落库为 AES-256-GCM 密文（CryptoService）。
-- ============================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `external_personnel` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '本地主键',
  `ext_id` varchar(64) NOT NULL COMMENT '外部系统人员ID（唯一键，upsert依据）',
  `employee_name` varchar(100) NULL DEFAULT NULL COMMENT '姓名',
  `department` varchar(200) NULL DEFAULT NULL COMMENT '部门',
  `position` varchar(100) NULL DEFAULT NULL COMMENT '岗位',
  `status` varchar(50) NULL DEFAULT NULL COMMENT '外部原始状态',
  `is_active` tinyint UNSIGNED NOT NULL DEFAULT 1 COMMENT '是否在职:1在职 0离职/停用(禁用不删除)',
  `wps_user_id` varchar(100) NULL DEFAULT NULL COMMENT 'WPS用户ID',
  `phone_enc` varchar(500) NULL DEFAULT NULL COMMENT '手机号(加密)',
  `id_card_enc` varchar(500) NULL DEFAULT NULL COMMENT '身份证(加密)',
  `address_enc` varchar(1000) NULL DEFAULT NULL COMMENT '地址(加密)',
  `contract_start_date` date NULL DEFAULT NULL COMMENT '合同开始日期',
  `contract_end_date` date NULL DEFAULT NULL COMMENT '合同结束日期',
  `annual_leave_days` decimal(6,2) NULL DEFAULT NULL COMMENT '年假天数',
  `raw_json` json NULL COMMENT '外部原始返回(备份)',
  `source_sync_id` int UNSIGNED NULL DEFAULT NULL COMMENT '最近一次同步日志ID',
  `synced_at` datetime NULL DEFAULT NULL COMMENT '最近同步时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uk_ext_id`(`ext_id`),
  INDEX `idx_name`(`employee_name`),
  INDEX `idx_is_active`(`is_active`),
  INDEX `idx_wps`(`wps_user_id`)
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '外部系统人员(同步)' ROW_FORMAT = DYNAMIC;

CREATE TABLE IF NOT EXISTS `personnel_sync_logs` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `trigger_type` varchar(20) NOT NULL DEFAULT 'manual' COMMENT '触发方式:manual/scheduled',
  `operator_id` int UNSIGNED NULL DEFAULT NULL COMMENT '操作人用户ID',
  `started_at` datetime NULL DEFAULT NULL COMMENT '开始时间',
  `finished_at` datetime NULL DEFAULT NULL COMMENT '结束时间',
  `total` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '拉取总条数',
  `success` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '成功条数',
  `failed` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '失败条数',
  `disabled` int UNSIGNED NOT NULL DEFAULT 0 COMMENT '本次置为禁用(离职/停用)条数',
  `status` varchar(20) NOT NULL DEFAULT 'running' COMMENT 'running/success/failed',
  `error_detail` json NULL COMMENT '失败明细 [{ext_id,error}]',
  `message` varchar(500) NULL DEFAULT NULL COMMENT '摘要信息',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_status`(`status`),
  INDEX `idx_created`(`created_at`)
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '人员同步日志' ROW_FORMAT = DYNAMIC;

SET FOREIGN_KEY_CHECKS = 1;
