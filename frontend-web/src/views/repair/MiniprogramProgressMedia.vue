<template>
  <div class="miniprogram-progress-media-page">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e8f4fd; color: #409eff;">
              <el-icon :size="24"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ pagination.total }}</div>
              <div class="stat-label">总订单数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e8f8f0; color: #67c23a;">
              <el-icon :size="24"><Picture /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.hasPhotos }}</div>
              <div class="stat-label">有照片订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fdf6ec; color: #e6a23c;">
              <el-icon :size="24"><VideoCamera /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.hasVideos }}</div>
              <div class="stat-label">有视频订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fef0f0; color: #f56c6c;">
              <el-icon :size="24"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.noMedia }}</div>
              <div class="stat-label">无媒体订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="订单号">
        <el-input v-model="searchForm.order_no" placeholder="请输入订单号" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="设备型号">
        <el-input v-model="searchForm.device_model" placeholder="请输入设备型号" clearable style="width: 150px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon> 搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon> 重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="tableData" style="width: 100%" border stripe>
      <el-table-column prop="order_id" label="订单号" width="160" fixed />
      <el-table-column prop="user_name" label="用户" width="100" show-overflow-tooltip />
      <el-table-column prop="device_model" label="设备型号" width="140" show-overflow-tooltip />
      <el-table-column label="设备类型" width="90" align="center">
        <template #default="{ row }">{{ getDeviceTypeText(row.device_type) }}</template>
      </el-table-column>
      <el-table-column prop="problem_description" label="故障描述" min-width="160" show-overflow-tooltip />
      <el-table-column label="进度照片" width="220" align="center">
        <template #default="{ row }">
          <div v-if="row.photo_count > 0" class="table-photo-preview">
            <el-image
              v-for="(img, index) in row.photos_preview"
              :key="`${row.id}-photo-${index}`"
              :src="getFullUrl(img)"
              :preview-src-list="row.all_photo_urls"
              :initial-index="index"
              fit="cover"
              class="table-photo-thumb"
              preview-teleported
            />
            <el-button link type="primary" @click="viewPhotos(row)">
              <el-icon><Picture /></el-icon> {{ row.photo_count }}张
            </el-button>
          </div>
          <span v-else class="text-muted">暂无照片</span>
        </template>
      </el-table-column>
      <el-table-column label="进度视频" width="220" align="center">
        <template #default="{ row }">
          <div v-if="row.video_count > 0" class="table-video-preview">
            <div
              v-for="(video, index) in row.videos_preview"
              :key="`${row.id}-video-${index}`"
              class="table-video-thumb"
              @click="openVideoPreview(video)"
            >
              <el-image
                v-if="video.cover_url"
                :src="getFullUrl(video.cover_url)"
                fit="cover"
                class="table-video-cover"
              />
              <div v-else class="table-video-cover table-video-cover-fallback">
                <el-icon><VideoCamera /></el-icon>
              </div>
              <div class="table-video-play">
                <el-icon><VideoPlay /></el-icon>
              </div>
            </div>
            <el-button link type="warning" @click="viewVideos(row)">
              <el-icon><VideoCamera /></el-icon> {{ row.video_count }}个
            </el-button>
          </div>
          <span v-else class="text-muted">暂无视频</span>
        </template>
      </el-table-column>
      <el-table-column label="进度" width="110" align="center">
        <template #default="{ row }">
          <el-progress
            :percentage="row.progress || 0"
            :stroke-width="8"
            :color="getProgressColor(row.progress)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="下单时间" width="160" />
      <el-table-column label="操作" width="160" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">详情</el-button>
          <el-button v-if="row.photo_count > 0" link type="success" @click="viewPhotos(row)">照片</el-button>
          <el-button v-if="row.video_count > 0" link type="warning" @click="viewVideos(row)">视频</el-button>
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
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <!-- 订单详情 + 媒体展示对话框 -->
    <el-dialog v-model="detailDialogVisible" title="订单进度详情" width="960px">
      <template v-if="currentOrder">
        <!-- 订单基本信息 -->
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="订单号">{{ currentOrder.order_id }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ currentOrder.user_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentOrder.user_phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ getDeviceTypeText(currentOrder.device_type) }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ currentOrder.device_model || '-' }}</el-descriptions-item>
          <el-descriptions-item label="品牌">{{ currentOrder.brand_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="故障描述" :span="3">{{ currentOrder.problem_description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(currentOrder.status)" size="small">{{ getStatusText(currentOrder.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="维修进度">
            <el-progress :percentage="currentOrder.progress || 0" :stroke-width="8" style="width: 120px" />
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ currentOrder.created_at }}</el-descriptions-item>
        </el-descriptions>

        <!-- 进度照片 -->
        <div v-if="currentOrderPhotos.length > 0" class="media-section">
          <div class="media-header">
            <el-icon><Picture /></el-icon>
            <span>进度照片</span>
            <el-tag size="small" type="primary">{{ currentOrderPhotos.length }}条记录</el-tag>
          </div>
          <el-timeline>
            <el-timeline-item
              v-for="photo in currentOrderPhotos"
              :key="photo.id"
              :timestamp="formatDateTime(photo.created_at)"
              placement="top"
            >
              <div class="timeline-card">
                <div class="timeline-meta">
                  <span v-if="photo.uploaded_by_name" class="meta-uploader">
                    <el-icon><User /></el-icon> {{ photo.uploaded_by_name }}
                  </span>
                  <el-tooltip v-if="photo.feedback_group_id" :content="photo.feedback_group_id" placement="top">
                    <el-tag size="small" type="info" class="group-tag">反馈组: ...{{ photo.feedback_group_id.slice(-8) }}</el-tag>
                  </el-tooltip>
                </div>
                <div v-if="photo.description" class="timeline-desc">{{ photo.description }}</div>
                <div class="photo-grid">
                  <el-image
                    v-for="(img, imgIndex) in photo.photos"
                    :key="imgIndex"
                    :src="getFullUrl(img)"
                    :preview-src-list="photo.photos.map(p => getFullUrl(p))"
                    :initial-index="imgIndex"
                    fit="cover"
                    class="photo-thumb"
                    preview-teleported
                  />
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 进度视频 -->
        <div v-if="currentOrderVideos.length > 0" class="media-section">
          <div class="media-header">
            <el-icon><VideoCamera /></el-icon>
            <span>进度视频</span>
            <el-tag size="small" type="warning">{{ currentOrderVideos.length }}条记录</el-tag>
          </div>
          <div class="video-list">
            <div v-for="video in currentOrderVideos" :key="video.id" class="video-card">
              <div class="video-preview">
                <div class="video-click-preview" @click="openVideoPreview(video)">
                  <el-image
                    v-if="video.cover_url"
                    :src="getFullUrl(video.cover_url)"
                    fit="cover"
                    class="video-cover-image"
                  />
                  <div v-else class="video-cover-image video-cover-fallback">
                    <el-icon><VideoCamera /></el-icon>
                  </div>
                  <div class="video-play-mask">
                    <el-icon><VideoPlay /></el-icon>
                    <span>点击播放</span>
                  </div>
                </div>
              </div>
              <div class="video-meta">
                <div class="video-title">{{ video.video_title }}</div>
                <div v-if="video.description" class="video-desc">{{ video.description }}</div>
                <div class="video-info-row">
                  <span v-if="video.duration"><el-icon><Timer /></el-icon> {{ formatDuration(video.duration) }}</span>
                  <span v-if="video.file_size"><el-icon><Document /></el-icon> {{ formatFileSize(video.file_size) }}</span>
                  <span><el-icon><User /></el-icon> {{ video.uploaded_by_name || '未知' }}</span>
                  <span><el-icon><Clock /></el-icon> {{ formatDateTime(video.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无媒体提示 -->
        <div v-if="currentOrderPhotos.length === 0 && currentOrderVideos.length === 0" class="no-media-tip">
          <el-empty description="暂无进度照片和视频" :image-size="80" />
        </div>
      </template>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 照片查看对话框 -->
    <el-dialog v-model="photoDialogVisible" title="进度照片" width="900px">
      <el-timeline v-if="currentPhotos.length > 0">
        <el-timeline-item
          v-for="photo in currentPhotos"
          :key="photo.id"
          :timestamp="formatDateTime(photo.created_at)"
          placement="top"
        >
          <div class="timeline-card">
            <div class="timeline-meta">
              <span v-if="photo.uploaded_by_name" class="meta-uploader">
                <el-icon><User /></el-icon> {{ photo.uploaded_by_name }}
              </span>
            </div>
            <div v-if="photo.description" class="timeline-desc">{{ photo.description }}</div>
            <div class="photo-grid">
              <el-image
                v-for="(img, imgIndex) in photo.photos"
                :key="imgIndex"
                :src="getFullUrl(img)"
                :preview-src-list="photo.photos.map(p => getFullUrl(p))"
                :initial-index="imgIndex"
                fit="cover"
                class="photo-thumb"
                preview-teleported
              />
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无照片" :image-size="80" />
    </el-dialog>

    <!-- 视频查看对话框 -->
    <el-dialog v-model="videoDialogVisible" title="进度视频" width="900px">
      <div v-if="currentVideos.length > 0" class="video-list">
        <div v-for="video in currentVideos" :key="video.id" class="video-card">
          <div class="video-preview">
            <div class="video-click-preview" @click="openVideoPreview(video)">
              <el-image
                v-if="video.cover_url"
                :src="getFullUrl(video.cover_url)"
                fit="cover"
                class="video-cover-image"
              />
              <div v-else class="video-cover-image video-cover-fallback">
                <el-icon><VideoCamera /></el-icon>
              </div>
              <div class="video-play-mask">
                <el-icon><VideoPlay /></el-icon>
                <span>点击播放</span>
              </div>
            </div>
          </div>
          <div class="video-meta">
            <div class="video-title">{{ video.video_title }}</div>
            <div v-if="video.description" class="video-desc">{{ video.description }}</div>
            <div class="video-info-row">
              <span v-if="video.duration"><el-icon><Timer /></el-icon> {{ formatDuration(video.duration) }}</span>
              <span v-if="video.file_size"><el-icon><Document /></el-icon> {{ formatFileSize(video.file_size) }}</span>
              <span><el-icon><User /></el-icon> {{ video.uploaded_by_name || '未知' }}</span>
              <span><el-icon><Clock /></el-icon> {{ formatDateTime(video.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无视频" :image-size="80" />
    </el-dialog>

    <el-dialog
      v-model="videoPreviewVisible"
      :title="currentPreviewVideo?.video_title || '视频预览'"
      width="960px"
      destroy-on-close
      @closed="closeVideoPreview"
    >
      <div v-if="currentPreviewVideo" class="video-preview-dialog">
        <video
          ref="videoPreviewRef"
          :src="getFullUrl(currentPreviewVideo.video_url)"
          :poster="currentPreviewVideo.cover_url ? getFullUrl(currentPreviewVideo.cover_url) : ''"
          controls
          autoplay
          class="video-preview-player"
          preload="metadata"
        >
          您的浏览器不支持视频播放
        </video>
        <div class="video-preview-info">
          <div class="video-title">{{ currentPreviewVideo.video_title || '未命名视频' }}</div>
          <div v-if="currentPreviewVideo.description" class="video-desc">{{ currentPreviewVideo.description }}</div>
          <div class="video-info-row">
            <span v-if="currentPreviewVideo.duration"><el-icon><Timer /></el-icon> {{ formatDuration(currentPreviewVideo.duration) }}</span>
            <span v-if="currentPreviewVideo.file_size"><el-icon><Document /></el-icon> {{ formatFileSize(currentPreviewVideo.file_size) }}</span>
            <span><el-icon><User /></el-icon> {{ currentPreviewVideo.uploaded_by_name || '未知' }}</span>
            <span><el-icon><Clock /></el-icon> {{ formatDateTime(currentPreviewVideo.created_at) }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Search, Refresh, Picture, VideoCamera, VideoPlay, Timer, Document, User, Clock, Warning
} from '@element-plus/icons-vue'
import {
  getMiniAdminProgressMediaSummary,
  getMiniAdminOrderPhotos,
  getMiniAdminOrderVideos
} from '@/api/miniAdmin'
import {
  getMiniprogramProgressMediaSummary,
  getMiniprogramOrderPhotos,
  getMiniprogramOrderVideos
} from '@/api/repairProgress'
import { getMediaUrl } from '@/utils/media'

const route = useRoute()
const isMiniAdminRoute = computed(() => route.path.startsWith('/mini-admin'))

const loading = ref(false)
const tableData = ref([])
const detailDialogVisible = ref(false)
const photoDialogVisible = ref(false)
const videoDialogVisible = ref(false)
const currentOrder = ref(null)
const currentOrderPhotos = ref([])
const currentOrderVideos = ref([])
const currentPhotos = ref([])
const currentVideos = ref([])
const currentPreviewVideo = ref(null)
const videoPreviewVisible = ref(false)
const videoPreviewRef = ref(null)

const searchForm = reactive({ order_no: '', device_model: '' })
const pagination = reactive({ page: 1, limit: 20, total: 0 })
const stats = reactive({ hasPhotos: 0, hasVideos: 0, noMedia: 0 })

const statusMap = {
  pending: '待处理', quoted: '待确认报价', confirmed: '已确认报价',
  processing: '维修中', completed: '已完成', review: '待验收', cancelled: '已取消'
}
const statusTypeMap = {
  pending: 'info', quoted: 'warning', confirmed: 'primary',
  processing: 'warning', completed: 'success', review: 'primary', cancelled: 'danger'
}
const deviceTypeMap = { 1: '手机', 2: '电脑', 3: '平板', 4: '手表', 5: '耳机', 6: '相机', 7: '游戏机', 8: '其他' }

const getStatusType = (s) => statusTypeMap[s] || 'info'
const getStatusText = (s) => statusMap[s] || s
const getDeviceTypeText = (t) => deviceTypeMap[t] || '未知'
const getProgressColor = (p) => p < 30 ? '#f56c6c' : p < 70 ? '#e6a23c' : p < 100 ? '#409eff' : '#67c23a'

const formatDateTime = (dt) => dt ? dt.replace('T', ' ').substring(0, 19) : '-'
const formatDuration = (s) => {
  if (!s) return '-'
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}
const formatFileSize = (b) => {
  if (!b) return '-'
  const u = ['B', 'KB', 'MB', 'GB']
  let size = b, i = 0
  while (size >= 1024 && i < u.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(1)} ${u[i]}`
}
const getFullUrl = (url) => {
  return getMediaUrl(url)
}

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value
  if (!value) return []
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const normalizePhotoItem = (item) => {
  const photos = parseJsonArray(item.photos || item.images).filter(Boolean)
  return {
    ...item,
    photos
  }
}

const normalizeVideoItem = (item) => {
  return {
    ...item,
    video_url: item.video_url || '',
    cover_url: item.cover_url || item.cover || ''
  }
}

const normalizeSummaryRow = (row) => {
  const photos = parseJsonArray(row.photos_preview || row.photos || row.images).filter(Boolean)
  const videos = Array.isArray(row.videos_preview) ? row.videos_preview.map(normalizeVideoItem) : []
  return {
    ...row,
    photos_preview: photos.slice(0, 3),
    all_photo_urls: photos.map(getFullUrl),
    videos_preview: videos.slice(0, 2)
  }
}

const updateStats = () => {
  stats.hasPhotos = tableData.value.filter(i => i.photo_count > 0).length
  stats.hasVideos = tableData.value.filter(i => i.video_count > 0).length
  stats.noMedia = tableData.value.filter(i => i.photo_count === 0 && i.video_count === 0).length
}

const loadData = async () => {
  loading.value = true
  try {
    const params = { page: pagination.page, pageSize: pagination.limit }
    if (searchForm.order_no) params.order_no = searchForm.order_no
    if (searchForm.device_model) params.device_model = searchForm.device_model

    const loader = isMiniAdminRoute.value ? getMiniAdminProgressMediaSummary : getMiniprogramProgressMediaSummary
    const res = await loader(params)
    if (res.code === 200 || res.code === 0) {
      tableData.value = (res.data.items || []).map(normalizeSummaryRow)
      pagination.total = res.data.total || 0
      updateStats()
    }
  } catch (error) {
    console.error('加载数据失败', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadOrderPhotos = async (orderId) => {
  try {
    const loader = isMiniAdminRoute.value ? getMiniAdminOrderPhotos : getMiniprogramOrderPhotos
    const res = await loader(orderId)
    if (res.code === 200 || res.code === 0) currentOrderPhotos.value = (res.data || []).map(normalizePhotoItem)
  } catch (error) {
    console.error('加载订单照片失败', error)
    ElMessage.error('加载订单照片失败')
  }
}

const loadOrderVideos = async (orderId) => {
  try {
    const loader = isMiniAdminRoute.value ? getMiniAdminOrderVideos : getMiniprogramOrderVideos
    const res = await loader(orderId)
    if (res.code === 200 || res.code === 0) currentOrderVideos.value = (res.data || []).map(normalizeVideoItem)
  } catch (error) {
    console.error('加载订单视频失败', error)
    ElMessage.error('加载订单视频失败')
  }
}

const handleView = async (row) => {
  currentOrder.value = { ...row }
  await Promise.all([loadOrderPhotos(row.id), loadOrderVideos(row.id)])
  detailDialogVisible.value = true
}

const viewPhotos = async (row) => {
  await loadOrderPhotos(row.id)
  currentPhotos.value = [...currentOrderPhotos.value]
  photoDialogVisible.value = true
}

const viewVideos = async (row) => {
  await loadOrderVideos(row.id)
  currentVideos.value = [...currentOrderVideos.value]
  videoDialogVisible.value = true
}

const openVideoPreview = (video) => {
  currentPreviewVideo.value = normalizeVideoItem(video)
  videoPreviewVisible.value = true
}

const closeVideoPreview = () => {
  if (videoPreviewRef.value) {
    videoPreviewRef.value.pause()
  }
  currentPreviewVideo.value = null
}

const handleSearch = () => { pagination.page = 1; loadData() }
const handleReset = () => {
  Object.assign(searchForm, { order_no: '', device_model: '' })
  handleSearch()
}
const handleSizeChange = (size) => { pagination.page = 1; pagination.limit = size; loadData() }
const handleCurrentChange = (page) => { pagination.page = page; loadData() }

onMounted(() => { loadData() })
</script>

<style lang="scss" scoped>
.miniprogram-progress-media-page {
  .stats-cards { margin-bottom: 20px; }

  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .stat-info {
        .stat-value { font-size: 24px; font-weight: 700; color: #303133; line-height: 1.2; }
        .stat-label { font-size: 13px; color: #909399; margin-top: 2px; }
      }
    }
  }

  .search-form { margin-bottom: 16px; }
  .text-muted { color: #c0c4cc; }
  .el-pagination { margin-top: 16px; justify-content: flex-end; }

  .table-photo-preview,
  .table-video-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .table-photo-thumb,
  .table-video-thumb {
    width: 52px;
    height: 52px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #ebeef5;
    background: #f5f7fa;
    cursor: pointer;
    flex-shrink: 0;
  }

  .table-video-thumb {
    position: relative;
  }

  .table-video-cover {
    width: 100%;
    height: 100%;
    display: block;
  }

  .table-video-cover-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #909399;
    font-size: 20px;
  }

  .table-video-play {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(17, 24, 39, 0.36);
    color: #fff;
    font-size: 18px;
  }

  .media-section {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;

    .media-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }
  }

  .timeline-card {
    .timeline-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;

      .meta-uploader {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: #909399;
      }

      .group-tag { font-size: 11px; }
    }

    .timeline-desc {
      color: #606266;
      font-size: 14px;
      margin-bottom: 10px;
      line-height: 1.5;
    }

    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 8px;

      .photo-thumb {
        width: 120px;
        height: 90px;
        border-radius: 4px;
        border: 1px solid #ebeef5;
        cursor: pointer;
        transition: transform 0.2s;

        &:hover { transform: scale(1.05); }
      }
    }
  }

  .video-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .video-card {
      border: 1px solid #ebeef5;
      border-radius: 8px;
      overflow: hidden;

      .video-preview {
        background: #0f172a;

        .video-click-preview {
          position: relative;
          cursor: pointer;
        }

        .video-cover-image {
          width: 100%;
          height: 260px;
          display: block;
          object-fit: cover;
        }

        .video-cover-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.72);
          font-size: 42px;
        }

        .video-play-mask {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.18), rgba(15, 23, 42, 0.68));
          color: #fff;
          font-size: 14px;

          .el-icon {
            width: 54px;
            height: 54px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.16);
            font-size: 26px;
          }
        }
      }

      .video-meta {
        padding: 12px 16px;

        .video-title { font-size: 15px; font-weight: 600; color: #303133; margin-bottom: 4px; }
        .video-desc { font-size: 13px; color: #606266; margin-bottom: 8px; line-height: 1.5; }

        .video-info-row {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          font-size: 12px;
          color: #909399;

          span { display: flex; align-items: center; gap: 3px; }
        }
      }
    }
  }

  .no-media-tip { margin-top: 20px; }

  .video-preview-dialog {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .video-preview-player {
    width: 100%;
    max-height: 68vh;
    border-radius: 10px;
    background: #000;
  }

  .video-preview-info {
    padding: 16px;
    border-radius: 10px;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
  }
}
</style>
