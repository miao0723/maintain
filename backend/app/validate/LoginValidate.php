<?php

namespace app\validate;

use think\Validate;

class LoginValidate extends Validate
{
    protected $rule = [
        'username' => 'require|max:50',
        'password' => 'require|min:6|max:20',
    ];

    protected $message = [
        'username.require' => '用户名不能为空',
        'username.max' => '用户名最多50个字符',
        'password.require' => '密码不能为空',
        'password.min' => '密码至少6个字符',
        'password.max' => '密码最多20个字符',
    ];
}