-- 008: 内部人员设备来源字段
-- 可直接在 Navicat 查询窗口中运行
--
-- 说明：orders 表新增 device_source，记录内部人员（role=internal）发起维修/回收时
--       设备的来源：project_return-项目返修, warehouse-仓库, fixed_asset-固定资产。
--       普通用户（role=user）该字段为 NULL。

-- ============================================
-- 1. 扩展 orders 表，新增 device_source 列
-- ============================================
SET @db = DATABASE();

ALTER TABLE orders
  ADD COLUMN `device_source` varchar(30) NULL
  COMMENT '内部人员设备来源: project_return-项目返修, warehouse-仓库, fixed_asset-固定资产'
  AFTER `is_internal`;

-- ============================================
-- 完成
-- ============================================
SELECT '迁移 008 执行完成（新增 device_source 设备来源字段）' AS result;
