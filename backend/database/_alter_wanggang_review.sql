-- 维修工单：增加工人自评与完成说明（交付时填写）
ALTER TABLE perf_work_orders
  ADD COLUMN self_score TINYINT UNSIGNED NULL DEFAULT NULL COMMENT '工人自评(1-5)',
  ADD COLUMN completion_note VARCHAR(500) NULL DEFAULT NULL COMMENT '完成说明/维修总结';

-- 新增两条绩效评分规则：验收评分、合格率
INSERT IGNORE INTO perf_score_rules
  (id, indicator_key, indicator_name, weight, target_value, direction, enabled, sort)
VALUES
  (6, 'avg_review',     '验收评分', 15, 5,    'higher', 1, 6),
  (7, 'qualified_rate', '合格率',   15, 100,  'higher', 1, 7);
