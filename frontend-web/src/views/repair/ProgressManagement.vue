<template>
  <div class="progress-management">
    <el-card>
           <!-- 子菜单导航 -->
      <el-radio-group v-model="activeTab" @change="handleTabChange" class="progress-tabs">
        <el-radio-button value="list">订单进度</el-radio-button>
        <el-radio-button value="apply">进度申请</el-radio-button>
        <el-radio-button value="photo">进度照片</el-radio-button>
        <el-radio-button value="video">进度视频</el-radio-button>
        </el-radio-group>

      <!-- 内容区域 -->
      <div class="progress-content">
        <router-view />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = ref('list')

const updateActiveTab = () => {
  const path = route.path
  if (path.includes('/list')) {
    activeTab.value = 'list'
  } else if (path.includes('/apply')) {
    activeTab.value = 'apply'
  } else if (path.includes('/photo')) {
    activeTab.value = 'photo'
  } else if (path.includes('/video')) {
    activeTab.value = 'video'
  }
}

onMounted(() => {
  updateActiveTab()
})

watch(() => route.path, () => {
  updateActiveTab()
})

const handleTabChange = (tab) => {
  if (tab === 'list') {
    router.push('/repair/progress/list')
  } else if (tab === 'apply') {
    router.push('/repair/progress/apply')
  } else if (tab === 'photo') {
    router.push('/repair/progress/photo')
  } else if (tab === 'video') {
    router.push('/repair/progress/video')
  }
}
</script>

<style lang="scss" scoped>
.progress-management {
  .progress-tabs {
    margin-bottom: 20px;
  }

  .progress-content {
    min-height: 400px;
  }
}
</style>
