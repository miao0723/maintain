<?php

namespace app\model;

use think\Model;

class RolePermission extends Model
{
    protected $table = 'role_permissions';

    protected $json = ['permissions'];

    protected $fillable = [
        'role_id',
        'permission_id',
        'permissions',
    ];

    protected $type = [
        'permissions' => 'json',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function permission()
    {
        return $this->belongsTo(Permission::class, 'permission_id');
    }
}
