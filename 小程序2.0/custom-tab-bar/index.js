const {
  CACHE_KEYS,
  CACHE_TTL,
  getCache,
  fetchWithCache
} = require('../utils/mineDataCache.js')

Component({
  data: {
    selected: 0,
    sliderOffset: 0,
    bounce_0: false,
    bounce_1: false,
    bounce_2: false,
    bounce_3: false,
    quotedCount: 0,
    progressUnreadCount: 0,
    badgeTotal: 0
  },
  pageLifetimes: {
    show() {
      this._restoreBadgeFromCache();
      this._calcSlider(this.data.selected, false);
      if (!this._badgeCacheFresh()) {
        this._loadQuotedCount();
        this._loadProgressUnreadCount();
      }
    }
  },
  methods: {
    _badgeCacheFresh() {
      const quotedCache = getCache(CACHE_KEYS.quotedCount, 0)
      const progressCache = getCache(CACHE_KEYS.progressUnreadCount, 0)
      const now = Date.now()
      const quotedFresh = quotedCache.hasCache && (now - quotedCache.updatedAt) < CACHE_TTL.badge
      const progressFresh = progressCache.hasCache && (now - progressCache.updatedAt) < CACHE_TTL.badge
      return quotedFresh && progressFresh
    },

    /**
     * 中间拍照按钮 — 跳转到拍照识别页
     */
    openScan() {
      wx.navigateTo({ url: '/pages/scan/scan' })
    },

    switchTab(e) {
      const index = Number(e.currentTarget.dataset.index);
      const path = e.currentTarget.dataset.path;

      if (index === this.data.selected) return;

      this._calcSlider(index, true);
      this._triggerBounce(index);
      this.setData({ selected: index });
      wx.switchTab({ url: path });
    },

    _calcSlider(index, animate) {
      const query = this.createSelectorQuery();
      query.select('.tab-bar').boundingClientRect();
      query.selectAll('.tab-item').boundingClientRect();
      query.exec(res => {
        const barRect = res[0];
        const rects = res[1];
        if (!barRect || !rects || !rects[index]) return;
        const itemWidth = rects[index].width;
        const sliderWidth = itemWidth * 0.45;
        // 相对容器（而非视口）计算中心，确保滑块精确落在选中项正下方
        const itemCenter = rects[index].left + itemWidth / 2 - barRect.left;
        const sliderLeft = itemCenter - sliderWidth / 2;
        this.setData({
          sliderOffset: sliderLeft,
          sliderWidth: sliderWidth,
          _animating: animate
        });
      });
    },

    _triggerBounce(index) {
      const key = `bounce_${index}`;
      this.setData({ [key]: true });
      setTimeout(() => {
        this.setData({ [key]: false });
      }, 400);
    },

    /**
     * 加载待确认报价的订单数量
     */
    async _loadQuotedCount() {
      try {
        const token = wx.getStorageSync('token');
        if (!token) {
          this.setData({ quotedCount: 0 });
          this._updateBadge();
          return;
        }

        const { data } = await fetchWithCache({
          storageKey: CACHE_KEYS.quotedCount,
          requestKey: 'mine:quotedCount',
          ttl: CACHE_TTL.badge,
          fetcher: async () => {
            const baseUrl = getApp().globalData.baseUrl || getApp().globalData.apiUrl;
            const res = await new Promise((resolve, reject) => {
              wx.request({
                url: `${baseUrl}/api/orders/quoted-count`,
                method: 'GET',
                header: {
                  'Authorization': token ? `Bearer ${token}` : ''
                },
                success: (response) => resolve(response),
                fail: reject
              });
            });

            if (res.statusCode === 200 && res.data && res.data.success) {
              return res.data.count || 0
            }

            throw new Error('获取报价数量失败')
          }
        })

        this.setData({ quotedCount: data || 0 });
        getApp().globalData.quotedCount = data || 0;
      } catch (err) {
        console.error('获取报价数量失败:', err);
        return;
      }
      this._updateBadge();
    },

    /**
     * 更新角标总数
     */
    _updateBadge() {
      const total = (this.data.quotedCount || 0) + (this.data.progressUnreadCount || 0);
      this.setData({ badgeTotal: total });
      const app = getApp();
      app.globalData.quotedCount = this.data.quotedCount || 0;
      app.globalData.progressUnreadCount = this.data.progressUnreadCount || 0;
      app.globalData.badgeTotal = total;
      this._saveBadgeToCache();
    },

    /**
     * 从本地缓存恢复角标，防止组件重建导致角标丢失
     */
    _restoreBadgeFromCache() {
      try {
        const app = getApp();
        const globalQuoted = app.globalData.quotedCount || 0;
        const globalProgress = app.globalData.progressUnreadCount || 0;
        const globalBadgeTotal = app.globalData.badgeTotal || 0;
        const quotedCache = getCache(CACHE_KEYS.quotedCount, 0)
        const progressCache = getCache(CACHE_KEYS.progressUnreadCount, 0)
        const cached = wx.getStorageSync('_badgeTotal');
        this.setData({
          quotedCount: globalQuoted || quotedCache.data || this.data.quotedCount,
          progressUnreadCount: globalProgress || progressCache.data || this.data.progressUnreadCount,
          badgeTotal: globalBadgeTotal || cached || 0
        });
      } catch (e) {}
    },

    /**
     * 将角标缓存到本地，组件重建后能立即恢复
     */
    _saveBadgeToCache() {
      try {
        wx.setStorageSync('_badgeTotal', this.data.badgeTotal);
        wx.setStorageSync('_quotedCount', this.data.quotedCount || 0);
        wx.setStorageSync('_progressUnreadCount', this.data.progressUnreadCount || 0);
      } catch (e) {}
    },

    /**
     * 外部调用：重新计算角标（基于现有数据，不重新请求API）
     */
    recomputeBadge() {
      this._updateBadge();
    },

    /**
     * 外部调用：刷新角标（重新请求API）
     */
    refreshBadge() {
      this._loadQuotedCount();
      this._loadProgressUnreadCount();
    },

    /**
     * 加载未读进度更新的订单数量
     */
    async _loadProgressUnreadCount() {
      try {
        const { orderApi } = require('../utils/api.js');
        const { getUnreadProgressOrders } = require('../utils/progressUnread.js');
        const token = wx.getStorageSync('token');
        if (!token) {
          this.setData({ progressUnreadCount: 0 });
          this._updateBadge();
          return;
        }

        const { data } = await fetchWithCache({
          storageKey: CACHE_KEYS.progressUnreadCount,
          requestKey: 'mine:progressUnreadCount',
          ttl: CACHE_TTL.badge,
          fetcher: async () => {
            const res = await orderApi.getProgressUnreadList();
            if (res && res.success) {
              return getUnreadProgressOrders(res.data || []).length
            }
            throw new Error('获取未读进度数量失败')
          }
        });
        this.setData({ progressUnreadCount: data || 0 });
        getApp().globalData.progressUnreadCount = data || 0;
      } catch (err) {
        console.error('获取未读进度数量失败:', err);
        return;
      }
      this._updateBadge();
    }
  }
});
