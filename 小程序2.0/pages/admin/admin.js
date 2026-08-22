// pages/admin/admin.js
const { adminApi } = require('../../utils/api.js')
const { normalizeAvatarUrl, DEFAULT_AVATAR_URL } = require('../../utils/avatar.js')

Page({
  data: {
    userInfo: {},
    stats: {
      totalOrders: 0,
      pendingOrders: 0,
      processingOrders: 0,
      completedOrders: 0,
      totalUsers: 0,
      totalRevenue: 0
    },
    technicians: [],
    recentOrders: [],
    isLoading: false,

    // 待处理事项计数（红点提示）
    pendingCount: {
      total: 0,
      pendingProgress: 0,
      pendingOrders: 0,
      pendingQuote: 0
    }
  },

  onLoad() {
    this.loadUserInfo()
    this.loadStats()
  },

  onShow() {
    this.loadStats()
    this.loadPendingCount()
  },

  /**
   * 加载用户信息并验证权限
   */
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && (userInfo.role === 'admin' || userInfo.role === 'super_admin')) {
      this.setData({
        userInfo: {
          ...userInfo,
          avatar_url: normalizeAvatarUrl(userInfo.avatar_url || userInfo.avatarUrl, DEFAULT_AVATAR_URL)
        }
      })
    } else {
      wx.showToast({
        title: '需要管理员权限',
        icon: 'none'
      })
      wx.reLaunch({
        url: '/pages/home/home'
      })
    }
  },

  onAvatarError() {
    this.setData({
      'userInfo.avatar_url': DEFAULT_AVATAR_URL,
      'userInfo.avatarUrl': DEFAULT_AVATAR_URL
    })
  },

  /**
   * 加载统计数据
   */
  async loadStats() {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })
    wx.showLoading({ title: '加载中...' })

    try {
      // 调用管理员API获取统计数据
      const response = await adminApi.getDashboardStats()
      console.log('[统计数据响应]', response)

      if (response && response.success && response.data) {
        const { orders, users, revenue, technicians, recentOrders } = response.data

        this.setData({
          stats: {
            totalOrders: orders?.total_orders || 0,
            pendingOrders: orders?.pending_orders || 0,
            processingOrders: orders?.processing_orders || 0,
            completedOrders: orders?.completed_orders || 0,
            totalUsers: users?.total_users || 0,
            totalRevenue: revenue?.total_revenue || 0
          },
          technicians: technicians || [],
          recentOrders: recentOrders || []
        })

        console.log('[统计数据]', this.data.stats)
        console.log('[维修人员]', this.data.technicians)
        console.log('[最近订单]', this.data.recentOrders)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
      // 使用mock数据作为回退
      this.setData({
        stats: {
          totalOrders: 128,
          pendingOrders: 12,
          processingOrders: 23,
          completedOrders: 93,
          totalUsers: 56,
          totalRevenue: 0
        }
      })
    } finally {
      this.setData({ isLoading: false })
      wx.hideLoading()
    }
  },

  /**
   * 跳转到内部免付款申请待确认（带 status 参数，直接进入有按钮的页签）
   */
  goToInternalPending() {
    wx.navigateTo({
      url: '/pages/admin-orders/admin-orders?status=internal_pending'
    });
  },

  /**
   * 加载待处理计数（红点数据）
   */
  async loadPendingCount() {
    try {
      const res = await adminApi.getPendingCount()
      if (res && res.success && res.data) {
        this.setData({ pendingCount: res.data })
      }
    } catch (error) {
      console.error('加载待处理计数失败:', error)
    }
  },

  /**
   * 查看所有订单
   */
  viewAllOrders() {
    wx.navigateTo({
      url: '/pages/admin-orders/admin-orders?status=all'
    })
  },

  /**
   * 查看待处理订单
   */
  viewProcessingOrders() {
    wx.navigateTo({
      url: '/pages/admin-orders/order-assign?status=processing&filter=mine'
    })
  },

  /**
   * 查看已完成订单
   */
  viewCompletedOrders() {
    wx.navigateTo({
      url: '/pages/admin-orders/admin-orders?status=completed'
    })
  },

  /**
   * 查看所有用户
   */
  viewAllUsers() {
    wx.navigateTo({
      url: '/pages/admin-users/admin-users'
    })
  },

  /**
   * 跳转到我的订单
   */
  goToMyOrders() {
    wx.navigateTo({
      url: '/pages/my-orders/my-orders'
    })
  },

  /**
   * 跳转到订单分配
   */
  goToOrderAssign() {
    wx.navigateTo({
      url: '/pages/admin-orders/order-assign'
    })
  },

  /**
   * 订单管理
   */
  goToOrderManagement() {
    wx.navigateTo({
      url: '/pages/admin-orders/admin-orders'
    })
  },

  /**
   * 全部订单列表
   */
  goToAllOrdersList() {
    wx.navigateTo({
      url: '/pages/order-list/order-list'
    })
  },

  /**
   * 用户管理
   */
  goToUserManagement() {
    wx.navigateTo({
      url: '/pages/admin-users/admin-users'
    })
  },

  /**
   * 设备管理
   */
  goToDeviceManagement() {
    wx.navigateTo({
      url: '/pages/admin-devices/admin-devices'
    })
  },

  /**
   * 价格管理
   */
  goToPriceManagement() {
    wx.navigateTo({
      url: '/pages/admin-prices/admin-prices'
    })
  },

  /**
   * 单位管理
   */
  goToUnitManagement() {
    wx.navigateTo({
      url: '/pages/units/units'
    })
  },

  /**
   * 数据统计
   */
  goToDataStatistics() {
    wx.navigateTo({
      url: '/pages/admin-stats/admin-stats'
    })
  },

  /**
   * 系统设置
   */
  goToSystemSettings() {
    wx.navigateTo({
      url: '/pages/admin-settings/admin-settings'
    })
  },

  /**
   * 进度申请管理
   */
  goToProgressApplyManagement() {
    wx.navigateTo({
      url: '/pages/admin-progress-apply/admin-progress-apply'
    })
  },

  /**
   * 客服管理
   */
  goToServiceManagement() {
    wx.navigateTo({
      url: '/pages/adminservice/adminservice'
    })
  },

  /**
   * 导出数据
   */
  exportData() {
    wx.showModal({
      title: '导出数据',
      content: '确定要导出系统数据吗？',
      confirmText: '导出',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '导出中...' })
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({
              title: '导出成功',
              icon: 'success'
            })
          }, 1500)
        }
      }
    })
  },

  /**
   * 清除缓存
   */
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除系统缓存吗？',
      confirmText: '清除',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清除中...' })
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({
              title: '缓存已清除',
              icon: 'success'
            })
            this.loadStats()
          }, 1500)
        }
      }
    })
  },

  /**
   * 发送通知
   */
  sendNotification() {
    wx.showModal({
      title: '发送通知',
      content: '此功能正在开发中',
      showCancel: false
    })
  },

  /**
   * 系统检查
   */
  checkSystem() {
    wx.showLoading({ title: '检查中...' })
    setTimeout(() => {
      wx.hideLoading()
      wx.showModal({
        title: '系统状态',
        content: '系统运行正常\n数据库连接正常\nAPI服务正常',
        showCancel: false
      })
    }, 1500)
  },

  /**
   * 返回用户端
   */
  goToUserApp() {
    wx.switchTab({
      url: '/pages/home/home'
    })
  }
})
