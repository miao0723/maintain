<?php

namespace app\model;

use think\Model;

/**
 * 维修工单模型
 */
class PerfWorkOrder extends Model
{
    protected $table = 'perf_work_orders';

    // 维修状态枚举
    const STATUS_PENDING    = 'pending';   // 待接单
    const STATUS_TO_REPAIR  = 'to_repair'; // 待维修（已建单尚未开始维修）
    const STATUS_PROCESSING = 'processing'; // 维修中
    const STATUS_WAITING    = 'waiting';   // 待验收
    const STATUS_COMPLETED  = 'completed'; // 已完成
    const STATUS_TIMEOUT    = 'timeout';   // 已超时

    public static $statusMap = [
        self::STATUS_PENDING    => '待接单',
        self::STATUS_TO_REPAIR  => '待维修',
        self::STATUS_PROCESSING => '维修中',
        self::STATUS_WAITING    => '待验收',
        self::STATUS_COMPLETED  => '已完成',
        self::STATUS_TIMEOUT    => '已超时',
    ];

    protected $fillable = [
        'order_no',
        'device_id',
        'engineer_id',
        'report_time',
        'accept_time',
        'complete_time',
        'status',
        'est_hours',
        'actual_hours',
        'delay_reason',
        'repair_count',
        'review_score',
        'review_comment',
        'is_qualified',
        'self_score',
        'completion_note',
        'images',
        'fault_desc',
        'priority',
        'remark',
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $type = [
        'device_id'   => 'integer',
        'engineer_id' => 'integer',
        'repair_count' => 'integer',
        'review_score' => 'integer',
        'self_score'  => 'integer',
        'is_qualified' => 'integer',
        // 维修时长统一为「小时」（2 位小数）：<24h 显示小时，>=24h 显示天
        'est_hours'    => 'float',
        'actual_hours' => 'float',
        'images'      => 'array',
    ];

    /**
     * 关联设备
     */
    public function device()
    {
        return $this->belongsTo(PerfDevice::class, 'device_id');
    }

    /**
     * 关联维修人员
     */
    public function engineer()
    {
        return $this->belongsTo(PerfEngineer::class, 'engineer_id');
    }
}
