<?php

namespace app\validate;

use think\Validate;

class DeviceCategoryValidate extends Validate
{
    protected $rule = [
        'name' => 'require|max:50|unique:device_categories',
        'icon' => 'max:100',
    ];

    protected $message = [
        'name.require' => '分类名称不能为空',
        'name.max' => '分类名称最多50个字符',
        'name.unique' => '分类名称已存在',
        'icon.max' => '图标标识最多100个字符',
    ];
}