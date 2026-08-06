<?php

namespace app\model;

use think\Model;

class InspectionTask extends Model
{
    protected $table = 'inspection_tasks';

    protected $fillable = [
        'task_name', 'device_id', 'inspector_id', 'plan_time',
        'actual_time', 'status', 'result', 'images', 'is_abnormal'
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    // JSON字段自动转换
    protected $json = ['images'];
    protected $jsonAssoc = true;

    // 状态常量
    const STATUS_PENDING = 0;      // 待执行
    const STATUS_IN_PROGRESS = 1;  // 进行中
    const STATUS_COMPLETED = 2;    // 已完成
    const STATUS_OVERDUE = 3;      // 已逾期

    /**
     * 关联设备
     */
    public function device()
    {
        return $this->belongsTo(Device::class, 'device_id');
    }

    /**
     * 关联巡检员
     */
    public function inspector()
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    /**
     * 获取状态文本
     */
    public function getStatusTextAttr($value, $data)
    {
        $statusMap = [
            self::STATUS_PENDING => '待执行',
            self::STATUS_IN_PROGRESS => '进行中',
            self::STATUS_COMPLETED => '已完成',
            self::STATUS_OVERDUE => '已逾期',
        ];
        return $statusMap[$data['status']] ?? '未知';
    }

    /**
     * 检查是否逾期
     */
    public function isOverdue()
    {
        // 如果已完成或已逾期，不需要重新判断
        if ($this->status == self::STATUS_COMPLETED || $this->status == self::STATUS_OVERDUE) {
            return $this->status == self::STATUS_OVERDUE;
        }

        // 如果实际执行时间大于计划时间，则逾期
        if ($this->actual_time) {
            return strtotime($this->actual_time) > strtotime($this->plan_time);
        }

        // 如果当前日期大于计划日期且未完成，则逾期
        return date('Y-m-d') > $this->plan_time && $this->status != self::STATUS_COMPLETED;
    }

    /**
     * 检查是否可以执行
     */
    public function canExecute()
    {
        return $this->status == self::STATUS_PENDING || $this->status == self::STATUS_IN_PROGRESS;
    }
}
