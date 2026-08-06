<?php
namespace app\controller;

use app\common\Result;
use app\common\DataHelper;
use app\model\RepairOrder;
use think\facade\Db;

class RepairProgressController extends BaseController
{
    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $status = trim((string) request()->get('status', ''));
        $stage = trim((string) request()->get('stage', ''));
        $ids = $this->matchOrderIds(
            trim((string) request()->get('order_id', '')),
            trim((string) request()->get('order_no', '')),
            trim((string) request()->get('device_model', ''))
        );

        try {
            $q = Db::name('repair_progress');
            if ($status !== '') $q->where('status', $status);
            if ($stage !== '') $q->where('stage', $stage);
            if ($ids !== null) {
                if (!$ids) return Result::paginated([], 0, $page, $pageSize);
                $q->whereIn('order_id', $ids);
            }
            $total = (clone $q)->count();
            $list = $q->order('id', 'desc')->page($page, $pageSize)->select()->toArray();
            $orders = $this->orders(array_column($list, 'order_id'));
            foreach ($list as &$v) $v = $this->row($v, $orders[$v['order_id']] ?? []);
            return Result::paginated($list, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    public function read($id)
    {
        try {
            $row = Db::name('repair_progress')->find($id);
            if (!$row) return Result::error('进度记录不存在', 404);
            return Result::success($this->row($row, $this->order((int) $row['order_id']) ?? []));
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    public function save()
    {
        $data = $this->getRequestData();
        if (empty($data['order_id'])) return Result::error('订单ID不能为空', 400);
        if (empty($data['stage'])) return Result::error('阶段不能为空', 400);
        try {
            if (!RepairOrder::find((int) $data['order_id'])) return Result::error('订单不存在', 400);
            $payload = $this->payload($data);
            $payload['created_at'] = date('Y-m-d H:i:s');
            $payload['updated_at'] = $payload['created_at'];
            $id = Db::name('repair_progress')->insertGetId($payload);
            $this->sync((int) $payload['order_id']);
            return Result::success(Db::name('repair_progress')->find($id), '创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    public function update($id)
    {
        $data = $this->getRequestData();
        try {
            $old = Db::name('repair_progress')->find($id);
            if (!$old) return Result::error('进度记录不存在', 404);
            if (array_key_exists('order_id', $data) && !RepairOrder::find((int) $data['order_id'])) return Result::error('订单不存在', 400);
            $payload = $this->payload($data, true);
            $payload['updated_at'] = date('Y-m-d H:i:s');
            Db::name('repair_progress')->where('id', $id)->update($payload);
            $new = Db::name('repair_progress')->find($id);
            $this->sync((int) $new['order_id']);
            if ((int) $old['order_id'] !== (int) $new['order_id']) $this->sync((int) $old['order_id']);
            return Result::success($new, '更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    public function delete($id)
    {
        try {
            $row = Db::name('repair_progress')->find($id);
            if (!$row) return Result::error('进度记录不存在', 404);
            Db::name('repair_progress')->delete($id);
            $this->sync((int) $row['order_id']);
            return Result::success(null, '删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    public function orderProgress($orderId)
    {
        try {
            $list = Db::name('repair_progress')->where('order_id', $orderId)->order('id', 'asc')->select()->toArray();
            $max = 0; $done = 0;
            foreach ($list as &$v) {
                $max = max($max, (int) ($v['progress'] ?? 0));
                if (($v['status'] ?? '') === 'completed') $done++;
            }
            return Result::success([
                'order' => $this->order((int) $orderId),
                'progress_list' => $list,
                'total_stages' => count($list),
                'completed_stages' => $done,
                'overall_progress' => $max,
            ]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    private function payload(array $data, bool $partial = false): array
    {
        $fields = ['order_id','repair_report_id','stage','stage_name','status','progress','description','handler_id','handler_name','start_time','end_time','remark'];
        $r = [];
        foreach ($fields as $f) {
            if ($partial && !array_key_exists($f, $data)) continue;
            $v = $data[$f] ?? null;
            if (in_array($f, ['order_id','repair_report_id','handler_id','progress'], true)) $v = ($v === '' || $v === null) ? null : (int) $v;
            if (in_array($f, ['stage','stage_name','status','description','handler_name','remark'], true) && $v !== null) $v = trim((string) $v);
            if (in_array($f, ['start_time','end_time'], true) && $v === '') $v = null;
            $r[$f] = $v;
        }
        if (!$partial) {
            $r['status'] = $r['status'] ?: 'pending';
            $r['progress'] = $r['progress'] ?? 0;
        }
        return $r;
    }

    private function row(array $row, array $order): array
    {
        $row['order_no'] = $order['order_id'] ?? '';
        $row['device_model'] = $order['device_model'] ?? '';
        $row['device_type'] = $order['device_type'] ?? '';
        $row['customer_name'] = $order['user_name'] ?? ($order['contact_name'] ?? '');
        $row['customer_phone'] = $order['user_phone'] ?? ($order['contact_phone'] ?? '');
        $row['progress'] = (int) ($row['progress'] ?? 0);
        $row['fault_images'] = $order['images_list'] ?? [];
        return $row;
    }

    private function matchOrderIds(string $orderId, string $orderNo, string $deviceModel): ?array
    {
        if ($orderId === '' && $orderNo === '' && $deviceModel === '') return null;
        $q = Db::connect('repair')->name('orders')->field('id');
        if ($orderId !== '') $q->where('id', (int) $orderId);
        if ($orderNo !== '') $q->whereLike('order_id', '%' . $orderNo . '%');
        if ($deviceModel !== '') $q->whereLike('device_model', '%' . $deviceModel . '%');
        return $q->column('id');
    }

    private function order(int $id): ?array
    {
        $orders = $this->orders([$id]);
        return $orders[$id] ?? null;
    }

    private function orders(array $ids): array
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $ids))));
        if (!$ids) return [];
        $orders = Db::connect('repair')->name('orders')->whereIn('id', $ids)->field('id,order_id,device_model,device_type,user_id,address_id,images')->select()->toArray();
        $userIds = array_values(array_unique(array_filter(array_column($orders, 'user_id'))));
        $addrIds = array_values(array_unique(array_filter(array_column($orders, 'address_id'))));
        $users = []; $addrs = [];
        if ($userIds) foreach (Db::connect('repair')->name('users')->whereIn('id', $userIds)->field('id,nickname,real_name,phone')->select()->toArray() as $u) $users[(int) $u['id']] = $u;
        if ($addrIds) foreach (Db::connect('repair')->name('user_addresses')->whereIn('id', $addrIds)->field('id,contact_name,contact_phone')->select()->toArray() as $a) $addrs[(int) $a['id']] = $a;
        $map = [];
        foreach ($orders as $o) {
            $u = $users[(int) ($o['user_id'] ?? 0)] ?? [];
            $a = $addrs[(int) ($o['address_id'] ?? 0)] ?? [];
            $o['user_name'] = $u['nickname'] ?? ($u['real_name'] ?? '');
            $o['user_phone'] = $u['phone'] ?? '';
            $o['contact_name'] = $a['contact_name'] ?? '';
            $o['contact_phone'] = $a['contact_phone'] ?? '';
            // 处理故障图片
            $images = $o['images'] ?? [];
            if (is_string($images) && $images !== '') {
                $decoded = json_decode($images, true);
                $images = is_array($decoded) ? $decoded : [];
            } elseif (!is_array($images)) {
                $images = [];
            }
            $o['images_list'] = DataHelper::fixMiniprogramImageUrl($images);
            $map[(int) $o['id']] = $o;
        }
        return $map;
    }

    private function sync(int $orderId): void
    {
        if ($orderId <= 0) return;
        $order = RepairOrder::find($orderId);
        if (!$order) return;
        $list = Db::name('repair_progress')->where('order_id', $orderId)->select()->toArray();
        if (!$list) {
            $order->progress = 0;
            if (!in_array($order->status, [RepairOrder::STATUS_CANCELLED, RepairOrder::STATUS_COMPLETED], true)) $order->status = RepairOrder::STATUS_PENDING;
            $order->save();
            return;
        }
        $max = 0; $allDone = true; $started = false;
        foreach ($list as $v) {
            $p = (int) ($v['progress'] ?? 0);
            $max = max($max, $p);
            if (($v['status'] ?? '') !== 'completed') $allDone = false;
            if (($v['status'] ?? '') === 'in_progress' || $p > 0 || !empty($v['start_time'])) $started = true;
        }
        $order->progress = $max;
        if ($order->status !== RepairOrder::STATUS_CANCELLED) {
            if ($allDone) {
                $wasAlreadyCompleted = $order->status === RepairOrder::STATUS_COMPLETED;
                $order->status = RepairOrder::STATUS_COMPLETED;
                if (empty($order->completed_at)) $order->completed_at = date('Y-m-d H:i:s');
                // 自动同步收入
                if (!$wasAlreadyCompleted) {
                    try {
                        (new \app\service\StatisticsService())->syncIncomeFromCompletedOrders($orderId);
                    } catch (\Exception $e) {
                        trace('收入同步失败: ' . $e->getMessage(), 'error');
                    }
                }
            } else {
                $order->status = $started ? RepairOrder::STATUS_PROCESSING : RepairOrder::STATUS_PENDING;
            }
        }
        $order->save();
    }
}
