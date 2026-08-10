const STORAGE_KEY = 'progressReadState';

function loadState() {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY);
    return raw && typeof raw === 'object' ? raw : {};
  } catch (e) {
    return {};
  }
}

function saveState(state) {
  try {
    wx.setStorageSync(STORAGE_KEY, state || {});
  } catch (e) {}
}

function normalizeStamp(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  return String(value).trim();
}

function getOrderId(order) {
  const id = order && (order.id || order.orderId || order.order_id || order.order_no);
  return id ? String(id) : '';
}

function getProgressStamp(order) {
  if (!order) return '';
  return normalizeStamp(order.progress_updated_at || order.progressUpdatedAt || order.updated_at || order.updatedAt || '');
}

function markProgressRead(orderId, progressUpdatedAt) {
  const key = orderId ? String(orderId) : '';
  if (!key) return;
  const state = loadState();
  state[key] = normalizeStamp(progressUpdatedAt) || '__read__';
  saveState(state);
}

function isProgressUnread(order) {
  const key = getOrderId(order);
  if (!key) return false;

  const unreadFlag = Number(order.progressUnread ?? order.progress_unread ?? 0) === 1;
  if (!unreadFlag) return false;

  const state = loadState();
  const savedStamp = normalizeStamp(state[key]);
  if (!savedStamp) return true;

  const currentStamp = getProgressStamp(order);
  if (!currentStamp) return savedStamp !== '__read__';

  return savedStamp !== currentStamp;
}

function getUnreadProgressOrders(orders = []) {
  return Array.isArray(orders) ? orders.filter(isProgressUnread) : [];
}

function syncProgressUnreadState(orderId, progressUpdatedAt, options = {}) {
  const key = orderId ? Number(orderId) : 0;
  if (!key) return;

  const {
    wasUnread = true
  } = options;

  markProgressRead(key, progressUpdatedAt);

  const app = getApp && getApp();
  const quotedCount = Number(app?.globalData?.quotedCount || 0);
  const currentProgressCount = Number(app?.globalData?.progressUnreadCount || 0);
  const nextProgressCount = wasUnread ? Math.max(0, currentProgressCount - 1) : currentProgressCount;
  const nextBadgeTotal = quotedCount + nextProgressCount;

  if (app && app.globalData) {
    app.globalData.progressUnreadCount = nextProgressCount;
    app.globalData.badgeTotal = nextBadgeTotal;
  }

  try {
    wx.setStorageSync('_progressUnreadCount', nextProgressCount);
    wx.setStorageSync('_badgeTotal', nextBadgeTotal);
  } catch (e) {}

  const pages = getCurrentPages();
  pages.forEach(page => {
    if (!page || !page.route) return;

    if (page.route === 'pages/orders/orders') {
      const orders = (page.data.orders || []).map(order => (
        Number(order.id) === key ? { ...order, progressUnread: 0, progress_unread: 0 } : order
      ));

      if (typeof page.applyUnreadFilter === 'function') {
        page.setData({
          orders,
          filteredOrders: page.applyUnreadFilter(orders)
        });
      } else {
        page.setData({ orders });
      }
    }

    if (page.route === 'pages/mine/mine') {
      page.setData({ progressUnreadCount: nextProgressCount });
    }

    if (page.route === 'pages/progress-feedback/progress-feedback' && Number(page.data.orderId) === key) {
      page.setData({
        'orderInfo.progress_unread': 0
      });
    }

    if (page.route === 'pages/order-detail/order-detail' && Number(page.data.orderId) === key) {
      page.setData({ progressUnread: 0 });
    }
  });

  try {
    const currentPage = pages[pages.length - 1];
    const tabBar = currentPage && currentPage.getTabBar && currentPage.getTabBar();
    if (tabBar) {
      tabBar.setData({ progressUnreadCount: nextProgressCount });
      if (typeof tabBar.recomputeBadge === 'function') {
        tabBar.recomputeBadge();
      }
    }
  } catch (e) {}
}

module.exports = {
  markProgressRead,
  isProgressUnread,
  getUnreadProgressOrders,
  getProgressStamp,
  syncProgressUnreadState
};
