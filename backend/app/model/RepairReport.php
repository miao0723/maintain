<?php

namespace app\model;

use think\Model;

class RepairReport extends Model
{
    protected $table = 'repair_reports';

    protected $json = ['attachments', 'images', 'parts_used'];

    protected $type = [
        'repair_date' => 'date',
        'completion_date' => 'datetime',
        'repair_hours' => 'float',
        'amount' => 'float',
    ];

    // 自动时间戳（关闭）
    protected $autoWriteTimestamp = false;

    /**
     * 获取状态文本
     */
    public function getStatusAttr($value)
    {
        $map = ['pending' => '待处理', 'repairing' => '维修中', 'completed' => '已完成'];
        return $map[$value] ?? $value;
    }
}
