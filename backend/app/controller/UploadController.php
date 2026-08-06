<?php

namespace app\controller;

use app\common\Result;
use app\service\OcrService;
use think\facade\Log;

class UploadController extends BaseController
{
    private const SHARED_MINIPROGRAM_UPLOAD_ROOTS = [
        '/var/www/html/miniprogram-uploads',
        'D:\\maintain\\电子维修2.0\\uploads',
    ];

    /**
     * 文件上传
     */
    public function upload()
    {
        $file = request()->file('file');
        if (!$file) {
            return Result::error('没有文件被上传', 400);
        }

        try {
            // 基础验证
            $this->validateFile($file);

            // 在 move 之前获取文件大小（move 后临时文件会被删除）
            $fileSize = $file->getSize();

            // 业务逻辑
            $type = request()->param('type', 'general', 'trim');
            $orderId = request()->param('order_id', '', 'trim');
            $path = $this->getUploadPath($type, $orderId);
            $filename = $this->generateFilename($file);
            $targetDir = $this->ensureDirectoryExists($path);

            // 移动文件
            $file->move($targetDir, $filename);
            $filePath = $path . $filename;
            $fullPath = rtrim($targetDir, '\\/') . DIRECTORY_SEPARATOR . $filename;

            if ($type === 'progress') {
                $sharedFullPath = $this->syncProgressFileToShared($orderId, $filename, $fullPath);
                if ($sharedFullPath) {
                    $fullPath = $sharedFullPath;
                }
            }

            $result = [
                'filename' => $filename,
                'path' => $filePath,
                'url' => '/' . $filePath,
                'size' => $fileSize,
            ];

            // 如果是合同文件，调用 OCR 识别
            if ($type === 'contract') {
                $ocrService = new OcrService();
                $ocrResult = $ocrService->recognizeContract($fullPath);
                $result['ocr_result'] = $ocrResult;
            }

            // 如果是视频文件，提取时长和生成封面
            $ext = strtolower($file->getOriginalExtension());
            $videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'm4v'];
            if (in_array($ext, $videoExts)) {
                $videoMeta = $this->extractVideoMetadata($fullPath, $filePath);
                if ($videoMeta) {
                    $result['duration'] = $videoMeta['duration'];
                    $result['cover_url'] = $videoMeta['cover_url'];
                }
            }

            return Result::success($result, '上传成功');
        } catch (\Exception $e) {
            Log::error('文件上传异常：' . $e->getMessage());
            return Result::error('上传失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 验证文件
     */
    private function validateFile($file)
    {
        // 验证文件大小和类型
        $rules = [
            'file' => [
                'fileSize' => 100 * 1024 * 1024, // 100MB
                'fileExt' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'md', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'm4v', 'svg'],
            ]
        ];
        $messages = [
            'file.fileSize' => '文件大小不能超过 100MB',
            'file.fileExt' => '不支持的文件类型',
        ];

        validate($rules, $messages)->check(['file' => $file]);
    }

    /**
     * 根据类型获取上传路径
     */
    private function getUploadPath($type, string $orderId = '')
    {
        $pathMap = [
            'contract' => 'uploads/contracts/',
            'avatar' => 'uploads/avatars/',
            'default' => 'uploads/general/',
        ];

        if ($type === 'progress') {
            $normalizedOrderId = trim($orderId);
            if ($normalizedOrderId === '') {
                throw new \InvalidArgumentException('进度媒体上传缺少订单ID');
            }
            return 'uploads/progress/' . $normalizedOrderId . '/';
        }

        return $pathMap[$type] ?? $pathMap['default'];
    }

    /**
     * 获取进度媒体共享物理目录
     */
    private function getSharedProgressDirectory(string $orderId): string
    {
        $normalizedOrderId = trim($orderId);
        if ($normalizedOrderId === '') {
            throw new \InvalidArgumentException('进度媒体上传缺少订单ID');
        }

        return rtrim($this->resolveSharedUploadRoot(), '\\/') . DIRECTORY_SEPARATOR
            . 'progress' . DIRECTORY_SEPARATOR . $normalizedOrderId . DIRECTORY_SEPARATOR;
    }

    /**
     * 解析当前环境可写的小程序共享上传根目录
     */
    private function resolveSharedUploadRoot(): string
    {
        foreach (self::SHARED_MINIPROGRAM_UPLOAD_ROOTS as $root) {
            if (is_dir($root)) {
                return $root;
            }
        }

        return self::SHARED_MINIPROGRAM_UPLOAD_ROOTS[0];
    }

    /**
     * 生成唯一文件名
     */
    private function generateFilename($file)
    {
        return uniqid() . '_' . time() . '.' . $file->getOriginalExtension();
    }

    /**
     * 确保目录存在
     */
    private function ensureDirectoryExists($path)
    {
        $targetDir = root_path() . 'public/' . $path;
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }
        return $targetDir;
    }

    /**
     * 将进度媒体同步到小程序共享目录
     */
    private function syncProgressFileToShared(string $orderId, string $filename, string $sourceFullPath): string
    {
        if (!is_file($sourceFullPath)) {
            throw new \RuntimeException('进度媒体上传后未找到源文件：' . $sourceFullPath);
        }

        $sharedDir = $this->getSharedProgressDirectory($orderId);
        if (!is_dir($sharedDir) && !mkdir($sharedDir, 0755, true) && !is_dir($sharedDir)) {
            throw new \RuntimeException('无法创建共享进度目录：' . $sharedDir);
        }

        $sharedFullPath = rtrim($sharedDir, '\\/') . DIRECTORY_SEPARATOR . $filename;
        if (!copy($sourceFullPath, $sharedFullPath)) {
            throw new \RuntimeException('无法同步进度媒体到共享目录：' . $sharedFullPath);
        }

        return $sharedFullPath;
    }

    /**
     * 使用 FFmpeg 提取视频元数据（时长）并生成封面
     */
    private function extractVideoMetadata($fullPath, $relativePath)
    {
        $result = ['duration' => 0, 'cover_url' => ''];

        // 检查 ffprobe 是否可用
        $ffprobe = $this->findBinary('ffprobe');
        if ($ffprobe) {
            $cmd = escapeshellcmd($ffprobe) . ' -v quiet -print_format json -show_format ' . escapeshellarg($fullPath) . ' 2>/dev/null';
            $output = shell_exec($cmd);
            if ($output) {
                $info = json_decode($output, true);
                if (!empty($info['format']['duration'])) {
                    $result['duration'] = (int) round(floatval($info['format']['duration']));
                }
            }
        }

        // 使用 FFmpeg 生成封面截图
        $ffmpeg = $this->findBinary('ffmpeg');
        if ($ffmpeg) {
            $coverDir = dirname($fullPath);
            $coverName = 'cover_' . pathinfo($relativePath, PATHINFO_FILENAME) . '.jpg';
            $coverFullPath = $coverDir . '/' . $coverName;
            $coverRelativePath = dirname($relativePath) . '/' . $coverName;

            $seekTime = max(1, (int) round($result['duration'] * 0.1));
            $cmd = escapeshellcmd($ffmpeg) . ' -y -ss ' . $seekTime . ' -i ' . escapeshellarg($fullPath)
                . ' -frames:v 1 -q:v 2 -vf "scale=320:-2" '
                . escapeshellarg($coverFullPath) . ' 2>/dev/null';
            exec($cmd, $execOutput, $returnCode);

            if ($returnCode === 0 && file_exists($coverFullPath)) {
                $result['cover_url'] = '/' . $coverRelativePath;
            }
        }

        return $result;
    }

    /**
     * 查找可执行文件路径
     */
    private function findBinary($name)
    {
        $candidates = [$name, '/usr/bin/' . $name, '/usr/local/bin/' . $name];
        foreach ($candidates as $path) {
            $output = [];
            exec($path . ' -version 2>/dev/null', $output, $returnCode);
            if ($returnCode === 0) {
                return $path;
            }
        }
        return null;
    }
}
