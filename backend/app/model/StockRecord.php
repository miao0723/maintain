<?php

namespace app\model;

use think\Model;

class StockRecord extends Model
{
    // 使用 repair 数据库连接
    protected $connection = 'repair';

    protected $table = 'stock_records';

    protected $fillable = [
        'spare_part_id', 'record_type', 'quantity', 'before_stock',
        'after_stock', 'related_type', 'related_id', 'operator_id', 'notes'
    ];

    protected $guarded = ['id', 'created_at'];

    // 类型常量
    const TYPE_IN = 1;      // 入库
    const TYPE_OUT = 2;     // 出库
    const TYPE_CHECK = 3;   // 盘点

    /**
     * 关联配件
     */
    public function part()
    {
        return $this->belongsTo(SparePart::class, 'spare_part_id');
    }

    /**
     * 获取类型文本（映射 record_type 字段）
     */
    public function getTypeTextAttr($value, $data)
    {
        $type = $data['record_type'] ?? $this->record_type ?? null;
        $typeMap = [
            self::TYPE_IN => '入库',
            self::TYPE_OUT => '出库',
            self::TYPE_CHECK => '盘点',
        ];
        return $typeMap[$type] ?? '未知';
    }

    /**
     * 获取操作人姓名
     */
    public function getOperatorNameAttr($value, $data)
    {
        if (isset($this->operator) && $this->operator) {
            return $this->operator->real_name ?? $this->operator->username ?? '';
        }
        return '';
    }

    /**
     * 获取配件名称
     */
    public function getPartNameAttr($value, $data)
    {
        if (isset($this->part) && $this->part) {
            return $this->part->part_name ?? '';
        }
        return '';
    }
}
