<?php
/**
 * 测试图片OCR处理
 */

require __DIR__ . '/vendor/autoload.php';

use app\service\FileProcessingService;
use app\model\KbFile;
use think\facade\Db;
use think\facade\Log;

// 初始化ThinkPHP
$app = new think\App();
$app->initialize();

echo "=== 图片OCR测试脚本 ===\n\n";

try {
    // 获取所有图片文件
    $imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    $files = KbFile::where('file_type', 'in', $imageTypes)
        ->order('id', 'desc')
        ->limit(5)
        ->select();

    if ($files->isEmpty()) {
        echo "没有找到图片文件\n";
        exit;
    }

    foreach ($files as $file) {
        echo "\n========================================\n";
        echo "文件ID: {$file->id}\n";
        echo "文件名: {$file->original_name}\n";
        echo "文件类型: {$file->file_type}\n";
        echo "文件大小: " . round($file->file_size / 1024 / 1024, 2) . " MB\n";
        echo "当前状态: ";
        switch ($file->chunk_status) {
            case 0: echo "待处理"; break;
            case 1: echo "处理中"; break;
            case 2: echo "已完成"; break;
            case 3: echo "失败"; break;
        }
        echo "\n";
        echo "错误信息: " . ($file->chunk_error ?? "无") . "\n";
        echo "已提取文本长度: " . mb_strlen($file->extracted_text ?? '', 'UTF-8') . "\n";
        echo "========================================\n";

        // 重新处理
        echo "开始重新处理...\n";

        // 重新从数据库加载文件
        $processingFile = KbFile::find($file->id);
        $service = new FileProcessingService();
        $result = $service->processFile($processingFile);

        // 刷新数据查看结果
        $processingFile = KbFile::find($file->id);

        echo "\n处理结果:\n";
        echo "状态: ";
        switch ($processingFile->chunk_status) {
            case 0: echo "待处理"; break;
            case 1: echo "处理中"; break;
            case 2: echo "已完成 ✓"; break;
            case 3: echo "失败 ✗"; break;
        }
        echo "\n";
        echo "分块数量: {$processingFile->chunk_count}\n";
        echo "文本字符数: {$processingFile->text_char_count}\n";
        if ($processingFile->chunk_error) {
            echo "错误信息: {$processingFile->chunk_error}\n";
        }
        if ($processingFile->extracted_text) {
            echo "\n提取的文本内容（前500字符）:\n";
            echo mb_substr($processingFile->extracted_text, 0, 500, 'UTF-8') . "\n";
        }
    }

    echo "\n\n=== 测试完成 ===\n";

} catch (\Exception $e) {
    echo "错误: " . $e->getMessage() . "\n";
    echo "堆栈信息:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
