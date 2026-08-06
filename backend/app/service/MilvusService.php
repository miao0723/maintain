<?php

namespace app\service;

use think\facade\Log;

/**
 * Milvus 向量数据库服务
 * 通过 REST API 与 Milvus 2.4 交互
 */
class MilvusService
{
    private $baseUrl;

    public function __construct()
    {
        // 检测是否在Docker环境中运行
        $isDocker = file_exists('/.dockerenv') || getenv('DOCKER_CONTAINER');

        $host = env('MILVUS_HOST', 'localhost');
        $port = env('MILVUS_PORT', '19530');

        $uri = env('MILVUS_URI', '');

        // 在Docker环境中直接使用Docker内部服务名
        if ($isDocker) {
            // 如果使用host.docker.internal，这是正确的
            // 如果使用服务名（如milvus-rest），这也是正确的
            if (!empty($uri)) {
                $this->baseUrl = $uri;
            } else {
                $this->baseUrl = "http://{$host}:{$port}";
            }
            Log::info("Milvus服务初始化(Docker环境): {$this->baseUrl}");
        } else {
            // 本地开发环境，从环境变量或使用默认值
            if (!empty($uri)) {
                $this->baseUrl = $uri;
            } else {
                $this->baseUrl = "http://{$host}:{$port}";
            }
            Log::info("Milvus服务初始化(本地环境): {$this->baseUrl}");
        }
    }

    /**
     * 创建集合
     */
    public function createCollection(string $name, int $dimension = 1024): bool
    {
        $url = "{$this->baseUrl}/api/v1/collections";

        $payload = [
            'collectionName' => $name,
            'dimension' => $dimension,
            'metricType' => 'COSINE',
            'indexType' => 'IVF_FLAT',
            'params' => ['nlist' => 128],
        ];

        $result = $this->request('POST', $url, $payload);

        if (isset($result['code']) && $result['code'] === 0) {
            Log::info("Milvus集合创建成功: {$name}");
            return true;
        }

        throw new \Exception('创建Milvus集合失败: ' . ($result['message'] ?? '未知错误'));
    }

    /**
     * 删除集合
     */
    public function dropCollection(string $name): bool
    {
        $url = "{$this->baseUrl}/api/v1/collections/drop";

        $result = $this->request('POST', $url, ['collectionName' => $name]);

        if (isset($result['code']) && $result['code'] === 0) {
            Log::info("Milvus集合删除成功: {$name}");
            return true;
        }

        throw new \Exception('删除Milvus集合失败: ' . ($result['message'] ?? '未知错误'));
    }

    /**
     * 插入向量数据
     * @param string $collectionName 集合名
     * @param array $vectors 向量数组 [[vector=>[...], chunk_id=>x, collection_id=>x], ...]
     * @return array 插入结果含主键ID列表
     */
    public function insert(string $collectionName, array $vectors): array
    {
        $url = "{$this->baseUrl}/api/v1/collections/insert";

        $data = [];
        foreach ($vectors as $item) {
            $data[] = [
                'vector' => $item['vector'],
                'chunk_id' => $item['chunk_id'],
                'collection_id' => $item['collection_id'],
            ];
        }

        $payload = [
            'collectionName' => $collectionName,
            'data' => $data,
        ];

        $result = $this->request('POST', $url, $payload);

        if (isset($result['code']) && $result['code'] === 0) {
            return $result['data'] ?? [];
        }

        throw new \Exception('插入向量数据失败: ' . ($result['message'] ?? '未知错误'));
    }

    /**
     * 删除向量数据
     * @param string $collectionName 集合名
     * @param string $filter 过滤条件 如 "collection_id == 1"
     */
    public function delete(string $collectionName, string $filter): bool
    {
        $url = "{$this->baseUrl}/api/v1/collections/delete";

        $payload = [
            'collectionName' => $collectionName,
            'filter' => $filter,
        ];

        $result = $this->request('POST', $url, $payload);

        if (isset($result['code']) && $result['code'] === 0) {
            return true;
        }

        throw new \Exception('删除向量数据失败: ' . ($result['message'] ?? '未知错误'));
    }

    /**
     * 搜索向量
     * @param string $collectionName 集合名
     * @param array $queryVector 查询向量
     * @param int $topK 返回数量
     * @param string $filter 过滤条件
     * @return array 搜索结果 [[chunk_id, distance, ...], ...]
     */
    public function search(string $collectionName, array $queryVector, int $topK = 5, string $filter = ''): array
    {
        $url = "{$this->baseUrl}/api/v1/collections/search";

        $payload = [
            'collectionName' => $collectionName,
            'data' => [$queryVector],
            'limit' => $topK,
            'outputFields' => ['chunk_id', 'collection_id'],
        ];

        if (!empty($filter)) {
            $payload['filter'] = $filter;
        }

        $result = $this->request('POST', $url, $payload);

        if (isset($result['code']) && $result['code'] === 0) {
            return $result['data'][0] ?? [];
        }

        throw new \Exception('向量搜索失败: ' . ($result['message'] ?? '未知错误'));
    }

    /**
     * 获取集合统计信息
     */
    public function getCollectionStats(string $collectionName): array
    {
        $url = "{$this->baseUrl}/api/v1/collections/describe";

        $result = $this->request('POST', $url, ['collectionName' => $collectionName]);

        if (isset($result['code']) && $result['code'] === 0) {
            return $result['data'] ?? [];
        }

        return [];
    }

    /**
     * 检查集合是否存在
     */
    public function collectionExists(string $collectionName): bool
    {
        $url = "{$this->baseUrl}/api/v1/collections/describe";

        $result = $this->request('POST', $url, ['collectionName' => $collectionName]);

        return isset($result['code']) && $result['code'] === 0;
    }

    /**
     * 发送HTTP请求
     */
    private function request(string $method, string $url, array $payload = []): array
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Accept: application/json',
            ]);
        }

        $response = curl_exec($ch);
        $error = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($error) {
            Log::error("Milvus请求失败: {$error}, URL: {$url}");
            throw new \Exception('Milvus请求失败: ' . $error);
        }

        $result = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error("Milvus响应解析失败: {$response}");
            throw new \Exception('Milvus响应解析失败');
        }

        return $result ?? [];
    }
}
