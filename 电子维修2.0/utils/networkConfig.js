// 小程序 API 基础地址配置
// 开发环境（微信开发者工具）:   http://你的IP:3001         → 自动追加 /api → 直连后端
// 生产环境（体验版/正式版）:   https://域名/mp-api        → 已含路径，不追加 /api → 经 Nginx 网关
//                            微信强制 HTTPS，体验版/正式版不能用 http://IP:3001

// 修改为你的服务器地址：
//   - 开发调试：用局域网 IP:3001（微信开发者工具不限制 HTTP）
//   - 体验版/正式版：用 https://zych.net.cn/mp-api
const DEFAULT_BASE_URL = 'https://zych.net.cn/mp-api'

function normalizeBaseUrl(url) {
  if (!url || typeof url !== 'string') return ''
  return url.replace(/\/+$/, '')
}

function getDefaultBaseUrl() {
  return normalizeBaseUrl(DEFAULT_BASE_URL)
}

// 判断是否已是网关地址（网关路径已包含 api 路由，不应再追加 /api）
function isGatewayUrl(url) {
  return url.includes('/mp-api') || url.includes('/mp-api/')
}

module.exports = {
  DEFAULT_BASE_URL,
  getDefaultBaseUrl,
  normalizeBaseUrl,
  isGatewayUrl
}
