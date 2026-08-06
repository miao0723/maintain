<?php

namespace app\model;

use think\Model;

class Permission extends Model
{
    protected $table = 'permissions';

    protected $json = [];

    protected $fillable = [
        'name',
        'code',
        'type',
        'parent_id',
        'status',
        'sort',
    ];

    protected $hidden = [];

    protected $type = [
        'status' => 'boolean',
        'sort' => 'integer',
    ];

    /**
     * 关联角色（多对多）
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_permissions', 'permission_id', 'role_id');
    }

    /**
     * 父级权限
     */
    public function parent()
    {
        return $this->belongsTo(Permission::class, 'parent_id');
    }

    /**
     * 子级权限
     */
    public function children()
    {
        return $this->hasMany(Permission::class, 'parent_id')->order('sort', 'asc');
    }
}
