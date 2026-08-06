<?php

namespace app\service;

use think\facade\Db;

class StatisticsService
{
    /**
     * 同步在线支付数据到收入统计表
     */
    public function syncOnlinePayments($startDate = null, $endDate = null)
    {
        $query = Db::name('cmms_online_payments')->where('status', 'paid');

        if ($startDate && $endDate) {
            $query->whereBetweenTime('paid_at', $startDate, $endDate);
        }

        $payments = $query->select()->toArray();

        $synced = 0;
        foreach ($payments as $payment) {
            $recordDate = substr($payment['paid_at'] ?? $payment['created_at'], 0, 10);
            if (empty($recordDate)) continue;

            // 检查是否已存在
            $exists = Db::name('statistics_income_records')
                ->where('record_date', $recordDate)
                ->where('source_type', 'online')
                ->where('source_id', $payment['id'])
                ->find();

            if ($exists) {
                // 更新
                Db::name('statistics_income_records')
                    ->where('id', $exists['id'])
                    ->update([
                        'order_count' => 1,
                        'amount' => $payment['amount'],
                        'updated_at' => date('Y-m-d H:i:s')
                    ]);
            } else {
                // 插入
                Db::name('statistics_income_records')->insert([
                    'record_date' => $recordDate,
                    'payment_method' => 'online',
                    'order_count' => 1,
                    'amount' => $payment['amount'],
                    'remark' => '线上支付: ' . ($payment['payment_method'] ?? ''),
                    'source_type' => 'online',
                    'source_id' => $payment['id'],
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            }
            $synced++;
        }

        return $synced;
    }

    /**
     * 同步转账数据到收入统计表
     */
    public function syncTransfers($startDate = null, $endDate = null)
    {
        $query = Db::name('cmms_transfer_payments')->where('status', 'completed');

        if ($startDate && $endDate) {
            $query->whereBetweenTime('transfer_time', $startDate, $endDate);
        }

        $transfers = $query->select()->toArray();

        $synced = 0;
        foreach ($transfers as $transfer) {
            $recordDate = substr($transfer['transfer_time'], 0, 10);
            if (empty($recordDate)) continue;

            // 检查是否已存在
            $exists = Db::name('statistics_income_records')
                ->where('record_date', $recordDate)
                ->where('source_type', 'transfer')
                ->where('source_id', $transfer['id'])
                ->find();

            if ($exists) {
                // 更新
                Db::name('statistics_income_records')
                    ->where('id', $exists['id'])
                    ->update([
                        'order_count' => 1,
                        'amount' => $transfer['amount'],
                        'updated_at' => date('Y-m-d H:i:s')
                    ]);
            } else {
                // 插入
                Db::name('statistics_income_records')->insert([
                    'record_date' => $recordDate,
                    'payment_method' => 'transfer',
                    'order_count' => 1,
                    'amount' => $transfer['amount'],
                    'remark' => '转账: ' . ($transfer['payee_name'] ?? ''),
                    'source_type' => 'transfer',
                    'source_id' => $transfer['id'],
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
            }
            $synced++;
        }

        return $synced;
    }

    /**
     * 同步订单数据到订单统计表
     */
    public function syncOrders($startDate = null, $endDate = null)
    {
        // 先检查 repair 数据库中的 orders 表
        try {
            $repairDb = Db::connect('repair');
            $query = $repairDb->name('orders');

            if ($startDate && $endDate) {
                $query->whereBetweenTime('created_at', $startDate, $endDate);
            }

            $orders = $query->select()->toArray();

            $synced = 0;
            foreach ($orders as $order) {
                $orderNo = $order['order_id'] ?? $order['id'] ?? '';
                if (empty($orderNo)) continue;

                $createdAt = $order['created_at'] ?? date('Y-m-d H:i:s');
                $statusMap = ['pending' => 'pending', 'quoted' => 'quoted', 'confirmed' => 'confirmed', 'processing' => 'processing', 'completed' => 'completed', 'cancelled' => 'cancelled'];
                $status = $statusMap[$order['status']] ?? 'pending';

                // 检查是否已存在
                $exists = Db::name('statistics_order_records')
                    ->where('order_no', $orderNo)
                    ->find();

                if ($exists) {
                    // 更新
                    Db::name('statistics_order_records')
                        ->where('id', $exists['id'])
                        ->update([
                            'status' => $status,
                            'amount' => $order['actual_price'] ?? $order['estimated_price'] ?? 0,
                            'updated_at' => date('Y-m-d H:i:s')
                        ]);
                } else {
                    // 插入
                    Db::name('statistics_order_records')->insert([
                        'order_no' => $orderNo,
                        'customer_name' => '客户' . ($order['user_id'] ?? ''),
                        'machine_type' => $order['device_model'] ?? '',
                        'fault_desc' => $order['problem_description'] ?? '',
                        'amount' => $order['actual_price'] ?? $order['estimated_price'] ?? 0,
                        'status' => $status,
                        'created_at' => $createdAt,
                        'updated_at' => date('Y-m-d H:i:s')
                    ]);
                }
                $synced++;
            }

            return $synced;
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * 聚合按日期的收入统计
     */
    public function aggregateIncomeByDate($startDate = null, $endDate = null)
    {
        $query = Db::name('statistics_income_records');

        if ($startDate && $endDate) {
            $query->whereBetweenTime('record_date', $startDate, $endDate);
        }

        $records = $query->select()->toArray();

        $aggregated = [];
        foreach ($records as $record) {
            $date = $record['record_date'];
            $method = $record['payment_method'];

            if (!isset($aggregated[$date])) {
                $aggregated[$date] = [
                    'record_date' => $date,
                    'online_count' => 0,
                    'online_amount' => 0,
                    'transfer_count' => 0,
                    'transfer_amount' => 0,
                    'total_count' => 0,
                    'total_amount' => 0
                ];
            }

            $aggregated[$date][$method . '_count'] += $record['order_count'];
            $aggregated[$date][$method . '_amount'] += floatval($record['amount']);
            $aggregated[$date]['total_count'] += $record['order_count'];
            $aggregated[$date]['total_amount'] += floatval($record['amount']);
        }

        ksort($aggregated);
        return array_values($aggregated);
    }

    /**
     * 从已完成的订单同步收入
     * 当订单标记为 completed 时，将订单金额计入收入统计
     */
    public function syncIncomeFromCompletedOrders($orderId = null)
    {
        try {
            $repairDb = Db::connect('repair');
            $query = $repairDb->name('orders')->where('status', 'completed');

            if ($orderId) {
                $query->where('id', $orderId);
            }

            $orders = $query->select()->toArray();

            $synced = 0;
            foreach ($orders as $order) {
                $completedAt = $order['completed_at'] ?? $order['updated_at'] ?? date('Y-m-d H:i:s');
                $recordDate = substr($completedAt, 0, 10);
                if (empty($recordDate)) continue;

                $amount = floatval($order['actual_price'] ?? $order['estimated_price'] ?? 0);
                if ($amount <= 0) continue;

                // 检查是否已存在（通过 source_id 为 order_id 避免重复）
                $exists = Db::name('statistics_income_records')
                    ->where('source_type', 'order')
                    ->where('source_id', $order['id'])
                    ->find();

                if ($exists) {
                    Db::name('statistics_income_records')
                        ->where('id', $exists['id'])
                        ->update([
                            'amount' => $amount,
                            'updated_at' => date('Y-m-d H:i:s')
                        ]);
                } else {
                    Db::name('statistics_income_records')->insert([
                        'record_date' => $recordDate,
                        'payment_method' => 'online',  // 默认归为在线支付类
                        'order_count' => 1,
                        'amount' => $amount,
                        'remark' => '订单完成: ' . ($order['order_id'] ?? ''),
                        'source_type' => 'order',
                        'source_id' => $order['id'],
                        'created_at' => date('Y-m-d H:i:s'),
                        'updated_at' => date('Y-m-d H:i:s')
                    ]);
                }
                $synced++;
            }

            return $synced;
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * 同步全部（含订单收入）
     */
    public function syncAll($startDate = null, $endDate = null)
    {
        $results = [
            'online_payments' => $this->syncOnlinePayments($startDate, $endDate),
            'transfers' => $this->syncTransfers($startDate, $endDate),
            'orders' => $this->syncOrders($startDate, $endDate),
            'completed_orders_income' => $this->syncIncomeFromCompletedOrders()
        ];

        return $results;
    }
}
