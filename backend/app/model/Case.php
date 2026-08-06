<?php

namespace app\model;

use think\Model;

class Case extends Model
{
    protected $table = 'cases';

    protected $json = ['attachments', 'images'];

    protected $type = [
        'status' => 'integer',
        'priority' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function customerService()
    {
        return $this->hasMany(CustomerService::class, 'case_id');
    }
}
