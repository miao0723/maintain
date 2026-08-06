<?php

require __DIR__ . '/vendor/autoload.php';

// 模拟ThinkPHP环境
$_SERVER['REQUEST_METHOD'] = 'GET';

try {
    // 初始化应用
    $app = new think\App();

    // 获取容器
    $container = $app->container;

    // 初始化配置
    $app->initialize();

    echo "应用初始化成功\n";

    // 测试模型
    echo "\n测试 Transfer 模型...\n";

    try {
        $transfer = \app\model\Transfer::order('id', 'desc')->limit(5)->select();
        echo "查询成功，找到 " . count($transfer) . " 条记录\n";

        if (count($transfer) > 0) {
            echo "第一条记录:\n";
            print_r($transfer[0]->toArray());
        }
    } catch (\Exception $e) {
        echo "模型查询失败: " . $e->getMessage() . "\n";
        echo "堆栈跟踪:\n" . $e->getTraceAsString() . "\n";
    }

} catch (\Exception $e) {
    echo "初始化失败: " . $e->getMessage() . "\n";
    echo "堆栈跟踪:\n" . $e->getTraceAsString() . "\n";
}
