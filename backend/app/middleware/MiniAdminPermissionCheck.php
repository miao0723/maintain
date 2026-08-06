<?php

namespace app\middleware;

use app\model\MiniAdminPermission;
use app\model\MiniAdminRolePermission;
use think\facade\Cache;

class MiniAdminPermissionCheck
{
    public function handle($request, \Closure $next)
    {
        $user = $request->miniAdminUser ?? null;
        if (!$user) {
            return json(['code' => 401, 'message' => '未登录或登录已过期', 'data' => null], 401);
        }

        if (($user['auth_source'] ?? '') === 'web') {
            return $next($request);
        }

        if (($user['role_code'] ?? '') === 'super_admin') {
            return $next($request);
        }

        $permissionCode = $this->getPermissionCode($request);
        if (!$this->hasPermission((int) ($user['role_id'] ?? 0), $permissionCode)) {
            return json(['code' => 403, 'message' => '无权访问', 'data' => null], 403);
        }

        return $next($request);
    }

    private function getPermissionCode($request): string
    {
        $path = trim((string) $request->pathinfo(), '/');
        $path = preg_replace('#^api/mini-admin/#', '', $path);
        $segments = array_values(array_filter(explode('/', $path)));
        $resource = $segments[0] ?? 'dashboard';

        $method = strtolower($request->method());
        $actionMap = [
            'get' => 'list',
            'post' => 'create',
            'put' => 'update',
            'delete' => 'delete',
        ];
        $action = $actionMap[$method] ?? 'access';

        if ($method === 'get' && count($segments) > 1 && !in_array($segments[1], ['statistics', 'retry'], true)) {
            $action = 'read';
        }
        if ($method === 'post' && count($segments) > 1 && !is_numeric($segments[1])) {
            $action = $segments[1];
        }
        if ($method === 'post' && count($segments) > 2 && !is_numeric($segments[2])) {
            $action = $segments[2];
        }

        return str_replace('-', '_', $resource) . ':' . $action;
    }

    private function hasPermission(int $roleId, string $permissionCode): bool
    {
        if ($roleId <= 0) {
            return false;
        }

        $cacheKey = 'mini_admin_role_permissions:' . $roleId;
        $permissions = Cache::get($cacheKey);
        if ($permissions === null) {
            $permissions = [];
            $rows = MiniAdminRolePermission::where('role_id', $roleId)->select()->toArray();
            if (!empty($rows)) {
                $permissionIds = array_values(array_unique(array_column($rows, 'permission_id')));
                $permissionMap = [];
                foreach (MiniAdminPermission::whereIn('id', $permissionIds)->select()->toArray() as $permission) {
                    $permissionMap[$permission['id']] = $permission['code'];
                }
                foreach ($rows as $row) {
                    if (!empty($permissionMap[$row['permission_id']])) {
                        $permissions[] = $permissionMap[$row['permission_id']];
                    }
                }
            }
            Cache::set($cacheKey, $permissions, 3600);
        }

        foreach ($permissions as $code) {
            if ($code === $permissionCode) {
                return true;
            }
            if (str_ends_with($code, '*') && str_starts_with($permissionCode, rtrim($code, '*'))) {
                return true;
            }
        }

        return false;
    }
}
