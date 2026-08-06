<?php

namespace app\service;

use app\model\KbChatMessage;
use app\model\KbChatSession;
use app\model\KbChunk;
use app\model\KbCollection;
use app\model\KbFile;
use think\facade\Log;

/**
 * RAG 聊天服务
 * 编排: MySQL全文检索 -> 构建提示词 -> AI生成回答
 * 不再依赖 Milvus 向量数据库
 */
class RagChatService
{
    private $searchService;

    public function __construct()
    {
        $this->searchService = new MySQLSearchService();
    }

    /**
     * 发送消息并获取AI回复
     * @param int $sessionId 会话ID
     * @param string $message 用户消息
     * @param string|null $imageUrl 用户上传的图片URL(base64或路径)
     * @param array|null $fileIds 文件ID列表，为null表示搜索全部文件
     * @return array ['content' => 回答, 'sources' => 引用来源]
     */
    public function chat(int $sessionId, string $message, ?string $imageUrl = null, ?array $fileIds = null): array
    {
        $session = KbChatSession::find($sessionId);
        if (!$session) {
            throw new \Exception('会话不存在');
        }

        $collection = KbCollection::find($session->collection_id);
        if (!$collection) {
            throw new \Exception('知识库不存在');
        }

        // 1. 构建上下文内容
        $contextText = '';
        $sourceRefs = [];
        $isSummaryQuery = $this->isSummaryQuery($message);

        try {
            // 如果指定了文件ID，只使用这些文件的 extracted_text，不进行 MySQL 检索
            if ($fileIds !== null && !empty($fileIds)) {
                $files = KbFile::whereIn('id', $fileIds)->select();
                $contextText = "以下是从您选择的文件中提取的内容：\n\n";

                foreach ($files as $file) {
                    if (!empty($file->extracted_text)) {
                        $contextText .= "【文件: {$file->original_name}】\n{$file->extracted_text}\n\n";
                        $sourceRefs[] = [
                            'file_id' => $file->id,
                            'file_name' => $file->original_name,
                            'excerpt' => mb_substr($file->extracted_text, 0, 100, 'UTF-8') . '...',
                            'score' => 1.0,
                        ];
                    } else {
                        $contextText .= "【文件: {$file->original_name}】\n[文件内容未提取或为空]\n\n";
                    }
                }

                if ($isSummaryQuery) {
                    $contextText .= "请基于以上文件内容回答用户的问题。";
                } else {
                    $contextText .= "请基于以上文件内容回答用户的问题。";
                }

                Log::info("使用指定文件内容，文件数: " . count($files));
            } else {
                // 如果没有指定文件，使用 MySQL 全文检索整个知识库
                $contextText = "以下是从知识库中检索到的相关内容：\n\n";
                $searchResults = $this->searchService->searchWithFiles($session->collection_id, $message, 5, null);

                foreach (array_values($searchResults) as $i => $result) {
                    $chunk = $result['chunk'];
                    $file = $result['file'];

                    $fileName = isset($file->original_name) ? $file->original_name : '未知文件';
                    $contextText .= "【片段{$i}: {$fileName} (相关性: {$result['score']})】\n{$chunk->content}\n\n";
                    $sourceRefs[] = [
                        'chunk_id' => $chunk->id,
                        'file_name' => $fileName,
                        'excerpt' => mb_substr($chunk->content, 0, 100, 'UTF-8') . '...',
                        'score' => $result['score'],
                    ];
                }

                if (empty($searchResults)) {
                    $contextText = "知识库中暂无相关内容，请根据你的知识回答，并说明未找到知识库中的相关依据。\n\n";
                }

                Log::info("MySQL 全文检索找到 " . count($searchResults) . " 个相关文本块");
            }

        } catch (\Exception $e) {
            Log::error("获取内容失败: " . $e->getMessage());
            $contextText = "获取知识库内容时出错，请根据你的知识回答。";
        }

        // 3. 获取历史对话上下文（最近10条）
        $historyMessages = KbChatMessage::where('session_id', $sessionId)
            ->order('created_at', 'desc')
            ->limit(10)
            ->select()
            ->toArray();

        $historyMessages = array_reverse($historyMessages);

        // 4. 调用AI模型
        // 注意：不再根据是否有图片来决定使用哪个模型
        // 因为图片内容已经通过数据库的 extracted_text 获取，直接使用文本模型即可
        $aiResponse = $this->callDeepSeek($message, $contextText, $historyMessages, $isSummaryQuery);

        // 5. 保存用户消息
        KbChatMessage::create([
            'session_id' => $sessionId,
            'role' => 'user',
            'content' => $message,
            'image_url' => $imageUrl,
        ]);

        // 6. 保存AI回复
        KbChatMessage::create([
            'session_id' => $sessionId,
            'role' => 'assistant',
            'content' => $aiResponse,
            'source_refs' => $sourceRefs,
            'model_used' => 'deepseek-chat',
        ]);

        // 7. 更新会话信息
        $session->message_count += 2;
        $session->last_message_at = date('Y-m-d H:i:s');

        if (empty($session->title) || $session->title === '新对话') {
            // 如果消息包含文件指令前缀，提取真正的用户问题
            $cleanMessage = $message;
            if (str_starts_with($cleanMessage, '[请基于以下文件回答:')) {
                $cleanMessage = trim(preg_replace('/^\[.*?\]\s*/', '', $cleanMessage));
            }
            $session->title = mb_substr($cleanMessage, 0, 30, 'UTF-8');
        }

        $session->save();

        return [
            'content' => $aiResponse,
            'sources' => $sourceRefs,
        ];
    }

    /**
     * 调用DeepSeek API (纯文本)
     */
    private function callDeepSeek(string $message, string $contextText, array $history = [], bool $isSummaryQuery = false): string
    {
        $apiKey = env('DEEPSEEK_API_KEY', '');
        if (empty($apiKey)) {
            throw new \Exception('DeepSeek API Key 未配置');
        }

        $systemPrompt = $isSummaryQuery
            ? "你是文档总结助手。{$contextText}\n\n请基于以上文档内容进行总结，说明文档的主要内容和要点。使用清晰的条理和结构化的表达。"
            : "你是CMMS维修管理系统的智能助手，根据知识库内容回答问题。\n\n{$contextText}\n\n请基于以上知识库内容回答用户的问题。如果知识库中没有相关内容，请如实告知。回答时请引用具体来源。";

        $messages = [
            [
                'role' => 'system',
                'content' => $systemPrompt,
            ],
        ];

        foreach ($history as $msg) {
            $messages[] = [
                'role' => $msg['role'],
                'content' => $msg['content'],
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $message,
        ];

        $payload = [
            'model' => 'deepseek-chat',
            'messages' => $messages,
            'temperature' => 0.7,
            'max_tokens' => 2000,
        ];

        return $this->callLlmApi('https://api.deepseek.com/v1/chat/completions', $apiKey, $payload);
    }

    /**
     * 调用Qwen VL API (多模态)
     */
    private function callQwenVl(string $message, string $imageUrl, string $contextText, array $history = [], bool $isSummaryQuery = false): string
    {
        $apiKey = env('DASHSCOPE_API_KEY', '');
        if (empty($apiKey)) {
            throw new \Exception('DashScope API Key 未配置，请在.env中设置DASHSCOPE_API_KEY');
        }

        $model = env('DASHSCOPE_MODEL', 'qwen2.5-vl-72b-instruct');

        $userContent = [];

        // 如果imageUrl是本地路径，转为base64
        if (!str_starts_with($imageUrl, 'http') && !str_starts_with($imageUrl, 'data:')) {
            $fullPath = root_path() . 'public/' . ltrim($imageUrl, '/');
            if (file_exists($fullPath)) {
                $mimeType = mime_content_type($fullPath) ?: 'image/jpeg';
                $imageData = base64_encode(file_get_contents($fullPath));
                $imageUrl = "data:{$mimeType};base64,{$imageData}";
            }
        }

        $userContent[] = ['type' => 'image_url', 'image_url' => ['url' => $imageUrl]];
        $userContent[] = ['type' => 'text', 'text' => $message];

        $systemPrompt = $isSummaryQuery
            ? "你是文档总结助手。{$contextText}\n\n请基于以上文档内容进行总结，说明文档的主要内容和要点。使用清晰的条理和结构化的表达。"
            : "你是CMMS维修管理系统的智能助手，根据知识库内容和用户提供的图片回答问题。\n\n{$contextText}\n\n请基于以上知识库内容和图片回答用户的问题。如果知识库中没有相关内容，请如实告知。回答时请引用具体来源。";

        $messages = [
            [
                'role' => 'system',
                'content' => $systemPrompt,
            ],
        ];

        foreach ($history as $msg) {
            $messages[] = [
                'role' => $msg['role'],
                'content' => $msg['content'],
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $userContent,
        ];

        $payload = [
            'model' => $model,
            'messages' => $messages,
            'temperature' => 0.7,
            'max_tokens' => 2000,
        ];

        return $this->callLlmApi('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', $apiKey, $payload);
    }

    /**
     * 通用LLM API调用
     */
    private function callLlmApi(string $url, string $apiKey, array $payload): string
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 120);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            Log::error("LLM API请求失败: {$error}");
            throw new \Exception('AI服务请求失败: ' . $error);
        }

        $result = json_decode($response, true);

        if (isset($result['error'])) {
            $errorMsg = isset($result['error']['message']) ? $result['error']['message'] : '未知错误';
            Log::error("LLM API错误: {$errorMsg}");
            throw new \Exception('AI服务错误: ' . $errorMsg);
        }

        $content = isset($result['choices'][0]['message']['content']) ? $result['choices'][0]['message']['content'] : '';
        return $content;
    }

    /**
     * 判断是否是概括性问题
     * @param string $query 查询文本
     * @return bool
     */
    private function isSummaryQuery(string $query): bool
    {
        $summaryKeywords = [
            '总结', '概括', '概述', '摘要', '主要内容',
            '分析', '介绍', '说明', '讲述', '详细说明',
            '我有什么文件', '文档内容', '文档中', '文件里'
        ];

        $queryLower = mb_strtolower($query);
        foreach ($summaryKeywords as $keyword) {
            if (mb_strpos($queryLower, $keyword) !== false) {
                return true;
            }
        }

        return false;
    }
}
