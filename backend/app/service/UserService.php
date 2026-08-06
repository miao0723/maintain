<?php

namespace app\service;

use app\model\User;
use think\facade\Db;

class UserService
{
    /**
     * 获取用户列表
     */
    public static function getList($page = 1, $pageSize = 20, $filters = [])
    {
        $query = User::with(['department', 'role']);

        // 筛选条件
        if (!empty($filters['keyword'])) {
            $query->whereLike('username|real_name|phone', '%' . $filters['keyword'] . '%');
        }

        if (!empty($filters['role_type'])) {
            $query->where('role_type', $filters['role_type']);
        }

        if (!empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $total = $query->count();
        $users = $query->order('id', 'desc')
            ->page($page, $pageSize)
            ->select();

        return [
            'items' => $users,
            'total' => $total,
        ];
    }

    /**
     * 获取用户详情
     */
    public static function getDetail($id)
    {
        $user = User::with(['department', 'role'])->find($id);

        if (!$user) {
            throw new \Exception('用户不存在');
        }

        return $user;
    }

    /**
     * 创建用户
     */
    public static function create($data)
    {
        Db::startTrans();
        try {
            // 检查用户名是否存在
            $exists = User::where('username', $data['username'])->find();
            if ($exists) {
                throw new \Exception('用户名已存在');
            }

            // 密码加密
            $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);

            $user = User::create($data);

            // 分配默认权限
            if ($data['role_type'] != 1) {
                // 非管理员需要分配权限
                // 这里可以根据角色分配默认权限
            }

            Db::commit();
            return $user;
        } catch (\Exception $e) {
            Db::rollback();
            throw $e;
        }
    }

    /**
     * 更新用户
     */
    public static function update($id, $data)
    {
        $user = User::find($id);

        if (!$user) {
            throw new \Exception('用户不存在');
        }

        // 不能修改用户名
        unset($data['username']);

        // 如果修改密码
        if (isset($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }

        $user->save($data);

        return $user;
    }

    /**
     * 删除用户
     */
    public static function delete($id)
    {
        $user = User::find($id);

        if (!$user) {
            throw new \Exception('用户不存在');
        }

        // 不能删除管理员
        if ($user->role_type == 1) {
            throw new \Exception('不能删除系统管理员');
        }

        $user->delete();

        return true;
    }

    /**
     * 重置密码
     */
    public static function resetPassword($id, $newPassword)
    {
        $user = User::find($id);

        if (!$user) {
            throw new \Exception('用户不存在');
        }

        $user->password = password_hash($newPassword, PASSWORD_BCRYPT);
        $user->save();

        return true;
    }
}