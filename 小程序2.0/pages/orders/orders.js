// pages/orders/orders.js
const { orderApi, addressApi } = require('../../utils/api.js')
const { isProgressUnread, getUnreadProgressOrders, getProgressStamp, syncProgressUnreadState } = require('../../utils/progressUnread.js')

// 状态配置
const STATUS_CONFIG = {
  pending: { label: '待处理', color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
  quoted: { label: '待确认报价', color: '#8b5cf6', bg: '#ede9fe', icon: '💰' },
  confirmed: { label: '已确认报价', color: '#06b6d4', bg: '#cffafe', icon: '✅' },
  processing: { label: '维修中', color: '#3b82f6', bg: '#dbeafe', icon: '🔧' },
  completed: { label: '已完成', color: '#10b981', bg: '#d1fae5', icon: '✅' },
  cancelled: { label: '已取消', color: '#ef4444', bg: '#fee2e2', icon: '❌' },
  review: { label: '待评价', color: '#f97316', bg: '#ffedd5', icon: '⭐' },
  admin_created: { label: '待填写地址', color: '#0891b2', bg: '#cffafe', icon: '📝' }
};

Page({
  data: {
    currentStatus: 'all',
    unreadType: '',
    focusLatestFeedback: false,
    orders: [],
    filteredOrders: [],
    isLoading: false,
    showOrderDetailModal: false,
    modalOrderDetail: null,
    modalLoading: false,
    savingEdit: false,
    refundSubmitting: false,
    quoteSubmitting: false,
    paymentSubmitting: false,
    cancelSubmitting: false,

    // 编辑弹窗
    showEditModal: false,
    editOrderId: null,
    editRegionValue: [],
    editFormData: {
      contactName: '',
      contactPhone: '',
      province: '',
      city: '',
      district: '',
      detailAddress: '',
      problemDescription: '',
      customDescription: '',
      _selectedAddrId: null
    },

    // 地址选择弹窗
    showAddressPickerModal: false,
    addressList: [],
    addressListLoading: false,

    // 退款弹窗（两步式）
    showRefundModal: false,
    refundStep: 1,
    refundOrderData: null,
    refundReasonLabel: '',
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

    // 拒绝报价弹窗
    showRejectQuoteModal: false,
    rejectQuoteOrderData: null,
    rejectQuoteFormData: {
      reason: ''
    },

    // 申请售后弹窗
    showAfterSalesModal: false,
    afterSalesOrder: null,
    afterSalesTypes: [
      { value: 'repair', label: '维修' },
      { value: 'replace', label: '换货' },
      { value: 'return', label: '退货' },
      { value: 'other', label: '其他' }
    ],
    afterSalesForm: {
      product_name: '',
      product_model: '',
      type: 'repair',
      description: '',
      contact_phone: '',
      images: []
    },
    afterSalesSubmitting: false
  },

  onLoad(options) {
    const nextData = {};
    if (options.status) {
      nextData.currentStatus = options.status;
    }
    if (options.unreadType) {
      nextData.unreadType = options.unreadType;
    }
    if (options.focusLatestFeedback === 'true') {
      nextData.focusLatestFeedback = true;
    }

    if (Object.keys(nextData).length > 0) {
      this.setData(nextData);
    }

    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
    this.loadMyAfterSales()
  },

  onHide() {
    // 离开页面时刷新 tabbar 角标
    this._refreshTabBarBadge();
  },

  onUnload() {
    this._refreshTabBarBadge();
  },

  /**
   * 刷新 tabbar 角标
   */
  _refreshTabBarBadge() {
    const pages = getCurrentPages();
    // 获取 tabbar 组件并刷新
    try {
      const tabBar = this.getTabBar && this.getTabBar();
      if (tabBar && tabBar.refreshBadge) {
        tabBar.refreshBadge();
      }
    } catch (e) { }
  },

  /**
   * 标记订单进度为已读
   */
  markOrderProgressRead(orderId) {
    const token = wx.getStorageSync('token');
    const baseUrl = getApp().globalData.baseUrl || getApp().globalData.apiUrl;
    if (!token || !orderId) return;

    wx.request({
      url: `${baseUrl}/api/orders/${orderId}/progress-read`,
      method: 'PUT',
      header: { 'Authorization': `Bearer ${token}` },
      success: () => {
        const targetOrder = this.data.orders.find(o => o.id === orderId);
        const wasUnread = !!(targetOrder && Number(targetOrder.progressUnread || targetOrder.progress_unread) === 1);
        const orders = this.data.orders.map(o => {
          if (o.id === orderId) {
            return { ...o, progressUnread: 0, progress_unread: 0 };
          }
          return o;
        });
        this.setData({
          orders,
          filteredOrders: this.applyUnreadFilter(orders)
        });
        syncProgressUnreadState(orderId, getProgressStamp(targetOrder || {}), { wasUnread });
        // 刷新tabbar角标
        this._refreshTabBarBadge();
      }
    });
  },

  /**
   * 标记订单报价为已读
   */
  markOrderQuoteRead(orderId) {
    const token = wx.getStorageSync('token');
    const baseUrl = getApp().globalData.baseUrl || getApp().globalData.apiUrl;
    if (!token || !orderId) return;

    wx.request({
      url: `${baseUrl}/api/orders/${orderId}/quote-read`,
      method: 'PUT',
      header: { 'Authorization': `Bearer ${token}` },
      success: () => {
        const orders = this.data.orders.map(o => {
          if (o.id === orderId) return { ...o, quote_unread: 0, quoteUnread: 0 };
          return o;
        });
        this.setData({
          orders,
          filteredOrders: this.applyUnreadFilter(orders)
        });
        this._refreshTabBarBadge();
      }
    });
  },

  applyUnreadFilter(orders) {
    const unreadType = this.data.unreadType;
    if (unreadType === 'progress') {
      const unreadOrders = getUnreadProgressOrders(orders);
      if (this.data.currentStatus === 'all') {
        return unreadOrders;
      }
      return unreadOrders.filter(order => order.status === this.data.currentStatus);
    }
    if (unreadType === 'quote') {
      return orders.filter(order => Number(order.quoteUnread || order.quote_unread) === 1);
    }
    return orders;
  },

  /**
   * 根据订单状态和进度计算可视化步骤信息
   * 当数据库 progress 为空/0 时，根据 status 自动推导进度
   */
  _calcSteps(status, progress, orderType) {
    const isRecycle = orderType === 'recycle';
    // 状态优先：如果数据库 progress 为空/0，或订单已是最终状态，按状态自动推导
    // 注意：有些订单 progress 字段在状态流转后没更新（例如 confirmed→completed 但 progress 仍为 20）
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
      { key: 'accept',  label: '确认报价', icon: '✅', threshold: 20  },
      { key: 'repair',  label: '回收中',   icon: '♻️', threshold: 50  },
      { key: 'done',    label: '回收完成', icon: '✅', threshold: 100 }
    ] : [
      { key: 'submit',  label: '提交订单', icon: '📋', threshold: 0   },
      { key: 'quote',   label: '等待报价', icon: '💰', threshold: 10  },
      { key: 'accept',  label: '确认报价', icon: '✅', threshold: 20  },
      { key: 'repair',  label: '维修中',   icon: '⚙️', threshold: 50  },
      { key: 'done',    label: '维修完成', icon: '✅', threshold: 100 }
    ];

    // 已取消订单
    if (status === 'cancelled') {
      steps[steps.length - 1] = { key: 'cancel', label: '已取消', icon: '❌', threshold: 100 };
    }

    // 判断当前活跃步骤索引
    let activeIdx = 0;
    for (let i = 0; i < steps.length; i++) {
      if (p >= steps[i].threshold) activeIdx = i;
    }

    // 生成每个步骤的状态
    const mapped = steps.map((s, i) => {
      let state = 'pending';
      if (status === 'cancelled') {
        state = i <= activeIdx ? 'done' : 'pending';
      } else {
        if (i < activeIdx) state = 'done';
        else if (i === activeIdx) state = 'active';
      }
      return { ...s, state, index: i };
    });

    // 进度百分比文案
    const percentText = status === 'cancelled' ? '已取消' : status === 'completed' || status === 'review' ? '100%' : p + '%';

    // 实际进度百分比（用于进度条宽度）
    const percent = status === 'cancelled' ? 0 : status === 'completed' || status === 'review' ? 100 : p;

    return { steps: mapped, activeIdx, percentText, percent };
  },

  /**
   * 加载订单
   */
  loadOrders() {
    if (this.data.isLoading) return;

    this.setData({ isLoading: true });

    wx.showLoading({ title: '加载中...' });

    const params = {};
    if (this.data.currentStatus !== 'all') {
      params.status = this.data.currentStatus;
    }

    const loadRequest = this.data.unreadType === 'progress'
      ? orderApi.getProgressUnreadList()
      : orderApi.getOrderList(params);

    loadRequest
      .then(response => {
        let ordersArray = [];
        if (this.data.unreadType === 'progress' && response && response.success) {
          ordersArray = Array.isArray(response.data) ? response.data : [];
        } else if (response && response.success && response.data) {
          ordersArray = response.data.orders || [];
        } else if (Array.isArray(response)) {
          ordersArray = response;
        }

        const enhancedOrders = ordersArray.map(order => {
          const orderType = order.order_type || order.type || 'repair';

          let deviceType = 1;
          if (typeof order.device_type === 'number') {
            deviceType = order.device_type;
          } else if (typeof order.device_type === 'string') {
            const deviceTypeMap = {
              'phone': 1, 'computer': 2, 'tablet': 3, 'watch': 4
            };
            deviceType = deviceTypeMap[order.device_type] || 1;
          }

          const rawEp = order.estimated_price || order.estimatedPrice || '';
          const rawAp = order.actual_price || order.actualPrice || '';
          const rawQp = order.quote_price || order.quotePrice || '';
          const price = rawAp || rawQp || rawEp;

          const status = order.status || 'pending';
          const isRecycle = orderType === 'recycle';
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
          const progressInfo = this._calcSteps(status, order.progress, orderType);

          const effectiveProgressUnread = isProgressUnread(order) ? 1 : 0;

          // 回收订单：调整状态标签和颜色
          let statusLabel = config.label;
          let statusColor = config.color;
          if (isRecycle) {
            if (config.label === '维修中') statusLabel = '回收中';
            if (status === 'processing') statusColor = '#059669';
          }

          return {
            ...order,
            id: order.id,
            order_id: order.order_id || order.order_no || '',
            orderId: this.generateOrderId(order.id || order.order_id),
            createTime: this.formatTime(order.created_at || order.createTime),
            icon: this.getDeviceIcon({ deviceType: deviceType }),
            deviceName: this.getDeviceName({
              type: orderType,
              deviceType: deviceType,
              brand: order.brand_name || order.brandName,
              model: order.device_model || order.deviceModel
            }),
            problem: this.getProblemName({
              type: orderType,
              problem: order.problem_description || order.problemDescription,
              condition: order.device_condition || order.deviceCondition
            }),
            status: status,
            orderType: orderType,
            isRecycle: isRecycle,
            deviceType: deviceType,
            price: price ? parseFloat(price).toFixed(1) : '',
            statusLabel: statusLabel,
            statusColor: statusColor,
            progressSteps: progressInfo.steps,
            progressPercentText: progressInfo.percentText,
            progressPercent: progressInfo.percent,
            progressUnread: effectiveProgressUnread,
            quoteUnread: Number(order.quote_unread || order.quoteUnread || 0),
            paymentStatus: order.payment_status || 'unpaid',
            payAmount: order.pay_amount || '',
            repairReportFiles: Array.isArray(order.repair_report_files) ? order.repair_report_files : []
          }
        });

        this.setData({
          orders: enhancedOrders,
          filteredOrders: this.applyUnreadFilter(enhancedOrders)
        });
      })
      .catch(err => {
        console.error('加载订单失败', err);
        const orders = wx.getStorageSync('orders') || [];
        const enhancedOrders = orders.map(order => {
          const status = order.status || 'pending';
          const orderType = order.order_type || order.type || 'repair';
          const isRecycle = orderType === 'recycle';
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
          const progressInfo = this._calcSteps(status, order.progress || 0, orderType);
          let statusLabel = config.label;
          if (isRecycle && config.label === '维修中') statusLabel = '回收中';
          return {
            ...order,
            orderType: orderType,
            isRecycle: isRecycle,
            orderId: this.generateOrderId(order.id),
            createTime: this.formatTime(order.createTime),
            icon: this.getDeviceIcon(order),
            deviceName: this.getDeviceName(order),
            problem: this.getProblemName(order),
            progressSteps: progressInfo.steps,
            progressPercentText: progressInfo.percentText,
            progressPercent: progressInfo.percent,
            statusColor: config.color,
            statusLabel: statusLabel
          }
        });
        this.setData({
          orders: enhancedOrders,
          filteredOrders: this.applyUnreadFilter(enhancedOrders)
        });
      })
      .finally(() => {
        this.setData({ isLoading: false });
        wx.hideLoading();
      });
  },

  /**
   * 生成订单号
   */
  generateOrderId(id) {
    return `WX${id}`
  },

  /**
   * 格式化时间
   */
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}-${day} ${hour}:${minute}`
  },

  /**
   * 获取设备图标
   */
  getDeviceIcon(order) {
    const icons = {
      1: '📱', 2: '💻', 3: '📟', 4: '⌚'
    }
    return icons[order.deviceType] || '🔧'
  },

  /**
   * 获取设备名称
   */
  getDeviceName(order) {
    if (order.type === 'recycle') {
      const brand = this.getBrandName(order.brand)
      return order.model ? `${brand} ${order.model}` : brand
    }

    const deviceNames = {
      1: '手机维修', 2: '电脑维修', 3: '平板维修', 4: '手表维修'
    }

    const baseName = deviceNames[order.deviceType] || '设备维修';

    if (order.brand && order.model) {
      return `${baseName} - ${order.brand} ${order.model}`;
    } else if (order.brand) {
      return `${baseName} - ${order.brand}`;
    } else if (order.model) {
      return `${baseName} - ${order.model}`;
    }

    return baseName;
  },

  /**
   * 获取品牌名称
   */
  getBrandName(brandId) {
    const brands = {
      1: '苹果', 2: '华为', 3: '小米', 4: 'OPPO',
      5: 'vivo', 6: '三星', 7: '联想', 8: '其他'
    }
    return brands[brandId] || '设备'
  },

  /**
   * 获取问题名称
   */
  getProblemName(order) {
    if (order.type === 'recycle') {
      return this.getConditionName(order.condition)
    }

    if (order.problem && typeof order.problem === 'string' && order.problem.length > 0) {
      return order.problem;
    }

    const problems = {
      1: '电池问题', 2: '屏幕问题', 3: '声音故障',
      4: '摄像头故障', 5: '无法充电', 6: '主板故障'
    }
    return problems[order.problem] || '设备故障'
  },

  /**
   * 获取设备状态名称
   */
  getConditionName(condition) {
    const conditions = {
      good: '完好', normal: '良好', fair: '一般', poor: '破损'
    }
    return conditions[condition] || '未知'
  },

  /**
   * 获取状态文本
   */
  getStatusText(status) {
    const statusMap = {
      pending: '待处理', processing: '处理中', completed: '已完成',
      review: '待评价', cancelled: '已取消'
    }
    return statusMap[status] || '未知'
  },

  /**
   * 获取状态样式类
   */
  getStatusClass(status) {
    return status
  },

  /**
   * 切换状态
   */
  switchStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      currentStatus: status
    }, () => {
      this.loadOrders()
    })
  },

  /**
   * 查看订单详情（弹窗模式）
   */
  viewOrderDetail(e) {
    const order = e.currentTarget.dataset.order;

    if (!order) {
      wx.showToast({ title: '订单信息错误', icon: 'none' });
      return;
    }

    const orderId = order.id;

    if (!orderId) {
      wx.showToast({ title: '订单ID无效', icon: 'none' });
      return;
    }

    this.setData({ modalLoading: true, showOrderDetailModal: true });

    orderApi.getOrderDetail(orderId)
      .then(response => {
        const rawData = response && response.success ? response.data : response;
        const orderDetail = rawData && rawData.order ? rawData.order : rawData;
        
        const formattedDetail = this.formatOrderDetailForModal(orderDetail);
        
        this.setData({ 
          modalOrderDetail: formattedDetail,
          modalLoading: false 
        });

        const hasProgressUnread = isProgressUnread({
          ...orderDetail,
          progressUnread: order.progressUnread
        });
        const hasQuoteUnread = Number(orderDetail.quote_unread) === 1 || Number(order.quoteUnread || order.quote_unread) === 1;

        if (this.data.unreadType === 'progress' && hasProgressUnread) {
          this.markOrderProgressRead(orderId);
          return;
        }
        if (this.data.unreadType === 'quote' && hasQuoteUnread) {
          this.markOrderQuoteRead(orderId);
          return;
        }
        if (hasProgressUnread) {
          this.markOrderProgressRead(orderId);
        }
        if (hasQuoteUnread) {
          this.markOrderQuoteRead(orderId);
        }
      })
      .catch(err => {
        console.error('加载订单详情失败', err);
        this.setData({ 
          modalLoading: false,
          modalOrderDetail: null 
        });
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  /**
   * 关闭订单详情弹窗
   */
  closeOrderDetailModal() {
    this.setData({
      showOrderDetailModal: false,
      modalOrderDetail: null,
      modalLoading: false
    });
  },

  /**
   * 跳转到完整详情页面
   */
  goToFullDetail() {
    if (!this.data.modalOrderDetail) return;
    
    const orderId = this.data.modalOrderDetail.id || this.data.modalOrderDetail.order_id;
    
    this.closeOrderDetailModal();
    
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${orderId}`
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation(e) {},

  /**
   * 格式化订单详情用于弹窗显示
   */
  formatOrderDetailForModal(orderDetail) {
    if (!orderDetail) return null;
    
    let deviceType = 1;
    if (typeof orderDetail.device_type === 'number') {
      deviceType = orderDetail.device_type;
    } else if (typeof orderDetail.device_type === 'string') {
      const deviceTypeMap = {
        'phone': 1, 'computer': 2, 'tablet': 3, 'watch': 4,
        '手机': 1, '电脑': 2, '平板': 3, '手表': 4
      };
      deviceType = deviceTypeMap[orderDetail.device_type.toLowerCase()] || 1;
    }
    
    const icons = { 1: '📱', 2: '💻', 3: '📟', 4: '⌚' };
    const deviceIcon = icons[deviceType] || '🔧';
    
    const statusMap = {
      'pending': '待处理', 'processing': '维修中', 'completed': '已完成',
      'review': '待评价', 'cancelled': '已取消'
    };
    
    const orderType = orderDetail.order_type || orderDetail.type || 'repair';
    const orderTypeText = orderType === 'repair' ? '维修' : '回收';
    
    let deviceName = '';
    const brandName = orderDetail.brand_name || orderDetail.brandName || '';
    const deviceModel = orderDetail.device_model || orderDetail.deviceModel || '';
    if (orderType === 'recycle') {
      const brand = this.getBrandName(brandName || orderDetail.brand);
      deviceName = deviceModel ? `${brand} ${deviceModel}` : brand;
    } else {
      const deviceNames = { 1: '手机维修', 2: '电脑维修', 3: '平板维修', 4: '手表维修' };
      deviceName = deviceNames[deviceType] || '设备维修';
      if (brandName && deviceModel) {
        deviceName = `${deviceName} - ${brandName} ${deviceModel}`;
      } else if (brandName) {
        deviceName = `${deviceName} - ${brandName}`;
      } else if (deviceModel) {
        deviceName = `${deviceName} - ${deviceModel}`;
      }
    }
    
    let problemText = '';
    if (orderType === 'recycle') {
      const conditions = { good: '完好', normal: '良好', fair: '一般', poor: '破损' };
      problemText = conditions[orderDetail.device_condition || orderDetail.deviceCondition] || '未知';
    } else {
      problemText = orderDetail.problem_description || orderDetail.problemDescription || orderDetail.fault_desc || '设备故障';
    }
    
    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      return `${month}-${day} ${hour}:${minute}`;
    };

    const rawEp = orderDetail.estimated_price || orderDetail.estimatedPrice || '';
    const rawAp = orderDetail.actual_price || orderDetail.actualPrice || '';
    const rawQp = orderDetail.quote_price || orderDetail.quotePrice || '';
    const price = rawAp || rawQp || rawEp;

    const serviceTypeMap = { shop: '到店维修', home: '上门服务' };
    const serviceTypeText = serviceTypeMap[orderDetail.service_type || orderDetail.serviceType] || orderDetail.serviceType || '';

    const status = orderDetail.status || 'pending';
    const isRecycle = (orderDetail.order_type || orderDetail.type || 'repair') === 'recycle';
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const progressInfo = this._calcSteps(status, orderDetail.progress, isRecycle ? 'recycle' : 'repair');

    return {
      ...orderDetail,
      id: orderDetail.id || orderDetail.order_id,
      order_id: orderDetail.order_id || orderDetail.order_no || '',
      orderId: orderDetail.order_id || orderDetail.order_no || `WX${orderDetail.id}`,
      orderType: orderTypeText,
      isRecycle: isRecycle,
      deviceType: deviceType,
      deviceIcon: deviceIcon,
      deviceName: deviceName,
      problemText: problemText,
      statusText: statusMap[orderDetail.status] || orderDetail.status,
      statusColor: config.color,
      createTime: formatTime(orderDetail.created_at || orderDetail.createTime),
      price: price ? parseFloat(price).toFixed(1) : '',
      estimatedPrice: rawEp ? parseFloat(rawEp).toFixed(1) : '',
      actualPrice: rawAp ? parseFloat(rawAp).toFixed(1) : '',
      problemDescription: orderDetail.problem_description || orderDetail.problemDescription || '',
      customDescription: orderDetail.custom_description || orderDetail.customDescription || orderDetail.remark || '',
      deviceModel: deviceModel || '未知型号',
      deviceCondition: orderDetail.device_condition || orderDetail.deviceCondition || '未知状态',
      serviceType: serviceTypeText,
      completedAt: orderDetail.completed_at ? formatTime(orderDetail.completed_at) : '',
      updatedAt: orderDetail.updated_at && orderDetail.updated_at !== orderDetail.created_at ? 
        formatTime(orderDetail.updated_at) : '',
      progressSteps: progressInfo.steps,
      progressPercentText: progressInfo.percentText,
      progressPercent: progressInfo.percent
    };
  },

  // ========== 编辑订单功能 ==========

  /**
   * 打开编辑弹窗
   */
  openEditModal(e) {
    const order = e.currentTarget.dataset.order;

    if (!order) {
      wx.showToast({ title: '订单信息错误', icon: 'none' });
      return;
    }

    if (order.status !== 'pending') {
      wx.showToast({ title: '只能编辑待处理的订单', icon: 'none' });
      return;
    }

    // 先加载完整订单详情（含地址信息）
    wx.showLoading({ title: '加载中...' });
    orderApi.getOrderDetail(order.id)
      .then(response => {
        wx.hideLoading();
        const rawData = response && response.success ? response.data : response;
        const detail = rawData && rawData.order ? rawData.order : rawData;

        const regionValue = [];
        if (detail.province) regionValue.push(detail.province);
        if (detail.city) regionValue.push(detail.city);
        if (detail.district) regionValue.push(detail.district);

        this.setData({
          editOrderId: order.id,
          editRegionValue: regionValue,
          editFormData: {
            contactName: detail.contact_name || '',
            contactPhone: detail.contact_phone || '',
            province: detail.province || '',
            city: detail.city || '',
            district: detail.district || '',
            detailAddress: detail.detail_address || '',
            problemDescription: detail.problem_description || '',
            customDescription: detail.custom_description || '',
            _selectedAddrId: null
          },
          showEditModal: true
        });
      })
      .catch(err => {
        wx.hideLoading();
        console.error('加载订单详情失败', err);
        // 回退：直接用列表中的数据
        this.setData({
          editOrderId: order.id,
          editRegionValue: [],
          editFormData: {
            contactName: '',
            contactPhone: '',
            province: '',
            city: '',
            district: '',
            detailAddress: '',
            problemDescription: order.problem || '',
            customDescription: '',
            _selectedAddrId: null
          },
          showEditModal: true
        });
      });
  },

  /**
   * 关闭编辑弹窗
   */
  closeEditModal() {
    this.setData({
      showEditModal: false,
      editOrderId: null,
      editRegionValue: [],
      editFormData: {
        contactName: '',
        contactPhone: '',
        province: '',
        city: '',
        district: '',
        detailAddress: '',
        problemDescription: '',
        customDescription: '',
        _selectedAddrId: null
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
   * 编辑弹窗 - 地区选择器触发
   */
  onEditRegionChange() {
    // 由隐藏的 picker 触发，这里不需要额外逻辑
  },

  /**
   * 编辑弹窗 - 地区选择确认
   */
  onEditRegionConfirm(e) {
    const region = e.detail.value;
    this.setData({
      editRegionValue: region,
      'editFormData.province': region[0],
      'editFormData.city': region[1],
      'editFormData.district': region[2]
    });
  },

  /**
   * 显示地址选择弹窗
   */
  showAddressPicker() {
    this.setData({
      showAddressPickerModal: true,
      addressListLoading: true,
      'editFormData._selectedAddrId': null
    });

    addressApi.getAddressList()
      .then(response => {
        const list = Array.isArray(response) ? response : (response && response.data ? response.data : []);
        // 格式化地址数据
        const formatted = list.map(addr => ({
          id: addr.id || addr.address_id,
          contact_name: addr.contact_name || addr.contactName || '',
          contact_phone: addr.contact_phone || addr.contactPhone || '',
          province: addr.province || '',
          city: addr.city || '',
          district: addr.district || '',
          detail_address: addr.detail_address || addr.detail || '',
          is_default: addr.is_default || addr.isDefault || false
        }));
        this.setData({ addressList: formatted, addressListLoading: false });
      })
      .catch(err => {
        console.error('加载地址列表失败', err);
        // 回退到本地存储
        const addresses = wx.getStorageSync('addresses') || [];
        this.setData({ addressList: addresses, addressListLoading: false });
      });
  },

  /**
   * 选择地址
   */
  onSelectAddress(e) {
    const addr = e.currentTarget.dataset.addr;
    if (!addr) return;
    this.setData({
      'editFormData._selectedAddrId': addr.id
    });
  },

  /**
   * 确认选择地址
   */
  confirmAddressSelect() {
    const selectedId = this.data.editFormData._selectedAddrId;
    if (!selectedId) {
      wx.showToast({ title: '请选择一个地址', icon: 'none' });
      return;
    }

    const addr = this.data.addressList.find(a => a.id === selectedId);
    if (!addr) {
      wx.showToast({ title: '地址信息异常', icon: 'none' });
      return;
    }

    const regionValue = [];
    if (addr.province) regionValue.push(addr.province);
    if (addr.city) regionValue.push(addr.city);
    if (addr.district) regionValue.push(addr.district);

    this.setData({
      editRegionValue: regionValue,
      'editFormData.contactName': addr.contact_name || addr.contactName || '',
      'editFormData.contactPhone': addr.contact_phone || addr.contactPhone || '',
      'editFormData.province': addr.province || '',
      'editFormData.city': addr.city || '',
      'editFormData.district': addr.district || '',
      'editFormData.detailAddress': addr.detail_address || addr.detail || '',
      showAddressPickerModal: false
    });

    wx.showToast({ title: '已选择地址', icon: 'success' });
  },

  /**
   * 关闭地址选择弹窗
   */
  closeAddressPicker() {
    this.setData({
      showAddressPickerModal: false,
      'editFormData._selectedAddrId': null
    });
  },

  /**
   * 保存编辑
   */
  async saveEditOrder() {
    if (this.data.savingEdit) return;

    const { editOrderId, editFormData } = this.data;

    if (!editOrderId) {
      wx.showToast({ title: '订单信息异常', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...', mask: true });
    this.setData({ savingEdit: true });

    try {
      const response = await orderApi.editOrder(editOrderId, {
        contact_name: editFormData.contactName,
        contact_phone: editFormData.contactPhone,
        province: editFormData.province,
        city: editFormData.city,
        district: editFormData.district,
        detail_address: editFormData.detailAddress,
        problem_description: editFormData.problemDescription,
        custom_description: editFormData.customDescription
      });

      wx.hideLoading();
      if (response && response.success) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        this.closeEditModal();
        this.loadOrders();
      } else {
        wx.showToast({ title: response?.error || response?.message || '保存失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('保存订单失败', error);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    } finally {
      this.setData({ savingEdit: false });
    }
  },

  // ========== 退款功能（两步式） ==========

  /**
   * 打开退款弹窗
   */
  openRefundModal(e) {
    const order = e.currentTarget.dataset.order;

    if (!order) {
      wx.showToast({ title: '订单信息错误', icon: 'none' });
      return;
    }

    if (order.status !== 'pending') {
      wx.showToast({ title: '只能对待处理订单申请退款', icon: 'none' });
      return;
    }

    this.setData({
      refundStep: 1,
      refundOrderData: {
        id: order.id,
        orderNo: order.order_id || order.orderId || '',
        price: order.price || '0.0'
      },
      refundReasonLabel: '',
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
      refundStep: 1,
      refundOrderData: null,
      refundReasonLabel: '',
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
    const reasonItem = this.data.refundReasons.find(r => r.value === reason);
    this.setData({
      'refundFormData.reason': reason,
      refundReasonLabel: reasonItem ? reasonItem.label : ''
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
   * 进入退款确认步骤（第二步）
   */
  goToRefundConfirm() {
    const { refundFormData } = this.data;
    if (!refundFormData.reason) {
      wx.showToast({ title: '请选择退款原因', icon: 'none' });
      return;
    }
    this.setData({ refundStep: 2 });
  },

  /**
   * 返回退款第一步
   */
  backToRefundStep1() {
    this.setData({ refundStep: 1 });
  },

  /**
   * 提交退款申请（第二步确认）
   */
  async submitRefund() {
    if (this.data.refundSubmitting) return;

    const { refundOrderData, refundFormData } = this.data;

    wx.showLoading({ title: '提交退款中...', mask: true });
    this.setData({ refundSubmitting: true });

    try {
      const response = await orderApi.refundOrder(refundOrderData.id, {
        reason: refundFormData.reason,
        description: refundFormData.description
      });

      wx.hideLoading();
      if (response && response.success) {
        wx.showToast({ title: '退款申请成功', icon: 'success' });
        this.closeRefundModal();
        this.loadOrders();
      } else {
        wx.showToast({ title: response?.error || response?.message || '退款申请失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('退款申请失败', error);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    } finally {
      this.setData({ refundSubmitting: false });
    }
  },

  // ========== 报价确认功能 ==========

  /**
   * 接受报价
   */
  acceptQuote(e) {
    if (this.data.quoteSubmitting) return;

    const order = e.currentTarget.dataset.order;
    if (!order || !order.id) {
      wx.showToast({ title: '订单信息错误', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认接受报价',
      content: '确认接受报价？接受后维修人员将开始处理。',
      success: async (res) => {
        if (!res.confirm) return;

        wx.showLoading({ title: '处理中...', mask: true });
        this.setData({ quoteSubmitting: true });

        try {
          const token = wx.getStorageSync('token');
          const baseUrl = getApp().globalData.baseUrl || getApp().globalData.apiUrl;
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url: `${baseUrl}/api/orders/${order.id}/accept-quote`,
              method: 'PUT',
              header: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
              },
              success: (res) => {
                if (res.statusCode === 200) resolve(res.data);
                else reject(res);
              },
              fail: reject
            });
          });

          wx.hideLoading();
          if (response && response.success) {
            wx.showToast({ title: '已确认报价', icon: 'success' });
            this.loadOrders();
            this._refreshTabBarBadge();
          } else {
            wx.showToast({ title: response?.error || '操作失败', icon: 'none' });
          }
        } catch (error) {
          wx.hideLoading();
          console.error('接受报价失败:', error);
          const errMsg = (error && error.data && error.data.error) || '网络错误，请重试';
          const detail = (error && error.data && error.data.detail) || '';
          console.error('错误详情:', detail);
          wx.showToast({ title: errMsg, icon: 'none', duration: 3000 });
        } finally {
          this.setData({ quoteSubmitting: false });
        }
      }
    });
  },

  async payOrder(e) {
    if (this.data.paymentSubmitting) return;

    const order = e.currentTarget.dataset.order;
    if (!order || !order.id) {
      wx.showToast({ title: '订单信息错误', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '创建支付中...', mask: true });
    this.setData({ paymentSubmitting: true });
    try {
      const response = await orderApi.createPayment(order.id);
      wx.hideLoading();

      if (!response || !response.success) {
        wx.showToast({ title: response?.error || '创建支付失败', icon: 'none' });
        return;
      }

      if (response.data?.alreadyPaid) {
        wx.showToast({ title: '订单已支付', icon: 'success' });
        this.loadOrders();
        return;
      }

      const payParams = response.data?.payParams || {};
      wx.requestPayment({
        timeStamp: payParams.timeStamp,
        nonceStr: payParams.nonceStr,
        package: payParams.package,
        signType: payParams.signType || 'RSA',
        paySign: payParams.paySign,
        success: async () => {
          await this.queryAndRefreshOrderPayment(order.id, true);
        },
        fail: async (err) => {
          console.error('支付失败:', err);
          if (err && err.errMsg && err.errMsg.includes('cancel')) {
            wx.showToast({ title: '已取消支付', icon: 'none' });
          } else {
            wx.showToast({ title: '支付未完成', icon: 'none' });
          }
          await this.queryAndRefreshOrderPayment(order.id, false);
        }
      });
    } catch (error) {
      wx.hideLoading();
      console.error('发起支付失败:', error);
      wx.showToast({ title: '发起支付失败', icon: 'none' });
    } finally {
      this.setData({ paymentSubmitting: false });
    }
  },

  async queryAndRefreshOrderPayment(orderId, showSuccessToast) {
    try {
      const response = await orderApi.queryPaymentStatus(orderId);
      if (response && response.success && response.data?.paymentStatus === 'paid' && showSuccessToast) {
        wx.showToast({ title: '支付成功', icon: 'success' });
      }
    } catch (error) {
      console.error('查询支付状态失败:', error);
    } finally {
      this.loadOrders();
    }
  },

  /**
   * 打开拒绝报价弹窗
   */
  openRejectQuoteModal(e) {
    const order = e.currentTarget.dataset.order;
    if (!order || !order.id) {
      wx.showToast({ title: '订单信息错误', icon: 'none' });
      return;
    }

    // 先加载完整报价信息
    wx.showLoading({ title: '加载中...' });
    orderApi.getOrderDetail(order.id)
      .then(response => {
        wx.hideLoading();
        const rawData = response && response.success ? response.data : response;
        const detail = rawData && rawData.order ? rawData.order : rawData;

        this.setData({
          rejectQuoteOrderData: {
            id: order.id,
            orderNo: order.order_id || order.orderId || '',
            quotePrice: detail.quote_price ? '¥' + detail.quote_price : (detail.quotePrice ? '¥' + detail.quotePrice : '')
          },
          rejectQuoteFormData: {
            reason: ''
          },
          showRejectQuoteModal: true
        });
      })
      .catch(err => {
        wx.hideLoading();
        console.error('加载订单详情失败', err);
        this.setData({
          rejectQuoteOrderData: {
            id: order.id,
            orderNo: order.order_id || order.orderId || '',
            quotePrice: order.price ? '¥' + order.price : ''
          },
          rejectQuoteFormData: {
            reason: ''
          },
          showRejectQuoteModal: true
        });
      });
  },

  /**
   * 关闭拒绝报价弹窗
   */
  closeRejectQuoteModal() {
    this.setData({
      showRejectQuoteModal: false,
      rejectQuoteOrderData: null,
      rejectQuoteFormData: {
        reason: ''
      }
    });
  },

  /**
   * 拒绝报价原因输入
   */
  onRejectQuoteReasonInput(e) {
    this.setData({
      'rejectQuoteFormData.reason': e.detail.value
    });
  },

  /**
   * 提交拒绝报价
   */
  async submitRejectQuote() {
    if (this.data.quoteSubmitting) return;

    const { rejectQuoteOrderData, rejectQuoteFormData } = this.data;

    if (!rejectQuoteFormData.reason.trim()) {
      wx.showToast({ title: '请输入拒绝原因', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认拒绝报价',
      content: '拒绝后需要管理员重新报价，确定继续？',
      confirmColor: '#dc2626',
      success: async (res) => {
        if (!res.confirm) return;

        wx.showLoading({ title: '处理中...', mask: true });
        this.setData({ quoteSubmitting: true });

        try {
          const token = wx.getStorageSync('token');
          const baseUrl = getApp().globalData.baseUrl || getApp().globalData.apiUrl;
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url: `${baseUrl}/api/orders/${rejectQuoteOrderData.id}/reject-quote`,
              method: 'PUT',
              data: { reason: rejectQuoteFormData.reason },
              header: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
              },
              success: (res) => {
                if (res.statusCode === 200) resolve(res.data);
                else reject(res);
              },
              fail: reject
            });
          });

          wx.hideLoading();
          if (response && response.success) {
            wx.showToast({ title: '已拒绝报价', icon: 'success' });
            this.closeRejectQuoteModal();
            this.loadOrders();
            this._refreshTabBarBadge();
          } else {
            wx.showToast({ title: response?.error || '操作失败', icon: 'none' });
          }
        } catch (error) {
          wx.hideLoading();
          console.error('拒绝报价失败:', error);
          wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        } finally {
          this.setData({ quoteSubmitting: false });
        }
      }
    });
  },

  // ========== 其他操作 ==========

  /**
   * 取消订单
   */
  cancelOrder(e) {
    if (this.data.cancelSubmitting) return;

    const orderId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '取消订单',
      content: '确定要取消这个订单吗？',
      confirmText: '确定',
      cancelText: '再想想',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...' });
          this.setData({ cancelSubmitting: true });

          orderApi.cancelOrder(orderId)
            .then(response => {
              wx.hideLoading();
              if (response && response.success) {
                wx.showToast({
                  title: '订单已取消',
                  icon: 'success'
                });
                this.loadOrders();
              } else {
                wx.showToast({
                  title: response?.message || '取消失败',
                  icon: 'none'
                });
              }
            })
            .catch(err => {
              console.error('取消订单失败', err);
              wx.hideLoading();
              wx.showToast({
                title: '取消失败',
                icon: 'none'
              });
            })
            .finally(() => {
              this.setData({ cancelSubmitting: false });
            });
        }
      }
    });
  },

  /**
   * 联系客服
   */
  contactService(e) {
    wx.switchTab({
      url: '/pages/service/service'
    })
  },

  /**
   * 跳转到进度申请页面
   */
  goToProgressApply(e) {
    const order = e.currentTarget.dataset.order;
    const orderId = order?.id || order?.orderId;
    if (orderId) {
      wx.navigateTo({
        url: `/pages/progress-apply-create/progress-apply-create?orderId=${orderId}`
      })
    } else {
      wx.showToast({ title: '订单信息异常', icon: 'none' })
    }
  },

  /**
   * 查看维修进度（只读模式）
   */
  viewProgress(e) {
    const order = e.currentTarget.dataset.order;
    if (!order || !order.id) {
      wx.showToast({ title: '订单信息错误', icon: 'none' });
      return;
    }
    const shouldFocusLatestFeedback = isProgressUnread(order);
    // 进入查看即视为已读：立即标记，确保"我的"页横幅、tabBar角标同步清除
    if (shouldFocusLatestFeedback) {
      this.markOrderProgressRead(order.id);
    }
    wx.navigateTo({
      url: `/pages/progress-feedback/progress-feedback?orderId=${order.id}&readonly=true&focusLatestFeedback=${shouldFocusLatestFeedback ? 'true' : 'false'}`
    });
  },

  /**
   * 查看详情（已完成订单）
   */
  viewDetail(e) {
    const order = e.currentTarget.dataset.order;
    
    if (!order) {
      wx.showToast({ title: '订单信息错误', icon: 'none' });
      return;
    }

    const orderId = order.id;
    
    if (!orderId) {
      wx.showToast({ title: '订单ID无效', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '加载中...' });

    orderApi.getOrderDetail(orderId)
      .then(response => {
        wx.hideLoading();
        const rawData = response && response.success ? response.data : response;
        const orderDetail = rawData && rawData.order ? rawData.order : rawData;
        wx.setStorageSync('currentOrderDetail', orderDetail);
        wx.navigateTo({
          url: `/pages/order-detail/order-detail?orderId=${orderId}`
        });
      })
      .catch(err => {
        console.error('加载订单详情失败', err);
        wx.hideLoading();
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  viewRepairReport(e) {
    const order = e.currentTarget.dataset.order;
    const files = order?.repairReportFiles || [];

    if (!files.length) {
      wx.showToast({ title: '暂无维修报告', icon: 'none' });
      return;
    }

    if (files.length === 1) {
      this.openRemoteFile(files[0].url);
      return;
    }

    wx.showActionSheet({
      itemList: files.map((file, index) => file.originalName || `维修报告 ${index + 1}`),
      success: (res) => {
        const target = files[res.tapIndex];
        if (target?.url) {
          this.openRemoteFile(target.url);
        }
      }
    });
  },

  openRemoteFile(url) {
    if (!url) {
      wx.showToast({ title: '文件地址无效', icon: 'none' });
      return;
    }

    const baseUrl = getApp().globalData.baseUrl || getApp().globalData.apiUrl || '';
    const fullUrl = /^https?:\/\//i.test(url) ? url : `${baseUrl}${url}`;

    wx.showLoading({ title: '打开中...' });
    wx.downloadFile({
      url: fullUrl,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.tempFilePath) {
          wx.openDocument({
            filePath: res.tempFilePath,
            showMenu: true,
            fail: () => {
              wx.showToast({ title: '打开文件失败', icon: 'none' });
            }
          });
        } else {
          wx.showToast({ title: '下载文件失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '下载文件失败', icon: 'none' });
      }
    });
  },

  /**
   * 去评价
   */
  goToReview(e) {
    const order = e.currentTarget.dataset.order;
    
    if (!order) {
      wx.showToast({ title: '订单信息错误', icon: 'none' });
      return;
    }

    const orderId = order.id;
    
    if (!orderId) {
      wx.showToast({ title: '订单ID无效', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/review/review?orderId=${orderId}`
    });
  },

  /**
   * 去下单
   */
  goToRepair() {
    wx.switchTab({
      url: '/pages/repair/repair'
    })
  },

  // ========== 申请售后功能 ==========

  /**
   * 打开申请售后弹窗（仅已完成 / 待评价订单）
   */
  openAfterSales(e) {
    const order = e.currentTarget.dataset.order;
    if (!order || !order.id) {
      wx.showToast({ title: '订单信息错误', icon: 'none' });
      return;
    }
    if (order.status !== 'completed' && order.status !== 'review') {
      wx.showToast({ title: '仅已完成或待评价的订单可申请售后', icon: 'none' });
      return;
    }
    const phone = order.phone || order.contact_phone || order.contactPhone || '';
    this.setData({
      afterSalesOrder: {
        id: order.id,
        orderNo: order.order_id || order.orderId || '',
        deviceName: order.deviceName || ''
      },
      afterSalesForm: {
        product_name: order.deviceName || '',
        product_model: '',
        type: 'repair',
        description: '',
        contact_phone: phone,
        images: []
      },
      showAfterSalesModal: true
    });
  },

  /**
   * 关闭申请售后弹窗
   */
  closeAfterSales() {
    this.setData({
      showAfterSalesModal: false,
      afterSalesOrder: null,
      afterSalesForm: {
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
    const value = e.currentTarget.dataset.value;
    this.setData({ 'afterSalesForm.type': value });
  },

  /**
   * 售后表单输入
   */
  onAfterSalesInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`afterSalesForm.${field}`]: e.detail.value });
  },

  /**
   * 选择售后图片
   */
  chooseAfterSalesImage() {
    const { afterSalesForm } = this.data;
    if (afterSalesForm.images.length >= 9) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' });
      return;
    }
    this.uploadAfterSalesImage();
  },

  /**
   * 上传售后图片
   */
  async uploadAfterSalesImage() {
    try {
      wx.showLoading({ title: '上传中...' });
      const baseUrl = getApp().globalData.baseUrl || getApp().globalData.apiUrl;
      const token = wx.getStorageSync('token');

      const chooseRes = await new Promise((resolve, reject) => {
        wx.chooseMedia({
          count: 9 - this.data.afterSalesForm.images.length,
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

      const uploadPromises = chooseRes.tempFiles.map(file => new Promise((resolve, reject) => {
        wx.uploadFile({
          url: `${baseUrl}/api/upload/quote`,
          filePath: file.tempFilePath,
          name: 'files',
          header: token ? { 'Authorization': `Bearer ${token}` } : {},
          success: (res) => {
            try {
              const data = JSON.parse(res.data);
              if (data.success && data.data && data.data.length > 0) resolve(data.data[0]);
              else reject(new Error('上传失败'));
            } catch (err) { reject(err); }
          },
          fail: reject
        });
      }));

      const uploaded = await Promise.all(uploadPromises);
      this.setData({
        'afterSalesForm.images': [...this.data.afterSalesForm.images, ...uploaded]
      });
      wx.hideLoading();
      wx.showToast({ title: '上传成功', icon: 'success' });
    } catch (err) {
      wx.hideLoading();
      console.error('上传售后图片失败', err);
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  /**
   * 移除售后图片
   */
  removeAfterSalesImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.afterSalesForm.images.filter((_, i) => i !== Number(index));
    this.setData({ 'afterSalesForm.images': images });
  },

  /**
   * 提交售后申请
   */
  async submitAfterSales() {
    if (this.data.afterSalesSubmitting) return;

    const { afterSalesOrder, afterSalesForm } = this.data;
    if (!afterSalesForm.product_name.trim()) {
      wx.showToast({ title: '请填写售后产品', icon: 'none' });
      return;
    }
    if (!afterSalesForm.description.trim()) {
      wx.showToast({ title: '请填写问题描述', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中...', mask: true });
    this.setData({ afterSalesSubmitting: true });

    try {
      const token = wx.getStorageSync('token');
      const baseUrl = getApp().globalData.baseUrl || getApp().globalData.apiUrl;
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${baseUrl}/api/after-sales/request`,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          data: {
            order_id: afterSalesOrder.id,
            product_name: afterSalesForm.product_name.trim(),
            product_model: afterSalesForm.product_model,
            type: afterSalesForm.type,
            description: afterSalesForm.description.trim(),
            contact_phone: afterSalesForm.contact_phone,
            images: afterSalesForm.images
          },
          success: (res) => {
            if (res.statusCode === 200) resolve(res.data);
            else reject(res);
          },
          fail: reject
        });
      });

      wx.hideLoading();
      if (response && response.success) {
        wx.showToast({ title: '售后申请已提交', icon: 'success' });
        this.closeAfterSales();
        this.loadMyAfterSales();
      } else {
        wx.showToast({ title: response?.error || '提交失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('提交售后申请失败', err);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    } finally {
      this.setData({ afterSalesSubmitting: false });
    }
  },

  /**
   * 加载我的售后申请，标记到对应订单上（提升体验）
   */
  async loadMyAfterSales() {
    const token = wx.getStorageSync('token');
    if (!token) return;
    const baseUrl = getApp().globalData.baseUrl || getApp().globalData.apiUrl;

    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${baseUrl}/api/after-sales/my`,
          method: 'GET',
          header: { 'Authorization': `Bearer ${token}` },
          success: (res) => {
            if (res.statusCode === 200) resolve(res.data);
            else reject(res);
          },
          fail: reject
        });
      });

      if (!response || !response.success) return;
      const list = response.data?.list || [];

      const map = {};
      list.forEach(item => {
        if (!map[item.order_id]) map[item.order_id] = item;
      });

      const orders = this.data.orders.map(o => {
        const as = map[o.id];
        if (as) {
          return {
            ...o,
            afterSalesLabel: as.status_label,
            afterSalesColor: as.status_color,
            afterSalesBg: as.status_bg,
            afterSalesIcon: as.status_icon
          };
        }
        return o;
      });

      this.setData({
        orders,
        filteredOrders: this.applyUnreadFilter(orders)
      });
    } catch (err) {
      console.error('加载我的售后失败', err);
    }
  }
})
