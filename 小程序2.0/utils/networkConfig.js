// 服务器部署后的默认地址（已备案域名 + HTTPS + 网关 /mp-api 前缀）
// 注意：线上 nginx 将 /mp-api/ 反代到小程序后端 /api，故前端用 /mp-api 而非根路径
const DEFAULT_BASE_URL = 'https://zych.net.cn/mp-api'

function normalizeBaseUrl(url) {
  if (!url || typeof url !== 'string') return ''
  // 去除首尾空白，避免配置读取时意外带入空格导致请求地址非法
  let normalized = url.trim()
  // 剥离尾随斜杠，保证与路径拼接时只出现单个分隔符
  normalized = normalized.replace(/\/+$/, '')
  return normalized
}

function getDefaultBaseUrl() {
  return normalizeBaseUrl(DEFAULT_BASE_URL)
}

module.exports = {
  // 对外暴露归一化后的基准地址，保证调用方拿到的始终是规范形式
  DEFAULT_BASE_URL: getDefaultBaseUrl(),
  getDefaultBaseUrl,
  normalizeBaseUrl
}
