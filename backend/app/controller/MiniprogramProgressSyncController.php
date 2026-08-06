<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

/**
 * 小程序维修进度同步控制器
 * 负责将小程序的维修进度、照片、视频同步到CMMS后台管理系统
 */
class MiniprogramProgressSyncController extends BaseController
{
    /**
     * 同步小程序订单进度到CMMS
     *   {
     *   "miniprogram_order_id": 1,
     *   "progress": 50,
     *   "status": "processing"
     * }
     */
    public function syncProgress()
    {
        $data = $this->getRequestData();

        if (empty($data['miniprogram_order_id'])) {
            return Result::error('小程序订单ID不能为空', 400);
        }
        if (!isset($data['progress'])) {
            return Result::error('进度值不能为空', 400);
        }

        $mpOrderId = (int) $data['miniprogram_order_id'];
        $progress = (int) $data['progress'];
        $status = $data['status'] ?? '';

        try {
            // 获取小程序订单信息
            $mpOrder = Db::connect('repair')->name('orders')->find($mpOrderId);
            if (!$mpOrder) {
                return Result::error('小程序订单不存在', 404);
            }

            Db::startTrans();
            try {
                // 查找或创建订单映射
                $mapping = Db::name('miniprogram_order_mapping')
                    ->where('miniprogram_order_id', $mpOrderId)
                    ->find();

                if (!$mapping) {
                    // 如果没有CMMS订单，先创建一个虚拟的CMMS订单
                    $cmmsOrderId = $this->createCmmsOrder($mpOrder);
                    $mapping = [
                        'miniprogram_order_id' => $mpOrderId,
                        'miniprogram_order_no' => $mpOrder['order_id'] ?? '',
                        'cmms_order_id' => $cmmsOrderId,
                        'sync_status' => 'synced',
                        'last_synced_at' => date('Y-m-d H:i:s'),
                        'created_at' => date('Y-m-d H:i:s'),
                        'updated_at' => date('Y-m-d H:i:s')
                    ];
                    Db::name('miniprogram_order_mapping')->insert($mapping);
                } elseif (empty($mapping['cmms_order_id'])) {
                    $cmmsOrderId = $this->createCmmsOrder($mpOrder);
                    Db::name('miniprogram_order_mapping')
                        ->where('id', $mapping['id'])
                        ->update([
                            'cmms_order_id' => $cmmsOrderId,
                            'sync_status' => 'synced',
                            'last_synced_at' => date('Y-m-d H:i:s'),
                            'updated_at' => date('Y-m-d H:i:s')
                        ]);
                    $mapping['cmms_order_id'] = $cmmsOrderId;
                }

                $cmmsOrderId = (int) $mapping['cmms_order_id'];

                // 同步进度到repair_progress表
                $existingProgress = Db::name('repair_progress')
                    ->where('order_id', $cmmsOrderId)
                    ->where('source', 'miniprogram')
                    ->find();

                if ($existingProgress) {
                    // 更新现有进度
                    Db::name('repair_progress')->where('id', $existingProgress['id'])->update([
                        'progress' => $progress,
                        'description' => $this->getStatusDescription($progress, $status),
                        'updated_at' => date('Y-m-d H:i:s')
                    ]);
                } else {
                    // 创建新的进度记录
                    Db::name('repair_progress')->insert([
                        'order_id' => $cmmsOrderId,
                        'stage' => '维修进度',
                        'stage_name' => '小程序同步进度',
                        'status' => $progress >= 100 ? 'completed' : 'in_progress',
                        'progress' => $progress,
                        'description' => $this->getStatusDescription($progress, $status),
                        'source' => 'miniprogram',
                        'created_at' => date('Y-m-d H:i:s'),
                        'updated_at' => date('Y-m-d H:i:s')
                    ]);
                }

                // 记录同步日志
                Db::name('miniprogram_progress_sync')->insert([
                    'miniprogram_order_id' => $mpOrderId,
                    'progress' => $progress,
                    'status' => $status,
                    'synced_to_cmms' => 1,
                    'synced_at' => date('Y-m-d H:i:s'),
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);

                Db::commit();

                return Result::success([
                    'miniprogram_order_id' => $mpOrderId,
                    'cmms_order_id' => $cmmsOrderId,
                    'progress' => $progress,
                    'synced_at' => date('Y-m-d H:i:s')
                ], '进度同步成功');
            } catch (\Exception $e) {
                Db::rollback();
                throw $e;
            }
        } catch (\Exception $e) {
            return Result::error('同步失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 同步小程序进度照片到CMMS
     *   {
     *   "miniprogram_order_id": 1,
     *   "description": "维修进度照片",
     *   "images": ["url1", "url2"],
     *   "uploaded_by": 1,
     *   "uploaded_by_name": "张三"
     * }
     */
    public function syncProgressPhoto()
    {
        $data = $this->getRequestData();

        if (empty($data['miniprogram_order_id'])) {
            return Result::error('小程序订单ID不能为空', 400);
        }
        if (empty($data['images']) || !is_array($data['images'])) {
            return Result::error('照片不能为空', 400);
        }

        $mpOrderId = (int) $data['miniprogram_order_id'];
        $description = $data['description'] ?? '';
        $images = $data['images'];
        $uploadedBy = $data['uploaded_by'] ?? null;
        $uploadedByName = $data['uploaded_by_name'] ?? '';

        try {
            // 获取CMMS订单ID
            $cmmsOrderId = $this->getCmmsOrderId($mpOrderId);
            if (!$cmmsOrderId) {
                return Result::error('无法获取CMMS订单ID，请先同步订单', 400);
            }

            // 同步到progress_photo表
            $insertData = [
                'order_id' => $cmmsOrderId,
                'description' => $description,
                'images' => json_encode($images, JSON_UNESCAPED_UNICODE),
                'uploaded_by' => $uploadedBy,
                'uploaded_by_name' => $uploadedByName,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];
            $photoId = Db::name('progress_photo')->insertGetId($insertData);

            // 记录同步日志
            Db::name('miniprogram_progress_photo_sync')->insert([
                'miniprogram_order_id' => $mpOrderId,
                'description' => $description,
                'images' => json_encode($images, JSON_UNESCAPED_UNICODE),
                'uploaded_by' => $uploadedBy,
                'uploaded_by_name' => $uploadedByName,
                'synced_to_cmms' => 1,
                'cmms_progress_photo_id' => $photoId,
                'synced_at' => date('Y-m-d H:i:s'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);

            return Result::success([
                'miniprogram_order_id' => $mpOrderId,
                'cmms_order_id' => $cmmsOrderId,
                'cmms_progress_photo_id' => $photoId,
                'synced_at' => date('Y-m-d H:i:s')
            ], '进度照片同步成功');
        } catch (\Exception $e) {
            return Result::error('同步失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 同步进度视频到CMMS
     *   {
     *   "miniprogram_order_id": 1,
     *   "video_title": "维修过程视频",
     *   "description": "维修过程说明",
     *   "video_url": "video_url",
     *   "cover_url": "cover_url",
     *   "duration": 120,
     *   "file_size": 1024000,
     *   "uploaded_by": 1,
     *   "uploaded_by_name": "张三"
     * }
     */
    public function syncProgressVideo()
    {
        $data = $this->getRequestData();

        if (empty($data['miniprogram_order_id'])) {
            return Result::error('小程序订单ID不能为空', 400);
        }
        if (empty($data['video_title'])) {
            return Result::error('视频标题不能为空', 400);
        }
        if (empty($data['video_url'])) {
            return Result::error('视频URL不能为空', 400);
        }

        $mpOrderId = (int) $data['miniprogram_order_id'];

        try {
            // 获取CMMS订单ID
            $cmmsOrderId = $this->getCmmsOrderId($mpOrderId);
            if (!$cmmsOrderId) {
                return Result::error('无法获取CMMS订单ID，请先从小程序订单同步', 400);
            }

            // 同步到progress_video表
            $insertData = [
                'order_id' => $cmmsOrderId,
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
            $videoId = Db::name('progress_video')->insertGetId($insertData);

            // 记录同步日志
            Db::name('miniprogram_progress_video_sync')->insert([
                'miniprogram_order_id' => $mpOrderId,
                'video_title' => $insertData['video_title'],
                'description' => $insertData['description'],
                'video_url' => $insertData['video_url'],
                'cover_url' => $insertData['cover_url'],
                'duration' => $insertData['duration'],
                'file_size' => $insertData['file_size'],
                'uploaded_by' => $insertData['uploaded_by'],
                'uploaded_by_name' => $insertData['uploaded_by_name'],
                'synced_to_cmms' => 1,
                'cmms_progress_video_id' => $videoId,
                'synced_at' => date('Y-m-d H:i:s'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);

            return Result::success([
                'miniprogram_order_id' => $mpOrderId,
                'cmms_order_id' => $cmmsOrderId,
                'cmms_progress_video_id' => $videoId,
                'synced_at' => date('Y-m-d H:i:s')
            ], '进度视频同步成功');
        } catch (\Exception $e) {
            return Result::error('同步失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 获取小程序订单在CMMS中的进度、照片、视频
     * GET /api/miniprogram-progress/:orderId
     */
    public function getMiniprogramOrderProgress($orderId)
    {
        try {
            $mpOrderId = (int) $orderId;

            // 获取CMMS订单ID
            $mapping = Db::name('miniprogram_order_mapping')
                ->where('miniprogram_order_id', $mpOrderId)
                ->find();

            if (!$mapping || empty($mapping['cmms_order_id'])) {
                return Result::success([
                    'miniprogram_order_id' => $mpOrderId,
                    'cmms_order_id' => null,
                    'progress' => [],
                    'photos' => [],
                    'videos' => []
                ]);
            }

            $cmmsOrderId = (int) $mapping['cmms_order_id'];

            // 获取进度记录
            $progressList = Db::name('repair_progress')
                ->where('order_id', $cmmsOrderId)
                ->where('source', 'miniprogram')
                ->order('id', 'desc')
                ->select()
                ->toArray();

            // 获取照片记录
            $photoList = Db::name('progress_photo')
                ->where('order_id', $cmmsOrderId)
                ->order('id', 'desc')
                ->select()
                ->toArray();
            foreach ($photoList as &$photo) {
                $photo['photos'] = $photo['images'] ? json_decode($photo['images'], true) : [];
                $photo['photo_count'] = count($photo['photos']);
            }

            // 获取视频记录
            $videoList = Db::name('progress_video')
                ->where('order_id', $cmmsOrderId)
                ->order('id', 'desc')
                ->select()
                ->toArray();

            return Result::success([
                'miniprogram_order_id' => $mpOrderId,
                'cmms_order_id' => $cmmsOrderId,
                'progress' => $progressList,
                'photos' => $photoList,
                'videos' => $videoList
            ]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取CMMS订单ID
     */
    private function getCmmsOrderId($mpOrderId): ?int
    {
        $mapping = Db::name('miniprogram_order_mapping')
            ->where('miniprogram_order_id', $mpOrderId)
            ->find();

        if (!$mapping) {
            return null;
        }

        return (int) ($mapping['cmms_order_id'] ?? 0) ?: null;
    }

    /**
     * 创建CMMS订单（虚拟订单）
     */
    private function createCmmsOrder($mpOrder): int
    {
        // 从work_orders表创建关联订单，或者创建一个虚拟订单记录
        $orderId = Db::name('work_orders')->insertGetId([
            'order_no' => $mpOrder['order_id'] ?? '',
            'title' => '小程序同步订单',
            'device_id' => 0,
            'priority' => 2,
            'status' => 1,
            'description' => $mpOrder['problem_description'] ?? '',
            'created_by' => 1,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);

        return $orderId;
    }

    /**
     * 根据进度获取描述
     */
    private function getStatusDescription($progress, $status): string
    {
        if ($progress >= 100) return '维修已完成';
        if ($progress >= 80) return '最后测试验收阶段';
        if ($progress >= 60) return '维修实施阶段';
        if ($progress >= 40) return '配件准备阶段';
        if ($progress >= 20) return '故障诊断阶段';
        if ($progress > 0) return '开始处理订单';

        $statusMap = [
            'pending' => '待处理',
            'processing' => '维修中',
            'completed' => '已完成',
            'review' => '待评价',
            'cancelled' => '已取消'
        ];

        return $statusMap[$status] ?? '待处理';
    }
}
