<?php

namespace app\model;

use think\Model;

class Role extends Model
{
    protected $table = 'roles';

    protected $json = [];

    /**
     * 角色权限关联（多对多）
     */
    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permissions', 'role_id', 'permission_id');
    }

    /**
     * 角色权限关联表
     */
    public function rolePermissions()
    {
        return $this->hasMany(RolePermission::class, 'role_id');
    }

    /**
     * 用户关联（单角色）
     */
    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
    }

    /**
     * 用户关联（多对多）
     */
    public function userRoles()
    {
        return $this->belongsToMany(User::class, 'user_roles', 'role_id', 'user_id');
    }
}
