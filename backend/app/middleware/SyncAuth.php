<?php

namespace app\middleware;

use app\common\SyncResult;

/**
 * 订单同步接口鉴权中间件
 *
 * 采用「固定 Token」机制，避免接口被匿名调用：
 *  - 优先读取 Header：Authorization: Bearer <token>
 *  - 兼容 Header：X-Api-Key: <token>
 *  - 兼容 Query 参数（便于脚本/调试）：?access_token=<token>
 *
 * 合法 Token 来自环境变量 SYNC_API_KEY（逗号分隔可配置多个；留空则拒绝一切访问）。
 * 部署时请在 .env 中设置高强度 Token，并通过配置中心/密钥管理下发，不要明文提交到仓库。
 *
 * 注：OPTIONS 预检请求直接放行，交由 allowCrossDomain 处理，避免跨域预检被拦截。
 */
class SyncAuth
{
    public function handle($request, \Closure $next)
    {
        // 预检请求直接透传，保证跨域可访问
        if (strtoupper($request->method()) === 'OPTIONS') {
            return $next($request);
        }

        $token = $this->extractToken($request);
        if ($token === '' || !$this->isValid($token)) {
            return SyncResult::fail('未授权：缺少或无效的访问凭证', 'UNAUTHORIZED', 401);
        }

        // 将调用方身份透传给下游（当前仅做记录用）
        $request->syncClient = $token;
        return $next($request);
    }

    /**
     * 从请求中提取 Token
     */
    private function extractToken($request): string
    {
        // 1. Authorization: Bearer xxx
        $auth = $request->header('Authorization', '');
        if ($auth !== '' && $auth !== null) {
            if (stripos($auth, 'Bearer ') === 0) {
                return substr($auth, 7);
            }
            return trim($auth);
        }

        // 2. X-Api-Key: xxx
        $apiKey = $request->header('X-Api-Key', '');
        if ($apiKey !== '' && $apiKey !== null) {
            return trim($apiKey);
        }

        // 3. Query 参数 access_token（便于脚本/调试）
        $param = request()->param('access_token', '');
        return is_string($param) ? trim($param) : '';
    }

    /**
     * 校验 Token 是否合法
     */
    private function isValid(string $token): bool
    {
        $configured = env('SYNC_API_KEY', '');
        if ($configured === '' || $configured === null) {
            // 未配置密钥时，拒绝所有外部访问（fail-closed）
            return false;
        }
        $allowed = array_map('trim', explode(',', (string) $configured));
        return in_array($token, $allowed, true);
    }
}
