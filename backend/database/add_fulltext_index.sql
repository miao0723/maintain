-- 为 kb_chunks 表的 content 字段添加 FULLTEXT 索引
-- 用于支持全文搜索功能

USE cmms_db;

-- 尝试添加索引（如果已存在会报错，这是预期的）
ALTER TABLE kb_chunks ADD FULLTEXT INDEX idx_content_fulltext (content);
