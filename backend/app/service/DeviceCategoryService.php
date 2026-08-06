<?php

namespace app\service;

use app\model\DeviceCategory;

class DeviceCategoryService
{
    /**
     * 获取分类列表
     */
    public function getList()
    {
        return DeviceCategory::order('id', 'asc')->select();
    }

    /**
     * 获取分类详情
     */
    public function getDetail($id)
    {
        $category = DeviceCategory::find($id);

        if (!$category) {
            throw new \Exception('分类不存在');
        }

        return $category;
    }

    /**
     * 创建分类
     */
    public function create($data)
    {
        // 显式指定允许的字段，防止批量赋值攻击
        $allowedFields = ['name', 'icon', 'description'];
        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $category = new DeviceCategory();
        $category->data($filteredData);
        $category->save();

        return $category->refresh();
    }

    /**
     * 更新分类
     */
    public function update($id, $data)
    {
        $category = DeviceCategory::find($id);

        if (!$category) {
            throw new \Exception('分类不存在');
        }

        // 显式指定允许的字段，防止批量赋值攻击
        $allowedFields = ['name', 'icon', 'description'];
        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $category->data($filteredData);
        $category->save();

        return $category->refresh();
    }

    /**
     * 删除分类
     */
    public function delete($id)
    {
        $category = DeviceCategory::find($id);

        if (!$category) {
            throw new \Exception('分类不存在');
        }

        // 检查是否有设备关联
        if ($category->devices()->count() > 0) {
            throw new \Exception('该分类下有设备，无法删除');
        }

        $category->delete();

        return true;
    }
}
