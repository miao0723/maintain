-- ============================================================
-- 客服聊天表字段补全迁移
-- 用途：确保 chat_conversations 和 chat_messages 表字段完整
-- 运行方式：NaviCat 或其他工具直接执行本文件
-- 特性：幂等，多次运行不会报错
-- ============================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_not_exists$$
CREATE PROCEDURE add_column_if_not_exists(
  IN tbl_name VARCHAR(128),
  IN col_name VARCHAR(128),
  IN col_def VARCHAR(2048)
)
BEGIN
  DECLARE col_count INT DEFAULT 0;
  SELECT COUNT(*) INTO col_count
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = tbl_name
    AND COLUMN_NAME = col_name;
  IF col_count = 0 THEN
    SET @sql = CONCAT('ALTER TABLE ', tbl_name, ' ADD COLUMN ', col_name, ' ', col_def);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    SELECT CONCAT('[OK] 已添加 ', tbl_name, '.', col_name) AS result;
  ELSE
    SELECT CONCAT('[跳过] ', tbl_name, '.', col_name, ' 已存在') AS result;
  END IF;
END$$

DROP PROCEDURE IF EXISTS add_index_if_not_exists$$
CREATE PROCEDURE add_index_if_not_exists(
  IN tbl_name VARCHAR(128),
  IN idx_name VARCHAR(128),
  IN idx_def VARCHAR(2048)
)
BEGIN
  DECLARE idx_count INT DEFAULT 0;
  SELECT COUNT(*) INTO idx_count
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = tbl_name
    AND INDEX_NAME = idx_name;
  IF idx_count = 0 THEN
    SET @sql = CONCAT('ALTER TABLE ', tbl_name, ' ADD INDEX ', idx_name, ' ', idx_def);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    SELECT CONCAT('[OK] 已添加索引 ', tbl_name, '.', idx_name) AS result;
  ELSE
    SELECT CONCAT('[跳过] 索引 ', tbl_name, '.', idx_name, ' 已存在') AS result;
  END IF;
END$$

DELIMITER ;

-- ==================== chat_conversations 表 ====================

CALL add_column_if_not_exists('chat_conversations', 'user_openid', "VARCHAR(128) DEFAULT '' AFTER user_id");

CALL add_column_if_not_exists('chat_conversations', 'summary', "VARCHAR(512) DEFAULT '' AFTER status");

CALL add_column_if_not_exists('chat_conversations', 'context', "JSON AFTER summary");

CALL add_column_if_not_exists('chat_conversations', 'end_reason', "VARCHAR(64) DEFAULT '' AFTER context");

CALL add_column_if_not_exists('chat_conversations', 'last_activity', "DATETIME DEFAULT CURRENT_TIMESTAMP AFTER end_reason");

CALL add_column_if_not_exists('chat_conversations', 'created_at', "DATETIME DEFAULT CURRENT_TIMESTAMP AFTER last_activity");

-- status 字段类型修正（确保 ENUM 值正确）
ALTER TABLE chat_conversations 
  MODIFY COLUMN status ENUM('active','transferred','completed') DEFAULT 'active';

-- ==================== chat_messages 表 ====================

CALL add_column_if_not_exists('chat_messages', 'entities', "JSON AFTER content");

CALL add_column_if_not_exists('chat_messages', 'intent', "VARCHAR(128) DEFAULT '' AFTER entities");

CALL add_column_if_not_exists('chat_messages', 'confidence', "DECIMAL(5,4) DEFAULT 0 AFTER intent");

CALL add_column_if_not_exists('chat_messages', 'suggested_actions', "JSON AFTER confidence");

CALL add_column_if_not_exists('chat_messages', 'reply_to_id', "VARCHAR(64) DEFAULT '' AFTER suggested_actions");

CALL add_column_if_not_exists('chat_messages', 'is_read', "TINYINT(1) DEFAULT 0 AFTER reply_to_id");

CALL add_column_if_not_exists('chat_messages', 'created_at', "DATETIME DEFAULT CURRENT_TIMESTAMP AFTER is_read");

-- sender_type 字段类型修正（确保 ENUM 值正确）
ALTER TABLE chat_messages 
  MODIFY COLUMN sender_type ENUM('user','ai','human','system') NOT NULL;

-- ==================== 索引补全 ====================

CALL add_index_if_not_exists('chat_conversations', 'idx_user_id', '(user_id)');
CALL add_index_if_not_exists('chat_conversations', 'idx_status', '(status)');
CALL add_index_if_not_exists('chat_conversations', 'idx_last_activity', '(last_activity)');

CALL add_index_if_not_exists('chat_messages', 'idx_conversation_id', '(conversation_id)');
CALL add_index_if_not_exists('chat_messages', 'idx_sender_type', '(sender_type)');
CALL add_index_if_not_exists('chat_messages', 'idx_created_at', '(created_at)');

-- ==================== 清理 ====================

DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DROP PROCEDURE IF EXISTS add_index_if_not_exists;

SELECT '========================================' AS '';
SELECT '  迁移完成！所有字段和索引已补全。' AS result;
SELECT '========================================' AS '';
