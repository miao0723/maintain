-- ----------------------------
-- 引流模块数据库迁移
-- 创建时间: 2026-04-07
-- ----------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for marketing_cases (案例管理)
-- ----------------------------
DROP TABLE IF EXISTS `marketing_cases`;
CREATE TABLE `marketing_cases` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '案例ID',
  `title` varchar(200) NOT NULL COMMENT '案例标题',
  `client_name` varchar(100) NOT NULL COMMENT '客户名称',
  `industry` varchar(50) NOT NULL COMMENT '行业',
  `cover_image` varchar(500) NULL DEFAULT NULL COMMENT '封面图片URL',
  `content` text NULL COMMENT '案例详细内容',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态:1显示 0隐藏',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_industry`(`industry` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '案例管理表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for marketing_service_config (客服配置)
-- ----------------------------
DROP TABLE IF EXISTS `marketing_service_config`;
CREATE TABLE `marketing_service_config` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `phone` varchar(20) NOT NULL COMMENT '客服电话',
  `wechat` varchar(50) NULL DEFAULT NULL COMMENT '客服微信',
  `qq` varchar(20) NULL DEFAULT NULL COMMENT '客服QQ',
  `email` varchar(100) NULL DEFAULT NULL COMMENT '客服邮箱',
  `work_time` varchar(100) NULL DEFAULT NULL COMMENT '工作时间',
  `qrcode` varchar(500) NULL DEFAULT NULL COMMENT '客服二维码URL',
  `description` text NULL COMMENT '服务说明',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态:1启用 0禁用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '客服配置表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for marketing_douyin_content (抖音内容)
-- ----------------------------
DROP TABLE IF EXISTS `marketing_douyin_content`;
CREATE TABLE `marketing_douyin_content` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '内容ID',
  `title` varchar(200) NOT NULL COMMENT '视频标题',
  `video_url` varchar(500) NOT NULL COMMENT '视频链接',
  `cover` varchar(500) NULL DEFAULT NULL COMMENT '封面图片URL',
  `description` text NULL COMMENT '视频描述/文案',
  `tags` varchar(500) NULL DEFAULT NULL COMMENT '话题标签，逗号分隔',
  `views` int NOT NULL DEFAULT 0 COMMENT '播放量',
  `likes` int NOT NULL DEFAULT 0 COMMENT '点赞数',
  `comments` int NOT NULL DEFAULT 0 COMMENT '评论数',
  `shares` int NOT NULL DEFAULT 0 COMMENT '分享数',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '状态:1发布 0草稿',
  `publish_time` timestamp NULL DEFAULT NULL COMMENT '发布时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_publish_time`(`publish_time` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '抖音内容表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for marketing_partners (合作伙伴)
-- ----------------------------
DROP TABLE IF EXISTS `marketing_partners`;
CREATE TABLE `marketing_partners` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '企业ID',
  `name` varchar(100) NOT NULL COMMENT '企业名称',
  `logo` varchar(500) NULL DEFAULT NULL COMMENT '企业Logo URL',
  `industry` varchar(50) NOT NULL COMMENT '所属行业',
  `contact_person` varchar(50) NOT NULL COMMENT '联系人',
  `contact_phone` varchar(20) NOT NULL COMMENT '联系电话',
  `cooperation_type` varchar(20) NOT NULL COMMENT '合作类型:供应商/客户/服务商/战略伙伴',
  `start_date` date NULL DEFAULT NULL COMMENT '合作开始日期',
  `description` text NULL COMMENT '企业简介',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态:1合作中 0已终止',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_industry`(`industry` ASC) USING BTREE,
  INDEX `idx_cooperation_type`(`cooperation_type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '合作伙伴表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of marketing_cases (案例测试数据)
-- ----------------------------
INSERT INTO `marketing_cases` (`title`, `client_name`, `industry`, `cover_image`, `content`, `sort`, `status`, `created_at`, `updated_at`) VALUES
('某大型制造企业设备维修项目', '华东机械制造有限公司', '制造业', 'https://picsum.photos/seed/case1/200/150', '成功完成企业生产线设备维护，提高设备运行效率30%，获得客户高度认可。', 1, 1, '2024-01-15 10:30:00', '2024-01-15 10:30:00'),
('建筑工地工程机械维修', '中建某局', '建筑业', 'https://picsum.photos/seed/case2/200/150', '快速响应，24小时内完成工程机械故障排查与维修，保障工地正常施工。', 2, 1, '2024-01-10 14:20:00', '2024-01-10 14:20:00'),
('物流中心叉车维修保养', '顺丰物流产业园', '物流业', 'https://picsum.photos/seed/case3/200/150', '定期保养维护，降低叉车故障率50%，提升物流效率。', 3, 1, '2024-01-05 09:15:00', '2024-01-05 09:15:00'),
('发电机组维修改造', '国家能源集团', '能源业', 'https://picsum.photos/seed/case4/200/150', '老旧发电机组改造，提升发电效率20%，节约运营成本。', 4, 1, '2023-12-20 16:45:00', '2023-12-20 16:45:00'),
('医院医疗设备维护', '仁和医院', '医疗业', 'https://picsum.photos/seed/case5/200/150', '专业医疗设备维护保养服务，确保设备安全稳定运行。', 5, 1, '2023-12-15 11:00:00', '2023-12-15 11:00:00'),
('食品工厂设备升级改造', '康师傅食品厂', '食品业', 'https://picsum.photos/seed/case6/200/150', '生产线设备升级改造，提高产能并符合食品安全标准。', 6, 0, '2023-11-10 08:30:00', '2023-11-10 08:30:00');

-- ----------------------------
-- Records of marketing_service_config (客服配置测试数据)
-- ----------------------------
INSERT INTO `marketing_service_config` (`phone`, `wechat`, `qq`, `email`, `work_time`, `qrcode`, `description`, `status`, `created_at`, `updated_at`) VALUES
('400-888-8888', 'service_kefu001', '123456789', 'service@example.com', '周一至周日 8:00-22:00', 'https://picsum.photos/seed/qrcode/150/150', '为您提供专业的设备维修咨询服务，如有疑问请联系客服，我们将在第一时间为您解答。', 1, '2024-01-01 09:00:00', '2026-04-07 10:00:00');

-- ----------------------------
-- Records of marketing_douyin_content (抖音内容测试数据)
-- ----------------------------
INSERT INTO `marketing_douyin_content` (`title`, `video_url`, `cover`, `description`, `tags`, `views`, `likes`, `comments`, `shares`, `status`, `publish_time`, `created_at`, `updated_at`) VALUES
('大型挖掘机液压系统维修教程', 'https://www.douyin.com/video/1234567890', 'https://picsum.photos/seed/dy1/200/150', '详细讲解挖掘机液压系统常见故障及维修方法', '机械维修,挖掘机,液压系统', 12500, 856, 124, 45, 1, '2024-01-20 15:30:00', '2024-01-20 15:30:00', '2024-01-20 15:30:00'),
('起重机日常保养要点', 'https://www.douyin.com/video/2345678901', 'https://picsum.photos/seed/dy2/200/150', '起重机日常检查和保养的关键步骤，延长设备寿命', '起重机,设备保养,工程机械', 8900, 523, 78, 32, 1, '2024-01-18 10:00:00', '2024-01-18 10:00:00', '2024-01-18 10:00:00'),
('混凝土泵车故障快速诊断', 'https://www.douyin.com/video/3456789012', 'https://picsum.photos/seed/dy3/200/150', '泵车常见故障的快速判断和解决方法', '混凝土泵车,故障诊断,维修技巧', 15600, 1205, 189, 67, 1, '2024-01-15 14:20:00', '2024-01-15 14:20:00', '2024-01-15 14:20:00'),
('空压机节能改造分享', 'https://www.douyin.com/video/4567890123', 'https://picsum.photos/seed/dy4/200/150', '工厂空压机节能改造案例分享，降低用电成本', '空压机,节能改造,工业设备', 6800, 412, 56, 23, 1, '2024-01-12 09:00:00', '2024-01-12 09:00:00', '2024-01-12 09:00:00'),
('数控机床精度调整方法', 'https://www.douyin.com/video/5678901234', 'https://picsum.photos/seed/dy5/200/150', '数控机床精度调整的详细步骤和注意事项', '数控机床,精度调整,机械设备', 9200, 678, 92, 38, 1, '2024-01-10 16:00:00', '2024-01-10 16:00:00', '2024-01-10 16:00:00'),
('叉车电瓶维护技巧', 'https://www.douyin.com/video/6789012345', 'https://picsum.photos/seed/dy6/200/150', '叉车电瓶日常维护和保养技巧，延长电瓶使用寿命', '叉车,电瓶维护,设备保养', 0, 0, 0, 0, 0, NULL, '2024-01-08 11:00:00', '2024-01-08 11:00:00');

-- ----------------------------
-- Records of marketing_partners (合作伙伴测试数据)
-- ----------------------------
INSERT INTO `marketing_partners` (`name`, `logo`, `industry`, `contact_person`, `contact_phone`, `cooperation_type`, `start_date`, `description`, `status`, `created_at`, `updated_at`) VALUES
('中联重科股份有限公司', 'https://picsum.photos/seed/logo1/80/50', '制造业', '张经理', '13800138001', '供应商', '2023-01-15', '国内领先的工程机械制造企业，主要供应混凝土机械、起重机械等设备', 1, '2023-01-15 10:00:00', '2023-01-15 10:00:00'),
('三一重工股份有限公司', 'https://picsum.photos/seed/logo2/80/50', '制造业', '李经理', '13800138002', '供应商', '2023-03-20', '工程机械行业龙头企业，挖掘机、混凝土设备供应商', 1, '2023-03-20 14:30:00', '2023-03-20 14:30:00'),
('中国建筑第三工程局', 'https://picsum.photos/seed/logo3/80/50', '建筑业', '王主管', '13800138003', '客户', '2023-05-10', '大型建筑施工企业，我司提供设备维修保养服务', 1, '2023-05-10 09:15:00', '2023-05-10 09:15:00'),
('徐工集团工程机械有限公司', 'https://picsum.photos/seed/logo4/80/50', '制造业', '赵经理', '13800138004', '供应商', '2022-08-01', '工程机械制造企业，合作已终止', 0, '2022-08-01 16:00:00', '2024-01-10 10:00:00'),
('阿特拉斯科普柯', 'https://picsum.photos/seed/logo5/80/50', '制造业', '陈经理', '13800138005', '供应商', '2023-06-15', '全球领先的压缩机、空压机制造商，售后服务合作伙伴', 1, '2023-06-15 11:00:00', '2023-06-15 11:00:00'),
('大族激光科技', 'https://picsum.photos/seed/logo6/80/50', '制造业', '林工', '13800138006', '供应商', '2023-09-01', '激光切割设备制造商，设备维保服务合作商', 1, '2023-09-01 14:00:00', '2023-09-01 14:00:00'),
('顺丰物流产业园', 'https://picsum.photos/seed/logo7/80/50', '物流业', '周主管', '13800138007', '客户', '2023-04-01', '大型物流企业，叉车及物流设备维修保养客户', 1, '2023-04-01 09:00:00', '2023-04-01 09:00:00'),
('国家能源集团', 'https://picsum.photos/seed/logo8/80/50', '能源业', '吴经理', '13800138008', '客户', '2022-12-01', '大型能源企业，发电机组维修改造项目合作', 1, '2022-12-01 10:00:00', '2022-12-01 10:00:00');

SET FOREIGN_KEY_CHECKS = 1;