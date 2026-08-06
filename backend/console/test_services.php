<?php
/**
 * 测试服务连接
 */

require __DIR__ . '/../vendor/autoload.php';
use think\facade\App;

App::initialize();

echo "=== 服务连接测试 ===\n\n";

// 测试Milvus
echo "1. 测试Milvus服务 (localhost:19530)...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:19530/v2/health');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✓ Milvus服务可用\n";
    echo "  响应: " . substr($response, 0, 100) . "\n\n";
} else {
    echo "✗ Milvus服务不可用 (HTTP {$httpCode})\n\n";
}

// 尝试列出Milvus集合
echo "2. 尝试列出Milvus集合...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:19530/v2/vectordb/collections/list');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, '{}');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✓ 列出集合成功\n";
    $data = json_decode($response, true);
    echo "  集合数量: " . ($data['data'][0]['count'] ?? '未知') . "\n\n";
} else {
    echo "✗ 列出集合失败 (HTTP {$httpCode})\n";
    echo "  响应: " . substr($response, 0, 100) . "\n\n";
}

// 测试Redis
echo "3. 测试Redis服务 (localhost:6379)...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:6379');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 2);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Redis测试: " . ($httpCode ? "HTTP {$httpCode}" : "无响应") . "\n\n";

// 测试嵌入服务
echo "4. 测试嵌入服务 (localhost:8080)...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8080/health');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo "✓ 嵌入服务可用\n";
    echo "  响应: " . substr($response, 0, 200) . "\n\n";
} else {
    echo "✗ 嵌入服务不可用 (HTTP {$httpCode})\n";
    echo "  需要启动嵌入服务\n\n";
}

echo "=== 测试完成 ===\n";
