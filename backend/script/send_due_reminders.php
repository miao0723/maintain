<?php
// 按提醒日期自动发送脚本：查询 repair_reminders 表中到期且未发送的提醒并发送邮件
// 使用方法（CLI 或 定时任务）:
// php backend/script/send_due_reminders.php

// 1) 尝试加载 backend/vendor 或 workspace 根 vendor
$backendAutoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($backendAutoload)) {
    require $backendAutoload;
} else {
    $rootAutoload = __DIR__ . '/../../vendor/autoload.php';
    if (file_exists($rootAutoload)) require $rootAutoload;
}

// 2) 解析 backend/.env（与 test_mail.php 相同的解析逻辑）
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
        $v = preg_replace('/\s*[#;].*$/', '', $v);
        $v = trim($v, " \t\n\r\0\x0B\"'");
        $env[$k] = $v;
        putenv("{$k}={$v}");
        $_ENV[$k] = $v;
    }
}

// 3) 从 env 获取 DB 配置
$host = $env['DATABASE_HOSTNAME'] ?? ($env['DB_HOST'] ?? '127.0.0.1');
$dbname = $env['DATABASE_DATABASE'] ?? ($env['DB_DATABASE'] ?? 'cmms_db');
$user = $env['DATABASE_USERNAME'] ?? ($env['DB_USERNAME'] ?? 'root');
$pass = $env['DATABASE_PASSWORD'] ?? ($env['DB_PASSWORD'] ?? '');
$port = $env['DATABASE_HOSTPORT'] ?? ($env['DB_HOSTPORT'] ?? 3306);

// 支持通过 CLI 参数覆盖 DB 配置，方便在宿主机上运行脚本时指定真实可达的数据库
foreach ($argv as $arg) {
    if (strpos($arg, '--db-host=') === 0) $host = substr($arg, strlen('--db-host='));
    if (strpos($arg, '--db-name=') === 0) $dbname = substr($arg, strlen('--db-name='));
    if (strpos($arg, '--db-user=') === 0) $user = substr($arg, strlen('--db-user='));
    if (strpos($arg, '--db-pass=') === 0) $pass = substr($arg, strlen('--db-pass='));
    if (strpos($arg, '--db-port=') === 0) $port = (int)substr($arg, strlen('--db-port='));
}
$charset = $env['DATABASE_CHARSET'] ?? 'utf8mb4';

$dsn = "mysql:host={$host};dbname={$dbname};port={$port};charset={$charset}";
try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    echo "DB connect failed: " . $e->getMessage() . PHP_EOL;
    // 如果主机名是 docker 内部名（例如 mysql）且当前环境无法解析，提示如何覆盖
    echo "提示：如果你在宿主机运行此脚本，请使用 --db-host=HOST --db-name=NAME --db-user=USER --db-pass=PASS 参数覆盖 .env 中的 docker 主机名（例如 mysql）。\n";
    exit(2);
}

// 4) 查询到期且未发送（status = 'pending'）的提醒
$sql = "SELECT * FROM repair_reminders WHERE status = 'pending' AND remind_date <= NOW() ORDER BY remind_date ASC LIMIT 200";
$stmt = $pdo->query($sql);
$rows = $stmt->fetchAll();

if (empty($rows)) {
    echo "No due reminders found.\n";
    exit(0);
}

$mailService = new \app\service\MailService();
$successCount = 0;
$failCount = 0;

foreach ($rows as $r) {
    $id = $r['id'];
    $title = $r['title'] ?: '提醒';
    $content = $r['content'] ?: '';
    $machine = $r['machine_name'] ?? '';
    $remind_date = $r['remind_date'] ?? '';

    // 收件人优先使用记录中的 toaddrs 字段（如果存在），否则使用全局配置
    $to = $r['toaddrs'] ?? null;
    if (empty($to)) {
        $to = getenv('toaddrs') ?: (getenv('fromaddrs') ?: ($env['toaddrs'] ?? $env['fromaddrs'] ?? null));
    }
    if (empty($to)) {
        echo "Reminder {$id} skipped: no recipient configured.\n";
        $failCount++;
        continue;
    }

    $subject = '[维修提醒] ' . $title;
    $body = "<p>{$content}</p>";
    $body .= "<p>设备：{$machine}</p>";
    $body .= "<p>提醒时间：{$remind_date}</p>";

    $res = $mailService->send($to, $subject, $body);
    if ($res['success']) {
        // 更新数据库状态与记录
        $update = $pdo->prepare("UPDATE repair_reminders SET status = 'sent', notify_content = :nc, notify_time = NOW() WHERE id = :id");
        $update->execute([':nc' => $body, ':id' => $id]);
        echo "Reminder {$id} sent to {$to}.\n";
        $successCount++;
    } else {
        echo "Reminder {$id} send failed: {$res['message']}\n";
        $failCount++;
    }
}

echo "Done. sent={$successCount}, failed={$failCount}\n";

return 0;
