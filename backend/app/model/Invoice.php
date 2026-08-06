<?php

namespace app\model;

use think\Model;

class Invoice extends Model
{
    protected $table = 'cmms_invoices';

    protected $json = [];

    protected $type = [
        'amount' => 'float',
        'tax_rate' => 'float',
        'tax_amount' => 'float',
        'total_amount' => 'float',
        'issue_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'issued_at' => 'datetime',
        'voided_at' => 'datetime',
    ];

    protected $autoWriteTimestamp = false;
}
