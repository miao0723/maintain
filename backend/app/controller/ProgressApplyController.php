<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

/**
 * 进度申请控制器
 * 读取小程序repair数据库的progress_apply进度申请表
 * 表: repair.progress_apply
 */
class ProgressApplyController extends BaseController
{
    /**
     * 获取进度申请列表
     * GET /api/progress-apply
     */
    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $applyNo = trim((string) request()->get('apply_no', ''));
        $customerName = trim((string) request()->get('customer_name', ''));
        $deviceName = trim((string) request()->get('device_name', ''));
        $deviceModel = trim((string) request()->get('device_model', ''));
        $progressType = trim((string) request()->get('progress_type', ''));
        $approvalStatus = trim((string) request()->get('approval_status', ''));
        $orderId = request()->get('order_id');
        $dateStart = trim((string) request()->get('date_start', ''));
        $dateEnd = trim((string) request()->get('date_end', ''));

        try {
            $query = Db::connect('repair')->name('progress_apply');

            if ($applyNo !== '') {
                $query->whereLike('apply_no', '%' . $applyNo . '%');
            }
            if ($customerName !== '') {
                $query->whereLike('customer_name', '%' . $customerName . '%');
            }
            if ($deviceName !== '') {
                $query->whereLike('device_name', '%' . $deviceName . '%');
            }
            if ($deviceModel !== '') {
                $query->whereLike('device_model', '%' . $deviceModel . '%');
            }
            if ($progressType !== '') {
                $query->where('progress_type', $progressType);
            }
            if ($approvalStatus !== '') {
                $query->where('approval_status', $approvalStatus);
            }
            if ($orderId !== null && $orderId !== '') {
                $query->where('order_id', (int)$orderId);
            }
            if ($dateStart !== '') {
                $query->where('created_at', '>=', $dateStart);
            }
            if ($dateEnd !== '') {
                $query->where('created_at', '<=', $dateEnd . ' 23:59:59');
            }

            $total = (clone $query)->count();
            $list = $query->order('id', 'desc')
                ->page($page, $pageSize)
                ->select()
                ->toArray();

            // 获取关联的用户信息
            $userIds = array_values(array_unique(array_filter(array_column($list, 'user_id'))));
            $userMap = [];
            if (!empty($userIds)) {
                $users = Db::connect('repair')->name('users')
                    ->whereIn('id', $userIds)
                    ->field('id,nickname,real_name,phone')
                    ->select()
                    ->toArray();
                foreach ($users as $user) {
                    $userMap[$user['id']] = $user;
                }
            }

            // 获取关联的订单信息
            $orderIds = array_values(array_unique(array_filter(array_column($list, 'order_id'))));
            $orderMap = [];
            if (!empty($orderIds)) {
                $orders = Db::connect('repair')->name('orders')
                    ->whereIn('id', $orderIds)
                    ->field('id,order_id,device_model,status,problem_description')
                    ->select()
                    ->toArray();
                foreach ($orders as $order) {
                    $orderMap[$order['id']] = $order;
                }
            }

            // 获取审核人信息
            $approverIds = array_values(array_unique(array_filter(array_column($list, 'approver_id'))));
            $approverMap = [];
            if (!empty($approverIds)) {
                $approvers = Db::connect('repair')->name('users')
                    ->whereIn('id', $approverIds)
                    ->field('id,nickname,real_name')
                    ->select()
                    ->toArray();
                foreach ($approvers as $approver) {
                    $approverMap[$approver['id']] = $approver;
                }
            }

            // 组装返回数据
            $items = [];
            foreach ($list as $item) {
                $user = $userMap[$item['user_id']] ?? [];
                $order = $orderMap[$item['order_id']] ?? [];
                $approver = $approverMap[$item['approver_id']] ?? [];

                $items[] = [
                    'id' => (int) $item['id'],
                    'apply_no' => $item['apply_no'] ?? '',
                    'order_id' => (int) ($item['order_id'] ?? 0),
                    'order_no' => $order['order_id'] ?? '',
                    'user_id' => (int) ($item['user_id'] ?? 0),
                    'user_name' => $user['real_name'] ?? ($user['nickname'] ?? ''),
                    'user_phone' => $user['phone'] ?? '',
                    'customer_name' => $item['customer_name'] ?? '',
                    'phone' => $item['phone'] ?? '',
                    'device_name' => $item['device_name'] ?? '',
                    'device_model' => $item['device_model'] ?? ($order['device_model'] ?? ''),
                    'brand_name' => '',
                    'progress_type' => $item['progress_type'] ?? '',
                    'progress_type_text' => $this->getProgressTypeText($item['progress_type'] ?? ''),
                    'apply_reason' => $item['apply_reason'] ?? '',
                    'expected_time' => $item['expected_time'] ?? '',
                    'approval_status' => $item['approval_status'] ?? 'pending',
                    'approval_status_text' => $this->getApprovalStatusText($item['approval_status'] ?? 'pending'),
                    'approval_remark' => $item['approval_remark'] ?? '',
                    'approval_at' => $item['approval_at'] ?? '',
                    'approver_id' => (int) ($item['approver_id'] ?? 0),
                    'approver_name' => $approver['real_name'] ?? ($approver['nickname'] ?? ''),
                    'order_status' => $order['status'] ?? '',
                    'order_problem' => $order['problem_description'] ?? '',
                    'created_at' => $item['created_at'] ?? '',
                    'updated_at' => $item['updated_at'] ?? '',
                ];
            }

            return Result::paginated($items, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取进度申请详情
     * GET /api/progress-apply/:id
     */
    public function read($id)
    {
        try {
            $apply = Db::connect('repair')->name('progress_apply')->find($id);

            if (!$apply) {
                return Result::error('申请记录不存在', 404);
            }

            // 获取用户信息
            $user = [];
            if (!empty($apply['user_id'])) {
                $user = Db::connect('repair')->name('users')
                    ->where('id', $apply['user_id'])
                    ->field('id,nickname,real_name,phone')
                    ->find();
            }

            // 获取订单信息
            $order = [];
            if (!empty($apply['order_id'])) {
                $order = Db::connect('repair')->name('orders')
                    ->where('id', $apply['order_id'])
                    ->field('id,order_id,device_model,device_type,status,problem_description,service_type')
                    ->find();
            }

            // 获取审核人信息
            $approver = [];
            if (!empty($apply['approver_id'])) {
                $approver = Db::connect('repair')->name('users')
                    ->where('id', $apply['approver_id'])
                    ->field('id,nickname,real_name')
                    ->find();
            }

            $data = [
                'id' => (int) $apply['id'],
                'apply_no' => $apply['apply_no'] ?? '',
                'order_id' => (int) ($apply['order_id'] ?? 0),
                'order_no' => $order['order_id'] ?? '',
                'order_status' => $order['status'] ?? '',
                'order_problem' => $order['problem_description'] ?? '',
                'service_type' => $order['service_type'] ?? '',
                'user_id' => (int) ($apply['user_id'] ?? 0),
                'user_name' => $user['real_name'] ?? ($user['nickname'] ?? ''),
                'user_phone' => $user['phone'] ?? '',
                'customer_name' => $apply['customer_name'] ?? '',
                'phone' => $apply['phone'] ?? '',
                'device_name' => $apply['device_name'] ?? '',
                'device_model' => $apply['device_model'] ?? ($order['device_model'] ?? ''),
                'brand_name' => '',
                'device_type' => $order['device_type'] ?? '',
                'progress_type' => $apply['progress_type'] ?? '',
                'progress_type_text' => $this->getProgressTypeText($apply['progress_type'] ?? ''),
                'apply_reason' => $apply['apply_reason'] ?? '',
                'expected_time' => $apply['expected_time'] ?? '',
                'approval_status' => $apply['approval_status'] ?? 'pending',
                'approval_status_text' => $this->getApprovalStatusText($apply['approval_status'] ?? 'pending'),
                'approval_remark' => $apply['approval_remark'] ?? '',
                'approval_at' => $apply['approval_at'] ?? '',
                'approver_id' => (int) ($apply['approver_id'] ?? 0),
                'approver_name' => $approver['real_name'] ?? ($approver['nickname'] ?? ''),
                'created_at' => $apply['created_at'] ?? '',
                'updated_at' => $apply['updated_at'] ?? '',
            ];

            return Result::success($data);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 创建进度申请
     * POST /api/progress-apply
     */
    public function save()
    {
        $data = $this->getRequestData();

        if (empty($data['customer_name'])) {
            return Result::error('客户姓名不能为空', 400);
        }
        if (empty($data['phone'])) {
            return Result::error('联系电话不能为空', 400);
        }
        if (empty($data['progress_type'])) {
            return Result::error('进度类型不能为空', 400);
        }
        if (empty($data['apply_reason'])) {
            return Result::error('申请原因不能为空', 400);
        }

        try {
            $applyNo = 'PA' . date('YmdHis') . rand(100, 999);

            $insertData = [
                'apply_no' => $applyNo,
                'order_id' => (int) ($data['order_id'] ?? 0),
                'user_id' => $this->getCurrentUserId(),
                'customer_name' => trim((string) $data['customer_name']),
                'phone' => trim((string) $data['phone']),
                'device_name' => trim((string) ($data['device_name'] ?? '')),
                'device_model' => trim((string) ($data['device_model'] ?? '')),
                'progress_type' => trim((string) $data['progress_type']),
                'apply_reason' => trim((string) $data['apply_reason']),
                'expected_time' => $data['expected_time'] ?? null,
                'approval_status' => 'pending',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            $id = Db::connect('repair')->name('progress_apply')->insertGetId($insertData);

            // 同步到CMMS本地库
            $this->syncSingleToCmms($insertData);

            return Result::success(['id' => $id, 'apply_no' => $applyNo], '创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 审批通过
     * POST /api/progress-apply/:id/approve
     */
    public function approve($id)
    {
        $data = $this->getRequestData();
        $remark = trim((string) ($data['approval_remark'] ?? '同意申请'));

        try {
            $apply = Db::connect('repair')->name('progress_apply')->find($id);

            if (!$apply) {
                return Result::error('申请记录不存在', 404);
            }

            if ($apply['approval_status'] !== 'pending') {
                return Result::error('该申请已处理，不能重复审批', 400);
            }

            $updateData = [
                'approval_status' => 'approved',
                'approval_remark' => $remark,
                'approval_at' => date('Y-m-d H:i:s'),
                'approver_id' => $this->getCurrentUserId(),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            Db::connect('repair')->name('progress_apply')
                ->where('id', $id)
                ->update($updateData);

            // 同步到CMMS本地库
            $this->syncApprovalToCmms($apply['apply_no'], 'approved', $remark);

            return Result::success(null, '审批通过');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 审批拒绝
     * POST /api/progress-apply/:id/reject
     */
    public function reject($id)
    {
        $data = $this->getRequestData();
        $remark = trim((string) ($data['approval_remark'] ?? ''));

        if (empty($remark)) {
            return Result::error('拒绝原因不能为空', 400);
        }

        try {
            $apply = Db::connect('repair')->name('progress_apply')->find($id);

            if (!$apply) {
                return Result::error('申请记录不存在', 404);
            }

            if ($apply['approval_status'] !== 'pending') {
                return Result::error('该申请已处理，不能重复审批', 400);
            }

            $updateData = [
                'approval_status' => 'rejected',
                'approval_remark' => $remark,
                'approval_at' => date('Y-m-d H:i:s'),
                'approver_id' => $this->getCurrentUserId(),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            Db::connect('repair')->name('progress_apply')
                ->where('id', $id)
                ->update($updateData);

            // 同步到CMMS本地库
            $this->syncApprovalToCmms($apply['apply_no'], 'rejected', $remark);

            return Result::success(null, '已拒绝申请');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除进度申请
     * DELETE /api/progress-apply/:id
     */
    public function delete($id)
    {
        try {
            $apply = Db::connect('repair')->name('progress_apply')->find($id);

            if (!$apply) {
                return Result::error('申请记录不存在', 404);
            }

            Db::connect('repair')->name('progress_apply')->delete($id);

            // 同步删除CMMS本地记录
            Db::name('progress_apply')
                ->where('apply_no', $apply['apply_no'])
                ->delete();

            return Result::success(null, '删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 统计信息
     * GET /api/progress-apply/statistics
     */
    public function statistics()
    {
        try {
            $stats = [
                'total' => Db::connect('repair')->name('progress_apply')->count(),
                'pending' => Db::connect('repair')->name('progress_apply')->where('approval_status', 'pending')->count(),
                'approved' => Db::connect('repair')->name('progress_apply')->where('approval_status', 'approved')->count(),
                'rejected' => Db::connect('repair')->name('progress_apply')->where('approval_status', 'rejected')->count(),
            ];

            return Result::success($stats);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 批量同步 - 从repair数据库同步到CMMS本地库
     * POST /api/progress-apply/sync
     */
    public function sync()
    {
        try {
            $mpApplies = Db::connect('repair')->name('progress_apply')
                ->order('id', 'asc')
                ->select()
                ->toArray();

            $syncCount = 0;
            $errorCount = 0;
            $errors = [];

            foreach ($mpApplies as $mpApply) {
                try {
                    $existing = Db::name('progress_apply')
                        ->where('apply_no', $mpApply['apply_no'])
                        ->find();

                    $cmmsData = [
                        'apply_no' => $mpApply['apply_no'],
                        'order_id' => $mpApply['order_id'] ?? null,
                        'customer_name' => $mpApply['customer_name'],
                        'phone' => $mpApply['phone'],
                        'device_name' => $mpApply['device_name'] ?? '',
                        'progress_type' => $this->mapProgressType($mpApply['progress_type']),
                        'apply_reason' => $mpApply['apply_reason'],
                        'expected_time' => $mpApply['expected_time'] ?? null,
                        'approval_status' => $mpApply['approval_status'] ?? 'pending',
                        'approval_remark' => $mpApply['approval_remark'] ?? null,
                        'approval_at' => $mpApply['approval_at'] ?? null,
                        'updated_at' => date('Y-m-d H:i:s'),
                    ];

                    if ($existing) {
                        Db::name('progress_apply')
                            ->where('id', $existing['id'])
                            ->update($cmmsData);
                    } else {
                        $cmmsData['created_at'] = $mpApply['created_at'] ?? date('Y-m-d H:i:s');
                        Db::name('progress_apply')->insert($cmmsData);
                    }

                    $syncCount++;
                } catch (\Exception $e) {
                    $errorCount++;
                    $errors[] = "申请 {$mpApply['apply_no']} 同步失败: " . $e->getMessage();
                }
            }

            return Result::success([
                'total' => count($mpApplies),
                'synced' => $syncCount,
                'failed' => $errorCount,
                'errors' => array_slice($errors, 0, 10),
            ], "同步完成：成功 {$syncCount} 条，失败 {$errorCount} 条");
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 同步单个申请到CMMS本地库
     */
    private function syncSingleToCmms(array $data)
    {
        try {
            Db::name('progress_apply')->insert([
                'apply_no' => $data['apply_no'],
                'order_id' => $data['order_id'] ?? null,
                'customer_name' => $data['customer_name'],
                'phone' => $data['phone'],
                'device_name' => $data['device_name'] ?? '',
                'progress_type' => $this->mapProgressType($data['progress_type']),
                'apply_reason' => $data['apply_reason'],
                'expected_time' => $data['expected_time'] ?? null,
                'approval_status' => 'pending',
                'created_at' => $data['created_at'] ?? date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
        } catch (\Exception $e) {
            \think\facade\Log::error('同步申请到CMMS失败: ' . $e->getMessage());
        }
    }

    /**
     * 同步审批状态到CMMS本地库
     */
    private function syncApprovalToCmms($applyNo, $status, $remark)
    {
        try {
            Db::name('progress_apply')
                ->where('apply_no', $applyNo)
                ->update([
                    'approval_status' => $status,
                    'approval_remark' => $remark,
                    'approval_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
        } catch (\Exception $e) {
            \think\facade\Log::error('同步审批状态到CMMS失败: ' . $e->getMessage());
        }
    }

    /**
     * 获取当前登录用户ID
     */
    private function getCurrentUserId(): int
    {
        $userId = request()->userId ?? 0;
        return (int) $userId;
    }

    /**
     * 小程序进度类型映射到CMMS进度类型
     */
    private function mapProgressType($mpType): string
    {
        $map = [
            'parts_waiting' => 'parts',
            'repairing' => 'repair',
            'testing' => 'inspection',
            'other' => 'other',
        ];
        return $map[$mpType] ?? 'other';
    }

    /**
     * 获取进度类型中文文本
     */
    private function getProgressTypeText($type): string
    {
        $map = [
            'parts_waiting' => '配件等待',
            'repairing' => '维修中',
            'testing' => '测试中',
            'other' => '其他',
        ];
        return $map[$type] ?? $type;
    }

    /**
     * 获取审批状态中文文本
     */
    private function getApprovalStatusText($status): string
    {
        $map = [
            'pending' => '待审核',
            'approved' => '已通过',
            'rejected' => '已拒绝',
        ];
        return $map[$status] ?? '未知';
    }
}