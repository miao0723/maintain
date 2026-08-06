<?php

namespace app\model;

use think\Model;

class MiniAdminUser extends Model
{
    protected $table = 'mini_admin_users';

    protected $hidden = ['password'];

    public function role()
    {
        return $this->belongsTo(MiniAdminRole::class, 'role_id');
    }

    public function getRoleCodeAttr($value, $data)
    {
        return $data['role_code'] ?? ($this->role ? $this->role->code : '');
    }

    public function getRoleNameAttr($value, $data)
    {
        return $data['role_name'] ?? ($this->role ? $this->role->name : '');
    }
}
