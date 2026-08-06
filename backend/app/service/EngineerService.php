<?php

namespace app\service;

use app\model\Engineer;
use app\model\WorkOrder;
use app\model\User;
use think\facade\Db;

class EngineerService
{
    /**
     * 获取工程师列表（分页+筛选）
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = Engineer::with(['user' => function($query) {
            $query->with(['department']);
        }]);

        // 按技能等级筛选
        if (isset($filters['skill_level']) && $filters['skill_level'] !== '') {
            $query->where('skill_level', $filters['skill_level']);
        }

        // 按状态筛选
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        // 按部门筛选
        if (isset($filters['department_id']) && !empty($filters['department_id'])) {
            $query->whereHas('user', function($q) use ($filters) {
                $q->where('department_id', $filters['department_id']);
            });
        }

        // 搜索姓名
        if (isset($filters['keyword']) && !empty($filters['keyword'])) {
            $keyword = $filters['keyword'];
            $query->whereHas('user', function($q) use ($keyword) {
                $q->whereLike('real_name', '%' . $keyword . '%');
            });
        }

        // 排序：按技能等级降序，创建时间降序
        $query->order('skill_level', 'desc')
              ->order('id', 'desc');

        $list = $query->page($page, $limit)->select();
        $total = $query->count();

        return [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ];
    }

    /**
     * 获取工程师详情
     */
    public function getDetail($id)
    {
        $engineer = Engineer::with(['user' => function($query) {
            $query->with(['department']);
        }])->find($id);

        if (!$engineer) {
            throw new \Exception('工程师不存在');
        }

        // 获取当前工作负载
        $engineer->workload = $engineer->getWorkload();

        return $engineer;
    }

    /**
     * 创建工程师资料
     */
    public function create($data)
    {
        // 检查用户是否存在且是工程师角色
        $user = User::find($data['user_id']);
        if (!$user) {
            throw new \Exception('用户不存在');
        }

        if ($user->role_type != 3) {
            throw new \Exception('该用户不是工程师角色');
        }

        // 检查是否已有工程师资料
        $existing = Engineer::where('user_id', $data['user_id'])->find();
        if ($existing) {
            throw new \Exception('该用户已有工程师资料');
        }

        // 设置默认值
        $data['skill_level'] = $data['skill_level'] ?? Engineer::SKILL_INTERMEDIATE;
        $data['work_years'] = $data['work_years'] ?? 0;
        $data['status'] = $data['status'] ?? Engineer::STATUS_ACTIVE;

        // 显式指定允许的字段
        $allowedFields = [
            'user_id', 'skill_level', 'specialties',
            'work_years', 'certification', 'status'
        ];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $engineer = new Engineer();
        $engineer->data($filteredData);
        $engineer->save();

        return $engineer->refresh();
    }

    /**
     * 更新工程师资料
     */
    public function update($id, $data)
    {
        $engineer = Engineer::find($id);
        if (!$engineer) {
            throw new \Exception('工程师不存在');
        }

        // 显式指定允许的字段
        $allowedFields = [
            'skill_level', 'specialties', 'work_years', 'certification', 'status'
        ];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $engineer->data($filteredData);
        $engineer->save();

        return $engineer->refresh();
    }

    /**
     * 删除工程师资料
     */
    public function delete($id)
    {
        $engineer = Engineer::find($id);
        if (!$engineer) {
            throw new \Exception('工程师不存在');
        }

        // 检查是否有未完成的工单
        $activeOrders = WorkOrder::where('assigned_to', $engineer->user_id)
            ->whereIn('status', [
                WorkOrder::STATUS_ASSIGNED,
                WorkOrder::STATUS_IN_PROGRESS,
                WorkOrder::STATUS_PENDING_VERIFY
            ])
            ->count();

        if ($activeOrders > 0) {
            throw new \Exception('该工程师有未完成的工单，无法删除');
        }

        $engineer->delete();
        return true;
    }

    /**
     * 获取工程师绩效统计
     */
    public function getPerformance($id, $filters = [])
    {
        $engineer = Engineer::find($id);
        if (!$engineer) {
            throw new \Exception('工程师不存在');
        }

        $query = WorkOrder::where('assigned_to', $engineer->user_id);

        // 按日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where('created_at', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where('created_at', '<=', $filters['end_date'] . ' 23:59:59');
        }

        $baseQuery = clone $query;

        // 基础统计
        $total = $baseQuery->count();
        $closedCount = (clone $query)->where('status', WorkOrder::STATUS_CLOSED)->count();

        // 计算完成率
        $completionRate = $total > 0 ? round(($closedCount / $total) * 100, 2) : 0;

        // 按状态统计
        $byStatus = [
            'assigned' => (clone $query)->where('status', WorkOrder::STATUS_ASSIGNED)->count(),
            'in_progress' => (clone $query)->where('status', WorkOrder::STATUS_IN_PROGRESS)->count(),
            'pending_verify' => (clone $query)->where('status', WorkOrder::STATUS_PENDING_VERIFY)->count(),
            'completed' => (clone $query)->where('status', WorkOrder::STATUS_COMPLETED)->count(),
            'closed' => $closedCount,
        ];

        // 平均评分（仅已关闭工单）
        $avgRating = (clone $query)
            ->where('status', WorkOrder::STATUS_CLOSED)
            ->whereNotNull('reporter_rating')
            ->avg('reporter_rating');

        // 平均完成时间（小时）
        $avgCompletionTime = (clone $query)
            ->where('status', WorkOrder::STATUS_CLOSED)
            ->whereNotNull('start_time')
            ->whereNotNull('complete_time')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, start_time, complete_time)) as avg_hours')
            ->value('avg_hours');

        // 总成本
        $totalCost = (clone $query)
            ->where('status', WorkOrder::STATUS_CLOSED)
            ->sum('total_cost');

        // 最近工单（最近10条）
        $recentOrders = WorkOrder::with(['device'])
            ->where('assigned_to', $engineer->user_id)
            ->order('created_at', 'desc')
            ->limit(10)
            ->select();

        return [
            'engineer_id' => $id,
            'engineer_name' => $engineer->user->real_name,
            'total_orders' => $total,
            'completion_rate' => $completionRate,
            'by_status' => $byStatus,
            'avg_rating' => $avgRating ? round($avgRating, 2) : null,
            'avg_completion_hours' => $avgCompletionTime ? round($avgCompletionTime, 2) : null,
            'total_cost' => $totalCost ? floatval($totalCost) : 0,
            'recent_orders' => $recentOrders,
        ];
    }

    /**
     * 获取可用工程师列表
     */
    public function getAvailableEngineers($date = null)
    {
        $date = $date ?? date('Y-m-d');

        // 优化：预加载工作负载统计
        $engineers = Engineer::with(['user', 'schedules' => function($query) use ($date) {
            $query->where('work_date', $date);
        }])
        ->where('status', Engineer::STATUS_ACTIVE)
        ->select();

        // 批量获取所有工程师的工作负载（使用单个聚合查询）
        $engineerIds = $engineers->column('id');
        $workloadStats = [];
        if (!empty($engineerIds)) {
            $stats = \app\model\WorkOrder::whereIn('assigned_to', $engineerIds)
                ->whereIn('status', [
                    \app\model\WorkOrder::STATUS_ASSIGNED,
                    \app\model\WorkOrder::STATUS_IN_PROGRESS,
                    \app\model\WorkOrder::STATUS_PENDING_VERIFY
                ])
                ->field('assigned_to, status, COUNT(*) as count')
                ->group('assigned_to, status')
                ->select()
                ->toArray();

            // 构建工作负载统计
            foreach ($stats as $stat) {
                $engineerId = $stat['assigned_to'];
                $status = $stat['status'];
                if (!isset($workloadStats[$engineerId])) {
                    $workloadStats[$engineerId] = [
                        'assigned' => 0,
                        'in_progress' => 0,
                        'pending_verify' => 0,
                        'total_active' => 0,
                    ];
                }
                if ($status == \app\model\WorkOrder::STATUS_ASSIGNED) {
                    $workloadStats[$engineerId]['assigned'] = $stat['count'];
                } elseif ($status == \app\model\WorkOrder::STATUS_IN_PROGRESS) {
                    $workloadStats[$engineerId]['in_progress'] = $stat['count'];
                } elseif ($status == \app\model\WorkOrder::STATUS_PENDING_VERIFY) {
                    $workloadStats[$engineerId]['pending_verify'] = $stat['count'];
                }
                $workloadStats[$engineerId]['total_active'] += $stat['count'];
            }
        }

        $available = [];

        foreach ($engineers as $engineer) {
            // 检查是否在排班且未请假
            $isScheduled = false;
            $isOnLeave = false;

            if ($engineer->schedules) {
                foreach ($engineer->schedules as $schedule) {
                    $isScheduled = true;
                    if ($schedule->isOnLeave()) {
                        $isOnLeave = true;
                    }
                }
            }

            // 如果有排班且未请假，或者没有排班记录（视为不排班，不可用）
            if ($isScheduled && !$isOnLeave) {
                // 检查工作负载
                if ($engineer->isAvailable()) {
                    $workload = $workloadStats[$engineer->id] ?? [
                        'assigned' => 0,
                        'in_progress' => 0,
                        'pending_verify' => 0,
                        'total_active' => 0,
                    ];

                    $available[] = [
                        'id' => $engineer->id,
                        'user_id' => $engineer->user_id,
                        'name' => $engineer->user->real_name,
                        'skill_level' => $engineer->skill_level,
                        'skill_level_text' => $engineer->skill_level_text,
                        'specialties' => $engineer->specialties,
                        'workload' => $workload,
                    ];
                }
            }
        }

        return $available;
    }

    /**
     * 根据专长推荐工程师
     */
    public function recommendBySpecialty($faultType, $limit = 5)
    {
        // 获取所有在岗工程师
        $engineers = Engineer::with(['user'])
            ->where('status', Engineer::STATUS_ACTIVE)
            ->whereHas('user', function($q) {
                $q->where('status', 1); // 用户状态正常
            })
            ->select();

        // 优化：批量预加载工作负载
        $engineerIds = $engineers->column('id');
        $workloadStats = [];
        if (!empty($engineerIds)) {
            $stats = \app\model\WorkOrder::whereIn('assigned_to', $engineerIds)
                ->whereIn('status', [
                    \app\model\WorkOrder::STATUS_ASSIGNED,
                    \app\model\WorkOrder::STATUS_IN_PROGRESS,
                    \app\model\WorkOrder::STATUS_PENDING_VERIFY
                ])
                ->field('assigned_to, status, COUNT(*) as count')
                ->group('assigned_to, status')
                ->select()
                ->toArray();

            foreach ($stats as $stat) {
                $engineerId = $stat['assigned_to'];
                $status = $stat['status'];
                if (!isset($workloadStats[$engineerId])) {
                    $workloadStats[$engineerId] = [
                        'assigned' => 0,
                        'in_progress' => 0,
                        'pending_verify' => 0,
                        'total_active' => 0,
                    ];
                }
                if ($status == \app\model\WorkOrder::STATUS_ASSIGNED) {
                    $workloadStats[$engineerId]['assigned'] = $stat['count'];
                } elseif ($status == \app\model\WorkOrder::STATUS_IN_PROGRESS) {
                    $workloadStats[$engineerId]['in_progress'] = $stat['count'];
                } elseif ($status == \app\model\WorkOrder::STATUS_PENDING_VERIFY) {
                    $workloadStats[$engineerId]['pending_verify'] = $stat['count'];
                }
                $workloadStats[$engineerId]['total_active'] += $stat['count'];
            }
        }

        $matched = [];

        foreach ($engineers as $engineer) {
            // 检查专长匹配
            if ($engineer->hasSpecialty($faultType)) {
                // 使用预加载的工作负载
                $workload = $workloadStats[$engineer->id] ?? [
                    'assigned' => 0,
                    'in_progress' => 0,
                    'pending_verify' => 0,
                    'total_active' => 0,
                ];
                $score = ($engineer->skill_level * 10) - $workload['total_active'];

                $matched[] = [
                    'engineer' => $engineer,
                    'score' => $score,
                    'workload' => $workload,
                ];
            }
        }

        // 按分数降序排序
        usort($matched, function($a, $b) {
            return $b['score'] - $a['score'];
        });

        // 返回前N个
        return array_slice(array_map(function($item) {
            return [
                'id' => $item['engineer']->id,
                'user_id' => $item['engineer']->user_id,
                'name' => $item['engineer']->user->real_name,
                'skill_level' => $item['engineer']->skill_level,
                'skill_level_text' => $item['engineer']->skill_level_text,
                'specialties' => $item['engineer']->specialties,
                'workload' => $item['workload'],
                'match_score' => $item['score'],
            ];
        }, $matched), 0, $limit);
    }
}
