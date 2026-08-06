<?php

namespace app\controller;

use app\model\CustomerService;
use app\common\Result;

/**
 * 客服配置管理控制器
 */
class CustomerServiceController
{
    /**
     * 获取客服配置
     * GET /customer-services
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $keyword = request()->get('keyword', '');
        $type = request()->get('type', '');
        $status = request()->get('status', '');

        try {
            $query = CustomerService::order('id', 'desc');

            // 搜索功能
            if (!empty($keyword)) {
                $query->whereLike('name|account', '%' . $keyword . '%');
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
            $services = $query->page($page, $pageSize)->select();

            return Result::paginated(
                $services,
                $total,
                $page,
                $pageSize
            );
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取配置详情
     * GET /customer-services/{id}
     */
    public function read($id)
    {
        try {
            $service = CustomerService::find($id);

            if (!$service) {
                return Result::error('配置不存在', 404);
            }

            return Result::success($service);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建配置
     * POST /customer-services
     */
    public function save()
    {
        $data = request()->post();

        try {
            // 验证
            validate([
                'name' => 'require|max:100',
                'type' => 'require|in:qq,wechat,phone,email',
                'account' => 'require',
                'status' => 'in:active,inactive',
            ])->check($data);

            $service = CustomerService::create($data);

            return Result::success($service, '配置创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新配置
     * PUT /customer-services/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $service = CustomerService::find($id);

            if (!$service) {
                return Result::error('配置不存在', 404);
            }

            // 验证
            validate([
                'name' => 'require|max:100',
                'type' => 'require|in:qq,wechat,phone,email',
                'account' => 'require',
                'status' => 'in:active,inactive',
            ])->check($data);

            $service->save($data);

            return Result::success($service, '配置更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除配置
     * DELETE /customer-services/{id}
     */
    public function delete($id)
    {
        try {
            $service = CustomerService::find($id);

            if (!$service) {
                return Result::error('配置不存在', 404);
            }

            $service->delete();

            return Result::success(null, '配置删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
