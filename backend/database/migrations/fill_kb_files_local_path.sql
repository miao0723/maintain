-- 填充 kb_files 表的 local_path 字段
-- 执行方式：mysql -u root -p cmms_db < fill_kb_files_local_path.sql
-- 或者：在 MySQL 客户端中执行此脚本

-- 设置本地文件路径的根目录（根据你的实际情况修改）
-- Windows: 'D:/maintain/backend/public/'
-- Linux/Docker: '/var/www/html/public/'
SET @public_path = 'D:/maintain/backend/public/';

-- 更新所有没有 local_path 的记录
UPDATE kb_files
SET local_path = CONCAT(@public_path, file_path)
WHERE local_path IS NULL OR local_path = '';

-- 显示更新结果
SELECT
    '填充完成' AS status,
    COUNT(*) AS updated_count
FROM kb_files
WHERE local_path IS NOT NULL AND local_path != '';

-- 显示一些样例数据验证
SELECT
    id,
    original_name,
    file_path,
    local_path,
    (SELECT CASE
        WHEN SUBSTRING(local_path, 1, 1) = '/' THEN 'Linux路径'
        WHEN SUBSTRING(local_path, 2, 1) = ':' THEN 'Windows路径'
        ELSE '未知路径格式'
    END) AS path_format
FROM kb_files
LIMIT 5;
