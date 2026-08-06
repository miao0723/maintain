<?php
require __DIR__ . '/vendor/autoload.php';

$app = new think\App();

// 检查可用的方法
$methods = get_class_methods($app);
echo "=== App类可用方法 ===\n";
echo "有initialize()方法? " . (method_exists($app, 'initialize') ? '是' : '否') . "\n";
echo "有http属性? " . (property_exists($app, 'http') ? '是' : '否') . "\n";

// 打印所有方法
echo "\n所有方法:\n";
foreach ($methods as $method) {
    if (strpos($method, 'init') === 0 || strpos($method, 'run') === 0) {
        echo "  - $method\n";
    }
}
