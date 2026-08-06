<?php
require __DIR__ . '/../vendor/autoload.php';

// 简单的 CLI 发送脚本，不依赖完整框架启动
// 读取 .env 获取 DB 配置与邮箱配置
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
        $v = trim($v, " \t\n\r\0\x0B\"'");
        $env[$k] = $v;
        putenv("{$k}={$v}");
        $_ENV[$k] = $v;
    }
}

// 连接数据库使用 PDO
$dbHost = $env['DATABASE_HOSTNAME'] ?? ($env['DATABASE_HOST'] ?? '127.0.0.1');
$dbPort = $env['DATABASE_HOSTPORT'] ?? 3306;
$dbName = $env['DATABASE_DATABASE'] ?? ($env['DATABASE_DB'] ?? 'cmms_db');
$dbUser = $env['DATABASE_USERNAME'] ?? 'root';
$dbPass = $env['DATABASE_PASSWORD'] ?? '';

$dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (Exception $e) {
    echo "DB connect error: " . $e->getMessage() . "\n";
    exit(1);
}

$today = date('Y-m-d');
$stmt = $pdo->prepare("SELECT * FROM repair_reminders WHERE status = 'pending' AND notify_method = 'email' AND remind_date <= :today");
$stmt->execute([':today' => $today]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$mailService = new \app\service\MailService();
$sent = 0;
foreach ($rows as $r) {
    $to = $env['fromaddrs'] ?? '';
    if (empty($to)) {
        echo "No target email configured (fromaddrs)\n";
        break;
    }
    $subject = '[维修提醒] ' . ($r['title'] ?: '提醒');
    $body = "<p>" . ($r['content'] ?: '') . "</p>";
    $body .= "<p>设备：" . ($r['machine_name'] ?? '') . "</p>";
    $body .= "<p>提醒时间：" . ($r['remind_date'] ?? '') . "</p>";

    $res = $mailService->send($to, $subject, $body);
    if ($res['success']) {
        // 更新数据库状态与通知内容
        $u = $pdo->prepare("UPDATE repair_reminders SET status = 'sent', notify_content = :content WHERE id = :id");
        $u->execute([':content' => $body, ':id' => $r['id']]);
        $sent++;
        echo "Sent reminder id={$r['id']}\n";
    } else {
        echo "Failed id={$r['id']}: " . $res['message'] . "\n";
    }
}

echo "Total sent: {$sent}\n";
