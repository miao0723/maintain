// pages/order-detail/order-detail.js
const app = getApp()
const { orderApi, diagnoseApi } = require('../../utils/api.js')
const { isProgressUnread, getProgressStamp, syncProgressUnreadState } = require('../../utils/progressUnread.js')

Page({
  data: {
    orderId: null,
    loading: true,
    error: '',
    quoteSubmitting: false,
    paymentSubmitting: false,
    rejectSubmitting: false,
    progressUnread: 0,
    progressUpdatedAt: '',

    // ===== 统一后的展示字段（JS中映射好，WXML直接读取） =====
    orderNo: '',           // 订单号
    orderTypeText: '',     // 订单类型文案
    orderType: '',         // repair / recycle
    isRecycle: false,      // 是否为回收订单
    orderStatus: '',       // 订单状态
    statusText: '',        // 状态文案
    statusIcon: '',        // 状态图标
    statusColor: '',       // 状态颜色
    priorityText: '',      // 优先级文案
    priority: '',          // low / medium / high

    createdAt: '',         // 创建时间
    assignedAt: '',        // 分配时间
    updatedAt: '',         // 更新时间
    completedAt: '',       // 完成时间

    // 设备
    deviceTypeName: '',    // 设备类型名称
    deviceTypeIcon: '',    // 设备类型图标
    deviceModel: '',       // 设备型号
    brandName: '',         // 品牌
    deviceCondition: '',   // 成色

    // 问题描述
    problemDesc: '',

    // 服务方式
    serviceType: '',       // shop / home
    serviceTypeText: '',   // 到店维修 / 上门服务
    serviceTypeIcon: '',

    // 价格
    estimatedPrice: '',
    actualPrice: '',

    // 内部免付款申请：是否同意
    approvalText: '',
    approvalClass: '',
    approvalReason: '',

    // 进度
    progress: 0,

    // 图片
    images: [],

    // 客户信息（从订单JOIN数据中提取）
    userId: 0,
    customerName: '',
    customerPhone: '',

    // 单位信息
    unitId: 0,
    unitName: '',
    unitContact: '',
    unitPhone: '',
    unitAddress: '',

    // 评价
    hasReview: false,
    reviewRating: 0,
    reviewStars: '',
    reviewComment: '',
    reviewImages: [],
    reviewTime: '',

    // 备注
    notes: '',

    // 报价信息
    quotePrice: '',
    quoteDescription: '',
    quoteFiles: [],
    quoteImageUrls: [],
    repairReportFiles: [],
    repairReportImageUrls: [],
    quoteStatus: '',
    quoteCreatedAt: '',
    quoteRejectedReason: '',
    paymentStatus: 'unpaid',
    paymentStatusText: '待支付',
    payAmount: '',
    isInternal: false,
    deviceSource: '',
    deviceSourceText: '',
    isAdminCreated: false,
    outTradeNo: '',

    // 代客订单：用户填写地址并确认
    showAddressModal: false,
    addressFormData: {
      contact_name: '',
      contact_phone: '',
      province: '',
      city: '',
      district: '',
      detail_address: ''
    },
    // 已有地址列表（供代客订单用户一键选用）
    addressList: [],
    showAddressPicker: false,
    addressSubmitting: false,
    paidAt: '',
    refundStatus: 'none',
    showRejectModal: false,
    rejectFormData: {
      reason: ''
    },

    // 配送信息
    deliveryStatus: '',
    deliveryStatusText: '',
    deliveryPersonName: '',
    deliveryPersonPhone: '',
    deliveryFee: '',
    deliveryAddress: '',
    deliveryAssignedAt: '',
    deliveryPickedAt: '',
    deliveryDeliveredAt: '',

    // 进度照片和视频
    progressPhotos: [],
    progressVideos: [],

    // 质保信息
    warrantyStatus: '',
    warrantyRemainingDays: 0,
    warrantyEndDate: '',
    warrantyType: '',
    isWarrantyOrder: false,

    // AI 故障诊断结论（内部维修订单"匹配信息"的一部分）
    diagnosis: null,
    diagnosing: false,
    diagnosisError: '',
    showDiagnosis: false
  },

  onLoad(options) {
    this._imageFallbackTried = {}
    const orderId = options.id || options.orderId
    // 校验 orderId：排除 null / undefined / NaN 等无效值
    if (orderId && orderId !== 'null' && orderId !== 'undefined' && !isNaN(Number(orderId))) {
      this.setData({ orderId: String(orderId) })
      this.loadOrderDetail()
    } else {
      this.setData({ loading: false, error: '缺少订单ID，请返回重试' })
      wx.showToast({ title: '订单ID无效', icon: 'none' })
    }
  },

  /**
   * 加载订单详情 - 一次请求获取全部数据
   */
  async loadOrderDetail() {
    this.setData({ loading: true })
    wx.showLoading({ title: '加载中...' })

    try {
      const token = wx.getStorageSync('token')

      // 并行：主订单 + 评价 + 进度照片 + 进度视频
      // 不使用数组解构，避免微信Babel编译器触发 @babel/runtime 依赖
      const promiseResults = await Promise.all([
        this.request(`/api/orders/${this.data.orderId}/detail`, 'GET', null, token),
        this.request(`/api/orders/${this.data.orderId}/review`, 'GET', null, token).catch(() => null),
        this.request(`/api/orders/${this.data.orderId}/progress-photos`, 'GET', null, token).catch(() => null),
        this.request(`/api/orders/${this.data.orderId}/progress-videos`, 'GET', null, token).catch(() => null)
      ])
      const orderRes = promiseResults[0]
      const reviewRes = promiseResults[1]
      const photosRes = promiseResults[2]
      const videosRes = promiseResults[3]

      if (!orderRes || !orderRes.success || !orderRes.data) {
        this.setData({ loading: false, error: '订单不存在或无权限' })
        wx.showToast({ title: orderRes?.error || '订单不存在', icon: 'none' })
        return
      }

      const raw = orderRes.data.order || {}
      // 兼容两种数据结构：新API在order对象中有device_type_name/device_type_icon，旧API在data.deviceType中
      const dt = orderRes.data.deviceType || {
        name: raw.device_type_name || raw.deviceTypeName,
        icon: raw.device_type_icon || raw.deviceTypeIcon
      }

      // 处理图片
      let images = raw.images || []
      if (typeof images === 'string') {
        try { images = JSON.parse(images) } catch (e) { images = [] }
      }
      if (!Array.isArray(images)) images = []

      // 处理评价
      let review = null
      if (reviewRes && reviewRes.success && reviewRes.data) {
        review = reviewRes.data
        let rImages = review.images || []
        if (typeof rImages === 'string') {
          try { rImages = JSON.parse(rImages) } catch (e) { rImages = [] }
        }
        if (!Array.isArray(rImages)) rImages = []
        review.images = rImages
      }

      // 字段映射：统一取值（兼容驼峰/下划线两种命名）
      const no = raw.orderNo || raw.order_id || raw.order_no || ''
      const status = raw.status || 'pending'
      const ot = raw.orderType || raw.order_type || 'repair'
      const isRecycle = ot === 'recycle'
      const sc = this._statusConfig(status, isRecycle)
      const pr = raw.priority || 'medium'
      const st = raw.serviceType || raw.service_type || ''
      const ep = raw.estimatedPrice || raw.estimated_price || ''
      const ap = raw.actualPrice || raw.actual_price || ''
      const dc = raw.deviceCondition || raw.device_condition || ''
      const prog = parseInt(raw.progress);
      // 状态优先：如果数据库 progress 为空或 <= 0，或订单已是最终状态，按状态自动推导
      // 注意：有些订单 progress 字段在状态流转后没更新（例如 confirmed→completed 但 progress 仍为 20）
      const FINAL_STATUSES = ['completed', 'review', 'cancelled']
      let autoProgress;
      if (isNaN(prog) || prog <= 0 || FINAL_STATUSES.includes(status)) {
        const STATUS_PROGRESS = {
          pending: 0,
          quoted: 10,
          confirmed: 20,
          processing: 50,
          completed: 100,
          review: 100,
          cancelled: 0
        };
        autoProgress = STATUS_PROGRESS[status] || 0;
      } else {
        autoProgress = prog;
      }

      // 处理报价文件
      let qFiles = [];
      if (raw.quote_files) {
        if (typeof raw.quote_files === 'string') {
          try { qFiles = JSON.parse(raw.quote_files); } catch (e) { qFiles = []; }
        } else if (Array.isArray(raw.quote_files)) {
          qFiles = raw.quote_files;
        }
      }
      qFiles = qFiles.map(file => ({
        ...file,
        url: this._normalizeMediaUrl(file.url)
      }));

      let repairReportFiles = [];
      if (raw.repair_report_files) {
        if (typeof raw.repair_report_files === 'string') {
          try { repairReportFiles = JSON.parse(raw.repair_report_files); } catch (e) { repairReportFiles = []; }
        } else if (Array.isArray(raw.repair_report_files)) {
          repairReportFiles = raw.repair_report_files;
        }
      }
      repairReportFiles = repairReportFiles.map(file => ({
        ...file,
        url: this._normalizeMediaUrl(file.url)
      }));

      // ===== 构建订单时间线（按状态驱动，确保包含 创建 / 进度 / 完成）=====
      // 说明：后端 assigned_at / completed_at 历史数据多为 NULL，故对缺失时间戳用
      // updated_at / progress_updated_at 兜底，保证已完成订单也能显示完整进度。
      const tlTypeLabel = isRecycle ? '回收' : '维修';
      const tlCreated = this._formatTime(raw.createdAt || raw.created_at);
      const tlAssigned = this._formatTime(raw.assignedAt || raw.assigned_at);
      const tlProgressAt = this._formatTime(raw.progress_updated_at) ||
        this._formatTime(raw.updatedAt || raw.updated_at);
      const tlCompleted = this._formatTime(raw.completedAt || raw.completed_at) ||
        (['completed', 'review'].includes(status) ? this._formatTime(raw.updatedAt || raw.updated_at) : '');

      const IN_PROGRESS_OR_DONE = ['processing', 'completed', 'review'];
      const isDone = ['completed', 'review'].includes(status);

      const timeline = [];
      if (tlCreated) {
        timeline.push({ dot: 'create', time: tlCreated, event: '订单创建' });
      }
      if (tlAssigned) {
        timeline.push({ dot: 'assign', time: tlAssigned, event: `分配${tlTypeLabel}人员` });
      }
      if (IN_PROGRESS_OR_DONE.includes(status) && tlProgressAt) {
        timeline.push({ dot: 'progress', time: tlProgressAt, event: `${tlTypeLabel}进行中` });
      }
      if (isDone && tlCompleted) {
        timeline.push({ dot: 'done', time: tlCompleted, event: `${tlTypeLabel}完成` });
      }

      this.setData({
        // 基本信息
        orderNo: no,
        orderTypeText: ot === 'recycle' ? '回收订单' : '维修订单',
        orderType: ot,
        isRecycle: isRecycle,
        orderStatus: status,
        statusText: sc.label,
        statusIcon: sc.icon,
        statusColor: sc.color,
        priorityText: pr === 'high' ? '高优先级' : pr === 'low' ? '低优先级' : '中优先级',

        // 时间线（动态生成：创建 / 进度 / 完成 等）
        timeline: timeline,
        priority: pr,

        // 时间
        createdAt: this._formatTime(raw.createdAt || raw.created_at),
        assignedAt: this._formatTime(raw.assignedAt || raw.assigned_at),
        updatedAt: this._formatTime(raw.updatedAt || raw.updated_at),
        completedAt: this._formatTime(raw.completedAt || raw.completed_at),

        // 设备
        deviceTypeName: dt.name || raw.deviceTypeName || '未知设备',
        deviceTypeIcon: dt.icon || raw.deviceTypeIcon || '📱',
        deviceModel: raw.deviceModel || raw.device_model || '',
        brandName: raw.brandName || raw.brand_name || (orderRes.data.brand && orderRes.data.brand.name) || '',
        deviceCondition: this._deviceConditionText(dc),

        // 质保信息（后端详情接口已附带）
        warrantyStatus: raw.warranty_status || '',
        warrantyRemainingDays: raw.warranty_remaining_days || 0,
        warrantyEndDate: raw.warranty_end_date || '',
        warrantyType: raw.warranty_type || '',
        isWarrantyOrder: !!raw.is_warranty,

        // 问题描述
        problemDesc: raw.problem_description || raw.custom_description || '暂无描述',

        // 服务方式
        serviceType: st,
        serviceTypeText: st === 'shop' ? '到店维修' : st === 'home' ? '上门服务' : '',
        serviceTypeIcon: st === 'shop' ? '🏪' : st === 'home' ? '🏠' : '',

        // 价格
        estimatedPrice: ep ? '¥' + ep : '',
        actualPrice: ap ? '¥' + ap : '待确定',

        // 内部免付款申请：是否同意
        approvalText: this._approvalText(status, !!raw.is_internal, raw.reject_reason),
        approvalClass: this._approvalClass(status, !!raw.is_internal, raw.reject_reason),
        approvalReason: raw.reject_reason || '',

        // 进度（根据状态自动推导）
        progress: autoProgress,
        progressUnread: Number(raw.progress_unread || 0),
        progressUpdatedAt: raw.progress_updated_at || raw.progressUpdatedAt || '',

        // 图片
        images: images,

        // 客户信息
        userId: raw.userId || raw.user_id || 0,
        customerName: raw.userName || raw.user_name || '未知用户',
        customerPhone: raw.userPhone || raw.user_phone || '',

        // 单位信息
        unitId: raw.unitId || raw.unit_id || 0,
        unitName: raw.unitName || raw.unit_name || '',
        unitContact: raw.unitContact || raw.unit_contact || '',
        unitPhone: raw.unitPhone || raw.unit_phone || '',
        unitAddress: raw.unitAddress || raw.unit_address || '',

        // 评价
        hasReview: !!review,
        reviewRating: review ? review.rating || 0 : 0,
        reviewStars: review && review.rating ? '⭐'.repeat(review.rating) : '',
        reviewComment: review ? review.comment || '' : '',
        reviewImages: review ? review.images || [] : [],
        reviewTime: this._formatTime(review ? review.created_at : ''),

        // 备注
        notes: raw.notes || raw.remark || '',

        // 报价信息
        quotePrice: raw.quote_price ? '¥' + raw.quote_price : '',
        quoteDescription: raw.quote_description || '',
        quoteFiles: qFiles,
        quoteImageUrls: qFiles.filter(file => file.type === 'image' && file.url).map(file => file.url),
        repairReportFiles: repairReportFiles,
        repairReportImageUrls: repairReportFiles.filter(file => file.type === 'image' && file.url).map(file => file.url),
        quoteStatus: raw.quote_status || '',
        quoteCreatedAt: this._formatTime(raw.quote_created_at),
        quoteRejectedReason: raw.quote_rejected_reason || '',
        paymentStatus: raw.payment_status || 'unpaid',
        paymentStatusText: this._paymentStatusText(raw.payment_status || 'unpaid'),
        payAmount: raw.pay_amount ? '¥' + raw.pay_amount : '',
        isInternal: !!raw.is_internal,
        deviceSource: raw.device_source || raw.deviceSource || '',
        deviceSourceText: ({
          project_return: '项目返修',
          warehouse: '仓库',
          fixed_asset: '固定资产'
        })[raw.device_source || raw.deviceSource] || '',
        // 内部申请被驳回时展示驳回原因
        rejectReason: raw.reject_reason || '',
        isAdminCreated: !!raw.is_admin_created,
        outTradeNo: raw.out_trade_no || '',
        paidAt: this._formatTime(raw.paid_at),
        refundStatus: raw.refund_status || 'none',

        // 配送信息
        deliveryStatus: raw.delivery_status || '',
        deliveryStatusText: this._deliveryStatusText(raw.delivery_status),
        deliveryPersonName: raw.delivery_person_name || '',
        deliveryPersonPhone: raw.delivery_person_phone || '',
        deliveryFee: raw.delivery_fee ? '¥' + raw.delivery_fee : '',
        deliveryAddress: raw.delivery_address || '',
        deliveryAssignedAt: this._formatTime(raw.delivery_assigned_at),
        deliveryPickedAt: this._formatTime(raw.delivery_picked_at),
        deliveryDeliveredAt: this._formatTime(raw.delivery_delivered_at),

        loading: false,
        error: '',

        // 进度照片和视频
        progressPhotos: this._processProgressPhotos(photosRes?.data || []),
        progressVideos: this._processProgressVideos(videosRes?.data || [])
      })

      // 标记进度为已读
      this.markProgressRead()
      // 内部维修订单：自动拉取 AI 故障诊断结论（"匹配信息"的一部分）
      if (this.data.isInternal && !this.data.isRecycle) {
        this._loadAiDiagnosis()
      }
      if (status === 'quoted' || raw.quote_unread) {
        this.markQuoteRead()
      }
    } catch (error) {
      console.error('加载订单详情失败:', error)
      this.setData({ loading: false, error: '网络异常，请重试' })
      wx.showToast({ title: '加载失败，请检查网络', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // ===== 工具方法 =====

  _statusConfig(status, isRecycle) {
    const desc = status === 'processing' ? (isRecycle ? '正在回收处理' : '正在维修处理') :
                 status === 'completed' ? (isRecycle ? '回收完成' : '维修完成') : '';
    const map = {
      pending:    { icon: '⏳', label: '待处理', desc: '等待报价', color: '#f59e0b' },
      quoted:     { icon: '💰', label: '待确认报价', desc: '已报价，请确认', color: '#436f95' },
      confirmed:  { icon: '✅', label: '已确认报价', desc: '报价已确认，等待开始处理', color: '#06b6d4' },
      processing: { icon: isRecycle ? '♻️' : '🔧', label: isRecycle ? '回收中' : '维修中', desc: desc, color: isRecycle ? '#059669' : '#3b82f6' },
      completed:  { icon: '✅', label: '已完成', desc: desc, color: '#10b981' },
      review:     { icon: '⭐', label: '待评价', desc: '等待客户评价', color: '#9c27b0' },
      cancelled:  { icon: '❌', label: '已取消', desc: '订单已取消', color: '#ef4444' },
      internal_pending: { icon: '🏢', label: '内部申请待确认', desc: '内部免付款申请，等待管理员确认', color: '#d97706' },
      admin_created: { icon: '📝', label: '待填写地址', desc: '管理员已为您创建订单，请填写地址并支付', color: '#0891b2' }
    }
    return map[status] || { icon: '❓', label: '未知', desc: '', color: '#999' }
  },

  _paymentStatusText(status) {
    const map = {
      unpaid: '待支付',
      paying: '支付处理中',
      paid: '已支付',
      refunding: '退款中',
      refunded: '已退款',
      failed: '支付失败',
      waived: '免付款（内部订单）'
    }
    return map[status] || '未支付'
  },

  _deviceConditionText(cond) {
    const map = { good: '成色很好', normal: '成色一般', fair: '成色较差', poor: '成色很差' }
    return cond ? (map[cond] || cond) : ''
  },

  /**
   * 内部免付款申请：是否同意 - 文案
   */
  _approvalText(status, isInternal, rejectReason) {
    if (!isInternal) return ''
    if (status === 'internal_pending') return '待确认'
    if (status === 'cancelled') return rejectReason ? '已驳回' : '已撤回'
    return '已同意'
  },

  /**
   * 内部免付款申请：是否同意 - 样式类
   */
  _approvalClass(status, isInternal, rejectReason) {
    if (!isInternal) return ''
    if (status === 'internal_pending') return 'pending'
    if (status === 'cancelled') return 'rejected'
    return 'approved'
  },

  /**
   * 内部维修订单：调用 AI 故障诊断，结论作为"匹配信息"一部分展示
   * 用订单已有的设备类型 / 品牌 / 问题描述 作为输入
   */
  async _loadAiDiagnosis() {
    const deviceType = this.data.deviceTypeName || ''
    const brand = this.data.brandName || ''
    const symptom = this.data.problemDesc || ''
    if (!deviceType && !symptom) {
      // 没有可供诊断的信息，静默跳过
      this.setData({ showDiagnosis: false })
      return
    }

    this.setData({ showDiagnosis: true, diagnosing: true, diagnosisError: '', diagnosis: null })
    try {
      const res = await diagnoseApi.analyze({
        deviceType,
        brand,
        symptom,
        details: ''
      })
      const data = (res && (res.data || res)) || null
      if (data && (data.summary || (data.causes && data.causes.length))) {
        data.causes = Array.isArray(data.causes) ? data.causes : []
        this.setData({ diagnosing: false, diagnosis: data })
      } else {
        this.setData({ diagnosing: false, diagnosisError: '暂无诊断结论' })
      }
    } catch (error) {
      console.error('[OrderDetail] AI 诊断失败:', error)
      this.setData({ diagnosing: false, diagnosisError: '诊断获取失败，请重试' })
    }
  },

  /**
   * AI 诊断失败时点击重试
   */
  retryDiagnosis() {
    this._loadAiDiagnosis()
  },

  _deliveryStatusText(status) {
    const map = {
      pending: '待分配',
      assigned: '已分配',
      picked_up: '已取件',
      delivered: '已送达',
      cancelled: '已取消'
    }
    return status ? (map[status] || status) : ''
  },

  _formatTime(str) {
    if (!str) return ''
    try {
      const d = new Date(str)
      if (isNaN(d.getTime())) return str
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch (e) {
      return str
    }
  },

  // ===== 网络请求（带超时） =====

  request(url, method, data, token) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('请求超时')), 8000)
      wx.request({
        // 网关 /mp-api 已映射到后端 /api；路径不再重复写 /api，否则会变成 /mp-api/api/... 而 404
        url: (app.globalData.baseUrl || app.globalData.apiUrl) + (url.startsWith('/api/') ? url.slice(4) : url),
        method: method || 'GET',
        data: data,
        timeout: 8000,
        header: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          clearTimeout(timer)
          if (res.statusCode === 200) {
            resolve(res.data)
          } else {
            reject(res)
          }
        },
        fail: (err) => { clearTimeout(timer); reject(err) }
      })
    })
  },

  // ===== 交互方法 =====

  /**
   * 标记进度为已读
   */
  markProgressRead() {
    const token = wx.getStorageSync('token')
    if (!token || !this.data.orderId) return
    const detailSnapshot = {
      id: this.data.orderId,
      progress_unread: this.data.progressUnread,
      progress_updated_at: this.data.progressUpdatedAt
    }
    if (!isProgressUnread(detailSnapshot)) return
    this.request(`/api/orders/${this.data.orderId}/progress-read`, 'PUT', null, token)
      .then(() => {
        syncProgressUnreadState(this.data.orderId, getProgressStamp(detailSnapshot), { wasUnread: true })
        // 刷新tabbar角标（使用暴露的公共方法）
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
          this.getTabBar().refreshBadge()
        }
      })
      .catch(() => {})
  },

  /**
   * 标记报价为已读
   */
  markQuoteRead() {
    const token = wx.getStorageSync('token')
    if (!token || !this.data.orderId) return
    this.request(`/api/orders/${this.data.orderId}/quote-read`, 'PUT', null, token)
      .then(() => {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
          this.getTabBar().refreshBadge()
        }
      })
      .catch(() => {})
  },

  previewImage(e) {
    const current = e.currentTarget.dataset.current
    const urls = e.currentTarget.dataset.urls
    wx.previewImage({ current, urls })
  },

  copyOrderNo() {
    if (this.data.orderNo) {
      wx.setClipboardData({
        data: this.data.orderNo,
        success: () => wx.showToast({ title: '已复制', icon: 'success' })
      })
    }
  },

  callCustomer() {
    if (this.data.customerPhone) {
      wx.makePhoneCall({ phoneNumber: this.data.customerPhone })
    }
  },

  viewReview() {
    if (this.data.hasReview) {
      wx.showModal({
        title: `订单评价 ${this.data.reviewRating}分`,
        content: this.data.reviewComment || '暂无评价内容',
        showCancel: false
      })
    } else {
      wx.showToast({ title: '暂无评价', icon: 'none' })
    }
  },

  /**
   * 代客订单：打开填写地址弹窗（同时拉取已有地址，供用户一键选用）
   */
  openAddressModal() {
    // 预填当前用户信息作为默认值
    const userInfo = wx.getStorageSync('userInfo') || {}
    const phone = this.data.customerPhone || userInfo.phone || ''
    const name = this.data.customerName || userInfo.real_name || userInfo.nickname || ''
    this.setData({
      showAddressModal: true,
      addressSubmitting: false,
      addressFormData: {
        contact_name: name,
        contact_phone: phone,
        province: '',
        city: '',
        district: '',
        detail_address: ''
      }
    })
    // 拉取已有收货地址，用户可直接选用，无需重复填写
    this.loadMyAddresses()
  },

  /**
   * 加载用户已有收货地址列表（代客订单确认时可选）
   */
  async loadMyAddresses() {
    try {
      const { addressApi } = require('../../utils/api.js')
      const res = await addressApi.getList()
      if (Array.isArray(res)) {
        const list = res.map(a => ({
          id: a.id,
          contact_name: a.contact_name,
          contact_phone: a.contact_phone,
          province: a.province,
          city: a.city,
          district: a.district,
          detail_address: a.detail_address,
          is_default: a.is_default
        }))
        this.setData({ addressList: list })
      }
    } catch (e) {
      // 地址列表加载失败不阻断主流程，用户可手动填写
      console.warn('加载收货地址失败(已忽略):', e.message)
    }
  },

  /**
   * 打开已有地址选择面板
   */
  openAddressPicker() {
    if (this.data.addressList.length === 0) {
      wx.showToast({ title: '暂无已存地址，请手动填写', icon: 'none' })
      return
    }
    this.setData({ showAddressPicker: true })
  },

  closeAddressPicker() {
    this.setData({ showAddressPicker: false })
  },

  /**
   * 选用已有地址：填入表单，关闭选择面板
   */
  selectExistingAddress(e) {
    const id = e.currentTarget.dataset.id
    const addr = this.data.addressList.find(a => a.id === id)
    if (!addr) return
    this.setData({
      showAddressPicker: false,
      addressFormData: {
        contact_name: addr.contact_name,
        contact_phone: addr.contact_phone,
        province: addr.province,
        city: addr.city,
        district: addr.district,
        detail_address: addr.detail_address
      }
    })
  },

  closeAddressModal() {
    this.setData({ showAddressModal: false, addressSubmitting: false, showAddressPicker: false })
  },

  onAddressInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`addressFormData.${field}`]: e.detail.value })
  },

  /**
   * 代客订单：用户确认（填写地址）→ 进入待支付 → 发起支付
   */
  async submitAddressAndConfirm() {
    if (this.data.addressSubmitting) return
    const { contact_name, contact_phone, province, city, district, detail_address } = this.data.addressFormData

    if (!contact_name.trim()) { wx.showToast({ title: '请填写联系人', icon: 'none' }); return }
    if (!/^1[3-9]\d{9}$/.test(contact_phone)) { wx.showToast({ title: '手机号格式不正确', icon: 'none' }); return }
    if (!province.trim() || !city.trim() || !district.trim() || !detail_address.trim()) {
      wx.showToast({ title: '请填写完整地址', icon: 'none' }); return
    }

    // 若与已有地址完全一致，直接复用该地址ID（避免重复建地址）
    let matchedAddressId = null
    const hit = this.data.addressList.find(a =>
      a.contact_name === contact_name.trim() &&
      a.contact_phone === contact_phone.trim() &&
      a.province === province.trim() &&
      a.city === city.trim() &&
      a.district === district.trim() &&
      a.detail_address === detail_address.trim()
    )
    if (hit) matchedAddressId = hit.id

    this.setData({ addressSubmitting: true })
    wx.showLoading({ title: '提交中...', mask: true })
    try {
      const { userConfirmApi } = require('../../utils/api.js')
      const payload = matchedAddressId
        ? { address_id: matchedAddressId }
        : { address: { contact_name, contact_phone, province, city, district, detail_address } }
      const res = await userConfirmApi.confirmAdminOrder(this.data.orderId, payload)
      wx.hideLoading()
      if (!res || !res.success) {
        this.setData({ addressSubmitting: false })
        wx.showToast({ title: res?.error || '确认失败', icon: 'none' })
        return
      }
      this.setData({ showAddressModal: false })
      wx.showToast({ title: '已确认，请支付', icon: 'success' })
      await this.loadOrderDetail()
      // 自动发起支付
      this.startWechatPay()
    } catch (error) {
      wx.hideLoading()
      this.setData({ addressSubmitting: false })
      console.error('确认代客订单失败:', error)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
    }
  },

  backToList() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({
          url: '/pages/mine/mine'
        })
      }
    })
  },

  /**
   * 跳转到进度申请页面
   */
  goToProgressApply() {
    const orderId = this.data.orderId;
    if (orderId) {
      wx.navigateTo({
        url: `/pages/progress-apply-create/progress-apply-create?orderId=${orderId}`
      })
    }
  },

  /**
   * 打开拒绝报价弹窗
   */
  openRejectModal() {
    this.setData({
      showRejectModal: true,
      rejectFormData: { reason: '' }
    });
  },

  /**
   * 关闭拒绝报价弹窗
   */
  closeRejectModal() {
    this.setData({
      showRejectModal: false,
      rejectFormData: { reason: '' }
    });
  },

  /**
   * 拒绝原因输入
   */
  onRejectReasonInput(e) {
    this.setData({
      'rejectFormData.reason': e.detail.value
    });
  },

  /**
   * 接受报价
   */
  async acceptQuote() {
    if (this.data.quoteSubmitting) return;

    wx.showModal({
      title: '确认接受报价',
      content: `确认接受报价金额 ${this.data.quotePrice}？接受后维修人员将开始处理。`,
      success: async (res) => {
        if (!res.confirm) return;

        wx.showLoading({ title: '处理中...', mask: true });
        this.setData({ quoteSubmitting: true });

        try {
          const response = await this.request(`/api/orders/${this.data.orderId}/accept-quote`, 'PUT', null, wx.getStorageSync('token'));

          if (response && response.success) {
            wx.hideLoading();
            wx.showToast({ title: '已确认报价', icon: 'success' });
            this.loadOrderDetail();
          } else {
            wx.hideLoading();
            wx.showToast({ title: response?.error || '操作失败', icon: 'none' });
          }
        } catch (error) {
          wx.hideLoading();
          console.error('接受报价失败:', error);
          wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        } finally {
          this.setData({ quoteSubmitting: false });
        }
      }
    });
  },

  async startWechatPay() {
    if (this.data.paymentSubmitting) return;

    if (!this.data.orderId) {
      wx.showToast({ title: '订单信息异常', icon: 'none' })
      return
    }

    // 内部人员免付款订单无需支付
    if (this.data.isInternal || this.data.paymentStatus === 'waived') {
      wx.showToast({ title: '该订单为免付款内部订单', icon: 'none' })
      return
    }

    wx.showLoading({ title: '创建支付中...', mask: true })
    this.setData({ paymentSubmitting: true })
    try {
      const response = await orderApi.createPayment(this.data.orderId)
      wx.hideLoading()

      if (!response || !response.success) {
        wx.showToast({ title: response?.error || '创建支付失败', icon: 'none' })
        return
      }

      if (response.data?.alreadyPaid) {
        wx.showToast({ title: '订单已支付', icon: 'success' })
        this.loadOrderDetail()
        return
      }

      const payParams = response.data?.payParams || {}
      wx.requestPayment({
        timeStamp: payParams.timeStamp,
        nonceStr: payParams.nonceStr,
        package: payParams.package,
        signType: payParams.signType || 'RSA',
        paySign: payParams.paySign,
        success: async () => {
          await this.refreshPaymentStatus(true)
        },
        fail: async (err) => {
          console.error('微信支付失败:', err)
          if (err && err.errMsg && err.errMsg.includes('cancel')) {
            wx.showToast({ title: '已取消支付', icon: 'none' })
          } else {
            wx.showToast({ title: '支付未完成', icon: 'none' })
          }
          await this.refreshPaymentStatus(false)
        }
      })
    } catch (error) {
      wx.hideLoading()
      console.error('发起支付失败:', error)
      wx.showToast({ title: '发起支付失败', icon: 'none' })
    } finally {
      this.setData({ paymentSubmitting: false })
    }
  },

  /**
   * 撤回内部免付款申请（管理员尚未确认前可撤回）
   */
  async withdrawInternalOrder() {
    const orderId = this.data.orderId
    if (!orderId) return

    wx.showModal({
      title: '撤回内部申请',
      content: '确定要撤回该内部免付款申请吗？撤回后需重新提交。',
      confirmText: '撤回',
      cancelText: '再想想',
      success: async (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '撤回中...', mask: true })
        try {
          const response = await orderApi.cancelOrder(orderId)
          wx.hideLoading()
          if (response && response.success) {
            wx.showToast({ title: '已撤回申请', icon: 'success' })
            this.loadOrderDetail()
          } else {
            wx.showToast({ title: response?.message || '撤回失败', icon: 'none' })
          }
        } catch (e) {
          wx.hideLoading()
          console.error('撤回内部申请失败:', e)
          wx.showToast({ title: '撤回失败', icon: 'none' })
        }
      }
    })
  },

  async refreshPaymentStatus(showSuccessToast) {
    try {
      const response = await orderApi.queryPaymentStatus(this.data.orderId)
      if (response && response.success) {
        const paymentStatus = response.data?.paymentStatus || 'unpaid'
        if (paymentStatus === 'paid' && showSuccessToast) {
          wx.showToast({ title: '支付成功', icon: 'success' })
        }
        this.loadOrderDetail()
      } else {
        wx.showToast({ title: response?.error || '支付状态刷新失败', icon: 'none' })
      }
    } catch (error) {
      console.error('刷新支付状态失败:', error)
      this.loadOrderDetail()
    }
  },

  /**
   * 拒绝报价
   */
  async submitReject() {
    if (this.data.rejectSubmitting) return;

    if (!this.data.rejectFormData.reason.trim()) {
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
        this.setData({ rejectSubmitting: true });

        try {
          const response = await this.request(
            `/api/orders/${this.data.orderId}/reject-quote`,
            'PUT',
            { reason: this.data.rejectFormData.reason },
            wx.getStorageSync('token')
          );

          if (response && response.success) {
            wx.hideLoading();
            wx.showToast({ title: '已拒绝报价', icon: 'success' });
            this.closeRejectModal();
            this.loadOrderDetail();
          } else {
            wx.hideLoading();
            wx.showToast({ title: response?.error || '操作失败', icon: 'none' });
          }
        } catch (error) {
          wx.hideLoading();
          console.error('拒绝报价失败:', error);
          wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        } finally {
          this.setData({ rejectSubmitting: false });
        }
      }
    });
  },

  /**
   * 打开文件
   */
  openFile(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({ title: '文件地址无效', icon: 'none' });
      return;
    }

    const fullUrl = /^https?:\/\//i.test(url) ? url : (app.globalData.baseUrl + url);
    wx.showLoading({ title: '打开中...' });
    wx.downloadFile({
      url: fullUrl,
      success: (res) => {
        wx.hideLoading();
        wx.openDocument({
          filePath: res.tempFilePath,
          fail: () => {
            wx.showToast({ title: '打开文件失败', icon: 'none' });
          }
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '下载文件失败', icon: 'none' });
      }
    });
  },

  /**
   * 处理进度照片数据
   */
  _processProgressPhotos(photos) {
    if (!Array.isArray(photos)) return []

    return photos.map(photo => {
      // 处理images字段
      let images = photo.images || []
      if (typeof images === 'string') {
        try {
          images = JSON.parse(images)
        } catch (e) {
          images = []
        }
      }
      if (!Array.isArray(images)) images = []

      // 给图片URL加上baseUrl前缀（小程序需要完整URL才能加载）
      images = images.map(img => this._normalizeMediaUrl(img)).filter(Boolean)

      return {
        id: photo.id,
        order_id: photo.order_id,
        description: photo.description || '',
        images: images,
        uploaded_by: photo.uploaded_by || 0,
        uploaded_by_name: photo.uploaded_by_name || '未知上传人',
        created_at: this._formatTime(photo.created_at),
        updated_at: this._formatTime(photo.updated_at)
      }
    }).sort((a, b) => {
      // 按创建时间倒序排列
      return new Date(b.created_at) - new Date(a.created_at)
    })
  },

  /**
   * 处理进度视频数据
   */
  _processProgressVideos(videos) {
    if (!Array.isArray(videos)) return []

    return videos.map(video => {
      const videoUrl = this._normalizeMediaUrl(video.video_url || '')
      const coverUrl = this._normalizeMediaUrl(video.cover_url || video.cover || '')

      return {
        id: video.id,
        order_id: video.order_id,
        video_title: video.video_title || '维修视频',
        description: video.description || '',
        video_url: videoUrl,
        cover_url: coverUrl,
        duration: video.duration || 0,
        duration_text: this._formatDuration(video.duration || 0),
        file_size: video.file_size || 0,
        uploaded_by: video.uploaded_by || 0,
        uploaded_by_name: video.uploaded_by_name || '未知上传人',
        created_at: this._formatTime(video.created_at),
        updated_at: this._formatTime(video.updated_at)
      }
    }).sort((a, b) => {
      // 按创建时间倒序排列
      return new Date(b.created_at) - new Date(a.created_at)
    })
  },

  _normalizeMediaUrl(url) {
    if (!url || typeof url !== 'string') return ''

    const trimmedUrl = url.trim()
    const baseUrl = app.globalData.baseUrl || app.globalData.apiUrl || ''
    const fullUrl = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `${baseUrl}${trimmedUrl}`

    try {
      return encodeURI(fullUrl)
    } catch (e) {
      return fullUrl
    }
  },

  onMediaImageError(e) {
    const type = e.currentTarget.dataset.type
    const groupIndex = e.currentTarget.dataset.groupIndex
    const itemIndex = e.currentTarget.dataset.itemIndex

    if (type === 'progress-photo') {
      const progressPhotos = [...this.data.progressPhotos]
      const failedUrl = progressPhotos[groupIndex]?.images?.[itemIndex]
      const retryKey = `photo-${groupIndex}-${itemIndex}`

      if (!failedUrl) return

      if (this._imageFallbackTried[retryKey]) {
        progressPhotos[groupIndex].images[itemIndex] = ''
        this.setData({ progressPhotos })
        return
      }

      this._imageFallbackTried[retryKey] = true
      this._loadImageToLocal(failedUrl)
        .then(localPath => {
          if (!localPath) throw new Error('empty local path')
          const latestPhotos = [...this.data.progressPhotos]
          if (latestPhotos[groupIndex] && latestPhotos[groupIndex].images[itemIndex] !== undefined) {
            latestPhotos[groupIndex].images[itemIndex] = localPath
            this.setData({ progressPhotos: latestPhotos })
          }
        })
        .catch(() => {
          const latestPhotos = [...this.data.progressPhotos]
          if (latestPhotos[groupIndex] && latestPhotos[groupIndex].images[itemIndex] !== undefined) {
            latestPhotos[groupIndex].images[itemIndex] = ''
            this.setData({ progressPhotos: latestPhotos })
          }
        })
      return
    }

    if (type === 'progress-video') {
      const progressVideos = [...this.data.progressVideos]
      if (progressVideos[itemIndex]) {
        progressVideos[itemIndex].cover_url = ''
        this.setData({ progressVideos })
      }
    }
  },

  _loadImageToLocal(url) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: url,
        success: (res) => resolve(res.path || res.tempFilePath || ''),
        fail: () => {
          wx.downloadFile({
            url,
            success: (downloadRes) => {
              if (downloadRes.statusCode === 200 && downloadRes.tempFilePath) {
                resolve(downloadRes.tempFilePath)
              } else {
                reject(new Error('download failed'))
              }
            },
            fail: reject
          })
        }
      })
    })
  },

  /**
   * 格式化视频时长
   */
  _formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0s'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else if (minutes > 0) {
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${secs}s`
    }
  },

  /**
   * 播放视频
   */
  playVideo(e) {
    const url = e.currentTarget.dataset.url
    if (!url) {
      wx.showToast({ title: '视频地址无效', icon: 'none' })
      return
    }

    // 判断是否为外部URL
    const isExternalUrl = url.startsWith('http://') || url.startsWith('https://')

    wx.showLoading({ title: '加载中...' })

    if (isExternalUrl) {
      // 外部URL，直接使用视频播放器
      wx.hideLoading()
      wx.navigateTo({
        url: `/pages/video-player/video-player?url=${encodeURIComponent(url)}`
      })
    } else {
      // 内部URL，需要下载后播放
      wx.downloadFile({
        url: (app.globalData.baseUrl || app.globalData.apiUrl) + url,
        success: (res) => {
          wx.hideLoading()
          if (res.statusCode === 200) {
            wx.navigateTo({
              url: `/pages/video-player/video-player?url=${encodeURIComponent(res.tempFilePath)}`
            })
          } else {
            wx.showToast({ title: '视频下载失败', icon: 'none' })
          }
        },
        fail: (err) => {
          wx.hideLoading()
          console.error('下载视频失败', err)
          wx.showToast({ title: '视频加载失败', icon: 'none' })
        }
      })
    }
  },

  /**
   * 微信转发：用户可把订单转发给好友（对方点卡片直达订单详情）
   */
  onShareAppMessage() {
    const title = this.data.isAdminCreated
      ? `【待处理订单】管理员为您创建的${this.data.orderTypeText}，请填写地址并支付`
      : `【订单】${this.data.orderNo} ${this.data.orderTypeText} - ${this.data.statusText}`
    return {
      title,
      path: `/pages/order-detail/order-detail?id=${this.data.orderId}`,
      imageUrl: ''
    }
  }
})
