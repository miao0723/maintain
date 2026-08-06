<?php
/**
 * 测试 MySQL 全文检索知识库功能
 */

require __DIR__ . '/vendor/autoload.php';

use app\model\KbCollection;
use app\model\KbFile;
use app\model\KbChunk;
use app\service\MySQLSearchService;
use think\facade\Db;

echo "=== 知识库 MySQL 全文检索测试 ===\n\n";

// 初始化数据库连接
try {
    $db = Db::connect();
    echo "✓ 数据库连接成功\n";
} catch (\Exception $e) {
    echo "✗ 数据库连接失败: " . $e->getMessage() . "\n";
    exit(1);
}

// 测试1: 检查 FULLTEXT 索引
echo "\n1. 检查 FULLTEXT 索引...\n";
try {
    $indexes = Db::query("SHOW INDEX FROM kb_chunks WHERE Key_name = 'idx_content_fulltext'");
    if (!empty($indexes)) {
        echo "✓ FULLTEXT 索引已存在\n";
    } else {
        echo "✗ FULLTEXT 索引不存在，请执行: ALTER TABLE kb_chunks ADD FULLTEXT INDEX idx_content_fulltext (content) WITH PARSER ngram;\n";
    }
} catch (\Exception $e) {
    echo "✗ 检查索引失败: " . $e->getMessage() . "\n";
}

// 测试2: 创建测试知识库
echo "\n2. 创建测试知识库...\n";
try {
    $collection = KbCollection::where('name', '测试知识库')->find();
    if (!$collection) {
        $collection = KbCollection::create([
            'name' => '测试知识库',
            'description' => '用于测试 MySQL 全文检索的知识库',
            'milvus_collection_name' => 'mysql_fulltext',
            'status' => 1,
            'created_by' => 1,
        ]);
        echo "✓ 创建测试知识库成功 (ID: {$collection->id})\n";
    } else {
        echo "✓ 使用已存在的测试知识库 (ID: {$collection->id})\n";
    }
} catch (\Exception $e) {
    echo "✗ 创建知识库失败: " . $e->getMessage() . "\n";
    exit(1);
}

// 测试3: 创建测试文件和分块
echo "\n3. 创建测试数据...\n";
try {
    // 删除旧测试数据
    KbFile::where('collection_id', $collection->id)->delete();
    KbChunk::where('collection_id', $collection->id)->delete();

    // 创建测试文本块
    $testChunks = [
        '机器故障诊断指南：当机器出现异常响声时，首先检查传动系统是否有松动。如果传动系统正常，则需要检查电机轴承是否过热。电机轴承温度超过60度时需要停机检修。',
        '定期维护计划：每周检查传动链条的润滑情况，每月检查电气线路的完整性，每季度进行全面的安全检查。重要维护操作需要记录在维护日志中。',
        '维修流程说明：接到维修工单后，首先评估故障等级。紧急故障需要在2小时内响应，普通故障需要在24小时内响应。维修完成后需要填写维修报告。',
        '备件管理：常用备件需要保持至少3个的库存量。当库存降至最低水平时，需要及时补充。备件入库需要进行质量检验。',
        '安全操作规范：维修操作前必须断电并挂锁挂牌。高空作业需要佩戴安全带，两人以上协作时需要使用统一的手势信号。',
    ];

    foreach ($testChunks as $index => $content) {
        KbChunk::create([
            'file_id' => 1, // 临时文件ID
            'collection_id' => $collection->id,
            'chunk_index' => $index,
            'content' => $content,
            'char_count' => mb_strlen($content),
        ]);
    }

    echo "✓ 创建了 " . count($testChunks) . " 个测试文本块\n";
} catch (\Exception $e) {
    echo "✗ 创建测试数据失败: " . $e->getMessage() . "\n";
    exit(1);
}

// 测试4: 全文搜索
echo "\n4. 测试 MySQL 全文搜索...\n";
try {
    $searchService = new MySQLSearchService();

    $queries = [
        '故障诊断',
        '维护计划',
        '备件库存',
        '安全操作',
    ];

    foreach ($queries as $query) {
        echo "\n  搜索: {$query}\n";
        $results = $searchService->search($collection->id, $query, 3);

        if (empty($results)) {
            echo "  ✗ 未找到结果\n";
        } else {
            echo "  ✓ 找到 " . count($results) . " 个结果:\n";
            foreach ($results as $result) {
                $excerpt = mb_substr($result['content'], 0, 50) . '...';
                echo "    - 相关性: {$result['score']} | {$excerpt}\n";
            }
        }
    }

} catch (\Exception $e) {
    echo "✗ 全文搜索失败: " . $e->getMessage() . "\n";
    exit(1);
}

// 测试5: 带 文件信息的搜索
echo "\n\n5. 测试带文件信息的搜索...\n";
try {
    $searchService = new MySQLSearchService();
    $results = $searchService->searchWithFiles($collection->id, '维修流程', 2);

    if (!empty($results)) {
        echo "✓ 找到 " . count($results) . " 个结果\n";
    } else {
        echo "✗ 未找到结果\n";
    }

} catch (\Exception $e) {
    echo "✗ 搜索失败: " . $e->getMessage() . "\n";
}

echo "\n=== 测试完成 ===\n";
