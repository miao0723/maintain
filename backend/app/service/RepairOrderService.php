<?php

namespace app\service;

use app\common\DataHelper;
use app\model\RepairOrder;
use think\facade\Db;

class RepairOrderService
{
    /**
     * 获取订单列表（分页 + 筛选）
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = Db::connect('repair')->name('orders')->alias('o');

        // 按订单类型筛选
        if (isset($filters['order_type']) && !empty($filters['order_type'])) {
            $query->where('o.order_type', $filters['order_type']);
        }

        // 按状态筛选
        if (isset($filters['status']) && !empty($filters['status'])) {
            $query->where('o.status', $filters['status']);
        }

        // 按优先级筛选
        if (isset($filters['priority']) && !empty($filters['priority'])) {
            $query->where('o.priority', $filters['priority']);
        }

        // 按设备类型筛选
        if (isset($filters['device_type']) && !empty($filters['device_type'])) {
            $query->where('o.device_type', intval($filters['device_type']));
        }

        // 按服务方式筛选
        if (isset($filters['service_type']) && !empty($filters['service_type'])) {
            $query->where('o.service_type', $filters['service_type']);
        }

        // 订单编号搜索
        if (isset($filters['order_id']) && !empty($filters['order_id'])) {
            $query->where('o.order_id', 'like', '%' . $filters['order_id'] . '%');
        }

        // 用户 ID 搜索
        if (isset($filters['user_id']) && !empty($filters['user_id'])) {
            $query->where('o.user_id', $filters['user_id']);
        }

        // 设备型号搜索
        if (isset($filters['device_model']) && !empty($filters['device_model'])) {
            $query->where('o.device_model', 'like', '%' . $filters['device_model'] . '%');
        }

        // 问题描述搜索
        if (isset($filters['keyword']) && !empty($filters['keyword'])) {
            $keyword = $filters['keyword'];
            $query->where(function ($q) use ($keyword) {
                $q->whereLike('o.problem_description', '%' . $keyword . '%')
                  ->whereOr('o.custom_description', 'like', '%' . $keyword . '%')
                  ->whereOr('o.device_model', 'like', '%' . $keyword . '%')
                  ->whereOr('o.order_id', 'like', '%' . $keyword . '%');
            });
        }

        // 日期范围筛选
        if (isset($filters['date_start']) && !empty($filters['date_start'])) {
            $query->where('o.created_at', '>=', $filters['date_start'] . ' 00:00:00');
        }
        if (isset($filters['date_end']) && !empty($filters['date_end'])) {
            $query->where('o.created_at', '<=', $filters['date_end'] . ' 23:59:59');
        }

        // 按创建时间倒序
        $query->order('o.created_at', 'desc');

        $total = (clone $query)->count();
        $list = $query
            ->page($page, $limit)
            ->field('o.*')
            ->select()
            ->toArray();

        $list = $this->enrichOrderList($list);

        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    protected function enrichOrderList(array $orders): array
    {
        if (empty($orders)) {
            return [];
        }

        $userIds = [];
        $brandIds = [];
        $addressIds = [];
        $assignedUserIds = [];

        foreach ($orders as $order) {
            if (!empty($order['user_id'])) {
                $userIds[] = intval($order['user_id']);
            }
            if (!empty($order['brand_id'])) {
                $brandIds[] = intval($order['brand_id']);
            }
            if (!empty($order['address_id'])) {
                $addressIds[] = intval($order['address_id']);
            }
            if (!empty($order['assigned_to'])) {
                $assignedUserIds[] = intval($order['assigned_to']);
            }
        }

        $userIds = array_values(array_unique($userIds));
        $brandIds = array_values(array_unique($brandIds));
        $addressIds = array_values(array_unique($addressIds));
        $assignedUserIds = array_values(array_unique($assignedUserIds));

        $repairUserMap = [];
        if (!empty($userIds)) {
            $repairUsers = Db::connect('repair')
                ->name('users')
                ->whereIn('id', $userIds)
                ->field('id,nickname,real_name,phone,email')
                ->select()
                ->toArray();

            foreach ($repairUsers as $u) {
                $repairUserMap[intval($u['id'])] = $u;
            }
        }

        $brandMap = [];
        if (!empty($brandIds)) {
            $brands = Db::connect('repair')
                ->name('brands')
                ->whereIn('id', $brandIds)
                ->field('id,name')
                ->select()
                ->toArray();

            foreach ($brands as $b) {
                $brandMap[intval($b['id'])] = $b['name'];
            }
        }

        $addressMap = [];
        if (!empty($addressIds)) {
            $addresses = Db::connect('repair')
                ->name('user_addresses')
                ->whereIn('id', $addressIds)
                ->field('id,contact_name,contact_phone,province,city,district,detail_address')
                ->select()
                ->toArray();

            foreach ($addresses as $a) {
                $addressMap[intval($a['id'])] = $a;
            }
        }

        $assignedUserMap = [];
        if (!empty($assignedUserIds)) {
            $assignedUsers = Db::name('personnel')
                ->whereIn('id', $assignedUserIds)
                ->field('id,name,code,phone,email,position,status')
                ->select()
                ->toArray();

            foreach ($assignedUsers as $u) {
                $assignedUserMap[intval($u['id'])] = $u;
            }
        }

        foreach ($orders as &$order) {
            $images = $order['images'] ?? [];
            if (is_string($images) && $images !== '') {
                $decoded = json_decode($images, true);
                $images = is_array($decoded) ? $decoded : [];
            } elseif (!is_array($images)) {
                $images = [];
            }
            $order['images_list'] = DataHelper::fixMiniprogramImageUrl($images);

            $repairUser = $repairUserMap[intval($order['user_id'] ?? 0)] ?? null;
            $order['user_name'] = $repairUser['nickname'] ?? ($repairUser['real_name'] ?? null);
            $order['user_phone'] = $repairUser['phone'] ?? null;
            $order['user_email'] = $repairUser['email'] ?? null;

            $brandId = intval($order['brand_id'] ?? 0);
            $order['brand_name'] = $brandId ? ($brandMap[$brandId] ?? null) : null;

            $address = $addressMap[intval($order['address_id'] ?? 0)] ?? null;
            if ($address) {
                $order['contact_name'] = $address['contact_name'] ?? null;
                $order['contact_phone'] = $address['contact_phone'] ?? null;
                $order['address_text'] = ($address['province'] ?? '') . ($address['city'] ?? '') . ($address['district'] ?? '') . ($address['detail_address'] ?? '');
            } else {
                $order['contact_name'] = null;
                $order['contact_phone'] = null;
                $order['address_text'] = null;
            }

            $assignedUser = $assignedUserMap[intval($order['assigned_to'] ?? 0)] ?? null;
            $order['assigned_user_name'] = $assignedUser['name'] ?? null;
            $order['assigned_person_name'] = $assignedUser['name'] ?? null;
            $order['assigned_person_code'] = $assignedUser['code'] ?? null;
        }
        unset($order);

        return $orders;
    }

    /**
     * 获取订单详情
     */
    public function getDetail($id)
    {
        $order = Db::connect('repair')->name('orders')->where('id', intval($id))->find();
        if (!$order) {
            throw new \Exception('订单不存在');
        }

        $list = $this->enrichOrderList([$order]);
        return $list[0] ?? $order;
    }

    /**
     * 接单（分配维修人员）
     */
    public function acceptOrder($orderId, $userId)
    {
        $order = RepairOrder::find($orderId);

        if (!$order) {
            throw new \Exception('订单不存在');
        }

        if ($order['status'] !== RepairOrder::STATUS_PENDING) {
            throw new \Exception('该订单无法接单');
        }

        $order->assigned_to = $userId;
        $order->assigned_at = date('Y-m-d H:i:s');
        $order->status = RepairOrder::STATUS_PROCESSING;
        $order->save();

        $this->syncRepairProgressFromOrder($order->toArray());

        return $order->toArray();
    }

    /**
     * 更新订单状态
     */
    public function updateStatus($orderId, $status, $data = [])
    {
        $order = RepairOrder::find($orderId);

        if (!$order) {
            throw new \Exception('订单不存在');
        }

        $order->status = $status;

        if ($status === RepairOrder::STATUS_COMPLETED) {
            $order->completed_at = date('Y-m-d H:i:s');
        }

        // 更新实际价格
        if (isset($data['actual_price'])) {
            $order->actual_price = $data['actual_price'];
        }

        // 更新进度
        if (isset($data['progress'])) {
            $order->progress = intval($data['progress']);
        }

        $order->save();
        $this->syncRepairProgressFromOrder($order->toArray());

        // 自动同步收入统计：订单完成时立即将金额记入收入
        if ($status === RepairOrder::STATUS_COMPLETED) {
            try {
                $statsService = new \app\service\StatisticsService();
                $statsService->syncIncomeFromCompletedOrders($orderId);
            } catch (\Exception $e) {
                // 收入同步失败不影响订单更新
                trace('收入同步失败: ' . $e->getMessage(), 'error');
            }
        }

        return $order->toArray();
    }

    private function syncRepairProgressFromOrder(array $order): void
    {
        $orderId = intval($order['id'] ?? 0);
        if ($orderId <= 0) {
            return;
        }

        $stageName = '待接单';
        $stageCode = '待接单';
        $progressStatus = 'pending';
        $progressValue = intval($order['progress'] ?? 0);

        switch ($order['status'] ?? '') {
            case RepairOrder::STATUS_PROCESSING:
                $stageName = '维修实施';
                $stageCode = '维修实施';
                $progressStatus = 'in_progress';
                if ($progressValue <= 0) {
                    $progressValue = 10;
                }
                break;
            case RepairOrder::STATUS_REVIEW:
                $stageName = '测试验收';
                $stageCode = '测试验收';
                $progressStatus = 'in_progress';
                if ($progressValue < 90) {
                    $progressValue = 90;
                }
                break;
            case RepairOrder::STATUS_COMPLETED:
                $stageName = '维修完成';
                $stageCode = '维修完成';
                $progressStatus = 'completed';
                $progressValue = 100;
                break;
            case RepairOrder::STATUS_CANCELLED:
                return;
            default:
                if ($progressValue < 0) {
                    $progressValue = 0;
                }
                break;
        }

        $existing = Db::name('repair_progress')
            ->where('order_id', $orderId)
            ->where('remark', '系统同步')
            ->find();

        $payload = [
            'order_id' => $orderId,
            'stage' => $stageCode,
            'stage_name' => $stageName,
            'status' => $progressStatus,
            'progress' => $progressValue,
            'description' => $this->buildProgressDescription($order, $stageName),
            'handler_id' => !empty($order['assigned_to']) ? intval($order['assigned_to']) : null,
            'handler_name' => $this->resolveAssignedName($order),
            'start_time' => !empty($order['assigned_at']) ? $order['assigned_at'] : ($progressStatus !== 'pending' ? date('Y-m-d H:i:s') : null),
            'end_time' => $progressStatus === 'completed' ? ($order['completed_at'] ?? date('Y-m-d H:i:s')) : null,
            'remark' => '系统同步',
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        if ($existing) {
            Db::name('repair_progress')->where('id', $existing['id'])->update($payload);
            return;
        }

        $payload['created_at'] = date('Y-m-d H:i:s');
        Db::name('repair_progress')->insert($payload);
    }

    private function resolveAssignedName(array $order): string
    {
        $assignedTo = intval($order['assigned_to'] ?? 0);
        if ($assignedTo <= 0) {
            return '';
        }

        $person = Db::name('personnel')->where('id', $assignedTo)->field('name')->find();
        return $person['name'] ?? '';
    }

    private function buildProgressDescription(array $order, string $stageName): string
    {
        $deviceModel = trim((string) ($order['device_model'] ?? '设备'));
        $problem = trim((string) ($order['problem_description'] ?? ''));
        $desc = $deviceModel . '当前进入【' . $stageName . '】阶段';
        if ($problem !== '') {
            $desc .= '，故障：' . $problem;
        }
        return $desc;
    }

    /**
     * 获取待处理订单列表
     */
    public function getPendingList($page = 1, $limit = 20)
    {
        return $this->getList($page, $limit, ['status' => RepairOrder::STATUS_PENDING]);
    }

    /**
     * 获取维修中订单列表
     */
    public function getProcessingList($page = 1, $limit = 20)
    {
        return $this->getList($page, $limit, ['status' => RepairOrder::STATUS_PROCESSING]);
    }

    /**
     * 获取统计信息
     */
    public function getStatistics()
    {
        $total = RepairOrder::count();
        $pending = RepairOrder::where('status', RepairOrder::STATUS_PENDING)->count();
        $processing = RepairOrder::where('status', RepairOrder::STATUS_PROCESSING)->count();
        $completed = RepairOrder::where('status', RepairOrder::STATUS_COMPLETED)->count();

        return [
            'total' => $total,
            'pending' => $pending,
            'processing' => $processing,
            'completed' => $completed,
        ];
    }

    /**
     * 获取订单多维度分析数据
     */
    public function getAnalytics($filters = [])
    {
        $query = Db::connect('repair')->name('orders');

        // 日期范围筛选
        if (!empty($filters['date_start']) && !empty($filters['date_end'])) {
            $query->whereBetween('created_at', [$filters['date_start'], $filters['date_end']]);
        }

        // 状态分布
        $statusDistribution = (clone $query)->field('status, COUNT(*) as count')
            ->group('status')->select()->toArray();

        // 设备类型分布
        $deviceTypeDistribution = (clone $query)->field('device_type, COUNT(*) as count')
            ->group('device_type')->select()->toArray();

        // 服务方式分布
        $serviceTypeDistribution = (clone $query)->field('service_type, COUNT(*) as count')
            ->group('service_type')->select()->toArray();

        // 订单类型分布
        $orderTypeDistribution = (clone $query)->field('order_type, COUNT(*) as count')
            ->group('order_type')->select()->toArray();

        // 优先级分布
        $priorityDistribution = (clone $query)->field('priority, COUNT(*) as count')
            ->group('priority')->select()->toArray();

        // 每日趋势（最近30天）
        $dailyTrend = (clone $query)->field("DATE(created_at) as date, COUNT(*) as count")
            ->group('DATE(created_at)')
            ->order('date', 'asc')
            ->select()->toArray();

        // 品牌排行 Top10
        $topBrands = (clone $query)->alias('o')
            ->leftJoin('brands b', 'o.brand_id = b.id')
            ->field('COALESCE(b.name, "未知") as name, COUNT(*) as count')
            ->group('o.brand_id')
            ->order('count', 'desc')
            ->limit(10)
            ->select()->toArray();

        return [
            'status_distribution' => $statusDistribution,
            'device_type_distribution' => $deviceTypeDistribution,
            'service_type_distribution' => $serviceTypeDistribution,
            'order_type_distribution' => $orderTypeDistribution,
            'priority_distribution' => $priorityDistribution,
            'daily_trend' => $dailyTrend,
            'top_brands' => $topBrands,
        ];
    }
}
