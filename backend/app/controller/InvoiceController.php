<?php

namespace app\controller;

use app\model\Invoice;
use app\common\Result;

/**
 * 发票管理控制器
 */
class InvoiceController
{
    /**
     * 获取发票列表
     * GET /payment/invoices
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $invoiceNo = request()->get('invoice_no', '');
        $type = request()->get('type', '');
        $status = request()->get('status', '');

        try {
            $query = Invoice::order('id', 'desc');

            // 发票号搜索
            if (!empty($invoiceNo)) {
                $query->whereLike('invoice_no', '%' . $invoiceNo . '%');
            }

            // 类型筛选
            if (!empty($type)) {
                $query->where('type', $type);
            }

            // 状态筛选
            if (!empty($status)) {
                $query->where('status', $status);
            }

            $total = $query->count();
            $invoices = $query->page($page, $pageSize)->select();

            return Result::paginated(
                $invoices,
                $total,
                $page,
                $pageSize
            );
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取发票统计
     * GET /payment/invoices/statistics
     */
    public function statistics()
    {
        try {
            $totalAmount = Invoice::where('status', 'issued')->sum('total_amount') ?: 0;
            $pendingCount = Invoice::where('status', 'pending')->count();
            $issuedCount = Invoice::where('status', 'issued')->count();

            $month = date('Y-m');
            $monthAmount = Invoice::where('status', 'issued')
                ->where('issue_date', '>=', $month . '-01')
                ->where('issue_date', '<=', $month . '-31')
                ->sum('total_amount') ?: 0;

            return Result::success([
                'total_amount' => $totalAmount,
                'pending_count' => $pendingCount,
                'issued_count' => $issuedCount,
                'month_amount' => $monthAmount
            ]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取发票详情
     * GET /payment/invoices/{id}
     */
    public function read($id)
    {
        try {
            $invoice = Invoice::find($id);

            if (!$invoice) {
                return Result::error('发票不存在', 404);
            }

            return Result::success($invoice);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建发票
     * POST /payment/invoices
     */
    public function save()
    {
        $data = request()->post();

        try {
            // 验证
            validate([
                'invoice_no' => 'require|unique:cmms_invoices',
                'type' => 'require|in:special,normal,electronic',
                'company_name' => 'require',
                'tax_no' => 'require',
                'amount' => 'require|float',
                'tax_rate' => 'require|float',
                'tax_amount' => 'require|float',
                'total_amount' => 'require|float',
                'status' => 'require|in:pending,issued,void',
            ])->check($data);

            $invoice = Invoice::create($data);

            return Result::success($invoice, '发票创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新发票
     * PUT /payment/invoices/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $invoice = Invoice::find($id);

            if (!$invoice) {
                return Result::error('发票不存在', 404);
            }

            // 验证
            validate([
                'invoice_no' => 'require|unique:cmms_invoices,invoice_no,' . $id,
                'type' => 'require|in:special,normal,electronic',
                'company_name' => 'require',
                'tax_no' => 'require',
                'amount' => 'require|float',
                'tax_rate' => 'require|float',
                'tax_amount' => 'require|float',
                'total_amount' => 'require|float',
                'status' => 'require|in:pending,issued,void',
            ])->check($data);

            $invoice->save($data);

            return Result::success($invoice, '发票更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除发票
     * DELETE /payment/invoices/{id}
     */
    public function delete($id)
    {
        try {
            $invoice = Invoice::find($id);

            if (!$invoice) {
                return Result::error('发票不存在', 404);
            }

            // 检查发票状态
            if ($invoice->status === 'issued') {
                return Result::error('已开具发票无法删除', 400);
            }

            $invoice->delete();

            return Result::success(null, '发票删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 开具发票
     * POST /payment/invoices/{id}/issue
     */
    public function issue($id)
    {
        try {
            $invoice = Invoice::find($id);

            if (!$invoice) {
                return Result::error('发票不存在', 404);
            }

            if ($invoice->status !== 'pending') {
                return Result::error('只有待开具状态的发票才能开具', 400);
            }

            if (empty($invoice->issue_date)) {
                return Result::error('请先设置开票日期', 400);
            }

            $invoice->status = 'issued';
            $invoice->issued_at = date('Y-m-d H:i:s');
            $invoice->save();

            return Result::success(null, '开票成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 作废发票
     * POST /payment/invoices/{id}/void
     */
    public function voidInvoice($id)
    {
        try {
            $invoice = Invoice::find($id);

            if (!$invoice) {
                return Result::error('发票不存在', 404);
            }

            if ($invoice->status !== 'issued') {
                return Result::error('只有已开具的发票才能作废', 400);
            }

            $invoice->status = 'void';
            $invoice->voided_at = date('Y-m-d H:i:s');
            $invoice->save();

            return Result::success(null, '发票已作废');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 导出发票记录
     * GET /payment/invoices/export
     */
    public function export()
    {
        try {
            // 获取筛选条件
            $invoiceNo = request()->get('invoice_no', '');
            $type = request()->get('type', '');
            $status = request()->get('status', '');
            $format = request()->get('format', 'xlsx'); // xlsx or csv

            $query = Invoice::order('id', 'desc');

            // 发票号搜索
            if (!empty($invoiceNo)) {
                $query->whereLike('invoice_no', '%' . $invoiceNo . '%');
            }

            // 类型筛选
            if (!empty($type)) {
                $query->where('type', $type);
            }

            // 状态筛选
            if (!empty($status)) {
                $query->where('status', $status);
            }

            $invoices = $query->select();

            // 准备数据（字段顺序必须与表头一致）
            $data = [];
            $typeMap = [
                'special' => '增值税专用发票',
                'normal' => '增值税普通发票',
                'electronic' => '电子发票'
            ];
            $statusMap = [
                'pending' => '待开具',
                'issued' => '已开具',
                'void' => '已作废'
            ];

            foreach ($invoices as $inv) {
                $data[] = [
                    'id' => $inv->id,
                    'invoice_no' => $inv->invoice_no,
                    'type' => $typeMap[$inv->type] ?? $inv->type,
                    'company_name' => $inv->company_name,
                    'tax_no' => $inv->tax_no,
                    'address_phone' => $inv->address_phone ?? '',
                    'bank_name' => $inv->bank_name ?? '',
                    'bank_account' => $inv->bank_account ?? '',
                    'amount' => $inv->amount,
                    'tax_rate' => ($inv->tax_rate * 100) . '%',
                    'tax_amount' => $inv->tax_amount,
                    'total_amount' => $inv->total_amount,
                    'issue_date' => $inv->issue_date,
                    'status' => $statusMap[$inv->status] ?? $inv->status,
                    'issued_at' => $inv->issued_at ?? '',
                    'voided_at' => $inv->voided_at ?? '',
                    'remark' => $inv->remark ?? ''
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
        $filename = '发票记录_' . date('YmdHis') . '.csv';

        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        // 打开输出流
        $output = fopen('php://output', 'w');

        // 添加 BOM 以支持中文
        fwrite($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

        // 表头
        $headers = ['ID', '发票号码', '发票类型', '购买方名称', '纳税人识别号', '地址电话', '开户银行', '银行账号', '金额(不含税)', '税率', '税额', '价税合计', '开票日期', '状态', '开具时间', '作废时间', '备注'];
        fputcsv($output, $headers);

        // 数据行字段顺序必须与表头一致
        $fields = ['id', 'invoice_no', 'type', 'company_name', 'tax_no', 'address_phone', 'bank_name', 'bank_account', 'amount', 'tax_rate', 'tax_amount', 'total_amount', 'issue_date', 'status', 'issued_at', 'voided_at', 'remark'];

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
        $headers = ['ID', '发票号码', '发票类型', '购买方名称', '纳税人识别号', '地址电话', '开户银行', '银行账号', '金额(不含税)', '税率', '税额', '价税合计', '开票日期', '状态', '开具时间', '作废时间', '备注'];
        foreach ($headers as $index => $header) {
            $column = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 1);
            $worksheet->setCellValue($column . '1', $header);
        }

        // 数据行字段顺序必须与表头一致
        $fields = ['id', 'invoice_no', 'type', 'company_name', 'tax_no', 'address_phone', 'bank_name', 'bank_account', 'amount', 'tax_rate', 'tax_amount', 'total_amount', 'issue_date', 'status', 'issued_at', 'voided_at', 'remark'];

        foreach ($data as $index => $row) {
            $rowNum = $index + 2;
            foreach ($fields as $colIndex => $field) {
                $column = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex + 1);
                $worksheet->setCellValue($column . $rowNum, $row[$field] ?? '');
            }
        }

        // 设置列宽
        $worksheet->getColumnDimension('A')->setWidth(8);
        $worksheet->getColumnDimension('B')->setWidth(18);
        $worksheet->getColumnDimension('C')->setWidth(15);
        $worksheet->getColumnDimension('D')->setWidth(20);
        $worksheet->getColumnDimension('E')->setWidth(18);
        $worksheet->getColumnDimension('F')->setWidth(20);
        $worksheet->getColumnDimension('G')->setWidth(15);
        $worksheet->getColumnDimension('H')->setWidth(20);
        $worksheet->getColumnDimension('I')->setWidth(14);
        $worksheet->getColumnDimension('J')->setWidth(8);
        $worksheet->getColumnDimension('K')->setWidth(12);
        $worksheet->getColumnDimension('L')->setWidth(14);
        $worksheet->getColumnDimension('M')->setWidth(12);
        $worksheet->getColumnDimension('N')->setWidth(10);
        $worksheet->getColumnDimension('O')->setWidth(20);
        $worksheet->getColumnDimension('P')->setWidth(20);
        $worksheet->getColumnDimension('Q')->setWidth(30);

        // 输出文件
        $filename = '发票记录_' . date('YmdHis') . '.xlsx';

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }
}
