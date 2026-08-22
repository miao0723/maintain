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
    if (!user) return true
    const nick = user.nickname || user.nickName || ''
    const avatar = user.avatar_url || user.avatarUrl || ''
    const noRealNick = !nick || nick === '微信用户' || nick === '游客'
    if (noRealNick) return true
    if (!avatar) return true

    // 后端上传落盘的真实头像（带 /uploads/avatars/ 前缀）视为有效
    if (avatar.indexOf('/uploads/avatars/') !== -1) return false

    // 历史脏数据：http(s)://域名/uploads/...（缺 /mp-api/api 前缀，nginx 未反代根路径导致 404）
    if (/^https?:\/\/[^/]+\/uploads\//i.test(avatar)) return true

    // 微信返回的真实头像（wx.qlogo.cn / wxfile:// / http://tmp/）视为有效
    if (avatar.indexOf('wx.qlogo.cn') !== -1) return false
    if (avatar.indexOf('wxfile://') === 0) return false
    if (avatar.indexOf('http://tmp/') === 0) return false
    if (avatar.indexOf('http') === 0) return false

    return true
  },

  async wechatLogin(code) {
    try {
      const response = await userApi.wechatLogin(code, {})

      if (response.success && response.token) {
        const rawUser = response.user || {}
        // 关键修复：avatar_url 也归一化，避免把后台原始（可能裸域名）地址写回存储
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
        app.globalData.userInfo = normalizedUser
        app.globalData.isLoggedIn = true
        app.globalData.agreedToDisclaimer = true

        wx.hideLoading()
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1200
        })

        // 登录成功后强制进入「授权头像昵称」步骤：用户必须选择微信头像并确认昵称，
        // 才能保存并进入。仅当用户此前已真正补全过资料（profileFilled 标记）才跳过。
        // 注意：profileFillSkipped 仅代表用户点过「跳过」，不等于已补全，不能作为跳过依据。
        const filledBefore = wx.getStorageSync('profileFilled')
        if (!filledBefore) {
          this.setData({
            step: 'profile',
            fillAvatarUrl: '',
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

  /**
   * 头像上传（带重试）：用户已明确点击「保存并进入」，必须确保头像真正落盘，
   * 因此不做短超时静默降级，最多重试 2 次；全部失败返回空串交由上层提示。
   */
  async uploadAvatarWithRetry(filePath, maxRetry = 2) {
    let lastErr = null
    for (let i = 0; i <= maxRetry; i++) {
      try {
        const res = await userApi.uploadAvatar(filePath, {
          timeout: 20000,
          suppressErrorToast: i === maxRetry
        })
        if (res && res.avatar_url) return res.avatar_url
        return ''
      } catch (err) {
        lastErr = err
        console.warn(`[登录-头像上传] 第 ${i + 1} 次失败:`, err)
      }
    }
    return ''
  },

  async saveProfileFill() {
    if (this.data.isFilling) return
    const { fillAvatarUrl, fillNickName } = this.data
    if (!fillNickName || !fillNickName.trim()) {
      wx.showToast({ title: '请填写微信昵称', icon: 'none' })
      return
    }
    // 头像必须选择：要求用户点击微信头像授权后再确认，避免直接走默认头像
    if (!fillAvatarUrl) {
      wx.showToast({ title: '请点击选择微信头像', icon: 'none' })
      return
    }

    this.setData({ isFilling: true })
    wx.showLoading({ title: '保存中...', mask: true })

    let finalAvatarUrl = ''
    try {
      // 微信头像授权拿到的是临时文件，需先压缩再上传后端落盘；
      // 只有真正拿到服务端返回的头像地址才继续，不做静默回退默认头像。
      let sourcePath = fillAvatarUrl
      if (sourcePath && (sourcePath.indexOf('http://tmp/') === 0 || sourcePath.indexOf('wxfile://') === 0 || sourcePath.indexOf('tmp/') === 0)) {
        try {
          const compressed = await this.compressWechatAvatar(sourcePath)
          if (compressed) sourcePath = compressed
        } catch (cErr) {
          console.warn('压缩微信头像失败，使用原临时文件:', cErr)
        }
        finalAvatarUrl = await this.uploadAvatarWithRetry(sourcePath)
      } else {
        // 非临时路径（理论上不会出现）：直接信任
        finalAvatarUrl = sourcePath
      }

      if (!finalAvatarUrl) {
        throw new Error('头像上传失败，请重试')
      }

      // 同步资料到服务端
      const serverUser = await userApi.updateUserInfo({
        nickname: fillNickName.trim(),
        avatar_url: finalAvatarUrl
      })

      // 读回服务端最新资料，确保「保存即读取」——本地展示与落盘完全一致
      let latestUser = serverUser
      try {
        latestUser = await userApi.getUserInfo()
      } catch (e) {
        console.warn('[登录-读回头像] 失败，使用刚保存的返回值:', e)
      }

      const currentUserInfo = wx.getStorageSync('userInfo') || {}
      const mergedUser = {
        ...currentUserInfo,
        ...(latestUser || {}),
        nickname: (latestUser && latestUser.nickname) || fillNickName.trim(),
        nickName: (latestUser && latestUser.nickname) || fillNickName.trim(),
        avatar_url: normalizeAvatarUrl((latestUser && (latestUser.avatar_url || latestUser.avatarUrl)) || finalAvatarUrl),
        avatarUrl: normalizeAvatarUrl((latestUser && (latestUser.avatar_url || latestUser.avatarUrl)) || finalAvatarUrl)
      }

      wx.setStorageSync('userInfo', mergedUser)
      // 已真正补全资料（含头像），后续登录不再强制弹资料层；仍可在「我的资料」修改
      wx.setStorageSync('profileFilled', true)
      const app = getApp()
      if (app.globalData) {
        app.globalData.userInfo = mergedUser
        app.globalData.isLoggedIn = true
      }

      wx.hideLoading()
      wx.showToast({ title: '已登录', icon: 'success', duration: 1200 })
      this.setData({ step: 'login', isFilling: false })
      setTimeout(() => this.navigateToHome(), 1200)
    } catch (err) {
      console.error('[登录-资料保存] 失败:', err)
      wx.hideLoading()
      this.setData({ isFilling: false })
      wx.showModal({
        title: '保存失败',
        content: '头像或资料保存失败，请重试。\n' + ((err && (err.message || err.errMsg)) || '未知错误'),
        showCancel: false
      })
    }
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
