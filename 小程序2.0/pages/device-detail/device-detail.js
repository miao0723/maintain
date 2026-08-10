// pages/device-detail/device-detail.js
const { afterSalesApi, userDevicesApi } = require('../../utils/api.js')
const { deviceData } = require('../../utils/deviceData.js')

const STATUS_TEXT = {
  pending: '待处理',
  quoted: '待确认报价',
  confirmed: '已确认',
  processing: '维修中',
  completed: '已完成',
  review: '待评价',
  cancelled: '已取消'
}

Page({
  data: {
    deviceId: null,
    loading: true,
    device: null,
    warranty: { status: 'none', remaining_days: 0, warranty_end_date: '', warranty_start_date: '' },
    history: [],
    advice: [],
    canWarranty: false,
    originalOrderId: null,
    deviceIcons: { 0: '✏️', 1: '📱', 2: '💻', 3: '📟', 4: '⌚', 5: '🎧', 6: '📷', 7: '🎮', 8: '🔬', 9: '✈️', 10: '🏠', 11: '🖨️', 12: '🖥️', 13: '📡', 14: '🎛️' }
  },

  onLoad(options) {
    const deviceId = options.id
    if (!deviceId) {
      wx.showToast({ title: '设备ID缺失', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({ deviceId })
    this.loadSummary()
  },

  async loadSummary() {
    this.setData({ loading: true })
    try {
      // 设备基本信息
      let device = null
      try {
        const dRes = await userDevicesApi.getDetail(this.data.deviceId)
        if (dRes && dRes.success) device = dRes.data
      } catch (e) { /* 忽略 */ }

      const res = await afterSalesApi.getDeviceSummary(this.data.deviceId)
      if (res && res.success && res.data) {
        const data = res.data
        const history = (data.history || []).map(o => ({
          ...o,
          statusText: STATUS_TEXT[o.status] || o.status,
          recordsCount: (o.repair_records || []).length
        }))
        const completed = history.find(o => o.status === 'completed')
        this.setData({
          device: device || data.device || null,
          warranty: data.warranty || { status: 'none', remaining_days: 0 },
          history,
          advice: data.advice || [],
          canWarranty: !!completed,
          originalOrderId: completed ? completed.id : null,
          loading: false
        })
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载设备售后总览失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 发起普通维修（带入设备信息预填）
  startRepair() {
    const app = getApp()
    app.globalData.prefillDeviceData = {
      type: 'repair',
      device: this.data.device
    }
    wx.switchTab({ url: '/pages/repair/repair' })
  },

  // 申请质保维修（关联原单，免检测费）
  applyWarranty() {
    if (!this.data.canWarranty) {
      wx.showToast({ title: '暂无已完成维修记录', icon: 'none' })
      return
    }
    const app = getApp()
    app.globalData.prefillDeviceData = {
      type: 'repair',
      device: this.data.device,
      isWarranty: true,
      originalOrderId: this.data.originalOrderId
    }
    wx.switchTab({ url: '/pages/repair/repair' })
  },

  // 查看某笔订单的维修记录
  goRepairRecords(e) {
    const orderId = e.currentTarget.dataset.orderid
    if (!orderId) return
    wx.navigateTo({ url: `/pages/repair-records/repair-records?orderId=${orderId}` })
  },

  goEdit() {
    wx.navigateTo({ url: `/pages/device-edit/device-edit?mode=edit&id=${this.data.deviceId}` })
  },

  onPullDownRefresh() {
    this.loadSummary().then(() => wx.stopPullDownRefresh())
  }
})
