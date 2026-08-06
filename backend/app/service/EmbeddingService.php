<?php

namespace app\service;

use think\facade\Log;

/**
 * 文本嵌入服务
 * 调用本地Python嵌入服务 (sentence-transformers) 进行文本向量化
 * 模型: bge-large-zh-v1.5 (1024维)
 */
class EmbeddingService
{
    private $baseUrl;

    public function __construct()
    {
        $host = env('EMBEDDING_HOST', 'embedding-service');
        $port = env('EMBEDDING_PORT', '8080');
        $this->baseUrl = "http://{$host}:{$port}";
    }

    /**
     * 单文本嵌入
     * @param string $text 文本内容
     * @return array 1024维浮点向量
     */
    public function embed(string $text): array
    {
        $result = $this->embedBatch([$text]);
        return $result[0] ?? [];
    }

    /**
     * 批量文本嵌入
     * @param array $texts 文本数组
     * @return array 向量数组
     */
    public function embedBatch(array $texts): array
    {
        // 截断过长文本
        $texts = array_map(function ($text) {
            return mb_substr($text, 0, 2000, 'UTF-8');
        }, $texts);

        $url = "{$this->baseUrl}/embed";

        $payload = [
            'inputs' => $texts,
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            Log::error("嵌入服务请求失败: {$error}");
            throw new \Exception('嵌入服务请求失败: ' . $error);
        }

        $result = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error("嵌入服务响应解析失败: {$response}");
            throw new \Exception('嵌入服务响应解析失败');
        }

        // TEI返回格式: {"data": [[0.1, 0.2, ...], [0.3, 0.4, ...]]}
        // 或直接返回: [[0.1, 0.2, ...], [0.3, 0.4, ...]]
        if (isset($result['data']) && is_array($result['data'])) {
            return $result['data'];
        }

        if (is_array($result) && isset($result[0]) && is_array($result[0])) {
            return $result;
        }

        Log::error("嵌入服务未知响应格式: " . json_encode($result));
        throw new \Exception('嵌入服务返回格式异常');
    }

    /**
     * 检查服务是否可用
     */
    public function isAvailable(): bool
    {
        $url = "{$this->baseUrl}/health";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode === 200;
    }
}
