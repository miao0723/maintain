<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

/**
 * 小程序进度上传控制器
 * 负责处理小程序端上传的进度照片和视频，并自动同步到CMMS后台
 */
class MiniprogramProgressUploadController extends BaseController
{
    /**
     * 上传进度照片并同步到CMMS
     * POST /api/miniprogram-upload/photo
     * FormData:
     *   - order_id: 小程序订单ID
     *   - description: 照片说明
     *   - images: 图片文件（支持多个）
     */
    public function uploadPhoto()
    {
        $orderId = request()->post('order_id');
        $description = request()->post('description', '');
        $uploadedByName = request()->post('uploaded_by_name', '小程序用户');

        if (empty($orderId)) {
            return Result::error('订单ID不能为空', 400);
        }

        try {
            $files = request()->file('images');
            if (!$files) {
                return Result::error('请上传至少一张照片', 400);
            }

            // 处理多文件上传
            if (!is_array($files)) {
                $files = [$files];
            }

            $uploadedUrls = [];
            $uploadPath = 'uploads/miniprogram/progress_photos/';
            $uploadDir = public_path($uploadPath);

            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            foreach ($files as $file) {
                if (!$file->isValid()) {
                    return Result::error('文件上传失败: ' . $file->getError(), 400);
                }

                // 验证文件类型
                $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!in_array($file->getMime(), $allowedTypes)) {
                    return Result::error('只支持上传图片文件', 400);
                }

                // 验证文件大小（5MB）
                if ($file->getSize() > 5 * 1024 * 1024) {
                    return Result::error('单个图片文件不能超过5MB', 400);
                }

                // 生成唯一文件名
                $filename = md5(uniqid()) . '.' . $file->getExtension();
                $file->move($uploadDir, $filename);
                $uploadedUrls[] = '/' . $uploadPath . $filename;
            }

            // 获取用户信息
            $userId = $this->getUserId();
            $userInfo = [];
            if ($userId) {
                $userInfo = Db::connect('repair')->name('users')->find($userId);
                if ($userInfo) {
                    $uploadedByName = $userInfo['nickname'] ?? $userInfo['real_name'] ?? '小程序用户';
                }
            }

            // 调用同步接口
            $syncData = [
                'miniprogram_order_id' => (int) $orderId,
                'description' => $description,
                'images' => $uploadedUrls,
                'uploaded_by' => $userId,
                'uploaded_by_name' => $uploadedByName
            ];

            // 使用 MiniprogramProgressSyncController 的逻辑
            $syncController = new MiniprogramProgressSyncController();
            $result = $syncController->syncProgress($syncData);

            if (!$result || (isset($result['code']) && $result['code'] !== 200)) {
                return Result::error('同步到CMMS失败: ' . ($result['message'] ?? '未知错误'), 500);
            }

            return Result::success([
                'uploaded_urls' => $uploadedUrls,
                'sync_result' => $result['data'] ?? []
            ], '照片上传并同步成功');
        } catch (\Exception $e) {
            return Result::error('上传失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 上传进度视频并同步到CMMS
     * POST /api/miniprogram-upload/video
     * FormData:
     *   - order_id: 小程序订单ID
     *   - video_title: 视频标题
     *   - description: 视频说明
     *   - video: 视频文件
     *   - cover: 封面图片（可选）
     */
    public function uploadVideo()
    {
        $orderId = request()->post('order_id');
        $videoTitle = request()->post('video_title', '');
        $description = request()->post('description', '');
        $uploadedByName = request()->post('uploaded_by_name', '小程序用户');

        if (empty($orderId)) {
            return Result::error('订单ID不能为空', 400);
        }
        if (empty($videoTitle)) {
            return Result::error('视频标题不能为空', 400);
        }

        try {
            $videoFile = request()->file('video');
            if (!$videoFile || !$videoFile->isValid()) {
                return Result::error('请上传视频文件', 400);
            }

            // 验证文件类型
            $allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
            if (!in_array($videoFile->getMime(), $allowedTypes)) {
                return Result::error('只支持上传MP4格式的视频文件', 400);
            }

            // 验证文件大小（50MB）
            if ($videoFile->getSize() > 50 * 1024 * 1024) {
                return Result::error('视频文件不能超过50MB', 400);
            }

            // 处理视频上传
            $uploadPath = 'uploads/miniprogram/progress_videos/';
            $uploadDir = public_path($uploadPath);

            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $filename = md5(uniqid()) . '.' . $videoFile->getExtension();
            $videoFile->move($uploadDir, $filename);
            $videoUrl = '/' . $uploadPath . $filename;

            // 处理封面上传（可选）
            $coverUrl = '';
            $coverFile = request()->file('cover');
            if ($coverFile && $coverFile->isValid()) {
                $coverPath = 'uploads/miniprogram/video_covers/';
                $coverDir = public_path($coverPath);

                if (!is_dir($coverDir)) {
                    mkdir($coverDir, 0755, true);
                }

                $coverFilename = md5(uniqid()) . '.' . $coverFile->getExtension();
                $coverFile->move($coverDir, $coverFilename);
                $coverUrl = '/' . $coverPath . $coverFilename;
            }

            // 获取视频时长（使用ffmpeg或估算）
            $duration = 0;
            try {
                // 这里可以集成 ffmpeg 获取精确时长，暂时使用文件大小估算
                // 每1MB大约1-5秒的720p视频
                $duration = ceil($videoFile->getSize() / (1024 * 1024) * 3);
            } catch (\Exception $e) {
                $duration = 0;
            }

            // 获取用户信息
            $userId = $this->getUserId();
            if ($userId) {
                $userInfo = Db::connect('repair')->name('users')->find($userId);
                if ($userInfo) {
                    $uploadedByName = $userInfo['nickname'] ?? $userInfo['real_name'] ?? '小程序用户';
                }
            }

            // 调用同步接口
            $syncData = [
                'miniprogram_order_id' => (int) $orderId,
                'video_title' => $videoTitle,
                'description' => $description,
                'video_url' => $videoUrl,
                'cover_url' => $coverUrl,
                'duration' => $duration,
                'file_size' => $videoFile->getSize(),
                'uploaded_by' => $userId,
                'uploaded_by_name' => $uploadedByName
            ];

            // 使用 MiniprogramProgressSyncController 的逻辑
            $syncController = new MiniprogramProgressSyncController();
            $result = $syncController->syncProgressVideo($syncData);

            if (!$result || (isset($result['code']) && $result['code'] !== 200)) {
                return Result::error('同步到CMMS失败: ' . ($result['message'] ?? '未知错误'), 500);
            }

            return Result::success([
                'video_url' => $videoUrl,
                'cover_url' => $coverUrl,
                'duration' => $duration,
                'file_size' => $videoFile->getSize(),
                'sync_result' => $result['data'] ?? []
            ], '视频上传并同步成功');
        } catch (\Exception $e) {
            return Result::error('上传失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 获取当前用户ID（从JWT）
     */
    private function getUserId(): ?int
    {
        $token = request()->header('Authorization');
        if (!$token) {
            $token = request()->header('authorization');
        }

        if ($token && strpos($token, 'Bearer ') === 0) {
            $token = substr($token, 7);
            try {
                $payload = \app\service\JwtService::decodeAccessToken($token);
                return (int) ($payload['user_id'] ?? 0) ?: null;
            } catch (\Exception $e) {
                return null;
            }
        }

        return null;
    }
}
