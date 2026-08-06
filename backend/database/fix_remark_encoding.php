<?php
/**
 * 修复 statistics_income_records 表的 remark 字段乱码
 *
 * 现象: remark 字段显示 "çº¿ä¸Šç»´ä¿®æ"¶æ¬¾" 但实际应为 "线上维修收款"
 * 原因: UTF-8 字节被当做 Latin-1 读取并存储（Mojibake / 乱码）
 *
 * 修复原理（MySQL 双重转换）:
 *   乱码UTF-8 → Latin-1 → 二进制 → UTF-8
 *   CONVERT(CAST(CONVERT(remark USING latin1) AS BINARY) USING utf8mb4)
 *
 * 用法: php database/fix_remark_encoding.php
 */

$env = parse_ini_file(__DIR__ . '/../.env');

$dsn = sprintf(
    'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
    $env['DATABASE_HOSTNAME'] ?? '127.0.0.1',
    $env['DATABASE_HOSTPORT'] ?? '3306',
    $env['DATABASE_DATABASE'] ?? 'cmms_db'
);

try {
    $pdo = new PDO($dsn, $env['DATABASE_USERNAME'] ?? 'root', $env['DATABASE_PASSWORD'] ?? 'root123', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    echo "✅ 连接数据库成功\n\n";

    // 第一步：找出所有有乱码风险的记录（包含非BMP字符的，或明显是乱码的）
    echo "--- 检查 remark 中可能的乱码 ---\n";
    $stmt = $pdo->query("
        SELECT id, remark, HEX(remark) AS hex_val
        FROM statistics_income_records
        WHERE remark REGEXP '[ªº¿çèéêëìíîïðñòóôõöøùúûüýþÿ]'
           OR remark LIKE '%\\xC3\\xA7%'
        ORDER BY id
    ");
    $rows = $stmt->fetchAll();

    if (empty($rows)) {
        echo "没有找到乱码数据，可能已经被修复过了\n";
        exit(0);
    }

    echo "找到 " . count($rows) . " 条可能乱码的记录:\n";
    foreach ($rows as $row) {
        echo "  ID={$row['id']}: remark='{$row['remark']}' HEX={$row['hex_val']}\n";
    }
    echo "\n";

    // 第二步：用 MySQL 的双重转换来修复
    echo "--- 执行修复 ---\n";
    $pdo->exec("
        UPDATE statistics_income_records
        SET remark = CONVERT(CAST(CONVERT(remark USING latin1) AS BINARY) USING utf8mb4)
        WHERE remark REGEXP '[ªº¿çèéêëìíîïðñòóôõöøùúûüýþÿ]'
    ");

    $fixed = $pdo->query("SELECT ROW_COUNT() AS cnt")->fetch()['cnt'];
    echo "✅ 修复了 {$fixed} 条记录\n\n";

    // 第三步：验证修复结果
    echo "--- 修复后验证 ---\n";
    $stmt = $pdo->query("SELECT id, remark FROM statistics_income_records ORDER BY id");
    $allRows = $stmt->fetchAll();
    foreach ($allRows as $row) {
        $hasChinese = preg_match('/[\x{4e00}-\x{9fff}]/u', $row['remark']);
        echo "  ID={$row['id']}: remark='{$row['remark']}' " . ($hasChinese ? '✅' : '⚠️ 无中文') . "\n";
    }

} catch (PDOException $e) {
    echo "❌ 数据库错误: " . $e->getMessage() . "\n";
    exit(1);
}