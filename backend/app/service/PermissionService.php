<?php

namespace app\service;

use app\model\Role;
use app\model\RolePermission;
use app\model\Permission;
use app\model\UserRole;

/**
 * 权限解析服务：给定用户，产出其有效权限（供登录返回 / 菜单级 / 按钮级使用）
 */
class PermissionService
{
    /**
     * 汇总用户的全部权限码（主角色 + 多角色）
     *
     * @return string[]
     */
    public static function grantedCodes(int $userId, ?int $roleId): array
    {
        $roleIds = [];
        if ($roleId) {
            $roleIds[] = (int) $roleId;
        }
        foreach (UserRole::where('user_id', $userId)->column('role_id') as $rid) {
            $roleIds[] = (int) $rid;
        }
        $roleIds = array_values(array_unique($roleIds));
        if (empty($roleIds)) {
            return [];
        }
        $permIds = RolePermission::whereIn('role_id', $roleIds)->column('permission_id');
        if (empty($permIds)) {
            return [];
        }
        return array_values(array_unique(Permission::whereIn('id', array_unique($permIds))->column('code')));
    }

    /**
     * 判断授权码 codes 是否覆盖目标码 required（菜单/按钮/接口通用）。
     * 支持：* 全通、完全一致、通配符 repair.*、模块祖先(g 是 r 的上级)、命名空间(r 是 g 的上级)。
     */
    public static function match(array $codes, string $required): bool
    {
        foreach ($codes as $g) {
            if (!$g) continue;
            if ($g === '*') return true;
            if ($g === $required) return true;
            // 通配符：repair.* -> repair.
            if (str_ends_with($g, '*')) {
                $prefix = rtrim($g, '*');
                if (str_starts_with($required, $prefix)) return true;
                if (rtrim($prefix, '.') === rtrim($required, '.')) return true;
            }
            // 模块祖先：授予 repair.orders 覆盖 repair.orders.view
            if (str_starts_with($required . '.', $g . '.')) return true;
            // 命名空间：授予 system.users 覆盖命名空间 system
            if (str_starts_with($g . '.', $required . '.')) return true;
        }
        return false;
    }

    /**
     * 构建前端所需的权限载荷
     */
    public static function forUser(array $user): array
    {
        $userId = (int) ($user['id'] ?? 0);
        $roleId = $user['role_id'] ?? null;

        // 老板/超管判定（与 PermissionCheck 保持一致）
        $isBoss = ((int) ($user['role_type'] ?? 0) === 1)
            || in_array($userId, [1, 2], true)
            || self::isBossRoleCode($roleId);

        $codes = $isBoss ? ['*'] : self::grantedCodes($userId, $roleId);

        // 角色信息
        $role = null;
        if ($roleId) {
            $r = Role::find($roleId);
            if ($r) {
                $role = ['id' => $r->id, 'code' => $r->code, 'name' => $r->name];
            }
        }

        return [
            'is_boss'  => $isBoss,
            'role'     => $role,
            'role_type'=> (int) ($user['role_type'] ?? 0),
            'codes'    => $codes,     // 按钮级 / 接口级判定用
            'menus'    => self::menuTree($isBoss, $codes),
        ];
    }

    protected static function isBossRoleCode($roleId): bool
    {
        if (!$roleId) return false;
        $r = Role::find($roleId);
        return $r && in_array($r->code, ['admin', 'boss', 'super_admin'], true);
    }

    /**
     * 菜单树（type=menu）。老板返回全部；其余按 codes 命中过滤。
     */
    public static function menuTree(bool $isBoss, array $codes): array
    {
        $all = Permission::where('type', 'menu')->where('status', 1)->order('sort', 'asc')->select()->toArray();
        if ($isBoss) {
            return self::buildTree($all, 0);
        }
        $filtered = array_filter($all, function ($p) use ($codes) {
            return self::match($codes, $p['code']);
        });
        return self::buildTree(array_values($filtered), 0);
    }

    protected static function buildTree(array $items, $parentId): array
    {
        $tree = [];
        foreach ($items as $it) {
            if ((int) ($it['parent_id'] ?? 0) === (int) $parentId) {
                $children = self::buildTree($items, $it['id']);
                $node = [
                    'id'   => $it['id'],
                    'code' => $it['code'],
                    'name' => $it['name'],
                    'path' => $it['path'] ?? null,
                    'icon' => $it['icon'] ?? null,
                ];
                if ($children) {
                    $node['children'] = $children;
                }
                $tree[] = $node;
            }
        }
        return $tree;
    }
}
