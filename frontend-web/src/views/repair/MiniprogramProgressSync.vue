<template>
  <div class="miniprogram-progress-sync">
    <el-card class="mb-4" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">小程序维修进度同步</span>
          <el-button
            type="primary"
            size="small"
            @click="handleRefresh"
            :loading="loading"
          >
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <!-- 订单选择 -->
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="小程序订单">
          <el-select
            v-model="queryForm.orderId"
            placeholder="选择订单"
            filterable
            clearable
            @change="handleOrderChange"
          >
            <el-option
              v-for="order in orders"
              :key="order.id"
              :label="`${order.orderNo} - ${order.deviceModel || ''}`"
              :value="order.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 进度信息 -->
      <div v-if="progressData && progressData.cmms_order_id" class="progress-content">
        <el-divider content-position="left">同步信息</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="小程序订单ID">
            {{ progressData.miniprogram_order_id }}
          </el-descriptions-item>
          <el-descriptions-item label="CMMS订单ID">
            {{ progressData.cmms_order_id }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 进度记录 -->
        <el-divider content-position="left">进度记录</el-divider>
        <div v-if="progressData.progress && progressData.progress.length > 0">
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in sortedProgress"
              :key="item.id"
              :timestamp="item.created_at"
              placement="top"
              :type="getProgressType(item.status)"
            >
              <el-card>
                <div class="progress-item">
                  <h4>{{ item.stage_name || item.stage }}</h4>
                  <div class="progress-bar">
                    <el-progress
                      :percentage="item.progress"
                      :status="getProgressStatus(item.progress)"
                    />
                  </div>
                  <p class="description">{{ item.description || '无描述' }}</p>
                  <div class="meta">
                    <el-tag size="small" type="info">{{ item.status }}</el-tag>
                    <el-tag size="small" v-if="item.handler_name">
                      {{ item.handler_name }}
                    </el-tag>
                  </div>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
        <el-empty v-else description="暂无进度记录" />

        <!-- 进度照片 -->
        <el-divider content-position="left">进度照片</el-divider>
        <div v-if="progressData.photos && progressData.photos.length > 0">
          <div class="photo-grid">
            <div
              v-for="photo in progressData.photos"
              :key="photo.id"
              class="photo-item"
            >
              <el-card shadow="hover">
                <template #header>
                  <div class="photo-header">
                    <span class="photo-title">{{ photo.description || '照片' }}</span>
                    <span class="photo-count">{{ photo.photo_count || 0 }}张</span>
                  </div>
                </template>
                <div class="photo-preview">
                  <el-image
                    v-if="photo.photos && photo.photos.length > 0"
                    :src="getFullUrl(photo.photos[0])"
                    :preview-src-list="photo.photos.map(item => getFullUrl(item))"
                    fit="cover"
                    style="width: 100%; height: 200px"
                    preview-teleported
                  >
                    <template #error>
                      <div class="image-slot">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  <div v-else class="empty-slot">
                    <el-icon><Picture /></el-icon>
                  </div>
                </div>
                <div class="photo-meta">
                  <el-text size="small" type="info">
                    {{ photo.uploaded_by_name || '未知' }}
                  </el-text>
                  <el-text size="small" type="info">
                    {{ formatDate(photo.created_at) }}
                  </el-text>
                </div>
              </el-card>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无进度照片" />

        <!-- 进度视频 -->
        <el-divider content-position="left">进度视频</el-divider>
        <div v-if="progressData.videos && progressData.videos.length > 0">
          <div class="video-grid">
            <div
              v-for="video in progressData.videos"
              :key="video.id"
              class="video-item"
            >
              <el-card shadow="hover">
                <template #header>
                  <div class="video-title">{{ video.video_title }}</div>
                </template>
                <div class="video-preview">
                  <video
                    v-if="video.video_url"
                    :src="getFullUrl(video.video_url)"
                    controls
                    style="width: 100%; height: 200px"
                    preload="metadata"
                  />
                  <div v-else class="empty-slot">
                    <el-icon><VideoCamera /></el-icon>
                  </div>
                </div>
                <div class="video-info">
                  <p v-if="video.description">{{ video.description }}</p>
                  <el-divider style="margin: 8px 0" />
                  <div class="video-meta">
                    <el-text size="small" type="info">
                      时长: {{ formatDuration(video.duration) }}
                    </el-text>
                    <el-text size="small" type="info">
                      大小: {{ formatFileSize(video.file_size) }}
                    </el-text>
                    <el-text size="small" type="info">
                      {{ video.uploaded_by_name || '未知' }}
                    </el-text>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无进度视频" />
      </div>

      <el-empty v-else description="请选择小程序订单查看同步进度" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Picture, VideoCamera } from '@element-plus/icons-vue';
import axios from 'axios';
import { getMediaUrl } from '@/utils/media';

const loading = ref(false);
const orders = ref([]);
const progressData = ref(null);
const queryForm = ref({
  orderId: null
});

const sortedProgress = computed(() => {
  if (!progressData.value || !progressData.value.progress) {
    return [];
  }
  return [...progressData.value.progress].sort((a, b) => {
    return new Date(a.created_at) - new Date(b.created_at);
  });
});

const getProgressType = (status) => {
  const map = {
    'pending': 'warning',
    'in_progress': 'primary',
    'completed': 'success'
  };
  return map[status] || 'info';
};

const getProgressStatus = (progress) => {
  if (progress >= 100) return 'success';
  if (progress >= 50) return 'warning';
  return '';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDuration = (seconds) => {
  if (!seconds) return '0秒';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`;
  }
  return `${remainingSeconds}秒`;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

const getFullUrl = (url) => {
  return getMediaUrl(url);
};

const loadOrders = async () => {
  try {
    const response = await axios.get('/api/repair-orders', {
      params: { page: 1, pageSize: 100 }
    });
    if (response.data.success || response.data.code === 200 || response.data.code === 0) {
      orders.value = response.data.data || [];
    }
  } catch (error) {
    console.error('加载订单失败:', error);
    ElMessage.error('加载订单失败');
  }
};

const handleRefresh = async () => {
  if (!queryForm.value.orderId) {
    ElMessage.warning('请先选择订单');
    return;
  }
  await loadProgressData();
};

const handleOrderChange = async () => {
  if (queryForm.value.orderId) {
    await loadProgressData();
  } else {
    progressData.value = null;
  }
};

const loadProgressData = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`/api/miniprogram-progress/${queryForm.value.orderId}`);
    if (response.data.success || response.data.code === 200 || response.data.code === 0) {
      progressData.value = response.data.data;
    } else {
      ElMessage.error(response.data.message || '加载进度数据失败');
    }
  } catch (error) {
    console.error('加载进度数据失败:', error);
    ElMessage.error('加载进度数据失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadOrders();
});
</script>

<style scoped>
.miniprogram-progress-sync {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
}

.search-form {
  margin-top: 20px;
}

.progress-content {
  margin-top: 20px;
}

.progress-item {
  padding: 10px;
}

.progress-item h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 500;
}

.progress-bar {
  margin-bottom: 10px;
}

.progress-item .description {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
}

.progress-item .meta {
  display: flex;
  gap: 8px;
}

.photo-grid,
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.photo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.photo-title {
  font-size: 14px;
  font-weight: 500;
}

.photo-count {
  font-size: 12px;
  color: #909399;
}

.photo-preview,
.video-preview {
  position: relative;
}

.image-slot,
.empty-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 200px;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 32px;
}

.photo-meta,
.video-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-info p {
  margin: 8px 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
