const DEFAULT_AVATAR_URL = '/images/avatar-repair.png'

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

  // 兼容小程序本地临时文件、项目内静态资源、以及相对上传路径（含/不含前导斜杠）
  if (
    trimmedUrl.startsWith('wxfile://') ||
    trimmedUrl.startsWith('http://tmp/') ||
    trimmedUrl.startsWith('/') ||
    trimmedUrl.startsWith('uploads/')
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

  // 本地上传资源（头像等）统一走网关基址下的 /uploads/...，
  // 例如 /uploads/avatars/xxx.jpg 或 uploads/avatars/xxx.jpg（历史缺前导斜杠）
  // → https://zych.net.cn/mp-api/uploads/avatars/xxx.jpg
  // 注意：nginx 将 /mp-api 反代到后端 /api，故此处【不要】再加 /api，
  // 否则会形成 /mp-api/api/uploads 双重路径导致线上 404（与 utils/mediaUrl.js 保持一致）。
  let uploadPath = null
  if (raw.startsWith(UPLOADS_PREFIX)) {
    uploadPath = raw
  } else if (raw.startsWith('uploads/')) {
    uploadPath = '/' + raw
  } else {
    try {
      const u = new URL(raw)
      if (u.pathname.startsWith(UPLOADS_PREFIX)) {
        uploadPath = u.pathname + (u.search || '')
      }
    } catch (e) { /* 非标准 URL，忽略 */ }
  }

  if (uploadPath) {
    const apiBase = getApiBaseUrl().replace(/\/+$/, '')
    return `${apiBase}${uploadPath}`
  }

  return raw
}

module.exports = {
  DEFAULT_AVATAR_URL,
  isInvalidAvatarUrl,
  normalizeAvatarUrl
}
