<?php

namespace app\controller;

use app\service\MaintenanceItemService;
use think\facade\Request;

class MaintenanceItemController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new MaintenanceItemService();
    }

    /**
     * 获取维修内容列表
     */
    public function index()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');

            // 筛选参数
            $filters = [
                'status' => Request::param('status', ''),
                'category_id' => Request::param('category_id', ''),
                'keyword' => Request::param('keyword', ''),
            ];

            $result = $this->service->getList($page, $limit, $filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取维修内容详情
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
     * 创建维修项目
     */
    public function save()
    {
        try {
            $data = $this->getRequestData();

            $result = $this->service->create($data);

            return $this->success($result, '维修项目创建成功', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 更新维修项目
     */
    public function update($id)
    {
        try {
            $data = $this->getRequestData();

            $result = $this->service->update($id, $data);

            return $this->success($result, '维修项目更新成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 删除维修项目
     */
    public function delete($id)
    {
        try {
            $this->service->delete($id);
            return $this->success(null, '维修项目删除成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取分类列表
     */
    public function categories()
    {
        try {
            $result = $this->service->getCategories();
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }
}
