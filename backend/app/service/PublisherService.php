<?php

namespace app\service;

/**
 * 自动发布服务（publisher-service）的 HTTP 客户端。
 *
 * publisher-service 是跑在 Windows 宿主机上的 Python + Playwright 服务，
 * 取代原来的影刀 RPA 文件触发方案。PHP 容器通过 host.docker.internal 访问它。
 */
class PublisherService
{
    private string $baseUrl;
    private string $token;
    private int $timeout;

    public function __construct()
    {
        $this->baseUrl = rtrim((string)env('PUBLISHER_BASE_URL', 'http://host.docker.internal:8899'), '/');
        $this->token   = (string)env('PUBLISHER_TOKEN', '');
        $this->timeout = (int)env('PUBLISHER_TIMEOUT', 20);
    }

    /**
     * 是否启用脚本发布模式（false 时控制器会回退到影刀链路）
     */
    public static function enabled(): bool
    {
        $mode = strtolower(trim((string)env('PUBLISHER_MODE', 'script')));
        return $mode === 'script';
    }

    public function baseUrl(): string
    {
        return $this->baseUrl;
    }

    /**
     * 提交发布任务
     *
     * @param array $payload platform / biz_id / video_path / title / description / tags / ...
     */
    public function publish(array $payload): array
    {
        return $this->request('POST', '/api/publish', $payload);
    }

    public function task(string $taskId): array
    {
        return $this->request('GET', '/api/tasks/' . rawurlencode($taskId));
    }

    public function latestTask(string $platform, int $bizId): array
    {
        return $this->request('GET', '/api/tasks/latest?platform=' . rawurlencode($platform) . '&biz_id=' . $bizId);
    }

    public function accounts(): array
    {
        return $this->request('GET', '/api/accounts');
    }

    public function startLogin(string $platform, string $account = 'default'): array
    {
        return $this->request('POST', '/api/accounts/' . rawurlencode($platform) . '/login?account=' . rawurlencode($account));
    }

    public function loginStatus(string $platform, string $sessionId): array
    {
        return $this->request('GET', '/api/accounts/' . rawurlencode($platform) . '/login/' . rawurlencode($sessionId));
    }

    public function cancelLogin(string $platform, string $sessionId): array
    {
        return $this->request('POST', '/api/accounts/' . rawurlencode($platform) . '/login/' . rawurlencode($sessionId) . '/cancel');
    }

    public function checkAccount(string $platform, string $account = 'default'): array
    {
        // 校验登录态要开浏览器跑一圈，给足超时
        return $this->request('POST', '/api/accounts/' . rawurlencode($platform) . '/check?account=' . rawurlencode($account), null, 90);
    }

    public function logout(string $platform, string $account = 'default'): array
    {
        return $this->request('DELETE', '/api/accounts/' . rawurlencode($platform) . '?account=' . rawurlencode($account));
    }

    public function health(): array
    {
        return $this->request('GET', '/health', null, 8);
    }

    public function token(): string
    {
        return $this->token;
    }

    /**
     * 透传发布服务的失败截图（二进制 image/png）。
     */
    public function screenshotRaw(string $path): array
    {
        $url = $this->baseUrl . '/api/screenshot?path=' . rawurlencode($path);
        $ch  = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_HTTPHEADER     => $this->token !== ''
                ? ['X-Publisher-Token: ' . $this->token]
                : [],
        ]);
        $raw  = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $ct   = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $err  = curl_error($ch);
        curl_close($ch);

        return [
            'ok'           => $code === 200 && $raw !== false,
            'code'         => $code,
            'content_type' => $ct,
            'body'         => $raw,
            'error'        => $err,
        ];
    }

    /**
     * 统一请求封装。
     *
     * 返回结构固定为 ['ok' => bool, 'code' => int, 'message' => string, 'data' => mixed]，
     * 让调用方不用关心 curl 细节。
     */
    private function request(string $method, string $path, ?array $body = null, ?int $timeout = null): array
    {
        $url = $this->baseUrl . $path;
        $timeout = $timeout ?? $this->timeout;

        $headers = ['Accept: application/json'];
        if ($this->token !== '') {
            $headers[] = 'X-Publisher-Token: ' . $this->token;
        }

        $ch = curl_init($url);
        $options = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $timeout,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_CUSTOMREQUEST  => strtoupper($method),
        ];

        if ($body !== null) {
            $json = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $options[CURLOPT_POSTFIELDS] = $json;
            $headers[] = 'Content-Type: application/json';
            $headers[] = 'Content-Length: ' . strlen($json);
        }

        $options[CURLOPT_HTTPHEADER] = $headers;
        curl_setopt_array($ch, $options);

        $raw      = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($raw === false || $curlErr !== '') {
            return [
                'ok'      => false,
                'code'    => 502,
                'message' => '无法连接自动发布服务（' . $this->baseUrl . '）：' . $curlErr
                    . '。请确认宿主机上的 publisher-service 已启动（双击 publisher-service\\start.bat）。',
                'data'    => null,
            ];
        }

        if ($httpCode === 401) {
            return [
                'ok'      => false,
                'code'    => 401,
                'message' => '自动发布服务鉴权失败：请检查 backend/.env 与 publisher-service/.env 的 PUBLISHER_TOKEN 是否一致。',
                'data'    => null,
            ];
        }

        $decoded = json_decode((string)$raw, true);
        if (!is_array($decoded)) {
            return [
                'ok'      => false,
                'code'    => $httpCode ?: 500,
                'message' => '自动发布服务返回了非法响应：' . mb_substr((string)$raw, 0, 200),
                'data'    => null,
            ];
        }

        $code = isset($decoded['code']) ? (int)$decoded['code'] : 0;

        return [
            'ok'      => $code === 0,
            'code'    => $code,
            'message' => (string)($decoded['message'] ?? ''),
            'data'    => $decoded['data'] ?? null,
        ];
    }
}
