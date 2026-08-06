<?php

namespace app\model;

use think\Model;

class Machine extends Model
{
    protected $table = 'repair_machines';

    protected $json = ['attachments', 'images'];

    protected $type = [
        'status' => 'integer',
        'purchase_date' => 'date',
        'warranty_expiry' => 'date',
        'last_maintenance' => 'date',
    ];

    public function category()
    {
        return $this->belongsTo(MachineCategory::class, 'category_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'machine_id');
    }

    public function testReports()
    {
        return $this->hasMany(TestReport::class, 'machine_id');
    }

    public function repairReports()
    {
        return $this->hasMany(RepairReport::class, 'machine_id');
    }

    public function repairContracts()
    {
        return $this->hasMany(RepairContract::class, 'machine_id');
    }
}
