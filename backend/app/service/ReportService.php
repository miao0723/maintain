<?php

namespace app\service;

use app\model\WorkOrder;
use app\model\Device;
use app\model\SparePart;
use app\model\StockRecord;

class ReportService
{
    /**
     * 设备报表 - 设备状态和维修记录
     */
    public function getDeviceReport($filters = [])
    {
        $query = Device::with(['category', 'department']);

        // 按状态筛选
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        // 按分类筛选
        if (isset($filters['category_id']) && !empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        // 按部门筛选
        if (isset($filters['department_id']) && !empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        $devices = $query->select();

        // 统计各状态数量
        $statusStats = [];
        $categoryStats = [];

        foreach ($devices as $device) {
            // 状态统计
            $status = $device->status;
            if (!isset($statusStats[$status])) {
                $statusStats[$status] = ['count' => 0, 'devices' => []];
            }
            $statusStats[$status]['count']++;
            $statusStats[$status]['devices'][] = $device->name;

            // 分类统计
            $catId = $device->category_id;
            if (!isset($categoryStats[$catId])) {
                $categoryStats[$catId] = [
                    'category_name' => $device->category->name ?? '未知',
                    'count' => 0,
                    'total_value' => 0,
                ];
            }
            $categoryStats[$catId]['count']++;
            $categoryStats[$catId]['total_value'] += $device->purchase_price ?? 0;
        }

        // 获取维修记录统计
        $deviceIds = $devices->column('id');
        $workOrderStats = WorkOrder::whereIn('device_id', $deviceIds)
            ->field('device_id, COUNT(*) as total, SUM(total_cost) as cost')
            ->group('device_id')
            ->select()
            ->keyBy('device_id');

        // 组装报表数据
        $reportData = [];
        foreach ($devices as $device) {
            $stats = $workOrderStats[$device->id] ?? null;
            $reportData[] = [
                'device_id' => $device->id,
                'device_code' => $device->code,
                'device_name' => $device->name,
                'category' => $device->category->name ?? '未知',
                'department' => $device->department->name ?? '未知',
                'status' => $device->status,
                'status_text' => $device->status_text ?? '',
                'purchase_price' => floatval($device->purchase_price ?? 0),
                'location' => $device->location,
                'responsible_person' => $device->responsible_person,
                'maintenance_count' => $stats->total ?? 0,
                'maintenance_cost' => floatval($stats->cost ?? 0),
            ];
        }

        return [
            'title' => '设备报表',
            'generated_at' => date('Y-m-d H:i:s'),
            'summary' => [
                'total_devices' => count($devices),
                'status_distribution' => $statusStats,
                'category_distribution' => array_values($categoryStats),
            ],
            'data' => $reportData,
        ];
    }

    /**
     * 维修报表 - 工单统计和维修记录
     */
    public function getMaintenanceReport($filters = [])
    {
        $query = WorkOrder::with(['device', 'reporter', 'assignedTo']);

        // 日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date'] . ' 23:59:59');
        }

        // 按状态筛选
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        // 按优先级筛选
        if (isset($filters['priority']) && $filters['priority'] !== '') {
            $query->where('priority', $filters['priority']);
        }

        $orders = $query->order('created_at', 'desc')->select();

        // 统计数据
        $statusStats = [];
        $priorityStats = [];
        $totalCost = 0;
        $completedCount = 0;

        foreach ($orders as $order) {
            // 状态统计
            $status = $order->status;
            if (!isset($statusStats[$status])) {
                $statusStats[$status] = 0;
            }
            $statusStats[$status]++;

            // 优先级统计
            $priority = $order->priority;
            if (!isset($priorityStats[$priority])) {
                $priorityStats[$priority] = 0;
            }
            $priorityStats[$priority]++;

            $totalCost += $order->total_cost;

            if (in_array($order->status, [WorkOrder::STATUS_COMPLETED, WorkOrder::STATUS_CLOSED])) {
                $completedCount++;
            }
        }

        // 组装报表数据
        $reportData = [];
        foreach ($orders as $order) {
            $reportData[] = [
                'order_no' => $order->order_no,
                'device_name' => $order->device->name ?? '未知',
                'reporter' => $order->reporter->real_name ?? '未知',
                'assigned_to' => $order->assignedTo->real_name ?? '未指派',
                'fault_type' => $order->fault_type,
                'priority' => $order->priority,
                'status' => $order->status,
                'status_text' => $order->status_text ?? '',
                'created_at' => $order->created_at,
                'complete_time' => $order->complete_time,
                'cost_parts' => floatval($order->cost_parts),
                'cost_labor' => floatval($order->cost_labor),
                'total_cost' => floatval($order->total_cost),
                'duration_hours' => $order->complete_time ?
                    (strtotime($order->complete_time) - strtotime($order->created_at)) / 3600 : null,
            ];
        }

        return [
            'title' => '维修报表',
            'generated_at' => date('Y-m-d H:i:s'),
            'filters' => $filters,
            'summary' => [
                'total_orders' => count($orders),
                'completed_orders' => $completedCount,
                'completion_rate' => count($orders) > 0 ? round($completedCount / count($orders) * 100, 2) : 0,
                'total_cost' => floatval($totalCost),
                'avg_cost' => count($orders) > 0 ? floatval($totalCost / count($orders)) : 0,
                'status_distribution' => $statusStats,
                'priority_distribution' => $priorityStats,
            ],
            'data' => $reportData,
        ];
    }

    /**
     * 库存报表 - 配件库存和流水记录
     */
    public function getInventoryReport($filters = [])
    {
        $query = SparePart::order('id', 'asc');

        // 按分类筛选（repair 数据库 category 为字符串）
        if (isset($filters['category']) && !empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        // 按供应商筛选
        if (isset($filters['supplier_id']) && !empty($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }

        // 库存状态筛选
        if (isset($filters['stock_status']) && !empty($filters['stock_status'])) {
            switch ($filters['stock_status']) {
                case 'low_stock':
                    $query->where('stock_quantity', '<=', 'min_stock')
                          ->where('stock_quantity', '>', 0);
                    break;
                case 'out_of_stock':
                    $query->where('stock_quantity', 0);
                    break;
                case 'normal':
                    $query->where('stock_quantity', '>', 'min_stock');
                    break;
            }
        }

        $parts = $query->select();

        // 统计数据
        $totalParts = count($parts);
        $totalStock = 0;
        $totalValue = 0;
        $lowStockCount = 0;
        $outOfStockCount = 0;

        $reportData = [];

        foreach ($parts as $part) {
            $stockStatus = $part->getStockStatus();
            $totalStock += $part->stock_quantity;
            $totalValue += $part->stock_quantity * $part->purchase_price;

            if ($stockStatus == 'low_stock') {
                $lowStockCount++;
            } elseif ($stockStatus == 'out_of_stock') {
                $outOfStockCount++;
            }

            $reportData[] = [
                'part_code' => $part->part_code,
                'part_name' => $part->part_name,
                'category' => $part->category ?? '',
                'specification' => $part->specification,
                'unit' => $part->unit,
                'stock_quantity' => $part->stock_quantity,
                'min_stock' => $part->min_stock,
                'stock_status' => $stockStatus,
                'purchase_price' => floatval($part->purchase_price),
                'selling_price' => floatval($part->selling_price ?? 0),
                'stock_value' => floatval($part->stock_quantity * $part->purchase_price),
                'location' => $part->location ?? '',
            ];
        }

        return [
            'title' => '库存报表',
            'generated_at' => date('Y-m-d H:i:s'),
            'summary' => [
                'total_parts' => $totalParts,
                'total_stock' => $totalStock,
                'total_value' => floatval($totalValue),
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => $outOfStockCount,
                'normal_stock_count' => $totalParts - $lowStockCount - $outOfStockCount,
            ],
            'data' => $reportData,
        ];
    }

    /**
     * 成本报表 - 维修成本统计和分析
     */
    public function getCostReport($filters = [])
    {
        // 优化：使用JOIN和GROUP BY避免N+1查询
        $baseQuery = WorkOrder::alias('wo')
            ->whereIn('wo.status', [WorkOrder::STATUS_COMPLETED, WorkOrder::STATUS_CLOSED]);

        // 日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $baseQuery->where('wo.created_at', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $baseQuery->where('wo.created_at', '<=', $filters['end_date'] . ' 23:59:59');
        }

        // 总体统计
        $summary = $baseQuery->field('COUNT(*) as total_orders')
            ->field('SUM(wo.total_cost) as total_cost')
            ->field('SUM(wo.cost_parts) as total_parts_cost')
            ->field('SUM(wo.cost_labor) as total_labor_cost')
            ->find()
            ->toArray();

        // 按设备分组统计
        $deviceStats = WorkOrder::alias('wo')
            ->join('devices d', 'wo.device_id = d.id')
            ->whereIn('wo.status', [WorkOrder::STATUS_COMPLETED, WorkOrder::STATUS_CLOSED])
            ->field('wo.device_id')
            ->field('d.name as device_name')
            ->field('COUNT(*) as count')
            ->field('SUM(wo.total_cost) as cost')
            ->group('wo.device_id, d.name')
            ->order('cost', 'desc')
            ->limit(10)
            ->select()
            ->toArray();

        // 按工程师分组统计
        $engineerStats = WorkOrder::alias('wo')
            ->join('users u', 'wo.assigned_to = u.id')
            ->whereIn('wo.status', [WorkOrder::STATUS_COMPLETED, WorkOrder::STATUS_CLOSED])
            ->field('wo.assigned_to')
            ->field('u.real_name as engineer_name')
            ->field('COUNT(*) as count')
            ->field('SUM(wo.total_cost) as cost')
            ->group('wo.assigned_to, u.real_name')
            ->order('cost', 'desc')
            ->limit(10)
            ->select()
            ->toArray();

        // 按月份分组统计
        $monthlyStats = $baseQuery->field("DATE_FORMAT(wo.created_at, '%Y-%m') as month")
            ->field('COUNT(*) as count')
            ->field('SUM(wo.total_cost) as cost')
            ->field('SUM(wo.cost_parts) as parts_cost')
            ->field('SUM(wo.cost_labor) as labor_cost')
            ->group('month')
            ->order('month', 'asc')
            ->select()
            ->toArray();

        return [
            'title' => '成本报表',
            'generated_at' => date('Y-m-d H:i:s'),
            'filters' => $filters,
            'summary' => [
                'total_orders' => $summary['total_orders'],
                'total_cost' => floatval($summary['total_cost']),
                'total_parts_cost' => floatval($summary['total_parts_cost']),
                'total_labor_cost' => floatval($summary['total_labor_cost']),
                'avg_cost' => $summary['total_orders'] > 0 ? floatval($summary['total_cost'] / $summary['total_orders']) : 0,
                'parts_ratio' => $summary['total_cost'] > 0 ? floatval(round($summary['total_parts_cost'] / $summary['total_cost'] * 100, 2)) : 0,
                'labor_ratio' => $summary['total_cost'] > 0 ? floatval(round($summary['total_labor_cost'] / $summary['total_cost'] * 100, 2)) : 0,
            ],
            'top_devices' => $deviceStats,
            'top_engineers' => $engineerStats,
            'monthly_trend' => $monthlyStats,
        ];
    }

    /**
     * 获取所有可用的报表类型
     */
    public function getReportTypes()
    {
        return [
            [
                'type' => 'device',
                'name' => '设备报表',
                'description' => '设备状态、维修记录和资产价值统计',
                'filters' => ['status', 'category_id', 'department_id'],
            ],
            [
                'type' => 'maintenance',
                'name' => '维修报表',
                'description' => '工单统计、维修记录和完成率分析',
                'filters' => ['start_date', 'end_date', 'status', 'priority'],
            ],
            [
                'type' => 'inventory',
                'name' => '库存报表',
                'description' => '配件库存、价值和预警统计',
                'filters' => ['category_id', 'supplier_id', 'stock_status'],
            ],
            [
                'type' => 'cost',
                'name' => '成本报表',
                'description' => '维修成本、设备排名和工程师绩效',
                'filters' => ['start_date', 'end_date'],
            ],
        ];
    }

    /**
     * 生成指定类型的报表
     */
    public function generateReport($type, $filters = [])
    {
        switch ($type) {
            case 'device':
                return $this->getDeviceReport($filters);
            case 'maintenance':
                return $this->getMaintenanceReport($filters);
            case 'inventory':
                return $this->getInventoryReport($filters);
            case 'cost':
                return $this->getCostReport($filters);
            default:
                throw new \Exception('不支持的报表类型: ' . $type);
        }
    }
}
