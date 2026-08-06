<?php

namespace app\service;

use app\model\RepairCategory;
use app\model\RepairMachine;

class RepairCategoryService
{
    /**
     * 获取分类列表（分页 + 筛选）
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = RepairCategory::withCount(['machines' => function($q) {
            $q->where('status', RepairMachine::STATUS_ACTIVE);
        }]);

        // 按名称搜索
        if (isset($filters['name']) && !empty($filters['name'])) {
            $keyword = $filters['name'];
            $query->whereLike('name', '%' . $keyword . '%');
        }

        // 按状态筛选
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', intval($filters['status']));
        }

        // 排序
        $query->order('sort', 'asc')->order('id', 'asc');

        // 先获取总数
        $total = $query->count();

        // 再分页获取列表
        $list = $query->page($page, $limit)->select();

        // 转换为数组并添加机械数量
        $data = [];
        foreach ($list as $category) {
            $item = $category->toArray();
            $item['machine_count'] = $category['machines_count'] ?? 0;
            $data[] = $item;
        }

        return [
            'list' => $data,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取分类详情
     */
    public function getDetail($id)
    {
        $category = RepairCategory::withCount(['machines' => function($q) {
            $q->where('status', RepairMachine::STATUS_ACTIVE);
        }])->find($id);

        if (!$category) {
            throw new \Exception('分类不存在');
        }

        $data = $category->toArray();
        $data['machine_count'] = $category['machines_count'] ?? 0;

        return $data;
    }

    /**
     * 创建分类
     */
    public function create($data)
    {
        // 检查编码是否已存在
        $existing = RepairCategory::where('code', $data['code'])->find();
        if ($existing) {
            throw new \Exception('分类编码已存在');
        }

        $data['status'] = $data['status'] ?? RepairCategory::STATUS_ACTIVE;
        $data['sort'] = $data['sort'] ?? 0;

        $category = new RepairCategory();
        $category->data($data);
        $category->save();

        return $this->getDetail($category->id);
    }

    /**
     * 更新分类
     */
    public function update($id, $data)
    {
        $category = RepairCategory::find($id);
        if (!$category) {
            throw new \Exception('分类不存在');
        }

        // 如果修改编码，检查是否重复
        if (isset($data['code']) && $data['code'] != $category['code']) {
            $existing = RepairCategory::where('code', $data['code'])
                ->where('id', '<>', $id)
                ->find();
            if ($existing) {
                throw new \Exception('分类编码已存在');
            }
        }

        $allowedFields = ['name', 'code', 'description', 'sort', 'status'];
        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $category->data($filteredData);
        $category->save();

        return $this->getDetail($category->id);
    }

    /**
     * 删除分类
     */
    public function delete($id)
    {
        $category = RepairCategory::find($id);
        if (!$category) {
            throw new \Exception('分类不存在');
        }

        // 检查是否有关联机械
        $machineCount = RepairMachine::where('category_id', $id)->where('status', RepairMachine::STATUS_ACTIVE)->count();
        if ($machineCount > 0) {
            throw new \Exception('该分类下有关联机械，无法删除');
        }

        $category->delete();
        return true;
    }

    /**
     * 获取所有启用的分类（用于下拉选择）
     */
    public function getActiveList()
    {
        $list = RepairCategory::where('status', RepairCategory::STATUS_ACTIVE)
            ->order('sort', 'asc')
            ->field('id, name, code')
            ->select();

        return $list->toArray();
    }
}
