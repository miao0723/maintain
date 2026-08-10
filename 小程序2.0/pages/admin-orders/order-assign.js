// pages/admin-orders/order-assign.js
const app = getApp();

// 状态配置
const STATUS_CONFIG = {
  pending: {
    label: '待处理',
    color: '#f59e0b',
    bg: '#fef3c7',
    icon: '⏳'
  },
  processing: {
    label: '维修中',
    color: '#3b82f6',
    bg: '#dbeafe',
    icon: '🔧'
  },
  completed: {
    label: '已完成',
    color: '#10b981',
    bg: '#d1fae5',
    icon: '✅'
  },
  cancelled: {
    label: '已取消',
    color: '#ef4444',
    bg: '#fee2e2',
    icon: '❌'
  }
};

Page({
  data: {
    // 管理员信息
    adminInfo: null,
    token: null,

    // 订单列表
    orders: [],
    currentTab: 'pending',

    // 筛选条件
    statusFilter: 'all',

    // 订单过滤模式：all=所有订单, mine=只看分配给自己的
    orderFilter: 'all',

    // 统计数据
    stats: {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0
    },

    // 分页
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true,

    // 加载状态
    loading: false,
    refreshing: false,

    // 搜索
    searchKeyword: '',

    // 分配弹窗
    showAssignModal: false,
    adminList: [],
    selectedAdmin: null,
    currentOrderId: null,

    // 订单详情
    showOrderDetail: false,
    currentOrder: null
  },

  onLoad(options) {
    const userInfo = wx.getStorageSync('userInfo') || wx.getStorageSync('admin_info');
    const token = wx.getStorageSync('token') || wx.getStorageSync('admin_token');

    if (!userInfo || (userInfo.role !== 'admin' && userInfo.role !== 'super_admin')) {
      wx.showToast({ title: '需要管理员权限', icon: 'none' });
      wx.reLaunch({ url: '/pages/home/home' });
      return;
    }

    this.setData({
      adminInfo: userInfo,
      token: token
    });

    // 如果有状态参数
    if (options.status) {
      this.setData({ statusFilter: options.status });
    }

    // 如果有filter参数（如 filter=mine 表示只看自己的订单）
    if (options.filter) {
      this.setData({ orderFilter: options.filter });
    }

    // 加载数据
    this.loadAdmins();
    this.loadOrders();
    this.loadStats();
  },

  onShow() {
    this.loadOrders();
    this.loadStats();
  },

  /**
   * 加载订单列表
   */
  async loadOrders(refresh = false) {
    if (this.data.loading) return;

    if (refresh) {
      this.setData({ page: 1, hasMore: true, orders: [] });
    }

    if (!this.data.hasMore) return;

    this.setData({ loading: true });

    try {
      const { page, pageSize, statusFilter, searchKeyword, orderFilter } = this.data;

      const requestData = {
        page,
        pageSize,
        status: statusFilter === 'all' ? '' : statusFilter,
        keyword: searchKeyword
      };

      // 如果是mine模式，使用my-orders接口获取自己的订单
      const apiUrl = orderFilter === 'mine'
        ? `${app.globalData.baseUrl}/api/admin/my-orders`
        : `${app.globalData.baseUrl}/api/admin/all-orders`;

      if (orderFilter === 'mine') {
        requestData.filter = 'mine';
      }

      const res = await wx.request({
        url: apiUrl,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        },
        data: requestData
      });

      if (res.statusCode === 200 && res.data && res.data.success) {
        const newOrders = res.data.data.orders || [];
        const total = res.data.data.total || 0;

        // 处理订单数据
        const processedOrders = newOrders.map(order => ({
          ...order,
          statusText: STATUS_CONFIG[order.status]?.label || '未知',
          createdAt: this.formatTime(order.createdAt)
        }));

        this.setData({
          orders: refresh ? processedOrders : [...this.data.orders, ...processedOrders],
          total,
          hasMore: newOrders.length >= pageSize
        });
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    } catch (error) {
      console.error('加载订单失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 加载统计数据
   */
  async loadStats() {
    try {
      const res = await wx.request({
        url: `${app.globalData.baseUrl}/api/admin/dashboard-stats`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.statusCode === 200 && res.data && res.data.success) {
        this.setData({ stats: res.data.data });
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  /**
   * 加载管理员列表
   */
  async loadAdmins() {
    try {
      const res = await wx.request({
        url: `${app.globalData.baseUrl}/api/admin/admins`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.statusCode === 200 && res.data && res.data.success) {
        const adminList = res.data.data.map(admin => ({
          ...admin,
          displayName: `${admin.real_name || admin.nickname} (${admin.role === 'super_admin' ? '超管' : '管理员'})`
        }));
        this.setData({ adminList });
      }
    } catch (error) {
      console.error('加载管理员列表失败:', error);
    }
  },

  /**
   * 筛选订单
   */
  filterByStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      statusFilter: status,
      page: 1
    });
    this.loadOrders(true);
  },

  /**
   * 搜索订单
   */
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearch() {
    this.setData({ page: 1 });
    this.loadOrders(true);
  },

  /**
   * 加载更多
   */
  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadOrders();
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({ refreshing: true });
    Promise.all([
      this.loadOrders(true),
      this.loadStats()
    ]).then(() => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 显示分配弹窗
   */
  showAssignModal(e) {
    const orderId = e.currentTarget.dataset.id;
    const order = this.data.orders.find(o => o.id === orderId);

    this.setData({
      showAssignModal: true,
      currentOrderId: orderId,
      selectedAdmin: null
    });
  },

  /**
   * 关闭分配弹窗
   */
  closeAssignModal() {
    this.setData({
      showAssignModal: false,
      currentOrderId: null,
      selectedAdmin: null
    });
  },

  /**
   * 选择管理员
   */
  onAdminSelect(e) {
    const index = e.detail.value;
    const selectedAdmin = this.data.adminList[index];

    this.setData({ selectedAdmin });
  },

  /**
   * 确认分配
   */
  async confirmAssign() {
    if (!this.data.selectedAdmin) {
      wx.showToast({ title: '请选择管理员', icon: 'none' });
      return;
    }

    try {
      const res = await wx.request({
        url: `${app.globalData.baseUrl}/api/admin/orders/${this.data.currentOrderId}/assign`,
        method: 'PUT',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          targetAdminId: this.data.selectedAdmin.id
        }
      });

      if (res.statusCode === 200 && res.data && res.data.success) {
        wx.showToast({ title: '分配成功', icon: 'success' });
        this.closeAssignModal();
        this.loadOrders(true);
        this.loadStats();
      } else {
        wx.showToast({ title: res.data?.error || '分配失败', icon: 'none' });
      }
    } catch (error) {
      console.error('分配订单失败:', error);
      wx.showToast({ title: '分配失败', icon: 'none' });
    }
  },

  /**
   * 跳转到进度反馈页面
   */
  navigateToProgressFeedback(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/progress-feedback/progress-feedback?orderId=${orderId}&from=order-assign`
    });
  },

  /**
   * 查看订单详情
   */
  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    const order = this.data.orders.find(o => o.id === orderId);

    if (order) {
      this.setData({
        showOrderDetail: true,
        currentOrder: order
      });
    }
  },

  /**
   * 关闭订单详情
   */
  closeOrderDetail() {
    this.setData({
      showOrderDetail: false,
      currentOrder: null
    });
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
  formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  }
});
