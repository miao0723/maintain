<template>
  <div class="test-report-management">
    <div class="tab-bar">
      <el-radio-group v-model="activeTab" @change="handleTabChange" class="report-tabs" size="default">
        <el-radio-button label="records">检测记录</el-radio-button>
        <el-radio-button label="quote">维修报价单</el-radio-button>
        <el-radio-button label="fee">检测费用</el-radio-button>
      </el-radio-group>
      <p class="tab-hint">「检测记录」数据来自数据库表 <code>test_reports</code>，与后端接口 <code>/api/test-reports</code> 同步</p>
    </div>
    <div class="report-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = ref('records')

const updateActiveTab = () => {
  const path = route.path
  if (path.includes('/records')) {
    activeTab.value = 'records'
  } else if (path.includes('/quote')) {
    activeTab.value = 'quote'
  } else if (path.includes('/fee')) {
    activeTab.value = 'fee'
  }
}

onMounted(() => {
  updateActiveTab()
})

watch(() => route.path, () => {
  updateActiveTab()
})

const handleTabChange = (tab) => {
  if (tab === 'records') {
    if (route.path === '/repair/test-report/records') return
    router.push('/repair/test-report/records').catch(() => {})
  } else if (tab === 'quote') {
    if (route.path === '/repair/test-report/quote') return
    router.push('/repair/test-report/quote').catch(() => {})
  } else if (tab === 'fee') {
    if (route.path === '/repair/test-report/fee') return
    router.push('/repair/test-report/fee').catch(() => {})
  }
}
</script>

<style lang="scss" scoped>
.test-report-management {
  .tab-bar {
    margin-bottom: 16px;
  }

  .report-tabs {
    margin-bottom: 8px;
  }

  .tab-hint {
    margin: 0;
    font-size: 12px;
    color: #94a3b8;
    line-height: 1.5;

    code {
      font-size: 11px;
      padding: 1px 6px;
      background: #f1f5f9;
      border-radius: 4px;
      color: #64748b;
    }
  }

  .report-content {
    min-height: 360px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
