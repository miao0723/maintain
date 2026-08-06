<?php

namespace app\model;

use think\Model;

class Engineer extends Model
{
    protected $table = 'engineers';

    protected $fillable = [
        'user_id', 'skill_level', 'specialties',
        'work_years', 'certification', 'status'
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    // JSON字段自动转换
    protected $json = ['specialties'];
    protected $jsonAssoc = true;

    // 技能等级常量
    const SKILL_BEGINNER = 1;   // 初级
    const SKILL_INTERMEDIATE = 2; // 中级
    const SKILL_ADVANCED = 3;   // 高级
    const SKILL_EXPERT = 4;     // 专家

    // 状态常量
    const STATUS_ACTIVE = 1;    // 在岗
    const STATUS_ON_LEAVE = 2;  // 休假
    const STATUS_RESIGNED = 3;  // 离职

    /**
     * 关联用户
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * 关联工单（指派给该工程师的）
     */
    public function workOrders()
    {
        return $this->hasMany(WorkOrder::class, 'assigned_to', 'user_id');
    }

    /**
     * 关联排班
     */
    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'engineer_id');
    }

    /**
     * 获取技能等级文本
     */
    public function getSkillLevelTextAttr($value, $data)
    {
        $skillMap = [
            self::SKILL_BEGINNER => '初级',
            self::SKILL_INTERMEDIATE => '中级',
            self::SKILL_ADVANCED => '高级',
            self::SKILL_EXPERT => '专家',
        ];
        return $skillMap[$data['skill_level']] ?? '未知';
    }

    /**
     * 获取状态文本
     */
    public function getStatusTextAttr($value, $data)
    {
        $statusMap = [
            self::STATUS_ACTIVE => '在岗',
            self::STATUS_ON_LEAVE => '休假',
            self::STATUS_RESIGNED => '离职',
        ];
        return $statusMap[$data['status']] ?? '未知';
    }

    /**
     * 检查工程师是否可用
     */
    public function isAvailable()
    {
        // 状态必须是在岗
        if ($this->status != self::STATUS_ACTIVE) {
            return false;
        }

        // 检查当前工作负载（未完成的工单数量）
        $activeOrders = $this->workOrders()
            ->whereIn('status', [
                WorkOrder::STATUS_ASSIGNED,
                WorkOrder::STATUS_IN_PROGRESS,
                WorkOrder::STATUS_PENDING_VERIFY
            ])
            ->count();

        // TODO: 可以配置最大并发工单数，暂时设为5
        return $activeOrders < 5;
    }

    /**
     * 检查工程师是否有某专长
     */
    public function hasSpecialty($specialty)
    {
        if (empty($this->specialties)) {
            return false;
        }

        return in_array($specialty, $this->specialties);
    }

    /**
     * 获取工程师当前工作负载
     */
    public function getWorkload()
    {
        return [
            'assigned' => $this->workOrders()->where('status', WorkOrder::STATUS_ASSIGNED)->count(),
            'in_progress' => $this->workOrders()->where('status', WorkOrder::STATUS_IN_PROGRESS)->count(),
            'pending_verify' => $this->workOrders()->where('status', WorkOrder::STATUS_PENDING_VERIFY)->count(),
            'total_active' => $this->workOrders()->whereIn('status', [
                WorkOrder::STATUS_ASSIGNED,
                WorkOrder::STATUS_IN_PROGRESS,
                WorkOrder::STATUS_PENDING_VERIFY
            ])->count(),
        ];
    }
}
