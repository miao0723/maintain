<?php

namespace app\service;

use app\model\Attachment;
use think\facade\Log;

class AttachmentService
{
    /**
     * 上传目录（Docker 数据卷挂载路径）
     */
    const UPLOAD_DIR = '/var/www/html/public/uploads';

    /**
     * 最大上传文件大小 30MB
     */
    const MAX_UPLOAD_SIZE = 30 * 1024 * 1024;

    /**
     * 获取附件列表
     */
    public function getList($targetType, $targetId = null, $category = null)
    {
        $query = Attachment::active();

        if ($targetType) {
            $query->where('target_type', $targetType);
        }
        if ($targetId !== null) {
            $query->where('target_id', $targetId);
        }
        if ($category) {
            $query->where('category', $category);
        }

        return $query->order('created_at', 'desc')->select();
    }

    /**
     * 根据 ID 获取附件
     */
    public function getById($id)
    {
        $attachment = Attachment::active()->find($id);
        if (!$attachment) {
            throw new \RuntimeException('附件不存在');
        }
        return $attachment;
    }

    /**
     * 创建附件记录
     */
    public function create($targetType, $targetId, $category, $fileName, $filePath, $fileSize = null)
    {
        $attachment = Attachment::create([
            'target_type' => $targetType,
            'target_id' => $targetId,
            'category' => $category,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'file_size' => $fileSize,
            'is_active' => 1,
        ]);
        return $attachment;
    }

    /**
     * 删除附件（软删除 + 可选物理删除）
     */
    public function delete($id, $removePhysical = false)
    {
        $attachment = $this->getById($id);

        if ($removePhysical && $attachment->file_path) {
            $absPath = self::UPLOAD_DIR . '/' . ltrim($attachment->file_path, '/');
            $realPath = realpath($absPath);
            $uploadReal = realpath(self::UPLOAD_DIR);

            // 安全检查：确保文件在 uploads 目录内
            if ($realPath && strpos($realPath, $uploadReal) === 0 && is_file($realPath)) {
                unlink($realPath);
                Log::info("物理删除附件文件: {$realPath}");
            }
        }

        $attachment->is_active = 0;
        $attachment->save();
    }

    /**
     * 按模块+记录ID删除所有附件
     */
    public function deleteByTarget($targetType, $targetId, $removePhysical = false)
    {
        $attachments = $this->getList($targetType, $targetId);
        foreach ($attachments as $attachment) {
            $this->delete($attachment->id, $removePhysical);
        }
    }
}
