-- 维修工单状态枚举扩展：新增 to_repair（待维修）
-- 说明：工人端「维修作业 → 新增工单」现在可选择「待维修」状态，
--       选该状态时 accept_time 留空（尚未开始维修）。
-- 适用：已部署旧版 perf_work_orders 表的库，执行本文件即可升级。
-- 全新部署请直接用 perf_tables.sql（已含 to_repair）。

USE cmms_db;

SET @has = (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA='cmms_db' AND TABLE_NAME='perf_work_orders'
              AND COLUMN_TYPE LIKE '%to_repair%');
SET @sql = IF(@has=0,
  "ALTER TABLE perf_work_orders MODIFY COLUMN `status`
     ENUM('pending','to_repair','processing','waiting','completed','timeout')
     NOT NULL DEFAULT 'pending'
     COMMENT '维修状态：pending待接单/to_repair待维修/processing维修中/waiting待验收/completed已完成/timeout已超时'",
  "SELECT 1");
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
