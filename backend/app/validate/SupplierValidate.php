<?php

namespace app\validate;

use think\Validate;

class SupplierValidate extends Validate
{
    protected $rule = [
        'name' => 'require|max:100',
        'code' => 'require|max:50',
        'contact_person' => 'max:50',
        'contact_phone' => 'max:20',
        'contact_email' => 'email|max:100',
        'address' => 'max:255',
        'status' => 'integer|in:0,1',
        'description' => 'max:500',
    ];

    protected $scene = [
        'create' => ['name', 'code', 'contact_person', 'contact_phone', 'contact_email', 'address'],
        'update' => ['name', 'contact_person', 'contact_phone', 'contact_email', 'address', 'status', 'description'],
    ];

    protected $message = [
        'name.require' => '供应商名称不能为空',
        'name.max' => '供应商名称最多100个字符',
        'code.require' => '供应商编码不能为空',
        'code.max' => '供应商编码最多50个字符',
        'contact_person.max' => '联系人最多50个字符',
        'contact_phone.max' => '联系电话最多20个字符',
        'contact_email.email' => '邮箱格式不正确',
        'contact_email.max' => '邮箱最多100个字符',
        'address.max' => '地址最多255个字符',
        'status.integer' => '状态格式错误',
        'status.in' => '状态必须是0(停用)或1(正常)',
        'description.max' => '描述最多500个字符',
    ];
}
