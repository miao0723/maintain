<?php

namespace app\controller;

use app\common\DataHelper;
use app\common\Result;
use think\facade\Db;

/**
 * 小程序维修进度控制器
 * 直接从小程序repair数据库读取订单和进度信息
 */
class MiniprogramRepairProgressController extends BaseController
{
    /**
     * 获取小程序维修订单列表（带进度信息）
     */
    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);

        $orderId = trim((string) request()->get('order_id', ''));
        $orderNo = trim((string) request()->get('order_no', ''));
        $deviceModel = trim((string) request()->get('device_model', ''));
        $status = trim((string) request()->get('status', ''));
        $deviceType = request()->get('device_type');
        $serviceType = trim((string) request()->get('service_type', ''));
        $orderType = trim((string) request()->get('order_type', ''));
        $dateStart = trim((string) request()->get('date_start', ''));
        $dateEnd = trim((string) request()->get('date_end', ''));

        try {
            $query = Db::connect('repair')->name('orders');

            if ($orderId !== '') {
                $query->where('id', (int)$orderId);
            }
            if ($orderNo !== '') {
                $query->whereLike('order_id', '%' . $orderNo . '%');
            }
            if ($deviceModel !== '') {
                $query->whereLike('device_model', '%' . $deviceModel . '%');
            }
            if ($status !== '') {
                $query->where('status', $status);
            }
            if ($deviceType !== null && $deviceType !== '') {
                $query->where('device_type', (int)$deviceType);
            }
            if ($serviceType !== '') {
                $query->where('service_type', $serviceType);
            }
            if ($orderType !== '') {
                $query->where('order_type', $orderType);
            }
            if ($dateStart !== '') {
                $query->where('created_at', '>=', $dateStart);
            }
            if ($dateEnd !== '') {
                $query->where('created_at', '<=', $dateEnd . ' 23:59:59');
            }

            $total = (clone $query)->count();

            $orders = $query->order('id', 'desc')
                ->page($page, $pageSize)
                ->select()
                ->toArray();

            // 获取关联的用户和地址信息
            $userIds = array_values(array_unique(array_filter(array_column($orders, 'user_id'))));
            $addressIds = array_values(array_unique(array_filter(array_column($orders, 'address_id'))));
            $assignedIds = array_values(array_unique(array_filter(array_column($orders, 'assigned_to'))));

            $userMap = [];
            if (!empty($userIds)) {
                $users = Db::connect('repair')->name('users')
                    ->whereIn('id', $userIds)
                    ->field('id,nickname,real_name,phone')
                    ->select()
                    ->toArray();
                foreach ($users as $user) {
                    $userMap[$user['id']] = $user;
                }
            }

            $addressMap = [];
            if (!empty($addressIds)) {
                $addresses = Db::connect('repair')->name('user_addresses')
                    ->whereIn('id', $addressIds)
                    ->select()
                    ->toArray();
                foreach ($addresses as $addr) {
                    // 拼接完整地址
                    $fullAddress = trim($addr['province'] ?? '');
                    if (!empty($addr['city'] ?? '')) $fullAddress .= ' ' . trim($addr['city']);
                    if (!empty($addr['district'] ?? '')) $fullAddress .= ' ' . trim($addr['district']);
                    if (!empty($addr['detail_address'] ?? '')) $fullAddress .= ' ' . trim($addr['detail_address']);
                    $addr['full_address'] = trim($fullAddress);
                    $addressMap[$addr['id']] = $addr;
                }
            }

            $assignedMap = [];
            if (!empty($assignedIds)) {
                $assignedUsers = Db::connect('repair')->name('users')
                    ->whereIn('id', $assignedIds)
                    ->field('id,nickname,real_name')
                    ->select()
                    ->toArray();
                foreach ($assignedUsers as $user) {
                    $assignedMap[$user['id']] = $user;
                }
            }

            // 获取进度照片数量
            $orderIds = array_column($orders, 'id');
            $photoCounts = [];
            if (!empty($orderIds)) {
                $photos = Db::connect('repair')->name('order_progress_photos')
                    ->whereIn('order_id', $orderIds)
                    ->field('order_id,COUNT(*) as count')
                    ->group('order_id')
                    ->select()
                    ->toArray();
                foreach ($photos as $p) {
                    $photoCounts[$p['order_id']] = $p['count'];
                }
            }

            // 获取进度视频数量
            $videoCounts = [];
            if (!empty($orderIds)) {
                $videos = Db::connect('repair')->name('order_progress_videos')
                    ->whereIn('order_id', $orderIds)
                    ->field('order_id,COUNT(*) as count')
                    ->group('order_id')
                    ->select()
                    ->toArray();
                foreach ($videos as $v) {
                    $videoCounts[$v['order_id']] = $v['count'];
                }
            }

            // 组装返回数据
            $items = [];
            foreach ($orders as $order) {
                $user = $userMap[$order['user_id']] ?? [];
                $address = $addressMap[$order['address_id']] ?? [];
                $assigned = $assignedMap[$order['assigned_to']] ?? [];

                // 解析故障图片，修复小程序上传路径
                $images = DataHelper::fixOrderFaultImages($order);

                $items[] = [
                    'id' => $order['id'],
                    'order_id' => $order['order_id'],
                    'order_type' => $order['order_type'] ?? 'repair',
                    'device_type' => $order['device_type'],
                    'device_model' => $order['device_model'] ?? '',
                    'brand_name' => $order['brand_name'] ?? '',
                    'problem_description' => $order['problem_description'] ?? '',
                    'custom_description' => $order['custom_description'] ?? '',
                    'service_type' => $order['service_type'] ?? '',
                    'estimated_price' => $order['estimated_price'] ?? 0,
                    'actual_price' => $order['actual_price'] ?? 0,
                    'status' => $order['status'] ?? 'pending',
                    'progress' => (int)($order['progress'] ?? 0),
                    'priority' => $order['priority'] ?? 'medium',
                    'assigned_to' => $order['assigned_to'],
                    'assigned_user_name' => $assigned['real_name'] ?? ($assigned['nickname'] ?? ''),
                    'user_id' => $order['user_id'],
                    'user_name' => $user['nickname'] ?? ($user['real_name'] ?? ''),
                    'user_phone' => $user['phone'] ?? '',
                    'address_id' => $order['address_id'],
                    'address_text' => $address['full_address'] ?? '',
                    'created_at' => $order['created_at'] ?? '',
                    'updated_at' => $order['updated_at'] ?? '',
                    'completed_at' => $order['completed_at'] ?? '',
                    'images' => $images,
                    'photo_count' => $photoCounts[$order['id']] ?? 0,
                    'video_count' => $videoCounts[$order['id']] ?? 0,
                ];
            }

            return Result::paginated($items, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取订单详情
     */
    public function read($id)
    {
        try {
            DataHelper::syncProgressDirectoryByOrderId($id);

            $order = Db::connect('repair')->name('orders')->find($id);

            if (!$order) {
                return Result::error('订单不存在', 404);
            }

            // 获取用户信息
            $user = [];
            if (!empty($order['user_id'])) {
                $user = Db::connect('repair')->name('users')
                    ->where('id', $order['user_id'])
                    ->field('id,nickname,real_name,phone,avatar')
                    ->find();
            }

            // 获取地址信息
            $address = [];
            if (!empty($order['address_id'])) {
                $address = Db::connect('repair')->name('user_addresses')
                    ->where('id', $order['address_id'])
                    ->find();
                // 拼接完整地址
                if ($address) {
                    $fullAddress = trim($address['province'] ?? '');
                    if (!empty($address['city'] ?? '')) $fullAddress .= ' ' . trim($address['city']);
                    if (!empty($address['district'] ?? '')) $fullAddress .= ' ' . trim($address['district']);
                    if (!empty($address['detail_address'] ?? '')) $fullAddress .= ' ' . trim($address['detail_address']);
                    $address['full_address'] = trim($fullAddress);
                }
            }

            // 获取维修人员信息
            $assignedUser = [];
            if (!empty($order['assigned_to'])) {
                $assignedUser = Db::connect('repair')->name('users')
                    ->where('id', $order['assigned_to'])
                    ->field('id,nickname,real_name,phone')
                    ->find();
            }

            // 获取进度照片
            $photos = Db::connect('repair')->name('order_progress_photos')
                ->where('order_id', $id)
                ->order('id', 'desc')
                ->select()
                ->toArray();
            foreach ($photos as &$photo) {
                $photo['photos'] = DataHelper::decodeMediaList($photo['images'] ?? []);
                $photo['photo_count'] = count($photo['photos']);
            }
            unset($photo);

            // 获取进度视频
            $videos = Db::connect('repair')->name('order_progress_videos')
                ->where('order_id', $id)
                ->order('id', 'desc')
                ->select()
                ->toArray();
            foreach ($videos as &$video) {
                $video['video_url'] = DataHelper::normalizeMediaPath((string) ($video['video_url'] ?? ''));
                $video['cover_url'] = DataHelper::normalizeMediaPath((string) ($video['cover_url'] ?? ''));
            }
            unset($video);

            // 解析故障图片，修复小程序上传路径
            $images = DataHelper::fixOrderFaultImages($order);

            $data = [
                'id' => $order['id'],
                'order_id' => $order['order_id'],
                'order_type' => $order['order_type'] ?? 'repair',
                'device_type' => $order['device_type'],
                'device_model' => $order['device_model'] ?? '',
                'brand_name' => $order['brand_name'] ?? '',
                'problem_description' => $order['problem_description'] ?? '',
                'custom_description' => $order['custom_description'] ?? '',
                'service_type' => $order['service_type'] ?? '',
                'estimated_price' => $order['estimated_price'] ?? 0,
                'actual_price' => $order['actual_price'] ?? 0,
                'status' => $order['status'] ?? 'pending',
                'progress' => (int)($order['progress'] ?? 0),
                'priority' => $order['priority'] ?? 'medium',
                'assigned_to' => $order['assigned_to'],
                'assigned_at' => $order['assigned_at'] ?? '',
                'user_id' => $order['user_id'],
                'user_name' => $user['nickname'] ?? ($user['real_name'] ?? ''),
                'user_phone' => $user['phone'] ?? '',
                'user_avatar' => $user['avatar'] ?? '',
                'address_id' => $order['address_id'],
                'address_text' => $address['full_address'] ?? '',
                'created_at' => $order['created_at'] ?? '',
                'updated_at' => $order['updated_at'] ?? '',
                'completed_at' => $order['completed_at'] ?? '',
                'images' => $images,
                'progress_photos' => $photos,
                'progress_videos' => $videos,
            ];

            return Result::success($data);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新订单进度
     */
    public function updateProgress($id)
    {
        $data = $this->getRequestData();

        try {
            $order = Db::connect('repair')->name('orders')->find($id);
            if (!$order) {
                return Result::error('订单不存在', 404);
            }

            $updateData = [];

            if (array_key_exists('progress', $data)) {
                $updateData['progress'] = (int) $data['progress'];
            }

            if (array_key_exists('status', $data)) {
                $updateData['status'] = $data['status'];
            }

            if (array_key_exists('actual_price', $data)) {
                $updateData['actual_price'] = (float) $data['actual_price'];
            }

            if (array_key_exists('assigned_to', $data)) {
                $updateData['assigned_to'] = $data['assigned_to'];
                if (empty($order['assigned_at'])) {
                    $updateData['assigned_at'] = date('Y-m-d H:i:s');
                }
            }

            if (!empty($updateData)) {
                $updateData['updated_at'] = date('Y-m-d H:i:s');

                // 如果进度为100%且状态不是已完成，则自动更新为已完成
                $wasCompleted = $order['status'] === 'completed';
                if (isset($updateData['progress']) && $updateData['progress'] >= 100) {
                    $updateData['status'] = 'completed';
                    $updateData['completed_at'] = date('Y-m-d H:i:s');
                }

                Db::connect('repair')->name('orders')
                    ->where('id', $id)
                    ->update($updateData);

                // 自动同步收入：订单变为已完成时
                if (!$wasCompleted && ($updateData['status'] ?? '') === 'completed') {
                    try {
                        (new \app\service\StatisticsService())->syncIncomeFromCompletedOrders($id);
                    } catch (\Exception $e) {
                        trace('收入同步失败: ' . $e->getMessage(), 'error');
                    }
                }
            }

            return Result::success(null, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取订单的进度照片
     */
    public function getPhotos($id)
    {
        try {
            DataHelper::syncProgressDirectoryByOrderId($id);

            $photos = Db::connect('repair')->name('order_progress_photos')
                ->where('order_id', $id)
                ->order('id', 'desc')
                ->select()
                ->toArray();

            foreach ($photos as &$photo) {
                $photo['photos'] = DataHelper::decodeMediaList($photo['images'] ?? []);
                $photo['photo_count'] = count($photo['photos']);
            }
            unset($photo);

            return Result::success($photos);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取订单的进度视频
     */
    public function getVideos($id)
    {
        try {
            DataHelper::syncProgressDirectoryByOrderId($id);

            $videos = Db::connect('repair')->name('order_progress_videos')
                ->where('order_id', $id)
                ->order('id', 'desc')
                ->select()
                ->toArray();

            foreach ($videos as &$video) {
                $video['video_url'] = DataHelper::normalizeMediaPath((string) ($video['video_url'] ?? ''));
                $video['cover_url'] = DataHelper::normalizeMediaPath((string) ($video['cover_url'] ?? ''));
            }
            unset($video);

            return Result::success($videos);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取统计信息
     */
    public function statistics()
    {
        try {
            $stats = [
                'total' => Db::connect('repair')->name('orders')->count(),
                'pending' => Db::connect('repair')->name('orders')->where('status', 'pending')->count(),
                'processing' => Db::connect('repair')->name('orders')->where('status', 'processing')->count(),
                'review' => Db::connect('repair')->name('orders')->where('status', 'review')->count(),
                'completed' => Db::connect('repair')->name('orders')->where('status', 'completed')->count(),
                'cancelled' => Db::connect('repair')->name('orders')->where('status', 'cancelled')->count(),
            ];

            return Result::success($stats);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
