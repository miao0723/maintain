<?php

namespace app\service;

use app\model\RepairMachine;
use app\model\RepairCategory;

class RepairMachineService
{
    /**
     * 获取机械列表（分页 + 筛选）
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = RepairMachine::with(['category' => function($q) {
            $q->field('id, name, code');
        }]);

        // 按名称搜索
        if (isset($filters['name']) && !empty($filters['name'])) {
            $keyword = $filters['name'];
            $query->whereLike('name', '%' . $keyword . '%');
        }

        // 按分类筛选
        if (isset($filters['category_id']) && !empty($filters['category_id'])) {
            $query->where('category_id', intval($filters['category_id']));
        }

        // 按状态筛选
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', intval($filters['status']));
        }

        // 先获取总数
        $total = $query->count();

        // 分页获取列表
        $list = $query->page($page, $limit)->select();

        // 转换为数组并添加分类名称
        $data = [];
        foreach ($list as $machine) {
            $item = $machine->toArray();
            $item['category_name'] = $machine->category['name'] ?? '';
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
     * 获取机械详情
     */
    public function getDetail($id)
    {
        $machine = RepairMachine::with(['category' => function($q) {
            $q->field('id, name, code');
        }])->find($id);

        if (!$machine) {
            throw new \Exception('机械不存在');
        }

        $data = $machine->toArray();
        $data['category_name'] = $machine->category['name'] ?? '';

        return $data;
    }

    /**
     * 创建机械
     */
    public function create($data)
    {
        // 检查分类是否存在
        $category = RepairCategory::find($data['category_id']);
        if (!$category) {
            throw new \Exception('分类不存在');
        }

        $data['status'] = $data['status'] ?? RepairMachine::STATUS_ACTIVE;

        $machine = new RepairMachine();
        $machine->data($data);
        $machine->save();

        return $this->getDetail($machine->id);
    }

    /**
     * 更新机械
     */
    public function update($id, $data)
    {
        $machine = RepairMachine::find($id);
        if (!$machine) {
            throw new \Exception('机械不存在');
        }

        // 如果修改分类，检查分类是否存在
        if (isset($data['category_id'])) {
            $category = RepairCategory::find($data['category_id']);
            if (!$category) {
                throw new \Exception('分类不存在');
            }
        }

        $allowedFields = [
            'name', 'model', 'category_id', 'manufacturer',
            'power', 'weight', 'specifications', 'status'
        ];
        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $machine->data($filteredData);
        $machine->save();

        return $this->getDetail($machine->id);
    }

    /**
     * 删除机械
     */
    public function delete($id)
    {
        $machine = RepairMachine::find($id);
        if (!$machine) {
            throw new \Exception('机械不存在');
        }

        $machine->delete();
        return true;
    }

    /**
     * 获取分类下的机械列表
     */
    public function getByCategory($categoryId)
    {
        $list = RepairMachine::where('category_id', $categoryId)
            ->where('status', RepairMachine::STATUS_ACTIVE)
            ->field('id, name, model')
            ->order('name', 'asc')
            ->select();

        return $list->toArray();
    }
}
