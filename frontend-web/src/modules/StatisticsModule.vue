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

const route = useRoute()
const router = useRouter()

const tabs = [
  { name: 'income', title: '收入统计', path: '/statistics/income' },
  { name: 'expense', title: '开支统计', path: '/statistics/expense' },
  { name: 'order-stats', title: '订单统计', path: '/statistics/order-stats' },
  { name: 'timeout', title: '超时统计', path: '/statistics/timeout' }
]

const activeTab = ref('')

const updateActiveTab = () => {
  const path = route.path
  const tab = tabs.find(t => path.startsWith(t.path))
  if (tab) {
    activeTab.value = tab.name
  }
}

onMounted(() => {
  updateActiveTab()
})

watch(() => route.path, () => {
  updateActiveTab()
})

const handleTabChange = (tabName) => {
  const tab = tabs.find(t => t.name === tabName)
  if (tab) {
    router.push(tab.path)
  }
}
</script>

<style lang="scss" scoped>
@import './module-common.scss';
</style>
