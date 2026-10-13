<?php

namespace app\middleware;

use app\model\Role;
use app\model\RolePermission;
use app\model\Permission;
use app\model\UserRole;
use think\facade\Cache;

/**
 * 权限检查中间件（接口级鉴权）
 *
 * 三级鉴权之一：接口级。菜单级 / 按钮级由前端按权限树与 v-permission 控制。
 *
 * 规则：
 *  1. 老板/超管（role_type=1、role_code∈{admin,boss,super_admin}、id∈{1,2}）直接放行；
 *  2. 其余用户按路由映射到所需权限码（点分），与角色已授权码（支持通配符 repair.*）比对；
 *  3. 未映射路由：读(GET)放行，写(POST/PUT/DELETE)一律 403；
 *  4. 未授权统一返回 HTTP 403。
 */
class PermissionCheck
{
    protected $config = [
        'admin_role'  => 'admin',
        'boss_roles'  => ['admin', 'boss', 'super_admin'],
        'cache_ttl'   => 3600,
        'enable_cache'=> true,
    ];

    public function handle($request, \Closure $next)
    {
        $user = $request->user ?? null;
        if (!$user) {
            return json(['code' => 401, 'message' => '未登录或登录已过期', 'data' => null], 401);
        }

        // 老板/超管直接放行
        if ($this->isBoss($user)) {
            return $next($request);
        }

        // 计算所需权限码（点分）；null 表示该路由未纳入权限映射
        $required = $this->getPermissionCode($request);

        if ($required === null) {
            // 未映射资源：读放行，写拒绝
            if (strtoupper($request->method()) === 'GET') {
                return $next($request);
            }
            return $this->forbidden();
        }

        if (!$this->hasPermission($user, $required)) {
            return $this->forbidden();
        }

        return $next($request);
    }

    protected function forbidden()
    {
        return json(['code' => 403, 'message' => '无权访问', 'data' => null], 403);
    }

    /**
     * 是否老板/超管
     */
    protected function isBoss(array $user): bool
    {
        if (isset($user['role_type']) && ($user['role_type'] === 'admin' || $user['role_type'] === 'super_admin' || $user['role_type'] == 1)) {
            return true;
        }
        if (isset($user['id']) && ($user['id'] == 1 || $user['id'] == 2)) {
            return true;
        }
        $roleCode = $this->resolveRoleCode($user);
        if ($roleCode !== null && in_array($roleCode, $this->config['boss_roles'], true)) {
            return true;
        }
        return false;
    }

    /**
     * 解析用户角色编码（经 role_id 关联 roles.code，带缓存）
     */
    protected function resolveRoleCode(array $user): ?string
    {
        if (empty($user['role_id'])) {
            return null;
        }
        $roleId = (int) $user['role_id'];
        $cacheKey = 'role_code:' . $roleId;
        if ($this->config['enable_cache']) {
            $cached = Cache::get($cacheKey);
            if ($cached !== null && $cached !== false) {
                return $cached ?: null;
            }
        }
        $role = Role::find($roleId);
        $code = $role ? $role->code : null;
        if ($this->config['enable_cache']) {
            Cache::set($cacheKey, $code ?: '', $this->config['cache_ttl']);
        }
        return $code;
    }

    /**
     * 由路由推导所需权限码（点分）。返回 null 表示未纳入映射。
     *
     * 例：
     *  GET  /api/personnel            => system.personnel.view
     *  POST /api/personnel            => system.personnel.create
     *  GET  /api/repair-orders/5      => repair.orders.view
     *  POST /api/repair-orders/5/accept => repair.orders.edit
     */
    protected function getPermissionCode($request): ?string
    {
        $map = (array) config('permission.route_map');

        $path = trim($request->pathinfo(), '/');
        $segments = $path === '' ? [] : explode('/', $path);
        if (!empty($segments) && $segments[0] === 'api') {
            array_shift($segments);
        }
        if (empty($segments)) {
            return null;
        }

        $resource = $segments[0];
        if (!isset($map[$resource])) {
            return null; // 未映射
        }
        $module = $map[$resource];

        $method = strtoupper($request->method());
        $last = end($segments);
        $isNumericLast = is_numeric($last);

        // 自定义动作（如 accept/assign/sync/approve/reject/import/export/batch/...）→ 视为写
        $customVerb = null;
        if (in_array($method, ['POST', 'PUT'], true) && !$isNumericLast && count($segments) >= 2 && $last !== $resource) {
            $customVerb = $last;
        }

        switch ($method) {
            case 'GET':
                $action = $isNumericLast ? 'view' : 'view'; // 列表与详情均按 view
                break;
            case 'POST':
                $action = $customVerb ? 'edit' : 'create';
                break;
            case 'PUT':
                $action = 'edit';
                break;
            case 'DELETE':
                $action = 'delete';
                break;
            default:
                $action = 'view';
        }

        return $module . '.' . $action;
    }

    /**
     * 收集用户所有已授权权限（主角色 role_id + 多角色 user_roles），带缓存。
     *
     * @return array [ ['code'=>string, 'perms'=>['canView'=>bool,'canEdit'=>bool,'canDelete'=>bool]], ... ]
     */
    protected function getGranted(array $user): array
    {
        $roleIds = [];
        if (!empty($user['role_id'])) {
            $roleIds[] = (int) $user['role_id'];
        }
        if (!empty($user['id'])) {
            foreach (UserRole::where('user_id', (int) $user['id'])->column('role_id') as $rid) {
                $roleIds[] = (int) $rid;
            }
        }
        $roleIds = array_values(array_unique($roleIds));
        if (empty($roleIds)) {
            return [];
        }

        $cacheKey = 'granted:' . implode(',', $roleIds);
        if ($this->config['enable_cache']) {
            $cached = Cache::get($cacheKey);
            if (is_array($cached)) {
                return $cached;
            }
        }

        $rows = RolePermission::whereIn('role_id', $roleIds)->select();
        $out = [];
        foreach ($rows as $rp) {
            $perm = Permission::find($rp->permission_id);
            if (!$perm) continue;
            $perms = $rp->permissions;
            if (is_string($perms)) {
                $perms = json_decode($perms, true);
            }
            if (empty($perms) || !is_array($perms)) {
                $perms = ['canView' => true];
            }
            $out[] = ['code' => $perm->code, 'perms' => $perms];
        }

        if ($this->config['enable_cache']) {
            Cache::set($cacheKey, $out, $this->config['cache_ttl']);
        }
        return $out;
    }

    /**
     * 校验是否拥有指定权限码（点分 module.action）。
     *
     * 匹配优先级：
     *  1. 完全一致（按钮/接口码，如 system.users.create）；
     *  2. 通配符（repair.* 命中 repair.orders.*；* 命中全部）；
     *  3. 模块级授权 + 细粒度：授予模块菜单码（如 repair.orders）时，
     *     依 canView/canEdit/canDelete 放行 view / create,edit / delete。
     */
    protected function hasPermission(array $user, string $required): bool
    {
        $granted = $this->getGranted($user);
        if (empty($granted)) {
            return false;
        }

        // 拆分模块与动作：repair.orders.create -> module=repair.orders, action=create
        $pos = strrpos($required, '.');
        $module = $pos !== false ? substr($required, 0, $pos) : $required;
        $action = $pos !== false ? substr($required, $pos + 1) : 'view';

        foreach ($granted as $g) {
            $code = $g['code'];
            $perms = $g['perms'];

            // 1) 完全一致
            if ($code === $required) {
                return true;
            }
            // 2) 通配符
            if ($code === '*') {
                return true;
            }
            if (str_ends_with($code, '*')) {
                $prefix = rtrim($code, '*');
                if (str_starts_with($required, $prefix)) {
                    return true;
                }
                // 命名空间通配符（repair.* 也覆盖菜单命名空间 repair）
                if (rtrim($prefix, '.') === rtrim($module, '.')) {
                    return true;
                }
            }
            // 3) 模块级授权 + 细粒度
            if ($code === $module) {
                if ($action === 'view' && ($perms['canView'] ?? false)) return true;
                if (in_array($action, ['create', 'edit'], true) && ($perms['canEdit'] ?? false)) return true;
                if ($action === 'delete' && ($perms['canDelete'] ?? false)) return true;
            }
        }
        return false;
    }

    public static function clearCache(int $roleId): bool
    {
        return Cache::delete('role_permissions:' . $roleId);
    }

    public static function clearAllCache(): bool
    {
        return true;
    }
}
