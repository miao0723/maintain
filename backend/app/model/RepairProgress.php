<?php

namespace app\model;

use think\Model;

class RepairProgress extends Model
{
    protected $table = 'repair_progress';

    protected $json = ['attachments', 'images'];

    protected $type = [
        'status' => 'integer',
        'progress_date' => 'datetime',
    ];

    public function repairReport()
    {
        return $this->belongsTo(RepairReport::class, 'repair_report_id');
    }

    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }
}
