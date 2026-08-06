<?php

namespace app\validate;

use think\Validate;

class WorkOrderValidate extends Validate
{
    protected $rule = [
        'device_id' => 'require|integer',
        'fault_description' => 'require|max:1000|min:10',
        'fault_type' => 'max:100',
        'priority' => 'integer|in:1,2,3,4',
        'assigned_to' => 'integer',
        'repair_record' => 'max:2000',
        'repair_images' => 'array',
        'used_parts' => 'array',
        'cost_parts' => 'float|>=:0',
        'cost_labor' => 'float|>=:0',
        'reporter_rating' => 'integer|between:1,5',
        'reporter_feedback' => 'max:500',
        'start_time' => 'date',
        'complete_time' => 'date',
    ];

    protected $scene = [
        'create' => [
            'device_id', 'fault_description', 'fault_type', 'priority'
        ],
        'update' => [
            'fault_description', 'fault_type', 'priority', 'repair_record',
            'repair_images', 'used_parts', 'cost_parts', 'cost_labor'
        ],
        'assign' => ['assigned_to'],
        'complete' => [
            'repair_record', 'repair_images', 'used_parts',
            'cost_parts', 'cost_labor'
        ],
        'verify' => ['reporter_rating', 'reporter_feedback'],
    ];

    protected $message = [
        'device_id.require' => '设备ID不能为空',
        'device_id.integer' => '设备ID格式错误',
        'fault_description.require' => '故障描述不能为空',
        'fault_description.max' => '故障描述最多1000个字符',
        'fault_description.min' => '故障描述至少10个字符',
        'fault_type.max' => '故障类型最多100个字符',
        'priority.integer' => '优先级格式错误',
        'priority.in' => '优先级必须是1(低)、2(中)、3(高)或4(紧急)',
        'assigned_to.integer' => '指派人员ID格式错误',
        'repair_record.max' => '维修记录最多2000个字符',
        'repair_images.array' => '维修照片格式错误',
        'used_parts.array' => '使用配件格式错误',
        'cost_parts.float' => '配件成本格式错误',
        'cost_parts.>=' => '配件成本不能为负数',
        'cost_labor.float' => '人工成本格式错误',
        'cost_labor.>=' => '人工成本不能为负数',
        'reporter_rating.integer' => '评分格式错误',
        'reporter_rating.between' => '评分必须在1-5之间',
        'reporter_feedback.max' => '反馈内容最多500个字符',
        'start_time.date' => '开始时间格式错误',
        'complete_time.date' => '完成时间格式错误',
    ];
}
