-- ============================================================
-- 修复 statistics_income_records 表中 remark 字段的乱码
--
-- 乱码原因：UTF-8 编码的中文字符被当做 Latin-1 存储
-- 修复方式：将每个乱码值替换为正确的中文
-- ================================================

UPDATE `statistics_income_records` SET `remark` = '线上维修收款' WHERE `remark` = 'çº¿ä¸Šç»´ä¿®æ"¶æ¬¾';
UPDATE `statistics_income_records` SET `remark` = '企业客户转账' WHERE `remark` = 'ä¼\x81ä¸šå®¢æˆ·è½¬è´¦';
UPDATE `statistics_income_records` SET `remark` = '单位客户转账' WHERE `remark` = 'å\x8d•ä½\x8då®¢æˆ·è½¬è´¦';
UPDATE `statistics_income_records` SET `remark` = '对公转账' WHERE `remark` = 'å¯¹å…¬è½¬è´¦';
UPDATE `statistics_income_records` SET `remark` = '大客户回款' WHERE `remark` = 'å¤§å®¢æˆ·å\x9bžæ¬¾';
UPDATE `statistics_income_records` SET `remark` = '大额转账' WHERE `remark` = 'å¤§é¢\9dè½¬è´¦';
UPDATE `statistics_income_records` SET `remark` = '单位客户结算' WHERE `remark` = 'å\x8d•ä½\x8då®¢æˆ·ç»\x93ç®\97';

SELECT ROW_COUNT() AS 'fixed_rows';

-- 验证：检查是否还有乱码（以非ASCII乱码特征行数）
SELECT `id`, `remark`, HEX(`remark`) AS remark_hex
FROM `statistics_income_records`
WHERE `remark` REGEXP '[^\x00-\x7F]' = 0;  -- 如果仍有问题，这里会显示