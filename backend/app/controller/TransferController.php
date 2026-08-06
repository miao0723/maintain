<?php

namespace app\controller;

use app\model\Transfer;
use app\common\Result;

/**
 * 转账支付管理控制器
 */
class TransferController
{
    /**
     * 获取转账列表
     * GET /payment/transfers
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $orderNo = request()->get('order_no', '');
        $status = request()->get('status', '');
        $dateRange = request()->get('date_range', '');

        try {
            $query = Transfer::order('id', 'desc');

            // 订单号搜索
            if (!empty($orderNo)) {
                $query->whereLike('order_no', '%' . $orderNo . '%');
            }

            // 状态筛选
            if (!empty($status)) {
                $query->where('status', $status);
            }

            // 日期范围筛选
            if (!empty($dateRange)) {
                $dates = explode(',', $dateRange);
                if (count($dates) === 2) {
                    $query->where('transfer_time', '>=', $dates[0])
                          ->where('transfer_time', '<=', $dates[1] . ' 23:59:59');
                }
            }

            $total = $query->count();
            $transfers = $query->page($page, $pageSize)->select();

            return Result::paginated(
                $transfers,
                $total,
                $page,
                $pageSize
            );
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取转账统计
     * GET /payment/transfers/statistics
     */
    public function statistics()
    {
        try {
            $totalAmount = Transfer::where('status', 'completed')->sum('amount') ?: 0;
            $pendingCount = Transfer::where('status', 'pending')->count();
            $completedCount = Transfer::where('status', 'completed')->count();

            $today = date('Y-m-d');
            $todayAmount = Transfer::where('status', 'completed')
                ->where('transfer_time', '>=', $today)
                ->where('transfer_time', '<=', $today . ' 23:59:59')
                ->sum('amount') ?: 0;

            return Result::success([
                'total_amount' => $totalAmount,
                'pending_count' => $pendingCount,
                'completed_count' => $completedCount,
                'today_amount' => $todayAmount
            ]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取转账详情
     * GET /payment/transfers/{id}
     */
    public function read($id)
    {
        try {
            $transfer = Transfer::find($id);

            if (!$transfer) {
                return Result::error('转账记录不存在', 404);
            }

            return Result::success($transfer);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建转账记录
     * POST /payment/transfers
     */
    public function save()
    {
        $data = request()->post();

        try {
            // 验证
            validate([
                'order_no' => 'require|unique:cmms_transfer_payments',
                'payee_name' => 'require',
                'payee_account' => 'require',
                'bank_name' => 'require',
                'amount' => 'require|float',
                'transfer_time' => 'require',
                'status' => 'require|in:pending,completed,cancelled',
            ])->check($data);

            $transfer = Transfer::create($data);

            return Result::success($transfer, '转账记录创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新转账记录
     * PUT /payment/transfers/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $transfer = Transfer::find($id);

            if (!$transfer) {
                return Result::error('转账记录不存在', '404');
            }

            // 验证
            validate([
                'order_no' => 'require|unique:cmms_transfer_payments,order_no,' . $id,
                'payee_name' => 'require',
                'payee_account' => 'require',
                'bank_name' => 'require',
                'amount' => 'require|float',
                'transfer_time' => 'require',
                'status' => 'require|in:pending,completed,cancelled',
            ])->check($data);

            $transfer->save($data);

            return Result::success($transfer, '转账记录更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除转账记录
     * DELETE /payment/transfers/{id}
     */
    public function delete($id)
    {
        try {
            $transfer = Transfer::find($id);

            if (!$transfer) {
                return Result::error('转账记录不存在', 404);
            }

            // 检查转账状态
            if ($transfer->status === 'completed') {
                return Result::error('已完成转账无法删除', 400);
            }

            $transfer->delete();

            return Result::success(null, '转账记录删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 确认转账
     * POST /payment/transfers/{id}/confirm
     */
    public function confirm($id)
    {
        try {
            $transfer = Transfer::find($id);

            if (!$transfer) {
                return Result::error('转账记录不存在', 404);
            }

            if ($transfer->status !== 'pending') {
                return Result::error('只有待确认状态的转账才能确认', 400);
            }

            $transfer->status = 'completed';
            $transfer->save();

            return Result::success(null, '转账确认成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 取消转账
     * POST /payment/transfers/{id}/cancel
     */
    public function cancel($id)
    {
        try {
            $transfer = Transfer::find($id);

            if (!$transfer) {
                return Result::error('转账记录不存在', 404);
            }

            if ($transfer->status !== 'pending') {
                return Result::error('只有待确认状态的转账才能取消', 400);
            }

            $transfer->status = 'cancelled';
            $transfer->save();

            return Result::success(null, '转账取消成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 导出转账记录
     * GET /payment/transfers/export
     */
    public function export()
    {
        try {
            // 获取筛选条件
            $orderNo = request()->get('order_no', '');
            $status = request()->get('status', '');
            $dateRange = request()->get('date_range', '');
            $format = request()->get('format', 'xlsx'); // xlsx or csv

            $query = Transfer::order('id', 'desc');

            // 订单号搜索
            if (!empty($orderNo)) {
                $query->whereLike('order_no', '%' . $orderNo . '%');
            }

            // 状态筛选
            if (!empty($status)) {
                $query->where('status', $status);
            }

            // 日期范围筛选
            if (!empty($dateRange)) {
                $dates = explode(',', $dateRange);
                if (count($dates) === 2) {
                    $query->where('transfer_time', '>=', $dates[0])
                          ->where('transfer_time', '<=', $dates[1] . ' 23:59:59');
                }
            }

            $transfers = $query->select();

            // 准备数据（字段顺序必须与表头一致）
            $data = [];
            $statusMap = [
                'pending' => '待确认',
                'completed' => '已完成',
                'cancelled' => '已取消'
            ];

            foreach ($transfers as $t) {
                $data[] = [
                    'id' => $t->id,
                    'order_no' => $t->order_no,
                    'payee_name' => $t->payee_name,
                    'payee_account' => $t->payee_account,
                    'bank_name' => $t->bank_name,
                    'amount' => $t->amount,
                    'transfer_time' => $t->transfer_time,
                    'status' => $statusMap[$t->status] ?? $t->status,
                    'remark' => $t->remark ?? ''
                ];
            }

            if ($format === 'csv') {
                return $this->exportCsv($data);
            } else {
                return $this->exportExcel($data);
            }
        } catch (\Exception $e) {
            return Result::error('导出失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 导出 CSV 格式
     */
    private function exportCsv($data)
    {
        $filename = '转账记录_' . date('YmdHis') . '.csv';

        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        // 打开输出流
        $output = fopen('php://output', 'w');

        // 添加 BOM 以支持中文
        fwrite($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

        // 表头
        $headers = ['ID', '订单号', '收款人', '收款账户', '开户银行', '转账金额', '转账时间', '状态', '备注'];
        fputcsv($output, $headers);

        // 数据行字段顺序必须与表头一致
        $fields = ['id', 'order_no', 'payee_name', 'payee_account', 'bank_name', 'amount', 'transfer_time', 'status', 'remark'];

        foreach ($data as $row) {
            $csvRow = [];
            foreach ($fields as $field) {
                $csvRow[] = $row[$field] ?? '';
            }
            fputcsv($output, $csvRow);
        }

        fclose($output);
        exit;
    }

    /**
     * 导出 Excel 格式
     */
    private function exportExcel($data)
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $worksheet = $spreadsheet->getActiveSheet();

        // 表头
        $headers = ['ID', '订单号', '收款人', '收款账户', '开户银行', '转账金额', '转账时间', '状态', '备注'];
        foreach ($headers as $index => $header) {
            $column = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 1);
            $worksheet->setCellValue($column . '1', $header);
        }

        // 数据行字段顺序必须与表头一致
        $fields = ['id', 'order_no', 'payee_name', 'payee_account', 'bank_name', 'amount', 'transfer_time', 'status', 'remark'];

        foreach ($data as $index => $row) {
            $rowNum = $index + 2;
            foreach ($fields as $colIndex => $field) {
                $column = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex + 1);
                $worksheet->setCellValue($column . $rowNum, $row[$field] ?? '');
            }
        }

        // 设置列宽
        $worksheet->getColumnDimension('A')->setWidth(10);
        $worksheet->getColumnDimension('B')->setWidth(20);
        $worksheet->getColumnDimension('C')->setWidth(15);
        $worksheet->getColumnDimension('D')->setWidth(25);
        $worksheet->getColumnDimension('E')->setWidth(15);
        $worksheet->getColumnDimension('F')->setWidth(15);
        $worksheet->getColumnDimension('G')->setWidth(20);
        $worksheet->getColumnDimension('H')->setWidth(12);
        $worksheet->getColumnDimension('I')->setWidth(30);

        // 输出文件
        $filename = '转账记录_' . date('YmdHis') . '.xlsx';

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }
}
