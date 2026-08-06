<?php

namespace app\service;

use app\model\SparePart;
use app\model\StockRecord;

class SparePartService
{
    /**
     * 获取配件列表（分页+筛选）- 读取 repair 数据库
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = SparePart::order('stock_quantity', 'asc')
              ->order('id', 'desc');

        // 按分类（字符串）筛选
        if (isset($filters['category']) && !empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        // 按供应商筛选
        if (isset($filters['supplier_id']) && !empty($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }

        // 按状态筛选
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        // 库存预警筛选
        if (isset($filters['stock_status']) && !empty($filters['stock_status'])) {
            switch ($filters['stock_status']) {
                case 'low':
                case 'low_stock':
                    $query->where('stock_quantity', '<', Db::raw('min_stock'));
                    break;
                case 'out':
                case 'out_of_stock':
                    $query->where('stock_quantity', '=', 0);
                    break;
                case 'normal':
                    $query->where('stock_quantity', '>', Db::raw('min_stock'));
                    break;
            }
        }

        // 搜索配件名称或编号
        if (isset($filters['keyword']) && !empty($filters['keyword'])) {
            $keyword = $filters['keyword'];
            $query->where(function ($q) use ($keyword) {
                $q->whereLike('part_name', '%' . $keyword . '%')
                  ->whereOr('part_code', 'like', '%' . $keyword . '%');
            });
        }

        $list = $query->page($page, $limit)->select();
        $total = $query->count();

        // 添加库存状态
        foreach ($list as $part) {
            $part->stock_status = $part->getStockStatus();
            $part->is_low_stock = $part->isLowStock();
        }

        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取配件详情 - 读取 repair 数据库
     */
    public function getDetail($id)
    {
        $part = SparePart::with(['stockRecords' => function($query) {
            $query->order('created_at', 'desc')->limit(20);
        }])->find($id);

        if (!$part) {
            throw new \Exception('配件不存在');
        }

        $part->stock_status = $part->getStockStatus();
        $part->is_low_stock = $part->isLowStock();

        return $part;
    }

    /**
     * 创建配件 - 写入 repair 数据库
     */
    public function create($data)
    {
        // 检查编号是否已存在
        $existing = SparePart::where('part_code', $data['part_code'])->find();
        if ($existing) {
            throw new \Exception('配件编号已存在');
        }

        // 设置默认值
        $data['stock_quantity'] = $data['stock_quantity'] ?? 0;
        $data['min_stock'] = $data['min_stock'] ?? 0;
        $data['purchase_price'] = $data['purchase_price'] ?? 0;
        $data['selling_price'] = $data['selling_price'] ?? 0;
        $data['status'] = $data['status'] ?? SparePart::STATUS_ACTIVE;

        // 显式指定允许的字段（repair 数据库字段）
        $allowedFields = [
            'part_code', 'part_name', 'category', 'specification',
            'unit', 'supplier_id', 'purchase_price', 'selling_price',
            'stock_quantity', 'min_stock', 'max_stock', 'location', 'status', 'image_url'
        ];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $part = new SparePart();
        $part->data($filteredData);
        $part->save();

        return $part->refresh();
    }

    /**
     * 更新配件 - 写入 repair 数据库
     */
    public function update($id, $data)
    {
        $part = SparePart::find($id);
        if (!$part) {
            throw new \Exception('配件不存在');
        }

        // 如果修改编号，检查是否重复
        if (isset($data['part_code']) && $data['part_code'] != $part->part_code) {
            $existing = SparePart::where('part_code', $data['part_code'])
                ->where('id', '<>', $id)
                ->find();
            if ($existing) {
                throw new \Exception('配件编号已存在');
            }
        }

        // 显式指定允许的字段（repair 数据库字段，不包括 part_code 和 stock_quantity）
        $allowedFields = [
            'part_name', 'category', 'specification', 'unit',
            'supplier_id', 'purchase_price', 'selling_price',
            'min_stock', 'max_stock', 'location', 'status', 'image_url'
        ];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        // 直接使用 save() 方法传入数据
        $part->save($filteredData);

        return $part->refresh();
    }

    /**
     * 删除配件
     */
    public function delete($id)
    {
        $part = SparePart::find($id);
        if (!$part) {
            throw new \Exception('配件不存在');
        }

        // 检查是否有库存
        if ($part->stock_quantity > 0) {
            throw new \Exception('配件有库存，无法删除');
        }

        $part->delete();
        return true;
    }

    /**
     * 配件入库
     */
    public function stockIn($id, $quantity, $orderId = null, $operatorId = null, $remark = null)
    {
        $part = SparePart::find($id);
        if (!$part) {
            throw new \Exception('配件不存在');
        }

        if ($part->status != SparePart::STATUS_ACTIVE) {
            throw new \Exception('配件已停用，无法入库');
        }

        return $part->stockIn($quantity, $orderId, $operatorId, $remark);
    }

    /**
     * 配件出库
     */
    public function stockOut($id, $quantity, $orderId = null, $operatorId = null, $remark = null)
    {
        $part = SparePart::find($id);
        if (!$part) {
            throw new \Exception('配件不存在');
        }

        if ($part->status != SparePart::STATUS_ACTIVE) {
            throw new \Exception('配件已停用，无法出库');
        }

        return $part->stockOut($quantity, $orderId, $operatorId, $remark);
    }

    /**
     * 获取库存预警列表
     */
    public function getAlerts()
    {
        $query = SparePart::where('status', SparePart::STATUS_ACTIVE)
            ->where(function ($q) {
                $q->where('stock_quantity', '=', 0)
                  ->whereOr('stock_quantity', '<=', 'min_stock');
            });

        $list = $query->order('stock_quantity', 'asc')
                     ->select();

        // 添加预警类型和库存状态
        foreach ($list as $part) {
            $part->stock_status = $part->getStockStatus();
            if ($part->stock_quantity == 0) {
                $part->alert_type = 'out_of_stock';
                $part->urgency = 'high';
            } else {
                $part->alert_type = 'low_stock';
                // 计算紧急度：库存越少，紧急度越高
                $ratio = $part->stock_quantity / max($part->min_stock, 1);
                $part->urgency = $ratio <= 0.5 ? 'high' : 'medium';
            }
        }

        return [
            'list' => $list,
            'total' => count($list),
            'out_of_stock_count' => $list->where('stock_quantity', 0)->count(),
            'low_stock_count' => $list->where('stock_quantity', '>', 0)
                ->where('stock_quantity', '<=', 'min_stock')->count(),
        ];
    }

    /**
     * 获取库存记录 - 读取 repair 数据库 stock_records
     */
    public function getRecords($page = 1, $limit = 20, $filters = [])
    {
        $query = StockRecord::with(['part']);

        // 按配件筛选
        if (isset($filters['part_id']) && !empty($filters['part_id'])) {
            $query->where('spare_part_id', $filters['part_id']);
        }

        // 按类型筛选
        if (isset($filters['type']) && $filters['type'] !== '') {
            $query->where('record_type', $filters['type']);
        }

        // 按工单筛选
        if (isset($filters['order_id']) && !empty($filters['order_id'])) {
            $query->where('related_id', $filters['order_id']);
        }

        // 按日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date'] . ' 23:59:59');
        }

        // 排序：按创建时间降序
        $query->order('created_at', 'desc');

        $list = $query->page($page, $limit)->select();
        $total = $query->count();

        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取库存统计数据 - 读取 repair 数据库
     */
    public function getStatistics()
    {
        $query = SparePart::where('status', SparePart::STATUS_ACTIVE);

        $totalParts = $query->count();
        $totalStock = $query->sum('stock_quantity');
        $totalValue = $query->field('SUM(stock_quantity * purchase_price) as total_value')
            ->value('total_value');

        // 库存预警数量
        $alertQuery = clone $query;
        $alertCount = $alertQuery->where('stock_quantity', '<=', 'min_stock')->count();

        // 零库存数量
        $outOfStockCount = (clone $query)->where('stock_quantity', 0)->count();

        // 按分类（字符串）统计
        $categoryStats = SparePart::where('status', SparePart::STATUS_ACTIVE)
            ->field("category, COUNT(*) as part_count, SUM(stock_quantity) as total_stock, SUM(stock_quantity * purchase_price) as total_value")
            ->group("category")
            ->select();

        return [
            'total_parts' => $totalParts,
            'total_stock' => $totalStock ? $totalStock : 0,
            'total_value' => $totalValue ? floatval($totalValue) : 0,
            'alert_count' => $alertCount,
            'out_of_stock_count' => $outOfStockCount,
            'category_stats' => $categoryStats,
        ];
    }

    /**
     * 导出配件库存
     */
    public function export($format = 'xlsx', $filters = [])
    {
        $query = SparePart::order('id', 'asc');

        // 应用筛选条件
        if (isset($filters['category']) && !empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }
        if (isset($filters['supplier_id']) && !empty($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }
        if (isset($filters['stock_status']) && !empty($filters['stock_status'])) {
            switch ($filters['stock_status']) {
                case 'low':
                case 'low_stock':
                    $query->where('stock_quantity', '<', Db::raw('min_stock'));
                    break;
                case 'out':
                case 'out_of_stock':
                    $query->where('stock_quantity', '=', 0);
                    break;
                case 'normal':
                    $query->where('stock_quantity', '>', Db::raw('min_stock'));
                    break;
            }
        }
        if (isset($filters['keyword']) && !empty($filters['keyword'])) {
            $keyword = $filters['keyword'];
            $query->where(function ($q) use ($keyword) {
                $q->whereLike('part_name', '%' . $keyword . '%')
                  ->whereOr('part_code', 'like', '%' . $keyword . '%');
            });
        }

        $parts = $query->select();

        if ($format === 'csv') {
            return $this->exportCsv($parts);
        } else {
            return $this->exportExcel($parts);
        }
    }

    /**
     * 导出CSV格式（适配 repair 数据库字段）
     */
    private function exportCsv($parts)
    {
        $filename = '配件库存_' . date('YmdHis') . '.csv';
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache');
        header('Expires: 0');

        echo "\xEF\xBB\xBF";

        $output = fopen('php://output', 'w');
        fputcsv($output, ['序号', '配件编号', '配件名称', '分类', '规格型号', '单位', '当前库存', '最小库存', '库存状态', '采购单价', '库存总价值', '销售单价', '存放位置', '状态', '创建时间']);

        foreach ($parts as $index => $part) {
            $stockStatus = $part->stock_quantity <= 0 ? '缺货' : ($part->stock_quantity <= $part->min_stock ? '低库存' : '正常');
            $statusText = $part->status == SparePart::STATUS_ACTIVE ? '正常' : '停用';
            $totalValue = $part->stock_quantity * $part->purchase_price;

            fputcsv($output, [
                $index + 1,
                $part->part_code,
                $part->part_name,
                $part->category ?? '',
                $part->specification,
                $part->unit,
                $part->stock_quantity,
                $part->min_stock,
                $stockStatus,
                $part->purchase_price,
                number_format($totalValue, 2),
                $part->selling_price,
                $part->location ?? '',
                $statusText,
                $part->created_at
            ]);
        }

        fclose($output);
        exit;
    }

    /**
     * 导出Excel格式（适配 repair 数据库字段）
     */
    private function exportExcel($parts)
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // 设置表头
        $headers = ['序号', '配件编号', '配件名称', '分类', '规格型号', '单位', '当前库存', '最小库存', '库存状态', '采购单价', '库存总价值', '销售单价', '存放位置', '状态', '创建时间'];
        foreach ($headers as $col => $header) {
            $sheet->setCellValue([$col + 1, 1], $header);
        }

        // 设置数据
        foreach ($parts as $index => $part) {
            $row = $index + 2;
            $stockStatus = $part->stock_quantity <= 0 ? '缺货' : ($part->stock_quantity <= $part->min_stock ? '低库存' : '正常');
            $statusText = $part->status == SparePart::STATUS_ACTIVE ? '正常' : '停用';
            $totalValue = $part->stock_quantity * $part->purchase_price;

            $sheet->setCellValue([1, $row], $index + 1);
            $sheet->setCellValue([2, $row], $part->part_code);
            $sheet->setCellValue([3, $row], $part->part_name);
            $sheet->setCellValue([4, $row], $part->category ?? '');
            $sheet->setCellValue([5, $row], $part->specification);
            $sheet->setCellValue([6, $row], $part->unit);
            $sheet->setCellValue([7, $row], $part->stock_quantity);
            $sheet->setCellValue([8, $row], $part->min_stock);
            $sheet->setCellValue([9, $row], $stockStatus);
            $sheet->setCellValue([10, $row], number_format($part->purchase_price, 2));
            $sheet->setCellValue([11, $row], number_format($totalValue, 2));
            $sheet->setCellValue([12, $row], $part->selling_price);
            $sheet->setCellValue([13, $row], $part->location ?? '');
            $sheet->setCellValue([14, $row], $statusText);
            $sheet->setCellValue([15, $row], $part->created_at);

            // 根据库存状态设置颜色
            $columnLetter = chr(64 + 9); // I 列
            if ($stockStatus === '缺货') {
                $sheet->getStyle($columnLetter . $row)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFFFC7CE');
            } elseif ($stockStatus === '低库存') {
                $sheet->getStyle($columnLetter . $row)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFFFEB9C');
            }
        }

        // 自动调整列宽
        foreach (range(1, 15) as $col) {
            $dimension = $sheet->getColumnDimensionByColumn($col);
            $dimension->setAutoSize(true);
        }

        // 设置表头样式
        $sheet->getStyle('A1:O1')->getFont()->setBold(true);
        $sheet->getStyle('A1:O1')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFD9D9D9');

        $filename = '配件库存_' . date('YmdHis') . '.xlsx';
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');
        exit;
    }
}
