<?php
/**
 * Phase 8: 供应商管理 API 测试脚本
 *
 * 测试范围:
 * 1. 创建供应商
 * 2. 获取供应商列表
 * 3. 获取供应商详情
 * 4. 更新供应商
 * 5. 获取供应商的配件列表
 * 6. 获取统计数据
 * 7. 删除供应商
 */

$baseUrl = 'http://localhost/api';
$token = null;
$testSupplierId = null;

echo "=== Phase 8: 供应商管理 API 测试 ===\n\n";

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

// 2. 创建供应商
echo "2. 创建供应商...\n";
$supplierData = json_encode([
    'name' => '上海机械配件有限公司',
    'code' => 'SUP001',
    'contact_person' => '张三',
    'contact_phone' => '13800138000',
    'contact_email' => 'zhangsan@example.com',
    'address' => '上海市浦东新区'
]);

$ch = curl_init("$baseUrl/suppliers");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $supplierData);
curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($authHeader, ['Content-Type: application/json']));

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['id'])) {
    $testSupplierId = $result['data']['id'];
    echo "✓ 供应商创建成功，ID: $testSupplierId\n\n";
} else {
    echo "✗ 供应商创建失败: $response\n";
    exit(1);
}

// 3. 获取供应商列表
echo "3. 获取供应商列表...\n";
$ch = curl_init("$baseUrl/suppliers?page=1&limit=10");
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

// 4. 获取供应商详情
echo "4. 获取供应商详情...\n";
$ch = curl_init("$baseUrl/suppliers/$testSupplierId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['id'])) {
    echo "✓ 获取详情成功，供应商名称: {$result['data']['name']}\n";
    echo "  配件数量: {$result['data']['parts_count']}\n";
    echo "  库存总价值: {$result['data']['total_stock_value']}\n\n";
} else {
    echo "✗ 获取详情失败: $response\n";
}

// 5. 更新供应商
echo "5. 更新供应商...\n";
$updateData = json_encode([
    'contact_person' => '李四',
    'contact_phone' => '13900139000',
    'status' => 1
]);

$ch = curl_init("$baseUrl/suppliers/$testSupplierId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, $updateData);
curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($authHeader, ['Content-Type: application/json']));

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['message']) && $result['message'] == '供应商更新成功') {
    echo "✓ 更新成功\n\n";
} else {
    echo "✗ 更新失败: $response\n";
}

// 6. 获取供应商的配件列表
echo "6. 获取供应商的配件列表...\n";
$ch = curl_init("$baseUrl/suppliers/$testSupplierId/parts?page=1&limit=10");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['list'])) {
    echo "✓ 获取配件列表成功，共 {$result['data']['total']} 条记录\n\n";
} else {
    echo "✗ 获取配件列表失败: $response\n";
}

// 7. 获取统计数据
echo "7. 获取统计数据...\n";
$ch = curl_init("$baseUrl/suppliers/statistics");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['total_suppliers'])) {
    echo "✓ 获取统计成功\n";
    echo "  - 总供应商数: {$result['data']['total_suppliers']}\n";
    echo "  - 正常供应商: {$result['data']['active_suppliers']}\n";
    echo "  - 停用供应商: {$result['data']['inactive_suppliers']}\n";
    echo "  - 有配件的供应商: {$result['data']['suppliers_with_parts']}\n";
    echo "  - 总库存价值: {$result['data']['total_value']}\n\n";
} else {
    echo "✗ 获取统计失败: $response\n";
}

// 8. 删除供应商（如果没有关联配件）
echo "8. 删除供应商...\n";
$ch = curl_init("$baseUrl/suppliers/$testSupplierId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['message']) && $result['message'] == '供应商删除成功') {
    echo "✓ 删除成功\n\n";
} else {
    echo "注: 删除失败（可能有关联配件，这是预期行为）: $response\n\n";
}

echo "=== Phase 8 测试完成 ===\n";
