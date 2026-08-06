<?php

namespace app\controller;

use app\common\Result;
use app\service\RepairOrderService;

/**
 * 小程序后台 - 支付记录 / 维修订单管理控制器
 * 数据来源：repair 数据库的 orders 表
 */
class MiniAdminPaymentController extends MiniAdminBaseController
{
    /**
     * 获取订单列表（分页 + 筛选）
     * GET /payments
     */
    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $keyword = trim((string) request()->get('keyword', ''));
        $status = trim((string) request()->get('status', ''));
        $deviceType = trim((string) request()->get('device_type', ''));
        $serviceType = trim((string) request()->get('service_type', ''));
        $priority = trim((string) request()->get('priority', ''));
        $orderId = trim((string) request()->get('order_id', ''));

        $filters = [
            'status'       => $status,
            'device_type'  => $deviceType,
            'service_type' => $serviceType,
            'priority'     => $priority,
            'order_id'     => $orderId,
            'keyword'      => $keyword,
        ];

        try {
            $service = new RepairOrderService();
            $result = $service->getList($page, $pageSize, $filters);
            return Result::success([
                'items'    => $result['list'],
                'total'    => $result['total'],
                'page'     => $page,
                'pageSize' => $pageSize,
            ]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取订单详情
     * GET /payments/{id}
     */
    public function read($id)
    {
        try {
            $service = new RepairOrderService();
            $item = $service->getDetail($id);
            if (!$item) {
                return Result::error('订单不存在', 404);
            }
            return Result::success($item);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 404);
        }
    }

    /**
     * 更新订单状态（后台校正）
     * PUT /payments/{id}
     */
    public function update($id)
    {
        $data = $this->getRequestData();
        if (!isset($data['status']) || $data['status'] === '') {
            return Result::error('状态不能为空', 422);
        }

        try {
            $service = new RepairOrderService();
            $result = $service->updateStatus($id, $data['status'], $data);
            return Result::success($result, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 维修订单不允许删除
     */
    public function delete($id)
    {
        return Result::error('维修订单不允许删除', 405);
    }
}
