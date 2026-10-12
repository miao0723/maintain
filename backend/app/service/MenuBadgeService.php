<?php

namespace app\service;

use app\model\PerfWorkOrder;
use app\model\PerfEngineer;

/**
 * 菜单徽标服务
 *
 * 按登录用户角色聚合各导航模块的「新内容 / 待办」数量，
 * 供前端侧边栏菜单红点、悬停详情与到期弹窗提醒使用。
 *
 * 设计约定：
 * - 徽标 key 与前端一级菜单对应（snake_case，如 repair_tasks / performance）；
 * - 每条 item 带 severity（overdue=已超时 / soon=即将到期）与 remain_text，
 *   前端据此展示红/黄徽标，并对 overdue/soon 事项弹一次性提醒；
 * - 本服务为「个人自助」数据，按 userId / engineer_id 严格隔离，
 *   路由上不挂 PermissionCheck，避免工人等无 role_id 用户 403。
 */
class MenuBadgeService
{
    /** 即将到期阈值（小时）：距 deadline 小于该值即提醒「快到期」 */
    const SOON_HOURS = 24;

    /** 单个菜单最多返回的明细条数 */
    const MAX_ITEMS = 8;

    /**
     * 仅统计「未完结的开放工单」：待接单 / 待维修 / 维修中。
     * 以下状态视为「已处理 / 终态」，不再提醒：
     * - waiting   已提交完成，待管理员验收（工人视角已处理完）
     * - completed 已验收完成
     * - timeout   已超时终态（已了结）
     */
    const OPEN_STATUSES = ['pending', 'to_repair', 'processing'];

    /** 徽标 key => 前端跳转路由 */
    const MENU_ROUTES = [
        // 工人端：维修作业 - 我的工单
        'repair_tasks' => '/repair-tasks/my-tasks',
        // 管理员/老板端：绩效考核 - 工单明细（全员工单超时汇总）
        'performance'  => '/performance/work-orders',
    ];

    /**
     * 获取当前用户的菜单徽标数据
     *
     * @param int $userId
     * @return array ['repair_tasks' => ['count'=>int,'overdue_count'=>int,'soon_count'=>int,'route'=>string,'items'=>[...]], ...]
     */
    public function getBadges($userId)
    {
        $userId = (int)$userId;
        if ($userId <= 0) {
            return [];
        }

        // 已绑定维修人员档案 => 工人视角，只看自己的工单；
        // 未绑定（管理员/老板）=> 管理视角，统计全员工单。
        $engineerId = PerfEngineer::where('user_id', $userId)->value('id');

        $orders = PerfWorkOrder::alias('o')
            ->leftJoin('perf_engineers e', 'o.engineer_id = e.id')
            ->leftJoin('perf_devices d', 'o.device_id = d.id')
            ->field('o.id, o.order_no, o.fault_desc, o.status, o.est_days, o.report_time, o.complete_time,
                     e.name as engineer_name, d.name as device_name')
            ->whereIn('o.status', self::OPEN_STATUSES)
            ->when($engineerId, function ($q) use ($engineerId) {
                $q->where('o.engineer_id', $engineerId);
            })
            ->select()
            ->toArray();

        $now = time();
        $overdue = [];
        $soon = [];

        foreach ($orders as $o) {
            $deadlineTs = $this->deadlineTs($o);
            if ($deadlineTs === null) {
                continue; // 无预计工期，无法判定到期，不参与提醒
            }

            // 已超时：超过 deadline（仅对开放工单计算，终态已由 whereIn 排除）
            if ($now > $deadlineTs) {
                $overdueSeconds = $now - $deadlineTs;
                if ($overdueSeconds < 0) {
                    $overdueSeconds = 0;
                }
                $overdue[] = $this->buildItem($o, 'overdue', $deadlineTs, $overdueSeconds);
            } elseif ($deadlineTs - $now <= self::SOON_HOURS * 3600) {
                $soon[] = $this->buildItem($o, 'soon', $deadlineTs, $deadlineTs - $now);
            }
        }

        if (empty($overdue) && empty($soon)) {
            return [];
        }

        // 排序：已超时优先（超时越久越靠前），其次即将到期（剩余越少越靠前）
        $sortFn = function ($a, $b) {
            if ($a['severity'] !== $b['severity']) {
                return $a['severity'] === 'overdue' ? -1 : 1;
            }
            if ($a['severity'] === 'overdue') {
                return $b['overdue_seconds'] <=> $a['overdue_seconds'];
            }
            return $a['remain_seconds'] <=> $b['remain_seconds'];
        };
        usort($overdue, $sortFn);
        usort($soon, $sortFn);

        $items = array_merge($overdue, $soon);
        $total = count($items);
        $items = array_slice($items, 0, self::MAX_ITEMS);

        // 工人看「维修作业-我的工单」；管理员/老板看「绩效考核-工单明细」
        $menuKey = $engineerId ? 'repair_tasks' : 'performance';
        $route = self::MENU_ROUTES[$menuKey] ?? '/';
        foreach ($items as &$item) {
            $item['route'] = $route;
            $item['key'] = $menuKey . ':' . $item['id'] . ':' . $item['severity'];
        }
        unset($item);

        return [
            $menuKey => [
                'count'         => $total,
                'overdue_count' => count($overdue),
                'soon_count'    => count($soon),
                'title'         => $engineerId ? '维修工单到期提醒' : '维修工单超时汇总',
                'route'         => $route,
                'items'         => $items,
            ],
        ];
    }

    /**
     * 计算工单到期时间戳：报修时间 + 预计工期（天）
     * 无预计工期（est_days <= 0）时返回 null
     */
    private function deadlineTs(array $order)
    {
        $est = isset($order['est_days']) ? (float)$order['est_days'] : 0;
        if ($est <= 0 || empty($order['report_time'])) {
            return null;
        }
        $reportTs = strtotime($order['report_time']);
        if ($reportTs === false) {
            return null;
        }
        return $reportTs + (int)round($est * 86400);
    }

    /**
     * 构造单条提醒明细
     */
    private function buildItem(array $order, $severity, $deadlineTs, $seconds)
    {
        $orderNo = $order['order_no'] ?? ('#' . $order['id']);
        $device = $order['device_name'] ?? '';

        $title = $severity === 'overdue'
            ? "工单 {$orderNo} 已超时"
            : "工单 {$orderNo} 即将超时";

        $descParts = [];
        if (!empty($device)) {
            $descParts[] = "设备：{$device}";
        }
        if (!empty($order['engineer_name'])) {
            $descParts[] = "维修人：{$order['engineer_name']}";
        }
        if (!empty($order['fault_desc'])) {
            $descParts[] = mb_substr($order['fault_desc'], 0, 30);
        }

        return [
            'id'              => (int)$order['id'],
            'key'             => '', // 由调用方按菜单 key 统一覆写
            'order_no'        => $orderNo,
            'title'           => $title,
            'desc'            => implode('，', $descParts),
            'severity'        => $severity,
            'deadline'        => date('Y-m-d H:i', $deadlineTs),
            'remain_text'     => $severity === 'overdue'
                ? '已超时 ' . $this->humanizeDuration($seconds)
                : '剩余 ' . $this->humanizeDuration($seconds),
            'remain_seconds'  => (int)$seconds,
            'overdue_seconds' => $severity === 'overdue' ? (int)$seconds : 0,
            'route'           => '/',
        ];
    }

    /**
     * 人性化时长：X 天 X 小时 / X 小时 / 不足 1 小时
     */
    private function humanizeDuration($seconds)
    {
        $seconds = max(0, (int)$seconds);
        if ($seconds < 3600) {
            return '不足 1 小时';
        }
        $days = intdiv($seconds, 86400);
        $hours = intdiv($seconds % 86400, 3600);
        if ($days > 0) {
            return $hours > 0 ? "{$days} 天 {$hours} 小时" : "{$days} 天";
        }
        return "{$hours} 小时";
    }
}
