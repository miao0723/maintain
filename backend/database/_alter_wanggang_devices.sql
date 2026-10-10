-- 设备表扩展：归属人员 + 规划天数
ALTER TABLE perf_devices
  ADD COLUMN IF NOT EXISTS engineer_id INT UNSIGNED NULL COMMENT '归属维修人员(0/空=共享)',
  ADD COLUMN IF NOT EXISTS est_days DECIMAL(5,1) NULL COMMENT '规划维修天数';

UPDATE perf_devices SET engineer_id = 0 WHERE engineer_id IS NULL;
UPDATE perf_devices SET est_days = 3.0 WHERE est_days IS NULL;

SELECT id, name, engineer_id, est_days FROM perf_devices ORDER BY id;
