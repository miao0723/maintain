<?php
/**
 * Phase 12: 通知功能 API 测试脚本
 *
 * 测试范围:
 * 1. 获取通知列表
 * 2. 获取未读数量
 * 3. 创建通知
 * 4. 批量创建通知
 * 5. 标记已读
 * 6. 删除通知
 * 7. 清空已读
 * 8. 统计信息
 * 9. 库存预警检查
 */

$baseUrl = 'http://localhost/api';
$token = null;
$testNotificationId = null;

echo "=== Phase 12: 通知功能 API 测试 ===\n\n";

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

// 2. 创建通知
echo "2. 创建通知...\n";
$notifyData = json_encode([
    'user_id' => 1,
    'type' => 'system',
    'title' => '系统测试通知',
    'content' => '这是一条测试通知消息',
    'priority' => 2
]);

$ch = curl_init("$baseUrl/notifications/create");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $notifyData);
curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($authHeader, ['Content-Type: application/json']));

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['id'])) {
    $testNotificationId = $result['data']['id'];
    echo "✓ 通知创建成功，ID: $testNotificationId\n\n";
} else {
    echo "✗ 通知创建失败: $response\n\n";
}

// 3. 批量创建通知
echo "3. 批量创建通知...\n";
$batchData = json_encode([
    'user_ids' => [1],
    'type' => 'system',
    'title' => '批量测试通知',
    'content' => '这是一条批量创建的测试通知',
    'priority' => 3
]);

$ch = curl_init("$baseUrl/notifications/create-batch");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $batchData);
curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($authHeader, ['Content-Type: application/json']));

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['count'])) {
    echo "✓ 批量创建成功，创建 {$result['data']['count']} 条通知\n\n";
} else {
    echo "✗ 批量创建失败: $response\n\n";
}

// 4. 获取通知列表
echo "4. 获取通知列表...\n";
$ch = curl_init("$baseUrl/notifications?page=1&limit=10");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['list'])) {
    echo "✓ 获取列表成功，共 {$result['data']['total']} 条通知\n";
    foreach (array_slice($result['data']['list'], 0, 2) as $item) {
        echo "  - {$item['title']}: {$item['content']}\n";
    }
    echo "\n";
} else {
    echo "✗ 获取列表失败: $response\n\n";
}

// 5. 获取未读数量
echo "5. 获取未读通知数量...\n";
$ch = curl_init("$baseUrl/notifications/unread-count");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['count'])) {
    echo "✓ 未读通知数量: {$result['data']['count']}\n\n";
} else {
    echo "✗ 获取未读数量失败: $response\n\n";
}

// 6. 标记单条通知为已读
if ($testNotificationId) {
    echo "6. 标记通知为已读...\n";
    $ch = curl_init("$baseUrl/notifications/mark-read/$testNotificationId");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

    $response = curl_exec($ch);
    curl_close($ch);

    $result = json_decode($response, true);
    if (isset($result['message']) && strpos($result['message'], '成功') !== false) {
        echo "✓ 标记成功\n\n";
    } else {
        echo "注: 标记结果: $response\n\n";
    }
}

// 7. 标记所有通知为已读
echo "7. 标记所有通知为已读...\n";
$ch = curl_init("$baseUrl/notifications/mark-all-read");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['message'])) {
    echo "✓ {$result['message']}\n\n";
} else {
    echo "✗ 操作失败: $response\n\n";
}

// 8. 获取统计信息
echo "8. 获取通知统计信息...\n";
$ch = curl_init("$baseUrl/notifications/statistics");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['total'])) {
    echo "✓ 统计信息:\n";
    echo "  - 总通知: {$result['data']['total']}\n";
    echo "  - 未读: {$result['data']['unread']}\n";
    echo "  - 已读: {$result['data']['read']}\n\n";
} else {
    echo "✗ 获取统计失败: $response\n\n";
}

// 9. 清空已读通知
echo "9. 清空已读通知...\n";
$ch = curl_init("$baseUrl/notifications/clear-read");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['message'])) {
    echo "✓ {$result['message']}\n\n";
} else {
    echo "✗ 操作失败: $response\n\n";
}

// 10. 检查库存预警（管理员功能）
echo "10. 检查库存预警...\n";
$ch = curl_init("$baseUrl/notifications/check-stock-alerts");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data'])) {
    echo "✓ 库存预警检查完成\n";
    echo "  - 零库存: {$result['data']['out_of_stock']}\n";
    echo "  - 低库存: {$result['data']['low_stock']}\n\n";
} else {
    echo "注: 库存预警检查结果: $response\n\n";
}

// 11. 删除通知
if ($testNotificationId) {
    echo "11. 删除通知...\n";
    $ch = curl_init("$baseUrl/notifications/$testNotificationId");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

    $response = curl_exec($ch);
    curl_close($ch);

    $result = json_decode($response, true);
    if (isset($result['message']) && strpos($result['message'], '成功') !== false) {
        echo "✓ 删除成功\n\n";
    } else {
        echo "注: 删除结果: $response\n\n";
    }
}

echo "=== Phase 12 测试完成 ===\n";
echo "\n说明：\n";
echo "- 通知系统支持多种通知类型（工单、库存、保养、系统）\n";
echo "- 支持单个和批量创建通知\n";
echo "- 可以标记已读、删除、清空已读\n";
echo "- 支持优先级（低/普通/高/紧急）\n";
echo "- 库存预警和保养提醒可通过定时任务触发\n";
