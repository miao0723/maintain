<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

class MiniAdminUserController extends MiniAdminBaseController
{
    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $keyword = trim((string) request()->get('keyword', ''));
        $phone = trim((string) request()->get('phone', ''));
        $role = trim((string) request()->get('role', ''));
        $status = request()->get('status', '');

        $query = Db::connect('repair')->name('users');
        if ($keyword !== '') {
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery->whereLike('nickname', '%' . $keyword . '%')
                    ->whereOrLike('real_name', '%' . $keyword . '%')
                    ->whereOrLike('phone', '%' . $keyword . '%')
                    ->whereOrLike('openid', '%' . $keyword . '%');
            });
        }
        if ($phone !== '') {
            $query->whereLike('phone', '%' . $phone . '%');
        }
        if ($role !== '') {
            $query->where('role', $role);
        }
        if ($status !== '' && $status !== null) {
            $query->where('status', (int) $status);
        }

        $total = (clone $query)->count();
        $users = $query->order('id', 'desc')->page($page, $pageSize)->select()->toArray();
        $userIds = array_column($users, 'id');

        $orderStats = [];
        if (!empty($userIds)) {
            foreach (Db::connect('repair')->name('orders')
                ->whereIn('user_id', $userIds)
                ->field('user_id,COUNT(*) as order_count,MAX(created_at) as last_order_at')
                ->group('user_id')
                ->select()
                ->toArray() as $item) {
                $orderStats[$item['user_id']] = $item;
            }
        }

        $items = [];
        foreach ($users as $user) {
            $stat = $orderStats[$user['id']] ?? [];
            $items[] = [
                'id' => (int) $user['id'],
                'openid' => $user['openid'] ?? '',
                'nickname' => $user['nickname'] ?? '',
                'real_name' => $user['real_name'] ?? '',
                'phone' => $user['phone'] ?? '',
                'email' => $user['email'] ?? '',
                'avatar_url' => $user['avatar_url'] ?? '',
                'status' => (int) ($user['status'] ?? 0),
                'role' => $user['role'] ?? 'user',
                'province' => $user['province'] ?? '',
                'city' => $user['city'] ?? '',
                'order_count' => (int) ($stat['order_count'] ?? 0),
                'last_order_at' => $stat['last_order_at'] ?? null,
                'created_at' => $user['created_at'] ?? '',
                'updated_at' => $user['updated_at'] ?? '',
                'last_login_at' => $user['last_login_at'] ?? null,
            ];
        }

        return Result::success([
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
        ]);
    }

    public function read($id)
    {
        $user = Db::connect('repair')->name('users')->where('id', (int) $id)->find();
        if (!$user) {
            return Result::error('用户不存在', 404);
        }

        return Result::success($user);
    }

    public function update($id)
    {
        $user = Db::connect('repair')->name('users')->where('id', (int) $id)->find();
        if (!$user) {
            return Result::error('用户不存在', 404);
        }

        $data = $this->getRequestData();
        $allowedFields = [
            'nickname', 'real_name', 'phone', 'email', 'gender', 'country',
            'province', 'city', 'language', 'status', 'role', 'avatar_url'
        ];
        $updateData = [];
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }
        $updateData['updated_at'] = date('Y-m-d H:i:s');

        Db::connect('repair')->name('users')->where('id', (int) $id)->update($updateData);

        return Result::success(null, '更新成功');
    }

    public function delete($id)
    {
        return Result::error('小程序用户不支持直接删除，请先停用账号', 405);
    }
}
