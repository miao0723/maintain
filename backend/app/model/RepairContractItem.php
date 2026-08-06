<?php

namespace app\model;

use think\Model;

class RepairContractItem extends Model
{
    protected $table = 'repair_contract_items';

    protected $type = [
        'id' => 'integer',
        'contract_id' => 'integer',
        'unit_price' => 'float',
        'quantity' => 'float',
        'total_price' => 'float',
    ];

    protected $fillable = [
        'contract_id',
        'item_name',
        'item_code',
        'specification',
        'unit',
        'unit_price',
        'quantity',
        'total_price',
        'remark',
    ];

    public function contract()
    {
        return $this->belongsTo(RepairContract::class, 'contract_id');
    }
}
