# CMMS Agent Service

这是一个独立的 `FastAPI + LangGraph + RAG` 智能体服务，供 `backend` 的 `/api/agent/chat` 代理调用。

## 能力

- 使用 `DeepSeek` 作为 LLM，默认模型为 `deepseek-chat`
- 使用 `LangGraph` 按场景编排工作流，而不是单纯的 `if/else` 选工具
- 读取 `repair` 与 `cmms_db` 两个数据库，按不同业务场景组合数据
- 通过 `kb_chunks` 做基础 RAG 检索

## 当前工作流

1. `initialize_state`
   写入用户消息、历史消息和标准化后的消息。
2. `load_user_state`
   根据 `user_id` 读取 repair 用户上下文，以及相关维修订单 / CMMS 工单。
3. `analyze_state`
   通过分析工具识别当前问题属于订单、库存、人员、知识库、模块概览等哪类场景。
4. 场景节点
   根据分析结果进入 `repair_order`、`inventory`、`personnel`、`knowledge`、`overview`、`general` 之一。
5. `answer_node`
   基于真实查询结果生成回答，优先直接回答，必要时再调用 LLM 汇总。

## 双库策略

- `repair`
  主要承接维修订单、维修进度、库存、配件、供应商、维修用户等运行态业务数据。
- `cmms_db`
  主要承接系统模块、知识库、维修分类、维修合同、维修报告、CMMS 工单等平台侧数据。

默认策略：

- 用户、订单、库存、供应商问题优先读 `repair`
- 模块能力、知识库、流程说明、业务配置优先读 `cmms_db`
- 需要上下文补强时，两个库会一起读

## 启动

1. 安装依赖

```bash
cd agent-service
pip install -r requirements.txt
```

2. 确保 `backend/.env` 已配置：

- `DEEPSEEK_API_KEY`
- `DATABASE_*`
- `REPAIR_DB_*`

3. 启动服务

```bash
python app.py
```

默认监听 `http://127.0.0.1:8001`

## PHP 侧配置

如需修改地址，在 `backend/.env` 中增加：

```env
AGENT_SERVICE_URL=http://127.0.0.1:8001
AGENT_MODEL=deepseek-chat
```
