const DEFAULT_AVATAR_URL = '/images/default-avatar.png'

// 后端上传头像返回的相对路径前缀（如 /uploads/avatars/xxx.jpg）
const UPLOADS_PREFIX = '/uploads/'

function getBaseUrl() {
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

  // 后端返回的相对路径（/uploads/avatars/xxx.jpg）补全为完整可访问地址
  if (raw.startsWith(UPLOADS_PREFIX)) {
    const base = getBaseUrl().replace(/\/+$/, '')
    return `${base}${raw}`
  }

  return raw
}

module.exports = {
  DEFAULT_AVATAR_URL,
  isInvalidAvatarUrl,
  normalizeAvatarUrl
}
