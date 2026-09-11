<?php

namespace app\controller;

use think\facade\Db;
use think\facade\Request;

/**
 * 小程序交易/退款数据（读取 repair 库 transaction_income + orders）
 */
class RepairTransactionController extends BaseController
{
    /**
     * 交易（收入流水）列表
     * GET /api/payment/transactions
     */
    public function index()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');

            $query = Db::connect('repair')
                ->name('transaction_income')
                ->alias('t')
                ->leftJoin('users u', 't.user_id = u.id')
                ->field('t.*, u.nickname as payer_name, u.phone as payer_phone');

            $keyword = trim(Request::param('keyword', ''));
            if ($keyword !== '') {
                $query->where(function ($q) use ($keyword) {
                    $q->whereLike('t.order_no', '%' . $keyword . '%')
                        ->whereOr('t.out_trade_no', 'like', '%' . $keyword . '%')
                        ->whereOr('t.wechat_transaction_id', 'like', '%' . $keyword . '%');
                });
            }

            $channel = Request::param('payment_channel', '');
            if ($channel !== '') {
                $query->where('t.payment_channel', $channel);
            }

            $status = Request::param('payment_status', '');
            if ($status !== '') {
                $query->where('t.payment_status', $status);
            }

            $startDate = Request::param('start_date', '');
            if ($startDate !== '') {
                $query->where('t.paid_at', '>=', $startDate);
            }
            $endDate = Request::param('end_date', '');
            if ($endDate !== '') {
                $query->where('t.paid_at', '<=', $endDate . ' 23:59:59');
            }

            $total = (clone $query)->count();
            $list = $query->order('t.paid_at', 'desc')
                ->order('t.id', 'desc')
                ->page($page, $limit)
                ->select()
                ->toArray();

            return $this->success([
                'list' => $list,
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
            ]);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * 交易统计
     * GET /api/payment/transactions/statistics
     */
    public function statistics()
    {
        try {
            $db = Db::connect('repair')->name('transaction_income');

            $totalAmount = (clone $db)->sum('amount');
            $totalCount = (clone $db)->count();
            $todayAmount = (clone $db)
                ->whereTime('paid_at', 'today')
                ->sum('amount');
            $refundedCount = (clone $db)
                ->whereIn('payment_status', ['partial_refunded', 'refunded'])
                ->count();

            // 成功率 = 未全额退款的流水占比
            $successRate = $totalCount > 0
                ? round(($totalCount - $refundedCount) / $totalCount * 100, 1)
                : 100.0;

            return $this->success([
                'total_amount' => floatval($totalAmount),
                'today_amount' => floatval($todayAmount),
                'total_count' => $totalCount,
                'success_rate' => $successRate,
            ]);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * 退款列表（repair 库 orders 退款字段）
     * GET /api/payment/refunds
     */
    public function refunds()
    {
        try {
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');

            $query = Db::connect('repair')
                ->name('orders')
                ->alias('o')
                ->leftJoin('users u', 'o.user_id = u.id')
                ->field('o.id, o.order_id, o.user_id, o.device_model, o.actual_price, o.payment_status,
                    o.refund_status, o.refund_no, o.wechat_refund_id, o.refund_amount,
                    o.refund_reason, o.refunded_at, o.updated_at,
                    u.nickname as user_name, u.phone as user_phone')
                ->where(function ($q) {
                    $q->whereIn('o.refund_status', ['refunding', 'refunded', 'failed'])
                        ->whereOr(function ($q2) {
                            $q2->whereIn('o.payment_status', ['refunding', 'refunded']);
                        });
                });

            $keyword = trim(Request::param('keyword', ''));
            if ($keyword !== '') {
                $query->where(function ($q) use ($keyword) {
                    $q->whereLike('o.order_id', '%' . $keyword . '%')
                        ->whereOr('o.refund_no', 'like', '%' . $keyword . '%');
                });
            }

            $status = Request::param('refund_status', '');
            if ($status !== '') {
                $query->where('o.refund_status', $status);
            }

            $total = (clone $query)->count();
            $list = $query->order('o.updated_at', 'desc')
                ->page($page, $limit)
                ->select()
                ->toArray();

            return $this->success([
                'list' => $list,
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
            ]);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * 退款审核（状态流转；实际打款走微信商户平台/小程序支付服务）
     * PUT /api/payment/refunds/:id
     */
    public function reviewRefund($id)
    {
        try {
            $action = Request::param('action', '');
            $remark = trim(Request::param('admin_remark', ''));

            if (!in_array($action, ['approve', 'reject'])) {
                return $this->error('action 必须为 approve 或 reject', 422);
            }

            $order = Db::connect('repair')->name('orders')->where('id', $id)->find();
            if (!$order) {
                return $this->error('订单不存在', 404);
            }
            if (($order['refund_status'] ?? 'none') === 'refunded') {
                return $this->error('该退款已完成，不能再审核');
            }

            $update = [
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            if ($action === 'approve') {
                // 同意退款：进入退款中，等待微信退款回调置为 refunded
                $update['refund_status'] = 'refunding';
                $update['payment_status'] = 'refunding';
                $message = '已同意退款，等待微信退款到账';
            } else {
                // 拒绝退款：关闭本次退款
                $update['refund_status'] = 'failed';
                $message = '已拒绝退款';
            }

            if ($remark !== '') {
                $update['refund_reason'] = ($order['refund_reason'] ? $order['refund_reason'] . ' | ' : '')
                    . '审核:' . $remark;
            }

            Db::connect('repair')->name('orders')->where('id', $id)->update($update);

            return $this->success(null, $message);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
