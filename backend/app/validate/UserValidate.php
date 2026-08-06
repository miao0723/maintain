<?php

namespace app\validate;

use think\Validate;

class UserValidate extends Validate
{
    protected $rule = [
        'username' => 'require|max:50|alphaNum',
        'password' => 'require|min:6|max:20',
        'real_name' => 'require|max:50',
        'phone' => 'require|max:20',
        'email' => 'email|max:100',
        'role_type' => 'require|in:1,2,3,4',
        'department_id' => 'integer',
    ];

    protected $message = [
        'username.require' => '用户名不能为空',
        'username.alphaNum' => '用户名只能包含字母和数字',
        'password.require' => '密码不能为空',
        'password.min' => '密码至少6个字符',
        'real_name.require' => '真实姓名不能为空',
        'phone.require' => '手机号不能为空',
        'email' => '邮箱格式不正确',
        'role_type.require' => '角色类型不能为空',
        'role_type.in' => '角色类型无效',
    ];

    protected $scene = [
        'create' => ['username', 'password', 'real_name', 'phone', 'email', 'role_type', 'department_id'],
        'update' => ['real_name', 'phone', 'email', 'role_type', 'department_id'],
    ];
}