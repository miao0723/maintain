// pages/feedback/feedback.js
const { feedbackApi } = require('../../utils/api.js')

Page({
  data: {
    type: 'suggestion',
    content: '',
    contact: '',
    submitting: false,
    loading: false,
    myList: []
  },

  onShow() {
    this.loadMyFeedback()
  },

  /**
   * 选择反馈类型
   */
  onTypeTap(e) {
    this.setData({ type: e.currentTarget.dataset.type })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  onContactInput(e) {
    this.setData({ contact: e.detail.value })
  },

  /**
   * 提交反馈
   */
  async onSubmit() {
    if (this.data.submitting) return

    const content = (this.data.content || '').trim()
    if (!content) {
      wx.showToast({ title: '请填写反馈内容', icon: 'none' })
      return
    }
    if (content.length < 5) {
      wx.showToast({ title: '反馈内容至少5个字', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...', mask: true })
    try {
      const res = await feedbackApi.submit({
        type: this.data.type,
        content,
        contact: this.data.contact
      })
      wx.hideLoading()
      if (res && res.success) {
        wx.showToast({ title: '反馈已提交', icon: 'success' })
        this.setData({ content: '', contact: '' })
        this.loadMyFeedback()
      } else {
        wx.showToast({ title: (res && (res.error || res.message)) || '提交失败，请重试', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('提交反馈失败:', err)
      wx.showToast({ title: '网络异常，请重试', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  /**
   * 我的反馈历史
   */
  async loadMyFeedback() {
    this.setData({ loading: true })
    try {
      const res = await feedbackApi.getMine()
      if (res && res.success) {
        const list = (res.data && res.data.list) || []
        this.setData({ myList: list.map(item => ({
          ...item,
          created_at: this._formatTime(item.created_at),
          replied_at: item.replied_at ? this._formatTime(item.replied_at) : ''
        })) })
      }
    } catch (err) {
      console.error('加载反馈记录失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  _formatTime(str) {
    if (!str) return ''
    try {
      const d = new Date(str)
      if (isNaN(d.getTime())) return str
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch (e) {
      return str
    }
  }
})
