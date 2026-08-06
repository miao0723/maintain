<?php

namespace app\controller;

use app\model\Role;
use app\model\RolePermission;
use app\common\Result;
use think\facade\Db;

/**
 * 角色管理控制器
 */
class RoleController
{
    /**
     * 获取角色列表
     * GET /roles
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $keyword = request()->get('keyword', '');

        try {
            $query = Role::order('id', 'desc');

            // 搜索功能
            if (!empty($keyword)) {
                $query->whereLike('name|description', '%' . $keyword . '%');
            }

            $total = $query->count();
            $roles = $query->page($page, $pageSize)->select();

            return Result::paginated($roles, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取角色详情
     * GET /roles/{id}
     */
    public function read($id)
    {
        try {
            $role = Role::with(['permissions'])->find($id);

            if (!$role) {
                return Result::error('角色不存在', 404);
            }

            return Result::success($role);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建角色
     * POST /roles
     */
    public function save()
    {
        $data = request()->post();

        try {
            // 验证
            validate([
                'name' => 'require|unique:role',
                'description' => 'max:255',
            ])->check($data);

            $role = Role::create($data);

            return Result::success($role, '角色创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新角色
     * PUT /roles/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $role = Role::find($id);

            if (!$role) {
                return Result::error('角色不存在', 404);
            }

            // 验证
            validate([
                'name' => 'require|unique:role,name,' . $id,
                'description' => 'max:255',
            ])->check($data);

            $role->save($data);

            return Result::success($role, '角色更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除角色
     * DELETE /roles/{id}
     */
    public function delete($id)
    {
        try {
            $role = Role::find($id);

            if (!$role) {
                return Result::error('角色不存在', 404);
            }

            // 检查是否有用户关联
            if ($role->users()->count() > 0) {
                return Result::error('该角色下有用户，无法删除', 400);
            }

            $role->delete();

            return Result::success(null, '角色删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取角色权限
     * GET /roles/{id}/permissions
     */
    public function getPermissions($id)
    {
        try {
            $role = Role::find($id);

            if (!$role) {
                return Result::error('角色不存在', 404);
            }

            // 获取角色关联的权限及细粒度配置
            $rolePermissions = RolePermission::where('role_id', $id)->select();

            $result = [];
            foreach ($rolePermissions as $rp) {
                // 兼容旧数据，如果没有 permissions 字段则使用默认值
                $perms = $rp->permissions;
                if (is_string($perms)) {
                    $perms = json_decode($perms, true);
                }
                if (empty($perms) || !is_array($perms)) {
                    $perms = ['canView' => true];
                }

                $result[] = [
                    'id' => $rp->permission_id,
                    'code' => $rp->permission ? $rp->permission->code : '',
                    'permissions' => $perms
                ];
            }

            return Result::success(['permissions' => $result]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 设置角色权限
     * POST /roles/{id}/permissions
     */
    public function setPermissions($id)
    {
        $data = request()->post();
        $permissions = $data['permissions'] ?? [];

        try {
            $role = Role::find($id);

            if (!$role) {
                return Result::error('角色不存在', 404);
            }

            // 验证
            validate([
                'permissions' => 'require|array',
            ])->check($data);

            Db::startTrans();
            try {
                // 删除角色现有权限
                RolePermission::where('role_id', $id)->delete();

                // 添加新权限
                foreach ($permissions as $perm) {
                    // 默认权限配置
                    $defaultPerms = ['canView' => true];
                    $userPerms = $perm['permissions'] ?? $defaultPerms;

                    // 确保至少有查看权限
                    if (!isset($userPerms['canView'])) {
                        $userPerms['canView'] = true;
                    }

                    RolePermission::create([
                        'role_id' => $id,
                        'permission_id' => $perm['id'],
                        'permissions' => $userPerms
                    ]);
                }

                Db::commit();
                return Result::success(null, '权限设置成功');
            } catch (\Exception $e) {
                Db::rollback();
                throw $e;
            }
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
