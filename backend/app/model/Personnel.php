<?php

namespace app\model;

use think\Model;

class Personnel extends Model
{
    protected $table = 'personnel';

    // 允许填充的字段
    protected $field = [
        'id', 'name', 'code', 'phone', 'email',
        'department_id', 'position', 'entry_date',
        'status', 'notes', 'created_at', 'updated_at'
    ];

    // 字段类型
    protected $type = [
        'status' => 'integer',
        'department_id' => 'integer',
        'entry_date' => 'datetime',
    ];

    // 自动时间戳
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';

    // 数据验证
    protected $rule = [
        'name' => 'require|max:100',
        'code' => 'require|max:50',
        'phone' => 'require|regex:/^1[3-9]\d{9}$/',
        'email' => 'email',
        'position' => 'in:engineer,supervisor,manager',
        'status' => 'in:0,1',
    ];

    // 默认值
    protected $default = [
        'position' => 'engineer',
        'status' => 1,
    ];

    /**
     * 关联部门
     */
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    /**
     * 关联用户
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
