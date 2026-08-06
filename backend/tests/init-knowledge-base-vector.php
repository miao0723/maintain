<?php
/**
 * 知识库向量初始化脚本
 * 创建Milvus collection并导入所有已发布知识库
 */

require __DIR__ . '/../vendor/autoload.php';

use app\service\KnowledgeBaseVectorService;
use app\service\KnowledgeBaseService;
use app\model\KnowledgeBase;
use think\facade\Log;

// 初始化ThinkPHP
$app = require __DIR__ . '/../app/provider.php';

echo "=== 知识库向量初始化 ===\n\n";

try {
    echo "步骤1: 检查Milvus连接...\n";
    $vectorService = new KnowledgeBaseVectorService();
    echo "  ✅ Milvus连接成功\n\n";

    echo "步骤2: 获取知识库向量统计...\n";
    $stats = $vectorService->getStats();
    echo "  集合存在: " . ($stats['exists'] ? '是' : '否') . "\n";
    if ($stats['exists'] && isset($stats['stats']['count'])) {
        echo "  当前向量数量: " . $stats['stats']['count'] . "\n";
    }
    echo "\n";

    echo "步骤3: 获取所有已发布知识库...\n";
    $knowledgeList = KnowledgeBase::where('status', KnowledgeBase::STATUS_PUBLISHED)
        ->select();
    echo "  找到 " . count($knowledgeList) . " 条已发布知识库\n\n";

    if (count($knowledgeList) === 0) {
        echo "没有已发布知识库，无需导入。\n";
        exit(0);
    }

    echo "步骤4: 开始导入向量数据...\n";
    $successCount = 0;
    $failCount = 0;
    $failures = [];

    foreach ($knowledgeList as $index => $kb) {
        $progress = floor(($index + 1) / count($knowledgeList) * 100);
        echo "  [{$progress}%] 处理 ID: {$kb->id}, 标题: {$kb->title}... ";

        try {
            $result = $vectorService->indexKnowledge($kb->id);
            if ($result) {
                echo "✅\n";
                $successCount++;
            } else {
                echo "❌ (向量生成失败)\n";
                $failCount++;
                $failures[] = [
                    'id' => $kb->id,
                    'title' => $kb->title,
                    'reason' => '向量生成失败'
                ];
            }
        } catch (\Exception $e) {
            echo "❌ (" . $e->getMessage() . ")\n";
            $failCount++;
            $failures[] = [
                'id' => $kb->id,
                'title' => $kb->title,
                'reason' => $e->getMessage()
            ];
        }

        // 每10条输出一次统计
        if (($index + 1) % 10 === 0) {
            echo "  当前进度: 成功 {$successCount}, 失败 {$failCount}\n";
        }
    }

    echo "\n步骤5: 导入完成\n";
    echo "  总计: " . count($knowledgeList) . "\n";
    echo "  成功: {$successCount}\n";
    echo "  失败: {$failCount}\n";

    if (!empty($failures)) {
        echo "\n失败详情:\n";
        foreach ($failures as $failure) {
            echo "  ID: {$failure['id']}, 标题: {$failure['title']}, 原因: {$failure['reason']}\n";
        }
    }

    echo "\n最终向量统计:\n";
    $finalStats = $vectorService->getStats();
    if ($finalStats['exists'] && isset($finalStats['stats']['count'])) {
        echo "  向量总数: " . $finalStats['stats']['count'] . "\n";
    }

    echo "\n=== 初始化完成 ===\n";

    if ($failCount > 0) {
        echo "\n警告: 有 {$failCount} 条知识库导入失败\n";
        exit(1);
    }

} catch (\Exception $e) {
    echo "\n❌ 错误: " . $e->getMessage() . "\n";
    echo "堆栈: " . $e->getTraceAsString() . "\n";
    exit(1);
}
