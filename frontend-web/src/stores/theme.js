import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

// 三套主题：阳光（浅色）/ 护眼（暖色护眼浅色）/ 夜间（深色）
export const THEMES = [
  { key: 'light', label: '阳光', icon: 'Sunny', desc: '明亮清爽的浅色界面' },
  { key: 'eye', label: '护眼', icon: 'View', desc: '低蓝光暖色，长时间阅读更舒适' },
  { key: 'dark', label: '夜间', icon: 'Moon', desc: '暗色护眼，夜间使用不刺眼' }
]

const STORAGE_KEY = 'theme'

// 读取持久化 / 系统偏好，兼容旧版只存 light/dark 的写法
const resolveInitialTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark') return 'dark'
  if (saved === 'eye') return 'eye'
  if (saved === 'light') return 'light'
  // 未设置时跟随系统：系统偏好深色则默认夜间，否则阳光
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// 把主题 key 映射到 <html> 上的 class：
// - dark  → 同时挂 .dark（激活 Element Plus 暗色变量）与 .theme-dark
// - eye   → 挂 .theme-eye（暖色护眼，Element Plus 仍走浅色，仅自定义 token 变）
// - light → 不挂任何 class（token 用 :root 默认值）
const applyThemeClasses = (theme) => {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('theme-dark', theme === 'dark')
  root.classList.toggle('theme-eye', theme === 'eye')
}

export const useThemeStore = defineStore('theme', () => {
  // 初始值直接读存储/系统偏好；不能先用 'light' 初始化再靠 watch(immediate) 落盘，
  // 否则 immediate 会先把 localStorage 覆写为 light，整页刷新后主题即丢失。
  const theme = ref(resolveInitialTheme())

  // 兼容旧组件：是否深色（夜间）。Dashboard 图表等据此取色。
  const isDark = computed(() => theme.value === 'dark')

  const setTheme = (key) => {
    if (THEMES.some(t => t.key === key)) theme.value = key
  }

  // 顺序切换：阳光 → 护眼 → 夜间 → 阳光
  const toggleTheme = () => {
    const order = THEMES.map(t => t.key)
    const idx = order.indexOf(theme.value)
    theme.value = order[(idx + 1) % order.length]
  }

  const initTheme = () => {
    theme.value = resolveInitialTheme()
  }

  watch(theme, (newVal) => {
    localStorage.setItem(STORAGE_KEY, newVal)
    applyThemeClasses(newVal)
    // 通知其他组件（图表等）主题已切换
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: newVal, isDark: newVal === 'dark' } }))
  }, { immediate: true })

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
    initTheme
  }
})
