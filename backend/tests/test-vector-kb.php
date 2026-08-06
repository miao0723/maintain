<?php
/**
 * 知识库向量搜索测试脚本
 *
 * 用法: php tests/test-vector-kb.php [command]
 * 命令:
 *   - stats: 获取向量索引统计信息
 *   - rebuild: 重建所有知识库的向量索引
 *   - search "关键词": 搜索知识库
 */

require __DIR__ . '/../vendor/autoload.php';

use think\facade\Log;
use app\service\KnowledgeBaseVectorService;
use app\service\KnowledgeBaseService;

// 初始化ThinkPHP
$app = require __DIR__ . '/../app/provider.php';

echo "=== 知识库向量搜索测试 ===\n\n";

$command = $argv[1] ?? 'stats';

try {
    switch ($command) {
        case 'stats':
            echo "获取向量索引统计信息...\n";
            $vectorService = new KnowledgeBaseVectorService();
            $stats = $vectorService->getStats();

            echo json_encode($stats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
            break;

        case 'rebuild':
            echo "重建知识库向量索引...\n";
            $kbService = new KnowledgeBaseService();
            $result = $kbService->rebuildVectorIndex();

            echo "总计: {$result['total']}\n";
            echo "成功: {$result['success']}\n";
            echo "失败: {$result['failed']}\n";

            if (!empty($result['failures'])) {
                echo "\n失败详情:\n";
                foreach ($result['failures'] as $failure) {
                    echo "  ID: {$failure['id']}, 标题: {$failure['title']}, 原因: {$failure['reason']}\n";
                }
            }
            break;

        case 'search':
            $keyword = $argv[2] ?? '';
            if (empty($keyword)) {
                echo "请提供搜索关键词\n";
                echo "用法: php tests/test-vector-kb.php search \"关键词\"\n";
                exit(1);
            }

            echo "搜索关键词: {$keyword}\n\n";

            $kbService = new KnowledgeBaseService();
            $result = $kbService->search($keyword, 5, true);

            echo "搜索方式: {$result['method']}\n";
            echo "匹配数量: {$result['total']}\n\n";

            foreach ($result['results'] as $index => $item) {
                $kb = $item['knowledge'];
                $score = $item['score'];
                $distance = $item['distance'] ?? 0;

                echo "=== 结果 " . ($index + 1) . " ===\n";
                echo "相似度: " . number_format($score * 100, 2) . "%\n";
                if (isset($distance)) {
                    echo "距离: " . number_format($distance, 4) . "\n";
                }
                echo "标题: {$kb->title}\n";
                echo "故障现象: {$kb->fault_symptom}\n";
                if (!empty($kb->fault_cause)) {
                    echo "故障原因: {$kb->fault_cause}\n";
                }
                if (!empty($kb->solution)) {
                    echo "解决方案: {$kb->solution}\n";
                }
                echo "\n";
            }
            break;

        default:
            echo "未知命令: {$command}\n";
            echo "可用命令:\n";
            echo "  stats    - 获取向量索引统计信息\n";
            echo "  rebuild  - 重建所有知识库的向量索引\n";
            echo "  search   - 搜索知识库\n";
            exit(1);
    }

    echo "\n=== 测试完成 ===\n";

} catch (\Exception $e) {
    echo "错误: " . $e->getMessage() . "\n";
    echo "堆栈: " . $e->getTraceAsString() . "\n";
    exit(1);
}
