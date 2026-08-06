<?php

namespace app\model;

use think\Model;

class MaintenanceCategory extends Model
{
    protected $table = 'maintenance_categories';

    protected $fillable = [
        'name', 'code', 'description', 'sort', 'status'
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    /**
     * 状态常量
     */
    const STATUS_DISABLED = 0;
    const STATUS_ENABLED = 1;

    /**
     * 状态映射
     */
    public static function getStatusMap()
    {
        return [
            self::STATUS_DISABLED => '禁用',
            self::STATUS_ENABLED => '启用',
        ];
    }

    /**
     * 关联维修项目
     */
    public function items()
    {
        return $this->hasMany(MaintenanceItem::class, 'category_id');
    }

    /**
     * 获取状态文本
     */
    public function getStatusTextAttr($value, $data)
    {
        $statusMap = self::getStatusMap();
        return $statusMap[$data['status']] ?? '未知';
    }
}
