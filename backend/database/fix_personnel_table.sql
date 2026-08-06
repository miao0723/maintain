-- =============================================
-- personnel 表字段检查和修复 SQL
-- 适用于 Navicat
-- 请逐条执行
-- =============================================

-- 第一步：检查 personnel 表是否存在
-- 如果不存在，先创建表
CREATE TABLE IF NOT EXISTS `personnel` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
    `name` varchar(100) NOT NULL COMMENT '姓名',
    `code` varchar(50) DEFAULT NULL COMMENT '工号',
    `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
    `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
    `department_id` int(11) DEFAULT NULL COMMENT '部门 ID',
    `position` varchar(50) DEFAULT 'engineer' COMMENT '岗位：engineer/supervisor/manager',
    `entry_date` date DEFAULT NULL COMMENT '入职日期',
    `status` tinyint(1) DEFAULT 1 COMMENT '状态：1 在职 0 离职',
    `notes` text COMMENT '备注',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`),
    KEY `idx_department_id` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='人员表';

-- =============================================
-- 以下是增量修复语句
-- 如果字段已存在会报错，请跳过该语句继续执行下一个
-- =============================================

-- 第二步：添加 code 字段
ALTER TABLE `personnel` ADD COLUMN `code` varchar(50) DEFAULT NULL COMMENT '工号' AFTER `name`;

-- 第三步：添加 position 字段
ALTER TABLE `personnel` ADD COLUMN `position` varchar(50) DEFAULT 'engineer' COMMENT '岗位' AFTER `department_id`;

-- 第四步：添加 notes 字段
ALTER TABLE `personnel` ADD COLUMN `notes` text COMMENT '备注' AFTER `status`;

-- 第五步：添加唯一索引
ALTER TABLE `personnel` ADD UNIQUE INDEX `uk_code` (`code`);

-- 第六步：更新已有数据
UPDATE `personnel` SET `position` = 'engineer' WHERE `position` IS NULL OR `position` = '';
UPDATE `personnel` SET `status` = 1 WHERE `status` IS NULL;

-- =============================================
-- 完成
-- =============================================
