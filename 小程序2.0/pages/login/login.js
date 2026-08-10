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
    // 资料补全弹层
    showProfileFill: false,
    fillAvatarUrl: '',
    fillNickName: '',
    isFilling: false,
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
   * 登录（一键同意：仅通过 wx.login 静默换取 openid 完成登录/注册）
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

    // 诊断信息
    const app = getApp()
    const diagBaseUrl = app?.globalData?.baseUrl || '未设置'
    console.log('========== 登录页诊断 ==========')
    console.log('baseUrl:', diagBaseUrl)
    console.log('===============================')

    try {
      const code = await this.getWechatLoginCode()
      wx.setStorageSync('agreedToDisclaimer', true)
      await this.wechatLogin(code)
    } catch (err) {
      wx.hideLoading()
      const cancelled = (err && (err.errMsg || err.message || '')).includes('cancel')
      if (!cancelled) {
        const errMsg = (err && (err.message || err.errMsg)) || '未知'
        wx.showModal({
          title: '登录诊断',
          content: '登录请求失败\n\n错误: ' + errMsg +
            '\nAPI: ' + diagBaseUrl,
          showCancel: false
        })
      }
      console.error('授权登录失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  getWechatLoginCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (loginRes) => {
          if (loginRes.code) {
            resolve(loginRes.code)
            return
          }
          reject(new Error('wx.login 未返回 code'))
        },
        fail: (err) => reject(new Error('wx.login 失败: ' + (err.errMsg || '未知')))
      })
    })
  },

  /**
   * 判断后端返回的用户是否还没有真实微信资料（昵称/头像）
   */
  needProfileFill(user) {
    if (!user) return false
    const nick = user.nickname || user.nickName || ''
    const avatar = user.avatar_url || user.avatarUrl || ''
    const noRealNick = !nick || nick === '微信用户' || nick === '游客'
    // 头像为空，或不是有效网络地址/本地上传路径
    const noRealAvatar = !avatar ||
      (avatar.indexOf('/uploads/avatars/') === -1 && avatar.indexOf('http') !== 0)
    return noRealNick || noRealAvatar
  },

  async wechatLogin(code) {
    try {
      const response = await userApi.wechatLogin(code, {})

      if (response.success && response.token) {
        const rawUser = response.user || {}
        const normalizedUser = {
          ...rawUser,
          nickname: rawUser.nickname || '微信用户',
          nickName: rawUser.nickname || rawUser.nickName || '微信用户',
          avatar_url: rawUser.avatar_url || rawUser.avatarUrl || '',
          avatarUrl: normalizeAvatarUrl(rawUser.avatar_url || rawUser.avatarUrl || '')
        }

        wx.setStorageSync('token', response.token)
        wx.setStorageSync('userInfo', normalizedUser)

        const app = getApp()
        app.globalData.userInfo = normalizedUser
        app.globalData.isLoggedIn = true
        app.globalData.agreedToDisclaimer = true

        wx.hideLoading()
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1200
        })

        // 新用户或资料不完整 -> 弹出资料补全层（读取微信名和头像）
        if (this.needProfileFill(normalizedUser)) {
          this.setData({
            showProfileFill: true,
            fillAvatarUrl: normalizedUser.avatarUrl || '',
            fillNickName: ''
          })
          return
        }

        setTimeout(() => {
          this.navigateToHome()
        }, 1500)
      } else {
        const app = getApp()
        const diagBaseUrl = app?.globalData?.baseUrl || '未设置'
        wx.hideLoading()
        wx.showModal({
          title: '登录诊断',
          content: '服务器返回异常\n\nsuccess: ' + JSON.stringify(response.success) +
            '\nerror: ' + (response.error || response.message || '无') +
            '\nAPI: ' + diagBaseUrl,
          showCancel: false
        })
        throw new Error('登录响应无效')
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      wx.hideLoading()
      const errMsg = (error && (error.message || error.errMsg)) || ''
      const app = getApp()
      const diagBaseUrl = app?.globalData?.baseUrl || '未设置'
      wx.showModal({
        title: '登录诊断',
        content: '请求失败\n\n错误: ' + errMsg +
          '\nAPI: ' + diagBaseUrl,
        showCancel: false
      })
    }
  },

  // ===== 资料补全层（读取微信头像 + 昵称） =====

  // 微信昵称一键填入（input type="nickname" 的 bindnickname 回调）
  onFillNickName(e) {
    const nickName = (e.detail && e.detail.nickName) || ''
    if (nickName) {
      this.setData({ fillNickName: nickName })
    }
  },

  // 点一次「获取微信头像和昵称」：选完头像后自动带出昵称并立即保存
  onChooseAvatarAndSave(e) {
    const { avatarUrl } = e.detail
    if (!avatarUrl) return
    this.setData({ fillAvatarUrl: avatarUrl })
    // 微信昵称在弹层出现时已通过 bindnickname 自动带出，这里兜底确保有值
    const nickName = this.data.fillNickName || '微信用户'
    this.setData({ fillNickName: nickName })
    this.saveProfileFill()
  },

  // 昵称输入（input type="nickname" 可一键填入微信昵称）
  onFillNickNameInput(e) {
    this.setData({ fillNickName: e.detail.value })
  },

  skipProfileFill() {
    this.setData({ showProfileFill: false })
    this.navigateToHome()
  },

  async saveProfileFill() {
    if (this.data.isFilling) return
    const { fillAvatarUrl, fillNickName } = this.data

    if (!fillNickName || !fillNickName.trim()) {
      wx.showToast({ title: '请填写微信昵称', icon: 'none' })
      return
    }

    this.setData({ isFilling: true })
    wx.showLoading({ title: '保存中...', mask: true })

    try {
      let finalAvatarUrl = fillAvatarUrl

      // 微信头像临时文件需先上传后端
      if (finalAvatarUrl && (finalAvatarUrl.indexOf('http://tmp/') === 0 || finalAvatarUrl.indexOf('wxfile://') === 0 || finalAvatarUrl.indexOf('tmp/') === 0)) {
        try {
          const uploadRes = await userApi.uploadAvatar(finalAvatarUrl)
          if (uploadRes && uploadRes.avatar_url) {
            finalAvatarUrl = uploadRes.avatar_url
          }
        } catch (upErr) {
          console.warn('上传微信头像失败，回退使用默认头像:', upErr)
          finalAvatarUrl = normalizeAvatarUrl('')
        }
      }

      const updatedUser = await userApi.updateUserInfo({
        nickname: fillNickName.trim(),
        avatar_url: finalAvatarUrl
      })

      const currentUserInfo = wx.getStorageSync('userInfo') || {}
      const mergedUser = {
        ...currentUserInfo,
        ...updatedUser,
        nickname: updatedUser.nickname || fillNickName.trim(),
        nickName: updatedUser.nickname || fillNickName.trim(),
        avatar_url: updatedUser.avatar_url || updatedUser.avatarUrl || finalAvatarUrl,
        avatarUrl: normalizeAvatarUrl(updatedUser.avatar_url || updatedUser.avatarUrl || finalAvatarUrl)
      }

      wx.setStorageSync('userInfo', mergedUser)
      const app = getApp()
      if (app.globalData) {
        app.globalData.userInfo = mergedUser
        app.globalData.isLoggedIn = true
      }

      wx.hideLoading()
      wx.showToast({ title: '已保存', icon: 'success', duration: 1200 })
      this.setData({ showProfileFill: false })
      setTimeout(() => this.navigateToHome(), 1200)
    } catch (err) {
      console.error('保存资料失败:', err)
      wx.hideLoading()
      this.setData({ isFilling: false })
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
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
