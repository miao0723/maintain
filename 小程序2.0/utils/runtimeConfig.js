const { getDefaultBaseUrl, normalizeBaseUrl } = require('./networkConfig.js')

function getStoredBaseUrl() {
  try {
    const stored = wx.getStorageSync('apiBaseUrl')
    return typeof stored === 'string' ? stored.trim() : ''
  } catch (e) {
    return ''
  }
}

function isDevtoolsEnvironment() {
  try {
    const info = wx.getSystemInfoSync()
    return info && info.platform === 'devtools'
  } catch (e) {
    return false
  }
}

function getApiBaseCandidates() {
  const app = getApp ? getApp() : null
  const globalBaseUrl = app?.globalData?.baseUrl || ''
  const globalApiUrl = app?.globalData?.apiUrl || ''
  const storedBaseUrl = getStoredBaseUrl()
  const defaultBaseUrl = getDefaultBaseUrl()

  let candidates = [storedBaseUrl, globalApiUrl, globalBaseUrl, defaultBaseUrl]
    .map(normalizeBaseUrl)
    .filter(Boolean)
    .map(url => {
      // 网关路径（如 /mp-api）已由 nginx 内部转发到后端 /api，无需再追加 /api
      if (url.endsWith('/api') || url.includes('/mp-api')) return url
      return `${url}/api`
    })
    .filter((url, index, arr) => arr.indexOf(url) === index)

  if (isDevtoolsEnvironment()) {
    // 本地调试（微信开发者工具）：强制「生产网关优先、本地兜底」。
    // 忽略可能残留的本地存储/全局地址带来的顺序影响，保证优先命中线上（8.155.24.202），
    // 本机后端（127.0.0.1:3001）仅在线上不可达时才作为最后兜底；本机未启动时该尝试
    // 会立即失败、不阻塞，随即回退到线上或给出明确错误。
    const LOCAL = 'http://127.0.0.1:3001/api'
    const prod = defaultBaseUrl
    const others = candidates.filter(b => b !== LOCAL && b !== prod)
    candidates = [prod, ...others, LOCAL]
  }

  return candidates.filter((url, index, arr) => arr.indexOf(url) === index)
}

module.exports = {
  getApiBaseCandidates,
  normalizeBaseUrl
}
