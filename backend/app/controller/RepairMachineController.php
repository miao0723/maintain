<?php

namespace app\controller;

use app\service\RepairMachineService;
use think\facade\Request;

class RepairMachineController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new RepairMachineService();
    }

    /**
     * 获取机械列表
     */
    public function index()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');

            $filters = [
                'name' => Request::param('name', ''),
                'category_id' => Request::param('category_id', ''),
                'status' => Request::param('status', ''),
            ];

            $result = $this->service->getList($page, $limit, $filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取机械详情
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
     * 创建机械
     */
    public function save()
    {
        try {
            $data = $this->getRequestData();

            $result = $this->service->create($data);

            return $this->success($result, '机械创建成功', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 更新机械
     */
    public function update($id)
    {
        try {
            $data = $this->getRequestData();

            $result = $this->service->update($id, $data);

            return $this->success($result, '机械更新成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 删除机械
     */
    public function delete($id)
    {
        try {
            $this->service->delete($id);
            return $this->success(null, '机械删除成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取分类下的机械列表
     */
    public function byCategory($categoryId)
    {
        try {
            $result = $this->service->getByCategory($categoryId);
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }
}
