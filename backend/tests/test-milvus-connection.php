<?php
/**
 * Milvus连接测试脚本
 */

require __DIR__ . '/../vendor/autoload.php';

echo "=== Milvus连接测试 ===\n\n";

// 测试配置
$milvusUri = getenv('MILVUS_URI');
$milvusHost = getenv('MILVUS_HOST');
$milvusPort = getenv('MILVUS_PORT');
$dashscopeApiKey = getenv('DASHSCOPE_API_KEY');

echo "配置信息:\n";
echo "  MILVUS_URI: " . ($milvusUri ?: '未设置') . "\n";
echo "  MILVUS_HOST: " . ($milvusHost ?: '未设置') . "\n";
echo "  MILVUS_PORT: " . ($milvusPort ?: '未设置') . "\n";
echo "  DASHSCOPE_API_KEY: " . ($dashscopeApiKey ? '已设置 (' . substr($dashscopeApiKey, 0, 8) . '...)' : '未设置') . "\n\n";

// 确定 Milvus URL
$milvusUrl = $milvusUri ?: "http://{$milvusHost}:{$milvusPort}";
echo "连接到: {$milvusUrl}\n\n";

// 测试1: 检查Milvus连接
echo "测试1: 检查Milvus连接...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $milvusUrl . '/v1/health');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "  ❌ 连接失败: {$error}\n";
} elseif ($httpCode === 200) {
    echo "  ✅ 连接成功\n";
    echo "  响应: {$response}\n";
} else {
    echo "  ⚠️  HTTP状态码: {$httpCode}\n";
}

// 测试2: 检查集合列表
echo "\n测试2: 获取集合列表...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $milvusUrl . '/v1/collections');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    if (isset($data['code']) && $data['code'] === 0) {
        echo "  ✅ 获取成功\n";
        $collections = $data['data'] ?? [];
        echo "  集合数量: " . count($collections) . "\n";
        if (!empty($collections)) {
            echo "  集合列表:\n";
            foreach ($collections as $collection) {
                echo "    - {$collection['name']} (维度: {$collection['dimension']})\n";
            }
        }
    } else {
        echo "  ❌ 错误: " . ($data['message'] ?? '未知错误') . "\n";
    }
} else {
    echo "  ❌ HTTP状态码: {$httpCode}\n";
}

// 测试3: 测试DashScope嵌入API
echo "\n测试3: 测试DashScope嵌入API...\n";
if (empty($dashscopeApiKey)) {
    echo "  ⚠️  未配置DASHSCOPE_API_KEY\n";
} else {
    $text = "这是一段测试文本，用于验证嵌入API是否正常工作。";

    $payload = [
        'model' => 'text-embedding-v2',
        'input' => [
            'texts' => [$text],
            'type' => 'document'
        ]
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding-v2');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $dashscopeApiKey,
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $data = json_decode($response, true);
        if (isset($data['output']['embeddings'][0]['embedding'])) {
            $embedding = $data['output']['embeddings']['embedding'];
            echo "  ✅ 嵌入成功\n";
            echo "  向量维度: " . count($embedding) . "\n";
        } else {
            echo "  ❌ 响应格式错误\n";
        }
    } else {
        echo "  ❌ HTTP状态码: {$httpCode}\n";
        echo "  错误响应: {$response}\n";
    }
}

echo "\n=== 测试完成 ===\n";
