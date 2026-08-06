<template>
  <div class="progress-video-page">
    <!-- 搜索栏 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="订单号">
        <el-input v-model="searchForm.order_no" placeholder="请输入订单号" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="视频标题">
        <el-input v-model="searchForm.video_title" placeholder="请输入视频标题" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        上传进度视频
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="tableData" style="width: 100%" border stripe>
      <el-table-column prop="order_no" label="订单号" width="160" />
      <el-table-column prop="customer_name" label="客户" width="100" show-overflow-tooltip />
      <el-table-column prop="device_model" label="设备型号" width="140" show-overflow-tooltip />
      <el-table-column label="视频封面" width="120" align="center">
        <template #default="{ row }">
          <el-image
            v-if="row.cover_url"
            :src="getFullUrl(row.cover_url)"
            fit="cover"
            class="cover-thumb"
            :preview-src-list="[getFullUrl(row.cover_url)]"
            preview-teleported
          />
          <video-cover v-else :video-url="getFullUrl(row.video_url)" />
        </template>
      </el-table-column>
      <el-table-column prop="video_title" label="视频标题" min-width="180" show-overflow-tooltip />
      <el-table-column label="时长" width="90" align="center">
        <template #default="{ row }">
          <video-duration :video-url="getFullUrl(row.video_url)" :fallback="row.duration" />
        </template>
      </el-table-column>
      <el-table-column label="大小" width="100" align="right">
        <template #default="{ row }">
          {{ formatFileSize(row.file_size) }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="说明" min-width="150" show-overflow-tooltip />
      <el-table-column prop="uploaded_by_name" label="上传人" width="100" />
      <el-table-column prop="created_at" label="上传时间" width="160" />
      <el-table-column label="操作" width="220" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handlePlay(row)">播放</el-button>
          <el-button link type="info" @click="handleView(row)">详情</el-button>
          <el-button link type="warning" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.limit"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadData"
      @current-change="loadData"
    />

    <!-- 上传视频对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑进度视频' : '上传进度视频'"
      width="700px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="关联订单" prop="order_id">
          <el-select
            v-model="formData.order_id"
            filterable
            remote
            reserve-keyword
            placeholder="输入订单号搜索"
            :remote-method="searchOrders"
            :loading="orderSearchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in orderOptions"
              :key="item.id"
              :label="`${item.order_id} - ${item.device_model || '未知设备'} (${item.user_name || '未知客户'})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="视频标题" prop="video_title">
          <el-input v-model="formData.video_title" placeholder="请输入视频标题" />
        </el-form-item>

        <el-form-item label="视频说明">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入视频说明"
          />
        </el-form-item>

        <el-form-item label="视频上传" required>
          <el-upload
            class="video-uploader"
            :action="uploadUrl"
            :headers="getUploadHeaders()"
            :data="buildUploadData()"
            :show-file-list="false"
            :on-success="handleVideoUploadSuccess"
            :before-upload="beforeVideoUpload"
            :auto-upload="true"
            accept="video/*"
          >
            <div v-if="!formData.video_url" class="upload-placeholder">
              <el-icon :size="36"><VideoCamera /></el-icon>
              <div class="upload-text">点击上传视频（最大50MB）</div>
            </div>
            <div v-else class="upload-done">
              <el-icon :size="28" color="#67c23a"><SuccessFilled /></el-icon>
              <div class="upload-text">视频已上传，点击可重新上传</div>
              <div class="upload-meta" v-if="formData.duration || formData.file_size">
                {{ formatDuration(formData.duration) }} / {{ formatFileSize(formData.file_size) }}
              </div>
            </div>
          </el-upload>
        </el-form-item>

        <el-form-item label="视频封面">
          <el-upload
            :action="uploadUrl"
            :headers="getUploadHeaders()"
            :data="buildUploadData()"
            :show-file-list="false"
            :on-success="handleCoverUploadSuccess"
            :before-upload="beforeCoverUpload"
            :auto-upload="true"
            accept="image/*"
          >
            <el-image
              v-if="formData.cover_url"
              :src="getFullUrl(formData.cover_url)"
              fit="cover"
              class="cover-preview"
            />
            <div v-else class="cover-placeholder">
              <el-icon :size="20"><Picture /></el-icon>
              <span>上传封面</span>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">{{ isEdit ? '保存' : '上传' }}</el-button>
      </template>
    </el-dialog>

    <!-- 播放视频对话框 -->
    <el-dialog
      v-model="playDialogVisible"
      :title="currentVideo?.video_title || '视频播放'"
      width="800px"
      @close="handlePlayDialogClose"
    >
      <div class="video-player-wrapper" v-if="currentVideo">
        <video
          ref="videoPlayerRef"
          :src="getFullUrl(currentVideo.video_url)"
          :poster="currentVideo.cover_url ? getFullUrl(currentVideo.cover_url) : ''"
          controls
          class="video-player"
        >
          您的浏览器不支持视频播放
        </video>
        <div class="video-info-bar">
          <el-descriptions :column="3" size="small" border>
            <el-descriptions-item label="视频标题">{{ currentVideo.video_title }}</el-descriptions-item>
            <el-descriptions-item label="时长">
              <video-duration :video-url="getFullUrl(currentVideo.video_url)" :fallback="currentVideo.duration" />
            </el-descriptions-item>
            <el-descriptions-item label="大小">{{ formatFileSize(currentVideo.file_size) }}</el-descriptions-item>
            <el-descriptions-item label="上传人">{{ currentVideo.uploaded_by_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="上传时间" :span="2">{{ currentVideo.created_at }}</el-descriptions-item>
            <el-descriptions-item label="说明" :span="3">{{ currentVideo.description || '无' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>

    <!-- 视频详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="视频详情" width="650px">
      <el-descriptions :column="2" border v-if="currentVideo">
        <el-descriptions-item label="订单号">{{ currentVideo.order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ currentVideo.customer_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="设备型号">{{ currentVideo.device_model || '-' }}</el-descriptions-item>
        <el-descriptions-item label="上传人">{{ currentVideo.uploaded_by_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="视频标题" :span="2">{{ currentVideo.video_title }}</el-descriptions-item>
        <el-descriptions-item label="视频时长">
          <video-duration :video-url="getFullUrl(currentVideo.video_url)" :fallback="currentVideo.duration" />
        </el-descriptions-item>
        <el-descriptions-item label="文件大小">{{ formatFileSize(currentVideo.file_size) }}</el-descriptions-item>
        <el-descriptions-item label="反馈组ID" :span="2">
          <el-tooltip :content="currentVideo.feedback_group_id" placement="top">
            <span>{{ currentVideo.feedback_group_id || '-' }}</span>
          </el-tooltip>
        </el-descriptions-item>
        <el-descriptions-item label="视频说明" :span="2">{{ currentVideo.description || '无' }}</el-descriptions-item>
        <el-descriptions-item label="上传时间" :span="2">{{ currentVideo.created_at }}</el-descriptions-item>
        <el-descriptions-item label="视频封面" :span="2">
          <el-image
            v-if="currentVideo.cover_url"
            :src="getFullUrl(currentVideo.cover_url)"
            style="width: 200px; border-radius: 6px;"
            fit="cover"
          />
          <video-cover v-else :video-url="getFullUrl(currentVideo.video_url)" style="width: 200px; height: 112px; border-radius: 6px;" />
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineComponent, h } from 'vue'
import { Plus, VideoCamera, SuccessFilled, Picture } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'
import { getMediaUrl } from '@/utils/media'

// 内联组件：从视频自动提取封面缩略图
const VideoCover = defineComponent({
  props: { videoUrl: { type: String, default: '' } },
  setup(props) {
    const coverSrc = ref('')
    const loading = ref(true)
    const failed = ref(false)

    const generate = (url) => {
      if (!url) { loading.value = false; failed.value = true; return }
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.preload = 'metadata'
      video.src = url
      video.muted = true

      video.addEventListener('loadeddata', () => {
        video.currentTime = Math.min(1, video.duration * 0.1)
      })
      video.addEventListener('seeked', () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth || 320
          canvas.height = video.videoHeight || 180
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
          coverSrc.value = canvas.toDataURL('image/jpeg', 0.8)
        } catch {
          failed.value = true
        }
        loading.value = false
      })
      video.addEventListener('error', () => {
        loading.value = false
        failed.value = true
      })
    }

    onMounted(() => generate(props.videoUrl))

    return () => {
      if (coverSrc.value) {
        return h('img', { src: coverSrc.value, style: 'width:60px;height:40px;border-radius:4px;object-fit:cover;' })
      }
      if (loading.value) {
        return h('div', { style: 'width:60px;height:40px;border-radius:4px;background:#f5f7fa;display:flex;align-items:center;justify-content:center;margin:0 auto;' }, '...')
      }
      return h('div', { style: 'width:60px;height:40px;border-radius:4px;background:#f5f7fa;display:flex;align-items:center;justify-content:center;color:#c0c4cc;margin:0 auto;' },
        h(VideoCamera, { size: 20 })
      )
    }
  }
})

// 内联组件：从视频自动获取真实时长
const VideoDuration = defineComponent({
  props: {
    videoUrl: { type: String, default: '' },
    fallback: { type: Number, default: 0 }
  },
  setup(props) {
    const realDuration = ref(0)

    const formatDuration = (seconds) => {
      if (!seconds) return '0:00'
      const m = Math.floor(seconds / 60)
      const s = seconds % 60
      return `${m}:${s.toString().padStart(2, '0')}`
    }

    if (props.videoUrl) {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.src = props.videoUrl
      video.addEventListener('loadedmetadata', () => {
        realDuration.value = Math.round(video.duration)
      })
    }

    return () => formatDuration(realDuration.value || props.fallback)
  }
})

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const playDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const currentVideo = ref(null)
const videoPlayerRef = ref(null)
const formRef = ref(null)
const isEdit = ref(false)
const orderSearchLoading = ref(false)
const orderOptions = ref([])

const uploadUrl = '/api/upload?type=progress'
const getUploadHeaders = () => ({
  'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
})

const searchForm = reactive({ order_no: '', video_title: '' })
const pagination = reactive({ page: 1, limit: 20, total: 0 })

const formData = reactive({
  id: null,
  order_id: '',
  video_title: '',
  description: '',
  video_url: '',
  cover_url: '',
  duration: 0,
  file_size: 0
})

const formRules = {
  order_id: [{ required: true, message: '请选择关联订单', trigger: 'change' }],
  video_title: [{ required: true, message: '请输入视频标题', trigger: 'blur' }]
}

const buildUploadData = () => ({
  type: 'progress',
  order_id: formData.order_id || ''
})

const getFullUrl = (url) => {
  return getMediaUrl(url)
}

const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

const searchOrders = async (query) => {
  if (!query) { orderOptions.value = []; return }
  orderSearchLoading.value = true
  try {
    const res = await request.get('/miniprogram-progress-media/summary', {
      params: { page: 1, pageSize: 20, order_no: query }
    })
    if (res.code === 200 || res.code === 0) {
      orderOptions.value = res.data.list || []
    }
  } catch { orderOptions.value = [] }
  finally { orderSearchLoading.value = false }
}

const loadData = async () => {
  loading.value = true
  try {
    const params = { page: pagination.page, pageSize: pagination.limit }
    if (searchForm.order_no) params.order_no = searchForm.order_no
    const res = await request.get('/miniprogram-progress-media/videos', { params })
    if (res.code === 200 || res.code === 0) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载视频列表失败', error)
    ElMessage.error('加载视频列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.page = 1; loadData() }
const handleReset = () => {
  Object.assign(searchForm, { order_no: '', video_title: '' })
  handleSearch()
}

const handleCreate = () => {
  isEdit.value = false
  orderOptions.value = []
  Object.assign(formData, { id: null, order_id: '', video_title: '', description: '', video_url: '', cover_url: '', duration: 0, file_size: 0 })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  orderOptions.value = row.order_no ? [{ id: row.order_id, order_id: row.order_no, device_model: row.device_model, user_name: row.customer_name }] : []
  Object.assign(formData, {
    id: row.id, order_id: row.order_id, video_title: row.video_title,
    description: row.description || '', video_url: row.video_url,
    cover_url: row.cover_url || '', duration: row.duration || 0, file_size: row.file_size || 0
  })
  dialogVisible.value = true
}

const handlePlay = (row) => {
  currentVideo.value = row
  playDialogVisible.value = true
}

const handlePlayDialogClose = () => {
  if (videoPlayerRef.value) {
    videoPlayerRef.value.pause()
  }
}

const handleView = (row) => {
  currentVideo.value = row
  viewDialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该视频吗？', '提示', { type: 'warning' })
    await request.delete(`/miniprogram-progress-media/videos/${row.id}`)
    ElMessage.success('删除成功')
    loadData()
  } catch { /* cancelled */ }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (!formData.video_url) {
    ElMessage.warning('请先上传视频')
    return
  }

  try {
    const data = {
      order_id: formData.order_id, video_title: formData.video_title,
      description: formData.description, video_url: formData.video_url,
      cover_url: formData.cover_url, duration: formData.duration, file_size: formData.file_size
    }
    if (isEdit.value && formData.id) {
      await request.put(`/miniprogram-progress-media/videos/${formData.id}`, data)
      ElMessage.success('更新成功')
    } else {
      await request.post('/miniprogram-progress-media/videos', data)
      ElMessage.success('上传成功')
    }
    dialogVisible.value = false
    loadData()
  } catch { /* handled by interceptor */ }
}

const handleDialogClose = () => { formRef.value?.resetFields() }

const beforeVideoUpload = (file) => {
  if (!formData.order_id) {
    ElMessage.error('请先选择关联订单')
    return false
  }
  if (!file.type.startsWith('video/')) {
    ElMessage.error('只能上传视频文件！')
    return false
  }
  if (file.size / 1024 / 1024 > 50) {
    ElMessage.error('视频大小不能超过 50MB！')
    return false
  }
  return true
}

const beforeCoverUpload = (file) => {
  if (!formData.order_id) {
    ElMessage.error('请先选择关联订单')
    return false
  }
  if (!file.type.startsWith('image/')) {
    ElMessage.error('只能上传图片作为封面！')
    return false
  }
  if (file.size / 1024 / 1024 > 2) {
    ElMessage.error('封面图片不能超过 2MB！')
    return false
  }
  return true
}

const handleVideoUploadSuccess = (response) => {
  if (response.code === 200) {
    formData.video_url = response.data.url || response.data.path
    formData.file_size = response.data.size || response.data.file_size || 0
    // 优先使用后端返回的元数据，否则前端自动提取
    if (response.data.duration) {
      formData.duration = response.data.duration
    }
    if (response.data.cover_url) {
      formData.cover_url = response.data.cover_url
    }
    if (!response.data.duration || !response.data.cover_url) {
      extractVideoMetadata(formData.video_url)
    }
    ElMessage.success('视频上传成功')
  } else {
    ElMessage.error('视频上传失败: ' + response.message)
  }
}

const extractVideoMetadata = (videoUrl) => {
  const video = document.createElement('video')
  video.crossOrigin = 'anonymous'
  video.preload = 'metadata'
  video.src = getFullUrl(videoUrl)

  video.addEventListener('loadedmetadata', () => {
    formData.duration = Math.round(video.duration)
    // 跳转到1秒处截图封面
    video.currentTime = Math.min(1, video.duration * 0.1)
  })

  video.addEventListener('seeked', () => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 320
      canvas.height = video.videoHeight || 180
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(async (blob) => {
        if (blob) {
          await uploadCoverBlob(blob)
        }
      }, 'image/jpeg', 0.8)
    } catch (e) {
      console.warn('自动生成封面失败（可能跨域限制）:', e)
    }
  })

  video.addEventListener('error', () => {
    console.warn('无法加载视频元数据')
  })
}

const uploadCoverBlob = async (blob) => {
  const file = new File([blob], 'cover_auto.jpg', { type: 'image/jpeg' })
  const form = new FormData()
  form.append('file', file)
  form.append('type', 'progress')
  form.append('order_id', formData.order_id || '')
  try {
    const res = await request.post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
    })
    if (res.code === 200) {
      formData.cover_url = res.data.url || res.data.path
    }
  } catch (e) {
    console.warn('封面上传失败:', e)
  }
}

const handleCoverUploadSuccess = (response) => {
  if (response.code === 200) {
    formData.cover_url = response.data.url || response.data.path
    ElMessage.success('封面上传成功')
  } else {
    ElMessage.error('封面上传失败: ' + response.message)
  }
}

onMounted(() => { loadData() })
</script>

<style lang="scss" scoped>
.progress-video-page {
  .search-form { margin-bottom: 16px; }
  .toolbar { margin-bottom: 16px; }
  .el-pagination { margin-top: 16px; justify-content: flex-end; }

  .cover-thumb {
    width: 60px;
    height: 40px;
    border-radius: 4px;
  }

  .no-cover {
    width: 60px;
    height: 40px;
    border-radius: 4px;
    background: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c0c4cc;
    margin: 0 auto;
  }

  .video-uploader {
    :deep(.el-upload) { width: 100%; }

    .upload-placeholder,
    .upload-done {
      border: 2px dashed #dcdfe6;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      min-height: 100px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      &:hover { border-color: #409eff; background: #f0f9ff; }
      .upload-text { font-size: 14px; color: #8c939d; margin-top: 8px; }
    }

    .upload-done {
      border-color: #67c23a;
      background: #f0f9ff;
      .upload-text { color: #67c23a; font-weight: 500; }
      .upload-meta { font-size: 12px; color: #909399; margin-top: 4px; }
    }
  }

  .cover-preview {
    width: 160px;
    height: 90px;
    border-radius: 6px;
    cursor: pointer;
  }

  .cover-placeholder {
    width: 160px;
    height: 90px;
    border: 2px dashed #dcdfe6;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #8c939d;
    font-size: 12px;
    gap: 4px;

    &:hover { border-color: #409eff; color: #409eff; }
  }

  .video-player-wrapper {
    .video-player {
      width: 100%;
      max-height: 450px;
      border-radius: 6px;
      background: #000;
    }

    .video-info-bar {
      margin-top: 16px;
    }
  }
}
</style>
