<?php
// 检查 PHPMailer 是否可用（尝试 backend/vendor 和 workspace root vendor）
$candidates = [
    __DIR__ . '/../../vendor/autoload.php',
    __DIR__ . '/../vendor/autoload.php',
];
foreach ($candidates as $c) {
    if (file_exists($c)) {
        echo "Require: $c\n";
        require $c;
        break;
    }
}
echo 'class_exists PHPMailer: ' . (class_exists('\\PHPMailer\\PHPMailer\\PHPMailer') ? 'true' : 'false') . "\n";
