<?php

namespace app\controller;

use app\model\CaseStudy;
use app\common\Result;

/**
 * 成功案例管理控制器
 */
class CaseController
{
    /**
     * 获取案例列表
     * GET /cases
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $keyword = request()->get('keyword', '');
        $category = request()->get('category', '');
        $status = request()->get('status', '');

        try {
            $query = CaseStudy::order('id', 'desc');

            // 搜索功能
            if (!empty($keyword)) {
                $query->whereLike('title|description|content', '%' . $keyword . '%');
            }

            // 分类筛选
            if (!empty($category)) {
                $query->where('category', $category);
            }

            // 状态筛选
            if (!empty($status)) {
                $query->where('status', $status);
            }

            $total = $query->count();
            $cases = $query->page($page, $pageSize)->select();

            return Result::paginated(
                $cases,
                $total,
                $page,
                $pageSize
            );
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取案例详情
     * GET /cases/{id}
     */
    public function read($id)
    {
        try {
            $case = CaseStudy::find($id);

            if (!$case) {
                return Result::error('案例不存在', 404);
            }

            return Result::success($case);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建案例
     * POST /cases
     */
    public function save()
    {
        $data = request()->post();

        try {
            // 验证
            validate([
                'title' => 'require|max:200',
                'description' => 'require|max:500',
                'content' => 'require',
                'category' => 'require',
                'status' => 'in:draft,published',
            ])->check($data);

            $case = CaseStudy::create($data);

            return Result::success($case, '案例创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新案例
     * PUT /cases/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $case = CaseStudy::find($id);

            if (!$case) {
                return Result::error('案例不存在', 404);
            }

            // 验证
            validate([
                'title' => 'require|max:200',
                'description' => 'require|max:500',
                'content' => 'require',
                'category' => 'require',
                'status' => 'in:draft,published',
            ])->check($data);

            $case->save($data);

            return Result::success($case, '案例更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除案例
     * DELETE /cases/{id}
     */
    public function delete($id)
    {
        try {
            $case = CaseStudy::find($id);

            if (!$case) {
                return Result::error('案例不存在', 404);
            }

            $case->delete();

            return Result::success(null, '案例删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
