<?php

namespace app\model;

use think\Model;

class MaintenanceRecord extends Model
{
    protected $table = 'maintenance_records';

    protected $fillable = [
        'plan_id', 'device_id', 'executor_id',
        'execute_time', 'content', 'images', 'cost'
    ];

    protected $guarded = ['id', 'created_at'];

    // JSON字段自动转换
    protected $json = ['images'];
    protected $jsonAssoc = true;

    /**
     * 关联保养计划
     */
    public function plan()
    {
        return $this->belongsTo(MaintenancePlan::class, 'plan_id');
    }

    /**
     * 关联设备
     */
    public function device()
    {
        return $this->belongsTo(Device::class, 'device_id');
    }

    /**
     * 关联执行人
     */
    public function executor()
    {
        return $this->belongsTo(User::class, 'executor_id');
    }
}
