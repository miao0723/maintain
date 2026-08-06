<?php

namespace app\model;

use think\Model;

class CustomerService extends Model
{
    protected $table = 'customer_service';

    protected $json = ['attachments', 'images'];

    protected $type = [
        'status' => 'integer',
        'service_date' => 'datetime',
    ];

    public function case()
    {
        return $this->belongsTo(Case::class, 'case_id');
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }
}
