const DEFAULT_AVATAR_URL = '/images/default-avatar.png'

// 后端上传头像返回的相对路径前缀（如 /uploads/avatars/xxx.jpg）
const UPLOADS_PREFIX = '/uploads/'

// API 基址（带 /mp-api 前缀，nginx 反代到后端 /api）
function getApiBaseUrl() {
  try {
    const { getDefaultBaseUrl } = require('./networkConfig.js')
    return getDefaultBaseUrl()
  } catch (e) {
    return 'http://8.155.24.202:3001'
  }
}

function isInvalidAvatarUrl(url) {
  if (!url || typeof url !== 'string') {
    return true
  }

  const trimmedUrl = url.trim()
  if (!trimmedUrl || trimmedUrl === 'null' || trimmedUrl === 'undefined') {
    return true
  }

  // 兼容小程序本地临时文件和项目内静态资源
  if (
    trimmedUrl.startsWith('wxfile://') ||
    trimmedUrl.startsWith('http://tmp/') ||
    trimmedUrl.startsWith('/')
  ) {
    return false
  }

  // 历史示例数据里存在一批失效的微信头像链接，会稳定返回 400
  if (
    trimmedUrl.includes('thirdwx.qlogo.cn') &&
    /(I6Gqy){2,}/.test(trimmedUrl)
  ) {
    return true
  }

  return !/^https?:\/\//.test(trimmedUrl)
}

function normalizeAvatarUrl(url, fallback = DEFAULT_AVATAR_URL) {
  const raw = (url || '').toString().trim()
  if (isInvalidAvatarUrl(raw)) {
    return fallback
  }

  // 本地上传资源（头像等）统一走 API 基址（如 https://zych.net.cn/mp-api/api/uploads/...），
  // 与后端 /api/uploads 静态路由、以及其它业务接口同一条反代路径，
  // 避免根路径 /uploads 未被 nginx 反代到后端时持续 404。
  // 匹配：相对路径 /uploads/...，或完整 URL 且域名与 API 域名一致、路径以 /uploads/ 开头。
  let uploadPath = null
  if (raw.startsWith(UPLOADS_PREFIX)) {
    uploadPath = raw
  } else {
    try {
      const u = new URL(raw)
      let apiHost = null
      try { apiHost = new URL(getApiBaseUrl()).host } catch (e) { apiHost = null }
      if (apiHost && u.host === apiHost && u.pathname.startsWith(UPLOADS_PREFIX)) {
        uploadPath = u.pathname + (u.search || '')
      }
    } catch (e) { /* 非标准 URL，忽略 */ }
  }

  if (uploadPath) {
    const apiBase = getApiBaseUrl().replace(/\/+$/, '')
    return `${apiBase}/api${uploadPath}`
  }

  return raw
}

module.exports = {
  DEFAULT_AVATAR_URL,
  isInvalidAvatarUrl,
  normalizeAvatarUrl
}
