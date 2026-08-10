// pages/my-devices/my-devices.js
const { userDevicesApi } = require('../../utils/api.js')

Page({
  data: {
    deviceList: [],
    isLoading: false,
    // 当前清单：repair=维修设备，recycle=回收设备（两清单都是同一设备记录的视图，天然同步一致）
    activeTab: 'repair',
    deviceIcons: { 0: '✏️', 1: '📱', 2: '💻', 3: '📟', 4: '⌚', 5: '🎧', 6: '📷', 7: '🎮', 8: '🔬', 9: '✈️', 10: '🏠', 11: '🖨️', 12: '🖥️', 13: '📡', 14: '🎛️' }
  },

  onLoad() {
    this.loadDevices()
  },

  onShow() {
    this.loadDevices()
  },

  /**
   * 切换清单：维修设备 / 回收设备
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.activeTab) return
    this.setData({ activeTab: tab })
    this.loadDevices()
  },

  /**
   * 加载设备列表
   */
  async loadDevices() {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => { wx.navigateBack() }, 1500)
      return
    }

    if (this.data.isLoading) return
    this.setData({ isLoading: true })

    try {
      const res = await userDevicesApi.getList({ purpose: this.data.activeTab })
      if (res && res.success) {
        this.setData({ deviceList: res.data || [] })
      }
    } catch (err) {
      console.error('加载设备列表失败:', err)
      wx.showToast({ title: '加载失败，请重试', icon: 'none' })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  /**
   * 跳转到添加设备页
   */
  goToAdd() {
    if (this.data.deviceList.length >= 10) {
      wx.showToast({ title: '最多绑定10个设备', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/device-edit/device-edit?mode=add'
    })
  },

  /**
   * 进入设备详情（维修履历 + 质保 + 建议）
   */
  goDeviceDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: `/pages/device-detail/device-detail?id=${id}`
    })
  },

  /**
   * 编辑设备
   */
  editDevice(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/device-edit/device-edit?mode=edit&id=${id}`
    })
  },

  /**
   * 设为默认
   */
  async setDefault(e) {
    const id = e.currentTarget.dataset.id
    wx.showLoading({ title: '设置中...', mask: true })
    try {
      await userDevicesApi.setDefault(id)
      this.loadDevices()
      wx.showToast({ title: '已设为默认', icon: 'success' })
    } catch (err) {
      console.error('设置默认设备失败:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 删除设备
   */
  deleteDevice(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name || '该设备'

    wx.showModal({
      title: '确认删除',
      content: `确定要删除「${name}」吗？删除后不可恢复。`,
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '删除中...', mask: true })
        try {
          const result = await userDevicesApi.delete(id)
          wx.hideLoading()
          if (result.success) {
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadDevices()
          } else {
            // 显示后端返回的具体错误
            wx.showToast({ title: result.error || result.message || '删除失败', icon: 'none', duration: 2500 })
          }
        } catch (err) {
          wx.hideLoading()
          console.error('删除设备失败:', err)
          wx.showToast({ title: err.message || '删除失败', icon: 'none', duration: 2500 })
        }
      }
    })
  },

  /**
   * 发起维修 - 填入设备基础信息后跳转到维修页面
   */
  startRepair(e) {
    const index = e.currentTarget.dataset.index
    const device = this.data.deviceList[index]
    if (!device) return

    const app = getApp()
    app.globalData.prefillDeviceData = {
      type: 'repair',
      device: device
    }

    wx.switchTab({
      url: '/pages/repair/repair'
    })
  },

  /**
   * 发起回收 - 填入设备基础信息后跳转到回收页面
   */
  startRecycle(e) {
    const index = e.currentTarget.dataset.index
    const device = this.data.deviceList[index]
    if (!device) return

    const app = getApp()
    app.globalData.prefillDeviceData = {
      type: 'recycle',
      device: device
    }

    wx.switchTab({
      url: '/pages/repair/repair'
    })
  }
})
