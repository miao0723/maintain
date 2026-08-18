// 统一的小程序端 API 基址解析（与 runtimeConfig.getApiBaseCandidates 保持完全一致）
//
// 返回形如：
//   - 线上：https://zych.net.cn/mp-api            （nginx 已将 /mp-api 反代到后端 /api）
//   - 本地调试（开发者工具）：http://127.0.0.1:3001/api
//
// ⚠️ 调用方拼接路径时【不要再写 /api】，例如：
//     mpApiUrl('/orders/unread-counts')
//   因为 getApiBaseCandidates 已经把 /mp-api 映射为后端的 /api，
//   手写 /api 会形成 /mp-api/api/...（双重 /api）导致线上 404。
const { getDefaultBaseUrl } = require('./networkConfig.js')

function getMpApiBaseUrl() {
  // 手动 wx.request 统一走线上网关（恒定生产地址 https://zych.net.cn/mp-api）。
  // 原因：手动请求没有“候选地址回退”机制，若指向本地（127.0.0.1:3001）而本地后端未启动，
  // 会直接 ERR_CONNECTION_REFUSED。线上网关始终可用，因此手写请求直接走线上，避免本地调试满屏报错。
  // 注意：这里固定返回 getDefaultBaseUrl()（线上网关），【不依赖 getApiBaseCandidates() 的列表顺序】——
  // 候选顺序会随调试/环境变化（生产在前或本地在尾），但手写请求的基址必须是恒定的线上网关，否则
  // 一旦顺序调整就会再次误指向本地死地址。需要本地优先的数据接口（如登录 / 头像上传）请走
  // utils/api.js 的 request()，其内置候选回退。
  return getDefaultBaseUrl()
}

module.exports = { getMpApiBaseUrl }
