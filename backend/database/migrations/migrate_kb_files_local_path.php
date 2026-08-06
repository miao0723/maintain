<?php
/**
 * 迁移脚本：为 kb_files 表填充 local_path 字段
 * 执行方式：php migrate_kb_files_local_path.php
 */

require __DIR__ . '/../../vendor/autoload.php';

use app\model\KbFile;
use think\facade\Db;
use think\facade\Log;

// 初始化 ThinkPHP
$app = new think\App();
$app->initialize();

echo "========================================\n";
echo "开始迁移 kb_files 表的 local_path 字段\n";
echo "========================================\n\n";

try {
    // 获取所有没有 local_path 的文件记录
    $files = KbFile::whereNull('local_path')->select();

    $count = $files->count();
    echo "找到 {$count} 条需要更新的记录\n\n";

    if ($count === 0) {
        echo "没有需要更新的记录，脚本执行完毕。\n";
        exit(0);
    }

    // 获取项目根目录
    $rootPath = root_path();
    echo "项目根目录: {$rootPath}\n";

    $successCount = 0;
    $failCount = 0;

    foreach ($files as $file) {
        $relativePath = $file->file_path;
        $fullPath = $rootPath . 'public/' . $relativePath;

        // 检查文件是否存在
        if (!file_exists($fullPath)) {
            echo "[警告] 文件不存在: {$fullPath}\n";
            $failCount++;
            continue;
        }

        // 更新 local_path
        $file->local_path = $fullPath;
        $file->save();

        echo "[成功] ID: {$file->id}, {$file->original_name} -> {$fullPath}\n";
        $successCount++;
    }

    echo "\n========================================\n";
    echo "迁移完成！\n";
    echo "成功: {$successCount}\n";
    echo "失败: {$failCount}\n";
    echo "========================================\n";

    if ($failCount > 0) {
        echo "\n注意：有 {$failCount} 条记录的文件不存在，请检查文件路径。\n";
    }

} catch (\Exception $e) {
    echo "\n[错误] " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
