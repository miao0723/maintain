const { getDefaultBaseUrl, normalizeBaseUrl, isGatewayUrl } = require('./networkConfig.js')

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
    // 直连地址追加 /api 前缀，网关地址（如 /mp-api）已含路由路径，不再追加
    .map(url => {
      if (isGatewayUrl(url)) return url  // https://域名/mp-api → 直接使用
      if (url.endsWith('/api')) return url
      return `${url}/api`  // http://IP:3001 → http://IP:3001/api
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
