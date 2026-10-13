-- ============================================================
-- 维修时长精度升级：天 -> 小时（2026-10-13）
-- 背景：原 est_days/actual_days 为 DECIMAL(5,1)「天」，1 小时的维修算出 0.04 天，
--       四舍五入显示「0天」，像没有数据。现全链路改为小时级精度（2 位小数），
--       显示规则：<24 小时显示「X小时」，>=24 小时显示「X.X天」。
-- 注意：MySQL DDL 会隐式提交，不要包在事务里执行；本脚本已按可重入原则编写。
-- ============================================================

-- 1. 工单表：列改名 + 语义转换（存量值 ×24）
ALTER TABLE perf_work_orders
  CHANGE COLUMN est_days est_hours DECIMAL(8,2) NULL COMMENT '预计维修时长(小时,选填)' AFTER status,
  CHANGE COLUMN actual_days actual_hours DECIMAL(8,2) NULL COMMENT '实际维修时长(小时,交付时计算)' AFTER est_hours;
UPDATE perf_work_orders SET est_hours = est_hours * 24 WHERE est_hours IS NOT NULL;
UPDATE perf_work_orders SET actual_hours = actual_hours * 24 WHERE actual_hours IS NOT NULL;

-- 2. 设备表：规划工期同样改小时
ALTER TABLE perf_devices
  CHANGE COLUMN est_days est_hours DECIMAL(8,2) NULL COMMENT '规划维修时长(小时)';
UPDATE perf_devices SET est_hours = est_hours * 24 WHERE est_hours IS NOT NULL;

-- 3. 评分规则：平均维修时长目标 3 天 -> 72 小时
UPDATE perf_score_rules SET target_value = 72, pass_value = 72, unit = '小时' WHERE indicator_key = 'avg_duration';

-- 4. 快照表：平均时长列加宽（小时口径）
ALTER TABLE perf_score_snapshots
  MODIFY COLUMN avg_duration DECIMAL(8,2) NOT NULL DEFAULT 0 COMMENT '平均维修时长(小时)';
