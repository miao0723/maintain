<?php

namespace app\service;

class MailService
{
    /**
     * 发送邮件（优先使用 PHPMailer，如果不可用则回退到 mail()）
     * @param string $to
     * @param string $subject
     * @param string $body
     * @return array [success=>bool, message=>string]
     */
    public function send($to, $subject, $body)
    {
        // 尝试加载 Composer autoload：向上搜索项目目录以兼容不同运行时（CLI / FPM / 容器）
        $this->includeComposerAutoload();

        $from = $this->getEnv('fromaddrs');
        $password = $this->getEnv('password');
        $fromName = $this->getEnv('MAIL_FROM_NAME') ?: 'CMMS';
        $smtpHost = $this->getEnv('SMTP_HOST') ?: 'smtp.qq.com';
        $smtpPort = $this->getEnv('SMTP_PORT') ?: 465;
        $smtpSecure = $this->getEnv('SMTP_SECURE') ?: 'ssl';

        // 如果 PHPMailer 可用，优先使用
        if (class_exists('\PHPMailer\PHPMailer\PHPMailer')) {
            try {
                $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
                $mail->isSMTP();
                $mail->Host = $smtpHost;
                $mail->SMTPAuth = true;
                $mail->Username = $from;
                $mail->Password = $password;
                $mail->SMTPSecure = $smtpSecure;
                $mail->Port = (int)$smtpPort;

                $mail->setFrom($from, $fromName);
                $mail->addAddress($to);

                $mail->isHTML(true);
                $mail->Subject = $subject;
                $mail->Body = $body;

                $mail->send();
                $this->logRuntime('PHPMailer send success to: ' . $to . ' subject: ' . $subject);
                return ['success' => true, 'message' => '邮件发送成功'];
            } catch (\Throwable $e) {
                // 记录完整异常堆栈到 runtime 日志，便于排查
                $this->logRuntime('PHPMailer exception: ' . $e->getMessage());
                $this->logRuntime('PHPMailer stack: ' . $e->getTraceAsString());
                return ['success' => false, 'message' => 'PHPMailer 发送失败: ' . $e->getMessage()];
            }
        }

        // 回退到 PHP mail()
        $headers = "From: {$fromName} <{$from}>\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=utf-8\r\n";

        $ok = @mail($to, $subject, $body, $headers);
        if ($ok) {
            $this->logRuntime('mail() send success to: ' . $to . ' subject: ' . $subject);
            return ['success' => true, 'message' => '邮件通过 mail() 发送成功'];
        }

        $err = error_get_last();
        $this->logRuntime('mail() failed. error_get_last: ' . json_encode($err));

        // 尝试使用原始 SMTP 连接作为最终回退（免安装 PHPMailer）
        try {
            $this->logRuntime('Attempting raw SMTP fallback to send mail to: ' . $to);
            $rawResult = $this->sendViaSmtpRaw($to, $subject, $body);
            if ($rawResult['success']) {
                $this->logRuntime('Raw SMTP send success: ' . $to);
                return ['success' => true, 'message' => '邮件通过原始 SMTP 发送成功'];
            } else {
                $this->logRuntime('Raw SMTP send failed: ' . ($rawResult['message'] ?? ''));
                return ['success' => false, 'message' => '邮件发送失败（mail() 和原始 SMTP 均失败）: ' . ($rawResult['message'] ?? '')];
            }
        } catch (\Throwable $e) {
            $this->logRuntime('Raw SMTP fallback exception: ' . $e->getMessage());
            return ['success' => false, 'message' => '邮件发送失败（未安装 PHPMailer，mail() 返回 false，且 SMTP 回退异常）: ' . $e->getMessage()];
        }
    }

    /**
     * 使用原始 SMTP 命令通过外部 SMTP 服务器发送邮件（AUTH LOGIN）
     */
    private function sendViaSmtpRaw($to, $subject, $body)
    {
        $smtpHost = $this->getEnv('SMTP_HOST') ?: 'smtp.qq.com';
        $smtpPort = $this->getEnv('SMTP_PORT') ?: 465;
        $smtpSecure = $this->getEnv('SMTP_SECURE') ?: 'ssl';
        $from = $this->getEnv('fromaddrs');
        $password = $this->getEnv('password');

        if (empty($from) || empty($password)) {
            return ['success' => false, 'message' => '未配置 SMTP 发件人或密码'];
        }

        $hostPrefix = ($smtpSecure === 'ssl') ? 'ssl://' : '';
        $socket = @stream_socket_client(($hostPrefix ? $hostPrefix : 'tcp://') . $smtpHost . ':' . $smtpPort, $errno, $errstr, 30);
        if (!$socket) {
            return ['success' => false, 'message' => "无法连接到 SMTP 服务器: $errstr ($errno)"];
        }

        stream_set_timeout($socket, 30);
        $readResponse = function() use ($socket) {
            $line = @fgets($socket, 512);
            if ($line === false) return '';
            $line = trim($line);
            $lines = [$line];
            // 多行响应：形如 250-xxxx ... 最后一行 250 xxxx
            while (preg_match('/^\d{3}-/', $lines[count($lines) - 1])) {
                $next = @fgets($socket, 512);
                if ($next === false) break;
                $lines[] = trim($next);
            }
            return implode(' ', array_filter($lines));
        };

        $write = function($cmd) use ($socket) { @fputs($socket, $cmd . "\r\n"); };

        $expect = function($resp, array $prefixes) {
            foreach ($prefixes as $p) {
                if (strpos($resp, $p) === 0) return true;
            }
            return false;
        };

        // 读欢迎
        $welcome = $readResponse();
        $write('EHLO localhost');
        $resp = $readResponse();
        if (!$expect($resp, ['250', '220'])) {
            return ['success' => false, 'message' => 'SMTP EHLO failed: ' . $resp];
        }

        $write('AUTH LOGIN');
        $resp = $readResponse();
        // 可能是 334 VXN... 或错误
        if (strpos($resp, '334') !== 0) {
            return ['success' => false, 'message' => 'SMTP AUTH LOGIN failed: ' . $resp];
        }
        $write(base64_encode($from));
        $resp = $readResponse();
        if (strpos($resp, '334') !== 0) {
            return ['success' => false, 'message' => 'SMTP AUTH username step failed: ' . $resp];
        }
        $write(base64_encode($password));
        $resp = $readResponse();
        // 认证成功一般是 235
        if (strpos($resp, '235') !== 0) {
            return ['success' => false, 'message' => 'SMTP AUTH password step failed: ' . $resp];
        }

        $write('MAIL FROM:<' . $from . '>');
        $resp = $readResponse();
        if (!$expect($resp, ['250'])) {
            return ['success' => false, 'message' => 'SMTP MAIL FROM failed: ' . $resp];
        }

        $recipients = array_map('trim', explode(',', $to));
        foreach ($recipients as $r) {
            if ($r) {
                $write('RCPT TO:<' . $r . '>');
                $resp = $readResponse();
                if (!$expect($resp, ['250', '251'])) {
                    return ['success' => false, 'message' => 'SMTP RCPT TO failed for ' . $r . ': ' . $resp];
                }
            }
        }

        $write('DATA');
        $resp = $readResponse();
        if (!$expect($resp, ['354'])) {
            return ['success' => false, 'message' => 'SMTP DATA failed: ' . $resp];
        }

        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $headers = "From: {$from}\r\n";
        $headers .= "To: {$to}\r\n";
        $headers .= "Subject: {$encodedSubject}\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=\"utf-8\"\r\n";
        $headers .= "\r\n";

        // 转义以点开头的行
        $messageSafe = preg_replace('/\r\n\./', "\r\n..", $body);
        $messageSafe = preg_replace('/\n\./', "\n..", $messageSafe);

        $write($headers . $messageSafe . "\r\n.");
        $resp = $readResponse();
        if (!$expect($resp, ['250'])) {
            return ['success' => false, 'message' => 'SMTP message accept failed: ' . $resp];
        }

        $write('QUIT');
        $resp = $readResponse();
        // quit 成功通常 221，但不强制失败
        fclose($socket);

        return ['success' => true, 'message' => 'raw smtp send success'];
    }

    private function getEnv($key, $default = null)
    {
        $val = false;

        // 优先使用 getenv（运行时环境可能已经通过 putenv/$_ENV 设置）
        $g = getenv($key);
        if ($g !== false && $g !== null && $g !== '') $val = $g;

        // 如果没有，再尝试框架的 env() 辅助函数
        if ($val === false && function_exists('env')) {
            try {
                $v2 = env($key);
                if ($v2 !== null && $v2 !== '') $val = $v2;
            } catch (\Exception $e) {
                // ignore
            }
        }

        if ($val === false || $val === null) return $default;

        // 清理常见的包裹字符和行内注释
        if (is_string($val)) {
            // 去掉两端的引号和空白
            $val = trim($val);
            $val = trim($val, "\"'\t\n\r\0\x0B");
            // 去掉行内注释（# 或 ; 开头的注释）
            $val = preg_replace('/\s*[#;].*$/', '', $val);
            $val = trim($val);
        }

        return $val === '' ? $default : $val;
    }

    /**
     * 向上搜索并加载第一个找到的 `vendor/autoload.php`。
     * 这比固定路径更可靠，能在不同运行时环境下找到 workspace 根目录的 autoload。
     */
    private function includeComposerAutoload()
    {
        // 如果环境中指定了 AUTOLOAD_PATH，则优先尝试加载它（便于在不同部署环境显式指定 vendor 路径）
        $explicit = $this->getEnv('AUTOLOAD_PATH');
        if ($explicit) {
            if (file_exists($explicit)) {
                try {
                    require_once $explicit;
                    $this->logRuntime('Loaded explicit autoload from AUTOLOAD_PATH: ' . $explicit);
                    $this->logRuntime('PHPMailer available after explicit load: ' . (class_exists('\\PHPMailer\\PHPMailer\\PHPMailer') ? 'yes' : 'no'));
                    if (class_exists('\\PHPMailer\\PHPMailer\\PHPMailer')) return true;
                } catch (\Throwable $e) {
                    $this->logRuntime('Failed to require AUTOLOAD_PATH: ' . $explicit . ' error: ' . $e->getMessage());
                }
            } else {
                $this->logRuntime('AUTOLOAD_PATH set but file not found: ' . $explicit);
            }
        }
        $candidates = [];

        // 明确优先检测 backend 的 vendor 和 workspace 根目录的 vendor
        $backendVendor = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php'; // backend/vendor/autoload.php
        $workspaceVendor = dirname(__DIR__, 4) . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php'; // workspace root vendor
        if (file_exists($backendVendor)) $candidates[] = $backendVendor;
        if (file_exists($workspaceVendor) && $workspaceVendor !== $backendVendor) $candidates[] = $workspaceVendor;

        // 兼容：从当前目录向上搜索（最多 8 级），以防部署结构不同
        $dir = __DIR__;
        for ($i = 0; $i < 8; $i++) {
            $candidate = $dir . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
            if (file_exists($candidate) && !in_array($candidate, $candidates)) $candidates[] = $candidate;
            $parent = dirname($dir);
            if ($parent === false || $parent === $dir) break;
            $dir = $parent;
        }

        // 尝试当前工作目录下的 vendor
        $cwdCandidate = getcwd() . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
        if (file_exists($cwdCandidate) && !in_array($cwdCandidate, $candidates)) $candidates[] = $cwdCandidate;

        // 首先尝试只加载那些明显包含 PHPMailer 源文件的 autoload
        $tried = [];
        foreach ($candidates as $c) {
            $vendorDir = dirname($c);
            $phpmailerPath = $vendorDir . DIRECTORY_SEPARATOR . 'phpmailer' . DIRECTORY_SEPARATOR . 'phpmailer' . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'PHPMailer.php';
            if (file_exists($phpmailerPath)) {
                try {
                    require_once $c;
                } catch (\Throwable $e) {
                    $this->logRuntime('require_once failed for: ' . $c . ' error: ' . $e->getMessage());
                    $tried[] = $c;
                    continue;
                }
                $this->logRuntime('Loaded autoload: ' . $c . ' (contains PHPMailer)');
                $this->logRuntime('PHPMailer available after load: ' . (class_exists('\\PHPMailer\\PHPMailer\\PHPMailer') ? 'yes' : 'no'));
                if (class_exists('\\PHPMailer\\PHPMailer\\PHPMailer')) return true;
                $tried[] = $c;
            }
        }

        // 如果上一步没有成功，逐个尝试加载所有候选 autoload（有时 composer 的安装路径或包名不同）
        foreach ($candidates as $c) {
            if (in_array($c, $tried)) continue;
            try {
                require_once $c;
            } catch (\Throwable $e) {
                $this->logRuntime('require_once failed for: ' . $c . ' error: ' . $e->getMessage());
                continue;
            }
            $this->logRuntime('Loaded autoload: ' . $c);
            $this->logRuntime('PHPMailer available after load: ' . (class_exists('\\PHPMailer\\PHPMailer\\PHPMailer') ? 'yes' : 'no'));
            if (class_exists('\\PHPMailer\\PHPMailer\\PHPMailer')) return true;
        }

        // 最后仍未找到 PHPMailer，则记录并返回 false
        $this->logRuntime('No autoload candidate provided a usable PHPMailer. Candidates tried: ' . implode(', ', $candidates));
        return false;
    }

    /**
     * Public wrapper to ensure Composer autoload is loaded.
     * Useful for controllers to call before other framework code runs.
     */
    public function ensureAutoload(): bool
    {
        return $this->includeComposerAutoload();
    }

    /**
     * Append a message to runtime/logs/mail_debug.log (creates directory/file if needed).
     */
    private function logRuntime($message)
    {
        try {
            $root = dirname(__DIR__, 2); // app/.. -> backend/
            $logDir = $root . DIRECTORY_SEPARATOR . 'runtime' . DIRECTORY_SEPARATOR . 'logs';
            if (!is_dir($logDir)) @mkdir($logDir, 0777, true);
            $file = $logDir . DIRECTORY_SEPARATOR . 'mail_debug.log';
            $time = date('[Y-m-d H:i:s]');
            @file_put_contents($file, $time . ' ' . $message . PHP_EOL, FILE_APPEND | LOCK_EX);
        } catch (\Throwable $e) {
            // fallback to error_log if file write fails
            error_log('MailService logRuntime failed: ' . $e->getMessage());
        }
    }
}
