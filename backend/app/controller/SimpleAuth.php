<?php

namespace app\controller;

use app\model\User;
use app\common\Result;
use app\service\JwtService;

class SimpleAuth
{
    /**
     * 简化的登录接口（用于前端）
     * POST /api/simple-login
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

        // 简单验证
        if (empty($data['username']) || empty($data['password'])) {
            return Result::error('用户名和密码不能为空', 400);
        }

        // 查找用户
        $user = User::where('username', $data['username'])->find();

        if (!$user) {
            return Result::error('用户不存在', 404);
        }

        // 验证密码
        if (!password_verify($data['password'], $user->password)) {
            return Result::error('密码错误', 401);
        }

        // 检查状态
        if ($user->status != 1) {
            return Result::error('账号已被禁用', 403);
        }

        // 生成JWT Token
        $accessToken = JwtService::createAccessToken($user->id, $user->role_type ?? 1);
        $refreshToken = JwtService::createRefreshToken($user->id);

        // 角色映射：将整数role_type映射为字符串role（小程序期望的格式）
        $roleMap = [
            1 => 'super_admin',  // 管理员
            2 => 'admin',        // 部门管理
            3 => 'engineer',     // 工程师
            4 => 'user'          // 普通用户
        ];
        $role = $roleMap[$user->role_type] ?? 'user';

        // 返回成功（同时支持 token 和 access_token 字段）
        return Result::success([
            'token' => $accessToken,              // 前端期望的字段
            'access_token' => $accessToken,      // 标准字段
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => 7200,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'real_name' => $user->real_name,
                'nickname' => $user->real_name,  // 小程序期望的昵称字段
                'role' => $role,                 // 小程序期望的role字符串
                'role_type' => $user->role_type ?? 1,
                'department_id' => $user->department_id,
                'avatar_url' => $user->avatar ?? '',
                'phone' => $user->phone,
            ],
        ], '登录成功');
    }
}
