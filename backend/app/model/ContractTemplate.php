<?php

namespace app\model;

use think\Model;

class ContractTemplate extends Model
{
    protected $table = 'contract_templates';

    protected $json = ['variables', 'custom_variables'];

    protected $type = [
        'id' => 'integer',
        'created_by' => 'integer',
    ];

    protected $fillable = [
        'name',
        'type',
        'description',
        'content',
        'variables',
        'custom_variables',
        'created_by',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function contracts()
    {
        return $this->hasMany(RepairContract::class, 'template_id');
    }
}
