<?php

namespace app\controller;

use app\service\RepairOrderService;
use think\facade\Request;

class RepairOrderController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new RepairOrderService();
    }

    /**
     * 获取订单列表
     */
    public function index()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');

            $filters = [
                'order_type' => Request::param('order_type', ''),
                'status' => Request::param('status', ''),
                'priority' => Request::param('priority', ''),
                'device_type' => Request::param('device_type', ''),
                'service_type' => Request::param('service_type', ''),
                'order_id' => Request::param('order_id', ''),
                'user_id' => Request::param('user_id', ''),
                'device_model' => Request::param('device_model', ''),
                'keyword' => Request::param('keyword', ''),
                'date_start' => Request::param('date_start', ''),
                'date_end' => Request::param('date_end', ''),
            ];

            $result = $this->service->getList($page, $limit, $filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取订单详情
     */
    public function read($id)
    {
        try {
            $result = $this->service->getDetail($id);
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 404);
        }
    }

    /**
     * 接单（分配维修人员）
     */
    public function accept($id)
    {
        try {
            $data = $this->getRequestData();
            $userId = intval($data['user_id'] ?? Request::param('user_id', 0, 'intval'));

            if (!$userId) {
                return $this->error('请选择维修人员', 422);
            }

            $result = $this->service->acceptOrder($id, $userId);
            return $this->success($result, '接单成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 更新订单状态
     */
    public function updateStatus($id)
    {
        try {
            $data = $this->getRequestData();

            if (!isset($data['status'])) {
                return $this->error('状态不能为空', 422);
            }

            $result = $this->service->updateStatus($id, $data['status'], $data);
            return $this->success($result, '状态更新成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取待处理订单列表
     */
    public function pending()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');

            $result = $this->service->getPendingList($page, $limit);
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取维修中订单列表
     */
    public function processing()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');

            $result = $this->service->getProcessingList($page, $limit);
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取统计信息
     */
    public function statistics()
    {
        try {
            $result = $this->service->getStatistics();
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }
}
