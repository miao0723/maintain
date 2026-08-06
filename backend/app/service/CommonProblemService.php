<?php

namespace app\service;

use app\model\CommonProblem;
use app\model\DeviceType;
use app\model\MaintenanceItem;
use think\facade\Db;

/**
 * 小程序常见问题服务
 * 管理 repair 数据库中 common_problems 表的 CRUD 及数据同步
 */
class CommonProblemService
{
    /**
     * 获取常见问题列表（分页 + 筛选）
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = CommonProblem::with('deviceType');

        // 按设备类型筛选
        if (isset($filters['device_type_id']) && !empty($filters['device_type_id'])) {
            $query->where('device_type_id', intval($filters['device_type_id']));
        }

        // 关键字搜索（名称）
        if (isset($filters['keyword']) && !empty($filters['keyword'])) {
            $keyword = $filters['keyword'];
            $query->where(function ($q) use ($keyword) {
                $q->whereLike('name', '%' . $keyword . '%');
            });
        }

        // 排序：按 ID 降序（最新的在前）
        $query->order('id', 'desc');

        $list = $query->page($page, $limit)->select();

        // 单独统计总数（避免 page() 影响 count）
        $total = CommonProblem::with('deviceType');
        if (isset($filters['device_type_id']) && !empty($filters['device_type_id'])) {
            $total->where('device_type_id', intval($filters['device_type_id']));
        }
        if (isset($filters['keyword']) && !empty($filters['keyword'])) {
            $keyword = $filters['keyword'];
            $total->where(function ($q) use ($keyword) {
                $q->whereLike('name', '%' . $keyword . '%');
            });
        }
        $total = $total->count();

        // 为每条数据添加 device_type_name 字段
        $listData = [];
        foreach ($list as $item) {
            $itemData = $item->toArray();
            $itemData['device_type_name'] = isset($itemData['device_type']) ? $itemData['device_type']['name'] : '';
            $itemData['device_type_icon'] = isset($itemData['device_type']) ? $itemData['device_type']['icon'] : '';
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
     * 获取常见问题详情
     */
    public function getDetail($id)
    {
        $item = CommonProblem::with('deviceType')->find($id);

        if (!$item) {
            throw new \Exception('常见问题不存在');
        }

        return $item;
    }

    /**
     * 获取所有设备类型列表
     */
    public function getDeviceTypes()
    {
        return DeviceType::order('id', 'asc')->select();
    }

    /**
     * 创建常见问题
     */
    public function create($data)
    {
        // 检查名称是否已存在
        if (isset($data['name'])) {
            $existing = CommonProblem::where('name', $data['name'])
                ->where('device_type_id', $data['device_type_id'] ?? 0)
                ->find();
            if ($existing) {
                throw new \Exception('该设备类型下已存在相同名称的常见问题');
            }
        }

        // 检查设备类型是否存在
        if (isset($data['device_type_id']) && !empty($data['device_type_id'])) {
            $deviceType = DeviceType::find($data['device_type_id']);
            if (!$deviceType) {
                throw new \Exception('设备类型不存在');
            }
        }

        // 设置默认值
        $data['icon'] = $data['icon'] ?? '🔧';
        $data['base_price'] = $data['base_price'] ?? 0;

        $item = CommonProblem::create($data);

        return $item;
    }

    /**
     * 更新常见问题
     */
    public function update($id, $data)
    {
        $item = CommonProblem::find($id);

        if (!$item) {
            throw new \Exception('常见问题不存在');
        }

        // 检查名称是否被其他记录使用
        if (isset($data['name'])) {
            $existing = CommonProblem::where('name', $data['name'])
                ->where('device_type_id', $data['device_type_id'] ?? $item->device_type_id)
                ->where('id', '<>', $id)
                ->find();
            if ($existing) {
                throw new \Exception('该设备类型下已存在相同名称的常见问题');
            }
        }

        // 检查设备类型是否存在
        if (isset($data['device_type_id']) && !empty($data['device_type_id'])) {
            $deviceType = DeviceType::find($data['device_type_id']);
            if (!$deviceType) {
                throw new \Exception('设备类型不存在');
            }
        }

        $item->save($data);

        return $item;
    }

    /**
     * 删除常见问题
     */
    public function delete($id)
    {
        $item = CommonProblem::find($id);

        if (!$item) {
            throw new \Exception('常见问题不存在');
        }

        $item->delete();

        return true;
    }

    /**
     * 同步数据：从 common_problems 同步到本地 maintenance_items
     * 确保 Web 端旧版功能也能看到最新数据
     */
    public function syncToLocal()
    {
        $commonProblems = CommonProblem::with('deviceType')->select();
        $syncedCount = 0;

        Db::startTrans();
        try {
            foreach ($commonProblems as $problem) {
                $deviceTypeName = $problem->deviceType ? $problem->deviceType->name : '通用';

                // 查找是否已存在对应记录（按名称和设备类型名称匹配）
                $existing = MaintenanceItem::where('name', $problem->name)
                    ->where('description', 'like', '%[' . $deviceTypeName . ']%')
                    ->find();

                $localData = [
                    'name' => $problem->name,
                    'code' => 'CP-' . str_pad($problem->id, 4, '0', STR_PAD_LEFT),
                    'category_id' => 1, // 默认为第一分类
                    'unit' => '次',
                    'price' => $problem->base_price,
                    'description' => ($problem->price_range ? '价格范围：' . $problem->price_range . '；' : '') . '[' . $deviceTypeName . ']',
                    'sort' => 0,
                    'status' => MaintenanceItem::STATUS_ENABLED,
                ];

                if ($existing) {
                    $existing->save($localData);
                } else {
                    MaintenanceItem::create($localData);
                }
                $syncedCount++;
            }
            Db::commit();
        } catch (\Exception $e) {
            Db::rollback();
            throw $e;
        }

        return $syncedCount;
    }

    /**
     * 同步数据：从本地 maintenance_items 导入到 common_problems
     */
    public function syncFromLocal()
    {
        $localItems = MaintenanceItem::where('status', MaintenanceItem::STATUS_ENABLED)->select();
        $syncedCount = 0;

        Db::connect('repair')->startTrans();
        try {
            foreach ($localItems as $item) {
                // 检查是否已存在同名记录
                $existing = CommonProblem::where('name', $item->name)->find();
                if ($existing) {
                    continue; // 已存在则跳过
                }

                // 查找或创建对应的设备类型
                $deviceType = DeviceType::where('name', '通用')->find();
                if (!$deviceType) {
                    $deviceType = DeviceType::create([
                        'name' => '通用',
                        'icon' => '🔧',
                    ]);
                }

                $problemData = [
                    'device_type_id' => $deviceType->id,
                    'name' => $item->name,
                    'icon' => '🔧',
                    'base_price' => $item->price ?? 0,
                    'price_range' => '',
                ];

                CommonProblem::create($problemData);
                $syncedCount++;
            }
            Db::connect('repair')->commit();
        } catch (\Exception $e) {
            Db::connect('repair')->rollback();
            throw $e;
        }

        return $syncedCount;
    }
}