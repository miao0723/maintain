<?php
/**
 * CMMS API 诊断测试脚本
 * 访问: http://localhost/diagnose.php
 */

// 设置错误报告
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "<h2>🔍 CMMS API 诊断测试</h2>";
echo "<pre>";

// 1. 测试基本PHP功能
echo "\n=== 1. PHP 基本测试 ===\n";
echo "PHP版本: " . PHP_VERSION . "\n";
echo "当前目录: " . getcwd() . "\n";
echo "文档根目录: " . $_SERVER['DOCUMENT_ROOT'] . "\n";

// 2. 检查关键文件
echo "\n=== 2. 检查关键文件 ===\n";
$files = [
    '../vendor/autoload.php',
    '../app/controller/AuthController.php',
    '../config/app.php',
    '../config/database.php',
    '../.env',
];

foreach ($files as $file) {
    $exists = file_exists($file) ? '✅' : '❌';
    echo "$exists $file\n";
}

// 3. 测试Composer自动加载
echo "\n=== 3. 测试Composer自动加载 ===\n";
try {
    require '../vendor/autoload.php';
    echo "✅ Composer autoload 加载成功\n";
} catch (Exception $e) {
    echo "❌ Composer autoload 失败: " . $e->getMessage() . "\n";
}

// 4. 测试ThinkPHP
echo "\n=== 4. 测试ThinkPHP ===\n";
try {
    $app = new think\App();
    echo "✅ ThinkPHP App 创建成功\n";
    echo "应用目录: " . $app->getAppPath() . "\n";
} catch (Throwable $e) {
    echo "❌ ThinkPHP 失败: " . $e->getMessage() . "\n";
    echo "文件: " . $e->getFile() . " 行: " . $e->getLine() . "\n";
}

// 5. 测试数据库连接
echo "\n=== 5. 测试数据库连接 ===\n";
try {
    $config = require '../config/database.php';
    echo "数据库类型: " . $config['default'] . "\n";
    echo "主机: " . $config['connections']['mysql']['hostname'] . "\n";
    echo "数据库: " . $config['connections']['mysql']['database'] . "\n";
    echo "用户名: " . $config['connections']['mysql']['username'] . "\n";

    $db = think\facade\Db::connect();
    $result = $db->query('SELECT 1 as test');
    echo "✅ 数据库连接成功\n";
    print_r($result);
} catch (Throwable $e) {
    echo "❌ 数据库连接失败: " . $e->getMessage() . "\n";
    echo "文件: " . $e->getFile() . " 行: " . $e->getLine() . "\n";
}

// 6. 测试User模型
echo "\n=== 6. 测试User模型 ===\n";
try {
    $user = \app\model\User::find(1);
    if ($user) {
        echo "✅ User模型查询成功\n";
        echo "用户ID: " . $user->id . "\n";
        echo "用户名: " . $user->username . "\n";
    } else {
        echo "⚠️  用户不存在\n";
    }
} catch (Throwable $e) {
    echo "❌ User模型失败: " . $e->getMessage() . "\n";
    echo "文件: " . $e->getFile() . " 行: " . $e->getLine() . "\n";
}

// 7. 测试JWT服务
echo "\n=== 7. 测试JWT服务 ===\n";
try {
    $token = \app\service\JwtService::createAccessToken(1, 'admin');
    echo "✅ JWT Token 创建成功\n";
    echo "Token: " . substr($token, 0, 50) . "...\n";
} catch (Throwable $e) {
    echo "❌ JWT 失败: " . $e->getMessage() . "\n";
    echo "文件: " . $e->getFile() . " 行: " . $e->getLine() . "\n";
}

// 8. 测试AuthController实例化
echo "\n=== 8. 测试AuthController ===\n";
try {
    $controller = new \app\controller\AuthController();
    echo "✅ AuthController 实例化成功\n";
} catch (Throwable $e) {
    echo "❌ AuthController 失败: " . $e->getMessage() . "\n";
    echo "文件: " . $e->getFile() . " 行: " . $e->getLine() . "\n";
}

echo "\n=== 诊断测试完成 ===\n";
echo "</pre>";
?>
