<?php

namespace app\service;

use app\model\OrderDevice;
use think\facade\Db;

class OrderDeviceService
{
    /**
     * 允许写入的字段（防批量赋值）
     */
    private $allowedFields = [
        'order_id', 'name', 'serial_no', 'source', 'quantity', 'unit', 'remarks', 'status',
    ];

    /**
     * 获取列表（分页 + 筛选 + 关联订单号展示）
     * order_devices 在后台库；repair.orders 在小程序库，二者同实例时通过 db.table 跨库 JOIN 取订单号。
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = Db::name('order_devices')->alias('d')
            ->leftJoin('repair.orders o', 'o.id = d.order_id');

        $query->field([
            'd.*',
            'o.order_id AS order_code',
            'o.order_type',
            'o.device_type',
        ]);

        if (isset($filters['order_id']) && $filters['order_id'] !== '' && $filters['order_id'] !== null) {
            $query->where('d.order_id', $filters['order_id']);
        }

        if (isset($filters['name']) && $filters['name'] !== '') {
            $query->whereLike('d.name', '%' . $filters['name'] . '%');
        }

        if (isset($filters['source']) && $filters['source'] !== '') {
            $query->where('d.source', $filters['source']);
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('d.status', $filters['status']);
        }

        $total = (clone $query)->count();
        $list  = $query->order('d.id', 'desc')
            ->page($page, $limit)
            ->select()
            ->toArray();

        return [
            'list'  => $list,
            'total' => $total,
            'page'  => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 详情
     */
    public function getDetail($id)
    {
        $row = Db::name('order_devices')->alias('d')
            ->leftJoin('repair.orders o', 'o.id = d.order_id')
            ->field(['d.*', 'o.order_id AS order_code', 'o.order_type', 'o.device_type'])
            ->where('d.id', $id)
            ->find();

        if (!$row) {
            throw new \Exception('设备明细不存在');
        }

        return $row;
    }

    /**
     * 创建
     */
    public function create($data)
    {
        $this->assertOrderExists($data['order_id'] ?? null);

        $filtered = $this->filter($data);
        $filtered['status']   = $filtered['status'] ?? 'normal';
        $filtered['quantity'] = $filtered['quantity'] ?? 1;

        $model = new OrderDevice();
        $model->data($filtered);
        $model->save();

        return $model->refresh();
    }

    /**
     * 更新
     */
    public function update($id, $data)
    {
        $model = OrderDevice::find($id);
        if (!$model) {
            throw new \Exception('设备明细不存在');
        }

        if (isset($data['order_id']) && $data['order_id'] != $model->order_id) {
            $this->assertOrderExists($data['order_id']);
        }

        $filtered = $this->filter($data);
        $model->data($filtered);
        $model->save();

        return $model->refresh();
    }

    /**
     * 删除
     */
    public function delete($id)
    {
        $model = OrderDevice::find($id);
        if (!$model) {
            throw new \Exception('设备明细不存在');
        }
        $model->delete();
        return true;
    }

    /**
     * 校验关联订单存在（repair 库）
     */
    private function assertOrderExists($orderId)
    {
        if (empty($orderId)) {
            throw new \Exception('关联订单ID不能为空');
        }
        $order = Db::connect('repair')->name('orders')->where('id', $orderId)->find();
        if (!$order) {
            throw new \Exception('关联订单不存在（repair.orders.id=' . $orderId . '）');
        }
    }

    /**
     * 仅保留白名单字段
     */
    private function filter($data)
    {
        return array_intersect_key($data, array_flip($this->allowedFields));
    }
}
