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

  // 尝试从 localStorage 恢复登录状态
  console.log('App 初始化，从 localStorage 加载认证信息')
  authStore.loadAuthFromStorage()
  console.log('加载后 token:', authStore.token)
  console.log('加载后 userInfo:', authStore.userInfo)
})
</script>

<style lang="scss">
#app {
  width: 100%;
  height: 100vh;
}
</style>
