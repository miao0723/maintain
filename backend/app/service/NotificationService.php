<?php

namespace app\service;

use app\model\Notification;
use app\model\WorkOrder;
use app\model\SparePart;

class NotificationService
{
    /**
     * 创建通知
     */
    public function create($userId, $type, $title, $content, $relatedType = null, $relatedId = null, $priority = Notification::PRIORITY_NORMAL, $extraData = [])
    {
        $notification = new Notification();
        $notification->user_id = $userId;
        $notification->type = $type;
        $notification->title = $title;
        $notification->content = $content;
        $notification->related_type = $relatedType;
        $notification->related_id = $relatedId;
        $notification->priority = $priority;
        $notification->is_read = 0;
        $notification->extra_data = $extraData;
        $notification->save();

        return $notification;
    }

    /**
     * 批量创建通知
     */
    public function createBatch($userIds, $type, $title, $content, $relatedType = null, $relatedId = null, $priority = Notification::PRIORITY_NORMAL, $extraData = [])
    {
        $notifications = [];
        foreach ($userIds as $userId) {
            $notifications[] = [
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'content' => $content,
                'related_type' => $relatedType,
                'related_id' => $relatedId,
                'priority' => $priority,
                'is_read' => 0,
                'extra_data' => $extraData,
                'created_at' => date('Y-m-d H:i:s'),
            ];
        }

        if (!empty($notifications)) {
            $notification = new Notification();
            $notification->saveAll($notifications);
        }

        return count($notifications);
    }

    /**
     * 获取用户通知列表
     */
    public function getUserNotifications($userId, $page = 1, $limit = 20, $filters = [])
    {
        $query = Notification::where('user_id', $userId);

        // 按已读状态筛选
        if (isset($filters['is_read']) && $filters['is_read'] !== '') {
            $query->where('is_read', $filters['is_read']);
        }

        // 按类型筛选
        if (isset($filters['type']) && !empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        // 按优先级筛选
        if (isset($filters['priority']) && !empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        // 排序：创建时间降序（最近到最远），id 作为稳定兜底
        $query->order('created_at', 'desc')
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
     * 获取未读通知数量
     */
    public function getUnreadCount($userId)
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', 0)
            ->count();
    }

    /**
     * 标记通知为已读
     */
    public function markAsRead($userId, $notificationId = null)
    {
        if ($notificationId) {
            $notification = Notification::where('id', $notificationId)
                ->where('user_id', $userId)
                ->find();
            if ($notification) {
                $notification->markAsRead();
                return true;
            }
            return false;
        } else {
            // 标记所有通知为已读
            Notification::where('user_id', $userId)
                ->where('is_read', 0)
                ->update([
                    'is_read' => 1,
                    'read_at' => date('Y-m-d H:i:s')
                ]);
            return true;
        }
    }

    /**
     * 删除通知
     */
    public function delete($userId, $notificationId)
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->find();

        if (!$notification) {
            throw new \Exception('通知不存在');
        }

        $notification->delete();
        return true;
    }

    /**
     * 清空已读通知
     */
    public function clearRead($userId)
    {
        Notification::where('user_id', $userId)
            ->where('is_read', 1)
            ->delete();
        return true;
    }

    /**
     * 工单指派通知
     */
    public function notifyWorkOrderAssigned($workOrderId)
    {
        $workOrder = WorkOrder::with(['device', 'reporter'])->find($workOrderId);
        if (!$workOrder || !$workOrder->assigned_to) {
            return false;
        }

        $title = '新的工单指派';
        $content = "您有一个新的工单：{$workOrder->order_no}，设备：{$workOrder->device->name}，故障：{$workOrder->fault_type}";

        return $this->create(
            $workOrder->assigned_to,
            Notification::TYPE_WORK_ORDER_ASSIGNED,
            $title,
            $content,
            'work_order',
            $workOrderId,
            $workOrder->priority,
            [
                'order_no' => $workOrder->order_no,
                'device_name' => $workOrder->device->name,
                'fault_type' => $workOrder->fault_type,
            ]
        );
    }

    /**
     * 工单接受通知
     */
    public function notifyWorkOrderAccepted($workOrderId)
    {
        $workOrder = WorkOrder::with(['assignedTo', 'reporter'])->find($workOrderId);
        if (!$workOrder || !$workOrder->reporter_id) {
            return false;
        }

        $title = '工单已被接受';
        $content = "工单 {$workOrder->order_no} 已被 {$workOrder->assignedTo->real_name} 接受，开始维修";

        return $this->create(
            $workOrder->reporter_id,
            Notification::TYPE_WORK_ORDER_ACCEPTED,
            $title,
            $content,
            'work_order',
            $workOrderId,
            Notification::PRIORITY_NORMAL,
            [
                'order_no' => $workOrder->order_no,
                'engineer_name' => $workOrder->assignedTo->real_name,
            ]
        );
    }

    /**
     * 工单完成通知
     */
    public function notifyWorkOrderCompleted($workOrderId)
    {
        $workOrder = WorkOrder::with(['assignedTo', 'reporter'])->find($workOrderId);
        if (!$workOrder || !$workOrder->reporter_id) {
            return false;
        }

        $title = '工单已完成';
        $content = "工单 {$workOrder->order_no} 已完成，请验收。总成本：{$workOrder->total_cost}元";

        return $this->create(
            $workOrder->reporter_id,
            Notification::TYPE_WORK_ORDER_COMPLETED,
            $title,
            $content,
            'work_order',
            $workOrderId,
            Notification::PRIORITY_HIGH,
            [
                'order_no' => $workOrder->order_no,
                'total_cost' => $workOrder->total_cost,
            ]
        );
    }

    /**
     * 工单验收通知
     */
    public function notifyWorkOrderVerified($workOrderId)
    {
        $workOrder = WorkOrder::with(['assignedTo', 'reporter'])->find($workOrderId);
        if (!$workOrder || !$workOrder->assigned_to) {
            return false;
        }

        $title = '工单已验收';
        $rating = $workOrder->reporter_rating ? "（评分：{$workOrder->reporter_rating}星）" : '';

        $content = "工单 {$workOrder->order_no} 已通过验收{$rating}";

        return $this->create(
            $workOrder->assigned_to,
            Notification::TYPE_WORK_ORDER_VERIFIED,
            $title,
            $content,
            'work_order',
            $workOrderId,
            Notification::PRIORITY_NORMAL,
            [
                'order_no' => $workOrder->order_no,
                'rating' => $workOrder->reporter_rating,
            ]
        );
    }

    /**
     * 库存预警通知
     */
    public function checkStockAlerts()
    {
        // 查找零库存配件
        $outOfStockParts = SparePart::where('stock_quantity', 0)
            ->where('status', SparePart::STATUS_ACTIVE)
            ->select();

        foreach ($outOfStockParts as $part) {
            // 通知管理员和采购人员
            $title = '零库存预警';
            $content = "配件【{$part->part_name}】({$part->part_code})库存为零，请及时采购！";

            $this->create(
                1, // 假设用户ID=1是管理员
                Notification::TYPE_STOCK_OUT,
                $title,
                $content,
                'spare_part',
                $part->id,
                Notification::PRIORITY_URGENT,
                [
                    'part_code' => $part->part_code,
                    'part_name' => $part->part_name,
                ]
            );
        }

        // 查找低库存配件
        $lowStockParts = SparePart::where('stock_quantity', '>', 0)
            ->where('stock_quantity', '<=', 'min_stock')
            ->where('status', SparePart::STATUS_ACTIVE)
            ->select();

        foreach ($lowStockParts as $part) {
            $title = '低库存预警';
            $content = "配件【{$part->part_name}】({$part->part_code})库存不足（当前：{$part->stock_quantity}，最低：{$part->min_stock}）";

            $this->create(
                1, // 假设用户ID=1是管理员
                Notification::TYPE_STOCK_LOW,
                $title,
                $content,
                'spare_part',
                $part->id,
                Notification::PRIORITY_HIGH,
                [
                    'part_code' => $part->part_code,
                    'part_name' => $part->part_name,
                    'stock_quantity' => $part->stock_quantity,
                    'min_stock' => $part->min_stock,
                ]
            );
        }

        return [
            'out_of_stock' => count($outOfStockParts),
            'low_stock' => count($lowStockParts),
        ];
    }

    /**
     * 保养到期提醒
     */
    public function checkMaintenanceDue()
    {
        // 这个方法可以通过定时任务调用
        // 检查即将到期的保养计划
        $today = date('Y-m-d');
        $tomorrow = date('Y-m-d', strtotime('+1 day'));

        // 查找明天需要执行的保养计划
        $plans = \app\model\MaintenancePlan::with(['device', 'executor'])
            ->where('status', 1)
            ->where('next_execute_time', $tomorrow)
            ->select();

        foreach ($plans as $plan) {
            if (!$plan->executor_id) {
                continue;
            }

            $title = '保养计划提醒';
            $content = "设备【{$plan->device->name}】的保养计划【{$plan->plan_name}】将于明天（{$tomorrow}）到期，请做好准备";

            $this->create(
                $plan->executor_id,
                Notification::TYPE_MAINTENANCE_DUE,
                $title,
                $content,
                'maintenance_plan',
                $plan->id,
                Notification::PRIORITY_HIGH,
                [
                    'plan_name' => $plan->plan_name,
                    'device_name' => $plan->device->name,
                    'execute_time' => $tomorrow,
                ]
            );
        }

        return count($plans);
    }

    /**
     * 获取通知统计
     */
    public function getStatistics($userId)
    {
        $total = Notification::where('user_id', $userId)->count();
        $unread = $this->getUnreadCount($userId);

        // 按类型统计
        $typeStats = Notification::where('user_id', $userId)
            ->field('type, COUNT(*) as count')
            ->group('type')
            ->select()
            ->map(function($item) {
                return [
                    'type' => $item->type,
                    'type_text' => $item->type_text,
                    'count' => $item->count,
                ];
            });

        return [
            'total' => $total,
            'unread' => $unread,
            'read' => $total - $unread,
            'type_stats' => $typeStats,
        ];
    }

    /**
     * 查找当天（或到期）且未发送的邮件提醒并发送
     * 可通过计划任务调用（cron 或 docker 容器中的定时任务）
     */
    public function sendDueReminders()
    {
        $today = date('Y-m-d');

        $reminders = \app\model\RepairReminder::where('status', 'pending')
            ->where('notify_method', 'email')
            ->where('remind_date', '<=', $today)
            ->select();

        $mailService = new MailService();
        $sentCount = 0;

        foreach ($reminders as $reminder) {
            try {
                // 收件人优先使用 toaddrs（.env），兼容历史字段时也尝试使用提醒记录的 toaddrs（如果数据库有该列）
                $to = $reminder->toaddrs ?? null;
                if (empty($to)) {
                    $to = env('toaddrs');
                }
                if (empty($to)) {
                    $to = env('fromaddrs');
                }
                if (empty($to)) {
                    continue;
                }

                $subject = '[维修提醒] ' . ($reminder->title ?: '提醒');
                $body = "<p>{$reminder->content}</p>";
                $body .= "<p>设备：{$reminder->machine_name}</p>";
                $body .= "<p>提醒时间：{$reminder->remind_date}</p>";

                $result = $mailService->send($to, $subject, $body);

                if ($result['success']) {
                    $reminder->status = 'sent';
                    $reminder->notify_content = $body;
                    $reminder->save();
                    $sentCount++;
                }
            } catch (\Exception $e) {
                // 记录异常但继续处理其他提醒
                	hink\facade\Log::error('发送提醒邮件失败: ' . $e->getMessage());
            }
        }

        return $sentCount;
    }
}
