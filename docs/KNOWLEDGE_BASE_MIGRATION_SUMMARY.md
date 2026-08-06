# 知识库迁移总结

## 概述
将知识库系统从 Milvus 向量检索迁移到 MySQL FULLTEXT 全文检索，不再依赖 Milvus 向量数据库。

## 迁移日期
2026-04-28

## 变更内容

### 1. 数据库变更
- **文件**: `backend/database/add_fulltext_index.sql`
- **变更**: 在 `kb_chunks` 表添加 FULLTEXT 索引
```sql
ALTER TABLE kb_chunks ADD FULLTEXT INDEX idx_content_fulltext (content) WITH PARSER ngram;
```

### 2. 新增服务
- **文件**: `backend/app/service/MySQLSearchService.php`
- **功能**: 使用 MySQL FULLTEXT 实现全文搜索
- **主要方法**:
  - `search()` - 基础全文搜索
  - `likeSearch()` - LIKE 搜索作为回退
  - `calculateRelevance()` - 计算相关性分数
  - `searchWithFiles()` - 包含文件信息的完整搜索

### 3. 修改服务
- **文件**: `backend/app/service/RagChatService.php`
- **变更**:
  - 移除 `EmbeddingService` 和 `MilvusService` 依赖
  - 改用 `MySQLSearchService` 进行检索
  - 简化检索逻辑，直接使用全文搜索

- **文件**: `backend/app/service/FileProcessingService.php`
- **变更**:
  - 移除向量化步骤
  - 保留文本提取和分块功能
  - 移除 Milvus 相关代码

### 4. 修改控制器
- **文件**: `backend/app/controller/KbCollectionController.php`
- **变更**:
  - 移除 `MilvusService` 依赖
  - 创建不再需要 Milvus 集合
  - 删除不再需要 Milvus 集合删除

- **文件**: `backend/app/controller/KbFileController.php`
- **变更**:
  - 移除 `MilvusService` 依赖
  - 删除文件不再删除向量数据
  - 重新处理不再涉及向量化

## 功能影响

### 保留功能
- ✅ 文件上传 (支持 PDF, DOCX, XLSX, PPTX, TXT, MD, CSV, 图片)
- ✅ 文本提取 (多种格式支持)
- ✅ 文本分块 (滑动窗口)
- ✅ 全文检索 (MySQL FULLTEXT + LIKE 回退)
- ✅ RAG 对话 (DeepSeek/Qwen API)
- ✅ 历史消息记录
- ✅ 引用来源显示

### 移除功能
- ❌ Milvus 向量数据库
- ❌ 文本向量化
- ❌ 向量相似度搜索

## API 端点 (未变更)
所有 API 端点保持不变，前端无需修改：

### 知识库集合
- `GET /api/kb/collections` - 列表
- `GET /api/kb/collections/:id` - 详情
- `POST /api/kb/collections` - 创建
- `PUT /api/kb/collections/:id` - 更新
- `DELETE /api/kb/collections/:id` - 删除

### 文件管理
- `GET /api/kb/files` - 文件列表
- `GET /api/kb/files/:id` - 文件详情
- `POST /api/kb/files/upload` - 上传文件
- `DELETE /api/kb/files/:id` - 删除文件
- `POST /api/kb/files/:id/reprocess` - 重新处理
- `GET /api/kb/files/:id/download` - 下载文件

### AI 对话
- `GET /api/kb/chat/sessions` - 会话列表
- `POST /api/kb/chat/sessions` - 创建会话
- `DELETE /api/kb/chat/sessions/:id` - 删除会话
- `GET /api/kb/chat/sessions/:id/messages` - 消息列表
- `POST /api/kb/chat/sessions/:id/send` - 发送消息

## 前端功能
前端页面已实现完整功能，无需修改：

### Collections.vue (知识库管理)
- ✅ 搜索知识库
- ✅ 创建知识库
- ✅ 编辑知识库
- ✅ 删除知识库
- ✅ AI 对话快捷入口
- ✅ 分页

### KnowledgeDetail.vue (知识库详情)
- ✅ 拖拽上传文件
- ✅ 文件列表展示
- ✅ 上传进度显示
- ✅ 查看文件详情
- ✅ 下载文件
- ✅ 重新处理文件
- ✅ 删除文件
- ✅ 文件级 AI (分析)
- ✅ 查看提取文本
- ✅ 查看文本块

### Chat.vue (AI 对话)
- ✅ 知识库选择
- ✅ 创建新对话
- ✅ 发送消息
- ✅ 上传图片
- ✅ 显示引用来源
- ✅ 历史消息
- ✅ 删除会话

## 性能影响

### 优点
- 无需 Milvus 服务，简化部署
- MySQL 全文搜索性能良好 (适合中小规模数据)
- 降低内存和 CPU 占用
- 降低运维复杂度

### 缺点
- 向量相似度搜索更精确，语义理解更好
- FULLTEXT 搜索主要依赖关键词匹配

## 兼容性
- 数据库表结构向后兼容 (新增索引)
- API 端点无变化
- 前端无需修改
- 旧数据可直接使用

## 部署建议

### 1. 数据库迁移
```bash
# 添加全文索引
mysql -u root -p cmms_db < backend/database/add_fulltext_index.sql
```

### 2. 代码部署
- 部署后端代码
- 重启 PHP-FPM
- 前端无需重新构建

### 3. 可选: 停止 Milvus
```bash
# 可以停止 Milvus 相关服务
docker-compose stop milvus milvus-rest etcd minio
```

## 测试建议

### 1. 基础功能测试
- [ ] 创建知识库
- [ ] 上传各种格式文件
- [ ] 检查文本提取和分块
- [ ] 测试全文搜索

### 2. RAG 对话测试
- [ ] 创建聊天会话
- [ ] 发送查询消息
- [ ] 检查引用来源
- [ ] 多轮对话测试

### 3. 文件管理测试
- [ ] 重新处理文件
- [ ] 删除文件
- [ ] 下载文件
- [ ] 文件级 AI 分析

## 回滚方案
如果需要回滚到 Milvus:

1. 恢复旧版本代码
2. 移除 FULLTEXT 索引:
```sql
ALTER TABLE kb_chunks DROP INDEX idx_content_fulltext;
```
3. 启动 Milvus 服务
4. 重新向量化现有数据

## 注意事项
1. FULLTEXT 索引需要 MySQL 5.7.6+ 版本
2. `ngram` 解析器对中文支持更好
3. 大量文本分块时可能影响性能，建议定期优化表
4. 搜索结果相关性评分是简化的，可根据需求调整算法

## 后续优化建议
1. 考虑添加搜索结果缓存
2. 支持更复杂的相关性评分算法
3. 添加搜索历史和热门搜索
4. 支持组合搜索 (多条件)
5. 考虑添加同义词扩展
