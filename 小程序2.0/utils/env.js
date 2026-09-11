// 运行环境探测工具
// 替代已废弃的 wx.getSystemInfoSync()，改用细分接口（getAppBaseInfo / getWindowInfo），
// 避免调试器里出现 "[渲染层] wx.getSystemInfoSync is deprecated" 警告，也减轻渲染层负担。

// 取 platform（'devtools' | 'ios' | 'android' | 'windows' | ...）
// 优先用 wx.getAppBaseInfo()，旧基础库回退到 wx.getSystemInfoSync()
function getPlatform() {
  try {
    if (typeof wx !== 'undefined' && typeof wx.getAppBaseInfo === 'function') {
      return wx.getAppBaseInfo().platform || ''
    }
    if (typeof wx !== 'undefined' && typeof wx.getSystemInfoSync === 'function') {
      return wx.getSystemInfoSync().platform || ''
    }
  } catch (e) {}
  return ''
}

// 是否为微信开发者工具环境
function isDevtools() {
  return getPlatform() === 'devtools'
}

// 取像素比（用于 canvas / dpr 计算）
function getPixelRatio(fallback = 2) {
  try {
    if (typeof wx !== 'undefined' && typeof wx.getWindowInfo === 'function') {
      const r = wx.getWindowInfo().pixelRatio
      if (r) return r
    }
    if (typeof wx !== 'undefined' && typeof wx.getSystemInfoSync === 'function') {
      const r = wx.getSystemInfoSync().pixelRatio
      if (r) return r
    }
  } catch (e) {}
  return fallback
}

module.exports = { getPlatform, isDevtools, getPixelRatio }
