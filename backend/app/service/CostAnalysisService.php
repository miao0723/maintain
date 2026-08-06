<?php

namespace app\service;

use app\model\WorkOrder;
use app\model\Device;
use app\model\SparePart;

class CostAnalysisService
{
    /**
     * 获取总体成本统计
     */
    public function getOverview($filters = [])
    {
        $query = WorkOrder::whereIn('status', [
            WorkOrder::STATUS_COMPLETED,
            WorkOrder::STATUS_CLOSED
        ]);

        // 日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date'] . ' 23:59:59');
        }

        // 总工单数
        $totalOrders = $query->count();

        // 总成本
        $totalCost = $query->sum('total_cost');

        // 配件成本
        $partsCost = $query->sum('cost_parts');

        // 人工成本
        $laborCost = $query->sum('cost_labor');

        // 平均每单成本
        $avgCost = $totalOrders > 0 ? $totalCost / $totalOrders : 0;

        // 成本构成比例
        $partsRatio = $totalCost > 0 ? ($partsCost / $totalCost * 100) : 0;
        $laborRatio = $totalCost > 0 ? ($laborCost / $totalCost * 100) : 0;

        return [
            'total_orders' => $totalOrders,
            'total_cost' => floatval($totalCost),
            'parts_cost' => floatval($partsCost),
            'labor_cost' => floatval($laborCost),
            'avg_cost' => floatval($avgCost),
            'parts_ratio' => floatval(number_format($partsRatio, 2)),
            'labor_ratio' => floatval(number_format($laborRatio, 2)),
        ];
    }

    /**
     * 按时间维度的成本趋势
     */
    public function getTrend($dimension = 'day', $limit = 30, $filters = [])
    {
        $query = WorkOrder::whereIn('status', [
            WorkOrder::STATUS_COMPLETED,
            WorkOrder::STATUS_CLOSED
        ]);

        // 日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date'] . ' 23:59:59');
        }

        // 根据维度分组
        switch ($dimension) {
            case 'day':
                $groupBy = 'DATE(created_at)';
                $dateFormat = '%Y-%m-%d';
                break;
            case 'month':
                $groupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
                $dateFormat = '%Y-%m';
                break;
            case 'year':
                $groupBy = 'YEAR(created_at)';
                $dateFormat = '%Y';
                break;
            default:
                $groupBy = 'DATE(created_at)';
                $dateFormat = '%Y-%m-%d';
        }

        $results = $query->field("$groupBy as period")
            ->field('COUNT(*) as order_count')
            ->field('SUM(total_cost) as total_cost')
            ->field('SUM(cost_parts) as parts_cost')
            ->field('SUM(cost_labor) as labor_cost')
            ->field('AVG(total_cost) as avg_cost')
            ->group($groupBy)
            ->order('period', 'desc')
            ->limit($limit)
            ->select()
            ->map(function($item) {
                return [
                    'period' => $item->period,
                    'order_count' => $item->order_count,
                    'total_cost' => floatval($item->total_cost),
                    'parts_cost' => floatval($item->parts_cost),
                    'labor_cost' => floatval($item->labor_cost),
                    'avg_cost' => floatval($item->avg_cost),
                ];
            });

        return [
            'dimension' => $dimension,
            'data' => array_reverse($results->toArray()),
        ];
    }

    /**
     * 按设备的成本排名
     */
    public function getTopDevices($limit = 10, $filters = [])
    {
        $query = WorkOrder::with(['device'])
            ->whereIn('status', [WorkOrder::STATUS_COMPLETED, WorkOrder::STATUS_CLOSED]);

        // 日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date'] . ' 23:59:59');
        }

        $results = $query->field('device_id')
            ->field('COUNT(*) as order_count')
            ->field('SUM(total_cost) as total_cost')
            ->field('SUM(cost_parts) as parts_cost')
            ->field('SUM(cost_labor) as labor_cost')
            ->group('device_id')
            ->order('total_cost', 'desc')
            ->limit($limit)
            ->select()
            ->filter(function($item) {
                return $item->device != null;
            })
            ->map(function($item) {
                return [
                    'device_id' => $item->device_id,
                    'device_name' => $item->device->name,
                    'device_code' => $item->device->code,
                    'order_count' => $item->order_count,
                    'total_cost' => floatval($item->total_cost),
                    'parts_cost' => floatval($item->parts_cost),
                    'labor_cost' => floatval($item->labor_cost),
                    'avg_cost' => floatval($item->total_cost / $item->order_count),
                ];
            });

        return [
            'list' => $results,
            'total' => count($results),
        ];
    }

    /**
     * 按部门的成本统计
     */
    public function getDepartmentStats($filters = [])
    {
        // 优化：使用JOIN和GROUP BY一次性获取所有数据，避免N+1查询
        $query = WorkOrder::alias('wo')
            ->join('devices d', 'wo.device_id = d.id')
            ->whereIn('wo.status', [WorkOrder::STATUS_COMPLETED, WorkOrder::STATUS_CLOSED])
            ->field('d.department_id')
            ->field('COUNT(*) as order_count')
            ->field('SUM(wo.total_cost) as total_cost')
            ->field('SUM(wo.cost_parts) as parts_cost')
            ->field('SUM(wo.cost_labor) as labor_cost')
            ->group('d.department_id');

        // 日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where('wo.created_at', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where('wo.created_at', '<=', $filters['end_date'] . ' 23:59:59');
        }

        $stats = $query->select()->toArray();

        // 计算平均值并排序
        $result = [];
        foreach ($stats as $stat) {
            if (empty($stat['department_id'])) {
                continue;
            }
            $result[] = [
                'department_id' => $stat['department_id'],
                'order_count' => $stat['order_count'],
                'total_cost' => floatval($stat['total_cost']),
                'parts_cost' => floatval($stat['parts_cost']),
                'labor_cost' => floatval($stat['labor_cost']),
                'avg_cost' => floatval($stat['total_cost'] / $stat['order_count']),
            ];
        }

        // 按总成本降序排序
        usort($result, function($a, $b) {
            return $b['total_cost'] - $a['total_cost'];
        });

        return [
            'list' => $result,
            'total' => count($result),
        ];
    }

    /**
     * 按成本类型的分析
     */
    public function getCostTypeAnalysis($filters = [])
    {
        $query = WorkOrder::whereIn('status', [
            WorkOrder::STATUS_COMPLETED,
            WorkOrder::STATUS_CLOSED
        ]);

        // 日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date'] . ' 23:59:59');
        }

        $orders = $query->select();

        $totalCost = 0;
        $totalPartsCost = 0;
        $totalLaborCost = 0;
        $partsOnly = 0;  // 只有配件成本
        $laborOnly = 0;  // 只有人工成本
        $bothCosts = 0;   // 两者都有
        $noCosts = 0;     // 都没有

        foreach ($orders as $order) {
            $totalCost += $order->total_cost;
            $totalPartsCost += $order->cost_parts;
            $totalLaborCost += $order->cost_labor;

            $hasPartsCost = $order->cost_parts > 0;
            $hasLaborCost = $order->cost_labor > 0;

            if ($hasPartsCost && $hasLaborCost) {
                $bothCosts++;
            } elseif ($hasPartsCost) {
                $partsOnly++;
            } elseif ($hasLaborCost) {
                $laborOnly++;
            } else {
                $noCosts++;
            }
        }

        $totalOrders = count($orders);

        return [
            'total_cost' => floatval($totalCost),
            'total_parts_cost' => floatval($totalPartsCost),
            'total_labor_cost' => floatval($totalLaborCost),
            'parts_ratio' => $totalCost > 0 ? floatval(number_format($totalPartsCost / $totalCost * 100, 2)) : 0,
            'labor_ratio' => $totalCost > 0 ? floatval(number_format($totalLaborCost / $totalCost * 100, 2)) : 0,
            'cost_distribution' => [
                'parts_only' => [
                    'count' => $partsOnly,
                    'ratio' => $totalOrders > 0 ? floatval(number_format($partsOnly / $totalOrders * 100, 2)) : 0,
                ],
                'labor_only' => [
                    'count' => $laborOnly,
                    'ratio' => $totalOrders > 0 ? floatval(number_format($laborOnly / $totalOrders * 100, 2)) : 0,
                ],
                'both_costs' => [
                    'count' => $bothCosts,
                    'ratio' => $totalOrders > 0 ? floatval(number_format($bothCosts / $totalOrders * 100, 2)) : 0,
                ],
                'no_costs' => [
                    'count' => $noCosts,
                    'ratio' => $totalOrders > 0 ? floatval(number_format($noCosts / $totalOrders * 100, 2)) : 0,
                ],
            ],
        ];
    }

    /**
     * 获取配件使用成本排名
     */
    public function getTopParts($limit = 10, $filters = [])
    {
        // 通过工单的used_parts字段统计
        $query = WorkOrder::whereIn('status', [
            WorkOrder::STATUS_COMPLETED,
            WorkOrder::STATUS_CLOSED
        ])
        ->whereNotNull('used_parts')
        ->where('used_parts', '<>', '');

        // 日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date'] . ' 23:59:59');
        }

        $orders = $query->select();

        $partUsage = [];

        foreach ($orders as $order) {
            $usedParts = json_decode($order->used_parts, true);
            if (!is_array($usedParts)) {
                continue;
            }

            foreach ($usedParts as $item) {
                $partId = $item['partId'] ?? null;
                $quantity = $item['quantity'] ?? 0;

                if (!$partId || $quantity <= 0) {
                    continue;
                }

                if (!isset($partUsage[$partId])) {
                    $partUsage[$partId] = [
                        'part_id' => $partId,
                        'quantity' => 0,
                        'order_count' => 0,
                    ];
                }

                $partUsage[$partId]['quantity'] += $quantity;
                $partUsage[$partId]['order_count']++;
            }
        }

        // 获取配件详情和成本
        $partIds = array_keys($partUsage);
        if (empty($partIds)) {
            return [
                'list' => [],
                'total' => 0,
            ];
        }

        $parts = SparePart::whereIn('id', $partIds)
            ->select()
            ->keyBy('id');

        $result = [];
        foreach ($partUsage as $partId => $usage) {
            $part = $parts[$partId] ?? null;
            if (!$part) {
                continue;
            }

            $totalCost = $usage['quantity'] * $part->purchase_price;

            $result[] = [
                'part_id' => $partId,
                'part_code' => $part->part_code,
                'part_name' => $part->part_name,
                'quantity' => $usage['quantity'],
                'order_count' => $usage['order_count'],
                'unit_price' => floatval($part->purchase_price),
                'total_cost' => floatval($totalCost),
            ];
        }

        // 按总成本降序排序
        usort($result, function($a, $b) {
            return $b['total_cost'] - $a['total_cost'];
        });

        return [
            'list' => array_slice($result, 0, $limit),
            'total' => count($result),
        ];
    }

    /**
     * 获取综合成本报告
     */
    public function getComprehensiveReport($filters = [])
    {
        return [
            'overview' => $this->getOverview($filters),
            'trend' => $this->getTrend('day', 30, $filters),
            'top_devices' => $this->getTopDevices(10, $filters),
            'department_stats' => $this->getDepartmentStats($filters),
            'cost_type_analysis' => $this->getCostTypeAnalysis($filters),
            'top_parts' => $this->getTopParts(10, $filters),
        ];
    }
}
