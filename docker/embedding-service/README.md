# 本地文本嵌入服务

使用 sentence-transformers 提供本地文本嵌入功能，支持中文和英文文本。

## 特性

- 使用 BAAI/bge-large-zh-v1.5 模型，专为中文优化
- 1024 维向量输出
- 自动归一化，便于余弦相似度计算
- Flask REST API 接口
- 完全本地运行，无需外部服务

## 构建和运行

### 使用 Docker Compose (推荐)

```bash
cd docker
docker-compose up -d embedding-service
```

### 手动运行

```bash
cd docker/embedding-service
docker build -t embedding-service .
docker run -p 8088:8080 -v embedding-models:/root/.cache embedding-service
```

## API 接口

### 健康检查

```
GET /health
```

响应：
```json
{
  "status": "healthy",
  "model": "BAAI/bge-large-zh-v1.5",
  "loaded": true
}
```

### 文本嵌入

```
POST /embed
Content-Type: application/json

{
  "inputs": ["文本1", "文本2"]
}
```

响应：
```json
{
  "data": [
    [0.1, 0.2, ...],  // 1024维向量
    [0.3, 0.4, ...]
  ]
}
```

### 获取嵌入维度

```
GET /dimensions
```

响应：
```json
{
  "dimensions": 1024
}
```

### 获取支持的模型

```
GET /models
```

响应：
```json
{
  "models": [
    "BAAI/bge-large-zh-v1.5",
    "BAAI/bge-small-zh-v1.5",
    "shibing624/text2vec-base-chinese",
    "sentence-transformers/all-MiniLM-L6-v2",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
  ],
  "current": "BAAI/bge-large-zh-v1.5"
}
```

## 配置

通过环境变量配置：

- `EMBEDDING_MODEL`: 模型名称，默认 `BAAI/bge-large-zh-v1.5`
- `HOST`: 监听地址，默认 `0.0.0.0`
- `PORT`: 监听端口，默认 `8080`

## 替换 TEI 服务

本地嵌入服务完全兼容原 TEI 服务的 API 格式，可以直接替换：

1. 在 `.env` 中更新配置：
   ```
   EMBEDDING_HOST=embedding-service
   EMBEDDING_PORT=8080
   ```

2. 重启相关服务
