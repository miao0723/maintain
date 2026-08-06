<?php

namespace app\model;

use think\Model;

/**
 * 检测报告（与前端 TestReport.vue 字段对齐）
 *
 * @property string|null $test_flow_status pending|testing|completed
 */
class TestReport extends Model
{
    protected $table = 'test_reports';

    protected $json = ['test_results', 'attachments', 'images'];

    protected $type = [
        'test_date' => 'date',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function tester()
    {
        return $this->belongsTo(User::class, 'tester_id');
    }
}
