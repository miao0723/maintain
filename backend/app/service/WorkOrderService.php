<?php

namespace app\service;

use app\model\WorkOrder;
use app\model\WorkOrderLog;
use app\model\Device;
use app\model\User;
use think\facade\Db;

class WorkOrderService
{
    /**
     * 获取工单列表（分页 + 筛选）
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = WorkOrder::with(['device', 'reporter', 'assignedTo']);

        // 按状态筛选
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', intval($filters['status']));
        }

        // 按优先级筛选
        if (isset($filters['priority']) && $filters['priority'] !== '') {
            $query->where('priority', intval($filters['priority']));
        }

        // 按设备筛选
        if (isset($filters['device_id']) && !empty($filters['device_id'])) {
            $query->where('device_id', $filters['device_id']);
        }

        // 按指派人员筛选
        if (isset($filters['assigned_to']) && !empty($filters['assigned_to'])) {
            $query->where('assigned_to', $filters['assigned_to']);
        }

        // 按报修人筛选
        if (isset($filters['reporter_id']) && !empty($filters['reporter_id'])) {
            $query->where('reporter_id', $filters['reporter_id']);
        }

        // 按日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date'] . ' 23:59:59');
        }

        // 搜索工单号
        if (isset($filters['keyword']) && !empty($filters['keyword'])) {
            $keyword = $filters['keyword'];
            $query->where(function ($q) use ($keyword) {
                $q->whereLike('order_no', '%' . $keyword . '%')
                    ->whereOr('fault_description', 'like', '%' . $keyword . '%');
            });
        }

        // 排序：按优先级降序，创建时间降序
        $query->order('priority', 'desc')
            ->order('created_at', 'desc');

        $list = $query->page($page, $limit)->select();
        $total = $query->count();

        return [
            'list' => $list->toArray(),
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取工单详情
     */
    public function getDetail($id)
    {
        $order = WorkOrder::with(['device', 'reporter', 'assignedTo', 'logs' => function($query) {
            $query->with(['operator'])->order('created_at', 'desc');
        }])->find($id);

        if (!$order) {
            throw new \Exception('工单不存在');
        }

        return $order->toArray();
    }

    /**
     * 创建工单
     */
    public function create($data)
    {
        // 验证数据
        $orderNo = $this->generateOrderNo();

        $data['order_no'] = $data['order_no'] ?? $orderNo;
        $data['status'] = $data['status'] ?? WorkOrder::STATUS_PENDING;
        $data['reporter_id'] = $data['reporter_id'] ?? 1;

        $order = new WorkOrder();
        $order->data($data);
        $order->save();

        return $this->getDetail($order->id);
    }

    /**
     * 更新工单
     */
    public function update($id, $data)
    {
        $order = WorkOrder::find($id);
        if (!$order) {
            throw new \Exception('工单不存在');
        }

        $allowedFields = [
            'device_id', 'fault_type', 'fault_description',
            'priority', 'status', 'assigned_to'
        ];
        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $order->data($filteredData);
        $order->save();

        return $this->getDetail($order->id);
    }

    /**
     * 删除工单
     */
    public function delete($id)
    {
        $order = WorkOrder::find($id);
        if (!$order) {
            throw new \Exception('工单不存在');
        }

        $order->delete();
        return true;
    }

    /**
     * 指派工单
     */
    public function assign($id, $assignedTo, $operatorId)
    {
        $order = WorkOrder::find($id);
        if (!$order) {
            throw new \Exception('工单不存在');
        }

        if ($order->status != WorkOrder::STATUS_PENDING) {
            throw new \Exception('只有待派单状态的工单才能指派');
        }

        $order->assigned_to = $assignedTo;
        $order->status = WorkOrder::STATUS_ASSIGNED;
        $order->save();

        $engineer = User::find($assignedTo);

        // 记录日志
        WorkOrderLog::create([
            'order_id' => $id,
            'action' => 'assign',
            'operator_id' => $operatorId,
            'description' => '指派工单给 ' . ($engineer ? $engineer->real_name : ('ID:' . $assignedTo))
        ]);

        return $this->getDetail($id);
    }

    /**
     * 接单
     */
    public function accept($id, $engineerId)
    {
        $order = WorkOrder::find($id);
        if (!$order) {
            throw new \Exception('工单不存在');
        }

        if ($order->status != WorkOrder::STATUS_ASSIGNED) {
            throw new \Exception('只有已派单状态的工单才能接单');
        }

        if ($order->assigned_to != $engineerId) {
            throw new \Exception('这不是指派给你的工单');
        }

        $order->status = WorkOrder::STATUS_IN_PROGRESS;
        $order->save();

        // 记录日志
        WorkOrderLog::create([
            'order_id' => $id,
            'action' => 'accept',
            'operator_id' => $engineerId,
            'description' => '工程师接单'
        ]);

        return $this->getDetail($id);
    }

    /**
     * 开始维修
     */
    public function start($id, $engineerId)
    {
        $order = WorkOrder::find($id);
        if (!$order) {
            throw new \Exception('工单不存在');
        }

        $order->status = WorkOrder::STATUS_IN_PROGRESS;
        $order->save();

        // 记录日志
        WorkOrderLog::create([
            'order_id' => $id,
            'action' => 'start',
            'operator_id' => $engineerId,
            'description' => '开始维修'
        ]);

        return $this->getDetail($id);
    }

    /**
     * 完成维修
     */
    public function complete($id, $data, $engineerId)
    {
        $order = WorkOrder::find($id);
        if (!$order) {
            throw new \Exception('工单不存在');
        }

        $order->status = WorkOrder::STATUS_PENDING_VERIFY;
        $order->repair_result = $data['repair_result'] ?? '';
        $order->repair_notes = $data['repair_notes'] ?? '';
        $order->save();

        // 记录日志
        WorkOrderLog::create([
            'order_id' => $id,
            'action' => 'complete',
            'operator_id' => $engineerId,
            'description' => '维修完成，待验收'
        ]);

        return $this->getDetail($id);
    }

    /**
     * 验收工单
     */
    public function verify($id, $data, $verifierId)
    {
        $order = WorkOrder::find($id);
        if (!$order) {
            throw new \Exception('工单不存在');
        }

        if ($order->status != WorkOrder::STATUS_PENDING_VERIFY) {
            throw new \Exception('只有待验收状态的工单才能验收');
        }

        $order->status = WorkOrder::STATUS_COMPLETED;
        $order->verify_notes = $data['verify_notes'] ?? '';
        $order->save();

        // 记录日志
        WorkOrderLog::create([
            'order_id' => $id,
            'action' => 'verify',
            'operator_id' => $verifierId,
            'description' => '验收通过'
        ]);

        return $this->getDetail($id);
    }

    /**
     * 关闭工单
     */
    public function close($id, $operatorId)
    {
        $order = WorkOrder::find($id);
        if (!$order) {
            throw new \Exception('工单不存在');
        }

        $order->status = WorkOrder::STATUS_CLOSED;
        $order->save();

        // 记录日志
        WorkOrderLog::create([
            'order_id' => $id,
            'action' => 'close',
            'operator_id' => $operatorId,
            'description' => '关闭工单'
        ]);

        return $this->getDetail($id);
    }

    /**
     * 获取我的工单
     */
    public function getMyWorkOrders($engineerId, $page = 1, $limit = 20, $filters = [])
    {
        $query = WorkOrder::with(['device', 'reporter'])
            ->where(function($q) use ($engineerId) {
                $q->where('assigned_to', $engineerId)
                  ->whereOr('reporter_id', $engineerId);
            });

        // 按状态筛选
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', intval($filters['status']));
        }

        $query->order('created_at', 'desc');

        $list = $query->page($page, $limit)->select();
        $total = $query->count();

        return [
            'list' => $list->toArray(),
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取工单统计数据
     */
    public function getStatistics($filters = [])
    {
        $query = WorkOrder::query();

        // 按日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date'] . ' 23:59:59');
        }

        // 获取总数
        $total = $query->count();

        // 按状态统计
        $byStatus = [];
        $statusCounts = (clone $query)->field('status, COUNT(*) as count')
            ->group('status')
            ->select();
        foreach ($statusCounts as $item) {
            $byStatus[$item['status']] = intval($item['count']);
        }

        // 按优先级统计
        $byPriority = [];
        $priorityCounts = (clone $query)->field('priority, COUNT(*) as count')
            ->group('priority')
            ->select();
        foreach ($priorityCounts as $item) {
            $byPriority[$item['priority']] = intval($item['count']);
        }

        return [
            'total_orders' => $total,
            'pending_orders' => $byStatus[WorkOrder::STATUS_PENDING] ?? 0,
            'completed_orders' => $byStatus[WorkOrder::STATUS_COMPLETED] ?? 0,
            'in_progress_orders' => $byStatus[WorkOrder::STATUS_IN_PROGRESS] ?? 0,
            'by_status' => $byStatus,
            'by_priority' => $byPriority,
        ];
    }

    /**
     * 生成工单号 WO+YYYYMMDD+4 位序号
     */
    private function generateOrderNo()
    {
        $date = date('Ymd');
        $prefix = "WO{$date}";

        // 获取当天最后一个工单号
        $lastOrder = WorkOrder::whereLike('order_no', "{$prefix}%")
            ->order('id', 'desc')
            ->find();

        if ($lastOrder) {
            $serial = intval(substr($lastOrder->order_no, -4)) + 1;
        } else {
            $serial = 1;
        }

        return "{$prefix}" . str_pad($serial, 4, '0', STR_PAD_LEFT);
    }
}
