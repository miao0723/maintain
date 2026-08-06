<?php

namespace app\validate;

use think\Validate;

class InspectionTaskValidate extends Validate
{
    protected $rule = [
        'task_name' => 'require|max:200',
        'device_id' => 'require|integer',
        'inspector_id' => 'require|integer',
        'plan_time' => 'require|date',
        'actual_time' => 'date',
        'status' => 'integer|in:0,1,2,3',
        'result' => 'max:2000',
        'images' => 'array',
        'is_abnormal' => 'integer|in:0,1',
    ];

    protected $scene = [
        'create' => ['task_name', 'device_id', 'inspector_id', 'plan_time'],
        'update' => ['task_name', 'plan_time', 'status'],
        'execute' => ['result', 'images', 'is_abnormal'],
    ];

    protected $message = [
        'task_name.require' => '任务名称不能为空',
        'task_name.max' => '任务名称最多200个字符',
        'device_id.require' => '设备ID不能为空',
        'device_id.integer' => '设备ID格式错误',
        'inspector_id.require' => '巡检员ID不能为空',
        'inspector_id.integer' => '巡检员ID格式错误',
        'plan_time.require' => '计划日期不能为空',
        'plan_time.date' => '计划日期格式错误',
        'actual_time.date' => '实际日期格式错误',
        'status.integer' => '状态格式错误',
        'status.in' => '状态必须是0(待执行)、1(进行中)、2(已完成)或3(已逾期)',
        'result.max' => '巡检结果最多2000个字符',
        'images.array' => '照片格式错误',
        'is_abnormal.integer' => '异常标识格式错误',
        'is_abnormal.in' => '异常标识必须是0(正常)或1(异常)',
    ];

    /**
     * 自定义验证：检查计划日期不能早于今天
     */
    protected function checkPlanTime($value, $rule, $data = [])
    {
        if (!empty($value)) {
            $planTime = strtotime($value);
            $today = strtotime(date('Y-m-d'));

            // 创建时允许计划日期是今天或未来
            return $planTime >= $today;
        }
        return true;
    }
}
