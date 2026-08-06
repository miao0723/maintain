<?php

namespace app\model;

use think\Model;
use think\facade\Db;

class SparePart extends Model
{
    // 使用 repair 数据库连接
    protected $connection = 'repair';

    protected $table = 'spare_parts';

    protected $fillable = [
        'part_code', 'part_name', 'category', 'specification',
        'unit', 'supplier_id', 'purchase_price', 'selling_price',
        'stock_quantity', 'min_stock', 'max_stock', 'location', 'status', 'image_url'
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    // 状态常量（repair 数据库：1=正常 2=停用）
    const STATUS_ACTIVE = 1;    // 正常
    const STATUS_INACTIVE = 2;  // 停用

    /**
     * 关联库存记录（repair 数据库 stock_records 表）
     */
    public function stockRecords()
    {
        return $this->hasMany(StockRecord::class, 'spare_part_id')
            ->order('created_at', 'desc');
    }

    /**
     * 获取状态文本
     */
    public function getStatusTextAttr($value, $data)
    {
        $statusMap = [
            self::STATUS_ACTIVE => '正常',
            self::STATUS_INACTIVE => '停用',
        ];
        return $statusMap[$data['status']] ?? '未知';
    }

    /**
     * 检查是否库存不足
     */
    public function isLowStock()
    {
        return $this->stock_quantity <= $this->min_stock;
    }

    /**
     * 获取库存状态
     */
    public function getStockStatus()
    {
        if ($this->stock_quantity <= 0) {
            return 'out_of_stock'; // 无库存
        } elseif ($this->stock_quantity <= $this->min_stock) {
            return 'low_stock'; // 库存不足
        } else {
            return 'normal'; // 正常
        }
    }

    /**
     * 入库（repair 数据库 stock_records 表）
     */
    public function stockIn($quantity, $orderId = null, $operatorId = null, $remark = null)
    {
        if ($quantity <= 0) {
            throw new \Exception('入库数量必须大于0');
        }

        Db::connect('repair')->startTrans();
        try {
            $beforeQuantity = $this->stock_quantity;
            $afterQuantity = $beforeQuantity + $quantity;

            // 创建库存记录（repair 数据库字段名）
            $record = new StockRecord();
            $record->spare_part_id = $this->id;
            $record->record_type = StockRecord::TYPE_IN;
            $record->quantity = $quantity;
            $record->before_stock = $beforeQuantity;
            $record->after_stock = $afterQuantity;
            $record->related_id = $orderId;
            $record->operator_id = $operatorId;
            $record->notes = $remark;
            $record->save();

            // 更新库存
            $this->stock_quantity = $afterQuantity;
            $this->save();

            Db::connect('repair')->commit();
            return $record;
        } catch (\Exception $e) {
            Db::connect('repair')->rollback();
            throw $e;
        }
    }

    /**
     * 出库（repair 数据库 stock_records 表）
     */
    public function stockOut($quantity, $orderId = null, $operatorId = null, $remark = null)
    {
        if ($quantity <= 0) {
            throw new \Exception('出库数量必须大于0');
        }

        if ($quantity > $this->stock_quantity) {
            throw new \Exception('库存不足，当前库存：' . $this->stock_quantity);
        }

        Db::connect('repair')->startTrans();
        try {
            $beforeQuantity = $this->stock_quantity;
            $afterQuantity = $beforeQuantity - $quantity;

            // 创建库存记录（repair 数据库字段名）
            $record = new StockRecord();
            $record->spare_part_id = $this->id;
            $record->record_type = StockRecord::TYPE_OUT;
            $record->quantity = $quantity;
            $record->before_stock = $beforeQuantity;
            $record->after_stock = $afterQuantity;
            $record->related_id = $orderId;
            $record->operator_id = $operatorId;
            $record->notes = $remark;
            $record->save();

            // 更新库存
            $this->stock_quantity = $afterQuantity;
            $this->save();

            Db::connect('repair')->commit();
            return $record;
        } catch (\Exception $e) {
            Db::connect('repair')->rollback();
            throw $e;
        }
    }
}
