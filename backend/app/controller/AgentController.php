<?php

namespace app\controller;

use app\service\AgentService;
use think\facade\Log;

class AgentController extends BaseController
{
    private const MAX_MESSAGE_LENGTH = 4000;
    private const MAX_HISTORY_MESSAGES = 12;
    private const MAX_HISTORY_ITEM_LENGTH = 2000;

    public function chat()
    {
        try {
            $data = $this->getRequestData();
            $message = trim((string) ($data['message'] ?? ''));
            $history = $this->normalizeHistory($data['history'] ?? []);

            if ($message === '') {
                return $this->error('消息内容不能为空', 400);
            }

            if (mb_strlen($message) > self::MAX_MESSAGE_LENGTH) {
                return $this->error('消息内容过长，请控制在 4000 个字符以内', 422);
            }

            $service = new AgentService();
            $result = $service->chat($message, $history, $this->getUserId());

            return $this->success($result);
        } catch (\Throwable $e) {
            Log::error('Agent 对话失败: ' . $e->getMessage());
            return $this->error('Agent 回复失败: ' . $e->getMessage(), 500);
        }
    }

    private function normalizeHistory($history): array
    {
        if (!is_array($history)) {
            return [];
        }

        $normalized = [];
        $history = array_slice($history, -self::MAX_HISTORY_MESSAGES);

        foreach ($history as $item) {
            if (!is_array($item)) {
                continue;
            }

            $role = trim((string) ($item['role'] ?? ''));
            $content = trim((string) ($item['content'] ?? ''));
            if (!in_array($role, ['user', 'assistant'], true) || $content === '') {
                continue;
            }

            $normalized[] = [
                'role' => $role,
                'content' => mb_substr($content, 0, self::MAX_HISTORY_ITEM_LENGTH),
            ];
        }

        return $normalized;
    }
}
