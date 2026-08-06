<?php

namespace app\validate;

use think\Validate;

class ScheduleValidate extends Validate
{
    protected $rule = [
        'engineer_id' => 'require|integer',
        'work_date' => 'require|date',
        'shift_type' => 'require|in:morning,afternoon,night',
        'status' => 'integer|in:1,2',
    ];

    protected $scene = [
        'create' => ['engineer_id', 'work_date', 'shift_type'],
        'update' => ['work_date', 'shift_type', 'status'],
    ];

    protected $message = [
        'engineer_id.require' => '工程师ID不能为空',
        'engineer_id.integer' => '工程师ID格式错误',
        'work_date.require' => '工作日期不能为空',
        'work_date.date' => '工作日期格式错误',
        'shift_type.require' => '班次类型不能为空',
        'shift_type.in' => '班次类型必须是morning、afternoon或night',
        'status.integer' => '状态格式错误',
        'status.in' => '状态必须是1(正常)或2(请假)',
    ];

    /**
     * 自定义验证：检查该工程师在该日期是否已有排班
     */
    protected function checkDuplicate($value, $rule, $data = [])
    {
        if (isset($data['engineer_id']) && isset($data['work_date'])) {
            $schedule = \app\model\Schedule::where('engineer_id', $data['engineer_id'])
                ->where('work_date', $data['work_date'])
                ->find();

            // 如果是更新，排除当前记录
            if (isset($data['id']) && $schedule && $schedule->id == $data['id']) {
                return true;
            }

            return !$schedule;
        }
        return true;
    }
}
