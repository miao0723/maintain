<?php

namespace app\controller;

use app\service\RepairCategoryService;
use think\facade\Request;

class RepairCategoryController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new RepairCategoryService();
    }

    /**
     * 获取分类列表
     */
    public function index()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');

            $filters = [
                'name' => Request::param('name', ''),
                'status' => Request::param('status', ''),
            ];

            $result = $this->service->getList($page, $limit, $filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取分类详情
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
     * 创建分类
     */
    public function save()
    {
        try {
            $data = $this->getRequestData();

            $result = $this->service->create($data);

            return $this->success($result, '分类创建成功', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 更新分类
     */
    public function update($id)
    {
        try {
            $data = $this->getRequestData();

            $result = $this->service->update($id, $data);

            return $this->success($result, '分类更新成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 删除分类
     */
    public function delete($id)
    {
        try {
            $this->service->delete($id);
            return $this->success(null, '分类删除成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取启用的分类列表（下拉选择用）
     */
    public function activeList()
    {
        try {
            $result = $this->service->getActiveList();
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }
}
