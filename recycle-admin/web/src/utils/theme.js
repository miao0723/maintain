/**
 * 回收系统主题工具
 *
 * 与维修后台共用同一个 localStorage key（两系统同源部署），
 * 任一系统切换主题，另一系统下次加载即自动同步。
 * 挂载方式与维修后台一致：<html class="dark"> + Element Plus 暗色变量。
 */

const THEME_KEY = 'theme'
const STORAGE_SYNC_KEY = 'theme_updated_at'

export function getTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'dark') return true
  if (saved === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme(isDark) {
  document.documentElement.classList.toggle('dark', isDark)
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
  // 时间戳用于让另一系统（另一标签页）通过 storage 事件感知切换
  localStorage.setItem(STORAGE_SYNC_KEY, String(Date.now()))
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isDark } }))
}

export function initTheme() {
  applyTheme(getTheme())
  // 同源其他标签页（维修后台）切换主题时同步跟随
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_SYNC_KEY || e.key === THEME_KEY) {
      const isDark = getTheme()
      document.documentElement.classList.toggle('dark', isDark)
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isDark } }))
    }
  })
}

export function toggleTheme() {
  applyTheme(!document.documentElement.classList.contains('dark'))
}

export function isDarkNow() {
  return document.documentElement.classList.contains('dark')
}

/** ECharts 暗色适配：坐标轴/分割线/提示框配色随主题取值 */
export function chartTheme() {
  const dark = isDarkNow()
  return {
    dark,
    text: dark ? '#cfd3dc' : '#303133',
    axisLine: dark ? '#414243' : '#e0e0e0',
    axisLabel: dark ? '#909399' : '#999',
    splitLine: dark ? '#2c2c2c' : '#f0f0f0',
    tooltipBg: dark ? '#1f1f1f' : '#fff',
    tooltipBorder: dark ? '#414243' : '#e0e0e0',
    tooltipText: dark ? '#e0e0e0' : '#333'
  }
}
