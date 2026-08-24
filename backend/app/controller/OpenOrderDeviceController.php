<?php

namespace app\controller;

use app\service\OrderDeviceService;
use app\common\Result;

/**
 * 对外只读接口 —— 设备信息（order_devices）
 *
 * 设计目的：供「维修后台」以外的其它业务系统拉取设备明细，
 * 免登录、免密钥，直接开放访问，且允许跨域。
 *
 * 路由：
 *   GET /api/open/order-devices        列表（分页 + 筛选）
 *   GET /api/open/order-devices/:id    单条详情
 */
class OpenOrderDeviceController
{
    private $service;

    public function __construct()
    {
        $this->service = new OrderDeviceService();
    }

    /**
     * 列表
     * GET /api/open/order-devices
     */
    public function index()
    {
        $page     = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);

        $filters = [
            'order_id' => request()->get('order_id', ''),
            'name'     => request()->get('name', ''),
            'source'   => request()->get('source', ''),
            'status'   => request()->get('status', ''),
        ];

        $result = $this->service->getList($page, $pageSize, $filters);
        $list   = array_map([$this, 'formatRow'], $result['list']);

        return Result::success([
            'list'     => $list,
            'total'    => $result['total'],
            'page'     => $result['page'],
            'pageSize' => $result['limit'],
        ]);
    }

    /**
     * 详情
     * GET /api/open/order-devices/{id}
     */
    public function read($id)
    {
        try {
            $row = $this->service->getDetail($id);
            return Result::success($this->formatRow($row));
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 404);
        }
    }

    /**
     * 统一输出字段（仅暴露需要的 7 个字段 + 关联信息）
     */
    private function formatRow($row)
    {
        $statusLabels = [
            'normal'      => '正常',
            'maintenance' => '维修中',
            'idle'        => '闲置',
            'scrapped'    => '报废',
        ];

        return [
            'id'           => $row['id'] ?? null,
            'order_id'     => $row['order_id'] ?? null,
            'order_code'   => $row['order_code'] ?? null,
            'name'         => $row['name'] ?? '',
            'serial_no'    => $row['serial_no'] ?? '',
            'source'       => $row['source'] ?? '',
            'quantity'     => isset($row['quantity']) ? (float) $row['quantity'] : null,
            'unit'         => $row['unit'] ?? '',
            'remarks'      => $row['remarks'] ?? '',
            'status'       => $row['status'] ?? '',
            'status_label' => $statusLabels[$row['status'] ?? ''] ?? ($row['status'] ?? ''),
            'created_at'   => $row['created_at'] ?? '',
            'updated_at'   => $row['updated_at'] ?? '',
        ];
    }
}
