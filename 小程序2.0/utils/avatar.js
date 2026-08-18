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
  // 关键修复：后端 getPublicBaseUrl() 在未配置 PUBLIC_BASE_URL 时会回退成内网/localhost 地址
  //（如 http://192.168.8.72:3001/uploads/... 或 http://localhost:3001/...），小程序端无法访问，
  // 导致"头像获取不到"。因此这里对【任意】路径以 /uploads/ 开头的 URL（相对或完整、不管域名）
  // 都重写为 API 基址下的 /api/uploads/...，保证无论后端返回什么 host 都可被小程序读取。
  let uploadPath = null
  if (raw.startsWith(UPLOADS_PREFIX)) {
    uploadPath = raw
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
    return `${apiBase}/api${uploadPath}`
  }

  return raw
}

module.exports = {
  DEFAULT_AVATAR_URL,
  isInvalidAvatarUrl,
  normalizeAvatarUrl
}
