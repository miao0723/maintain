<?php

namespace app\controller;

use app\service\CommonProblemService;
use think\facade\Request;

class MiniAdminCommonProblemController extends MiniAdminBaseController
{
    protected CommonProblemService $service;

    public function __construct()
    {
        $this->service = new CommonProblemService();
    }

    public function index()
    {
        $page = Request::param('page', 1, 'intval');
        $pageSize = Request::param('pageSize', Request::param('limit', 20, 'intval'), 'intval');
        $filters = [
            'device_type_id' => Request::param('device_type_id', ''),
            'keyword' => Request::param('keyword', ''),
        ];

        $result = $this->service->getList($page, $pageSize, $filters);

        return $this->success([
            'items' => $result['list'] ?? [],
            'total' => $result['total'] ?? 0,
            'page' => $page,
            'pageSize' => $pageSize,
        ]);
    }

    public function read($id)
    {
        return $this->success($this->service->getDetail($id));
    }

    public function save()
    {
        return $this->success($this->service->create($this->getRequestData()), '常见问题创建成功', 201);
    }

    public function update($id)
    {
        return $this->success($this->service->update($id, $this->getRequestData()), '常见问题更新成功');
    }

    public function delete($id)
    {
        $this->service->delete($id);
        return $this->success(null, '常见问题删除成功');
    }

    public function deviceTypes()
    {
        return $this->success($this->service->getDeviceTypes());
    }

    public function syncToLocal()
    {
        $count = $this->service->syncToLocal();
        return $this->success(['synced_count' => $count], "成功同步 {$count} 条数据到本地");
    }

    public function syncFromLocal()
    {
        $count = $this->service->syncFromLocal();
        return $this->success(['synced_count' => $count], "成功导入 {$count} 条数据到常见问题");
    }
}
