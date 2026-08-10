const { getDefaultBaseUrl, normalizeBaseUrl } = require('./utils/networkConfig.js')
const { normalizeAvatarUrl } = require('./utils/avatar.js')

function normalizeStoredUserInfo(userInfo) {
  if (!userInfo) return null

  return {
    ...userInfo,
    nickname: userInfo.nickname || userInfo.nickName || '微信用户',
    nickName: userInfo.nickName || userInfo.nickname || '微信用户',
    avatar_url: userInfo.avatar_url || userInfo.avatarUrl || '',
    avatarUrl: normalizeAvatarUrl(userInfo.avatarUrl || userInfo.avatar_url || '')
  }
}

// app.js
App({
  onLaunch() {
    this.initRuntimeConfig()

    // 打印当前apiUrl确认运行时的值
    console.log('========== 当前API地址 ==========');
    console.log('apiUrl:', this.globalData.apiUrl);
    console.log('baseUrl:', this.globalData.baseUrl);
    console.log('=================================');

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 检查用户登录状态
    this.checkLoginStatus()
    this.restoreBadgeState()
  },

  initRuntimeConfig() {
    try {
      const storedBaseUrl = wx.getStorageSync('apiBaseUrl')
      if (storedBaseUrl && typeof storedBaseUrl === 'string') {
        const normalized = normalizeBaseUrl(storedBaseUrl)
        // 安全保护：真机上不允许使用非 HTTPS 或 localhost 地址
        // 如果存储的是开发环境地址（HTTP 或 localhost），清除它并使用默认地址
        if (normalized.startsWith('http://127.0.0.1') ||
            normalized.startsWith('http://localhost') ||
            normalized.startsWith('http://192.168') ||
            (normalized.startsWith('http://') && !normalized.includes('localhost'))) {
          // 非开发工具环境下的 HTTP 地址在真机上不可用，清除并使用默认值
          if (!this._isDevtools()) {
            console.warn('检测到存储的 API 地址为非 HTTPS（' + normalized + '），真机不可用，已清除')
            wx.removeStorageSync('apiBaseUrl')
            return
          }
        }
        this.globalData.baseUrl = normalized
        this.globalData.apiUrl = normalized
      }
    } catch (e) {}
  },

  _isDevtools() {
    try {
      const info = wx.getSystemInfoSync()
      return info && info.platform === 'devtools'
    } catch (e) {
      return false
    }
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const rawUserInfo = wx.getStorageSync('userInfo')
    const userInfo = normalizeStoredUserInfo(rawUserInfo)
    const agreedToDisclaimer = wx.getStorageSync('agreedToDisclaimer')

    if (token) {
      this.globalData.isLoggedIn = true
      this.globalData.userInfo = userInfo || null
    } else {
      this.globalData.userInfo = null
      this.globalData.isLoggedIn = false
    }

    if (userInfo) {
      wx.setStorageSync('userInfo', userInfo)
      this.globalData.userInfo = userInfo
    }

    if (agreedToDisclaimer) {
      this.globalData.agreedToDisclaimer = true
    }
  },

  restoreBadgeState() {
    try {
      this.globalData.badgeTotal = wx.getStorageSync('_badgeTotal') || 0
      this.globalData.quotedCount = wx.getStorageSync('_quotedCount') || 0
      this.globalData.progressUnreadCount = wx.getStorageSync('_progressUnreadCount') || 0
    } catch (e) {
      this.globalData.badgeTotal = 0
      this.globalData.quotedCount = 0
      this.globalData.progressUnreadCount = 0
    }
  },

  /**
   * 获取用户信息（从API）
   */
  async fetchUserInfoFromAPI() {
    if (!this.globalData.isLoggedIn) return null;

    try {
      const { userApi } = require('./utils/api.js');
      const userInfo = normalizeStoredUserInfo(await userApi.getUserInfo());

      // 更新全局数据和本地存储
      this.globalData.userInfo = userInfo;
      wx.setStorageSync('userInfo', userInfo);

      return userInfo;
    } catch (error) {
      console.error('从API获取用户信息失败:', error);
      // 回退到本地存储的用户信息
      return this.globalData.userInfo;
    }
  },

  /**
   * 获取用户信息
   */
  getUserInfo() {
    return this.globalData.userInfo
  },

  /**
   * 检查是否已登录
   */
  isLoggedIn() {
    return this.globalData.isLoggedIn
  },

  /**
   * 退出登录
   */
  logout() {
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('userAvatarUrl')
    wx.removeStorageSync('token') // 清除token
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false

    // 跳转到登录页
    wx.redirectTo({
      url: '/pages/login/login'
    })
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    agreedToDisclaimer: false,
    quotedCount: 0,
    progressUnreadCount: 0,
    badgeTotal: 0,
    baseUrl: getDefaultBaseUrl(), // 真机调试请改成同局域网可访问地址；正式版必须使用HTTPS合法域名
    apiUrl: getDefaultBaseUrl()
  }
})
