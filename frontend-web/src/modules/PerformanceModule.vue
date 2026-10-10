<template>
  <div class="module-container">
    <!-- 横向Tab导航 -->
    <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
      <el-tab-pane
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        :label="tab.title"
      />
    </el-tabs>

    <!-- 内容区域 -->
    <div class="module-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPerformanceContext } from '@/api/performance'

const route = useRoute()
const router = useRouter()

// 全部 Tab；工人仅保留「绩效总览 / 工单明细」（只看本人），老板/管理员看全部
const allTabs = [
  { name: 'overview', title: '绩效总览', path: '/performance/overview', worker: false },
  { name: 'ranking', title: '绩效排行', path: '/performance/ranking', worker: false },
  { name: 'work-orders', title: '工单明细', path: '/performance/work-orders', worker: true },
  { name: 'score-rules', title: '评分规则', path: '/performance/score-rules', worker: false }
]

const isWorker = ref(false)
const tabs = ref(allTabs)

const updateActiveTab = () => {
  const path = route.path
  const tab = tabs.value.find(t => path.startsWith(t.path))
  if (tab) {
    activeTab.value = tab.name
  }
}

onMounted(async () => {
  try {
    const ctx = await getPerformanceContext().then(r => r.data || {})
    isWorker.value = !!ctx.is_worker
  } catch (e) {}
  // 工人：仅展示本人可见的 Tab（工单明细），避免看到全班组数据
  if (isWorker.value) {
    tabs.value = allTabs.filter(t => t.worker)
  }
  updateActiveTab()
  // 工人进入的是非本人可见页（如绩效总览/排行/评分规则）时，自动跳到工单明细，
  // 否则顶部 Tab 栏无激活项，页面看起来像“加载不出来”
  if (isWorker.value) {
    const allowed = tabs.value.some(t => route.path.startsWith(t.path))
    if (!allowed) {
      router.replace('/performance/work-orders')
    }
  }
})

watch(() => route.path, () => {
  updateActiveTab()
})

const handleTabChange = (tabName) => {
  const tab = tabs.value.find(t => t.name === tabName)
  if (tab) {
    router.push(tab.path)
  }
}

const activeTab = ref('')
</script>

<style lang="scss" scoped>
@import './module-common.scss';
</style>
