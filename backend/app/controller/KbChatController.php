<?php

namespace app\controller;

use app\common\Result;
use app\model\KbChatMessage;
use app\model\KbChatSession;
use app\service\RagChatService;
use think\facade\Log;

/**
 * 知识库AI聊天控制器
 */
class KbChatController extends BaseController
{
    /**
     * 聊天会话列表
     */
    public function sessions()
    {
        $params = request()->param();
        $collectionId = intval($params['collection_id'] ?? 0);

        $query = KbChatSession::with('collection');

        if ($collectionId) {
            $query->where('collection_id', $collectionId);
        }

        $userId = $this->getUserId();
        $query->where('user_id', $userId);

        $list = $query->order('last_message_at', 'desc')
            ->order('created_at', 'desc')
            ->select()
            ->toArray();

        return Result::success($list);
    }

    /**
     * 创建聊天会话
     */
    public function createSession()
    {
        // 调试：记录请求信息
        $request = request();
        Log::info("创建会话 - URL: " . $request->url());
        Log::info("创建会话 - PathInfo: " . $request->pathinfo());
        Log::info("创建会话 - Method: " . $request->method());
        Log::info("创建会话 - All params: " . json_encode($request->param(), JSON_UNESCAPED_UNICODE));
        Log::info("创建会话 - POST: " . json_encode($request->post(), JSON_UNESCAPED_UNICODE));

        $raw = file_get_contents('php://input');
        Log::info("创建会话 - Raw input: " . $raw);

        $data = $this->getRequestData();

        Log::info("创建会话请求数据: " . json_encode($data, JSON_UNESCAPED_UNICODE));

        $collectionId = intval($data['collection_id'] ?? 0);
        Log::info("创建会话 - collection_id: " . $collectionId);

        if (!$collectionId) {
            Log::error("创建会话失败 - collection_id 为空");
            return Result::error('请指定知识库ID', 400);
        }

        try {
            $userId = $this->getUserId();

            $session = KbChatSession::create([
                'collection_id' => $collectionId,
                'user_id' => $userId,
                'title' => $data['title'] ?? '新对话',
                'message_count' => 0,
            ]);

            return Result::success($session, '创建成功');

        } catch (\Exception $e) {
            Log::error("创建会话失败: " . $e->getMessage());
            return Result::error('创建会话失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 删除聊天会话
     */
    public function deleteSession($sessionId)
    {
        $session = KbChatSession::find($sessionId);
        if (!$session) {
            return Result::error('会话不存在', 404);
        }

        try {
            $session->delete();
            return Result::success(null, '删除成功');
        } catch (\Exception $e) {
            return Result::error('删除失败: ' . $e->getMessage(), 500);
        }
    }

    /**
     * 获取会话消息列表
     */
    public function messages($sessionId)
    {
        $session = KbChatSession::find($sessionId);
        if (!$session) {
            return Result::error('会话不存在', 404);
        }

        $messages = KbChatMessage::where('session_id', $sessionId)
            ->order('created_at', 'asc')
            ->select()
            ->toArray();

        return Result::success($messages);
    }

    /**
     * 发送消息
     */
    public function send($sessionId)
    {
        Log::info("发送消息，Session ID: " . $sessionId);

        $session = KbChatSession::find($sessionId);
        if (!$session) {
            Log::error("会话不存在: " . $sessionId);
            return Result::error('会话不存在', 404);
        }

        $data = $this->getRequestData();
        Log::info("发送消息请求数据: " . json_encode($data));

        $message = trim($data['message'] ?? '');
        if (empty($message)) {
            return Result::error('消息内容不能为空', 400);
        }

        $imageUrl = $data['image_url'] ?? null;
        $fileIds = null;

        // 正确处理 file_ids 参数：只有在明确传递且非空时才使用
        if (isset($data['file_ids']) && is_array($data['file_ids']) && !empty($data['file_ids'])) {
            $fileIds = $data['file_ids'];
            Log::info("使用指定文件搜索，文件ID: " . implode(',', $fileIds));
        } else {
            Log::info("使用全部文件搜索（file_ids 未传递或为空）");
        }

        try {
            $ragService = new RagChatService();
            $result = $ragService->chat($sessionId, $message, $imageUrl, $fileIds);

            return Result::success($result);

        } catch (\Exception $e) {
            Log::error('RAG聊天失败: ' . $e->getMessage());
            return Result::error('AI回复失败: ' . $e->getMessage(), 500);
        }
    }
}
