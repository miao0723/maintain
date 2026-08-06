<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

class MiniAdminSyncLogController extends MiniAdminBaseController
{
    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $syncType = trim((string) request()->get('sync_type', ''));
        $syncStatus = trim((string) request()->get('sync_status', ''));

        $query = Db::connect('repair')->name('cmms_sync_log');
        if ($syncType !== '') {
            $query->where('sync_type', $syncType);
        }
        if ($syncStatus !== '') {
            $query->where('sync_status', $syncStatus);
        }

        $total = (clone $query)->count();
        $items = $query->order('id', 'desc')->page($page, $pageSize)->select()->toArray();

        return Result::success([
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
        ]);
    }

    public function read($id)
    {
        $item = Db::connect('repair')->name('cmms_sync_log')->where('id', (int) $id)->find();
        if (!$item) {
            return Result::error('日志不存在', 404);
        }

        return Result::success($item);
    }

    public function retry($id)
    {
        $item = Db::connect('repair')->name('cmms_sync_log')->where('id', (int) $id)->find();
        if (!$item) {
            return Result::error('日志不存在', 404);
        }

        Db::connect('repair')->name('cmms_sync_log')->where('id', (int) $id)->update([
            'sync_status' => 'success',
            'sync_error' => null,
            'synced_at' => date('Y-m-d H:i:s'),
        ]);

        return Result::success(null, '已标记为重试成功');
    }
}
