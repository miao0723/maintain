<?php

namespace app\controller;

use app\common\DataHelper;
use app\common\Result;
use app\model\Notification;
use app\service\NotificationService;
use think\facade\Db;

class MiniAdminOrderController extends MiniAdminBaseController
{
    /**
     * 广播订单相关通知给所有后台(CMMS)用户
     */
    private function notifyOrderEvent($title, $content, $orderId = null, $type = 'order')
    {
        try {
            $user = $this->getMiniAdminUser();
            $operator = $user['real_name'] ?? $user['username'] ?? '小程序后台';
            $content = "{$operator} {$content}";

            $userIds = Db::name('users')->column('id');
            if (empty($userIds)) {
                return;
            }

            $service = new NotificationService();
            $service->createBatch(
                $userIds,
                $type,
                $title,
                $content,
                'repair-orders',
                $orderId,
                Notification::PRIORITY_HIGH,
                ['operator' => $operator, 'order_id' => $orderId]
            );
        } catch (\Throwable $e) {
            // 通知失败不影响主流程
        }
    }

    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);

        $query = Db::connect('repair')->name('orders');
        $this->applyOrderFilters($query);

        $total = (clone $query)->count();
        $orders = $query->order('id', 'desc')->page($page, $pageSize)->select()->toArray();

        return Result::success([
            'items' => $this->hydrateOrders($orders),
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
        ]);
    }

    public function read($id)
    {
        $order = Db::connect('repair')->name('orders')->where('id', (int) $id)->find();
        if (!$order) {
            return Result::error('订单不存在', 404);
        }

        $items = $this->hydrateOrders([$order]);
        $detail = $items[0] ?? $order;

        $detail['progress_photos'] = Db::connect('repair')->name('order_progress_photos')
            ->where('order_id', (int) $id)
            ->order('id', 'desc')
            ->select()
            ->toArray();
        $detail['progress_videos'] = Db::connect('repair')->name('order_progress_videos')
            ->where('order_id', (int) $id)
            ->order('id', 'desc')
            ->select()
            ->toArray();

        return Result::success($detail);
    }

    public function save()
    {
        $data = $this->getRequestData();
        $userId = (int) ($data['user_id'] ?? 0);
        $addressId = (int) ($data['address_id'] ?? 0);
        $orderType = trim((string) ($data['order_type'] ?? 'repair'));
        $deviceType = (int) ($data['device_type'] ?? 0);
        $problemDescription = trim((string) ($data['problem_description'] ?? ''));

        if ($userId <= 0 || $deviceType <= 0 || $problemDescription === '') {
            return Result::error('用户、设备类型、故障描述不能为空', 422);
        }

        $insertData = [
            'order_id' => $this->generateOrderNo(),
            'user_id' => $userId,
            'address_id' => $addressId > 0 ? $addressId : null,
            'order_type' => $orderType,
            'device_type' => $deviceType,
            'device_model' => trim((string) ($data['device_model'] ?? '')),
            'brand_name' => trim((string) ($data['brand_name'] ?? '')),
            'problem_description' => $problemDescription,
            'custom_description' => trim((string) ($data['custom_description'] ?? '')),
            'service_type' => trim((string) ($data['service_type'] ?? 'shop')),
            'estimated_price' => (float) ($data['estimated_price'] ?? 0),
            'actual_price' => (float) ($data['actual_price'] ?? 0),
            'status' => trim((string) ($data['status'] ?? 'pending')),
            'progress' => (int) ($data['progress'] ?? 0),
            'priority' => trim((string) ($data['priority'] ?? 'medium')),
            'assigned_to' => !empty($data['assigned_to']) ? (int) $data['assigned_to'] : null,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        if (!empty($data['images']) && is_array($data['images'])) {
            $insertData['images'] = json_encode(array_values($data['images']), JSON_UNESCAPED_UNICODE);
        }

        $id = Db::connect('repair')->name('orders')->insertGetId($insertData);

        // 同步设备明细到 order_devices（cmms_db）：新订单自动生成设备记录
        $this->syncOrderDevice($id, $data, $insertData);

        // 广播通知：后台用户收到新维修订单
        $this->notifyOrderEvent(
            '新的维修订单',
            "提交了新维修订单（订单号：{$insertData['order_id']}）",
            $id
        );

        return Result::success(['id' => $id, 'order_id' => $insertData['order_id']], '创建成功', 201);
    }

    public function update($id)
    {
        $data = $this->getRequestData();
        $order = Db::connect('repair')->name('orders')->where('id', (int) $id)->find();
        if (!$order) {
            return Result::error('订单不存在', 404);
        }

        $updateData = [];
        $allowedFields = [
            'address_id', 'order_type', 'device_type', 'device_model', 'brand_name',
            'problem_description', 'custom_description', 'service_type', 'estimated_price',
            'actual_price', 'status', 'progress', 'priority', 'assigned_to'
        ];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }
        if (array_key_exists('images', $data) && is_array($data['images'])) {
            $updateData['images'] = json_encode(array_values($data['images']), JSON_UNESCAPED_UNICODE);
        }

        if (empty($updateData)) {
            return Result::success(null, '无变更');
        }

        if (isset($updateData['progress']) && (int) $updateData['progress'] >= 100) {
            $updateData['status'] = 'completed';
            $updateData['completed_at'] = date('Y-m-d H:i:s');
        }
        $updateData['updated_at'] = date('Y-m-d H:i:s');

        Db::connect('repair')->name('orders')->where('id', (int) $id)->update($updateData);

        // 若本次请求带了设备字段，则同步更新 order_devices 设备明细
        $deviceFieldKeys = ['device_name', 'serial_no', 'device_source', 'device_quantity', 'device_unit', 'device_remarks', 'device_status'];
        if (!empty(array_intersect($deviceFieldKeys, array_keys($data)))) {
            $this->syncOrderDevice((int) $id, $data, $order);
        }

        // 广播通知：订单信息变更
        $this->notifyOrderEvent(
            '维修订单变更',
            "更新了维修订单（订单号：{$order['order_id']}）",
            (int) $id
        );

        return Result::success(null, '更新成功');
    }

    public function delete($id)
    {
        $order = Db::connect('repair')->name('orders')->where('id', (int) $id)->find();
        if (!$order) {
            return Result::error('订单不存在', 404);
        }

        Db::connect('repair')->transaction(function () use ($id) {
            Db::connect('repair')->name('order_progress_photos')->where('order_id', (int) $id)->delete();
            Db::connect('repair')->name('order_progress_videos')->where('order_id', (int) $id)->delete();
            Db::connect('repair')->name('orders')->where('id', (int) $id)->delete();
        });

        return Result::success(null, '删除成功');
    }

    private function applyOrderFilters($query): void
    {
        $filters = [
            'order_id' => 'order_id',
            'order_no' => 'order_id',
            'device_model' => 'device_model',
            'status' => 'status',
            'service_type' => 'service_type',
            'order_type' => 'order_type',
            'priority' => 'priority',
        ];

        foreach ($filters as $param => $field) {
            $value = trim((string) request()->get($param, ''));
            if ($value === '') {
                continue;
            }

            if (in_array($param, ['order_id', 'order_no', 'device_model'], true)) {
                $query->whereLike($field, '%' . $value . '%');
            } else {
                $query->where($field, $value);
            }
        }

        $phone = trim((string) request()->get('phone', ''));
        if ($phone !== '') {
            $userIds = Db::connect('repair')->name('users')->whereLike('phone', '%' . $phone . '%')->column('id');
            if (empty($userIds)) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn('user_id', $userIds);
            }
        }

        $keyword = trim((string) request()->get('keyword', ''));
        if ($keyword !== '') {
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery->whereLike('order_id', '%' . $keyword . '%')
                    ->whereOrLike('device_model', '%' . $keyword . '%')
                    ->whereOrLike('problem_description', '%' . $keyword . '%')
                    ->whereOrLike('custom_description', '%' . $keyword . '%');
            });
        }

        $deviceType = request()->get('device_type', '');
        if ($deviceType !== '' && $deviceType !== null) {
            $query->where('device_type', (int) $deviceType);
        }

        $dateStart = trim((string) request()->get('date_start', ''));
        $dateEnd = trim((string) request()->get('date_end', ''));
        if ($dateStart !== '') {
            $query->where('created_at', '>=', $dateStart);
        }
        if ($dateEnd !== '') {
            $query->where('created_at', '<=', $dateEnd . ' 23:59:59');
        }
    }

    private function hydrateOrders(array $orders): array
    {
        if (empty($orders)) {
            return [];
        }

        $userIds = array_values(array_unique(array_filter(array_column($orders, 'user_id'))));
        $addressIds = array_values(array_unique(array_filter(array_column($orders, 'address_id'))));
        $assignedIds = array_values(array_unique(array_filter(array_column($orders, 'assigned_to'))));
        $orderIds = array_column($orders, 'id');

        $userMap = [];
        if (!empty($userIds)) {
            foreach (Db::connect('repair')->name('users')->whereIn('id', $userIds)->field('id,nickname,real_name,phone,role')->select()->toArray() as $item) {
                $userMap[$item['id']] = $item;
            }
        }

        $addressMap = [];
        if (!empty($addressIds)) {
            foreach (Db::connect('repair')->name('user_addresses')->whereIn('id', $addressIds)->select()->toArray() as $item) {
                $addressMap[$item['id']] = $item;
            }
        }

        $assignedMap = [];
        if (!empty($assignedIds)) {
            foreach (Db::connect('repair')->name('users')->whereIn('id', $assignedIds)->field('id,nickname,real_name,phone')->select()->toArray() as $item) {
                $assignedMap[$item['id']] = $item;
            }
        }

        $photoCounts = [];
        foreach (Db::connect('repair')->name('order_progress_photos')->whereIn('order_id', $orderIds)->field('order_id,COUNT(*) as count')->group('order_id')->select()->toArray() as $item) {
            $photoCounts[$item['order_id']] = (int) $item['count'];
        }

        $videoCounts = [];
        foreach (Db::connect('repair')->name('order_progress_videos')->whereIn('order_id', $orderIds)->field('order_id,COUNT(*) as count')->group('order_id')->select()->toArray() as $item) {
            $videoCounts[$item['order_id']] = (int) $item['count'];
        }

        $items = [];
        foreach ($orders as $order) {
            $user = $userMap[$order['user_id']] ?? [];
            $assigned = $assignedMap[$order['assigned_to']] ?? [];
            $address = $addressMap[$order['address_id']] ?? [];

            $items[] = [
                'id' => (int) $order['id'],
                'order_id' => $order['order_id'],
                'user_id' => (int) ($order['user_id'] ?? 0),
                'user_name' => $user['real_name'] ?? ($user['nickname'] ?? ''),
                'user_phone' => $user['phone'] ?? '',
                'user_role' => $user['role'] ?? '',
                'address_id' => $order['address_id'] ?? null,
                'address_text' => $this->buildAddressText($address),
                'order_type' => $order['order_type'] ?? 'repair',
                'device_type' => (int) ($order['device_type'] ?? 0),
                'device_model' => $order['device_model'] ?? '',
                'brand_name' => $order['brand_name'] ?? '',
                'problem_description' => $order['problem_description'] ?? '',
                'custom_description' => $order['custom_description'] ?? '',
                'service_type' => $order['service_type'] ?? '',
                'estimated_price' => (float) ($order['estimated_price'] ?? 0),
                'actual_price' => (float) ($order['actual_price'] ?? 0),
                'status' => $order['status'] ?? 'pending',
                'progress' => (int) ($order['progress'] ?? 0),
                'priority' => $order['priority'] ?? 'medium',
                'assigned_to' => $order['assigned_to'] ?? null,
                'assigned_user_name' => $assigned['real_name'] ?? ($assigned['nickname'] ?? ''),
                'images' => DataHelper::fixOrderFaultImages($order),
                'photo_count' => $photoCounts[$order['id']] ?? 0,
                'video_count' => $videoCounts[$order['id']] ?? 0,
                'created_at' => $order['created_at'] ?? '',
                'updated_at' => $order['updated_at'] ?? '',
                'completed_at' => $order['completed_at'] ?? '',
            ];
        }

        return $items;
    }

    private function buildAddressText(array $address): string
    {
        if (empty($address)) {
            return '';
        }

        $parts = [
            trim((string) ($address['province'] ?? '')),
            trim((string) ($address['city'] ?? '')),
            trim((string) ($address['district'] ?? '')),
            trim((string) ($address['detail_address'] ?? '')),
        ];

        return trim(implode(' ', array_filter($parts)));
    }

    /**
     * 订单 ↔ 设备明细同步（order_devices，cmms_db）
     *
     * 创建订单时自动生成一条设备明细；更新时若有设备字段则覆盖。
     * 设备字段（均可选，缺省按订单已有信息兜底）：
     *   device_name   设备名称（缺省取订单 device_model）
     *   serial_no     序列号
     *   device_source 设备来源（采购/客户自备/租赁/调拨/赠送）
     *   device_quantity 数量（默认 1）
     *   device_unit   单位（默认 台）
     *   device_remarks 备注
     *   device_status 状态（normal/maintenance/idle/scrapped，默认 normal）
     */
    private function syncOrderDevice(int $orderId, array $data, array $orderInsert = []): void
    {
        try {
            $name = trim((string) ($data['device_name'] ?? ''));
            if ($name === '') {
                $name = trim((string) ($orderInsert['device_model'] ?? ''));
            }
            if ($name === '') {
                $name = '未命名设备';
            }

            $payload = [
                'order_id'  => $orderId,
                'name'      => $name,
                'serial_no' => trim((string) ($data['serial_no'] ?? '')) ?: null,
                'source'    => trim((string) ($data['device_source'] ?? '')) ?: null,
                'quantity'  => isset($data['device_quantity']) && $data['device_quantity'] !== '' ? (float) $data['device_quantity'] : 1,
                'unit'      => trim((string) ($data['device_unit'] ?? '')) ?: '台',
                'remarks'   => trim((string) ($data['device_remarks'] ?? '')) ?: null,
                'status'    => trim((string) ($data['device_status'] ?? '')) ?: 'normal',
            ];

            $existing = Db::name('order_devices')->where('order_id', $orderId)->find();
            if ($existing) {
                Db::name('order_devices')->where('id', $existing['id'])->update($payload);
            } else {
                Db::name('order_devices')->insert($payload);
            }
        } catch (\Throwable $e) {
            // 设备明细同步失败不影响订单主流程
            trace('订单设备明细同步失败 order=' . $orderId . ': ' . $e->getMessage(), 'error');
        }
    }

    private function generateOrderNo(): string
    {
        return 'MP' . date('YmdHis') . random_int(1000, 9999);
    }
}
