<?php

namespace app\controller;

use app\service\SupplierService;
use app\validate\SupplierValidate;
use think\facade\Request;

class SupplierController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new SupplierService();
    }

    /**
     * 获取供应商列表
     */
    public function index()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');

            // 筛选参数
            $filters = [
                'status' => Request::param('status', ''),
                'keyword' => Request::param('keyword', ''),
            ];

            $result = $this->service->getList($page, $limit, $filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取供应商详情
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
     * 创建供应商
     */
    public function save()
    {
        try {
            $data = $this->getRequestData();

            // 验证
            validate(SupplierValidate::class)
                ->scene('create')
                ->check($data);

            $result = $this->service->create($data);

            return $this->success($result, '供应商创建成功', 201);
        } catch (\ValidateException $e) {
            return $this->error($e->getError(), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 更新供应商
     */
    public function update($id)
    {
        try {
            $data = $this->getRequestData();

            // 验证
            validate(SupplierValidate::class)
                ->scene('update')
                ->check($data);

            $result = $this->service->update($id, $data);

            return $this->success($result, '供应商更新成功');
        } catch (\ValidateException $e) {
            return $this->error($e->getError(), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 删除供应商
     */
    public function delete($id)
    {
        try {
            $this->service->delete($id);
            return $this->success(null, '供应商删除成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取供应商的配件列表
     */
    public function parts($id)
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');

            $result = $this->service->getSpareParts($id, $page, $limit);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取供应商统计数据
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
