<?php

namespace app\controller;

use app\service\ScheduleService;
use app\validate\ScheduleValidate;
use app\common\Result;

class ScheduleController
{
    private $service;

    public function __construct()
    {
        $this->service = new ScheduleService();
    }

    /**
     * 获取排班列表
     * GET /api/schedules
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $limit = request()->get('pageSize', 20);

        $filters = [
            'engineer_id' => request()->get('engineer_id', ''),
            'start_date' => request()->get('start_date', ''),
            'end_date' => request()->get('end_date', ''),
            'shift_type' => request()->get('shift_type', ''),
            'status' => request()->get('status', ''),
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
     * 获取排班详情
     * GET /api/schedules/{id}
     */
    public function read($id)
    {
        try {
            $schedule = $this->service->getDetail($id);
            return Result::success($schedule);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 404);
        }
    }

    /**
     * 创建排班
     * POST /api/schedules
     */
    public function save()
    {
        $data = $this->getRequestData();

        // 验证输入
        try {
            validate(ScheduleValidate::class)
                ->scene('create')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $schedule = $this->service->create($data);
            return Result::success($schedule, '创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 更新排班
     * PUT /api/schedules/{id}
     */
    public function update($id)
    {
        $data = $this->getRequestData();

        // 验证输入
        try {
            validate(ScheduleValidate::class)
                ->scene('update')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $schedule = $this->service->update($id, $data);
            return Result::success($schedule, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 删除排班
     * DELETE /api/schedules/{id}
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
     * 获取排班概览
     * GET /api/schedules/overview
     */
    public function overview()
    {
        $startDate = request()->get('start_date');
        $endDate = request()->get('end_date');

        if (empty($startDate) || empty($endDate)) {
            return Result::error('开始日期和结束日期不能为空', 400);
        }

        try {
            $overview = $this->service->getOverview($startDate, $endDate);
            return Result::success($overview);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 批量创建排班
     * POST /api/schedules/batch
     */
    public function batchCreate()
    {
        $data = $this->getRequestData();

        // 验证必要字段
        if (empty($data['engineer_ids']) || !is_array($data['engineer_ids'])) {
            return Result::error('工程师ID列表不能为空', 400);
        }

        if (empty($data['start_date']) || empty($data['end_date'])) {
            return Result::error('开始日期和结束日期不能为空', 400);
        }

        if (empty($data['shift_type'])) {
            return Result::error('班次类型不能为空', 400);
        }

        try {
            $result = $this->service->batchCreate(
                $data['engineer_ids'],
                $data['start_date'],
                $data['end_date'],
                $data['shift_type']
            );

            return Result::success($result, '批量创建完成');
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
