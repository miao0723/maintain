<?php

namespace app\common;

use think\Model;

/**
 * 查询辅助类
 * 统一处理常见的查询构建模式
 */
class QueryHelper
{
    /**
     * 应用日期范围筛选
     *
     * @param \think\db\Query $query
     * @param array $filters
     * @param string $field
     * @return \think\db\Query
     */
    public static function applyDateRange($query, $filters, $field = 'created_at')
    {
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where($field, '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where($field, '<=', $filters['end_date'] . ' 23:59:59');
        }
        return $query;
    }

    /**
     * 应用关键词搜索（多个字段OR条件）
     * 安全地转义特殊字符防止SQL注入
     *
     * @param \think\db\Query $query
     * @param string $keyword
     * @param array $fields
     * @return \think\db\Query
     */
    public static function applyKeywordSearch($query, $keyword, $fields)
    {
        if (!empty($keyword) && !empty($fields)) {
            // 转义特殊字符防止SQL注入
            $safeKeyword = addcslashes($keyword, '%_\\');

            $query->where(function ($q) use ($safeKeyword, $fields) {
                foreach ($fields as $index => $field) {
                    if ($index === 0) {
                        $q->whereLike($field, '%' . $safeKeyword . '%');
                    } else {
                        $q->whereOr($field, 'like', '%' . $safeKeyword . '%');
                    }
                }
            });
        }
        return $query;
    }

    /**
     * 应用状态筛选
     *
     * @param \think\db\Query $query
     * @param array $filters
     * @param string $field
     * @return \think\db\Query
     */
    public static function applyStatusFilter($query, $filters, $field = 'status')
    {
        if (isset($filters[$field]) && $filters[$field] !== '') {
            $query->where($field, $filters[$field]);
        }
        return $query;
    }

    /**
     * 应用分页并返回标准格式
     *
     * @param \think\db\Query $query
     * @param int $page
     * @param int $limit
     * @return array
     */
    public static function paginate($query, $page = 1, $limit = 20)
    {
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
     * 应用多个筛选条件
     *
     * @param \think\db\Query $query
     * @param array $filters
     * @param array $config
     * @return \think\db\Query
     */
    public static function applyFilters($query, $filters, $config)
    {
        foreach ($config as $field => $filterConfig) {
            $type = $filterConfig['type'] ?? 'eq';
            $queryField = $filterConfig['field'] ?? $field;

            if (!isset($filters[$field]) || $filters[$field] === '') {
                continue;
            }

            $value = $filters[$field];

            switch ($type) {
                case 'eq':
                    $query->where($queryField, $value);
                    break;
                case 'like':
                    $query->whereLike($queryField, '%' . $value . '%');
                    break;
                case 'in':
                    if (is_array($value)) {
                        $query->whereIn($queryField, $value);
                    }
                    break;
                case 'date_range':
                    self::applyDateRange($query, [$field => $value], $queryField);
                    break;
            }
        }

        return $query;
    }
}
