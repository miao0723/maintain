// pages/account-cancel/account-cancel.js
/**
 * 账号注销（不可逆操作）
 * ------------------------------------------------------------
 * 交互规则：
 *  1) 进入页面先做「注销前置检查」：存在未完业务时拦截（服务端同规则校验，防止绕过）
 *  2) 需勾选《用户协议》《账号注销协议》后才可发起注销
 *  3) 二次弹窗强确认：第一次风险告知，第二次要求手动输入「注销」二字
 *  4) 注销成功后清理本地登录态与缓存，跳转欢迎页
 */
const { userApi } = require('../../utils/api.js')
const { DEFAULT_AVATAR_URL: defaultAvatarUrl, normalizeAvatarUrl } = require('../../utils/avatar.js')
const { buildProfileView, maskPhone } = require('../../utils/profileUtils.js')

// 二次强确认的输入校验词
const CONFIRM_WORD = '注销'

Page({
  data: {
    loading: true,
    submitting: false,
    canDelete: false,
    checked: false, // 是否已勾选协议（用户协议 + 注销协议）
    // 账号概要
    profile: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
      roleText: '客户 / Customer',
      roleIcon: '👤',
      roleTheme: 'user',
      maskedPhone: '',
      hasPhone: false,
      createdAtText: ''
    },
    blockers: [],   // 阻断项（存在即禁止注销）
    notices: [],    // 提示项（不阻断）
    assets: {
      orders: 0,
      devices: 0,
      addresses: 0,
      units: 0,
      feedbacks: 0
    },
    // 注销后将清除的数据清单
    clearList: [
      { icon: '👤', label: '账号资料', desc: '昵称、头像、手机号、邮箱' },
      { icon: '📍', label: '地址与单位', desc: '全部收货地址、所属单位信息' },
      { icon: '🖥️', label: '设备档案', desc: '已绑定的设备及质保记录' },
      { icon: '📝', label: '意见反馈', desc: '历史反馈与回复记录' }
    ],
    // 注销后依法留档的数据说明
    keepList: [
      { icon: '📋', label: '订单与支付记录', desc: '解除账号关联后按法规留档，用于争议追溯' },
      { icon: '🛠️', label: '售后记录', desc: '用于质保履行与合规审计' }
    ]
  },

  onLoad() {
    const app = getApp()
    if (!app.globalData.isLoggedIn && !wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1200)
      return
    }
    this.loadProfileSummary()
    this.loadCheck()
  },

  /**
   * 本地账号概要（角色中英文映射 + 手机号掩码）
   */
  loadProfileSummary() {
    const app = getApp()
    const local = wx.getStorageSync('userInfo') || {}
    const global = (app && app.globalData && app.globalData.userInfo) || {}
    const merged = { ...global, ...local }
    const view = buildProfileView(merged)

    this.setData({
      profile: {
        avatarUrl: normalizeAvatarUrl(merged.avatar_url || merged.avatarUrl),
        nickName: merged.nickname || merged.nickName || '微信用户',
        roleText: view.roleText,
        roleIcon: view.roleIcon,
        roleTheme: view.roleTheme,
        maskedPhone: view.maskedPhone,
        hasPhone: view.hasPhone,
        createdAtText: this.formatDate(merged.created_at)
      }
    })
  },

  /**
   * 注销前置检查：未完成业务拦截
   */
  async loadCheck() {
    this.setData({ loading: true })
    try {
      const res = await userApi.checkDeletable()
      if (res && res.success) {
        this.applyCheckResult(res)
      } else {
        wx.showToast({ title: (res && res.error) || '注销检查失败', icon: 'none' })
      }
    } catch (err) {
      console.error('注销前置检查失败:', err)
      wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  applyCheckResult(res) {
    const user = res.user || {}
    const view = buildProfileView(user)
    const profile = { ...this.data.profile }

    // 服务端已返回掩码手机号时以服务端为准（本地 profile 可能未带 phone）
    if (user.phone_masked) {
      profile.maskedPhone = user.phone_masked
      profile.hasPhone = !!user.has_phone
    } else if (user.phone) {
      profile.maskedPhone = maskPhone(user.phone)
      profile.hasPhone = true
    }
    profile.roleText = view.roleText
    profile.roleIcon = view.roleIcon
    profile.roleTheme = view.roleTheme
    if (user.nickname) profile.nickName = user.nickname
    if (user.created_at) profile.createdAtText = this.formatDate(user.created_at)

    this.setData({
      profile,
      canDelete: !!res.canDelete,
      blockers: res.blockers || [],
      notices: res.notices || [],
      assets: res.assets || this.data.assets
    })
  },

  formatDate(raw) {
    if (!raw) return ''
    const d = new Date(String(raw).replace(' ', 'T'))
    if (isNaN(d.getTime())) return ''
    const pad = n => (n < 10 ? '0' + n : '' + n)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  },

  /**
   * 勾选/取消协议
   */
  toggleAgreement() {
    const next = !this.data.checked
    this.setData({ checked: next })
  },

  /**
   * 打开协议全文（回传后自动勾选）
   */
  openAgreement(e) {
    const type = e.currentTarget.dataset.type || 'user'
    wx.navigateTo({
      url: `/pages/agreement/agreement?type=${type}&from=cancel`,
      events: {
        agreeAgreement: (payload) => {
          // 只有读完注销协议才自动置为已同意；用户协议单独阅读不直接放行
          if (payload && payload.type === 'cancel') {
            this.setData({ checked: true })
          }
        }
      }
    })
  },

  /**
   * 跳转到对应业务处理页（拦截项的「去处理」入口）
   */
  goHandleBlocker(e) {
    const url = e.currentTarget.dataset.route
    if (!url) return
    wx.navigateTo({ url })
  },

  /**
   * 点击「确认注销」：未完业务拦截 → 协议校验 → 二次弹窗强确认
   */
  onCancelAccount() {
    if (this.data.submitting) return

    // 拦截：存在未完成的业务
    if (!this.data.canDelete || (this.data.blockers && this.data.blockers.length > 0)) {
      const first = (this.data.blockers || [])[0]
      wx.showModal({
        title: '暂无法注销',
        content: `检测到 ${this.data.blockers.length} 项未完成的业务${first ? `（${first.label} ${first.count} 项）` : ''}，请先处理完毕后再申请注销，以保障您的交易安全。`,
        confirmText: '我知道了',
        showCancel: false
      })
      return
    }

    // 拦截：未勾选协议
    if (!this.data.checked) {
      wx.showToast({ title: '请先阅读并同意注销协议', icon: 'none' })
      return
    }

    this.showFirstConfirm()
  },

  /**
   * 第一次确认：不可逆风险告知
   */
  showFirstConfirm() {
    wx.showModal({
      title: '注销账号确认',
      content:
        '注销为不可逆操作：\n\n1. 账号资料、地址、单位、设备与反馈记录将被永久删除；\n2. 注销后无法恢复，也无法再次使用该账号登录；\n3. 订单与支付记录将解除账号关联并按法规留档。\n\n请确认已备份所需凭证。',
      confirmText: '我已了解，继续',
      cancelText: '暂不注销',
      confirmColor: '#e04b3a',
      success: (res) => {
        if (res.confirm) this.showSecondConfirm()
      }
    })
  },

  /**
   * 第二次确认：手动输入「注销」强确认，防止误触
   */
  showSecondConfirm() {
    wx.showModal({
      title: '再次确认注销',
      content: '',
      editable: true,
      placeholderText: `请输入「${CONFIRM_WORD}」以确认`,
      confirmText: '确认注销',
      cancelText: '取消',
      confirmColor: '#e04b3a',
      success: (res) => {
        if (!res.confirm) return
        const input = (res.content || '').trim()
        if (input !== CONFIRM_WORD) {
          wx.showToast({ title: `输入不正确，请输入「${CONFIRM_WORD}」`, icon: 'none' })
          return
        }
        this.performDelete()
      }
    })
  },

  /**
   * 执行注销
   */
  async performDelete() {
    this.setData({ submitting: true })
    wx.showLoading({ title: '注销中...', mask: true })

    try {
      const res = await userApi.deleteAccount()

      // 409：存在未完业务（服务端二次校验命中），刷新拦截清单
      if (res && res.success === false && res.statusCode === 409) {
        wx.hideLoading()
        this.setData({ submitting: false })
        const detail = res.data || {}
        this.setData({
          canDelete: false,
          blockers: detail.blockers || [],
          notices: detail.notices || [],
          assets: detail.assets || this.data.assets
        })
        wx.showModal({
          title: '暂无法注销',
          content: detail.error || '存在未完成的业务，请先处理完毕后再申请注销。',
          confirmText: '我知道了',
          showCancel: false
        })
        return
      }

      if (res && res.success) {
        wx.hideLoading()
        this.clearLocalAccountState()
        wx.showToast({ title: '账号已注销', icon: 'success' })
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/welcome/welcome' })
        }, 1500)
        return
      }

      wx.hideLoading()
      this.setData({ submitting: false })
      wx.showToast({ title: (res && (res.message || res.error)) || '注销失败', icon: 'none' })
    } catch (err) {
      wx.hideLoading()
      this.setData({ submitting: false })
      console.error('注销账号失败:', err)
      wx.showToast({ title: '注销失败，请稍后重试', icon: 'none' })
    }
  },

  /**
   * 清理本地登录态与业务缓存
   */
  clearLocalAccountState() {
    try {
      const app = getApp()
      if (app && app.globalData) {
        app.globalData.isLoggedIn = false
        app.globalData.userInfo = null
      }
    } catch (e) {}

    wx.clearStorageSync()
  },

  /**
   * 下拉刷新：重新做一次注销检查
   */
  onPullDownRefresh() {
    this.loadCheck().finally(() => wx.stopPullDownRefresh())
  }
})
