<?php

namespace app\controller;

use app\service\NotificationService;
use think\facade\Request;

class NotificationController extends BaseController
{
    protected $service;

    public function __construct()
    {
        $this->service = new NotificationService();
    }

    /**
     * 获取当前用户ID
     */
    private function getCurrentUserId()
    {
        return Request::instance()->userId ?? 1;
    }

    /**
     * 获取筛选参数
     */
    private function getFilters()
    {
        return [
            'is_read' => Request::param('is_read', ''),
            'type' => Request::param('type', ''),
            'priority' => Request::param('priority', ''),
        ];
    }

    /**
     * 获取通知列表
     */
    public function index()
    {
        try {
            $userId = $this->getCurrentUserId();
            $page = Request::param('page', 1, 'intval');
            $limit = Request::param('limit', 20, 'intval');
            $filters = $this->getFilters();

            $result = $this->service->getUserNotifications($userId, $page, $limit, $filters);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取未读通知数量
     */
    public function unreadCount()
    {
        try {
            $userId = $this->getCurrentUserId();
            $count = $this->service->getUnreadCount($userId);

            return $this->success(['count' => $count]);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 标记通知为已读
     */
    public function markAsRead($id = null)
    {
        try {
            $userId = $this->getCurrentUserId();
            $result = $this->service->markAsRead($userId, $id);

            if ($result) {
                $message = $id ? '标记成功' : '全部标记为已读';
                return $this->success(null, $message);
            } else {
                return $this->error('通知不存在或操作失败', 404);
            }
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 标记所有通知为已读
     */
    public function markAllAsRead()
    {
        try {
            $userId = $this->getCurrentUserId();
            $this->service->markAsRead($userId);

            return $this->success(null, '全部标记为已读');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 删除通知
     */
    public function delete($id)
    {
        try {
            $userId = $this->getCurrentUserId();
            $this->service->delete($userId, $id);

            return $this->success(null, '删除成功');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 清空已读通知
     */
    public function clearRead()
    {
        try {
            $userId = $this->getCurrentUserId();
            $this->service->clearRead($userId);

            return $this->success(null, '已清空已读通知');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 获取通知统计
     */
    public function statistics()
    {
        try {
            $userId = $this->getCurrentUserId();
            $result = $this->service->getStatistics($userId);

            return $this->success($result);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 手动创建通知（管理员功能）
     */
    public function create()
    {
        try {
            $data = $this->getRequestData();

            // 验证必填字段
            if (empty($data['user_id']) || empty($data['title']) || empty($data['content'])) {
                return $this->error('缺少必填字段', 422);
            }

            $notification = $this->service->create(
                $data['user_id'],
                $data['type'] ?? 'system',
                $data['title'],
                $data['content'],
                $data['related_type'] ?? null,
                $data['related_id'] ?? null,
                $data['priority'] ?? 2,
                $data['extra_data'] ?? []
            );

            return $this->success($notification, '通知创建成功', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 批量创建通知（管理员功能）
     */
    public function createBatch()
    {
        try {
            $data = $this->getRequestData();

            // 验证必填字段
            if (empty($data['user_ids']) || !is_array($data['user_ids']) || empty($data['title']) || empty($data['content'])) {
                return $this->error('缺少必填字段', 422);
            }

            $count = $this->service->createBatch(
                $data['user_ids'],
                $data['type'] ?? 'system',
                $data['title'],
                $data['content'],
                $data['related_type'] ?? null,
                $data['related_id'] ?? null,
                $data['priority'] ?? 2,
                $data['extra_data'] ?? []
            );

            return $this->success(['count' => $count], "成功创建{$count}条通知", 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 检查并发送库存预警（管理员功能）
     */
    public function checkStockAlerts()
    {
        try {
            $result = $this->service->checkStockAlerts();

            return $this->success($result, '库存预警检查完成');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * 检查并发送保养提醒（管理员功能）
     */
    public function checkMaintenanceDue()
    {
        try {
            $count = $this->service->checkMaintenanceDue();

            return $this->success(['count' => $count], "保养提醒检查完成，共发送{$count}条提醒");
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }
}
