<?php

namespace app\controller;

use app\service\CostAnalysisService;
use think\facade\Request;

class CostAnalysisController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new CostAnalysisService();
    }

    /**
     * 获取日期筛选参数
     */
    private function getDateFilters()
    {
        return [
            'start_date' => Request::param('start_date', ''),
            'end_date' => Request::param('end_date', ''),
        ];
    }

    /**
     * 获取总体成本统计
     */
    public function overview()
    {
        try {
            $filters = $this->getDateFilters();
            $result = $this->service->getOverview($filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取成本趋势
     */
    public function trend()
    {
        try {
            $dimension = Request::param('dimension', 'day');
            $limit = Request::param('limit', 30, 'intval');
            $filters = $this->getDateFilters();

            $result = $this->service->getTrend($dimension, $limit, $filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取设备成本排名
     */
    public function topDevices()
    {
        try {
            $limit = Request::param('limit', 10, 'intval');
            $filters = $this->getDateFilters();

            $result = $this->service->getTopDevices($limit, $filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取部门成本统计
     */
    public function departmentStats()
    {
        try {
            $filters = $this->getDateFilters();
            $result = $this->service->getDepartmentStats($filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取成本类型分析
     */
    public function costTypeAnalysis()
    {
        try {
            $filters = $this->getDateFilters();
            $result = $this->service->getCostTypeAnalysis($filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取配件成本排名
     */
    public function topParts()
    {
        try {
            $limit = Request::param('limit', 10, 'intval');
            $filters = $this->getDateFilters();

            $result = $this->service->getTopParts($limit, $filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取综合成本报告
     */
    public function comprehensive()
    {
        try {
            $filters = $this->getDateFilters();
            $result = $this->service->getComprehensiveReport($filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }
}
