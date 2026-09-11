<template>
  <router-view v-slot="{ Component }">
    <keep-alive :include="cachedViews">
      <component :is="Component" :key="$route.fullPath" />
    </keep-alive>
  </router-view>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const authStore = useAuthStore()
const themeStore = useThemeStore()

onMounted(() => {
  // 初始化主题
  themeStore.initTheme()

  // 尝试从 localStorage 恢复登录状态（生产环境不输出，避免泄露会话信息）
  authStore.loadAuthFromStorage()
  if (import.meta.env.DEV) {
    console.log('App 初始化完成，登录状态已从 localStorage 恢复')
  }
})
</script>

<style lang="scss">
#app {
  width: 100%;
  height: 100vh;
  height: 100dvh;
}
</style>
