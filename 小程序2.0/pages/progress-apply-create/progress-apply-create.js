// pages/progress-apply-create/progress-apply-create.js
const app = getApp();
const { progressApplyApi, orderApi } = require('../../utils/api.js');

const PROGRESS_TYPES = [
  { value: 'parts_waiting', label: '配件等待', icon: '🔧' },
  { value: 'repairing', label: '维修中', icon: '⚙️' },
  { value: 'testing', label: '测试中', icon: '🔬' },
  { value: 'other', label: '其他', icon: '📋' }
];

Page({
  data: {
    // 表单模式: create-创建, view-查看
    mode: 'create',
    applyId: null,

    // 表单数据
    formData: {
      order_id: '',
      customer_name: '',
      phone: '',
      device_name: '',
      device_model: '',
      progress_type: '',
      apply_reason: '',
      expected_time: ''
    },

    // 查看模式数据
    applyDetail: null,

    // 订单列表 (用户维修中的订单)
    orderList: [],
    selectedOrder: null,
    showOrderPicker: false,

    // 进度类型选择
    progressTypes: PROGRESS_TYPES,
    preselectOrderId: null,
    selectedType: null,

    // 状态
    submitting: false,
    loading: false,
    orderLoading: false,
    editDisabled: false,

    // 审批状态 (查看模式)
    approvalStatus: '',
    approvalStatusText: '',
    approvalStatusColor: '',
    approvalRemark: '',
    approvalAt: ''
  },

  onLoad(options) {
    // 如果有id和view=1，则进入查看模式
    if (options.id && options.view === '1') {
      this.setData({
        mode: 'view',
        applyId: options.id,
        editDisabled: true
      });
      this.loadApplyDetail(options.id);
    } else {
      // 自动填充用户信息
      this.fillUserInfo();
      if (options.orderId) {
        // 预填订单ID，等订单加载后自动选中
        this.setData({
          preselectOrderId: parseInt(options.orderId),
          'formData.order_id': parseInt(options.orderId)
        });
      }
      this.loadUserOrders();
    }
  },

  /** 从缓存填充用户姓名和电话 */
  fillUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        const name = userInfo.real_name || userInfo.nickname || '';
        const phone = userInfo.phone || userInfo.mobile || '';
        this.setData({
          'formData.customer_name': name,
          'formData.phone': phone
        });
      }
    } catch (e) {
      console.warn('读取用户信息失败:', e);
    }
  },

  async loadUserOrders() {
    this.setData({ orderLoading: true });
    try {
      const userInfo = wx.getStorageSync('userInfo');
      const userId = userInfo?.id;

      if (!userId) {
        this.setData({ orderLoading: false });
        return;
      }

      // 获取用户的订单，筛选可申请进度的订单
      const res = await orderApi.getOrderList();

      if (res && res.success && res.data) {
        let orders = res.data.orders || [];
        // 只显示可申请进度的订单状态
        const validStatuses = ['processing', 'confirmed', 'assigned'];
        orders = orders.filter(o => validStatuses.includes(o.status));
        this.setData({ orderList: orders });

        // 自动选中预填的订单
        const preselectId = this.data.preselectOrderId;
        if (preselectId) {
          const matched = orders.find(o => o.id == preselectId || o.orderId == preselectId);
          if (matched) {
            const deviceName = matched.deviceTypeName || matched.device_name || matched.device_model || '';
            this.setData({
              selectedOrder: matched,
              'formData.order_id': matched.id || matched.orderId,
              'formData.device_name': deviceName,
              'formData.device_model': matched.device_model || ''
            });
          }
        }
      }
    } catch (error) {
      console.error('加载订单列表失败:', error);
    } finally {
      this.setData({ orderLoading: false });
    }
  },

  async loadApplyDetail(id) {
    this.setData({ loading: true });
    try {
      const res = await progressApplyApi.getDetail(id);
      if (res && res.success && res.data) {
        const data = res.data;
        const statusMap = {
          pending: { label: '待审核', color: '#f59e0b' },
          approved: { label: '已通过', color: '#10b981' },
          rejected: { label: '已拒绝', color: '#ef4444' }
        };
        const sc = statusMap[data.approval_status] || statusMap.pending;

        this.setData({
          applyDetail: data,
          formData: {
            order_id: data.order_id,
            customer_name: data.customer_name,
            phone: data.phone,
            device_name: data.device_name || '',
            device_model: data.device_model || '',
            progress_type: data.progress_type,
            apply_reason: data.apply_reason,
            expected_time: data.expected_time || ''
          },
          selectedType: PROGRESS_TYPES.find(t => t.value === data.progress_type) || null,
          approvalStatus: data.approval_status,
          approvalStatusText: sc.label,
          approvalStatusColor: sc.color,
          approvalRemark: data.approval_remark || '',
          approvalAt: data.approval_at || ''
        });
      }
    } catch (error) {
      console.error('加载申请详情失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 选择订单
  selectOrder() {
    if (this.data.editDisabled) return;
    this.setData({ showOrderPicker: true });
  },

  onOrderSelect(e) {
    const orderId = e.currentTarget.dataset.id;
    const order = this.data.orderList.find(o => o.id == orderId || o.orderId == orderId);
    if (order) {
      const deviceName = order.deviceTypeName || order.device_name || order.device_model || '';
      this.setData({
        selectedOrder: order,
        showOrderPicker: false,
        'formData.order_id': order.id || order.orderId,
        'formData.device_name': deviceName,
        'formData.device_model': order.device_model || ''
      });
    }
  },

  closeOrderPicker() {
    this.setData({ showOrderPicker: false });
  },

  // 选择进度类型 (网格点击)
  onTypeSelect(e) {
    if (this.data.editDisabled) return;
    const value = e.currentTarget.dataset.value;
    const type = this.data.progressTypes.find(t => t.value === value);
    if (type) {
      this.setData({
        selectedType: type,
        'formData.progress_type': type.value
      });
    }
  },

  // 保留原选择器方法兼容

  // 表单输入
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 验证并提交
  async submitApply() {
    const { formData } = this.data;

    if (!formData.order_id) {
      wx.showToast({ title: '请选择关联订单', icon: 'none' });
      return;
    }
    if (!formData.customer_name.trim()) {
      wx.showToast({ title: '请输入您的姓名', icon: 'none' });
      return;
    }
    if (!formData.phone.trim()) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }
    if (!formData.progress_type) {
      wx.showToast({ title: '请选择进度类型', icon: 'none' });
      return;
    }
    if (!formData.apply_reason.trim()) {
      wx.showToast({ title: '请填写申请原因', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...', mask: true });

    try {
      const res = await progressApplyApi.create({
        order_id: parseInt(formData.order_id),
        customer_name: formData.customer_name.trim(),
        phone: formData.phone.trim(),
        device_name: formData.device_name.trim(),
        device_model: formData.device_model.trim(),
        progress_type: formData.progress_type,
        apply_reason: formData.apply_reason.trim(),
        expected_time: formData.expected_time || undefined
      });

      wx.hideLoading();

      if (res && res.success) {
        wx.showToast({ title: '申请提交成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({ title: res?.error || '提交失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('提交申请失败:', error);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});