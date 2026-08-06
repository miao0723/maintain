<?php

namespace app\middleware;

use app\service\JwtService;
use app\common\Result;
use app\model\User;

class JwtAuth
{
    public function handle($request, \Closure $next)
    {
        // 获取 Token (优先从Header, 兼容Query参数用于文件下载/预览)
        $token = $request->header('Authorization');

        if (empty($token)) {
            $token = $request->param('token');
            if (!empty($token)) {
                $token = 'Bearer ' . $token;
            }
        }

        if (empty($token)) {
            return Result::error('未提供认证 Token', 401);
        }

        // 去掉 "Bearer " 前缀
        $token = str_replace('Bearer ', '', $token);

        try {
            // 尝试解析简单Token (base64编码的 user_id:timestamp)
            if (strpos($token, '.') === false) {
                // 简单token格式
                $decoded = base64_decode($token);
                if ($decoded && strpos($decoded, ':') !== false) {
                    list($userId, $timestamp) = explode(':', $decoded);

                    // 验证token时效性 (24小时有效)
                    if (time() - $timestamp > 86400) {
                        return Result::error('Token 已过期', 401);
                    }

                    // 从数据库获取用户信息
                    $user = \app\model\User::find($userId);
                    if (!$user) {
                        return Result::error('用户不存在', 401);
                    }

                    $request->userId = $userId;
                    $request->roleType = $user->role_type ?? 1;
                    // 添加 user 对象供 PermissionCheck 使用
                    $request->user = $user->toArray();

                    return $next($request);
                }
            }

            // 标准JWT Token验证
            $payload = JwtService::verifyToken($token);

            // 检查 Token 类型
            if ($payload['type'] !== 'access') {
                return Result::error('Token 类型错误', 401);
            }

            // 从数据库获取用户信息
            $user = User::find($payload['user_id']);
            if ($user) {
                $request->user = $user->toArray();
            }

            // 将用户信息注入到请求中
            $request->userId = $payload['user_id'];
            $request->roleType = $payload['role_type'];

            return $next($request);
        } catch (\Exception $e) {
            // 记录调试信息到 runtime 日志，便于诊断 web 请求下的 token 验证问题
            try {
                $logDir = dirname(__DIR__, 2) . '/runtime/log';
                if (!is_dir($logDir)) @mkdir($logDir, 0777, true);
                $authHeader = $request->header('Authorization') ?: '';
                $tokenSnippet = strlen($token) > 20 ? substr($token, 0, 10) . '...' . substr($token, -10) : $token;
                $jwtSecret = config('jwt.secret');
                $secretHash = $jwtSecret ? substr(md5($jwtSecret), 0, 8) : 'null';
                $entry = sprintf("[%s] Authorization=%s token=%s secret=%s error=%s\n", date('c'), $authHeader, $tokenSnippet, $secretHash, $e->getMessage());
                @file_put_contents($logDir . '/jwt_debug.log', $entry, FILE_APPEND);
            } catch (\Throwable $tex) {
                // 忽略日志写入错误
            }

            return Result::error($e->getMessage(), 401);
        }
    }
}