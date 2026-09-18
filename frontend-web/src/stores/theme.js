import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 初始值直接从存储/系统偏好读取。
  // 不能先用 false 初始化再靠 watch(immediate) 落盘：
  // immediate 回调会先把 localStorage 覆写为 light，整页刷新后暗色即丢失。
  const prefersStoredTheme = () => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  const isDark = ref(prefersStoredTheme())

  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  const setDark = (dark) => {
    isDark.value = dark
  }

  const initTheme = () => {
    isDark.value = prefersStoredTheme()
  }

  watch(isDark, (newVal) => {
    localStorage.setItem('theme', newVal ? 'dark' : 'light')

    // 切换 Element Plus 的暗色模式
    document.documentElement.classList.toggle('dark', newVal)

    // 触发自定义事件，通知其他组件主题已切换
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isDark: newVal } }))
  }, { immediate: true })

  return {
    isDark,
    toggleTheme,
    setDark,
    initTheme
  }
})
