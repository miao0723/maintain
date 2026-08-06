<?php

namespace app\service;

use app\model\Device;
use app\model\DeviceCategory;
use think\facade\Db;

class DeviceService
{
    /**
     * 获取设备列表（分页）
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = Device::with(['category', 'department']);

        // 按分类筛选
        if (isset($filters['category_id']) && !empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        // 按部门筛选
        if (isset($filters['department_id']) && !empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        // 按状态筛选
        if (isset($filters['status']) && !empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // 搜索设备名称或编码（使用显式查询防止注入）
        if (isset($filters['keyword']) && !empty($filters['keyword'])) {
            $keyword = $filters['keyword'];
            $query->where(function ($q) use ($keyword) {
                $q->whereLike('name', '%' . $keyword . '%')
                  ->whereOr('code', 'like', '%' . $keyword . '%');
            });
        }

        $list = $query
            ->order('id', 'desc')
            ->page($page, $limit)
            ->select();

        $total = $query->count();

        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取设备详情
     */
    public function getDetail($id)
    {
        $device = Device::with(['category', 'department'])->find($id);

        if (!$device) {
            throw new \Exception('设备不存在');
        }

        return $device;
    }

    /**
     * 创建设备
     */
    public function create($data)
    {
        // 检查分类是否存在
        if (!DeviceCategory::find($data['category_id'])) {
            throw new \Exception('分类不存在');
        }

        // 检查部门是否存在
        if (!\app\model\Department::find($data['department_id'])) {
            throw new \Exception('部门不存在');
        }

        // 设置默认状态
        if (!isset($data['status'])) {
            $data['status'] = 1;
        }

        // 显式指定允许的字段，防止批量赋值攻击
        $allowedFields = [
            'code', 'name', 'specification',
            'category_id', 'department_id', 'location',
            'purchase_date', 'warranty_expiry', 'status'
        ];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $device = new Device();
        $device->data($filteredData);
        $device->save();

        return $device->refresh();
    }

    /**
     * 更新设备
     */
    public function update($id, $data)
    {
        $device = Device::find($id);

        if (!$device) {
            throw new \Exception('设备不存在');
        }

        // 检查分类是否存在
        if (isset($data['category_id']) && !DeviceCategory::find($data['category_id'])) {
            throw new \Exception('分类不存在');
        }

        // 检查部门是否存在
        if (isset($data['department_id']) && !\app\model\Department::find($data['department_id'])) {
            throw new \Exception('部门不存在');
        }

        // 显式指定允许的字段，防止批量赋值攻击
        $allowedFields = [
            'code', 'name', 'specification',
            'category_id', 'department_id', 'location',
            'purchase_date', 'warranty_expiry', 'status'
        ];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $device->data($filteredData);
        $device->save();

        return $device->refresh();
    }

    /**
     * 删除设备
     */
    public function delete($id)
    {
        $device = Device::find($id);

        if (!$device) {
            throw new \Exception('设备不存在');
        }

        // TODO: 未来检查是否有工单关联

        $device->delete();

        return true;
    }

    /**
     * 获取设备维护历史
     */
    public function getHistory($id)
    {
        $device = Device::find($id);

        if (!$device) {
            throw new \Exception('设备不存在');
        }

        // TODO: Phase 3 实现工单后补充
        return [
            'device_id' => $id,
            'work_orders' => [],
        ];
    }

    /**
     * 更新设备状态
     */
    public function updateStatus($id, $status)
    {
        $device = Device::find($id);

        if (!$device) {
            throw new \Exception('设备不存在');
        }

        if (!in_array($status, [1, 2, 3])) {
            throw new \Exception('状态值无效');
        }

        $device->status = $status;
        $device->save();

        return $device;
    }
}
