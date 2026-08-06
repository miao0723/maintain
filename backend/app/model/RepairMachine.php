<?php

namespace app\model;

use think\Model;

class RepairMachine extends Model
{
    protected $table = 'repair_machines';

    protected $fillable = [
        'name', 'model', 'category_id', 'manufacturer',
        'power', 'weight', 'specifications', 'status'
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    // 状态常量
    const STATUS_ACTIVE = 1;   // 启用
    const STATUS_INACTIVE = 0; // 禁用

    /**
     * 关联分类
     */
    public function category()
    {
        return $this->belongsTo(RepairCategory::class, 'category_id');
    }

    /**
     * 获取状态文本
     */
    public function getStatusTextAttr($value, $data)
    {
        $statusMap = [
            self::STATUS_ACTIVE => '启用',
            self::STATUS_INACTIVE => '禁用',
        ];
        return $statusMap[$data['status']] ?? '未知';
    }
}
