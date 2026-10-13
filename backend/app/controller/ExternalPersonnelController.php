<?php

namespace app\controller;

use app\common\Result;
use app\model\ExternalPersonnel;
use app\model\PersonnelSyncLog;
use app\service\PersonnelSyncService;

/**
 * 外部系统人员（同步）控制器
 *
 * 仅“老板/管理员”可访问（路由经 PermissionCheck，repairer/staff 会被 403）。
 * 列表默认脱敏；拥有敏感查看权限的用户可解密还原 phone/id_card/address。
 */
class ExternalPersonnelController
{
    /**
     * 触发一次人员同步
     * POST /external-personnel/sync   body: { keyword?: '' }
     */
    public function sync()
    {
        $keyword = (string) request()->post('keyword', '');
        $operatorId = (int) (request()->userId ?? 0);

        try {
            $service = new PersonnelSyncService();
            $summary = $service->sync($keyword, $operatorId, 'manual');
            return Result::success($summary, '同步完成');
        } catch (\Throwable $e) {
            return Result::error('同步失败：' . $e->getMessage(), 500);
        }
    }

    /**
     * 分页列表（默认脱敏）
     * GET /external-personnel
     */
    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('page_size', request()->get('pageSize', 20));
        $keyword = (string) request()->get('keyword', '');
        $isActive = request()->get('is_active', null);

        $reveal = $this->canRevealSensitive();

        $query = ExternalPersonnel::order('id', 'desc');
        if ($keyword !== '') {
            $query->where('employee_name', 'like', '%' . $keyword . '%');
        }
        if ($isActive !== null && $isActive !== '') {
            $query->where('is_active', (int) $isActive);
        }

        $total = $query->count();
        $rows = $query->page($page, $pageSize)->select()->toArray();

        $list = array_map(function ($row) use ($reveal) {
            return ExternalPersonnel::present($row, $reveal);
        }, $rows);

        return Result::paginated($list, $total, $page, $pageSize);
    }

    /**
     * 按姓名检索（本地已同步数据）
     * GET /external-personnel/search
     */
    public function search()
    {
        $keyword = (string) request()->get('keyword', '');
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('page_size', request()->get('pageSize', 20));
        $reveal = $this->canRevealSensitive();

        $service = new PersonnelSyncService();
        $res = $service->searchLocal($keyword, $page, $pageSize);
        $list = array_map(function ($row) use ($reveal) {
            return ExternalPersonnel::present($row, $reveal);
        }, $res['list']);

        return Result::paginated($list, $res['total'], $page, $pageSize);
    }

    /**
     * 单条详情
     * GET /external-personnel/:id
     */
    public function read($id)
    {
        $reveal = $this->canRevealSensitive();
        $row = ExternalPersonnel::find($id);
        if (!$row) {
            return Result::error('人员不存在', 404);
        }
        return Result::success(ExternalPersonnel::present($row->toArray(), $reveal));
    }

    /**
     * 同步日志列表
     * GET /external-personnel/sync-logs
     */
    public function syncLogs()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('page_size', request()->get('pageSize', 20));

        $query = PersonnelSyncLog::order('id', 'desc');
        $total = $query->count();
        $list = $query->page($page, $pageSize)->select()->toArray();

        return Result::paginated($list, $total, $page, $pageSize);
    }

    /**
     * 当前用户是否可查看解密后的敏感字段（老板/管理员）
     */
    protected function canRevealSensitive(): bool
    {
        $user = request()->user ?? [];
        if (empty($user)) return false;
        if ((int) ($user['role_type'] ?? 0) === 1) return true;
        if (in_array((int) ($user['id'] ?? 0), [1, 2], true)) return true;
        $roleCode = $this->currentRoleCode($user);
        return in_array($roleCode, ['admin', 'boss', 'super_admin'], true);
    }

    protected function currentRoleCode(array $user): ?string
    {
        if (!empty($user['role_id'])) {
            $role = \app\model\Role::find($user['role_id']);
            if ($role) return $role->code;
        }
        return null;
    }
}
