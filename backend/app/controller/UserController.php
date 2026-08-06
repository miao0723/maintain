<?php

namespace app\controller;

use app\service\UserService;
use app\validate\UserValidate;
use app\common\Result;

class UserController
{
    /**
     * 获取用户列表
     * GET /users
     */
    public function index()
    {
        $page = request()->get('page', 1);
        $pageSize = request()->get('pageSize', 20);

        $filters = [
            'keyword' => request()->get('keyword', ''),
            'role_type' => request()->get('role_type', ''),
            'department_id' => request()->get('department_id', ''),
            'status' => request()->get('status', ''),
        ];

        try {
            $result = UserService::getList($page, $pageSize, $filters);

            return Result::paginated(
                $result['items'],
                $result['total'],
                $page,
                $pageSize
            );
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 获取用户详情
     * GET /users/{id}
     */
    public function read($id)
    {
        try {
            $user = UserService::getDetail($id);

            return Result::success($user);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 404);
        }
    }

    /**
     * 创建用户
     * POST /users
     */
    public function save()
    {
        $data = request()->post();

        // 验证输入
        try {
            validate(UserValidate::class)
                ->scene('create')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $user = UserService::create($data);

            return Result::success($user, '用户创建成功', 201);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 更新用户
     * PUT /users/{id}
     */
    public function update($id)
    {
        $data = request()->put();

        // 验证输入
        try {
            validate(UserValidate::class)
                ->scene('update')
                ->check($data);
        } catch (\think\exception\ValidateException $e) {
            return Result::error($e->getError(), 422);
        }

        try {
            $user = UserService::update($id, $data);

            return Result::success($user, '用户更新成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除用户
     * DELETE /users/{id}
     */
    public function delete($id)
    {
        try {
            UserService::delete($id);

            return Result::success(null, '用户删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 重置密码
     * POST /users/{id}/reset-password
     */
    public function resetPassword($id)
    {
        $data = request()->post();
        $newPassword = $data['password'] ?? '123456';

        try {
            UserService::resetPassword($id, $newPassword);

            return Result::success(null, '密码重置成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}