<?php

namespace app\controller;

use app\service\SparePartService;
use app\validate\SparePartValidate;
use think\facade\Request;
use think\facade\Validate;

class SparePartController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new SparePartService();
    }

    /**
     * 获取配件列表
     */
    public function index()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');

            // 筛选参数
            $filters = [
                'category' => Request::param('category', ''),
                'supplier_id' => Request::param('supplier_id', ''),
                'status' => Request::param('status', ''),
                'stock_status' => Request::param('stock_status', ''),
                'keyword' => Request::param('keyword', ''),
            ];

            $result = $this->service->getList($page, $limit, $filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取配件详情
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
     * 创建配件
     */
    public function save()
    {
        try {
            $data = $this->getRequestData();

            // 验证
            validate(SparePartValidate::class)
                ->scene('create')
                ->check($data);

            $result = $this->service->create($data);

            return $this->success($result, '配件创建成功', 201);
        } catch (\ValidateException $e) {
            return $this->error($e->getError(), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 更新配件
     */
    public function update($id)
    {
        try {
            $data = $this->getRequestData();

            // 验证
            validate(SparePartValidate::class)
                ->scene('update')
                ->check($data);

            $result = $this->service->update($id, $data);

            return $this->success($result, '配件更新成功');
        } catch (\ValidateException $e) {
            return $this->error($e->getError(), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 删除配件
     */
    public function delete($id)
    {
        try {
            $this->service->delete($id);
            return $this->success(null, '配件删除成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取库存预警列表
     */
    public function alerts()
    {
        try {
            $result = $this->service->getAlerts();
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 配件入库
     */
    public function stockIn($id)
    {
        try {
            $data = $this->getRequestData();

            // 验证
            validate(SparePartValidate::class)
                ->scene('stock_in')
                ->check($data);

            $userId = Request::instance()->userId ?? null;
            $result = $this->service->stockIn(
                $id,
                $data['quantity'],
                $data['order_id'] ?? null,
                $userId,
                $data['remark'] ?? null
            );

            return $this->success($result, '入库成功');
        } catch (\ValidateException $e) {
            return $this->error($e->getError(), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 配件出库
     */
    public function stockOut($id)
    {
        try {
            $data = $this->getRequestData();

            // 验证
            validate(SparePartValidate::class)
                ->scene('stock_out')
                ->check($data);

            $userId = Request::instance()->userId ?? null;
            $result = $this->service->stockOut(
                $id,
                $data['quantity'],
                $data['order_id'] ?? null,
                $userId,
                $data['remark'] ?? null
            );

            return $this->success($result, '出库成功');
        } catch (\ValidateException $e) {
            return $this->error($e->getError(), 422);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取库存记录
     */
    public function records()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');

            // 筛选参数
            $filters = [
                'part_id' => Request::param('part_id', ''),
                'type' => Request::param('type', ''),
                'order_id' => Request::param('order_id', ''),
                'start_date' => Request::param('start_date', ''),
                'end_date' => Request::param('end_date', ''),
            ];

            $result = $this->service->getRecords($page, $limit, $filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取库存统计数据
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

    /**
     * 导出配件库存
     */
    public function export()
    {
        try {
            $format = Request::param('format', 'xlsx');
            $filters = [
                'category' => Request::param('category', ''),
                'supplier_id' => Request::param('supplier_id', ''),
                'status' => Request::param('status', ''),
                'stock_status' => Request::param('stock_status', ''),
                'keyword' => Request::param('keyword', ''),
            ];

            return $this->service->export($format, $filters);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }
}
