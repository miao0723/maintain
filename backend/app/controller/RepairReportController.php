<?php

namespace app\controller;

use app\model\RepairReport;
use app\model\Order;
use app\common\Result;
use think\facade\Db;

/**
 * 维修报告管理控制器
 */
class RepairReportController extends BaseController
{
    /**
     * 获取报告列表
     * GET /repair-reports
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $reportNumber = request()->get('report_number', '');
        $orderNo = request()->get('order_no', '');
        $keyword = request()->get('keyword', '');
        $status = request()->get('status', '');
        $startDate = request()->get('start_date', '');
        $endDate = request()->get('end_date', '');

        try {
            $query = new RepairReport();

            // 搜索功能
            if (!empty($keyword)) {
                $query->where(function($q) use ($keyword) {
                    $q->whereLike('report_number', '%' . $keyword . '%');
                    $q->whereOr('machine_name', 'like', '%' . $keyword . '%');
                    $q->whereOr('fault_description', 'like', '%' . $keyword . '%');
                });
            }

            // 报告编号筛选
            if (!empty($reportNumber)) {
                $query->where('report_number', 'like', '%' . $reportNumber . '%');
            }

            // 订单号筛选
            if (!empty($orderNo)) {
                $query->where('order_id', 'in', function($subQ) use ($orderNo) {
                    $subQ->name('orders')
                        ->where('order_id', 'like', '%' . $orderNo . '%')
                        ->field('id');
                });
            }

            // 状态筛选
            if (!empty($status)) {
                $query->where('status', $status);
            }

            // 日期范围筛选
            if (!empty($startDate)) {
                $query->where('repair_date', '>=', $startDate);
            }
            if (!empty($endDate)) {
                $query->where('repair_date', '<=', $endDate);
            }

            $total = $query->count();
            $reports = $query->order('id', 'desc')->page($page, $pageSize)->select();

            // 转换为数组
            $items = [];
            foreach ($reports as $r) {
                $arr = $r->toArray();
                $items[] = $arr;
            }

            return Result::paginated($items, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error('查询失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 获取报告详情
     * GET /repair-reports/{id}
     */
    public function read($id)
    {
        try {
            $report = RepairReport::find($id);

            if (!$report) {
                return Result::error('报告不存在', 404);
            }

            return Result::success($report->toArray());
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建报告
     * POST /repair-reports
     */
    public function save()
    {
        $data = request()->post();

        try {
            // 验证
            validate([
                'report_number' => 'require|unique:repair_reports',
                'machine_name' => 'require',
                'fault_description' => 'require',
                'repair_content' => 'require',
                'repairer_name' => 'require',
                'repair_date' => 'require',
                'status' => 'in:pending,repairing,completed',
            ])->check($data);

            // 如果提供了 order_no，但未提供 order_id，尝试从 orders 表查找并关联
            if (!empty($data['order_no']) && empty($data['order_id'])) {
                $order = Order::where('order_no', $data['order_no'])->find();
                if ($order) {
                    $data['order_id'] = $order->id;
                }
            }

            $report = RepairReport::create($data);

            return Result::success($report, '报告创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新报告
     * PUT /repair-reports/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $report = RepairReport::find($id);

            if (!$report) {
                return Result::error('报告不存在', 404);
            }

            // 验证
            validate([
                'report_number' => 'require|unique:repair_reports,report_number,' . $id,
                'machine_name' => 'require',
                'fault_description' => 'require',
                'repair_content' => 'require',
                'repairer_name' => 'require',
                'repair_date' => 'require',
                'status' => 'in:pending,repairing,completed',
            ])->check($data);

            // 如果更新时提供了 order_no，但未提供 order_id，尝试关联 orders 表
            if (!empty($data['order_no']) && empty($data['order_id'])) {
                $order = Order::where('order_no', $data['order_no'])->find();
                if ($order) {
                    $data['order_id'] = $order->id;
                }
            }

            $report->save($data);

            return Result::success($report, '报告更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除报告
     * DELETE /repair-reports/{id}
     */
    public function delete($id)
    {
        try {
            $report = RepairReport::find($id);

            if (!$report) {
                return Result::error('报告不存在', 404);
            }

            $report->delete();

            return Result::success(null, '报告删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 从电子维修库导入已完成的订单到维修报告
     * POST /repair-reports/import
     */
    public function importFromRepair()
    {
        try {
            // 连接电子维修数据库
            $repairDb = Db::connect('repair');

            // 获取已完成的维修订单（status = 'completed' 且 order_type = 'repair'）
            $completedOrders = $repairDb->query(
                "SELECT * FROM orders WHERE status = 'completed' AND order_type = 'repair' ORDER BY completed_at DESC"
            );

            if (empty($completedOrders)) {
                return Result::success([
                    'imported' => 0,
                    'skipped' => 0,
                    'total' => 0,
                ], '没有找到已完成的维修订单');
            }

            $imported = 0;
            $skipped = 0;
            $deviceTypes = [
                1 => '手机',
                2 => '电脑',
                3 => '平板',
                4 => '手表',
                5 => '耳机',
                6 => '相机',
                7 => '游戏机',
                8 => '其他'
            ];

            // 使用原生 SQL 插入，兼容不同表结构
            foreach ($completedOrders as $order) {
                // 检查是否已导入
                $existing = (new RepairReport())->where('order_id', $order['id'])->find();
                if ($existing) {
                    $skipped++;
                    continue;
                }

                // 获取设备类型名称
                $deviceTypeName = $deviceTypes[$order['device_type']] ?? '其他设备';
                $machineName = $order['device_model']
                    ? $deviceTypeName . ' - ' . $order['device_model']
                    : $deviceTypeName;

                // 生成报告编号（包含电子维修库订单主键，避免重复导入时触发 uk_report_number 唯一键冲突）
                $reportNumber = 'RPT' . date('YmdHis') . str_pad((int) $order['id'], 6, '0', STR_PAD_LEFT);

                // 构建维修内容
                $repairContent = '已完成 ' . $machineName . ' 维修服务';
                if (!empty($order['custom_description'])) {
                    $repairContent .= '。' . $order['custom_description'];
                }

                // 准备数据
                // 电子维修库里可能存在维修工时字段（例如 repair_hours / work_hours / hours）
                // 如果不存在，也不会报错，按 0 写入
                $repairHoursRaw = $order['repair_hours'] ?? $order['work_hours'] ?? $order['hours'] ?? null;
                $repairHours = ($repairHoursRaw === null || $repairHoursRaw === '') ? 0 : (float) $repairHoursRaw;

                $amount = $order['actual_price'] ?? $order['estimated_price'] ?? 0;
                $repairDate = date('Y-m-d', strtotime($order['completed_at'] ?? $order['updated_at']));
                $completionDate = $order['completed_at'] ?? $order['updated_at'];
                $faultDesc = $order['problem_description'] ?? '';
                $repairerName = $order['technician_name'] ?? '';

                // 使用原生 SQL 插入，只插入存在的字段
                $sql = "INSERT INTO repair_reports (order_id, machine_id, report_number, machine_name, fault_description,
                    repair_content, repair_hours, amount, repairer_name, repair_date, completion_date,
                    status, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                Db::execute($sql, [
                    $order['id'],
                    0, // machine_id 兜底值：避免 repair_reports.machine_id 为 NOT NULL 时插入失败
                    $reportNumber,
                    $machineName,
                    $faultDesc,
                    $repairContent,
                    $repairHours,
                    $amount,
                    $repairerName,
                    $repairDate,
                    $completionDate,
                    'completed',
                    '从电子维修系统自动导入，订单号：' . $order['order_id']
                ]);

                $imported++;
            }

            return Result::success([
                'imported' => $imported,
                'skipped' => $skipped,
                'total' => count($completedOrders),
            ], '导入完成');
        } catch (\Exception $e) {
            return Result::error('导入失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 获取可导入的订单列表（预览）
     * GET /repair-reports/import-preview
     */
    public function importPreview()
    {
        try {
            // 连接电子维修数据库
            $repairDb = Db::connect('repair');

            // 获取已完成的维修订单
            $completedOrders = $repairDb->query(
                "SELECT * FROM orders WHERE status = 'completed' AND order_type = 'repair' ORDER BY completed_at DESC LIMIT 50"
            );

            $deviceTypes = [
                1 => '手机',
                2 => '电脑',
                3 => '平板',
                4 => '手表',
                5 => '耳机',
                6 => '相机',
                7 => '游戏机',
                8 => '其他'
            ];
            $serviceTypeLabels = ['shop' => '到店', 'home' => '上门'];
            $priorityLabels = ['low' => '低', 'medium' => '中', 'high' => '高'];

            // 获取已导入的订单 ID 列表（存的是电子维修库 orders.id，用于去重）
            $importedOrderIds = [];
            $allReports = (new RepairReport())->select();
            foreach ($allReports as $report) {
                if ($report->order_id) {
                    $importedOrderIds[] = $report->order_id;
                }
            }

            $result = [];
            foreach ($completedOrders as $order) {
                $deviceTypeName = $deviceTypes[$order['device_type']] ?? '其他设备';
                $machineName = $order['device_model']
                    ? $deviceTypeName . ' - ' . $order['device_model']
                    : $deviceTypeName;

                // 检查是否已导入
                $alreadyImported = in_array($order['id'], $importedOrderIds);

                $st = $order['service_type'] ?? '';
                $pr = $order['priority'] ?? '';

                // 维修工时（如果电子维修库里有对应字段才会有值）
                $repairHoursRaw = $order['repair_hours'] ?? $order['work_hours'] ?? $order['hours'] ?? null;
                $repairHours = ($repairHoursRaw === null || $repairHoursRaw === '') ? null : (float) $repairHoursRaw;

                $result[] = [
                    'order_id' => $order['id'],
                    'order_no' => $order['order_id'],
                    'device_type' => (int) ($order['device_type'] ?? 0),
                    'device_type_name' => $deviceTypeName,
                    'device_model' => $order['device_model'] ?? '',
                    'machine_name' => $machineName,
                    'problem_description' => $order['problem_description'] ?? '',
                    'custom_description' => $order['custom_description'] ?? '',
                    'fault_description' => $order['problem_description'] ?? '',
                    'service_type' => $st,
                    'service_type_text' => $serviceTypeLabels[$st] ?? ($st ?: '-'),
                    'priority' => $pr,
                    'priority_text' => $priorityLabels[$pr] ?? ($pr ?: '-'),
                    'estimated_price' => $order['estimated_price'] ?? null,
                    'actual_price' => $order['actual_price'] ?? null,
                    'amount' => $order['actual_price'] ?? $order['estimated_price'] ?? 0,
                    'repair_hours' => $repairHours,
                    'progress' => isset($order['progress']) ? (int) $order['progress'] : null,
                    'completed_at' => $order['completed_at'],
                    'assigned_to' => $order['assigned_to'] ?? null,
                    'already_imported' => $alreadyImported,
                ];
            }

            return Result::success($result);
        } catch (\Exception $e) {
            return Result::error('获取预览失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 根据订单 ID 导入单个报告
     * POST /repair-reports/import-single
     */
    public function importSingle()
    {
        $data = request()->post();
        $orderId = $data['order_id'] ?? 0;

        if (empty($orderId)) {
            return Result::error('请提供订单 ID', 400);
        }

        try {
            // 连接电子维修数据库
            $repairDb = Db::connect('repair');

            // 获取订单
            $order = $repairDb->query(
                "SELECT * FROM orders WHERE id = ? AND status = 'completed' AND order_type = 'repair'",
                [$orderId]
            );

            if (empty($order)) {
                return Result::error('订单不存在或未完成', 404);
            }
            $order = $order[0];

            // 检查是否已导入
            $existing = (new RepairReport())->where('order_id', $orderId)->find();
            if ($existing) {
                return Result::error('该订单已导入', 400);
            }

            $deviceTypes = [
                1 => '手机', 2 => '电脑', 3 => '平板', 4 => '手表',
                5 => '耳机', 6 => '相机', 7 => '游戏机', 8 => '其他'
            ];

            $deviceTypeName = $deviceTypes[$order['device_type']] ?? '其他设备';
            $machineName = $order['device_model']
                ? $deviceTypeName . ' - ' . $order['device_model']
                : $deviceTypeName;

            // 生成报告编号（包含电子维修库订单主键，避免重复导入时触发 uk_report_number 唯一键冲突）
            $reportNumber = 'RPT' . date('YmdHis') . str_pad((int) $order['id'], 6, '0', STR_PAD_LEFT);
            $repairContent = '已完成 ' . $machineName . ' 维修服务';
            if (!empty($order['custom_description'])) {
                $repairContent .= '。' . $order['custom_description'];
            }

            $amount = $order['actual_price'] ?? $order['estimated_price'] ?? 0;
            $repairDate = date('Y-m-d', strtotime($order['completed_at'] ?? $order['updated_at']));
            $completionDate = $order['completed_at'] ?? $order['updated_at'];
            $faultDesc = $order['problem_description'] ?? '';
            $repairerName = $order['technician_name'] ?? '';

            // 维修工时（如果电子维修库里有对应字段才会有值）
            $repairHoursRaw = $order['repair_hours'] ?? $order['work_hours'] ?? $order['hours'] ?? null;
            $repairHours = ($repairHoursRaw === null || $repairHoursRaw === '') ? 0 : (float) $repairHoursRaw;

            // 使用原生 SQL 插入
            $sql = "INSERT INTO repair_reports (order_id, machine_id, report_number, machine_name, fault_description,
                repair_content, repair_hours, amount, repairer_name, repair_date, completion_date,
                status, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            Db::execute($sql, [
                $order['id'],
                0, // machine_id 兜底值：避免 repair_reports.machine_id 为 NOT NULL 时插入失败
                $reportNumber,
                $machineName,
                $faultDesc,
                $repairContent,
                $repairHours,
                $amount,
                $repairerName,
                $repairDate,
                $completionDate,
                'completed',
                '从电子维修系统自动导入，订单号：' . $order['order_id']
            ]);

            // 兼容当前 ThinkPHP 版本：Db::getLastInsID() 需要参数，直接用 LAST_INSERT_ID() 获取自增ID
            $lastIdRow = Db::query('SELECT LAST_INSERT_ID() AS id')[0] ?? null;
            $lastId = $lastIdRow ? ($lastIdRow['id'] ?? null) : null;

            return Result::success(['id' => $lastId], '导入成功', 201);
        } catch (\Exception $e) {
            return Result::error('导入失败：' . $e->getMessage(), 500);
        }
    }
}
