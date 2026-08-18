// pages/my-orders/my-orders.js
const app = getApp();
const { getMpApiBaseUrl } = require('../../utils/mpApi.js');

// 状态配置
const STATUS_CONFIG = {
  pending: { label: '待处理', color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
  quoted: { label: '已报价', color: '#436f95', bg: '#e8f1f8', icon: '💰' },
  confirmed: { label: '已确认', color: '#06b6d4', bg: '#cffafe', icon: '✅' },
  processing: { label: '维修中', color: '#3b82f6', bg: '#dbeafe', icon: '🔧' },
  completed: { label: '已完成', color: '#10b981', bg: '#d1fae5', icon: '✅' },
  cancelled: { label: '已取消', color: '#ef4444', bg: '#fee2e2', icon: '❌' },
  review: { label: '待评价', color: '#f97316', bg: '#ffedd5', icon: '⭐' },
  'quote_rejected': { label: '报价被拒', color: '#ef4444', bg: '#fee2e2', icon: '❌' },
  admin_created: { label: '待填写地址', color: '#0891b2', bg: '#cffafe', icon: '📝' }
};

// 服务类型映射
const SERVICE_TYPE_MAP = {
  repair: '维修',
  recycle: '回收',
  maintenance: '保养',
  detection: '检测'
};

Page({
  data: {
    adminInfo: null,
    token: null,

    orders: [],
    currentTab: 'pending',

    statusFilter: 'pending',

    statusCounts: {
      pending: 0,
      quoted: 0,
      confirmed: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
      review: 0
    },

    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true,

    loading: false,
    refreshing: false,

    searchKeyword: '',

    showOrderDetail: false,
    currentOrder: null,

    // 编辑订单弹窗
    showEditModal: false,
    editOrderData: null,
    editFormData: {
      customer_name: '',
      customer_phone: '',
      contact_name: '',
      contact_phone: '',
      province: '',
      city: '',
      district: '',
      detail_address: '',
      estimated_price: '',
      actual_price: '',
      problem_description: '',
      custom_description: '',
      priority: 2
    },

    // 退款弹窗
    showRefundModal: false,
    refundOrderData: null,
    refundReasons: [
      { value: 'not_want', label: '不想要了 / 拍错了' },
      { value: 'address_wrong', label: '地址填错了' },
      { value: 'service_bad', label: '服务态度不好' },
      { value: 'price_issue', label: '价格不合理' },
      { value: 'other', label: '其他原因' }
    ],
    refundFormData: {
      reason: '',
      description: ''
    },

    // 报价弹窗
    showQuoteModal: false,
    quoteOrderData: null,
    quoteFormData: {
      price: '',
      description: '',
      files: []
    },

    // 售后申请弹窗
    showAfterSalesModal: false,
    afterSalesOrderData: null,
    afterSalesTypes: [
      { value: 'repair', label: '维修' },
      { value: 'replace', label: '换货' },
      { value: 'return', label: '退货' },
      { value: 'other', label: '其他' }
    ],
    afterSalesFormData: {
      product_name: '',
      product_model: '',
      type: 'repair',
      description: '',
      contact_phone: '',
      images: []
    }
  },

  onLoad(options) {
    // 兼容普通用户token和管理员token
    const userInfo = wx.getStorageSync('userInfo') || wx.getStorageSync('admin_info');
    const token = wx.getStorageSync('token') || wx.getStorageSync('admin_token');

    if (!userInfo || (userInfo.role !== 'admin' && userInfo.role !== 'super_admin')) {
      wx.showToast({ title: '需要管理员权限', icon: 'none' });
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/home/home' });
      }, 1500);
      return;
    }

    this.setData({
      adminInfo: userInfo,
      token: token
    });

    if (options.status) {
      this.setData({ currentTab: options.status, statusFilter: options.status });
    }

    this.loadOrders(true);
  },

  onShow() {
    // 页面显示时刷新订单列表
    console.log('[onShow] 页面显示, 当前Tab:', this.data.currentTab);
    console.log('[onShow] 订单数量:', this.data.orders.length);
    
    // 总是刷新数据，确保显示最新状态
    this.loadOrders(true);
  },

  /**
   * 格式化时间为相对时间
   */
  formatTimeAgo(timeStr) {
    if (!timeStr) return '未知时间';
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return minutes + '分钟前';
    if (hours < 24) return hours + '小时前';
    if (days < 7) return days + '天前';
    return date.toLocaleDateString('zh-CN');
  },

  /**
   * 根据订单状态和进度计算可视化步骤信息（WXML不能调用函数）
   */
  _calcSteps(status, progress, orderType) {
    const isRecycle = orderType === 'recycle';
    const FINAL_STATUSES = ['completed', 'review', 'cancelled']
    let p = parseInt(progress);
    if (isNaN(p) || p <= 0 || FINAL_STATUSES.includes(status)) {
      const STATUS_PROGRESS = {
        pending: 0,
        quoted: 10,
        confirmed: 20,
        processing: 50,
        completed: 100,
        review: 100,
        cancelled: 0
      };
      p = STATUS_PROGRESS[status] || 0;
    }
    // 回收订单与维修订单使用不同的进度步骤
    const steps = isRecycle ? [
      { key: 'submit',  label: '提交订单', icon: '📋', threshold: 0   },
      { key: 'quote',   label: '回收估价', icon: '💰', threshold: 10  },
      { key: 'confirm', label: '用户确认', icon: '✅', threshold: 20  },
      { key: 'repair',  label: '回收中',   icon: '♻️', threshold: 50  },
      { key: 'done',    label: '回收完成', icon: '✅', threshold: 100 }
    ] : [
      { key: 'submit',  label: '提交订单', icon: '📋', threshold: 0   },
      { key: 'quote',   label: '提交报价', icon: '💰', threshold: 10  },
      { key: 'confirm', label: '用户确认', icon: '✅', threshold: 20  },
      { key: 'repair',  label: '维修中',   icon: '⚙️', threshold: 50  },
      { key: 'done',    label: '维修完成', icon: '✅', threshold: 100 }
    ];

    // 已取消订单：最后一步改为已取消
    if (status === 'cancelled') {
      steps[steps.length - 1] = { key: 'cancel', label: '已取消', icon: '❌', threshold: 100 }
    }

    // 判断当前活跃步骤索引（第一个 progress >= threshold 的步骤）
    let activeIdx = 0
    for (let i = 0; i < steps.length; i++) {
      if (p >= steps[i].threshold) activeIdx = i
    }

    // 生成每个步骤的状态
    const mapped = steps.map((s, i) => {
      let state = 'pending' // pending / active / done
      if (status === 'cancelled') {
        state = i <= activeIdx ? 'done' : 'pending'
      } else {
        if (i < activeIdx) state = 'done'
        else if (i === activeIdx) state = 'active'
      }
      return { ...s, state, index: i }
    })

    // 进度百分比文案
    const percentText = status === 'cancelled' ? '已取消' : status === 'completed' || status === 'review' ? '100%' : p + '%'

    return { steps: mapped, activeIdx, percentText }
  },

  /**
   * 处理订单数据，预计算显示字段（WXML不能调用函数）
   */
  processOrder(order) {
    const rawStatus = order.status || 'pending';
    const quoteStatus = order.quote_status || '';
    // 如果报价被拒绝，用 quote_rejected 作为显示状态
    const status = (rawStatus === 'pending' && quoteStatus === 'rejected') ? 'quote_rejected' : rawStatus;
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const orderType = order.order_type || 'repair';
    const isRecycle = orderType === 'recycle';
    const progressInfo = this._calcSteps(rawStatus, order.progress, orderType);

    console.log('[processOrder] 订单ID:', order.id, '订单状态:', status);

    return {
      ...order,
      status: status,
      isRecycle,
      orderType,
      orderTypeText: isRecycle ? '回收' : '维修',
      // 设备名称：优先使用 deviceTypeName，其次 device_model，其次 '未知设备'
      deviceName: order.deviceTypeName || order.device_name || order.device_model || '未知设备',
      // 订单号兼容
      orderNo: order.orderNo || order.order_id || order.order_no || '',
      // 用户名兼容
      userName: order.userName || order.user_name || '未知用户',
      userPhone: order.userPhone || order.user_phone || '暂无',
      realName: order.real_name || order.userRealName || '',
      // 时间
      createdAt: order.createdAt || order.created_at || '',
      assignedAt: order.assignedAt || order.assigned_at || '',
      completedAt: order.completedAt || order.completed_at || '',
      timeAgo: this.formatTimeAgo(order.createdAt || order.created_at),
      // 金额
      estimatedPrice: order.estimated_price || order.estimatedPrice || '',
      actualPrice: order.actual_price || order.actualPrice || '',
      quotePrice: order.quote_price || order.quotePrice || '',
      priceDisplay: order.estimated_price || order.estimatedPrice
        ? '¥' + (order.estimated_price || order.estimatedPrice)
        : (order.actual_price || order.actualPrice
          ? '¥' + (order.actual_price || order.actualPrice)
          : (order.quote_price || order.quotePrice
            ? '¥' + (order.quote_price || order.quotePrice)
            : '')),
      // 进度
      progress: parseInt(order.progress) || 0,
      // 是否需要反馈进度（订单处于维修中且有已审核通过的进度申请）
      needsProgressFeedback: order.status === 'processing' && (parseInt(order.approved_progress_count) > 0),
      // 优先级
      priority: order.priority || 'medium',
      // 服务类型
      serviceType: order.service_type || '',
      // 地址信息
      address_id: order.address_id || null,
      address: (order.contact_name || order.contact_phone) ? {
        contactName: order.contact_name || '',
        contactPhone: order.contact_phone || '',
        province: order.province || '',
        city: order.city || '',
        district: order.district || '',
        detail: order.detail_address || ''
      } : null,
      // 状态显示字段 - 回收订单显示"回收中"而非"维修中"
      statusLabel: isRecycle && config.label === '维修中' ? '回收中' : config.label,
      statusColor: config.color,
      statusBg: config.bg,
      statusIcon: isRecycle && config.icon === '🔧' ? '♻️' : config.icon,
      // 服务类型
      serviceTypeText: SERVICE_TYPE_MAP[order.service_type] || order.service_type || (isRecycle ? '回收' : '维修'),
      // 问题描述
      problem: order.problem_description || order.problem || order.custom_description || '暂无描述',
      // 可视化步骤进度
      progressSteps: progressInfo.steps,
      progressActiveIdx: progressInfo.activeIdx,
      progressPercentText: progressInfo.percentText
    };
  },

  /**
   * 加载订单列表
   */
  async loadOrders(refresh = false) {
    if (this.data.loading) return;

    if (refresh) {
      this.setData({ page: 1, hasMore: true, orders: [] });
    }

    if (!this.data.hasMore && !refresh) return;

    this.setData({ loading: true });

    try {
      const { page, pageSize, statusFilter, searchKeyword } = this.data;

      const res = await wx.request({
        url: `${getMpApiBaseUrl()}/admin/my-orders`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          page,
          pageSize,
          status: statusFilter === 'all' ? '' : statusFilter,
          keyword: searchKeyword,
          filter: 'mine'
        }
      });

      if (res.statusCode === 200 && res.data && res.data.success) {
        const rawOrders = res.data.data.orders || [];
        const total = res.data.data.total || 0;

        // 预处理每个订单的显示字段
        const processedOrders = rawOrders.map(order => this.processOrder(order));

        this.setData({
          orders: refresh ? processedOrders : [...this.data.orders, ...processedOrders],
          total,
          hasMore: processedOrders.length >= pageSize
        });

        this.calculateStatusCounts();

        // 获取订单统计（仅在刷新时获取）
        if (refresh) {
          this.loadOrderStats();
        }
      } else {
        console.warn('加载管理员订单失败:', res.statusCode, res.data);
        if (refresh && this.data.orders.length === 0) {
          wx.showToast({ title: '加载订单失败', icon: 'none' });
        }
      }
    } catch (error) {
      console.error('加载订单失败:', error);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 计算各状态订单数量（基于当前列表）
   */
  calculateStatusCounts() {
    const orders = this.data.orders;
    const statusCounts = {
      pending: 0,
      quoted: 0,
      confirmed: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
      review: 0
    };

    orders.forEach(order => {
      const s = order.status;
      if (statusCounts.hasOwnProperty(s)) {
        statusCounts[s]++;
      }
    });

    this.setData({ statusCounts });
  },

  /**
   * 从后端获取订单统计数据
   */
  async loadOrderStats() {
    try {
      const res = await wx.request({
        url: `${getMpApiBaseUrl()}/admin/dashboard-stats`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.statusCode === 200 && res.data && res.data.success) {
        const stats = res.data.data;
        // 更新统计数量（使用后端返回的准确数据）
        this.setData({
          statusCounts: {
            pending: stats.pending || 0,
            quoted: stats.quoted || 0,
            confirmed: stats.confirmed || 0,
            processing: stats.processing || 0,
            completed: stats.completed || 0,
            cancelled: stats.cancelled || 0,
            review: 0
          }
        });
      }
    } catch (error) {
      console.error('获取订单统计失败:', error);
      // 统计失败不影响主流程，使用本地计算的数据
    }
  },

  /**
   * 切换标签页
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.currentTab) return;
    this.setData({
      currentTab: tab,
      statusFilter: tab,
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

  onClearSearch() {
    this.setData({ searchKeyword: '', page: 1 });
    this.loadOrders(true);
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.loadOrders(true).then(() => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadOrders();
    }
  },

  /**
   * 查看订单详情 - 跳转到独立详情页面
   */
  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;

    // 校验 orderId 有效值
    if (orderId && orderId !== null && orderId !== undefined && !isNaN(Number(orderId))) {
      wx.navigateTo({
        url: `/pages/order-detail/order-detail?id=${orderId}`
      });
    } else {
      console.warn('[viewOrderDetail] orderId 无效:', orderId);
      wx.showToast({ title: '订单信息异常', icon: 'none' });
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
   * 接单
   */
  async acceptOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showLoading({ title: '处理中...' });

    try {
      const res = await wx.request({
        url: `${getMpApiBaseUrl()}/admin/orders/${orderId}/accept`,
        method: 'PUT',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.statusCode === 200 && res.data && res.data.success) {
        wx.showToast({ title: '接单成功', icon: 'success' });
        this.loadOrders(true);
        this.closeOrderDetail();
      } else {
        wx.showToast({ title: res.data?.error || '接单失败', icon: 'none' });
      }
    } catch (error) {
      console.error('接单失败:', error);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 从弹窗中接单
   */
  acceptOrderFromModal() {
    if (this.data.currentOrder) {
      this.acceptOrder({ currentTarget: { dataset: { id: this.data.currentOrder.id } } });
    }
  },

  /**
   * 开始处理
   */
  async startProcessing(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showLoading({ title: '处理中...' });

    try {
      const res = await wx.request({
        url: `${getMpApiBaseUrl()}/admin/orders/${orderId}/process`,
        method: 'PUT',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.statusCode === 200 && res.data && res.data.success) {
        wx.showToast({ title: '开始处理', icon: 'success' });
        this.loadOrders(true);
      } else {
        wx.showToast({ title: res.data?.error || '操作失败', icon: 'none' });
      }
    } catch (error) {
      console.error('开始处理失败:', error);
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 完成订单
   */
  completeOrder(e) {
    const orderId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认完成',
      content: '确定要完成这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          try {
            const response = await wx.request({
              url: `${getMpApiBaseUrl()}/admin/orders/${orderId}/complete`,
              method: 'PUT',
              header: {
                'Authorization': `Bearer ${this.data.token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.statusCode === 200 && response.data && response.data.success) {
              wx.showToast({ title: '订单已完成', icon: 'success' });
              this.loadOrders(true);
              this.closeOrderDetail();
            } else {
              wx.showToast({ title: response.data?.error || '操作失败', icon: 'none' });
            }
          } catch (error) {
            console.error('完成订单失败:', error);
            wx.showToast({ title: '网络异常', icon: 'none' });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  /**
   * 取消订单
   */
  cancelOrder(e) {
    const orderId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          try {
            const response = await wx.request({
              url: `${getMpApiBaseUrl()}/admin/orders/${orderId}/cancel`,
              method: 'PUT',
              header: {
                'Authorization': `Bearer ${this.data.token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.statusCode === 200 && response.data && response.data.success) {
              wx.showToast({ title: '订单已取消', icon: 'success' });
              this.loadOrders(true);
              this.closeOrderDetail();
            } else {
              wx.showToast({ title: response.data?.error || '操作失败', icon: 'none' });
            }
          } catch (error) {
            console.error('取消订单失败:', error);
            wx.showToast({ title: '网络异常', icon: 'none' });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  /**
   * 更新订单进度
   */
  updateOrderProgress(e) {
    const orderId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '更新进度',
      content: '请输入当前进度（0-100%）',
      editable: true,
      placeholderText: '60',
      success: async (res) => {
        if (res.confirm && res.content) {
          const progress = parseInt(res.content);
          if (isNaN(progress) || progress < 0 || progress > 100) {
            wx.showToast({ title: '请输入0-100的数字', icon: 'none' });
            return;
          }

          wx.showLoading({ title: '更新中...' });
          try {
            const response = await wx.request({
              url: `${getMpApiBaseUrl()}/admin/orders/${orderId}/progress`,
              method: 'PUT',
              header: {
                'Authorization': `Bearer ${this.data.token}`,
                'Content-Type': 'application/json'
              },
              data: { progress }
            });

            if (response.statusCode === 200 && response.data && response.data.success) {
              wx.showToast({ title: '进度已更新', icon: 'success' });
              this.loadOrders(true);
              this.closeOrderDetail();
            } else {
              wx.showToast({ title: response.data?.error || '更新失败', icon: 'none' });
            }
          } catch (error) {
            console.error('更新进度失败:', error);
            wx.showToast({ title: '网络异常', icon: 'none' });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  /**
   * 从弹窗更新进度
   */
  updateProgressFromModal() {
    if (this.data.currentOrder) {
      this.updateOrderProgress({ currentTarget: { dataset: { id: this.data.currentOrder.id } } });
    }
  },

  /**
   * 查看所有订单
   */
  goToAllOrders() {
    wx.navigateTo({
      url: '/pages/admin-orders/admin-orders?status=all'
    });
  },

  /**
   * 打开编辑弹窗
   */
  openEditModal(e) {
    const orderId = parseInt(e.currentTarget.dataset.id);
    console.log('[打开编辑弹窗] 订单ID:', orderId);
    console.log('[打开编辑弹窗] 当前订单列表:', this.data.orders);

    const order = this.data.orders.find(o => o.id === orderId);

    if (!order) {
      console.error('[打开编辑弹窗] 未找到订单, ID:', orderId);
      wx.showToast({ title: '订单未找到', icon: 'none' });
      return;
    }

    console.log('[打开编辑弹窗] 找到订单:', order);
    console.log('[打开编辑弹窗] 订单状态:', order.status);
    console.log('[打开编辑弹窗] 订单完整数据:', JSON.stringify(order));

    // 只允许编辑待处理状态的订单（含报价被拒绝的订单）
    if (order.status !== 'pending' && order.status !== 'quote_rejected') {
      console.warn('[打开编辑弹窗] 订单状态不允许编辑, 当前状态:', order.status);
      wx.showToast({
        title: '只能编辑待处理的订单',
        icon: 'none'
      });
      return;
    }

    // 初始化编辑表单数据
    const editFormData = {
      customer_name: order.real_name || order.userName || '',
      customer_phone: order.userPhone || '',
      contact_name: order.address?.contactName || '',
      contact_phone: order.address?.contactPhone || '',
      province: order.address?.province || '',
      city: order.address?.city || '',
      district: order.address?.district || '',
      detail_address: order.address?.detail || '',
      estimated_price: order.estimatedPrice ? String(order.estimatedPrice) : '',
      actual_price: order.actualPrice ? String(order.actualPrice) : '',
      problem_description: order.problem || order.problem_description || '',
      custom_description: order.custom_description || '',
      priority: order.priority || 2
    };

    console.log('[打开编辑弹窗] 初始化表单数据:', editFormData);

    this.setData({
      editOrderData: order,
      editFormData: editFormData,
      showEditModal: true
    });
  },

  /**
   * 关闭编辑弹窗
   */
  closeEditModal() {
    this.setData({
      showEditModal: false,
      editOrderData: null,
      editFormData: {
        customer_name: '',
        customer_phone: '',
        contact_name: '',
        contact_phone: '',
        province: '',
        city: '',
        district: '',
        detail_address: '',
        estimated_price: '',
        actual_price: '',
        problem_description: '',
        custom_description: '',
        priority: 2
      }
    });
  },

  /**
   * 编辑表单输入
   */
  onEditInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`editFormData.${field}`]: value
    });
  },

  /**
   * 选择优先级
   */
  selectPriority(e) {
    const priority = parseInt(e.currentTarget.dataset.value);
    this.setData({
      'editFormData.priority': priority
    });
  },

  /**
   * 保存订单编辑
   */
  async saveEditOrder() {
    const { editOrderData, editFormData } = this.data;

    // 验证
    if (!editFormData.customer_phone.trim()) {
      wx.showToast({ title: '请输入客户手机号', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(editFormData.customer_phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }

    // 如果有地址信息,验证地址
    if (editFormData.contact_name || editFormData.contact_phone ||
        editFormData.province || editFormData.city ||
        editFormData.district || editFormData.detail_address) {
      if (!editFormData.contact_name || !editFormData.contact_phone ||
          !editFormData.province || !editFormData.city ||
          !editFormData.district || !editFormData.detail_address) {
        wx.showToast({
          title: '请填写完整的地址信息',
          icon: 'none'
        });
        return;
      }
      if (!/^1[3-9]\d{9}$/.test(editFormData.contact_phone)) {
        wx.showToast({ title: '联系人手机号格式不正确', icon: 'none' });
        return;
      }
    }

    wx.showLoading({ title: '保存中...', mask: true });

    try {
      // 构建更新数据
      const updateData = {};

      if (editFormData.customer_name) {
        updateData.customer_name = editFormData.customer_name;
      }
      if (editFormData.customer_phone) {
        updateData.customer_phone = editFormData.customer_phone;
      }

      // 如果需要更新地址
      if (editFormData.contact_name || editFormData.contact_phone ||
          editFormData.province || editFormData.city ||
          editFormData.district || editFormData.detail_address) {
        updateData.address = {
          contact_name: editFormData.contact_name,
          contact_phone: editFormData.contact_phone,
          province: editFormData.province,
          city: editFormData.city,
          district: editFormData.district,
          detail_address: editFormData.detail_address
        };
        // 如果有现有地址ID,使用它
        if (editOrderData.address_id) {
          updateData.address_id = editOrderData.address_id;
        }
      }

      if (editFormData.problem_description) {
        updateData.problem_description = editFormData.problem_description;
      }
      if (editFormData.custom_description) {
        updateData.custom_description = editFormData.custom_description;
      }
      if (editFormData.estimated_price) {
        updateData.estimated_price = parseFloat(editFormData.estimated_price);
      }
      if (editFormData.actual_price) {
        updateData.actual_price = parseFloat(editFormData.actual_price);
      }
      if (editFormData.priority !== undefined) {
        updateData.priority = editFormData.priority;
      }

      const response = await wx.request({
        url: `${getMpApiBaseUrl()}/admin/orders/${editOrderData.id}/edit`,
        method: 'PUT',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        },
        data: updateData
      });

      if (response.statusCode === 200 && response.data && response.data.success) {
        wx.hideLoading();
        wx.showToast({
          title: '订单更新成功',
          icon: 'success'
        });
        this.closeEditModal();
        this.loadOrders(true);
      } else {
        wx.hideLoading();
        wx.showToast({
          title: response.data?.error || '订单更新失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('编辑订单失败:', error);
      wx.showToast({
        title: '网络错误,请重试',
        icon: 'none'
      });
    }
  },

  /**
   * 打开退款弹窗
   */
  openRefundModal(e) {
    const orderId = parseInt(e.currentTarget.dataset.id);
    const order = this.data.orders.find(o => o.id === orderId);

    if (!order) {
      wx.showToast({ title: '订单未找到', icon: 'none' });
      return;
    }

    if (order.status !== 'pending') {
      wx.showToast({ title: '只能对待处理订单申请退款', icon: 'none' });
      return;
    }

    this.setData({
      refundOrderData: {
        id: order.id,
        orderNo: order.orderNo,
        estimatedPrice: order.estimatedPrice || order.actualPrice || '0.0'
      },
      refundFormData: {
        reason: '',
        description: ''
      },
      showRefundModal: true
    });
  },

  /**
   * 关闭退款弹窗
   */
  closeRefundModal() {
    this.setData({
      showRefundModal: false,
      refundOrderData: null,
      refundFormData: {
        reason: '',
        description: ''
      }
    });
  },

  /**
   * 选择退款原因
   */
  selectRefundReason(e) {
    const reason = e.currentTarget.dataset.value;
    this.setData({
      'refundFormData.reason': reason
    });
  },

  /**
   * 退款描述输入
   */
  onRefundDescInput(e) {
    this.setData({
      'refundFormData.description': e.detail.value
    });
  },

  /**
   * 提交退款申请
   */
  async submitRefund() {
    const { refundOrderData, refundFormData } = this.data;

    // 校验退款原因
    if (!refundFormData.reason) {
      wx.showToast({ title: '请选择退款原因', icon: 'none' });
      return;
    }

    // 二次确认
    const confirmRes = await new Promise(resolve => {
      wx.showModal({
        title: '确认退款',
        content: `退款金额 ¥${refundOrderData.estimatedPrice}，退款后订单将取消且不可撤销，确认继续？`,
        confirmText: '确认退款',
        confirmColor: '#dc2626',
        success: resolve
      });
    });

    if (!confirmRes.confirm) return;

    wx.showLoading({ title: '提交退款中...', mask: true });

    try {
      const res = await wx.request({
        url: `${getMpApiBaseUrl()}/admin/orders/${refundOrderData.id}/refund`,
        method: 'PUT',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          reason: refundFormData.reason,
          description: refundFormData.description
        }
      });

      if (res.statusCode === 200 && res.data && res.data.success) {
        wx.hideLoading();
        wx.showToast({ title: '退款申请成功', icon: 'success' });
        this.closeRefundModal();
        this.loadOrders(true);
      } else {
        wx.hideLoading();
        wx.showToast({ title: res.data?.error || '退款申请失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('退款申请失败:', error);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    }
  },

  /**
   * 打开报价弹窗
   */
  openQuoteModal(e) {
    const orderId = parseInt(e.currentTarget.dataset.id);
    const order = this.data.orders.find(o => o.id === orderId);

    if (!order) {
      wx.showToast({ title: '订单未找到', icon: 'none' });
      return;
    }

    if (order.status !== 'pending' && order.status !== 'quote_rejected') {
      wx.showToast({ title: '只能对待处理订单报价', icon: 'none' });
      return;
    }

    this.setData({
      quoteOrderData: order,
      quoteFormData: {
        price: '',
        description: '',
        files: []
      },
      showQuoteModal: true
    });
  },

  /**
   * 关闭报价弹窗
   */
  closeQuoteModal() {
    this.setData({
      showQuoteModal: false,
      quoteOrderData: null,
      quoteFormData: {
        price: '',
        description: '',
        files: []
      }
    });
  },

  /**
   * 报价金额输入
   */
  onQuotePriceInput(e) {
    this.setData({
      'quoteFormData.price': e.detail.value
    });
  },

  /**
   * 报价说明输入
   */
  onQuoteDescInput(e) {
    this.setData({
      'quoteFormData.description': e.detail.value
    });
  },

  /**
   * 选择报价文件
   */
  async chooseQuoteFiles() {
    const { quoteFormData } = this.data;

    if (quoteFormData.files.length > 0) {
      wx.showActionSheet({
        itemList: ['删除已有文件', '选择新文件'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.setData({ 'quoteFormData.files': [] });
            this.chooseQuoteFiles();
          } else if (res.tapIndex === 1) {
            this.pickQuoteFiles();
          }
        }
      });
      return;
    }

    this.pickQuoteFiles();
  },

  /**
   * 选择并上传文件
   */
  async pickQuoteFiles() {
    try {
      wx.showLoading({ title: '上传中...' });
      const baseUrl = app.globalData.baseUrl;

      const chooseRes = await new Promise((resolve, reject) => {
        wx.chooseMessageFile({
          count: 5,
          type: 'file',
          success: resolve,
          fail: reject
        });
      });

      if (!chooseRes.tempFiles || chooseRes.tempFiles.length === 0) {
        wx.hideLoading();
        return;
      }

      const uploadPromises = chooseRes.tempFiles.map(file => {
        return new Promise((resolve, reject) => {
          wx.uploadFile({
            url: `${getMpApiBaseUrl()}/upload/quote`,
            filePath: file.path,
            name: 'files',
            header: {
              'Authorization': `Bearer ${this.data.token}`
            },
            success: (res) => {
              try {
                const data = JSON.parse(res.data);
                if (data.success && data.data && data.data.length > 0) {
                  resolve(data.data[0]);
                } else {
                  reject(new Error('上传失败'));
                }
              } catch (e) {
                reject(e);
              }
            },
            fail: reject
          });
        });
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      this.setData({
        'quoteFormData.files': [...this.data.quoteFormData.files, ...uploadedFiles]
      });

      wx.hideLoading();
      wx.showToast({ title: '上传成功', icon: 'success' });
    } catch (error) {
      wx.hideLoading();
      console.error('上传文件失败:', error);
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  /**
   * 删除报价文件
   */
  removeQuoteFile(e) {
    const index = e.currentTarget.dataset.index;
    const files = this.data.quoteFormData.files.filter((_, i) => i !== index);
    this.setData({ 'quoteFormData.files': files });
  },

  /**
   * 提交报价
   */
  async submitQuote() {
    const { quoteOrderData, quoteFormData } = this.data;

    if (!quoteFormData.price || quoteFormData.price <= 0) {
      wx.showToast({ title: '请输入有效的报价金额', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认提交报价',
      content: `报价金额：¥${quoteFormData.price}`,
      success: async (res) => {
        if (!res.confirm) return;

        wx.showLoading({ title: '提交中...', mask: true });

        try {
          const response = await wx.request({
            url: `${getMpApiBaseUrl()}/admin/orders/${quoteOrderData.id}/quote`,
            method: 'PUT',
            header: {
              'Authorization': `Bearer ${this.data.token}`,
              'Content-Type': 'application/json'
            },
            data: {
              quote_price: parseFloat(quoteFormData.price),
              quote_description: quoteFormData.description,
              quote_files: quoteFormData.files
            }
          });

          if (response.statusCode === 200 && response.data && response.data.success) {
            wx.hideLoading();
            wx.showToast({ title: '报价提交成功', icon: 'success' });
            this.closeQuoteModal();
            this.loadOrders(true);
          } else {
            wx.hideLoading();
            wx.showToast({ title: response.data?.error || '提交失败', icon: 'none' });
          }
        } catch (error) {
          wx.hideLoading();
          console.error('提交报价失败:', error);
          wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        }
      }
    });
  },

  /**
   * 上传进度反馈
   */
  uploadProgress(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/progress-feedback/progress-feedback?orderId=${orderId}`
    });
  },

  /**
   * 打开售后申请弹窗（仅已完成 / 待评价订单）
   */
  openAfterSalesModal(e) {
    const orderId = parseInt(e.currentTarget.dataset.id);
    const order = this.data.orders.find(o => o.id === orderId);

    if (!order) {
      wx.showToast({ title: '订单未找到', icon: 'none' });
      return;
    }

    if (order.status !== 'completed' && order.status !== 'review') {
      wx.showToast({ title: '仅已完成或待评价的订单可申请售后', icon: 'none' });
      return;
    }

    this.setData({
      afterSalesOrderData: {
        id: order.id,
        orderNo: order.orderNo,
        deviceName: order.deviceName,
        device_model: order.device_model || '',
        userPhone: order.userPhone
      },
      afterSalesFormData: {
        product_name: order.deviceName || '',
        product_model: order.device_model || '',
        type: 'repair',
        description: '',
        contact_phone: order.userPhone && order.userPhone !== '暂无' ? order.userPhone : '',
        images: []
      },
      showAfterSalesModal: true
    });
  },

  /**
   * 关闭售后申请弹窗
   */
  closeAfterSalesModal() {
    this.setData({
      showAfterSalesModal: false,
      afterSalesOrderData: null,
      afterSalesFormData: {
        product_name: '',
        product_model: '',
        type: 'repair',
        description: '',
        contact_phone: '',
        images: []
      }
    });
  },

  /**
   * 选择售后类型
   */
  selectAfterSalesType(e) {
    const type = e.currentTarget.dataset.value;
    this.setData({ 'afterSalesFormData.type': type });
  },

  /**
   * 售后表单输入
   */
  onAfterSalesInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`afterSalesFormData.${field}`]: e.detail.value });
  },

  /**
   * 选择售后图片
   */
  async chooseAfterSalesFiles() {
    const { afterSalesFormData } = this.data;
    if (afterSalesFormData.images.length >= 9) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' });
      return;
    }
    this.pickAfterSalesFiles();
  },

  async pickAfterSalesFiles() {
    try {
      wx.showLoading({ title: '上传中...' });
      const baseUrl = app.globalData.baseUrl;
      const chooseRes = await new Promise((resolve, reject) => {
        wx.chooseMedia({
          count: 9 - this.data.afterSalesFormData.images.length,
          mediaType: ['image'],
          sourceType: ['album', 'camera'],
          success: resolve,
          fail: reject
        });
      });

      if (!chooseRes.tempFiles || chooseRes.tempFiles.length === 0) {
        wx.hideLoading();
        return;
      }

      const uploadPromises = chooseRes.tempFiles.map(file => {
        return new Promise((resolve, reject) => {
          wx.uploadFile({
            url: `${getMpApiBaseUrl()}/upload/quote`,
            filePath: file.tempFilePath,
            name: 'files',
            header: { 'Authorization': `Bearer ${this.data.token}` },
            success: (res) => {
              try {
                const data = JSON.parse(res.data);
                if (data.success && data.data && data.data.length > 0) {
                  resolve(data.data[0]);
                } else {
                  reject(new Error('上传失败'));
                }
              } catch (e) { reject(e); }
            },
            fail: reject
          });
        });
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      this.setData({
        'afterSalesFormData.images': [...this.data.afterSalesFormData.images, ...uploadedFiles]
      });
      wx.hideLoading();
      wx.showToast({ title: '上传成功', icon: 'success' });
    } catch (error) {
      wx.hideLoading();
      console.error('上传售后图片失败:', error);
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  removeAfterSalesFile(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.afterSalesFormData.images.filter((_, i) => i !== index);
    this.setData({ 'afterSalesFormData.images': images });
  },

  /**
   * 提交售后申请
   */
  async submitAfterSales() {
    const { afterSalesOrderData, afterSalesFormData } = this.data;

    if (!afterSalesFormData.product_name.trim()) {
      wx.showToast({ title: '请填写售后产品', icon: 'none' });
      return;
    }
    if (!afterSalesFormData.description.trim()) {
      wx.showToast({ title: '请填写问题描述', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中...', mask: true });

    try {
      const res = await wx.request({
        url: `${getMpApiBaseUrl()}/after-sales/request`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          order_id: afterSalesOrderData.id,
          product_name: afterSalesFormData.product_name.trim(),
          product_model: afterSalesFormData.product_model,
          type: afterSalesFormData.type,
          description: afterSalesFormData.description.trim(),
          contact_phone: afterSalesFormData.contact_phone,
          images: afterSalesFormData.images
        }
      });

      if (res.statusCode === 200 && res.data && res.data.success) {
        wx.hideLoading();
        wx.showToast({ title: '售后申请已提交', icon: 'success' });
        this.closeAfterSalesModal();
      } else {
        wx.hideLoading();
        wx.showToast({ title: res.data?.error || '提交失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('提交售后申请失败:', error);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    }
  }
});
