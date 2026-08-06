<?php
/**
 * 检查知识库文件状态（纯PHP，不使用ThinkPHP）
 */

// 直接读取.env文件
$envFile = __DIR__ . '/.env';
$envVars = [];

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || $line[0] === ';') {
            continue;
        }
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $value = trim($parts[1]);
            $envVars[$key] = $value;
        }
    }
}

// 获取数据库配置，强制使用localhost
$host = 'localhost';
$user = isset($envVars['DATABASE_USERNAME']) ? $envVars['DATABASE_USERNAME'] : 'root';
$pass = isset($envVars['DATABASE_PASSWORD']) ? $envVars['DATABASE_PASSWORD'] : 'root123';
$db   = isset($envVars['DATABASE_DATABASE']) ? $envVars['DATABASE_DATABASE'] : 'cmms_db';

echo "=== 知识库文件状态 ===\n\n";

// 连接数据库
$mysqli = new mysqli($host, $user, $pass, $db);

if ($mysqli->connect_error) {
    die("连接失败: " . $mysqli->connect_error . "\n");
}

// 查询知识库文件
$result = $mysqli->query("SELECT id, collection_id, original_name, file_type, chunk_status, chunk_error, chunk_count FROM kb_files ORDER BY id DESC LIMIT 10");

if ($result) {
    while ($row = $result->fetch_assoc()) {
        echo "ID: " . $row['id'] . "\n";
        echo "  名称: " . $row['original_name'] . "\n";
        echo "  集合ID: " . $row['collection_id'] . "\n";
        echo "  类型: " . $row['file_type'] . "\n";
        echo "  分块状态: " . $row['chunk_status'] . "\n";

        $chunkCount = isset($row['chunk_count']) ? $row['chunk_count'] : 0;
        echo "  分块数量: " . $chunkCount . "\n";

        if (isset($row['chunk_error']) && $row['chunk_error']) {
            echo "  错误: " . $row['chunk_error'] . "\n";
        }
        echo "\n";
    }
} else {
    echo "查询失败: " . $mysqli->error . "\n";
}

// 查询知识库分块
echo "=== 知识库分块统计 ===\n\n";
$result = $mysqli->query("SELECT COUNT(*) as total FROM kb_chunks");
if ($result) {
    $row = $result->fetch_assoc();
    echo "分块总数: " . $row['total'] . "\n\n";
}

// 查询有向量化ID的分块
echo "=== 已向量化的分块 ===\n\n";
$result = $mysqli->query("SELECT COUNT(*) as total. FROM kb_chunks WHERE milvus_id IS NOT NULL AND milvus_id != ''");
if ($result) {
    $row = $result->fetch_assoc();
    echo "已向量化分块数: " . $row['total'] . "\n\n";
}

// 查询未向量化的分块
echo "=== 未向量化的分块 ===\n\n";
$result = $mysqli->query("SELECT COUNT(*) as total FROM kb_chunks WHERE (milvus_id IS NULL OR milvus_id = '') AND file_id IN (SELECT id FROM kb_files WHERE chunk_status = 2)");
if ($result) {
    $row = $result->fetch_assoc();
    echo "未向量化分块数: " . $row['total'] . "\n\n";
}

$mysqli->close();
