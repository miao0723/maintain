// pages/admin-orders/admin-orders.js
const app = getApp();

// 状态配置
const STATUS_CONFIG = {
  pending: {
    label: '待报价',
    color: '#f59e0b',
    bg: '#fef3c7',
    icon: '⏳'
  },
  quoted: {
    label: '已报价',
    color: '#8b5cf6',
    bg: '#ede9fe',
    icon: '💰'
  },
  confirmed: {
    label: '已确认',
    color: '#06b6d4',
    bg: '#cffafe',
    icon: '✅'
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
    filteredOrders: [],
    currentTab: 'pending', // pending, processing, completed, cancelled

    // 筛选条件
    statusFilter: 'pending', // all, pending, processing, completed, cancelled - 初始值与currentTab一致

    // 各状态订单数量
    statusCounts: {
      pending: 0,
      quoted: 0,
      confirmed: 0,
      processing: 0,
      completed: 0,
      cancelled: 0
    },

    // 金额统计
    amountStats: {
      totalEstimated: 0,    // 全部订单预估金额合计
      totalActual: 0,        // 全部订单实际金额合计
      completedActual: 0,    // 已完成订单实际金额合计
      pendingEstimated: 0    // 待处理订单预估金额合计
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

    // 订单详情弹窗
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

    // 批量操作
    selectedOrderIds: [],
    showBatchActions: false,

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

    // 维修报告返回弹窗
    showRepairReportModal: false,
    repairReportOrderData: null,
    repairReportFormData: {
      files: []
    }
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
      this.setData({ currentTab: options.status, statusFilter: options.status });
    }

    this.loadOrders();
  },

  onShow() {
    console.log('[admin-orders] 页面显示, 当前Tab:', this.data.currentTab, '过滤器:', this.data.statusFilter);
    this.loadOrders();
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
      const { page, pageSize, statusFilter, searchKeyword, adminInfo } = this.data;

      console.log('[加载订单] 请求参数:', { page, pageSize, status: statusFilter, keyword: searchKeyword });

      // 调用API获取分配给当前管理员的订单
      const res = await wx.request({
        url: `${app.globalData.baseUrl}/api/admin/my-orders`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          page,
          pageSize,
          status: statusFilter === 'all' ? '' : statusFilter,
          keyword: searchKeyword
        }
      });

      console.log('[加载订单] 响应结果:', res.statusCode, res.data);

      if (res.statusCode === 200 && res.data && res.data.success) {
        const rawOrders = res.data.data.orders || [];
        const total = res.data.data.total || 0;

        console.log('[加载订单] 获取到订单数量:', rawOrders.length, '总计:', total);

        // 兼容后端两种字段命名：驼峰 estimatedPrice 或下划线 estimated_price
        const newOrders = rawOrders.map(order => {
          const ep = order.estimatedPrice || order.estimated_price || '';
          const ap = order.actualPrice || order.actual_price || '';
          // 格式化为1位小数
          const epFormatted = ep ? parseFloat(ep).toFixed(1) : '';
          const apFormatted = ap ? parseFloat(ap).toFixed(1) : '';
          return {
            ...order,
            // 是否需要反馈进度（维修中且有已审核通过的进度申请）
            needsProgressFeedback: order.status === 'processing' && (parseInt(order.approved_progress_count) > 0),
            // 字段名映射：后端字段 -> 前端期望的字段名
            orderNo: order.orderNo || order.order_id || '',
            problemDescription: order.problem_description || order.problem || '',
            customDescription: order.custom_description || '',
            deviceModel: order.device_model || order.deviceModel || '',
            deviceTypeName: order.deviceTypeName || order.device_type || '未知设备',
            brandName: order.brandName || '',
            deviceCondition: order.device_condition || order.deviceCondition || '',
            serviceType: order.service_type || order.serviceType || '',
            status: order.status || '', // 确保status字段正确传递
            quote_status: order.quote_status || '', // 报价状态
            repair_report_files: Array.isArray(order.repair_report_files) ? order.repair_report_files : [],
            images: order.images ? (typeof order.images === 'string' ? JSON.parse(order.images) : order.images) : [],
            address: order.address || '',
            estimatedPriceDisplay: epFormatted,
            actualPriceDisplay: apFormatted
          };
        });

        // 为每个订单添加调试日志
        newOrders.forEach(order => {
          console.log('[订单详情] ID:', order.id, '状态:', order.status, '预估:', order.estimatedPriceDisplay, '实际:', order.actualPriceDisplay);
        });

        this.setData({
          orders: refresh ? newOrders : [...this.data.orders, ...newOrders],
          total,
          hasMore: newOrders.length >= pageSize
        });

        // 计算各状态订单数量
        this.calculateStatusCounts();
      } else {
        console.error('[加载订单] API返回错误:', res.data);
        wx.showToast({ title: res.data?.error || '加载失败', icon: 'none' });
      }
    } catch (error) {
      console.error('[加载订单] 请求异常:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },



  /**
   * 计算各状态订单数量及金额统计
   */
  calculateStatusCounts() {
    const orders = this.data.orders;
    const statusCounts = {
      pending: 0,
      quoted: 0,
      confirmed: 0,
      processing: 0,
      completed: 0,
      cancelled: 0
    };
    let totalEstimated = 0;
    let totalActual = 0;
    let completedActual = 0;
    let pendingEstimated = 0;

    orders.forEach(order => {
      if (statusCounts.hasOwnProperty(order.status)) {
        statusCounts[order.status]++;
      }

      // 累加预估金额（后端已转为字符串如 "99.0"）
      const ep = parseFloat(order.estimatedPriceDisplay) || 0;
      const ap = parseFloat(order.actualPriceDisplay) || 0;

      totalEstimated += ep;
      totalActual += ap;

      if (order.status === 'completed') {
        completedActual += ap;
      }
      if (order.status === 'pending') {
        pendingEstimated += ep;
      }
    });

    this.setData({
      statusCounts,
      amountStats: {
        totalEstimated: totalEstimated.toFixed(1),
        totalActual: totalActual.toFixed(1),
        completedActual: completedActual.toFixed(1),
        pendingEstimated: pendingEstimated.toFixed(1)
      }
    });
  },

  /**
   * 切换标签页
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
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
   * 跳转到订单详情页面（独立页面）
   */
  navigateToOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    if (orderId && orderId !== null && orderId !== undefined && !isNaN(Number(orderId))) {
      wx.navigateTo({
        url: `/pages/order-detail/order-detail?id=${orderId}`
      });
    } else {
      console.warn('[navigateToOrderDetail] orderId 无效:', orderId);
      wx.showToast({ title: '订单信息异常', icon: 'none' });
    }
  },

  /**
   * 查看订单详情（弹窗）
   */
  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    const order = this.data.orders.find(o => String(o.id) === String(orderId));

    console.log('[查看详情] 查找订单 ID:', orderId, '找到:', order ? '是' : '否');

    if (order) {
      // 处理图片URL：补全baseUrl前缀
      const baseUrl = app.globalData.baseUrl || app.globalData.apiUrl || '';
      let images = order.images || [];
      if (typeof images === 'string') {
        try { images = JSON.parse(images); } catch (e) { images = []; }
      }
      if (!Array.isArray(images)) images = [];
      images = images.map(img => {
        if (!img) return img;
        return img.startsWith('http') ? img : baseUrl + img;
      });

      this.setData({
        showOrderDetail: true,
        currentOrder: { ...order, images }
      });
      console.log('[查看详情] 设置订单详情:', order.orderNo || order.order_id);
    } else {
      console.log('[查看详情] 订单列表 IDs:', this.data.orders.map(o => o.id));
      wx.showToast({ title: '无法获取订单详情', icon: 'none' });
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

    // 只允许编辑待处理状态的订单
    if (order.status !== 'pending') {
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
      detail_address: order.address?.detail || order.address?.detail_address || '',
      estimated_price: order.estimatedPrice ? String(order.estimatedPrice) : '',
      actual_price: order.actualPrice ? String(order.actualPrice) : '',
      problem_description: order.problemDescription || order.problem_description || '',
      custom_description: order.customDescription || order.custom_description || '',
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
      const { adminApi } = require('../../utils/api.js');

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

        console.log('[编辑订单] 需要更新地址');
        console.log('[编辑订单] serviceType:', editOrderData.serviceType);
        console.log('[编辑订单] address:', editOrderData.address);

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

      console.log('[编辑订单]', updateData);

      const res = await adminApi.editOrder(editOrderData.id, updateData);

      if (res.success) {
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
          title: res.error || '订单更新失败',
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
   * 预览图片
   */
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    const urls = e.currentTarget.dataset.urls;
    const index = e.currentTarget.dataset.index;

    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  /**
   * 接单
   */
  async acceptOrder(e) {
    const orderId = e.currentTarget.dataset.id;

    try {
      const res = await wx.request({
        url: `${app.globalData.baseUrl}/api/admin/orders/${orderId}/accept`,
        method: 'PUT',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.statusCode === 200 && res.data && res.data.success) {
        wx.showToast({ title: '接单成功', icon: 'success' });
        this.loadOrders(true);
      } else {
        wx.showToast({ title: res.data?.error || '接单失败', icon: 'none' });
      }
    } catch (error) {
      console.error('接单失败:', error);
      wx.showToast({ title: '接单失败', icon: 'none' });
    }
  },

  /**
   * 开始处理
   */
  async startProcessing(e) {
    const orderId = e.currentTarget.dataset.id;

    try {
      const res = await wx.request({
        url: `${app.globalData.baseUrl}/api/admin/orders/${orderId}/process`,
        method: 'PUT',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.data && res.data.success) {
        wx.showToast({ title: '开始处理', icon: 'success' });
        this.loadOrders(true);
      }
    } catch (error) {
      console.error('开始处理失败:', error);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  /**
   * 完成订单
   */
  async completeOrder(e) {
    const orderId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认完成',
      content: '确定要完成这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const res = await wx.request({
              url: `${app.globalData.baseUrl}/api/admin/orders/${orderId}/complete`,
              method: 'PUT',
              header: {
                'Authorization': `Bearer ${this.data.token}`,
                'Content-Type': 'application/json'
              }
            });

            if (res.data && res.data.success) {
              wx.showToast({ title: '订单已完成', icon: 'success' });
              this.loadOrders(true);
            }
          } catch (error) {
            console.error('完成订单失败:', error);
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  /**
   * 取消订单
   */
  async cancelOrder(e) {
    const orderId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const res = await wx.request({
              url: `${app.globalData.baseUrl}/api/admin/orders/${orderId}/cancel`,
              method: 'PUT',
              header: {
                'Authorization': `Bearer ${this.data.token}`,
                'Content-Type': 'application/json'
              }
            });

            if (res.data && res.data.success) {
              wx.showToast({ title: '订单已取消', icon: 'success' });
              this.loadOrders(true);
            }
          } catch (error) {
            console.error('取消订单失败:', error);
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  /**
   * 更新订单进度
   */
  async updateOrderProgress(e) {
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

          try {
            const response = await wx.request({
              url: `${app.globalData.baseUrl}/api/admin/orders/${orderId}/progress`,
              method: 'PUT',
              header: {
                'Authorization': `Bearer ${this.data.token}`,
                'Content-Type': 'application/json'
              },
              data: { progress }
            });

            if (response.data && response.data.success) {
              wx.showToast({ title: '进度已更新', icon: 'success' });
              this.loadOrders(true);
            }
          } catch (error) {
            console.error('更新进度失败:', error);
            wx.showToast({ title: '更新失败', icon: 'none' });
          }
        }
      }
    });
  },

  /**
   * 获取状态配置
   */
  getStatusConfig(status) {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
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
  },

  /**
   * 电话号码点击处理
   */
  makePhone(e) {
    const phone = e.currentTarget.dataset.phone;
    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone
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
        estimatedPrice: order.estimatedPriceDisplay || order.actualPriceDisplay || '0.0'
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

    if (!refundFormData.reason) {
      wx.showToast({ title: '请选择退款原因', icon: 'none' });
      return;
    }

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
      const { adminApi } = require('../../utils/api.js');
      const res = await adminApi.refundOrder(refundOrderData.id, {
        reason: refundFormData.reason,
        description: refundFormData.description
      });

      if (res.success) {
        wx.hideLoading();
        wx.showToast({ title: '退款申请成功', icon: 'success' });
        this.closeRefundModal();
        this.loadOrders(true);
      } else {
        wx.hideLoading();
        wx.showToast({ title: res.error || '退款申请失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('退款申请失败:', error);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    }
  },

  /**
   * 复制订单号
   */
  copyOrderNo(e) {
    const orderNo = e.currentTarget.dataset.orderno;
    wx.setClipboardData({
      data: orderNo,
      success: () => {
        wx.showToast({ title: '订单号已复制', icon: 'success' });
      }
    });
  },

  /**
   *   打开报价弹窗
   */
  openQuoteModal(e) {
    const orderId = e.currentTarget.dataset.id || this.data.currentOrder?.id;

    if (!orderId) {
      wx.showToast({ title: '订单信息异常', icon: 'none' });
      return;
    }

    const order = this.data.orders.find(o => o.id === orderId) || this.data.currentOrder;

    if (!order) {
      wx.showToast({ title: '订单未找到', icon: 'none' });
      return;
    }

    // 只允许 pending 或 processing 状态的订单报价
    if (order.status !== 'pending' && order.status !== 'processing') {
      wx.showToast({ title: '只能对待报价或维修中的订单报价', icon: 'none' });
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

  openRepairReportModal(e) {
    const orderId = e.currentTarget.dataset.id || this.data.currentOrder?.id;
    if (!orderId) {
      wx.showToast({ title: '订单信息异常', icon: 'none' });
      return;
    }

    const order = this.data.orders.find(o => o.id === orderId) || this.data.currentOrder;
    if (!order) {
      wx.showToast({ title: '订单未找到', icon: 'none' });
      return;
    }

    if (order.status !== 'completed') {
      wx.showToast({ title: '只有已完成订单可返回维修报告', icon: 'none' });
      return;
    }

    this.setData({
      repairReportOrderData: order,
      repairReportFormData: {
        files: Array.isArray(order.repair_report_files) ? order.repair_report_files : []
      },
      showRepairReportModal: true
    });
  },

  closeRepairReportModal() {
    this.setData({
      showRepairReportModal: false,
      repairReportOrderData: null,
      repairReportFormData: {
        files: []
      }
    });
  },

  async chooseRepairReportFiles() {
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
            url: `${baseUrl}/api/upload/repair`,
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
        'repairReportFormData.files': [...this.data.repairReportFormData.files, ...uploadedFiles]
      });
      wx.hideLoading();
      wx.showToast({ title: '上传成功', icon: 'success' });
    } catch (error) {
      wx.hideLoading();
      console.error('上传维修报告文件失败:', error);
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  removeRepairReportFile(e) {
    const index = e.currentTarget.dataset.index;
    const files = this.data.repairReportFormData.files.filter((_, i) => i !== index);
    this.setData({ 'repairReportFormData.files': files });
  },

  async submitRepairReport() {
    const { repairReportOrderData, repairReportFormData } = this.data;
    if (!repairReportOrderData?.id) {
      wx.showToast({ title: '订单信息异常', icon: 'none' });
      return;
    }
    if (!repairReportFormData.files.length) {
      wx.showToast({ title: '请先上传维修报告文件', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中...', mask: true });
    try {
      const res = await wx.request({
        url: `${app.globalData.baseUrl}/api/admin/orders/${repairReportOrderData.id}/repair-report`,
        method: 'PUT',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          repair_report_files: repairReportFormData.files
        }
      });

      wx.hideLoading();
      if (res.statusCode === 200 && res.data && res.data.success) {
        wx.showToast({ title: '已返回给用户', icon: 'success' });
        this.closeRepairReportModal();
        this.loadOrders(true);
      } else {
        wx.showToast({ title: res.data?.error || '提交失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('返回维修报告失败:', error);
      wx.showToast({ title: '提交失败', icon: 'none' });
    }
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

    // 已有文件，显示删除选项
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
   * 选择文件
   */
  async pickQuoteFiles() {
    try {
      wx.showLoading({ title: '上传中...' });

      const app = getApp();
      const baseUrl = app.globalData.baseUrl;

      // 先选择文件
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

      // 上传文件
      const uploadPromises = chooseRes.tempFiles.map(file => {
        return new Promise((resolve, reject) => {
          wx.uploadFile({
            url: `${baseUrl}/api/upload/quote`,
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

    // 验证
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
          const app = getApp();
          const response = await wx.request({
            url: `${app.globalData.baseUrl}/api/admin/orders/${quoteOrderData.id}/quote`,
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
   * 跳转到维修记录
   */
  navigateToRepairRecords(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/repair-records/repair-records?orderId=${orderId}`
    });
  },

  /**
   * 预览文件
   */
  previewFile(e) {
    const url = e.currentTarget.dataset.url;
    wx.downloadFile({
      url: app.globalData.baseUrl + url,
      success: (res) => {
        wx.openDocument({
          filePath: res.tempFilePath,
          fail: () => {
            wx.showToast({ title: '打开文件失败', icon: 'none' });
          }
        });
      }
    });
  },

  /**
   * 跳转到维修记录
   */
  navigateToRepairRecords(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/repair-records/repair-records?orderId=${orderId}`
    });
  },

  /**
   * 跳转到配送分配
   */
  navigateToDeliveryAssign(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/delivery-assign/delivery-assign?orderId=${orderId}`
    });
  },

  /**
   * 跳转到进度反馈页面
   */
  navigateToProgressFeedback(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/progress-feedback/progress-feedback?orderId=${orderId}&from=admin-orders`
    });
  },

  /**
   * 预览产品照片
   */
  previewImage(e) {
    const current = e.currentTarget.dataset.url;
    const urls = e.currentTarget.dataset.urls;
    if (current && urls) {
      wx.previewImage({ current, urls });
    }
  }
});
