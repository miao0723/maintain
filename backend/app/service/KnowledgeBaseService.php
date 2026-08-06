<?php

namespace app\service;

use app\model\KnowledgeBase;
use app\model\DeviceCategory;
use think\facade\Log;

class KnowledgeBaseService
{
    /**
     * 获取知识库列表（分页+筛选）
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = KnowledgeBase::with(['category', 'device', 'creator']);

        // 按状态筛选
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        } else {
            // 默认只显示已发布的
            $query->where('status', KnowledgeBase::STATUS_PUBLISHED);
        }

        // 按分类筛选
        if (isset($filters['category_id']) && !empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        // 按设备筛选
        if (isset($filters['device_id']) && !empty($filters['device_id'])) {
            $query->where('device_id', $filters['device_id']);
        }

        // 按难度等级筛选
        if (isset($filters['difficulty_level']) && !empty($filters['difficulty_level'])) {
            $query->where('difficulty_level', $filters['difficulty_level']);
        }

        // 搜索标题或故障现象
        if (isset($filters['keyword']) && !empty($filters['keyword'])) {
            $keyword = $filters['keyword'];
            $query->where(function ($q) use ($keyword) {
                $q->whereLike('title', '%' . $keyword . '%')
                  ->whereOr('fault_symptom', 'like', '%' . $keyword . '%')
                  ->whereOr('fault_cause', 'like', '%' . $keyword . '%');
            });
        }

        // 排序：按使用次数降序，创建时间降序
        $query->order('usage_count', 'desc')
              ->order('id', 'desc');

        $list = $query->page($page, $limit)->select();
        $total = $query->count();

        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取知识库详情
     */
    public function getDetail($id)
    {
        $kb = KnowledgeBase::with(['category', 'device', 'creator'])->find($id);

        if (!$kb) {
            throw new \Exception('知识库条目不存在');
        }

        // 增加使用次数
        $kb->incrementUsage();

        return $kb;
    }

    /**
     * 创建知识库条目
     */
    public function create($data, $userId)
    {
        // 检查分类是否存在
        if (isset($data['category_id']) && !empty($data['category_id'])) {
            $category = DeviceCategory::find($data['category_id']);
            if (!$category) {
                throw new \Exception('设备分类不存在');
            }
        }

        // 设置默认值
        $data['status'] = $data['status'] ?? KnowledgeBase::STATUS_DRAFT;
        $data['difficulty_level'] = $data['difficulty_level'] ?? KnowledgeBase::DIFFICULTY_MEDIUM;
        $data['usage_count'] = 0;
        $data['created_by'] = $userId;

        // 处理JSON字段
        if (isset($data['tags']) && is_array($data['tags'])) {
            $data['tags'] = $data['tags'];
        } else {
            $data['tags'] = [];
        }

        if (isset($data['related_part_ids']) && is_array($data['related_part_ids'])) {
            $data['related_part_ids'] = $data['related_part_ids'];
        } else {
            $data['related_part_ids'] = [];
        }

        // 显式指定允许的字段
        $allowedFields = [
            'title', 'fault_symptom', 'fault_cause', 'solution',
            'category_id', 'device_id', 'related_part_ids', 'tags',
            'difficulty_level', 'usage_count', 'status', 'created_by'
        ];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $kb = new KnowledgeBase();
        $kb->data($filteredData);
        $kb->save();

        $kb = $kb->refresh();

        // 如果是已发布状态，创建向量索引
        if ($kb->status == KnowledgeBase::STATUS_PUBLISHED) {
            try {
                $vectorService = new KnowledgeBaseVectorService();
                $vectorService->indexKnowledge($kb->id);
            } catch (\Exception $e) {
                Log::warning("创建知识库向量索引失败: " . $e->getMessage());
            }
        }

        return $kb;
    }

    /**
     * 更新知识库条目
     */
    public function update($id, $data)
    {
        $kb = KnowledgeBase::find($id);
        if (!$kb) {
            throw new \Exception('知识库条目不存在');
        }

        // 检查分类是否存在
        if (isset($data['category_id']) && !empty($data['category_id'])) {
            $category = DeviceCategory::find($data['category_id']);
            if (!$category) {
                throw new \Exception('设备分类不存在');
            }
        }

        // 记录旧状态
        $oldStatus = $kb->status;

        // 处理JSON字段
        if (isset($data['tags']) && is_array($data['tags'])) {
            $data['tags'] = $data['tags'];
        }

        if (isset($data['related_part_ids']) && is_array($data['related_part_ids'])) {
            $data['related_part_ids'] = $data['related_part_ids'];
        }

        // 显式指定允许的字段（不包括created_by和usage_count）
        $allowedFields = [
            'title', 'fault_symptom', 'fault_cause', 'solution',
            'category_id', 'device_id', 'related_part_ids', 'tags',
            'difficulty_level', 'status'
        ];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $kb->data($filteredData);
        $kb->save();

        $kb = $kb->refresh();

        // 更新向量索引
        try {
            $vectorService = new KnowledgeBaseVectorService();

            // 如果从未发布变为已发布，或本来就是已发布状态，重建向量索引
            if ($kb->status == KnowledgeBase::STATUS_PUBLISHED) {
                $vectorService->indexKnowledge($kb->id);
            } elseif ($oldStatus == KnowledgeBase::STATUS_PUBLISHED) {
                // 从已发布变为其他状态，删除向量索引
                $vectorService->removeKnowledgeIndex($kb->id);
            }
        } catch (\Exception $e) {
            Log::warning("更新知识库向量索引失败: " . $e->getMessage());
        }

        return $kb;
    }

    /**
     * 删除知识库条目
     */
    public function delete($id)
    {
        $kb = KnowledgeBase::find($id);
        if (!$kb) {
            throw new \Exception('知识库条目不存在');
        }

        // 检查是否可以删除
        if (!$kb->canDelete()) {
            throw new \Exception('已发布且被使用过的知识库条目不能删除，只能归档');
        }

        $kb->delete();

        // 删除向量索引
        try {
            $vectorService = new KnowledgeBaseVectorService();
            $vectorService->removeKnowledgeIndex($id);
        } catch (\Exception $e) {
            Log::warning("删除知识库向量索引失败: " . $e->getMessage());
        }

        return true;
    }

    /**
     * 智能搜索
     * 根据故障现象搜索最匹配的解决方案（优先使用向量搜索）
     */
    public function search($keyword, $limit = 10, $useVector = true)
    {
        if (empty($keyword)) {
            throw new \Exception('搜索关键词不能为空');
        }

        // 尝试向量搜索
        $vectorResults = [];
        if ($useVector) {
            try {
                $vectorService = new KnowledgeBaseVectorService();
                $vectorResults = $vectorService->vectorSearch($keyword, $limit);

                if (!empty($vectorResults)) {
                    return [
                        'keyword' => $keyword,
                        'method' => 'vector',
                        'total' => count($vectorResults),
                        'results' => $vectorResults,
                    ];
                }
            } catch (\Exception $e) {
                Log::warning("向量搜索失败，使用传统搜索: " . $e->getMessage());
            }
        }

        // 回退到传统搜索
        return $this->traditionalSearch($keyword, $limit);
    }

    /**
     * 传统关键词搜索（作为向量搜索的回退方案）
     */
    public function traditionalSearch($keyword, $limit = 10)
    {
        // 获取所有已发布的知识
        $allKnowledge = KnowledgeBase::where('status', KnowledgeBase::STATUS_PUBLISHED)
            ->with(['category', 'device'])
            ->select();

        // 计算匹配度并排序
        $matched = [];
        foreach ($allKnowledge as $kb) {
            $score = $kb->getMatchScore($keyword);
            if ($score > 0) {
                $matched[] = [
                    'knowledge' => $kb,
                    'score' => $score,
                ];
            }
        }

        // 按匹配度降序排序
        usort($matched, function($a, $b) {
            return $b['score'] - $a['score'];
        });

        // 返回前N条
        $results = array_slice($matched, 0, $limit);

        return [
            'keyword' => $keyword,
            'method' => 'traditional',
            'total' => count($matched),
            'results' => $results,
        ];
    }

    /**
     * 重建知识库向量索引
     */
    public function rebuildVectorIndex()
    {
        $vectorService = new KnowledgeBaseVectorService();
        return $vectorService->rebuildIndex();
    }

    /**
     * 获取向量索引统计信息
     */
    public function getVectorStats()
    {
        $vectorService = new KnowledgeBaseVectorService();
        return $vectorService->getStats();
    }

    /**
     * 获取热门知识（按使用次数）
     */
    public function getHotKnowledge($limit = 10)
    {
        $list = KnowledgeBase::with(['category', 'device'])
            ->where('status', KnowledgeBase::STATUS_PUBLISHED)
            ->order('usage_count', 'desc')
            ->limit($limit)
            ->select();

        return [
            'list' => $list,
            'total' => count($list),
        ];
    }

    /**
     * 获取统计数据
     */
    public function getStatistics()
    {
        $totalKnowledge = KnowledgeBase::count();
        $publishedKnowledge = KnowledgeBase::where('status', KnowledgeBase::STATUS_PUBLISHED)->count();
        $draftKnowledge = KnowledgeBase::where('status', KnowledgeBase::STATUS_DRAFT)->count();
        $archivedKnowledge = KnowledgeBase::where('status', KnowledgeBase::STATUS_ARCHIVED)->count();

        // 总使用次数
        $totalUsage = KnowledgeBase::where('status', KnowledgeBase::STATUS_PUBLISHED)->sum('usage_count');

        // 按难度等级统计
        $difficultyStats = KnowledgeBase::where('status', KnowledgeBase::STATUS_PUBLISHED)
            ->field('difficulty_level, COUNT(*) as count, SUM(usage_count) as total_usage')
            ->group('difficulty_level')
            ->select()
            ->map(function($item) {
                return [
                    'level' => $item->difficulty_level,
                    'level_text' => $item->difficulty_text,
                    'count' => $item->count,
                    'total_usage' => $item->total_usage,
                ];
            });

        // 按分类统计
        $categoryStats = KnowledgeBase::with(['category'])
            ->where('status', KnowledgeBase::STATUS_PUBLISHED)
            ->field('category_id, COUNT(*) as count, SUM(usage_count) as total_usage')
            ->group('category_id')
            ->select()
            ->filter(function($item) {
                return $item->category != null;
            })
            ->map(function($item) {
                return [
                    'category_id' => $item->category_id,
                    'category_name' => $item->category->name,
                    'count' => $item->count,
                    'total_usage' => $item->total_usage,
                ];
            });

        // 最热门的知识（Top 10）
        $topKnowledge = KnowledgeBase::with(['category', 'device'])
            ->where('status', KnowledgeBase::STATUS_PUBLISHED)
            ->order('usage_count', 'desc')
            ->limit(10)
            ->select();

        return [
            'total_knowledge' => $totalKnowledge,
            'published_knowledge' => $publishedKnowledge,
            'draft_knowledge' => $draftKnowledge,
            'archived_knowledge' => $archivedKnowledge,
            'total_usage' => $totalUsage,
            'difficulty_stats' => $difficultyStats,
            'category_stats' => $categoryStats,
            'top_knowledge' => $topKnowledge,
        ];
    }
}
