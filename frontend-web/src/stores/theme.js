import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  const setDark = (dark) => {
    isDark.value = dark
  }

  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      isDark.value = true
    } else if (savedTheme === 'light') {
      isDark.value = false
    } else {
      // 检查系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDark.value = prefersDark
    }
  }

  watch(isDark, (newVal) => {
    localStorage.setItem('theme', newVal ? 'dark' : 'light')

    // 切换 Element Plus 的暗色模式
    const html = document.documentElement
    if (newVal) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }

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
