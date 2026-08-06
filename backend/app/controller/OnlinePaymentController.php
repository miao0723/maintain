<?php

namespace app\controller;

use app\common\Result;
use app\service\RepairOrderService;

/**
 * 在线支付 / 维修订单管理控制器
 * 数据来源：repair 数据库的 orders 表
 */
class OnlinePaymentController
{
    /**
     * 获取订单列表（分页 + 筛选）
     * GET /payment/online
     */
    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $orderId = trim((string) request()->get('order_id', ''));
        $status = trim((string) request()->get('status', ''));
        $deviceType = trim((string) request()->get('device_type', ''));
        $serviceType = trim((string) request()->get('service_type', ''));
        $priority = trim((string) request()->get('priority', ''));
        $orderType = trim((string) request()->get('order_type', ''));
        $keyword = trim((string) request()->get('keyword', ''));
        $dateRange = request()->get('date_range', '');

        $filters = [
            'order_type'   => $orderType,
            'status'       => $status,
            'priority'     => $priority,
            'device_type'  => $deviceType,
            'service_type' => $serviceType,
            'order_id'     => $orderId,
            'device_model' => trim((string) request()->get('device_model', '')),
            'keyword'      => $keyword,
        ];

        if (!empty($dateRange)) {
            $dates = explode(',', $dateRange);
            if (count($dates) === 2) {
                $filters['date_start'] = $dates[0];
                $filters['date_end'] = $dates[1];
            }
        }

        try {
            $service = new RepairOrderService();
            $result = $service->getList($page, $pageSize, $filters);
            return Result::paginated($result['list'], $result['total'], $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取订单统计
     * GET /payment/online/statistics
     */
    public function statistics()
    {
        try {
            $service = new RepairOrderService();
            $result = $service->getStatistics();
            return Result::success($result);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 小程序订单数据分析（多维度）
     * GET /payment/online/analytics
     */
    public function analytics()
    {
        $filters = [];
        $dateRange = request()->get('date_range', '');
        if (!empty($dateRange)) {
            $dates = explode(',', $dateRange);
            if (count($dates) === 2) {
                $filters['date_start'] = $dates[0];
                $filters['date_end'] = $dates[1];
            }
        }

        try {
            $service = new RepairOrderService();
            $result = $service->getAnalytics($filters);
            return Result::success($result);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取订单详情
     * GET /payment/online/{id}
     */
    public function read($id)
    {
        try {
            $service = new RepairOrderService();
            $result = $service->getDetail($id);
            return Result::success($result);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 404);
        }
    }

    /**
     * 更新订单状态（后台校正）
     * PUT /payment/online/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            if (!isset($data['status']) || $data['status'] === '') {
                return Result::error('状态不能为空', 422);
            }

            $service = new RepairOrderService();
            $result = $service->updateStatus($id, $data['status'], $data);
            return Result::success($result, '状态更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 维修订单不支持创建支付记录
     */
    public function save()
    {
        return Result::error('维修订单不支持该操作', 405);
    }

    /**
     * 维修订单不支持删除
     */
    public function delete($id)
    {
        return Result::error('维修订单不支持删除', 405);
    }

    /**
     * 维修订单不支持退款
     */
    public function refund($id)
    {
        return Result::error('维修订单不支持退款', 405);
    }
}
