<?php

namespace app\service;

use app\model\Schedule;
use app\model\Engineer;

class ScheduleService
{
    /**
     * 获取排班列表（分页+筛选）
     */
    public function getList($page = 1, $limit = 20, $filters = [])
    {
        $query = Schedule::with(['engineer' => function($query) {
            $query->with(['user']);
        }]);

        // 按工程师筛选
        if (isset($filters['engineer_id']) && !empty($filters['engineer_id'])) {
            $query->where('engineer_id', $filters['engineer_id']);
        }

        // 按日期范围筛选
        if (isset($filters['start_date']) && !empty($filters['start_date'])) {
            $query->where('work_date', '>=', $filters['start_date']);
        }
        if (isset($filters['end_date']) && !empty($filters['end_date'])) {
            $query->where('work_date', '<=', $filters['end_date']);
        }

        // 按班次类型筛选
        if (isset($filters['shift_type']) && !empty($filters['shift_type'])) {
            $query->where('shift_type', $filters['shift_type']);
        }

        // 按状态筛选
        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        // 排序：按日期降序，班次类型
        $query->order('work_date', 'desc')
              ->order('shift_type', 'asc');

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
     * 获取排班详情
     */
    public function getDetail($id)
    {
        $schedule = Schedule::with(['engineer' => function($query) {
            $query->with(['user']);
        }])->find($id);

        if (!$schedule) {
            throw new \Exception('排班记录不存在');
        }

        return $schedule;
    }

    /**
     * 创建排班
     */
    public function create($data)
    {
        // 检查工程师是否存在
        $engineer = Engineer::find($data['engineer_id']);
        if (!$engineer) {
            throw new \Exception('工程师不存在');
        }

        // 检查该工程师在该日期是否已有排班
        $existing = Schedule::where('engineer_id', $data['engineer_id'])
            ->where('work_date', $data['work_date'])
            ->find();

        if ($existing) {
            throw new \Exception('该工程师在该日期已有排班');
        }

        // 设置默认值
        $data['status'] = $data['status'] ?? Schedule::STATUS_NORMAL;

        // 显式指定允许的字段
        $allowedFields = ['engineer_id', 'work_date', 'shift_type', 'status'];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $schedule = new Schedule();
        $schedule->data($filteredData);
        $schedule->save();

        return $schedule->refresh();
    }

    /**
     * 更新排班
     */
    public function update($id, $data)
    {
        $schedule = Schedule::find($id);
        if (!$schedule) {
            throw new \Exception('排班记录不存在');
        }

        // 如果修改了工程师或日期，检查是否冲突
        if (isset($data['engineer_id']) || isset($data['work_date'])) {
            $engineerId = $data['engineer_id'] ?? $schedule->engineer_id;
            $workDate = $data['work_date'] ?? $schedule->work_date;

            $existing = Schedule::where('engineer_id', $engineerId)
                ->where('work_date', $workDate)
                ->where('id', '<>', $id)
                ->find();

            if ($existing) {
                throw new \Exception('该工程师在该日期已有排班');
            }
        }

        // 显式指定允许的字段
        $allowedFields = ['engineer_id', 'work_date', 'shift_type', 'status'];

        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        $schedule->data($filteredData);
        $schedule->save();

        return $schedule->refresh();
    }

    /**
     * 删除排班
     */
    public function delete($id)
    {
        $schedule = Schedule::find($id);
        if (!$schedule) {
            throw new \Exception('排班记录不存在');
        }

        $schedule->delete();
        return true;
    }

    /**
     * 获取排班概览（指定日期范围内的排班情况）
     */
    public function getOverview($startDate, $endDate)
    {
        $schedules = Schedule::with(['engineer' => function($query) {
            $query->with(['user']);
        }])
        ->whereBetween('work_date', [$startDate, $endDate])
        ->order('work_date', 'asc')
        ->order('shift_type', 'asc')
        ->select();

        // 按日期组织数据
        $overview = [];
        foreach ($schedules as $schedule) {
            $date = $schedule->work_date;

            if (!isset($overview[$date])) {
                $overview[$date] = [
                    'date' => $date,
                    'morning' => [],
                    'afternoon' => [],
                    'night' => [],
                ];
            }

            $overview[$date][$schedule->shift_type][] = [
                'id' => $schedule->id,
                'engineer_id' => $schedule->engineer_id,
                'engineer_name' => $schedule->engineer->user->real_name,
                'status' => $schedule->status,
                'status_text' => $schedule->status_text,
                'is_on_leave' => $schedule->isOnLeave(),
            ];
        }

        return array_values($overview);
    }

    /**
     * 批量创建排班（为多个工程师创建指定日期范围的排班）
     */
    public function batchCreate($engineerIds, $startDate, $endDate, $shiftType)
    {
        $created = [];
        $failed = [];

        foreach ($engineerIds as $engineerId) {
            // 检查工程师是否存在
            $engineer = Engineer::find($engineerId);
            if (!$engineer) {
                $failed[] = [
                    'engineer_id' => $engineerId,
                    'reason' => '工程师不存在',
                ];
                continue;
            }

            // 为每一天创建排班
            $current = strtotime($startDate);
            $end = strtotime($endDate);

            while ($current <= $end) {
                $date = date('Y-m-d', $current);

                try {
                    // 检查是否已存在
                    $existing = Schedule::where('engineer_id', $engineerId)
                        ->where('work_date', $date)
                        ->find();

                    if (!$existing) {
                        $schedule = new Schedule();
                        $schedule->engineer_id = $engineerId;
                        $schedule->work_date = $date;
                        $schedule->shift_type = $shiftType;
                        $schedule->status = Schedule::STATUS_NORMAL;
                        $schedule->save();

                        $created[] = [
                            'engineer_id' => $engineerId,
                            'date' => $date,
                            'schedule_id' => $schedule->id,
                        ];
                    }
                } catch (\Exception $e) {
                    $failed[] = [
                        'engineer_id' => $engineerId,
                        'date' => $date,
                        'reason' => $e->getMessage(),
                    ];
                }

                $current = strtotime('+1 day', $current);
            }
        }

        return [
            'created' => $created,
            'failed' => $failed,
            'total_created' => count($created),
            'total_failed' => count($failed),
        ];
    }
}
