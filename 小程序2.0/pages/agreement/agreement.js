// pages/agreement/agreement.js
const { getAgreement } = require('./content.js')

Page({
  data: {
    type: 'user',
    doc: null,
    // from=cancel 表示由注销页打开，底部展示「已阅读并同意」回传按钮
    from: ''
  },

  onLoad(query = {}) {
    const type = query.type || 'user'
    const doc = getAgreement(type)
    this.setData({
      type: doc.key,
      doc,
      from: query.from || ''
    })
    wx.setNavigationBarTitle({ title: doc.title })
  },

  /**
   * 已阅读并同意：回传给来源页（用于注销页自动勾选协议）
   */
  onAgree() {
    try {
      const channel = this.getOpenerEventChannel && this.getOpenerEventChannel()
      if (channel && typeof channel.emit === 'function') {
        channel.emit('agreeAgreement', { type: this.data.type })
      }
    } catch (e) {
      console.warn('回传协议确认状态失败:', e)
    }
    wx.navigateBack()
  }
})
