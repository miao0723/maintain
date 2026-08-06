<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

/**
 * 案例管理控制器
 * 表: marketing_cases
 */
class MarketingCaseController
{
    /**
     * 获取案例列表
     * GET /api/marketing/cases
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $status = request()->get('status', '');
        $industry = request()->get('industry', '');
        $keyword = request()->get('keyword', '');

        try {
            $query = Db::name('marketing_cases');

            // 状态筛选
            if ($status !== '') {
                $query->where('status', $status);
            }

            // 行业筛选
            if (!empty($industry)) {
                $query->where('industry', $industry);
            }

            // 关键词搜索
            if (!empty($keyword)) {
                $query->whereLike('title|client_name', '%' . $keyword . '%');
            }

            $total = $query->count();
            $list = $query->order('sort', 'asc')
                ->order('id', 'desc')
                ->page($page, $pageSize)
                ->select();

            return Result::paginated($list, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取案例详情
     * GET /api/marketing/cases/:id
     */
    public function read($id)
    {
        try {
            $case = Db::name('marketing_cases')->find($id);

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
     * POST /api/marketing/cases
     */
    public function save()
    {
        $data = request()->post();

        // 验证必填字段
        if (empty($data['title'])) {
            return Result::error('案例标题不能为空', 400);
        }
        if (empty($data['client_name'])) {
            return Result::error('客户名称不能为空', 400);
        }
        if (empty($data['industry'])) {
            return Result::error('行业不能为空', 400);
        }

        try {
            $data['created_at'] = date('Y-m-d H:i:s');
            $data['updated_at'] = date('Y-m-d H:i:s');

            $id = Db::name('marketing_cases')->insertGetId($data);
            $case = Db::name('marketing_cases')->find($id);

            return Result::success($case, '案例创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新案例
     * PUT /api/marketing/cases/:id
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $case = Db::name('marketing_cases')->find($id);

            if (!$case) {
                return Result::error('案例不存在', 404);
            }

            // 验证必填字段
            if (isset($data['title']) && empty($data['title'])) {
                return Result::error('案例标题不能为空', 400);
            }
            if (isset($data['client_name']) && empty($data['client_name'])) {
                return Result::error('客户名称不能为空', 400);
            }
            if (isset($data['industry']) && empty($data['industry'])) {
                return Result::error('行业不能为空', 400);
            }

            $data['updated_at'] = date('Y-m-d H:i:s');

            Db::name('marketing_cases')->where('id', $id)->update($data);
            $case = Db::name('marketing_cases')->find($id);

            return Result::success($case, '案例更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除案例
     * DELETE /api/marketing/cases/:id
     */
    public function delete($id)
    {
        try {
            $case = Db::name('marketing_cases')->find($id);

            if (!$case) {
                return Result::error('案例不存在', 404);
            }

            Db::name('marketing_cases')->delete($id);

            return Result::success(null, '案例删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}