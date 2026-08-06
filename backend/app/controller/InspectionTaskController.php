<?php

namespace app\controller;

use app\service\InspectionTaskService;
use app\validate\InspectionTaskValidate;
use app\common\Result;

class InspectionTaskController
{
    private $service;

    public function __construct()
    {
        $this->service = new InspectionTaskService();
    }

    /**
     * 获取巡检任务列表
     * GET /api/inspections
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $limit = request()->get('pageSize', 20);

        $filters = [
            'status' => request()->get('status', ''),
            'device_id' => request()->get('device_id', ''),
            'inspector_id' => request()->get('inspector_id', ''),
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
     * 获取巡检任务详情
     * GET /api/inspections/{id}
     */
    public function read($id)
    {
        try {
            $task = $this->service->getDetail($id);
            return Result::success($task);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 404);
        }
    }

    /**
     * 创建巡检任务
     * POST /api/inspections
     */
    public function save()
    {
        $data = $this->getRequestData();

        // 验证输入
        try {
            validate(InspectionTaskValidate::class)
                ->scene('create')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $task = $this->service->create($data);
            return Result::success($task, '创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 更新巡检任务
     * PUT /api/inspections/{id}
     */
    public function update($id)
    {
        $data = $this->getRequestData();

        // 验证输入
        try {
            validate(InspectionTaskValidate::class)
                ->scene('update')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $task = $this->service->update($id, $data);
            return Result::success($task, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 删除巡检任务
     * DELETE /api/inspections/{id}
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
     * 执行巡检任务
     * POST /api/inspections/{id}/execute
     */
    public function execute($id)
    {
        $data = $this->getRequestData();
        $inspectorId = request()->userId;

        // 验证输入
        try {
            validate(InspectionTaskValidate::class)
                ->scene('execute')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $task = $this->service->execute($id, $data, $inspectorId);
            return Result::success($task, '执行完成');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 我的巡检任务
     * GET /api/inspections/my
     */
    public function my()
    {
        $page = request()->get('page', 1);
        $limit = request()->get('pageSize', 20);
        $inspectorId = request()->userId;

        $result = $this->service->getMyTasks($inspectorId, $page, $limit);

        return Result::success([
            'list' => $result['list'],
            'total' => $result['total'],
            'page' => $result['page'],
            'limit' => $result['limit'],
        ]);
    }

    /**
     * 逾期任务列表
     * GET /api/inspections/overdue
     */
    public function overdue()
    {
        $page = request()->get('page', 1);
        $limit = request()->get('pageSize', 20);

        try {
            $result = $this->service->getOverdueTasks($page, $limit);
            return Result::success($result);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 巡检统计数据
     * GET /api/inspections/statistics
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
