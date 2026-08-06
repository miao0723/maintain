<?php

namespace app\controller;

use app\service\MaintenancePlanService;
use app\validate\MaintenancePlanValidate;
use app\common\Result;

class MaintenancePlanController
{
    private $service;

    public function __construct()
    {
        $this->service = new MaintenancePlanService();
    }

    /**
     * 获取保养计划列表
     * GET /api/maintenance/plans
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $limit = request()->get('pageSize', 20);

        $filters = [
            'type' => request()->get('type', ''),
            'status' => request()->get('status', ''),
            'device_id' => request()->get('device_id', ''),
            'executor_id' => request()->get('executor_id', ''),
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
     * 获取保养计划详情
     * GET /api/maintenance/plans/{id}
     */
    public function read($id)
    {
        try {
            $plan = $this->service->getDetail($id);
            return Result::success($plan);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 404);
        }
    }

    /**
     * 创建保养计划
     * POST /api/maintenance/plans
     */
    public function save()
    {
        $data = $this->getRequestData();

        // 验证输入
        try {
            validate(MaintenancePlanValidate::class)
                ->scene('create')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $plan = $this->service->create($data);
            return Result::success($plan, '创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 更新保养计划
     * PUT /api/maintenance/plans/{id}
     */
    public function update($id)
    {
        $data = $this->getRequestData();

        // 验证输入
        try {
            validate(MaintenancePlanValidate::class)
                ->scene('update')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $plan = $this->service->update($id, $data);
            return Result::success($plan, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 删除保养计划
     * DELETE /api/maintenance/plans/{id}
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
     * 执行保养
     * POST /api/maintenance/plans/{id}/execute
     */
    public function execute($id)
    {
        $data = $this->getRequestData();
        $executorId = request()->userId;

        // 验证输入
        try {
            validate(MaintenancePlanValidate::class)
                ->scene('execute')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $record = $this->service->execute($id, $data, $executorId);
            return Result::success($record, '执行完成');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 保养历史
     * GET /api/maintenance/history
     */
    public function history()
    {
        $page = request()->get('page', 1);
        $limit = request()->get('pageSize', 20);

        $filters = [
            'plan_id' => request()->get('plan_id', ''),
            'device_id' => request()->get('device_id', ''),
            'executor_id' => request()->get('executor_id', ''),
            'start_date' => request()->get('start_date', ''),
            'end_date' => request()->get('end_date', ''),
        ];

        $result = $this->service->getHistory($page, $limit, $filters);

        return Result::success([
            'list' => $result['list'],
            'total' => $result['total'],
            'page' => $result['page'],
            'limit' => $result['limit'],
        ]);
    }

    /**
     * 待执行保养列表
     * GET /api/maintenance/due
     */
    public function due()
    {
        $page = request()->get('page', 1);
        $limit = request()->get('pageSize', 20);

        try {
            $result = $this->service->getDuePlans($page, $limit);
            return Result::success($result);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 保养统计数据
     * GET /api/maintenance/statistics
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
