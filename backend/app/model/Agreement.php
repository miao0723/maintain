<?php

namespace app\model;

use think\Model;

class Agreement extends Model
{
    protected $table = 'agreements';

    protected $field = [
        'id', 'title', 'code', 'content', 'version',
        'status', 'effective_date', 'remark',
        'created_by', 'updated_by', 'created_at', 'updated_at'
    ];

    protected $type = [
        'status' => 'integer',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'effective_date' => 'datetime',
    ];

    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';

    // 隐藏敏感字段
    protected $hidden = ['created_by', 'updated_by'];

    /**
     * 获取协议标题
     */
    public function getTitleAttr($value, $data)
    {
        return $value ?: '设备维修服务免责协议';
    }

    /**
     * 获取状态文本
     */
    public function getStatusTextAttr($value, $data)
    {
        return $data['status'] == 1 ? '启用' : '禁用';
    }
}
