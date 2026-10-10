<template>
  <div class="module-container">
    <!-- 顶部操作条：Tab + 常驻「新建工单」入口（两个 Tab 都可见，避免找不到入口） -->
    <div class="module-bar">
      <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
        <el-tab-pane
          v-for="tab in tabs"
          :key="tab.name"
          :name="tab.name"
          :label="tab.title"
        />
      </el-tabs>
      <el-button type="primary" :icon="Plus" @click="goCreate">新建工单</el-button>
    </div>

    <!-- 内容区域 -->
    <div class="module-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const tabs = [
  { name: 'my-tasks', title: '我的工单', path: '/repair-tasks/my-tasks' },
  { name: 'devices', title: '设备台账', path: '/repair-tasks/devices' }
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

// 常驻「新建工单」：跳到我的工单并以 query 触发自动弹出建单框
const goCreate = () => {
  router.push({ path: '/repair-tasks/my-tasks', query: { create: '1' } })
}
</script>

<style lang="scss" scoped>
@import './module-common.scss';

.module-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #ebeef5;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  padding: 10px 14px 0;

  :deep(.el-tabs) {
    flex: 1;
  }
  :deep(.el-tabs__header) {
    margin: 0;
    border-bottom: 1px solid #ebeef5;
  }
}

.module-content {
  background: #fff;
  border: 1px solid #ebeef5;
  border-top: none;
  border-radius: 0 0 8px 8px;
  padding: 16px;
  min-height: 320px;
}
</style>
