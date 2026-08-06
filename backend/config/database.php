<?php

// +----------------------------------------------------------------------
// | 数据库设置
// +----------------------------------------------------------------------

return [
    // 默认数据库连接
    'default' => env('database.type', 'mysql'),

    // 数据库连接配置信息
    'connections' => [
        'mysql' => [
            // 数据库类型
            'type' => env('database.type', 'mysql'),
            // 服务器地址
            'hostname' => env('database.hostname', '127.0.0.1'),
            // 数据库名
            'database' => env('database.database', 'cmms_db'),
            // 用户名
            'username' => env('database.username', 'root'),
            // 密码
            'password' => env('database.password', ''),
            // 端口
            'hostport' => env('database.hostport', '3306'),
            // 数据库连接参数
            'params' => [
                \PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci',
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_EMULATE_PREPARES => false,
            ],
            // 数据库编码默认采用 utf8
            'charset' => env('database.charset', 'utf8mb4'),
            // 数据库表前缀
            'prefix' => env('database.prefix', ''),
            // 数据库部署方式:0 集中式 (单一服务器),1 分散式 (主从服务器)
            'deploy' => 0,
            // 数据库读写是否分离 主从式有效
            'rw_separate' => false,
            // 读写分离后 主服务器数量
            'master_num' => 1,
            // 指定从服务器序号
            'slave_no' => '',
            // 模型写入后自动读取主服务器
            'read_master' => false,
            // 是否严格检查字段是否存在
            'fields_strict' => true,
            // 是否需要断线重连
            'break_reconnect' => true,
            // 监听 SQL
            'trigger_sql' => env('app_debug', true),
            // 开启字段缓存
            'fields_cache' => false,
        ],
        // 电子维修 2.0 repair 数据库连接 (小程序订单使用)
        'repair' => [
            'type' => env('repair_db.type', 'mysql'),
            'hostname' => env('repair_db.hostname', '127.0.0.1'),
            'database' => env('repair_db.database', 'repair'),
            'username' => env('repair_db.username', 'root'),
            'password' => env('repair_db.password', ''),
            'hostport' => env('repair_db.hostport', '3306'),
            'params' => [
                \PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci'
            ],
            'charset' => env('repair_db.charset', 'utf8mb4'),
            'prefix' => env('repair_db.prefix', ''),
            'deploy' => 0,
            'rw_separate' => false,
            'master_num' => 1,
            'slave_no' => '',
            'read_master' => false,
            'fields_strict' => false,  // 关闭严格检查，允许查询不存在的字段
            'break_reconnect' => true,
            'trigger_sql' => env('app_debug', true),
            'fields_cache' => false,
        ],
    ],
];
