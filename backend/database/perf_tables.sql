-- =============================================================
-- 绩效考核模块数据库设计 (Performance Appraisal Module)
-- 适用：CMMS 维修业务管理系统  ThinkPHP 8.1 / MySQL 8.0
-- 说明：
--   1. 本文件在已有 cmms_db 上新增「绩效考核」所需的独立表，
--      以 perf_ 前缀隔离，避免与现有 orders / machines / devices 等表冲突。
--   2. 表结构已包含「数据可追溯」所需的全部字段与审计字段
--      （created_at / updated_at）。
--   3. 末尾附带默认评分规则与一组示例种子数据，方便直接演示。
--   4. 执行方式：在 MySQL 客户端对目标库执行本文件即可。
--      （若库名非 cmms_db，请先 USE 正确的库。）
-- =============================================================

SET NAMES utf8mb4;
-- USE cmms_db;  -- 如需要请取消注释并改为你的数据库名

-- -------------------------------------------------------------
-- 1. 维修人员表 (perf_engineers)
--    字段：姓名、工号、所属班组（另含等级/电话便于追溯）
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `perf_engineers` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`      INT UNSIGNED NULL     COMMENT '关联登录账号 users.id（工人自建工单用；NULL 表示纯演示档案）',
  `engineer_no`  VARCHAR(50)  NOT NULL COMMENT '工号',
  `name`         VARCHAR(50)  NOT NULL COMMENT '姓名',
  `team`         VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '所属班组',
  `level`        VARCHAR(20)  NOT NULL DEFAULT '初级' COMMENT '技能等级：初级/中级/高级/技师',
  `phone`        VARCHAR(20)  NULL     COMMENT '联系电话',
  `status`       TINYINT      NOT NULL DEFAULT 1 COMMENT '状态：1在职 0离职',
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_engineer_no` (`engineer_no`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_team` (`team`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='维修人员表';

-- -------------------------------------------------------------
-- 2. 设备表 (perf_devices)
--    字段：设备名称、类型、所属区域、故障描述（含设备编号/状态）
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `perf_devices` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `device_no`    VARCHAR(50)  NULL     COMMENT '设备编号',
  `name`         VARCHAR(100) NOT NULL COMMENT '设备名称',
  `type`         VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '设备类型',
  `area`         VARCHAR(100) NOT NULL DEFAULT '' COMMENT '所属区域',
  `fault_desc`   VARCHAR(255) NULL     COMMENT '常见/典型故障描述',
  `status`       TINYINT      NOT NULL DEFAULT 1 COMMENT '状态：1在用 0停用',
  `engineer_id`  INT UNSIGNED NULL     COMMENT '归属维修人员 perf_engineers.id（0/空=共享设备，工人可管理）',
  `est_hours`    DECIMAL(8,2) NULL     COMMENT '规划维修时长(小时)（工人新增/建单时预计完成用时）',
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_area` (`area`),
  KEY `idx_type` (`type`),
  KEY `idx_engineer` (`engineer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='设备表';

-- -------------------------------------------------------------
-- 3. 维修工单表 (perf_work_orders)
--    字段涵盖：报修/接单/完成时间、维修状态、预计工时(天数)、
--    实际完成天数、延期原因、返修次数、验收评价(评分+评语)等
--    状态枚举：pending 待接单 / to_repair 待维修 / processing 维修中
--              / waiting 待验收 / completed 已完成 / timeout 已超时
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `perf_work_orders` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no`      VARCHAR(50)  NOT NULL COMMENT '工单编号',
  `device_id`     INT UNSIGNED NOT NULL COMMENT '关联设备 perf_devices.id',
  `engineer_id`   INT UNSIGNED NULL     COMMENT '关联维修人员 perf_engineers.id（未接单时为空）',
  `report_time`   DATETIME     NOT NULL COMMENT '报修时间',
  `accept_time`   DATETIME     NULL     COMMENT '接单时间',
  `complete_time` DATETIME     NULL     COMMENT '完成时间',
  `status`        ENUM('pending','to_repair','processing','waiting','completed','timeout')
                    NOT NULL DEFAULT 'pending' COMMENT '维修状态：pending待接单/to_repair待维修/processing维修中/waiting待验收/completed已完成/timeout已超时',
  `est_hours`     DECIMAL(8,2) NULL     COMMENT '预计维修时长(小时,选填)',
  `actual_hours`  DECIMAL(8,2) NULL     COMMENT '实际维修时长(小时,交付时计算)',
  `delay_reason`  VARCHAR(255) NULL     COMMENT '延期原因（超时/超期时填写）',
  `repair_count`  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '返修次数',
  `review_score`  TINYINT      NULL     COMMENT '验收评分 1-5 分',
  `review_comment` TEXT         NULL     COMMENT '验收评价内容',
  `is_qualified`  TINYINT      NULL     COMMENT '是否符合：1符合 0不符合 NULL未判定（工人交付后由管理员/老板验收判定）',
  `self_score`    TINYINT      NULL     COMMENT '工人自评 1-5 分（交付时填写，供参考）',
  `completion_note` VARCHAR(500) NULL  COMMENT '完成说明/维修总结（交付时填写）',
  `fault_desc`    VARCHAR(255) NULL     COMMENT '本次故障描述（工单级快照）',
  `priority`      VARCHAR(20)  NOT NULL DEFAULT 'normal' COMMENT '优先级：low/normal/high/urgent',
  `remark`        VARCHAR(255) NULL     COMMENT '备注',
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_report_time` (`report_time`),
  KEY `idx_engineer` (`engineer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_device` (`device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='维修工单表';

-- -------------------------------------------------------------
-- 4. 绩效评分规则表 (perf_score_rules)
--    支持对各指标设置权重、方向(越高/越低越好)、基准值与启用开关。
--    指标键：on_time_rate 按时完成率 / avg_duration 平均维修时长
--            completed_count 工单完成量 / rework_rate 返修率
--            first_fix_rate 一次修复率
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `perf_score_rules` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `indicator_key`  VARCHAR(50)  NOT NULL COMMENT '指标键（唯一）',
  `indicator_name` VARCHAR(50)  NOT NULL COMMENT '指标名称',
  `weight`         DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '权重（各启用项之和建议=100）',
  `direction`      ENUM('higher','lower') NOT NULL DEFAULT 'higher' COMMENT '越高越好/越低越好',
  `target_value`   DECIMAL(8,2) NOT NULL DEFAULT 100 COMMENT '评分基准值（满分所需达到的值）',
  `pass_value`     DECIMAL(8,2) NOT NULL DEFAULT 0 COMMENT '达标基准值（higher:≥该值达标；lower:≤该值达标）',
  `unit`           VARCHAR(10)  NOT NULL DEFAULT '' COMMENT '单位：% / 天 / 单',
  `enabled`        TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用：1启用 0停用',
  `sort`           INT          NOT NULL DEFAULT 0 COMMENT '展示排序',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_indicator_key` (`indicator_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='绩效评分规则表';

-- -------------------------------------------------------------
-- 4.1 绩效配置表 (perf_config)
--     存放达标分数线、最低样本量等可调参数（key/value）
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `perf_config` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `k`          VARCHAR(50)  NOT NULL COMMENT '配置键',
  `v`          VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '配置值',
  `remark`     VARCHAR(100) NULL COMMENT '说明',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_k` (`k`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='绩效配置表';

-- -------------------------------------------------------------
-- 5. 绩效得分快照表 (perf_score_snapshots)
--    按时间段/人员/班组保存计算结果，保证历史成绩可追溯、可复核。
--    dimension：engineer 人员维度 / team 班组维度
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `perf_score_snapshots` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `period_label`    VARCHAR(50)  NOT NULL COMMENT '统计周期标签，如 2026-07~2026-09',
  `dimension`       ENUM('engineer','team') NOT NULL DEFAULT 'engineer' COMMENT '汇总维度',
  `ref_id`          INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '人员id（班组维度填0）',
  `ref_name`        VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '人员姓名或班组名',
  `team`            VARCHAR(50)  NULL     COMMENT '所属班组',
  `on_time_rate`    DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '按时完成率(%)',
  `avg_duration`    DECIMAL(8,2) NOT NULL DEFAULT 0 COMMENT '平均维修时长(小时)',
  `completed_count` INT          NOT NULL DEFAULT 0 COMMENT '工单完成量',
  `rework_rate`     DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '返修率(%)',
  `first_fix_rate`  DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '一次修复率(%)',
  `avg_review`      DECIMAL(3,2) NOT NULL DEFAULT 0 COMMENT '平均验收评分',
  `qualified_rate`  DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '合格率(%)',
  `score`           DECIMAL(6,2) NOT NULL DEFAULT 0 COMMENT '综合绩效得分',
  `rank`            INT          NOT NULL DEFAULT 0 COMMENT '排名',
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间',
  PRIMARY KEY (`id`),
  KEY `idx_period` (`period_label`,`dimension`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='绩效得分快照表';

-- =============================================================
-- 默认评分规则（首次部署写入；后续可在「评分规则」页面调整）
-- 权重合计 = 25+10+10+10+15+15+15 = 100
-- 说明：avg_duration / rework_rate 为「越低越好」；其余「越高越好」。
-- =============================================================
INSERT INTO `perf_score_rules` (`indicator_key`,`indicator_name`,`weight`,`direction`,`target_value`,`pass_value`,`unit`,`enabled`,`sort`) VALUES
('on_time_rate',   '按时完成率', 25.00, 'higher', 95.00, 95.00, '%',  1, 1),
('avg_duration',   '平均维修时长', 10.00, 'lower',  72.00, 72.00, '小时', 1, 2),
('completed_count','工单完成量', 10.00, 'higher', 8.00,  8.00,  '单', 1, 3),
('rework_rate',    '返修率',    10.00, 'lower',  10.00, 10.00, '%',  1, 4),
('first_fix_rate', '一次修复率', 15.00, 'higher', 95.00, 95.00, '%',  1, 5),
('avg_review',     '验收评分', 15.00, 'higher', 4.50,  4.50,  '分', 1, 6),
('qualified_rate', '合格率',   15.00, 'higher', 100.00,100.00,'%',  1, 7)
ON DUPLICATE KEY UPDATE
  `indicator_name`=VALUES(`indicator_name`),
  `weight`=VALUES(`weight`),
  `direction`=VALUES(`direction`),
  `target_value`=VALUES(`target_value`),
  `pass_value`=VALUES(`pass_value`),
  `unit`=VALUES(`unit`),
  `enabled`=VALUES(`enabled`),
  `sort`=VALUES(`sort`);

-- =============================================================
-- 绩效配置默认值（达标分数线 / 最低样本量）
-- =============================================================
INSERT INTO `perf_config` (`k`,`v`,`remark`) VALUES
('pass_score', '80', '达标分数线：综合得分 ≥ 该值 视为符合标准'),
('min_orders', '3',  '最低样本量：统计周期内闭环工单 ≥ 该值 才参与评级，否则样本不足')
ON DUPLICATE KEY UPDATE `v`=VALUES(`v`), `remark`=VALUES(`remark`);

-- =============================================================
-- 示例种子数据（演示用，可删除）
-- 班组：一组 / 二组 / 三组；覆盖各状态、时长、返修、验收差异
-- =============================================================

-- 维修人员
INSERT INTO `perf_engineers` (`engineer_no`,`name`,`team`,`level`,`phone`,`user_id`) VALUES
('E1001','张伟','一组','高级','13800010001',NULL),
('E1002','李娜','一组','中级','13800010002',NULL),
('E2001','王强','二组','高级','13800020001',NULL),
('E2002','赵敏','二组','初级','13800020002',NULL),
('E3001','刘洋','三组','技师','13800030001',NULL),
('E3002','陈静','三组','中级','13800030002',NULL),
('E4001','王刚','四组','初级','13800040001',(SELECT id FROM users WHERE username='wanggang'));

-- 设备（engineer_id=0 表示共享设备，工人可管理）
INSERT INTO `perf_devices` (`device_no`,`name`,`type`,`area`,`fault_desc`,`engineer_id`,`est_hours`) VALUES
('D001','中央空调主机','暖通设备','A栋机房','制冷不足/压缩机异响',0,72.0),
('D002','客梯1号','电梯','B栋大堂','运行抖动/门机故障',0,48.0),
('D003','消防泵','给排水','地下车库','压力不足/启停异常',0,72.0),
('D004','配电柜AP-3','电气设备','C栋车间','跳闸/接触器过热',0,72.0),
('D005','空压机','动力设备','C栋车间','排气量下降/漏油',0,72.0),
('D006','污水处理机','环保设备','厂区西北','出水超标/泵堵塞',0,96.0);

-- 维修工单（约 30 单，2026 年 7-9 月，覆盖不同人员/班组/状态）
-- 说明：actual_hours 与 complete_time 已按演示需要预置（小时口径）。
INSERT INTO `perf_work_orders`
(`order_no`,`device_id`,`engineer_id`,`report_time`,`accept_time`,`complete_time`,`status`,`est_hours`,`actual_hours`,`delay_reason`,`repair_count`,`review_score`,`review_comment`,`fault_desc`,`priority`) VALUES
-- 张伟(一组/E1001) 表现优秀
('WO-20260701',1,1,'2026-07-02 09:10','2026-07-02 10:00','2026-07-04 16:00','completed',72.0,55.2,NULL,0,5,'响应快，处理彻底','制冷不足','high'),
('WO-20260702',2,1,'2026-07-05 08:30','2026-07-05 09:20','2026-07-06 14:00','completed',48.0,28.8,NULL,0,5,'专业高效','门机故障','normal'),
('WO-20260703',4,1,'2026-07-12 13:00','2026-07-12 14:00','2026-07-14 11:00','completed',72.0,45.6,NULL,0,4,'已修复，建议巡检','接触器过热','high'),
('WO-20260801',1,1,'2026-08-03 09:00','2026-08-03 09:40','2026-08-05 17:00','completed',72.0,55.2,NULL,1,4,'返修后正常','压缩机异响','high'),
('WO-20260802',3,1,'2026-08-10 10:00','2026-08-10 10:30','2026-08-12 15:00','completed',72.0,52.8,NULL,0,5,'很好','压力不足','normal'),
('WO-20260901',2,1,'2026-09-01 08:20','2026-09-01 09:00','2026-09-03 16:00','completed',72.0,55.2,NULL,0,5,'优秀','运行抖动','normal'),
('WO-20260902',5,1,'2026-09-08 11:00','2026-09-08 11:30','2026-09-10 18:00','completed',72.0,55.2,NULL,0,4,'满意','排气量下降','normal'),
-- 李娜(一组/E1002) 中等
('WO-20260704',6,2,'2026-07-03 09:00','2026-07-03 10:00','2026-07-06 12:00','completed',72.0,74.4,NULL,0,4,'处理及时','泵堵塞','normal'),
('WO-20260705',4,2,'2026-07-15 14:00','2026-07-15 15:00','2026-07-19 10:00','completed',72.0,91.2,'备件到货延迟',0,3,'较慢但解决','跳闸','normal'),
('WO-20260803',6,2,'2026-08-04 09:00','2026-08-04 09:30','2026-08-08 16:00','completed',72.0,103.2,NULL,1,3,'返修一次','出水超标','normal'),
('WO-20260804',3,2,'2026-08-15 10:00','2026-08-15 11:00','2026-08-18 14:00','completed',72.0,76.8,NULL,0,4,'还行','启停异常','low'),
('WO-20260903',1,2,'2026-09-02 09:00','2026-09-02 10:00','2026-09-05 15:00','completed',72.0,79.2,NULL,0,4,'OK','制冷不足','normal'),
('WO-20260904',5,2,'2026-09-10 13:00','2026-09-10 14:00',NULL,'processing',72.0,NULL,NULL,0,NULL,NULL,'漏油待处理','normal'),
-- 王强(二组/E2001) 优秀偏快
('WO-20260706',2,3,'2026-07-04 09:00','2026-07-04 09:30','2026-07-05 18:00','completed',48.0,33.6,NULL,0,5,'神速','门机故障','high'),
('WO-20260707',5,3,'2026-07-18 10:00','2026-07-18 10:20','2026-07-20 16:00','completed',72.0,52.8,NULL,0,5,'非常专业','排气量下降','normal'),
('WO-20260805',4,3,'2026-08-05 09:00','2026-08-05 09:30','2026-08-07 17:00','completed',72.0,55.2,NULL,0,5,'赞','接触器过热','high'),
('WO-20260806',3,3,'2026-08-18 11:00','2026-08-18 11:30','2026-08-20 15:00','completed',72.0,50.4,NULL,0,4,'满意','压力不足','normal'),
('WO-20260905',2,3,'2026-09-03 09:00','2026-09-03 09:20','2026-09-04 20:00','completed',48.0,36.0,NULL,0,5,'优秀','运行抖动','normal'),
('WO-20260906',6,3,'2026-09-11 10:00','2026-09-11 10:30','2026-09-13 16:00','completed',72.0,52.8,NULL,0,4,'好','泵堵塞','low'),
-- 赵敏(二组/E2002) 偏弱、有超时
('WO-20260708',3,4,'2026-07-06 09:00','2026-07-06 11:00','2026-07-12 16:00','timeout',72.0,151.2,'经验不足处理慢',0,2,'超时严重','启停异常','normal'),
('WO-20260709',4,4,'2026-07-20 10:00','2026-07-20 13:00','2026-07-24 15:00','completed',72.0,100.8,'排查耗时',1,2,'返修一次','跳闸','normal'),
('WO-20260807',5,4,'2026-08-06 09:00','2026-08-06 10:00','2026-08-11 17:00','timeout',72.0,127.2,'缺备件',0,3,'超时但完成','漏油','normal'),
('WO-20260808',6,4,'2026-08-20 10:00','2026-08-20 11:00','2026-08-23 14:00','completed',72.0,76.8,NULL,0,3,'一般','出水超标','low'),
('WO-20260907',3,4,'2026-09-04 09:00','2026-09-04 10:00','2026-09-07 16:00','completed',72.0,79.2,NULL,0,3,'尚可','压力不足','normal'),
('WO-20260908',4,4,'2026-09-12 11:00','2026-09-12 13:00',NULL,'waiting',72.0,NULL,NULL,0,NULL,NULL,'接触器过热','normal'),
-- 刘洋(三组/E3001) 技师、稳定优秀
('WO-20260710',1,5,'2026-07-07 09:00','2026-07-07 09:30','2026-07-09 18:00','completed',72.0,57.6,NULL,0,5,'专家级','制冷不足','high'),
('WO-20260711',2,5,'2026-07-21 10:00','2026-07-21 10:20','2026-07-22 20:00','completed',48.0,33.6,NULL,0,5,'极快','门机故障','high'),
('WO-20260809',4,5,'2026-08-07 09:00','2026-08-07 09:30','2026-08-09 17:00','completed',72.0,55.2,NULL,0,5,'很好','接触器过热','high'),
('WO-20260810',5,5,'2026-08-21 10:00','2026-08-21 10:30','2026-08-23 16:00','completed',72.0,52.8,NULL,0,5,'专业','排气量下降','normal'),
('WO-20260909',1,5,'2026-09-05 09:00','2026-09-05 09:20','2026-09-07 18:00','completed',72.0,57.6,NULL,0,5,'优秀','制冷不足','high'),
('WO-20260910',3,5,'2026-09-13 10:00','2026-09-13 10:30','2026-09-15 16:00','completed',72.0,52.8,NULL,0,4,'满意','压力不足','normal'),
-- 陈静(三组/E3002) 中等
('WO-20260712',6,6,'2026-07-08 09:00','2026-07-08 10:00','2026-07-11 15:00','completed',72.0,76.8,NULL,0,4,'及时','泵堵塞','normal'),
('WO-20260713',5,6,'2026-07-22 10:00','2026-07-22 11:00','2026-07-25 16:00','completed',72.0,76.8,NULL,1,3,'返修一次','漏油','normal'),
('WO-20260811',2,6,'2026-08-08 09:00','2026-08-08 09:30','2026-08-10 18:00','completed',48.0,57.6,NULL,0,4,'好','运行抖动','normal'),
('WO-20260812',4,6,'2026-08-22 10:00','2026-08-22 11:00','2026-08-25 15:00','completed',72.0,74.4,NULL,0,4,'还行','跳闸','normal'),
('WO-20260911',6,6,'2026-09-06 09:00','2026-09-06 10:00',NULL,'processing',72.0,NULL,NULL,0,NULL,NULL,'出水超标','low'),
-- 待接单示例
('WO-20260912',1,NULL,'2026-09-14 09:00',NULL,NULL,'pending',3,NULL,NULL,0,NULL,NULL,'制冷不足','high');

-- =============================================================
-- 附：维修人员「王刚」登录账号（工人端自建工单演示用）
--   密码统一为 123456（BCRYPT 哈希，与系统 UserService 一致）。
--   若已存在则跳过。
-- =============================================================
INSERT INTO `users` (`username`,`password`,`real_name`,`role_type`,`status`,`created_at`,`updated_at`)
SELECT 'wanggang', '$2y$10$btS17dEadIQXW1eTuZypgeGhS.o9KvGCDHb8kFYLJeCHIk/CUEw.S', '王刚', 3, 1, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE `username`='wanggang');
