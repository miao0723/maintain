<?php

namespace app\controller;

use app\service\PerformanceService;
use think\facade\Request;

/**
 * 绩效考核控制器
 */
class PerformanceController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new PerformanceService();
    }

    /**
     * 读取统一筛选参数
     */
    private function filters()
    {
        return [
            'start_date'  => Request::param('start_date', ''),
            'end_date'    => Request::param('end_date', ''),
            'team'        => Request::param('team', ''),
            'engineer_id' => Request::param('engineer_id', ''),
            'status'      => Request::param('status', ''),
            'device_id'   => Request::param('device_id', ''),
            'keyword'     => Request::param('keyword', ''),
        ];
    }

    /**
     * 绩效总览看板
     * GET /api/performance/overview
     */
    public function overview()
    {
        try {
            $data = $this->service->getOverview($this->filters());
            return $this->success($data);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 趋势（按月）
     * GET /api/performance/trend
     */
    public function trend()
    {
        try {
            $data = $this->service->trend($this->filters());
            return $this->success($data);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 人员 / 班组 排名
     * GET /api/performance/ranking
     */
    public function ranking()
    {
        try {
            $dimension = Request::param('dimension', 'engineer');
            $sortBy = Request::param('sort_by', 'score');
            $sortDir = Request::param('sort_dir', 'desc');
            $data = $this->service->ranking($this->filters(), $dimension, $sortBy, $sortDir);
            return $this->success($data);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 工单列表（分页）
     * GET /api/performance/work-orders
     */
    public function workOrders()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $pageSize = Request::param('page_size', 10, 'intval');
            $data = $this->service->getWorkOrders($this->filters(), $page, $pageSize);
            return $this->success($data);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 工单详情
     * GET /api/performance/work-orders/:id
     */
    public function workOrderDetail($id)
    {
        try {
            $data = $this->service->getWorkOrderDetail($id);
            if (!$data) {
                return $this->error('工单不存在', 404);
            }
            return $this->success($data);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 维修人员列表（筛选用）
     * GET /api/performance/engineers
     */
    public function engineers()
    {
        try {
            return $this->success($this->service->getEngineers());
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 班组列表（筛选用）
     * GET /api/performance/teams
     */
    public function teams()
    {
        try {
            return $this->success($this->service->getTeams());
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 评分规则列表
     * GET /api/performance/score-rules
     */
    public function scoreRules()
    {
        try {
            return $this->success($this->service->getScoreRules());
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 更新评分规则
     * POST /api/performance/score-rules
     */
    public function updateScoreRules()
    {
        try {
            $rules = Request::post('rules/a', []);
            if (empty($rules)) {
                // 兼容直接传数组
                $body = Request::post();
                $rules = $body['rules'] ?? $body ?? [];
            }
            $data = $this->service->updateScoreRules($rules, request()->userId);
            return $this->success($data, '保存成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 重置评分规则
     * POST /api/performance/score-rules/reset
     */
    public function resetScoreRules()
    {
        try {
            $data = $this->service->resetScoreRules(request()->userId);
            return $this->success($data, '已重置为默认权重');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 生成绩效快照
     * POST /api/performance/snapshot/generate
     */
    public function generateSnapshot()
    {
        try {
            $filters = $this->filters();
            $periodLabel = Request::post('period_label', '');
            $data = $this->service->generateSnapshot($filters, $periodLabel, request()->userId);
            return $this->success($data, '快照已生成');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 快照列表
     * GET /api/performance/snapshots
     */
    public function snapshots()
    {
        try {
            $dimension = Request::param('dimension', '');
            $periodLabel = Request::param('period_label', '');
            $data = $this->service->listSnapshots($dimension, $periodLabel);
            return $this->success($data);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 读取绩效配置（达标线 / 最低样本量）
     * GET /api/performance/config
     */
    public function config()
    {
        try {
            return $this->success($this->service->getAllConfig());
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 保存绩效配置
     * POST /api/performance/config
     */
    public function saveConfig()
    {
        try {
            $data = Request::post();
            $data = array_intersect_key($data, array_flip(['pass_score', 'min_orders']));
            return $this->success($this->service->saveConfig($data, request()->userId), '配置已保存');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    // ===================== 工人端（自建工单 / 交付 / 判定） =====================

    /**
     * 当前用户绩效上下文（是否工人视角）
     * GET /api/performance/context
     */
    public function context()
    {
        try {
            $userId = request()->userId;
            return $this->success($this->service->getMyContext($userId));
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 设备列表
     * GET /api/performance/devices
     */
    public function devices()
    {
        try {
            $keyword = Request::param('keyword', '');
            return $this->success($this->service->getDevices($keyword));
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 新建设备
     * POST /api/performance/devices
     */
    public function createDevice()
    {
        try {
            $input = Request::post();
            return $this->success($this->service->createDevice(request()->userId, $input), '设备已添加');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 更新设备
     * PUT /api/performance/devices/:id
     */
    public function updateDevice($id)
    {
        try {
            $input = Request::put();
            return $this->success($this->service->updateDevice($id, request()->userId, $input), '设备已更新');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 删除设备
     * DELETE /api/performance/devices/:id
     */
    public function deleteDevice($id)
    {
        try {
            $this->service->deleteDevice($id, request()->userId);
            return $this->success(null, '设备已删除');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 工人编辑自建工单
     * PUT /api/performance/work-orders/self/:id
     */
    public function updateWorkOrder($id)
    {
        try {
            $input = Request::put();
            return $this->success($this->service->updateSelfWorkOrder($id, request()->userId, $input), '工单已更新');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 工人删除自建工单
     * DELETE /api/performance/work-orders/self/:id
     */
    public function deleteWorkOrder($id)
    {
        try {
            $this->service->deleteSelfWorkOrder($id, request()->userId);
            return $this->success(null, '工单已删除');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 维修工期合理性评估
     * GET /api/performance/estimate
     */
    public function estimate()
    {
        try {
            $input = [
                'type'        => Request::get('type', ''),
                'fault_desc'  => Request::get('fault_desc', ''),
                'est_hours'   => Request::get('est_hours', 0),
                'priority'    => Request::get('priority', ''),
            ];
            return $this->success($this->service->estimateRepair(request()->userId, $input));
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 工人自建工单
     * POST /api/performance/work-orders/self
     */
    public function createWorkOrder()
    {
        try {
            $input = Request::post();
            $data = $this->service->createSelfWorkOrder(request()->userId, $input);
            return $this->success($data, '工单已创建');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 工人交付工单
     * POST /api/performance/work-order/:id/deliver
     */
    public function deliver($id)
    {
        try {
            $input = Request::post();
            $data = $this->service->deliverWorkOrder($id, request()->userId, $input);
            return $this->success($data, '已交付，待验收');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 管理员/老板验收评分
     * POST /api/performance/work-order/:id/review
     */
    public function review($id)
    {
        try {
            $isQualified = (int)Request::post('is_qualified', 0);
            $reviewScore = (int)Request::post('review_score', 0);
            $comment = Request::post('review_comment', '');
            $data = $this->service->reviewWorkOrder($id, request()->userId, $isQualified, $reviewScore, $comment);
            return $this->success($data, '验收完成');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 管理员/老板修改已验收工单的评分（验收完成后修正打分/判定）
     * PUT /api/performance/work-order/:id/review
     */
    public function updateReview($id)
    {
        try {
            $isQualified = (int)Request::put('is_qualified', 0);
            $reviewScore = (int)Request::put('review_score', 0);
            $comment = Request::put('review_comment', '');
            $data = $this->service->updateReviewWorkOrder($id, request()->userId, $isQualified, $reviewScore, $comment);
            return $this->success($data, '评分已修改');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 我的工单（分页）
     * GET /api/performance/my-work-orders
     */
    public function myWorkOrders()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $pageSize = Request::param('page_size', 10, 'intval');
            $filters = [
                'status' => Request::param('status', ''),
            ];
            $data = $this->service->getMyWorkOrders(request()->userId, $filters, $page, $pageSize);
            return $this->success($data);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }
}
