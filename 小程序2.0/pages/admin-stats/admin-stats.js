// pages/admin-stats/admin-stats.js
const { adminApi } = require('../../utils/api.js')

const STATUS_LABELS = {
  pending: '待处理', processing: '维修中', completed: '已完成',
  cancelled: '已取消', review: '待评价'
}

Page({
  data: {
    loading: false,
    revenue: { total_revenue: 0, monthly_revenue: 0, weekly_revenue: 0, daily_revenue: 0 },
    orders: {},
    users: {},
    parts: {},
    recentOrders: []
  },

  onLoad() { this.loadStats() },
  onShow() { this.loadStats() },

  async loadStats() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const res = await adminApi.getDashboardStats()
      if (res && res.success && res.data) {
        const d = res.data
        this.setData({
          revenue: d.revenue || {},
          orders: d.orders || {},
          users: d.users || {},
          parts: d.parts || {},
          recentOrders: (d.recentOrders || []).map(o => ({
            ...o,
            statusLabel: STATUS_LABELS[o.status] || o.status,
            price: o.actual_price || o.estimated_price || 0,
            createdAt: (o.created_at || '').slice(0, 10)
          }))
        })
      }
    } catch (e) {
      console.error('加载统计失败', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  formatMoney(v) {
    const n = Number(v || 0)
    return n >= 10000 ? (n / 10000).toFixed(1) + '万' : String(n)
  }
})
