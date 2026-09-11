<?php

namespace app\controller;

use think\facade\Db;
use think\facade\Request;

/**
 * 小程序业务统计（读取 repair 库真实数据：orders / transaction_income / order_reviews / users / device_types）
 */
class RepairStatisticsController extends BaseController
{
    /** 近 N 个月（含当月）的月份序列 */
    private function recentMonths($n = 12)
    {
        $months = [];
        for ($i = $n - 1; $i >= 0; $i--) {
            $months[] = date('Y-m', strtotime("-{$i} months"));
        }
        return $months;
    }

    /** 订单状态中文 */
    private function statusText($status)
    {
        $map = [
            'pending' => '待处理',
            'quoted' => '已报价',
            'confirmed' => '已确认',
            'processing' => '维修中',
            'completed' => '已完成',
            'review' => '待评价',
            'cancelled' => '已取消',
        ];
        return $map[$status] ?? $status;
    }

    /**
     * 综合分析：统计卡 + 订单趋势 + 状态分布 + 类型分布 + 工程师绩效
     * GET /api/statistics/repair/analysis
     */
    public function analysis()
    {
        try {
            $db = Db::connect('repair');

            $deviceTotal = $db->name('user_devices')->count();
            $monthOrders = $db->name('orders')
                ->whereTime('created_at', 'month')
                ->count();
            $monthCompleted = $db->name('orders')
                ->whereIn('status', ['completed', 'review'])
                ->whereTime('created_at', 'month')
                ->count();
            $monthPending = $monthOrders - $monthCompleted;
            $avgRating = $db->name('order_reviews')->avg('rating');

            // 近12月订单趋势（按创建时间）
            $trendRows = $db->name('orders')
                ->field("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as total,
                    SUM(CASE WHEN status IN ('completed','review') THEN 1 ELSE 0 END) as completed")
                ->where('created_at', '>=', date('Y-m-01', strtotime('-11 months')))
                ->group('month')
                ->select()
                ->toArray();
            $trendMap = array_column($trendRows, null, 'month');
            $trend = array_map(function ($m) use ($trendMap) {
                return [
                    'month' => $m,
                    'total' => (int)($trendMap[$m]['total'] ?? 0),
                    'completed' => (int)($trendMap[$m]['completed'] ?? 0),
                ];
            }, $this->recentMonths(12));

            // 状态分布
            $statusRows = $db->name('orders')
                ->field('status, COUNT(*) as count')
                ->group('status')
                ->select()
                ->toArray();
            $statusPie = array_map(function ($r) {
                return ['name' => $this->statusText($r['status']), 'value' => (int)$r['count']];
            }, $statusRows);

            // 订单类型（维修/回收）
            $typeRows = $db->name('orders')
                ->field('order_type, COUNT(*) as count')
                ->group('order_type')
                ->select()
                ->toArray();
            $typeBar = array_map(function ($r) {
                return [
                    'name' => $r['order_type'] === 'recycle' ? '旧件回收' : '维修订单',
                    'value' => (int)$r['count'],
                ];
            }, $typeRows);

            return $this->success([
                'cards' => [
                    'device_total' => $deviceTotal,
                    'month_orders' => $monthOrders,
                    'month_completed' => $monthCompleted,
                    'month_pending' => max(0, $monthPending),
                    'avg_rating' => round(floatval($avgRating), 1),
                ],
                'trend' => $trend,
                'status_pie' => $statusPie,
                'type_bar' => $typeBar,
                'engineers' => $this->engineerStats(),
            ]);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /** 工程师绩效（repair.users 管理员 + orders.assigned_to + order_reviews） */
    private function engineerStats()
    {
        $db = Db::connect('repair');
        $rows = $db->name('orders')
            ->alias('o')
            ->leftJoin('users u', 'o.assigned_to = u.id')
            ->leftJoin('order_reviews r', 'r.order_id = o.id')
            ->field("o.assigned_to, COALESCE(u.nickname, CONCAT('工程师#', o.assigned_to)) as name,
                COUNT(DISTINCT o.id) as order_count,
                SUM(CASE WHEN o.status IN ('completed','review') THEN 1 ELSE 0 END) as completed_count,
                ROUND(AVG(r.rating), 1) as avg_rating")
            ->where('o.assigned_to', '>', 0)
            ->group('o.assigned_to, u.nickname')
            ->order('order_count', 'desc')
            ->limit(10)
            ->select()
            ->toArray();

        return array_map(function ($r) {
            return [
                'name' => $r['name'],
                'order_count' => (int)$r['order_count'],
                'completed_count' => (int)$r['completed_count'],
                'avg_rating' => $r['avg_rating'] !== null ? floatval($r['avg_rating']) : null,
            ];
        }, $rows);
    }

    /**
     * 工单报表：统计卡 + 趋势 + 状态/类型分布 + 订单明细（分页）
     * GET /api/statistics/repair/orders
     */
    public function orders()
    {
        try {
            $db = Db::connect('repair');

            $total = $db->name('orders')->count();
            $completed = $db->name('orders')->whereIn('status', ['completed', 'review'])->count();
            $cancelled = $db->name('orders')->where('status', 'cancelled')->count();

            // 平均完成时长（创建→完成，小时）
            $avgHours = $db->name('orders')
                ->whereIn('status', ['completed', 'review'])
                ->whereNotNull('completed_at')
                ->field('AVG(TIMESTAMPDIFF(HOUR, created_at, completed_at)) as h')
                ->value('h');

            $trendRows = $db->name('orders')
                ->field("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as total,
                    SUM(CASE WHEN status IN ('completed','review') THEN 1 ELSE 0 END) as completed")
                ->where('created_at', '>=', date('Y-m-01', strtotime('-11 months')))
                ->group('month')
                ->select()
                ->toArray();
            $trendMap = array_column($trendRows, null, 'month');
            $trend = array_map(function ($m) use ($trendMap) {
                return [
                    'month' => $m,
                    'total' => (int)($trendMap[$m]['total'] ?? 0),
                    'completed' => (int)($trendMap[$m]['completed'] ?? 0),
                ];
            }, $this->recentMonths(12));

            $statusRows = $db->name('orders')->field('status, COUNT(*) as count')->group('status')->select()->toArray();
            $statusPie = array_map(function ($r) {
                return ['name' => $this->statusText($r['status']), 'value' => (int)$r['count']];
            }, $statusRows);

            $typeRows = $db->name('orders')->field('order_type, COUNT(*) as count')->group('order_type')->select()->toArray();
            $typeBar = array_map(function ($r) {
                return ['name' => $r['order_type'] === 'recycle' ? '旧件回收' : '维修订单', 'value' => (int)$r['count']];
            }, $typeRows);

            // 明细列表（分页）
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('page_size', 10, 'intval');
            $query = $db->name('orders')
                ->alias('o')
                ->leftJoin('users u', 'o.user_id = u.id')
                ->field('o.id, o.order_id, o.order_type, o.device_model, o.status, o.progress,
                    o.actual_price, o.created_at, o.completed_at, u.nickname as user_name')
                ->order('o.created_at', 'desc');
            $listTotal = (clone $query)->count();
            $list = $query->page($page, $limit)->select()->toArray();

            return $this->success([
                'cards' => [
                    'total' => $total,
                    'completed' => $completed,
                    'cancelled' => $cancelled,
                    'completion_rate' => $total > 0 ? round($completed / $total * 100, 1) : 0,
                    'avg_hours' => round(floatval($avgHours), 1),
                ],
                'trend' => $trend,
                'status_pie' => $statusPie,
                'type_bar' => $typeBar,
                'list' => [
                    'items' => $list,
                    'total' => $listTotal,
                    'page' => $page,
                    'page_size' => $limit,
                ],
            ]);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * 财务报表：收入（transaction_income 真实入账）+ 支出（repair 库暂无支出数据，返回 0 并标注）
     * GET /api/statistics/repair/finance
     */
    public function finance()
    {
        try {
            $db = Db::connect('repair');

            $totalIncome = $db->name('transaction_income')->sum('amount');
            $monthIncome = $db->name('transaction_income')->whereTime('paid_at', 'month')->sum('amount');
            $refundAmount = $db->name('orders')->where('refund_status', 'refunded')->sum('refund_amount');

            // 月度收入趋势
            $trendRows = $db->name('transaction_income')
                ->field("DATE_FORMAT(paid_at, '%Y-%m') as month, SUM(amount) as income")
                ->where('paid_at', '>=', date('Y-m-01', strtotime('-11 months')))
                ->group('month')
                ->select()
                ->toArray();
            $trendMap = array_column($trendRows, null, 'month');
            $trend = array_map(function ($m) use ($trendMap) {
                return [
                    'month' => $m,
                    'income' => floatval($trendMap[$m]['income'] ?? 0),
                ];
            }, $this->recentMonths(12));

            // 收入构成：按订单类型
            $incomeTypeRows = $db->name('transaction_income')
                ->field('order_type, SUM(amount) as amount')
                ->group('order_type')
                ->select()
                ->toArray();
            $incomePie = array_map(function ($r) {
                return [
                    'name' => $r['order_type'] === 'recycle' ? '旧件回收' : '维修服务',
                    'value' => floatval($r['amount']),
                ];
            }, $incomeTypeRows);

            // 支出：repair 库暂无支出数据源，明确返回空
            $expensePie = [];

            // 明细（最近入账流水）
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('page_size', 10, 'intval');
            $query = $db->name('transaction_income')
                ->field('id, order_no, order_type, income_type, amount, payment_channel, payment_status, paid_at')
                ->order('paid_at', 'desc');
            $listTotal = (clone $query)->count();
            $list = $query->page($page, $limit)->select()->toArray();

            return $this->success([
                'cards' => [
                    'total_income' => floatval($totalIncome),
                    'month_income' => floatval($monthIncome),
                    'refund_amount' => floatval($refundAmount),
                    // 支出数据源缺失，利润暂等于收入
                    'total_expense' => 0,
                    'profit' => floatval($totalIncome),
                    'profit_rate' => $totalIncome > 0 ? 100.0 : 0,
                ],
                'expense_available' => false,
                'trend' => $trend,
                'income_pie' => $incomePie,
                'expense_pie' => $expensePie,
                'list' => [
                    'items' => $list,
                    'total' => $listTotal,
                    'page' => $page,
                    'page_size' => $limit,
                ],
            ]);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * 人员报表：工程师（repair.users）绩效
     * GET /api/statistics/repair/personnel
     */
    public function personnel()
    {
        try {
            $db = Db::connect('repair');

            $engineers = $this->engineerStats();
            $totalOrders = $db->name('orders')->where('assigned_to', '>', 0)->count();
            $ratings = array_column(array_filter($engineers, fn($e) => $e['avg_rating'] !== null), 'avg_rating');
            $avgRating = $ratings ? round(array_sum($ratings) / count($ratings), 1) : 0;
            $totalCompleted = array_sum(array_column($engineers, 'completed_count'));

            return $this->success([
                'cards' => [
                    'engineer_count' => count($engineers),
                    'total_orders' => $totalOrders,
                    'total_completed' => $totalCompleted,
                    'avg_rating' => $avgRating,
                ],
                'engineers' => $engineers,
            ]);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * 维保报表：以维修订单完成情况为口径（repair 库无独立维保计划）
     * GET /api/statistics/repair/maintenance
     */
    public function maintenance()
    {
        try {
            $db = Db::connect('repair');

            $total = $db->name('orders')->count();
            $completed = $db->name('orders')->whereIn('status', ['completed', 'review'])->count();
            $ongoing = $db->name('orders')->whereIn('status', ['processing', 'quoted', 'confirmed'])->count();

            // 月度完成趋势
            $trendRows = $db->name('orders')
                ->field("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as total,
                    SUM(CASE WHEN status IN ('completed','review') THEN 1 ELSE 0 END) as completed")
                ->where('created_at', '>=', date('Y-m-01', strtotime('-11 months')))
                ->group('month')
                ->select()
                ->toArray();
            $trendMap = array_column($trendRows, null, 'month');
            $trend = array_map(function ($m) use ($trendMap) {
                return [
                    'month' => $m,
                    'total' => (int)($trendMap[$m]['total'] ?? 0),
                    'completed' => (int)($trendMap[$m]['completed'] ?? 0),
                ];
            }, $this->recentMonths(12));

            // 按服务方式分布（到店/上门）
            $serviceRows = $db->name('orders')
                ->field("COALESCE(NULLIF(service_type,''),'shop') as st, COUNT(*) as count")
                ->group('st')
                ->select()
                ->toArray();
            $servicePie = array_map(function ($r) {
                return [
                    'name' => $r['st'] === 'home' ? '上门服务' : '到店服务',
                    'value' => (int)$r['count'],
                ];
            }, $serviceRows);

            // 明细（已完成订单，含维修记录阶段）
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('page_size', 10, 'intval');
            $query = $db->name('orders')
                ->alias('o')
                ->leftJoin('users u', 'o.assigned_to = u.id')
                ->field('o.id, o.order_id, o.device_model, o.status, o.progress, o.actual_price,
                    o.created_at, o.completed_at, u.nickname as engineer_name')
                ->whereIn('o.status', ['completed', 'review'])
                ->order('o.completed_at', 'desc');
            $listTotal = (clone $query)->count();
            $list = $query->page($page, $limit)->select()->toArray();

            return $this->success([
                'cards' => [
                    'total' => $total,
                    'completed' => $completed,
                    'ongoing' => $ongoing,
                    'completion_rate' => $total > 0 ? round($completed / $total * 100, 1) : 0,
                ],
                'trend' => $trend,
                'service_pie' => $servicePie,
                'list' => [
                    'items' => $list,
                    'total' => $listTotal,
                    'page' => $page,
                    'page_size' => $limit,
                ],
            ]);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * 设备报表：repair 库 device_types + orders + user_devices
     * GET /api/statistics/repair/devices
     */
    public function devices()
    {
        try {
            $db = Db::connect('repair');

            $deviceTotal = $db->name('user_devices')->count();

            // 按设备类型统计订单/收入/评分
            $rows = $db->name('orders')
                ->alias('o')
                ->leftJoin('device_types dt', 'o.device_type = dt.id')
                ->leftJoin('order_reviews r', 'r.order_id = o.id')
                ->field("o.device_type, COALESCE(dt.name, '其他') as device_name,
                    COUNT(DISTINCT o.id) as order_count,
                    SUM(CASE WHEN o.status IN ('completed','review') THEN 1 ELSE 0 END) as completed_count,
                    SUM(o.actual_price) as income,
                    ROUND(AVG(r.rating), 1) as avg_rating")
                ->group('o.device_type, dt.name')
                ->order('order_count', 'desc')
                ->select()
                ->toArray();

            $list = array_map(function ($r) {
                $orderCount = (int)$r['order_count'];
                $completedCount = (int)$r['completed_count'];
                return [
                    'device_name' => $r['device_name'],
                    'order_count' => $orderCount,
                    'completed_count' => $completedCount,
                    'fault_rate' => $orderCount > 0 ? round(($orderCount - $completedCount) / $orderCount * 100, 1) : 0,
                    'income' => floatval($r['income'] ?? 0),
                    'avg_rating' => $r['avg_rating'] !== null ? floatval($r['avg_rating']) : null,
                ];
            }, $rows);

            // 各设备类型订单量（柱状）
            $orderBar = array_map(function ($r) {
                return ['name' => $r['device_name'], 'value' => $r['order_count']];
            }, $list);

            // 各设备类型收入（柱状）
            $incomeBar = array_map(function ($r) {
                return ['name' => $r['device_name'], 'value' => $r['income']];
            }, $list);

            return $this->success([
                'cards' => [
                    'device_total' => $deviceTotal,
                    'device_type_count' => count($list),
                ],
                'order_bar' => $orderBar,
                'income_bar' => $incomeBar,
                'list' => $list,
            ]);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
