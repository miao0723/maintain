<?php

namespace app\controller;

use app\common\Result;
use app\model\MiniAdminPermission;
use app\model\MiniAdminRolePermission;
use app\model\MiniAdminUser;
use app\service\JwtService;

class MiniAdminAuthController extends MiniAdminBaseController
{
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

        $username = trim((string) ($data['username'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        if ($username === '' || $password === '') {
            return Result::error('用户名和密码不能为空', 422);
        }

        $user = MiniAdminUser::with(['role'])->where('username', $username)->find();
        if (!$user || !password_verify($password, $user->password)) {
            return Result::error('用户名或密码错误', 401);
        }

        if ((int) $user->status !== 1) {
            return Result::error('账号已被禁用', 403);
        }

        $accessToken = JwtService::createAccessToken(
            $user->id,
            $user->role_code ?: 'mini_admin',
            'mini_admin',
            [
                'role_id' => $user->role_id,
                'role_code' => $user->role_code,
            ]
        );
        $refreshToken = JwtService::createRefreshToken($user->id, 'mini_admin');

        $user->last_login_at = date('Y-m-d H:i:s');
        $user->save();

        return Result::success([
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => config('jwt.access_ttl'),
            'user' => $this->formatUser($user->toArray()),
            'permissions' => $this->getPermissions($user->role_id),
        ], '登录成功');
    }

    public function logout()
    {
        $userId = $this->getMiniAdminId();
        JwtService::revokeRefreshToken($userId, 'mini_admin');

        return Result::success(null, '登出成功');
    }

    public function profile()
    {
        $userId = $this->getMiniAdminId();
        $user = MiniAdminUser::with(['role'])->find($userId);
        if (!$user) {
            return Result::error('用户不存在', 404);
        }

        return Result::success([
            'user' => $this->formatUser($user->toArray()),
            'permissions' => $this->getPermissions($user->role_id),
        ]);
    }

    private function formatUser(array $user): array
    {
        return [
            'id' => (int) $user['id'],
            'username' => $user['username'],
            'real_name' => $user['real_name'] ?? '',
            'status' => (int) ($user['status'] ?? 0),
            'role_id' => (int) ($user['role_id'] ?? 0),
            'role_code' => $user['role_code'] ?? ($user['role']['code'] ?? ''),
            'role_name' => $user['role_name'] ?? ($user['role']['name'] ?? ''),
            'last_login_at' => $user['last_login_at'] ?? null,
        ];
    }

    private function getPermissions(int $roleId): array
    {
        if ($roleId <= 0) {
            return [];
        }

        $bindings = MiniAdminRolePermission::where('role_id', $roleId)->select()->toArray();
        if (empty($bindings)) {
            return [];
        }

        $permissionIds = array_values(array_unique(array_column($bindings, 'permission_id')));
        $permissions = MiniAdminPermission::whereIn('id', $permissionIds)
            ->order('sort', 'asc')
            ->select()
            ->toArray();

        $permissionMap = [];
        foreach ($permissions as $permission) {
            $permissionMap[$permission['id']] = $permission;
        }

        $result = [];
        foreach ($bindings as $binding) {
            $permission = $permissionMap[$binding['permission_id']] ?? null;
            if (!$permission) {
                continue;
            }

            $result[] = [
                'code' => $permission['code'],
                'name' => $permission['name'],
                'type' => $permission['type'],
                'path' => $permission['path'],
                'icon' => $permission['icon'],
                'sort' => (int) ($permission['sort'] ?? 0),
                'permissions' => $binding['permissions'] ?? ['canView' => true, 'canEdit' => false, 'canDelete' => false],
            ];
        }

        return $result;
    }
}
