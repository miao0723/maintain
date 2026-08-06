<?php

namespace app\model;

use think\Model;

/**
 * 小程序设备类型模型 (对应 repair 数据库 device_types 表)
 */
class DeviceType extends Model
{
    // 使用 repair 数据库连接
    protected $connection = 'repair';

    protected $table = 'device_types';

    protected $pk = 'id';

    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = false;

    protected $fillable = [
        'name', 'icon'
    ];

    protected $guarded = ['id', 'created_at'];

    /**
     * 关联常见问题
     */
    public function commonProblems()
    {
        return $this->hasMany(CommonProblem::class, 'device_type_id');
    }
}