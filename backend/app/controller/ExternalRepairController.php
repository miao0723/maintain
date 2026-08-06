<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

/**
 * 联动维修控制器
 * 表: external_repairs
 * 关联: repair.orders (小程序订单)
 */
class ExternalRepairController extends BaseController
{
    /**
     * 获取联动维修列表
     * GET /api/external-repairs
     */
    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $orderId = trim((string) request()->get('order_id', ''));
        $orderNo = trim((string) request()->get('order_no', ''));
        $status = trim((string) request()->get('status', ''));
        $externalUnit = trim((string) request()->get('external_unit', ''));
        $deviceModel = trim((string) request()->get('device_model', ''));

        try {
            $query = Db::name('external_repairs')->alias('er');

            if ($status !== '') {
                $query->where('er.status', $status);
            }
            if ($externalUnit !== '') {
                $query->whereLike('er.external_unit', '%' . $externalUnit . '%');
            }

            $matchedOrderIds = $this->resolveRepairOrderIds($orderId, $orderNo, $deviceModel);
            if ($matchedOrderIds !== null) {
                if (empty($matchedOrderIds)) {
                    return Result::paginated([], 0, $page, $pageSize);
                }
                $query->whereIn('er.order_id', $matchedOrderIds);
            }

            $total = (clone $query)->count();
            $repairList = $query->order('er.id', 'desc')
                ->page($page, $pageSize)
                ->select()
                ->toArray();

            $orders = $this->getRepairOrdersByIds(array_column($repairList, 'order_id'));

            $items = [];
            foreach ($repairList as $repair) {
                $orderInfo = $orders[$repair['order_id']] ?? [];
                $items[] = [
                    'id' => $repair['id'],
                    'order_id' => $repair['order_id'],
                    'order_no' => $orderInfo['order_id'] ?? '',
                    'device_model' => $orderInfo['device_model'] ?? '',
                    'device_type' => $orderInfo['device_type'] ?? '',
                    'customer_name' => $orderInfo['user_name'] ?? ($orderInfo['contact_name'] ?? ''),
                    'customer_phone' => $orderInfo['user_phone'] ?? ($orderInfo['contact_phone'] ?? ''),
                    'external_unit' => $repair['external_unit'],
                    'contact_person' => $repair['contact_person'],
                    'contact_phone' => $repair['contact_phone'],
                    'repair_content' => $repair['repair_content'],
                    'amount' => $repair['amount'],
                    'status' => $repair['status'],
                    'start_date' => $repair['start_date'],
                    'end_date' => $repair['end_date'],
                    'remark' => $repair['remark'],
                    'created_at' => $repair['created_at'],
                    'updated_at' => $repair['updated_at'],
                ];
            }

            return Result::paginated($items, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取联动维修详情
     * GET /api/external-repairs/:id
     */
    public function read($id)
    {
        try {
            $repair = Db::name('external_repairs')->find($id);

            if (!$repair) {
                return Result::error('记录不存在', 404);
            }

            $orderInfo = $this->getRepairOrderById((int) $repair['order_id']);

            $data = [
                'id' => $repair['id'],
                'order_id' => $repair['order_id'],
                'order_no' => $orderInfo['order_id'] ?? '',
                'device_model' => $orderInfo['device_model'] ?? '',
                'device_type' => $orderInfo['device_type'] ?? '',
                'customer_name' => $orderInfo['user_name'] ?? ($orderInfo['contact_name'] ?? ''),
                'customer_phone' => $orderInfo['user_phone'] ?? ($orderInfo['contact_phone'] ?? ''),
                'external_unit' => $repair['external_unit'],
                'contact_person' => $repair['contact_person'],
                'contact_phone' => $repair['contact_phone'],
                'repair_content' => $repair['repair_content'],
                'amount' => $repair['amount'],
                'status' => $repair['status'],
                'start_date' => $repair['start_date'],
                'end_date' => $repair['end_date'],
                'remark' => $repair['remark'],
                'created_at' => $repair['created_at'],
                'updated_at' => $repair['updated_at'],
            ];

            return Result::success($data);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建联动维修记录
     * POST /api/external-repairs
     */
    public function save()
    {
        $data = $this->getRequestData();

        if (empty($data['order_id'])) {
            return Result::error('订单ID不能为空', 400);
        }
        if (empty($data['external_unit'])) {
            return Result::error('外部单位不能为空', 400);
        }

        try {
            $order = $this->getRepairOrderById((int) $data['order_id']);
            if (!$order) {
                return Result::error('订单不存在', 400);
            }

            $insertData = [
                'order_id' => (int) $data['order_id'],
                'external_unit' => trim((string) $data['external_unit']),
                'contact_person' => trim((string) ($data['contact_person'] ?? '')),
                'contact_phone' => trim((string) ($data['contact_phone'] ?? '')),
                'repair_content' => trim((string) ($data['repair_content'] ?? '')),
                'amount' => isset($data['amount']) ? (float) $data['amount'] : 0,
                'status' => $data['status'] ?? 'pending',
                'start_date' => $data['start_date'] ?: null,
                'end_date' => $data['end_date'] ?: null,
                'remark' => trim((string) ($data['remark'] ?? '')),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            $id = Db::name('external_repairs')->insertGetId($insertData);
            $repair = Db::name('external_repairs')->find($id);

            return Result::success($repair, '创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新联动维修记录
     * PUT /api/external-repairs/:id
     */
    public function update($id)
    {
        $data = $this->getRequestData();

        try {
            $repair = Db::name('external_repairs')->find($id);
            if (!$repair) {
                return Result::error('记录不存在', 404);
            }

            $updateData = [];
            if (array_key_exists('order_id', $data)) {
                $order = $this->getRepairOrderById((int) $data['order_id']);
                if (!$order) {
                    return Result::error('订单不存在', 400);
                }
                $updateData['order_id'] = (int) $data['order_id'];
            }
            foreach (['external_unit', 'contact_person', 'contact_phone', 'repair_content', 'remark', 'status', 'start_date', 'end_date'] as $field) {
                if (array_key_exists($field, $data)) {
                    $updateData[$field] = in_array($field, ['start_date', 'end_date'], true)
                        ? ($data[$field] ?: null)
                        : (is_string($data[$field]) ? trim($data[$field]) : $data[$field]);
                }
            }
            if (array_key_exists('amount', $data)) {
                $updateData['amount'] = (float) $data['amount'];
            }
            $updateData['updated_at'] = date('Y-m-d H:i:s');

            Db::name('external_repairs')->where('id', $id)->update($updateData);
            $repair = Db::name('external_repairs')->find($id);

            return Result::success($repair, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除联动维修记录
     * DELETE /api/external-repairs/:id
     */
    public function delete($id)
    {
        try {
            $repair = Db::name('external_repairs')->find($id);

            if (!$repair) {
                return Result::error('记录不存在', 404);
            }

            Db::name('external_repairs')->delete($id);

            return Result::success(null, '删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    private function resolveRepairOrderIds(string $orderId, string $orderNo, string $deviceModel): ?array
    {
        if ($orderId === '' && $orderNo === '' && $deviceModel === '') {
            return null;
        }

        $query = Db::connect('repair')->name('orders')->field('id');
        if ($orderId !== '') {
            $query->where('id', intval($orderId));
        }
        if ($orderNo !== '') {
            $query->whereLike('order_id', '%' . $orderNo . '%');
        }
        if ($deviceModel !== '') {
            $query->whereLike('device_model', '%' . $deviceModel . '%');
        }

        return $query->column('id');
    }

    private function getRepairOrdersByIds(array $orderIds): array
    {
        $orderIds = array_values(array_unique(array_filter(array_map('intval', $orderIds))));
        if (empty($orderIds)) {
            return [];
        }

        $orders = Db::connect('repair')
            ->name('orders')
            ->whereIn('id', $orderIds)
            ->field('id,order_id,device_model,device_type,user_id,address_id')
            ->select()
            ->toArray();

        $userIds = array_values(array_unique(array_filter(array_column($orders, 'user_id'))));
        $addressIds = array_values(array_unique(array_filter(array_column($orders, 'address_id'))));

        $userMap = [];
        if (!empty($userIds)) {
            $users = Db::connect('repair')->name('users')->whereIn('id', $userIds)->field('id,nickname,real_name,phone')->select()->toArray();
            foreach ($users as $user) {
                $userMap[(int) $user['id']] = $user;
            }
        }

        $addressMap = [];
        if (!empty($addressIds)) {
            $addresses = Db::connect('repair')->name('user_addresses')->whereIn('id', $addressIds)->field('id,contact_name,contact_phone')->select()->toArray();
            foreach ($addresses as $address) {
                $addressMap[(int) $address['id']] = $address;
            }
        }

        $result = [];
        foreach ($orders as $order) {
            $user = $userMap[(int) ($order['user_id'] ?? 0)] ?? [];
            $address = $addressMap[(int) ($order['address_id'] ?? 0)] ?? [];
            $order['user_name'] = $user['nickname'] ?? ($user['real_name'] ?? '');
            $order['user_phone'] = $user['phone'] ?? '';
            $order['contact_name'] = $address['contact_name'] ?? '';
            $order['contact_phone'] = $address['contact_phone'] ?? '';
            $result[(int) $order['id']] = $order;
        }

        return $result;
    }

    private function getRepairOrderById(int $orderId): ?array
    {
        $orders = $this->getRepairOrdersByIds([$orderId]);
        return $orders[$orderId] ?? null;
    }
}
