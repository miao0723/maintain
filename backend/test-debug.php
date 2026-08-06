<?php
// 简单的测试脚本
require __DIR__ . '/vendor/autoload.php';

// 设置环境
$_SERVER['REQUEST_METHOD'] = 'POST';
$_POST['username'] = 'admin';
$_POST['password'] = 'admin123';

// 模拟请求
try {
    $config = require __DIR__ . '/config/app.php';
    var_dump($config);
    echo "\n=== Environment check ===\n";
    echo "APP_DEBUG: " . (getenv('APP_DEBUG') ?: 'not set') . "\n";
    echo "Database config loaded: " . (file_exists(__DIR__ . '/config/database.php') ? 'yes' : 'no') . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}
