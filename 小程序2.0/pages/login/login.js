// pages/login/login.js
const { userApi } = require('../../utils/api.js')
const { DEFAULT_AVATAR_URL, normalizeAvatarUrl } = require('../../utils/avatar.js')

Page({
  data: {
    loading: false,
    fillAvatarUrl: '',
    fillNickName: '',
    defaultAvatarUrl: DEFAULT_AVATAR_URL
  },

  onLoad() {
    // 已登录则直接回首页
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    if (token && userInfo) {
      this.navigateToHome()
      return
    }
    // 预填已有资料（如有），方便老用户直接登录
    if (userInfo) {
      this.setData({
        fillNickName: userInfo.nickname || userInfo.nickName || '',
        fillAvatarUrl: normalizeAvatarUrl(userInfo.avatar_url || userInfo.avatarUrl || '')
      })
    }
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    if (!avatarUrl) return
    this.setData({ fillAvatarUrl: avatarUrl })
  },

  onFillNickName(e) {
    const nickName = (e.detail && e.detail.nickName) || ''
    if (nickName) this.setData({ fillNickName: nickName })
  },

  onFillNickNameInput(e) {
    this.setData({ fillNickName: e.detail.value })
  },

  // 获取微信登录 code
  getWechatLoginCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (loginRes) => {
          if (loginRes.code) resolve(loginRes.code)
          else reject(new Error('wx.login 未返回 code'))
        },
        fail: (err) => reject(new Error('wx.login 失败: ' + (err.errMsg || '未知')))
      })
    })
  },

  /**
   * 登录按钮：先校验头像与昵称，再执行登录并保存资料
   */
  async handleLogin() {
    if (this.data.loading) return

    const avatarUrl = this.data.fillAvatarUrl
    const nick = (this.data.fillNickName || '').trim()

    // 表单验证：必须选择头像并填写昵称
    if (!avatarUrl) {
      wx.showToast({ title: '请先选择微信头像', icon: 'none' })
      return
    }
    if (!nick) {
      wx.showToast({ title: '请填写微信昵称', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    wx.showLoading({ title: '登录中...', mask: true })
    try {
      const code = await this.getWechatLoginCode()
      wx.setStorageSync('agreedToDisclaimer', true)
      await this.loginAndSaveProfile(code, avatarUrl, nick)
    } catch (err) {
      wx.hideLoading()
      const cancelled = (err && (err.errMsg || err.message || '')).includes('cancel')
      if (!cancelled) {
        const app = getApp()
        const base = app?.globalData?.baseUrl || '未设置'
        wx.showModal({
          title: '登录失败',
          content: '登录请求失败\n\n错误: ' + ((err && (err.message || err.errMsg)) || '未知') + '\nAPI: ' + base,
          showCancel: false
        })
      }
      console.error('登录失败:', err)
      this.setData({ loading: false })
    }
  },

  async loginAndSaveProfile(code, avatarUrl, nick) {
    // 1) 换取 token
    const response = await userApi.wechatLogin(code, {})
    if (!response.success || !response.token) {
      throw new Error(response.error || response.message || '服务器返回异常')
    }
    const rawUser = response.user || {}
    const normalizedAvatar0 = normalizeAvatarUrl(rawUser.avatar_url || rawUser.avatarUrl || '')
    const baseUser = {
      ...rawUser,
      nickname: rawUser.nickname || nick,
      nickName: rawUser.nickname || rawUser.nickName || nick,
      avatar_url: normalizedAvatar0,
      avatarUrl: normalizedAvatar0
    }
    wx.setStorageSync('token', response.token)
    wx.setStorageSync('userInfo', baseUser)
    const app = getApp()
    if (app.globalData) {
      app.globalData.userInfo = baseUser
      app.globalData.isLoggedIn = true
      app.globalData.agreedToDisclaimer = true
    }

    // 2) 上传头像（本地临时文件需压缩后上传；非临时路径直接信任）
    let finalAvatarUrl = ''
    try {
      let sourcePath = avatarUrl
      if (sourcePath && (sourcePath.indexOf('http://tmp/') === 0 || sourcePath.indexOf('wxfile://') === 0 || sourcePath.indexOf('tmp/') === 0)) {
        const compressed = await this.compressWechatAvatar(sourcePath)
        if (compressed) sourcePath = compressed
        finalAvatarUrl = await this.uploadAvatarWithRetry(sourcePath)
      } else {
        finalAvatarUrl = sourcePath
      }
    } catch (e) {
      console.warn('[登录-头像上传] 失败:', e)
    }

    // 3) 同步昵称 + 头像到服务端
    const saveAvatar = finalAvatarUrl || normalizedAvatar0
    try {
      await userApi.updateUserInfo({ nickname: nick, avatar_url: saveAvatar })
    } catch (e) {
      console.warn('[登录-资料同步] 失败:', e)
    }

    // 4) 读回最新资料，确保本地与落盘一致
    let latestUser = null
    try { latestUser = await userApi.getUserInfo() } catch (e) {}

    const currentUserInfo = wx.getStorageSync('userInfo') || {}
    const mergedUser = {
      ...currentUserInfo,
      ...(latestUser || {}),
      nickname: (latestUser && latestUser.nickname) || nick,
      nickName: (latestUser && latestUser.nickname) || nick,
      avatar_url: normalizeAvatarUrl((latestUser && (latestUser.avatar_url || latestUser.avatarUrl)) || saveAvatar),
      avatarUrl: normalizeAvatarUrl((latestUser && (latestUser.avatar_url || latestUser.avatarUrl)) || saveAvatar)
    }
    wx.setStorageSync('userInfo', mergedUser)
    wx.setStorageSync('profileFilled', true)
    if (app.globalData) {
      app.globalData.userInfo = mergedUser
      app.globalData.isLoggedIn = true
    }

    wx.hideLoading()
    wx.showToast({ title: '登录成功', icon: 'success', duration: 1200 })
    this.setData({ loading: false })
    setTimeout(() => this.navigateToHome(), 1200)
  },

  /**
   * 跳过：使用默认资料进入（仍执行 wx.login 获取 token，保证已登录）
   */
  async skipProfileFill() {
    if (this.data.loading) return
    this.setData({ loading: true })
    wx.showLoading({ title: '登录中...', mask: true })
    try {
      const code = await this.getWechatLoginCode()
      wx.setStorageSync('agreedToDisclaimer', true)
      wx.setStorageSync('profileFillSkipped', true)
      const response = await userApi.wechatLogin(code, {})
      if (!response.success || !response.token) {
        throw new Error(response.error || response.message || '服务器返回异常')
      }
      const rawUser = response.user || {}
      const normalizedAvatar = normalizeAvatarUrl(rawUser.avatar_url || rawUser.avatarUrl || '')
      const normalizedUser = {
        ...rawUser,
        nickname: rawUser.nickname || '微信用户',
        nickName: rawUser.nickname || rawUser.nickName || '微信用户',
        avatar_url: normalizedAvatar,
        avatarUrl: normalizedAvatar
      }
      wx.setStorageSync('token', response.token)
      wx.setStorageSync('userInfo', normalizedUser)
      const app = getApp()
      if (app.globalData) {
        app.globalData.userInfo = normalizedUser
        app.globalData.isLoggedIn = true
        app.globalData.agreedToDisclaimer = true
      }
      wx.hideLoading()
      this.setData({ loading: false })
      this.navigateToHome()
    } catch (err) {
      wx.hideLoading()
      const cancelled = (err && (err.errMsg || err.message || '')).includes('cancel')
      if (!cancelled) {
        const app = getApp()
        const base = app?.globalData?.baseUrl || '未设置'
        wx.showModal({
          title: '登录失败',
          content: '登录请求失败\n\n错误: ' + ((err && (err.message || err.errMsg)) || '未知') + '\nAPI: ' + base,
          showCancel: false
        })
      }
      this.setData({ loading: false })
    }
  },

  /**
   * 压缩微信头像临时文件（头像最终只显示很小，压到 200px 足够，弱网也能快速上传）
   */
  compressWechatAvatar(filePath) {
    return new Promise((resolve) => {
      wx.compressImage({
        src: filePath,
        quality: 70,
        compressedWidth: 200,
        compressedHeight: 200,
        success: (res) => resolve(res.tempFilePath),
        fail: () => resolve(null)
      })
    })
  },

  /**
   * 头像上传（带重试）：最多重试 2 次，全部失败返回空串交由上层提示。
   */
  async uploadAvatarWithRetry(filePath, maxRetry = 2) {
    for (let i = 0; i <= maxRetry; i++) {
      try {
        const res = await userApi.uploadAvatar(filePath, {
          timeout: 20000,
          suppressErrorToast: i === maxRetry
        })
        if (res && res.avatar_url) return res.avatar_url
        return ''
      } catch (err) {
        console.warn(`[登录-头像上传] 第 ${i + 1} 次失败:`, err)
      }
    }
    return ''
  },

  /**
   * 跳转到首页
   */
  navigateToHome() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && (userInfo.role === 'super_admin' || userInfo.role === 'admin')) {
      wx.redirectTo({
        url: '/pages/super-admin/super-admin'
      })
    } else {
      wx.switchTab({
        url: '/pages/home/home'
      })
    }
  }
})
