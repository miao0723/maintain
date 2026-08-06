<?php

namespace app\controller;

/**
 * 小程序后台控制器基类
 */
class MiniAdminBaseController extends BaseController
{
    protected function getMiniAdminId(): int
    {
        $userId = request()->miniAdminUserId ?? request()->userId ?? null;
        if (!$userId) {
            throw new \Exception('未登录');
        }

        return (int) $userId;
    }

    protected function getMiniAdminUser(): array
    {
        $user = request()->miniAdminUser ?? request()->user ?? null;
        if (!$user || !is_array($user)) {
            throw new \Exception('未登录');
        }

        return $user;
    }
}
