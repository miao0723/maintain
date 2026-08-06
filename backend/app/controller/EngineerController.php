<?php

namespace app\controller;

use app\service\EngineerService;
use app\validate\EngineerValidate;
use app\common\Result;

class EngineerController
{
    private $service;

    public function __construct()
    {
        $this->service = new EngineerService();
    }

    /**
     * 获取工程师列表
     * GET /api/engineers
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $limit = request()->get('pageSize', 20);

        $filters = [
            'skill_level' => request()->get('skill_level', ''),
            'status' => request()->get('status', ''),
            'department_id' => request()->get('department_id', ''),
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
     * 获取工程师详情
     * GET /api/engineers/{id}
     */
    public function read($id)
    {
        try {
            $engineer = $this->service->getDetail($id);
            return Result::success($engineer);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 404);
        }
    }

    /**
     * 创建工程师资料
     * POST /api/engineers
     */
    public function save()
    {
        $data = $this->getRequestData();

        // 验证输入
        try {
            validate(EngineerValidate::class)
                ->scene('create')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $engineer = $this->service->create($data);
            return Result::success($engineer, '创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 更新工程师资料
     * PUT /api/engineers/{id}
     */
    public function update($id)
    {
        $data = $this->getRequestData();

        // 验证输入
        try {
            validate(EngineerValidate::class)
                ->scene('update')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $engineer = $this->service->update($id, $data);
            return Result::success($engineer, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 删除工程师资料
     * DELETE /api/engineers/{id}
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
     * 获取工程师绩效统计
     * GET /api/engineers/{id}/performance
     */
    public function performance($id)
    {
        $filters = [
            'start_date' => request()->get('start_date', ''),
            'end_date' => request()->get('end_date', ''),
        ];

        try {
            $performance = $this->service->getPerformance($id, $filters);
            return Result::success($performance);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 获取可用工程师列表
     * GET /api/engineers/available
     */
    public function available()
    {
        $date = request()->get('date', date('Y-m-d'));

        try {
            $engineers = $this->service->getAvailableEngineers($date);
            return Result::success($engineers);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 根据专长推荐工程师
     * GET /api/engineers/recommend
     */
    public function recommend()
    {
        $faultType = request()->get('fault_type', '');
        $limit = request()->get('limit', 5);

        if (empty($faultType)) {
            return Result::error('故障类型不能为空', 400);
        }

        try {
            $engineers = $this->service->recommendBySpecialty($faultType, $limit);
            return Result::success($engineers);
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
