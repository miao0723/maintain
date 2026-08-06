-- 添加通知地址字段到维修提醒表
ALTER TABLE `repair_reminders`
ADD COLUMN `toaddrs` varchar(100) DEFAULT NULL COMMENT '通知目标地址(手机号或邮箱)';