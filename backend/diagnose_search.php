<?php
/**
 * 诊断知识库搜索问题
 */

require __DIR__ . '/vendor/autoload.php';

use app\model\KbCollection;
use app\model\KbFile;
use app\model\KbChunk;
use app\service\MySQLSearchService;
use think\facade\Db;

echo "=== 知识库搜索诊断 ===\n\n";

// 初始化数据库连接
try {
    $db = Db::connect();
    echo "✓ 数据库连接成功\n";
} catch (\Exception $e) {
    echo "✗ 数据库连接失败: " . $e->getMessage() . "\n";
    exit(1);
}

// 1. 检查 FULLTEXT 索引
echo "\n1. 检查 FULLTEXT 索引...\n";
try {
    $indexes = Db::query("SHOW INDEX FROM kb_chunks WHERE Key_name = 'idx_content_fulltext'");
    if (!empty($indexes)) {
        echo "✓ FULLTEXT 索引已存在存在\n";
        print_r($indexes);
    } else {
        echo "✗ FULLTEXT 索引不存在\n";
    }
} catch (\Exception $e) {
    echo "✗ 检查索引失败: " . $e->getMessage() . "\n";
}

// 2. 检查知识库数据
echo "\n2. 检查知识库数据...\n";
try {
    $collectionCount = KbCollection::count();
    echo "  知识库数量: {$collectionCount}\n";

    $fileCount = KbFile::count();
    echo "  文件数量: {$fileCount}\n";

    $chunkCount = KbChunk::count();
    echo "  文本块数量: {$chunkCount}\n";

    if ($chunkCount === 0) {
        echo "\n✗ 没有任何文本块，无法进行搜索\n";
        echo "  提示: 请先上传文件并完成分块处理\n";
        exit(0);
    }

} catch (\Exception $e) {
    echo "✗ 检查数据失败: " . $e->getMessage() . "\n";
    exit(1);
}

// 3. 列出所有知识库
echo "\n3. 列出所有知识库...\n";
try {
    $collections = KbCollection::select();
    foreach ($collections as $col) {
        $fileCount = KbFile::where('collection_id', $col->id)->count();
        $chunkCount = KbChunk::where('collection_id', $col->id)->count();
        echo "  [ID: {$col->id}] {$col->name} (状态: {$col->status}) - 文件: {$fileCount}, 块: {$chunkCount}\n";
    }
} catch (\Exception $e) {
    echo "✗ 查询知识库失败: " . $e->getMessage() . "\n";
}

// 4. 测试搜索 - 使用第一个知识库
echo "\n4. 测试搜索功能...\n";
try {
    $firstCollection = KbCollection::find();
    if (!$firstCollection) {
        echo "✗ 没有知识库可测试\n";
        exit(0);
    }

    echo "  使用知识库: {$firstCollection->name} (ID: {$firstCollection->id})\n";

    // 检查该知识库的文本块
    $chunks = KbChunk::where('collection_id', $firstCollection->id)->limit(3)->select();
    echo "  前3个文本块预览:\n";
    foreach ($chunks as $chunk) {
        $excerpt = mb_substr($chunk->content, 0, 60) . '...';
        echo "    [块ID: {$chunk->id}] {$excerpt}\n";
    }

    $searchService = new MySQLSearchService();

    // 测试1: 不指定文件ID（模拟"全部文件"模式）
    echo "\n  测试1: 搜索全部文件 (fileIds = null)...\n";
    $results1 = $searchService->search($firstCollection->id, '故障', 3, 0.1, null);
    if (empty($results1)) {
        echo "    ✗ 未找到结果\n";
    } else {
        echo "    ✓ 找到 " . count($results1) . " 个结果:\n";
        foreach ($results1 as $result) {
            $excerpt = mb_substr($result['content'], 0, 50) . '...';
            echo "      [分数: {$result['score']}] {$excerpt}\n";
        }
    }

    // 测试2: 指定文件ID列表（模拟"选择文件"模式）
    $fileIds = KbFile::where('collection_id', $firstCollection->id)->limit(1)->column('id');
    if (!empty($fileIds)) {
        echo "\n  测试2: 搜索指定文件 (fileIds = [" . implode(', ', $fileIds) . "])...\n";
        $results2 = $searchService->search($firstCollection->id, '故障', 3, 0.1, $fileIds);
        if (empty($results2)) {
            echo "    ✗ 未找到结果\n";
        } else {
            echo "    ✓ 找到 " . count($results2) . " 个结果:\n";
            foreach ($results2 as $result) {
                $excerpt = mb_substr($result['content'], 0, 50) . '...';
                echo "      [分数: {$result['score']}] {$excerpt}\n";
            }
        }
    }

} catch (\Exception $e) {
    echo "✗ 搜索测试失败: " . $e->getMessage() . "\n";
    echo "  堆栈跟踪:\n";
    echo $e->getTraceAsString() . "\n";
}

// 5. 检查原始 SQL 查询
echo "\n5. 检查原始 SQL 查询...\n";
try {
    $firstCollection = KbCollection::find();
    if ($firstCollection) {
        echo "  执行原始 FULLTEXT 查询...\n";

        // 直接测试 FULLTEXT 查询
        $sql = "SELECT id, file_id, content, MATCH(content) AGAINST('故障') as score
                FROM kb_chunks
                WHERE collection_id = {$firstCollection->id}
                AND MATCH(content) AGAINST('故障')
                ORDER BY score DESC
                LIMIT 3";

        $directResults = Db::query($sql);

        if (empty($directResults)) {
            echo "    ✗ FULLTEXT 查询无结果\n";
        } else {
            echo "    ✓ 找到 " . count($directResults) . " 个结果:\n";
            foreach ($directResults as $result) {
                $excerpt = mb_substr($result['content'], 0, 50) . '...';
                echo "      [分数: {$result['score']}] {$excerpt}\n";
            }
        }
    }
} catch (\Exception $e) {
    echo "✗ SQL 查询失败: " . $e->getMessage() . "\n";
}

echo "\n=== 诊断完成 ===\n";
