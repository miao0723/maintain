<?php

namespace app\validate;

use think\Validate;

class RepairContractValidate extends Validate
{
    protected $rule = [
        'contract_number' => 'require|max:50',
        'customer_name' => 'require|max:100',
        'customer_phone' => 'max:20',
        'machine_type' => 'require|max:100',
        'service_content' => 'require',
        'start_date' => 'require|date',
        'end_date' => 'require|date',
        'annual_fee' => 'number|>=:0',
        'status' => 'in:draft,active,expired,terminated',
        'sign_date' => 'date',
    ];

    protected $message = [
        'contract_number.require' => '合同编号不能为空',
        'contract_number.max' => '合同编号不能超过50个字符',
        'customer_name.require' => '客户名称不能为空',
        'customer_name.max' => '客户名称不能超过100个字符',
        'machine_type.require' => '机械类型不能为空',
        'service_content.require' => '服务内容不能为空',
        'start_date.require' => '开始日期不能为空',
        'start_date.date' => '开始日期格式不正确',
        'end_date.require' => '结束日期不能为空',
        'end_date.date' => '结束日期格式不正确',
        'annual_fee.number' => '合同金额必须为数字',
        'annual_fee.>=' => '合同金额不能为负数',
        'status.in' => '合同状态无效',
        'sign_date.date' => '签订日期格式不正确',
    ];

    protected $scene = [
        'create' => ['contract_number', 'customer_name', 'sign_date'],
        'update' => ['customer_name'],
    ];
}
