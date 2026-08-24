<?php

namespace app\controller;

use app\service\OrderDeviceService;
use app\validate\OrderDeviceValidate;
use app\common\Result;

class OrderDeviceController
{
    private $service;

    public function __construct()
    {
        $this->service = new OrderDeviceService();
    }

    /**
     * 列表
     * GET /api/order-devices
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);

        $filters = [
            'order_id' => request()->get('order_id', ''),
            'name'     => request()->get('name', ''),
            'source'   => request()->get('source', ''),
            'status'   => request()->get('status', ''),
        ];

        $result = $this->service->getList($page, $pageSize, $filters);

        return Result::success([
            'list'     => $result['list'],
            'total'    => $result['total'],
            'page'     => $result['page'],
            'pageSize' => $result['limit'],
        ]);
    }

    /**
     * 详情
     * GET /api/order-devices/{id}
     */
    public function read($id)
    {
        try {
            $row = $this->service->getDetail($id);
            return Result::success($row);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 404);
        }
    }

    /**
     * 创建
     * POST /api/order-devices
     */
    public function save()
    {
        $data = $this->getRequestData();

        try {
            validate(OrderDeviceValidate::class)->scene('create')->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $row = $this->service->create($data);
            return Result::success($row, '创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 更新
     * PUT /api/order-devices/{id}
     */
    public function update($id)
    {
        $data = $this->getRequestData();

        try {
            validate(OrderDeviceValidate::class)->scene('update')->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $row = $this->service->update($id, $data);
            return Result::success($row, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 删除
     * DELETE /api/order-devices/{id}
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
     * 读取请求体（JSON 优先，回退 POST 参数）
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
