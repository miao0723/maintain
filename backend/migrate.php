<?php

require __DIR__ . '/vendor/autoload.php';

// Database configuration
$host = 'mysql';
$port = 3306;
$dbname = 'cmms_db';
$username = 'cmms_user';
$password = 'cmms_pass';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Connected to database successfully\n\n";

    // Get all migration files
    $migrationDir = __DIR__ . '/database/migrations/';
    $migrations = glob($migrationDir . '*.php');
    sort($migrations);

    echo "Found " . count($migrations) . " migration files\n\n";

    // Migrations use Phinx, so we'll create tables directly below
    echo "Creating tables directly...\n\n";

    // Create departments table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `departments` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '部门ID',
        `name` varchar(100) NOT NULL COMMENT '部门名称',
        `parent_id` int(11) unsigned DEFAULT NULL COMMENT '父部门ID',
        `manager_id` int(11) unsigned DEFAULT NULL COMMENT '负责人ID',
        `sort_order` int(11) NOT NULL DEFAULT '0' COMMENT '排序',
        `status` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '状态:1正常 0禁用',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (`id`),
        KEY `idx_parent` (`parent_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表'");
    echo "Created departments table\n";

    // Create users table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `users` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
        `username` varchar(50) NOT NULL COMMENT '用户名',
        `password` varchar(255) NOT NULL COMMENT '密码',
        `real_name` varchar(50) DEFAULT NULL COMMENT '真实姓名',
        `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
        `phone` varchar(20) DEFAULT NULL COMMENT '电话',
        `department_id` int(11) unsigned DEFAULT NULL COMMENT '部门ID',
        `position` varchar(100) DEFAULT NULL COMMENT '职位',
        `status` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '状态:1正常 0禁用',
        `last_login_at` datetime DEFAULT NULL COMMENT '最后登录时间',
        `last_login_ip` varchar(45) DEFAULT NULL COMMENT '最后登录IP',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (`id`),
        UNIQUE KEY `uk_username` (`username`),
        KEY `idx_department` (`department_id`),
        KEY `idx_status` (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表'");
    echo "Created users table\n";

    // Create permissions table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `permissions` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '权限ID',
        `user_id` int(11) unsigned NOT NULL COMMENT '用户ID',
        `module` varchar(50) NOT NULL COMMENT '模块名称',
        `actions` json NOT NULL COMMENT '权限操作',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (`id`),
        KEY `idx_user_module` (`user_id`, `module`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表'");
    echo "Created permissions table\n";

    // Create device_categories table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `device_categories` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '分类ID',
        `name` varchar(50) NOT NULL COMMENT '分类名称',
        `description` varchar(255) DEFAULT NULL COMMENT '分类描述',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (`id`),
        UNIQUE KEY `uk_name` (`name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备分类表'");
    echo "Created device_categories table\n";

    // Create devices table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `devices` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '设备ID',
        `name` varchar(100) NOT NULL COMMENT '设备名称',
        `code` varchar(50) NOT NULL COMMENT '设备编号',
        `category_id` int(11) unsigned NOT NULL COMMENT '设备分类ID',
        `department_id` int(11) unsigned NOT NULL COMMENT '所属部门ID',
        `specification` varchar(255) DEFAULT NULL COMMENT '规格型号',
        `manufacturer` varchar(100) DEFAULT NULL COMMENT '制造商',
        `purchase_date` date DEFAULT NULL COMMENT '购买日期',
        `warranty_expiry` date DEFAULT NULL COMMENT '保修截止日期',
        `status` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '状态:1正常 2维修 3报废',
        `location` varchar(255) DEFAULT NULL COMMENT '存放位置',
        `responsible_person` varchar(50) DEFAULT NULL COMMENT '责任人',
        `purchase_price` decimal(10,2) DEFAULT NULL COMMENT '购买价格',
        `supplier` varchar(100) DEFAULT NULL COMMENT '供应商',
        `notes` text COMMENT '备注',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (`id`),
        UNIQUE KEY `uk_code` (`code`),
        KEY `idx_category` (`category_id`),
        KEY `idx_department` (`department_id`),
        KEY `idx_status` (`status`),
        KEY `idx_responsible_person` (`responsible_person`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备表'");
    echo "Created devices table\n";

    // Create work_orders table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `work_orders` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '工单ID',
        `order_no` varchar(50) NOT NULL COMMENT '工单号 WO+YYYYMMDD+4位序号',
        `device_id` int(11) unsigned NOT NULL COMMENT '设备ID',
        `reporter_id` int(11) unsigned NOT NULL COMMENT '报修人ID',
        `assigned_to` int(11) unsigned DEFAULT NULL COMMENT '指派维修人ID',
        `fault_type` varchar(100) DEFAULT NULL COMMENT '故障类型',
        `fault_description` text NOT NULL COMMENT '故障描述',
        `priority` tinyint(2) unsigned NOT NULL DEFAULT '2' COMMENT '优先级:1低 2中 3高 4紧急',
        `status` tinyint(2) unsigned NOT NULL DEFAULT '0' COMMENT '状态:0待派单 1已派单 2维修中 3待验收 4已完成 5已关闭',
        `start_time` timestamp NULL DEFAULT NULL COMMENT '开始维修时间',
        `complete_time` timestamp NULL DEFAULT NULL COMMENT '完成时间',
        `repair_record` text COMMENT '维修记录',
        `repair_images` json DEFAULT NULL COMMENT '维修照片[\"url1\",\"url2\"]',
        `used_parts` json DEFAULT NULL COMMENT '使用配件[{\"partId\":1,\"quantity\":2}]',
        `cost_parts` decimal(10,2) unsigned DEFAULT '0.00' COMMENT '配件成本',
        `cost_labor` decimal(10,2) unsigned DEFAULT '0.00' COMMENT '人工成本',
        `total_cost` decimal(10,2) unsigned DEFAULT '0.00' COMMENT '总成本',
        `reporter_rating` tinyint(1) unsigned DEFAULT NULL COMMENT '报修人评分(1-5)',
        `reporter_feedback` text COMMENT '报修人反馈',
        `version` int(11) unsigned NOT NULL DEFAULT '1' COMMENT '版本号(乐观锁)',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (`id`),
        UNIQUE KEY `uk_order_no` (`order_no`),
        KEY `idx_device` (`device_id`),
        KEY `idx_reporter` (`reporter_id`),
        KEY `idx_assigned` (`assigned_to`),
        KEY `idx_status` (`status`),
        KEY `idx_priority` (`priority`),
        KEY `idx_created` (`created_at`),
        KEY `idx_status_priority` (`status`, `priority`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单表'");
    echo "Created work_orders table\n";

    // Create work_order_logs table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `work_order_logs` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '日志ID',
        `order_id` int(11) unsigned NOT NULL COMMENT '工单ID',
        `action` varchar(50) NOT NULL COMMENT '操作类型:created/assigned/accepted/started/completed/verified/closed',
        `operator_id` int(11) unsigned NOT NULL COMMENT '操作人ID',
        `remark` text COMMENT '备注',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
        PRIMARY KEY (`id`),
        KEY `idx_order` (`order_id`),
        KEY `idx_operator` (`operator_id`),
        KEY `idx_action` (`action`),
        KEY `idx_created` (`created_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单日志表'");
    echo "Created work_order_logs table\n";

    // Create engineers table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `engineers` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '工程师ID',
        `user_id` int(11) unsigned NOT NULL COMMENT '用户ID',
        `skill_level` tinyint(2) unsigned NOT NULL DEFAULT '3' COMMENT '技能等级:1初级 2中级 3高级 4专家',
        `specialties` json DEFAULT NULL COMMENT '专长领域[\"电气\",\"机械\",\"空调\"]',
        `work_years` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '工作年限',
        `certification` varchar(200) DEFAULT NULL COMMENT '专业认证',
        `status` tinyint(2) unsigned NOT NULL DEFAULT '1' COMMENT '状态:1在岗 2休假 3离职',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (`id`),
        UNIQUE KEY `uk_user` (`user_id`),
        KEY `idx_skill_level` (`skill_level`),
        KEY `idx_status` (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='维修人员表'");
    echo "Created engineers table\n";

    // Create schedules table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `schedules` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '排班ID',
        `engineer_id` int(11) unsigned NOT NULL COMMENT '工程师ID',
        `work_date` date NOT NULL COMMENT '工作日期',
        `shift_type` varchar(20) NOT NULL COMMENT '班次类型:morning/afternoon/night',
        `status` tinyint(2) unsigned NOT NULL DEFAULT '1' COMMENT '状态:1正常 2请假',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (`id`),
        UNIQUE KEY `uk_engineer_date` (`engineer_id`, `work_date`),
        KEY `idx_date` (`work_date`),
        KEY `idx_engineer` (`engineer_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='排班表'");
    echo "Created schedules table\n";

    // Create inspection_tasks table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `inspection_tasks` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '任务ID',
        `task_name` varchar(200) NOT NULL COMMENT '任务名称',
        `device_id` int(11) unsigned NOT NULL COMMENT '设备ID',
        `inspector_id` int(11) unsigned NOT NULL COMMENT '巡检员ID',
        `plan_time` date NOT NULL COMMENT '计划日期',
        `actual_time` date DEFAULT NULL COMMENT '实际日期',
        `status` tinyint(2) unsigned NOT NULL DEFAULT '0' COMMENT '状态:0待执行 1进行中 2已完成 3已逾期',
        `result` text COMMENT '巡检结果',
        `images` json DEFAULT NULL COMMENT '照片[\"url1\",\"url2\"]',
        `is_abnormal` tinyint(2) unsigned NOT NULL DEFAULT '0' COMMENT '是否异常:0正常 1异常',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (`id`),
        KEY `idx_device` (`device_id`),
        KEY `idx_inspector` (`inspector_id`),
        KEY `idx_plan_time` (`plan_time`),
        KEY `idx_status` (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='巡检任务表'");
    echo "Created inspection_tasks table\n";

    // Create maintenance_plans table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `maintenance_plans` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '计划ID',
        `plan_name` varchar(200) NOT NULL COMMENT '计划名称',
        `device_id` int(11) unsigned NOT NULL COMMENT '设备ID',
        `type` tinyint(2) unsigned NOT NULL COMMENT '类型:1预防性 2计划性',
        `cycle_type` varchar(20) NOT NULL COMMENT '周期类型:day/week/month/year',
        `cycle_value` int(11) unsigned NOT NULL COMMENT '周期值',
        `next_execute_time` date NOT NULL COMMENT '下次执行时间',
        `executor_id` int(11) unsigned NOT NULL COMMENT '执行人ID',
        `status` tinyint(2) unsigned NOT NULL DEFAULT '1' COMMENT '状态:1启用 0停用',
        `last_execute_time` date DEFAULT NULL COMMENT '上次执行时间',
        `description` text COMMENT '保养内容描述',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (`id`),
        KEY `idx_device` (`device_id`),
        KEY `idx_executor` (`executor_id`),
        KEY `idx_next_time` (`next_execute_time`),
        KEY `idx_status` (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='保养计划表'");
    echo "Created maintenance_plans table\n";

    // Create maintenance_records table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `maintenance_records` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录ID',
        `plan_id` int(11) unsigned NOT NULL COMMENT '计划ID',
        `device_id` int(11) unsigned NOT NULL COMMENT '设备ID',
        `executor_id` int(11) unsigned NOT NULL COMMENT '执行人ID',
        `execute_time` date NOT NULL COMMENT '执行日期',
        `content` text COMMENT '保养内容',
        `images` json DEFAULT NULL COMMENT '照片',
        `cost` decimal(10,2) unsigned DEFAULT '0.00' COMMENT '费用',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (`id`),
        KEY `idx_plan` (`plan_id`),
        KEY `idx_device` (`device_id`),
        KEY `idx_executor` (`executor_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='保养记录表'");
    echo "Created maintenance_records table\n";

    // Create spare_parts table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `spare_parts` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '配件ID',
        `part_code` varchar(50) NOT NULL COMMENT '配件编号',
        `part_name` varchar(200) NOT NULL COMMENT '配件名称',
        `category_id` int(11) unsigned NOT NULL COMMENT '分类ID',
        `specification` varchar(200) DEFAULT NULL COMMENT '规格型号',
        `unit` varchar(20) DEFAULT NULL COMMENT '单位',
        `supplier_id` int(11) unsigned DEFAULT NULL COMMENT '供应商ID',
        `purchase_price` decimal(10,2) unsigned DEFAULT '0.00' COMMENT '进货价',
        `sale_price` decimal(10,2) unsigned DEFAULT '0.00' COMMENT '销售价',
        `stock_quantity` int(11) NOT NULL DEFAULT '0' COMMENT '库存数量',
        `min_stock` int(11) NOT NULL DEFAULT '0' COMMENT '最低库存预警',
        `warehouse_id` int(11) unsigned DEFAULT NULL COMMENT '仓库ID',
        `status` tinyint(2) unsigned NOT NULL DEFAULT '1' COMMENT '状态:1正常 0停用',
        `description` text COMMENT '描述',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (`id`),
        UNIQUE KEY `uk_code` (`part_code`),
        KEY `idx_category` (`category_id`),
        KEY `idx_supplier` (`supplier_id`),
        KEY `idx_status` (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配件表'");
    echo "Created spare_parts table\n";

    // Create stock_records table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `stock_records` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录ID',
        `part_id` int(11) unsigned NOT NULL COMMENT '配件ID',
        `type` tinyint(2) unsigned NOT NULL COMMENT '类型:1入库 2出库 3盘点',
        `quantity` int(11) NOT NULL COMMENT '数量',
        `before_quantity` int(11) unsigned NOT NULL COMMENT '变更前数量',
        `after_quantity` int(11) unsigned NOT NULL COMMENT '变更后数量',
        `order_id` int(11) unsigned DEFAULT NULL COMMENT '关联工单ID',
        `operator_id` int(11) unsigned NOT NULL COMMENT '操作人ID',
        `remark` varchar(500) DEFAULT NULL COMMENT '备注',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (`id`),
        KEY `idx_part` (`part_id`),
        KEY `idx_order` (`order_id`),
        KEY `idx_operator` (`operator_id`),
        KEY `idx_created` (`created_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存记录表'");
    echo "Created stock_records table\n";

    // Create suppliers table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `suppliers` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '供应商ID',
        `name` varchar(100) NOT NULL COMMENT '供应商名称',
        `code` varchar(50) NOT NULL COMMENT '供应商编码',
        `contact_person` varchar(50) DEFAULT NULL COMMENT '联系人',
        `contact_phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
        `contact_email` varchar(100) DEFAULT NULL COMMENT '联系邮箱',
        `address` varchar(255) DEFAULT NULL COMMENT '地址',
        `status` tinyint(2) unsigned NOT NULL DEFAULT '1' COMMENT '状态:1正常 0停用',
        `description` text COMMENT '描述',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (`id`),
        UNIQUE KEY `uk_code` (`code`),
        KEY `idx_status` (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='供应商表'");
    echo "Created suppliers table\n";

    // Create knowledge_base table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `knowledge_base` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '知识ID',
        `title` varchar(200) NOT NULL COMMENT '知识标题',
        `fault_symptom` varchar(1000) NOT NULL COMMENT '故障现象',
        `fault_cause` varchar(1000) NOT NULL COMMENT '故障原因',
        `solution` text NOT NULL COMMENT '解决方案',
        `category_id` int(11) unsigned DEFAULT NULL COMMENT '设备分类ID',
        `device_id` int(11) unsigned DEFAULT NULL COMMENT '设备ID',
        `related_part_ids` json DEFAULT NULL COMMENT '关联配件IDs',
        `tags` json DEFAULT NULL COMMENT '标签',
        `difficulty_level` tinyint(2) unsigned NOT NULL DEFAULT '2' COMMENT '难度等级:1简单 2中等 3困难',
        `usage_count` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '使用次数',
        `status` tinyint(2) unsigned NOT NULL DEFAULT '0' COMMENT '状态:0草稿 1已发布 2已归档',
        `created_by` int(11) unsigned NOT NULL COMMENT '创建人ID',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (`id`),
        KEY `idx_category` (`category_id`),
        KEY `idx_device` (`device_id`),
        KEY `idx_status` (`status`),
        KEY `idx_difficulty` (`difficulty_level`),
        KEY `idx_usage` (`usage_count`),
        KEY `idx_created_by` (`created_by`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='故障知识库表'");
    echo "Created knowledge_base table\n";

    // Create notifications table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `notifications` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '通知ID',
        `user_id` int(11) unsigned NOT NULL COMMENT '用户ID',
        `type` varchar(50) NOT NULL COMMENT '通知类型',
        `title` varchar(200) NOT NULL COMMENT '通知标题',
        `content` text NOT NULL COMMENT '通知内容',
        `related_type` varchar(50) DEFAULT NULL COMMENT '关联类型(work_order,spare_part等)',
        `related_id` int(11) unsigned DEFAULT NULL COMMENT '关联ID',
        `priority` tinyint(2) unsigned NOT NULL DEFAULT '2' COMMENT '优先级:1低 2普通 3高 4紧急',
        `is_read` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否已读:0未读 1已读',
        `read_at` datetime DEFAULT NULL COMMENT '阅读时间',
        `extra_data` json DEFAULT NULL COMMENT '额外数据',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (`id`),
        KEY `idx_user` (`user_id`),
        KEY `idx_type` (`type`),
        KEY `idx_read` (`is_read`),
        KEY `idx_priority` (`priority`),
        KEY `idx_related` (`related_type`,`related_id`),
        KEY `idx_created` (`created_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表'");
    echo "Created notifications table\n";

    // Create agreements table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `agreements` (
        `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
        `title` varchar(200) NOT NULL COMMENT '协议标题',
        `code` varchar(50) NOT NULL COMMENT '协议编码',
        `content` text COMMENT '协议内容 (HTML)',
        `version` varchar(20) DEFAULT '1.0' COMMENT '版本号',
        `status` tinyint(1) DEFAULT 1 COMMENT '状态：1 启用 0 禁用',
        `effective_date` date DEFAULT NULL COMMENT '生效日期',
        `remark` text COMMENT '备注',
        `created_by` int(11) DEFAULT NULL COMMENT '创建人 ID',
        `updated_by` int(11) DEFAULT NULL COMMENT '更新人 ID',
        `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (`id`),
        UNIQUE KEY `uk_code` (`code`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='免责协议表'");
    echo "Created agreements table\n";

    $pdo->exec("INSERT INTO `agreements` (`title`, `code`, `content`, `version`, `status`, `effective_date`, `remark`)
        VALUES ('设备维修服务免责协议', 'repair_disclaimer',
        '<h2>设备维修服务免责协议</h2><h3>一、服务范围</h3><p>1. 本协议适用于本公司提供的所有设备维修服务。</p><p>2. 服务范围包括但不限于故障诊断、维修、保养、更换配件等。</p><h3>二、免责条款</h3><p>1. 因不可抗力因素（如自然灾害、战争、政府行为等）导致的设备损坏，本公司不承担责任。</p><p>2. 客户未按设备使用说明书操作导致的损坏，本公司不承担责任。</p><p>3. 维修过程中因设备自身老化、磨损等原因导致的二次损坏，本公司不承担责任。</p><h3>三、维修保证</h3><p>1. 本公司对维修部位提供 30 天的质量保证期。</p><p>2. 质量保证期内，因维修质量问题导致的故障，本公司免费重新维修。</p><h3>四、其他</h3><p>1. 本协议自客户签字确认之日起生效。</p><p>2. 本协议的最终解释权归本公司所有。</p>',
        '1.0', 1, '2024-01-01', '设备维修服务标准免责协议')
        ON DUPLICATE KEY UPDATE title=VALUES(title)");

    echo "\n=== All migrations completed successfully ===\n";

    // Show created tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "\nCreated tables:\n";
    foreach ($tables as $table) {
        echo "  - $table\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
