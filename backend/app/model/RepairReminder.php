<?php

namespace app\model;

use think\Model;

class RepairReminder extends Model
{
    protected $table = 'repair_reminders';

    protected $json = [];

    protected $type = [
        'status' => 'integer',
        'remind_date' => 'date',
        'completed_date' => 'date',
    ];

    public function repairReport()
    {
        return $this->belongsTo(RepairReport::class, 'repair_report_id');
    }

    public function contract()
    {
        return $this->belongsTo(RepairContract::class, 'contract_id');
    }

    // 获取通知目标地址（手机号或邮箱）
    public function getToaddrsAttr($value)
    {
        return $value;
    }

    // 设置通知目标地址
    public function setToaddrsAttr($value)
    {
        return $value;
    }
}
