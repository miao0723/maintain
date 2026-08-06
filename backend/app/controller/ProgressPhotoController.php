<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

/**
 * 进度照片控制器
 * 表: progress_photo
 */
class ProgressPhotoController extends BaseController
{
    /**
     * 获取进度照片列表
     * GET /api/progress-photo
     */
    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $orderId = trim((string) request()->get('order_id', ''));
        $orderNo = trim((string) request()->get('order_no', ''));

        try {
            $query = Db::name('progress_photo')->alias('pp');

            // 关联订单查询
            if ($orderId !== '' || $orderNo !== '') {
                $orderIds = $this->resolveOrderIds($orderId, $orderNo);
                if ($orderIds === null) {
                    // 无过滤条件，不做处理
                } elseif (empty($orderIds)) {
                    return Result::paginated([], 0, $page, $pageSize);
                } else {
                    $query->whereIn('pp.order_id', $orderIds);
                }
            }

            $total = (clone $query)->count();
            $list = $query->order('pp.id', 'desc')->page($page, $pageSize)->select()->toArray();

            // 补充订单信息
            $orderIds = array_column($list, 'order_id');
            $orders = $this->getOrders($orderIds);

            foreach ($list as &$item) {
                $order = $orders[$item['order_id']] ?? [];
                $item['order_no'] = $order['order_id'] ?? '';
                $item['device_name'] = $order['device_model'] ?? '';
                $item['customer_name'] = $order['user_name'] ?? ($order['contact_name'] ?? '');
                // 解析images JSON
                $item['photos'] = $item['images'] ? json_decode($item['images'], true) : [];
                $item['photo_count'] = count($item['photos']);
            }

            return Result::paginated($list, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取进度照片详情
     * GET /api/progress-photo/:id
     */
    public function read($id)
    {
        try {
            $photo = Db::name('progress_photo')->find($id);

            if (!$photo) {
                return Result::error('照片记录不存在', 404);
            }

            // 补充订单信息
            $order = $this->getOrder((int) $photo['order_id']);
            $photo['order_no'] = $order['order_id'] ?? '';
            $photo['device_name'] = $order['device_model'] ?? '';
            $photo['customer_name'] = $order['user_name'] ?? ($order['contact_name'] ?? '');
            $photo['photos'] = $photo['images'] ? json_decode($photo['images'], true) : [];

            return Result::success($photo);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建进度照片
     * POST /api/progress-photo
     */
    public function save()
    {
        $data = $this->getRequestData();

        if (empty($data['order_id'])) {
            return Result::error('订单ID不能为空', 400);
        }
        if (empty($data['description'])) {
            return Result::error('照片说明不能为空', 400);
        }
        if (empty($data['images']) || !is_array($data['images'])) {
            return Result::error('照片不能为空', 400);
        }

        try {
            // 验证订单是否存在
            $order = $this->getOrder((int) $data['order_id']);
            if (!$order) {
                return Result::error('订单不存在', 400);
            }

            $insertData = [
                'order_id' => (int) $data['order_id'],
                'description' => trim((string) $data['description']),
                'images' => json_encode($data['images'], JSON_UNESCAPED_UNICODE),
                'uploaded_by' => $data['uploaded_by'] ?? null,
                'uploaded_by_name' => trim((string) ($data['uploaded_by_name'] ?? '')),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            $id = Db::name('progress_photo')->insertGetId($insertData);
            $photo = Db::name('progress_photo')->find($id);

            return Result::success($photo, '创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新进度照片
     * PUT /api/progress-photo/:id
     */
    public function update($id)
    {
        $data = $this->getRequestData();

        try {
            $photo = Db::name('progress_photo')->find($id);

            if (!$photo) {
                return Result::error('照片记录不存在', 404);
            }

            $updateData = ['updated_at' => date('Y-m-d H:i:s')];

            if (array_key_exists('description', $data)) {
                $updateData['description'] = trim((string) $data['description']);
            }
            if (array_key_exists('images', $data) && is_array($data['images'])) {
                $updateData['images'] = json_encode($data['images'], JSON_UNESCAPED_UNICODE);
            }
            if (array_key_exists('uploaded_by', $data)) {
                $updateData['uploaded_by'] = $data['uploaded_by'];
            }
            if (array_key_exists('uploaded_by_name', $data)) {
                $updateData['uploaded_by_name'] = trim((string) $data['uploaded_by_name']);
            }

            Db::name('progress_photo')->where('id', $id)->update($updateData);
            $photo = Db::name('progress_photo')->find($id);

            return Result::success($photo, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除进度照片
     * DELETE /api/progress-photo/:id
     */
    public function delete($id)
    {
        try {
            $photo = Db::name('progress_photo')->find($id);

            if (!$photo) {
                return Result::error('照片记录不存在', 404);
            }

            Db::name('progress_photo')->delete($id);

            return Result::success(null, '删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    private function resolveOrderIds(string $orderId, string $orderNo): ?array
    {
        if ($orderId === '' && $orderNo === '') {
            return null;
        }

        $query = Db::connect('repair')->name('orders')->field('id');
        if ($orderId !== '') {
            $query->where('id', (int) $orderId);
        }
        if ($orderNo !== '') {
            $query->whereLike('order_id', '%' . $orderNo . '%');
        }

        return $query->column('id');
    }

    private function getOrders(array $orderIds): array
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
        $addrIds = array_values(array_unique(array_filter(array_column($orders, 'address_id'))));

        $users = [];
        if ($userIds) {
            foreach (Db::connect('repair')->name('users')->whereIn('id', $userIds)->field('id,nickname,real_name,phone')->select()->toArray() as $u) {
                $users[(int) $u['id']] = $u;
            }
        }

        $addrs = [];
        if ($addrIds) {
            foreach (Db::connect('repair')->name('user_addresses')->whereIn('id', $addrIds)->field('id,contact_name,contact_phone')->select()->toArray() as $a) {
                $addrs[(int) $a['id']] = $a;
            }
        }

        $map = [];
        foreach ($orders as $o) {
            $u = $users[(int) ($o['user_id'] ?? 0)] ?? [];
            $a = $addrs[(int) ($o['address_id'] ?? 0)] ?? [];
            $o['user_name'] = $u['nickname'] ?? ($u['real_name'] ?? '');
            $o['user_phone'] = $u['phone'] ?? '';
            $o['contact_name'] = $a['contact_name'] ?? '';
            $o['contact_phone'] = $a['contact_phone'] ?? '';
            $map[(int) $o['id']] = $o;
        }

        return $map;
    }

    private function getOrder(int $orderId): ?array
    {
        $orders = $this->getOrders([$orderId]);
        return $orders[$orderId] ?? null;
    }
}