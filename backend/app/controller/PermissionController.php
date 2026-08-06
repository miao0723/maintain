<?php

namespace app\controller;

use app\model\Permission;
use app\common\Result;

/**
 * 权限管理控制器
 */
class PermissionController
{
    /**
     * 获取权限列表（树形结构）
     * GET /permissions
     */
    public function index()
    {
        try {
            $permissions = Permission::order('sort', 'asc')->select();

            // 构建树形结构
            $tree = $this->buildTree($permissions->toArray());

            return Result::success(['list' => $tree, 'total' => count($tree)]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取权限详情
     * GET /permissions/{id}
     */
    public function read($id)
    {
        try {
            $permission = Permission::with(['parent', 'children'])->find($id);

            if (!$permission) {
                return Result::error('权限不存在', 404);
            }

            return Result::success($permission);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建权限
     * POST /permissions
     */
    public function save()
    {
        $data = request()->post();

        try {
            // 验证
            validate([
                'name' => 'require|unique:permission',
                'code' => 'require|unique:permission',
                'type' => 'require|in:menu,button,api',
            ])->check($data);

            $permission = Permission::create($data);

            return Result::success($permission, '权限创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新权限
     * PUT /permissions/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $permission = Permission::find($id);

            if (!$permission) {
                return Result::error('权限不存在', 404);
            }

            // 验证
            validate([
                'name' => 'require|unique:permission,name,' . $id,
                'code' => 'require|unique:permission,code,' . $id,
                'type' => 'require|in:menu,button,api',
            ])->check($data);

            $permission->save($data);

            return Result::success($permission, '权限更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除权限
     * DELETE /permissions/{id}
     */
    public function delete($id)
    {
        try {
            $permission = Permission::find($id);

            if (!$permission) {
                return Result::error('权限不存在', 404);
            }

            // 检查是否有子权限
            if ($permission->children()->count() > 0) {
                return Result::error('该权限下有子权限，无法删除', 400);
            }

            // 检查是否有角色关联
            if ($permission->roles()->count() > 0) {
                return Result::error('该权限已关联角色，无法删除', 400);
            }

            $permission->delete();

            return Result::success(null, '权限删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 构建树形结构
     */
    private function buildTree($permissions, $parentId = null)
    {
        $tree = [];

        foreach ($permissions as $permission) {
            if ($permission['parent_id'] == $parentId) {
                $children = $this->buildTree($permissions, $permission['id']);

                if (!empty($children)) {
                    $permission['children'] = $children;
                }

                $tree[] = $permission;
            }
        }

        return $tree;
    }
}
