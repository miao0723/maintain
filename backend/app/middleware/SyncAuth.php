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

        $token   = $this->extractToken($request);
        $allowed = $this->getAllowedTokens();

        if ($token === '') {
            // 请求未携带任何凭证
            return SyncResult::fail(
                '缺少访问凭证：请通过 Authorization: Bearer / X-Api-Key / access_token 提供',
                'UNAUTHORIZED',
                401,
                ['configured' => count($allowed) > 0, 'received' => false]
            );
        }

        if (!in_array($token, $allowed, true)) {
            if (count($allowed) === 0) {
                // 服务端根本没配置密钥（部署遗漏），给出明确提示便于排查
                \think\facade\Log::warning('[SyncAuth] 服务端未配置 SYNC_API_KEY，外部访问全部拒绝（部署遗漏？）');
                return SyncResult::fail(
                    '服务端未配置访问凭证（SYNC_API_KEY），请联系管理员配置',
                    'UNAUTHORIZED',
                    401,
                    ['configured' => false, 'received' => true]
                );
            }
            return SyncResult::fail(
                '访问凭证无效',
                'UNAUTHORIZED',
                401,
                ['configured' => true, 'received' => true]
            );
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
     * 获取允许访问的 Token 列表（多源合并，避免部署层差异导致读不到）
     *
     * 来源：
     *  1) 项目根 .env 顶层键（TP env() 读取）
     *  2) 项目根 .env 原始文件——忽略 [SECTION] 节头直接解析（关键兜底！）
     *     TP8 用 parse_ini_file(..., true) 加载 .env，节内的键会被前缀成 SECTION_KEY，
     *     例如写在 [JWT] 之后的 SYNC_API_KEY 会被解析成 JWT_SYNC_API_KEY，导致
     *     env('SYNC_API_KEY') 永远取空、接口全 401。直接读原始文件可彻底规避。
     *  3) TP 节前缀兜底（env_file 被框架加载后键名可能带节前缀 JWT_SYNC_API_KEY）
     *  4) 容器真实环境变量（docker-compose env_file: .env.docker 注入）
     *  5) PHP_ 前缀约定（TP 原生回退 getenv('PHP_' . name)）
     *
     * 任一来源配置即可生效，多来源取并集，逗号分隔支持多个 Token。
     */
    private function getAllowedTokens(): array
    {
        $tokens = [];

        // 来源 1：项目根 .env 顶层键
        $fromEnvFile = env('SYNC_API_KEY', '');
        if (is_string($fromEnvFile) && $fromEnvFile !== '') {
            $tokens = array_merge($tokens, explode(',', $fromEnvFile));
        }

        // 来源 2：直接读原始 .env 文件（忽略节头/注释），任何位置都能命中
        $fromRawFile = $this->readRawEnv('SYNC_API_KEY');
        if ($fromRawFile !== '') {
            $tokens = array_merge($tokens, explode(',', $fromRawFile));
        }

        // 来源 3：TP 节前缀兜底（写在 [JWT] 等节内时被框架前缀成 JWT_SYNC_API_KEY）
        $fromSection = env('JWT_SYNC_API_KEY', '');
        if (is_string($fromSection) && $fromSection !== '') {
            $tokens = array_merge($tokens, explode(',', $fromSection));
        }

        // 来源 4：容器真实环境变量（.env.docker 经 env_file 注入容器内环境）
        $fromServerEnv = getenv('SYNC_API_KEY');
        if (is_string($fromServerEnv) && $fromServerEnv !== '' && $fromServerEnv !== false) {
            $tokens = array_merge($tokens, explode(',', $fromServerEnv));
        }

        // 来源 5：PHP_ 前缀约定
        $fromPhpPrefix = getenv('PHP_SYNC_API_KEY');
        if (is_string($fromPhpPrefix) && $fromPhpPrefix !== '' && $fromPhpPrefix !== false) {
            $tokens = array_merge($tokens, explode(',', $fromPhpPrefix));
        }

        return array_values(array_unique(array_filter(array_map('trim', $tokens), function ($t) {
            return $t !== '';
        })));
    }

    /**
     * 直接读取项目根 .env 原始文件，忽略 [SECTION] 节头和注释行，按 key=value 提取。
     * 用于规避 TP8 的 .env 节解析把键名前缀化的问题。
     */
    private function readRawEnv(string $key): string
    {
        $file = $this->envFilePath();
        if (!is_file($file)) {
            return '';
        }
        $lines = @file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return '';
        }
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || $line[0] === ';' || $line[0] === '[') {
                continue;
            }
            if (preg_match('/^' . preg_quote($key, '/') . '\s*=\s*(.*)$/', $line, $m)) {
                return trim($m[1], "\"' \t\r\n");
            }
        }
        return '';
    }

    /**
     * 解析 .env 文件路径：优先框架 root_path，回退到本文件相对位置推导。
     */
    private function envFilePath(): string
    {
        if (function_exists('root_path')) {
            $p = root_path() . '.env';
            if (is_file($p)) {
                return $p;
            }
        }
        return dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . '.env';
    }
}
