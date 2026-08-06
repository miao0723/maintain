<?php

/**
 * 小程序数据同步脚本
 * 将小程序数据库中的维修进度、照片、视频同步到CMMS后台
 *
 * 使用方法：
 * php sync_miniprogram_data.php
 * php sync_miniprogram_data.php --type=progress    // 只同步进度
 * php sync_miniprogram_data.php --type=photos    // 只同步照片
 * php sync_miniprogram_data.php --type=videos    // 只同步视频
 */

// 切换到项目根目录
chdir(dirname(__DIR__) . '/..');

// 引入应用启动文件
require __DIR__ . '/../vendor/autoload.php';

use think\facade\Db;

// 解析命令行参数
$options = getopt('', ['type::', 'help']);

if (isset($options['help'])) {
    echo "小程序数据同步脚本\n";
    echo "使用方法：\n";
    echo "  php sync_miniprogram_data.php              // 同步所有数据\n";
    echo "  php sync_miniprogram_data.php --type=progress  // 只同步进度\n";
    echo "  php sync_miniprogram_data.php --type=photos   // 只同步照片\n";
    echo "  php sync_miniprogram_data.php --type=videos   // 只同步视频\n";
    echo "  php sync_miniprogram_data.php --help          // 显示帮助信息\n";
    exit(0);
}

$syncType = $options['type'] ?? 'all';

echo "========================================\n";
echo "小程序数据同步\n";
echo "同步类型: " . strtoupper($syncType) . "\n";
echo "开始时间: " . date('Y-m-d H:i:s') . "\n";
echo "========================================\n\n";

$results = [];

try {
    // 同步维修进度
    if ($syncType === 'all' || $syncType === 'progress') {
        echo "[1/3] 开始同步维修进度...\n";
        $results['progress'] = syncProgress();
        echo "维修进度同步完成\n\n";
    }

    // 同步进度照片
    if ($syncType === 'all' || $syncType === 'photos') {
        echo "[2/3] 开始同步进度照片...\n";
        $results['photos'] = syncPhotos();
        echo "进度照片同步完成\n\n";
    }

    // 同步进度视频
    if ($syncType === 'all' || $syncType === 'videos') {
        echo "[3/3] 开始同步进度视频...\n";
        $results['videos'] = syncVideos();
        echo "进度视频同步完成\n\n";
    }

    echo "========================================\n";
    echo "同步完成！\n";
    echo "结束时间: " . date('Y-m-d H:i:s') . "\n";
    echo "========================================\n\n";

    // 显示详细结果
    foreach ($results as $type => $result) {
        echo strtoupper($type) . " 同步结果:\n";
        echo "  总记录数: {$result['total']}\n";
        echo "  成功: {$result['synced']}\n";
        echo "  失败: {$result['failed']}\n";

        if (!empty($result['errors'])) {
            echo "  错误信息:\n";
            foreach ($result['errors'] as $error) {
                echo "    - {$error}\n";
            }
        }
        echo "\n";
    }

} catch (\Exception $e) {
    echo "\n错误: " . $e->getMessage() . "\n";
    echo "堆栈: " . $e->getTraceAsString() . "\n";
    exit(1);
}

/**
 * 同步维修进度
 */
function syncProgress(): array
{
    $total = 0;
    $synced = 0;
    $failed = 0;
    $errors = [];

    try {
        // 从小程序数据库获取有进度的订单
        $miniprogramOrders = Db::connect('repair')
            ->name('orders')
            ->where('progress', '>', 0)
            ->field('id, order_id, progress, status, asusigned_to, asusigned_at')
            ->select()
            ->toArray();

        $total = count($miniprogramOrders);

        foreach ($miniprogramOrders as $mpOrder) {
            try {
                $mpOrderId = (int) $mpOrder['id'];
                $progress = (int) $mpOrder['progress'];
                $mpStatus = $mpOrder['status'] ?? 'pending';

                // 获取或创建CMMS订单映射
                $cmmsOrderId = getCmmsOrderId($mpOrderId, $mpOrder);

                if (!$cmmsOrderId) {
                    $errors[] = "订单 {$mpOrder['order_id']} 无法创建CMMS订单";
                    $failed++;
                    continue;
                }

                // 确定进度阶段
                $stage = getProgressStage($progress);

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
                            'status' => getStatus($mpStatus, $progress),
                            'updated_at' => date('Y-m-d H:i:s')
                        ]);
                } else {
                    // 创建新的进度记录
                    Db::name('repair_progress')->insert([
                        'order_id' => $cmmsOrderId,
                        'stage' => $stage,
                        'stage_name' => $stage,
                        'status' => getStatus($mpStatus, $progress),
                        'progress' => $progress,
                        'description' => getProgressDescription($progress),
                        'handler_id' => $mpOrder['asusigned_to'] ?? null,
                        'handler_name' => getHandlerName($mpOrder['asusigned_to'] ?? 0),
                        'start_time' => $mpOrder['asusigned_at'] ?? null,
                        'source' => 'miniprogram',
                        'created_at' => date('Y-m-d H:i:s'),
                        'updated_at' => date('Y-m-d H:i:s')
                    ]);
                }

                $synced++;
                echo "  ✓ 订单 {$mpOrder['order_id']} 进度 {$progress}% 同步成功\n";
            } catch (\Exception $e) {
                $failed++;
                $errors[] = "订单 {$mpOrder['order_id']} 同步失败: " . $e->getMessage();
                echo "  ✗ 订单 {$mpOrder['order_id']} 同步失败: " . $e->getMessage() . "\n";
            }
        }
    } catch (\Exception $e) {
        throw new \Exception("同步进度失败: " . $e->getMessage());
    }

    return [
        'total' => $total,
        'synced' => $synced,
        'failed' => $failed,
        'errors' => $errors
    ];
}

/**
 * 同步进度照片
 */
function syncPhotos(): array
{
    $total = 0;
    $synced = 0;
    $failed = 0;
    $errors = [];

    try {
        // 从小程序数据库获取所有进度照片
        $miniprogramPhotos = Db::connect('repair')
            ->name('order_progress_photos')
            ->field('id, order_id, description, images, uploaded_by, uploaded_by_name, created_at')
            ->select()
            ->toArray();

        $total = count($miniprogramPhotos);

        foreach ($miniprogramPhotos as $mpPhoto) {
            try {
                $mpOrderId = (int) $mpPhoto['order_id'];

                // 获取CMMS订单ID
                $cmmsOrderId = getCmmsOrderIdFromMapping($mpOrderId);
                if (!$cmmsOrderId) {
                    // 如果没有映射，尝试创建
                    $mpOrder = Db::connect('repair')
                        ->name('orders')
                        ->where('id', $mpOrderId)
                        ->find();

                    if ($mpOrder) {
                        $cmmsOrderId = getCmmsOrderId($mpOrderId, $mpOrder);
                    }
                }

                if (!$cmmsOrderId) {
                    $errors[] = "照片 ID {$mpPhoto['id']} 无法获取CMMS订单ID";
                    $failed++;
                    continue;
                }

                // 解析图片JSON
                $images = is_array($mpPhoto['images']) ? $mpPhoto['images'] : json_decode($mpPhoto['images'], true);
                if (!$images) {
                    $errors[] = "照片 ID {$mpPhoto['id']} 图片数据无效";
                    $failed++;
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
                    $synced++;
                    echo "  ✓ 照片 ID {$mpPhoto['id']} 同步成功\n";
                } else {
                    // 更新现有记录
                    Db::name('progress_photo')
                        ->where('id', $existingPhoto['id'])
                        ->update([
                            'description' => $mpPhoto['description'] ?? '维修进度照片',
                            'images' => json_encode($images, JSON_UNESCAPED_UNICODE),
                            'updated_at' => date('Y-m-d H:i:s')
                        ]);
                    $synced++;
                    echo "  ✓ 照片 ID {$mpPhoto['id']} 更新成功\n";
                }
            } catch (\Exception $e) {
                $failed++;
                $errors[] = "照片 ID {$mpPhoto['id']} 同步失败: " . $e->getMessage();
                echo "  ✗ 照片 ID {$mpPhoto['id']} 同步失败: " . $e->getMessage() . "\n";
            }
        }
    } catch (\Exception $e) {
        throw new \Exception("同步照片失败: " . $e->getMessage());
    }

    return [
        'total' => $total,
        'synced' => $synced,
        'failed' => $failed,
        'errors' => $errors
    ];
}

/**
 * 同步进度视频
 */
function syncVideos(): array
{
    $total = 0;
    $synced = 0;
    $failed = 0;
    $errors = [];

    try {
        // 从小程序数据库获取所有进度视频
        $miniprogramVideos = Db::connect('repair')
            ->name('order_progress_videos')
            ->field('id, order_id, video_title, description, video_url, cover_url, duration, file_size, uploaded_by, uploaded_by_name, created_at')
            ->select()
            ->toArray();

        $total = count($miniprogramVideos);

        foreach ($miniprogramVideos as $mpVideo) {
            try {
                $mpOrderId = (int) $mpVideo['order_id'];

                // 获取CMMS订单ID
                $cmmsOrderId = getCmmsOrderIdFromMapping($mpOrderId);
                if (!$cmmsOrderId) {
                    // 如果没有映射，尝试创建
                    $mpOrder = Db::connect('repair')
                        ->name('orders')
                        ->where('id', $mpOrderId)
                        ->find();

                    if ($mpOrder) {
                        $cmmsOrderId = getCmmsOrderId($mpOrderId, $mpOrder);
                    }
                }

                if (!$cmmsOrderId) {
                    $errors[] = "视频 ID {$mpVideo['id']} 无法获取CMMS订单ID";
                    $failed++;
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
                    $synced++;
                    echo "  ✓ 视频 ID {$mpVideo['id']} 同步成功\n";
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
                    $synced++;
                    echo "  ✓ 视频 ID {$mpVideo['id']} 更新成功\n";
                }
            } catch (\Exception $e) {
                $failed++;
                $errors[] = "视频 ID {$mpVideo['id']} 同步失败: " . $e->getMessage();
                echo "  ✗ 视频 ID {$mpVideo['id']} 同步失败: " . $e->getMessage() . "\n";
            }
        }
    } catch (\Exception $e) {
        throw new \Exception("同步视频失败: " . $e->getMessage());
    }

    return [
        'total' => $total,
        'synced' => $synced,
        'failed' => $failed,
        'errors' => $errors
    ];
}

/**
 * 获取CMMS订单ID
 */
function getCmmsOrderId($mpOrderId, $mpOrder): ?int
{
    // 查找现有映射
    $mapping = Db::name('miniprogram_order_mapping')
        ->where('miniprogram_order_id', $mpOrderId)
        ->find();

    if ($mapping && !empty($mapping['cmms_order_id'])) {
        return (int) $mapping['cmms_order_id'];
    }

    // 创建新的CMMS订单
    $cmmsOrderId = createCmmsOrder($mpOrder);

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
function getCmmsOrderIdFromMapping($mpOrderId): ?int
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
function createCmmsOrder($mpOrder): int
{
    // 尝试从work_orders创建关联订单
    try {
        $orderId = Db::name('work_orders')->insertGetId([
            'order_no' => $mpOrder['order_id'] ?? 'MP' . $mpOrder['id'],
            'title' => '小程序同步订单',
            'device_id' => 0,
            'reporter_id' => 1,
            'asusigned_to' => $mpOrder['asusigned_to'] ?? null,
            'fault_type' => '维修',
            'fault_description' => $mpOrder['problem_description'] ?? '',
            'priority' => 2,
            'status' => mapOrderStatus($mpOrder['status'] ?? 'pending'),
            'start_time' => $mpOrder['asusigned_at'] ?? null,
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
function getProgressStage($progress): string
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
function getProgressDescription($progress): string
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
function getStatus($mpStatus, $progress): string
{
    if ($progress >= 100) return 'completed';
    if ($progress > 0) return 'in_progress';
    return 'pending';
}

/**
 * 映射订单状态
 */
function mapOrderStatus($mpStatus): int
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
function getHandlerName($handlerId): string
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
