<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

/**
 * 小程序数据同步控制器
 * 将小程序数据库的维修进度、照片、视频同步到CMMS后台
 */
class MiniprogramDataSyncController extends BaseController
{
    /**
     * 同步小程序维修进度到CMMS后台
     */
    public function syncProgress()
    {
        try {
            // 从小程序数据库获取有进度的订单
            $miniprogramOrders = Db::connect('repair')
                ->name('orders')
                ->where('progress', '>', 0)
                ->field('id, order_id, progress, status, assigned_to, assigned_at')
                ->select()
                ->toArray();

            $syncCount = 0;
            $errorCount = 0;
            $errors = [];

            foreach ($miniprogramOrders as $mpOrder) {
                try {
                    $mpOrderId = (int) $mpOrder['id'];
                    $progress = (int) $mpOrder['progress'];
                    $mpStatus = $mpOrder['status'] ?? 'pending';

                    // 获取或创建CMMS订单映射
                    $cmmsOrderId = $this->getCmmsOrderId($mpOrderId, $mpOrder);

                    if (!$cmmsOrderId) {
                        $errors[] = "订单 {$mpOrder['order_id']} 无法创建CMMS订单";
                        $errorCount++;
                        continue;
                    }

                    // 确定进度阶段
                    $stage = $this->getProgressStage($progress);

                    // 检查是否已存在该阶段的进度记录
                    $existingProgress = Db::name('repair_progress')
                        ->where('order_id', $cmmsOrderId)
                        ->where('stage', $stage)
                        ->find();

                    if ($existingProgress) {
                        // 更新现有记录
                        Db::name('repair_progress')
                            ->where('id', $existingProgress['id'])
                            ->update([
                                'progress' => $progress,
                                'status' => $this->getStatus($mpStatus, $progress),
                                'updated_at' => date('Y-m-d H:i:s')
                            ]);
                    } else {
                        // 创建新的进度记录
                        Db::name('repair_progress')->insert([
                            'order_id' => $cmmsOrderId,
                            'stage' => $stage,
                            'stage_name' => $stage,
                            'status' => $this->getStatus($mpStatus, $progress),
                            'progress' => $progress,
                            'description' => $this->getProgressDescription($progress),
                            'handler_id' => $mpOrder['assigned_to'] ?? null,
                            'handler_name' => $this->getHandlerName($mpOrder['assigned_to'] ?? 0),
                            'start_time' => $mpOrder['assigned_at'] ?? null,
                            'source' => 'miniprogram',
                            'created_at' => date('Y-m-d H:i:s'),
                            'updated_at' => date('Y-m-d H:i:s')
                        ]);
                    }

                    $syncCount++;
                } catch (\Exception $e) {
                    $errorCount++;
                    $errors[] = "订单 {$mpOrder['order_id']} 同步失败: " . $e->getMessage();
                }
            }

            return Result::success([
                'total' => count($miniprogramOrders),
                'synced' => $syncCount,
                'failed' => $errorCount,
                'errors' => array_slice($errors, 0, 10)
            ], "同步完成：成功 {$syncCount} 条，失败 {$errorCount} 条");
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 同步小程序维修进度照片到CMMS后台
     */
    public function syncProgressPhotos()
    {
        try {
            // 从小程序数据库获取所有进度照片
            $miniprogramPhotos = Db::connect('repair')
                ->name('order_progress_photos')
                ->field('id, order_id, description, images, uploaded_by, uploaded_by_name, created_at')
                ->select()
                ->toArray();

            $syncCount = 0;
            $errorCount = 0;
            $errors = [];

            foreach ($miniprogramPhotos as $mpPhoto) {
                try {
                    $mpOrderId = (int) $mpPhoto['order_id'];

                    // 获取CMMS订单ID
                    $cmmsOrderId = $this->getCmmsOrderIdFromMapping($mpOrderId);
                    if (!$cmmsOrderId) {
                        // 如果没有映射，尝试创建
                        $mpOrder = Db::connect('repair')
                            ->name('orders')
                            ->where('id', $mpOrderId)
                            ->find();

                        if ($mpOrder) {
                            $cmmsOrderId = $this->getCmmsOrderId($mpOrderId, $mpOrder);
                        }
                    }

                    if (!$cmmsOrderId) {
                        $errors[] = "照片 ID {$mpPhoto['id']} 无法获取CMMS订单ID";
                        $errorCount++;
                        continue;
                    }

                    // 解析图片JSON
                    $images = is_array($mpPhoto['images']) ? $mpPhoto['images'] : json_decode($mpPhoto['images'], true);
                    if (!$images) {
                        $errors[] = "照片 ID {$mpPhoto['id']} 图片数据无效";
                        $errorCount++;
                        continue;
                    }

                    // 检查是否已同步过
                    $existingPhoto = Db::name('progress_photo')
                        ->where('order_id', $cmmsOrderId)
                        ->where('uploaded_by', $mpPhoto['uploaded_by'])
                        ->where('created_at', $mpPhoto['created_at'])
                        ->find();

                    if (!$existingPhoto) {
                        // 插入新的照片记录
                        Db::name('progress_photo')->insert([
                            'order_id' => $cmmsOrderId,
                            'description' => $mpPhoto['description'] ?? '维修进度照片',
                            'images' => json_encode($images, JSON_UNESCAPED_UNICODE),
                            'uploaded_by' => $mpPhoto['uploaded_by'] ?? null,
                            'uploaded_by_name' => $mpPhoto['uploaded_by_name'] ?? '',
                            'created_at' => $mpPhoto['created_at'] ?? date('Y-m-d H:i:s'),
                            'updated_at' => $mpPhoto['created_at'] ?? date('Y-m-d H:i:s')
                        ]);
                        $syncCount++;
                    } else {
                        // 更新现有记录
                        Db::name('progress_photo')
                            ->where('id', $existingPhoto['id'])
                            ->update([
                                'description' => $mpPhoto['description'] ?? '维修进度照片',
                                'images' => json_encode($images, JSON_UNESCAPED_UNICODE),
                                'updated_at' => date('Y-m-d H:i:s')
                            ]);
                        $syncCount++;
                    }
                } catch (\Exception $e) {
                    $errorCount++;
                    $errors[] = "照片 ID {$mpPhoto['id']} 同步失败: " . $e->getMessage();
                }
            }

            return Result::success([
                'total' => count($miniprogramPhotos),
                'synced' => $syncCount,
                'failed' => $errorCount,
                'errors' => array_slice($errors, 0, 10)
            ], "同步完成：成功 {$syncCount} 条，失败 {$errorCount} 条");
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 同步小程序维修进度视频到CMMS后台
     */
    public function syncProgressVideos()
    {
        try {
            // 从小程序数据库获取所有进度视频
            $miniprogramVideos = Db::connect('repair')
                ->name('order_progress_videos')
                ->field('id, order_id, video_title, description, video_url, cover_url, duration, file_size, uploaded_by, uploaded_by_name, created_at')
                ->select()
                ->toArray();

            $syncCount = 0;
            $errorCount = 0;
            $errors = [];

            foreach ($miniprogramVideos as $mpVideo) {
                try {
                    $mpOrderId = (int) $mpVideo['order_id'];

                    // 获取CMMS订单ID
                    $cmmsOrderId = $this->getCmmsOrderIdFromMapping($mpOrderId);
                    if (!$cmmsOrderId) {
                        // 如果没有映射，尝试创建
                        $mpOrder = Db::connect('repair')
                            ->name('orders')
                            ->where('id', $mpOrderId)
                            ->find();

                        if ($mpOrder) {
                            $cmmsOrderId = $this->getCmmsOrderId($mpOrderId, $mpOrder);
                        }
                    }

                    if (!$cmmsOrderId) {
                        $errors[] = "视频 ID {$mpVideo['id']} 无法获取CMMS订单ID";
                        $errorCount++;
                        continue;
                    }

                    // 检查是否已同步过
                    $existingVideo = Db::name('progress_video')
                        ->where('order_id', $cmmsOrderId)
                        ->where('video_url', $mpVideo['video_url'])
                        ->find();

                    if (!$existingVideo) {
                        // 插入新的视频记录
                        Db::name('progress_video')->insert([
                            'order_id' => $cmmsOrderId,
                            'video_title' => $mpVideo['video_title'] ?? '维修进度视频',
                            'description' => $mpVideo['description'] ?? '',
                            'video_url' => $mpVideo['video_url'],
                            'cover_url' => $mpVideo['cover_url'] ?? '',
                            'duration' => (int) ($mpVideo['duration'] ?? 0),
                            'file_size' => (int) ($mpVideo['file_size'] ?? 0),
                            'uploaded_by' => $mpVideo['uploaded_by'] ?? null,
                            'uploaded_by_name' => $mpVideo['uploaded_by_name'] ?? '',
                            'created_at' => $mpVideo['created_at'] ?? date('Y-m-d H:i:s'),
                            'updated_at' => $mpVideo['created_at'] ?? date('Y-m-d H:i:s')
                        ]);
                        $syncCount++;
                    } else {
                        // 更新现有记录
                        Db::name('progress_video')
                            ->where('id', $existingVideo['id'])
                            ->update([
                                'video_title' => $mpVideo['video_title'] ?? '维修进度视频',
                                'description' => $mpVideo['description'] ?? '',
                                'video_url' => $mpVideo['video_url'],
                                'cover_url' => $mpVideo['cover_url'] ?? '',
                                'duration' => (int) ($mpVideo['duration'] ?? 0),
                                'file_size' => (int) ($mpVideo['file_size'] ?? 0),
                                'updated_at' => date('Y-m-d H:i:s')
                            ]);
                        $syncCount++;
                    }
                } catch (\Exception $e) {
                    $errorCount++;
                    $errors[] = "视频 ID {$mpVideo['id']} 同步失败: " . $e->getMessage();
                }
            }

            return Result::success([
                'total' => count($miniprogramVideos),
                'synced' => $syncCount,
                'failed' => $errorCount,
                'errors' => array_slice($errors, 0, 10)
            ], "同步完成：成功 {$syncCount} 条，失败 {$errorCount} 条");
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 同步所有数据
     */
    public function syncAll()
    {
        $results = [
            'progress' => null,
            'photos' => null,
            'videos' => null
        ];

        try {
            // 同步进度
            $progressResult = $this->syncProgress();
            $results['progress'] = json_decode($progressResult->getContent(), true);

            // 同步照片
            $photoResult = $this->syncProgressPhotos();
            $results['photos'] = json_decode($photoResult->getContent(), true);

            // 同步视频
            $videoResult = $this->syncProgressVideos();
            $results['videos'] = json_decode($videoResult->getContent(), true);

            return Result::success($results, '全部数据同步完成');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取CMMS订单ID
     */
    private function getCmmsOrderId($mpOrderId, $mpOrder): ?int
    {
        // 查找现有映射
        $mapping = Db::name('miniprogram_order_mapping')
            ->where('miniprogram_order_id', $mpOrderId)
            ->find();

        if ($mapping && !empty($mapping['cmms_order_id'])) {
            return (int) $mapping['cmms_order_id'];
        }

        // 创建新的CMMS订单
        $cmmsOrderId = $this->createCmmsOrder($mpOrder);

        // 创建映射
        if ($mapping) {
            Db::name('miniprogram_order_mapping')
                ->where('id', $mapping['id'])
                ->update([
                    'cmms_order_id' => $cmmsOrderId,
                    'sync_status' => 'synced',
                    'last_synced_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
        } else {
            Db::name('miniprogram_order_mapping')->insert([
                'miniprogram_order_id' => $mpOrderId,
                'miniprogram_order_no' => $mpOrder['order_id'] ?? '',
                'cmms_order_id' => $cmmsOrderId,
                'sync_status' => 'synced',
                'last_synced_at' => date('Y-m-d H:i:s'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
        }

        return $cmmsOrderId;
    }

    /**
     * 从映射表获取CMMS订单ID
     */
    private function getCmmsOrderIdFromMapping($mpOrderId): ?int
    {
        $mapping = Db::name('miniprogram_order_mapping')
            ->where('miniprogram_order_id', $mpOrderId)
            ->find();

        if (!$mapping || empty($mapping['cmms_order_id'])) {
            return null;
        }

        return (int) $mapping['cmms_order_id'];
    }

    /**
     * 创建CMMS订单
     */
    private function createCmmsOrder($mpOrder): int
    {
        // 尝试从work_orders创建关联订单
        try {
            $orderId = Db::name('work_orders')->insertGetId([
                'order_no' => $mpOrder['order_id'] ?? 'MP' . $mpOrder['id'],
                'title' => '小程序同步订单',
                'device_id' => 0,
                'reporter_id' => 1,
                'assigned_to' => $mpOrder['assigned_to'] ?? null,
                'fault_type' => '维修',
                'fault_description' => $mpOrder['problem_description'] ?? '',
                'priority' => 2,
                'status' => $this->mapOrderStatus($mpOrder['status'] ?? 'pending'),
                'start_time' => $mpOrder['assigned_at'] ?? null,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);

            return $orderId;
        } catch (\Exception $e) {
            // 如果work_orders创建失败，创建一个简单的映射记录
            // 使用负数ID表示这是临时映射
            return -$mpOrder['id'];
        }
    }

    /**
     * 获取进度阶段
     */
    private function getProgressStage($progress): string
    {
        if ($progress >= 100) return '维修完成';
        if ($progress >= 80) return '测试验收';
        if ($progress >= 60) return '维修实施';
        if ($progress >= 40) return '配件准备';
        if ($progress >= 20) return '故障诊断';
        return '接单确认';
    }

    /**
     * 获取进度描述
     */
    private function getProgressDescription($progress): string
    {
        if ($progress >= 100) return '维修完成，等待客户确认';
        if ($progress >= 80) return '进行功能测试和质量验收';
        if ($progress >= 60) return '进行维修操作';
        if ($progress >= 40) return '准备维修所需配件和工具';
        if ($progress >= 20) return '诊断故障原因';
        return '已接单，准备开始处理';
    }

    /**
     * 获取状态
     */
    private function getStatus($mpStatus, $progress): string
    {
        if ($progress >= 100) return 'completed';
        if ($progress > 0) return 'in_progress';
        return 'pending';
    }

    /**
     * 映射订单状态
     */
    private function mapOrderStatus($mpStatus): int
    {
        $statusMap = [
            'pending' => 0,
            'processing' => 2,
            'completed' => 4,
            'cancelled' => 5
        ];
        return $statusMap[$mpStatus] ?? 0;
    }

    /**
     * 获取处理人姓名
     */
    private function getHandlerName($handlerId): string
    {
        if (!$handlerId) return '';

        try {
            $user = Db::connect('repair')
                ->name('users')
                ->where('id', $handlerId)
                ->field('nickname, real_name')
                ->find();

            return $user['real_name'] ?? $user['nickname'] ?? '';
        } catch (\Exception $e) {
            return '';
        }
    }
}
