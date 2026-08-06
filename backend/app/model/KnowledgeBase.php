<?php

namespace app\model;

use think\Model;

class KnowledgeBase extends Model
{
    protected $table = 'knowledge_base';

    protected $json = ['tags', 'related_part_ids'];
    protected $jsonAssoc = true;

    protected $fillable = [
        'title', 'fault_symptom', 'fault_cause', 'solution',
        'category_id', 'device_id', 'related_part_ids', 'tags',
        'difficulty_level', 'usage_count', 'status', 'created_by'
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    // 状态常量
    const STATUS_DRAFT = 0;        // 草稿
    const STATUS_PUBLISHED = 1;    // 已发布
    const STATUS_ARCHIVED = 2;     // 已归档

    // 难度等级常量
    const DIFFICULTY_EASY = 1;     // 简单
    const DIFFICULTY_MEDIUM = 2;   // 中等
    const DIFFICULTY_HARD = 3;     // 困难

    /**
     * 关联设备分类
     */
    public function category()
    {
        return $this->belongsTo(DeviceCategory::class, 'category_id');
    }

    /**
     * 关联设备
     */
    public function device()
    {
        return $this->belongsTo('app\model\Device', 'device_id');
    }

    /**
     * 关联创建者
     */
    public function creator()
    {
        return $this->belongsTo('app\model\User', 'created_by');
    }

    /**
     * 获取状态文本
     */
    public function getStatusTextAttr($value, $data)
    {
        $statusMap = [
            self::STATUS_DRAFT => '草稿',
            self::STATUS_PUBLISHED => '已发布',
            self::STATUS_ARCHIVED => '已归档',
        ];
        return $statusMap[$data['status']] ?? '未知';
    }

    /**
     * 获取难度等级文本
     */
    public function getDifficultyTextAttr($value, $data)
    {
        $difficultyMap = [
            self::DIFFICULTY_EASY => '简单',
            self::DIFFICULTY_MEDIUM => '中等',
            self::DIFFICULTY_HARD => '困难',
        ];
        return $difficultyMap[$data['difficulty_level']] ?? '未知';
    }

    /**
     * 增加使用次数
     */
    public function incrementUsage()
    {
        $this->usage_count += 1;
        $this->save();
    }

    /**
     * 搜索匹配度评分
     * 根据关键词在故障现象、原因、标签中的匹配程度打分
     */
    public function getMatchScore($keyword)
    {
        $score = 0;
        $keyword = strtolower($keyword);

        // 故障现象匹配（权重最高）
        if (stripos($this->fault_symptom, $keyword) !== false) {
            $score += 50;
            // 完全匹配额外加分
            if (stripos($this->fault_symptom, $keyword) === 0) {
                $score += 20;
            }
        }

        // 故障原因匹配
        if (stripos($this->fault_cause, $keyword) !== false) {
            $score += 30;
        }

        // 标签匹配
        if (!empty($this->tags)) {
            foreach ($this->tags as $tag) {
                if (stripos($tag, $keyword) !== false) {
                    $score += 15;
                    break;
                }
            }
        }

        // 标题匹配
        if (stripos($this->title, $keyword) !== false) {
            $score += 10;
        }

        return $score;
    }

    /**
     * 检查是否已发布
     */
    public function isPublished()
    {
        return $this->status == self::STATUS_PUBLISHED;
    }

    /**
     * 检查是否可以删除
     */
    public function canDelete()
    {
        // 草稿和归档状态可以删除，已发布且使用次数>0的不能删除
        if ($this->status == self::STATUS_PUBLISHED && $this->usage_count > 0) {
            return false;
        }
        return true;
    }
}
