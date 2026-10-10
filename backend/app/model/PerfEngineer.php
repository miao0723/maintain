<?php

namespace app\model;

use think\Model;

/**
 * 维修人员模型
 */
class PerfEngineer extends Model
{
    protected $table = 'perf_engineers';

    protected $fillable = [
        'engineer_no',
        'name',
        'team',
        'level',
        'phone',
        'status',
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $type = [
        'status' => 'integer',
    ];

    /**
     * 该人员的工单
     */
    public function workOrders()
    {
        return $this->hasMany(PerfWorkOrder::class, 'engineer_id');
    }
}
