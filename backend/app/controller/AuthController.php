<?php

namespace app\controller;

use app\service\JwtService;
use app\validate\LoginValidate;
use app\model\User;
use app\common\Result;

class AuthController
{
    /**
     * 用户登录
     * POST /auth/login
     */
    public function login()
    {
        $data = request()->post();
        if (empty($data)) {
            $raw = file_get_contents('php://input');
            $json = json_decode($raw, true);
            if (is_array($json)) {
                $data = $json;
            }
        }

        // 验证输入
        try {
            validate(LoginValidate::class)
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        // 查找用户
        $user = User::where('username', $data['username'])->find();

        if (!$user) {
            return Result::error('用户名或密码错误', 401);
        }

        // 验证密码
        if (!password_verify($data['password'], $user->password)) {
            return Result::error('用户名或密码错误', 401);
        }

        // 检查用户状态
        if ($user->status != 1) {
            return Result::error('账号已被禁用', 403);
        }

        // 生成 Token
        $accessToken = JwtService::createAccessToken($user->id, $user->role_type);
        $refreshToken = JwtService::createRefreshToken($user->id);

        // 更新最后登录时间
        $user->last_login_at = date('Y-m-d H:i:s');
        $user->save();

        // 返回 Token 和用户信息
        return Result::success([
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => config('jwt.access_ttl'),
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'real_name' => $user->real_name,
                'role_type' => $user->role_type,
                'department_id' => $user->department_id,
            ],
        ], '登录成功');
    }

    /**
     * 刷新 Token
     * POST /auth/refresh
     */
    public function refresh()
    {
        $refreshToken = request()->post('refresh_token');

        if (empty($refreshToken)) {
            return Result::error('Refresh Token 不能为空', 400);
        }

        try {
            $newAccessToken = JwtService::refreshAccessToken($refreshToken);

            return Result::success([
                'access_token' => $newAccessToken,
                'token_type' => 'Bearer',
                'expires_in' => config('jwt.access_ttl'),
            ], 'Token 刷新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 401);
        }
    }

    /**
     * 用户登出
     * POST /auth/logout
     */
    public function logout()
    {
        $userId = request()->userId;

        // 撤销 Refresh Token
        JwtService::revokeRefreshToken($userId);

        return Result::success(null, '登出成功');
    }

    /**
     * 获取当前用户信息
     * GET /auth/profile
     */
    public function profile()
    {
        $userId = request()->userId;

        $user = User::with(['department'])->find($userId);

        if (!$user) {
            return Result::error('用户不存在', 404);
        }

        return Result::success([
            'id' => $user->id,
            'username' => $user->username,
            'real_name' => $user->real_name,
            'phone' => $user->phone,
            'email' => $user->email,
            'role_type' => $user->role_type,
            'department_id' => $user->department_id,
            'department_name' => $user->department ? $user->department->name : null,
            'last_login_at' => $user->last_login_at,
        ]);
    }
}
