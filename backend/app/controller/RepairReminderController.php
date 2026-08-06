<?php

namespace app\controller;

use app\model\RepairReminder;
use app\common\Result;
use app\service\NotificationService;
use think\facade\Db;

/**
 * 维修提醒管理控制器
 */
class RepairReminderController
{
    /**
     * 获取提醒列表
     * GET /repair-reminders
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $title = request()->get('title', '');
        $machineName = request()->get('machine_name', '');
        $keyword = request()->get('keyword', '');
        $status = request()->get('status', '');
        $type = request()->get('type', '');

        try {
            $query = RepairReminder::with(['contract'])->order('id', 'desc');

            // 搜索功能
            if (!empty($keyword)) {
                $query->whereLike('title|content', '%' . $keyword . '%');
            }

            // 提醒标题筛选
            if (!empty($title)) {
                $query->where('title', 'like', '%' . $title . '%');
            }

            // 机械名称筛选
            if (!empty($machineName)) {
                $query->where('machine_name', 'like', '%' . $machineName . '%');
            }

            // 状态筛选
            if (!empty($status)) {
                $query->where('status', $status);
            }

            // 类型筛选
            if (!empty($type)) {
                $query->where('type', $type);
            }

            $total = $query->count();
            $reminders = $query->page($page, $pageSize)->select();

            return Result::paginated(
                $reminders,
                $total,
                $page,
                $pageSize
            );
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取提醒详情
     * GET /repair-reminders/{id}
     */
    public function read($id)
    {
        try {
            $reminder = RepairReminder::with(['contract'])->find($id);

            if (!$reminder) {
                return Result::error('提醒不存在', 404);
            }

            return Result::success($reminder);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建提醒
     * POST /repair-reminders
     */
    public function save()
    {
        $data = request()->post();

        try {
            // 验证
            validate([
                'title' => 'require|max:200',
                'content' => 'require',
                'machine_name' => 'require',
                'type' => 'require|in:maintenance,inspection,contract',
                'remind_date' => 'require',
                'status' => 'in:pending,sent,completed,cancelled',
            ])->check($data);

            $reminder = RepairReminder::create($data);

            return Result::success($reminder, '提醒创建成功', 201);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新提醒
     * PUT /repair-reminders/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        try {
            $reminder = RepairReminder::find($id);

            if (!$reminder) {
                return Result::error('提醒不存在', 404);
            }

            // 验证
            validate([
                'title' => 'require|max:200',
                'content' => 'require',
                'machine_name' => 'require',
                'type' => 'require|in:maintenance,inspection,contract',
                'remind_date' => 'require',
                'status' => 'in:pending,sent,completed,cancelled',
            ])->check($data);

            $reminder->save($data);

            return Result::success($reminder, '提醒更新成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除提醒
     * DELETE /repair-reminders/{id}
     */
    public function delete($id)
    {
        try {
            $reminder = RepairReminder::find($id);

            if (!$reminder) {
                return Result::error('提醒不存在', 404);
            }

            $reminder->delete();

            return Result::success(null, '提醒删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 手动发送提醒邮件
     * POST /repair-reminders/{id}/send-email
     */
    public function sendEmail($id)
    {
        try {
            $reminder = RepairReminder::find($id);
            if (!$reminder) {
                return Result::error('提醒不存在', 404);
            }

            // 可选：允许前端在手动发送时覆盖收件人/主题/内容
            $data = request()->post();
            // 有些场景下（前后端 JSON/表单解析不一致），request()->post() 可能为空；这里兜底解析原始 JSON
            if (!is_array($data) || empty($data)) {
                $raw = file_get_contents('php://input');
                $json = json_decode($raw, true);
                if (is_array($json)) {
                    $data = $json;
                } else {
                    $data = [];
                }
            }
            $toOverride = isset($data['to']) ? trim((string)$data['to']) : '';
            $subjectOverride = isset($data['subject']) ? trim((string)$data['subject']) : '';
            $messageOverride = isset($data['message']) ? (string)$data['message'] : '';
            $format = isset($data['format']) ? strtolower(trim((string)$data['format'])) : 'text';

            // 仅当通知方式包含 email 或默认发送时才发送
            if ($reminder->notify_method !== 'email' && $reminder->notify_method !== 'system') {
                // 仍然允许手动发送
            }

            // 收件人优先使用前端传入，其次使用提醒记录中指定的目标地址（如果有），否则使用 .env 中的 toaddrs
            $to = !empty($toOverride) ? $toOverride : ($reminder->toaddrs ?? null);
            if (empty($to)) {
                $to = env('toaddrs');
            }
            // 回退到 fromaddrs（极少数场景）以保证兼容历史配置
            if (empty($to)) {
                $to = env('fromaddrs');
            }

            if (empty($to)) {
                return Result::error('未配置目标邮箱，请在 .env 中设置 toaddrs 或在提醒记录中指定收件人', 500);
            }

            if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
                return Result::error('无效的收件人邮箱 (to)', 422);
            }

            $subject = !empty($subjectOverride) ? $subjectOverride : '[维修提醒] ' . ($reminder->title ?: '提醒');

            $content = !empty($messageOverride) ? $messageOverride : ($reminder->content ?: '');

            // 构建邮件 body，根据 format 决定是否作为 HTML
            if ($format === 'html') {
                $body = "<div>{$content}</div>";
            } else {
                $safeContent = nl2br(htmlspecialchars($content, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
                $body = "<p>{$safeContent}</p>";
            }
            $device = htmlspecialchars((string)($reminder->machine_name ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $remindDate = htmlspecialchars((string)($reminder->remind_date ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $body .= "<p>设备：{$device}</p>";
            $body .= "<p>提醒时间：{$remindDate}</p>";

            // 在 web 请求环境下，确保 Composer 的 autoload 被加载（有时框架未自动加载到所有路径）
            $autoloadCandidates = [
                __DIR__ . '/../../../vendor/autoload.php', // workspace root
                __DIR__ . '/../../vendor/autoload.php', // backend/vendor
                dirname(__DIR__, 4) . '/vendor/autoload.php',
                getcwd() . '/vendor/autoload.php'
            ];
            foreach ($autoloadCandidates as $c) {
                if ($c && file_exists($c)) {
                    try {
                        require_once $c;
                    } catch (\Throwable $e) {
                        // 忽略加载时可能抛出的异常，继续尝试其他路径
                    }
                    break;
                }
            }

            $mailService = new \app\service\MailService();
            // 明确在 web 环境下先确保 Composer autoload 已加载
            try {
                $mailService->ensureAutoload();
            } catch (\Throwable $e) {
                // 继续，send() 内部也会尝试加载
            }

            $result = $mailService->send($to, $subject, $body);

            if ($result['success']) {
                $reminder->status = 'sent';
                $reminder->notify_content = $body;
                $reminder->save();
                return Result::success(null, '邮件发送成功');
            }

            // 如果失败，且可能是因为 PHPMailer 未加载或加载了不含 PHPMailer 的 autoload，尝试显式加载常见的 autoload 路径并重试一次。
            $errMsg = strtolower($result['message'] ?? '');
            if (strpos($errMsg, 'phpmailer') !== false || strpos($errMsg, '未安装 phpmailer') !== false || strpos($errMsg, 'mail() 返回 false') !== false) {
                $attempted = [];
                $candidates = [
                    dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php', // backend/vendor
                    dirname(__DIR__, 4) . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php', // workspace root vendor
                    getcwd() . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php',
                ];
                foreach ($candidates as $c) {
                    if (!$c || !file_exists($c)) continue;
                    try {
                        require_once $c;
                        $attempted[] = $c;
                    } catch (\Throwable $e) {
                        $this->logRuntime('Explicit require_once failed for: ' . $c . ' error: ' . $e->getMessage());
                        continue;
                    }
                    // 再次尝试发送
                    try {
                        $result2 = $mailService->send($to, $subject, $body);
                        if ($result2['success']) {
                            $reminder->status = 'sent';
                            $reminder->notify_content = $body;
                            $reminder->save();
                            $this->logRuntime('Retry send success after loading: ' . $c);
                            return Result::success(null, '邮件发送成功 (重试)');
                        } else {
                            $this->logRuntime('Retry send failed after loading: ' . $c . ' msg: ' . ($result2['message'] ?? ''));
                        }
                    } catch (\Throwable $e) {
                        $this->logRuntime('Retry send exception after loading: ' . $c . ' error: ' . $e->getMessage());
                    }
                }
            }

            // 如果发送仍失败，尝试收集 mail_debug 日志以便返回更多上下文（若可读）
            $logFile = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'runtime' . DIRECTORY_SEPARATOR . 'logs' . DIRECTORY_SEPARATOR . 'mail_debug.log';
            $logTail = null;
            if (file_exists($logFile)) {
                $lines = array_slice(file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES), -80);
                $logTail = implode("\n", $lines);
            }
            $msg = '邮件发送失败: ' . $result['message'];
            if (!empty($attempted)) $msg .= '\n尝试加载的 autoload: ' . implode(', ', $attempted);
            if ($logTail) $msg .= '\n最近日志:\n' . $logTail;
            return Result::error($msg, 500);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }


    /**
     * 触发按提醒日期自动发送到期邮件
     * POST /repair-reminders/send-due-email
     */
    public function sendDueEmail()
    {
        try {
            $service = new NotificationService();
            $count = $service->sendDueReminders();
            return Result::success(['sent_count' => $count], '到期提醒邮件发送完成');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 维修超时未完成订单提醒
     * 数据来源：小程序 repair 库 orders 表
     * 条件：维修天数（下单时间距今）> days 天 且 未完成（status 非 completed/cancelled）
     * GET /repair-reminders/overdue-orders
     */
    public function overdueOrders()
    {
        $days = (int) request()->get('days', 3);
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $status = trim((string) request()->get('status', ''));

        try {
            $threshold = date('Y-m-d H:i:s', strtotime("-{$days} days"));

            $query = Db::connect('repair')->name('orders')
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->where('created_at', '<=', $threshold);

            if ($status !== '') {
                $query->where('status', $status);
            }

            $total = (clone $query)->count();
            $orders = $query->order('created_at', 'asc')
                ->page($page, $pageSize)
                ->select()
                ->toArray();

            // 关联用户信息
            $userIds = array_values(array_unique(array_filter(array_column($orders, 'user_id'))));
            $userMap = [];
            if ($userIds) {
                $users = Db::connect('repair')->name('users')
                    ->whereIn('id', $userIds)
                    ->field('id,nickname,real_name,phone')
                    ->select()
                    ->toArray();
                foreach ($users as $u) {
                    $userMap[(int) $u['id']] = $u;
                }
            }

            $now = time();
            $items = [];
            foreach ($orders as $o) {
                $created = $o['created_at'] ?? null;
                $repairDays = $created ? (int) floor(($now - strtotime($created)) / 86400) : 0;
                $u = $userMap[(int) ($o['user_id'] ?? 0)] ?? [];
                $items[] = [
                    'id'            => $o['id'],
                    'order_id'      => $o['order_id'] ?? ('#' . $o['id']),
                    'user_name'     => $u['nickname'] ?? ($u['real_name'] ?? ''),
                    'user_phone'    => $u['phone'] ?? '',
                    'device_model'  => $o['device_model'] ?? '',
                    'brand_name'    => $o['brand_name'] ?? '',
                    'status'        => $o['status'] ?? '',
                    'progress'      => (int) ($o['progress'] ?? 0),
                    'created_at'    => $created,
                    'repair_days'   => $repairDays,
                ];
            }

            return Result::paginated($items, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 针对单个超时订单发送提醒（邮件通知管理员跟进，基于 QQ 邮箱授权）
     * POST /repair-reminders/{id}/send-order-reminder
     * 接收参数（可空）：
     *  - to      收件人（默认取 .env 的 toaddrs）
     *  - subject 邮件主题
     *  - message 管理员填写的提醒内容
     *  - format  text | html（发送格式）
     */
    public function sendOrderReminder($id)
    {
        try {
            $order = Db::connect('repair')->name('orders')->find($id);
            if (!$order) {
                return Result::error('订单不存在', 404);
            }

            // 解析请求体（兼容 JSON / 表单）
            $data = request()->post();
            if (!is_array($data) || empty($data)) {
                $raw = file_get_contents('php://input');
                $json = json_decode($raw, true);
                $data = is_array($json) ? $json : [];
            }

            $user = [];
            if (!empty($order['user_id'])) {
                $user = Db::connect('repair')->name('users')
                    ->where('id', $order['user_id'])
                    ->field('id,nickname,real_name,phone')
                    ->find();
            }
            $userName = $user['nickname'] ?? ($user['real_name'] ?? '客户');
            $userPhone = $user['phone'] ?? '';
            $created = $order['created_at'] ?? '';
            $repairDays = $created ? (int) floor((time() - strtotime($created)) / 86400) : 0;
            $orderNo = $order['order_id'] ?? ('#' . $id);
            $deviceModel = $order['device_model'] ?? '';
            $brandName = $order['brand_name'] ?? '';
            $progress = (int) ($order['progress'] ?? 0);

            $statusMap = [
                'pending' => '待处理', 'quoted' => '待确认报价', 'confirmed' => '已确认报价',
                'processing' => '维修中', 'review' => '待验收', 'completed' => '已完成', 'cancelled' => '已取消',
            ];
            $statusText = $statusMap[$order['status']] ?? ((string) $order['status']);

            // 表单参数
            $toOverride = trim((string) ($data['to'] ?? ''));
            $subject = trim((string) ($data['subject'] ?? ''));
            if ($subject === '') {
                $subject = "[维修超时提醒] 订单 {$orderNo} 已维修 {$repairDays} 天未完成";
            }
            $adminMessage = trim((string) ($data['message'] ?? ''));
            $format = strtolower(trim((string) ($data['format'] ?? 'text')));

            // 收件人：前端指定 > .env 的 toaddrs > fromaddrs
            $to = $toOverride !== '' ? $toOverride : env('toaddrs');
            if (empty($to)) {
                $to = env('fromaddrs');
            }
            if (empty($to)) {
                return Result::error('未配置收件邮箱（请在 .env 中设置 toaddrs）', 500);
            }
            if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
                return Result::error('无效的收件人邮箱 (to)', 422);
            }

            // 订单信息块（纯文本）
            $orderInfo = "订单信息：\n"
                . "订单号：{$orderNo}\n"
                . "客户：{$userName}\n"
                . "手机号：{$userPhone}\n"
                . "设备：{$deviceModel}\n"
                . "品牌：{$brandName}\n"
                . "当前状态：{$statusText}\n"
                . "维修进度：{$progress}%\n"
                . "下单时间：{$created}\n"
                . "已维修天数：{$repairDays} 天";

            $plainContent = $orderInfo;
            if ($adminMessage !== '') {
                $plainContent .= "\n\n管理员提醒：\n" . $adminMessage;
            }

            // 渲染邮件正文
            if ($format === 'html') {
                $rowHtml = function ($label, $value) {
                    $label = htmlspecialchars((string) $label, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                    $value = htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
                    return "<tr><td style='padding:6px 12px;background:#f5f7fa;font-weight:600;color:#595959;border:1px solid #e8e8e8;width:110px;'>{$label}</td>"
                        . "<td style='padding:6px 12px;color:#262626;border:1px solid #e8e8e8;'>{$value}</td></tr>";
                };
                $adminHtml = '';
                if ($adminMessage !== '') {
                    $adminHtml = "<div style='margin-top:16px;padding:12px 16px;border-left:4px solid #fa8c16;background:#fff7e6;"
                        . "border-radius:6px;color:#874d00;white-space:pre-wrap;'>"
                        . nl2br(htmlspecialchars($adminMessage, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')) . "</div>";
                }
                $body = "<div style='font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:640px;'>"
                    . "<h3 style='margin:0 0 12px;color:#cf1322;'>维修超时提醒</h3>"
                    . "<table style='border-collapse:collapse;width:100%;font-size:13px;' cellpadding='0' cellspacing='0'>"
                    . $rowHtml('订单号', $orderNo)
                    . $rowHtml('客户', $userName)
                    . $rowHtml('手机号', $userPhone)
                    . $rowHtml('设备', $deviceModel)
                    . $rowHtml('品牌', $brandName)
                    . $rowHtml('当前状态', $statusText)
                    . $rowHtml('维修进度', $progress . '%')
                    . $rowHtml('下单时间', $created)
                    . $rowHtml('已维修天数', $repairDays . ' 天')
                    . "</table>"
                    . $adminHtml
                    . "</div>";
            } else {
                $body = nl2br(htmlspecialchars($plainContent, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
            }

            $mailService = new \app\service\MailService();
            try {
                $mailService->ensureAutoload();
            } catch (\Throwable $e) {
                // 忽略，send() 内部会再尝试加载
            }

            $result = $mailService->send($to, $subject, $body);

            if (!empty($result['success'])) {
                return Result::success(null, '提醒已发送给管理员');
            }

            return Result::error('发送失败: ' . ($result['message'] ?? ''), 500);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 记录运行时日志
     * @param string $message
     */
    private function logRuntime($message)
    {
        $logDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'runtime' . DIRECTORY_SEPARATOR . 'logs';
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0755, true);
        }
        $logFile = $logDir . DIRECTORY_SEPARATOR . 'sms_debug.log';
        $timestamp = date('Y-m-d H:i:s');
        @file_put_contents($logFile, "[{$timestamp}] {$message}\n", FILE_APPEND);
    }
}