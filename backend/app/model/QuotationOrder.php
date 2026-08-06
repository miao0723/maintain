<?php

namespace app\model;

use think\Model;

class QuotationOrder extends Model
{
    protected $table = 'quotation_orders';

    protected $pk = 'id';

    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';

    protected $type = [
        'total_amount' => 'decimal',
        'discount' => 'decimal',
        'discount_amount' => 'decimal',
        'final_amount' => 'decimal',
    ];

    const STATUS_DRAFT = 0;          // 草稿
    const STATUS_SUBMITTED = 1;      // 已提交
    const STATUS_ACCEPTED = 2;       // 已接受
    const STATUS_REJECTED = 3;       // 已拒绝
    const STATUS_CONVERTED = 4;      // 已转为工单

    public static function getStatusMap()
    {
        return [
            self::STATUS_DRAFT => '草稿',
            self::STATUS_SUBMITTED => '已提交',
            self::STATUS_ACCEPTED => '已接受',
            self::STATUS_REJECTED => '已拒绝',
            self::STATUS_CONVERTED => '已转为工单',
        ];
    }

    public function getStatusTextAttr($value, $data)
    {
        $statusMap = self::getStatusMap();
        return $statusMap[$data['status']] ?? '未知';
    }

    public function items()
    {
        return $this->hasMany(QuotationItem::class, 'quotation_id')->order('sort', 'asc');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function acceptor()
    {
        return $this->belongsTo(User::class, 'accepted_by');
    }
}
