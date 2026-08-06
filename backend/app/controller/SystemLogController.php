<?php

namespace app\controller;

use app\model\SystemLog;
use think\facade\Db;
use app\common\Result;

/**
 * 系统日志管理控制器
 */
class SystemLogController
{
    /**
     * 获取日志列表
     * GET /system-logs
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $type = request()->get('type', '');
        $operator = request()->get('operator', '');
        $module = request()->get('module', '');
        $startDate = request()->get('start_date', '');
        $endDate = request()->get('end_date', '');

        try {
            $query = SystemLog::order('id', 'desc');

            // 日志类型筛选
            if (!empty($type)) {
                $query->where('log_type', $type);
            }

            // 操作人筛选
            if (!empty($operator)) {
                $query->whereLike('operator', '%' . $operator . '%');
            }

            // 模块筛选
            if (!empty($module)) {
                $query->where('module', $module);
            }

            // 日期范围筛选
            if (!empty($startDate)) {
                $query->where('created_at', '>=', $startDate . ' 00:00:00');
            }
            if (!empty($endDate)) {
                $query->where('created_at', '<=', $endDate . ' 23:59:59');
            }

            $total = $query->count();
            $logs = $query->page($page, $pageSize)->select();

            return Result::paginated($logs, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取日志详情
     * GET /system-logs/:id
     */
    public function read($id)
    {
        try {
            $log = SystemLog::find($id);

            if (!$log) {
                return Result::error('日志不存在', 404);
            }

            return Result::success($log);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 清空日志
     * POST /system-logs/clear
     */
    public function clear()
    {
        try {
            $count = SystemLog::whereTime('created_at', '<', date('Y-m-d', strtotime('-30 days')))->delete();

            // 如果没有任何 30 天前的日志，则清空所有
            if ($count === 0) {
                SystemLog::truncate();
            }

            return Result::success(null, '日志已清空');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 导出日志
     * GET /system-logs/export
     */
    public function export()
    {
        try {
            $type = request()->get('type', '');
            $operator = request()->get('operator', '');
            $startDate = request()->get('start_date', '');
            $endDate = request()->get('end_date', '');

            $query = SystemLog::order('id', 'desc');

            if (!empty($type)) {
                $query->where('log_type', $type);
            }
            if (!empty($operator)) {
                $query->whereLike('operator', '%' . $operator . '%');
            }
            if (!empty($startDate)) {
                $query->where('created_at', '>=', $startDate . ' 00:00:00');
            }
            if (!empty($endDate)) {
                $query->where('created_at', '<=', $endDate . ' 23:59:59');
            }

            $logs = $query->select();

            // 导出为 CSV
            $filename = 'system_logs_' . date('YmdHis') . '.csv';
            header('Content-Type: text/csv; charset=UTF-8');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Pragma: no-cache');
            header('Expires: 0');

            // 添加 BOM 以支持 Excel 打开中文
            echo "\xEF\xBB\xBF";

            $output = fopen('php://output', 'w');

            // 表头
            fputcsv($output, ['日志 ID', '日志类型', '操作人', '模块', '操作', 'IP 地址', '操作结果', '操作时间']);

            // 数据
            foreach ($logs as $log) {
                fputcsv($output, [
                    $log->id,
                    $log->log_type,
                    $log->operator,
                    $log->module,
                    $log->action,
                    $log->ip,
                    $log->result,
                    $log->created_at
                ]);
            }

            fclose($output);
            exit;
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建日志（内部使用）
     * POST /system-logs
     */
    public function save()
    {
        $data = request()->post();

        try {
            $log = SystemLog::create($data);
            return Result::success($log, '日志创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
