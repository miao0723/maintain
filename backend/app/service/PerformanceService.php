<?php

namespace app\service;

use app\model\PerfEngineer;
use app\model\PerfDevice;
use app\model\PerfWorkOrder;
use app\model\PerfScoreRule;
use app\model\PerfScoreSnapshot;
use think\facade\Db;

/**
 * 绩效考核服务层
 * 负责：指标计算、按权重汇总得分、人员/班组排名、趋势、快照与规则读写。
 */
class PerformanceService
{
    // 已闭环（有完成时间）的工单状态
    const CLOSED_STATUSES = ['completed', 'timeout'];

    /**
     * 统一解析筛选条件中的时间范围（按报修时间统计）
     */
    private function applyDateRange($query, $filters)
    {
        $start = $filters['start_date'] ?? '';
        $end = $filters['end_date'] ?? '';
        if (!empty($start)) {
            $query->where('o.report_time', '>=', $start);
        }
        if (!empty($end)) {
            $query->where('o.report_time', '<=', $end . ' 23:59:59');
        }
        return $query;
    }

    /**
     * 获取筛选后的工单基础查询（含人员/设备关联字段）
     */
    private function orderQuery($filters = [])
    {
        $query = PerfWorkOrder::alias('o')
            ->leftJoin('perf_engineers e', 'o.engineer_id = e.id')
            ->leftJoin('perf_devices d', 'o.device_id = d.id')
            ->field('o.*, e.name as engineer_name, e.team as engineer_team, e.level as engineer_level, d.name as device_name, d.area as device_area, d.type as device_type');

        if (!empty($filters['engineer_id'])) {
            $query->where('o.engineer_id', $filters['engineer_id']);
        }
        if (!empty($filters['team'])) {
            $query->where('e.team', $filters['team']);
        }
        if (!empty($filters['status'])) {
            $query->where('o.status', $filters['status']);
        }
        if (!empty($filters['device_id'])) {
            $query->where('o.device_id', $filters['device_id']);
        }
        if (!empty($filters['keyword'])) {
            $kw = $filters['keyword'];
            $query->where(function ($q) use ($kw) {
                $q->where('o.order_no', 'like', "%{$kw}%")
                  ->whereOr('e.name', 'like', "%{$kw}%")
                  ->whereOr('d.name', 'like', "%{$kw}%")
                  ->whereOr('o.fault_desc', 'like', "%{$kw}%");
            });
        }
        return $this->applyDateRange($query, $filters);
    }

    /**
     * 从工单集合计算绩效指标
     * @param array $orders 工单数组（含 status/est_hours/actual_hours/repair_count/review_score）
     * 时长口径：est_hours/actual_hours/avg_duration 均为「小时」（2 位小数）
     */
    public function computeMetrics(array $orders)
    {
        $total = count($orders);
        $closed = array_filter($orders, function ($o) {
            return in_array($o['status'], self::CLOSED_STATUSES);
        });
        $closedCount = count($closed);

        $onTime = 0;
        $durationSum = 0.0;
        $durationCnt = 0;
        $reworkSum = 0;
        $firstFix = 0;
        $reviewSum = 0.0;
        $reviewCnt = 0;
        $qualifiedCnt = 0;
        $qualifiedJudged = 0;

        foreach ($closed as $o) {
            $est = isset($o['est_hours']) ? (float)$o['est_hours'] : 0;
            $act = isset($o['actual_hours']) ? (float)$o['actual_hours'] : 0;
            if ($act > 0 && ($act <= $est || $est <= 0)) {
                $onTime++;
            }
            if ($act > 0) {
                $durationSum += $act;
                $durationCnt++;
            }
            $reworkSum += (int)($o['repair_count'] ?? 0);
            if ((int)($o['repair_count'] ?? 0) === 0) {
                $firstFix++;
            }
            if (!empty($o['review_score'])) {
                $reviewSum += (int)$o['review_score'];
                $reviewCnt++;
            }
            if (array_key_exists('is_qualified', $o) && $o['is_qualified'] !== null && $o['is_qualified'] !== '') {
                $qualifiedJudged++;
                if ((int)$o['is_qualified'] === 1) {
                    $qualifiedCnt++;
                }
            }
        }

        return [
            'total'            => $total,
            'closed_count'     => $closedCount,
            'on_time_rate'     => $closedCount > 0 ? round($onTime / $closedCount * 100, 2) : 0,
            'avg_duration'     => $durationCnt > 0 ? round($durationSum / $durationCnt, 2) : 0,
            'completed_count'  => $closedCount,
            'rework_rate'      => $closedCount > 0 ? round($reworkSum / $closedCount * 100, 2) : 0,
            'first_fix_rate'   => $closedCount > 0 ? round($firstFix / $closedCount * 100, 2) : 0,
            'avg_review'       => $reviewCnt > 0 ? round($reviewSum / $reviewCnt, 2) : 0,
            'qualified_rate'   => $qualifiedJudged > 0 ? round($qualifiedCnt / $qualifiedJudged * 100, 2) : 0,
            'on_time_count'    => $onTime,
            'sample_count'     => $closedCount,
            'review_count'     => $reviewCnt,        // 已验收评分条数（用于判断评分指标是否有数据）
            'qualified_judged' => $qualifiedJudged,  // 已判定合格与否条数
            'overdue_open'     => $this->countOverdueOpen($orders),
        ];
    }

    /**
     * 统计"超期未交付"工单：仍处于待接单/维修中/待验收，且从报修至今已超过预计天数的工单数量。
     * 这是老板判断"是否符合标准"的重要风险信号——工单拖着不闭合同样属于不符合。
     */
    private function countOverdueOpen(array $orders)
    {
        $now = time();
        $cnt = 0;
        foreach ($orders as $o) {
            if (in_array($o['status'], self::CLOSED_STATUSES)) {
                continue;
            }
            $est = isset($o['est_hours']) ? (float)$o['est_hours'] : 0;
            if ($est <= 0 || empty($o['report_time'])) {
                continue;
            }
            $reportTs = strtotime($o['report_time']);
            if ($reportTs === false) {
                continue;
            }
            if (($now - $reportTs) / 3600 > $est) {
                $cnt++;
            }
        }
        return $cnt;
    }

    /**
     * 达标判定（老板视角的"是否符合标准"）
     * 规则：
     *   1) 样本充足：闭环工单数量 >= 最低样本量(min_orders)，否则"样本不足，暂不评级"；
     *   2) 综合得分 >= 达标分数线(pass_score)；
     *   3) 不再设"一票否决"——质量由权重体现（验收评分/合格率/一次修复率合计占比高），
     *      避免小样本下个别不符合项造成误判；单项是否达标以红绿灯逐项展示，供老板判断。
     * 返回：是否达标、是否样本不足、单项达标清单（红绿灯）。
     *
     * @param array $metrics computeMetrics 的输出
     * @param array $rules   评分规则（含 direction/pass_value）
     * @param array $config  ['pass_score'=>80,'min_orders'=>3]
     */
    public function evaluateStandard(array $metrics, array $rules, array $config)
    {
        $passScore = (float)($config['pass_score'] ?? 80);
        $minOrders = (int)($config['min_orders'] ?? 3);
        $score = (float)($metrics['score'] ?? 0);
        $closed = (int)($metrics['closed_count'] ?? 0);

        $sampleOk = $closed >= $minOrders;

        // 单项达标清单
        $indicators = [];
        $criticalKeys = []; // 不再一票否决
        $criticalFail = false;
        $ruleList = is_array($rules) ? $rules : $rules->toArray();

        // 复用"无数据不计入"的判定，避免把未验收/未判定项算成未达标
        $reviewCnt = (int)($metrics['review_count'] ?? 0);
        $qualifiedJudged = (int)($metrics['qualified_judged'] ?? 0);
        $hasData = [
            'avg_review'      => $reviewCnt > 0,
            'qualified_rate'  => $qualifiedJudged > 0,
            'on_time_rate'    => $closed > 0,
            'first_fix_rate'  => $closed > 0,
            'rework_rate'     => $closed > 0,
            'completed_count' => $closed > 0,
            'avg_duration'    => $closed > 0,
        ];

        foreach ($ruleList as $rule) {
            if (empty($rule['enabled'])) {
                continue;
            }
            $key = $rule['indicator_key'];
            if (array_key_exists($key, $hasData) && !$hasData[$key]) {
                continue; // 无数据项不参与达标判定
            }
            $actual = (float)($metrics[$key] ?? 0);
            $passVal = (float)($rule['pass_value'] ?? ($rule['target_value'] ?? 0));
            $direction = $rule['direction'] ?? 'higher';
            if ($direction === 'lower') {
                $met = $passVal <= 0 ? true : ($actual <= $passVal);
            } else {
                $met = $passVal <= 0 ? true : ($actual >= $passVal);
            }
            $isCritical = in_array($key, $criticalKeys);
            if ($isCritical && !$met) {
                $criticalFail = true;
            }
            $indicators[] = [
                'key'         => $key,
                'name'        => $rule['indicator_name'] ?? $key,
                'actual'      => round($actual, 2),
                'pass_value'  => $passVal,
                'direction'   => $direction,
                'met'         => $met,
                'critical'    => $isCritical,
            ];
        }

        $insufficient = !$sampleOk;
        $isStandard = $sampleOk && ($score >= $passScore) && !$criticalFail;

        return [
            'is_standard'   => $isStandard,
            'insufficient'  => $insufficient,
            'score_pass'    => $score >= $passScore,
            'critical_fail' => $criticalFail,
            'sample_ok'     => $sampleOk,
            'closed_count'  => $closed,
            'pass_score'    => $passScore,
            'min_orders'    => $minOrders,
            'indicators'    => $indicators,
        ];
    }

    /**
     * 按启用的评分规则把指标换算为综合得分（0-100）。
     * 合理性处理：某项指标无数据（如尚无验收评分/尚未判定合格）时不计入，权重按有数据项重新归一化，
     * 避免"没被验收"被当成"做得差"而拉低总分。
     */
    public function scoreMetrics(array $metrics, $rules = null)
    {
        if ($rules === null) {
            $rules = PerfScoreRule::where('enabled', 1)->order('sort', 'asc')->select();
        }
        $ruleList = is_array($rules) ? $rules : $rules->toArray();
        if (empty($ruleList)) {
            return 0;
        }

        // 各指标"是否有有效数据"的判定
        $closed = (int)($metrics['closed_count'] ?? 0);
        $hasData = [
            'avg_review'      => (int)($metrics['review_count'] ?? 0) > 0,
            'qualified_rate'  => (int)($metrics['qualified_judged'] ?? 0) > 0,
            'on_time_rate'    => $closed > 0,
            'first_fix_rate'  => $closed > 0,
            'rework_rate'     => $closed > 0,
            'completed_count' => $closed > 0,
            'avg_duration'    => $closed > 0,
        ];

        $totalWeight = 0;
        $weighted = 0;
        foreach ($ruleList as $rule) {
            $w = (float)($rule['weight'] ?? 0);
            $enabled = isset($rule['enabled']) ? (int)$rule['enabled'] : 1;
            if (!$enabled || $w <= 0) {
                continue;
            }
            $key = $rule['indicator_key'];
            // 无数据的指标跳过（权重让给有数据项）
            if (array_key_exists($key, $hasData) && !$hasData[$key]) {
                continue;
            }
            $target = (float)($rule['target_value'] ?? 100);
            $actual = (float)($metrics[$key] ?? 0);
            $score = $this->normalize($actual, $target, $rule['direction']);

            $weighted += $score * $w;
            $totalWeight += $w;
        }
        return $totalWeight > 0 ? round($weighted / $totalWeight, 2) : 0;
    }

    /**
     * 单项得分归一化到 0-100
     */
    private function normalize($actual, $target, $direction)
    {
        if ($direction === 'lower') {
            if ($actual <= 0) {
                return 100; // 越低越好且实际为 0，满分
            }
            return round(min(100, $target / $actual * 100), 2);
        }
        // higher
        if ($target <= 0) {
            return $actual > 0 ? 100 : 0;
        }
        return round(min(100, $actual / $target * 100), 2);
    }

    /**
     * 绩效总览看板
     */
    public function getOverview($filters = [])
    {
        $orders = $this->orderQuery($filters)->select()->toArray();
        $metrics = $this->computeMetrics($orders);
        $score = $this->scoreMetrics($metrics);

        // 状态分布
        $statusDist = [];
        foreach (PerfWorkOrder::$statusMap as $k => $v) {
            $statusDist[] = [
                'status' => $k,
                'label'  => $v,
                'count'  => count(array_filter($orders, fn($o) => $o['status'] === $k)),
            ];
        }

        // 趋势（按月）
        $trend = $this->trend($filters);

        // 人员排名 Top5
        $ranking = $this->ranking($filters, 'engineer', 'score', 'desc');
        $topEngineers = array_slice($ranking['list'], 0, 5);

        // 班组概览
        $teamSummary = $this->teamSummary($filters);

        // 达标汇总（老板视角：多少人符合标准）
        $config = $this->getAllConfig();
        $allEngineers = $this->ranking($filters, 'engineer', 'score', 'desc');
        $standardSummary = [
            'total'        => 0,
            'qualified'    => 0,
            'unqualified'  => 0,
            'insufficient' => 0,
            'pass_score'   => $config['pass_score'],
            'min_orders'   => $config['min_orders'],
        ];
        $alerts = [];
        foreach ($allEngineers['list'] as $e) {
            $std = $e['standard'] ?? null;
            if (!$std) {
                continue;
            }
            $standardSummary['total']++;
            if ($std['insufficient']) {
                $standardSummary['insufficient']++;
            } elseif ($std['is_standard']) {
                $standardSummary['qualified']++;
            } else {
                $standardSummary['unqualified']++;
                $alerts[] = [
                    'engineer_id' => $e['engineer_id'],
                    'name'        => $e['name'],
                    'team'        => $e['team'],
                    'score'       => $e['score'],
                    'reason'      => $this->standardFailReason($std),
                ];
            }
        }
        // 不达标预警按得分升序（最差在前），最多 6 条
        usort($alerts, fn($a, $b) => $a['score'] <=> $b['score']);
        $alerts = array_slice($alerts, 0, 6);

        return [
            'kpis' => array_merge($metrics, ['score' => $score]),
            'status_distribution' => $statusDist,
            'trend' => $trend,
            'top_engineers' => $topEngineers,
            'team_summary' => $teamSummary,
            'standard_summary' => $standardSummary,
            'alerts' => $alerts,
            'overdue_open_total' => $metrics['overdue_open'] ?? 0,
        ];
    }

    /**
     * 生成"不达标原因"摘要（用于老板预警列表）
     */
    private function standardFailReason(array $std)
    {
        if ($std['insufficient']) {
            return "闭环工单仅 {$std['closed_count']} 单（< 最低样本量 {$std['min_orders']}），样本不足暂不评级";
        }
        $reasons = [];
        if (!$std['score_pass']) {
            $reasons[] = "综合得分 {$std['pass_score']} 分未达达标线";
        }
        if ($std['critical_fail']) {
            $reasons[] = "合格率未达标（存在不符合工单）";
        }
        foreach ($std['indicators'] as $ind) {
            if (!$ind['met'] && !$ind['critical']) {
                $reasons[] = "{$ind['name']}未达标";
            }
        }
        return implode('；', $reasons) ?: '综合未达标';
    }

    /**
     * 按月趋势
     */
    public function trend($filters = [])
    {
        $query = PerfWorkOrder::alias('o')
            ->field("DATE_FORMAT(o.report_time, '%Y-%m') as period")
            ->field('COUNT(*) as total')
            ->field('SUM(CASE WHEN o.status IN (\'completed\',\'timeout\') THEN 1 ELSE 0 END) as closed')
                ->field('SUM(CASE WHEN o.status IN (\'completed\',\'timeout\') AND (o.actual_hours <= o.est_hours OR o.est_hours <= 0) THEN 1 ELSE 0 END) as on_time')
                ->field('AVG(CASE WHEN o.status IN (\'completed\',\'timeout\') AND o.actual_hours > 0 THEN o.actual_hours END) as avg_duration')
            ->group('period')
            ->order('period', 'asc');
        if (!empty($filters['team'])) {
            $query->leftJoin('perf_engineers e', 'o.engineer_id = e.id')->where('e.team', $filters['team']);
        }
        if (!empty($filters['engineer_id'])) {
            $query->where('o.engineer_id', $filters['engineer_id']);
        }
        if (!empty($filters['start_date'])) {
            $query->where('o.report_time', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->where('o.report_time', '<=', $filters['end_date'] . ' 23:59:59');
        }
        $rows = $query->select()->toArray();
        return array_map(function ($r) {
            $closed = (int)$r['closed'];
            return [
                'period'       => $r['period'],
                'order_count'  => (int)$r['total'],
                'on_time_rate' => $closed > 0 ? round((int)$r['on_time'] / $closed * 100, 2) : 0,
                'avg_duration' => $r['avg_duration'] ? round((float)$r['avg_duration'], 2) : 0,
            ];
        }, $rows);
    }

    /**
     * 人员 / 班组 排名
     * @param string $dimension engineer | team
     */
    public function ranking($filters = [], $dimension = 'engineer', $sortBy = 'score', $sortDir = 'desc')
    {
        $orders = $this->orderQuery($filters)->select()->toArray();

        if ($dimension === 'team') {
            $groups = [];
            foreach ($orders as $o) {
                $key = $o['engineer_team'] ?: '未分配';
                $groups[$key][] = $o;
            }
            $list = [];
            foreach ($groups as $team => $os) {
                $m = $this->computeMetrics($os);
                $list[] = [
                    'team' => $team,
                    'engineer_count' => count(array_unique(array_column($os, 'engineer_id'))),
                    'metrics' => $m,
                    'score' => $this->scoreMetrics($m),
                ];
            }
        } else {
            // 按人员分组
            $map = [];
            foreach ($orders as $o) {
                $eid = $o['engineer_id'];
                if (!$eid) {
                    continue;
                }
                $map[$eid] = $map[$eid] ?? [
                    'engineer_id' => $eid,
                    'name' => $o['engineer_name'],
                    'team' => $o['engineer_team'],
                    'level' => $o['engineer_level'],
                    'orders' => [],
                ];
                $map[$eid]['orders'][] = $o;
            }
            $list = [];
            foreach ($map as $eid => $g) {
                $m = $this->computeMetrics($g['orders']);
                $list[] = [
                    'engineer_id' => $eid,
                    'name' => $g['name'],
                    'team' => $g['team'],
                    'level' => $g['level'],
                    'metrics' => $m,
                    'score' => $this->scoreMetrics($m),
                ];
            }
        }

        // 排序
        $sortField = in_array($sortBy, ['on_time_rate', 'avg_duration', 'completed_count', 'rework_rate', 'first_fix_rate', 'avg_review', 'qualified_rate', 'score']) ? $sortBy : 'score';
        if ($dimension === 'team') {
            $sortField = in_array($sortBy, ['score', 'completed_count', 'on_time_rate', 'qualified_rate']) ? $sortBy : 'score';
        }
        usort($list, function ($a, $b) use ($sortField, $sortDir, $dimension) {
            $va = $dimension === 'team' ? ($a[$sortField] ?? 0) : ($a['metrics'][$sortField] ?? 0);
            $vb = $dimension === 'team' ? ($b[$sortField] ?? 0) : ($b['metrics'][$sortField] ?? 0);
            return $sortDir === 'asc' ? ($va <=> $vb) : ($vb <=> $va);
        });

        // 名次
        foreach ($list as $i => &$row) {
            $row['rank'] = $i + 1;
        }
        unset($row);

        // 达标判定（老板视角：是否符合标准）
        $rules = PerfScoreRule::order('sort', 'asc')->select()->toArray();
        $config = $this->getAllConfig();
        foreach ($list as &$row) {
            $metrics = array_merge(['score' => $row['score']], $row['metrics']);
            $row['standard'] = $this->evaluateStandard($metrics, $rules, $config);
        }
        unset($row);

        return [
            'dimension' => $dimension,
            'total' => count($list),
            'pass_score' => $config['pass_score'],
            'min_orders' => $config['min_orders'],
            'list' => $list,
        ];
    }

    /**
     * 班组得分概览（用于饼图/柱状）
     */
    public function teamSummary($filters = [])
    {
        $res = $this->ranking($filters, 'team', 'score', 'desc');
        return array_map(function ($t) {
            return [
                'team' => $t['team'],
                'score' => $t['score'],
                'completed_count' => $t['metrics']['completed_count'],
                'on_time_rate' => $t['metrics']['on_time_rate'],
            ];
        }, $res['list']);
    }

    /**
     * 工单列表（分页）
     */
    public function getWorkOrders($filters = [], $page = 1, $pageSize = 10)
    {
        $query = $this->orderQuery($filters);
        $count = (clone $query)->count();
        $list = $query->order('o.report_time', 'desc')
            ->page($page, $pageSize)
            ->select()
            ->toArray();
        $list = array_map([$this, 'appendOverdueFlag'], $list);
        return [
            'list' => $list,
            'pagination' => [
                'page' => (int)$page,
                'page_size' => (int)$pageSize,
                'total' => (int)$count,
            ],
        ];
    }

    /**
     * 给工单数组附加"超期未交付"标记（est_hours 为小时口径）
     */
    private function appendOverdueFlag(array $order)
    {
        $order['is_overdue_open'] = 0;
        if (!in_array($order['status'], self::CLOSED_STATUSES)) {
            $est = isset($order['est_hours']) ? (float)$order['est_hours'] : 0;
            if ($est > 0 && !empty($order['report_time'])) {
                $reportTs = strtotime($order['report_time']);
                if ($reportTs !== false && (time() - $reportTs) / 3600 > $est) {
                    $order['is_overdue_open'] = 1;
                }
            }
        }
        return $order;
    }

    /**
     * 工单详情
     */
    public function getWorkOrderDetail($id)
    {
        $order = PerfWorkOrder::alias('o')
            ->leftJoin('perf_engineers e', 'o.engineer_id = e.id')
            ->leftJoin('perf_devices d', 'o.device_id = d.id')
            ->field('o.*, e.name as engineer_name, e.team as engineer_team, e.level as engineer_level, d.name as device_name, d.area as device_area, d.type as device_type, d.fault_desc as device_fault_desc')
            ->where('o.id', $id)
            ->find();
        if (!$order) {
            return null;
        }
        return $this->appendOverdueFlag($order->toArray());
    }

    /**
     * 人员列表（供筛选）
     */
    public function getEngineers()
    {
        return PerfEngineer::where('status', 1)->field('id,engineer_no,name,team,level')->order('team,id')->select()->toArray();
    }

    /**
     * 班组列表（供筛选）
     */
    public function getTeams()
    {
        return PerfEngineer::where('status', 1)->distinct(true)->order('team')->column('team');
    }

    /**
     * 评分规则列表
     */
    public function getScoreRules()
    {
        return PerfScoreRule::order('sort', 'asc')->select()->toArray();
    }

    /**
     * 更新评分规则（按 id 批量更新权重/启用）
     * @param array $rules [['id'=>1,'weight'=>30,'enabled'=>1], ...]
     */
    public function updateScoreRules(array $rules, $userId = null)
    {
        $this->assertBoss($userId);
        Db::startTrans();
        try {
            foreach ($rules as $r) {
                if (empty($r['id'])) {
                    continue;
                }
                $data = [];
                if (isset($r['weight'])) {
                    $data['weight'] = (float)$r['weight'];
                }
                if (isset($r['enabled'])) {
                    $data['enabled'] = (int)$r['enabled'];
                }
                if (isset($r['target_value'])) {
                    $data['target_value'] = (float)$r['target_value'];
                }
                if (!empty($data)) {
                    PerfScoreRule::where('id', $r['id'])->update($data);
                }
            }
            Db::commit();
            return $this->getScoreRules();
        } catch (\Exception $e) {
            Db::rollback();
            throw $e;
        }
    }

    /**
     * 重置评分规则为默认权重（合计 100%，方向/目标/达标基准完整写回，避免"恢复默认"丢失定义）
     *
     * 设计思路（质量主导、时效其次、工作量适度，去除冗余与误判）：
     *  - 验收评分 30%：验收人综合评判，是最贴近"做得好不好"的权威信号；
     *  - 按时完成率 25%：时效（相对预计工期，跨设备复杂度公平）；
     *  - 合格率 20%：交付是否一次合格；
     *  - 一次修复率 15%：稳定性；
     *  - 工单完成量 10%：工作量（适度，避免只拼量忽视质）；
     *  - 返修率 / 平均维修时长 停用：返修率与一次修复率重复；平均时长按"天"横向不可比（不同设备工期不同），
     *    时效已由按时完成率覆盖。保留行仅作停用，可随时在规则页重新启用。
     *  - 取消"一票否决"，改为加权得分 + 最低样本量门槛，避免小样本误判（见 evaluateStandard）。
     */
    public function resetScoreRules($userId = null)
    {
        $this->assertBoss($userId);
        $defaults = [
            ['indicator_key' => 'avg_review',      'weight' => 30, 'direction' => 'higher', 'target_value' => 4.5, 'pass_value' => 4.0, 'unit' => '分',  'enabled' => 1, 'sort' => 1],
            ['indicator_key' => 'on_time_rate',    'weight' => 25, 'direction' => 'higher', 'target_value' => 95,  'pass_value' => 90,  'unit' => '%',   'enabled' => 1, 'sort' => 2],
            ['indicator_key' => 'qualified_rate',  'weight' => 20, 'direction' => 'higher', 'target_value' => 100, 'pass_value' => 95,  'unit' => '%',   'enabled' => 1, 'sort' => 3],
            ['indicator_key' => 'first_fix_rate',  'weight' => 15, 'direction' => 'higher', 'target_value' => 95,  'pass_value' => 90,  'unit' => '%',   'enabled' => 1, 'sort' => 4],
            ['indicator_key' => 'completed_count', 'weight' => 10, 'direction' => 'higher', 'target_value' => 8,   'pass_value' => 5,   'unit' => '单',  'enabled' => 1, 'sort' => 5],
            ['indicator_key' => 'rework_rate',     'weight' => 0,  'direction' => 'lower',  'target_value' => 5,   'pass_value' => 10,  'unit' => '%',   'enabled' => 0, 'sort' => 6],
            ['indicator_key' => 'avg_duration',    'weight' => 0,  'direction' => 'lower',  'target_value' => 72,  'pass_value' => 72,  'unit' => '小时', 'enabled' => 0, 'sort' => 7],
        ];
        foreach ($defaults as $d) {
            PerfScoreRule::where('indicator_key', $d['indicator_key'])->update([
                'weight'       => $d['weight'],
                'direction'   => $d['direction'],
                'target_value' => $d['target_value'],
                'pass_value'  => $d['pass_value'],
                'unit'        => $d['unit'],
                'enabled'     => $d['enabled'],
                'sort'        => $d['sort'],
            ]);
        }
        return $this->getScoreRules();
    }

    // ===================== 绩效配置（达标线 / 最低样本量） =====================

    /**
     * 读取全部绩效配置（key => value）
     */
    public function getAllConfig()
    {
        $rows = Db::name('perf_config')->column('v', 'k');
        return [
            'pass_score' => isset($rows['pass_score']) ? (float)$rows['pass_score'] : 80,
            'min_orders' => isset($rows['min_orders']) ? (int)$rows['min_orders'] : 3,
        ];
    }

    /**
     * 读取单个配置
     */
    public function getConfig($key, $default = 0)
    {
        $v = Db::name('perf_config')->where('k', $key)->value('v');
        return $v === null ? $default : $v;
    }

    /**
     * 批量保存配置
     * @param array $data ['pass_score'=>80, 'min_orders'=>3]
     */
    public function saveConfig(array $data, $userId = null)
    {
        $this->assertBoss($userId);
        Db::startTrans();
        try {
            foreach (['pass_score', 'min_orders'] as $k) {
                if (!array_key_exists($k, $data)) {
                    continue;
                }
                $val = $data[$k];
                if (!is_numeric($val)) {
                    throw new \Exception("配置项 {$k} 必须为数字");
                }
                Db::name('perf_config')->where('k', $k)->update(['v' => (string)$val]);
            }
            Db::commit();
            return $this->getAllConfig();
        } catch (\Exception $e) {
            Db::rollback();
            throw $e;
        }
    }

    /**
     * 生成并保存绩效得分快照（按时间段，人员 + 班组维度）
     */
    public function generateSnapshot($filters = [], $periodLabel = '', $userId = null)
    {
        $this->assertBoss($userId);
        if (empty($periodLabel)) {
            $periodLabel = (!empty($filters['start_date']) ? $filters['start_date'] : 'all')
                . '~' . (!empty($filters['end_date']) ? $filters['end_date'] : 'now');
        }

        $engineerRank = $this->ranking($filters, 'engineer', 'score', 'desc');
        $teamRank = $this->ranking($filters, 'team', 'score', 'desc');

        Db::startTrans();
        try {
            // 先删除同周期同维度，避免重复
            PerfScoreSnapshot::where('period_label', $periodLabel)->delete();

            foreach ($engineerRank['list'] as $r) {
                $std = $r['standard'] ?? null;
                PerfScoreSnapshot::create([
                    'period_label' => $periodLabel,
                    'dimension' => 'engineer',
                    'ref_id' => $r['engineer_id'],
                    'ref_name' => $r['name'],
                    'team' => $r['team'],
                    'on_time_rate' => $r['metrics']['on_time_rate'],
                    'avg_duration' => $r['metrics']['avg_duration'],
                    'completed_count' => $r['metrics']['completed_count'],
                    'rework_rate' => $r['metrics']['rework_rate'],
                    'first_fix_rate' => $r['metrics']['first_fix_rate'],
                    'avg_review' => $r['metrics']['avg_review'],
                    'qualified_rate' => $r['metrics']['qualified_rate'],
                    'score' => $r['score'],
                    'is_standard' => $std ? ($std['insufficient'] ? -1 : ($std['is_standard'] ? 1 : 0)) : 0,
                    'rank' => $r['rank'],
                ]);
            }
            foreach ($teamRank['list'] as $r) {
                $std = $r['standard'] ?? null;
                PerfScoreSnapshot::create([
                    'period_label' => $periodLabel,
                    'dimension' => 'team',
                    'ref_id' => 0,
                    'ref_name' => $r['team'],
                    'team' => $r['team'],
                    'on_time_rate' => $r['metrics']['on_time_rate'],
                    'avg_duration' => $r['metrics']['avg_duration'],
                    'completed_count' => $r['metrics']['completed_count'],
                    'rework_rate' => $r['metrics']['rework_rate'],
                    'first_fix_rate' => $r['metrics']['first_fix_rate'],
                    'avg_review' => $r['metrics']['avg_review'],
                    'qualified_rate' => $r['metrics']['qualified_rate'],
                    'score' => $r['score'],
                    'is_standard' => $std ? ($std['insufficient'] ? -1 : ($std['is_standard'] ? 1 : 0)) : 0,
                    'rank' => $r['rank'],
                ]);
            }
            Db::commit();
            return ['period_label' => $periodLabel, 'engineer_count' => count($engineerRank['list']), 'team_count' => count($teamRank['list'])];
        } catch (\Exception $e) {
            Db::rollback();
            throw $e;
        }
    }

    /**
     * 快照列表
     */
    public function listSnapshots($dimension = '', $periodLabel = '')
    {
        $query = PerfScoreSnapshot::order('created_at', 'desc')->order('dimension')->order('rank');
        if ($dimension) {
            $query->where('dimension', $dimension);
        }
        if ($periodLabel) {
            $query->where('period_label', $periodLabel);
        }
        return $query->select()->toArray();
    }

    /**
     * 周期标签列表（去重）
     */
    public function periodLabels()
    {
        return PerfScoreSnapshot::distinct(true)->order('period_label', 'desc')->column('period_label');
    }

    // ===================== 工人端（自建工单 / 交付 / 判定） =====================

    /**
     * 根据登录用户 id 解析其关联的维修人员 id
     * @return int|null 非工人返回 null
     */
    public function resolveEngineerId($userId)
    {
        if (empty($userId)) {
            return null;
        }
        return PerfEngineer::where('user_id', $userId)->value('id');
    }

    /**
     * 判断用户是否为老板/超管（与 PermissionCheck::isBoss 同规则）：
     * role_type=1（或 admin/super_admin）｜ id∈{1,2} ｜ 角色码∈{admin,boss,super_admin}
     */
    private function isBossUser($userId): bool
    {
        if (empty($userId)) {
            return false;
        }
        $user = Db::name('users')
            ->alias('u')
            ->leftJoin('roles r', 'u.role_id = r.id')
            ->field('u.id, u.role_type, r.code as role_code')
            ->where('u.id', (int)$userId)
            ->find();
        if (!$user) {
            return false;
        }
        $roleType = $user['role_type'] ?? null;
        if ($roleType === 'admin' || $roleType === 'super_admin' || (int)$roleType === 1) {
            return true;
        }
        if (in_array((int)$user['id'], [1, 2], true)) {
            return true;
        }
        return in_array($user['role_code'] ?? '', ['admin', 'boss', 'super_admin'], true);
    }

    /**
     * 断言老板/超管（验收评分、评分规则、绩效配置、快照等管理操作）
     */
    private function assertBoss($userId): void
    {
        if (!$this->isBossUser($userId)) {
            throw new \Exception('仅管理员/老板可执行该操作');
        }
    }

    /**
     * 断言维修人员身份（工人自助操作：建单/编辑/交付/删除）
     * 老板保留通揽能力（历史行为），HR/普通员工等无档案账号禁止操作他人工单
     */
    private function assertWorker($userId): int
    {
        $engineerId = $this->resolveEngineerId($userId);
        if ($engineerId === null) {
            if ($this->isBossUser($userId)) {
                return 0; // 老板：不限
            }
            throw new \Exception('该操作仅限维修人员账号');
        }
        return (int)$engineerId;
    }

    /**
     * 当前用户的绩效上下文（前端判断是否工人视角）
     */
    public function getMyContext($userId)
    {
        $engineerId = $this->resolveEngineerId($userId);
        if (!$engineerId) {
            return ['is_worker' => false, 'engineer' => null];
        }
        $engineer = PerfEngineer::field('id,engineer_no,name,team,level')->find($engineerId);
        return ['is_worker' => true, 'engineer' => $engineer ? $engineer->toArray() : null];
    }

    /**
     * 设备列表（工人添加工单时选择，支持关键字）
     */
    public function getDevices($keyword = '')
    {
        $query = PerfDevice::where('status', 1)->field('id,device_no,name,type,area,fault_desc,engineer_id,est_hours');
        if (!empty($keyword)) {
            $kw = $keyword;
            $query->where(function ($q) use ($kw) {
                $q->where('name', 'like', "%{$kw}%")
                  ->whereOr('type', 'like', "%{$kw}%")
                  ->whereOr('area', 'like', "%{$kw}%");
            });
        }
        return $query->order('id', 'desc')->select()->toArray();
    }

    /**
     * 新建设备（工人维护设备台账）
     * 写入归属维修人员与规划维修天数
     */
    public function createDevice($userId, array $input)
    {
        if (empty($input['name'])) {
            throw new \Exception('请填写设备名称');
        }
        $engineerId = $this->resolveEngineerId($userId);
        $device = PerfDevice::create([
            'name'       => trim($input['name']),
            'type'       => $input['type'] ?? '',
            'area'       => $input['area'] ?? '',
            'fault_desc' => $input['fault_desc'] ?? '',
            'status'     => 1,
            'engineer_id' => $engineerId ?: 0,
            'est_hours'  => isset($input['est_hours']) ? (float)$input['est_hours'] : null,
        ]);
        return $this->getDeviceDetail($device->id);
    }

    /**
     * 设备详情
     */
    public function getDeviceDetail($id)
    {
        $device = PerfDevice::field('id,device_no,name,type,area,fault_desc,status,engineer_id,est_hours,created_at')->find($id);
        return $device ? $device->toArray() : null;
    }

    /**
     * 更新设备（仅设备归属人/管理员可改）
     */
    public function updateDevice($id, $userId, array $input)
    {
        $device = PerfDevice::find($id);
        if (!$device) {
            throw new \Exception('设备不存在');
        }
        $this->assertDeviceManage($device, $userId);

        $allow = ['name', 'type', 'area', 'fault_desc', 'est_hours'];
        $data = [];
        foreach ($allow as $k) {
            if (array_key_exists($k, $input)) {
                $data[$k] = $k === 'est_hours' ? (strlen($input[$k]) ? (float)$input[$k] : null) : $input[$k];
            }
        }
        if (!empty($data)) {
            $device->save($data);
        }
        return $this->getDeviceDetail($id);
    }

    /**
     * 删除设备（仅设备归属人/管理员可删）
     */
    public function deleteDevice($id, $userId)
    {
        $device = PerfDevice::find($id);
        if (!$device) {
            throw new \Exception('设备不存在');
        }
        $this->assertDeviceManage($device, $userId);
        // 已有工单的设备不可直接删除，避免数据悬空
        $used = PerfWorkOrder::where('device_id', $id)->count();
        if ($used > 0) {
            throw new \Exception('该设备已有关联工单，无法删除（可改为停用）');
        }
        $device->delete();
        return true;
    }

    /**
     * 设备可管理性校验：管理员(无绩效档案)可管理全部；工人仅可管理自己或共享设备
     */
    private function assertDeviceManage($device, $userId)
    {
        $myEngineerId = $this->resolveEngineerId($userId);
        if ($myEngineerId === null) {
            return; // 管理员
        }
        $owner = (int)($device->engineer_id ?? 0);
        if ($owner !== 0 && $owner !== (int)$myEngineerId) {
            throw new \Exception('只能管理自己名下的设备');
        }
    }

    /**
     * 工人自建维修工单
     * 流程：先选/建设备 → 制定预计天数 → 创建
     * 初始状态默认「维修中」（自动接单）；也支持「待维修」（已建单但尚未开始维修，接单时间留空）。
     */
    public function createSelfWorkOrder($userId, array $input)
    {
        $engineerId = $this->resolveEngineerId($userId);
        if (!$engineerId) {
            throw new \Exception('当前账号未关联维修人员档案，无法自建工单');
        }

        // 设备：优先使用已有，否则新建
        $deviceId = !empty($input['device_id']) ? (int)$input['device_id'] : 0;
        if ($deviceId <= 0) {
            if (empty($input['device_name'])) {
                throw new \Exception('请填写设备名称或选择已有设备');
            }
            $device = PerfDevice::create([
                'name'       => trim($input['device_name']),
                'type'       => $input['device_type'] ?? '',
                'area'       => $input['device_area'] ?? '',
                'fault_desc' => $input['device_fault'] ?? '',
                'status'     => 1,
                'engineer_id' => $engineerId ?: 0,
            ]);
            $deviceId = $device->id;
        } else {
            $device = PerfDevice::find($deviceId);
            if (!$device) {
                throw new \Exception('所选设备不存在');
            }
        }

        // 预计工时（小时）：未传默认 8 小时（半个工作日）；非法值按默认处理
        $estHours = isset($input['est_hours']) && (float)$input['est_hours'] > 0
            ? round((float)$input['est_hours'], 2)
            : 8;
        $now = date('Y-m-d H:i:s');
        $orderNo = $this->genOrderNo();

        // 初始状态：默认「维修中」（自动接单）；也支持「待维修」（已建单但未开始维修）
        $allowedInit = [PerfWorkOrder::STATUS_TO_REPAIR, PerfWorkOrder::STATUS_PROCESSING];
        $initStatus = in_array($input['status'] ?? '', $allowedInit, true)
            ? $input['status']
            : PerfWorkOrder::STATUS_PROCESSING;

        $order = PerfWorkOrder::create([
            'order_no'    => $orderNo,
            'device_id'   => $deviceId,
            'engineer_id' => $engineerId,
            'report_time' => $now,
            // 仅「维修中」自动接单并记录接单时间；「待维修」尚未开始，接单时间留空
            'accept_time' => $initStatus === PerfWorkOrder::STATUS_PROCESSING ? $now : null,
            'status'      => $initStatus,
            'est_hours'   => $estHours,
            'fault_desc'  => $input['fault_desc'] ?? $device->fault_desc ?? '',
            'priority'    => $input['priority'] ?? 'normal',
            'remark'      => $input['remark'] ?? '',
            // 维修图片（选填）：创建时可不带，维修中可随时补充
            'images'      => $this->normalizeImages($input['images'] ?? null),
        ]);

        return $this->getWorkOrderDetail($order->id);
    }

    /**
     * 维修图片归一化：仅接受 /uploads/ 相对路径数组，最多 9 张
     * @param mixed $images 数组或 JSON 字符串（前端 FormData 场景兜底）
     * @return array|null 空值返回 null（不占位，避免落空数组）
     */
    private function normalizeImages($images)
    {
        if (is_string($images)) {
            $decoded = json_decode($images, true);
            $images = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($images)) {
            return null;
        }
        $list = [];
        foreach ($images as $url) {
            if (!is_string($url)) {
                continue;
            }
            $url = trim($url);
            // 安全约束：只允许本站上传目录下的相对路径，拒绝外链/绝对路径/脚本地址
            if ($url === '' || strpos($url, '/uploads/') !== 0) {
                continue;
            }
            $list[] = $url;
            if (count($list) >= 9) {
                break;
            }
        }
        return $list ?: null;
    }

    /**
     * 生成唯一工单编号
     */
    private function genOrderNo()
    {
        $no = 'WO-' . date('Ymd') . '-' . str_pad(mt_rand(1, 9999), 4, '0');
        // 极小概率冲突时追加随机位
        if (PerfWorkOrder::where('order_no', $no)->count() > 0) {
            $no .= mt_rand(10, 99);
        }
        return $no;
    }

    /**
     * 工人交付工单（填写完成说明 + 自评 → 待验收）
     */
    public function deliverWorkOrder($id, $userId, array $input = [])
    {
        $order = PerfWorkOrder::find($id);
        if (!$order) {
            throw new \Exception('工单不存在');
        }
        $this->assertOwnership($order, $userId);
        if (!in_array($order->status, [PerfWorkOrder::STATUS_PENDING, PerfWorkOrder::STATUS_PROCESSING, PerfWorkOrder::STATUS_TO_REPAIR])) {
            throw new \Exception('该工单已交付/完成，无法重复交付');
        }

        $now = date('Y-m-d H:i:s');
        $report = $order->report_time ?: $now;
        // 实际工时（小时，2 位小数）：分钟级维修也能精确体现，不再四舍五入成 0 天
        $actualHours = round((strtotime($now) - strtotime($report)) / 3600, 2);
        $actualHours = max($actualHours, 0);

        $order->complete_time    = $now;
        $order->actual_hours     = $actualHours;
        $order->status           = PerfWorkOrder::STATUS_WAITING; // 待验收
        $order->completion_note  = $input['completion_note'] ?? $order->completion_note;
        $order->self_score       = isset($input['self_score']) && $input['self_score'] !== ''
            ? (int)$input['self_score'] : $order->self_score;
        if (!empty($input['delay_reason'])) {
            $order->delay_reason = $input['delay_reason'];
        }
        $order->save();

        return $this->getWorkOrderDetail($id);
    }

    /**
     * 管理员/老板验收评分（交付后由管理员判定合格并打分 → 已完成）
     * 仅老板/超管可操作（HR 等只读账号被拒），工人不能自己验收自己。
     * @param int $isQualified 1 符合 / 0 不符合
     * @param int $reviewScore 验收评分 1-5
     */
    public function reviewWorkOrder($id, $userId, $isQualified, $reviewScore, $comment = '')
    {
        $order = PerfWorkOrder::find($id);
        if (!$order) {
            throw new \Exception('工单不存在');
        }
        // 仅老板/超管可验收：维修人员禁止自验，HR/普通员工等只读账号同样禁止
        $this->assertBoss($userId);
        if ($order->status !== PerfWorkOrder::STATUS_WAITING) {
            throw new \Exception('仅「待验收」状态的工单可以验收评分');
        }

        $order->is_qualified    = (int)$isQualified;
        $order->review_score    = (int)$reviewScore;
        $order->review_comment  = $comment ?: $order->review_comment;
        $order->status          = PerfWorkOrder::STATUS_COMPLETED; // 已完成
        $order->save();

        return $this->getWorkOrderDetail($id);
    }

    /**
     * 管理员/老板修改已验收工单的评分（验收完成后发现打分/判定有误时可修正）
     * 约束：
     *  - 仅老板/超管可操作（HR 等只读账号被拒）；
     *  - 工单必须已验收完成（completed 且已有评分）；
     *  - 不改变工单状态与绩效快照口径，仅修正评分三要素，操作留痕于 updated_at。
     */
    public function updateReviewWorkOrder($id, $userId, $isQualified, $reviewScore, $comment = '')
    {
        $order = PerfWorkOrder::find($id);
        if (!$order) {
            throw new \Exception('工单不存在');
        }
        $this->assertBoss($userId);
        if ($order->status !== PerfWorkOrder::STATUS_COMPLETED || $order->review_score === null) {
            throw new \Exception('仅已验收完成的工单可以修改评分');
        }
        $reviewScore = (int)$reviewScore;
        if ($reviewScore < 1 || $reviewScore > 5) {
            throw new \Exception('验收评分必须为 1-5 分');
        }
        if (!in_array((int)$isQualified, [0, 1], true)) {
            throw new \Exception('判定结果不合法');
        }

        $order->is_qualified   = (int)$isQualified;
        $order->review_score   = $reviewScore;
        $order->review_comment = $comment !== '' ? $comment : $order->review_comment;
        $order->save();

        return $this->getWorkOrderDetail($id);
    }

    /**
     * 权限校验：工人只能操作自己的工单；
     * 老板（无绩效档案）保留通揽能力；HR/普通员工等无档案账号禁止操作工单。
     */
    private function assertOwnership($order, $userId)
    {
        $myEngineerId = $this->resolveEngineerId($userId);
        if ($myEngineerId !== null) {
            if ((int)$order->engineer_id !== (int)$myEngineerId) {
                throw new \Exception('只能操作自己的工单');
            }
            return;
        }
        // 无绩效档案：仅老板可通揽，其余账号（HR/员工）禁止
        if (!$this->isBossUser($userId)) {
            throw new \Exception('该操作仅限维修人员本人');
        }
    }

    /**
     * 我的工单（分页，强制按当前工人）
     */
    public function getMyWorkOrders($userId, $filters = [], $page = 1, $pageSize = 10)
    {
        $engineerId = $this->resolveEngineerId($userId);
        if (!$engineerId) {
            // 管理员/老板（未绑定维修人员档案）：管理视角，展示全部维修人员的工单。
            // 不抛异常（否则前端请求层会全局弹报错），改为返回全量列表 + 视角标记。
            unset($filters['engineer_id']);
            $result = $this->getWorkOrders($filters, $page, $pageSize);
            $result['no_profile'] = true;
            $result['admin_view'] = true;
            return $result;
        }
        $filters['engineer_id'] = $engineerId;
        return $this->getWorkOrders($filters, $page, $pageSize);
    }

    /**
     * 工人编辑自建工单（仅维修中可改；已交付/验收后锁定）
     */
    public function updateSelfWorkOrder($id, $userId, array $input)
    {
        $order = PerfWorkOrder::find($id);
        if (!$order) {
            throw new \Exception('工单不存在');
        }
        $this->assertOwnership($order, $userId);
        if (!in_array($order->status, [PerfWorkOrder::STATUS_PENDING, PerfWorkOrder::STATUS_PROCESSING, PerfWorkOrder::STATUS_TO_REPAIR])) {
            throw new \Exception('该工单已交付/完成，不可修改');
        }
        $allow = ['fault_desc', 'est_hours', 'priority', 'remark', 'images'];
        $data = [];
        foreach ($allow as $k) {
            if (array_key_exists($k, $input)) {
                if ($k === 'est_hours') {
                    $data[$k] = strlen($input[$k]) ? (float)$input[$k] : null;
                } elseif ($k === 'images') {
                    // 图片支持维修中随时补充/删改：空数组表示清空，均归一化后入库
                    $data[$k] = $this->normalizeImages($input[$k]);
                } else {
                    $data[$k] = $input[$k];
                }
            }
        }
        if (!empty($data)) {
            $order->save($data);
        }
        return $this->getWorkOrderDetail($id);
    }

    /**
     * 工人删除自建工单（仅维修中/待接单/待维修可删）
     */
    public function deleteSelfWorkOrder($id, $userId)
    {
        $order = PerfWorkOrder::find($id);
        if (!$order) {
            throw new \Exception('工单不存在');
        }
        $this->assertOwnership($order, $userId);
        if (!in_array($order->status, [PerfWorkOrder::STATUS_PENDING, PerfWorkOrder::STATUS_PROCESSING, PerfWorkOrder::STATUS_TO_REPAIR])) {
            throw new \Exception('该工单已交付/完成，不可删除');
        }
        $order->delete();
        return true;
    }

    /**
     * 维修工期合理性评估（小时口径）
     * 依据：本人历史同类完成均值 / 全库同类设备平均用时，给出规划工时建议。
     * @param int   $userId
     * @param array $input [type, fault_desc, est_hours, priority]
     * @return array {est_hours, reference_hours, worker_avg, worker_count, type_avg, type_count, basis, suggestion, level, message}
     */
    public function estimateRepair($userId, array $input)
    {
        $estHours = isset($input['est_hours']) ? (float)$input['est_hours'] : 0;
        $type    = trim($input['type'] ?? '');
        $fault   = trim($input['fault_desc'] ?? '');
        $engineerId = $this->resolveEngineerId($userId);

        // 1) 本人历史同类（已完成）均值（小时）
        $workerAvg = 0; $workerCnt = 0;
        if ($engineerId) {
            $wQ = PerfWorkOrder::alias('o')
                ->leftJoin('perf_devices d', 'o.device_id = d.id')
                ->where('o.engineer_id', $engineerId)
                ->whereIn('o.status', self::CLOSED_STATUSES)
                ->whereNotNull('o.actual_hours');
            if ($type) {
                $wQ->where('d.type', $type);
            }
            $wRows = $wQ->field('o.actual_hours')->select()->toArray();
            if ($wRows) {
                $workerCnt = count($wRows);
                $workerAvg = round(array_sum(array_column($wRows, 'actual_hours')) / $workerCnt, 1);
            }
        }

        // 2) 全库同类设备平均用时（样本更充足，小时）
        $typeAvg = 0; $typeCnt = 0;
        $tQ = PerfWorkOrder::alias('o')
            ->leftJoin('perf_devices d', 'o.device_id = d.id')
            ->whereIn('o.status', self::CLOSED_STATUSES)
            ->whereNotNull('o.actual_hours');
        if ($type) {
            $tQ->where('d.type', $type);
        } elseif ($fault) {
            $tQ->where('o.fault_desc', 'like', "%{$fault}%");
        }
        $tRows = $tQ->field('o.actual_hours')->select()->toArray();
        if ($tRows) {
            $typeCnt = count($tRows);
            $typeAvg = round(array_sum(array_column($tRows, 'actual_hours')) / $typeCnt, 1);
        }

        // 3) 参考基准：优先本人历史，其次同类均值，再其次默认 8 小时（数据不足）
        $reference = 0; $basis = '默认参考';
        if ($workerCnt >= 2) {
            $reference = $workerAvg; $basis = '本人历史均值';
            if ($typeCnt >= 3) {
                $reference = round($workerAvg * 0.7 + $typeAvg * 0.3, 1);
            }
        } elseif ($typeCnt >= 3) {
            $reference = $typeAvg; $basis = '同类设备均值';
        } else {
            $reference = 8.0; $basis = '默认参考(数据不足)';
        }

        // 4) 建议等级
        $suggestion = '合理'; $level = 'success';
        if ($estHours <= 0) {
            $suggestion = '请填写预计工时'; $level = 'info';
        } elseif ($reference > 0 && $estHours < $reference * 0.6) {
            $suggestion = '偏紧(风险)'; $level = 'danger';
        } elseif ($reference > 0 && $estHours > $reference * 1.6) {
            $suggestion = '偏松(可压缩)'; $level = 'warning';
        }

        $message = $this->buildEstimateMessage($estHours, $reference, $workerAvg, $workerCnt, $typeAvg, $typeCnt, $suggestion, $basis);

        return [
            'est_hours'       => $estHours,
            'reference_hours' => $reference,
            'worker_avg'      => $workerAvg,
            'worker_count'    => $workerCnt,
            'type_avg'        => $typeAvg,
            'type_count'      => $typeCnt,
            'basis'           => $basis,
            'suggestion'      => $suggestion,
            'level'           => $level,
            'message'         => $message,
        ];
    }

    /**
     * 时长的人类可读格式：<24 小时 => "X小时"；>=24 小时 => "X.X天"
     */
    private function fmtHours($hours)
    {
        $h = (float)$hours;
        if ($h <= 0) {
            return '0小时';
        }
        if ($h < 24) {
            $v = round($h, 1);
            return (floor($v) == $v ? (int)$v : $v) . '小时';
        }
        $d = round($h / 24, 1);
        return (floor($d) == $d ? (int)$d : $d) . '天';
    }

    private function buildEstimateMessage($estHours, $reference, $workerAvg, $workerCnt, $typeAvg, $typeCnt, $suggestion, $basis)
    {
        $parts = [];
        if ($estHours > 0) {
            $parts[] = "你计划的工时为 " . $this->fmtHours($estHours);
        }
        if ($workerCnt > 0) {
            $parts[] = "你本人同类维修平均用时 " . $this->fmtHours($workerAvg) . "（{$workerCnt} 单样本）";
        }
        if ($typeCnt > 0) {
            $parts[] = "全库同类设备平均用时 " . $this->fmtHours($typeAvg) . "（{$typeCnt} 单样本）";
        }
        $parts[] = "综合参考基准 " . $this->fmtHours($reference) . "（{$basis}）";
        $tail = match ($suggestion) {
            '偏紧(风险)'  => '，计划偏短，按期完成风险较高，建议适当放宽或提前备料。',
            '偏松(可压缩)' => '，计划偏长，存在压缩空间，可尝试优化工序提升效率。',
            '请填写预计工时' => '，请先填写预计工时后再评估。',
            default      => '，工期规划较为合理。',
        };
        return implode('；', $parts) . $tail;
    }
}
