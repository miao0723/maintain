<?php

// 允许跨域（如果前端与后端不在同一域名下）
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

/**
 * 读取 .env 文件并注入到数组（不覆盖已存在的系统环境变量）
 */
function loadEnvFile($envPath)
{
    $env = [];
    if (!file_exists($envPath)) {
        return $env;
    }

    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0 || strpos($line, ';') === 0) {
            continue;
        }
        if (strpos($line, '=') === false) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        $value = preg_replace('/\s*[#;].*$/', '', $value);
        $value = trim($value, " \t\n\r\0\x0B\"'");

        $env[$key] = $value;

        if (getenv($key) === false) {
            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
        }
    }

    return $env;
}

function envVal($key, $default = null)
{
    $v = getenv($key);
    if ($v === false || $v === null || $v === '') {
        return $default;
    }
    return $v;
}

// 从 backend/.env 加载配置
$envPath = realpath(__DIR__ . '/../backend/.env');
loadEnvFile($envPath ?: __DIR__ . '/../backend/.env');

// SMTP 配置（优先取 .env）
$smtpHost = envVal('SMTP_HOST', 'smtp.qq.com');
$smtpPort = (int)envVal('SMTP_PORT', '465');
$smtpSecure = strtolower((string)envVal('SMTP_SECURE', 'ssl'));
$username = envVal('fromaddrs', '');
$password = envVal('password', '');
$defaultFrom = $username;
$defaultTo = envVal('toaddrs', '');

if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'error' => '未配置 fromaddrs/password，请检查 backend/.env']);
    exit;
}

// 读取输入（支持 application/json 或表单提交，兼容部分服务器未传 CONTENT_TYPE）
$rawInput = file_get_contents('php://input');
$parsedJson = json_decode($rawInput, true);
$input = (is_array($parsedJson) && count($parsedJson) > 0) ? $parsedJson : $_POST;

$to = isset($input['to']) ? trim($input['to']) : $defaultTo;
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

$transport = ($smtpSecure === 'ssl' || $smtpPort === 465) ? 'ssl://' : 'tcp://';
$socket = @stream_socket_client($transport . $smtpHost . ':' . $smtpPort, $errno, $errstr, 30);
if (!$socket) {
    echo json_encode(['success' => false, 'error' => "无法连接到 SMTP 服务器: $errstr ($errno)"]);
    exit;
}

stream_set_timeout($socket, 30);
if ($transport !== 'ssl://') {
    stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
}

$readResponse = function () use ($socket) {
    $line = @fgets($socket, 512);
    if ($line === false) return '';
    $line = trim($line);
    $lines = [$line];
    while (preg_match('/^\d{3}-/', $lines[count($lines) - 1])) {
        $next = @fgets($socket, 512);
        if ($next === false) break;
        $lines[] = trim($next);
    }
    return implode(' ', array_filter($lines));
};

$write = function ($cmd) use ($socket) {
    @fputs($socket, $cmd . "\r\n");
};

$expect = function ($resp, array $codes) {
    foreach ($codes as $code) {
        if (strpos($resp, $code) === 0) {
            return true;
        }
    }
    return false;
};

$welcome = $readResponse();
if (!$expect($welcome, ['220'])) {
    fclose($socket);
    echo json_encode(['success' => false, 'error' => 'SMTP welcome failed: ' . $welcome]);
    exit;
}

$write('EHLO localhost');
$resp = $readResponse();
if (!$expect($resp, ['250'])) {
    fclose($socket);
    echo json_encode(['success' => false, 'error' => 'SMTP EHLO failed: ' . $resp]);
    exit;
}

$write('AUTH LOGIN');
$resp = $readResponse();
if (!$expect($resp, ['334'])) {
    fclose($socket);
    echo json_encode(['success' => false, 'error' => 'SMTP AUTH LOGIN failed: ' . $resp]);
    exit;
}

$write(base64_encode($username));
$resp = $readResponse();
if (!$expect($resp, ['334'])) {
    fclose($socket);
    echo json_encode(['success' => false, 'error' => 'SMTP AUTH username step failed: ' . $resp]);
    exit;
}

$write(base64_encode($password));
$resp = $readResponse();
if (!$expect($resp, ['235'])) {
    fclose($socket);
    echo json_encode(['success' => false, 'error' => 'SMTP AUTH password step failed: ' . $resp]);
    exit;
}

$write("MAIL FROM:<$from>");
$resp = $readResponse();
if (!$expect($resp, ['250'])) {
    fclose($socket);
    echo json_encode(['success' => false, 'error' => 'SMTP MAIL FROM failed: ' . $resp]);
    exit;
}

$recipients = array_map('trim', explode(',', $to));
foreach ($recipients as $r) {
    if (!$r) continue;
    $write("RCPT TO:<$r>");
    $resp = $readResponse();
    if (!$expect($resp, ['250', '251'])) {
        fclose($socket);
        echo json_encode(['success' => false, 'error' => 'SMTP RCPT TO failed for ' . $r . ': ' . $resp]);
        exit;
    }
}

$write('DATA');
$resp = $readResponse();
if (!$expect($resp, ['354'])) {
    fclose($socket);
    echo json_encode(['success' => false, 'error' => 'SMTP DATA failed: ' . $resp]);
    exit;
}

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$headers = "From: $from\r\n";
$headers .= "To: $to\r\n";
$headers .= "Subject: $encodedSubject\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=\"utf-8\"\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n\r\n";

$message = preg_replace('/\r\n\./', "\r\n..", $message);
$message = preg_replace('/\n\./', "\n..", $message);

$write($headers . $message . "\r\n.");
$resp = $readResponse();
if (!$expect($resp, ['250'])) {
    fclose($socket);
    echo json_encode(['success' => false, 'error' => 'SMTP message accept failed: ' . $resp]);
    exit;
}

$write('QUIT');
@fgets($socket, 512);
fclose($socket);

echo json_encode(['success' => true, 'message' => '邮件发送成功']);



