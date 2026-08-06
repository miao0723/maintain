<?php

namespace app\model;

use think\Model;

class MiniAdminRole extends Model
{
    protected $table = 'mini_admin_roles';

    public function permissions()
    {
        return $this->belongsToMany(MiniAdminPermission::class, 'mini_admin_role_permissions', 'permission_id', 'role_id');
    }
}
