<?php

namespace app\controller;

use think\facade\Db;
use think\facade\Request;

/**
 * 小程序订单增值费用（检测费等）- repair 库 order_service_fees
 *
 * 表结构（首次访问时自动创建，幂等）：
 *   id / fee_no / order_id / fee_type(detection|other) / amount /
 *   status(unpaid|paid|waived) / paid_at / pay_method / remark / created_at / updated_at
 */
class RepairServiceFeeController extends BaseController
{
    private const TABLE = 'order_service_fees';

    /** 建表（幂等，首次调用时执行） */
    private function ensureTable(): void
    {
        static $checked = false;
        if ($checked) {
            return;
        }
        Db::connect('repair')->execute(
            "CREATE TABLE IF NOT EXISTS `order_service_fees` (
                `id` INT NOT NULL AUTO_INCREMENT,
                `fee_no` VARCHAR(32) NOT NULL COMMENT '费用单号 DF+日期+序号',
                `order_id` INT NOT NULL COMMENT '关联订单 orders.id',
                `fee_type` VARCHAR(20) NOT NULL DEFAULT 'detection' COMMENT '费用类型: detection检测费/other其他',
                `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '费用金额',
                `status` VARCHAR(20) NOT NULL DEFAULT 'unpaid' COMMENT '状态: unpaid待收款/paid已收款/waived已减免',
                `paid_at` DATETIME NULL DEFAULT NULL COMMENT '收款时间',
                `pay_method` VARCHAR(20) NULL DEFAULT NULL COMMENT '收款方式: wechat/cash/transfer',
                `remark` VARCHAR(255) NULL DEFAULT NULL COMMENT '备注',
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                UNIQUE KEY `uk_fee_no` (`fee_no`),
                KEY `idx_fees_order_id` (`order_id`),
                KEY `idx_fees_status` (`status`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单增值费用表(检测费等)'"
        );
        $checked = true;
    }

    /**
     * 费用列表
     * GET /api/repair/service-fees
     */
    public function index()
    {
        try {
            $this->ensureTable();
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('page_size', 10, 'intval');

            $query = Db::connect('repair')
                ->name(self::TABLE)
                ->alias('f')
                ->leftJoin('orders o', 'f.order_id = o.id')
                ->leftJoin('users u', 'o.user_id = u.id')
                ->field('f.*, o.order_id AS order_no, o.device_model, o.status AS order_status,
                    o.user_id, u.nickname AS user_name, u.phone AS user_phone');

            $keyword = trim(Request::param('keyword', ''));
            if ($keyword !== '') {
                $query->where(function ($q) use ($keyword) {
                    $q->whereLike('f.fee_no', '%' . $keyword . '%')
                        ->whereOr('o.order_id', 'like', '%' . $keyword . '%');
                });
            }
            $status = Request::param('status', '');
            if ($status !== '') {
                $query->where('f.status', $status);
            }
            $feeType = Request::param('fee_type', '');
            if ($feeType !== '') {
                $query->where('f.fee_type', $feeType);
            }
            $startDate = Request::param('start_date', '');
            if ($startDate !== '') {
                $query->where('f.created_at', '>=', $startDate);
            }
            $endDate = Request::param('end_date', '');
            if ($endDate !== '') {
                $query->where('f.created_at', '<=', $endDate . ' 23:59:59');
            }

            $total = (clone $query)->count();
            $list = $query->order('f.id', 'desc')->page($page, $limit)->select()->toArray();

            // 汇总
            $sumUnpaid = Db::connect('repair')->name(self::TABLE)->where('status', 'unpaid')->sum('amount');
            $sumPaid = Db::connect('repair')->name(self::TABLE)->where('status', 'paid')->sum('amount');

            return $this->success([
                'list' => $list,
                'total' => $total,
                'page' => $page,
                'page_size' => $limit,
                'summary' => [
                    'unpaid_amount' => floatval($sumUnpaid),
                    'paid_amount' => floatval($sumPaid),
                ],
            ]);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * 创建费用单（检测费）
     * POST /api/repair/service-fees
     */
    public function save()
    {
        try {
            $this->ensureTable();
            $data = Request::post();

            $orderId = (int)($data['order_id'] ?? 0);
            $amount = round((float)($data['amount'] ?? 0), 2);
            if ($orderId <= 0) {
                return $this->error('请选择关联订单', 422);
            }
            if ($amount <= 0) {
                return $this->error('费用金额必须大于0', 422);
            }

            $order = Db::connect('repair')->name('orders')->where('id', $orderId)->find();
            if (!$order) {
                return $this->error('订单不存在', 404);
            }

            $feeNo = 'DF' . date('YmdHis') . sprintf('%03d', random_int(1, 999));

            $id = Db::connect('repair')->name(self::TABLE)->insertGetId([
                'fee_no'     => $feeNo,
                'order_id'   => $orderId,
                'fee_type'   => in_array($data['fee_type'] ?? 'detection', ['detection', 'other'], true)
                    ? $data['fee_type'] : 'detection',
                'amount'     => $amount,
                'status'     => 'unpaid',
                'remark'     => trim((string)($data['remark'] ?? '')) ?: null,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            return $this->success(['id' => $id, 'fee_no' => $feeNo], '费用单已创建', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * 收款 / 减免
     * PUT /api/repair/service-fees/:id/pay   body: {action: pay|waive, pay_method}
     */
    public function pay($id)
    {
        try {
            $this->ensureTable();
            $action = Request::param('action', 'pay');

            $fee = Db::connect('repair')->name(self::TABLE)->where('id', (int)$id)->find();
            if (!$fee) {
                return $this->error('费用单不存在', 404);
            }
            if ($fee['status'] !== 'unpaid') {
                return $this->error('该费用单已处理（' . $fee['status'] . '）', 422);
            }

            if ($action === 'waive') {
                Db::connect('repair')->name(self::TABLE)->where('id', (int)$id)->update([
                    'status'     => 'waived',
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
                return $this->success(null, '已减免该费用');
            }

            $payMethod = Request::param('pay_method', 'wechat');
            Db::connect('repair')->name(self::TABLE)->where('id', (int)$id)->update([
                'status'     => 'paid',
                'paid_at'    => date('Y-m-d H:i:s'),
                'pay_method' => in_array($payMethod, ['wechat', 'cash', 'transfer'], true) ? $payMethod : 'wechat',
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            return $this->success(null, '已确认收款');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * 删除费用单（仅待收款可删）
     * DELETE /api/repair/service-fees/:id
     */
    public function delete($id)
    {
        try {
            $this->ensureTable();
            $fee = Db::connect('repair')->name(self::TABLE)->where('id', (int)$id)->find();
            if (!$fee) {
                return $this->error('费用单不存在', 404);
            }
            if ($fee['status'] === 'paid') {
                return $this->error('已收款的费用单不能删除', 422);
            }

            Db::connect('repair')->name(self::TABLE)->where('id', (int)$id)->delete();
            return $this->success(null, '费用单已删除');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
