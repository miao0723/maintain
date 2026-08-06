<template>
  <div class="chat-chat">
    <!-- 左侧会话列表 -->
    <div class="chat-sidebar">
      <!-- 侧栏头部：知识库选择 + 新建对话 -->
      <div class="sidebar-header">
        <div class="sidebar-title">
          <el-icon><ChatDotRound /></el-icon>
          <span>AI 对话</span>
        </div>
        <div class="collection-select">
          <el-select
            v-model="selectedCollectionId"
            placeholder="选择知识库"
            style="width: 100%"
            @change="handleCollectionChange"
            size="default"
            popper-class="collection-popper"
          >
            <el-option
              v-for="col in allCollections"
              :key="col.id"
              :label="col.name"
              :value="col.id"
            >
              <div class="collection-option">
                <el-icon><Reading /></el-icon>
                <span>{{ col.name }}</span>
                <el-tag size="small" type="info" effect="plain">{{ col.file_count || 0 }}</el-tag>
              </div>
            </el-option>
          </el-select>
          <el-icon class="refresh-collections" @click="loadCollections" title="刷新知识库列表">
            <Refresh />
          </el-icon>
        </div>
        <el-button
          type="primary"
          :icon="Plus"
          class="new-session-btn"
          @click="createSession"
          :disabled="!selectedCollectionId"
        >
          新建对话
        </el-button>
      </div>

      <!-- 搜索会话 -->
      <div v-if="sessions.length > 0" class="session-search">
        <el-input
          v-model="sessionSearchKeyword"
          placeholder="搜索对话..."
          :prefix-icon="Search"
          size="small"
          clearable
        />
      </div>

      <!-- 会话列表 -->
      <div class="session-list">
        <div
          v-for="session in filteredSessions"
          :key="session.id"
          class="session-item"
          :class="{ active: currentSessionId === session.id }"
          @click="selectSession(session.id)"
        >
          <div class="session-icon-wrap">
            <el-icon class="session-icon"><ChatDotRound /></el-icon>
          </div>
          <div class="session-info">
            <span class="session-title">{{ session.title || '新对话' }}</span>
            <div class="session-meta">
              <span class="session-time">{{ formatTime(session.last_message_at) }}</span>
              <span v-if="session.message_count" class="session-msg-count">{{ session.message_count }} 条消息</span>
            </div>
          </div>
          <el-button
            class="delete-btn"
            :icon="Delete"
            circle
            size="small"
            text
            type="danger"
            @click.stop="handleDeleteSession(session.id)"
            title="删除对话"
          />
        </div>
        <div v-if="filteredSessions.length === 0" class="session-empty">
          <el-empty description="暂无对话" :image-size="48" />
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-main">
      <!-- 空状态：未选择会话 -->
      <div v-if="!currentSessionId" class="chat-empty">
        <div class="empty-graphic">
          <div class="empty-icon-ring">
            <el-icon :size="56" color="#409EFF"><ChatDotRound /></el-icon>
          </div>
        </div>
        <h3 class="empty-title">开始 AI 对话</h3>
        <p class="empty-desc">选择或创建一个对话，与知识库 AI 助手交流</p>
        <div v-if="selectedCollectionId" class="empty-stats">
          <div class="stat-item">
            <el-icon color="#409EFF"><Document /></el-icon>
            <span>{{ collectionFiles.length }} 个可用文件</span>
          </div>
          <div v-if="!useAllFiles && selectedFileIds.length > 0" class="stat-item">
            <el-icon color="#67C23A"><Check /></el-icon>
            <span>已选择 {{ selectedFileIds.length }} 个文件</span>
          </div>
        </div>
      </div>

      <!-- 对话区域 -->
      <template v-else>
        <!-- 会话头部 -->
        <div class="chat-header">
          <div class="chat-header-info">
            <el-icon class="header-back" @click="currentSessionId = null"><ArrowLeft /></el-icon>
            <div class="header-text">
              <span class="header-title">{{ currentSessionTitle }}</span>
              <span class="header-subtitle">{{ collectionFiles.length }} 个文件 · 知识库对话</span>
            </div>
          </div>
          <div class="header-actions">
            <el-button text circle :icon="Refresh" @click="loadMessages" title="刷新消息" />
            <el-button text circle :icon="Delete" @click="handleDeleteSession(currentSessionId)" title="删除对话" />
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="message-list" ref="messageListRef">
          <!-- 消息加载指示器 -->
          <div v-if="messagesLoading" class="messages-loading">
            <el-icon class="is-loading" :size="20"><Loading /></el-icon>
            <span>加载消息中...</span>
          </div>

          <!-- 空消息 -->
          <div v-else-if="messages.length === 0" class="empty-messages">
            <div class="empty-msg-graphic">
              <div class="empty-msg-ring">
                <el-icon :size="48" color="#C0C4CC"><ChatLineRound /></el-icon>
              </div>
            </div>
            <h4>开始提问</h4>
            <p>向知识库提问，AI 将基于上传的文件内容回答</p>
            <div class="quick-questions" v-if="quickQuestions.length > 0">
              <div class="quick-questions-label">试试这些问题：</div>
              <div class="quick-questions-list">
                <el-button
                  v-for="q in quickQuestions"
                  :key="q"
                  size="default"
                  class="quick-question-btn"
                  @click="sendMessage(q)"
                  :disabled="sending"
                >
                  <el-icon><ChatDotRound /></el-icon>
                  {{ q }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- 消息气泡 -->
          <div v-for="msg in messages" :key="msg.id" :class="['message-item', msg.role]">
            <div class="message-avatar">
              <el-avatar
                :size="40"
                v-if="msg.role === 'assistant'"
                class="ai-avatar"
              >
                <el-icon><Monitor /></el-icon>
              </el-avatar>
              <el-avatar
                :size="40"
                v-else
                class="user-avatar"
                :style="{ background: userColor }"
              >
                {{ userInitial }}
              </el-avatar>
            </div>
            <div class="message-content">
              <!-- 用户消息 -->
              <template v-if="msg.role === 'user'">
                <div v-if="msg.image_url" class="user-image">
                  <el-image
                    :src="getImageUrl(msg.image_url)"
                    fit="cover"
                    style="max-width: 260px; max-height: 260px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                    :preview-src-list="[getImageUrl(msg.image_url)]"
                  />
                </div>
                <div class="message-text user-text">{{ msg.content }}</div>
              </template>

              <!-- AI回复 -->
              <template v-else>
                <div class="message-text ai-text markdown-body" v-html="renderMarkdown(msg.content)"></div>
                <!-- 引用来源 -->
                <div v-if="msg.source_refs && msg.source_refs.length > 0" class="source-refs">
                  <el-collapse accordion>
                    <el-collapse-item>
                      <template #title>
                        <span class="refs-title">
                          <el-icon><DocumentCopy /></el-icon>
                          引用来源 ({{ msg.source_refs.length }})
                        </span>
                      </template>
                      <div v-for="(ref, idx) in msg.source_refs" :key="idx" class="ref-item">
                        <div class="ref-header">
                          <el-tag size="small" type="primary" effect="dark">{{ ref.file_name }}</el-tag>
                          <span class="ref-score">相关度: {{ Math.round(ref.score * 100) }}%</span>
                        </div>
                        <div class="ref-excerpt">{{ ref.excerpt }}</div>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </template>

              <div class="message-footer">
                <span class="message-time">{{ formatTime(msg.created_at) }}</span>
                <el-button
                  v-if="msg.role === 'assistant'"
                  class="copy-btn"
                  size="small"
                  text
                  :icon="CopyDocument"
                  @click="copyMessage(msg.content)"
                  title="复制消息"
                />
              </div>
            </div>
          </div>

          <!-- 加载中 -->
          <div v-if="sending" class="message-item assistant">
            <div class="message-avatar">
              <el-avatar :size="40" class="ai-avatar">
                <el-icon><Monitor /></el-icon>
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-text ai-text typing">
                <div class="typing-dots">
                  <span></span><span></span><span></span>
                </div>
                <span class="typing-hint">AI 正在思考...</span>
              </div>
            </div>
          </div>

          <!-- 底部锚点 -->
          <div ref="scrollAnchorRef" class="scroll-anchor"></div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <!-- 输入工具栏 -->
          <div class="input-toolbar">
            <div class="toolbar-left">
              <el-upload
                :show-file-list="false"
                :before-upload="handleImageSelect"
                accept="image/*"
              >
                <el-button
                  :icon="Picture"
                  text
                  class="toolbar-btn"
                  :disabled="sending || speech.is.listening.value"
                  title="上传图片"
                >
                  图片
                </el-button>
              </el-upload>
              <div v-if="selectedCollectionId" class="file-hint">
                <el-icon><Folder /></el-icon>
                <span v-if="useAllFiles">搜索全部文件</span>
                <span v-else>已选择 {{ selectedFileIds.length }} 个文件</span>
              </div>
            </div>
            <div class="toolbar-right">
              <span class="hint-text">Enter 发送 · Shift+Enter 换行</span>
            </div>
          </div>

          <!-- 图片预览 -->
          <transition name="image-preview-fade">
            <div class="input-image-preview" v-if="chatImageUrl">
              <el-image
                :src="chatImageUrl"
                fit="cover"
                style="width: 72px; height: 72px; border-radius: 8px"
              />
              <el-button
                class="remove-image"
                type="danger"
                :icon="Close"
                circle
                size="small"
                @click="chatImageUrl = ''"
              />
            </div>
          </transition>

          <!-- 输入行 -->
          <div class="input-row" :class="{ 'has-image': chatImageUrl }">
            <div v-if="selectedCollectionId" class="scope-trigger">
              <el-popover
                placement="top-start"
                :width="360"
                trigger="click"
                popper-class="scope-popper"
              >
                <template #reference>
                  <el-button
                    class="scope-btn"
                    :class="{ active: !useAllFiles }"
                    :disabled="sending || speech.is.listening.value"
                    circle
                    :title="useAllFiles ? '当前搜索全部文件' : `已选 ${selectedFileIds.length} 个文件`"
                  >
                    <el-icon><FolderOpened /></el-icon>
                  </el-button>
                </template>

                <div class="scope-panel">
                  <div class="scope-panel-header">
                    <div class="scope-panel-title">
                      <el-icon><FolderOpened /></el-icon>
                      <span>对话范围</span>
                    </div>
                    <span class="scope-panel-summary">
                      <template v-if="useAllFiles">全部 {{ collectionFiles.length }} 个文件</template>
                      <template v-else>已选 {{ selectedFileIds.length }} / {{ collectionFiles.length }}</template>
                    </span>
                  </div>

                  <div class="scope-mode-switch">
                    <el-switch
                      v-model="useAllFiles"
                      active-text="全部文件"
                      inactive-text="选择文件"
                      size="small"
                      class="file-switch"
                    />
                  </div>

                  <div v-if="!useAllFiles" class="file-selector popover-selector">
                    <div class="file-selector-inner">
                      <div class="file-select-all">
                        <el-checkbox
                          :indeterminate="selectedFileIds.length > 0 && selectedFileIds.length < collectionFiles.length"
                          :checked="selectedFileIds.length === collectionFiles.length"
                          @change="toggleSelectAll"
                        >
                          全选
                        </el-checkbox>
                        <span class="file-count-badge">{{ selectedFileIds.length }}/{{ collectionFiles.length }}</span>
                      </div>
                      <el-checkbox-group v-model="selectedFileIds" @change="handleFileSelectionChange">
                        <div
                          class="file-option"
                          v-for="file in collectionFiles"
                          :key="file.id"
                          :class="{ 'no-chunks': file.chunk_count === 0 }"
                        >
                          <el-checkbox :label="file.id" :value="file.id" :disabled="file.chunk_count === 0">
                            <div class="file-option-content">
                              <el-icon><Document /></el-icon>
                              <span class="file-name">{{ file.original_name }}</span>
                              <el-tag
                                v-if="file.chunk_count === 0"
                                size="small"
                                type="warning"
                                effect="plain"
                              >未分块</el-tag>
                              <el-tag
                                v-else
                                size="small"
                                type="success"
                                effect="plain"
                              >{{ file.chunk_count }} 块</el-tag>
                            </div>
                          </el-checkbox>
                        </div>
                      </el-checkbox-group>
                      <el-empty
                        v-if="collectionFiles.length === 0"
                        description="暂无文件"
                        :image-size="36"
                      />
                    </div>
                  </div>
                </div>
              </el-popover>
            </div>

            <div class="input-wrapper">
              <el-input
                v-model="inputMessage"
                type="textarea"
                :rows="1"
                :placeholder="speech.is.listening.value ? '正在听...' : '输入问题，与知识库 AI 对话...'"
                resize="none"
                autosize
                @keydown.enter.exact.prevent="sendMessage()"
                :disabled="sending || speech.is.listening.value"
              />
            </div>
            <div class="input-actions">
              <el-button
                :type="speech.is.listening.value ? 'danger' : 'default'"
                :icon="Microphone"
                @click="toggleVoiceInput"
                :disabled="sending"
                circle
                :title="speech.is.listening.value ? '停止录音' : '语音输入'"
                class="action-btn mic-btn"
                :class="{ 'is-recording': speech.is.listening.value }"
              />
              <el-button
                type="primary"
                :icon="Promotion"
                :loading="sending"
                @click="sendMessage"
                :disabled="!inputMessage.trim() || sending"
                circle
                title="发送"
                class="action-btn send-btn"
              />
            </div>
          </div>

          <!-- 语音预览 -->
          <transition name="voice-fade">
            <div v-if="speech.get.interimTranscript.value" class="voice-preview">
              <div class="voice-pulse">
                <span></span><span></span><span></span><span></span>
              </div>
              <div class="voice-text">
                <el-icon><Microphone /></el-icon>
                <span>{{ speech.get.transcript.value }}{{ speech.get.interimTranscript.value }}</span>
              </div>
            </div>
          </transition>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ChatDotRound, ChatLineRound, Delete, Monitor, Picture, Promotion,
  Refresh, Document, Check, DocumentCopy, CopyDocument, Folder, Close,
  Microphone, Plus, Reading, FolderOpened, ArrowLeft, Search, Loading
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getCollections, getChatSessions, createChatSession, deleteChatSession, getChatMessages, sendChatMessage, getFiles } from '@/api/knowledge'
import { uploadFile } from '@/api/system'
import { marked } from 'marked'
import { useSpeechRecognition } from '@/composables/useSpeechRecognition'

const speech = useSpeechRecognition()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 数据状态
const allCollections = ref([])
const selectedCollectionId = ref(null)
const collectionFiles = ref([])
const useAllFiles = ref(true)
const selectedFileIds = ref([])
const sessions = ref([])
const currentSessionId = ref(null)
const messages = ref([])
const inputMessage = ref('')
const chatImageUrl = ref('')
const sending = ref(false)
const messagesLoading = ref(false)
const messageListRef = ref(null)
const scrollAnchorRef = ref(null)
const quickQuestions = ref([])
const sessionSearchKeyword = ref('')

// 计算属性
const userColor = computed(() => {
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981']
  const index = (authStore.userInfo?.id || 0) % colors.length
  return colors[index]
})

const userInitial = computed(() => authStore.userInfo?.real_name?.charAt(0) || 'U')

const currentSessionTitle = computed(() => {
  const session = sessions.value.find(s => s.id === currentSessionId.value)
  return session?.title || '对话'
})

const filteredSessions = computed(() => {
  if (!sessionSearchKeyword.value) return sessions.value
  const kw = sessionSearchKeyword.value.toLowerCase()
  return sessions.value.filter(s =>
    s.title?.toLowerCase().includes(kw)
  )
})

// 工具方法
const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('data:')) return url
  return '/api' + url
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return '昨天'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const renderMarkdown = (content) => {
  if (!content) return ''
  try {
    return marked(content)
  } catch {
    return content
  }
}

const copyMessage = (content) => {
  navigator.clipboard.writeText(content).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 加载知识库
const loadCollections = async () => {
  try {
    const res = await getCollections({ pageSize: 100, status: 1 })
    allCollections.value = res.data?.list || []

    const queryCollectionId = route.query.collection_id
    if (queryCollectionId) {
      const id = parseInt(queryCollectionId)
      if (allCollections.value.find(c => c.id === id)) {
        selectedCollectionId.value = id
      } else if (allCollections.value.length > 0) {
        selectedCollectionId.value = allCollections.value[0].id
        ElMessage.warning('指定的知识库不存在，已切换到第一个知识库')
      }
    } else if (allCollections.value.length > 0) {
      selectedCollectionId.value = allCollections.value[0].id
    }

    if (selectedCollectionId.value) {
      await loadCollectionFiles()
      loadSessions()
    }
  } catch (e) {
    ElMessage.error('加载知识库列表失败')
  }
}

const loadCollectionFiles = async () => {
  if (!selectedCollectionId.value) return
  try {
    const res = await getFiles({
      collection_id: selectedCollectionId.value,
      pageSize: 100,
      chunk_status: 2
    })
    collectionFiles.value = res.data?.list || []
    quickQuestions.value = generateQuickQuestions()
  } catch (e) {
    collectionFiles.value = []
  }
}

const generateQuickQuestions = () => {
  if (collectionFiles.value.length === 0) return []
  const fileNames = collectionFiles.value.map(f => f.original_name).slice(0, 3)
  const questions = [
    '总结知识库的主要内容',
    '列出所有文档的关键信息',
    '帮我分析这些文档'
  ]
  fileNames.forEach(name => {
    questions.push(`关于${name}的内容`)
  })
  return questions.slice(0, 5)
}

const handleCollectionChange = () => {
  sessions.value = []
  currentSessionId.value = null
  messages.value = []
  selectedFileIds.value = []

  if (selectedCollectionId.value) {
    loadCollectionFiles()
    loadSessions()
  }
}

const toggleSelectAll = (checked) => {
  if (checked) {
    selectedFileIds.value = collectionFiles.value.filter(f => f.chunk_count > 0).map(f => f.id)
  } else {
    selectedFileIds.value = []
  }
}

const handleFileSelectionChange = () => {
  // 不做强制要求，允许选择0个文件
}

// 加载会话列表
const loadSessions = async () => {
  if (!selectedCollectionId.value) return
  try {
    const res = await getChatSessions({ collection_id: selectedCollectionId.value })
    sessions.value = res.data || []
  } catch (e) {
    ElMessage.error('加载会话列表失败')
  }
}

const loadMessages = async () => {
  if (!currentSessionId.value) return
  messagesLoading.value = true
  try {
    const res = await getChatMessages(currentSessionId.value)
    messages.value = res.data || []
    await nextTick()
    scrollToBottom()
  } catch (e) {
    ElMessage.error('加载消息失败')
  } finally {
    messagesLoading.value = false
  }
}

// 创建新会话
const createSession = async () => {
  if (!selectedCollectionId.value) {
    ElMessage.warning('请先选择知识库')
    return
  }

  try {
    const res = await createChatSession({
      collection_id: selectedCollectionId.value,
      title: '新对话'
    })
    sessions.value.unshift(res.data)
    selectSession(res.data.id)
  } catch (e) {
    ElMessage.error(e.message || '创建会话失败')
  }
}

// 选择会话
const selectSession = async (sessionId) => {
  currentSessionId.value = sessionId
  await loadMessages()
}

// 删除会话
const handleDeleteSession = async (sessionId) => {
  try {
    await ElMessageBox.confirm('确定删除此对话？此操作不可恢复。', '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await deleteChatSession(sessionId)
    sessions.value = sessions.value.filter(s => s.id !== sessionId)
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = null
      messages.value = []
    }
    ElMessage.success('已删除')
  } catch (e) {
    // 用户取消
  }
}

// 图片上传
const handleImageSelect = async (file) => {
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过10MB')
    return false
  }
  chatImageUrl.value = URL.createObjectURL(file)
  return false
}

// 语音输入
const toggleVoiceInput = () => {
  if (speech.is.listening.value) {
    speech.stop()
    const finalText = speech.get.transcript.value
    if (finalText.trim()) {
      inputMessage.value = finalText.trim()
      speech.reset()
    }
  } else {
    if (!speech.is.supported.value) {
      ElMessage.warning('您的浏览器不支持语音识别功能，请使用Chrome或Edge浏览器')
      return
    }
    speech.start()
  }
}

watch(() => speech.is.listening.value, (listening) => {
  if (!listening && speech.get.transcript.value) {
    inputMessage.value = speech.get.transcript.value.trim()
  }
})

// 更新本地会话标题
// 更新本地会话标题（用用户第一句话覆盖默认标题）
const updateSessionTitleLocally = (sessionId, title) => {
  const session = sessions.value.find(s => s.id === sessionId)
  if (
    session &&
    (session.title === '新对话' || session.title === '全部文件对话' || session.title?.startsWith('已选'))
  ) {
    session.title = title.slice(0, 30)
  }
}

// 发送消息
const sendMessage = async (quickQuestion = '') => {
  const message = quickQuestion || inputMessage.value.trim()
  if (!message || sending.value) return

  if (!selectedCollectionId.value) {
    ElMessage.warning('请先选择知识库')
    return
  }

  // 如果当前没有活跃会话，自动创建（直接用第一句话作为标题）
  if (!currentSessionId.value) {
    try {
      const res = await createChatSession({
        collection_id: selectedCollectionId.value,
        title: message.slice(0, 30)
      })
      sessions.value.unshift(res.data)
      currentSessionId.value = res.data.id
    } catch (e) {
      ElMessage.error('创建会话失败')
      return
    }
  }

  let imageUrl = chatImageUrl.value

  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
    try {
      const file = await fetch(imageUrl).then(r => r.blob())
      const formData = new FormData()
      formData.append('file', file, 'chat_image.jpg')
      const uploadRes = await uploadFile(formData)
      imageUrl = uploadRes.data?.url || ''
    } catch (e) {
      ElMessage.error('图片上传失败')
      imageUrl = ''
    }
  }

  // 先插入用户消息到本地
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: message,
    image_url: imageUrl,
    created_at: new Date().toISOString()
  })

  inputMessage.value = ''
  chatImageUrl.value = ''
  sending.value = true

  await nextTick()
  scrollToBottom()

  try {
    let contextMessage = message
    const requestData = {
      message: contextMessage,
      image_url: imageUrl || undefined
    }

    if (!useAllFiles.value) {
      if (selectedFileIds.value.length > 0) {
        const selectedFiles = collectionFiles.value.filter(f => selectedFileIds.value.includes(f.id))
        const fileNames = selectedFiles.map(f => f.original_name).join('、')
        contextMessage = `[请基于以下文件回答: ${fileNames}] ${message}`
        requestData.message = contextMessage
        requestData.file_ids = selectedFileIds.value
      }
    }

    const res = await sendChatMessage(currentSessionId.value, requestData)

    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: res.data?.content || '抱歉，未能获取回答',
      source_refs: res.data?.sources || [],
      created_at: new Date().toISOString()
    })

    // 更新会话标题为第一条消息（前端立即更新，不等后端）
    const hasOnlyWelcome = messages.value.filter(m => m.role === 'user').length === 1
    if (hasOnlyWelcome) {
      updateSessionTitleLocally(currentSessionId.value, message)
    }
  } catch (e) {
    const errorMsg = e.message || '未知错误'
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: errorMsg.includes('请指定知识库ID')
        ? '请先选择知识库'
        : '抱歉，AI回复失败：' + errorMsg,
      source_refs: [],
      created_at: new Date().toISOString()
    })
  } finally {
    sending.value = false
    await nextTick()
    scrollToBottom()
  }
}

const scrollToBottom = () => {
  if (scrollAnchorRef.value) {
    scrollAnchorRef.value.scrollIntoView({ behavior: 'smooth' })
  } else if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

onMounted(() => {
  loadCollections()
})

watch(() => route.query.collection_id, (newId) => {
  if (newId) {
    const id = parseInt(newId)
    if (selectedCollectionId.value !== id) {
      selectedCollectionId.value = id
      handleCollectionChange()
    }
  }
})

watch(useAllFiles, (newValue) => {
  if (newValue) {
    selectedFileIds.value = []
  }
})
</script>

<style lang="scss" scoped>
// ========================
// 变量
// ========================
$primary: #6366F1;
$primary-light: #818CF8;
$primary-bg: #EEF2FF;
$success: #10B981;
$warning: #F59E0B;
$danger: #EF4444;
$text-primary: #1E293B;
$text-secondary: #64748B;
$text-muted: #94A3B8;
$border: #E2E8F0;
$bg-page: #F1F5F9;
$bg-card: #FFFFFF;
$sidebar-width: 340px;
$radius-sm: 8px;
$radius-md: 12px;
$radius-lg: 16px;
$radius-xl: 20px;
$shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
$shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
$shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
$transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

// ========================
// 布局
// ========================
.chat-chat {
  display: flex;
  height: calc(100vh - 140px);
  position: relative;
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.18), transparent 24%),
    radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.14), transparent 22%),
    linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%);
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.1);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(transparent 96%, rgba(148, 163, 184, 0.08) 100%),
      linear-gradient(90deg, transparent 96%, rgba(148, 163, 184, 0.08) 100%);
    background-size: 28px 28px;
    opacity: 0.24;
    pointer-events: none;
  }
}

// ========================
// 左侧栏
// ========================
.chat-sidebar {
  width: $sidebar-width;
  background: rgba(255, 255, 255, 0.88);
  border-right: 1px solid $border;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  backdrop-filter: blur(18px);
  position: relative;
  z-index: 1;

  .sidebar-header {
    padding: 20px 20px 16px;
    border-bottom: 1px solid $border;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.7));

    .sidebar-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 700;
      color: $text-primary;
      margin-bottom: 16px;

      .el-icon { color: $primary; font-size: 20px; }
    }

    .collection-select {
      position: relative;
      margin-bottom: 12px;

      .refresh-collections {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 14px;
        color: $text-muted;
        cursor: pointer;
        z-index: 10;
        transition: $transition;
        padding: 4px;
        border-radius: 6px;

        &:hover {
          color: $primary;
          background: $primary-bg;
        }
      }
    }

    .new-session-btn {
      width: 100%;
      border-radius: 14px;
      height: 40px;
      font-weight: 600;
      border: none;
      background: linear-gradient(135deg, #4F46E5 0%, #2563EB 100%);
      box-shadow: 0 14px 24px rgba($primary, 0.22);
      transition: $transition;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba($primary, 0.35);
      }
    }
  }

  // 会话搜索
  .session-search {
    padding: 12px 16px 8px;
  }

  // 会话列表
  .session-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 16px 16px;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb {
      background: $border;
      border-radius: 2px;
    }

    .session-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: $radius-md;
      cursor: pointer;
      margin-bottom: 6px;
      transition: $transition;
      background: transparent;
      border: 1px solid transparent;
      position: relative;

      &:hover {
        background: #F8FAFC;
        border-color: $border;

        .delete-btn { opacity: 1; }
      }

      &.active {
        background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
        border-color: $primary;
        box-shadow: 0 4px 16px rgba($primary, 0.3);

        .session-icon-wrap {
          background: rgba(255, 255, 255, 0.2);
          .session-icon { color: #fff; }
        }

        .session-title { color: #fff; }
        .session-meta { color: rgba(255, 255, 255, 0.8); }

        .delete-btn {
          opacity: 1;
          color: rgba(255, 255, 255, 0.8);
          &:hover { color: #fff; background: rgba(255, 255, 255, 0.15); }
        }
      }

      .session-icon-wrap {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        background: $bg-page;
        flex-shrink: 0;
        transition: $transition;

        .session-icon {
          font-size: 18px;
          color: $text-muted;
        }
      }

      .session-info {
        flex: 1;
        min-width: 0;

        .session-title {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: $text-primary;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 4px;
        }

        .session-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: $text-muted;

          .session-msg-count {
            background: $bg-page;
            padding: 0 6px;
            border-radius: 4px;
          }
        }
      }

      .delete-btn {
        opacity: 0;
        flex-shrink: 0;
        transition: $transition;
        width: 28px;
        height: 28px;
      }
    }

    .session-empty {
      padding: 40px 0;
    }
  }
}

// ========================
// 右侧主区域
// ========================
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.38) 0%, rgba(248, 250, 252, 0.7) 100%);
  min-width: 0;
  position: relative;
  z-index: 1;

  // 空状态
  .chat-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 40px;

    .empty-graphic {
      margin-bottom: 28px;

      .empty-icon-ring {
        width: 120px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: linear-gradient(135deg, $primary-bg 0%, #E0E7FF 100%);
        animation: float 3s ease-in-out infinite;
        box-shadow: 0 8px 32px rgba($primary, 0.15);
      }
    }

    .empty-title {
      margin: 0 0 12px;
      font-size: 24px;
      font-weight: 700;
      color: $text-primary;
    }

    .empty-desc {
      margin: 0 0 32px;
      color: $text-secondary;
      font-size: 15px;
    }

    .empty-stats {
      display: flex;
      gap: 16px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: $text-secondary;
        font-size: 14px;
        padding: 12px 20px;
        background: $bg-card;
        border-radius: $radius-md;
        box-shadow: $shadow-sm;
        border: 1px solid $border;

        .el-icon { font-size: 18px; }
      }
    }
  }

  // 会话头部
  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid $border;
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(14px);
    flex-shrink: 0;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);

    .chat-header-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-back {
        font-size: 20px;
        color: $text-muted;
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        transition: $transition;

        &:hover {
          color: $primary;
          background: $primary-bg;
        }
      }

      .header-text {
        display: flex;
        flex-direction: column;

        .header-title {
          font-size: 16px;
          font-weight: 600;
          color: $text-primary;
        }

        .header-subtitle {
          font-size: 12px;
          color: $text-muted;
          margin-top: 2px;
        }
      }
    }

    .header-actions {
      display: flex;
      gap: 4px;

      .el-button {
        color: $text-muted;
        &:hover { color: $primary; background: $primary-bg; }
      }
    }
  }

  // 消息列表
  .message-list {
    flex: 1;
    overflow-y: auto;
    padding: 24px 32px;

    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-thumb {
      background: $border;
      border-radius: 3px;
    }

    .messages-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 40px;
      color: $text-muted;
      font-size: 14px;
    }

    .empty-messages {
      text-align: center;
      padding: 60px 40px;

      .empty-msg-graphic {
        margin-bottom: 20px;

        .empty-msg-ring {
          width: 88px;
          height: 88px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: $bg-page;
          margin: 0 auto;
        }
      }

      h4 {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 600;
        color: $text-primary;
      }

      p {
        margin: 0 0 32px;
        color: $text-secondary;
        font-size: 14px;
      }

      .quick-questions {
        .quick-questions-label {
          margin-bottom: 16px;
          font-size: 14px;
          color: $text-muted;
          font-weight: 500;
        }

        .quick-questions-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
        }

        .quick-question-btn {
          border: 1px solid $border;
          background: $bg-card;
          color: $text-secondary;
          border-radius: $radius-sm;
          padding: 10px 18px;
          height: auto;
          font-size: 13px;
          transition: $transition;

          .el-icon {
            margin-right: 4px;
            color: $primary;
          }

          &:hover {
            border-color: $primary;
            color: $primary;
            background: $primary-bg;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba($primary, 0.15);
          }
        }
      }
    }

    // 消息条
    .message-item {
      display: flex;
      gap: 16px;
      margin-bottom: 28px;
      animation: messageIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);

      &.user {
        flex-direction: row-reverse;

        .message-avatar {
          .user-avatar {
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
          }
        }

        .message-content {
          align-items: flex-end;

          .user-text {
            background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
            color: #fff;
            box-shadow: 0 4px 14px rgba($primary, 0.25);
          }
        }
      }

      &.assistant {
        .message-avatar {
          .ai-avatar {
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%) !important;
            box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
          }
        }
      }

      .message-avatar {
        flex-shrink: 0;
      }

      .message-content {
        display: flex;
        flex-direction: column;
        max-width: 72%;
        position: relative;

        .user-image {
          margin-bottom: 8px;
        }

        .message-text {
          padding: 14px 20px;
          border-radius: 18px;
          font-size: 15px;
          line-height: 1.7;
          word-break: break-word;
          position: relative;
          transition: $transition;

          &.user-text {
            border-bottom-right-radius: 6px;
          }

          &.ai-text {
            background: rgba(255, 255, 255, 0.94);
            color: $text-primary;
            box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
            border: 1px solid $border;
            border-bottom-left-radius: 6px;

            // Markdown 内容样式
            :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
              margin: 14px 0 10px;
              font-weight: 600;
              &:first-child { margin-top: 0; }
            }
            :deep(h1) { font-size: 1.4em; }
            :deep(h2) { font-size: 1.25em; }
            :deep(h3) { font-size: 1.1em; }
            :deep(p) { margin: 8px 0; &:first-child { margin-top: 0; } &:last-child { margin-bottom: 0; } }
            :deep(ul), :deep(ol) {
              padding-left: 24px;
              margin: 8px 0;
            }
            :deep(li) { margin: 4px 0; }
            :deep(code) {
              background: #F1F5F9;
              padding: 3px 8px;
              border-radius: 6px;
              font-size: 13px;
              font-family: 'JetBrains Mono', 'Consolas', monospace;
              color: #E11D48;
            }
            :deep(pre) {
              background: #1E293B;
              color: #E2E8F0;
              padding: 16px 20px;
              border-radius: 12px;
              overflow-x: auto;
              margin: 12px 0;
              position: relative;

              code {
                background: transparent;
                color: inherit;
                padding: 0;
                font-size: 13px;
                line-height: 1.6;
              }
            }
            :deep(table) {
              border-collapse: collapse;
              margin: 12px 0;
              width: 100%;
              font-size: 14px;
              th, td {
                border: 1px solid $border;
                padding: 10px 14px;
                text-align: left;
              }
              th {
                background: #F8FAFC;
                font-weight: 600;
              }
              tr:nth-child(even) { background: #FAFBFC; }
            }
            :deep(blockquote) {
              margin: 12px 0;
              padding: 12px 18px;
              border-left: 4px solid $primary;
              background: $primary-bg;
              border-radius: 0 8px 8px 0;
              color: $text-secondary;
            }
            :deep(a) {
              color: $primary;
              text-decoration: none;
              font-weight: 500;
              &:hover { text-decoration: underline; }
            }
            :deep(img) {
              max-width: 100%;
              border-radius: $radius-sm;
              margin: 8px 0;
            }
            :deep(hr) {
              border: none;
              border-top: 1px solid $border;
              margin: 16px 0;
            }
          }

          &.typing {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 18px 24px;
            background: $bg-card;
            border: 1px solid $border;

            .typing-dots {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              flex-shrink: 0;

              span {
                width: 10px;
                height: 10px;
                background: $primary;
                border-radius: 50%;
                animation: typingBounce 1.4s infinite;

                &:nth-child(2) { animation-delay: 0.2s; }
                &:nth-child(3) { animation-delay: 0.4s; }
              }
            }

            .typing-hint {
              font-size: 13px;
              color: $text-muted;
              margin-left: 2px;
              line-height: 1;
              white-space: nowrap;
              animation: pulse 2s infinite;
            }
          }
        }

        // 引用来源
        .source-refs {
          margin-top: 12px;

          .refs-title {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: $text-secondary;
            font-weight: 500;
          }

          :deep(.el-collapse-item__header) {
            height: 36px;
            line-height: 36px;
            font-size: 13px;
            border: none;
            padding: 0 14px;
            background: #F8FAFC;
            border-radius: $radius-sm $radius-sm 0 0;
          }

          :deep(.el-collapse-item__wrap) {
            border: 1px solid $border;
            border-top: none;
            background: $bg-card;
            border-radius: 0 0 $radius-sm $radius-sm;
          }

          .ref-item {
            padding: 14px;
            margin-bottom: 8px;
            background: #FAFBFC;
            border-radius: $radius-sm;
            border: 1px solid $border;

            &:last-child { margin-bottom: 0; }

            .ref-header {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 8px;

              .ref-score {
                font-size: 12px;
                color: $text-muted;
              }
            }

            .ref-excerpt {
              font-size: 13px;
              color: $text-secondary;
              line-height: 1.6;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
          }
        }

        // 消息底部
        .message-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
          padding: 0 4px;

          .message-time {
            font-size: 12px;
            color: $text-muted;
          }

          .copy-btn {
            opacity: 0;
            transition: $transition;
            color: $text-muted;
            width: 24px;
            height: 24px;
            padding: 0;

            &:hover { color: $primary; }
          }
        }
      }

      &:hover .copy-btn {
        opacity: 1;
      }
    }

    .scroll-anchor {
      height: 1px;
    }
  }

  // ========================
  // 输入区域
  // ========================
  .input-area {
    border-top: 1px solid $border;
    padding: 16px 24px 20px;
    background: rgba(255, 255, 255, 0.78);
    backdrop-filter: blur(18px);
    box-shadow: 0 -10px 30px rgba(15, 23, 42, 0.04);
    flex-shrink: 0;

    // 工具栏
    .input-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 8px;

        .toolbar-btn {
          font-size: 13px;
          color: $text-secondary;
          padding: 4px 10px;
          border-radius: 6px;

          &:hover { color: $primary; background: $primary-bg; }
        }

        .file-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: $bg-page;
          border-radius: 6px;
          font-size: 12px;
          color: $text-secondary;

          .el-icon { font-size: 14px; color: $primary; }
        }
      }

      .toolbar-right {
        .hint-text {
          font-size: 12px;
          color: $text-muted;
        }
      }
    }

    // 图片预览
    .input-image-preview {
      position: relative;
      display: inline-block;
      margin-bottom: 10px;

      .remove-image {
        position: absolute;
        top: -8px;
        right: -8px;
        font-size: 14px;
        padding: 4px;
      }
    }

    // 输入行
    .input-row {
      display: flex;
      gap: 10px;
      align-items: flex-end;

      .scope-trigger {
        flex-shrink: 0;
        padding-bottom: 2px;

        .scope-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: 1px solid $border;
          background: rgba(248, 250, 252, 0.95);
          color: $text-secondary;
          transition: $transition;

          &:hover {
            color: $primary;
            border-color: rgba($primary, 0.35);
            background: rgba(255, 255, 255, 0.98);
          }

          &.active {
            color: $primary;
            border-color: rgba($primary, 0.45);
            background: $primary-bg;
            box-shadow: 0 10px 22px rgba($primary, 0.16);
          }

          .el-icon {
            font-size: 18px;
          }
        }
      }

      .input-wrapper {
        flex: 1;

        :deep(.el-textarea) {
          .el-textarea__inner {
            border-radius: 18px;
            padding: 12px 16px;
            font-size: 14px;
            line-height: 1.6;
            resize: none;
            min-height: 44px;
            max-height: 120px;
            border: 1px solid $border;
            background: rgba(248, 250, 252, 0.92);
            transition: $transition;

            &:focus {
              box-shadow: 0 0 0 3px rgba($primary, 0.12);
              border-color: $primary;
              background: rgba(255, 255, 255, 0.98);
            }

            &::placeholder {
              color: $text-muted;
            }
          }
        }
      }

      .input-actions {
        display: flex;
        gap: 8px;
        padding-bottom: 2px;

        .action-btn {
          width: 44px;
          height: 44px;
          font-size: 18px;
          transition: $transition;

          &.mic-btn {
            background: #F8FAFC;
            border: 1px solid $border;
            color: $text-muted;

            &:hover {
              background: #F1F5F9;
              color: $text-secondary;
              border-color: $border;
            }

            &.is-recording {
              background: #FEF2F2;
              border-color: #FECACA;
              color: $danger;
              animation: recordingPulse 1.5s ease-in-out infinite;
            }
          }

          &.send-btn {
            background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
            border: none;
            box-shadow: 0 4px 12px rgba($primary, 0.3);

            &:hover:not(:disabled) {
              transform: translateY(-1px);
              box-shadow: 0 6px 20px rgba($primary, 0.4);
            }

            &:active:not(:disabled) {
              transform: translateY(0);
            }
          }
        }
      }
    }

    // 语音预览
    .voice-preview {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 18px;
      background: linear-gradient(135deg, $primary-bg 0%, #E0E7FF 100%);
      border-radius: $radius-md;
      border: 1px solid $primary;
      margin-top: 10px;

      .voice-pulse {
        display: flex;
        align-items: center;
        gap: 3px;

        span {
          width: 4px;
          height: 16px;
          background: $primary;
          border-radius: 2px;
          animation: voiceWave 1s ease-in-out infinite;

          &:nth-child(2) { animation-delay: 0.15s; height: 24px; }
          &:nth-child(3) { animation-delay: 0.3s; height: 12px; }
          &:nth-child(4) { animation-delay: 0.45s; height: 20px; }
        }
      }

      .voice-text {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        font-size: 13px;
        color: $primary;

        .el-icon { font-size: 16px; }
        span { flex: 1; }
      }
    }
  }
}

:deep(.chat-chat .el-input__wrapper),
:deep(.chat-chat .el-select__wrapper) {
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.88);
  box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.95);
}

:deep(.chat-chat .el-input__wrapper.is-focus),
:deep(.chat-chat .el-select__wrapper.is-focused) {
  box-shadow:
    inset 0 0 0 1px rgba(99, 102, 241, 0.95),
    0 0 0 4px rgba(99, 102, 241, 0.12);
}

:deep(.chat-chat .el-switch.is-checked .el-switch__core) {
  border-color: $primary;
  background: linear-gradient(135deg, $primary, $primary-light);
}

:deep(.scope-popper) {
  border-radius: 18px !important;
  border: 1px solid rgba(226, 232, 240, 0.95) !important;
  box-shadow: 0 24px 56px rgba(15, 23, 42, 0.16) !important;
  padding: 12px !important;

  .scope-panel {
    .scope-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;

      .scope-panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
        color: $text-primary;
        font-size: 14px;
        font-weight: 700;
      }

      .scope-panel-summary {
        color: $text-secondary;
        font-size: 12px;
        font-weight: 600;
      }
    }

    .scope-mode-switch {
      padding-bottom: 12px;

      .file-switch {
        :deep(.el-switch__label) {
          font-size: 12px;
          color: $text-muted;
        }

        :deep(.el-switch__label.is-active) {
          color: $primary;
        }
      }
    }

    .popover-selector {
      .file-selector-inner {
        max-height: 280px;
        overflow-y: auto;
        padding: 12px;
        border-radius: 14px;
        background: rgba(248, 250, 252, 0.72);
        border: 1px solid rgba(226, 232, 240, 0.95);

        &::-webkit-scrollbar { width: 4px; }
        &::-webkit-scrollbar-thumb {
          background: $border;
          border-radius: 2px;
        }
      }

      .file-select-all {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 0 10px;
        border-bottom: 1px solid $border;
        margin-bottom: 8px;

        .file-count-badge {
          font-size: 12px;
          color: $text-muted;
          background: $bg-card;
          padding: 2px 8px;
          border-radius: 999px;
        }
      }

      .file-option {
        padding: 8px 10px;
        border-radius: 10px;
        transition: $transition;

        &:hover {
          background: $primary-bg;
        }

        &.no-chunks {
          opacity: 0.6;
        }

        .file-option-content {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: 8px;

          .file-name {
            flex: 1;
            font-size: 13px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }
}

// ========================
// 动画
// ========================
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes recordingPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba($danger, 0.4);
  }
  50% {
    box-shadow: 0 0 0 12px rgba($danger, 0);
  }
}

@keyframes voiceWave {
  0%, 100% { transform: scaleY(0.5); }
  50% { transform: scaleY(1); }
}

// ========================
// 过渡动画
// ========================
.file-select-slide-enter-active,
.file-select-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.file-select-slide-enter-from,
.file-select-slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.file-select-slide-enter-to,
.file-select-slide-leave-from {
  max-height: 300px;
  opacity: 1;
}

.image-preview-fade-enter-active,
.image-preview-fade-leave-active {
  transition: all 0.3s ease;
}

.image-preview-fade-enter-from,
.image-preview-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.voice-fade-enter-active,
.voice-fade-leave-active {
  transition: all 0.3s ease;
}

.voice-fade-enter-from,
.voice-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 1200px) {
  .chat-chat {
    height: calc(100vh - 124px);
  }

  .chat-sidebar {
    width: 310px;
  }

  .chat-main {
    .message-list {
      padding: 20px 22px;

      .message-item {
        .message-content {
          max-width: 82%;
        }
      }
    }
  }
}

@media (max-width: 900px) {
  .chat-chat {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 124px);
  }

  .chat-sidebar {
    width: 100%;
    max-height: 42vh;
    border-right: none;
    border-bottom: 1px solid $border;
  }

  .chat-main {
    min-height: 58vh;
  }
}

@media (max-width: 640px) {
  .chat-main {
    .chat-header {
      padding: 14px 16px;
    }

    .message-list {
      padding: 16px 14px;

      .message-item {
        gap: 10px;

        .message-avatar {
          :deep(.el-avatar) {
            width: 34px;
            height: 34px;
          }
        }

        .message-content {
          max-width: calc(100% - 44px);

          .message-text {
            padding: 12px 14px;
            font-size: 14px;
          }
        }
      }
    }

    .input-area {
      padding: 14px 14px 16px;

      .input-toolbar {
        align-items: flex-start;
        flex-direction: column;
        gap: 8px;
      }
    }
  }
}
</style>

<!-- 全局样式：覆盖 Element Plus 下拉菜单 -->
<style lang="scss">
.collection-popper {
  .collection-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 0;

    .el-icon {
      font-size: 16px;
      color: #6366F1;
    }

    span {
      flex: 1;
      font-size: 13px;
    }

    .el-tag {
      flex-shrink: 0;
      font-size: 11px;
    }
  }

  .el-select-dropdown__item {
    &.selected {
      .collection-option {
        .el-icon { color: #6366F1; }
        span { color: #6366F1; font-weight: 600; }
      }
    }
  }
}
</style>
