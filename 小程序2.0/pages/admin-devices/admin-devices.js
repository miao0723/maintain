// pages/admin-devices/admin-devices.js
const { adminApi } = require('../../utils/api.js')

Page({
  data: {
    list: [],
    loading: false,
    showModal: false,
    editingId: null,
    formName: '',
    formIcon: ''
  },

  onLoad() { this.loadDevices() },
  onShow() { this.loadDevices() },

  async loadDevices() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const res = await adminApi.getAllDevices()
      if (res && res.success) {
        const list = (res.data || []).map(d => ({ ...d, createdAt: (d.created_at || '').slice(0, 10) }))
        this.setData({ list })
      }
    } catch (e) {
      console.error('加载设备类型失败', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  openAdd() {
    this.setData({ showModal: true, editingId: null, formName: '', formIcon: '📱' })
  },

  openEdit(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      showModal: true,
      editingId: item.id,
      formName: item.name || '',
      formIcon: item.icon || '📱'
    })
  },

  closeModal() { this.setData({ showModal: false }) },
  noop() {},
  onNameInput(e) { this.setData({ formName: e.detail.value }) },
  onIconInput(e) { this.setData({ formIcon: e.detail.value }) },

  async save() {
    const { formName, formIcon, editingId } = this.data
    if (!formName || !formName.trim()) {
      wx.showToast({ title: '请输入类型名称', icon: 'none' })
      return
    }
    wx.showLoading({ title: '保存中...' })
    try {
      if (editingId) {
        await adminApi.updateDevice(editingId, { name: formName.trim(), icon: formIcon })
      } else {
        await adminApi.createDevice({ name: formName.trim(), icon: formIcon })
      }
      wx.showToast({ title: '已保存', icon: 'success' })
      this.setData({ showModal: false })
      this.loadDevices()
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  async deleteDevice(e) {
    const { id, name } = e.currentTarget.dataset
    wx.showModal({
      title: '删除设备类型',
      content: `确认删除「${name}」？`,
      confirmColor: '#ff4757',
      success: async (r) => {
        if (!r.confirm) return
        try {
          await adminApi.deleteDevice(id)
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadDevices()
        } catch (err) { wx.showToast({ title: '删除失败', icon: 'none' }) }
      }
    })
  }
})
