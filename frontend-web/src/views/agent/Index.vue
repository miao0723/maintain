<template>
  <div class="agent-page">
    <!-- 顶部信息条 -->
    <header class="agent-header">
      <div class="agent-id">
        <div class="agent-avatar"><el-icon :size="26"><MagicStick /></el-icon></div>
        <div class="agent-meta">
          <div class="agent-name">
            系统智能体
            <span class="status-pill" :class="{ busy: loading }">
              <i class="dot"></i>{{ loading ? '思考中' : '在线' }}
            </span>
          </div>
          <p class="agent-desc">结合维修知识库与业务数据，自动查询人员、订单、进度、库存、收入与供应商信息</p>
        </div>
      </div>
      <div class="agent-caps">
        <span v-for="cap in caps" :key="cap.label" class="cap-tag">
          <el-icon><component :is="cap.icon" /></el-icon>{{ cap.label }}
        </span>
      </div>
    </header>

    <section class="agent-shell">
      <aside class="side-panel">
        <div class="side-head">
          <span class="side-title"><el-icon><QuestionFilled /></el-icon>建议提问</span>
          <el-button link type="primary" size="small" :disabled="loading" @click="startNewChat">
            <el-icon><Plus /></el-icon>新对话
          </el-button>
        </div>
        <div class="side-scroll">
          <div v-for="group in promptGroups" :key="group.title" class="prompt-group">
            <div class="prompt-group-title"><el-icon><component :is="group.icon" /></el-icon>{{ group.title }}</div>
            <button v-for="prompt in group.items" :key="prompt" class="prompt-card" @click="applyPrompt(prompt)">
              <span class="prompt-text">{{ prompt }}</span>
              <el-icon class="prompt-arrow"><Right /></el-icon>
            </button>
          </div>
        </div>
      </aside>

      <main class="chat-panel">
        <div ref="messageListRef" class="message-list">
          <div v-if="messages.length === 0" class="welcome">
            <div class="welcome-icon"><el-icon :size="38"><MagicStick /></el-icon></div>
            <h2>你好，我是系统智能体</h2>
            <p>我可以帮你查询维修订单与进度、库存配件、交易收入、供应商等信息。点击左侧问题快速开始，或直接输入你的问题。</p>
            <div class="welcome-chips">
              <button v-for="q in quickChips" :key="q" class="chip" @click="applyPrompt(q)">{{ q }}</button>
            </div>
          </div>

          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message-item', message.role]"
          >
            <div class="msg-avatar" :class="message.role">
              <el-icon><component :is="message.role === 'user' ? User : MagicStick" /></el-icon>
            </div>
            <div class="msg-col">
              <div class="message-head">
                <span class="role-label">{{ message.role === 'user' ? '我' : 'Agent' }}</span>
                <span class="time-label">{{ formatTime(message.createdAt) }}</span>
              </div>
              <div class="message-body">
                <div class="message-text" v-html="renderMarkdown(message.content)"></div>
                <div v-if="message.tools?.length" class="tool-trace">
                  <span v-for="tool in message.tools" :key="tool" class="trace-tag">{{ tool }}</span>
                </div>
                <button
                  v-if="message.role === 'assistant' && message.content"
                  class="copy-btn"
                  title="复制回答"
                  @click="copyMessage(message.content)"
                >
                  <el-icon><CopyDocument /></el-icon>复制
                </button>
              </div>
            </div>
          </div>

          <div v-if="loading" class="message-item assistant">
            <div class="msg-avatar assistant"><el-icon><MagicStick /></el-icon></div>
            <div class="msg-col">
              <div class="message-head"><span class="role-label">Agent</span></div>
              <div class="message-body">
                <div class="message-text thinking">
                  <span class="tdot"></span><span class="tdot"></span><span class="tdot"></span>
                  正在分析问题并调用工具…
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="composer">
          <div class="composer-box">
            <el-input
              v-model="inputMessage"
              type="textarea"
              resize="none"
              :autosize="{ minRows: 1, maxRows: 6 }"
              placeholder="输入业务问题，Enter 发送，Shift+Enter 换行"
              @keydown.enter.exact.prevent="submitMessage"
            />
            <div class="composer-actions">
              <span class="composer-tip">Enter 发送 · Shift+Enter 换行</span>
              <div class="composer-btns">
                <el-button v-if="loading" size="small" text type="danger" @click="stopGeneration">停止</el-button>
                <el-button type="primary" size="small" :loading="loading" @click="submitMessage">
                  <el-icon><Promotion /></el-icon>发送
                </el-button>
              </div>
            </div>
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
import { Plus, CopyDocument, MagicStick, QuestionFilled, Right, Promotion, User, Tickets, Box, Money, Van, Reading, Position } from '@element-plus/icons-vue'
import { sendAgentMessage } from '@/api/agent'
import { getMiniAdminOrders } from '@/api/miniAdmin'

const STORAGE_KEY = 'agent-chat-messages'
const inputMessage = ref('')
const loading = ref(false)
const messageListRef = ref(null)
const messages = ref([])
let abortController = null

// 顶部能力标签（icon 为组件引用，供 <component :is> 动态渲染）
const caps = [
  { label: '维修订单', icon: Tickets },
  { label: '维修进度', icon: Position },
  { label: '库存配件', icon: Box },
  { label: '交易收入', icon: Money },
  { label: '供应商', icon: Van },
  { label: '知识库', icon: Reading }
]

// 欢迎区快捷问题
const quickChips = [
  '查看当前维修订单列表',
  '查看当前低库存配件',
  '查看当前累计收入和本月入账'
]

// 最新订单号（用于示例提问，加载失败时退回占位符）
const latestOrderId = ref('')

const buildPromptGroups = () => {
  const orderRef = latestOrderId.value || '最新一笔'
  return [
    {
      title: '维修订单',
      icon: Tickets,
      items: [
        '查看当前维修订单列表。',
        `查看订单 ${orderRef} 当前的状态、进度和负责人。`
      ]
    },
    {
      title: '库存配件',
      icon: Box,
      items: [
        '查看当前低库存配件。',
        '查看库存金额最高的供应商排行。'
      ]
    },
    {
      title: '收入交易',
      icon: Money,
      items: [
        '查看当前累计收入和本月入账情况。',
        '查看当前退款中的订单有哪些。'
      ]
    }
  ]
}

const promptGroups = ref(buildPromptGroups())

const fetchLatestOrder = async () => {
  try {
    const res = await getMiniAdminOrders({ page: 1, pageSize: 1 })
    const first = res.data?.items?.[0]
    if (first?.order_id) {
      latestOrderId.value = first.order_id
      promptGroups.value = buildPromptGroups()
    }
  } catch (error) {
    console.warn('[Agent] 获取最新订单失败，提示词使用占位符:', error)
  }
}

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

  // 支持中途停止生成
  abortController = new AbortController()
  const signal = abortController.signal

  try {
    const res = await sendAgentMessage(
      {
        message: content,
        history
      },
      { signal }
    )

    // 打字机效果：逐步展示完整回答
    const fullAnswer = res.data?.answer || '未获得有效回复'
    messages.value.push({
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      content: '',
      tools: res.data?.tools_used || [],
      createdAt: new Date().toISOString(),
      requestId: res.data?.request_id || ''
    })
    // 必须取数组里的响应式代理对象来改 content，直接改原始对象不会触发视图更新
    const reply = messages.value[messages.value.length - 1]
    await typeOutAnswer(reply, fullAnswer, signal)
  } catch (error) {
    if (error.code === 'ERR_CANCELED' || signal.aborted) {
      messages.value.push({
        id: `${Date.now()}-assistant-stopped`,
        role: 'assistant',
        content: '已停止本次请求。',
        createdAt: new Date().toISOString()
      })
    } else {
      const errorMessage = error.response?.data?.message || error.response?.data?.data?.detail || error.message || 'Agent 请求失败'
      messages.value.push({
        id: `${Date.now()}-assistant-error`,
        role: 'assistant',
        content: `本次请求失败：${errorMessage}`,
        createdAt: new Date().toISOString()
      })
      ElMessage.error(errorMessage)
    }
  } finally {
    loading.value = false
    abortController = null
    await scrollToBottom()
  }
}

// 打字机输出：按块渐进显示，中途停止时立即定格
const typeOutAnswer = async (reply, fullAnswer, signal) => {
  const chunkSize = Math.max(2, Math.ceil(fullAnswer.length / 60))
  for (let i = 0; i < fullAnswer.length; i += chunkSize) {
    if (signal?.aborted) {
      reply.content = fullAnswer
      return
    }
    reply.content = fullAnswer.slice(0, i + chunkSize)
    await scrollToBottom()
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 24))
  }
  reply.content = fullAnswer
}

const stopGeneration = () => {
  if (abortController) {
    abortController.abort()
  }
}

const clearConversation = () => {
  if (abortController) {
    abortController.abort()
  }
  messages.value = []
  localStorage.removeItem(STORAGE_KEY)
  ElMessage.success('会话已清空')
}

// 开始新对话：清空当前会话（等同重开一轮）
const startNewChat = () => {
  if (abortController) {
    abortController.abort()
  }
  messages.value = []
  localStorage.removeItem(STORAGE_KEY)
  ElMessage.success('已开始新对话')
}

// 复制回答到剪贴板（带 execCommand 降级，兼容非安全上下文）
const copyMessage = async (content) => {
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    const ta = document.createElement('textarea')
    ta.value = content
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      ElMessage.success('已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败，请手动选择复制')
    }
    document.body.removeChild(ta)
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
  fetchLatestOrder()
  await scrollToBottom()
})
</script>

<style lang="scss" scoped>
.agent-page {
  height: calc(100vh - 140px);
  max-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
}

// ===== 顶部信息条 =====
.agent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 18px;
  border-radius: 18px;
  border: 1px solid var(--c-border-light);
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--c-primary) 12%, transparent), transparent 42%),
    var(--c-bg-card);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);

  .agent-id {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .agent-avatar {
    flex-shrink: 0;
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 16px;
    color: #fff;
    background: linear-gradient(135deg, #6366f1, #0ea5e9);
    box-shadow: 0 10px 22px rgba(79, 70, 229, 0.28);
  }

  .agent-meta { min-width: 0; }

  .agent-name {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 800;
    color: var(--c-text-primary);
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: var(--c-success);
    background: var(--c-bg-success-soft);
    border: 1px solid color-mix(in srgb, var(--c-success) 30%, transparent);

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--c-success);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-success) 22%, transparent);
    }

    &.busy {
      color: var(--c-warning);
      background: var(--c-bg-warning-soft);
      border-color: color-mix(in srgb, var(--c-warning) 30%, transparent);

      .dot {
        background: var(--c-warning);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-warning) 22%, transparent);
        animation: pulse 1s infinite;
      }
    }
  }

  .agent-desc {
    margin: 4px 0 0;
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--c-text-secondary);
  }

  .agent-caps {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    max-width: 46%;
  }

  .cap-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 11px;
    border-radius: 999px;
    font-size: 12px;
    color: var(--c-text-regular);
    background: var(--c-bg-soft);
    border: 1px solid var(--c-border-light);

    .el-icon { color: var(--c-primary); }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

// ===== 主体两栏 =====
.agent-shell {
  flex: 1;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 14px;
  min-height: 0;
  overflow: hidden;
}

.side-panel,
.chat-panel {
  min-height: 0;
  height: 100%;
  border-radius: 18px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border-light);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

.side-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .side-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--c-border-light);
  }

  .side-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 700;
    color: var(--c-text-primary);

    .el-icon { color: var(--c-primary); }
  }

  .side-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px 16px;
  }
}

.prompt-group { margin-bottom: 14px; }

.prompt-group-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--c-text-muted);
  margin: 2px 2px 8px;

  .el-icon { color: var(--c-primary); }
}

.prompt-card {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
  padding: 11px 12px;
  border: 1px solid var(--c-border-light);
  border-radius: 14px;
  background: var(--c-bg-soft);
  text-align: left;
  line-height: 1.5;
  font-size: 13px;
  color: var(--c-text-regular);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  .prompt-text { flex: 1; }

  .prompt-arrow {
    color: var(--c-text-placeholder);
    transition: transform 0.18s ease, color 0.18s ease;
  }

  &:hover {
    transform: translateX(3px);
    border-color: var(--c-primary);
    box-shadow: 0 8px 20px color-mix(in srgb, var(--c-primary) 14%, transparent);

    .prompt-arrow { color: var(--c-primary); transform: translateX(2px); }
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
  padding: 20px 22px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--c-primary) 6%, transparent), transparent 45%),
    var(--c-bg-body);
}

// ===== 欢迎区 =====
.welcome {
  height: 100%;
  min-height: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  .welcome-icon {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    border-radius: 24px;
    color: #fff;
    background: linear-gradient(135deg, #6366f1, #0ea5e9);
    box-shadow: 0 16px 36px rgba(79, 70, 229, 0.3);
    margin-bottom: 18px;
  }

  h2 {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 800;
    color: var(--c-text-primary);
  }

  p {
    max-width: 520px;
    margin: 0 0 20px;
    line-height: 1.7;
    font-size: 13.5px;
    color: var(--c-text-secondary);
  }

  .welcome-chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }

  .chip {
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--c-border-light);
    background: var(--c-bg-card);
    color: var(--c-text-regular);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.18s ease;

    &:hover {
      border-color: var(--c-primary);
      color: var(--c-primary);
      box-shadow: 0 8px 18px color-mix(in srgb, var(--c-primary) 14%, transparent);
    }
  }
}

// ===== 消息 =====
.message-item {
  display: flex;
  gap: 12px;
  max-width: 82%;
  margin-bottom: 20px;

  &.user {
    flex-direction: row-reverse;
    margin-left: auto;
  }

  .msg-avatar {
    flex-shrink: 0;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    color: #fff;
    background: linear-gradient(135deg, #0f766e, #0ea5e9);
    box-shadow: 0 6px 14px rgba(13, 148, 136, 0.24);

    &.assistant {
      background: linear-gradient(135deg, #6366f1, #0ea5e9);
      box-shadow: 0 6px 14px rgba(79, 70, 229, 0.24);
    }
  }

  .msg-col { min-width: 0; }

  .message-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
    padding: 0 2px;
  }

  .role-label { font-size: 12px; font-weight: 700; color: var(--c-text-secondary); }
  .time-label { font-size: 11px; color: var(--c-text-muted); }

  .message-body {
    padding: 12px 15px;
    border-radius: 16px;
    border: 1px solid var(--c-border-light);
    background: var(--c-bg-card);
    color: var(--c-text-primary);
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
  }

  &.user .message-body {
    background: linear-gradient(135deg, #0f766e, #0ea5e9);
    color: #fff;
    border-color: transparent;
  }
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  padding: 3px 10px;
  font-size: 12px;
  color: var(--c-text-muted);
  background: transparent;
  border: 1px solid var(--c-border-light);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover { color: var(--c-primary); border-color: var(--c-primary); }

  .el-icon { font-size: 13px; }
}

.message-text {
  line-height: 1.75;
  word-break: break-word;
  font-size: 14px;

  :deep(p) { margin: 0 0 10px; }
  :deep(p:last-child) { margin-bottom: 0; }
  :deep(ul), :deep(ol) { margin: 0; padding-left: 20px; }

  :deep(code) {
    padding: 2px 6px;
    border-radius: 6px;
    background: var(--c-bg-soft);
    font-size: 0.92em;
  }

  :deep(pre) {
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--c-bg-soft);
    overflow-x: auto;

    :deep(code) { background: transparent; padding: 0; }
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;

    th, td { padding: 7px 10px; border: 1px solid var(--c-border-light); text-align: left; }
    th { background: var(--c-bg-soft); font-weight: 600; }
  }
}

.thinking {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--c-text-secondary);

  .tdot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--c-primary);
    animation: blink 1.2s infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes blink {
  0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
}

.tool-trace {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.trace-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  background: var(--c-bg-info-soft);
  color: var(--c-primary);
}

// ===== 输入区 =====
.composer {
  padding: 14px 16px 16px;
  border-top: 1px solid var(--c-border-light);
  background: var(--c-bg-card);

  .composer-box {
    border: 1px solid var(--c-border);
    border-radius: 16px;
    background: var(--c-bg-soft);
    padding: 6px 10px 8px;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;

    &:focus-within {
      border-color: var(--c-primary);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--c-primary) 12%, transparent);
    }
  }

  :deep(.el-textarea__inner) {
    border: none !important;
    box-shadow: none !important;
    background: transparent;
    padding: 8px 6px;
    font-size: 14px;
    line-height: 1.6;
  }

  .composer-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
  }

  .composer-tip { color: var(--c-text-muted); font-size: 12px; }

  .composer-btns { display: flex; align-items: center; gap: 8px; }

  :deep(.el-button--primary) {
    border-radius: 999px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #6366f1, #0ea5e9);
    border: none;
    box-shadow: 0 8px 18px rgba(79, 70, 229, 0.22);
  }
}

@media (max-width: 960px) {
  .agent-page { height: auto; max-height: none; overflow: visible; }

  .agent-shell { grid-template-columns: 1fr; overflow: visible; }

  .agent-header { flex-direction: column; align-items: flex-start; }

  .agent-caps { justify-content: flex-start; max-width: none; }

  .message-item { max-width: 100%; }

  .side-panel,
  .chat-panel { height: auto; }

  .side-panel .side-scroll { max-height: 40vh; }
}
</style>
