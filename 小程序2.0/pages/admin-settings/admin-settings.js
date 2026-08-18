// pages/admin-settings/admin-settings.js
const { normalizeAvatarUrl, DEFAULT_AVATAR_URL } = require('../../utils/avatar.js')

const SETTING_KEYS = ['quoteNotify', 'progressNotify', 'devMode']

Page({
  data: {
    account: {},
    baseUrl: '',
    settings: { quoteNotify: true, progressNotify: true, devMode: false }
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({
      account: {
        avatar: normalizeAvatarUrl(userInfo.avatar_url || userInfo.avatarUrl, DEFAULT_AVATAR_URL),
        nickname: userInfo.nickname || userInfo.nickName || '管理员',
        role: userInfo.role || ''
      },
      baseUrl: wx.getStorageSync('apiBaseUrl') || require('../../utils/networkConfig.js').DEFAULT_BASE_URL
    })
    const stored = {}
    SETTING_KEYS.forEach(k => {
      const v = wx.getStorageSync('setting_' + k)
      if (v !== '' && v !== undefined && v !== null) stored[k] = v === true || v === 'true'
    })
    this.setData({ settings: { ...this.data.settings, ...stored } })
  },

  onToggle(e) {
    const key = e.currentTarget.dataset.key
    const value = !this.data.settings[key]
    this.setData({ [`settings.${key}`]: value })
    wx.setStorageSync('setting_' + key, value)
  },

  clearCache() {
    wx.showModal({
      title: '清除本地缓存',
      content: '将清除本机缓存的接口地址与设置（不影响服务器数据），确认？',
      success: (r) => {
        if (!r.confirm) return
        SETTING_KEYS.forEach(k => wx.removeStorageSync('setting_' + k))
        wx.removeStorageSync('apiBaseUrl')
        wx.showToast({ title: '已清除', icon: 'success' })
        this.onLoad()
      }
    })
  },

  copyBaseUrl() {
    wx.setClipboardData({ data: this.data.baseUrl })
  }
})
