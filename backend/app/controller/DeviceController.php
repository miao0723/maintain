<?php

namespace app\controller;

use app\service\DeviceService;
use app\validate\DeviceValidate;
use app\common\Result;

class DeviceController
{
    private $service;

    public function __construct()
    {
        $this->service = new DeviceService();
    }

    /**
     * 获取设备列表
     * GET /api/devices
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);

        $filters = [
            'category_id' => request()->get('category_id', ''),
            'department_id' => request()->get('department_id', ''),
            'status' => request()->get('status', ''),
            'keyword' => request()->get('keyword', ''),
        ];

        $result = $this->service->getList($page, $pageSize, $filters);

        return Result::success([
            'list' => $result['list'],
            'total' => $result['total'],
            'page' => $result['page'],
            'limit' => $result['limit'],
        ]);
    }

    /**
     * 获取设备详情
     * GET /api/devices/{id}
     */
    public function read($id)
    {
        try {
            $device = $this->service->getDetail($id);
            return Result::success($device);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 404);
        }
    }

    /**
     * 创建设备
     * POST /api/devices
     */
    public function save()
    {
        $data = $this->getRequestData();

        // 验证输入
        try {
            validate(DeviceValidate::class)->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $device = $this->service->create($data);
            return Result::success($device, '创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 更新设备
     * PUT /api/devices/{id}
     */
    public function update($id)
    {
        $data = $this->getRequestData();

        // 验证输入
        try {
            validate(DeviceValidate::class)
                ->scene('update')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $device = $this->service->update($id, $data);
            return Result::success($device, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 删除设备
     * DELETE /api/devices/{id}
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
     * 获取设备维护历史
     * GET /api/devices/{id}/history
     */
    public function history($id)
    {
        try {
            $history = $this->service->getHistory($id);
            return Result::success($history);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 获取请求JSON数据
     */
    private function getRequestData()
    {
        // 直接从php://input读取原始JSON数据
        $content = file_get_contents('php://input');
        if (!empty($content)) {
            $data = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
                return $data;
            }
        }

        // 回退到POST参数
        return request()->post();
    }
}
