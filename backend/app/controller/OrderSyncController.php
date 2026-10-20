<?php

namespace app\controller;

use app\common\SyncResult;
use app\model\RepairOrder;
use app\service\OrderSyncService;

/**
 * 对外只读订单同步接口
 *
 * 提供两个 GET 接口，供外部系统定时拉取小程序订单（repair 库 orders 表）：
 *   GET /api/open/orders/repair   维修类型订单
 *   GET /api/open/orders/recycle  回收类型订单
 *
 * 特性：
 *  - 只读查询，复用 RepairOrderService 的字段映射，数据结构与后台订单一致
 *  - 支持分页（page / page_size）、增量同步（time_field + start_time/end_time）、状态筛选（status）
 *  - 固定 Token 鉴权（SyncAuth 中间件），未授权返回 401
 *  - 统一响应格式：code / error_code / message / data{list,total,page,page_size,has_more,time_field}
 */
class OrderSyncController
{
    private $service;

    private const MAX_PAGE_SIZE = 100;

    public function __construct()
    {
        $this->service = new OrderSyncService();
    }

    /**
     * 维修类型订单同步
     * GET /api/open/orders/repair
     */
    public function repair()
    {
        return $this->handle('repair', '维修');
    }

    /**
     * 回收类型订单同步
     * GET /api/open/orders/recycle
     */
    public function recycle()
    {
        return $this->handle('recycle', '回收');
    }

    /**
     * 统一处理函数
     */
    private function handle(string $orderType, string $typeLabel)
    {
        try {
            // ---------- 参数解析与校验 ----------
            $page     = (int) request()->get('page', 1);
            $pageSize = (int) request()->get('page_size', 20);

            if ($page < 1) {
                $page = 1;
            }
            if ($pageSize < 1) {
                $pageSize = 20;
            }
            if ($pageSize > self::MAX_PAGE_SIZE) {
                // 超过上限时按上限处理，给出明确提示，不报错中断
                $pageSize = self::MAX_PAGE_SIZE;
            }

            $status = trim((string) request()->get('status', ''));
            if ($status !== '') {
                $validStatus = array_keys(RepairOrder::getStatusMap());
                if (!in_array($status, $validStatus, true)) {
                    return SyncResult::fail(
                        '参数错误：status 非法，可选值：' . implode(',', $validStatus),
                        'INVALID_PARAM',
                        400
                    );
                }
            }

            $timeField = trim((string) request()->get('time_field', 'updated_at'));
            if (!in_array($timeField, OrderSyncService::TIME_FIELDS, true)) {
                return SyncResult::fail(
                    '参数错误：time_field 非法，可选值：' . implode(',', OrderSyncService::TIME_FIELDS),
                    'INVALID_PARAM',
                    400
                );
            }

            $startTime = trim((string) request()->get('start_time', ''));
            $endTime   = trim((string) request()->get('end_time', ''));
            if ($startTime !== '' && !$this->isValidDateTime($startTime)) {
                return SyncResult::fail('参数错误：start_time 格式非法，应为 Y-m-d H:i:s 或 Y-m-d', 'INVALID_PARAM', 400);
            }
            if ($endTime !== '' && !$this->isValidDateTime($endTime)) {
                return SyncResult::fail('参数错误：end_time 格式非法，应为 Y-m-d H:i:s 或 Y-m-d', 'INVALID_PARAM', 400);
            }
            if ($startTime !== '' && $endTime !== '' && strtotime($startTime) > strtotime($endTime)) {
                return SyncResult::fail('参数错误：start_time 不能晚于 end_time', 'INVALID_PARAM', 400);
            }

            $orderNo = trim((string) request()->get('order_no', ''));

            // ---------- 查询（只读） ----------
            $result = $this->service->getSyncList($page, $pageSize, [
                'order_type' => $orderType,
                'status'     => $status,
                'time_field' => $timeField,
                'start_time' => $startTime,
                'end_time'   => $endTime,
                'order_no'   => $orderNo,
            ]);

            $list = array_map(function ($row) use ($orderType) {
                return $this->formatOrder($row, $orderType);
            }, $result['list']);

            return SyncResult::success(
                $list,
                (int) $result['total'],
                $page,
                $pageSize,
                $result['time_field']
            );
        } catch (\Throwable $e) {
            // 兜底异常处理：记录日志，返回统一错误结构，避免暴露内部细节
            try {
                \think\facade\Log::error('[OrderSync] ' . $e->getMessage(), [
                    'type'   => $orderType,
                    'trace'  => $e->getTraceAsString(),
                ]);
            } catch (\Throwable $t) {
                // 忽略日志写入异常
            }
            return SyncResult::fail('服务器内部错误，请稍后重试', 'INTERNAL_ERROR', 500);
        }
    }

    /**
     * 统一输出字段（保持与现有订单结构一致，并补齐核心业务字段）
     */
    private function formatOrder(array $row, string $orderType): array
    {
        $statusMap    = RepairOrder::getStatusMap();
        $deviceMap    = RepairOrder::getDeviceTypeMap();
        $serviceMap   = RepairOrder::getServiceTypeMap();
        $priorityMap  = ['low' => '低', 'medium' => '中', 'high' => '高', 0 => '未设置', 1 => '低', 2 => '中', 3 => '高'];

        $rawPriority  = $row['priority'] ?? null;
        $priorityLabel = $priorityMap[$rawPriority] ?? (($rawPriority !== null && $rawPriority !== '') ? (string) $rawPriority : null);

        $estimated = isset($row['estimated_price']) ? (float) $row['estimated_price'] : null;
        $actual    = isset($row['actual_price']) && $row['actual_price'] !== '' && $row['actual_price'] !== null
            ? (float) $row['actual_price'] : null;
        $finalAmount = $actual !== null ? $actual : $estimated;

        return [
            // 核心标识
            'id'         => $row['id'] ?? null,
            'order_no'   => $row['order_id'] ?? '',            // 订单号
            'order_type' => $row['order_type'] ?? $orderType,  // 类型：repair/recycle
            'order_type_label' => ($row['order_type'] ?? $orderType) === 'repair' ? '维修' : '回收',

            // 状态与进度
            'status'         => $row['status'] ?? '',
            'status_label'   => $statusMap[$row['status'] ?? ''] ?? ($row['status'] ?? ''),
            'progress'       => isset($row['progress']) ? (int) $row['progress'] : null,

            // 用户信息
            'user' => [
                'id'    => $row['user_id'] ?? null,
                'name'  => $row['user_name'] ?? null,
                'phone' => $row['user_phone'] ?? null,
                'email' => $row['user_email'] ?? null,
            ],

            // 设备/品牌/服务方式/优先级
            'device' => [
                'type'      => $row['device_type'] ?? null,
                'type_label' => $deviceMap[$row['device_type'] ?? ''] ?? null,
                'model'     => $row['device_model'] ?? '',
                'brand'     => $row['brand_name'] ?? null,
                'condition' => $row['device_condition'] ?? null,
            ],
            'service_type'       => $row['service_type'] ?? null,
            'service_type_label' => $serviceMap[$row['service_type'] ?? ''] ?? null,
            'priority'           => $rawPriority,
            'priority_label'     => $priorityLabel,

            // 金额
            'amount' => [
                'estimated' => $estimated,
                'actual'    => $actual,
                'final'     => $finalAmount,   // 实付优先，无则取预估
            ],

            // 业务描述
            'problem_description'  => $row['problem_description'] ?? '',
            'custom_description'   => $row['custom_description'] ?? '',

            // 图片（已做路径归一化）
            'images' => $row['images_list'] ?? [],

            // 联系/收货信息
            'contact' => [
                'name'    => $row['contact_name'] ?? null,
                'phone'   => $row['contact_phone'] ?? null,
                'address' => $row['address_text'] ?? null,
            ],
            'assigned_user_name' => $row['assigned_user_name'] ?? null,

            // 时间
            'created_at'   => $row['created_at'] ?? '',
            'updated_at'   => $row['updated_at'] ?? '',
            'completed_at' => $row['completed_at'] ?? null,
        ];
    }

    /**
     * 宽松校验日期时间格式
     */
    private function isValidDateTime(string $value): bool
    {
        if (!is_string($value) || $value === '') {
            return false;
        }
        // 支持 Y-m-d 与 Y-m-d H:i:s
        $parsed = strtotime($value);
        return $parsed !== false;
    }
}
