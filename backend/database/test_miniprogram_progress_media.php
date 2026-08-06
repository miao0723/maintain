<?php
/**
 * 测试小程序进度媒体 API 接口
 *
 * 使用方法：
 * 1. 确保 repair 数据库已创建进度表
 * 2. 确保 cmms_db 数据库路由配置正确
 * 3. 运行此文件：php test_miniprogram_progress_media.php
 */

// 基础配置
$apiBaseUrl = 'http://localhost:8000/api';
$token = 'your-test-token-here'; // 替换为有效的 JWT token

/**
 * 发送 HTTP 请求
 */
function sendRequest($url, $method = 'GET', $data = null, $token = null) {
    $ch = curl_init();

    $headers = [
        'Content-Type: application/json',
        'Accept: application/json'
    ];

    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    return [
        'code' => $httpCode,
        'data' => $response ? json_decode($response, true) : null,
        'error' => $error
    ];
}

/**
 * 测试获取汇总数据
 */
function testGetSummary($apiBaseUrl, $token) {
    echo "\n========== 测试获取订单汇总数据 ==========\n";
    $result = sendRequest($apiBaseUrl . '/miniprogram-progress-media/summary', 'GET', null, $token);
    echo "HTTP Code: {$result['code']}\n";
    echo "Response: " . json_encode($result['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
}

/**
 * 测试获取进度照片列表
 */
function testGetPhotos($apiBaseUrl, $token, $orderNo = '') {
    echo "\n========== 测试获取进度照片列表 ==========\n";
    $url = $apiBaseUrl . '/miniprogram-progress-media/photos';
    if ($orderNo) {
        $url .= '?order_no=' . urlencode($orderNo);
    }
    $result = sendRequest($url, 'GET', null, $token);
    echo "HTTP Code: {$result['code']}\n";
    echo "Response: " . json_encode($result['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
}

/**
 * 测试获取订单的照片
 */
function testGetOrderPhotos($apiBaseUrl, $token, $orderId) {
    echo "\n========== 测试获取订单 {$orderId} 的进度照片 ==========\n";
    $result = sendRequest($apiBaseUrl . '/miniprogram-progress-media/photos/' . $orderId, 'GET', null, $token);
    echo "HTTP Code: {$result['code']}\n";
    echo "Response: " . json_encode($result['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
}

/**
 * 测试获取进度视频列表
 */
function testGetVideos($apiBaseUrl, $token, $orderNo = '') {
    echo "\n========== 测试获取进度视频列表 ==========\n";
    $url = $apiBaseUrl . '/miniprogram-progress-media/videos';
    if ($orderNo) {
        $url .= '?order_no=' . urlencode($orderNo);
    }
    $result = sendRequest($url, 'GET', null, $token);
    echo "HTTP Code: {$result['code']}\n";
    echo "Response: " . json_encode($result['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
}

/**
 * 测试获取订单的视频
 */
function testGetOrderVideos($apiBaseUrl, $token, $orderId) {
    echo "\n========== 测试获取订单 {$orderId} 的进度视频 ==========\n";
    $result = sendRequest($apiBaseUrl . '/miniprogram-progress-media/videos/' . $orderId, 'GET', null, $token);
    echo "HTTP Code: {$result['code']}\n";
    echo "Response: " . json_encode($result['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
}

// 主函数
echo "========================================\n";
echo "小程序进度媒体 API 测试\n";
echo "========================================\n";

echo "\nAPI Base URL: {$api.apiBaseUrl}";
echo "\nToken: " . (empty($api.token) ? '(未设置)' : substr($api.token, 0, 20) . '...') . "\n";

// 提示用户
echo "\n请确保：\n";
echo "1. repair 数据库已创建 order_progress_photos 和 order_progress_videos 表\n";
echo "2. 已运行初始化数据脚本：022_seed_miniprogram_progress_media.sql\n";
echo "3. 已配置有效的 JWT token\n";
echo "\n按 Enter 继续...";
fgets(STDIN);

// 运行测试
testGetSummary($apiBaseUrl, $token);
testGetPhotos($apiBaseUrl, $token);
testGetVideos($apiBaseUrl, $token);

// 测试订单号查询
echo "\n是否测试订单号查询？(y/n): ";
$answer = trim(fgets(STDIN));
if (strtolower($answer) === 'y') {
    echo "请输入订单号（例如：202601220001）: ";
    $orderNo = trim(fgets(STDIN));
    if ($orderNo) {
        testGetPhotos($apiBaseUrl, $token, $orderNo);
        testGetVideos($apiBaseUrl, $token, $orderNo);
    }

    echo "\n是否测试订单ID查询？(y/n): ";
    $answer = trim(fgets(STDIN));
    if (strtolower($answer) === 'y') {
        echo "请输入订单ID（例如：1）: ";
        $orderId = trim(fgets(STDIN));
        if ($orderId) {
            testGetOrderPhotos($apiBaseUrl, $token, $orderId);
            testGetOrderVideos($apiBaseUrl, $token, $orderId);
        }
    }
}

echo "\n========================================\n";
echo "测试完成\n";
echo "========================================\n";
