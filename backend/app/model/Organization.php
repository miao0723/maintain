<?php

namespace app\model;

use think\Model;

class Organization extends Model
{
    protected $table = 'organizations';
    protected $pk = 'id';

    protected $hidden = ['created_at', 'updated_at'];

    /**
     * 获取父单位
     */
    public function parent()
    {
        return $this->belongsTo(Organization::class, 'parent_id');
    }

    /**
     * 获取子单位
     */
    public function children()
    {
        return $this->hasMany(Organization::class, 'parent_id');
    }
}
