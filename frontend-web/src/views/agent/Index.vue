<template>
  <div class="agent-page">
    <section class="agent-hero">
      <div class="hero-copy">
        <div class="hero-badge">System Agent</div>
        <h1>系统智能体</h1>
        <p>
          面向管理员的全局问答入口。智能体会结合维修知识库与业务工具，自动分析问题并查询人员、订单、进度、库存与供应商信息。
        </p>
      </div>
      <div class="hero-tools">
        <span v-for="tool in toolTags" :key="tool" class="tool-tag">{{ tool }}</span>
      </div>
    </section>

    <section class="agent-shell">
      <aside class="prompt-panel">
        <div class="panel-title">建议提问</div>
        <button
          v-for="prompt in promptSuggestions"
          :key="prompt"
          class="prompt-card"
          @click="applyPrompt(prompt)"
        >
          {{ prompt }}
        </button>
      </aside>

      <main class="chat-panel">
        <div ref="messageListRef" class="message-list">
          <div v-if="messages.length === 0" class="empty-state">
            <div class="empty-mark">AGENT</div>
            <h3>从一个业务问题开始</h3>
            <p>例如：当前低库存配件有哪些？订单 25 的维修进度到哪一步了？谁负责某个订单？</p>
          </div>

          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message-item', message.role]"
          >
            <div class="message-head">
              <span class="role-label">{{ message.role === 'user' ? '管理员' : 'Agent' }}</span>
              <span class="time-label">{{ formatTime(message.createdAt) }}</span>
            </div>
            <div class="message-body">
              <div class="message-text" v-html="renderMarkdown(message.content)"></div>
              <div v-if="message.tools?.length" class="tool-trace">
                <span v-for="tool in message.tools" :key="tool" class="trace-tag">{{ tool }}</span>
              </div>
            </div>
          </div>

          <div v-if="loading" class="message-item assistant">
            <div class="message-head">
              <span class="role-label">Agent</span>
            </div>
            <div class="message-body">
              <div class="message-text thinking">正在分析问题并调用工具...</div>
            </div>
          </div>
        </div>

        <div class="composer">
          <el-input
            v-model="inputMessage"
            type="textarea"
            resize="none"
            :autosize="{ minRows: 3, maxRows: 8 }"
            placeholder="输入业务问题。Agent 会结合 LangGraph、RAG 和系统数据自动作答。"
            @keydown.enter.exact.prevent="submitMessage"
          />
          <div class="composer-actions">
            <span class="composer-tip">Enter 发送，Shift+Enter 换行</span>
            <el-button type="primary" :loading="loading" @click="submitMessage">
              发送给 Agent
            </el-button>
          </div>
        </div>
      </main>
    </section>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import { sendAgentMessage } from '@/api/agent'

const STORAGE_KEY = 'agent-chat-messages'
const inputMessage = ref('')
const loading = ref(false)
const messageListRef = ref(null)
const messages = ref([])

const toolTags = [
  'LangGraph',
  'DeepSeek',
  'RAG',
  'repair 数据库',
  'cmms_db 数据库',
  '人员查询',
  '维修订单',
  '维修进度',
  '库存分析',
  '供应商'
]

const promptSuggestions = [
  '查看当前维修订单列表。',
  '查看订单 25 当前的状态、进度和负责人。',
  '查看当前维修人员列表。',
  '查看当前低库存配件。',
  '查看库存金额最高的供应商排行。',
  '查看系统侧边栏中的维修业务模块包含哪些内容。',
  '查看知识库里和维修流程相关的资料。'
]

marked.setOptions({
  gfm: true,
  breaks: true
})

const escapeHtml = (content) => content
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const renderMarkdown = (content) => {
  if (!content) return ''
  return marked.parse(escapeHtml(String(content)))
}

const formatTime = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString('zh-CN', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const scrollToBottom = async () => {
  await nextTick()
  const el = messageListRef.value
  if (el) {
    el.scrollTop = el.scrollHeight
  }
}

const applyPrompt = (prompt) => {
  inputMessage.value = prompt
}

const loadMessages = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      messages.value = parsed
    }
  } catch (error) {
    console.warn('加载 Agent 会话失败', error)
  }
}

const submitMessage = async () => {
  const content = inputMessage.value.trim()
  if (!content || loading.value) {
    return
  }

  const history = messages.value.map((item) => ({
    role: item.role,
    content: item.content
  }))

  messages.value.push({
    id: `${Date.now()}-user`,
    role: 'user',
    content,
    createdAt: new Date().toISOString()
  })
  inputMessage.value = ''
  loading.value = true
  await scrollToBottom()

  try {
    const res = await sendAgentMessage({
      message: content,
      history
    })

    messages.value.push({
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      content: res.data?.answer || '未获得有效回复',
      tools: res.data?.tools_used || [],
      createdAt: new Date().toISOString(),
      requestId: res.data?.request_id || ''
    })
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.response?.data?.data?.detail || error.message || 'Agent 请求失败'
    messages.value.push({
      id: `${Date.now()}-assistant-error`,
      role: 'assistant',
      content: `本次请求失败：${errorMessage}`,
      createdAt: new Date().toISOString()
    })
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

watch(
  messages,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value.slice(-20)))
  },
  { deep: true }
)

onMounted(async () => {
  loadMessages()
  await scrollToBottom()
})
</script>

<style lang="scss" scoped>
.agent-page {
  height: calc(100vh - 140px);
  max-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.agent-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  padding: 18px 22px;
  border-radius: 20px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.18), transparent 30%),
    linear-gradient(135deg, #0f172a 0%, #12314f 48%, #14532d 100%);
  color: #f8fafc;

  h1 {
    margin: 8px 0 8px;
    font-size: 22px;
    line-height: 1.15;
    font-weight: 700;
  }

  p {
    margin: 0;
    max-width: 700px;
    color: rgba(248, 250, 252, 0.82);
    line-height: 1.6;
    font-size: 13px;
  }
}

.hero-badge {
  display: inline-flex;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-tools {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: flex-end;
  gap: 8px;
  max-width: 320px;
}

.tool-tag,
.trace-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 11px;
}

.tool-tag {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.agent-shell {
  flex: 1;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

.prompt-panel,
.chat-panel {
  min-height: 0;
  height: 100%;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
}

.prompt-panel {
  padding: 18px;
  overflow-y: auto;
}

.panel-title {
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.prompt-card {
  width: 100%;
  margin-bottom: 10px;
  padding: 13px 14px;
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
  text-align: left;
  line-height: 1.55;
  font-size: 13px;
  color: #1e293b;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(59, 130, 246, 0.12);
  }
}

.chat-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px;
  background:
    linear-gradient(180deg, rgba(239, 246, 255, 0.8) 0%, rgba(248, 250, 252, 0.95) 42%, #ffffff 100%);
}

.empty-state {
  height: 100%;
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  color: #475569;

  h3 {
    margin: 14px 0 6px;
    font-size: 21px;
    color: #0f172a;
  }

  p {
    max-width: 500px;
    margin: 0;
    line-height: 1.65;
    font-size: 13px;
  }
}

.empty-mark {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  border-radius: 22px;
  background: linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.message-item {
  width: fit-content;
  max-width: min(72%, 720px);
  margin-bottom: 18px;

  &.user {
    margin-left: auto;

    .message-body {
      background: linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%);
      color: #ffffff;
      border-radius: 20px 20px 8px 20px;
    }
  }

  &.assistant {
    .message-body {
      background: #ffffff;
      color: #0f172a;
      border-radius: 20px 20px 20px 8px;
      border: 1px solid #e2e8f0;
    }
  }
}

.message-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding: 0 6px;
}

.role-label {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.time-label {
  font-size: 12px;
  color: #94a3b8;
}

.message-body {
  padding: 14px 16px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.message-text {
  line-height: 1.8;
  word-break: break-word;
  font-size: 14px;

  :deep(p) {
    margin: 0 0 10px;
  }

  :deep(p:last-child) {
    margin-bottom: 0;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0;
    padding-left: 20px;
  }
}

.thinking {
  color: #475569;
}

.tool-trace {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.trace-tag {
  background: #eff6ff;
  color: #1d4ed8;
}

.composer {
  border-top: 1px solid #e2e8f0;
  padding: 16px 18px 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.composer :deep(.el-textarea__inner) {
  border-radius: 18px;
  border: 1px solid #dbe7f5;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.03);
  padding: 14px 16px;
  font-size: 14px;
  line-height: 1.7;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.composer :deep(.el-textarea__inner:focus) {
  border-color: #38bdf8;
  box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.14);
}

.composer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.composer-tip {
  color: #94a3b8;
  font-size: 12px;
}

.composer-actions :deep(.el-button--primary) {
  border-radius: 999px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #0891b2 0%, #2563eb 100%);
  border: none;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
}

@media (max-width: 960px) {
  .agent-page {
    height: auto;
    max-height: none;
    overflow: visible;
  }

  .agent-shell {
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .agent-hero {
    flex-direction: column;
  }

  .hero-tools {
    justify-content: flex-start;
    max-width: none;
  }

  .message-item {
    max-width: 100%;
  }

  .prompt-panel,
  .chat-panel {
    height: auto;
  }
}
</style>
