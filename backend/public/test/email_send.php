<?php

// 允许跨域（如果前端与后端不在同一域名下）
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// SMTP 配置（请按需修改）
$smtpServer = "ssl://smtp.qq.com";
$smtpPort = 465;
$username = "3125845799@qq.com"; // SMTP 登录用户
$password = "wjigwiqbcxtxddec"; // SMTP 授权码/密码
$defaultFrom = "3125845799@qq.com";

// 读取输入（支持 application/json 或表单提交），兼容部分服务器不传 CONTENT_TYPE 的情况
$rawInput = file_get_contents('php://input');
$parsedJson = json_decode($rawInput, true);
if (is_array($parsedJson) && count($parsedJson) > 0) {
    $input = $parsedJson;
} else {
    $input = $_POST;
}

$to = isset($input['to']) ? trim($input['to']) : '';
$subject = isset($input['subject']) ? trim($input['subject']) : '维修提醒';
$message = isset($input['message']) ? trim($input['message']) : '';
$from = isset($input['from']) && filter_var($input['from'], FILTER_VALIDATE_EMAIL) ? $input['from'] : $defaultFrom;

if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => '无效的收件人邮箱（to）']);
    exit;
}

if (!$message) {
    echo json_encode(['success' => false, 'error' => '邮件内容（message）不能为空']);
    exit;
}

function base64_encode_str($str) {
    return base64_encode($str);
}

// 用更安全的方式建立 SSL 连接
$socket = stream_socket_client("tcp://" . str_replace('ssl://', '', $smtpServer) . ":$smtpPort", $errno, $errstr, 30);
if (!$socket) {
    echo json_encode(['success' => false, 'error' => "无法连接到 SMTP 服务器: $errstr ($errno)"]);
    exit;
}

// 开启加密（如果使用 ssl:// 则改为 tls/ssl，QQ SMTP 需要 ssl）
stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

// 读取服务器欢迎信息
@fgets($socket, 512);

// EHLO
fputs($socket, "EHLO localhost\r\n");
@fgets($socket, 512);

// 登录认证
fputs($socket, "AUTH LOGIN\r\n");
@fgets($socket, 512);
fputs($socket, base64_encode_str($username) . "\r\n");
@fgets($socket, 512);
fputs($socket, base64_encode_str($password) . "\r\n");
@fgets($socket, 512);

// MAIL FROM
fputs($socket, "MAIL FROM:<$from>\r\n");
@fgets($socket, 512);

// 支持多个收件人，用逗号分隔
$recipients = array_map('trim', explode(',', $to));
foreach ($recipients as $r) {
    if ($r) {
        fputs($socket, "RCPT TO:<$r>\r\n");
        @fgets($socket, 512);
    }
}

// DATA
fputs($socket, "DATA\r\n");
@fgets($socket, 512);

// 构建邮件头
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$headers = "From: $from\r\n";
$headers .= "To: $to\r\n";
$headers .= "Subject: $encodedSubject\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=\"utf-8\"\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";
$headers .= "\r\n";

// 按 SMTP 要求转义以句点开头的行
$message = preg_replace('/\r\n\./', "\r\n..", $message);
$message = preg_replace('/\n\./', "\n..", $message);

$body = $headers . $message . "\r\n.\r\n";

fputs($socket, $body);
@fgets($socket, 512);

// QUIT
fputs($socket, "QUIT\r\n");
@fgets($socket, 512);

fclose($socket);

echo json_encode(['success' => true, 'message' => '邮件发送请求已提交']);
