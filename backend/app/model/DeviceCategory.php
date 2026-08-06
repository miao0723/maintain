<?php

namespace app\model;

use think\Model;

class DeviceCategory extends Model
{
    protected $table = 'device_categories';

    protected $fillable = [
        'name',
        'icon',
        'description',
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    /**
     * 关联设备
     */
    public function devices()
    {
        return $this->hasMany(Device::class, 'category_id');
    }
}