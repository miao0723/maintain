// 媒体文件（进度照片 / 视频 / 封面）URL 统一归一化工具
//
// 后端上传进度照片、视频时，默认落盘到 backend/uploads/progress/{orderId}/，
// 数据库 / 接口返回的地址是相对路径，例如：
//   /uploads/progress/25/1779525332343-126947465.jpg
//
// 小程序（<image src>、<video src>、wx.previewImage、wx.getImageInfo）都必须使用
// 完整 HTTPS 地址才能加载。本项目统一网关约定（见 utils/mpApi.js）：
//   线上网关 https://zych.net.cn/mp-api  →  nginx 反代到后端 /api
// 因此正确的本地媒体地址是：
//   https://zych.net.cn/mp-api/uploads/progress/25/xxx.jpg
// 注意：不要再手写 /api，否则会形成 /mp-api/api/uploads（双重 /api）导致线上 404。
//
// 另外，后端已支持「远程存储」模式（FILE_STORAGE_MODE=remote）：
// 文件会上传到你自己的公网文件服务器，数据库里存的是该服务器的完整 URL，
// 例如 https://你的文件服务器/uploads/xxx.jpg —— 这类「外来公网域名」地址
// 必须原样返回，绝不能重写成小程序网关。
//
// 本函数幂等，处理规则：
//   - 相对路径 /uploads/... → 补上网关基址
//   - 外来公网域名（远程存储服务器、CDN 等）的 http(s) 完整地址 → 原样返回
//   - 本机/内网地址（localhost、127.0.0.1、192.168.x 等，开发遗留）→ 重写为网关基址
//   - 网关自身域名且路径以 /uploads/ 开头（历史数据缺 /mp-api 前缀）→ 重写为规范网关地址
//   - wxfile:// / http://tmp/ 等本地临时地址 → 原样返回（不能也不应被改写）
//   - 其它非 uploads 地址 → 原样返回

function getApiBaseUrl() {
  try {
    const { getDefaultBaseUrl } = require('./networkConfig.js')
    return getDefaultBaseUrl()
  } catch (e) {
    return 'https://zych.net.cn/mp-api'
  }
}

// 判断是否本机 / 内网地址（开发环境遗留的绝对地址才允许被重写）
function isLocalHost(host) {
  if (!host) return false
  const h = host.split(':')[0].toLowerCase()
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0') return true
  if (/^10\./.test(h) || /^192\.168\./.test(h)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true
  return false
}

function normalizeMediaUrl(url) {
  if (!url || typeof url !== 'string') return ''

  const raw = url.trim()
  if (!raw) return ''

  // 小程序本地临时文件，不能改写
  if (
    raw.startsWith('wxfile://') ||
    raw.startsWith('http://tmp/') ||
    raw.startsWith('tmp/')
  ) {
    return raw
  }

  const base = getApiBaseUrl().replace(/\/+$/, '')
  let baseHost = ''
  try { baseHost = new URL(base).host } catch (e) {}

  // 相对路径：补上网关基址
  if (raw.startsWith('/uploads/')) {
    return `${base}${raw}`
  }

  if (/^https?:\/\//i.test(raw)) {
    let u = null
    try {
      u = new URL(raw)
    } catch (e) {
      // 非标准 URL，无法解析，原样返回
      return raw
    }

    // 外来公网域名（远程存储服务器 / CDN 等）的完整地址：已公网可读，原样返回
    if (baseHost && u.host !== baseHost && !isLocalHost(u.host)) {
      return raw
    }

    // 本机 / 网关自身域名，但路径是 /uploads/（缺 /mp-api 前缀的历史数据）→ 重写为规范网关地址
    if (u.pathname.startsWith('/uploads/')) {
      return `${base}${u.pathname}${u.search || ''}`
    }

    return raw
  }

  // 其它地址，原样返回
  return raw
}

module.exports = { normalizeMediaUrl, isLocalHost }
