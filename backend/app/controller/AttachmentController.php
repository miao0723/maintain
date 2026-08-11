<?php

namespace app\controller;

use app\common\Result;
use app\service\AttachmentService;
use think\facade\Log;
use think\facade\Response;

class AttachmentController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new AttachmentService();
    }

    /**
     * 获取附件列表
     * GET /attachments?target_type=sales&target_id=1
     */
    public function index()
    {
        $targetType = request()->get('target_type', '');
        $targetId = request()->get('target_id', null);
        $category = request()->get('category', '');

        $list = $this->service->getList($targetType, $targetId ?: null, $category);
        return Result::success($list);
    }

    /**
     * 上传文件
     * POST /attachments/upload
     */
    public function upload()
    {
        $file = request()->file('file');
        if (!$file) {
            return Result::error('没有文件被上传', 400);
        }

        $targetType = request()->post('target_type', 'general', 'trim');
        $targetId = request()->post('target_id', 0, 'intval');
        $category = request()->post('category', '', 'trim');

        try {
            // 在 move 之前获取文件信息（move 后临时文件会被删除）
            $fileSize = $file->getSize();
            $originalName = $file->getOriginalName();
            $ext = $file->getOriginalExtension();

            // 验证文件大小
            if ($fileSize > AttachmentService::MAX_UPLOAD_SIZE) {
                return Result::error('文件大小不能超过 30MB', 400);
            }

            // 构建存储路径: uploads/<target_type>/<category>/<filename>
            $relativeDir = $targetType;
            if ($category) {
                $relativeDir .= '/' . $category;
            }
            $targetDir = AttachmentService::UPLOAD_DIR . '/' . $relativeDir;

            // 确保目录存在
            if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
                throw new \RuntimeException('无法创建上传目录');
            }

            // 生成唯一文件名
            $uniqueName = md5($originalName . uniqid() . time()) . '.' . $ext;
            $relativePath = $relativeDir . '/' . $uniqueName;

            // 移动文件到 Docker 数据卷目录
            $file->move($targetDir, $uniqueName);

            // 保存到数据库
            $attachment = $this->service->create(
                $targetType,
                $targetId,
                $category ?: null,
                $originalName,
                $relativePath,
                $fileSize
            );

            return Result::success([
                'id' => $attachment->id,
                'file_name' => $originalName,
                'file_path' => $relativePath,
                'url' => '/uploads/' . $relativePath,
                'file_size' => $attachment->file_size,
            ], '上传成功');

        } catch (\Exception $e) {
            Log::error('附件上传失败: ' . $e->getMessage());
            return Result::error('上传失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 预览/查看文件（浏览器内预览 PDF/图片）
     * GET /attachments/serve/:id
     */
    public function serve($id)
    {
        try {
            $attachment = $this->service->getById($id);
            $absPath = AttachmentService::UPLOAD_DIR . '/' . ltrim($attachment->file_path, '/');

            if (!is_file($absPath)) {
                return Result::error('文件不存在', 404);
            }

            // 根据扩展名设置 Content-Type
            $ext = strtolower(pathinfo($attachment->file_name, PATHINFO_EXTENSION));
            $mimeMap = [
                'pdf' => 'application/pdf',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'gif' => 'image/gif',
                'webp' => 'image/webp',
                'svg' => 'image/svg+xml',
                'txt' => 'text/plain; charset=utf-8',
            ];

            $contentType = $mimeMap[$ext] ?? 'application/octet-stream';

            return response(file_get_contents($absPath), 200, [
                'Content-Type' => $contentType,
                'Content-Disposition' => 'inline; filename="' . $attachment->file_name . '"',
                'Cache-Control' => 'public, max-age=86400',
            ]);

        } catch (\RuntimeException $e) {
            return Result::error($e->getMessage(), 404);
        } catch (\Exception $e) {
            return Result::error('预览失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 下载文件
     * GET /attachments/download/:id
     */
    public function download($id)
    {
        try {
            $attachment = $this->service->getById($id);
            $absPath = AttachmentService::UPLOAD_DIR . '/' . ltrim($attachment->file_path, '/');

            if (!is_file($absPath)) {
                return Result::error('文件不存在', 404);
            }

            return download($absPath, $attachment->file_name);

        } catch (\RuntimeException $e) {
            return Result::error($e->getMessage(), 404);
        } catch (\Exception $e) {
            return Result::error('下载失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 删除附件
     * DELETE /attachments/:id
     */
    public function delete($id)
    {
        try {
            $this->service->delete($id, true);
            return Result::success(null, '删除成功');
        } catch (\RuntimeException $e) {
            return Result::error($e->getMessage(), 404);
        } catch (\Exception $e) {
            return Result::error('删除失败: ' . $e->getMessage(), 500);
        }
    }
}
