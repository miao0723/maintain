<?php

namespace app\model;

use think\Model;

class MaintenancePlan extends Model
{
    protected $table = 'maintenance_plans';

    protected $fillable = [
        'plan_name', 'device_id', 'type', 'cycle_type', 'cycle_value',
        'next_execute_time', 'executor_id', 'status', 'last_execute_time', 'description'
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    // 类型常量
    const TYPE_PREVENTIVE = 1;   // 预防性
    const TYPE_PLANNED = 2;       // 计划性

    // 周期类型常量
    const CYCLE_DAY = 'day';
    const CYCLE_WEEK = 'week';
    const CYCLE_MONTH = 'month';
    const CYCLE_YEAR = 'year';

    // 状态常量
    const STATUS_ACTIVE = 1;       // 启用
    const STATUS_INACTIVE = 0;     // 停用

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

    /**
     * 关联保养记录
     */
    public function records()
    {
        return $this->hasMany(MaintenanceRecord::class, 'plan_id')
            ->order('execute_time', 'desc');
    }

    /**
     * 获取类型文本
     */
    public function getTypeTextAttr($value, $data)
    {
        $typeMap = [
            self::TYPE_PREVENTIVE => '预防性',
            self::TYPE_PLANNED => '计划性',
        ];
        return $typeMap[$data['type']] ?? '未知';
    }

    /**
     * 获取周期类型文本
     */
    public function getCycleTypeTextAttr($value, $data)
    {
        $cycleMap = [
            self::CYCLE_DAY => '天',
            self::CYCLE_WEEK => '周',
            self::CYCLE_MONTH => '月',
            self::CYCLE_YEAR => '年',
        ];
        return $cycleMap[$data['cycle_type']] ?? '未知';
    }

    /**
     * 获取状态文本
     */
    public function getStatusTextAttr($value, $data)
    {
        $statusMap = [
            self::STATUS_ACTIVE => '启用',
            self::STATUS_INACTIVE => '停用',
        ];
        return $statusMap[$data['status']] ?? '未知';
    }

    /**
     * 检查是否需要执行
     */
    public function isDue()
    {
        return $this->status == self::STATUS_ACTIVE &&
               date('Y-m-d') >= $this->next_execute_time;
    }

    /**
     * 计算下次执行时间
     */
    public function calculateNextExecuteTime()
    {
        $baseTime = $this->last_execute_time ?? date('Y-m-d');

        switch ($this->cycle_type) {
            case self::CYCLE_DAY:
                return date('Y-m-d', strtotime("+{$this->cycle_value} days", strtotime($baseTime)));

            case self::CYCLE_WEEK:
                return date('Y-m-d', strtotime("+{$this->cycle_value} weeks", strtotime($baseTime)));

            case self::CYCLE_MONTH:
                return date('Y-m-d', strtotime("+{$this->cycle_value} months", strtotime($baseTime)));

            case self::CYCLE_YEAR:
                return date('Y-m-d', strtotime("+{$this->cycle_value} years", strtotime($baseTime)));

            default:
                return $this->next_execute_time;
        }
    }

    /**
     * 更新下次执行时间（在执行保养后调用）
     */
    public function updateNextExecuteTime()
    {
        $this->last_execute_time = date('Y-m-d');
        $this->next_execute_time = $this->calculateNextExecuteTime();
        $this->save();
    }
}
