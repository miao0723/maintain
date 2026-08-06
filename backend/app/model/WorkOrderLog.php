<?php

namespace app\model;

use think\Model;

class WorkOrderLog extends Model
{
    protected $table = 'work_order_logs';

    protected $fillable = [
        'order_id', 'action', 'operator_id', 'remark'
    ];

    protected $guarded = ['id', 'created_at'];

    // 操作类型常量
    const ACTION_CREATED = 'created';
    const ACTION_ASSIGNED = 'assigned';
    const ACTION_ACCEPTED = 'accepted';
    const ACTION_STARTED = 'started';
    const ACTION_COMPLETED = 'completed';
    const ACTION_VERIFIED = 'verified';
    const ACTION_CLOSED = 'closed';
    const ACTION_UPDATED = 'updated';

    /**
     * 关联工单
     */
    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class, 'order_id');
    }

    /**
     * 关联操作人
     */
    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }
}
