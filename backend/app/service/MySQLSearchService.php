<?php

namespace app\service;

use app\model\KbChunk;
use think\facade\Db;
use think\facade\Log;

/**
 * MySQL 全文搜索服务
 * 替代 Milvus 向量检索，使用 FULLTEXT 索引进行全文搜索
 */
class MySQLSearchService
{
    /**
     * 搜索相关文本块
     * @param int $collectionId 知识库ID
     * @param string $query 搜索查询
     * @param int $limit 返回数量
     * @param float $minScore 最小相关性分数 (0-1)
     * @param array|null $fileIds 文件ID列表，为null表示搜索全部文件
     * @return array 搜索结果
     */
    public function search(int $collectionId, string $query, int $limit = 5, float $minScore = 0.1, ?array $fileIds = null): array
    {
        try {
            if (empty(trim($query))) {
                return [];
            }

            // 检测是否是概括性问题
            $isSummaryQuery = $this->isSummaryQuery($query);

            // 记录搜索参数
            $fileIdsStr = $fileIds ? '[' . implode(',', $fileIds) . ']' : 'null';
            Log::info("开始搜索: collectionId={$collectionId}, query='{$query}', fileIds={$fileIdsStr}, isSummaryQuery=" . ($isSummaryQuery ? 'true' : 'false'));

            // 使用 FULLTEXT 全文搜索
            // MATCH...AGAINST 返回相关性分数
            $queryBuilder = Db::table('kb_chunks')
                ->field('id, content, char_count, file_id, collection_id')
                ->where('collection_id', $collectionId);

            // 如果指定了文件ID，只搜索这些文件
            if ($fileIds !== null && !empty($fileIds)) {
                $queryBuilder->whereIn('file_id', $fileIds);
                Log::info("搜索指定文件: " . implode(',', $fileIds));
            } else {
                Log::info("搜索全部文件（无文件限制）");
            }

            try {
                $results = $queryBuilder
                    ->where('content', 'fulltext', $query)
                    ->orderRaw('MATCH(content) AGAINST(?) DESC', [$query])
                    ->limit($limit * 2) // 多取一些用于相关性计算
                    ->select()
                    ->toArray();

                Log::info("FULLTEXT 搜索返回结果数: " . count($results));
            } catch (\Exception $fulltextError) {
                Log::warning("FULLTEXT 搜索失败: " . $fulltextError->getMessage() . "，回退到 LIKE 搜索");
                $results = [];
            }

            // 如果 FULLTEXT 搜索没有结果，回退到 LIKE 搜索
            if (empty($results)) {
                Log::info("FULLTEXT 搜索无结果，回退到 LIKE 搜索");
                $likeResults = $this->likeSearch($collectionId, $query, $limit, $fileIds);

                // 如果 LIKE 搜索也没结果且是概括性问题，返回一些随机内容
                if (empty($likeResults) && $isSummaryQuery) {
                    Log::info("概括性问题无搜索结果，返回随机内容");
                    return $this->getRandomChunks($collectionId, $limit, $fileIds);
                }

                return $likeResults;
            }

            // 计算相关性分数
            $scoredResults = [];
            foreach ($results as $item) {
                $score = $this->calculateRelevance($query, $item['content']);
                if ($score >= $minScore) {
                    $scoredResults[] = [
                        'chunk_id' => $item['id'],
                        'score' => $score,
                        'content' => $item['content'],
                        'data' => $item
                    ];
                }
            }

            // 如果没有符合分数要求的结果且是概括性问题，返回一些随机内容
            if (empty($scoredResults) && $isSummaryQuery) {
                Log::info("概括性问题无高分结果，返回随机内容");
                return $this->getRandomChunks($collectionId, $limit, $fileIds);
            }

            // 按分数排序并取前 N 个
            usort($scoredResults, function($a, $b) {
                return $b['score'] <=> $a['score'];
            });

            return array_slice($scoredResults, 0, $limit);

        } catch (\Exception $e) {
            Log::error("MySQL 全文搜索失败: " . $e->getMessage());
            // 回退到 LIKE 搜索
            return $this->likeSearch($collectionId, $query, $limit, $fileIds);
        }
    }

    /**
     * LIKE 搜索作为回退方案
     * @param int $collectionId 知识库ID
     * @param string $query 搜索查询
     * @param int $limit 返回数量
     * @param array|null $fileIds 文件ID列表，为null表示搜索全部文件
     * @return array 搜索结果
     */
    private function likeSearch(int $collectionId, string $query, int $limit = 5, ?array $fileIds = null): array
    {
        // 提取关键词
        $keywords = $this->extractKeywords($query);

        if (empty($keywords)) {
            return [];
        }

        try {
            $queryBuilder = Db::table('kb_chunks')
                ->field('id, content, char_count, file_id, collection_id')
                ->where('collection_id', $collectionId);

            // 如果指定了文件ID，只搜索这些文件
            if ($fileIds !== null && !empty($fileIds)) {
                $queryBuilder->whereIn('file_id', $fileIds);
            }

            // 构建多个 OR 条件
            $queryBuilder->where(function($q) use ($keywords) {
                foreach ($keywords as $keyword) {
                    $q->whereOr('content', 'like', "%{$keyword}%");
                }
            });

            $results = $queryBuilder->limit($limit * 2)->select()->toArray();

            // 计算分数
            $scoredResults = [];
            foreach ($results as $item) {
                $score = $this->calculateRelevance($query, $item['content']);
                $scoredResults[] = [
                    'chunk_id' => $item['id'],
                    'score' => $score,
                    'content' => $item['content'],
                    'data' => $item
                ];
            }

            // 按分数排序
            usort($scoredResults, function($a, $b) {
                return $b['score'] <=> $a['score'];
            });

            return array_slice($scoredResults, 0, $limit);

        } catch (\Exception $e) {
            Log::error("LIKE 搜索失败: " . $e->getMessage());
            return [];
        }
    }

    /**
     * 获取随机文本块（用于概括性问题）
     * @param int $collectionId 知识库ID
     * @param int $limit 返回数量
     * @param array|null $fileIds 文件ID列表
     * @return array 搜索结果
     */
    private function getRandomChunks(int $collectionId, int $limit = 5, ?array $fileIds = null): array
    {
        try {
            Log::info("获取随机文本块: collectionId={$collectionId}, limit={$limit}, fileIds=" . ($fileIds ? '[' . implode(',', $fileIds) . ']' : 'null'));

            $queryBuilder = Db::table('kb_chunks')
                ->field('id, content, char_count, file_id, collection_id')
                ->where('collection_id', $collectionId);

            if ($fileIds !== null && !empty($fileIds)) {
                $queryBuilder->whereIn('file_id', $fileIds);
                Log::info("限制文件范围: " . implode(',', $fileIds));
            } else {
                Log::info("搜索全部文件（无文件限制）");
            }

            $results = $queryBuilder
                ->orderRaw('RAND()')
                ->limit($limit)
                ->select()
                ->toArray();

            Log::info("获取随机文本块结果数: " . count($results));

            if (empty($results)) {
                return [];
            }

            // 构造结果
            $scoredResults = [];
            foreach ($results as $item) {
                $scoredResults[] = [
                    'chunk_id' => $item['id'],
                    'score' => 0.5, // 概括性问题给中等分数
                    'content' => $item['content'],
                    'data' => $item
                ];
            }

            return $scoredResults;

        } catch (\Exception $e) {
            Log::error("获取随机文本块失败: " . $e->getMessage());
            return [];
        }
    }

    /**
     * 判断是否是概括性问题
     * @param string $query 查询文本
     * @return bool
     */
    private function isSummaryQuery(string $query): bool
    {
        $summaryKeywords = [
            '总结', '概括', '概述', '摘要', '主要内容',
            '分析', '介绍', '说明', '讲述', '详细说明',
            '我有什么文件', '文档内容', '文档中', '文件里'
        ];

        $queryLower = mb_strtolower($query);
        foreach ($summaryKeywords as $keyword) {
            if (mb_strpos($queryLower, $keyword) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * 计算查询与内容的匹配度
     * 使用简单的词频统计
     */
    private function calculateRelevance(string $query, string $content): float
    {
        $queryWords = array_filter(array_unique(explode(' ', mb_strtolower(preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $query)))));
        $contentLower = mb_strtolower($content);

        if (empty($queryWords)) {
            return 0;
        }

        $matches = 0;
        $totalQueryLength = mb_strlen(implode('', $queryWords));

        foreach ($queryWords as $word) {
            if (mb_strpos($contentLower, $word) !== false) {
                $matches += mb_strlen($word);
            }
        }

        // 计算简单的相关性分数 (0-1)
        $relevance = $matches / max($totalQueryLength, 1);

        // 奖励完全匹配
        if (mb_strpos($contentLower, $query) !== false) {
            $relevance = min($relevance * 1.5, 1.0);
        }

        return round($relevance, 4);
    }

    /**
     * 提取查询中的关键词
     */
    private function extractKeywords(string $query): array
    {
        // 移除标点符号
        $cleaned = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $query);
        $words = preg_split('/\s+/', $cleaned);

        // 过滤停用词和短词
        $stopWords = ['的', '了', '是', '在', '有', '和', '与', '或', '这个', '那个', '怎么', '什么', '哪里', '吗'];
        $keywords = [];

        foreach ($words as $word) {
            $word = trim($word);
            if (mb_strlen($word) >= 2 && !in_array($word, $stopWords)) {
                $keywords[] = $word;
            }
        }

        return array_unique($keywords);
    }

    /**
     * 搜索并返回包含文件信息的完整结果
     * @param int $collectionId 知识库ID
     * @param string $query 搜索查询
     * @param int $limit 返回数量
     * @param array|null $fileIds 文件ID列表，为null表示搜索全部文件
     * @return array 包含 chunk 和 file 信息的完整结果
     */
    public function searchWithFiles(int $collectionId, string $query, int $limit = 5, ?array $fileIds = null): array
    {
        $searchResults = $this->search($collectionId, $query, $limit, 0.1, $fileIds);

        if (empty($searchResults)) {
            return [];
        }

        // 获取 chunk IDs
        $chunkIds = array_column($searchResults, 'chunk_id');

        // 批量查询 chunks 和关联的 files
        $chunks = KbChunk::whereIn('id', $chunkIds)
            ->with('file')
            ->select();

        // 构建 chunk id 到 chunk 的映射
        $chunkMap = [];
        foreach ($chunks as $chunk) {
            $chunkMap[$chunk->id] = $chunk;
        }

        // 组合结果
        $finalResults = [];
        foreach ($searchResults as $result) {
            $chunkId = $result['chunk_id'];
            if (isset($chunkMap[$chunkId])) {
                $chunk = $chunkMap[$chunkId];
                $finalResults[] = [
                    'chunk' => $chunk,
                    'file' => $chunk->file ?? null,
                    'score' => $result['score'],
                ];
            }
        }

        return $finalResults;
    }
}
