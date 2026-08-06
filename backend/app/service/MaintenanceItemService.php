<?php

namespace app\service;

use app\model\MaintenanceItem;
use app\model\MaintenanceCategory;

class MaintenanceItemService
{
    /**
     * 获取维修内容列表（分页 + 筛选）
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = MaintenanceItem::with('category');

        // 按状态筛选
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        } else {
            // 默认只显示启用的
            $query->where('status', MaintenanceItem::STATUS_ENABLED);
        }

        // 按分类筛选
        if (isset($filters['category_id']) && !empty($filters['category_id'])) {
            $query->where('category_id', intval($filters['category_id']));
        }

        // 关键字搜索（编号或名称）
        if (isset($filters['keyword']) && !empty($filters['keyword'])) {
            $keyword = $filters['keyword'];
            $query->where(function ($q) use ($keyword) {
                $q->whereLike('code', '%' . $keyword . '%')
                  ->whereOr('name', 'like', '%' . $keyword . '%')
                  ->whereOr('description', 'like', '%' . $keyword . '%');
            });
        }

        // 排序：按排序字段升序，ID 降序
        $query->order('sort', 'asc')
              ->order('id', 'desc');

        $list = $query->page($page, $limit)->select();
        $total = MaintenanceItem::where(function($q) use ($filters) {
            if (isset($filters['status']) && $filters['status'] !== '') {
                $q->where('status', $filters['status']);
            } else {
                $q->where('status', MaintenanceItem::STATUS_ENABLED);
            }
            if (isset($filters['category_id']) && !empty($filters['category_id'])) {
                $q->where('category_id', intval($filters['category_id']));
            }
            if (isset($filters['keyword']) && !empty($filters['keyword'])) {
                $keyword = $filters['keyword'];
                $q->where(function($qq) use ($keyword) {
                    $qq->whereLike('code', '%' . $keyword . '%')
                       ->whereOr('name', 'like', '%' . $keyword . '%')
                       ->whereOr('description', 'like', '%' . $keyword . '%');
                });
            }
        })->count();

        // 为每条数据添加 category_name 字段
        $listData = [];
        foreach ($list as $item) {
            $itemData = $item->toArray();
            $itemData['category_name'] = isset($itemData['category']) ? $itemData['category']['name'] : '';
            $listData[] = $itemData;
        }

        return [
            'list' => $listData,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取维修内容详情
     */
    public function getDetail($id)
    {
        $item = MaintenanceItem::with('category')->find($id);

        if (!$item) {
            throw new \Exception('维修项目不存在');
        }

        return $item;
    }

    /**
     * 获取所有分类列表
     */
    public function getCategories()
    {
        return MaintenanceCategory::where('status', MaintenanceCategory::STATUS_ENABLED)
            ->order('sort', 'asc')
            ->select();
    }

    /**
     * 创建维修项目
     */
    public function create($data)
    {
        // 检查编码是否已存在
        if (isset($data['code']) && MaintenanceItem::where('code', $data['code'])->find()) {
            throw new \Exception('项目编号已存在');
        }

        // 检查分类是否存在
        if (isset($data['category_id']) && !empty($data['category_id'])) {
            $category = MaintenanceCategory::find($data['category_id']);
            if (!$category) {
                throw new \Exception('分类不存在');
            }
        }

        // 设置默认值
        $data['status'] = $data['status'] ?? MaintenanceItem::STATUS_ENABLED;
        $data['price'] = $data['price'] ?? 0;
        $data['sort'] = $data['sort'] ?? 0;
        $data['unit'] = $data['unit'] ?? '次';

        $item = MaintenanceItem::create($data);

        return $item;
    }

    /**
     * 更新维修项目
     */
    public function update($id, $data)
    {
        $item = MaintenanceItem::find($id);

        if (!$item) {
            throw new \Exception('维修项目不存在');
        }

        // 检查编码是否被其他项目使用
        if (isset($data['code']) && $data['code'] !== $item->code) {
            if (MaintenanceItem::where('code', $data['code'])->where('id', '<>', $id)->find()) {
                throw new \Exception('项目编号已存在');
            }
        }

        // 检查分类是否存在
        if (isset($data['category_id']) && !empty($data['category_id'])) {
            $category = MaintenanceCategory::find($data['category_id']);
            if (!$category) {
                throw new \Exception('分类不存在');
            }
        }

        $item->save($data);

        return $item;
    }

    /**
     * 删除维修项目
     */
    public function delete($id)
    {
        $item = MaintenanceItem::find($id);

        if (!$item) {
            throw new \Exception('维修项目不存在');
        }

        $item->delete();

        return true;
    }

    /**
     * 批量获取分类（用于下拉框）
     */
    public function getCategoriesForSelect()
    {
        return MaintenanceCategory::where('status', MaintenanceCategory::STATUS_ENABLED)
            ->order('sort', 'asc')
            ->column('name', 'id');
    }
}
