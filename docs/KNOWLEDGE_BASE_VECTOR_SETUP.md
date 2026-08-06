# 知识库向量搜索功能文档

## 概述

本系统集成了Milvus向量数据库和阿里云DashScope嵌入服务，为知识库提供了基于语义的智能搜索功能。

## 架构说明

### 组件说明

1. **Milvus** - 向量数据库
   - 存储文本的向量表示
   - 提供高效的相似度搜索
   - 当前版本: v2.3.10

2. **DashScope API** - 文本嵌入服务
   - 将文本转换为向量表示
   - 模型: text-embedding-v2/v3
   - 维度: 1024

3. **PHP服务层**
   - `MilvusService.php` - 向量数据库操作
   - `SimpleEmbeddingService.php` - 文本向量化
   - `KnowledgeBaseVectorService.php` - 知识库向量管理
   - `KnowledgeBaseService.php` - 知识库业务逻辑（已集成向量功能）

### 工作流程

1. **创建/更新知识库** → 自动生成向量并存储到Milvus
2. **删除知识库** → 删除对应的向量索引
3. **搜索知识库** → 使用向量相似度搜索返回最相关结果

## 配置说明

### .env 配置

```bash
# Milvus 向量数据库配置
MILVUS_HOST=host.docker.internal    # Docker环境中使用
MILVUS_PORT=19530
MILVUS_URI=http://host.docker.internal:19530

# 本地嵌入模型配置
EMBEDDING_MODEL_NAME=BAAI/bge-large-zh-v1.5
EMBEDDING_MODEL_DIMS=1024

# DashScope API配置（用于文本嵌入）
DASHSCOPE_API_KEY=your_api_key_here
```

### Docker配置

确保`docker-compose.yml`中PHP容器添加了`extra_hosts`配置：

```yaml
php:
  # ... 其他配置
  extra_hosts:
    - "host.docker.internal:host-gateway"
```

这允许容器内部访问宿主机上的Milvus服务。

## API接口

### 1. 向量搜索

```
GET /api/knowledge/search?keyword=故障现象&limit=10&use_vector=true
```

参数说明：
- `keyword`: 搜索关键词（必填）
- `limit`: 返回结果数量（默认10）
- `use_vector`: 是否使用向量搜索（默认true）

响应示例：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "keyword": "屏幕不显示",
    "method": "vector",
    "total": 5,
    "results": [
      {
        "knowledge": {
          "id": 1,
          "title": "屏幕显示故障",
          "fault_symptom": "开机后屏幕不显示",
          "fault_cause": "背光灯损坏",
          "solution": "更换背光灯模块"
        },
        "score": 0.95,
        "distance": 0.05
      }
    ]
  }
}
```

### 2. 重建向量索引

```
POST /api/knowledge/vector/rebuild
```

重新为所有已发布的知识库创建向量索引。

### 3. 获取向量索引统计

```
GET /api/knowledge/vector/stats
```

返回向量集合的统计信息。

## 使用方法

### 方式1：自动索引（推荐）

知识库模块已自动集成向量功能：
- 创建知识库时，如果状态为"已发布"，自动创建向量索引
- 更新知识库时，自动更新向量索引
- 删除知识库时，自动删除向量索引
- 搜索时自动优先使用向量搜索，失败则回退到传统搜索

### 方式2：手动重建

使用API或测试脚本重建索引：

```bash
# 进入backend目录
cd backend

# 使用测试脚本
php tests/test-vector-kb.php rebuild
```

### 方式3：使用测试脚本

```bash
# 测试向量搜索
php tests/test-vector-kb.php search "屏幕不显示"

# 获取统计信息
php tests/test-vector-kb.php stats
```

## 故障排查

### 问题1：无法连接Milvus

**症状**: "Milvus连接失败"或"向量生成失败"

**解决步骤**:
1. 检查Milvus容器是否运行：
   ```bash
   docker ps | grep milvus
   ```

2. 检查Milvus健康状态：
   ```bash
   curl http://localhost:9091/api/v1/health
   ```

3. 在Docker环境中，确保使用`host.docker.internal`：
   ```bash
   # 检查.env配置
   cat backend/.env | grep MILVUS
   ```

4. 检查PHP容器是否可以访问宿主机：
   ```bash
   docker exec docker-php-1 curl http://host.docker.internal:19530
   ```

### 问题2：DashScope API调用失败

**症状**: "DashScope嵌入请求失败"

**解决步骤**:
1. 检查API Key是否配置：
   ```bash
   cat backend/.env | grep DASHSCOPE_API_KEY
   ```

2. 测试API连接：
   ```bash
   php tests/test-milvus-connection.php
   ```

3. 检查API配额和权限（阿里云控制台）

### 问题3：向量搜索结果不准确

**解决步骤**:
1. 确认数据已正确索引：
   ```bash
   php tests/test-vector-kb.php stats
   ```

2. 重建索引：
   ```bash
   php tests/test-vector-kb.php rebuild
   ```

3. 检查文本内容是否完整：
   - 确保故障现象、原因、解决方案都填写完整
   - 文本内容越丰富，向量表示越准确

### 问题4：Docker环境无法访问Milvus

**症状**: Docker内PHP服务无法连接宿主机的Milvus

**解决步骤**:
1. 确认`docker-compose.yml`配置：
   ```yaml
   services:
     php:
       extra_hosts:
         - "host.docker.internal:host-gateway"
   ```

2. 重启容器使配置生效：
   ```bash
   docker-compose restart php
   ```

## 性能优化建议

1. **批量处理**: 对于大量数据，使用批量插入而不是单条插入

2. **索引选择**:
   - IVF_FLAT: 适合小规模数据（<100万条）
   - IVF_PQ: 适合大规模数据，但会损失精度
   - HNSW: 适合需要实时更新和高召回率场景

3. **缓存策略**:
   - 常用查询结果可以缓存
   - 向量结果结合缓存可提升响应速度

## 安全建议

1. **API密钥管理**:
   - 不要将DASHSCOPE_API_KEY提交到版本控制
   - 使用环境变量或密钥管理服务

2. **访问控制**:
   - 向量搜索API需要JWT认证
   - 可以添加权限检查中间件

3. **数据隔离**:
   - 使用collection_id区分不同租户或用户的数据
   - 添加filter参数限制搜索范围

## 更新日志

### 2026-04-28
- 初始版本
- 集成Milvus v2.3.10
- 使用DashScope text-embedding-v2/v3
- 自动向量索引管理
- Docker环境支持

## 参考资料

- [Milvus官方文档](https://milvus.io/docs)
- [DashScope API文档](https://help.aliyun.com/zh/dashscope/)
- [PHP Milvus REST API](https://milvus.io/docs/rest_api.md)
