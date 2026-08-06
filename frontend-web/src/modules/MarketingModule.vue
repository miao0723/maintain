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
  { name: 'cases', title: '成功案例', path: '/marketing/cases' },
  { name: 'service', title: '人工客服', path: '/marketing/service' },
  { name: 'douyin', title: '抖音获客', path: '/marketing/douyin' },
  { name: 'xiaohongshu', title: '小红书', path: '/marketing/xiaohongshu' },
  { name: 'kuaishou', title: '快手', path: '/marketing/kuaishou' },
  { name: 'bilibili', title: 'B站', path: '/marketing/bilibili' },
  { name: 'partners', title: '合作企业', path: '/marketing/partners' }
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
