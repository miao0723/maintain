<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

/**
 * 小程序订单评价控制器
 * 直接从小程序 repair 数据库读取 order_reviews 表
 */
class MiniprogramOrderReviewController extends BaseController
{
    /**
     * 列表（分页）
     */
    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);

        $orderId = trim((string) request()->get('order_id', ''));
        $userId = trim((string) request()->get('user_id', ''));
        $rating = trim((string) request()->get('rating', ''));
        $dateStart = trim((string) request()->get('date_start', ''));
        $dateEnd = trim((string) request()->get('date_end', ''));

        try {
            $query = Db::connect('repair')->name('order_reviews');

            if ($orderId !== '') $query->where('order_id', $orderId);
            if ($userId !== '') $query->where('user_id', $userId);
            if ($rating !== '') $query->where('rating', (int)$rating);
            if ($dateStart !== '') $query->where('created_at', '>=', $dateStart);
            if ($dateEnd !== '') $query->where('created_at', '<=', $dateEnd . ' 23:59:59');

            $total = (clone $query)->count();

            $items = $query->order('id', 'desc')
                ->page($page, $pageSize)
                ->select()
                ->toArray();

            // 解析 images 字段（可能为 JSON）并获取用户信息
            $userIds = array_values(array_unique(array_filter(array_column($items, 'user_id'))));
            $userMap = [];
            if (!empty($userIds)) {
                $users = Db::connect('repair')->name('users')
                    ->whereIn('id', $userIds)
                    ->field('id,nickname,real_name,phone')
                    ->select()
                    ->toArray();
                foreach ($users as $u) $userMap[$u['id']] = $u;
            }

            foreach ($items as &$it) {
                $it['images_list'] = [];
                if (!empty($it['images'])) {
                    $decoded = json_decode($it['images'], true);
                    if (is_array($decoded)) $it['images_list'] = $decoded;
                    else $it['images_list'] = [$it['images']];
                }
                $u = $userMap[$it['user_id']] ?? null;
                $it['user_name'] = $u['nickname'] ?? ($u['real_name'] ?? '');
                $it['user_phone'] = $u['phone'] ?? '';
            }

            return Result::paginated($items, $total, $page, $pageSize);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 详情
     */
    public function read($id)
    {
        try {
            $item = Db::connect('repair')->name('order_reviews')->find($id);
            if (!$item) return Result::error('评价不存在', 404);

            $item['images_list'] = [];
            if (!empty($item['images'])) {
                $decoded = json_decode($item['images'], true);
                if (is_array($decoded)) $item['images_list'] = $decoded;
                else $item['images_list'] = [$item['images']];
            }

            if (!empty($item['user_id'])) {
                $u = Db::connect('repair')->name('users')->where('id', $item['user_id'])->field('id,nickname,real_name,phone,avatar')->find();
                $item['user_name'] = $u['nickname'] ?? ($u['real_name'] ?? '');
                $item['user_phone'] = $u['phone'] ?? '';
                $item['user_avatar'] = $u['avatar'] ?? '';
            }

            return Result::success($item);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 删除评价
     */
    public function delete($id)
    {
        try {
            $exists = Db::connect('repair')->name('order_reviews')->where('id', $id)->find();
            if (!$exists) return Result::error('评价不存在', 404);

            Db::connect('repair')->name('order_reviews')->where('id', $id)->delete();
            return Result::success(null, '删除成功');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 回复评价（保存到 order_review_replies 表）
     */
    public function reply($id)
    {
        $data = $this->getRequestData();
        $content = trim($data['content'] ?? '');
        $adminId = $this->getUserId();

        if ($content === '') return Result::error('回复内容不能为空', 400);

        try {
            // 确保回复表存在
            $createSql = "CREATE TABLE IF NOT EXISTS `order_review_replies` (
              `id` int NOT NULL AUTO_INCREMENT,
              `review_id` int NOT NULL,
              `admin_user_id` int DEFAULT NULL,
              `content` text,
              `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
            Db::connect('repair')->execute($createSql);

            Db::connect('repair')->name('order_review_replies')->insert([
                'review_id' => $id,
                'admin_user_id' => $adminId,
                'content' => $content,
                'created_at' => date('Y-m-d H:i:s')
            ]);

            return Result::success(null, '回复已保存');
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 导出为 CSV（带过滤条件）
     */
    public function export()
    {
        $orderId = trim((string) request()->get('order_id', ''));
        $userId = trim((string) request()->get('user_id', ''));
        $rating = trim((string) request()->get('rating', ''));
        $dateStart = trim((string) request()->get('date_start', ''));
        $dateEnd = trim((string) request()->get('date_end', ''));

        try {
            $query = Db::connect('repair')->name('order_reviews');
            if ($orderId !== '') $query->where('order_id', $orderId);
            if ($userId !== '') $query->where('user_id', $userId);
            if ($rating !== '') $query->where('rating', (int)$rating);
            if ($dateStart !== '') $query->where('created_at', '>=', $dateStart);
            if ($dateEnd !== '') $query->where('created_at', '<=', $dateEnd . ' 23:59:59');

            $items = $query->order('id', 'desc')->select()->toArray();

            // 构建 CSV
            $headers = ['id', 'order_id', 'user_id', 'user_name', 'rating', 'comment', 'images', 'created_at'];
            $lines = [];
            $lines[] = implode(',', $headers);

            $userIds = array_values(array_unique(array_filter(array_column($items, 'user_id'))));
            $userMap = [];
            
            if (!empty($userIds)) {
                $users = Db::connect('repair')->name('users')->whereIn('id', $userIds)->field('id,nickname,real_name')->select()->toArray();
                foreach ($users as $u) $userMap[$u['id']] = $u;
            }

            foreach ($items as $it) {
                $uname = $userMap[$it['user_id']]['nickname'] ?? ($userMap[$it['user_id']]['real_name'] ?? '');
                $row = [
                    $it['id'],
                    $it['order_id'],
                    $it['user_id'],
                    '"' . str_replace('"', '""', $uname) . '"',
                    $it['rating'],
                    '"' . str_replace('"', '""', $it['comment'] ?? '') . '"',
                    '"' . str_replace('"', '""', is_string($it['images']) ? $it['images'] : json_encode($it['images'])) . '"',
                    $it['created_at'] ?? ''
                ];
                $lines[] = implode(',', $row);
            }

            $csv = implode("\n", $lines);

            return response($csv, 200)
                ->header(['Content-Type' => 'text/csv; charset=UTF-8', 'Content-Disposition' => 'attachment; filename="order_reviews_export.csv"']);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }

    /**
     * 简单统计
     */
    public function statistics()
    {
        try {
            $total = Db::connect('repair')->name('order_reviews')->count();
            $avg = (float) Db::connect('repair')->name('order_reviews')->avg('rating');
            $byRating = Db::connect('repair')->name('order_reviews')
                ->field('rating,COUNT(*) as count')
                ->group('rating')
                ->select()
                ->toArray();

            return Result::success(['total' => $total, 'avg_rating' => round($avg,2), 'by_rating' => $byRating]);
        } catch (\Exception $e) {
            return Result::error($e->getMessage(), 500);
        }
    }
}
