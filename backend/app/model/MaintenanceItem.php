<?php

namespace app\model;

use think\Model;

class MaintenanceItem extends Model
{
    protected $table = 'maintenance_items';

    protected $fillable = [
        'code', 'name', 'category_id', 'unit', 'price', 'description', 'sort', 'status'
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
     * 关联分类
     */
    public function category()
    {
        return $this->belongsTo(MaintenanceCategory::class, 'category_id');
    }

    /**
     * 获取状态文本
     */
    public function getStatusTextAttr($value, $data)
    {
        $statusMap = self::getStatusMap();
        return $statusMap[$data['status']] ?? '未知';
    }

    /**
     * 获取分类名称 (访问器)
     */
    public function getCategoryNameAttr($value, $data)
    {
        if (isset($data['category']) && $data['category']) {
            return $data['category']->name;
        }
        return '';
    }
}
