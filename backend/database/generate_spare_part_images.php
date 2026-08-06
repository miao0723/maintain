<?php
/**
 * 为配件生成图片的脚本
 * 执行方式：php database/generate_spare_part_images.php
 */

// 配置数据库连接
$host = 'localhost';
$dbname = 'cmms_db';
$username = 'root';
$password = '';

try {
    // 连接数据库
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 查询所有配件
    $stmt = $pdo->query("SELECT id, part_name, part_code, category_id FROM spare_parts WHERE image_url IS NULL OR image_url = ''");
    $parts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($parts)) {
        echo "没有需要生成图片的配件\n";
        exit;
    }

    echo "找到 " . count($parts) . " 个需要生成图片的配件\n";

    // 确保上传目录存在
    $uploadDir = dirname(__DIR__) . '/public/uploads/parts/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
        echo "创建上传目录: $uploadDir\n";
    }

    // 为每个配件生成图片
    foreach ($parts as $part) {
        $imageUrl = generatePartImage($part, $uploadDir);

        if ($imageUrl) {
            // 更新数据库
            $updateStmt = $pdo->prepare("UPDATE spare_parts SET image_url = ?, updated_at = NOW() WHERE id = ?");
            $updateStmt->execute([$imageUrl, $part['id']]);
            echo "已生成图片: {$part['part_name']} -> $imageUrl\n";
        } else {
            echo "生成图片失败: {$part['part_name']}\n";
        }
    }

    echo "\n完成！\n";

} catch (PDOException $e) {
    echo "数据库连接失败: " . $e->getMessage() . "\n";
    exit(1);
}

/**
 * 根据配件信息生成SVG图片
 */
function generatePartImage($part, $uploadDir)
{
    $partName = $part['part_name'];
    $partCode = $part['part_code'];
    $categoryId = $part['category_id'];

    // 根据分类ID选择不同颜色和图标
    $colors = [
        101 => '#4CAF50', // 绿色 - 滤芯类
        102 => '#2196F3', // 蓝色 - 电子元件
        103 => '#FF9800', // 橙色 - 机械零件
    ];

    $color = $colors[$categoryId] ?? '#607D8B';
    $lightColor = adjustBrightness($color, 40);

    // 生成唯一文件名
    $filename = 'part_' . $part['id'] . '_' . time() . '.svg';
    $filePath = $uploadDir . $filename;
    $relativePath = '/uploads/parts/' . $filename;

    // 截取配件名称用于显示
    $displayName = mb_strlen($partName) > 8 ? mb_substr($partName, 0, 8) . '...' : $partName;

    // 创建SVG内容
    $svg = '<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:' . $lightColor . ';stop-opacity:1" />
      <stop offset="100%" style="stop-color:' . $color . ';stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="16" fill="url(#bg-gradient)" />
  <rect width="200" height="200" rx="16" fill="' . $color . '" opacity="0.1" />
  <circle cx="100" cy="80" r="35" fill="white" opacity="0.9" />
  <text x="100" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="' . $color . '">' . mb_substr($displayName, 0, 2) . '</text>
  <rect x="20" y="130" width="160" height="40" rx="8" fill="white" opacity="0.95" />
  <text x="100" y="155" text-anchor="middle" font-family="Microsoft YaHei, Arial, sans-serif" font-size="12" fill="#333">' . htmlspecialchars($displayName) . '</text>
  <text x="100" y="175" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#666">' . htmlspecialchars($partCode) . '</text>
</svg>';

    // 保存文件
    if (file_put_contents($filePath, $svg)) {
        return $relativePath;
    }

    return false;
}

/**
 * 调整颜色亮度
 */
function adjustBrightness($hex, $percent)
{
    $hex = str_replace('#', '', $hex);
    $r = hexdec(substr($hex, 0, 2));
    $g = hexdec(substr($hex, 2, 2));
    $b = hexdec(substr($hex, 4, 2));

    $r = min(255, max(0, $r + ($r * $percent / 100)));
    $g = min(255, max(0, $g + ($g * $percent / 100)));
    $b = min(255, max(0, $b + ($b * $percent / 100)));

    return sprintf('#%02X%02X%02X', $r, $g, $b);
}
