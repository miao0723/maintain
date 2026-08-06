<?php

namespace app\middleware;

use app\model\Role;
use app\model\RolePermission;
use app\model\Permission;
use think\facade\Cache;

/**
 * 权限检查中间件
 *
 * 用于检查用户是否有访问特定资源的权限
 * 支持基于角色和基于权限的访问控制（RBAC）
 */
class PermissionCheck
{
    /**
     * 默认配置
     *
     * @var array
     */
    protected $config = [
        // 超级管理员角色编码
        'admin_role' => 'admin',
        // 权限缓存时间（秒）
        'cache_ttl' => 3600,
        // 是否启用权限缓存
        'enable_cache' => true,
    ];

    /**
     * 处理请求
     *
     * @param \think\Request $request
     * @param \Closure $next
     * @return \think\Response
     */
    public function handle($request, \Closure $next)
    {
        // 1. 获取当前用户信息（从 JWT 中间件注入）
        $user = $request->user ?? null;

        if (!$user) {
            return json([
                'code' => 401,
                'message' => '未登录或登录已过期',
                'data' => null
            ], 401);
        }

        // 2. 超级管理员直接放行
        if ($this->isAdmin($user)) {
            return $next($request);
        }

        // 3. 获取当前路由和权限码
        $permissionCode = $this->getPermissionCode($request);

        // 4. 检查用户是否有该权限
        if (!$this->hasPermission($user, $permissionCode)) {
            return json([
                'code' => 403,
                'message' => '无权访问',
                'data' => null
            ], 403);
        }

        // 5. 权限检查通过，继续处理请求
        return $next($request);
    }

    /**
     * 判断用户是否是超级管理员
     *
     * @param array $user
     * @return bool
     */
    protected function isAdmin(array $user): bool
    {
        // 方式 1: 检查角色类型 (支持字符串 'admin', 'super_admin' 和整数 1)
        if (isset($user['role_type'])) {
            $roleType = $user['role_type'];
            if ($roleType === 'admin' || $roleType === 'super_admin' || $roleType == 1) {
                return true;
            }
        }

        // 方式 2: 检查角色编码
        if (isset($user['role_code']) && $user['role_code'] === $this->config['admin_role']) {
            return true;
        }

        // 方式 3: 检查用户 ID（假设 ID 为 1 或 2 的是超级管理员）
        if (isset($user['id']) && ($user['id'] == 1 || $user['id'] == 2)) {
            return true;
        }

        return false;
    }

    /**
     * 获取当前路由对应的权限码
     *
     * @param \think\Request $request
     * @return string
     */
    protected function getPermissionCode($request): string
    {
        // 获取请求方法
        $method = strtolower($request->method());

        // 获取路由路径
        $path = $request->pathinfo();

        // 解析路径获取资源名称
        $segments = explode('/', trim($path, '/'));

        // 特殊处理：检查是否是带有动作的路由，如 invoices/123/issue, invoices/123/void
        if (count($segments) >= 5) {
            $lastSegment = $segments[count($segments) - 1];
            $secondLastSegment = $segments[count($segments) - 2] ?? '';

            // 检查倒数第二个是数字ID，最后一个是非数字动作
            if (is_numeric($secondLastSegment) && !is_numeric($lastSegment)) {
                // 提取父资源名称
                $parentSegment = $segments[count($segments) - 3] ?? '';

                // 构建权限码：父资源名 + 动作
                $resource = str_replace('-', '_', $parentSegment);
                $action = $lastSegment;

                return $resource . ':' . $action;
            }
        }

        $resource = $segments[count($segments) - 2] ?? $segments[1] ?? '';

        // 去除 api 前缀
        if ($resource === 'api' || empty($resource)) {
            $resource = $segments[1] ?? '';
        }

        // 处理带连字符的资源名（转换为下划线）
        $resource = str_replace('-', '_', $resource);

        // 根据请求方法映射操作
        $actionMap = [
            'get' => 'list',
            'post' => 'create',
            'put' => 'update',
            'delete' => 'delete',
        ];

        $action = $actionMap[$method] ?? 'access';

        // 特殊处理：获取详情
        if ($method === 'get' && count($segments) > 2 && is_numeric($segments[count($segments) - 1])) {
            $action = 'read';
        }

        // 特殊处理：import 和 export 操作
        if (in_array($action, ['create', 'list']) && in_array($resource, ['import', 'export'])) {
            // 这是子路由，如 personnel/import
            $parentResource = $segments[count($segments) - 3] ?? $segments[2] ?? '';
            if ($parentResource === 'personnel') {
                return 'personnel:' . $action;
            }
        }

        // 组合权限码
        return $resource . ':' . $action;
    }

    /**
     * 检查用户是否有指定权限
     *
     * @param array $user
     * @param string $permissionCode
     * @return bool
     */
    protected function hasPermission(array $user, string $permissionCode): bool
    {
        // 1. 检查用户是否有角色 ID
        if (!isset($user['role_id'])) {
            return false;
        }

        // 2. 从缓存或数据库获取角色权限
        $permissions = $this->getRolePermissions($user['role_id']);

        // 3. 检查权限是否存在（细粒度检查）
        foreach ($permissions as $permission) {
            // 支持通配符权限检查
            if (str_ends_with($permission['code'], '*')) {
                $prefix = str_replace('*', '', $permission['code']);
                if (str_starts_with($permissionCode, $prefix)) {
                    return true;
                }
            }

            // 完全匹配权限码
            if ($permission['code'] === $permissionCode) {
                return true;
            }
        }

        return false;
    }

    /**
     * 检查用户是否有指定的细粒度操作权限
     *
     * @param array $user
     * @param string $permissionCode 权限码，如 'users', 'roles'
     * @param string $action 操作类型：view, edit, delete
     * @return bool
     */
    protected function hasPermissionAction(array $user, string $permissionCode, string $action = 'view'): bool
    {
        // 1. 检查用户是否有角色 ID
        if (!isset($user['role_id'])) {
            return false;
        }

        // 2. 从缓存或数据库获取角色权限
        $permissions = $this->getRolePermissions($user['role_id']);

        // 3. 检查权限是否存在
        foreach ($permissions as $permission) {
            // 支持通配符权限检查
            if (str_ends_with($permission['code'], '*')) {
                $prefix = str_replace('*', '', $permission['code']);
                if (str_starts_with($permissionCode, $prefix)) {
                    return true;
                }
            }

            // 完全匹配权限码
            if ($permission['code'] === $permissionCode) {
                $perms = $permission['permissions'] ?? ['canView' => true];

                // 检查操作权限
                switch ($action) {
                    case 'view':
                        return ($perms['canView'] ?? false) === true;
                    case 'edit':
                        return ($perms['canEdit'] ?? false) === true;
                    case 'delete':
                        return ($perms['canDelete'] ?? false) === true;
                    default:
                        return true;
                }
            }
        }

        return false;
    }

    /**
     * 获取角色的所有权限
     *
     * @param int $roleId
     * @return array
     */
    protected function getRolePermissions(int $roleId): array
    {
        $cacheKey = 'role_permissions:' . $roleId;

        // 尝试从缓存获取
        if ($this->config['enable_cache']) {
            $permissions = Cache::get($cacheKey);
            if ($permissions !== null) {
                return $permissions;
            }
        }

        // 从数据库获取
        $rolePermissions = RolePermission::where('role_id', $roleId)->select();

        if (!$rolePermissions) {
            return [];
        }

        $permissions = [];
        foreach ($rolePermissions as $rp) {
            // 获取权限信息
            $permission = Permission::find($rp->permission_id);
            if ($permission) {
                // 解析细粒度权限配置
                $perms = $rp->permissions;
                if (is_string($perms)) {
                    $perms = json_decode($perms, true);
                }
                if (empty($perms) || !is_array($perms)) {
                    $perms = ['canView' => true];
                }

                $permissions[] = [
                    'code' => $permission->code,
                    'permissions' => $perms
                ];
            }
        }

        // 缓存权限
        if ($this->config['enable_cache']) {
            Cache::set($cacheKey, $permissions, $this->config['cache_ttl']);
        }

        return $permissions;
    }

    /**
     * 清除权限缓存
     *
     * @param int $roleId
     * @return bool
     */
    public static function clearCache(int $roleId): bool
    {
        $cacheKey = 'role_permissions:' . $roleId;
        return Cache::delete($cacheKey);
    }

    /**
     * 清除所有权限缓存
     *
     * @return bool
     */
    public static function clearAllCache(): bool
    {
        $cache = Cache::init();
        // 清除所有 role_permissions 开头的缓存
        $pattern = 'role_permissions:*';
        // ThinkPHP 的 Cache 不支持 pattern delete，需要使用 Redis 等其他方式
        // 这里暂时只返回 true
        return true;
    }
}
