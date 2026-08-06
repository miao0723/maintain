<?php

namespace app\controller;

use app\service\ReportService;
use think\facade\Request;

class ReportController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new ReportService();
    }

    /**
     * 获取可用的报表类型列表
     */
    public function types()
    {
        try {
            $result = $this->service->getReportTypes();
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取筛选参数
     */
    private function getFilters()
    {
        return [
            'status' => Request::param('status', ''),
            'category_id' => Request::param('category_id', ''),
            'department_id' => Request::param('department_id', ''),
            'supplier_id' => Request::param('supplier_id', ''),
            'stock_status' => Request::param('stock_status', ''),
            'priority' => Request::param('priority', ''),
            'start_date' => Request::param('start_date', ''),
            'end_date' => Request::param('end_date', ''),
        ];
    }

    /**
     * 生成设备报表
     */
    public function device()
    {
        try {
            $filters = $this->getFilters();
            $result = $this->service->generateReport('device', $filters);
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 生成维修报表
     */
    public function maintenance()
    {
        try {
            $filters = $this->getFilters();
            $result = $this->service->generateReport('maintenance', $filters);
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 生成库存报表
     */
    public function inventory()
    {
        try {
            $filters = $this->getFilters();
            $result = $this->service->generateReport('inventory', $filters);
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 生成成本报表
     */
    public function cost()
    {
        try {
            $filters = $this->getFilters();
            $result = $this->service->generateReport('cost', $filters);
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 通用报表生成接口
     */
    public function generate($type)
    {
        try {
            $filters = $this->getFilters();
            $result = $this->service->generateReport($type, $filters);
            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }
}
