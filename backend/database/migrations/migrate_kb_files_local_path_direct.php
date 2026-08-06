<?php
/**
 * 迁移脚本：为 kb_files 表填充 local_path 字段
 * 使用原生PDO直接连接数据库，不依赖ThinkPHP
 * 执行方式：php migrate_kb_files_local_path_direct.php
 */

// 数据库配置 - 请根据你的实际情况修改
$config = [
    'host' => 'localhost',      // 或 '127.0.0.1'
    'port' => 3306,
    'database' => 'cmms_db',
    'username' => 'root',
    'password' => 'root123',   // 修改为你的MySQL密码
    'charset' => 'utf8mb4',
];

// 项目根目录 - 请根据你的实际情况修改
$publicPath = 'D:/maintain/backend/public/';

echo "========================================\n";
echo "开始迁移 kb_files 表的 local_path 字段\n";
echo "========================================\n";
echo "数据库主机: {$config['host']}\n";
echo "数据库名: {$config['database']}\n";
echo "公共目录: {$publicPath}\n\n";

try {
    // 连接数据库
    $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
    $pdo = new PDO($dsn, $config['username'], $config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "数据库连接成功\n\n";

    // 检查 local_path 列是否存在
    $checkColumn = $pdo->query("
        SELECT COUNT(*) FROM information_schema.columns
        WHERE table_schema = '{$config['database']}'
        AND table_name = 'kb_files'
        AND column_name = 'local_path'
    ")->fetchColumn();

    if ($checkColumn == 0) {
        echo "错误：kb_files 表中不存在 local_path 字段\n";
        echo "请先执行 add_local_path_to_kb_files.sql 添加字段\n";
        exit(1);
    }

    // 获取所有没有 local_path 的记录
    $stmt = $pdo->query("
        SELECT id, original_name, file_path
        FROM kb_files
        WHERE local_path IS NULL OR local_path = ''
    ");

    $files = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $count = count($files);

    echo "找到 {$count} 条需要更新的记录\n\n";

    if ($count === 0) {
        echo "没有需要更新的记录，脚本执行完毕。\n";
        exit(0);
    }

    $successCount = 0;
    $failCount = 0;

    // 准备更新语句
    $updateStmt = $pdo->prepare("UPDATE kb_files SET local_path = ? WHERE id = ?");

    foreach ($files as $file) {
        $id = $file['id'];
        $relativePath = $file['file_path'];
        $fullPath = $publicPath . $relativePath;

        // 检查文件是否存在
        if (!file_exists($fullPath)) {
            echo "[警告] 文件不存在: {$fullPath}\n";
            $failCount++;
            // 即使文件不存在，也保存路径（可能是历史数据）
            $updateStmt->execute([$fullPath, $id]);
            continue;
        }

        // 更新 local_path
        $updateStmt->execute([$fullPath, $id]);

        echo "[成功] ID: {$id}, {$file['original_name']} -> {$fullPath}\n";
        $successCount++;
    }

    echo "\n========================================\n";
    echo "迁移完成！\n";
    echo "成功: {$successCount}\n";
    echo "失败: {$failCount}\n";
    echo "========================================\n";

    if ($failCount > 0) {
        echo "\n注意：有 {$failCount} 条记录的文件不存在。\n";
        echo "这些路径可能对应历史数据或已被删除的文件。\n";
    }

} catch (PDOException $e) {
    echo "\n[数据库错误] " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "\n[错误] " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
