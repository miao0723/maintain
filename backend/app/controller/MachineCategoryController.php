<?php

namespace app\controller;

use app\model\MachineCategory;
use app\common\Result;

/**
 * 机械分类管理控制器
 */
class MachineCategoryController
{
    /**
     * 获取分类列表（树形）
     * GET /machine-categories
     */
    public function index()
    {
        try {
            $categories = MachineCategory::order('sort_order', 'asc')->select();

            // 构建树形结构
            $tree = $this->buildTree($categories->toArray());

            return Result::success($tree);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取分类详情
     * GET /machine-categories/{id}
     */
    public function read($id)
    {
        try {
            $category = MachineCategory::with(['parent', 'children', 'machines'])->find($id);

            if (!$category) {
                return Result::error('分类不存在', 404);
            }

            return Result::success($category);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建分类
     * POST /machine-categories
     */
    public function save()
    {
        $data = request()->post();

        try {
            // 验证
            validate([
                'name' => 'require|unique:machine_category',
                'code' => 'require|unique:machine_category',
            ])->check($data);

            $category = MachineCategory::create($data);

            return Result::success($category, '分类创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新分类
     * PUT /machine-categories/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $category = MachineCategory::find($id);

            if (!$category) {
                return Result::error('分类不存在', 404);
            }

            // 验证
            validate([
                'name' => 'require|unique:machine_category,name,' . $id,
                'code' => 'require|unique:machine_category,code,' . $id,
            ])->check($data);

            $category->save($data);

            return Result::success($category, '分类更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除分类
     * DELETE /machine-categories/{id}
     */
    public function delete($id)
    {
        try {
            $category = MachineCategory::find($id);

            if (!$category) {
                return Result::error('分类不存在', 404);
            }

            // 检查是否有子分类
            if ($category->children()->count() > 0) {
                return Result::error('该分类下有子分类，无法删除', 400);
            }

            // 检查是否有机械
            if ($category->machines()->count() > 0) {
                return Result::error('该分类下有机械，无法删除', 400);
            }

            $category->delete();

            return Result::success(null, '分类删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 构建树形结构
     */
    private function buildTree($categories, $parentId = null)
    {
        $tree = [];

        foreach ($categories as $category) {
            if ($category['parent_id'] == $parentId) {
                $children = $this->buildTree($categories, $category['id']);

                if (!empty($children)) {
                    $category['children'] = $children;
                }

                $tree[] = $category;
            }
        }

        return $tree;
    }
}
