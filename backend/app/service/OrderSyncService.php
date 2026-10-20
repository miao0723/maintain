<?php

namespace app\service;

use think\facade\Db;

/**
 * 订单同步服务（对外只读）
 *
 * 复用 RepairOrderService 的查询与字段映射逻辑（enrichOrderList），
 * 仅针对「外部系统定时拉取」场景扩展：
 *  - 固定 order_type（维修 repair / 回收 recycle）
 *  - 支持按 created_at / updated_at 做增量同步时间区间
 *  - 支持按状态筛选
 *
 * 所有查询均为只读（SELECT），不写入任何数据，不影响现有业务与页面。
 */
class OrderSyncService extends RepairOrderService
{
    /** 允许的订单状态（与 RepairOrder 保持一致） */
    public const STATUS_ALL = [
        'pending', 'quoted', 'confirmed', 'processing',
        'review', 'completed', 'cancelled',
    ];

    /** 允许作为增量同步依据的时间字段 */
    public const TIME_FIELDS = ['created_at', 'updated_at'];

    /**
     * 获取同步列表（只读）
     *
     * @param int   $page      页码（从 1 开始）
     * @param int   $pageSize  每页条数
     * @param array $opts      order_type(必填), status, time_field, start_time, end_time, order_no
     * @return array {list, total, page, pageSize, time_field}
     */
    public function getSyncList(int $page, int $pageSize, array $opts): array
    {
        $orderType = $opts['order_type'] ?? '';
        $query = Db::connect('repair')->name('orders')->alias('o');

        // 固定订单类型（维修 / 回收）
        $query->where('o.order_type', $orderType);

        // 状态筛选
        if (!empty($opts['status'])) {
            $query->where('o.status', $opts['status']);
        }

        // 订单号模糊搜索（复用 order_id 列）
        if (!empty($opts['order_no'])) {
            $query->where('o.order_id', 'like', '%' . $opts['order_no'] . '%');
        }

        // 增量同步：按时间区间过滤（created_at / updated_at）
        $timeField = in_array($opts['time_field'] ?? '', self::TIME_FIELDS, true)
            ? $opts['time_field']
            : 'updated_at';

        if (!empty($opts['start_time'])) {
            $query->where('o.' . $timeField, '>=', $opts['start_time']);
        }
        if (!empty($opts['end_time'])) {
            $query->where('o.' . $timeField, '<=', $opts['end_time']);
        }

        // 默认按所选时间字段倒序，保证增量拉取时新数据靠前
        $query->order('o.' . $timeField, 'desc')->order('o.id', 'desc');

        $total = (clone $query)->count();
        $list  = $query
            ->page($page, $pageSize)
            ->field('o.*')
            ->select()
            ->toArray();

        // 复用父类的字段映射（用户信息、品牌、地址、图片等）
        $list = $this->enrichOrderList($list);

        return [
            'list'      => $list,
            'total'     => $total,
            'page'      => $page,
            'pageSize'  => $pageSize,
            'time_field' => $timeField,
        ];
    }
}
