<?php
/**
 * Phase 7: 备件库存管理 API 测试脚本
 *
 * 测试范围:
 * 1. 创建配件
 * 2. 获取配件列表
 * 3. 获取配件详情
 * 4. 更新配件
 * 5. 配件入库
 * 6. 配件出库
 * 7. 获取库存预警
 * 8. 获取库存记录
 * 9. 获取统计数据
 * 10. 删除配件
 */

$baseUrl = 'http://localhost/api';
$token = null;
$testPartId = null;

echo "=== Phase 7: 备件库存管理 API 测试 ===\n\n";

// 1. 登录获取Token
echo "1. 登录获取Token...\n";
$loginData = json_encode([
    'username' => 'admin',
    'password' => 'admin123'
]);

$ch = curl_init("$baseUrl/auth/login");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $loginData);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['token'])) {
    $token = $result['data']['token'];
    echo "✓ 登录成功，Token: " . substr($token, 0, 20) . "...\n\n";
} else {
    echo "✗ 登录失败: $response\n";
    exit(1);
}

$authHeader = ["Authorization: Bearer $token"];

// 2. 创建配件
echo "2. 创建配件...\n";
$partData = json_encode([
    'part_code' => 'PART001',
    'part_name' => '空气滤芯',
    'category_id' => 1,
    'specification' => 'AF-1234',
    'unit' => '个',
    'purchase_price' => 50.00,
    'sale_price' => 80.00,
    'stock_quantity' => 100,
    'min_stock' => 20
]);

$ch = curl_init("$baseUrl/parts");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $partData);
curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($authHeader, ['Content-Type: application/json']));

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['id'])) {
    $testPartId = $result['data']['id'];
    echo "✓ 配件创建成功，ID: $testPartId\n\n";
} else {
    echo "✗ 配件创建失败: $response\n";
    exit(1);
}

// 3. 获取配件列表
echo "3. 获取配件列表...\n";
$ch = curl_init("$baseUrl/parts?page=1&limit=10");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['list'])) {
    echo "✓ 获取列表成功，共 {$result['data']['total']} 条记录\n\n";
} else {
    echo "✗ 获取列表失败: $response\n";
}

// 4. 获取配件详情
echo "4. 获取配件详情...\n";
$ch = curl_init("$baseUrl/parts/$testPartId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['id'])) {
    echo "✓ 获取详情成功，配件名称: {$result['data']['part_name']}\n\n";
} else {
    echo "✗ 获取详情失败: $response\n";
}

// 5. 配件入库
echo "5. 配件入库 (50个)...\n";
$stockInData = json_encode([
    'quantity' => 50,
    'remark' => '采购入库'
]);

$ch = curl_init("$baseUrl/parts/$testPartId/in");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $stockInData);
curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($authHeader, ['Content-Type: application/json']));

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['message']) && $result['message'] == '入库成功') {
    echo "✓ 入库成功\n\n";
} else {
    echo "✗ 入库失败: $response\n";
}

// 6. 配件出库
echo "6. 配件出库 (30个)...\n";
$stockOutData = json_encode([
    'quantity' => 30,
    'remark' => '维修领用'
]);

$ch = curl_init("$baseUrl/parts/$testPartId/out");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $stockOutData);
curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($authHeader, ['Content-Type: application/json']));

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['message']) && $result['message'] == '出库成功') {
    echo "✓ 出库成功\n\n";
} else {
    echo "✗ 出库失败: $response\n";
}

// 7. 获取库存预警
echo "7. 获取库存预警...\n";
$ch = curl_init("$baseUrl/parts/alerts");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['total'])) {
    echo "✓ 获取预警成功，预警数量: {$result['data']['total']}\n\n";
} else {
    echo "✗ 获取预警失败: $response\n";
}

// 8. 获取库存记录
echo "8. 获取库存记录...\n";
$ch = curl_init("$baseUrl/parts/records?page=1&limit=10");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['list'])) {
    echo "✓ 获取库存记录成功，共 {$result['data']['total']} 条记录\n\n";
} else {
    echo "✗ 获取库存记录失败: $response\n";
}

// 9. 获取统计数据
echo "9. 获取统计数据...\n";
$ch = curl_init("$baseUrl/parts/statistics");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['total_parts'])) {
    echo "✓ 获取统计成功\n";
    echo "  - 总配件数: {$result['data']['total_parts']}\n";
    echo "  - 总库存: {$result['data']['total_stock']}\n";
    echo "  - 总价值: {$result['data']['total_value']}\n";
    echo "  - 预警数: {$result['data']['alert_count']}\n\n";
} else {
    echo "✗ 获取统计失败: $response\n";
}

// 10. 更新配件
echo "10. 更新配件...\n";
$updateData = json_encode([
    'part_name' => '空气滤芯 (升级版)',
    'sale_price' => 90.00
]);

$ch = curl_init("$baseUrl/parts/$testPartId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, $updateData);
curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($authHeader, ['Content-Type: application/json']));

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['message']) && $result['message'] == '配件更新成功') {
    echo "✓ 更新成功\n\n";
} else {
    echo "✗ 更新失败: $response\n";
}

// 11. 删除测试前先将库存清零（因为删除需要库存为0）
echo "11. 删除配件 (先清零库存)...\n";

// 先出库所有库存
$ch = curl_init("$baseUrl/parts/$testPartId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);
$response = curl_exec($ch);
$partData = json_decode($response, true);
$currentStock = $partData['data']['stock_quantity'] ?? 0;

if ($currentStock > 0) {
    $stockOutData = json_encode([
        'quantity' => $currentStock,
        'remark' => '盘点清零'
    ]);

    $ch = curl_init("$baseUrl/parts/$testPartId/out");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $stockOutData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($authHeader, ['Content-Type: application/json']));
    curl_exec($ch);
}

// 删除配件
$ch = curl_init("$baseUrl/parts/$testPartId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['message']) && $result['message'] == '配件删除成功') {
    echo "✓ 删除成功\n\n";
} else {
    echo "✗ 删除失败: $response\n";
}

echo "=== Phase 7 测试完成 ===\n";
