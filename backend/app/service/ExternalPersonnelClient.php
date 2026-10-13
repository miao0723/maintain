<?php

namespace app\service;

use think\facade\Cache;
use think\facade\Log;

/**
 * 外部系统人员接口客户端
 *
 * 职责：
 *  1. POST 登录获取 data.access_token（服务账号从 env 读取，不硬编码）；
 *  2. token 缓存复用，遇 401 自动重新登录并重试一次，禁止每次请求都登录；
 *  3. 人员接口分页（page / page_size）全量拉取，并支持 keyword 按姓名检索。
 *
 * 所有地址 / 账号 / 密钥 / 字段名均来自 config('external.personnel')，可配置。
 */
class ExternalPersonnelClient
{
    /** @var array */
    protected $cfg;

    public function __construct()
    {
        $this->cfg = (array) config('external.personnel');
    }

    /**
     * 是否已配置基础地址（未配置则禁用同步）
     */
    public function isConfigured(): bool
    {
        return !empty($this->cfg['base_url']);
    }

    /**
     * 获取可用的 access_token（带缓存）。无缓存或强制刷新时先登录。
     *
     * @param bool $force 强制重新登录
     */
    public function getToken(bool $force = false): string
    {
        $cacheKey = $this->cfg['token_cache_key'] ?? 'external_personnel:token';

        if (!$force) {
            $cached = Cache::get($cacheKey);
            if (!empty($cached) && is_string($cached)) {
                return $cached;
            }
        }

        $token = $this->login();
        Cache::set($cacheKey, $token, (int) ($this->cfg['token_cache_ttl'] ?? 3600));
        return $token;
    }

    /**
     * 清除 token 缓存（401 时调用，下次会触发重新登录）
     */
    public function forgetToken(): void
    {
        Cache::delete($this->cfg['token_cache_key'] ?? 'external_personnel:token');
    }

    /**
     * 登录：POST 返回 data.access_token
     */
    public function login(): string
    {
        $url = rtrim($this->cfg['base_url'], '/') . ($this->cfg['login_path'] ?? '/api/auth/login');

        $body = [
            ($this->cfg['account_field'] ?? 'username')  => (string) ($this->cfg['account'] ?? ''),
            ($this->cfg['password_field'] ?? 'password') => (string) ($this->cfg['password'] ?? ''),
        ];

        $resp = $this->curl($url, 'POST', $body, [], false); // 登录请求不带 token

        $token = $resp['data']['access_token'] ?? ($resp['access_token'] ?? null);
        if (empty($token)) {
            throw new \RuntimeException('外部系统登录失败：未返回 access_token' .
                (isset($resp['message']) ? '（' . $resp['message'] . '）' : ''));
        }
        return (string) $token;
    }

    /**
     * 调用人员列表接口（单页）
     *
     * @param array $params page / page_size / keyword 等
     * @return array { list: array, total: int }
     */
    public function fetchPage(array $params, bool $allowRetry = true): array
    {
        $token = $this->getToken();
        $url = rtrim($this->cfg['base_url'], '/') . ($this->cfg['list_path'] ?? '/api/personnel/list');
        $headers = ['Authorization: ' . ($this->cfg['token_prefix'] ?? 'Bearer ') . $token];

        $resp = $this->curl($url, 'GET', [], array_merge($params, []), true, $headers);

        // 401 自动重登一次
        if ($allowRetry && $this->isUnauthorized($resp)) {
            $this->forgetToken();
            $token = $this->getToken(true);
            $headers = ['Authorization: ' . ($this->cfg['token_prefix'] ?? 'Bearer ') . $token];
            $resp = $this->curl($url, 'GET', [], $params, true, $headers);
        }

        return $this->normalizeList($resp);
    }

    /**
     * 全量拉取：循环分页直到取完（或达到 max_pages 上限）
     *
     * @param string $keyword 可选，按姓名检索
     * @return array [ 原始人员数组... ]
     */
    public function fetchAll(string $keyword = ''): array
    {
        $pageSize = (int) ($this->cfg['page_size'] ?? 100);
        $maxPages = (int) ($this->cfg['max_pages'] ?? 200);

        $all = [];
        $page = 1;
        do {
            $params = ['page' => $page, 'page_size' => $pageSize];
            if ($keyword !== '') {
                $params['keyword'] = $keyword;
            }
            $result = $this->fetchPage($params);
            $list = $result['list'];
            $total = $result['total'];

            foreach ($list as $row) {
                $all[] = $row;
            }

            // 终止条件：本页不满 / 已达 total / 空页 / 触达 max_pages
            $fetched = count($all);
            if (count($list) < $pageSize) break;
            if ($total > 0 && $fetched >= $total) break;
            if (empty($list)) break;
            $page++;
        } while ($page <= $maxPages);

        return $all;
    }

    /**
     * 按姓名检索（内部走分页，聚合成一页返回）
     */
    public function search(string $keyword): array
    {
        if (trim($keyword) === '') {
            return [];
        }
        return $this->fetchAll(trim($keyword));
    }

    // ===== 内部工具 =====

    /**
     * 归一化列表响应，兼容 data.list / data.items / data.rows 等形态
     */
    protected function normalizeList(array $resp): array
    {
        $data = $resp['data'] ?? $resp;
        if (!is_array($data)) {
            $data = [];
        }
        $list = $data['list'] ?? $data['items'] ?? $data['rows'] ?? $data['records'] ?? [];
        if (!is_array($list)) {
            $list = [];
        }
        $total = $data['total'] ?? $data['count'] ?? count($list);

        return ['list' => array_values($list), 'total' => (int) $total];
    }

    /**
     * 判断响应是否表示未授权
     */
    protected function isUnauthorized(array $resp): bool
    {
        $code = $resp['code'] ?? null;
        return $code === 401 || $code === '401' || $code === 40100;
    }

    /**
     * 统一 cURL 请求
     *
     * @param string $url
     * @param string $method GET|POST
     * @param array  $body   POST 时的 JSON body
     * @param array  $query  GET 时的查询参数
     * @param bool   $json   body/query 是否按 JSON 提交
     * @param array  $headers 额外请求头
     * @return array 解码后的响应数组
     */
    protected function curl(string $url, string $method = 'GET', array $body = [], array $query = [], bool $json = true, array $headers = []): array
    {
        if (!empty($query)) {
            $url .= (strpos($url, '?') === false ? '?' : '&') . http_build_query($query);
        }

        $ch = curl_init();
        $opts = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => strtoupper($method),
            CURLOPT_TIMEOUT => (int) ($this->cfg['timeout'] ?? 20),
            CURLOPT_CONNECTTIMEOUT => (int) ($this->cfg['timeout'] ?? 20),
            CURLOPT_HTTPHEADER => array_merge(['Accept: application/json'], $headers),
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
        ];

        if (strtoupper($method) === 'POST') {
            if ($json) {
                $payload = json_encode($body, JSON_UNESCAPED_UNICODE);
                $opts[CURLOPT_POSTFIELDS] = $payload;
                $opts[CURLOPT_HTTPHEADER] = array_merge($opts[CURLOPT_HTTPHEADER], ['Content-Type: application/json']);
            } else {
                $opts[CURLOPT_POSTFIELDS] = http_build_query($body);
                $opts[CURLOPT_HTTPHEADER] = array_merge($opts[CURLOPT_HTTPHEADER], ['Content-Type: application/x-www-form-urlencoded']);
            }
        }

        curl_setopt_array($ch, $opts);
        $raw = curl_exec($ch);
        $errNo = curl_errno($ch);
        $errMsg = curl_error($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw === false || $errNo) {
            throw new \RuntimeException("外部系统网络请求失败：{$errMsg}");
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            // 非 JSON：把 HTTP 码一并返回，交由上层判断
            return ['http_code' => $httpCode, 'raw' => $raw];
        }
        $decoded['http_code'] = $httpCode;
        return $decoded;
    }
}
