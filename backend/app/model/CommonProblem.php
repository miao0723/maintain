<?php

namespace app\model;

use think\Model;

/**
 * 小程序常见问题模型 (对应 repair 数据库 common_problems 表)
 * 用于在 Web 管理端管理小程序端的常见问题数据
 */
class CommonProblem extends Model
{
    // 使用 repair 数据库连接
    protected $connection = 'repair';

    protected $table = 'common_problems';

    protected $pk = 'id';

    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = false;

    protected $fillable = [
        'device_type_id', 'name', 'icon', 'base_price', 'price_range'
    ];

    protected $guarded = ['id', 'created_at'];

    /**
     * 关联设备类型
     */
    public function deviceType()
    {
        return $this->belongsTo(DeviceType::class, 'device_type_id');
    }

    /**
     * 获取设备类型名称 (访问器)
     */
    public function getDeviceTypeNameAttr($value, $data)
    {
        if (isset($data['device_type']) && $data['device_type']) {
            return $data['device_type']->name;
        }
        return '';
    }
}