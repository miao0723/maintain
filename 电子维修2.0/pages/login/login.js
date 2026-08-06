// pages/login/login.js
const { userApi } = require('../../utils/api.js')
const { normalizeAvatarUrl } = require('../../utils/avatar.js')

function isGenericNickname(name) {
  return !name || name === '微信用户' || name === '游客'
}

Page({
  data: {
    compactLayout: false,
    loading: false,
    featureTags: [
      'AI故障自检',
      '透明报价',
      '进度反馈',
      '设备回收'
    ],
    serviceMetrics: [
      { id: 1, value: '全品类', label: '维修受理' },
      { id: 2, value: '实时', label: '进度反馈' },
      { id: 3, value: '透明', label: '报价确认' }
    ],
    flowSteps: [
      { id: 1, step: '01', title: '微信授权登录' },
      { id: 2, step: '02', title: '故障检测/咨询' },
      { id: 3, step: '03', title: '下单维修或回收' }
    ]
  },

  onLoad() {
    this.initLayout()

    // 检查是否已登录
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    if (token && userInfo) {
      this.navigateToHome()
      return
    }
  },

  initLayout() {
    try {
      const { windowHeight, screenHeight } = wx.getSystemInfoSync()
      const effectiveHeight = windowHeight || screenHeight || 0
      this.setData({
        compactLayout: effectiveHeight > 0 && effectiveHeight < 760
      })
    } catch (e) {
      this.setData({ compactLayout: false })
    }
  },

  /**
   * 查看免责协议
   */
  viewAgreement() {
    wx.navigateTo({
      url: '/pages/welcome/welcome'
    })
  },

  /**
   * 查看隐私政策
   */
  viewPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '1. 我们会保护您的个人信息安全\n2. 您的头像和昵称仅用于身份识别\n3. 未经您同意，不会向第三方泄露\n4. 您可以随时修改个人信息\n5. 如有疑问，请联系客服',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  /**
   * 登录
   */
  async handleLogin() {
    if (this.data.loading) {
      return
    }

    this.setData({ loading: true })
    wx.showLoading({
      title: '登录中...',
      mask: true
    })

    try {
      const profileRes = await this.getWechatProfile()
      const loginRes = await this.getWechatLoginCode()
      wx.setStorageSync('agreedToDisclaimer', true)
      await this.wechatLogin(loginRes.code, profileRes.userInfo || {})
    } catch (err) {
      wx.hideLoading()
      const cancelled = (err && (err.errMsg || err.message || '')).includes('cancel')
      if (!cancelled) {
        wx.showToast({
          title: '授权失败，请重试',
          icon: 'none',
          duration: 2500
        })
      }
      console.error('授权登录失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  getWechatProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: resolve,
        fail: reject
      })
    })
  },

  getWechatLoginCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (loginRes) => {
          if (loginRes.code) {
            resolve(loginRes)
            return
          }
          reject(new Error('未获取到登录 code'))
        },
        fail: reject
      })
    })
  },

  async wechatLogin(code, userInfo) {
    try {
      const response = await userApi.wechatLogin(code, userInfo)

      if (response.success && response.token) {
        const preferredNickname = !isGenericNickname(userInfo.nickName)
          ? userInfo.nickName
          : (response.user?.nickname || response.user?.nickName || '微信用户')
        const preferredAvatarUrl = normalizeAvatarUrl(
          userInfo.avatarUrl || response.user?.avatarUrl || response.user?.avatar_url || ''
        )

        const normalizedUser = {
          ...response.user,
          nickname: preferredNickname,
          nickName: preferredNickname,
          avatar_url: response.user?.avatar_url || response.user?.avatarUrl || userInfo.avatarUrl || '',
          avatarUrl: preferredAvatarUrl
        }

        wx.setStorageSync('token', response.token)
        wx.setStorageSync('userInfo', normalizedUser)

        const app = getApp()
        app.globalData.userInfo = normalizedUser
        app.globalData.isLoggedIn = true
        app.globalData.agreedToDisclaimer = true

        if (!isGenericNickname(userInfo.nickName)) {
          try {
            const updatedUser = await userApi.updateUserInfo({
              nickname: userInfo.nickName,
              avatar_url: preferredAvatarUrl
            })

            const refreshedUser = {
              ...normalizedUser,
              ...updatedUser,
              nickname: updatedUser.nickname || preferredNickname,
              nickName: updatedUser.nickName || updatedUser.nickname || preferredNickname,
              avatar_url: updatedUser.avatar_url || updatedUser.avatarUrl || normalizedUser.avatar_url,
              avatarUrl: normalizeAvatarUrl(updatedUser.avatarUrl || updatedUser.avatar_url || preferredAvatarUrl)
            }

            wx.setStorageSync('userInfo', refreshedUser)
            app.globalData.userInfo = refreshedUser
          } catch (syncError) {
            console.warn('登录后同步微信昵称头像失败:', syncError)
          }
        }

        wx.hideLoading()
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1200
        })

        setTimeout(() => {
          this.navigateToHome()
        }, 1500)
      } else {
        throw new Error('登录响应无效')
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      wx.hideLoading()
      // 根据错误类型给出更明确的提示
      let title = '登录失败，请重试'
      const errMsg = (error && (error.message || error.errMsg)) || ''
      if (errMsg.includes('同一 Wi-Fi')) {
        title = '请让手机和电脑连接同一Wi-Fi'
      } else if (errMsg.includes('无法连接') || errMsg.includes('连接失败') || errMsg.includes('request:fail')) {
        title = '无法连接服务器，请检查接口地址和后端'
      } else if (errMsg.includes('超时')) {
        title = '请求超时，请检查网络连接'
      }
      wx.showToast({
        title: title,
        icon: 'none',
        duration: 3000
      })
    }
  },

  /**
   * 跳转到首页
   */
  navigateToHome() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.role === 'super_admin') {
      wx.redirectTo({
        url: '/pages/super-admin/super-admin'
      })
    } else if (userInfo && userInfo.role === 'admin') {
      wx.redirectTo({
        url: '/pages/admin/admin'
      })
    } else {
      wx.switchTab({
        url: '/pages/home/home'
      })
    }
  }
})
