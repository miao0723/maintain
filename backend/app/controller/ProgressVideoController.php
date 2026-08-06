<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

/**
 * 进度视频控制器
 * 表: progress_video
 */
class ProgressVideoController extends BaseController
{
    /**
     * 获取进度视频列表
     * GET /api/progress-video
     */
    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $orderId = trim((string) request()->get('order_id', ''));
        $orderNo = trim((string) request()->get('order_no', ''));

        try {
            $query = Db::name('progress_video')->alias('pv');

            // 关联订单查询
            if ($orderId !== '' || $orderNo !== '') {
                $orderIds = $this->resolveOrderIds($orderId, $orderNo);
                if ($orderIds === null) {
                    // 无过滤条件，不做处理
                } elseif (empty($orderIds)) {
                    return Result::paginated([], 0, $page, $pageSize);
                } else {
                    $query->whereIn('pv.order_id', $orderIds);
                }
            }

            $total = (clone $query)->count();
            $list = $query->order('pv.id', 'desc')->page($page, $pageSize)->select()->toArray();

            // 补充订单信息
            $orderIds = array_column($list, 'order_id');
            $orders = $this->getOrders($orderIds);

            foreach ($list as &$item) {
                $order = $orders[$item['order_id']] ?? [];
                $item['order_no'] = $order['order_id'] ?? '';
                $item['device_name'] = $order['device_model'] ?? '';
                $item['customer_name'] = $order['user_name'] ?? ($order['contact_name'] ?? '');
            }

            return Result::paginated($list, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取进度视频详情
     * GET /api/progress-video/:id
     */
    public function read($id)
    {
        try {
            $video = Db::name('progress_video')->find($id);

            if (!$video) {
                return Result::error('视频记录不存在', 404);
            }

            // 补充订单信息
            $order = $this->getOrder((int) $video['order_id']);
            $video['order_no'] = $order['order_id'] ?? '';
            $video['device_name'] = $order['device_model'] ?? '';
            $video['customer_name'] = $order['user_name'] ?? ($order['contact_name'] ?? '');

            return Result::success($video);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建进度视频
     * POST /api/progress-video
     */
    public function save()
    {
        $data = $this->getRequestData();

        if (empty($data['order_id'])) {
            return Result::error('订单ID不能为空', 400);
        }
        if (empty($data['video_title'])) {
            return Result::error('视频标题不能为空', 400);
        }
        if (empty($data['video_url'])) {
            return Result::error('视频URL不能为空', 400);
        }

        try {
            // 验证订单是否存在
            $order = $this->getOrder((int) $data['order_id']);
            if (!$order) {
                return Result::error('订单不存在', 400);
            }

            $insertData = [
                'order_id' => (int) $data['order_id'],
                'video_title' => trim((string) $data['video_title']),
                'description' => trim((string) ($data['description'] ?? '')),
                'video_url' => trim((string) $data['video_url']),
                'cover_url' => trim((string) ($data['cover_url'] ?? '')),
                'duration' => (int) ($data['duration'] ?? 0),
                'file_size' => (int) ($data['file_size'] ?? 0),
                'uploaded_by' => $data['uploaded_by'] ?? null,
                'uploaded_by_name' => trim((string) ($data['uploaded_by_name'] ?? '')),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            $id = Db::name('progress_video')->insertGetId($insertData);
            $video = Db::name('progress_video')->find($id);

            return Result::success($video, '创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新进度视频
     * PUT /api/progress-video/:id
     */
    public function update($id)
    {
        $data = $this->getRequestData();

        try {
            $video = Db::name('progress_video')->find($id);

            if (!$video) {
                return Result::error('视频记录不存在', 404);
            }

            $updateData = ['updated_at' => date('Y-m-d H:i:s')];

            foreach (['video_title', 'description', 'video_url', 'cover_url'] as $field) {
                if (array_key_exists($field, $data)) {
                    $updateData[$field] = trim((string) $data[$field]);
                }
            }
            foreach (['duration', 'file_size'] as $field) {
                if (array_key_exists($field, $data)) {
                    $updateData[$field] = (int) $data[$field];
                }
            }
            if (array_key_exists('uploaded_by', $data)) {
                $updateData['uploaded_by'] = $data['uploaded_by'];
            }
            if (array_key_exists('uploaded_by_name', $data)) {
                $updateData['uploaded_by_name'] = trim((string) $data['uploaded_by_name']);
            }

            Db::name('progress_video')->where('id', $id)->update($updateData);
            $video = Db::name('progress_video')->find($id);

            return Result::success($video, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除进度视频
     * DELETE /api/progress-video/:id
     */
    public function delete($id)
    {
        try {
            $video = Db::name('progress_video')->find($id);

            if (!$video) {
                return Result::error('视频记录不存在', 404);
            }

            Db::name('progress_video')->delete($id);

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