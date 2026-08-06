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
  { name: 'users', title: '用户管理', path: '/basic/users' },
  { name: 'roles', title: '角色管理', path: '/basic/roles' },
  { name: 'permissions', title: '权限管理', path: '/basic/permissions' },
  { name: 'personnel', title: '人员管理', path: '/basic/personnel' },
  { name: 'organizations', title: '单位管理', path: '/basic/organizations' },
  { name: 'logs', title: '日志管理', path: '/basic/logs' },
  { name: 'params', title: '参数管理', path: '/basic/params' }
]

const activeTab = ref('')

// 从路由路径获取当前激活的tab
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

// Tab切换时跳转路由
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

  .module-content {
    flex: 1;
    overflow: auto;
    padding: 20px;
    background: #f0f2f5;
  }
}

:deep(.el-tabs) {
  background: #fff;
  padding: 0 20px;
  margin-bottom: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}

:deep(.el-tabs__header) {
  margin: 0;
}

:deep(.el-tabs__nav) {
  border: none;
}

:deep(.el-tabs__item) {
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0 20px;
  height: 50px;
  line-height: 50px;

  &.is-active {
    color: #409EFF;
    border-bottom-color: #409EFF;
  }
}
</style>
