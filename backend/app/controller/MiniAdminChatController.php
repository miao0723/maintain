<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

class MiniAdminChatController extends MiniAdminBaseController
{
    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $keyword = trim((string) request()->get('keyword', ''));
        $status = trim((string) request()->get('status', ''));

        $query = Db::connect('repair')->name('chat_conversations')->alias('c');
        if ($keyword !== '') {
            $query->where(function ($subQuery) use ($keyword) {
                $subQuery->whereLike('c.id', '%' . $keyword . '%')
                    ->whereOrLike('c.user_id', '%' . $keyword . '%')
                    ->whereOrLike('c.user_openid', '%' . $keyword . '%');
            });
        }
        if ($status !== '') {
            $query->where('c.status', $status);
        }

        $total = (clone $query)->count();
        $items = $query->order('c.last_activity', 'desc')->page($page, $pageSize)->select()->toArray();
        $conversationIds = array_column($items, 'id');

        $lastMessageMap = [];
        if (!empty($conversationIds)) {
            $messages = Db::connect('repair')->name('chat_messages')
                ->whereIn('conversation_id', $conversationIds)
                ->order('created_at', 'desc')
                ->select()
                ->toArray();

            foreach ($messages as $message) {
                if (!isset($lastMessageMap[$message['conversation_id']])) {
                    $lastMessageMap[$message['conversation_id']] = $message;
                }
            }
        }

        foreach ($items as &$item) {
            $item['last_message'] = $lastMessageMap[$item['id']]['content'] ?? '';
            $item['last_message_type'] = $lastMessageMap[$item['id']]['message_type'] ?? 'text';
        }
        unset($item);

        return Result::success([
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
        ]);
    }

    public function read($id)
    {
        $conversation = Db::connect('repair')->name('chat_conversations')->where('id', $id)->find();
        if (!$conversation) {
            return Result::error('会话不存在', 404);
        }

        $messages = Db::connect('repair')->name('chat_messages')
            ->where('conversation_id', $id)
            ->order('created_at', 'asc')
            ->select()
            ->toArray();

        return Result::success([
            'conversation' => $conversation,
            'messages' => $messages,
        ]);
    }

    public function update($id)
    {
        $conversation = Db::connect('repair')->name('chat_conversations')->where('id', $id)->find();
        if (!$conversation) {
            return Result::error('会话不存在', 404);
        }

        $data = $this->getRequestData();
        $updateData = [];
        foreach (['status', 'end_reason', 'summary'] as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }
        if (empty($updateData)) {
            return Result::success(null, '无变更');
        }
        $updateData['updated_at'] = date('Y-m-d H:i:s');

        Db::connect('repair')->name('chat_conversations')->where('id', $id)->update($updateData);

        return Result::success(null, '更新成功');
    }

    public function remarkMessage($id)
    {
        $message = Db::connect('repair')->name('chat_messages')->where('id', $id)->find();
        if (!$message) {
            return Result::error('消息不存在', 404);
        }

        $data = $this->getRequestData();
        $entities = $message['entities'];
        $decoded = [];
        if (is_string($entities) && $entities !== '') {
            $decoded = json_decode($entities, true) ?: [];
        } elseif (is_array($entities)) {
            $decoded = $entities;
        }

        $decoded['admin_remark'] = trim((string) ($data['remark'] ?? ''));
        $decoded['admin_remark_by'] = $this->getMiniAdminId();
        $decoded['admin_remark_at'] = date('Y-m-d H:i:s');

        Db::connect('repair')->name('chat_messages')->where('id', $id)->update([
            'entities' => json_encode($decoded, JSON_UNESCAPED_UNICODE),
        ]);

        return Result::success(null, '备注成功');
    }
}
