<?php
/**
 * Phase 10: 成本分析 API 测试脚本
 *
 * 测试范围:
 * 1. 总体成本统计
 * 2. 成本趋势分析
 * 3. 设备成本排名
 * 4. 部门成本统计
 * 5. 成本类型分析
 * 6. 配件成本排名
 * 7. 综合成本报告
 */

$baseUrl = 'http://localhost/api';
$token = null;

echo "=== Phase 10: 成本分析 API 测试 ===\n\n";

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

// 2. 总体成本统计
echo "2. 获取总体成本统计...\n";
$ch = curl_init("$baseUrl/costs/overview");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['total_cost'])) {
    echo "✓ 获取统计成功\n";
    echo "  - 总工单数: {$result['data']['total_orders']}\n";
    echo "  - 总成本: {$result['data']['total_cost']}\n";
    echo "  - 配件成本: {$result['data']['parts_cost']} ({$result['data']['parts_ratio']}%)\n";
    echo "  - 人工成本: {$result['data']['labor_cost']} ({$result['data']['labor_ratio']}%)\n";
    echo "  - 平均成本: {$result['data']['avg_cost']}\n\n";
} else {
    echo "✗ 获取统计失败: $response\n\n";
}

// 3. 成本趋势分析（日维度）
echo "3. 获取成本趋势（日维度）...\n";
$ch = curl_init("$baseUrl/costs/trend?dimension=day&limit=10");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['data'])) {
    echo "✓ 获取趋势成功，维度: {$result['data']['dimension']}\n";
    foreach (array_slice($result['data']['data'], 0, 3) as $item) {
        echo "  - {$item['period']}: 工单数={$item['order_count']}, 总成本={$item['total_cost']}\n";
    }
    echo "\n";
} else {
    echo "✗ 获取趋势失败: $response\n\n";
}

// 4. 设备成本排名
echo "4. 获取设备成本排名...\n";
$ch = curl_init("$baseUrl/costs/top-devices?limit=5");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['list'])) {
    echo "✓ 获取排名成功，共 {$result['data']['total']} 台设备\n";
    foreach ($result['data']['list'] as $item) {
        echo "  - {$item['device_name']} ({$item['device_code']})\n";
        echo "    工单数: {$item['order_count']}, 总成本: {$item['total_cost']}\n";
    }
    echo "\n";
} else {
    echo "✗ 获取排名失败: $response\n\n";
}

// 5. 部门成本统计
echo "5. 获取部门成本统计...\n";
$ch = curl_init("$baseUrl/costs/department-stats");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['list'])) {
    echo "✓ 获取统计成功，共 {$result['data']['total']} 个部门\n";
    foreach (array_slice($result['data']['list'], 0, 3) as $item) {
        echo "  - 部门ID: {$item['department_id']}\n";
        echo "    工单数: {$item['order_count']}, 总成本: {$item['total_cost']}\n";
    }
    echo "\n";
} else {
    echo "✗ 获取统计失败: $response\n\n";
}

// 6. 成本类型分析
echo "6. 获取成本类型分析...\n";
$ch = curl_init("$baseUrl/costs/cost-type-analysis");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['cost_distribution'])) {
    echo "✓ 获取分析成功\n";
    echo "  - 配件成本占比: {$result['data']['parts_ratio']}%\n";
    echo "  - 人工成本占比: {$result['data']['labor_ratio']}%\n";
    echo "  - 成本分布:\n";
    foreach ($result['data']['cost_distribution'] as $key => $value) {
        echo "    {$key}: {$value['count']}单 ({$value['ratio']}%)\n";
    }
    echo "\n";
} else {
    echo "✗ 获取分析失败: $response\n\n";
}

// 7. 配件成本排名
echo "7. 获取配件成本排名...\n";
$ch = curl_init("$baseUrl/costs/top-parts?limit=5");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['list'])) {
    echo "✓ 获取排名成功，共 {$result['data']['total']} 个配件\n";
    if (!empty($result['data']['list'])) {
        foreach ($result['data']['list'] as $item) {
            echo "  - {$item['part_name']} ({$item['part_code']})\n";
            echo "    使用次数: {$item['order_count']}, 数量: {$item['quantity']}, 总成本: {$item['total_cost']}\n";
        }
    } else {
        echo "  (暂无数据)\n";
    }
    echo "\n";
} else {
    echo "✗ 获取排名失败: $response\n\n";
}

// 8. 综合成本报告
echo "8. 获取综合成本报告...\n";
$ch = curl_init("$baseUrl/costs/comprehensive");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['overview'])) {
    echo "✓ 获取综合报告成功\n";
    echo "  包含模块: 总览、趋势、设备排名、部门统计、成本类型、配件排名\n\n";
} else {
    echo "✗ 获取报告失败: $response\n\n";
}

// 9. 带日期筛选的查询
echo "9. 测试日期筛选功能...\n";
$ch = curl_init("$baseUrl/costs/overview?start_date=2024-01-01&end_date=2024-12-31");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['total_cost'])) {
    echo "✓ 日期筛选查询成功\n";
    echo "  查询范围: 2024-01-01 至 2024-12-31\n";
    echo "  总成本: {$result['data']['total_cost']}\n\n";
} else {
    echo "注: 日期筛选查询失败（可能无数据）: $response\n\n";
}

echo "=== Phase 10 测试完成 ===\n";
echo "\n说明：成本分析基于已完成或已关闭的工单数据\n";
