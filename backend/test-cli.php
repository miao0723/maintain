<?php
/**
 * CLI 测试脚本 - 测试ThinkPHP和数据库连接
 * 运行: docker exec docker-php-1 sh -c "cd /var/www/html && php test-cli.php"
 */

// 设置错误报告
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "=== CLI 测试脚本 ===\n\n";

// 1. 加载Composer autoload
require __DIR__ . '/vendor/autoload.php';
echo "✅ Composer autoload 加载成功\n";

// 2. 检查helper函数
echo "✅ env() 函数: " . (function_exists('env') ? '可用' : '不可用') . "\n";
echo "✅ config() 函数: " . (function_exists('config') ? '可用' : '不可用') . "\n";

// 3. 初始化ThinkPHP应用
echo "\n=== 初始化ThinkPHP应用 ===\n";
try {
    $app = new think\App();
    echo "✅ ThinkPHP App 创建成功\n";

    // 初始化应用
    $app->initialize();
    echo "✅ 应用初始化成功\n";

    // 运行应用初始化
    $http = $app->http;
    echo "✅ HTTP应用初始化成功\n";

} catch (Throwable $e) {
    echo "❌ 错误: " . $e->getMessage() . "\n";
    echo "文件: " . $e->getFile() . " 行: " . $e->getLine() . "\n";
    exit(1);
}

// 4. 测试数据库连接
echo "\n=== 测试数据库连接 ===\n";
try {
    $db = think\facade\Db::connect();
    $result = $db->query('SELECT 1 as test');
    echo "✅ 数据库连接成功\n";
    print_r($result);
} catch (Throwable $e) {
    echo "❌ 数据库错误: " . $e->getMessage() . "\n";
    echo "文件: " . $e->getFile() . " 行: " . $e->getLine() . "\n";
}

// 5. 测试User模型
echo "\n=== 测试User模型 ===\n";
try {
    $user = \app\model\User::where('username', 'admin')->find();
    if ($user) {
        echo "✅ User模型查询成功\n";
        echo "用户ID: {$user->id}\n";
        echo "用户名: {$user->username}\n";
        echo "真实姓名: {$user->real_name}\n";
    } else {
        echo "⚠️  用户不存在\n";
    }
} catch (Throwable $e) {
    echo "❌ User模型错误: " . $e->getMessage() . "\n";
    echo "文件: " . $e->getFile() . " 行: " . $e->getLine() . "\n";
}

// 6. 测试JWT服务
echo "\n=== 测试JWT服务 ===\n";
try {
    $token = \app\service\JwtService::createAccessToken(1, 'admin');
    echo "✅ JWT Token 创建成功\n";
    echo "Token: " . substr($token, 0, 50) . "...\n";
} catch (Throwable $e) {
    echo "❌ JWT错误: " . $e->getMessage() . "\n";
    echo "文件: " . $e->getFile() . " 行: " . $e->getLine() . "\n";
}

// 7. 测试配置
echo "\n=== 测试配置 ===\n";
echo "数据库类型: " . config('database.default') . "\n";
echo "缓存驱动: " . config('cache.default') . "\n";
echo "JWT密钥: " . substr(config('jwt.secret'), 0, 20) . "...\n";

echo "\n=== 测试完成 ===\n";
