// pages/admin-prices/admin-prices.js
const { adminApi } = require('../../utils/api.js')

Page({
  data: {
    list: [],
    loading: false,
    showModal: false,
    editingId: null,
    form: { device_type: '', fault_category: '', device_model: '', price: '', description: '' }
  },

  onLoad() { this.loadPrices() },
  onShow() { this.loadPrices() },

  async loadPrices() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const res = await adminApi.getAllPrices()
      if (res && res.success) {
        const list = (res.data || []).map(p => ({
          ...p,
          priceText: '¥' + (Number(p.price) || 0),
          updatedAt: (p.updated_at || p.created_at || '').slice(0, 10)
        }))
        this.setData({ list })
      }
    } catch (e) {
      console.error('加载价格失败', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  openAdd() {
    this.setData({
      showModal: true,
      editingId: null,
      form: { device_type: '', fault_category: '', device_model: '', price: '', description: '' }
    })
  },

  openEdit(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      showModal: true,
      editingId: item.id,
      form: {
        device_type: item.device_type || '',
        fault_category: item.fault_category || '',
        device_model: item.device_model || '',
        price: String(item.price || ''),
        description: item.description || ''
      }
    })
  },

  closeModal() { this.setData({ showModal: false }) },
  noop() {},
  onFieldInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  async save() {
    const { form, editingId } = this.data
    if (!form.device_type.trim() || !form.fault_category.trim()) {
      wx.showToast({ title: '设备类型和故障类别必填', icon: 'none' })
      return
    }
    const payload = {
      device_type: form.device_type.trim(),
      fault_category: form.fault_category.trim(),
      device_model: form.device_model.trim(),
      price: Number(form.price) || 0,
      description: form.description.trim()
    }
    wx.showLoading({ title: '保存中...' })
    try {
      if (editingId) {
        await adminApi.updatePrice(editingId, payload)
      } else {
        await adminApi.createPrice(payload)
      }
      wx.showToast({ title: '已保存', icon: 'success' })
      this.setData({ showModal: false })
      this.loadPrices()
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  async deletePrice(e) {
    const { id, name } = e.currentTarget.dataset
    wx.showModal({
      title: '删除价格',
      content: `确认删除「${name}」的报价？`,
      confirmColor: '#ff4757',
      success: async (r) => {
        if (!r.confirm) return
        try {
          await adminApi.deletePrice(id)
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadPrices()
        } catch (err) { wx.showToast({ title: '删除失败', icon: 'none' }) }
      }
    })
  }
})
