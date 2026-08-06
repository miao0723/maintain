<?php
/**
 * Token 验证测试脚本
 */

require __DIR__ . '/vendor/autoload.php';

// 初始化 ThinkPHP
$app = new think\App();
$app->initialize();

echo "=== Token 验证测试 ===\n\n";

// 1. 生成 Token
echo "1. 生成 Token\n";
try {
    $token = \app\service\JwtService::createAccessToken(1, 1);
    echo "✅ Token 生成成功\n";
    echo "Token: " . $token . "\n\n";
} catch (\Throwable $e) {
    echo "❌ Token 生成失败: " . $e->getMessage() . "\n";
    exit(1);
}

// 2. 验证 Token
echo "2. 验证 Token\n";
try {
    $payload = \app\service\JwtService::verifyToken($token);
    echo "✅ Token 验证成功\n";
    echo "Payload 内容:\n";
    print_r($payload);
    echo "\n";

    // 检查 type 字段
    echo "3. 检查 Token 类型\n";
    echo "Type 字段: " . ($payload['type'] ?? 'NOT SET') . "\n";
    echo "期望值: access\n";
    echo "匹配: " . (($payload['type'] ?? '') === 'access' ? '✅ 是' : '❌ 否') . "\n\n";

} catch (\Throwable $e) {
    echo "❌ Token 验证失败: " . $e->getMessage() . "\n";
    echo "文件: " . $e->getFile() . " 行: " . $e->getLine() . "\n";
    echo "\n";
}

// 4. 测试中间件
echo "4. 模拟中间件验证\n";
try {
    // 模拟请求
    $request = think\facade\Request::instance();
    $request->header('Authorization', 'Bearer ' . $token);

    // 模拟中间件
    $middleware = new \app\middleware\JwtAuth();

    echo "Authorization Header: Bearer " . $token . "\n";
    echo "中间件测试: ✅ 准备就绪\n\n";

} catch (\Throwable $e) {
    echo "❌ 中间件错误: " . $e->getMessage() . "\n";
}

echo "=== 测试完成 ===\n";
