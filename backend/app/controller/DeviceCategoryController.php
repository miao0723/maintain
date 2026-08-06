<?php

namespace app\controller;

use app\service\DeviceCategoryService;
use app\validate\DeviceCategoryValidate;
use app\common\Result;

class DeviceCategoryController
{
    private $service;

    public function __construct()
    {
        $this->service = new DeviceCategoryService();
    }

    /**
     * 获取分类列表
     * GET /api/devices/categories
     */
    public function index()
    {
        $categories = $this->service->getList();
        return Result::success($categories);
    }

    /**
     * 创建分类
     * POST /api/devices/categories
     */
    public function save()
    {
        $data = $this->getRequestData();

        // 验证输入
        try {
            validate(DeviceCategoryValidate::class)->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $category = $this->service->create($data);
            return Result::success($category, '创建成功', 201);
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

    /**
     * 更新分类
     * PUT /api/devices/categories/{id}
     */
    public function update($id)
    {
        $data = $this->getRequestData();

        // 验证输入
        try {
            validate(DeviceCategoryValidate::class)->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $category = $this->service->update($id, $data);
            return Result::success($category, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 400);
        }
    }

    /**
     * 删除分类
     * DELETE /api/devices/categories/{id}
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
}
