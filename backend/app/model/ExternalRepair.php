<?php

namespace app\model;

use think\Model;

class ExternalRepair extends Model
{
    protected $table = 'external_repairs';

    protected $json = ['attachments', 'images'];

    protected $type = [
        'status' => 'integer',
        'send_date' => 'date',
        'return_date' => 'date',
        'cost' => 'float',
    ];

    public function machine()
    {
        return $this->belongsTo(Machine::class, 'machine_id');
    }

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }
}
