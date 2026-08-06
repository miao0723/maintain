-- 为 kb_files 表添加本地路径字段
-- 执行时间: 2026-04-29

-- 检查列是否已存在，如果不存在则添加
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'kb_files'
      AND column_name = 'local_path'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE `kb_files` ADD COLUMN `local_path` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT ''本地完整路径'' AFTER `file_path`',
    'SELECT ''Column local_path already exists in kb_files table'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
