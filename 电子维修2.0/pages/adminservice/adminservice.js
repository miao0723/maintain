const { adminServiceApi } = require('../../utils/api.js');

Page({
  data: {
    conversations: [],
    allConversations: [],
    loading: false,
    showAll: false // 是否显示全部（含已完成）
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!(userInfo.role === 'admin' || userInfo.role === 'super_admin')) {
      wx.showToast({ title: '需要管理员权限', icon: 'none' });
      wx.navigateBack();
      return;
    }
  },

  onShow() {
    this.loadConversations();
  },

  async loadConversations() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      // 并行加载活跃的和全部会话
      const [activeRes, allRes] = await Promise.allSettled([
        adminServiceApi.getConversations(),
        adminServiceApi.getAllConversations()
      ]);

      const activeList = activeRes.status === 'fulfilled'
        ? (activeRes.value.data || activeRes.value || [])
        : [];
      const allList = allRes.status === 'fulfilled'
        ? (allRes.value.data || allRes.value || [])
        : [];

      this.setData({
        conversations: activeList,
        allConversations: allList
      });
    } catch (error) {
      console.error('加载人工客服会话失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  toggleShowAll() {
    this.setData({ showAll: !this.data.showAll });
  },

  openConversation(e) {
    const conversationId = e.currentTarget.dataset.id;
    if (!conversationId) return;
    wx.navigateTo({
      url: `/pages/adminservice-chat/adminservice-chat?conversationId=${encodeURIComponent(conversationId)}`
    });
  }
});
