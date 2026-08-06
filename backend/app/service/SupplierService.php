<?php

namespace app\service;

use app\model\Supplier;
use app\model\SparePart;

class SupplierService
{
    /**
     * 获取供应商列表（分页+筛选）
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = Supplier::with(['spareParts' => function($query) {
            $query->where('status', SparePart::STATUS_ACTIVE)
                  ->field('id,supplier_id,part_name,stock_quantity');
        }]);

        // 按状态筛选
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        // 搜索供应商名称或编码
        if (isset($filters['keyword']) && !empty($filters['keyword'])) {
            $keyword = $filters['keyword'];
            $query->where(function ($q) use ($keyword) {
                $q->whereLike('name', '%' . $keyword . '%')
                  ->whereOr('code', 'like', '%' . $keyword . '%');
            });
        }

        // 排序：按创建时间降序
        $query->order('id', 'desc');

        $list = $query->page($page, $limit)->select();
        $total = $query->count();

        // 添加统计信息
        foreach ($list as $supplier) {
            $supplier->parts_count = $supplier->getPartsCount();
            $supplier->total_stock_value = $supplier->getTotalStockValue();
        }

        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取供应商详情
     */
    public function getDetail($id)
    {
        $supplier = Supplier::with(['spareParts' => function($query) {
            $query->where('status', SparePart::STATUS_ACTIVE)
                  ->field('id,supplier_id,part_code,part_name,stock_quantity,purchase_price,selling_price');
        }])->find($id);

        if (!$supplier) {
            throw new \Exception('供应商不存在');
        }

        $supplier->parts_count = $supplier->getPartsCount();
        $supplier->total_stock_value = $supplier->getTotalStockValue();

        return $supplier;
    }

    /**
     * 创建供应商
     */
    public function create($data)
    {
        // 检查编码是否已存在
        $existing = Supplier::where('code', $data['code'])->find();
        if ($existing) {
            throw new \Exception('供应商编码已存在');
        }

        // 设置默认值
        $data['status'] = $data['status'] ?? Supplier::STATUS_ACTIVE;

        // 显式指定允许的字段
        $allowedFields = [
            'name', 'code', 'contact_person', 'contact_phone',
            'contact_email', 'address', 'status', 'description'
        ];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $supplier = new Supplier();
        $supplier->data($filteredData);
        $supplier->save();

        return $supplier->refresh();
    }

    /**
     * 更新供应商
     */
    public function update($id, $data)
    {
        $supplier = Supplier::find($id);
        if (!$supplier) {
            throw new \Exception('供应商不存在');
        }

        // 如果修改编码，检查是否重复
        if (isset($data['code']) && $data['code'] != $supplier->code) {
            $existing = Supplier::where('code', $data['code'])
                ->where('id', '<>', $id)
                ->find();
            if ($existing) {
                throw new \Exception('供应商编码已存在');
            }
        }

        // 如果要停用，检查是否有关联的配件
        if (isset($data['status']) && $data['status'] == Supplier::STATUS_INACTIVE) {
            if (!$supplier->canDeactivate()) {
                throw new \Exception('供应商有正常状态的配件，无法停用');
            }
        }

        // 显式指定允许的字段（不包括code）
        $allowedFields = [
            'name', 'contact_person', 'contact_phone',
            'contact_email', 'address', 'status', 'description'
        ];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $supplier->data($filteredData);
        $supplier->save();

        return $supplier->refresh();
    }

    /**
     * 删除供应商
     */
    public function delete($id)
    {
        $supplier = Supplier::find($id);
        if (!$supplier) {
            throw new \Exception('供应商不存在');
        }

        // 检查是否有关联配件
        if ($supplier->hasSpareParts()) {
            throw new \Exception('供应商有关联配件，无法删除');
        }

        $supplier->delete();
        return true;
    }

    /**
     * 获取供应商的配件列表
     */
    public function getSpareParts($supplierId, $page = 1, $limit = 20)
    {
        $supplier = Supplier::find($supplierId);
        if (!$supplier) {
            throw new \Exception('供应商不存在');
        }

        $query = SparePart::where('supplier_id', $supplierId);

        $list = $query->page($page, $limit)->select();
        $total = $query->count();

        // 添加库存状态
        foreach ($list as $part) {
            $part->stock_status = $part->getStockStatus();
            $part->is_low_stock = $part->isLowStock();
        }

        return [
            'supplier' => $supplier,
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取供应商统计数据
     */
    public function getStatistics()
    {
        $totalSuppliers = Supplier::count();
        $activeSuppliers = Supplier::where('status', Supplier::STATUS_ACTIVE)->count();
        $inactiveSuppliers = $totalSuppliers - $activeSuppliers;

        // 有配件的供应商数量
        $suppliersWithParts = Supplier::whereHas('spareParts')->count();

        // 库存总价值（按供应商统计）
        $supplierStats = Supplier::with(['spareParts' => function($query) {
            $query->where('status', SparePart::STATUS_ACTIVE);
        }])
        ->where('status', Supplier::STATUS_ACTIVE)
        ->select()
        ->map(function($supplier) {
            $parts = $supplier->spareParts;
            $totalValue = 0;
            $totalStock = 0;
            $partsCount = $parts->count();

            foreach ($parts as $part) {
                $totalValue += $part->stock_quantity * $part->purchase_price;
                $totalStock += $part->stock_quantity;
            }

            return [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'code' => $supplier->code,
                'parts_count' => $partsCount,
                'total_stock' => $totalStock,
                'total_value' => floatval($totalValue),
            ];
        })
        ->sortByDesc('total_value')
        ->values()
        ->all();

        // 总库存价值
        $totalValue = array_sum(array_column($supplierStats, 'total_value'));

        return [
            'total_suppliers' => $totalSuppliers,
            'active_suppliers' => $activeSuppliers,
            'inactive_suppliers' => $inactiveSuppliers,
            'suppliers_with_parts' => $suppliersWithParts,
            'total_value' => floatval($totalValue),
            'supplier_stats' => $supplierStats,
        ];
    }
}
