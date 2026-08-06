// pages/admin-progress-apply/admin-progress-apply.js
const { adminProgressApplyApi } = require('../../utils/api.js');

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

Page({
  data: {
    applyList: [],
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true,
    loading: false,
    statusFilter: '',

    // 审批弹窗
    showApproveModal: false,
    showRejectModal: false,
    currentApply: null,
    approveRemark: '',
    rejectRemark: '',
    processing: false,

    // 统计
    stats: {
      pending: 0,
      approved: 0,
      rejected: 0
    }
  },

  onLoad() {
    this.loadList(true);
    this.loadStats();
  },

  onShow() {
    this.loadList(true);
    this.loadStats();
  },

  async loadList(refresh = false) {
    if (this.data.loading) return;

    if (refresh) {
      this.setData({ page: 1, hasMore: true, applyList: [] });
    }
    if (!this.data.hasMore && !refresh) return;

    this.setData({ loading: true });

    try {
      const params = {
        page: this.data.page,
        pageSize: this.data.pageSize,
        approval_status: this.data.statusFilter || undefined
      };

      const res = await adminProgressApplyApi.getList(params);

      if (res && res.success && res.data) {
        const list = (res.data.list || []).map(item => {
          const statusConfig = STATUS_MAP[item.approval_status] || STATUS_MAP.pending;
          return {
            ...item,
            statusLabel: statusConfig.label,
            statusColor: statusConfig.color,
            statusBg: statusConfig.bg,
            statusIcon: statusConfig.icon,
            progressTypeText: PROGRESS_TYPE_MAP[item.progress_type] || item.progress_type,
            createdAt: this._formatTime(item.created_at),
            approvalAt: item.approval_at ? this._formatTime(item.approval_at) : '',
            userName: item.user_real_name || item.user_nickname || '用户' + item.user_id
          };
        });

        this.setData({
          applyList: refresh ? list : [...this.data.applyList, ...list],
          total: res.data.total || 0,
          hasMore: list.length >= this.data.pageSize
        });
      }
    } catch (error) {
      console.error('加载进度申请列表失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadStats() {
    try {
      const res = await adminProgressApplyApi.getList({ pageSize: 1 });
      if (res && res.success && res.data) {
        this.setData({ total: res.data.total || 0 });
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  },

  _formatTime(str) {
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

  switchFilter(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ statusFilter: status }, () => {
      this.loadList(true);
    });
  },

  onPullDownRefresh() {
    this.loadList(true).then(() => {
      this.loadStats();
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadList();
    }
  },

  // 查看详情
  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/progress-apply-create/progress-apply-create?id=${id}&view=1`
    });
  },

  // 打开审批通过弹窗
  openApproveModal(e) {
    const id = e.currentTarget.dataset.id;
    const apply = this.data.applyList.find(a => a.id == id);
    if (!apply) return;

    this.setData({
      showApproveModal: true,
      currentApply: apply,
      approveRemark: ''
    });
  },

  closeApproveModal() {
    this.setData({
      showApproveModal: false,
      currentApply: null,
      approveRemark: ''
    });
  },

  onApproveRemarkInput(e) {
    this.setData({ approveRemark: e.detail.value });
  },

  async submitApprove() {
    if (!this.data.currentApply) return;
    this.setData({ processing: true });
    wx.showLoading({ title: '处理中...', mask: true });

    try {
      const res = await adminProgressApplyApi.approve(
        this.data.currentApply.id,
        this.data.approveRemark
      );

      wx.hideLoading();

      if (res && res.success) {
        wx.showToast({ title: '审批通过', icon: 'success' });
        this.closeApproveModal();
        this.loadList(true);
        this.loadStats();
      } else {
        wx.showToast({ title: res?.error || '操作失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('审批通过失败:', error);
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      this.setData({ processing: false });
    }
  },

  // 打开拒绝弹窗
  openRejectModal(e) {
    const id = e.currentTarget.dataset.id;
    const apply = this.data.applyList.find(a => a.id == id);
    if (!apply) return;

    this.setData({
      showRejectModal: true,
      currentApply: apply,
      rejectRemark: ''
    });
  },

  closeRejectModal() {
    this.setData({
      showRejectModal: false,
      currentApply: null,
      rejectRemark: ''
    });
  },

  onRejectRemarkInput(e) {
    this.setData({ rejectRemark: e.detail.value });
  },

  async submitReject() {
    if (!this.data.currentApply) {
      wx.showToast({ title: '请选择申请', icon: 'none' });
      return;
    }
    if (!this.data.rejectRemark.trim()) {
      wx.showToast({ title: '请填写拒绝原因', icon: 'none' });
      return;
    }

    this.setData({ processing: true });
    wx.showLoading({ title: '处理中...', mask: true });

    try {
      const res = await adminProgressApplyApi.reject(
        this.data.currentApply.id,
        this.data.rejectRemark.trim()
      );

      wx.hideLoading();

      if (res && res.success) {
        wx.showToast({ title: '已拒绝', icon: 'success' });
        this.closeRejectModal();
        this.loadList(true);
        this.loadStats();
      } else {
        wx.showToast({ title: res?.error || '操作失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('拒绝失败:', error);
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      this.setData({ processing: false });
    }
  },

  // 查看关联订单
  viewOrder(e) {
    const orderId = e.currentTarget.dataset.orderid;
    if (orderId) {
      wx.navigateTo({
        url: `/pages/order-detail/order-detail?orderId=${orderId}`
      });
    }
  }
});