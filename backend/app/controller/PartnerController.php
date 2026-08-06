<?php

namespace app\controller;

use app\model\Partner;
use app\common\Result;

/**
 * 合作企业管理控制器
 */
class PartnerController
{
    /**
     * 获取企业列表
     * GET /partners
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $keyword = request()->get('keyword', '');
        $type = request()->get('type', '');
        $status = request()->get('status', '');

        try {
            $query = Partner::order('id', 'desc');

            // 搜索功能
            if (!empty($keyword)) {
                $query->whereLike('name|contact_person|phone', '%' . $keyword . '%');
            }

            // 类型筛选
            if (!empty($type)) {
                $query->where('type', $type);
            }

            // 状态筛选
            if (!empty($status)) {
                $query->where('status', $status);
            }

            $total = $query->count();
            $partners = $query->page($page, $pageSize)->select();

            return Result::paginated(
                $partners,
                $total,
                $page,
                $pageSize
            );
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取企业详情
     * GET /partners/{id}
     */
    public function read($id)
    {
        try {
            $partner = Partner::find($id);

            if (!$partner) {
                return Result::error('企业不存在', 404);
            }

            return Result::success($partner);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建企业
     * POST /partners
     */
    public function save()
    {
        $data = request()->post();

        try {
            // 验证
            validate([
                'name' => 'require|max:200',
                'type' => 'require|in:supplier,customer,other',
                'contact_person' => 'require|max:100',
                'phone' => 'require|max:20',
                'email' => 'email|max:100',
                'address' => 'max:500',
                'status' => 'in:active,inactive',
            ])->check($data);

            $partner = Partner::create($data);

            return Result::success($partner, '企业创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新企业
     * PUT /partners/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $partner = Partner::find($id);

            if (!$partner) {
                return Result::error('企业不存在', 404);
            }

            // 验证
            validate([
                'name' => 'require|max:200',
                'type' => 'require|in:supplier,customer,other',
                'contact_person' => 'require|max:100',
                'phone' => 'require|max:20',
                'email' => 'email|max:100',
                'address' => 'max:500',
                'status' => 'in:active,inactive',
            ])->check($data);

            $partner->save($data);

            return Result::success($partner, '企业更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除企业
     * DELETE /partners/{id}
     */
    public function delete($id)
    {
        try {
            $partner = Partner::find($id);

            if (!$partner) {
                return Result::error('企业不存在', 404);
            }

            // 检查是否有关联记录
            if ($partner->orders()->count() > 0 || $partner->contracts()->count() > 0) {
                return Result::error('该企业有关联记录，无法删除', 400);
            }

            $partner->delete();

            return Result::success(null, '企业删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
