<?php
/**
 * 测试嵌入服务连接和功能
 */

require __DIR__ . '/../vendor/autoload.php';

use app\service\EmbeddingService;
use app\service\MilvusService;
use app\service\FileProcessingService;
use app\model\KbFile;

echo "=== 嵌入服务测试 ===\n\n";

// 测试1: 检查嵌入服务
echo "1. 测试嵌入服务连接...\n";
try {
    $embedService = new EmbeddingService();
    echo "test 嵌入服务URL: " . env('EMBEDDING_HOST', 'embedding-service') . ":" . env('EMBEDDING_PORT', '8080') . "\n";

    if ($embedService->isAvailable()) {
        echo "✓ 嵌入服务可用\n\n";
    } else {
        echo "✗ 嵌入服务不可用\n\n";
    }

    // 测试嵌入
    echo "2. 测试文本嵌入...\n";
    $testText = "这是一个测试文本";
    $vector = $embedService->embed($testText);
    echo "✓ 嵌入成功，向量维度: " . count($vector) . "\n";
    echo "  前5个值: " . implode(', ', array_slice($vector, 0, 5)) . "\n\n";

} catch (Exception $e) {
    echo "✗ 嵌入服务测试失败: " . $e->getMessage() . "\n\n";
}

// 测试2: 检查Milvus
echo "3. 测试Milvus连接...\n";
try {
    $milvusService = new MilvusService();
    echo "  Milvus URL: " . env('MILVUS_HOST', 'milvus') . ":" . env('MILVUS_PORT', '19530') . "\n";

    // 尝试获取集合列表（如果API支持）
    echo "  注意: 检查连接（具体API可能不同）\n\n";

} catch (Exception $e) {
    echo "✗ Milvus测试失败: " . $e->getMessage() . "\n\n";
}

// 测试3: 重新处理文件
echo "4. 重新处理文件...\n";
$files = KbFile::where('chunk_status', '>', 0)
    ->whereNotNull('chunk_error')
    ->limit(5)
    ->select();

if ($files->isEmpty()) {
    echo "  没有需要重新处理的文件\n\n";
} else {
    $processingService = new FileProcessingService();

    foreach ($files as $file) {
        echo "  处理文件: {$file->original_name}\n";

        try {
            $processingService->processFile($file);
            echo "  ✓ 处理成功\n";
        } catch (Exception $e) {
            echo "  ✗ 处理失败: " . $e->getMessage() . "\n";
        }
    }
    echo "\n";
}

echo "=== 测试完成 ===\n";
