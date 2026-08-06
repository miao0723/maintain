<template>
  <div class="detail-page">
    <!-- 顶部信息 -->
    <div class="detail-header">
      <el-button icon="ArrowLeft" @click="goBack">返回</el-button>
      <div class="header-info" v-if="collection">
        <h2>{{ collection.name }}</h2>
        <p>{{ collection.description || '暂无描述' }}</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="Upload" @click="uploadDialogVisible = true">上传文件</el-button>
        <el-button type="success" icon="ChatDotRound" @click="goToChat">AI 对话</el-button>
      </div>
    </div>

    <!-- 上传进度 -->
    <div v-if="uploadingFiles.length > 0" class="upload-progress">
      <div v-for="file in uploadingFiles" :key="file.name" class="progress-item">
        <span class="file-name">{{ file.name }}</span>
        <el-progress :percentage="file.progress" :status="file.status" />
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="file-list-container">
      <div class="list-header">
        <span class="file-count">文件列表 ({{ total }})</span>
        <el-button size="small" icon="Refresh" @click="loadFiles">刷新</el-button>
      </div>

      <div v-loading="loading" class="file-grid">
        <div v-for="file in files" :key="file.id" class="file-card">
          <div class="file-cover">
            <template v-if="isImageFile(file)">
              <div class="image-cover" v-loading="!getImageDataUrl(file.id)">
                <img
                  v-if="getImageDataUrl(file.id)"
                  :src="getImageDataUrl(file.id)"
                  class="cover-thumbnail"
                  alt="文件预览"
                  @click="previewImage(file.id)"
                />
                <div v-else class="cover-loading">
                  <span>加载中...</span>
                </div>
                <div class="image-badge" v-if="getImageDataUrl(file.id)">
                  <span>🖼️ 图片</span>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="icon-cover" :class="getFileCoverClass(file)">
                <div class="icon-wrapper">
                  <div class="icon-inner">
                    <span class="file-emoji">{{ getFileIcon(file) }}</span>
                  </div>
                  <div class="file-type-badge">{{ getFileExt(file)?.toUpperCase() }}</div>
                </div>
                <div class="cover-accent"></div>
              </div>
            </template>
          </div>
          <div class="file-info">
            <div class="file-name" :title="file.original_name">{{ file.original_name }}</div>
            <div class="file-meta">
              <el-tag size="small" type="info">{{ getFileExt(file)?.toUpperCase() }}</el-tag>
              <span class="file-size">{{ formatSize(file.file_size) }}</span>
            </div>
            <div class="file-status">
              <el-tag :type="chunkStatusType(file.chunk_status)" size="small">
                <el-icon v-if="file.chunk_status === 1" class="is-loading"><Loading /></el-icon>
                {{ chunkStatusText(file.chunk_status) }}
              </el-tag>
              <span v-if="file.chunk_count" class="chunk-info">{{ file.chunk_count }}块 · {{ file.text_char_count?.toLocaleString() || 0 }}字</span>
            </div>
            <div class="file-date">{{ file.created_at }}</div>
          </div>
          <div class="file-actions">
            <el-button size="small" type="primary" link @click="viewFileDetail(file)">查看</el-button>
            <el-button size="small" type="success" link @click="handleDownload(file)">下载</el-button>
            <el-button size="small" type="warning" link @click="handleReprocess(file)">重处理</el-button>
            <el-popconfirm title="确定删除此文件？" @confirm="handleDelete(file)">
              <template #reference>
                <el-button size="small" type="danger" link>删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
        <div v-if="files.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无文件" />
        </div>
      </div>

      <div class="pagination-wrap" v-if="total > 0">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadFiles"
        />
      </div>
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传文件"
      width="600px"
      destroy-on-close
    >
      <el-upload
        ref="uploadRef"
        :action="uploadAction"
        :headers="uploadHeaders"
        :data="{ collection_id: collectionId }"
        :before-upload="beforeUpload"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :on-progress="handleUploadProgress"
        multiple
        drag
        :show-file-list="false"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.ppt,.pptx,.csv,.jpg,.jpeg,.png,.gif,.bmp,.webp"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖拽文件到此处或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">
            支持 PDF、DOC/DOCX、XLS/XLSX、PPT/PPTX、TXT、MD、CSV、图片等格式，单文件不超过100MB
          </div>
        </template>
      </el-upload>
    </el-dialog>

    <!-- 文件详情对话框（源文件 + 提取文本 + 文本块 + AI分析） -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentFile?.original_name"
      width="800px"
      destroy-on-close
      top="5vh"
    >
      <div class="file-detail" v-loading="detailLoading">
        <el-tabs v-model="detailTab">
          <!-- 源文件预览 -->
          <el-tab-pane label="源文件" name="source">
            <div class="source-preview">
              <!-- 图片文件预览 -->
              <template v-if="isImageFile(currentFile)">
                <div class="image-preview-wrapper">
                  <img
                    v-if="sourceFileContent?.data_url"
                    :src="sourceFileContent.data_url"
                    class="detail-image-preview"
                    alt="文件预览"
                    @click="previewImage(currentFile?.id)"
                    style="cursor: zoom-in"
                  />
                  <div v-else class="loading-image">加载中...</div>
                </div>
              </template>

              <!-- PDF文件预览 -->
              <template v-else-if="isPdfFile(currentFile)">
                <div class="pdf-preview-wrapper">
                  <div class="file-info-header">
                    <span class="file-path" :title="currentFile?.local_path">
                      📄 {{ currentFile?.original_name }}
                    </span>
                    <el-tag size="small" type="info">PDF 文件</el-tag>
                  </div>
                  <div class="pdf-actions">
                    <el-button type="primary" @click="openPdfInNewWindow">在新窗口中打开</el-button>
                    <el-button @click="handleDownload(currentFile)">下载文件</el-button>
                  </div>
                  <p class="preview-hint">PDF文件内容已在浏览器中打开，无法在此处直接显示</p>
                </div>
              </template>

              <!-- Office文件预览 -->
              <template v-else-if="isOfficeFile(currentFile)">
                <div class="office-preview-wrapper">
                  <div class="file-info-header">
                    <span class="file-path" :title="currentFile?.original_name">
                      📊 {{ currentFile?.original_name }}
                    </span>
                    <el-tag size="small" type="info">{{ getFileExt(currentFile)?.toUpperCase() }} 文件</el-tag>
                  </div>
                  <div class="office-actions">
                    <el-button type="primary" @click="handleDownload(currentFile)">下载文件查看</el-button>
                  </div>
                  <p class="preview-hint">{{ getFileExt(currentFile)?.toUpperCase() }}文件需要下载后用Office或其他支持的应用程序打开</p>
                </div>
              </template>

              <!-- 视频/音频文件预览 -->
              <template v-else-if="isVideoFile(currentFile) || isAudioFile(currentFile)">
                <div class="media-preview-wrapper">
                  <div class="file-info-header">
                    <span class="file-path" :title="currentFile?.original_name">
                      {{ isVideoFile(currentFile) ? '🎬' : '🎵' }} {{ currentFile?.original_name }}
                    </span>
                    <el-tag size="small" type="info">{{ isVideoFile(currentFile) ? '视频' : '音频' }}文件</el-tag>
                  </div>
                  <div class="media-actions">
                    <el-button type="primary" @click="openMediaInNewWindow">在新窗口中播放</el-button>
                    <el-button @click="handleDownload(currentFile)">下载文件</el-button>
                  </div>
                  <p class="preview-hint">{{ isVideoFile(currentFile) ? '视频' : '音频' }}文件需要在浏览器中播放</p>
                </div>
              </template>

              <!-- 压缩文件 -->
              <template v-else-if="isArchiveFile(currentFile)">
                <div class="archive-preview-wrapper">
                  <div class="file-info-header">
                    <span class="file-path" :title="currentFile?.original_name">
                      📦 {{ currentFile?.original_name }}
                    </span>
                    <el-tag size="small" type="info">压缩文件</el-tag>
                  </div>
                  <div class="archive-actions">
                    <el-button type="primary" @click="handleDownload(currentFile)">下载文件</el-button>
                  </div>
                  <p class="preview-hint">压缩文件需要下载后解压查看</p>
                </div>
              </template>

              <!-- 文本文件预览 -->
              <template v-else>
                <div class="file-content-display">
                  <div class="file-info-header">
                    <span class="file-path" :title="currentFile?.local_path">
                      📄 {{ currentFile?.local_path || currentFile?.file_path }}
                    </span>
                    <el-tag size="small" type="info">{{ formatSize(currentFile?.file_size) }}</el-tag>
                  </div>
                  <pre class="source-text" v-loading="!sourceFileContent && detailLoading">{{ sourceFileContent || '正在加载文件内容...' }}</pre>
                </div>
              </template>
            </div>
          </el-tab-pane>

          <!-- 提取文本 -->
          <el-tab-pane name="text">
            <template #label>
              提取文本 <el-tag v-if="currentFile?.text_char_count" size="small" type="info" style="margin-left: 4px">{{ currentFile.text_char_count }} 字</el-tag>
            </template>
            <div class="extracted-text-wrap">
              <pre class="extracted-text">{{ currentFile?.extracted_text || '暂无提取文本，请先点击重处理按钮进行文本提取' }}</pre>
            </div>
          </el-tab-pane>

          <!-- 文本块 -->
          <el-tab-pane name="chunks">
            <template #label>
              文本块 ({{ currentFile?.chunk_count || 0 }})
            </template>
            <div v-if="currentChunks.length === 0" class="no-chunks">暂无文本块，请先点击重处理按钮</div>
            <div v-for="(chunk, idx) in currentChunks" :key="chunk.id" class="chunk-item">
              <div class="chunk-header">
                <span>块 #{{ chunk.chunk_index }}</span>
                <span class="chunk-chars">{{ chunk.char_count }} 字符</span>
              </div>
              <pre class="chunk-content">{{ chunk.content }}</pre>
            </div>
          </el-tab-pane>

          <!-- AI分析对话 -->
          <el-tab-pane label="AI 分析" name="chat">
            <div class="file-chat">
              <div class="chat-messages" ref="chatMessagesRef">
                <div v-if="chatMessages.length === 0" class="chat-empty">
                  <p>基于该文件内容向AI提问，支持多模态分析</p>
                  <div class="quick-questions">
                    <el-button size="small" v-for="q in quickQuestions" :key="q" @click="sendQuickQuestion(q)">{{ q }}</el-button>
                  </div>
                </div>
                <div v-for="msg in chatMessages" :key="msg.id" :class="['chat-msg', msg.role]">
                  <div class="msg-text" v-if="msg.role === 'assistant'" v-html="renderMarkdown(msg.content)"></div>
                  <div class="msg-text" v-else>{{ msg.content }}</div>
                </div>
                <div v-if="chatSending" class="chat-msg assistant">
                  <div class="msg-text typing"><span></span><span></span><span></span></div>
                </div>
              </div>
              <div class="chat-input-row">
                <el-input
                  v-model="chatInput"
                  placeholder="针对该文件提问..."
                  @keydown.enter.exact.prevent="sendFileChat"
                  :disabled="chatSending"
                  clearable
                />
                <el-button type="primary" icon="Promotion" :loading="chatSending" @click="sendFileChat" :disabled="!chatInput.trim()">发送</el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled, Loading } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getCollection, getFiles, getFile, deleteFile, reprocessFile, getFileContent as getFileContentApi, getFileUrl as getFileUrlApi } from '@/api/knowledge'
import { createChatSession, sendChatMessage } from '@/api/knowledge'
import { marked } from 'marked'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const collectionId = computed(() => route.params.id)
const collection = ref(null)
const loading = ref(false)
const files = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const uploadingFiles = ref([])
const uploadDialogVisible = ref(false)

// 图片缓存，用于显示文件封面
const imageDataCache = ref({})

// 文件详情对话框
const detailDialogVisible = ref(false)
const detailTab = ref('source')
const detailLoading = ref(false)
const currentFile = ref(null)
const currentChunks = ref([])
const sourceTextContent = ref('')
const sourceFileContent = ref('')

// 文件级AI对话
const chatMessages = ref([])
const chatInput = ref('')
const chatSending = ref(false)
const chatMessagesRef = ref(null)
const chatSessionId = ref(null)

const quickQuestions = ['总结文件的主要内容', '提取关键数据和信息', '分析其中的技术要点', '列出问题和建议']

const uploadAction = '/api/kb/files/upload'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.token}`
}))

const getFileExt = (file) => {
  if (!file) return ''
  if (file.file_type) {
    // 如果 file_type 是 JSON 字符串，尝试解析
    if (typeof file.file_type === 'string') {
      try {
        const parsed = JSON.parse(file.file_type)
        if (parsed.ext) return parsed.ext
      } catch {}
      return file.file_type
    }
  }
  // 从 original_name 提取扩展名
  if (file.original_name) {
    const ext = file.original_name.split('.').pop()?.toLowerCase()
    return ext || ''
  }
  return ''
}

const isImageFile = (file) => {
  if (!file) return false
  const ext = getFileExt(file)
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)
}

const isPdfFile = (file) => {
  if (!file) return false
  const ext = getFileExt(file)
  return ext === 'pdf'
}

const isOfficeFile = (file) => {
  if (!file) return false
  const ext = getFileExt(file)
  return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)
}

const isVideoFile = (file) => {
  if (!file) return false
  const ext = getFileExt(file)
  return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)
}

const isAudioFile = (file) => {
  if (!file) return false
  const ext = getFileExt(file)
  return ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)
}

const isArchiveFile = (file) => {
  if (!file) return false
  const ext = getFileExt(file)
  return ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
}

const isTextFile = (file) => {
  if (!file) return false
  const ext = getFileExt(file)
  return ['txt', 'md', 'csv', 'json', 'xml', 'yaml', 'yml', 'log', 'ini', 'conf', 'env'].includes(ext)
}

const getFileUrlLocal = (fileId, preview = false) => {
  return getFileUrlApi(fileId, preview)
}

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = Number(bytes)
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return size.toFixed(1) + ' ' + units[i]
}

const chunkStatusText = (status) => {
  const map = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '失败' }
  return map[status] ?? '未知'
}

const chunkStatusType = (status) => {
  const map = { 0: 'info', 1: '', 2: 'success', 3: 'danger' }
  return map[status] ?? 'info'
}

const renderMarkdown = (content) => {
  if (!content) return ''
  try { return marked(content) } catch { return content }
}

const getFileIcon = (file) => {
  const ext = getFileExt(file)
  if (['pdf'].includes(ext)) return '📄'
  if (['doc', 'docx'].includes(ext)) return '📝'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊'
  if (['ppt', 'pptx'].includes(ext)) return '📈'
  if (['txt', 'md'].includes(ext)) return '📃'
  if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return '🎬'
  if (['mp3', 'wav', 'flac'].includes(ext)) return '🎵'
  if (['zip', 'rar', '7z'].includes(ext)) return '📦'
  return '📄'
}

const getFileCoverClass = (file) => {
  const ext = getFileExt(file)
  if (['pdf'].includes(ext)) return 'cover-pdf'
  if (['doc', 'docx'].includes(ext)) return 'cover-doc'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'cover-excel'
  if (['ppt', 'pptx'].includes(ext)) return 'cover-ppt'
  if (['txt', 'md'].includes(ext)) return 'cover-text'
  if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return 'cover-video'
  if (['mp3', 'wav', 'flac'].includes(ext)) return 'cover-audio'
  if (['zip', 'rar', '7z'].includes(ext)) return 'cover-archive'
  return 'cover-default'
}

// 获取图片数据URL（带认证）
const getImageDataUrl = (fileId) => {
  return imageDataCache.value[fileId]
}

// 加载图片为data URL
const loadImagesDataUrls = async (filesList) => {
  const imageFiles = filesList.filter(f => isImageFile(f))
  for (const file of imageFiles) {
    try {
      const url = getFileUrlLocal(file.id, true)
      const response = await fetch(url)
      if (response.ok) {
        const blob = await response.blob()
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        imageDataCache.value[file.id] = dataUrl
      }
    } catch (e) {
      console.error('Failed to load image:', file.original_name, e)
    }
  }
}

// 预览图片
const previewImage = (fileId) => {
  const dataUrl = imageDataCache.value[fileId]
  if (dataUrl) {
    const viewer = window.open('', '_blank')
    if (viewer) {
      const html = '<!DOCTYPE html><html><head><title>图片预览</title><style>body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #1a1a1a; }img { max-width: 100%; max-height: 100vh; object-fit: contain; }</style></head><body><img src="' + dataUrl + '" alt="预览图片"></body></html>'
      viewer.document.write(html)
    }
  }
}

const getFileIconColor = (file) => {
  const ext = getFileExt(file)
  if (['pdf'].includes(ext)) return '#FF5722'
  if (['doc', 'docx'].includes(ext)) return '#1890FF'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '#52C41A'
  if (['ppt', 'pptx'].includes(ext)) return '#FAAD14'
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return '#722ED1'
  if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return '#EB2F96'
  if (['txt', 'md'].includes(ext)) return '#606266'
  return '#409EFF'
}

const loadCollection = async () => {
  try {
    const res = await getCollection(collectionId.value)
    collection.value = res.data
  } catch (e) {}
}

const loadFiles = async () => {
  loading.value = true
  try {
    const res = await getFiles({
      collection_id: collectionId.value,
      page: page.value,
      pageSize: pageSize.value
    })
    files.value = res.data?.list || []
    total.value = res.data?.total || 0
    // 加载图片数据URL
    if (files.value.length > 0) {
      loadImagesDataUrls(files.value)
    }
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const beforeUpload = (file) => {
  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过100MB')
    return false
  }
  uploadingFiles.value.push({
    name: file.name,
    progress: 0,
    status: ''
  })
  return true
}

const handleUploadProgress = (event, file) => {
  const item = uploadingFiles.value.find(f => f.name === file.name)
  if (item) {
    item.progress = Math.round(event.percent || 0)
  }
}

const handleUploadSuccess = (response, file) => {
  const item = uploadingFiles.value.find(f => f.name === file.name)
  if (item) {
    item.progress = 100
    item.status = 'success'
    setTimeout(() => {
      uploadingFiles.value = uploadingFiles.value.filter(f => f.name !== file.name)
    }, 2000)
  }
  ElMessage.success('上传成功，文件正在处理中')
  loadFiles()
}

const handleUploadError = () => {
  ElMessage.error('上传失败')
}

const viewFileDetail = async (row) => {
  // 在对话框中显示所有文件内容
  detailDialogVisible.value = true
  detailLoading.value = true
  detailTab.value = 'source'
  currentFile.value = row
  currentChunks.value = []
  sourceTextContent.value = ''
  sourceFileContent.value = ''
  chatMessages.value = []
  chatSessionId.value = null

  try {
    const res = await getFile(row.id)
    currentFile.value = res.data
    currentChunks.value = res.data?.chunks || []

    // 如果是图片文件，加载图片数据URL
    if (isImageFile(currentFile.value)) {
      await loadImagesDataUrls([currentFile.value])
    }

    // 加载源文件内容
    try {
      const contentRes = await getFileContentApi(row.id)
      if (contentRes.data) {
        sourceFileContent.value = contentRes.data

        // 对于图片文件，直接使用返回的 data_url，不需要额外处理
        if (!contentRes.data.is_image) {
          // 如果返回的是其他二进制文件信息（不是图片）
          if (contentRes.data.is_binary) {
            // 显示提示信息
            sourceFileContent.value = {
              ...contentRes.data,
              displayText: contentRes.data.message || '此文件类型不支持直接预览，请下载后查看'
            }
          }
        }
      } else {
        sourceFileContent.value = '无法加载文件内容'
      }
    } catch (e) {
      sourceFileContent.value = {
        displayText: '加载文件内容失败: ' + (e.message || '未知错误')
      }
    }

    // 如果有提取文本但没分块，自动切到文本tab
    if (res.data?.extracted_text && !res.data?.chunk_count) {
      detailTab.value = 'text'
    } else if (!res.data?.extracted_text) {
      detailTab.value = 'source'
    }
  } catch (e) {
    ElMessage.error('获取文件详情失败')
  } finally {
    detailLoading.value = false
  }
}

const handleDownload = (row) => {
  const link = document.createElement('a')
  link.href = getFileUrlLocal(row.id, false)
  link.download = row.original_name
  link.click()
}

const handleReprocess = async (row) => {
  try {
    await reprocessFile(row.id)
    ElMessage.success('已开始重新处理')
    loadFiles()
  } catch (e) {}
}

const handleDelete = async (row) => {
  try {
    await deleteFile(row.id)
    ElMessage.success('删除成功')
    loadFiles()
  } catch (e) {}
}

// 文件级AI分析对话
const ensureChatSession = async () => {
  if (chatSessionId.value) return
  try {
    const res = await createChatSession({
      collection_id: collectionId.value,
      title: `分析: ${currentFile.value?.original_name || '文件'}`
    })
    chatSessionId.value = res.data.id
  } catch (e) {
    ElMessage.error('创建对话失败')
    throw e
  }
}

const sendFileChat = async (question) => {
  const message = question || chatInput.value.trim()
  if (!message || chatSending.value) return

  try {
    await ensureChatSession()
  } catch { return }

  chatMessages.value.push({
    id: Date.now(),
    role: 'user',
    content: message
  })
  chatInput.value = ''
  chatSending.value = true

  await nextTick()
  scrollChatToBottom()

  // 构建带有文件上下文的消息
  const fileContext = currentFile.value?.extracted_text
    ? `[正在分析文件: ${currentFile.value.original_name}]\n\n文件提取文本内容:\n${currentFile.value.extracted_text.substring(0, 3000)}\n\n用户问题: ${message}`
    : message

  try {
    const res = await sendChatMessage(chatSessionId.value, { message: fileContext })
    chatMessages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: res.data?.content || '抱歉，未能获取回答'
    })
  } catch (e) {
    chatMessages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: 'AI回复失败: ' + (e.message || '未知错误')
    })
  } finally {
    chatSending.value = false
    await nextTick()
    scrollChatToBottom()
  }
}

const sendQuickQuestion = (q) => {
  sendFileChat(q)
}

const scrollChatToBottom = () => {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
  }
}

const goBack = () => {
  router.push({ name: 'KbCollections' })
}

const goToChat = () => {
  router.push({ name: 'KbChat', query: { collection_id: collectionId.value } })
}

// 在新窗口中打开PDF
const openPdfInNewWindow = () => {
  if (currentFile.value) {
    const url = getFileUrlLocal(currentFile.value.id, true)
    window.open(url, '_blank')
  }
}

// 在新窗口中播放媒体文件
const openMediaInNewWindow = () => {
  if (currentFile.value) {
    const url = getFileUrlLocal(currentFile.value.id, true)
    window.open(url, '_blank')
  }
}

onMounted(() => {
  loadCollection()
  loadFiles()
})
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100%;

  .detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding: 18px 20px;
    border-radius: 24px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.88));
    border: 1px solid rgba(148, 163, 184, 0.16);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);

    .header-info {
      flex: 1;
      h2 { margin: 0 0 6px; font-size: 20px; color: #0f172a; }
      p { margin: 0; color: #64748b; font-size: 14px; line-height: 1.6; }
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .file-list-container {
    background: rgba(255, 255, 255, 0.88);
    border-radius: 24px;
    padding: 22px;
    border: 1px solid rgba(148, 163, 184, 0.16);
    box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08);

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 22px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(226, 232, 240, 0.9);

      .file-count {
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
      }
    }

    .file-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
      min-height: 200px;

      @media (max-width: 1200px) {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      }

      @media (max-width: 768px) {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      }

      .file-card {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
        border-radius: 18px;
        padding: 0;
        display: flex;
        flex-direction: column;
        transition: all 0.3s ease;
        cursor: pointer;
        height: 260px;
        overflow: hidden;
        border: 1px solid rgba(226, 232, 240, 0.9);
        box-shadow: 0 14px 28px rgba(15, 23, 42, 0.06);

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 38px rgba(37, 99, 235, 0.14);
          border-color: rgba(59, 130, 246, 0.34);
        }

        .file-cover {
          height: 160px;
          position: relative;
          overflow: hidden;
          border-radius: 12px 12px 0 0;

          .image-cover {
            width: 100%;
            height: 100%;
            position: relative;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

            .cover-thumbnail {
              width: 100%;
              height: 100%;
              object-fit: cover;
              cursor: zoom-in;
              transition: transform 0.3s ease;

              &:hover {
                transform: scale(1.05);
              }
            }

            .cover-error {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              gap: 12px;
              color: rgba(255, 255, 255, 0.8);
              font-size: 14px;
            }

            .cover-loading {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              gap: 12px;
              color: rgba(255, 255, 255, 0.8);
              font-size: 14px;
              animation: pulse 1.5s infinite;
            }

            .image-badge {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              padding: 8px 0;
              background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
              color: white;
              font-size: 13px;
              font-weight: 500;
            }
          }

          .icon-cover {
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;

            &.cover-pdf {
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
            }

            &.cover-doc {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            }

            &.cover-excel {
              background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            }

            &.cover-ppt {
              background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            }

            &.cover-text {
              background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            }

            &.cover-video {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            &.cover-audio {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }

            &.cover-archive {
              background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            }

            &.cover-default {
              background: linear-gradient(135deg, #dfe9f3 0%, #a8c0d6 100%);
            }

            .icon-wrapper {
              position: relative;
              z-index: 2;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 16px;
            }

            .icon-inner {
              width: 80px;
              height: 80px;
              display: flex;
              justify-content: center;
              align-items: center;
              background: rgba(255, 255, 255, 0.25);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.3);

              .el-icon {
                font-size: 48px;
              }
            }

            .file-type-badge {
              padding: 4px 16px;
              background: rgba(255, 255, 255, 0.9);
              border-radius: 8px;
              font-size: 14px;
              font-weight: 700;
              color: #333;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              text-transform: uppercase;
            }

            .cover-accent {
              position: absolute;
              width: 200px;
              height: 200px;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.1);
              top: -50px;
              right: -50px;
            }

            &:hover {
              .icon-inner {
                transform: scale(1.1);
                transition: transform 0.3s ease;
              }

              .cover-accent {
                transform: scale(1.2);
                transition: transform 0.3s ease;
              }
            }
          }
        }

        .file-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px;
          background: transparent;

          .file-name {
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.4;
            min-height: 20px;
          }

          .file-meta {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;

            .file-size {
              color: #64748b;
            }
          }

          .file-status {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;

            .chunk-info {
              color: #64748b;
            }
          }

          .file-date {
            font-size: 11px;
            color: #94a3b8;
          }
        }

        .file-actions {
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 8px 12px;
          background: rgba(248, 250, 252, 0.9);
          border-top: 1px solid rgba(226, 232, 240, 0.9);
          margin-top: auto;

          // 操作按钮：取消背景，仅用字体颜色区分
          :deep(.el-button) {
            background-color: transparent !important;
            border: none;
          }
          :deep(.el-button--primary.is-link) {
            color: #2563eb;
          }
          :deep(.el-button--success.is-link) {
            color: #047857;
          }
          :deep(.el-button--warning.is-link) {
            color: #d97706;
          }
        }
      }

      .empty-state {
        grid-column: 1 / -1;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }
    }
  }

  .upload-progress {
    margin-bottom: 20px;

    .progress-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;

      .file-name {
        width: 200px;
        font-size: 13px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .el-progress { flex: 1; }
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }

  .file-detail {
    .source-preview {
      min-height: 200px;
      display: flex;
      justify-content: center;
      align-items: flex-start;

      .image-preview-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;
        min-height: 200px;

        .detail-image-preview {
          max-width: 100%;
          max-height: 600px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .loading-image {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 200px;
          color: #909399;
          animation: pulse 1.5s infinite;
        }
      }

      .file-content-display {
        .file-info-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f9f9f9;
          border-radius: 4px;
          margin-bottom: 12px;
          border: 1px solid #e4e7ed;

          .file-path {
            flex: 1;
            font-size: 12px;
            color: #606266;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-family: 'Consolas', 'Monaco', monospace;
          }
        }
      }

      .source-text {
        width: 100%;
        white-space: pre-wrap;
        word-break: break-all;
        font-size: 13px;
        line-height: 1.6;
        color: #606266;
        max-height: 600px;
        overflow-y: auto;
        margin: 0;
        padding: 16px;
        background: #fafafa;
        border-radius: 4px;
        border: 1px solid #e4e7ed;
        font-family: 'Consolas', 'Monaco', monospace;
      }

      .pdf-preview-wrapper,
      .office-preview-wrapper,
      .media-preview-wrapper,
      .archive-preview-wrapper {
        min-height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 40px 20px;

        .file-info-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f9f9f9;
          border-radius: 4px;
          margin-bottom: 16px;
          border: 1px solid #e4e7ed;

          .file-path {
            flex: 1;
            font-size: 13px;
            color: #606266;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-family: 'Consolas', 'Monaco', monospace;
          }
        }

        .pdf-actions,
        .office-actions,
        .media-actions,
        .archive-actions {
          display: flex;
          gap: 12px;
        }

        .preview-hint {
          margin: 0;
          color: #909399;
          font-size: 14px;
        }
      }

      .unsupported-preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 60px 40px;
        color: #909399;

        .file-icon-preview {
          width: 120px;
          height: 120px;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

          &.cover-pdf {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
          }

          &.cover-doc {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          &.cover-excel {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }

          &.cover-ppt {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          }

          &.cover-text {
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          }

          &.cover-video {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.cover-audio {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.cover-archive {
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          }

          &.cover-default {
            background: linear-gradient(135deg, #dfe9f3 0%, #a8c0d6 100%);
          }

          .preview-icon-inner {
            width: 60px;
            height: 60px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.3);

            .preview-emoji {
              font-size: 32px;
            }
          }

          .preview-type-badge {
            position: absolute;
            bottom: 12px;
            padding: 4px 12px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            color: #333;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          }
        }

        p {
          font-size: 14px;
          margin: 0;
        }
      }
    }

    .extracted-text-wrap {
      .extracted-text {
        white-space: pre-wrap;
        word-break: break-all;
        font-size: 13px;
        line-height: 1.6;
        color: #606266;
        max-height: 500px;
        overflow-y: auto;
        margin: 0;
        padding: 12px;
        background: #f5f7fa;
        border-radius: 4px;
      }
    }

    .chunk-item {
      margin-bottom: 16px;
      border: 1px solid #EBEEF5;
      border-radius: 4px;

      .chunk-header {
        padding: 8px 12px;
        background: #f5f7fa;
        font-size: 13px;
        font-weight: 600;
        color: #909399;
        border-bottom: 1px solid #EBEEF5;
        display: flex;
        justify-content: space-between;

        .chunk-chars {
          font-weight: normal;
          color: #C0C4CC;
        }
      }

      .chunk-content {
        padding: 12px;
        margin: 0;
        white-space: pre-wrap;
        word-break: break-all;
        font-size: 13px;
        line-height: 1.6;
        color: #606266;
        max-height: 200px;
        overflow-y: auto;
      }
    }

    .no-chunks {
      text-align: center;
      color: #C0C4CC;
      padding: 40px 0;
    }

    .file-chat {
      display: flex;
      flex-direction: column;
      height: 450px;

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 14px;
        background: linear-gradient(180deg, #f8fafc, #f1f5f9);
        border-radius: 16px;
        border: 1px solid rgba(226, 232, 240, 0.9);
        margin-bottom: 12px;

        .chat-empty {
          text-align: center;
          color: #909399;
          padding: 30px 0;

          p { margin-bottom: 12px; }

          .quick-questions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
          }
        }

        .chat-msg {
          margin-bottom: 12px;

          &.user {
            text-align: right;

            .msg-text {
              display: inline-block;
              background: linear-gradient(135deg, #2563eb, #4f46e5);
              color: #fff;
              padding: 10px 14px;
              border-radius: 16px;
              max-width: 80%;
              text-align: left;
              font-size: 13px;
              box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
            }
          }

          &.assistant {
            .msg-text {
              display: inline-block;
              background: #fff;
              color: #0f172a;
              padding: 10px 14px;
              border-radius: 16px;
              max-width: 90%;
              font-size: 13px;
              line-height: 1.6;
              border: 1px solid rgba(226, 232, 240, 0.9);
              box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);

              :deep(p) { margin: 4px 0; }
              :deep(ul), :deep(ol) { padding-left: 20px; margin: 4px 0; }
              :deep(code) {
                background: rgba(0,0,0,0.06);
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 12px;
              }
              :deep(pre) {
                background: #f5f7fa;
                padding: 10px;
                border-radius: 4px;
                overflow-x: auto;
                margin: 6px 0;
              }

              &.typing {
                display: flex;
                gap: 4px;
                padding: 12px 16px;

                span {
                  width: 8px;
                  height: 8px;
                  background: #909399;
                  border-radius: 50%;
                  animation: typing 1.4s infinite;
                  &:nth-child(2) { animation-delay: 0.2s; }
                  &:nth-child(3) { animation-delay: 0.4s; }
                }
              }
            }
          }
        }
      }

      .chat-input-row {
        display: flex;
        gap: 8px;
      }
    }
  }

  :deep(.el-button--primary) {
    border: none;
    background: linear-gradient(135deg, #2563eb, #4f46e5);
    box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
  }

  :deep(.el-dialog) {
    border-radius: 24px;
    overflow: hidden;
  }

  :deep(.el-input__wrapper) {
    border-radius: 14px;
  }
}

@media (max-width: 768px) {
  .detail-page {
    .detail-header {
      flex-wrap: wrap;
      align-items: stretch;

      .header-actions {
        width: 100%;
      }
    }
  }
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-8px); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
