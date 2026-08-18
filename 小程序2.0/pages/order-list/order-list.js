// pages/order-list/order-list.js
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    orders: [],
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true,
    loading: false,
    refreshing: false,
    searchKeyword: '',
    currentFilter: 'all',
    statusIndex: 0,
    statusOptions: [
      { value: 'all', label: '全部状态' },
      { value: 'pending', label: '待处理' },
      { value: 'quoted', label: '待确认报价' },
      { value: 'confirmed', label: '已确认报价' },
      { value: 'processing', label: '维修中' },
      { value: 'completed', label: '已完成' },
      { value: 'review', label: '待评价' },
      { value: 'cancelled', label: '已取消' }
    ],
    statusCounts: {
      pending: 0,
      quoted: 0,
      confirmed: 0,
      processing: 0,
      completed: 0,
      review: 0,
      cancelled: 0
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadOrders()
  },

  /**
   * 下拉刷新
   */
  onRefresh() {
    this.setData({
      page: 1,
      orders: [],
      hasMore: true,
      refreshing: true
    })
    this.loadOrders().then(() => {
      this.setData({
        refreshing: false
      })
    })
  },

  /**
   * 加载订单列表
   */
  async loadOrders() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({
      loading: true
    })

    try {
      const token = wx.getStorageSync('token')
      const { page, pageSize, searchKeyword, currentFilter, statusIndex } = this.data
      const status = this.data.statusOptions[statusIndex].value

      const params = {
        page,
        pageSize,
        keyword: searchKeyword,
        status: status === 'all' ? '' : status
      }

      // 根据角色选择API
      const isSuperAdmin = wx.getStorageSync('userRole') === 'super_admin'
      const apiUrl = '/api/orders/all'

      const res = await this.request(apiUrl, params, 'GET', token)

      if (res.success) {
        const newOrders = res.data.orders || []
        const total = res.data.total || 0
        const hasMore = page * pageSize < total

        this.setData({
          orders: page === 1 ? newOrders : [...this.data.orders, ...newOrders],
          total,
          hasMore,
          statusCounts: res.data.statusCounts || this.data.statusCounts
        })
      }
    } catch (error) {
      console.error('加载订单列表失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({
        loading: false
      })
    }
  },

  /**
   * 加载更多
   */
  loadMore() {
    if (!this.data.hasMore) return

    this.setData({
      page: this.data.page + 1
    })
    this.loadOrders()
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  /**
   * 清除搜索
   */
  onClearSearch() {
    this.setData({
      searchKeyword: ''
    })
    this.onSearch()
  },

  /**
   * 搜索
   */
  onSearch() {
    this.setData({
      page: 1,
      orders: [],
      hasMore: true
    })
    this.loadOrders()
  },

  /**
   * 切换筛选
   */
  switchFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({
      currentFilter: filter,
      page: 1,
      orders: [],
      hasMore: true
    })
    this.loadOrders()
  },

  /**
   * 状态改变
   */
  onStatusChange(e) {
    this.setData({
      statusIndex: parseInt(e.detail.value),
      page: 1,
      orders: [],
      hasMore: true
    })
    this.loadOrders()
  },

  /**
   * 跳转详情
   */
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`
    })
  },

  /**
   * 分配订单
   */
  assignOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/admin-orders/order-assign?orderId=${id}`
    })
  },

  /**
   * 处理订单
   */
  processOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showActionSheet({
      itemList: ['更新进度', '完成订单', '取消订单'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.updateProgress(id)
        } else if (res.tapIndex === 1) {
          this.completeOrder(id)
        } else if (res.tapIndex === 2) {
          this.cancelOrder(id)
        }
      },
      fail: () => {}
    })
  },

  /**
   * 更新进度
   */
  updateProgress(orderId) {
    wx.showModal({
      title: '更新进度',
      content: '请输入维修进度 (0-100)',
      editable: true,
      placeholderText: '请输入0-100之间的数字',
      success: async (res) => {
        if (res.confirm && res.content) {
          const progress = parseInt(res.content)
          if (isNaN(progress) || progress < 0 || progress > 100) {
            wx.showToast({
              title: '请输入0-100之间的数字',
              icon: 'none'
            })
            return
          }

          try {
            wx.showLoading({ title: '更新中...' })
            const token = wx.getStorageSync('token')
            const result = await this.request(`/api/admin/orders/${orderId}/progress`, { progress }, 'PUT', token)

            if (result.success) {
              wx.showToast({
                title: '更新成功',
                icon: 'success'
              })
              this.onRefresh()
            }
          } catch (error) {
            console.error('更新进度失败:', error)
            wx.showToast({
              title: '更新失败',
              icon: 'none'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  /**
   * 完成订单
   */
  async completeOrder(orderId) {
    wx.showModal({
      title: '完成订单',
      content: '确定要完成这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中...' })
            const token = wx.getStorageSync('token')
            const result = await this.request(`/api/admin/orders/${orderId}/complete`, {}, 'PUT', token)

            if (result.success) {
              wx.showToast({
                title: '订单已完成',
                icon: 'success'
              })
              this.onRefresh()
            }
          } catch (error) {
            console.error('完成订单失败:', error)
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  /**
   * 取消订单
   */
  async cancelOrder(orderId) {
    wx.showModal({
      title: '取消订单',
      content: '确定要取消这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中...' })
            const token = wx.getStorageSync('token')
            const result = await this.request(`/api/admin/orders/${orderId}/cancel`, {}, 'PUT', token)

            if (result.success) {
              wx.showToast({
                title: '订单已取消',
                icon: 'success'
              })
              this.onRefresh()
            }
          } catch (error) {
            console.error('取消订单失败:', error)
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  /**
   * 查看评价
   */
  async viewReview(orderId) {
    try {
      const token = wx.getStorageSync('token')
      const result = await this.request(`/api/orders/${orderId}/review`, {}, 'GET', token)

      if (result.success && result.data) {
        wx.showModal({
          title: '订单评价',
          content: `${result.data.comment || '暂无评价内容'}\n\n评分: ${'⭐'.repeat(result.data.rating)}`,
          showCancel: false
        })
      } else {
        wx.showToast({
          title: '暂无评价',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('查看评价失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止点击事件冒泡
  },

  /**
   * 格式化时间
   */
  formatTime(time) {
    if (!time) return ''
    const date = new Date(time)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${month}-${day} ${hour}:${minute}`
  },

  /**
   * 获取状态标签
   */
  getStatusLabel(status) {
    const labels = {
      'pending': '待处理',
      'quoted': '待确认报价',
      'confirmed': '已确认报价',
      'processing': '维修中',
      'completed': '已完成',
      'review': '待评价',
      'cancelled': '已取消'
    }
    return labels[status] || status
  },

  /**
   * 获取状态颜色
   */
  getStatusColor(status) {
    const colors = {
      'pending': '#ff9800',
      'quoted': '#436f95',
      'confirmed': '#06b6d4',
      'processing': '#2196f3',
      'completed': '#4caf50',
      'review': '#9c27b0',
      'cancelled': '#f44336'
    }
    return colors[status] || '#999'
  },

  /**
   * 获取设备图标
   */
  getDeviceIcon(type) {
    const icons = {
      1: '📱',
      2: '💻',
      3: '📟',
      4: '⌚',
      5: '🎧',
      6: '📷',
      7: '🎮',
      8: '🔧'
    }
    return icons[type] || '📱'
  },

  /**
   * 获取成色标签
   */
  getConditionLabel(condition) {
    const labels = {
      'good': '成色很好',
      'normal': '成色一般',
      'fair': '成色较差',
      'poor': '成色很差'
    }
    return labels[condition] || condition
  },

  /**
   * 封装请求方法
   */
  request(url, data, method = 'GET', token = '') {
    return new Promise((resolve, reject) => {
      wx.request({
        // 网关 /mp-api 已映射到后端 /api；路径不再重复写 /api，否则会变成 /mp-api/api/... 而 404
        url: (app.globalData.baseUrl || app.globalData.apiUrl) + (url.startsWith('/api/') ? url.slice(4) : url),
        method: method,
        data: data,
        header: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else {
            reject(res)
          }
        },
        fail: reject
      })
    })
  }
})
