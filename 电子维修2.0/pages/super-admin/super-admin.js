/**
 * 超级管理员控制器 - 完整的超级管理员页面逻辑
 * 包含仪表盘、工单管理、设备统计、库存管理、维修人员管理、用户管理等功能
 */

const app = getApp();
const { normalizeAvatarUrl, DEFAULT_AVATAR_URL } = require('../../utils/avatar.js');

// 设备类型映射（与 deviceData.js 保持一致）
const DEVICE_TYPE_MAP = {
  1: '手机',
  2: '电脑/笔记本',
  3: '平板',
  4: '手表/手环',
  5: '耳机/音响',
  6: '相机/摄像机',
  7: '游戏机',
  8: '传感器/仪器',
  9: '无人机/航拍',
  10: '智能家居',
  11: '打印机/办公设备'
};

// 状态映射
const STATUS_MAP = {
  'pending': '待处理',
  'quoted': '待确认报价',
  'confirmed': '已确认报价',
  'processing': '处理中',
  'completed': '已完成',
  'cancelled': '已取消',
  'review': '待评价'
};

// 订单类型映射
const ORDER_TYPE_MAP = {
  'repair': '维修',
  'recycle': '回收'
};

// 服务方式映射
const SERVICE_TYPE_MAP = {
  'shop': '到店',
  'home': '上门'
};

// 状态颜色映射
const STATUS_COLOR_MAP = {
  'pending': '#f39c12',
  'quoted': '#8b5cf6',
  'confirmed': '#06b6d4',
  'processing': '#3498db',
  'completed': '#27ae60',
  'cancelled': '#e74c3c',
  'review': '#9b59b6'
};

/**
 * 解析回收订单问题描述
 * 将 "问题1？：答案1；问题2？：答案2" 格式解析为结构化数组
 * @param {string} raw - 原始描述文本
 * @returns {Array<{label: string, value: string}>}
 */
function parseRecycleDescription(raw) {
  if (!raw || typeof raw !== 'string') return [];
  try {
    const items = [];
    const trimmed = raw.trim();
    // 按全角分号 "；" 分割
    const parts = trimmed.split('；');
    for (const part of parts) {
      const idx = part.indexOf('：');
      if (idx > 0) {
        const label = part.substring(0, idx).trim();
        const value = part.substring(idx + 1).trim();
        if (label && value) {
          items.push({ label, value });
        }
      } else if (part.trim()) {
        // 找不到冒号分隔符，作为纯描述
        items.push({ label: '', value: part.trim() });
      }
    }
    return items;
  } catch (e) {
    return [];
  }
}

/**
 * 生成回收订单描述的简短摘要（用于列表展示）
 * @param {Array<{label: string, value: string}>} items
 * @returns {string}
 */
function buildRecycleSummary(items) {
  if (!items || items.length === 0) return '无';
  return items.slice(0, 3).map(i => i.label ? (i.label + i.value) : i.value).join(' · ');
}

Page({
  data: {
    // 用户信息
    adminInfo: null,
    token: null,
    isSuperAdmin: false,

    // 当前页面
    currentPage: 'dashboard',

    // 顶部标签栏滑动状态
    activeTabScrollId: 'tab-dashboard',
    canScrollLeft: false,
    canScrollRight: false,
    scrollThumbWidth: 30,
    scrollThumbLeft: 0,

    // 交易收入数据
    incomeData: { stats: {}, by_channel: [], monthly_trend: [] },
    incomeTrendMax: 0,
    incomeList: [],
    incomePage: 1,
    incomeHasMore: true,
    incomeLoading: false,
    incomeFilter: '',
    incomeKeyword: '',

    // 加载状态
    loading: false,
    loadingText: '加载中...',

    // 下拉刷新
    pullRefreshing: false,

    // 仪表盘数据
    dashboardData: {
      users: { total_users: 0, normal_users: 0, admin_users: 0, super_admin_users: 0, new_users_week: 0, active_users_day: 0 },
      orders: { total_orders: 0, pending_orders: 0, processing_orders: 0, completed_orders: 0, cancelled_orders: 0, review_orders: 0 },
      revenue: { total_revenue: 0, monthly_revenue: 0, daily_revenue: 0, weekly_revenue: 0 },
      parts: { total_parts: 0, low_stock_parts: 0 },
      recentOrders: [],
      recentUsers: []
    },
    dashboardLoaded: false,

    // 工单数据
    orders: [],
    orderTotal: 0,
    orderPage: 1,
    orderPageSize: 20,
    orderListLoading: false,

    // 设备统计
    deviceStats: {
      deviceDistribution: [],
      todayStats: {},
      monthStats: {},
      faultStats: [],
      weekTrend: []
    },
    deviceLoaded: false,

    // 维修人员数据
    technicians: [],
    technicianTotal: 0,

    // 备件库存
    partsInventory: [],
    partsTotal: 0,
    partsWarningCount: 0,
    showPartEditor: false,
    editingPartId: null,
    partForm: {
      name: '',
      model: '',
      category: '',
      quantity: 0,
      unit_price: 0,
      min_quantity: 5,
      supplier: '',
      location: '',
      status: 'active'
    },

    // 进度申请数据
    paList: [],
    paPage: 1,
    paPageSize: 20,
    paTotal: 0,
    paHasMore: true,
    paLoading: false,
    paStatusFilter: '',
    paStats: { pending: 0, approved: 0, rejected: 0 },
    paShowApproveModal: false,
    paShowRejectModal: false,
    paCurrentApply: null,
    paApproveRemark: '',
    paRejectRemark: '',
    paProcessing: false,

    // 待处理申请数（红点提醒）
    pendingApplyCount: 0,
    // 已通过申请数（我的订单提醒）
    approvedApplyCount: 0,

    // 售后管理
    afterSalesList: [],
    asPage: 1,
    asPageSize: 20,
    asTotal: 0,
    asHasMore: true,
    asLoading: false,
    asStatusFilter: '',
    asStats: { total: 0, pending: 0, processing: 0, resolved: 0, rejected: 0 },
    asShowResolveModal: false,
    asShowRejectModal: false,
    asCurrent: null,
    asResolveRemark: '',
    asRejectRemark: '',
    asProcessing: false,
    pendingAfterSalesCount: 0,

    // 转人工待接入数（客服管理红点提醒）
    pendingHumanServiceCount: 0,
    // 人工客服 WebSocket 连接状态
    adminSocketConnected: false,

    // 搜索和筛选
    keyword: '',
    statusFilter: '',
    statusFilterText: '全部',
    deviceTypeFilter: '',
    deviceTypeFilterText: '全部',

    // 用户列表数据
    users: [],
    userTotal: 0,
    userPage: 1,
    userPageSize: 20,
    userRoleFilter: '',
    userKeyword: '',
    showUserList: false,

    // 工单列表弹窗
    showOrderList: false,
    orderListFilter: 'all',

    // 设备类型选项（用于筛选）
    deviceTypeOptions: ['全部', '手机', '电脑', '平板', '手表', '耳机', '相机', '游戏机', '其他'],

    // 状态选项
    statusOptions: [
      { value: '', label: '全部' },
      { value: 'pending', label: '待处理' },
      { value: 'processing', label: '处理中' },
      { value: 'completed', label: '已完成' },
      { value: 'cancelled', label: '已取消' },
      { value: 'review', label: '待评价' }
    ],

    // 实时时钟
    currentTime: '',

    // 上次刷新时间
    lastRefreshTime: '',

    // 工单详情弹窗
    showOrderDetail: false,
    orderDetail: null,

    // 确认弹窗
    showConfirm: false,
    confirmTitle: '',
    confirmContent: '',
    confirmAction: null,

    // 价格编辑器
    showPriceEditor: false,
    priceForm: {
      estimated_price: 0,
      actual_price: 0,
      remark: ''
    },

    // 报价弹窗
    showQuoteModal: false,
    quoteOrderData: null,
    quoteFormData: {
      price: '',
      description: ''
    },

    // 计算属性
    completionRate: 0,
    averageRevenue: 0
  },

  // 空操作 - 阻止事件冒泡
  noop() {},

  onAvatarError() {
    this.setData({
      'adminInfo.avatar_url': DEFAULT_AVATAR_URL,
      'adminInfo.avatarUrl': DEFAULT_AVATAR_URL
    });
  },

  onRecentUserAvatarError(e) {
    const index = e.currentTarget.dataset.index;
    if (index === undefined) return;

    this.setData({
      [`dashboardData.recentUsers[${index}].avatar_url`]: DEFAULT_AVATAR_URL,
      [`dashboardData.recentUsers[${index}].avatarUrl`]: DEFAULT_AVATAR_URL
    });
  },

  onLoad() {
    // 启动实时时钟
    this.updateClock();
    this._clockTimer = setInterval(() => {
      this.updateClock();
    }, 1000);
    setTimeout(() => {
      this.checkAuth();
    }, 10);
    // 红点检查移到 checkAuth 成功后启动
  },

  onShow() {
    if (this.data.isSuperAdmin) {
      this.refreshCurrentPage();
    }
    this.checkTabsScroll();
    // 布局稳定后再校准一次滑动状态
    setTimeout(() => this.checkTabsScroll(), 350);
  },

  onHide() {
    // 页面隐藏时清除定时器
    if (this._clockTimer) {
      clearInterval(this._clockTimer);
      this._clockTimer = null;
    }
    if (this._paCheckTimer) {
      clearInterval(this._paCheckTimer);
      this._paCheckTimer = null;
    }
    if (this._humanServiceTimer) {
      clearInterval(this._humanServiceTimer);
      this._humanServiceTimer = null;
    }
    if (this._asCheckTimer) {
      clearInterval(this._asCheckTimer);
      this._asCheckTimer = null;
    }
  },

  onUnload() {
    // 页面卸载时清除定时器
    if (this._clockTimer) {
      clearInterval(this._clockTimer);
      this._clockTimer = null;
    }
    if (this._paCheckTimer) {
      clearInterval(this._paCheckTimer);
      this._paCheckTimer = null;
    }
    if (this._humanServiceTimer) {
      clearInterval(this._humanServiceTimer);
      this._humanServiceTimer = null;
    }
    if (this._asCheckTimer) {
      clearInterval(this._asCheckTimer);
      this._asCheckTimer = null;
    }
    this.closeAdminSocket();
  },

  // 更新实时时钟
  updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    this.setData({ currentTime: h + ':' + m + ':' + s });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ pullRefreshing: true });
    this.refreshCurrentPage().finally(() => {
      wx.stopPullDownRefresh();
      this.setData({ pullRefreshing: false });
    });
  },

  // 刷新当前页面数据
  async refreshCurrentPage() {
    const page = this.data.currentPage;
    this.setData({
      lastRefreshTime: this.formatTime(new Date())
    });
    switch (page) {
      case 'dashboard':
        await this.loadDashboardData();
        break;
      case 'orders':
        await this.loadOrders(this.data.orderPage);
        break;
      case 'myOrders':
        await this.loadMyOrders(this.data.orderPage);
        break;
      case 'device':
        await this.loadDeviceStats();
        break;
      case 'inventory':
        await this.loadPartsInventory();
        break;
      case 'technicians':
        await this.loadTechnicians();
        break;
      case 'progressApply':
        await this.loadProgressApplies();
        this.loadPaStats();
        break;
      case 'afterSales':
        await this.loadAfterSales(this.data.asPage);
        this.loadAsStats();
        break;
      case 'income':
        await this.loadIncomeData(true);
        break;
    }
  },

  // 检查权限
  checkAuth() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');

    if (!token || !userInfo || userInfo.role !== 'super_admin') {
      wx.showToast({ title: '需要超级管理员权限', icon: 'none' });
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/home/home' });
      }, 1500);
      return;
    }

    this.setData({
      token,
      adminInfo: userInfo,
      isSuperAdmin: true
    });

    this.loadDashboardData();

    // 启动进度申请红点检查
    this.checkPendingApplyCount();
    this._paCheckTimer = setInterval(() => {
      this.checkPendingApplyCount();
    }, 30000);

    // 连接 WebSocket 接收转人工实时通知
    this.connectAdminSocket();

    // 启动人工客服待接入数量检查
    this.checkPendingHumanServiceCount();
    this._humanServiceTimer = setInterval(() => {
      this.checkPendingHumanServiceCount();
    }, 15000);

    // 启动售后申请待处理数量检查
    this.checkPendingAfterSalesCount();
    this._asCheckTimer = setInterval(() => {
      this.checkPendingAfterSalesCount();
    }, 30000);
  },

  // 切换页面
  switchPage(e) {
    const page = e.currentTarget.dataset.page;
    if (page === this.data.currentPage) return;
    this.setData({
      currentPage: page,
      activeTabScrollId: 'tab-' + page
    });
    this.refreshCurrentPage();
  },

  /**
   * 计算顶部标签栏是否可滑动，并初始化滚动进度条
   */
  checkTabsScroll() {
    const query = wx.createSelectorQuery().in(this);
    query.select('.tabs').boundingClientRect();
    query.select('.tabs-inner').boundingClientRect();
    query.exec((res) => {
      if (!res || !res[0] || !res[1]) return;
      const viewWidth = res[0].width || 0;
      const contentWidth = res[1].width || 0;
      this._tabsViewWidth = viewWidth;
      this._tabsContentWidth = contentWidth;

      const scrollable = contentWidth > viewWidth + 1;
      let thumbWidth = 100;
      if (scrollable && viewWidth > 0) {
        thumbWidth = Math.max(15, Math.round((viewWidth / contentWidth) * 100));
      }
      this.setData({
        canScrollLeft: false,
        canScrollRight: scrollable,
        scrollThumbWidth: thumbWidth,
        scrollThumbLeft: 0
      });
    });
  },

  /**
   * 顶部标签栏滑动时，更新左右渐隐与进度条
   */
  onTabsScroll(e) {
    const viewWidth = this._tabsViewWidth || 0;
    const contentWidth = this._tabsContentWidth || 0;
    if (!viewWidth || !contentWidth) return;

    const scrollLeft = e.detail.scrollLeft || 0;
    const maxScroll = Math.max(1, contentWidth - viewWidth);
    const ratio = Math.min(1, Math.max(0, scrollLeft / maxScroll));
    const thumbWidth = this.data.scrollThumbWidth || 30;
    const maxThumbLeft = Math.max(0, 100 - thumbWidth);
    const thumbLeft = ratio * maxThumbLeft;

    this.setData({
      scrollThumbLeft: thumbLeft,
      canScrollLeft: scrollLeft > 2,
      canScrollRight: scrollLeft < maxScroll - 2
    });
  },

  goToServiceManagement() {
    wx.navigateTo({
      url: '/pages/adminservice/adminservice'
    });
  },

  // ===================== 通用请求方法 =====================

  // 获取API基础地址，优先使用app.globalData中的配置（真机调试时使用局域网IP）
  getApiBaseUrl() {
    // app 已在文件顶部通过 getApp() 获取
    return app.globalData.baseUrl || app.globalData.apiUrl || 'http://192.168.8.72:3001';
  },

  request(options) {
    return new Promise((resolve, reject) => {
      const baseUrl = this.getApiBaseUrl();
      console.log('[super-admin] request url:', baseUrl + options.url);
      wx.request({
        url: `${baseUrl}${options.url}`,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json',
          ...(options.header || {})
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // 兼容两种后端响应格式: {success, data} 或 {code, message, data}
            if (res.data.success || res.data.code === 200) {
              resolve(res.data);
            } else {
              wx.showToast({ title: res.data.error || res.data.message || '操作失败', icon: 'none', duration: 2000 });
              reject(res.data);
            }
          } else if (res.statusCode === 401) {
            wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
            setTimeout(() => {
              wx.removeStorageSync('token');
              wx.removeStorageSync('userInfo');
              wx.reLaunch({ url: '/pages/home/home' });
            }, 1500);
            reject(res.data);
          } else if (res.statusCode === 403) {
            wx.showToast({ title: '权限不足', icon: 'none' });
            reject(res.data);
          } else {
            const errMsg = res.data && res.data.error ? res.data.error : `服务器错误(${res.statusCode})`;
            console.error('API请求失败:', options.url, res.statusCode, res.data);
            wx.showToast({ title: errMsg, icon: 'none', duration: 2000 });
            reject(res.data);
          }
        },
        fail: (err) => {
          console.error('网络请求失败:', options.url, err);
          wx.showToast({ title: '网络连接失败', icon: 'none', duration: 2000 });
          reject(err);
        }
      });
    });
  },

  // ===================== 仪表盘 =====================

  async loadDashboardData() {
    if (this.data.loading) return;
    this.setData({ loading: true, loadingText: '加载仪表盘...' });

    try {
      const res = await this.request({ url: '/api/super-admin/dashboard' });
      const data = res.data || {};

      // 处理最近订单数据
      const processedRecentOrders = (data.recentOrders || []).map(order => ({
        ...order,
        device_model: order.device_model || '未知设备',
        customer_name: order.customer_name || order.nickname || '未知客户'
      }));

      this.setData({
        dashboardData: {
          ...data,
          recentOrders: processedRecentOrders
        },
        dashboardLoaded: true
      });
    } catch (err) {
      console.error('加载仪表盘失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  // ===================== 交易收入 =====================

  async loadIncomeData(reset) {
    if (this.data.incomeLoading) return;
    const isReset = reset === true || (reset && reset.currentTarget && reset.currentTarget.dataset && reset.currentTarget.dataset.reset) || reset === '1' || reset === 1;
    const page = isReset ? 1 : this.data.incomePage;
    this._trendTries = 0;

    this.setData({ incomeLoading: true, incomePage: page });

    try {
      const params = { page, pageSize: 20 };
      if (this.data.incomeFilter) params.orderType = this.data.incomeFilter;
      if (this.data.incomeKeyword) params.keyword = this.data.incomeKeyword;
      const res = await this.request({ url: '/api/super-admin/income', data: params });
      // request() 已返回完整响应体 {success, data:{list,stats,pagination}}，
      // 因此这里 res.data 即为内部数据对象，不要再取一次 .data。
      const data = res.data || {};
      const list = data.list || [];
      const pagination = data.pagination || {};
      const trend = data.monthly_trend || [];
      const trendMax = trend.reduce((m, t) => Math.max(m, Number(t.amount) || 0), 0);

      this.setData({
        incomeData: {
          stats: data.stats || {},
          by_channel: data.by_channel || [],
          monthly_trend: trend
        },
        incomeTrendMax: trendMax,
        incomeList: isReset ? list : this.data.incomeList.concat(list),
        incomePage: page + 1,
        incomeHasMore: (pagination.totalPages || 1) > page
      }, () => {
        // 列表/筛选/搜索变化后重绘趋势折线图
        this.renderIncomeTrendChart();
      });
    } catch (err) {
      console.error('加载收入数据失败:', err);
    } finally {
      this.setData({ incomeLoading: false });
    }
  },

  // 搜索输入（带防抖）
  onIncomeSearchInput(e) {
    const val = e.detail.value;
    this.setData({ incomeKeyword: val });
    if (this._incomeSearchTimer) clearTimeout(this._incomeSearchTimer);
    this._incomeSearchTimer = setTimeout(() => {
      this.loadIncomeData(true);
    }, 400);
  },

  onIncomeSearch() {
    if (this._incomeSearchTimer) clearTimeout(this._incomeSearchTimer);
    this.loadIncomeData(true);
  },

  onIncomeClearSearch() {
    if (this._incomeSearchTimer) clearTimeout(this._incomeSearchTimer);
    this.setData({ incomeKeyword: '' });
    this.loadIncomeData(true);
  },

  onIncomeFilterChange(e) {
    const type = e.currentTarget.dataset.type || '';
    if (type === this.data.incomeFilter) return;
    this.setData({ incomeFilter: type });
    this.loadIncomeData(true);
  },

  async onIncomeBackfill() {
    if (this.data.incomeLoading) return;
    this.setData({ incomeLoading: true });
    try {
      const res = await this.request({ url: '/api/super-admin/income/backfill', method: 'POST' });
      const msg = (res && (res.message || (res.data && res.data.message))) || '历史收入已回填';
      wx.showToast({ title: msg, icon: 'none' });
    } catch (err) {
      wx.showToast({ title: '回填失败', icon: 'none' });
    } finally {
      this.setData({ incomeLoading: false });
      this.loadIncomeData(true);
    }
  },

  onIncomeReachBottom() {
    if (this.data.incomeHasMore && !this.data.incomeLoading) {
      this.loadIncomeData(false);
    }
  },

  // 渲染"近6个月收入趋势"折线图（原生 canvas 2d，无需引入第三方库）
  renderIncomeTrendChart() {
    const raw = this.data.incomeData.monthly_trend || [];
    // 后端已按时间升序返回（最早→最近），左→右即递增，无需再反转
    const trend = raw.slice();
    if (!trend.length) return;

    this._trendTries = (this._trendTries || 0) + 1;
    if (this._trendTries > 8) { this._trendTries = 0; return; }

    const query = wx.createSelectorQuery().in(this);
    query.select('#incomeTrendChart').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        // 节点尚未渲染完成，稍后重试
        setTimeout(() => this.renderIncomeTrendChart(), 120);
        return;
      }
      this._trendTries = 0;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');

      let dpr = 2;
      try {
        dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || (wx.getSystemInfoSync && wx.getSystemInfoSync().pixelRatio) || 2;
      } catch (e) { dpr = 2; }
      // 限制 dpr 上限，降低高分屏绘制开销，缓解页面滑动卡顿
      dpr = Math.min(dpr, 2);

      const cssW = res[0].width;
      const cssH = res[0].height;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssW, cssH);

      const padL = 46, padR = 14, padT = 28, padB = 30;
      const plotW = cssW - padL - padR;
      const plotH = cssH - padT - padB;
      const n = trend.length;
      const amounts = trend.map(t => Number(t.amount) || 0);
      const niceMax = this._niceCeil(Math.max.apply(null, amounts.concat([1])));

      // 跨年时在 X 轴标签前加年份（如 25/3）
      const yearSet = {};
      trend.forEach(t => { yearSet[String(t.month || '').slice(0, 4)] = true; });
      const crossYear = Object.keys(yearSet).length > 1;
      const labelOf = (m) => {
        const mm = String(m || '').slice(5).replace(/^0/, '');
        return crossYear ? `${String(m || '').slice(2, 4)}/${mm}` : `${mm}月`;
      };

      // 横向网格 + Y 轴刻度
      ctx.lineWidth = 1;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const gridLines = 4;
      for (let i = 0; i <= gridLines; i++) {
        const y = padT + (plotH * i) / gridLines;
        ctx.strokeStyle = '#eef1f6';
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + plotW, y);
        ctx.stroke();
        const val = niceMax * (1 - i / gridLines);
        ctx.fillStyle = '#9aa0a6';
        ctx.fillText(this._formatShort(val), padL - 8, y);
      }

      const xAt = (i) => (n === 1 ? padL + plotW / 2 : padL + (plotW * i) / (n - 1));
      const yAt = (v) => padT + plotH * (1 - v / niceMax);

      // X 轴标签
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#9aa0a6';
      trend.forEach((t, i) => {
        ctx.fillText(labelOf(t.month), xAt(i), padT + plotH + 8);
      });

      // 面积渐变填充
      const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
      grad.addColorStop(0, 'rgba(52,152,219,0.30)');
      grad.addColorStop(1, 'rgba(52,152,219,0.02)');
      ctx.beginPath();
      trend.forEach((t, i) => {
        const x = xAt(i), y = yAt(amounts[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.lineTo(xAt(n - 1), padT + plotH);
      ctx.lineTo(xAt(0), padT + plotH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // 折线
      ctx.beginPath();
      trend.forEach((t, i) => {
        const x = xAt(i), y = yAt(amounts[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // 数据点 + 数值（自动避让顶部越界）
      trend.forEach((t, i) => {
        const x = xAt(i), y = yAt(amounts[i]);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#3498db';
        ctx.stroke();

        let ty = y - 8;
        if (ty < padT + 8) ty = y + 14;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#2c3e50';
        ctx.font = '10px sans-serif';
        ctx.fillText('¥' + this._formatShort(amounts[i]), x, ty);
      });
    });
  },

  // 点击收入列表中的单个订单，查看对应订单详情
  onIncomeItemTap(e) {
    const orderId = e.currentTarget.dataset.orderId;
    if (!orderId) return;
    this.viewOrderDetail({ currentTarget: { dataset: { orderId } } });
  },

  // 计算"漂亮"的刻度上限
  _niceCeil(v) {
    if (v <= 0) return 1;
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / pow;
    let nice;
    if (n <= 1) nice = 1;
    else if (n <= 2) nice = 2;
    else if (n <= 5) nice = 5;
    else nice = 10;
    return nice * pow;
  },

  // 金额缩写（用于坐标轴/数据点标签）
  _formatShort(v) {
    v = Number(v) || 0;
    if (v >= 10000) return (v / 10000).toFixed(1) + 'w';
    if (v >= 1000) return (v / 1000).toFixed(1) + 'k';
    return String(Math.round(v));
  },

  // ===================== 工单管理 =====================

  async loadOrders(page = 1) {
    if (this.data.orderListLoading) return;
    const pageArg = (page && page.currentTarget && page.currentTarget.dataset)
      ? Number(page.currentTarget.dataset.page || 1)
      : Number(page || 1);
    const safePage = Number.isFinite(pageArg) && pageArg > 0 ? pageArg : 1;
    this.setData({ orderListLoading: true, orderPage: safePage });

    try {
      const queryData = {
        page: safePage,
        pageSize: this.data.orderPageSize
      };
      
      if (this.data.keyword && this.data.keyword.trim()) {
        queryData.keyword = this.data.keyword.trim();
      }
      if (this.data.statusFilter) {
        queryData.status = this.data.statusFilter;
      }
      if (this.data.deviceTypeFilter) {
        queryData.deviceType = this.data.deviceTypeFilter;
      }
      
      const res = await this.request({
        url: '/api/super-admin/repair-orders',
        data: queryData
      });
      // 处理订单数据，确保字段一致
      const processedOrders = (res.data.orders || []).map(order => {
        const isRecycle = order.order_type === 'recycle';
        const rawDesc = order.problem_description || order.custom_description || '';
        const recycleDescItems = isRecycle ? parseRecycleDescription(rawDesc) : [];
        return {
          ...order,
          customer_name: order.customer_name || order.nickname || '未知',
          phone: order.phone || '',
          device_assigned_name: order.assigned_display_name || order.assigned_name || '',
          isRecycle: isRecycle,
          recycleDescItems: recycleDescItems,
          recycleDescSummary: recycleDescItems.length > 0 ? buildRecycleSummary(recycleDescItems) : ''
        };
      });
      this.setData({
        orders: processedOrders,
        orderTotal: res.data.total || 0
      });
    } catch (err) {
      console.error('加载工单列表失败:', err);
    } finally {
      this.setData({ orderListLoading: false });
    }
  },

  // 加载已通过进度申请的订单ID列表
  async loadApprovedPaOrderIds() {
    try {
      const res = await this.request({
        url: '/api/progress-apply',
        data: { approval_status: 'approved', pageSize: 100 }
      });
      if (res && (res.success || res.code === 200)) {
        const list = res.data.list || [];
        return new Set(list.map(item => item.order_id));
      }
    } catch (err) {
      console.error('加载已通过进度申请失败:', err);
    }
    return new Set();
  },

  async loadMyOrders(page = 1) {
    if (this.data.orderListLoading) return;
    const pageArg = (page && page.currentTarget && page.currentTarget.dataset)
      ? Number(page.currentTarget.dataset.page || 1)
      : Number(page || 1);
    const safePage = Number.isFinite(pageArg) && pageArg > 0 ? pageArg : 1;
    this.setData({ orderListLoading: true, orderPage: safePage });

    try {
      const res = await this.request({
        url: '/api/admin/my-orders',
        data: {
          page: safePage,
          pageSize: this.data.orderPageSize,
          keyword: this.data.keyword,
          status: this.data.statusFilter
        }
      });
      // 处理订单数据，确保字段一致
      const processedOrders = (res.data.orders || []).map(order => ({
        ...order,
        customer_name: order.customer_name || order.nickname || '未知',
        phone: order.customer_phone || order.phone || '',
        device_assigned_name: order.assigned_display_name || order.assigned_name || ''
      }));

      // 获取有已通过进度申请的订单ID，标记提醒
      const approvedOrderIds = await this.loadApprovedPaOrderIds();
      const taggedOrders = processedOrders.map(order => ({
        ...order,
        hasApprovedPa: approvedOrderIds.has(order.id)
      }));

      this.setData({
        orders: taggedOrders,
        orderTotal: res.data.total || 0
      });
    } catch (err) {
      console.error('加载我的订单失败:', err);
    } finally {
      this.setData({ orderListLoading: false });
    }
  },

  onSearchOrder() {
    this.loadOrders(1);
  },

  onOrderSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onClearSearch() {
    this.setData({ keyword: '' });
    this.loadOrders(1);
  },

  onStatusFilterChange(e) {
    const value = e.currentTarget.dataset.value;
    const label = e.currentTarget.dataset.label;
    this.setData({
      statusFilter: value,
      statusFilterText: label
    });
    this.loadOrders(1);
  },

  onDeviceTypeFilterChange(e) {
    const value = e.currentTarget.dataset.value;
    const label = e.currentTarget.dataset.label;
    const filterValue = value === '全部' ? '' : value;
    const typeIdMap = { '手机': 1, '电脑': 2, '平板': 3, '手表': 4, '耳机': 5, '相机': 6, '游戏机': 7, '其他': 8 };
    this.setData({
      deviceTypeFilter: typeIdMap[filterValue] || '',
      deviceTypeFilterText: label
    });
    this.loadOrders(1);
  },

  // 更新工单状态
  updateOrderStatus(e) {
    const { orderId, currentStatus } = e.currentTarget.dataset;
    const statuses = ['pending', 'quoted', 'confirmed', 'processing', 'completed', 'cancelled'];
    const statusNames = ['待处理', '待确认报价', '已确认报价', '处理中', '已完成', '已取消'];

    wx.showActionSheet({
      itemList: statusNames,
      success: (res) => {
        const newStatus = statuses[res.tapIndex];
        if (newStatus === currentStatus) return;
        this.showConfirmDialog(
          '确认修改',
          `确定要将工单状态修改为"${statusNames[res.tapIndex]}"吗？`,
          () => this._updateOrderStatus(orderId, newStatus)
        );
      }
    });
  },

  // 内部方法: 执行订单状态更新
  async _updateOrderStatus(orderId, status) {
    if (!orderId) {
      wx.showToast({ title: '订单ID无效', icon: 'none' });
      return;
    }

    if (!status) {
      wx.showToast({ title: '状态值无效', icon: 'none' });
      return;
    }

    const statusMap = {
      'pending': '待处理',
      'processing': '处理中',
      'completed': '已完成',
      'cancelled': '已取消',
      'review': '待评价'
    };

    const confirmMessages = {
      'processing': '确定要将此工单状态改为"处理中"吗？开始处理后会分配给当前管理员。',
      'completed': '确定要完成此工单吗？完成后需要填写实际价格。',
      'cancelled': '确定要取消此工单吗？此操作不可撤销。',
      'review': '确定要将工单状态改为"待评价"吗？'
    };

    // 如果是完成状态,先检查是否有实际价格
    if (status === 'completed') {
      const order = this.data.orderDetail || this.data.orders.find(o => o.id === orderId);
      console.log('[完成订单检查] order:', order);
      
      if (!order) {
        console.error('[完成订单] 未找到订单, orderId:', orderId);
        wx.showToast({ title: '订单不存在', icon: 'none' });
        return;
      }
      
      // 转换价格为数字进行比较
      const actualPrice = parseFloat(order.actual_price) || 0;
      
      if (!actualPrice) {
        // 没有实际价格,先打开价格编辑器
        console.log('[完成订单] 无实际价格,打开价格编辑器');
        this.setData({
          orderDetail: order,
          priceForm: {
            estimated_price: parseFloat(order.estimated_price) || 0,
            actual_price: parseFloat(order.actual_price) || 0,
            remark: ''
          }
        });

        wx.showModal({
          title: '设置实际价格',
          content: '完成工单前需要设置实际价格',
          showCancel: false,
          success: () => {
            this.setData({ showPriceEditor: true });
          }
        });
        return;
      }
    }

    this.showConfirmDialog(
      '确认修改状态',
      confirmMessages[status] || `确定要将工单状态改为"${statusMap[status]}"吗？`,
      async () => {
        try {
          await this.request({
            url: `/api/super-admin/repair-orders/${orderId}/status`,
            method: 'PUT',
            data: { status }
          });
          wx.showToast({ title: '状态修改成功', icon: 'success' });

          // 如果是从订单详情弹窗操作的,关闭弹窗并刷新数据
          if (this.data.showOrderDetail) {
            this.viewOrderDetail({ currentTarget: { dataset: { orderId } } });
          }

          // 刷新订单列表
          if (this.data.currentPage === 'orders' || this.data.currentPage === 'myOrders') {
            this.loadOrders(this.data.orderPage);
          }

          // 刷新仪表盘
          if (this.data.currentPage === 'dashboard') {
            this.loadDashboardData();
          }
        } catch (err) {
          console.error('状态修改失败:', err);
          wx.showToast({ title: '状态修改失败', icon: 'none' });
        }
      }
    );
  },

  async doUpdateOrderStatus(e) {
    const { orderId, status } = e.currentTarget.dataset;
    await this._updateOrderStatus(orderId, status);
  },

  // 查看工单详情
  async viewOrderDetail(e) {
    const { orderId } = e.currentTarget.dataset;
    try {
      const res = await this.request({ url: `/api/super-admin/repair-orders/${orderId}` });
      // 获取分配人员显示名称
      const assignedDisplayName = res.order.assigned_name || res.order.assigned_real_name || '';

      // 处理图片数据：解析JSON字符串并补全URL
      let images = res.order.images || [];
      if (typeof images === 'string') {
        try { images = JSON.parse(images); } catch (e) { images = []; }
      }
      if (!Array.isArray(images)) images = [];
      const baseUrl = this.getApiBaseUrl();
      images = images.map(img => {
        if (!img) return img;
        return img.startsWith('http') ? img : baseUrl + img;
      });

      // 回收订单：解析问题描述为结构化数据
      const isRecycle = res.order.order_type === 'recycle';
      const rawDesc = res.order.problem_description || res.order.custom_description || '';
      const recycleDescItems = isRecycle ? parseRecycleDescription(rawDesc) : [];

      this.setData({
        orderDetail: {
          ...res.order,
          device_model: res.order.device_model || '未知设备',
          problem_description: rawDesc || '无',
          estimated_price: res.order.estimated_price || 0,
          actual_price: res.order.actual_price || 0,
          progress: res.order.progress || 0,
          assigned_display_name: assignedDisplayName,
          images: images,
          isRecycle: isRecycle,
          recycleDescItems: recycleDescItems
        },
        showOrderDetail: true
      });
    } catch (err) {
      console.error('查看订单详情失败:', err);
      wx.showToast({ title: '获取订单详情失败', icon: 'none' });
    }
  },

  closeOrderDetail() {
    this.setData({ showOrderDetail: false, orderDetail: null }, () => {
      // 关闭详情后图表区域重新出现，重绘折线图（节点可能尚未就绪，内部有重试）
      if (this.data.currentPage === 'income') this.renderIncomeTrendChart();
    });
  },

  // 显示价格编辑器
  showPriceEditor() {
    const { orderDetail } = this.data;
    console.log('[显示价格编辑器] orderDetail:', orderDetail);
    
    this.setData({
      showPriceEditor: true,
      priceForm: {
        estimated_price: parseFloat(orderDetail.estimated_price) || 0,
        actual_price: parseFloat(orderDetail.actual_price) || 0,
        remark: ''
      }
    });
  },

  // 关闭价格编辑器
  closePriceEditor() {
    this.setData({ showPriceEditor: false });
  },

  // 价格表单输入
  onPriceFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`priceForm.${field}`]: value
    });
  },

  // 保存价格
  async savePrice() {
    const { orderDetail, priceForm } = this.data;

    if (!orderDetail || !orderDetail.id) {
      wx.showToast({ title: '订单信息无效', icon: 'none' });
      return;
    }

    if (!priceForm.estimated_price && !priceForm.actual_price) {
      wx.showToast({ title: '请至少输入一个价格', icon: 'none' });
      return;
    }

    try {
      // 后端API期望驼峰命名的字段名
      const updateData = {};
      if (priceForm.estimated_price) {
        updateData.estimatedPrice = parseFloat(priceForm.estimated_price);
      }
      if (priceForm.actual_price) {
        updateData.actualPrice = parseFloat(priceForm.actual_price);
      }

      console.log('[保存价格] orderId:', orderDetail.id, 'updateData:', updateData);

      await this.request({
        url: `/api/super-admin/repair-orders/${orderDetail.id}/price`,
        method: 'PUT',
        data: updateData
      });

      wx.showToast({ title: '价格修改成功', icon: 'success' });
      this.closePriceEditor();
      this.viewOrderDetail({ currentTarget: { dataset: { orderId: orderDetail.id } } });
      this.loadOrders(this.data.orderPage);
    } catch (err) {
      console.error('保存价格失败:', err);
      wx.showToast({ title: '价格修改失败: ' + (err.message || '未知错误'), icon: 'none' });
    }
  },

  // ===================== 报价功能 =====================

  // 打开报价弹窗
  openQuoteModal(e) {
    const orderId = e.currentTarget.dataset.orderId;
    const order = this.data.orders.find(o => o.id === orderId) || this.data.orderDetail;

    if (!order) {
      wx.showToast({ title: '订单未找到', icon: 'none' });
      return;
    }

    this.setData({
      quoteOrderData: order,
      quoteFormData: {
        price: '',
        description: ''
      },
      showQuoteModal: true
    });
  },

  // 关闭报价弹窗
  closeQuoteModal() {
    this.setData({
      showQuoteModal: false,
      quoteOrderData: null,
      quoteFormData: {
        price: '',
        description: ''
      }
    });
  },

  // 报价金额输入
  onQuotePriceInput(e) {
    this.setData({
      'quoteFormData.price': e.detail.value
    });
  },

  // 报价说明输入
  onQuoteDescInput(e) {
    this.setData({
      'quoteFormData.description': e.detail.value
    });
  },

  // 提交报价
  async submitQuote() {
    const { quoteOrderData, quoteFormData } = this.data;

    // 验证
    if (!quoteFormData.price || parseFloat(quoteFormData.price) <= 0) {
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
          const res = await this.request({
            url: `/api/admin/orders/${quoteOrderData.id}/quote`,
            method: 'PUT',
            data: {
              quote_price: parseFloat(quoteFormData.price),
              quote_description: quoteFormData.description
            }
          });

          wx.hideLoading();
          wx.showToast({ title: '报价提交成功', icon: 'success' });
          this.closeQuoteModal();

          // 刷新订单列表
          if (this.data.currentPage === 'orders' || this.data.currentPage === 'myOrders') {
            this.loadOrders(this.data.orderPage);
          }
          this.loadDashboardData();
        } catch (err) {
          wx.hideLoading();
          console.error('提交报价失败:', err);
          wx.showToast({ title: '报价提交失败', icon: 'none' });
        }
      }
    });
  },

  // 获取价格差异样式
  getPriceDiffClass(estimated, actual) {
    const diff = actual - estimated;
    if (diff > 0) return 'price-diff-positive';
    if (diff < 0) return 'price-diff-negative';
    return 'price-diff-zero';
  },

  // 分配工单给维修人员
  async assignOrderToTechnician(e) {
    const orderId = e.currentTarget.dataset.orderId;
    const order = this.data.orders.find(o => o.id === orderId);

    // 检查订单状态,已完成的订单不能分配
    if (order && order.status === 'completed') {
      wx.showToast({ title: '已完成的订单不能重新分配', icon: 'none' });
      return;
    }

    // 检查订单状态,已取消的订单不能分配
    if (order && order.status === 'cancelled') {
      wx.showToast({ title: '已取消的订单不能分配', icon: 'none' });
      return;
    }

    // 如果维修人员列表为空，自动加载
    let technicians = this.data.technicians;
    if (!technicians || technicians.length === 0) {
      wx.showLoading({ title: '加载维修人员...' });
      try {
        const res = await this.request({ url: '/api/super-admin/technicians' });
        technicians = (res.data.technicians || []).map(tech => ({
          ...tech,
          processing_orders: tech.stats?.active_orders || 0,
          completed_orders: tech.stats?.completed_orders || 0,
          total_orders: tech.stats?.total_orders || 0
        }));
        this.setData({ technicians });
      } catch (err) {
        wx.hideLoading();
        wx.showToast({ title: '加载维修人员失败', icon: 'none' });
        return;
      }
      wx.hideLoading();
    }

    if (!technicians || technicians.length === 0) {
      wx.showToast({ title: '暂无可分配的维修人员', icon: 'none' });
      return;
    }

    const techNames = technicians.map(t => t.real_name || t.nickname || `用户${t.id}`);
    wx.showActionSheet({
      itemList: techNames,
      success: async (res) => {
        const tech = technicians[res.tapIndex];
        this.showConfirmDialog('分配工单', `确定要将此工单分配给"${techNames[res.tapIndex]}"吗？`, async () => {
          try {
            await this.request({
              url: `/api/super-admin/repair-orders/${orderId}/assign`,
              method: 'PUT',
              data: { technicianId: tech.id }
            });
            wx.showToast({ title: '分配成功', icon: 'success' });
            this.loadOrders(this.data.orderPage);
          } catch (err) {
            // 错误已在request中处理
          }
        });
      }
    });
  },

  // 更新进度
  updateProgress(e) {
    const progress = e.currentTarget.dataset.progress;
    const orderDetail = this.data.orderDetail;
    if (!orderDetail) return;

    this.request({
      url: `/api/super-admin/repair-orders/${orderDetail.id}/progress`,
      method: 'PUT',
      data: { progress }
    }).then(() => {
      wx.showToast({ title: '进度更新成功', icon: 'success' });
      this.setData({
        'orderDetail.progress': progress
      });
      this.loadOrders(this.data.orderPage);
    }).catch(() => {
      // 错误已处理
    });
  },

  // 上传进度反馈
  uploadProgress(e) {
    const orderId = e.currentTarget.dataset.orderId;
    wx.navigateTo({
      url: `/pages/progress-feedback/progress-feedback?orderId=${orderId}`
    });
  },

  // 分页
  loadPrevPage() {
    if (this.data.orderPage > 1) {
      this.loadOrders(this.data.orderPage - 1);
    }
  },

  loadNextPage() {
    const totalPages = Math.ceil(this.data.orderTotal / this.data.orderPageSize);
    if (this.data.orderPage < totalPages) {
      this.loadOrders(this.data.orderPage + 1);
    }
  },

  // ===================== 设备统计 =====================

  async loadDeviceStats() {
    if (this.data.loading) return;
    this.setData({ loading: true, loadingText: '加载设备统计...' });

    try {
      const res = await this.request({ url: '/api/super-admin/device-stats' });
      this.setData({
        deviceStats: res.data,
        deviceLoaded: true
      });

      // 计算完成率和平均收入
      const monthStats = res.data.monthStats || {};
      const total = monthStats.total_month || 0;
      const completed = monthStats.completed_month || 0;
      const revenue = monthStats.revenue_month || 0;

      this.setData({
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0',
        averageRevenue: completed > 0 ? (revenue / completed).toFixed(2) : '0.00'
      });
    } catch (err) {
      console.error('加载设备统计失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  // ===================== 备件库存 =====================

  async loadPartsInventory() {
    if (this.data.loading) return;
    this.setData({ loading: true, loadingText: '加载库存...' });

    try {
      const res = await this.request({ url: '/api/super-admin/parts-inventory' });
      this.setData({
        partsInventory: res.data.parts,
        partsTotal: res.data.total,
        partsWarningCount: res.data.warningCount
      });
    } catch (err) {
      console.error('加载备件库存失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  addPart() {
    this.setData({
      showPartEditor: true,
      editingPartId: null,
      partForm: {
        name: '',
        model: '',
        category: '',
        quantity: 0,
        unit_price: 0,
        min_quantity: 5,
        supplier: '',
        location: '',
        status: 'active'
      }
    });
  },

  editPart(e) {
    const { partId } = e.currentTarget.dataset;
    const part = this.data.partsInventory.find(p => p.id === partId);
    if (!part) {
      wx.showToast({ title: '未找到备件信息', icon: 'none' });
      return;
    }
    this.setData({
      showPartEditor: true,
      editingPartId: partId,
      partForm: {
        name: part.name || '',
        model: part.model || '',
        category: part.category || '',
        quantity: part.quantity || 0,
        unit_price: part.unit_price || 0,
        min_quantity: part.min_quantity || 5,
        supplier: part.supplier || '',
        location: part.location || '',
        status: part.status || 'active'
      }
    });
  },

  onPartFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`partForm.${field}`]: value
    });
  },

  closePartEditor() {
    this.setData({ showPartEditor: false });
  },

  async savePart() {
    const { editingPartId, partForm } = this.data;

    if (!partForm.name || !partForm.name.trim()) {
      wx.showToast({ title: '请输入备件名称', icon: 'none' });
      return;
    }

    if (partForm.quantity === '' || partForm.quantity < 0) {
      wx.showToast({ title: '请输入有效的库存数量', icon: 'none' });
      return;
    }

    if (partForm.unit_price === '' || partForm.unit_price < 0) {
      wx.showToast({ title: '请输入有效的单价', icon: 'none' });
      return;
    }

    try {
      if (editingPartId) {
        await this.request({
          url: `/api/super-admin/parts-inventory/${editingPartId}`,
          method: 'PUT',
          data: partForm
        });
        wx.showToast({ title: '备件更新成功', icon: 'success' });
      } else {
        await this.request({
          url: '/api/super-admin/parts-inventory',
          method: 'POST',
          data: partForm
        });
        wx.showToast({ title: '备件添加成功', icon: 'success' });
      }

      this.closePartEditor();
      this.loadPartsInventory();
    } catch (err) {
      // 错误已在request中处理
    }
  },

  deletePart(e) {
    const { partId } = e.currentTarget.dataset;
    this.showConfirmDialog('确认删除', '确定要删除该备件吗？此操作不可撤销。', async () => {
      try {
        await this.request({
          url: `/api/super-admin/parts-inventory/${partId}`,
          method: 'DELETE'
        });
        wx.showToast({ title: '删除成功', icon: 'success' });
        this.loadPartsInventory();
      } catch (err) {
        // 错误已在request中处理
      }
    });
  },

  // ===================== 维修人员 =====================

  async loadTechnicians() {
    if (this.data.loading) return;
    this.setData({ loading: true, loadingText: '加载维修人员...' });

    try {
      const res = await this.request({ url: '/api/super-admin/technicians' });
      // 处理维修人员数据,添加统计信息
      const technicians = (res.data.technicians || []).map(tech => ({
        ...tech,
        processing_orders: tech.stats?.active_orders || 0,
        completed_orders: tech.stats?.completed_orders || 0,
        total_orders: tech.stats?.total_orders || 0
      }));
      this.setData({
        technicians: technicians,
        technicianTotal: res.data.total || 0
      });
    } catch (err) {
      console.error('加载维修人员失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  callTechnician(e) {
    const { phone } = e.currentTarget.dataset;
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone });
    }
  },

  // ===================== 用户管理 =====================

  onUserStatClick() {
    this.setData({ showUserList: true });
    this.loadUsers(1);
  },

  async loadUsers(page = 1) {
    if (this.data.loading) return;
    this.setData({ loading: true, userPage: page });

    try {
      const res = await this.request({
        url: '/api/super-admin/users',
        data: {
          page: page,
          pageSize: this.data.userPageSize,
          role: this.data.userRoleFilter,
          keyword: this.data.userKeyword
        }
      });
      this.setData({
        users: res.data.users,
        userTotal: res.data.total
      });
    } catch (err) {
      console.error('加载用户列表失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  closeUserList() {
    this.setData({ showUserList: false });
  },

  onUserSearch() {
    this.loadUsers(1);
  },

  onUserSearchInput(e) {
    this.setData({ userKeyword: e.detail.value });
  },

  onClearUserSearch() {
    this.setData({ userKeyword: '' });
    this.loadUsers(1);
  },

  onUserRoleFilter(e) {
    const role = e.currentTarget.dataset.role;
    this.setData({ userRoleFilter: role });
    this.loadUsers(1);
  },

  onChangeUserRole(e) {
    const userId = e.currentTarget.dataset.id;
    const currentRole = e.currentTarget.dataset.role;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const roleText = newRole === 'admin' ? '管理员' : '普通用户';

    this.showConfirmDialog('修改角色', `确定要将该用户角色改为"${roleText}"吗？`, async () => {
      try {
        await this.request({
          url: `/api/super-admin/users/${userId}/role`,
          method: 'PUT',
          data: { role: newRole }
        });
        wx.showToast({ title: '修改成功', icon: 'success' });
        this.loadUsers(this.data.userPage);
      } catch (err) {
        // 错误已在request中处理
      }
    });
  },

  onToggleUserStatus(e) {
    const userId = e.currentTarget.dataset.id;
    const currentStatus = e.currentTarget.dataset.status;
    const newStatus = currentStatus === 1 ? 0 : 1;
    const action = newStatus === 0 ? '禁用' : '启用';

    this.showConfirmDialog(`${action}用户`, `确定要${action}该用户吗？`, async () => {
      try {
        await this.request({
          url: `/api/super-admin/users/${userId}/status`,
          method: 'PUT',
          data: { status: newStatus }
        });
        wx.showToast({ title: `已${action}`, icon: 'success' });
        this.loadUsers(this.data.userPage);
      } catch (err) {
        // 错误已在request中处理
      }
    });
  },

  loadPrevUserPage() {
    if (this.data.userPage > 1) {
      this.loadUsers(this.data.userPage - 1);
    }
  },

  loadNextUserPage() {
    const totalPages = Math.ceil(this.data.userTotal / this.data.userPageSize);
    if (this.data.userPage < totalPages) {
      this.loadUsers(this.data.userPage + 1);
    }
  },

  // ===================== 工单列表弹窗 =====================

  onOrderStatClick(e) {
    const status = e.currentTarget.dataset.status || 'all';
    this.setData({
      orderListFilter: status,
      statusFilter: status === 'all' ? '' : status,
      currentPage: 'orders'
    });
    this.loadOrders(1);
  },

  closeOrderList() {
    this.setData({ showOrderList: false });
  },

  onOrderStatusFilter(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ orderListFilter: status, statusFilter: status });
    this.loadOrders(1);
  },

  onUpdateOrderStatus(e) {
    const orderId = e.currentTarget.dataset.id;
    const newStatus = e.currentTarget.dataset.status;
    const statusText = STATUS_MAP[newStatus] || newStatus;

    this.showConfirmDialog('更新工单状态', `确定要将工单状态改为"${statusText}"吗？`, async () => {
      try {
        await this.request({
          url: `/api/super-admin/repair-orders/${orderId}/status`,
          method: 'PUT',
          data: { status: newStatus }
        });
        wx.showToast({ title: '更新成功', icon: 'success' });
        this.loadOrders(this.data.orderPage);
      } catch (err) {
        // 错误已在request中处理
      }
    });
  },

  // ===================== 工具方法 =====================

  formatPrice(price) {
    if (price === null || price === undefined || price === '') return '0.00';
    const num = parseFloat(price);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  },

  getStatusText(status) {
    return STATUS_MAP[status] || status || '未知';
  },

  getStatusColor(status) {
    return STATUS_COLOR_MAP[status] || '#999';
  },

  getDeviceTypeName(typeId) {
    if (typeId === null || typeId === undefined || typeId === '') return '未知';
    if (typeof typeId === 'string' && isNaN(Number(typeId))) return typeId;
    if (Number(typeId) === 0) return '自定义设备';
    return DEVICE_TYPE_MAP[Number(typeId)] || `设备(${typeId})`;
  },

  showConfirmDialog(title, content, action) {
    this.setData({
      showConfirm: true,
      confirmTitle: title,
      confirmContent: content,
      confirmAction: action
    });
  },

  onConfirmOk() {
    this.setData({ showConfirm: false });
    if (typeof this.data.confirmAction === 'function') {
      this.data.confirmAction();
    }
  },

  onConfirmCancel() {
    this.setData({ showConfirm: false });
  },

  formatTime(date) {
    const pad = (n) => n < 10 ? `0${n}` : n;
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n) => n < 10 ? `0${n}` : n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },

  copyText(e) {
    const text = e.currentTarget.dataset.text;
    if (text) {
      wx.setClipboardData({ data: String(text) });
    }
  },

  makeCall(e) {
    const phone = e.currentTarget.dataset.phone;
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone });
    }
  },

  previewImage(e) {
    const current = e.currentTarget.dataset.url;
    const urls = e.currentTarget.dataset.urls;
    if (current && urls) {
      wx.previewImage({ current, urls });
    }
  },

  // ===================== 进度申请管理 =====================

  // 检查待处理申请数量（红点提醒）
  async checkPendingApplyCount() {
    try {
      const res = await this.request({ url: '/api/progress-apply/statistics' });
      if (res && (res.success || res.code === 200)) {
        const stats = res.data || {};
        this.setData({ pendingApplyCount: stats.pending || 0, approvedApplyCount: stats.approved || 0 });
      }
    } catch (err) {
      // 静默失败，不影响其他功能
    }
  },

  async loadProgressApplies(page) {
    if (this.data.paLoading) return;
    const safePage = (page && page.currentTarget && page.currentTarget.dataset)
      ? Number(page.currentTarget.dataset.page || 1)
      : Number(page || this.data.paPage || 1);

    if (safePage === 1) {
      this.setData({ paPage: 1, paHasMore: true });
    }

    if (!this.data.paHasMore && safePage > 1) return;
    this.setData({ paLoading: true, paPage: safePage });

    try {
      const params = {
        page: safePage,
        pageSize: this.data.paPageSize,
      };
      if (this.data.paStatusFilter) {
        params.approval_status = this.data.paStatusFilter;
      }

      const res = await this.request({ url: '/api/progress-apply', data: params });

      if (res && (res.success || res.code === 200)) {
        const data = res.data || {};
        const list = data.list || [];

        const STATUS_MAP = {
          pending: { label: '待审核', color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
          approved: { label: '已通过', color: '#10b981', bg: '#d1fae5', icon: '✅' },
          rejected: { label: '已拒绝', color: '#ef4444', bg: '#fee2e2', icon: '❌' }
        };
        const PROGRESS_TYPE_MAP = {
          parts_waiting: '配件等待',
          repairing: '维修中',
          testing: '测试中',
          other: '其他'
        };

        const items = list.map(item => {
          const statusConfig = STATUS_MAP[item.approval_status] || STATUS_MAP.pending;
          return {
            ...item,
            statusLabel: statusConfig.label,
            statusColor: statusConfig.color,
            statusBg: statusConfig.bg,
            statusIcon: statusConfig.icon,
            progressTypeText: PROGRESS_TYPE_MAP[item.progress_type] || item.progress_type,
            createdAt: this._paFormatTime(item.created_at),
            userName: item.user_name || item.user_nickname || '用户' + item.user_id
          };
        });

        this.setData({
          paList: safePage === 1 ? items : [...this.data.paList, ...items],
          paTotal: data.total || 0,
          paHasMore: items.length >= this.data.paPageSize
        });

        // 单独加载统计数据
        this.loadPaStats();
      }
    } catch (err) {
      console.error('加载进度申请失败:', err);
    } finally {
      this.setData({ paLoading: false });
    }
  },

  _paFormatTime(str) {
    if (!str) return '';
    try {
      const d = new Date(str);
      if (isNaN(d.getTime())) return str;
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
      return str;
    }
  },

  // 加载进度申请统计
  async loadPaStats() {
    try {
      const res = await this.request({ url: '/api/progress-apply/statistics' });
      if (res && (res.success || res.code === 200)) {
        const stats = res.data || {};
        this.setData({
          paStats: {
            total: stats.total || 0,
            pending: stats.pending || 0,
            approved: stats.approved || 0,
            rejected: stats.rejected || 0
          },
          pendingApplyCount: stats.pending || 0,
          approvedApplyCount: stats.approved || 0
        });
      }
    } catch (err) {
      console.error('加载统计数据失败:', err);
    }
  },

  onPaFilterChange(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ paStatusFilter: status }, () => {
      this.loadProgressApplies(1);
    });
  },

  onPaViewOrder(e) {
    const orderId = e.currentTarget.dataset.orderid;
    if (orderId) {
      const order = this.data.orders.find(o => o.id == orderId);
      if (order) {
        this.viewOrderDetail(e);
      } else {
        wx.navigateTo({
          url: `/pages/order-detail/order-detail?orderId=${orderId}`
        });
      }
    }
  },

  onPaViewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/progress-apply-create/progress-apply-create?id=${id}&view=1`
    });
  },

  // 打开审批通过弹窗
  onPaOpenApprove(e) {
    const id = e.currentTarget.dataset.id;
    const apply = this.data.paList.find(a => a.id == id);
    if (!apply) return;
    this.setData({
      paShowApproveModal: true,
      paCurrentApply: apply,
      paApproveRemark: ''
    });
  },

  onPaCloseApprove() {
    this.setData({
      paShowApproveModal: false,
      paCurrentApply: null,
      paApproveRemark: ''
    });
  },

  onPaApproveRemarkInput(e) {
    this.setData({ paApproveRemark: e.detail.value });
  },

  async onPaSubmitApprove() {
    if (!this.data.paCurrentApply) return;
    this.setData({ paProcessing: true });
    wx.showLoading({ title: '处理中...', mask: true });

    try {
      const res = await this.request({
        url: `/api/progress-apply/${this.data.paCurrentApply.id}/approve`,
        method: 'POST',
        data: { approval_remark: this.data.paApproveRemark }
      });

      wx.hideLoading();

      if (res && (res.success || res.code === 200)) {
        wx.showToast({ title: '审批通过', icon: 'success' });
        this.onPaCloseApprove();
        this.loadProgressApplies(1);
        this.checkPendingApplyCount();
      } else {
        wx.showToast({ title: res?.error || res?.message || '操作失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('审批通过失败:', err);
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      this.setData({ paProcessing: false });
    }
  },

  // 打开拒绝弹窗
  onPaOpenReject(e) {
    const id = e.currentTarget.dataset.id;
    const apply = this.data.paList.find(a => a.id == id);
    if (!apply) return;
    this.setData({
      paShowRejectModal: true,
      paCurrentApply: apply,
      paRejectRemark: ''
    });
  },

  onPaCloseReject() {
    this.setData({
      paShowRejectModal: false,
      paCurrentApply: null,
      paRejectRemark: ''
    });
  },

  onPaRejectRemarkInput(e) {
    this.setData({ paRejectRemark: e.detail.value });
  },

  async onPaSubmitReject() {
    if (!this.data.paCurrentApply) {
      wx.showToast({ title: '请选择申请', icon: 'none' });
      return;
    }
    if (!this.data.paRejectRemark.trim()) {
      wx.showToast({ title: '请填写拒绝原因', icon: 'none' });
      return;
    }

    this.setData({ paProcessing: true });
    wx.showLoading({ title: '处理中...', mask: true });

    try {
      const res = await this.request({
        url: `/api/progress-apply/${this.data.paCurrentApply.id}/reject`,
        method: 'POST',
        data: { approval_remark: this.data.paRejectRemark.trim() }
      });

      wx.hideLoading();

      if (res && (res.success || res.code === 200)) {
        wx.showToast({ title: '已拒绝', icon: 'success' });
        this.onPaCloseReject();
        this.loadProgressApplies(1);
        this.checkPendingApplyCount();
      } else {
        wx.showToast({ title: res?.error || res?.message || '操作失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('拒绝失败:', err);
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      this.setData({ paProcessing: false });
    }
  },

  // ===================== 售后管理 =====================

  // 检查待处理售后数量（红点提醒）
  async checkPendingAfterSalesCount() {
    try {
      const res = await this.request({ url: '/api/after-sales/requests/stats' });
      if (res && (res.success || res.code === 200)) {
        const stats = res.data || {};
        this.setData({
          asStats: {
            total: stats.total || 0,
            pending: stats.pending || 0,
            processing: stats.processing || 0,
            resolved: stats.resolved || 0,
            rejected: stats.rejected || 0
          },
          pendingAfterSalesCount: (stats.pending || 0) + (stats.processing || 0)
        });
      }
    } catch (err) {
      // 静默失败，不影响其他功能
    }
  },

  async loadAfterSales(page) {
    if (this.data.asLoading) return;
    const safePage = (page && page.currentTarget && page.currentTarget.dataset)
      ? Number(page.currentTarget.dataset.page || 1)
      : Number(page || this.data.asPage || 1);

    if (safePage === 1) {
      this.setData({ asPage: 1, asHasMore: true });
    }
    if (!this.data.asHasMore && safePage > 1) return;
    this.setData({ asLoading: true, asPage: safePage });

    try {
      const params = { page: safePage, pageSize: this.data.asPageSize };
      if (this.data.asStatusFilter) params.status = this.data.asStatusFilter;

      const res = await this.request({ url: '/api/after-sales/requests', data: params });
      if (res && (res.success || res.code === 200)) {
        const data = res.data || {};
        const baseUrl = this.getApiBaseUrl();
        const list = (data.list || []).map(item => {
          let imgs = [];
          try { imgs = Array.isArray(item.images) ? item.images : (item.images ? JSON.parse(item.images) : []); } catch (e) { imgs = []; }
          imgs = imgs.map(img => {
            const url = typeof img === 'string' ? img : (img.url || '');
            return url.startsWith('http') ? url : (baseUrl + url);
          });
          return {
            ...item,
            images: imgs,
            statusLabel: item.status_label,
            statusColor: item.status_color,
            statusBg: item.status_bg,
            statusIcon: item.status_icon,
            typeText: item.type_text,
            applicantName: item.applicant_name,
            createdAt: this._asFormatTime(item.created_at),
            resolvedAt: item.resolved_at ? this._asFormatTime(item.resolved_at) : ''
          };
        });

        this.setData({
          afterSalesList: safePage === 1 ? list : [...this.data.afterSalesList, ...list],
          asTotal: data.total || 0,
          asHasMore: list.length >= this.data.asPageSize
        });
        this.loadAsStats();
      }
    } catch (err) {
      console.error('加载售后列表失败:', err);
    } finally {
      this.setData({ asLoading: false });
    }
  },

  _asFormatTime(str) {
    if (!str) return '';
    try {
      const d = new Date(str);
      if (isNaN(d.getTime())) return str;
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
      return str;
    }
  },

  async loadAsStats() {
    try {
      const res = await this.request({ url: '/api/after-sales/requests/stats' });
      if (res && (res.success || res.code === 200)) {
        const stats = res.data || {};
        this.setData({
          asStats: {
            total: stats.total || 0,
            pending: stats.pending || 0,
            processing: stats.processing || 0,
            resolved: stats.resolved || 0,
            rejected: stats.rejected || 0
          },
          pendingAfterSalesCount: (stats.pending || 0) + (stats.processing || 0)
        });
      }
    } catch (err) {
      console.error('加载售后统计失败:', err);
    }
  },

  onAsFilterChange(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ asStatusFilter: status }, () => {
      this.loadAfterSales(1);
    });
  },

  onAsOpenResolve(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.afterSalesList.find(a => a.id == id);
    if (!item) return;
    this.setData({ asShowResolveModal: true, asCurrent: item, asResolveRemark: '' });
  },

  onAsCloseResolve() {
    this.setData({ asShowResolveModal: false, asCurrent: null, asResolveRemark: '' });
  },

  onAsResolveRemarkInput(e) {
    this.setData({ asResolveRemark: e.detail.value });
  },

  async onAsSubmitResolve() {
    if (!this.data.asCurrent) return;
    this.setData({ asProcessing: true });
    wx.showLoading({ title: '处理中...', mask: true });
    try {
      const res = await this.request({
        url: `/api/after-sales/requests/${this.data.asCurrent.id}/resolve`,
        method: 'POST',
        data: { admin_remark: this.data.asResolveRemark }
      });
      wx.hideLoading();
      if (res && (res.success || res.code === 200)) {
        wx.showToast({ title: '已解决', icon: 'success' });
        this.onAsCloseResolve();
        this.loadAfterSales(1);
        this.checkPendingAfterSalesCount();
      } else {
        wx.showToast({ title: res?.error || res?.message || '操作失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('解决售后失败:', err);
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      this.setData({ asProcessing: false });
    }
  },

  onAsOpenReject(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.afterSalesList.find(a => a.id == id);
    if (!item) return;
    this.setData({ asShowRejectModal: true, asCurrent: item, asRejectRemark: '' });
  },

  onAsCloseReject() {
    this.setData({ asShowRejectModal: false, asCurrent: null, asRejectRemark: '' });
  },

  onAsRejectRemarkInput(e) {
    this.setData({ asRejectRemark: e.detail.value });
  },

  async onAsSubmitReject() {
    if (!this.data.asCurrent) {
      wx.showToast({ title: '请选择申请', icon: 'none' });
      return;
    }
    if (!this.data.asRejectRemark.trim()) {
      wx.showToast({ title: '请填写拒绝原因', icon: 'none' });
      return;
    }
    this.setData({ asProcessing: true });
    wx.showLoading({ title: '处理中...', mask: true });
    try {
      const res = await this.request({
        url: `/api/after-sales/requests/${this.data.asCurrent.id}/reject`,
        method: 'POST',
        data: { admin_remark: this.data.asRejectRemark.trim() }
      });
      wx.hideLoading();
      if (res && (res.success || res.code === 200)) {
        wx.showToast({ title: '已拒绝', icon: 'success' });
        this.onAsCloseReject();
        this.loadAfterSales(1);
        this.checkPendingAfterSalesCount();
      } else {
        wx.showToast({ title: res?.error || res?.message || '操作失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('拒绝售后失败:', err);
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      this.setData({ asProcessing: false });
    }
  },

  // ===================== 人工客服实时通知 =====================

  getAdminSocketUrl() {
    const baseUrl = this.getApiBaseUrl();
    return baseUrl.replace(/^http/i, 'ws').replace(/\/+$/, '') + '/ws/chat';
  },

  connectAdminSocket() {
    this.closeAdminSocket();

    const socketTask = wx.connectSocket({
      url: this.getAdminSocketUrl()
    });

    this._adminSocketTask = socketTask;

    socketTask.onOpen(() => {
      console.log('[super-admin] WebSocket 连接成功');
      this.setData({ adminSocketConnected: true });

      const adminInfo = this.data.adminInfo || {};
      socketTask.send({
        data: JSON.stringify({
          type: 'auth_admin',
          adminId: String(adminInfo.id || ''),
          adminName: adminInfo.real_name || adminInfo.nickname || '超级管理员'
        })
      });
    });

    socketTask.onMessage((event) => {
      try {
        const payload = JSON.parse(event.data);
        this.handleAdminSocketMessage(payload);
      } catch (error) {
        console.error('[super-admin] 解析 WebSocket 消息失败:', error);
      }
    });

    socketTask.onClose(() => {
      console.log('[super-admin] WebSocket 连接关闭');
      this.setData({ adminSocketConnected: false });
    });

    socketTask.onError((error) => {
      console.error('[super-admin] WebSocket 连接错误:', error);
      this.setData({ adminSocketConnected: false });
    });
  },

  closeAdminSocket() {
    if (this._adminSocketTask) {
      try {
        this._adminSocketTask.close({});
      } catch (error) {}
      this._adminSocketTask = null;
    }
    this.setData({ adminSocketConnected: false });
  },

  handleAdminSocketMessage(payload) {
    if (!payload) return;

    if (payload.type === 'new_transfer') {
      // 有新转人工请求，更新提示
      console.log('[super-admin] 收到新转人工请求:', payload.conversationId);
      wx.showToast({
        title: '有新的转人工请求!',
        icon: 'none',
        duration: 3000
      });
      this.checkPendingHumanServiceCount();
    } else if (payload.type === 'queue_updated') {
      // 队列更新，刷新未处理计数
      this.checkPendingHumanServiceCount();
    }
  },

  async checkPendingHumanServiceCount() {
    try {
      const res = await this.request({
        url: '/api/admin/service/pending-count'
      });
      if (res && (res.success || res.code === 200)) {
        const count = (res.data && res.data.count) || 0;
        this.setData({ pendingHumanServiceCount: count });
      }
    } catch (error) {
      // 静默失败，不影响其他功能
    }
  },

  logout() {
    this.showConfirmDialog('退出登录', '确定要退出超级管理员账号吗？', () => {
      this.closeAdminSocket();
      wx.removeStorageSync('token');
      wx.removeStorageSync('userInfo');
      wx.reLaunch({ url: '/pages/home/home' });
    });
  }
});
