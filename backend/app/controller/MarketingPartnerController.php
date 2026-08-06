<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

/**
 * 合作伙伴控制器
 * 表: marketing_partners
 */
class MarketingPartnerController
{
    /**
     * 获取合作伙伴列表
     * GET /api/marketing/partners
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $status = request()->get('status', '');
        $industry = request()->get('industry', '');
        $cooperationType = request()->get('cooperation_type', '');
        $keyword = request()->get('keyword', '');

        try {
            $query = Db::name('marketing_partners');

            // 状态筛选
            if ($status !== '') {
                $query->where('status', $status);
            }

            // 行业筛选
            if (!empty($industry)) {
                $query->where('industry', $industry);
            }

            // 合作类型筛选
            if (!empty($cooperationType)) {
                $query->where('cooperation_type', $cooperationType);
            }

            // 关键词搜索
            if (!empty($keyword)) {
                $query->whereLike('name|contact_person', '%' . $keyword . '%');
            }

            $total = $query->count();
            $list = $query->order('id', 'desc')
                ->page($page, $pageSize)
                ->select();

            return Result::paginated($list, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取合作伙伴详情
     * GET /api/marketing/partners/:id
     */
    public function read($id)
    {
        try {
            $partner = Db::name('marketing_partners')->find($id);

            if (!$partner) {
                return Result::error('合作伙伴不存在', 404);
            }

            return Result::success($partner);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建合作伙伴
     * POST /api/marketing/partners
     */
    public function save()
    {
        $data = request()->post();

        // 验证必填字段
        if (empty($data['name'])) {
            return Result::error('企业名称不能为空', 400);
        }
        if (empty($data['industry'])) {
            return Result::error('所属行业不能为空', 400);
        }
        if (empty($data['contact_person'])) {
            return Result::error('联系人不能为空', 400);
        }
        if (empty($data['contact_phone'])) {
            return Result::error('联系电话不能为空', 400);
        }
        if (empty($data['cooperation_type'])) {
            return Result::error('合作类型不能为空', 400);
        }

        try {
            $data['created_at'] = date('Y-m-d H:i:s');
            $data['updated_at'] = date('Y-m-d H:i:s');

            $id = Db::name('marketing_partners')->insertGetId($data);
            $partner = Db::name('marketing_partners')->find($id);

            return Result::success($partner, '合作伙伴创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新合作伙伴
     * PUT /api/marketing/partners/:id
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $partner = Db::name('marketing_partners')->find($id);

            if (!$partner) {
                return Result::error('合作伙伴不存在', 404);
            }

            // 验证必填字段
            if (isset($data['name']) && empty($data['name'])) {
                return Result::error('企业名称不能为空', 400);
            }
            if (isset($data['industry']) && empty($data['industry'])) {
                return Result::error('所属行业不能为空', 400);
            }
            if (isset($data['contact_person']) && empty($data['contact_person'])) {
                return Result::error('联系人不能为空', 400);
            }
            if (isset($data['contact_phone']) && empty($data['contact_phone'])) {
                return Result::error('联系电话不能为空', 400);
            }
            if (isset($data['cooperation_type']) && empty($data['cooperation_type'])) {
                return Result::error('合作类型不能为空', 400);
            }

            $data['updated_at'] = date('Y-m-d H:i:s');

            Db::name('marketing_partners')->where('id', $id)->update($data);
            $partner = Db::name('marketing_partners')->find($id);

            return Result::success($partner, '合作伙伴更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除合作伙伴
     * DELETE /api/marketing/partners/:id
     */
    public function delete($id)
    {
        try {
            $partner = Db::name('marketing_partners')->find($id);

            if (!$partner) {
                return Result::error('合作伙伴不存在', 404);
            }

            Db::name('marketing_partners')->delete($id);

            return Result::success(null, '合作伙伴删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}