<?php

namespace app\middleware;

use app\common\Result;
use app\model\MiniAdminUser;
use app\model\User;
use app\service\JwtService;

class MiniAdminJwtAuth
{
    public function handle($request, \Closure $next)
    {
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

        $token = str_replace('Bearer ', '', $token);

        try {
            $payload = JwtService::verifyToken($token);
            if (($payload['type'] ?? '') !== 'access') {
                return Result::error('Token 类型错误', 401);
            }
            $guard = $payload['guard'] ?? 'web';

            if ($guard === 'mini_admin') {
                $user = MiniAdminUser::with(['role'])->find($payload['user_id']);
                if (!$user) {
                    return Result::error('用户不存在', 401);
                }
                if ((int) $user->status !== 1) {
                    return Result::error('账号已被禁用', 403);
                }

                $request->miniAdminUserId = (int) $user->id;
                $request->miniAdminUser = array_merge($user->toArray(), [
                    'role_code' => $user->role_code,
                    'role_name' => $user->role_name,
                    'auth_source' => 'mini_admin',
                ]);

                $request->userId = (int) $user->id;
                $request->user = $request->miniAdminUser;
                $request->roleType = $user->role_code ?: 'mini_admin';

                return $next($request);
            }

            $user = User::find($payload['user_id']);
            if (!$user) {
                return Result::error('用户不存在', 401);
            }
            if (isset($user->status) && (int) $user->status !== 1) {
                return Result::error('账号已被禁用', 403);
            }

            $request->miniAdminUserId = (int) $user->id;
            $request->miniAdminUser = array_merge($user->toArray(), [
                'role_code' => ((int) ($user->role_type ?? 0) === 1) ? 'super_admin' : 'web_user',
                'role_name' => ((int) ($user->role_type ?? 0) === 1) ? '系统管理员' : '系统用户',
                'auth_source' => 'web',
            ]);

            $request->userId = (int) $user->id;
            $request->user = $user->toArray();
            $request->roleType = $user->role_type ?? 1;

            return $next($request);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 401);
        }
    }
}
