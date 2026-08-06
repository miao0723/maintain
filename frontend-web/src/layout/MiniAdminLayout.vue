<template>
  <el-container class="mini-layout">
    <el-aside :width="collapsed ? '72px' : '240px'" class="mini-sidebar">
      <div class="mini-logo">
        <span v-if="collapsed">MP</span>
        <span v-else>Mini Admin</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="collapsed"
        router
        class="mini-menu"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="mini-header">
        <div class="mini-header-left">
          <el-button link @click="collapsed = !collapsed">
            <el-icon><component :is="collapsed ? 'Expand' : 'Fold'" /></el-icon>
          </el-button>
          <span class="mini-header-title">{{ currentTitle }}</span>
        </div>
        <div class="mini-header-right">
          <span class="mini-user">{{ authStore.userInfo?.real_name || authStore.userInfo?.username }}</span>
          <el-button link @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main class="mini-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const collapsed = ref(false)

const menuItems = computed(() => {
  const root = router.getRoutes().find(item => item.name === 'MiniAdminRoot')
  return (root?.children || [])
    .filter(item => {
      if (!item.meta?.title || item.meta?.hidden) {
        return false
      }
      return true
    })
    .map(item => ({
      path: `/mini-admin/${item.path}`,
      title: item.meta.title,
      icon: item.meta.icon
    }))
})

const currentTitle = computed(() => route.meta?.title || '小程序后台')

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定退出系统吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await authStore.logout()
    router.push('/login')
  } catch {
    // ignore
  }
}
</script>

<style scoped lang="scss">
.mini-layout {
  width: 100%;
  height: 100vh;
}

.mini-sidebar {
  background: linear-gradient(180deg, #16213e 0%, #0f172a 100%);
  color: #fff;
  transition: width 0.25s ease;
}

.mini-logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.08em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.mini-menu {
  border-right: none;
  background: transparent;
}

.mini-sidebar :deep(.el-menu) {
  background: transparent;
  border-right: none;
}

.mini-sidebar :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.78);
}

.mini-sidebar :deep(.el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.mini-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.mini-header-left,
.mini-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mini-header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.mini-user {
  color: #4b5563;
}

.mini-main {
  background: #f5f7fb;
  padding: 20px;
}
</style>
