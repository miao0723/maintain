<?php

namespace app\model;

use think\Model;

class OnlinePayment extends Model
{
    protected $table = 'cmms_online_payments';

    protected $json = [];

    protected $type = [
        'amount' => 'float',
        'refund_amount' => 'float',
        'created_at' => 'datetime',
        'paid_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'refund_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $autoWriteTimestamp = false;


    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }
}
