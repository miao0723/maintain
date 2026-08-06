<?php
/**
 * 测试文件预览和下载功能
 */

require __DIR__ . '/vendor/autoload.php';

use app\model\KbFile;

// 初始化ThinkPHP
$app = new think\App();
$app->initialize();

echo "=== 文件预览测试脚本 ===\n\n";

try {
    // 获取所有文件
    $files = KbFile::order('id', 'desc')->limit(10)->select();

    if ($files->isEmpty()) {
        echo "没有找到文件\n";
        exit;
    }

    echo "找到 " . count($files) . " 个文件：\n\n";

    foreach ($files as $file) {
        echo "----------------------------------------\n";
        echo "ID: {$file->id}\n";
        echo "文件名: {$file->original_name}\n";
        echo "文件类型: {$file->file_type}\n";
        echo "文件大小: " . round($file->file_size / 1024 / 1024, 2) . " MB\n";
        echo "存储路径: {$file->file_path}\n";
        echo "MIME类型: {$file->mime_type}\n";
        echo "处理状态: ";
        switch ($file->chunk_status) {
            case 0: echo "待处理"; break;
            case 1: echo "处理中"; break;
            case 2: echo "已完成"; break;
            case 3: echo "失败"; break;
        }
        echo "\n";

        // 检查文件是否存在
        $fullPath = root_path() . 'public/' . $file->file_path;
        if (file_exists($fullPath)) {
            echo "文件状态: 存在 ✓\n";
            echo "实际文件大小: " . filesize($fullPath) . " bytes\n";
        } else {
            echo "文件状态: 不存在 ✗\n";
        }

        // 生成预览URL
        $downloadUrl = "/api/kb/files/{$file->id}/download";
        $previewUrl = "/api/kb/files/{$file->id}/download?preview=1";
        echo "下载URL: {$downloadUrl}\n";
        echo "预览URL: {$previewUrl}\n";
        echo "----------------------------------------\n\n";
    }

    echo "测试完成！\n";

} catch (\Exception $e) {
    echo "错误: " . $e->getMessage() . "\n";
    "堆栈信息:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
