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

  const candidates = [storedBaseUrl, globalApiUrl, globalBaseUrl, defaultBaseUrl]
    .map(normalizeBaseUrl)
    .filter(Boolean)
    .map(url => {
      // 网关路径（如 /mp-api）已由 nginx 内部转发到后端 /api，无需再追加 /api
      if (url.endsWith('/api') || url.includes('/mp-api')) return url
      return `${url}/api`
    })
    .filter((url, index, arr) => arr.indexOf(url) === index)

  if (isDevtoolsEnvironment()) {
    candidates.push('http://127.0.0.1:3001/api')
  }

  return candidates.filter((url, index, arr) => arr.indexOf(url) === index)
}

module.exports = {
  getApiBaseCandidates,
  normalizeBaseUrl
}
