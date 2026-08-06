<?php

namespace app\controller;

use app\common\Result;
use app\service\MailService;

class MailController
{
    /**
     * POST /api/mail/send
     * 接收：to, subject, message, format
     */
    public function send()
    {
        try {
            $data = request()->post();
            $to = isset($data['to']) ? trim($data['to']) : '';
            $subject = isset($data['subject']) ? trim($data['subject']) : '通知';
            $message = isset($data['message']) ? trim($data['message']) : '';

            if (empty($to) || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
                return Result::error('无效的收件人邮箱 (to)', 422);
            }
            if (empty($message)) {
                return Result::error('邮件内容不能为空', 422);
            }

            // 构建邮件 body，根据 format 决定是否作为 HTML
            $format = isset($data['format']) ? strtolower(trim($data['format'])) : 'text';
            if ($format === 'html') {
                $body = $message;
            } else {
                // 简单将换行换成 <br> 以便在 HTML 模式下保持格式
                $body = nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
            }

            $mailService = new MailService();
            $mailService->ensureAutoload();
            $result = $mailService->send($to, $subject, $body);

            if ($result['success']) {
                return Result::success(null, '邮件发送成功');
            }

            return Result::error('邮件发送失败: ' . ($result['message'] ?? ''), 500);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
