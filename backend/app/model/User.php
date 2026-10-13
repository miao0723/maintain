<?php

namespace app\model;

use think\Model;

class User extends Model
{
    protected $table = 'users';

    protected $json = [];

    protected $hidden = ['password'];

    // 输出时附带扁平的角色名/角色码，供列表与选择器直接展示（ThinkPHP 用 $append 单数）
    protected $append = ['role_name', 'role_code'];

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    /**
     * 角色名（经 role_id 关联）。无角色时返回空串，避免列表“角色”列为空却报错。
     */
    public function getRoleNameAttr($value = null)
    {
        if (empty($this->getAttr('role_id'))) {
            return '';
        }
        return $this->role ? $this->role->getAttr('name') : '';
    }

    public function getRoleCodeAttr($value = null)
    {
        if (empty($this->getAttr('role_id'))) {
            return '';
        }
        return $this->role ? $this->role->getAttr('code') : '';
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