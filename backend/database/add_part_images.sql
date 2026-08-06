-- ============================================================
-- 为现有配件添加示例图片URL
-- 执行时间：2026-05-22
-- ============================================================

-- 首先添加图片字段（如果不存在）
SET @dbname = DATABASE();
SET @tablename = 'spare_parts';
SET @columnname = 'image_url';

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_schema = @dbname)
      AND (table_name = @tablename)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(500) NULL DEFAULT NULL COMMENT \'配件图片URL\' AFTER description')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 为现有配件生成图片URL
-- 根据分类ID使用不同的示例图片
UPDATE spare_parts SET image_url = '/uploads/parts/placeholder.svg' WHERE (image_url IS NULL OR image_url = '') AND id >= 201;

-- 根据分类设置不同的图片
UPDATE spare_parts SET image_url = '/uploads/parts/air_filter.svg' WHERE part_name LIKE '%空气%' AND (image_url IS NULL OR image_url = '');
UPDATE spare_parts SET image_url = '/uploads/parts/oil_filter.svg' WHERE part_name LIKE '%机油%' AND (image_url IS NULL OR image_url = '');
UPDATE spare_parts SET image_url = '/uploads/parts/filter.svg' WHERE part_name LIKE '%滤芯%' AND (image_url IS NULL OR image_url = '');
UPDATE spare_parts SET image_url = '/uploads/parts/contact.svg' WHERE part_name LIKE '%接触器%' AND (image_url IS NULL OR image_url = '');
UPDATE spare_parts SET image_url = '/uploads/parts/switch.svg' WHERE part_name LIKE '%断路器%' AND (image_url IS NULL OR image_url = '');
UPDATE spare_parts SET image_url = '/uploads/parts/belt.svg' WHERE part_name LIKE '%皮带%' AND (image_url IS NULL OR image_url = '');
UPDATE spare_parts SET image_url = '/uploads/parts/chain.svg' WHERE part_name LIKE '%链条%' AND (image_url IS NULL OR image_url = '');

SELECT '=== 图片字段添加完成 ===' as message;
SELECT COUNT(*) as 已有图片的配件数量 FROM spare_parts WHERE image_url IS NOT NULL AND image_url != '';
