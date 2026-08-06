<?php

namespace app\model;

use think\Model;

class Transfer extends Model
{
    protected $table = 'cmms_transfer_payments';

    protected $json = [];

    protected $type = [
        'amount' => 'float',
        'transfer_time' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $autoWriteTimestamp = false;


    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }
}
