<?php

namespace app\controller;

use app\common\Result;
use app\service\AIService;
use app\service\MailService;
use think\facade\Db;

class StatisticsController
{
    public function dashboard()
    {
        try {
            $repairDb = Db::connect('repair');
            $trendRows = $repairDb->query("SELECT DATE_FORMAT(created_at, '%Y-%m') AS month_key, COUNT(*) AS total FROM orders WHERE created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01') GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month_key ASC");
            $faultRows = $repairDb->name('orders')->field("CASE WHEN problem_description IS NULL OR problem_description = '' THEN '未填写问题描述' ELSE problem_description END AS name, COUNT(*) AS value")->group('name')->order('value', 'desc')->limit(8)->select()->toArray();
            $deviceStatusRows = Db::name('devices')->field("CASE status WHEN 1 THEN '正常' WHEN 2 THEN '维修中' WHEN 3 THEN '报废' ELSE '未知' END AS name, COUNT(*) AS value")->group('status')->order('value', 'desc')->select()->toArray();
            $engineerRows = Db::name('order_engineers')->alias('oe')->leftJoin('engineers e', 'e.id = oe.engineer_id')->leftJoin('users u', 'u.id = e.user_id')->field("oe.engineer_id, COALESCE(u.real_name, CONCAT('工程师', oe.engineer_id)) AS name, COUNT(*) AS value")->group('oe.engineer_id, u.real_name')->order('value', 'desc')->limit(10)->select()->toArray();
            $recentOrders = $repairDb->name('orders')->field('id, order_id, device_model, problem_description, priority, status, created_at')->order('created_at', 'desc')->limit(5)->select()->toArray();
            $trendMap = [];
            foreach ($trendRows as $row) $trendMap[$row['month_key']] = intval($row['total']);
            $months = [];
            for ($i = 5; $i >= 0; $i--) { $k = date('Y-m', strtotime("-{$i} month")); $months[] = ['month' => $k, 'count' => $trendMap[$k] ?? 0]; }
            return Result::success(['statistics' => ['total_orders' => $repairDb->name('orders')->count(), 'pending_orders' => $repairDb->name('orders')->where('status', 'pending')->count(), 'completed_orders' => $repairDb->name('orders')->where('status', 'completed')->count(), 'total_devices' => Db::name('devices')->count()], 'charts' => ['trend' => $months, 'fault_types' => $faultRows, 'device_status' => $deviceStatusRows, 'engineer_workloads' => $engineerRows], 'recent_orders' => $recentOrders]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    public function income()
    {
        $start = request()->get('start_date', date('Y-m-d', strtotime('-90 days')));
        $end = request()->get('end_date', date('Y-m-d'));
        $group = request()->get('group_by', 'day');
        try {
            $rows = Db::name('statistics_income_records')->whereBetweenTime('record_date', $start, $end)->order('record_date', 'asc')->select()->toArray();
            $timeline = [];
            foreach ($rows as $row) {
                if ($group === 'day') {
                    $key = $row['record_date'];
                } elseif ($group === 'month') {
                    $key = date('Y-m', strtotime($row['record_date']));
                } else {
                    $key = date('Y', strtotime($row['record_date']));
                }
                if (!isset($timeline[$key])) $timeline[$key] = ['date' => $key, 'order_count' => 0, 'online_income' => 0, 'transfer_income' => 0, 'total_income' => 0];
                $amount = (float) $row['amount'];
                $timeline[$key]['order_count'] += (int) $row['order_count'];
                $timeline[$key]['total_income'] += $amount;
                $timeline[$key][$row['payment_method'] === 'online' ? 'online_income' : 'transfer_income'] += $amount;
            }
            ksort($timeline);
            $table = [];
            $prev = null;
            foreach (array_values($timeline) as $item) {
                $item['online_income'] = round($item['online_income'], 2);
                $item['transfer_income'] = round($item['transfer_income'], 2);
                $item['total_income'] = round($item['total_income'], 2);
                $item['growth_rate'] = $prev === null ? 0 : $this->growth($prev, $item['total_income']);
                $table[] = $item;
                $prev = $item['total_income'];
            }
            return Result::success(['statistics' => ['total_income' => round(array_sum(array_column($rows, 'amount')), 2), 'online_income' => round($this->sumIncome($rows, 'online'), 2), 'transfer_income' => round($this->sumIncome($rows, 'transfer'), 2), 'avg_amount' => $this->avgIncome($rows), 'growth_rate' => count($table) > 1 ? $table[count($table)-1]['growth_rate'] : 0], 'timeline' => array_values($timeline), 'table' => array_reverse($table), 'start_date' => $start, 'end_date' => $end, 'group_by' => $group]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    public function expense()
    {
        return $this->expenseOrOrders('statistics_expense_records', 'expense_date', request()->get('category', ''));
    }

    public function orders()
    {
        $start = request()->get('start_date', date('Y-m-d', strtotime('-90 days')));
        $end = request()->get('end_date', date('Y-m-d'));
        $status = request()->get('status', '');
        $page = (int) request()->get('page', 1);
        $size = (int) request()->get('page_size', request()->get('pageSize', 10));
        try {
            $q = Db::name('statistics_order_records')->whereBetweenTime('created_at', $start . ' 00:00:00', $end . ' 23:59:59');
            if ($status !== '') $q->where('status', $status);
            $rows = $q->order('created_at', 'asc')->select()->toArray();
            $stats = ['completed_orders' => $this->countBy($rows, 'completed'), 'processing_orders' => $this->countBy($rows, 'processing'), 'pending_orders' => $this->countBy($rows, 'pending'), 'cancelled_orders' => $this->countBy($rows, 'cancelled')];
            $total = count($rows);
            return Result::success(['statistics' => ['total_orders' => $total] + $stats + ['completion_rate' => $total ? round($stats['completed_orders'] * 100 / $total, 1) : 0], 'timeline' => $this->dailyCount('statistics_order_records', 'created_at', $start, $end), 'status_stats' => [['status' => 'completed', 'count' => $stats['completed_orders']], ['status' => 'processing', 'count' => $stats['processing_orders']], ['status' => 'pending', 'count' => $stats['pending_orders']], ['status' => 'cancelled', 'count' => $stats['cancelled_orders']]], 'table' => array_slice(array_reverse($rows), max(0, ($page - 1) * $size), $size), 'pagination' => ['page' => $page, 'page_size' => $size, 'total' => $total]]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    public function timeout()
    {
        $start = request()->get('start_date', date('Y-m-d', strtotime('-90 days')));
        $end = request()->get('end_date', date('Y-m-d'));
        $type = request()->get('timeout_type', '');
        $page = (int) request()->get('page', 1);
        $size = (int) request()->get('page_size', request()->get('pageSize', 10));
        try {
            $q = Db::name('statistics_timeout_records')->whereBetweenTime('created_at', $start . ' 00:00:00', $end . ' 23:59:59');
            if ($type !== '') $q->where('timeout_type', $type);
            $rows = array_map(fn($i) => $i + ['timeout_duration' => $this->duration((int) $i['timeout_minutes'])], $q->order('created_at', 'asc')->select()->toArray());
            $total = count($rows);
            return Result::success(['statistics' => ['total_timeouts' => $total, 'response_timeouts' => $this->countTimeout($rows, 'response'), 'repair_timeouts' => $this->countTimeout($rows, 'repair'), 'delivery_timeouts' => $this->countTimeout($rows, 'delivery')], 'timeline' => $this->timeoutTimeline($start, $end), 'reason_stats' => $this->reasonStats($rows), 'table' => array_slice(array_reverse($rows), max(0, ($page - 1) * $size), $size), 'pagination' => ['page' => $page, 'page_size' => $size, 'total' => $total]]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    private function expenseOrOrders($table, $dateField, $category)
    {
        $start = request()->get('start_date', date('Y-m-d', strtotime('-9 days')));
        $end = request()->get('end_date', date('Y-m-d'));
        $page = (int) request()->get('page', 1);
        $size = (int) request()->get('page_size', request()->get('pageSize', 10));
        try {
            $q = Db::name($table)->whereBetweenTime($dateField, $start, $end);
            if ($category !== '') $q->where('category', $category);
            $rows = $q->order($dateField, 'asc')->select()->toArray();
            $total = count($rows);
            $timeline = [];
            foreach ($this->dates($start, $end) as $d) $timeline[$d] = ['date' => $d, 'purchase' => 0, 'salary' => 0, 'operation' => 0, 'other' => 0];
            foreach ($rows as $r) $timeline[$r[$dateField]][$r['category']] += (float) $r['amount'];
            return Result::success(['statistics' => ['total_expense' => round(array_sum(array_column($rows, 'amount')), 2), 'purchase_expense' => round($this->sumCategory($rows, 'purchase'), 2), 'salary_expense' => round($this->sumCategory($rows, 'salary'), 2), 'operation_expense' => round($this->sumCategory($rows, 'operation'), 2), 'other_expense' => round($this->sumCategory($rows, 'other'), 2)], 'timeline' => array_values($timeline), 'table' => array_slice(array_reverse($rows), max(0, ($page - 1) * $size), $size), 'pagination' => ['page' => $page, 'page_size' => $size, 'total' => $total]]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    private function dailyCount($table, $field, $start, $end)
    {
        $map = [];
        $rows = Db::name($table)->whereBetweenTime($field, $start . ' 00:00:00', $end . ' 23:59:59')->field("DATE($field) d, COUNT(*) c")->group('d')->select()->toArray();
        foreach ($rows as $r) $map[$r['d']] = (int) $r['c'];
        return array_map(fn($d) => ['date' => $d, 'count' => $map[$d] ?? 0], $this->dates($start, $end));
    }

    private function timeoutTimeline($start, $end)
    {
        $timeline = [];
        foreach ($this->dates($start, $end) as $d) $timeline[$d] = ['date' => $d, 'response' => 0, 'repair' => 0, 'delivery' => 0];
        $rows = Db::name('statistics_timeout_records')->whereBetweenTime('created_at', $start . ' 00:00:00', $end . ' 23:59:59')->select()->toArray();
        foreach ($rows as $r) { $d = substr($r['created_at'], 0, 10); if (isset($timeline[$d])) $timeline[$d][$r['timeout_type']]++; }
        return array_values($timeline);
    }

    private function reasonStats($rows)
    {
        $stats = [];
        foreach ($rows as $r) {
            $t = (string) $r['reason'];
            $name = str_contains($t, '配件') ? '等待配件' : (str_contains($t, '工程师') ? '工程师调度' : (str_contains($t, '交通') ? '交通问题' : (str_contains($t, '客户') ? '客户原因' : '其他原因')));
            $stats[$name] = ($stats[$name] ?? 0) + 1;
        }
        $out = [];
        foreach ($stats as $name => $value) $out[] = compact('name', 'value');
        return $out;
    }

    private function dates($start, $end) { $a = []; for ($t = strtotime($start); $t <= strtotime($end); $t = strtotime('+1 day', $t)) $a[] = date('Y-m-d', $t); return $a; }
    private function growth($p, $c) { return (float) $p === 0.0 ? ($c > 0 ? 100.0 : 0.0) : round((($c - $p) / $p) * 100, 1); }
    private function sumIncome($rows, $m) { return array_sum(array_map(fn($i) => $i['payment_method'] === $m ? (float) $i['amount'] : 0, $rows)); }
    private function avgIncome($rows) { $orders = array_sum(array_column($rows, 'order_count')); return $orders ? round(array_sum(array_column($rows, 'amount')) / $orders, 2) : 0; }
    private function sumCategory($rows, $c) { return array_sum(array_map(fn($i) => $i['category'] === $c ? (float) $i['amount'] : 0, $rows)); }
    private function countBy($rows, $s) { return count(array_filter($rows, fn($i) => $i['status'] === $s)); }
    private function countTimeout($rows, $s) { return count(array_filter($rows, fn($i) => $i['timeout_type'] === $s)); }
    private function duration($m) { $d = intdiv($m, 1440); $h = intdiv($m % 1440, 60); $i = $m % 60; return ($d ? $d . '天' : '') . ($h ? $h . '小时' : '') . (($i || (!$d && !$h)) ? $i . '分钟' : ''); }

    /**
     * 生成超时总结（调用 DeepSeek API）
     * POST /api/statistics/timeout/summary
     */
    public function generateSummary()
    {
        $start = request()->param('start_date', date('Y-m-d', strtotime('-9 days')));
        $end = request()->param('end_date', date('Y-m-d'));
        $type = request()->param('timeout_type', '');

        try {
            $q = Db::name('statistics_timeout_records')->whereBetweenTime('created_at', $start . ' 00:00:00', $end . ' 23:59:59');
            if ($type !== '') $q->where('timeout_type', $type);

            $rows = array_map(fn($i) => $i + ['timeout_duration' => $this->duration((int) $i['timeout_minutes'])], $q->order('created_at', 'asc')->select()->toArray());

            $data = [
                'statistics' => [
                    'total_timeouts' => count($rows),
                    'response_timeouts' => $this->countTimeout($rows, 'response'),
                    'repair_timeouts' => $this->countTimeout($rows, 'repair'),
                    'delivery_timeouts' => $this->countTimeout($rows, 'delivery')
                ],
                'timeline' => $this->timeoutTimeline($start, $end),
                'reason_stats' => $this->reasonStats($rows),
                'table' => array_slice(array_reverse($rows), 0, 50)
            ];

            $aiService = new AIService();
            $summary = $aiService->generateTimeoutSummary($data);

            return Result::success(['summary' => $summary], '总结生成成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 发送超时预警邮件
     * POST /api/statistics/timeout/send-email
     */
    public function sendEmail()
    {
        $data = request()->post();
        $to = $data['email'] ?? '';
        $summary = $data['summary'] ?? '';

        if (empty($to)) {
            return Result::error('请提供收件人邮箱', 422);
        }

        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return Result::error('无效的邮箱地址', 422);
        }

        if (empty($summary)) {
            return Result::error('总结内容不能为空', 422);
        }

        try {
            $mailService = new MailService();
            $mailService->ensureAutoload();

            // 将 Markdown 转换为 HTML
            $htmlContent = $this->markdownToHtml($summary);

            $result = $mailService->send($to, '维修超时预警报告', $htmlContent);

            if ($result['success']) {
                return Result::success(null, '邮件发送成功');
            }

            return Result::error('邮件发送失败: ' . ($result['message'] ?? ''), 500);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 简单的 Markdown 转 HTML
     *
     * @param string $markdown
     * @return string
     */
    private function markdownToHtml($markdown)
    {
        $html = $markdown;

        // 转换标题
        $html = preg_replace('/^### (.*$)/m', '<h3>$1</h3>', $html);
        $html = preg_replace('/^## (.*$)/m', '<h2>$1</h2>', $html);
        $html = preg_replace('/^# (.*$)/m', '<h1>$1</h1>', $html);

        // 转换加粗
        $html = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $html);

        // 转换列表
        $html = preg_replace('/^- (.*$)/m', '<li>$1</li>', $html);
        $html = preg_replace('/(<li>.*<\/li>)/s', '<ul>$1</ul>', $html);

        // 转换段落
        $html = preg_replace('/\n\n/', '</p><p>', $html);
        $html = '<p>' . $html . '</p>';

        // 清理多余标签
        $html = str_replace('<p><ul>', '<ul>', $html);
        $html = str_replace('</ul></p>', '</ul>', $html);
        $html = str_replace('<p><h', '<h', $html);
        $html = str_replace('</h', '</h', $html);
        $html = str_replace('</h1></p>', '</h1>', $html);
        $html = str_replace('</h2></p>', '</h2>', $html);
        $html = str_replace('</h3></p>', '</h3>', $html);

        return $html;
    }

    /**
     * 生成收入统计总结（调用 DeepSeek API）
     * POST /api/statistics/income/summary
     */
    public function generateIncomeSummary()
    {
        $start = request()->param('start_date', date('Y-m-d', strtotime('-9 days')));
        $end = request()->param('end_date', date('Y-m-d'));
        $group = request()->param('group_by', 'day');

        try {
            $rows = Db::name('statistics_income_records')->whereBetweenTime('record_date', $start, $end)->order('record_date', 'asc')->select()->toArray();
            $timeline = [];
            foreach ($rows as $row) {
                if ($group === 'day') {
                    $key = $row['record_date'];
                } elseif ($group === 'month') {
                    $key = date('Y-m', strtotime($row['record_date']));
                } else {
                    $key = date('Y', strtotime($row['record_date']));
                }
                if (!isset($timeline[$key])) $timeline[$key] = ['date' => $key, 'order_count' => 0, 'online_income' => 0, 'transfer_income' => 0, 'total_income' => 0];
                $amount = (float) $row['amount'];
                $timeline[$key]['order_count'] += (int) $row['order_count'];
                $timeline[$key]['total_income'] += $amount;
                $timeline[$key][$row['payment_method'] === 'online' ? 'online_income' : 'transfer_income'] += $amount;
            }
            ksort($timeline);
            $table = [];
            $prev = null;
            foreach (array_values($timeline) as $item) {
                $item['online_income'] = round($item['online_income'], 2);
                $item['transfer_income'] = round($item['transfer_income'], 2);
                $item['total_income'] = round($item['total_income'], 2);
                $item['growth_rate'] = $prev === null ? 0 : $this->growth($prev, $item['total_income']);
                $table[] = $item;
                $prev = $item['total_income'];
            }

            $data = [
                'statistics' => [
                    'total_income' => round(array_sum(array_column($rows, 'amount')), 2),
                    'online_income' => round($this->sumIncome($rows, 'online'), 2),
                    'transfer_income' => round($this->sumIncome($rows, 'transfer'), 2),
                    'avg_amount' => $this->avgIncome($rows),
                    'growth_rate' => count($table) > 1 ? $table[count($table)-1]['growth_rate'] : 0
                ],
                'timeline' => array_values($timeline),
                'table' => array_reverse($table)
            ];

            $aiService = new AIService();
            $summary = $aiService->generateIncomeSummary($data);

            return Result::success(['summary' => $summary], '总结生成成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 生成开支统计总结（调用 DeepSeek API）
     * POST /api/statistics/expense/summary
     */
    public function generateExpenseSummary()
    {
        $start = request()->param('start_date', date('Y-m-d', strtotime('-9 days')));
        $end = request()->param('end_date', date('Y-m-d'));
        $category = request()->param('category', '');

        try {
            $q = Db::name('statistics_expense_records')->whereBetweenTime('expense_date', $start, $end);
            if ($category !== '') $q->where('category', $category);
            $rows = $q->order('expense_date', 'asc')->select()->toArray();

            $timeline = [];
            foreach ($this->dates($start, $end) as $d) $timeline[$d] = ['date' => $d, 'purchase' => 0, 'salary' => 0, 'operation' => 0, 'other' => 0];
            foreach ($rows as $r) $timeline[$r['expense_date']][$r['category']] += (float) $r['amount'];

            $data = [
                'statistics' => [
                    'total_expense' => round(array_sum(array_column($rows, 'amount')), 2),
                    'purchase_expense' => round($this->sumCategory($rows, 'purchase'), 2),
                    'salary_expense' => round($this->sumCategory($rows, 'salary'), 2),
                    'operation_expense' => round($this->sumCategory($rows, 'operation'), 2),
                    'other_expense' => round($this->sumCategory($rows, 'other'), 2)
                ],
                'timeline' => array_values($timeline),
                'table' => array_reverse($rows)
            ];

            $aiService = new AIService();
            $summary = $aiService->generateExpenseSummary($data);

            return Result::success(['summary' => $summary], '总结生成成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 生成订单统计总结（调用 DeepSeek API）
     * POST /api/statistics/orders/summary
     */
    public function generateOrderSummary()
    {
        $start = request()->param('start_date', date('Y-m-d', strtotime('-9 days')));
        $end = request()->param('end_date', date('Y-m-d'));
        $status = request()->param('status', '');

        try {
            $q = Db::name('statistics_order_records')->whereBetweenTime('created_at', $start . ' 00:00:00', $end . ' 23:59:59');
            if ($status !== '') $q->where('status', $status);
            $rows = $q->order('created_at', 'asc')->select()->toArray();

            $stats = [
                'completed_orders' => $this->countBy($rows, 'completed'),
                'processing_orders' => $this->countBy($rows, 'processing'),
                'pending_orders' => $this->countBy($rows, 'pending'),
                'cancelled_orders' => $this->countBy($rows, 'cancelled')
            ];
            $total = count($rows);

            $data = [
                'statistics' => [
                    'total_orders' => $total
                ] + $stats + [
                    'completion_rate' => $total ? round($stats['completed_orders'] * 100 / $total, 1) : 0
                ],
                'timeline' => $this->dailyCount('statistics_order_records', 'created_at', $start, $end),
                'status_stats' => [
                    ['status' => 'completed', 'count' => $stats['completed_orders']],
                    ['status' => 'processing', 'count' => $stats['processing_orders']],
                    ['status' => 'pending', 'count' => $stats['pending_orders']],
                    ['status' => 'cancelled', 'count' => $stats['cancelled_orders']]
                ],
                'table' => array_reverse($rows)
            ];

            $aiService = new AIService();
            $summary = $aiService->generateOrderSummary($data);

            return Result::success(['summary' => $summary], '总结生成成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
