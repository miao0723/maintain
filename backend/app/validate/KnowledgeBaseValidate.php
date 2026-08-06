<?php

namespace app\validate;

use think\Validate;

class KnowledgeBaseValidate extends Validate
{
    protected $rule = [
        'title' => 'require|max:200',
        'fault_symptom' => 'require|max:1000',
        'fault_cause' => 'require|max:1000',
        'solution' => 'require|max:5000',
        'category_id' => 'integer',
        'device_id' => 'integer',
        'related_part_ids' => 'array',
        'tags' => 'array',
        'difficulty_level' => 'integer|in:1,2,3',
        'status' => 'integer|in:0,1,2',
        'keyword' => 'max:100',
    ];

    protected $scene = [
        'create' => ['title', 'fault_symptom', 'fault_cause', 'solution', 'category_id', 'device_id', 'difficulty_level', 'tags'],
        'update' => ['title', 'fault_symptom', 'fault_cause', 'solution', 'category_id', 'device_id', 'difficulty_level', 'tags', 'status'],
        'search' => ['keyword', 'category_id', 'device_id', 'difficulty_level'],
    ];

    protected $message = [
        'title.require' => '标题不能为空',
        'title.max' => '标题最多200个字符',
        'fault_symptom.require' => '故障现象不能为空',
        'fault_symptom.max' => '故障现象最多1000个字符',
        'fault_cause.require' => '故障原因不能为空',
        'fault_cause.max' => '故障原因最多1000个字符',
        'solution.require' => '解决方案不能为空',
        'solution.max' => '解决方案最多5000个字符',
        'category_id.integer' => '分类ID格式错误',
        'device_id.integer' => '设备ID格式错误',
        'related_part_ids.array' => '关联配件格式错误',
        'tags.array' => '标签格式错误',
        'difficulty_level.integer' => '难度等级格式错误',
        'difficulty_level.in' => '难度等级必须是1(简单)2(中等)3(困难)',
        'status.integer' => '状态格式错误',
        'status.in' => '状态必须是0(草稿)1(已发布)2(已归档)',
        'keyword.max' => '搜索关键词最多100个字符',
    ];
}
