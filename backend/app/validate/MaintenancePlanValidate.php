<?php

namespace app\validate;

use think\Validate;

class MaintenancePlanValidate extends Validate
{
    protected $rule = [
        'plan_name' => 'require|max:200',
        'device_id' => 'require|integer',
        'type' => 'require|integer|in:1,2',
        'cycle_type' => 'require|in:day,week,month,year',
        'cycle_value' => 'require|integer|>:0',
        'next_execute_time' => 'require|date',
        'executor_id' => 'require|integer',
        'status' => 'integer|in:0,1',
        'description' => 'max:1000',
        'content' => 'max:2000',
        'images' => 'array',
        'cost' => 'float|>=:0',
    ];

    protected $scene = [
        'create' => ['plan_name', 'device_id', 'type', 'cycle_type', 'cycle_value', 'next_execute_time', 'executor_id'],
        'update' => ['plan_name', 'type', 'cycle_type', 'cycle_value', 'status', 'description'],
        'execute' => ['content', 'images', 'cost'],
    ];

    protected $message = [
        'plan_name.require' => '计划名称不能为空',
        'plan_name.max' => '计划名称最多200个字符',
        'device_id.require' => '设备ID不能为空',
        'device_id.integer' => '设备ID格式错误',
        'type.require' => '类型不能为空',
        'type.integer' => '类型格式错误',
        'type.in' => '类型必须是1(预防性)或2(计划性)',
        'cycle_type.require' => '周期类型不能为空',
        'cycle_type.in' => '周期类型必须是day、week、month或year',
        'cycle_value.require' => '周期值不能为空',
        'cycle_value.integer' => '周期值格式错误',
        'cycle_value.>' => '周期值必须大于0',
        'next_execute_time.require' => '下次执行时间不能为空',
        'next_execute_time.date' => '下次执行时间格式错误',
        'executor_id.require' => '执行人ID不能为空',
        'executor_id.integer' => '执行人ID格式错误',
        'status.integer' => '状态格式错误',
        'status.in' => '状态必须是0(停用)或1(启用)',
        'description.max' => '描述最多1000个字符',
        'content.max' => '保养内容最多2000个字符',
        'images.array' => '照片格式错误',
        'cost.float' => '费用格式错误',
        'cost.>=' => '费用不能为负数',
    ];
}
