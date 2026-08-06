<?php

/**
 * 测试小程序进度媒体API
 * 用于验证增删改查功能
 */

// 测试配置
$apiUrl = 'http://localhost:80/api';
$token = ''; // 如果需要认证，填写你的token

echo "=== 测试小程序进度媒体API ===\n\n";

/**
 * 发送HTTP请求
 */
function sendRequest($url, $method, $data = null, $token = '') {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    $headers = [];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        $headers[] = 'Content-Type: application/json';
    }

    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'code' => $httpCode,
        'data' => json_decode($response, true)
    ];
}

/**
 * 打印结果
 */
function printResult($testName, $result) {
    echo "【{$testName}】\n";
    echo "HTTP Code: {$result['code']}\n";
    echo "Response: " . json_encode($result['data'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n\n";
}

// 1. 测试获取照片列表
echo "--- 1. 获取照片列表 ---\n";
$result = sendRequest($apiUrl . '/miniprogram-progress-media/photos', 'GET', null, $token);
printResult('获取照片列表', $result);

// 2. 测试获取视频列表
echo "--- 2. 获取视频列表 ---\n";
$result = sendRequest($apiUrl . '/miniprogram-progress-media/videos', 'GET', null, $token);
printResult('获取视频列表', $result);

// 3. 测试获取汇总
echo "--- 3. 获取订单汇总 ---\n";
$result = sendRequest($apiUrl . '/miniprogram-progress-media/summary', 'GET', null, $token);
printResult('获取订单汇总', $result);

// 4. 测试创建照片
echo "--- 4. 创建进度照片 ---\n";
$photoData = [
    'order_id' => 1,
    'description' => '测试照片说明',
    'images' => [
        'uploads/test1.jpg',
        'uploads/test2.jpg'
    ]
];
$result = sendRequest($apiUrl . '/miniprogram-progress-media/photos', 'POST', $photoData, $token);
printResult('创建进度照片', $result);

// 保存创建的照片ID
$photoId = isset($result['data']['data']['id']) ? $result['data']['data']['id'] : null;

// 5. 测试创建视频
echo "--- 5. 创建进度视频 ---\n";
$videoData = [
    'order_id' => 1,
    'video_title' => '测试视频',
    'description' => '测试视频说明',
    'video_url' => 'uploads/test.mp4',
    'cover_url' => 'uploads/test_covered.jpg',
    'duration' => 60,
    'file_size' => 1024000
];
$result = sendRequest($apiUrl . '/miniprogram-progress-media/videos', 'POST', $videoData, $token);
printResult('创建进度视频', $result);

// 保存创建的视频ID
$videoId = isset($result['data']['data']['id']) ? $result['data']['data']['id'] : null;

// 6. 测试更新照片
if ($photoId) {
    echo "--- 6. 更新进度照片 (ID: {$photoId}) ---\n";
    $updatePhotoData = [
        'description' => '更新后的照片说明',
        'images' => [
            'uploads/test1_updated.jpg',
            'uploads/test2_updated.jpg',
            'uploads/test3.jpg'
        ]
    ];
    $result = sendRequest($apiUrl . "/miniprogram-progress-media/photos/{$photoId}", 'PUT', $updatePhotoData, $token);
    printResult('更新进度照片', $result);
}

// 7. 测试更新视频
if ($videoId) {
    echo "--- 7. 更新进度视频 (ID: {$videoId}) ---\n";
    $updateVideoData = [
        'video_title' => '更新后的测试视频',
        'description' => '更新后的视频说明',
        'duration' => 120
    ];
    $result = sendRequest($apiUrl . "/miniprogram-progress-media/videos/{$videoId}", 'PUT', $updateVideoData, $token);
    printResult('更新进度视频', $result);
}

// 8. 测试获取照片详情
if ($photoId) {
    echo "--- 8. 获取照片详情 (ID: {$photoId}) ---\n";
    $result = sendRequest($apiUrl . "/miniprogram-progress-media/photos/detail/{$photoId}", 'GET', null, $token);
    printResult('获取照片详情', $result);
}

// 9. 测试获取视频详情
if ($videoId) {
    echo "--- 9. 获取视频详情 (ID: {$videoId}) ---\n";
    $result = sendRequest($apiUrl . "/miniprogram-progress-media/videos/detail/{$videoId}", 'GET', null, $token);
    printResult('获取视频详情', $result);
}

// 10. 测试删除照片
if ($photoId) {
    echo "--- 10. 删除进度照片 (ID: {$photoId}) ---\n";
    $result = sendRequest($apiUrl . "/miniprogram-progress-media/photos/{$photoId}", 'DELETE', null, $token);
    printResult('删除进度照片', $result);
}

// 11. 测试删除视频
if ($videoId) {
    echo "--- 11. 删除进度视频 (ID: {$videoId}) ---\n";
    $result = sendRequest($apiUrl . "/miniprogram-progress-media/videos/{$videoId}", 'DELETE', null, $token);
    printResult('删除进度视频', $result);
}

echo "=== 测试完成 ===\n";
