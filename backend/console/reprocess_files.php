<?php
/**
 * 重新处理知识库文件
 * 用于重新向量化已提取文本的文件
 */

// 加载ThinkPHP应用
require __DIR__ . '/../vendor/autoload.php';

use think\facade\App;
use think\facade\Db;
use app\service\FileProcessingService;
use app\model\KbFile;
use app\model\KbChunk;
use think\facade\Log;

// 初始化应用
$app = App::initialize();

echo "=== 重新处理知识库文件 ===\n\n";

// 获取需要重新处理的向量化失败的文件
$failedFiles = KbFile::where('chunk_status', 2)
    ->where('chunk_error', 'like', '%未向量化%')
    ->select();

echo "找到 " . count($failedFiles) . " 个需要重新处理的文件\n\n";

if ($failedFiles->isEmpty()) {
    echo "没有需要重新处理的文件\n";
    exit(0);
}

$processingService = new FileProcessingService();
$successCount = 0;
$failCount = 0;

foreach ($failedFiles as $file) {
    echo "处理文件 [{$file->id}] {$file->original_name}\n";
    echo "  原错误: {$file->chunk_error}\n";

    try {
        // 清除旧的分块
        KbChunk::where('file_id', $file->id)->delete();

        // 重新处理
        $result = $processingService->processFile($file);

        if ($result) {
            echo "  ✓ 成功\n";
            $successCount++;
        } else {
            echo "  ✗ 失败\n";
            $failCount++;
        }

    } catch (\Exception $e) {
        echo "  ✗ 异常: " . $e->getMessage() . "\n";
        $failCount++;
    }

    echo "\n";
}

echo "=== 处理完成 ===\n";
echo "成功: {$successCount}\n";
echo "失败: {$failCount}\n";
