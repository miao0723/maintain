<?php

namespace app\service;

use app\model\InspectionTask;
use app\model\Device;
use app\model\User;
use app\model\WorkOrder;
use think\facade\Db;

class InspectionTaskService
{
    /**
     * 获取巡检任务列表（分页+筛选）
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = InspectionTask::with(['device', 'inspector']);

        // 按状态筛选
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        // 按设备筛选
        if (isset($filters['device_id']) && !empty($filters['device_id'])) {
            $query->where('device_id', $filters['device_id']);
        }

        // 按巡检员筛选
        if (isset($filters['inspector_id']) && !empty($filters['inspector_id'])) {
            $query->where('inspector_id', $filters['inspector_id']);
        }

        // 按日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where('plan_time', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where('plan_time', '<=', $filters['end_date']);
        }

        // 搜索任务名称
        if (isset($filters['keyword']) && !empty($filters['keyword'])) {
            $keyword = $filters['keyword'];
            $query->whereLike('task_name', '%' . $keyword . '%');
        }

        // 排序：按计划时间降序，创建时间降序
        $query->order('plan_time', 'desc')
              ->order('id', 'desc');

        // 获取总数
        $total = $query->count();

        // 获取分页数据
        $list = $query->page($page, $limit)->select();

        // 检查并更新逾期状态
        foreach ($list as $task) {
            if ($task->isOverdue() && $task->status != InspectionTask::STATUS_OVERDUE) {
                $task->status = InspectionTask::STATUS_OVERDUE;
                $task->save();
            }
        }

        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取巡检任务详情
     */
    public function getDetail($id)
    {
        $task = InspectionTask::with(['device', 'inspector'])->find($id);

        if (!$task) {
            throw new \Exception('巡检任务不存在');
        }

        // 检查并更新逾期状态
        if ($task->isOverdue() && $task->status != InspectionTask::STATUS_OVERDUE) {
            $task->status = InspectionTask::STATUS_OVERDUE;
            $task->save();
        }

        return $task;
    }

    /**
     * 创建巡检任务
     */
    public function create($data)
    {
        // 检查设备是否存在
        $device = Device::find($data['device_id']);
        if (!$device) {
            throw new \Exception('设备不存在');
        }

        // 检查巡检员是否存在
        $inspector = User::find($data['inspector_id']);
        if (!$inspector) {
            throw new \Exception('巡检员不存在');
        }

        // 设置默认值
        $data['status'] = $data['status'] ?? InspectionTask::STATUS_PENDING;
        $data['is_abnormal'] = $data['is_abnormal'] ?? 0;

        // 显式指定允许的字段
        $allowedFields = [
            'task_name', 'device_id', 'inspector_id', 'plan_time', 'status', 'is_abnormal'
        ];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $task = new InspectionTask();
        $task->data($filteredData);
        $task->save();

        return $task->refresh();
    }

    /**
     * 更新巡检任务
     */
    public function update($id, $data)
    {
        $task = InspectionTask::find($id);
        if (!$task) {
            throw new \Exception('巡检任务不存在');
        }

        // 已完成的任务不能修改
        if ($task->status == InspectionTask::STATUS_COMPLETED) {
            throw new \Exception('已完成的任务不能修改');
        }

        // 显式指定允许的字段
        $allowedFields = ['task_name', 'plan_time', 'status'];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $task->data($filteredData);
        $task->save();

        return $task->refresh();
    }

    /**
     * 删除巡检任务
     */
    public function delete($id)
    {
        $task = InspectionTask::find($id);
        if (!$task) {
            throw new \Exception('巡检任务不存在');
        }

        // 已完成或进行中的任务不能删除
        if (in_array($task->status, [
            InspectionTask::STATUS_IN_PROGRESS,
            InspectionTask::STATUS_COMPLETED
        ])) {
            throw new \Exception('进行中或已完成的任务不能删除');
        }

        $task->delete();
        return true;
    }

    /**
     * 执行巡检任务
     */
    public function execute($id, $data, $inspectorId)
    {
        $task = InspectionTask::find($id);
        if (!$task) {
            throw new \Exception('巡检任务不存在');
        }

        // 检查是否是指派的巡检员
        if ($task->inspector_id != $inspectorId) {
            throw new \Exception('您不是该任务的巡检员');
        }

        // 检查是否可以执行
        if (!$task->canExecute()) {
            throw new \Exception('当前状态不允许执行');
        }

        // 显式指定允许的字段
        $allowedFields = ['result', 'images', 'is_abnormal'];
        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        Db::startTrans();
        try {
            // 更新任务状态
            $task->data($filteredData);
            $task->status = InspectionTask::STATUS_COMPLETED;
            $task->actual_time = date('Y-m-d');
            $task->save();

            // 如果发现异常，自动创建工单
            if ($task->is_abnormal == 1) {
                $this->createWorkOrderFromInspection($task);
            }

            Db::commit();
            return $task->refresh();
        } catch (\Exception $e) {
            Db::rollback();
            throw $e;
        }
    }

    /**
     * 获取我的巡检任务
     */
    public function getMyTasks($inspectorId, $page = 1, $limit = 20)
    {
        $query = InspectionTask::with(['device'])
            ->where('inspector_id', $inspectorId);

        // 只显示未完成的任务
        $query->where('status', '<>', InspectionTask::STATUS_COMPLETED);

        // 检查并更新逾期状态
        $tasks = $query->order('plan_time', 'asc')->page($page, $limit)->select();
        foreach ($tasks as $task) {
            if ($task->isOverdue() && $task->status != InspectionTask::STATUS_OVERDUE) {
                $task->status = InspectionTask::STATUS_OVERDUE;
                $task->save();
            }
        }

        $total = InspectionTask::where('inspector_id', $inspectorId)
            ->where('status', '<>', InspectionTask::STATUS_COMPLETED)
            ->count();

        return [
            'list' => $tasks,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取逾期任务列表
     */
    public function getOverdueTasks($page = 1, $limit = 20)
    {
        $today = date('Y-m-d');

        $query = InspectionTask::with(['device', 'inspector'])
            ->where('plan_time', '<', $today)
            ->where('status', '<>', InspectionTask::STATUS_COMPLETED);

        $list = $query->order('plan_time', 'asc')
                     ->page($page, $limit)
                     ->select();

        // 更新逾期状态
        foreach ($list as $task) {
            if ($task->status != InspectionTask::STATUS_OVERDUE) {
                $task->status = InspectionTask::STATUS_OVERDUE;
                $task->save();
            }
        }

        $total = InspectionTask::where('plan_time', '<', $today)
            ->where('status', '<>', InspectionTask::STATUS_COMPLETED)
            ->count();

        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取巡检统计数据
     */
    public function getStatistics($filters = [])
    {
        $query = InspectionTask::query();

        // 按日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where('plan_time', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where('plan_time', '<=', $filters['end_date']);
        }

        $baseQuery = (clone $query);

        return [
            'total' => $baseQuery->count(),
            'by_status' => [
                'pending' => (clone $query)->where('status', InspectionTask::STATUS_PENDING)->count(),
                'in_progress' => (clone $query)->where('status', InspectionTask::STATUS_IN_PROGRESS)->count(),
                'completed' => (clone $query)->where('status', InspectionTask::STATUS_COMPLETED)->count(),
                'overdue' => (clone $query)->where('status', InspectionTask::STATUS_OVERDUE)->count(),
            ],
            'abnormal_count' => (clone $query)->where('is_abnormal', 1)->count(),
        ];
    }

    /**
     * 从巡检异常创建工单
     */
    private function createWorkOrderFromInspection($task)
    {
        $workOrder = new WorkOrder();
        $workOrder->order_no = $this->generateWorkOrderNo();
        $workOrder->device_id = $task->device_id;
        $workOrder->reporter_id = $task->inspector_id;
        $workOrder->assigned_to = $task->inspector_id;
        $workOrder->fault_type = '巡检异常';
        $workOrder->fault_description = "巡检任务【{$task->task_name}】发现异常：\n{$task->result}";
        $workOrder->priority = WorkOrder::PRIORITY_MEDIUM;
        $workOrder->status = WorkOrder::STATUS_ASSIGNED;
        $workOrder->version = 1;
        $workOrder->save();

        // 创建工单日志
        $log = new WorkOrderLog();
        $log->order_id = $workOrder->id;
        $log->action = WorkOrderLog::ACTION_CREATED;
        $log->operator_id = $task->inspector_id;
        $log->remark = '巡检异常自动创建工单';
        $log->save();

        return $workOrder;
    }

    /**
     * 生成工单号
     */
    private function generateWorkOrderNo()
    {
        $date = date('Ymd');
        $prefix = "WO{$date}";

        $lastOrder = WorkOrder::whereLike('order_no', "{$prefix}%")
            ->order('id', 'desc')
            ->find();

        if ($lastOrder) {
            $lastSeq = intval(substr($lastOrder->order_no, -4));
            $seq = $lastSeq + 1;
        } else {
            $seq = 1;
        }

        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}
