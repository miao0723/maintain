// pages/progress-apply-list/progress-apply-list.js
const { progressApplyApi } = require('../../utils/api.js');

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
    orderId: ''
  },

  onLoad(options) {
    if (options.orderId) {
      this.setData({ orderId: options.orderId });
    }
    this.loadList(true);
  },

  onShow() {
    if (this.data.applyList.length > 0) {
      this.loadList(true);
    }
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
        approval_status: this.data.statusFilter || undefined,
        order_id: this.data.orderId || undefined
      };

      const res = await progressApplyApi.getMyList(params);

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
            approvedAt: item.approval_at ? this._formatTime(item.approval_at) : ''
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

  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/progress-apply-create/progress-apply-create?id=${id}&view=1`
    });
  },

  onPullDownRefresh() {
    this.loadList(true).then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadList();
    }
  },

  goToCreate() {
    wx.navigateTo({
      url: '/pages/progress-apply-create/progress-apply-create'
    });
  }
});