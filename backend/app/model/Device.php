<?php

namespace app\model;

use think\Model;

class Device extends Model
{
    protected $table = 'devices';

    protected $fillable = [
        'code',
        'name',
        'specification',
        'category_id',
        'department_id',
        'location',
        'purchase_date',
        'warranty_expiry',
        'status',
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $hidden = [];

    /**
     * 关联分类
     */
    public function category()
    {
        return $this->belongsTo(DeviceCategory::class, 'category_id');
    }

    /**
     * 关联部门
     */
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}