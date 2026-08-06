<?php
// 尝试加载 backend/vendor/autoload.php，如果不存在则加载 workspace 根目录的 vendor/autoload.php
$backendAutoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($backendAutoload)) {
    require $backendAutoload;
} else {
    $rootAutoload = __DIR__ . '/../../vendor/autoload.php';
    if (file_exists($rootAutoload)) require $rootAutoload;
}

// 解析 .env
$envFile = __DIR__ . '/../.env';
$env = [];
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0 || strpos($line, ';') === 0) continue;
        if (!strpos($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $k = trim($k);
        $v = trim($v);
        // 去掉行内注释（# 或 ; 开头的注释）
        $v = preg_replace('/\s*[#;].*$/', '', $v);
        $v = trim($v, " \t\n\r\0\x0B\"'");
        $env[$k] = $v;
        putenv("{$k}={$v}");
        $_ENV[$k] = $v;
    }
}

// 优先使用 `toaddrs` 作为收件人，如果未配置则回退到 `fromaddrs`
$to = $env['toaddrs'] ?? ($env['fromaddrs'] ?? '');
if (empty($to)) {
    echo "No toaddrs or fromaddrs configured in .env\n";
    exit(1);
}

$subject = '测试邮件 - CMMS';
$body = '<p>这是一封测试邮件，用于验证 PHPMailer 发送功能。</p>';

$mail = new \app\service\MailService();
$res = $mail->send($to, $subject, $body);
if ($res['success']) {
    echo "Send success: " . $res['message'] . "\n";
    exit(0);
} else {
    echo "Send failed: " . $res['message'] . "\n";
    exit(2);
}
