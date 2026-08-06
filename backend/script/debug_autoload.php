<?php
$dir = __DIR__;
$maxUp = 8;
$found = [];
for ($i = 0; $i < $maxUp; $i++) {
    $candidate = $dir . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
    if (file_exists($candidate)) {
        $found[] = $candidate;
    }
    $parent = dirname($dir);
    if ($parent === false || $parent === $dir) break;
    $dir = $parent;
}
$cwdCandidate = getcwd() . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
if (file_exists($cwdCandidate)) $found[] = $cwdCandidate;
if (empty($found)) {
    echo "No autoload found\n";
    exit(2);
}
echo "Found autoload candidates:\n";
foreach ($found as $f) echo " - $f\n";
// try including the first
require_once $found[0];
echo "After include, class_exists(\\PHPMailer\\PHPMailer\\PHPMailer): ";
var_export(class_exists('\\PHPMailer\\PHPMailer\\PHPMailer'));
echo "\n";

// list vendor/phpmailer files if exist
$phppath = dirname($found[0]) . DIRECTORY_SEPARATOR . 'phpmailer' . DIRECTORY_SEPARATOR . 'phpmailer' . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'PHPMailer.php';
if (file_exists($phppath)) {
    echo "PHPMailer file exists at: $phppath\n";
} else {
    echo "PHPMailer file not found under " . dirname($found[0]) . "\n";
}
