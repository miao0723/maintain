<?php

namespace app\controller;

use app\service\WorkOrderService;
use app\validate\WorkOrderValidate;
use app\common\Result;

class WorkOrderController
{
    private $service;

    public function __construct()
    {
        $this->service = new WorkOrderService();
    }

    /**
     * 获取工单列表
     * GET /api/workorders
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $limit = request()->get('pageSize', 20);

        $filters = [
            'status' => request()->get('status', ''),
            'priority' => request()->get('priority', ''),
            'device_id' => request()->get('device_id', ''),
            'assigned_to' => request()->get('assigned_to', ''),
            'reporter_id' => request()->get('reporter_id', ''),
            'start_date' => request()->get('start_date', ''),
            'end_date' => request()->get('end_date', ''),
            'keyword' => request()->get('keyword', ''),
        ];

        $result = $this->service->getList($page, $limit, $filters);

        return Result::success([
            'list' => $result['list'],
            'total' => $result['total'],
            'page' => $result['page'],
            'limit' => $result['limit'],
        ]);
    }

    /**
     * 获取工单详情
     * GET /api/workorders/{id}
     */
    public function read($id)
    {
        try {
            $order = $this->service->getDetail($id);
            return Result::success($order);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 404);
        }
    }

    /**
     * 创建工单
     * POST /api/workorders
     */
    public function save()
    {
        $data = $this->getRequestData();
        $reporterId = request()->userId;

        // 验证输入
        try {
            validate(WorkOrderValidate::class)
                ->scene('create')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $order = $this->service->create($data, $reporterId);
            return Result::success($order, '创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 更新工单
     * PUT /api/workorders/{id}
     */
    public function update($id)
    {
        $data = $this->getRequestData();
        $operatorId = request()->userId;

        // 验证输入
        try {
            validate(WorkOrderValidate::class)
                ->scene('update')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $order = $this->service->update($id, $data, $operatorId);
            return Result::success($order, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 删除工单
     * DELETE /api/workorders/{id}
     */
    public function delete($id)
    {
        try {
            $this->service->delete($id);
            return Result::success(null, '删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 指派工单
     * POST /api/workorders/{id}/assign
     */
    public function assign($id)
    {
        $data = $this->getRequestData();
        $operatorId = request()->userId;

        // 验证输入
        try {
            validate(WorkOrderValidate::class)
                ->scene('assign')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $order = $this->service->assign($id, $data['assigned_to'], $operatorId);
            return Result::success($order, '指派成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 维修人员接单
     * POST /api/workorders/{id}/accept
     */
    public function accept($id)
    {
        $engineerId = request()->userId;

        try {
            $order = $this->service->accept($id, $engineerId);
            return Result::success($order, '接单成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 开始维修
     * POST /api/workorders/{id}/start
     */
    public function start($id)
    {
        $engineerId = request()->userId;

        try {
            $order = $this->service->start($id, $engineerId);
            return Result::success($order, '开始维修');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 完成维修
     * POST /api/workorders/{id}/complete
     */
    public function complete($id)
    {
        $data = $this->getRequestData();
        $engineerId = request()->userId;

        // 验证输入
        try {
            validate(WorkOrderValidate::class)
                ->scene('complete')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $order = $this->service->complete($id, $data, $engineerId);
            return Result::success($order, '维修完成');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 验收工单
     * POST /api/workorders/{id}/verify
     */
    public function verify($id)
    {
        $data = $this->getRequestData();
        $verifierId = request()->userId;

        // 验证输入
        try {
            validate(WorkOrderValidate::class)
                ->scene('verify')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $order = $this->service->verify($id, $data, $verifierId);
            return Result::success($order, '验收通过');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 关闭工单
     * POST /api/workorders/{id}/close
     */
    public function close($id)
    {
        $operatorId = request()->userId;

        try {
            $order = $this->service->close($id, $operatorId);
            return Result::success($order, '工单已关闭');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 我的工单
     * GET /api/workorders/my
     */
    public function my()
    {
        $page = request()->get('page', 1);
        $limit = request()->get('pageSize', 20);
        $userId = request()->userId;
        $roleType = request()->roleType;

        $result = $this->service->getMyOrders($userId, $roleType, $page, $limit);

        return Result::success([
            'list' => $result['list'],
            'total' => $result['total'],
            'page' => $result['page'],
            'limit' => $result['limit'],
        ]);
    }

    /**
     * 工单统计
     * GET /api/workorders/statistics
     */
    public function statistics()
    {
        $filters = [
            'start_date' => request()->get('start_date', ''),
            'end_date' => request()->get('end_date', ''),
        ];

        try {
            $stats = $this->service->getStatistics($filters);
            return Result::success($stats);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 获取请求JSON数据
     */
    private function getRequestData()
    {
        $content = file_get_contents('php://input');
        if (!empty($content)) {
            $data = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
                return $data;
            }
        }

        return request()->post();
    }
}
