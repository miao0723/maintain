<?php

namespace app\controller;

use app\common\DataHelper;
use app\common\Result;
use think\facade\Db;

/**
 * 小程序进度媒体控制器
 * 用于查询小程序 repair 数据库中的进度照片和视频
 * 供后台管理系统展示使用
 */
class MiniprogramProgressMediaController extends BaseController
{
    /**
     * 获取进度照片列表（按订单号查询）
     * GET /api/miniprogram-progress-media/photos
     * 参数:
     *   - order_id: 订单ID（可选）
     *   - order_no: 订单号（可选，支持模糊查询）
     *   - page: 页码（默认1）
     *   - pageSize: 每页数量（默认20）
     */
    public function getPhotos()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $orderId = trim((string) request()->get('order_id', ''));
        $orderNo = trim((string) request()->get('order_no', ''));

        try {
            $query = Db::connect('repair')->name('order_progress_photos')->alias('pp');

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

            foreach (array_values(array_unique(array_filter(array_column($list, 'order_id')))) as $syncOrderId) {
                DataHelper::syncProgressDirectoryByOrderId($syncOrderId);
            }

            // 补充订单信息
            $orderIds = array_column($list, 'order_id');
            $orders = $this->getOrders($orderIds);

            foreach ($list as &$item) {
                $order = $orders[$item['order_id']] ?? [];
                $item['order_no'] = $order['order_id'] ?? '';
                $item['device_model'] = $order['device_model'] ?? '';
                $item['device_type'] = $order['device_type'] ?? '';
                $item['customer_name'] = $order['user_name'] ?? '';

                $item['photos'] = DataHelper::decodeMediaList($item['images'] ?? []);
                $item['photo_count'] = count($item['photos']);
            }

            return Result::paginated($list, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取进度视频列表（按订单号查询）
     * GET /api/miniprogram-progress-media/videos
     * 参数:
     *   - order_id: 订单ID（可选）
     *   - order_no: 订单号（可选，支持模糊查询）
     *   - page: 页码（默认1）
     *   - pageSize: 每页数量（默认20）
     */
    public function getVideos()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $orderId = trim((string) request()->get('order_id', ''));
        $orderNo = trim((string) request()->get('order_no', ''));

        try {
            $query = Db::connect('repair')->name('order_progress_videos')->alias('pv');

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

            foreach (array_values(array_unique(array_filter(array_column($list, 'order_id')))) as $syncOrderId) {
                DataHelper::syncProgressDirectoryByOrderId($syncOrderId);
            }

            // 补充订单信息
            $orderIds = array_column($list, 'order_id');
            $orders = $this->getOrders($orderIds);

            foreach ($list as &$item) {
                $order = $orders[$item['order_id']] ?? [];
                $item['order_no'] = $order['order_id'] ?? '';
                $item['device_model'] = $order['device_model'] ?? '';
                $item['device_type'] = $order['device_type'] ?? '';
                $item['customer_name'] = $order['user_name'] ?? '';
                $item['video_url'] = DataHelper::normalizeMediaPath((string) ($item['video_url'] ?? ''));
                $item['cover_url'] = DataHelper::normalizeMediaPath((string) ($item['cover_url'] ?? ''));
            }

            return Result::paginated($list, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取指定订单的所有进度照片
     * GET /api/miniprogram-progress-media/photos/:orderId
     */
    public function getPhotosByOrder($orderId)
    {
        try {
            DataHelper::syncProgressDirectoryByOrderId($orderId);

            $photos = Db::connect('repair')->name('order_progress_photos')
                ->where('order_id', $orderId)
                ->order('id', 'desc')
                ->select()
                ->toArray();

            // 解析JSON
            foreach ($photos as &$photo) {
                $photo['photos'] = DataHelper::decodeMediaList($photo['images'] ?? []);
                $photo['photo_count'] = count($photo['photos']);
            }

            return Result::success($photos);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取指定订单的所有进度视频
     * GET /api/miniprogram-progress-media/videos/:orderId
     */
    public function getVideosByOrder($orderId)
    {
        try {
            DataHelper::syncProgressDirectoryByOrderId($orderId);

            $videos = Db::connect('repair')->name('order_progress_videos')
                ->where('order_id', $orderId)
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
     * 获取单条进度照片详情
     * GET /api/miniprogram-progress-media/photos/detail/:id
     */
    public function getPhotoDetail($id)
    {
        try {
            $photo = Db::connect('repair')->name('order_progress_photos')
                ->where('id', $id)
                ->find();

            if (!$photo) {
                return Result::error('照片记录不存在', 404);
            }

            DataHelper::syncProgressDirectoryByOrderId($photo['order_id'] ?? null);

            // 解析images JSON
            $photo['photos'] = DataHelper::decodeMediaList($photo['images'] ?? []);
            $photo['photo_count'] = count($photo['photos']);

            // 获取订单信息
            $order = Db::connect('repair')->name('orders')
                ->where('id', $photo['order_id'])
                ->field('id,order_id,device_model,device_type,user_id')
                ->find();

            if ($order) {
                $photo['order_no'] = $order['order_id'] ?? '';
                $photo['device_model'] = $order['device_model'] ?? '';
                $photo['device_type'] = $order['device_type'] ?? '';

                // 获取用户信息
                $user = Db::connect('repair')->name('users')
                    ->where('id', $order['user_id'])
                    ->field('id,nickname,real_name,phone')
                    ->find();

                $photo['customer_name'] = $user['nickname'] ?? ($user['real_name'] ?? '');
            }

            return Result::success($photo);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取单条进度视频详情
     * GET /api/miniprogram-progress-media/videos/detail/:id
     */
    public function getVideoDetail($id)
    {
        try {
            $video = Db::connect('repair')->name('order_progress_videos')
                ->where('id', $id)
                ->find();

            if (!$video) {
                return Result::error('视频记录不存在', 404);
            }

            DataHelper::syncProgressDirectoryByOrderId($video['order_id'] ?? null);

            // 获取订单信息
            $order = Db::connect('repair')->name('orders')
                ->where('id', $video['order_id'])
                ->field('id,order_id,device_model,device_type,user_id')
                ->find();

            if ($order) {
                $video['order_no'] = $order['order_id'] ?? '';
                $video['device_model'] = $order['device_model'] ?? '';
                $video['device_type'] = $order['device_type'] ?? '';

                // 获取用户信息
                $user = Db::connect('repair')->name('users')
                    ->where('id', $order['user_id'])
                    ->field('id,nickname,real_name,phone')
                    ->find();

                $video['customer_name'] = $user['nickname'] ?? ($user['real_name'] ?? '');
            }

            $video['video_url'] = DataHelper::normalizeMediaPath((string) ($video['video_url'] ?? ''));
            $video['cover_url'] = DataHelper::normalizeMediaPath((string) ($video['cover_url'] ?? ''));

            return Result::success($video);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建进度照片
     * POST /api/miniprogram-progress-media/photos
     */
    public function createPhoto()
    {
        $data = request()->post();

        try {
            // 验证必填字段
            if (empty($data['order_id'])) {
                return Result::error('订单ID不能为空', 400);
            }

            if (empty($data['images']) || !is_array($data['images']) || empty($data['images'])) {
                return Result::error('请至少上传一张照片', 400);
            }

            // 验证订单是否存在
            $order = Db::connect('repair')->name('orders')
                ->where('id', $data['order_id'])
                ->find();

            if (!$order) {
                return Result::error('订单不存在', 404);
            }

            // 获取当前用户信息
            $user = request()->user ?? [];
            $uploadedByName = $user['real_name'] ?? ($user['username'] ?? '系统');
            $feedbackGroupId = !empty($data['feedback_group_id'])
                ? trim((string) $data['feedback_group_id'])
                : $this->generateFeedbackGroupId();
            $normalizedImages = $this->normalizeProgressMediaPaths($data['images'], (string) $data['order_id']);

            // 插入数据
            $insertData = [
                'order_id' => $data['order_id'],
                'feedback_group_id' => $feedbackGroupId,
                'description' => $data['description'] ?? '',
                'images' => json_encode($normalizedImages, JSON_UNESCAPED_UNICODE),
                'uploaded_by' => $user['id'] ?? null,
                'uploaded_by_name' => $uploadedByName,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $id = Db::connect('repair')->name('order_progress_photos')->insertGetId($insertData);

            // 返回插入的数据
            $insertData['id'] = $id;
            $insertData['order_no'] = $order['order_id'] ?? '';
            $insertData['device_model'] = $order['device_model'] ?? '';
            $insertData['device_type'] = $order['device_type'] ?? '';
            $insertData['customer_name'] = $uploadedByName;
            $insertData['photos'] = $normalizedImages;
            $insertData['photo_count'] = count($normalizedImages);

            return Result::success($insertData, '创建成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建进度视频
     * POST /api/miniprogram-progress-media/videos
     */
    public function createVideo()
    {
        $data = request()->post();

        try {
            // 验证必填字段
            if (empty($data['order_id'])) {
                return Result::error('订单ID不能为空', 400);
            }

            if (empty($data['video_title'])) {
                return Result::error('视频标题不能为空', 400);
            }

            if (empty($data['video_url'])) {
                return Result::error('视频URL不能为空', 400);
            }

            // 验证订单是否存在
            $order = Db::connect('repair')->name('orders')
                ->where('id', $data['order_id'])
                ->find();

            if (!$order) {
                return Result::error('订单不存在', 404);
            }

            // 获取当前用户信息
            $user = request()->user ?? [];
            $uploadedByName = $user['real_name'] ?? ($user['username'] ?? '系统');
            $feedbackGroupId = !empty($data['feedback_group_id'])
                ? trim((string) $data['feedback_group_id'])
                : $this->generateFeedbackGroupId();
            $normalizedVideoUrl = $this->normalizeProgressMediaPath((string) $data['video_url'], (string) $data['order_id']);
            $normalizedCoverUrl = $this->normalizeProgressMediaPath((string) ($data['cover_url'] ?? ''), (string) $data['order_id']);

            // 插入数据
            $insertData = [
                'order_id' => $data['order_id'],
                'feedback_group_id' => $feedbackGroupId,
                'video_title' => $data['video_title'],
                'description' => $data['description'] ?? '',
                'video_url' => $normalizedVideoUrl,
                'cover_url' => $normalizedCoverUrl,
                'duration' => $data['duration'] ?? 0,
                'file_size' => $data['file_size'] ?? 0,
                'uploaded_by' => $user['id'] ?? null,
                'uploaded_by_name' => $uploadedByName,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $id = Db::connect('repair')->name('order_progress_videos')->insertGetId($insertData);

            // 返回插入的数据
            $insertData['id'] = $id;
            $insertData['order_no'] = $order['order_id'] ?? '';
            $insertData['device_model'] = $order['device_model'] ?? '';
            $insertData['device_type'] = $order['device_type'] ?? '';
            $insertData['customer_name'] = $uploadedByName;

            return Result::success($insertData, '创建成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新进度照片
     * PUT /api/miniprogram-progress-media/photos/:id
     */
    public function updatePhoto($id)
    {
        // 尝试从多种方式获取数据
        $data = request()->post();

        // 如果post数据为空，尝试从JSON body获取
        if (empty($data)) {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
        }

        try {
            // 检查记录是否存在
            $photo = Db::connect('repair')->name('order_progress_photos')
                ->where('id', $id)
                ->find();

            if (!$photo) {
                return Result::error('照片记录不存在', 404);
            }

            // 构建更新数据
            $updateData = [
                'updated_at' => date('Y-m-d H:i:s')
            ];

            if (isset($data['description'])) {
                $updateData['description'] = $data['description'];
            }

            if (isset($data['images']) && is_array($data['images'])) {
                $updateData['images'] = json_encode(
                    $this->normalizeProgressMediaPaths($data['images'], (string) $photo['order_id']),
                    JSON_UNESCAPED_UNICODE
                );
            }

            // 更新数据
            Db::connect('repair')->name('order_progress_photos')
                ->where('id', $id)
                ->update($updateData);

            // 获取更新后的数据
            $updated = Db::connect('repair')->name('order_progress_photos')
                ->where('id', $id)
                ->find();

            $updated['photos'] = DataHelper::decodeMediaList($updated['images'] ?? []);
            $updated['photo_count'] = count($updated['photos']);

            // 获取订单信息
            $order = Db::connect('repair')->name('orders')
                ->where('id', $updated['order_id'])
                ->field('id,order_id,device_model,device_type,user_id')
                ->find();

            if ($order) {
                $updated['order_no'] = $order['order_id'] ?? '';
                $updated['device_model'] = $order['device_model'] ?? '';
                $updated['device_type'] = $order['device_type'] ?? '';

                $user = Db::connect('repair')->name('users')
                    ->where('id', $order['user_id'])
                    ->field('id,nickname,real_name,phone')
                    ->find();

                $updated['customer_name'] = $user['nickname'] ?? ($user['real_name'] ?? '');
            }

            $updated['video_url'] = DataHelper::normalizeMediaPath((string) ($updated['video_url'] ?? ''));
            $updated['cover_url'] = DataHelper::normalizeMediaPath((string) ($updated['cover_url'] ?? ''));

            return Result::success($updated, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新进度视频
     * PUT /api/miniprogram-progress-media/videos/:id
     */
    public function updateVideo($id)
    {
        // 尝试从多种方式获取数据
        $data = request()->post();

        // 如果post数据为空，尝试从JSON body获取
        if (empty($data)) {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
        }

        try {
            // 检查记录是否存在
            $video = Db::connect('repair')->name('order_progress_videos')
                ->where('id', $id)
                ->find();

            if (!$video) {
                return Result::error('视频记录不存在', 404);
            }

            // 构建更新数据
            $updateData = [
                'updated_at' => date('Y-m-d H:i:s')
            ];

            if (isset($data['video_title'])) {
                $updateData['video_title'] = $data['video_title'];
            }

            if (isset($data['description'])) {
                $updateData['description'] = $data['description'];
            }

            if (isset($data['video_url'])) {
                $updateData['video_url'] = $this->normalizeProgressMediaPath((string) $data['video_url'], (string) $video['order_id']);
            }

            if (isset($data['cover_url'])) {
                $updateData['cover_url'] = $this->normalizeProgressMediaPath((string) $data['cover_url'], (string) $video['order_id']);
            }

            if (isset($data['duration'])) {
                $updateData['duration'] = $data['duration'];
            }

            if (isset($data['file_size'])) {
                $updateData['file_size'] = $data['file_size'];
            }

            // 更新数据
            Db::connect('repair')->name('order_progress_videos')
                ->where('id', $id)
                ->update($updateData);

            // 获取更新后的数据
            $updated = Db::connect('repair')->name('order_progress_videos')
                ->where('id', $id)
                ->find();

            // 获取订单信息
            $order = Db::connect('repair')->name('orders')
                ->where('id', $updated['order_id'])
                ->field('id,order_id,device_model,device_type,user_id')
                ->find();

            if ($order) {
                $updated['order_no'] = $order['order_id'] ?? '';
                $updated['device_model'] = $order['device_model'] ?? '';
                $updated['device_type'] = $order['device_type'] ?? '';

                $user = Db::connect('repair')->name('users')
                    ->where('id', $order['user_id'])
                    ->field('id,nickname,real_name,phone')
                    ->find();

                $updated['customer_name'] = $user['nickname'] ?? ($user['real_name'] ?? '');
            }

            return Result::success($updated, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除进度照片
     * DELETE /api/miniprogram-progress-media/photos/:id
     */
    public function deletePhoto($id)
    {
        try {
            // 检查记录是否存在
            $photo = Db::connect('repair')->name('order_progress_photos')
                ->where('id', $id)
                ->find();

            if (!$photo) {
                return Result::error('照片记录不存在', 404);
            }

            // 删除记录
            Db::connect('repair')->name('order_progress_photos')
                ->where('id', $id)
                ->delete();

            return Result::success(null, '删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除进度视频
     * DELETE /api/miniprogram-progress-media/videos/:id
     */
    public function deleteVideo($id)
    {
        try {
            // 检查记录是否存在
            $video = Db::connect('repair')->name('order_progress_videos')
                ->where('id', $id)
                ->find();

            if (!$video) {
                return Result::error('视频记录不存在', 404);
            }

            // 删除记录
            Db::connect('repair')->name('order_progress_videos')
                ->where('id', $id)
                ->delete();

            return Result::success(null, '删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取订单汇总信息（含照片和视频数量统计）
     * GET /api/miniprogram-progress-media/summary
     * 参数:
     *   - order_id: 订单ID（可选）
     *   - order_no: 订单号（可选，支持模糊查询）
     *   - page: 页码（默认1）
     *   - pageSize: 每页数量（默认20）
     */
    public function getSummary()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $orderId = trim((string) request()->get('order_id', ''));
        $orderNo = trim((string) request()->get('order_no', ''));
        $deviceModel = trim((string) request()->get('device_model', ''));

        try {
            $query = Db::connect('repair')->name('orders');

            if ($orderId !== '') {
                $query->where('id', (int) $orderId);
            }
            if ($orderNo !== '') {
                $query->whereLike('order_id', '%' . $orderNo . '%');
            }
            if ($deviceModel !== '') {
                $query->whereLike('device_model', '%' . $deviceModel . '%');
            }

            $total = (clone $query)->count();
            $orders = $query->order('id', 'desc')->page($page, $pageSize)->select()->toArray();

            foreach (array_column($orders, 'id') as $syncOrderId) {
                DataHelper::syncProgressDirectoryByOrderId($syncOrderId);
            }

            if (empty($orders)) {
                return Result::paginated([], 0, $page, $pageSize);
            }

            // 获取用户信息
            $userIds = array_values(array_unique(array_filter(array_column($orders, 'user_id'))));
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

            // 获取每个订单的照片和视频数量
            $orderIds = array_column($orders, 'id');
            $photoCounts = $this->getPhotoCounts($orderIds);
            $videoCounts = $this->getVideoCounts($orderIds);

            // 组装返回数据
            $items = [];
            foreach ($orders as $order) {
                $user = $userMap[$order['user_id']] ?? [];

                // 解析故障图片，修复小程序上传路径
                $images = DataHelper::fixOrderFaultImages($order);

                $items[] = [
                    'id' => $order['id'],
                    'order_id' => $order['order_id'] ?? '',
                    'order_type' => $order['order_type'] ?? 'repair',
                    'device_type' => $order['device_type'] ?? 0,
                    'device_model' => $order['device_model'] ?? '',
                    'brand_name' => $order['brand_name'] ?? '',
                    'problem_description' => $order['problem_description'] ?? '',
                    'custom_description' => $order['custom_description'] ?? '',
                    'status' => $order['status'] ?? 'pending',
                    'progress' => (int)($order['progress'] ?? 0),
                    'user_id' => $order['user_id'],
                    'user_name' => $user['nickname'] ?? ($user['real_name'] ?? ''),
                    'user_phone' => $user['phone'] ?? '',
                    'created_at' => $order['created_at'] ?? '',
                    'updated_at' => $order['updated_at'] ?? '',
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
     * 解析订单ID（支持订单ID或订单号查询）
     * 支持字符串类型的订单ID（包含字母数字混合）
     */
    private function resolveOrderIds(string $orderId, string $orderNo): ?array
    {
        if ($orderId === '' && $orderNo === '') {
            return null;
        }

        // 优先通过订单ID查询（支持字符串类型）
        $query = Db::connect('repair')->name('orders')->field('id');
        if ($orderId !== '') {
            // 如果orderId看起来像是纯数字，使用id字段查询
            // 否则使用order_id字段查询
            if (is_numeric($orderId)) {
                $query->where('id', (int) $orderId);
            } else {
                $query->where('order_id', $orderId);
            }
        }
        if ($orderNo !== '') {
            $query->whereLike('order_id', '%' . $orderNo . '%');
        }

        return $query->column('id');
    }

    /**
     * 获取订单信息
     * 支持字符串和数字类型的订单ID
     */
    private function getOrders(array $orderIds): array
    {
        if (empty($orderIds)) {
            return [];
        }

        // 使用原始order_id进行查询，不做类型转换
        $orders = Db::connect('repair')
            ->name('orders')
            ->whereIn('id', array_values(array_unique($orderIds)))
            ->field('id,order_id,device_model,device_type,user_id')
            ->select()
            ->toArray();

        $userIds = array_values(array_unique(array_filter(array_column($orders, 'user_id'))));

        $users = [];
        if ($userIds) {
            foreach (Db::connect('repair')->name('users')->whereIn('id', $userIds)->field('id,nickname,real_name,phone')->select()->toArray() as $u) {
                $users[(int) $u['id']] = $u;
            }
        }

        $map = [];
        foreach ($orders as $o) {
            $u = $users[(int) ($o['user_id'] ?? 0)] ?? [];
            $o['user_name'] = $u['nickname'] ?? ($u['real_name'] ?? '');
            // 使用原始id作为key
            $map[$o['id']] = $o;
        }

        return $map;
    }

    /**
     * 获取照片数量统计
     */
    private function getPhotoCounts(array $orderIds): array
    {
        if (empty($orderIds)) {
            return [];
        }

        $counts = Db::connect('repair')->name('order_progress_photos')
            ->whereIn('order_id', $orderIds)
            ->field('order_id,COUNT(*) as count')
            ->group('order_id')
            ->select()
            ->toArray();

        $map = [];
        foreach ($counts as $item) {
            $map[$item['order_id']] = (int) $item['count'];
        }

        return $map;
    }

    /**
     * 获取视频数量统计
     */
    private function getVideoCounts(array $orderIds): array
    {
        if (empty($orderIds)) {
            return [];
        }

        $counts = Db::connect('repair')->name('order_progress_videos')
            ->whereIn('order_id', $orderIds)
            ->field('order_id,COUNT(*) as count')
            ->group('order_id')
            ->select()
            ->toArray();

        $map = [];
        foreach ($counts as $item) {
            $map[$item['order_id']] = (int) $item['count'];
        }

        return $map;
    }

    /**
     * 生成反馈组ID，用于关联同一次提交的照片和视频
     */
    private function generateFeedbackGroupId(): string
    {
        return 'fb_' . round(microtime(true) * 1000) . '_' . substr(md5(uniqid((string) mt_rand(), true)), 0, 9);
    }

    /**
     * 统一媒体路径到 progress 目录，并在需要时搬移物理文件
     */
    private function normalizeProgressMediaPaths(array $paths, string $orderId): array
    {
        $normalized = [];
        foreach ($paths as $path) {
            $normalized[] = $this->normalizeProgressMediaPath((string) $path, $orderId);
        }
        return $normalized;
    }

    private function normalizeProgressMediaPath(string $path, string $orderId): string
    {
        $path = trim($path);
        if ($path === '' || $orderId === '') {
            return $path;
        }

        if (strpos($path, '/uploads/progress/') === 0) {
            $this->ensureProgressMediaAccessible($path);
            return $path;
        }

        if (strpos($path, '/uploads/general/') !== 0) {
            return $path;
        }

        $filename = basename($path);
        if ($filename === '' || $filename === '.' || $filename === '..') {
            return $path;
        }

        $targetRelativePath = '/uploads/progress/' . $orderId . '/' . $filename;
        $sourceFile = public_path() . ltrim(str_replace('/', DIRECTORY_SEPARATOR, $path), DIRECTORY_SEPARATOR);
        $targetFile = public_path() . ltrim(str_replace('/', DIRECTORY_SEPARATOR, $targetRelativePath), DIRECTORY_SEPARATOR);
        $targetDir = dirname($targetFile);

        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        if (is_file($sourceFile) && $sourceFile !== $targetFile) {
            if (!is_file($targetFile)) {
                @rename($sourceFile, $targetFile);
            } else {
                @unlink($sourceFile);
            }
        }

        $this->ensureProgressMediaAccessible($targetRelativePath);
        return $targetRelativePath;
    }

    /**
     * 确保 progress 媒体文件在当前后台 public/uploads 下可访问
     */
    private function ensureProgressMediaAccessible(string $relativePath): void
    {
        if (strpos($relativePath, '/uploads/progress/') !== 0) {
            return;
        }

        $normalizedRelativePath = ltrim(str_replace('/', DIRECTORY_SEPARATOR, $relativePath), DIRECTORY_SEPARATOR);
        $publicFile = public_path() . $normalizedRelativePath;
        if (is_file($publicFile)) {
            return;
        }

        $sourceFile = 'D:\\maintain\\电子维修2.0\\uploads' . DIRECTORY_SEPARATOR
            . ltrim(str_replace('/uploads/progress/', 'progress' . DIRECTORY_SEPARATOR, $relativePath), '/\\');

        if (!is_file($sourceFile)) {
            return;
        }

        $targetDir = dirname($publicFile);
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        @copy($sourceFile, $publicFile);
    }
}
