<?php

namespace app\model;

use think\Model;

class User extends Model
{
    protected $table = 'users';

    protected $json = [];

    protected $hidden = ['password'];

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    /**
     * 关联角色（通过 role_id，单角色）
     */
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * 关联多个角色（通过 user_roles 中间表）
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id');
    }

    /**
     * 关联工程师资料（如果用户是工程师）
     */
    public function engineer()
    {
        return $this->hasOne(Engineer::class, 'user_id');
    }

    /**
     * 检查用户是否是工程师
     */
    public function isEngineer()
    {
        return $this->role_type == 3; // 3 = 工程师角色
    }
}