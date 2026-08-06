<?php

namespace app\controller;

use app\service\CommonProblemService;
use think\facade\Request;

/**
 * 小程序常见问题控制器
 * 管理 repair 数据库中 common_problems 表的 CRUD 接口
 */
class CommonProblemController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new CommonProblemService();
    }

    /**
     * 获取常见问题列表
     */
    public function index()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');

            // 筛选参数
            $filters = [
                'device_type_id' => Request::param('device_type_id', ''),
                'keyword' => Request::param('keyword', ''),
            ];

            $result = $this->service->getList($page, $limit, $filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取常见问题详情
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
     * 创建常见问题
     */
    public function save()
    {
        try {
            $data = $this->getRequestData();

            $result = $this->service->create($data);

            return $this->success($result, '常见问题创建成功', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 更新常见问题
     */
    public function update($id)
    {
        try {
            $data = $this->getRequestData();

            $result = $this->service->update($id, $data);

            return $this->success($result, '常见问题更新成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 删除常见问题
     */
    public function delete($id)
    {
        try {
            $this->service->delete($id);
            return $this->success(null, '常见问题删除成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取设备类型列表（用于下拉选择）
     */
    public function deviceTypes()
    {
        try {
            $result = $this->service->getDeviceTypes();
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 同步数据：从 common_problems 同步到本地 maintenance_items
     */
    public function syncToLocal()
    {
        try {
            $count = $this->service->syncToLocal();
            return $this->success(['synced_count' => $count], "成功同步 {$count} 条数据到本地");
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 同步数据：从本地 maintenance_items 导入到 common_problems
     */
    public function syncFromLocal()
    {
        try {
            $count = $this->service->syncFromLocal();
            return $this->success(['synced_count' => $count], "成功导入 {$count} 条数据到常见问题");
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }
}