<?php

namespace app\service;

use app\model\MaintenancePlan;
use app\model\MaintenanceRecord;
use app\model\Device;
use app\model\User;
use think\facade\Db;

class MaintenancePlanService
{
    /**
     * 获取保养计划列表（分页+筛选）
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = MaintenancePlan::with(['device', 'executor']);

        // 按类型筛选
        if (isset($filters['type']) && $filters['type'] !== '') {
            $query->where('type', $filters['type']);
        }

        // 按状态筛选
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        // 按设备筛选
        if (isset($filters['device_id']) && !empty($filters['device_id'])) {
            $query->where('device_id', $filters['device_id']);
        }

        // 按执行人筛选
        if (isset($filters['executor_id']) && !empty($filters['executor_id'])) {
            $query->where('executor_id', $filters['executor_id']);
        }

        // 搜索计划名称
        if (isset($filters['keyword']) && !empty($filters['keyword'])) {
            $keyword = $filters['keyword'];
            $query->whereLike('plan_name', '%' . $keyword . '%');
        }

        // 排序：按下次执行时间升序，创建时间降序
        $query->order('next_execute_time', 'asc')
              ->order('id', 'desc');

        $list = $query->page($page, $limit)->select();
        $total = $query->count();

        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取保养计划详情
     */
    public function getDetail($id)
    {
        $plan = MaintenancePlan::with(['device', 'executor', 'records' => function($query) {
            $query->order('execute_time', 'desc')->limit(10);
        }])->find($id);

        if (!$plan) {
            throw new \Exception('保养计划不存在');
        }

        return $plan;
    }

    /**
     * 创建保养计划
     */
    public function create($data)
    {
        // 检查设备是否存在
        $device = Device::find($data['device_id']);
        if (!$device) {
            throw new \Exception('设备不存在');
        }

        // 检查执行人是否存在
        $executor = User::find($data['executor_id']);
        if (!$executor) {
            throw new \Exception('执行人不存在');
        }

        // 设置默认值
        $data['type'] = $data['type'] ?? MaintenancePlan::TYPE_PREVENTIVE;
        $data['status'] = $data['status'] ?? MaintenancePlan::STATUS_ACTIVE;

        // 显式指定允许的字段
        $allowedFields = [
            'plan_name', 'device_id', 'type', 'cycle_type', 'cycle_value',
            'next_execute_time', 'executor_id', 'status', 'description'
        ];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $plan = new MaintenancePlan();
        $plan->data($filteredData);
        $plan->save();

        return $plan->refresh();
    }

    /**
     * 更新保养计划
     */
    public function update($id, $data)
    {
        $plan = MaintenancePlan::find($id);
        if (!$plan) {
            throw new \Exception('保养计划不存在');
        }

        // 显式指定允许的字段
        $allowedFields = [
            'plan_name', 'type', 'cycle_type', 'cycle_value', 'status', 'description'
        ];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $plan->data($filteredData);
        $plan->save();

        return $plan->refresh();
    }

    /**
     * 删除保养计划
     */
    public function delete($id)
    {
        $plan = MaintenancePlan::find($id);
        if (!$plan) {
            throw new \Exception('保养计划不存在');
        }

        // 检查是否有保养记录
        $recordCount = MaintenanceRecord::where('plan_id', $id)->count();
        if ($recordCount > 0) {
            throw new \Exception('该计划已有保养记录，无法删除');
        }

        $plan->delete();
        return true;
    }

    /**
     * 执行保养
     */
    public function execute($id, $data, $executorId)
    {
        $plan = MaintenancePlan::find($id);
        if (!$plan) {
            throw new \Exception('保养计划不存在');
        }

        // 检查是否是指派的执行人
        if ($plan->executor_id != $executorId) {
            throw new \Exception('您不是该计划的执行人');
        }

        // 检查计划是否启用
        if ($plan->status != MaintenancePlan::STATUS_ACTIVE) {
            throw new \Exception('计划已停用，无法执行');
        }

        // 显式指定允许的字段
        $allowedFields = ['content', 'images', 'cost'];
        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        // 设置默认费用
        $filteredData['cost'] = $filteredData['cost'] ?? 0;

        Db::startTrans();
        try {
            // 创建保养记录
            $record = new MaintenanceRecord();
            $record->plan_id = $id;
            $record->device_id = $plan->device_id;
            $record->executor_id = $executorId;
            $record->execute_time = date('Y-m-d');
            $record->data($filteredData);
            $record->save();

            // 更新计划的下次执行时间
            $plan->updateNextExecuteTime();

            Db::commit();
            return $record->refresh();
        } catch (\Exception $e) {
            Db::rollback();
            throw $e;
        }
    }

    /**
     * 获取保养历史
     */
    public function getHistory($page = 1, $limit = 20, $filters = [])
    {
        $query = MaintenanceRecord::with(['plan', 'device', 'executor']);

        // 按计划筛选
        if (isset($filters['plan_id']) && !empty($filters['plan_id'])) {
            $query->where('plan_id', $filters['plan_id']);
        }

        // 按设备筛选
        if (isset($filters['device_id']) && !empty($filters['device_id'])) {
            $query->where('device_id', $filters['device_id']);
        }

        // 按执行人筛选
        if (isset($filters['executor_id']) && !empty($filters['executor_id'])) {
            $query->where('executor_id', $filters['executor_id']);
        }

        // 按日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where('execute_time', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where('execute_time', '<=', $filters['end_date']);
        }

        // 排序：按执行时间降序
        $query->order('execute_time', 'desc');

        $list = $query->page($page, $limit)->select();
        $total = $query->count();

        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取待执行保养列表
     */
    public function getDuePlans($page = 1, $limit = 20)
    {
        $today = date('Y-m-d');

        $query = MaintenancePlan::with(['device', 'executor'])
            ->where('status', MaintenancePlan::STATUS_ACTIVE)
            ->where('next_execute_time', '<=', $today);

        $list = $query->order('next_execute_time', 'asc')
                     ->page($page, $limit)
                     ->select();

        // 标记是否逾期
        foreach ($list as $plan) {
            $plan->is_overdue = $plan->next_execute_time < $today;
            $plan->days_overdue = $today > $plan->next_execute_time
                ? (strtotime($today) - strtotime($plan->next_execute_time)) / 86400
                : 0;
        }

        $total = MaintenancePlan::where('status', MaintenancePlan::STATUS_ACTIVE)
            ->where('next_execute_time', '<=', $today)
            ->count();

        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取保养统计数据
     */
    public function getStatistics($filters = [])
    {
        $planQuery = MaintenancePlan::where('id', '>', 0);
        $recordQuery = MaintenanceRecord::where('id', '>', 0);

        // 按日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $recordQuery->where('execute_time', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $recordQuery->where('execute_time', '<=', $filters['end_date']);
        }

        return [
            'total_plans' => $planQuery->count(),
            'active_plans' => MaintenancePlan::where('status', MaintenancePlan::STATUS_ACTIVE)->count(),
            'due_soon' => MaintenancePlan::where('status', MaintenancePlan::STATUS_ACTIVE)
                ->where('next_execute_time', '<=', date('Y-m-d', strtotime('+7 days')))
                ->count(),
            'total_records' => $recordQuery->count(),
            'total_cost' => $recordQuery->sum('cost'),
        ];
    }
}
