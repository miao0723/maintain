-- 王刚账号与绩效档案初始化（一次性）
-- 说明：为维修人员王刚建立登录账号(密码 123456，BCRYPT 哈希)，
--       并在 perf_engineers 中建立绩效档案、通过 user_id 关联登录账号。
--       同时为 perf_engineers / perf_work_orders 增加支撑字段。

USE cmms_db;

-- 1. perf_engineers 增加 user_id，关联登录账号 users.id
SET @c1 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='cmms_db' AND TABLE_NAME='perf_engineers' AND COLUMN_NAME='user_id');
SET @s1 = IF(@c1=0, "ALTER TABLE perf_engineers ADD COLUMN user_id INT UNSIGNED NULL COMMENT '关联 users.id（工人登录账号）' AFTER `id`", "SELECT 1");
PREPARE stmt1 FROM @s1; EXECUTE stmt1; DEALLOCATE PREPARE stmt1;
SET @c1b = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='cmms_db' AND TABLE_NAME='perf_engineers' AND INDEX_NAME='uk_user_id');
SET @s1b = IF(@c1b=0, "ALTER TABLE perf_engineers ADD UNIQUE KEY uk_user_id (user_id)", "SELECT 1");
PREPARE stmt1b FROM @s1b; EXECUTE stmt1b; DEALLOCATE PREPARE stmt1b;

-- 2. perf_work_orders 增加 is_qualified（是否符合）
SET @c2 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='cmms_db' AND TABLE_NAME='perf_work_orders' AND COLUMN_NAME='is_qualified');
SET @s2 = IF(@c2=0, "ALTER TABLE perf_work_orders ADD COLUMN is_qualified TINYINT NULL COMMENT '是否符合：1符合 0不符合 NULL未判定' AFTER review_comment", "SELECT 1");
PREPARE stmt2 FROM @s2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- 3. 创建王刚登录账号（工程师角色 role_type=3，状态正常）
INSERT INTO users (username, password, real_name, role_type, status, created_at, updated_at)
SELECT 'wanggang', '$2y$10$btS17dEadIQXW1eTuZypgeGhS.o9KvGCDHb8kFYLJeCHIk/CUEw.S', '王刚', 3, 1, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='wanggang');

-- 4. 创建王刚绩效档案（关联登录账号；班组：四组）
INSERT INTO perf_engineers (engineer_no, name, team, level, user_id, created_at, updated_at)
SELECT 'E4001', '王刚', '四组', '初级', u.id, NOW(), NOW()
FROM users u
WHERE u.username='wanggang'
  AND NOT EXISTS (SELECT 1 FROM perf_engineers WHERE user_id=u.id);
