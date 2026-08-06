<?php

namespace app\model;

use think\Model;

class MachineCategory extends Model
{
    protected $table = 'repair_categories';

    protected $json = [];

    protected $type = [
        'status' => 'integer',
    ];

    public function machines()
    {
        return $this->hasMany(Machine::class, 'category_id');
    }

    public function parent()
    {
        return $this->belongsTo(MachineCategory::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(MachineCategory::class, 'parent_id');
    }
}
