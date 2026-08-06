<?php
/**
 * 测试Milvus插入操作
 */

echo "=== Milvus插入测试 ===\n\n";

// 配置
$host = env('MILVUS_HOST', 'localhost');
$port = env('MILVUS_PORT', '19530');
$baseUrl = "http://{$host}:{$port}";

echo "1. 列出现有集合...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "{$baseUrl}/v2/vectordb/collections/list");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, '{}');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP {$httpCode}\n";
$data = json_decode($response, true);
print_r($data);

if (isset($data['data'][0]['value']) && count($data['data'][0]['value']) > 0) {
    $collectionName = $data['data'][0]['value'][0];
    echo "\n使用集合: {$[collectionName}\n";

    // 测试插入
    echo "\n2. 测试插入向量数据...\n";

    $testVector = [];
    for ($i = 0; $i < 1024; $i++) {
        $testVector[] = rand(-100, 100) / 100;
    }

    $payload = [
        'collectionName' => $collectionName,
        'data' => [
            [
                'vector' => $testVector,
                'chunk_id' => 999999,
                'collection_id' => 999999,
            ]
        ]
    ];

    echo "发送数据...\n";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "{$baseUrl}/v2/vectordb/entities/insert");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "HTTP {$httpCode}\n";
    echo "响应:\n";
    print_r(json_decode($response, true));
} else {
    echo "\n没有可用的集合，请先创建一个知识库集合\n";
}

echo "\n=== 测试完成 ===\n";
