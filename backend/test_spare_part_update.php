<?php

require_once __DIR__ . '/vendor/autoload.php';

// 设置时区
date_default_timezone_set('Asia/Shanghai');

// 简单的测试脚本
$url = 'http://localhost/api/parts/203';
$data = [
    'part_name' => '测试配件',
    'category_id' => 1,
    'specification' => '测试规格',
    'unit' => '个',
    'min_stock' => 10,
    'status' => 1,
    'description' => '测试描述',
    'image_url' => '/uploads/test/test123.png',
    'sale_price' => '150.00'
];

$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJjbW1zLWFwaSIsImlhdCI6MTc0NTI2NDY4MywiZXhwIjoxNzQ1MzUxMDgzLCJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZV9pZCI6MSwic3RhdHVzIjoxfQ.abc'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data, JSON_UNESCAPED_UNICODE));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: " . $httpCode . "\n";
echo "Response: " . $response . "\n";
