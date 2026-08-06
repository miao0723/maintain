<?php

namespace app\model;

use think\Model;

class WorkOrder extends Model
{
    protected $table = 'work_orders';

    protected $fillable = [
        'order_no', 'device_id', 'reporter_id', 'assigned_to',
        'fault_type', 'fault_description', 'priority', 'status',
        'start_time', 'complete_time', 'repair_record',
        'repair_images', 'used_parts', 'cost_parts', 'cost_labor',
        'total_cost', 'reporter_rating', 'reporter_feedback', 'version'
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    // JSON字段自动转换
    protected $json = ['repair_images', 'used_parts'];
    protected $jsonAssoc = true;

    protected $hidden = ['version'];

    // 状态常量
    const STATUS_PENDING = 0;      // 待派单
    const STATUS_ASSIGNED = 1;     // 已派单
    const STATUS_IN_PROGRESS = 2;  // 维修中
    const STATUS_PENDING_VERIFY = 3; // 待验收
    const STATUS_COMPLETED = 4;    // 已完成
    const STATUS_CLOSED = 5;       // 已关闭

    // 优先级常量
    const PRIORITY_LOW = 1;
    const PRIORITY_MEDIUM = 2;
    const PRIORITY_HIGH = 3;
    const PRIORITY_URGENT = 4;

    /**
     * 关联设备
     */
    public function device()
    {
        return $this->belongsTo(Device::class, 'device_id');
    }

    /**
     * 关联报修人
     */
    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    /**
     * 关联指派维修人
     */
    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * 关联日志
     */
    public function logs()
    {
        return $this->hasMany(WorkOrderLog::class, 'order_id')
            ->order('created_at', 'desc');
    }

    /**
     * 获取状态文本
     */
    public function getStatusTextAttr($value, $data)
    {
        $statusMap = [
            self::STATUS_PENDING => '待派单',
            self::STATUS_ASSIGNED => '已派单',
            self::STATUS_IN_PROGRESS => '维修中',
            self::STATUS_PENDING_VERIFY => '待验收',
            self::STATUS_COMPLETED => '已完成',
            self::STATUS_CLOSED => '已关闭',
        ];
        return $statusMap[$data['status']] ?? '未知';
    }

    /**
     * 获取优先级文本
     */
    public function getPriorityTextAttr($value, $data)
    {
        $priorityMap = [
            self::PRIORITY_LOW => '低',
            self::PRIORITY_MEDIUM => '中',
            self::PRIORITY_HIGH => '高',
            self::PRIORITY_URGENT => '紧急',
        ];
        return $priorityMap[$data['priority']] ?? '未知';
    }

    /**
     * 检查状态是否可以转换
     */
    public function canTransitionTo($newStatus)
    {
        $transitions = [
            self::STATUS_PENDING => [self::STATUS_ASSIGNED, self::STATUS_CLOSED],
            self::STATUS_ASSIGNED => [self::STATUS_IN_PROGRESS, self::STATUS_PENDING],
            self::STATUS_IN_PROGRESS => [self::STATUS_PENDING_VERIFY],
            self::STATUS_PENDING_VERIFY => [self::STATUS_COMPLETED, self::STATUS_IN_PROGRESS],
            self::STATUS_COMPLETED => [self::STATUS_CLOSED],
            self::STATUS_CLOSED => [],
        ];

        return in_array($newStatus, $transitions[$this->status] ?? []);
    }
}
