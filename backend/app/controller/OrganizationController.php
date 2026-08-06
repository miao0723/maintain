<?php

namespace app\controller;

use app\model\Organization;
use app\common\Result;

class OrganizationController
{
    /**
     * 获取单位列表（树形结构）
     * GET /organizations
     */
    public function index()
    {
        try {
            $organizations = Organization::with(['parent'])
                ->order('sort', 'asc')
                ->select();

            // 构建树形结构
            $tree = $this->buildTree($organizations->toArray());

            return Result::success(['list' => $tree, 'total' => count($tree)]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取单位详情
     * GET /organizations/{id}
     */
    public function read($id)
    {
        try {
            $organization = Organization::with(['parent', 'children'])->find($id);

            if (!$organization) {
                return Result::error('单位不存在', 404);
            }

            return Result::success($organization);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建单位
     * POST /organizations
     */
    public function save()
    {
        $data = request()->post();

        try {
            $organization = Organization::create($data);

            return Result::success($organization, '单位创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新单位
     * PUT /organizations/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $organization = Organization::find($id);
            if (!$organization) {
                return Result::error('单位不存在', 404);
            }

            $organization->save($data);

            return Result::success($organization, '单位更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除单位
     * DELETE /organizations/{id}
     */
    public function delete($id)
    {
        try {
            $organization = Organization::find($id);
            if (!$organization) {
                return Result::error('单位不存在', 404);
            }

            // 检查是否有子单位
            $hasChildren = Organization::where('parent_id', $id)->count() > 0;
            if ($hasChildren) {
                return Result::error('该单位下有子单位，无法删除', 400);
            }

            $organization->delete();

            return Result::success(null, '单位删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 构建树形结构
     */
    protected function buildTree(array $items, int $parentId = null): array
    {
        $branch = [];

        foreach ($items as $item) {
            if ($item['parent_id'] == $parentId) {
                $children = $this->buildTree($items, $item['id']);
                if ($children) {
                    $item['children'] = $children;
                }
                $branch[] = $item;
            }
        }

        return $branch;
    }
}
