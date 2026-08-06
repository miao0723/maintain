<?php
/**
 * Phase 9: 故障知识库 API 测试脚本
 *
 * 测试范围:
 * 1. 创建知识库条目
 * 2. 获取知识库列表
 * 3. 获取知识库详情
 * 4. 更新知识库条目
 * 5. 智能搜索
 * 6. 获取热门知识
 * 7. 获取统计数据
 * 8. 删除知识库条目
 */

$baseUrl = 'http://localhost/api';
$token = null;
$testKbId = null;

echo "=== Phase 9: 故障知识库 API 测试 ===\n\n";

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

// 2. 创建知识库条目
echo "2. 创建知识库条目...\n";
$kbData = json_encode([
    'title' => '空调不制冷故障处理',
    'fault_symptom' => '空调开机后不制冷，出风口吹自然风',
    'fault_cause' => '制冷剂泄漏或压缩机故障',
    'solution' => '1. 检查制冷剂压力\n2. 检查压缩机工作状态\n3. 补充制冷剂\n4. 如压缩机损坏需更换',
    'category_id' => 1,
    'difficulty_level' => 2,
    'tags' => ['空调', '制冷', '压缩机']
]);

$ch = curl_init("$baseUrl/knowledge");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $kbData);
curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($authHeader, ['Content-Type: application/json']));

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['id'])) {
    $testKbId = $result['data']['id'];
    echo "✓ 知识库条目创建成功，ID: $testKbId\n\n";
} else {
    echo "✗ 知识库条目创建失败: $response\n";
    exit(1);
}

// 3. 获取知识库列表
echo "3. 获取知识库列表...\n";
$ch = curl_init("$baseUrl/knowledge?page=1&limit=10");
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

// 4. 获取知识库详情（会增加使用次数）
echo "4. 获取知识库详情...\n";
$ch = curl_init("$baseUrl/knowledge/$testKbId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['id'])) {
    echo "✓ 获取详情成功，标题: {$result['data']['title']}\n";
    echo "  使用次数: {$result['data']['usage_count']}\n\n";
} else {
    echo "✗ 获取详情失败: $response\n";
}

// 5. 更新知识库条目
echo "5. 更新知识库条目（发布）...\n";
$updateData = json_encode([
    'status' => 1, // 发布
    'solution' => "1. 检查制冷剂压力\n2. 检查压缩机工作状态\n3. 补充制冷剂\n4. 如压缩机损坏需更换\n\n**注意**: 操作前需断电！"
]);

$ch = curl_init("$baseUrl/knowledge/$testKbId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, $updateData);
curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($authHeader, ['Content-Type: application/json']));

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['message']) && $result['message'] == '知识库条目更新成功') {
    echo "✓ 更新成功\n\n";
} else {
    echo "✗ 更新失败: $response\n";
}

// 6. 智能搜索
echo "6. 智能搜索（关键词：空调）...\n";
$ch = curl_init("$baseUrl/knowledge/search?keyword=空调&limit=5");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['results'])) {
    echo "✓ 搜索成功，找到 {$result['data']['total']} 条匹配\n";
    if (!empty($result['data']['results'])) {
        foreach ($result['data']['results'] as $item) {
            echo "  - {$item['knowledge']['title']} (匹配度: {$item['score']})\n";
        }
    }
    echo "\n";
} else {
    echo "✗ 搜索失败: $response\n";
}

// 7. 获取热门知识
echo "7. 获取热门知识...\n";
$ch = curl_init("$baseUrl/knowledge/hot?limit=5");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['list'])) {
    echo "✓ 获取热门知识成功，共 {$result['data']['total']} 条\n";
    foreach ($result['data']['list'] as $item) {
        echo "  - {$item['title']} (使用次数: {$item['usage_count']})\n";
    }
    echo "\n";
} else {
    echo "✗ 获取热门知识失败: $response\n";
}

// 8. 获取统计数据
echo "8. 获取统计数据...\n";
$ch = curl_init("$baseUrl/knowledge/statistics");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['data']['total_knowledge'])) {
    echo "✓ 获取统计成功\n";
    echo "  - 总知识数: {$result['data']['total_knowledge']}\n";
    echo "  - 已发布: {$result['data']['published_knowledge']}\n";
    echo "  - 草稿: {$result['data']['draft_knowledge']}\n";
    echo "  - 总使用次数: {$result['data']['total_usage']}\n\n";
} else {
    echo "✗ 获取统计失败: $response\n";
}

// 9. 删除知识库条目（草稿状态可以直接删除）
echo "9. 删除知识库条目...\n";
$ch = curl_init("$baseUrl/knowledge/$testKbId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
curl_setopt($ch, CURLOPT_HTTPHEADER, $authHeader);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
if (isset($result['message']) && $result['message'] == '知识库条目删除成功') {
    echo "✓ 删除成功\n\n";
} else {
    echo "注: 删除失败（已发布且被使用过的条目不能删除，只能归档）: $response\n\n";
}

echo "=== Phase 9 测试完成 ===\n";
