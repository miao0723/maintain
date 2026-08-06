<?php

namespace app\validate;

use think\Validate;

class ContractTemplateValidate extends Validate
{
    protected $rule = [
        'name' => 'require|max:200',
        'type' => 'require|in:repair_contract,service_agreement,confidentiality,trade_contract',
        'description' => 'max:500',
        'content' => 'require',
        'created_by' => 'integer',
    ];

    protected $message = [
        'name.require' => '模板名称不能为空',
        'name.max' => '模板名称不能超过200个字符',
        'type.require' => '模板类型不能为空',
        'type.in' => '模板类型无效',
        'description.max' => '模板描述不能超过500个字符',
        'content.require' => '模板内容不能为空',
        'created_by.integer' => '创建人ID必须为整数',
    ];

    protected $scene = [
        'create' => ['name', 'type', 'content'],
        'update' => ['name', 'type', 'content'],
    ];
}
