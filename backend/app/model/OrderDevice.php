<?php

namespace app\model;

use think\Model;

class OrderDevice extends Model
{
    protected $table = 'order_devices';

    protected $fillable = [
        'order_id',
        'name',
        'serial_no',
        'source',
        'quantity',
        'unit',
        'remarks',
        'status',
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $type = [
        'order_id' => 'integer',
        'quantity' => 'float',
    ];

    protected $hidden = [];
}
