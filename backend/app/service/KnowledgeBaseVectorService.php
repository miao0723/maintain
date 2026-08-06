<?php

namespace app\service;

use app\model\KnowledgeBase;
use think\facade\Log;

/**
 * 知识库向量服务
 * 管理知识库文本的向量化、存储和检索
 */
class KnowledgeBaseVectorService
{
    private $milvusService;
    private $embeddingService;
    private $collectionName = 'knowledge_base';
    private $dimensions;

    public function __construct()
    {
        $this->milvusService = new MilvusService();
        $this->embeddingService = new SimpleEmbeddingService();
        $this->dimensions = env('EMBEDDING_MODEL_DIMS', 1024);

        // 确保集合存在
        $this->ensureCollection();
    }

    /**
     * 确保集合存在
     */
    private function ensureCollection()
    {
        try {
            if (!$this->milvusService->collectionExists($this->collectionName)) {
                $this->milvusService->createCollection($this->collectionName, $this->dimensions);
                Log::info("知识库向量集合创建成功: {$this->collectionName}");
            }
        } catch (\Exception $e) {
            Log::warning("确保知识库集合失败: " . $e->getMessage());
        }
    }

    /**
     * 为知识库条目创建向量索引
     */
    public function indexKnowledge(int $knowledgeId): bool
    {
        $knowledge = KnowledgeBase::find($knowledgeId);
        if (!$knowledge) {
            throw new \Exception('知识库条目不存在');
        }

        // 先删除该知识库的旧向量
        $this->removeKnowledgeIndex($knowledgeId);

        // 准备文本内容
        $text = $this->prepareText($knowledge);

        try {
            // 生成向量
            $vector = $this->embeddingService->embed($text);

            if (empty($vector)) {
                Log::warning("知识库 {$knowledgeId} 向量生成失败");
                return false;
            }

            // 插入到Milvus
            $result = $this->milvusService->insert($this->collectionName, [
                [
                    'vector' => $vector,
                    'chunk_id' => "kb_{$knowledgeId}",
                    'collection_id' => $knowledgeId,
                ]
            ]);

            Log::info("知识库 {$knowledgeId} 向量索引成功");
            return true;

        } catch (\Exception $e) {
            Log::error("知识库 {$knowledgeId} 向量索引失败: " . $e->getMessage());
            return false;
        }
    }

    /**
     * 准备用于向量化的文本
     */
    private function prepareText(KnowledgeBase $knowledge): string
    {
        $parts = [];

        if (!empty($knowledge->title)) {
            $parts[] = "标题: " . $knowledge->title;
        }

        if (!empty($knowledge->fault_symptom)) {
            $parts[] = "故障现象: " . $knowledge->fault_symptom;
        }

        if (!empty($knowledge->fault_cause)) {
            $parts[] = "故障原因: " . $knowledge->fault_cause;
        }

        if (!empty($knowledge->solution)) {
            $parts[] = "解决方案: " . $knowledge->solution;
        }

        if (!empty($knowledge->tags)) {
            $parts[] = "标签: " . implode(', ', $knowledge->tags);
        }

        return implode("\n\n", $parts);
    }

    /**
     * 删除知识库的向量索引
     */
    public function removeKnowledgeIndex(int $knowledgeId): bool
    {
        try {
            $filter = "collection_id == {$knowledgeId}";
            $this->milvusService->delete($this->collectionName, $filter);
            Log::info("知识库 {$knowledgeId} 向量索引已删除");
            return true;
        } catch (\Exception $e) {
            Log::warning("删除知识库 {$knowledgeId} 向量索引失败: " . $e->getMessage());
            return false;
        }
    }

    /**
     * 向量搜索
     */
    public function vectorSearch(string $query, int $topK = 10): array
    {
        try {
            // 生成查询向量
            $queryVector = $this->embeddingService->embed($query);

            if (empty($queryVector)) {
                throw new \Exception('查询向量生成失败');
            }

            // 在Milvus中搜索
            $results = $this->milvusService->search(
                $this->collectionName,
                $queryVector,
                $topK
            );

            if (empty($results)) {
                return [];
            }

            // 提取知识库ID并获取详细信息
            $knowledgeIds = [];
            foreach ($results as $result) {
                $collectionId = $result['collection_id'] ?? null;
                if ($collectionId) {
                    $knowledgeIds[$collectionId] = $result;
                }
            }

            if (empty($knowledgeIds)) {
                return [];
            }

            // 批量获取知识库详情
            $knowledgeList = KnowledgeBase::whereIn('id', array_keys($knowledgeIds))
                ->with(['category', 'device'])
                ->select();

            // 组合结果
            $finalResults = [];
            foreach ($knowledgeList as $kb) {
                if (isset($knowledgeIds[$kb->id])) {
                    $finalResults[] = [
                        'knowledge' => $kb,
                        'score' => 1 - ($knowledgeIds[$kb->id]['distance'] ?? 0),
                        'distance' => $knowledgeIds[$kb->id]['distance'] ?? 0,
                    ];
                }
            }

            // 按相似度降序排序
            usort($finalResults, function($a, $b) {
                return $b['score'] <=> $a['score'];
            });

            return $finalResults;

        } catch (\Exception $e) {
            Log::error("向量搜索失败: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * 批量重建索引
     */
    public function rebuildIndex(): array
    {
        try {
            // 删除现有集合
            try {
                $this->milvusService->dropCollection($this->collectionName);
            } catch (\Exception $e) {
                // 集合不存在也无所谓
            }

            // 重新创建集合
            $this->milvusService->createCollection($this->collectionName, $this->dimensions);

            // 获取所有已发布的知识库
            $knowledgeList = KnowledgeBase::where('status', KnowledgeBase::STATUS_PUBLISHED)
                ->select();

            $successCount = 0;
            $failCount = 0;
            $failures = [];

            foreach ($knowledgeList as $kb) {
                try {
                    if ($this->indexKnowledge($kb->id)) {
                        $successCount++;
                    } else {
                        $failCount++;
                        $failures[] = [
                            'id' => $kb->id,
                            'title' => $kb->title,
                            'reason' => '向量生成失败'
                        ];
                    }
                } catch (\Exception $e) {
                    $failCount++;
                    $failures[] = [
                        'id' => $kb->id,
                        'title' => $kb->title,
                        'reason' => $e->getMessage()
                    ];
                }
            }

            return [
                'total' => count($knowledgeList),
                'success' => $successCount,
                'failed' => $failCount,
                'failures' => $failures,
            ];

        } catch (\Exception $e) {
            Log::error("重建知识库索引失败: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * 获取集合统计信息
     */
    public function getStats(): array
    {
        try {
            $stats = $this->milvusService->getCollectionStats($this->collectionName);
            return [
                'exists' => true,
                'stats' => $stats,
            ];
        } catch (\Exception $e) {
            return [
                'exists' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
