// pages/index/index.js
const { DEFAULT_AVATAR_URL, normalizeAvatarUrl } = require('../../utils/avatar.js')
const { userApi } = require('../../utils/api.js')

Page({
  data: {
    userInfo: {
      avatarUrl: DEFAULT_AVATAR_URL,
      nickName: '微信用户',
      role: 'user'
    },
    greetingText: '欢迎回来',
    roleText: '普通用户',
    summaryTipText: '',
    userReady: false,
    loadingUserInfo: false,
    // 授权相关
    needAuth: false,        // 是否弹出登录授权弹窗
    authLoading: false,     // 授权登录中
    showProfileFill: false, // 资料补全层（读取微信头像/昵称）
    fillAvatarUrl: '',
    fillNickName: '',
    isFilling: false,
    uploadedFillAvatarUrl: '', // 资料补全时选图后已上传到服务端的头像地址
    servicePromises: [
      { id: 1, icon: '🧩', title: '全品类受理', desc: '从常见手机电脑到音响、路由器、游戏机、无人机，统一受理与诊断。' },
      { id: 2, icon: '📡', title: '维修实时反馈', desc: '检测完成、配件确认、维修进度、完工状态都会持续回传。' },
      { id: 3, icon: '🧾', title: '透明报价确认', desc: '维修前先看报价明细，确认后再开修，不做模糊收费。' }
    ],
    businessScope: [
      { id: 1, icon: '📱', name: '手机维修' },
      { id: 2, icon: '💻', name: '电脑维修' },
      { id: 3, icon: '📟', name: '平板维修' },
      { id: 4, icon: '⌚', name: '智能手表' },
      { id: 5, icon: '🎧', name: '耳机设备' },
      { id: 6, icon: '📷', name: '相机设备' },
      { id: 7, icon: '🎮', name: '游戏机' },
      { id: 8, icon: '🖥️', name: '显示器' },
      { id: 9, icon: '🔊', name: '音响设备' },
      { id: 10, icon: '📡', name: '网络设备' },
      { id: 11, icon: '🚁', name: '无人机' },
      { id: 12, icon: '🔧', name: '其他设备' }
    ],
    serviceFlow: [
      { id: 1, step: '01', title: '首页故障自检', desc: '先选择设备类型、品牌和故障现象，快速得到初步分析。' },
      { id: 2, step: '02', title: '咨询客服复核', desc: '把自检结果带入客服，对故障结论、维修方案和费用区间继续确认。' },
      { id: 3, step: '03', title: '一键预约下单', desc: '客服消息内可直接进入维修下单，系统自动带入设备和故障信息。' },
      { id: 4, step: '04', title: '检测维修与反馈', desc: '正式检测、透明报价、进度回传、完工交付全程可追踪。' }
    ],
    successCases: [
      {
        id: 1,
        icon: '📱',
        title: 'iPhone主板修复',
        desc: '成功修复无法开机问题，数据完好无损',
        tag: '透明报价后维修'
      },
      {
        id: 2,
        icon: '💻',
        title: 'MacBook数据恢复',
        desc: '硬盘故障导致数据丢失，100%恢复',
        tag: '检测后实时同步'
      },
      {
        id: 3,
        icon: '📟',
        title: 'iPad屏幕更换',
        desc: '碎屏更换，原厂品质，手感如新',
        tag: '报价确认后开修'
      },
      {
        id: 4,
        icon: '⌚',
        title: 'Apple Watch修复',
        desc: '进水损坏修复，功能完全恢复',
        tag: '多节点反馈'
      },
      {
        id: 5,
        icon: '🎮',
        title: 'PS5散热与蓝屏修复',
        desc: '拆机清洁与故障定位后恢复稳定运行',
        tag: '全品类接修'
      },
      {
        id: 6,
        icon: '🚁',
        title: '无人机云台校准',
        desc: '云台抖动与图传异常处理后恢复飞行拍摄',
        tag: '特殊设备受理'
      }
    ],
    partners: [
      { id: 1, logo: '🏢', name: '华为科技' },
      { id: 2, logo: '🏛️', name: '小米集团' },
      { id: 3, logo: '🏬', name: 'OPPO公司' },
      { id: 4, logo: '🏭', name: 'vivo科技' },
      { id: 5, logo: '🏗️', name: '三星电子' },
      { id: 6, logo: '🏰', name: '联想集团' }
    ],
    companyProfile: {
      name: '深圳市众云信息科技有限公司',
      intro: '我们专注于电子设备检测、维修、报价确认与进度反馈，面向个人和企业用户提供统一受理服务。',
      description: '当前支持手机、电脑、平板、相机、耳机、游戏机、无人机等设备维修。用户可以先通过 AI 故障自检快速判断问题，再联系在线客服复核，确认后直接提交维修订单。整个维修流程支持节点反馈与透明报价，尽量让每一步都清楚可追踪。'
    },
    companyHighlights: [
      { id: 1, title: '服务对象', value: '个人 / 企业' },
      { id: 2, title: '服务内容', value: '检测 / 维修 / 报价 / 回收' },
      { id: 3, title: '流程特点', value: '透明 / 可追踪' }
    ],
    contactInfo: {
      company: '深圳市众云信息科技有限公司',
      phone: '15570836828',
      address: '深圳市南山区国际创新谷1栋B座',
      email: '3125845799@qq.com'
    }
  },

  onLoad() {
    if (!this.checkLogin()) {
      return
    }
    this.hydrateUserInfo()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabBar = this.getTabBar()
      tabBar.setData({ selected: 0 })
      tabBar.refreshBadge()
    }

    if (!this.checkLogin()) {
      return
    }
    this.hydrateUserInfo()
  },

  /**
   * 检查登录状态：未登录时弹出授权弹窗（不再跳转丑陋的登录页）
   */
  checkLogin() {
    const token = wx.getStorageSync('token')

    if (!token) {
      this.setData({ needAuth: true })
      return false
    }

    this.setData({ needAuth: false })
    return true
  },

  getDisplayUserInfo(source = {}) {
    return {
      avatarUrl: normalizeAvatarUrl(source.avatar_url || source.avatarUrl),
      nickName: source.nickname || source.nickName || '微信用户',
      role: source.role || 'user'
    }
  },

  getUserPresentation(userInfo) {
    const role = userInfo && userInfo.role
    let roleText = '普通用户'
    if (role === 'super_admin') {
      roleText = '超级管理员'
    } else if (role === 'admin') {
      roleText = '管理员'
    } else if (role === 'internal') {
      roleText = '内部人员'
    }
    return {
      greetingText: userInfo && userInfo.nickName ? `你好，${userInfo.nickName}` : '欢迎回来',
      summaryTipText: this.data.loadingUserInfo ? '资料加载中…' : '',
      roleText
    }
  },

  async hydrateUserInfo() {
    const app = getApp()
    const localUserInfo = wx.getStorageSync('userInfo') || (app && app.globalData && app.globalData.userInfo)

    if (localUserInfo) {
      const displayUserInfo = this.getDisplayUserInfo(localUserInfo)
      this.setData({
        userInfo: displayUserInfo,
        ...this.getUserPresentation(displayUserInfo),
        userReady: true
      })
    }

    if (this.data.loadingUserInfo) {
      return
    }

    // 60s 内已同步过且本地有数据，直接复用，避免每次切到首页都打网络请求（弱网/弱机更跟手）
    const lastSync = (app && app.globalData && app.globalData._userInfoSyncedAt) || 0
    if (localUserInfo && Date.now() - lastSync < 60000) {
      return
    }

    this.setData({
      loadingUserInfo: true,
      summaryTipText: '正在同步最新资料...'
    })

    try {
      app.globalData.isLoggedIn = true
      if (localUserInfo) {
        app.globalData.userInfo = localUserInfo
      }

      const latestUserInfo = await userApi.getUserInfo()
      if (latestUserInfo) {
        const displayUserInfo = this.getDisplayUserInfo(latestUserInfo)
        this.setData({
          userInfo: displayUserInfo,
          ...this.getUserPresentation(displayUserInfo),
          userReady: true
        })
        // 记录本次同步时间，供 60s 缓存判断
        if (app && app.globalData) {
          app.globalData._userInfoSyncedAt = Date.now()
        }
      }
    } catch (error) {
      console.error('首页加载用户信息失败:', error)
    } finally {
      this.setData({
        loadingUserInfo: false,
        summaryTipText: ''
      })
    }
  },

  onAvatarError() {
    if (this.data.userInfo.avatarUrl !== DEFAULT_AVATAR_URL) {
      this.setData({
        'userInfo.avatarUrl': DEFAULT_AVATAR_URL
      })
    }
  },

  goToMine() {
    wx.switchTab({
      url: '/pages/mine/mine'
    })
  },

  /**
   * 跳转到 AI 故障自检页面
   */
  goToDiagnose() {
    wx.navigateTo({
      url: '/pages/diagnose/diagnose'
    })
  },

  /**
   * 跳转到物品回收页面
   */
  goToRecycle() {
    wx.navigateTo({
      url: '/pages/recycle/recycle'
    })
  },

  // ===== 首页授权登录弹窗 =====

  viewAgreement() {
    wx.navigateTo({ url: '/pages/welcome/welcome' })
  },

  viewPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '1. 我们会保护您的个人信息安全\n2. 您的头像和昵称仅用于身份识别\n3. 未经您同意，不会向第三方泄露\n4. 您可以随时修改个人信息\n5. 如有疑问，请联系客服',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // 弹窗内点击"微信一键登录"
  async handleAuthLogin() {
    if (this.data.authLoading) return

    this.setData({ authLoading: true })

    // 诊断：打印当前使用的 API 地址
    const app = getApp()
    const diagBaseUrl = app?.globalData?.baseUrl || '未设置'
    const diagApiUrl = app?.globalData?.apiUrl || '未设置'
    const diagStored = wx.getStorageSync('apiBaseUrl') || '无'
    console.log('========== 登录诊断 ==========')
    console.log('globalData.baseUrl:', diagBaseUrl)
    console.log('globalData.apiUrl:', diagApiUrl)
    console.log('stored apiBaseUrl:', diagStored)
    console.log('===============================')

    wx.login({
      success: async (loginRes) => {
        if (!loginRes.code) {
          this.setData({ authLoading: false })
          wx.showModal({
            title: '登录诊断',
            content: 'wx.login 未返回 code\n\n可能原因：微信授权失败\n当前 API: ' + diagBaseUrl,
            showCancel: false
          })
          return
        }
        try {
          const response = await userApi.wechatLogin(loginRes.code, {})
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
            if (app && app.globalData) {
              app.globalData.userInfo = normalizedUser
              app.globalData.isLoggedIn = true
              app.globalData.agreedToDisclaimer = true
            }

            this.setData({ needAuth: false, authLoading: false })

            // 新用户或资料不全 -> 展示资料补全层（读取微信头像/昵称）
            if (this.needProfileFill(normalizedUser)) {
              this.setData({
                showProfileFill: true,
                fillAvatarUrl: normalizedUser.avatarUrl || '',
                fillNickName: ''
              })
            } else {
              wx.showToast({ title: '登录成功', icon: 'success', duration: 1200 })
              this.hydrateUserInfo()
            }
          } else {
            wx.showModal({
              title: '登录诊断',
              content: '服务器返回异常\n\nsuccess: ' + JSON.stringify(response.success) +
                '\nerror: ' + (response.error || response.message || '无') +
                '\n当前 API: ' + diagBaseUrl,
              showCancel: false
            })
            this.setData({ authLoading: false })
          }
        } catch (err) {
          console.error('首页授权登录失败:', err)
          this.setData({ authLoading: false })
          const errMsg = (err && (err.message || err.errMsg)) || '未知错误'
          wx.showModal({
            title: '登录诊断',
            content: '网络请求失败\n\n错误: ' + errMsg +
              '\n当前 API: ' + diagBaseUrl +
              '\nstored: ' + diagStored,
            showCancel: false
          })
        }
      },
      fail: (err) => {
        this.setData({ authLoading: false })
        const errMsg = (err && (err.errMsg || err.message)) || '未知'
        wx.showModal({
          title: '登录诊断',
          content: 'wx.login 调用失败\n\n错误: ' + errMsg +
            '\n当前 API: ' + diagBaseUrl,
          showCancel: false
        })
      }
    })
  },

  needProfileFill(user) {
    if (!user) return false
    const nick = user.nickname || user.nickName || ''
    const avatar = user.avatar_url || user.avatarUrl || ''
    const noRealNick = !nick || nick === '微信用户' || nick === '游客'
    const noRealAvatar = !avatar ||
      (avatar.indexOf('/uploads/avatars/') === -1 && avatar.indexOf('http') !== 0)
    return noRealNick || noRealAvatar
  },

  // 关闭授权弹窗（暂不登录）
  closeAuth() {
    this.setData({ needAuth: false })
  },

  // ===== 资料补全层（读取微信头像 + 昵称） =====

  async   onFillNickName(e) {
    const nickName = (e.detail && e.detail.nickName) || ''
    if (nickName) {
      this.setData({ fillNickName: nickName })
    }
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    if (!avatarUrl) return
    this.setData({ fillAvatarUrl: avatarUrl, uploadedFillAvatarUrl: '' })
    // 选完即后台上传，保存时直接引用，不再阻塞
    if (avatarUrl.indexOf('http://tmp/') === 0 || avatarUrl.indexOf('wxfile://') === 0 || avatarUrl.indexOf('tmp/') === 0) {
      userApi.uploadAvatar(avatarUrl, { timeout: 15000 })
        .then(res => {
          if (res && res.avatar_url) {
            this.setData({ uploadedFillAvatarUrl: res.avatar_url, fillAvatarUrl: res.avatar_url })
          }
        })
        .catch(err => console.warn('补全资料头像上传失败，保存时再补传:', err))
    }
  },

  onFillNickNameInput(e) {
    this.setData({ fillNickName: e.detail.value })
  },

  skipProfileFill() {
    this.setData({ showProfileFill: false })
    this.hydrateUserInfo()
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
      // 优先使用选图时已后台上传的服务端地址，避免保存时阻塞
      if (this.data.uploadedFillAvatarUrl) {
        finalAvatarUrl = this.data.uploadedFillAvatarUrl
      } else if (finalAvatarUrl && (finalAvatarUrl.indexOf('http://tmp/') === 0 || finalAvatarUrl.indexOf('wxfile://') === 0 || finalAvatarUrl.indexOf('tmp/') === 0)) {
        try {
          const uploadRes = await userApi.uploadAvatar(finalAvatarUrl, { timeout: 15000 })
          if (uploadRes && uploadRes.avatar_url) {
            finalAvatarUrl = uploadRes.avatar_url
          }
        } catch (upErr) {
          console.warn('上传微信头像失败:', upErr)
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
        avatar_url: normalizeAvatarUrl(updatedUser.avatar_url || updatedUser.avatarUrl || finalAvatarUrl),
        avatarUrl: normalizeAvatarUrl(updatedUser.avatar_url || updatedUser.avatarUrl || finalAvatarUrl)
      }

      wx.setStorageSync('userInfo', mergedUser)
      const app = getApp()
      if (app && app.globalData) {
        app.globalData.userInfo = mergedUser
        app.globalData.isLoggedIn = true
      }

      wx.hideLoading()
      wx.showToast({ title: '已保存', icon: 'success', duration: 1200 })
      this.setData({ showProfileFill: false })
      this.hydrateUserInfo()
    } catch (err) {
      console.error('保存资料失败:', err)
      wx.hideLoading()
      this.setData({ isFilling: false })
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  }
})
