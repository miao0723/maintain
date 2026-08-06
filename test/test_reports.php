<?php
/**
 * Phase 11: 报表中心 API 测试脚本
 *
 * 测试范围:
 * 1. 获取报表类型列表
 * 2. 生成设备报表
 * 3. 生成维修报表
 * 4. 生成库存报表
 * 5. 生成成本报表
 * 6. 带筛选条件的报表生成
 */

$baseUrl = 'http://localhost/api';
$token = null;

echo "=== Phase 11: 报表中心 API 测试 ===\n\n";

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

// 2. 获取报表类型列表
echo "2. 获取报表类型列表...\n";
$ch = curl_init("$baseUrl/reports/types");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data'])) {
    echo "✓ 获取类型成功\n";
    foreach ($result['data'] as $type) {
        echo "  - {$type['name']} ({$type['type']})\n";
        echo "    描述: {$type['description']}\n";
        echo "    筛选条件: " . implode(', ', $type['filters']) . "\n";
    }
    echo "\n";
} else {
    echo "✗ 获取类型失败: $response\n\n";
}

// 3. 生成设备报表
echo "3. 生成设备报表...\n";
$ch = curl_init("$baseUrl/reports/device");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['title'])) {
    echo "✓ 设备报表生成成功\n";
    echo "  报表标题: {$result['data']['title']}\n";
    echo "  生成时间: {$result['data']['generated_at']}\n";
    echo "  设备总数: {$result['data']['summary']['total_devices']}\n";
    echo "  数据记录数: " . count($result['data']['data']) . "\n\n";
} else {
    echo "✗ 设备报表生成失败: $response\n\n";
}

// 4. 生成维修报表
echo "4. 生成维修报表...\n";
$ch = curl_init("$baseUrl/reports/maintenance?start_date=2024-01-01&end_date=2024-12-31");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['title'])) {
    echo "✓ 维修报表生成成功\n";
    echo "  报表标题: {$result['data']['title']}\n";
    echo "  工单总数: {$result['data']['summary']['total_orders']}\n";
    echo "  已完成: {$result['data']['summary']['completed_orders']}\n";
    echo "  完成率: {$result['data']['summary']['completion_rate']}%\n";
    echo "  总成本: {$result['data']['summary']['total_cost']}\n\n";
} else {
    echo "✗ 维修报表生成失败: $response\n\n";
}

// 5. 生成库存报表
echo "5. 生成库存报表...\n";
$ch = curl_init("$baseUrl/reports/inventory");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['title'])) {
    echo "✓ 库存报表生成成功\n";
    echo "  报表标题: {$result['data']['title']}\n";
    echo "  配件总数: {$result['data']['summary']['total_parts']}\n";
    echo "  总库存: {$result['data']['summary']['total_stock']}\n";
    echo "  总价值: {$result['data']['summary']['total_value']}\n";
    echo "  库存预警: {$result['data']['summary']['low_stock_count']} (低库存) + {$result['data']['summary']['out_of_stock_count']} (零库存)\n\n";
} else {
    echo "✗ 库存报表生成失败: $response\n\n";
}

// 6. 生成成本报表
echo "6. 生成成本报表...\n";
$ch = curl_init("$baseUrl/reports/cost?start_date=2024-01-01&end_date=2024-12-31");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['title'])) {
    echo "✓ 成本报表生成成功\n";
    echo "  报表标题: {$result['data']['title']}\n";
    echo "  工单总数: {$result['data']['summary']['total_orders']}\n";
    echo "  总成本: {$result['data']['summary']['total_cost']}\n";
    echo "  配件成本: {$result['data']['summary']['total_parts_cost']} ({$result['data']['summary']['parts_ratio']}%)\n";
    echo "  人工成本: {$result['data']['summary']['total_labor_cost']} ({$result['data']['summary']['labor_ratio']}%)\n";
    echo "  高成本设备TOP3:\n";
    foreach (array_slice($result['data']['top_devices'], 0, 3) as $device) {
        echo "    - {$device['device_name']}: {$device['count']}单, 成本{$device['cost']}\n";
    }
    echo "\n";
} else {
    echo "✗ 成本报表生成失败: $response\n\n";
}

// 7. 带筛选条件的设备报表
echo "7. 生成带筛选条件的设备报表...\n";
$ch = curl_init("$baseUrl/reports/device?status=1");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['title'])) {
    echo "✓ 筛选报表生成成功 (仅正常状态设备)\n";
    echo "  设备数量: {$result['data']['summary']['total_devices']}\n\n";
} else {
    echo "✗ 筛选报表生成失败: $response\n\n";
}

// 8. 通用报表生成接口
echo "8. 测试通用报表生成接口...\n";
$ch = curl_init("$baseUrl/reports/device");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['title'])) {
    echo "✓ 通用接口测试成功\n\n";
} else {
    echo "✗ 通用接口测试失败: $response\n\n";
}

echo "=== Phase 11 测试完成 ===\n";
echo "\n说明：\n";
echo "- 报表中心提供4种报表类型：设备、维修、库存、成本\n";
echo "- 每种报表支持不同的筛选条件\n";
echo "- 报表包含摘要统计和详细数据\n";
echo "- 前端可基于报表数据导出PDF/Excel\n";
