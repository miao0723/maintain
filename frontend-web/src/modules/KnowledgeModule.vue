<template>
  <div class="module-container">
    <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
      <el-tab-pane
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        :label="tab.title"
      />
    </el-tabs>

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
  { name: 'collections', title: '知识库管理', path: '/knowledge/collections' },
  { name: 'chat', title: 'AI 对话', path: '/knowledge/chat' }
]

const activeTab = ref('')

const updateActiveTab = () => {
  const path = route.path
  // KbDetail子路由应该高亮collections标签
  if (path.includes('/knowledge/collections')) {
    activeTab.value = 'collections'
  } else if (path.includes('/knowledge/chat')) {
    activeTab.value = 'chat'
  } else {
    const tab = tabs.find(t => path.startsWith(t.path))
    if (tab) {
      activeTab.value = tab.name
    }
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
.module-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.14), transparent 28%),
    linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);

  .module-content {
    flex: 1;
    overflow: auto;
    padding: 24px;
    background: transparent;
  }
}

:deep(.el-tabs) {
  margin: 20px 24px 0;
  padding: 14px 18px 0;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px 24px 0 0;
  margin-bottom: 0;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
}

:deep(.el-tabs__header) {
  margin: 0;
}

:deep(.el-tabs__nav) {
  border: none;
  gap: 10px;
}

:deep(.el-tabs__item) {
  border: none !important;
  padding: 0 20px !important;
  height: 44px;
  line-height: 44px;
  border-radius: 14px 14px 0 0;
  color: #64748b;
  transition: all 0.2s ease;

  &.is-active {
    color: #1d4ed8;
    background: linear-gradient(180deg, rgba(239, 246, 255, 0.96), rgba(255, 255, 255, 0.96));
    box-shadow: inset 0 -2px 0 #2563eb;
  }

  &:hover {
    color: #2563eb;
  }
}

@media (max-width: 768px) {
  .module-container {
    .module-content {
      padding: 16px;
    }
  }

  :deep(.el-tabs) {
    margin: 16px 16px 0;
    padding: 10px 12px 0;
  }

  :deep(.el-tabs__item) {
    padding: 0 14px !important;
  }
}
</style>
