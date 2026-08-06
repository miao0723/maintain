<?php

namespace app\service;

use think\facade\Log;

class AgentService
{
    private const DEFAULT_CONNECT_TIMEOUT = 5;
    private const DEFAULT_REQUEST_TIMEOUT = 60;

    public function chat(string $message, array $history = [], ?int $userId = null): array
    {
        $payload = [
            'message' => $message,
            'history' => $history,
            'user_id' => $userId,
        ];

        $response = $this->postJsonWithFallback($payload);
        $decoded = json_decode($response, true);

        if (!is_array($decoded)) {
            Log::error('Agent 服务返回了无效 JSON: ' . mb_substr($response, 0, 1000));
            throw new \RuntimeException('Agent 服务返回了无效响应');
        }

        if (!empty($decoded['error'])) {
            throw new \RuntimeException((string) $decoded['error']);
        }

        return $decoded;
    }

    private function postJsonWithFallback(array $payload): string
    {
        $endpoints = $this->getAgentEndpoints();
        $errors = [];

        foreach ($endpoints as $endpoint) {
            try {
                return $this->postJson($endpoint . '/chat', $payload);
            } catch (\RuntimeException $e) {
                $errors[] = $endpoint . ' => ' . $e->getMessage();
            }
        }

        Log::error('Agent 服务全部地址均不可用: ' . implode(' | ', $errors));
        throw new \RuntimeException('Agent 服务不可用，请确认 LangGraph 服务已启动');
    }

    private function getAgentEndpoints(): array
    {
        $configured = trim((string) env('AGENT_SERVICE_URL', ''));
        $candidates = [];

        if ($configured !== '') {
            $candidates[] = rtrim($configured, '/');
        } else {
            $candidates[] = 'http://127.0.0.1:8001';
        }

        // Docker 中的 PHP 访问宿主机服务时，127.0.0.1 指向容器自身，因此增加宿主机回退地址。
        $candidates[] = 'http://host.docker.internal:8001';

        return array_values(array_unique($candidates));
    }

    private function postJson(string $url, array $payload): string
    {
        $ch = curl_init();
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \RuntimeException('Agent 请求参数编码失败');
        }

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
            'Content-Type: application/json',
        ]);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, (int) env('AGENT_CONNECT_TIMEOUT', (string) self::DEFAULT_CONNECT_TIMEOUT));
        curl_setopt($ch, CURLOPT_TIMEOUT, (int) env('AGENT_REQUEST_TIMEOUT', (string) self::DEFAULT_REQUEST_TIMEOUT));

        $response = curl_exec($ch);
        $error = curl_error($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($error) {
            Log::error('Agent 服务请求失败: ' . $url . ' => ' . $error);
            throw new \RuntimeException($error);
        }

        if ($statusCode >= 400) {
            $detail = $this->extractErrorDetail((string) $response);
            Log::error('Agent 服务返回错误状态: ' . $url . ' => ' . $statusCode . '，响应: ' . $response);
            throw new \RuntimeException('Agent 服务返回异常状态: ' . $statusCode . ($detail !== '' ? '，' . $detail : ''));
        }

        return (string) $response;
    }

    private function extractErrorDetail(string $response): string
    {
        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            return '';
        }

        $detail = $decoded['detail'] ?? $decoded['message'] ?? '';
        if (is_string($detail)) {
            return trim($detail);
        }

        return '';
    }
}
