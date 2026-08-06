<?php

namespace app\model;

use think\Model;

class RepairContract extends Model
{
    protected $table = 'repair_contracts';

    protected $json = ['attachments', 'images'];

    protected $type = [
        'id' => 'integer',
        'customer_id' => 'integer',
        'machine_id' => 'integer',
        'annual_fee' => 'float',
        'start_date' => 'date',
        'end_date' => 'date',
        'sign_date' => 'date',
    ];

    protected $fillable = [
        'contract_number',
        'customer_id',
        'customer_name',
        'customer_phone',
        'company_name',
        'company_phone',
        'company_address',
        'machine_id',
        'machine_type',
        'service_content',
        'service_terms',
        'annual_fee',
        'start_date',
        'end_date',
        'sign_date',
        'status',
        'contract_file',
        'attachments',
        'images',
        'remark',
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function reminders()
    {
        return $this->hasMany(RepairReminder::class, 'contract_id');
    }

    public function items()
    {
        return $this->hasMany(RepairContractItem::class, 'contract_id');
    }

    public function machine()
    {
        return $this->belongsTo(Machine::class, 'machine_id');
    }
}
