<?php

namespace app\model;

use think\Model;

class Order extends Model
{
    protected $table = 'orders';

    protected $json = ['attachments', 'images'];

    protected $type = [
        'status' => 'integer',
        'type' => 'integer',
        'order_date' => 'datetime',
        'completion_date' => 'datetime',
    ];

    public function machine()
    {
        return $this->belongsTo(Machine::class, 'machine_id');
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function testReport()
    {
        return $this->hasOne(TestReport::class, 'order_id');
    }

    public function repairReport()
    {
        return $this->hasOne(RepairReport::class, 'order_id');
    }

    public function payments()
    {
        return $this->hasMany(OnlinePayment::class, 'order_id');
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class, 'order_id');
    }

    public function case()
    {
        return $this->hasOne(Case::class, 'order_id');
    }
}
