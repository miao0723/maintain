<?php

namespace app\model;

use think\Model;

class Supplier extends Model
{
    protected $table = 'suppliers';

    protected $fillable = [
        'name', 'code', 'contact_person', 'contact_phone',
        'contact_email', 'address', 'status', 'description'
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    // 状态常量
    const STATUS_ACTIVE = 1;    // 正常
    const STATUS_INACTIVE = 0;  // 停用

    /**
     * 关联配件
     */
    public function spareParts()
    {
        return $this->hasMany(SparePart::class, 'supplier_id');
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
     * 获取供应商的配件数量
     */
    public function getPartsCount()
    {
        return $this->spareParts()->count();
    }

    /**
     * 获取供应商的库存总价值
     */
    public function getTotalStockValue()
    {
        $parts = $this->spareParts()
            ->where('status', SparePart::STATUS_ACTIVE)
            ->select();

        $totalValue = 0;
        foreach ($parts as $part) {
            $totalValue += ($part->stock_quantity ?? 0) * ($part->purchase_price ?? 0);
        }
        return $totalValue;
    }

    /**
     * 检查是否有关联配件
     */
    public function hasSpareParts()
    {
        return $this->spareParts()->count() > 0;
    }

    /**
     * 检查是否可以停用
     */
    public function canDeactivate()
    {
        // 有正常状态配件的供应商不能停用
        $activePartsCount = $this->spareParts()
            ->where('status', SparePart::STATUS_ACTIVE)
            ->count();
        return $activePartsCount == 0;
    }
}
