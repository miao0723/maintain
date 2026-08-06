<?php

namespace app\controller;

use app\common\Result;
use app\model\KbFile;
use app\model\KbChunk;
use app\service\FileProcessingService;
use app\service\MilvusService;
use think\facade\Log;

/**
 * 知识库文件管理控制器
 */
class KbFileController extends BaseController
{
    /**
     * 文件列表
     */
    public function index()
    {
        $params = request()->param();
        $collectionId = intval($params['collection_id'] ?? 0);

        if (!$collectionId) {
            return Result::error('请指定知识库ID', 400);
        }

        $query = KbFile::where('collection_id', $collectionId);

        if (!empty($params['file_type'])) {
            $query->where('file_type', $params['file_type']);
        }

        if (isset($params['chunk_status'])) {
            $query->where('chunk_status', $params['chunk_status']);
        }

        $page = intval($params['page'] ?? 1);
        $pageSize = intval($params['pageSize'] ?? 20);

        $total = $query->count();
        $list = $query->order('created_at', 'desc')
            ->page($page, $pageSize)
            ->select()
            ->toArray();

        return Result::paginated($list, $total, $page, $pageSize);
    }

    /**
     * 文件详情
     */
    public function read($id)
    {
        $file = KbFile::with(['chunks' => function ($query) {
            $query->order('chunk_index', 'asc');
        }])->find($id);

        if (!$file) {
            return Result::error('文件不存在', 404);
        }

        return Result::success($file);
    }

    /**
     * 上传文件到知识库
     */
    public function upload()
    {
        $file = request()->file('file');
        if (!$file) {
            return Result::error('没有文件被上传', 400);
        }

        $collectionId = intval(request()->param('collection_id', 0));
        if (!$collectionId) {
            return Result::error('请指定知识库ID', 400);
        }

        try {
            $userId = $this->getUserId();

            // 验证文件
            $rules = [
                'file' => [
                    'fileSize' => 100 * 1024 * 1024,
                    'fileExt' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'md', 'ppt', 'pptx', 'csv', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
                ]
            ];
            validate($rules, [
                'file.fileSize' => '文件大小不能超过100MB',
                'file.fileExt' => '不支持的文件类型',
            ])->check(['file' => $file]);

            // 保存文件
            $type = 'knowledge';
            $path = 'uploads/knowledge/';
            $fileSize = $file->getSize();
            $mimeType = $file->getMime();
            $originalName = $file->getOriginalName();
            $fileExt = strtolower($file->getOriginalExtension());
            $filename = uniqid() . '_' . time() . '.' . $fileExt;
            $targetDir = root_path() . 'public/' . $path;

            if (!is_dir($targetDir)) {
                mkdir($targetDir, 0755, true);
            }

            $file->move($targetDir, $filename);
            $filePath = $path . $filename;

            // 存储容器内的正确路径（Docker环境使用 /var/www/html）
            $isDocker = file_exists('/.dockerenv') || getenv('DOCKER_CONTAINER');
            if ($isDocker) {
                $localPath = '/var/www/html/public/' . $path . $filename;
            } else {
                $localPath = $targetDir . $filename;
            }

            // 创建文件记录
            $kbFile = KbFile::create([
                'collection_id' => $collectionId,
                'original_name' => $originalName,
                'stored_name' => $filename,
                'file_path' => $filePath,
                'local_path' => $localPath,
                'file_type' => $fileExt,
                'file_size' => $fileSize,
                'mime_type' => $mimeType,
                'chunk_status' => 0,
                'uploaded_by' => $userId,
            ]);

            // 异步处理文件（提取文本、分块）
            // 使用 try-catch 确保处理失败不影响上传成功响应
            try {
                $processingService = new FileProcessingService();
                // 设置更长的执行时间以支持大文件和图片OCR处理
                set_time_limit(600);
                ini_set('memory_limit', '1024M');
                $result = $processingService->processFile($kbFile);
                if (!$result) {
                    Log::warning("文件处理返回失败状态: {$kbFile->id}");
                }
            } catch (\Exception $e) {
                $errorMsg = $e->getMessage();
                Log::error("文件处理异常: " . $errorMsg . "\n" . $e->getTraceAsString());
                // 即使处理失败，也标记为失败状态，用户可稍后重试
                try {
                    $kbFile->chunk_status = 3;
                    $kbFile->chunk_error = mb_substr($errorMsg, 0, 500, 'UTF-8');
                    $kbFile->save();
                } catch (\Exception $saveError) {
                    Log::error("保存文件失败状态失败: " . $saveError->getMessage());
                }
            }

            // 刷新数据
            $kbFile->refresh();

            return Result::success($kbFile, '上传成功');

        } catch (\Exception $e) {
            Log::error('知识库文件上传异常：' . $e->getMessage());
            return Result::error('上传失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 删除文件
     */
    public function delete($id)
    {
        $file = KbFile::find($id);
        if (!$file) {
            return Result::error('文件不存在', 404);
        }

        try {
            // 删除物理文件
            $fullPath = root_path() . 'public/' . $file->file_path;
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            // 删除文件记录（关联的 chunks 会通过外键或应用层删除）
            $file->delete();

            return Result::success(null, '删除成功');

        } catch (\Exception $e) {
            return Result::error('删除失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 重新处理文件
     */
    public function reprocess($id)
    {
        $file = KbFile::find($id);
        if (!$file) {
            return Result::error('文件不存在', 404);
        }

        try {
            // 清除旧的提取数据和分块
            $file->extracted_text = null;
            $file->text_char_count = 0;
            $file->chunk_count = 0;
            $file->chunk_error = null;
            $file->save();

            // 删除旧的分块
            KbChunk::where('file_id', $id)->delete();

            // 重新处理
            $processingService = new FileProcessingService();
            $processingService->processFile($file);

            $file->refresh();

            return Result::success($file, '重新处理成功');

        } catch (\Exception $e) {
            return Result::error('重新处理失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 批量重新处理文件
     * 重新处理所有向量化失败的文件
     */
    public function batchReprocess()
    {
        $collectionId = intval(request()->param('collection_id', 0));

        try {
            // 获取需要重新处理的文件
            $query = KbFile::where('chunk_status', 2)
                ->where('chunk_error', 'like', '%未向量化%');

            if ($collectionId > 0) {
                $query->where('collection_id', $collectionId);
            }

            $files = $query->limit(10)->select();

            $processingService = new FileProcessingService();
            $results = [];

            foreach ($files as $file) {
                try {
                    // 清除旧的分块
                    KbChunk::where('file_id', $file->id)->delete();

                    // 重新处理
                    $processingService->processFile($file);

                    $results[] = [
                        'id' => $file->id,
                        'name' => $file->original_name,
                        'success' => true,
                        'error' => null,
                    ];

                } catch (\Exception $e) {
                    $results[] = [
                        'id' => $file->id,
                        'name' => $file->original_name,
                        'success' => false,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            return Result::success($results, '批量处理完成');

        } catch (\Exception $e) {
            return Result::error('批量处理失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 获取文件内容（用于前端显示本地文件）
     */
    public function getFileContent($id)
    {
        $file = KbFile::find($id);
        if (!$file) {
            return Result::error('文件不存在', 404);
        }

        // 检测是否在 Docker 环境中
        $isDocker = file_exists('/.dockerenv') || getenv('DOCKER_CONTAINER');

        // 尝试多种路径组合
        $possiblePaths = [];

        // 1. 如果有 local_path，直接使用
        if (!empty($file->local_path)) {
            $possiblePaths[] = $file->local_path;
        }

        // 2. 使用 root_path() 拼接 file_path
        $possiblePaths[] = root_path() . 'public/' . $file->file_path;

        // 3. Docker 环境下的标准路径
        if ($isDocker) {
            $possiblePaths[] = '/var/www/html/public/' . $file->file_path;
        }

        // 找到第一个存在的路径
        $fullPath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $fullPath = $path;
                break;
            }
        }

        if (!$fullPath) {
            return Result::error('文件已丢失，尝试的路径: ' . implode(', ', $possiblePaths), 404);
        }

        // 检查文件是否可读
        if (!is_readable($fullPath)) {
            return Result::error('文件不可读: ' . $fullPath, 403);
        }

        try {
            $fileSize = filesize($fullPath);
            $fileExt = strtolower(pathinfo($file->original_name, PATHINFO_EXTENSION));

            // 图片文件（JPG, PNG, GIF, BMP, WEBP等）
            $imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
            if (in_array($fileExt, $imageTypes)) {
                $content = file_get_contents($fullPath);
                $base64 = base64_encode($content);
                $mimeType = mime_content_type($fullPath);
                return Result::success([
                    'content' => $base64,
                    'encoding' => 'base64',
                    'mime_type' => $mimeType,
                    'data_url' => 'data:' . $mimeType . ';base64,' . $base64,
                    'size' => $fileSize,
                    'path' => $fullPath,
                    'is_binary' => true,
                    'is_image' => true
                ]);
            }

            // PDF文件
            if ($fileExt === 'pdf') {
                return Result::success([
                    'content' => null,
                    'encoding' => 'binary',
                    'mime_type' => 'application/pdf',
                    'size' => $fileSize,
                    'path' => $fullPath,
                    'is_binary' => true,
                    'is_pdf' => true,
                    'message' => 'PDF文件请在浏览器中预览'
                ]);
            }

            // Office文档（DOC, DOCX, XLS, XLSX, PPT, PPTX）
            $officeTypes = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
            if (in_array($fileExt, $officeTypes)) {
                $content = file_get_contents($fullPath);
                $base64 = base64_encode($content);
                return Result::success([
                    'content' => $base64,
                    'encoding' => 'base64',
                    'mime_type' => $file->mime_type ?: mime_content_type($fullPath),
                    'size' => $fileSize,
                    'path' => $fullPath,
                    'is_binary' => true,
                    'is_office' => true
                ]);
            }

            // 压缩文件（ZIP, RAR, 7Z等）
            $archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz'];
            if (in_array($fileExt, $archiveTypes)) {
                return Result::success([
                    'content' => null,
                    'encoding' => 'binary',
                    'size' => $fileSize,
                    'path' => $fullPath,
                    'is_binary' => true,
                    'is_archive' => true,
                    'message' => '压缩文件，请下载后查看'
                ]);
            }

            // 视频文件
            $videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
            if (in_array($fileExt, $videoTypes)) {
                return Result::success([
                    'content' => null,
                    'encoding' => 'binary',
                    'mime_type' => mime_content_type($fullPath),
                    'size' => $fileSize,
                    'path' => $fullPath,
                    'is_binary' => true,
                    'is_video' => true,
                    'message' => '视频文件，请在浏览器中预览'
                ]);
            }

            // 音频文件
            $audioTypes = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
            if (in_array($fileExt, $audioTypes)) {
                return Result::success([
                    'content' => null,
                    'encoding' => 'binary',
                    'mime_type' => mime_content_type($fullPath),
                    'size' => $fileSize,
                    'path' => $fullPath,
                    'is_binary' => true,
                    'is_audio' => true,
                    'message' => '音频文件，请在浏览器中预览'
                ]);
            }

            // 文本文件（TXT, MD, CSV, JSON, XML, YAML等）
            $textTypes = ['txt', 'md', 'csv', 'json', 'xml', 'yaml', 'yml', 'log', 'ini', 'conf', 'env'];
            if (in_array($fileExt, $textTypes) || $this->isTextFile($fullPath)) {
                $content = file_get_contents($fullPath);
                if ($content === false) {
                    return Result::error('无法读取文件内容', 500);
                }

                // 检测文件编码并转换为 UTF-8
                $encoding = mb_detect_encoding($content, ['UTF-8', 'GBK', 'GB2312', 'ASCII'], true);
                if ($encoding && $encoding !== 'UTF-8') {
                    $content = mb_convert_encoding($content, 'UTF-8', $encoding);
                }

                return Result::success([
                    'content' => $content,
                    'size' => $fileSize,
                    'encoding' => $encoding ?? 'UTF-8',
                    'path' => $fullPath,
                    'is_text' => true
                ]);
            }

            // 其他文件类型，尝试作为文本处理，如果失败则返回二进制信息
            $content = file_get_contents($fullPath);
            if ($content !== false && $this->isTextFile($fullPath)) {
                $encoding = mb_detect_encoding($content, ['UTF-8', 'GBK', 'GB2312', 'ASCII'], true);
                if ($encoding && $encoding !== 'UTF-8') {
                    $content = mb_convert_encoding($content, 'UTF-8', $encoding);
                }
                return Result::success([
                    'content' => $content,
                    'size' => $fileSize,
                    'encoding' => $encoding ?? 'UTF-8',
                    'path' => $fullPath,
                    'is_text' => true
                ]);
            }

            // 默认返回二进制文件信息
            return Result::success([
                'content' => null,
                'encoding' => 'binary',
                'mime_type' => mime_content_type($fullPath),
                'size' => $fileSize,
                'path' => $fullPath,
                'is_binary' => true,
                'is_unknown' => true,
                'message' => '未知文件类型，请下载后查看'
            ]);

        } catch (\Exception $e) {
            return Result::error('读取文件失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 检测文件是否为文本文件
     */
    private function isTextFile($filePath)
    {
        $handle = fopen($filePath, 'rb');
        if (!$handle) {
            return false;
        }

        // 读取前8192字节进行检测
        $chunk = fread($handle, 8192);
        fclose($handle);

        if ($chunk === false) {
            return false;
        }

        // 检查是否包含空字节（二进制文件特征）
        if (strpos($chunk, "\x00") !== false) {
            return false;
        }

        // 检查可打印字符的比例
        $printableChars = 0;
        $totalChars = strlen($chunk);
        for ($i = 0; $i < $totalChars; $i++) {
            $char = ord($chunk[$i]);
            // 可打印字符：控制字符（\t, \n, \r）、空格、可打印ASCII、扩展ASCII
            if (($char >= 9 && $char <= 13) || ($char >= 32 && $char <= 126) || ($char >= 128 && $char <= 255)) {
                $printableChars++;
            }
        }

        // 如果可打印字符比例超过70%，认为是文本文件
        return ($printableChars / $totalChars) > 0.7;
    }

    /**
     * 下载/预览文件
     */
    public function download($id)
    {
        // 检查是否通过URL参数传递了token（用于浏览器直接访问预览）
        $token = request()->get('token');
        if ($token) {
            // 验证token
            try {
                $jwtService = new \app\service\JwtService();
                $payload = $jwtService->verifyToken($token);
                if (!$payload) {
                    return Result::error('Token无效', 401);
                }
                // 将用户信息注入到request中，供后续使用
                request()->userId = $payload['user_id'];
                request()->roleType = $payload['role_type'] ?? null;
            } catch (\Exception $e) {
                return Result::error('Token验证失败: ' . $e->getMessage(), 401);
            }
        }

        $file = KbFile::find($id);
        if (!$file) {
            return Result::error('文件不存在', 404);
        }

        // 检测是否在 Docker 环境中
        $isDocker = file_exists('/.dockerenv') || getenv('DOCKER_CONTAINER');

        // 尝试多种路径组合
        $possiblePaths = [];

        // 1. 如果有 local_path，直接使用
        if (!empty($file->local_path)) {
            $possiblePaths[] = $file->local_path;
        }

        // 2. 使用 root_path() 拼接 file_path
        $possiblePaths[] = root_path() . 'public/' . $file->file_path;

        // 3. Docker 环境下的标准路径
        if ($isDocker) {
            $possiblePaths[] = '/var/www/html/public/' . $file->file_path;
        }

        // 找到第一个存在的路径
        $fullPath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $fullPath = $path;
                break;
            }
        }

        if (!$fullPath) {
            return Result::error('文件已丢失', 404);
        }

        // 设置正确的Content-Type用于在线预览
        $mimeType = $file->mime_type ?: mime_content_type($fullPath);

        // 如果是预览请求（通过URL参数），直接输出文件内容
        if (request()->get('preview') === '1') {
            // 清除所有之前设置的响应头
            header_remove();
            ob_clean();

            // 设置合适的响应头
            header('Content-Type: ' . $mimeType);
            header('Content-Length: ' . filesize($fullPath));
            header('Content-Disposition: inline; filename="' . $file->original_name . '"');
            header('Cache-Control: public, max-age=31536000');
            header('Pragma: public');
            // 允许跨域访问
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET');
            header('Access-Control-Allow-Headers: Content-Type, Authorization');

            // 输出文件内容
            readfile($fullPath);
            exit;
        }

        // 否则作为下载
        return download($fullPath, $file->original_name);
    }
}
