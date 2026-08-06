<?php

namespace app\controller;

use app\model\Department;
use app\common\Result;

class DepartmentController
{
    /**
     * 获取部门列表（树形结构）
     * GET /departments
     */
    public function index()
    {
        try {
            $departments = Department::with(['parent', 'manager'])
                ->order('sort_order', 'asc')
                ->select();

            // 构建树形结构
            $tree = $this->buildTree($departments->toArray());

            return Result::success(['list' => $tree, 'total' => count($tree)]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取部门详情
     * GET /departments/{id}
     */
    public function read($id)
    {
        try {
            $department = Department::with(['parent', 'manager', 'users'])->find($id);

            if (!$department) {
                return Result::error('部门不存在', 404);
            }

            return Result::success($department);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建部门
     * POST /departments
     */
    public function save()
    {
        $data = request()->post();

        try {
            $department = Department::create($data);

            return Result::success($department, '部门创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新部门
     * PUT /departments/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $department = Department::find($id);

            if (!$department) {
                return Result::error('部门不存在', 404);
            }

            $department->save($data);

            return Result::success($department, '部门更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除部门
     * DELETE /departments/{id}
     */
    public function delete($id)
    {
        try {
            $department = Department::find($id);

            if (!$department) {
                return Result::error('部门不存在', 404);
            }

            // 检查是否有子部门
            if ($department->children()->count() > 0) {
                return Result::error('该部门下有子部门，无法删除', 400);
            }

            // 检查是否有用户
            if ($department->users()->count() > 0) {
                return Result::error('该部门下有用户，无法删除', 400);
            }

            $department->delete();

            return Result::success(null, '部门删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 构建树形结构
     */
    private function buildTree($departments, $parentId = null)
    {
        $tree = [];

        foreach ($departments as $department) {
            if ($department['parent_id'] == $parentId) {
                $children = $this->buildTree($departments, $department['id']);

                if (!empty($children)) {
                    $department['children'] = $children;
                }

                $tree[] = $department;
            }
        }

        return $tree;
    }
}