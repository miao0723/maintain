<?php

namespace app\validate;

use think\Validate;

class EngineerValidate extends Validate
{
    protected $rule = [
        'user_id' => 'require|integer',
        'skill_level' => 'integer|in:1,2,3,4',
        'specialties' => 'array',
        'work_years' => 'integer|>=:0',
        'certification' => 'max:200',
        'status' => 'integer|in:1,2,3',
    ];

    protected $scene = [
        'create' => ['user_id', 'skill_level', 'specialties', 'work_years', 'certification'],
        'update' => ['skill_level', 'specialties', 'work_years', 'certification', 'status'],
    ];

    protected $message = [
        'user_id.require' => '用户ID不能为空',
        'user_id.integer' => '用户ID格式错误',
        'skill_level.integer' => '技能等级格式错误',
        'skill_level.in' => '技能等级必须是1(初级)、2(中级)、3(高级)或4(专家)',
        'specialties.array' => '专长领域格式错误',
        'work_years.integer' => '工作年限格式错误',
        'work_years.>=' => '工作年限不能为负数',
        'certification.max' => '专业认证最多200个字符',
        'status.integer' => '状态格式错误',
        'status.in' => '状态必须是1(在岗)、2(休假)或3(离职)',
    ];
}
