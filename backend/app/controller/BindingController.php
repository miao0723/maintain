<?php

namespace app\controller;

use app\model\Personnel;
use app\model\Department;
use app\model\User;
use app\model\Engineer;
use app\model\Role;
use app\model\RolePermission;
use app\model\UserRole;
use app\common\Result;

/**
 * 绑定解绑管理控制器
 */
class BindingController
{
    /**
     * 获取人员部门绑定列表
     * GET /bindings/personnel-department
     */
    public function getPersonnelDepartmentList()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $personnelName = request()->get('personnel_name', '');
        $departmentName = request()->get('department_name', '');

        try {
            $query = Personnel::alias('p')
                ->field('p.id as personnel_id, p.name as personnel_name, p.code as personnel_code, p.position as personnel_position, p.department_id, d.name as department_name, p.updated_at as bound_at')
                ->leftJoin('departments d', 'p.department_id = d.id')
                ->order('p.id', 'desc');

            if (!empty($personnelName)) {
                $query->whereLike('p.name', '%' . $personnelName . '%');
            }

            if (!empty($departmentName)) {
                $query->whereLike('d.name', '%' . $departmentName . '%');
            }

            $total = $query->count();
            $list = $query->page($page, $pageSize)->select();

            return Result::paginated($list, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 绑定人员到部门
     * POST /bindings/personnel-department
     */
    public function bindPersonnelToDepartment()
    {
        $data = request()->post();

        try {
            validate([
                'personnel_id' => 'require|integer',
                'department_id' => 'require|integer',
            ])->check($data);

            $personnel = Personnel::find($data['personnel_id']);
            if (!$personnel) {
                return Result::error('人员不存在', 404);
            }

            $department = Department::find($data['department_id']);
            if (!$department) {
                return Result::error('部门不存在', 404);
            }

            $personnel->department_id = $data['department_id'];
            $personnel->save();

            return Result::success($personnel, '绑定成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 解绑人员与部门
     * DELETE /bindings/personnel-department/{personnelId}
     */
    public function unbindPersonnelFromDepartment($personnelId)
    {
        try {
            $personnel = Personnel::find($personnelId);
            if (!$personnel) {
                return Result::error('人员不存在', 404);
            }

            $personnel->department_id = null;
            $personnel->save();

            return Result::success(null, '解绑成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取工程师用户绑定列表
     * GET /bindings/engineer-user
     */
    public function getEngineerUserList()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $username = request()->get('username', '');
        $bound = request()->get('bound', '');

        try {
            $query = User::alias('u')
                ->field('u.id as user_id, u.username, u.real_name, u.phone, e.id as engineer_id, e.skill_level, e.specialties, e.work_years, e.certification, e.status, e.updated_at as bound_at')
                ->leftJoin('engineers e', 'u.id = e.user_id')
                ->order('u.id', 'desc');

            if (!empty($username)) {
                $query->where('u.username|u.real_name', 'like', '%' . $username . '%');
            }

            if ($bound === 'true') {
                $query->where('e.id', '<>', null);
            } elseif ($bound === 'false') {
                $query->where('e.id', '=', null);
            }

            $total = $query->count();
            $list = $query->page($page, $pageSize)->select();

            return Result::paginated($list, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 绑定工程师与用户
     * POST /bindings/engineer-user
     */
    public function bindEngineerToUser()
    {
        $data = request()->post();

        try {
            validate([
                'user_id' => 'require|integer',
                'skill_level' => 'require|integer|between:1,4',
            ])->check($data);

            $user = User::find($data['user_id']);
            if (!$user) {
                return Result::error('用户不存在', 404);
            }

            $engineer = Engineer::where('user_id', $data['user_id'])->find();
            if ($engineer) {
                $engineer->skill_level = $data['skill_level'];
                $engineer->specialties = $data['specialties'] ?? [];
                $engineer->work_years = $data['work_years'] ?? 0;
                $engineer->certification = $data['certification'] ?? '';
                $engineer->status = $data['status'] ?? 1;
                $engineer->save();
            } else {
                $engineer = Engineer::create([
                    'user_id' => $data['user_id'],
                    'skill_level' => $data['skill_level'],
                    'specialties' => $data['specialties'] ?? [],
                    'work_years' => $data['work_years'] ?? 0,
                    'certification' => $data['certification'] ?? '',
                    'status' => $data['status'] ?? 1,
                ]);
            }

            return Result::success($engineer, '绑定成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 解绑工程师与用户
     * DELETE /bindings/engineer-user/{engineerId}
     */
    public function unbindEngineerFromUser($engineerId)
    {
        try {
            $engineer = Engineer::find($engineerId);
            if (!$engineer) {
                return Result::error('工程师不存在', 404);
            }

            $engineer->delete();

            return Result::success(null, '解绑成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取用户角色绑定列表
     * GET /bindings/user-role
     */
    public function getUserRoleList()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);
        $username = request()->get('username', '');
        $roleName = request()->get('role_name', '');
        $status = request()->get('status', '');

        try {
            $query = User::alias('u')
                ->field('u.id as user_id, u.username, u.real_name, u.phone, u.status, u.last_login_at as last_login, d.name as department_name')
                ->leftJoin('departments d', 'u.department_id = d.id')
                ->order('u.id', 'desc');

            if (!empty($username)) {
                $query->where('u.username|u.real_name', 'like', '%' . $username . '%');
            }

            if (!empty($status)) {
                $query->where('u.status', $status);
            }

            // 如果指定了角色名称，需要先获取具有该角色的用户ID
            if (!empty($roleName)) {
                $roleUserIds = UserRole::alias('ur')
                    ->leftJoin('roles r', 'ur.role_id = r.id')
                    ->whereLike('r.name', '%' . $roleName . '%')
                    ->column('ur.user_id');

                if (empty($roleUserIds)) {
                    // 如果没有用户匹配该角色，直接返回空结果
                    return Result::paginated([], 0, $page, $pageSize);
                }
                $query->whereIn('u.id', $roleUserIds);
            }

            $total = $query->count();
            $users = $query->page($page, $pageSize)->select();

            // 获取每个用户的角色
            foreach ($users as &$user) {
                $userRoles = UserRole::alias('ur')
                    ->leftJoin('roles r', 'ur.role_id = r.id')
                    ->where('ur.user_id', $user['user_id'])
                    ->field('r.id, r.name, r.status')
                    ->select();
                $user['roles'] = $userRoles ?: [];
            }

            return Result::paginated($users, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 绑定用户到角色
     * POST /bindings/user-role
     */
    public function bindUserToRole()
    {
        $data = request()->post();

        try {
            validate([
                'user_id' => 'require|integer',
                'role_id' => 'require|integer',
            ])->check($data);

            $user = User::find($data['user_id']);
            if (!$user) {
                return Result::error('用户不存在', 404);
            }

            $role = Role::find($data['role_id']);
            if (!$role) {
                return Result::error('角色不存在', 404);
            }

            // 如果是替换模式，先删除该用户的所有角色
            if (isset($data['mode']) && $data['mode'] === 'replace') {
                UserRole::where('user_id', $data['user_id'])->delete();
            }

            // 检查是否已存在该绑定
            $existing = UserRole::where('user_id', $data['user_id'])
                ->where('role_id', $data['role_id'])
                ->find();

            if (!$existing) {
                UserRole::create([
                    'user_id' => $data['user_id'],
                    'role_id' => $data['role_id'],
                ]);
            }

            return Result::success(null, '绑定成功');
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 解绑用户与角色
     * DELETE /bindings/user-role/{userId}/{roleId}
     */
    public function unbindUserFromRole($userId, $roleId)
    {
        try {
            $binding = UserRole::where('user_id', $userId)
                ->where('role_id', $roleId)
                ->find();

            if (!$binding) {
                return Result::error('绑定关系不存在', 404);
            }

            $binding->delete();

            return Result::success(null, '解绑成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
