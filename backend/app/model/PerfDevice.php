<?php

namespace app\model;

use think\Model;

/**
 * 设备模型
 */
class PerfDevice extends Model
{
    protected $table = 'perf_devices';

    protected $fillable = [
        'device_no',
        'name',
        'type',
        'area',
        'fault_desc',
        'status',
        'engineer_id',
        'est_hours',
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $type = [
        'status' => 'integer',
        'engineer_id' => 'integer',
        // 规划维修时长（小时）
        'est_hours' => 'float',
    ];

    /**
     * 该设备的工单
     */
    public function workOrders()
    {
        return $this->hasMany(PerfWorkOrder::class, 'device_id');
    }
}
