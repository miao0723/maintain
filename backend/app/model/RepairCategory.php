<?php

namespace app\model;

use think\Model;

class RepairCategory extends Model
{
    protected $table = 'repair_categories';

    protected $fillable = [
        'name', 'code', 'description', 'sort', 'status'
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    // 状态常量
    const STATUS_ACTIVE = 1;   // 启用
    const STATUS_INACTIVE = 0; // 禁用

    /**
     * 关联机械
     */
    public function machines()
    {
        return $this->hasMany(RepairMachine::class, 'category_id');
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
