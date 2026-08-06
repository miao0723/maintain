const DEFAULT_AVATAR_URL = '/images/default-avatar.png'

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
  return isInvalidAvatarUrl(url) ? fallback : url.trim()
}

module.exports = {
  DEFAULT_AVATAR_URL,
  isInvalidAvatarUrl,
  normalizeAvatarUrl
}
