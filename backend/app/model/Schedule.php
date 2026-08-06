<?php

namespace app\model;

use think\Model;

class Schedule extends Model
{
    protected $table = 'schedules';

    protected $fillable = [
        'engineer_id', 'work_date', 'shift_type', 'status'
    ];

    protected $guarded = ['id', 'created_at'];

    // 班次类型常量
    const SHIFT_MORNING = 'morning';    // 上午班
    const SHIFT_AFTERNOON = 'afternoon'; // 下午班
    const SHIFT_NIGHT = 'night';        // 夜班

    // 状态常量
    const STATUS_NORMAL = 1;    // 正常
    const STATUS_LEAVE = 2;     // 请假

    /**
     * 关联工程师
     */
    public function engineer()
    {
        return $this->belongsTo(Engineer::class, 'engineer_id');
    }

    /**
     * 关联用户（通过工程师）
     */
    public function user()
    {
        return $this->hasOneThrough(User::class, Engineer::class, 'id', 'id', 'engineer_id', 'user_id');
    }

    /**
     * 获取班次类型文本
     */
    public function getShiftTypeTextAttr($value, $data)
    {
        $shiftMap = [
            self::SHIFT_MORNING => '上午班',
            self::SHIFT_AFTERNOON => '下午班',
            self::SHIFT_NIGHT => '夜班',
        ];
        return $shiftMap[$data['shift_type']] ?? '未知';
    }

    /**
     * 获取状态文本
     */
    public function getStatusTextAttr($value, $data)
    {
        $statusMap = [
            self::STATUS_NORMAL => '正常',
            self::STATUS_LEAVE => '请假',
        ];
        return $statusMap[$data['status']] ?? '未知';
    }

    /**
     * 检查是否是请假状态
     */
    public function isOnLeave()
    {
        return $this->status == self::STATUS_LEAVE;
    }

    /**
     * 检查工程师在指定日期是否可用
     */
    public static function isEngineerAvailable($engineerId, $date)
    {
        $schedule = self::where('engineer_id', $engineerId)
            ->where('work_date', $date)
            ->find();

        // 如果没有排班记录，认为不可用
        if (!$schedule) {
            return false;
        }

        // 如果是请假状态，不可用
        return !$schedule->isOnLeave();
    }
}
