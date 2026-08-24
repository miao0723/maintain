<?php

namespace app\validate;

use think\Validate;

class OrderDeviceValidate extends Validate
{
    protected $rule = [
        'order_id'  => 'require|integer',
        'name'      => 'require|max:100',
        'serial_no' => 'max:100',
        'source'    => 'max:50',
        'quantity'  => 'require|float|gt:0',
        'unit'      => 'max:10',
        'remarks'   => 'max:1000',
        'status'    => 'in:normal,maintenance,idle,scrapped',
    ];

    protected $scene = [
        'create' => ['order_id', 'name', 'serial_no', 'source', 'quantity', 'unit', 'remarks', 'status'],
        'update' => ['order_id', 'name', 'serial_no', 'source', 'quantity', 'unit', 'remarks', 'status'],
    ];

    protected $message = [
        'order_id.require' => '关联订单ID不能为空',
        'order_id.integer' => '订单ID格式错误',
        'name.require'     => '设备名称不能为空',
        'name.max'         => '设备名称最多100个字符',
        'serial_no.max'    => '序列号最多100个字符',
        'source.max'       => '设备来源最多50个字符',
        'quantity.require' => '数量不能为空',
        'quantity.float'   => '数量必须是数字',
        'quantity.gt'      => '数量必须大于0',
        'unit.max'         => '单位最多10个字符',
        'remarks.max'      => '备注最多1000个字符',
        'status.in'        => '状态值必须是 normal(正常)、maintenance(维修中)、idle(闲置) 或 scrapped(报废)',
    ];
}
