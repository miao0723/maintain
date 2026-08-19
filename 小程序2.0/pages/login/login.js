// pages/login/login.js
const { userApi } = require('../../utils/api.js')
const { DEFAULT_AVATAR_URL, normalizeAvatarUrl } = require('../../utils/avatar.js')

function isGenericNickname(name) {
  return !name || name === '微信用户' || name === '游客'
}

Page({
  data: {
    compactLayout: false,
    loading: false,
    // 登录流程步骤：login(一键登录) -> profile(授权头像昵称)
    step: 'login',
    fillAvatarUrl: '',
    fillNickName: '',
    isFilling: false,
    defaultAvatarUrl: DEFAULT_AVATAR_URL,
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

        // 新用户或资料不完整 -> 切换到「授权头像昵称」步骤（读取微信名和头像，解析后立即展示）
        // 用户曾经主动「跳过」则不再打扰，可在「我的资料」页随时补填
        const skippedBefore = wx.getStorageSync('profileFillSkipped')
        if (!skippedBefore && this.needProfileFill(normalizedUser)) {
          this.setData({
            step: 'profile',
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

  // 选择微信头像：仅本地预览，昵称随用户在昵称框一键填入，最后由「保存并进入」统一上传
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    if (!avatarUrl) return
    this.setData({ fillAvatarUrl: avatarUrl })
  },

  // 昵称输入（input type="nickname" 可一键填入微信昵称）
  onFillNickNameInput(e) {
    this.setData({ fillNickName: e.detail.value })
  },

  skipProfileFill() {
    // 记录用户主动跳过，避免每次登录都重复弹资料补全层（仍可到「我的资料」页补填）
    wx.setStorageSync('profileFillSkipped', true)
    this.setData({ step: 'login' })
    this.navigateToHome()
  },

  /**
   * 压缩微信头像临时文件（头像最终只显示很小，压到 200px 足够，弱网也能快速上传）
   * 压缩失败时返回 null，由调用方回退使用原临时文件
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
   * 带超时上限的头像上传：最多等待 capMs，超时/失败则回退（绝不阻塞资料保存与跳转）
   * 本地调试时后端在 127.0.0.1:3001，上传应秒级完成；线上较慢时也不会让用户干等几十秒
   */
  uploadAvatarWithCap(filePath, capMs = 10000) {
    return new Promise((resolve) => {
      let settled = false
      const timer = setTimeout(() => {
        if (!settled) { settled = true; resolve(null) }
      }, capMs)
      userApi.uploadAvatar(filePath, { timeout: capMs, suppressErrorToast: true })
        .then(r => { if (!settled) { settled = true; clearTimeout(timer); resolve(r) } })
        .catch(() => { if (!settled) { settled = true; clearTimeout(timer); resolve(null) } })
    })
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

    // 本地先拼装最终用户资料，确保即使服务端保存失败也能正常完成登录
    let finalAvatarUrl = fillAvatarUrl
    let serverUser = null

    try {
      // 微信头像临时文件需先压缩再上传后端（临时文件体积不可控，压小后弱网也能秒传）
      if (finalAvatarUrl && (finalAvatarUrl.indexOf('http://tmp/') === 0 || finalAvatarUrl.indexOf('wxfile://') === 0 || finalAvatarUrl.indexOf('tmp/') === 0)) {
        try {
          const compressed = await this.compressWechatAvatar(finalAvatarUrl)
          finalAvatarUrl = compressed || finalAvatarUrl
        } catch (cErr) {
          console.warn('压缩微信头像失败，使用原临时文件:', cErr)
        }
        try {
          const uploadRes = await this.uploadAvatarWithCap(finalAvatarUrl)
          if (uploadRes && uploadRes.avatar_url) {
            finalAvatarUrl = uploadRes.avatar_url
          }
        } catch (upErr) {
          console.warn('上传微信头像失败，回退使用默认头像:', upErr)
          finalAvatarUrl = normalizeAvatarUrl('')
        }
      }

      // 同步资料到服务端；失败不阻断登录，本地资料照常生效
      try {
        serverUser = await userApi.updateUserInfo({
          nickname: fillNickName.trim(),
          avatar_url: finalAvatarUrl
        })
      } catch (upErr) {
        console.warn('[登录-资料保存] 服务端更新失败，使用本地资料继续登录:', upErr)
      }
    } catch (err) {
      console.warn('[登录-资料保存] 头像处理异常，使用默认头像继续:', err)
      finalAvatarUrl = normalizeAvatarUrl('')
    }

    const currentUserInfo = wx.getStorageSync('userInfo') || {}
    const mergedUser = {
      ...currentUserInfo,
      ...(serverUser || {}),
      nickname: (serverUser && serverUser.nickname) || fillNickName.trim(),
      nickName: (serverUser && serverUser.nickname) || fillNickName.trim(),
      avatar_url: normalizeAvatarUrl((serverUser && (serverUser.avatar_url || serverUser.avatarUrl)) || finalAvatarUrl),
      avatarUrl: normalizeAvatarUrl((serverUser && (serverUser.avatar_url || serverUser.avatarUrl)) || finalAvatarUrl)
    }

    wx.setStorageSync('userInfo', mergedUser)
    const app = getApp()
    if (app.globalData) {
      app.globalData.userInfo = mergedUser
      app.globalData.isLoggedIn = true
    }

    wx.hideLoading()
    wx.showToast({ title: '已登录', icon: 'success', duration: 1200 })
    this.setData({ step: 'login', isFilling: false })
    setTimeout(() => this.navigateToHome(), 1200)
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
