// pages/mine/mine.js
const { DEFAULT_AVATAR_URL: defaultAvatarUrl, normalizeAvatarUrl } = require('../../utils/avatar.js')
const { userApi } = require('../../utils/api.js')
const { getUnreadProgressOrders } = require('../../utils/progressUnread.js')
const {
  CACHE_KEYS,
  CACHE_TTL,
  getCache,
  setCache,
  fetchWithCache
} = require('../../utils/mineDataCache.js')
const { getDefaultBaseUrl } = require('../../utils/networkConfig.js')

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '游客'
    },
    orderCount: {
      pending: 0,
      processing: 0,
      completed: 0,
      review: 0
    },
    recentOrders: [],  // 最近订单列表
    addressCount: 0,
    unitCount: 0,
    deviceCount: 0,
    subscribed: false,
    isLoading: false,
    summaryLoading: true,
    menuCountsLoading: true,
    recentOrdersLoading: true,
    isAdmin: false,  // 是否为超级管理员
    isInternal: false,  // 是否为公司内部人员（免付款申请）
    quotedCount: 0,   // 待确认报价的订单数
    progressUnreadCount: 0,  // 未读进度更新的订单数
    showSettingsPanel: false,
    cacheSize: '0KB',
    settings: {
      orderNotify: true,
      progressNotify: true,
      quoteNotify: true
    }
  },

  onLoad() {
    this.restorePageFromCache()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this.restorePageFromCache()
    this.checkSubscription()
    this.loadSettings()
    this.calculateCacheSize()
    this.refreshPageData()
  },

  restorePageFromCache() {
    const userCache = getCache(CACHE_KEYS.userProfile)
    const orderCache = getCache(CACHE_KEYS.orderSummary)
    const addressCache = getCache(CACHE_KEYS.addressCount, 0)
    const unitCache = getCache(CACHE_KEYS.unitCount, 0)
    const deviceCache = getCache(CACHE_KEYS.deviceCount, 0)
    const quotedCache = getCache(CACHE_KEYS.quotedCount, 0)
    const progressCache = getCache(CACHE_KEYS.progressUnreadCount, 0)

    const nextData = {}

    if (userCache.hasCache && userCache.data) {
      nextData.userInfo = userCache.data.userInfo || this.data.userInfo
      nextData.isAdmin = !!userCache.data.isAdmin
      nextData.isInternal = !!userCache.data.isInternal
    } else {
      const localUserInfo = wx.getStorageSync('userInfo')
      if (localUserInfo) {
        nextData.userInfo = {
          avatarUrl: normalizeAvatarUrl(localUserInfo.avatar_url || localUserInfo.avatarUrl),
          nickName: localUserInfo.nickname || localUserInfo.nickName || '微信用户'
        }
        nextData.isAdmin = localUserInfo.role === 'super_admin' || localUserInfo.role === 'admin'
        nextData.isInternal = localUserInfo.role === 'internal'
      }
    }

    if (orderCache.hasCache && orderCache.data) {
      nextData.orderCount = orderCache.data.orderCount || this.data.orderCount
      nextData.recentOrders = Array.isArray(orderCache.data.recentOrders) ? orderCache.data.recentOrders : []
      nextData.summaryLoading = false
      nextData.recentOrdersLoading = false
    } else {
      this.loadRecentOrdersCache()
    }

    if (addressCache.hasCache) nextData.addressCount = Number(addressCache.data) || 0
    if (unitCache.hasCache) nextData.unitCount = Number(unitCache.data) || 0
    if (deviceCache.hasCache) nextData.deviceCount = Number(deviceCache.data) || 0
    if (addressCache.hasCache || unitCache.hasCache || deviceCache.hasCache) {
      nextData.menuCountsLoading = false
    }

    if (quotedCache.hasCache) nextData.quotedCount = Number(quotedCache.data) || 0
    if (progressCache.hasCache) nextData.progressUnreadCount = Number(progressCache.data) || 0

    if (Object.keys(nextData).length > 0) {
      this.setData(nextData)
    }

    if (quotedCache.hasCache || progressCache.hasCache) {
      this.syncBadgeToTabBar(
        quotedCache.hasCache ? (Number(quotedCache.data) || 0) : this.data.quotedCount,
        progressCache.hasCache ? (Number(progressCache.data) || 0) : this.data.progressUnreadCount
      )
    }
  },

  refreshPageData(force = false) {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      const token = wx.getStorageSync('token')
      const userInfo = wx.getStorageSync('userInfo')
      if (token) {
        app.globalData.isLoggedIn = true
        app.globalData.userInfo = userInfo || null
      } else {
        this.setData({
          summaryLoading: false,
          menuCountsLoading: false,
          recentOrdersLoading: false,
          quotedCount: 0,
          progressUnreadCount: 0
        })
      }
    }

    this.loadUserInfo(force)
    this.loadOrderCount(force)
    this.loadAddressCount(force)
    this.loadUnitCount(force)
    this.loadDeviceCount(force)
    this.loadQuotedCount(force)
    this.loadProgressUnreadCount(force)
  },

  /**
   * 加载用户信息（从API）
   */
  async loadUserInfo(force = false) {
    const app = getApp()

    // 检查是否已登录
    if (!app.globalData.isLoggedIn) {
      // 尝试从本地存储获取token和用户信息
      const token = wx.getStorageSync('token')
      const userInfo = wx.getStorageSync('userInfo')

      if (token) {
        // 设置全局登录状态
        app.globalData.isLoggedIn = true
        app.globalData.userInfo = userInfo || null

        if (userInfo) {
          this.setData({
            userInfo: {
              avatarUrl: normalizeAvatarUrl(userInfo.avatar_url || userInfo.avatarUrl),
              nickName: userInfo.nickname || userInfo.nickName || '游客'
            }
          })
        } else {
          this.setData({
            userInfo: {
              avatarUrl: defaultAvatarUrl,
              nickName: '微信用户'
            }
          })
        }

        // 以数据库数据为准，拉取最新头像和昵称
        await this.fetchUserInfoFromAPI(force)
      } else {
        // 未登录状态
        this.setData({
          userInfo: {
            avatarUrl: defaultAvatarUrl,
            nickName: '游客'
          }
        })
      }
      return
    }

    // 已登录状态，从API获取最新用户信息
    await this.fetchUserInfoFromAPI(force)
  },

  /**
   * 从API获取用户信息
   */
  async fetchUserInfoFromAPI(force = false) {
    try {
      this.setData({ isLoading: true })

      const { data: userInfo } = await fetchWithCache({
        storageKey: CACHE_KEYS.userProfile,
        requestKey: 'mine:userProfile',
        ttl: CACHE_TTL.userProfile,
        force,
        fetcher: async () => {
          const profile = await userApi.getUserInfo()
          return {
            userInfo: {
              avatarUrl: normalizeAvatarUrl(profile.avatar_url),
              nickName: profile.nickname || '微信用户'
            },
            isAdmin: profile.role === 'super_admin' || profile.role === 'admin',
            isInternal: profile.role === 'internal',
            raw: profile
          }
        }
      })

      if (userInfo) {
        const app = getApp()
        const rawUserInfo = userInfo.raw || {}
        app.globalData.userInfo = rawUserInfo
        wx.setStorageSync('userInfo', rawUserInfo)

        this.setData({
          userInfo: userInfo.userInfo,
          isAdmin: !!userInfo.isAdmin,
          isInternal: !!userInfo.isInternal
        })
      }
    } catch (error) {
      console.error('从API获取用户信息失败:', error)
      // 如果API失败，回退到本地存储的用户信息
      const localUserInfo = wx.getStorageSync('userInfo')
      if (localUserInfo) {
        this.setData({
          userInfo: {
            avatarUrl: normalizeAvatarUrl(localUserInfo.avatar_url || localUserInfo.avatarUrl),
            nickName: localUserInfo.nickname || localUserInfo.nickName || '游客'
          },
          isAdmin: localUserInfo.role === 'super_admin' || localUserInfo.role === 'admin',
          isInternal: localUserInfo.role === 'internal'
        })
      }
    } finally {
      this.setData({ isLoading: false })
    }
  },

  onAvatarError() {
    if (this.data.userInfo.avatarUrl !== defaultAvatarUrl) {
      this.setData({
        'userInfo.avatarUrl': defaultAvatarUrl
      })
    }
  },

  /**
   * 加载订单数据（所有用户加载个人订单）
   */
  loadOrderCount(force = false) {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      return;
    }

    this.loadRecentOrdersCache();
    this.setData({
      summaryLoading: !getCache(CACHE_KEYS.orderSummary).hasCache,
      recentOrdersLoading: !getCache(CACHE_KEYS.orderSummary).hasCache && this.data.recentOrders.length === 0
    })

    const { orderApi } = require('../../utils/api.js');
    fetchWithCache({
      storageKey: CACHE_KEYS.orderSummary,
      requestKey: 'mine:orderSummary',
      ttl: CACHE_TTL.orderSummary,
      force,
      fetcher: async () => {
        const response = await orderApi.getOrderList()
        let ordersArray = [];
        let stats = {};

        if (response && response.success && response.data) {
          ordersArray = response.data.orders || [];
          stats = response.data.stats || {};
        } else if (Array.isArray(response)) {
          ordersArray = response;
        }

        let orderCount = {
          pending: 0,
          processing: 0,
          completed: 0,
          review: 0
        }

        if (stats.pending !== undefined || stats.processing !== undefined ||
          stats.completed !== undefined || stats.review !== undefined) {
          orderCount = {
            pending: stats.pending || 0,
            processing: stats.processing || 0,
            completed: stats.completed || 0,
            review: stats.review || 0
          }
        } else {
          ordersArray.forEach(order => {
            switch (order.status) {
              case 'pending': orderCount.pending++; break;
              case 'processing': orderCount.processing++; break;
              case 'completed': orderCount.completed++; break;
              case 'review': orderCount.review++; break;
            }
          })
        }

        wx.setStorageSync('orders', ordersArray)
        const recentOrders = this.formatRecentOrders(ordersArray)
        wx.setStorageSync('recentOrdersCache', recentOrders)

        return {
          orderCount,
          recentOrders
        }
      }
    })
      .then(({ data }) => {
        this.setData({
          orderCount: data.orderCount,
          recentOrders: data.recentOrders,
          summaryLoading: false,
          recentOrdersLoading: false
        })
      })
      .catch(error => {
        console.error('获取订单数量失败:', error);
        if (!this.data.recentOrders || this.data.recentOrders.length === 0) {
          this.loadRecentOrdersFallback();
        }
        this.setData({
          summaryLoading: false,
          recentOrdersLoading: false
        })
      })
  },

  /**
   * 从缓存加载最近订单数据（用于onShow快速恢复）
   */
  loadRecentOrdersCache() {
    try {
      const cached = wx.getStorageSync('recentOrdersCache');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        this.setData({ recentOrders: cached });
        console.log('[recentOrders] 从缓存加载:', cached.length, '条');
      }
    } catch (e) {
      // 静默失败
    }
  },

  /**
   * 格式化最近订单数据（公共方法）
   */
  formatRecentOrders(ordersArray) {
    const deviceTypeNames = { 1: '手机', 2: '电脑', 3: '平板', 4: '手表', 5: '耳机', 6: '相机', 7: '游戏机' };
    const statusLabels = {
      pending: '待处理', processing: '维修中', completed: '已完成',
      review: '待评价', cancelled: '已取消', quoted: '待确认'
    };
    const statusIcons = {
      pending: '⏳', processing: '🔧', completed: '✅',
      review: '⭐', cancelled: '❌', quoted: '💰'
    };
    const deviceIcons = { 1: '📱', 2: '💻', 3: '📟', 4: '⌚', 5: '🎧', 6: '📷', 7: '🎮' };

    return ordersArray.slice(0, Math.min(5, ordersArray.length)).map(order => {
      const dt = parseInt(order.device_type) || parseInt(order.deviceType) || 1;
      const ot = order.order_type || order.repair_type || order.orderType || 'repair';
      const st = order.status || 'pending';
      let price = order.actual_price || order.quote_price || order.estimated_price || order.price || '';
      if (price) price = typeof price === 'string' ? price : parseFloat(price).toFixed(2);

      return {
        id: order.id,
        orderId: order.id,
        orderNo: order.order_no || order.order_id || '',
        deviceType: dt,
        deviceTypeName: deviceTypeNames[dt] || '设备',
        deviceIcon: deviceIcons[dt] || '📱',
        problemDescription: order.problem_description || order.fault_desc || order.problemDescription || '暂无描述',
        status: st,
        statusLabel: statusLabels[st] || st,
        statusIcon: statusIcons[st] || '📋',
        price: price,
        hasPrice: !!price,
        createdAt: order.created_at || order.createdAt || '',
        createdAtShort: order.created_at
          ? (order.created_at.split(' ')[0] || order.created_at.substring(0, 10))
          : (order.createdAt ? (order.createdAt.split(' ')[0] || order.createdAt.substring(0, 10)) : ''),
        orderType: ot,
        orderTypeText: ot === 'repair' ? '维修' : ot === 'recycle' ? '回收' : ot,
        brandName: order.brand_name || order.brandName || ''
      };
    });
  },

  /**
   * 从localStorage原始订单数据回退加载（兜底方案）
   */
  loadRecentOrdersFallback() {
    try {
      const storedOrders = wx.getStorageSync('orders') || [];
      if (storedOrders.length > 0) {
        const recentOrders = this.formatRecentOrders(storedOrders);
        wx.setStorageSync('recentOrdersCache', recentOrders);
        this.setData({ recentOrders: recentOrders });
      }
    } catch (e) {
      console.error('[recentOrders] 回退加载失败:', e);
    }
  },

  /**
   * 加载地址数量（静默加载，不显示loading）
   */
  loadAddressCount(force = false) {
    const app = getApp()
    if (!app.globalData.isLoggedIn) return;

    const { addressApi } = require('../../utils/api.js');
    fetchWithCache({
      storageKey: CACHE_KEYS.addressCount,
      requestKey: 'mine:addressCount',
      ttl: CACHE_TTL.menuCount,
      force,
      fetcher: async () => {
        const addresses = await addressApi.getAddressList()
        let addressesArray = [];
        if (addresses && addresses.success && Array.isArray(addresses.data)) {
          addressesArray = addresses.data;
        } else if (Array.isArray(addresses)) {
          addressesArray = addresses;
        }
        if (addressesArray.length > 0) {
          wx.setStorageSync('addresses', addressesArray);
        }
        return addressesArray.length
      }
    })
      .then(({ data }) => {
        this.setData({
          addressCount: Number(data) || 0,
          menuCountsLoading: false
        });
      })
      .catch(error => {
        console.error('获取地址数量失败:', error);
        const addresses = wx.getStorageSync('addresses') || [];
        this.setData({
          addressCount: addresses.length,
          menuCountsLoading: false
        });
      })
  },

  /**
   * 加载单位数量（静默加载，不显示loading）
   */
  loadUnitCount(force = false) {
    const app = getApp()
    if (!app.globalData.isLoggedIn) return;

    const { unitApi } = require('../../utils/api.js');
    fetchWithCache({
      storageKey: CACHE_KEYS.unitCount,
      requestKey: 'mine:unitCount',
      ttl: CACHE_TTL.menuCount,
      force,
      fetcher: async () => {
        const units = await unitApi.getUnitList()
        let unitsArray = [];
        if (units && units.success && Array.isArray(units.data)) {
          unitsArray = units.data;
        } else if (Array.isArray(units)) {
          unitsArray = units;
        }
        if (unitsArray.length > 0) {
          wx.setStorageSync('units', unitsArray)
        }
        return unitsArray.length
      }
    })
      .then(({ data }) => {
        this.setData({
          unitCount: Number(data) || 0,
          menuCountsLoading: false
        })
      })
      .catch(error => {
        console.error('获取单位数量失败:', error);
        const units = wx.getStorageSync('units') || [];
        this.setData({
          unitCount: units.length,
          menuCountsLoading: false
        });
      })
  },

  /**
   * 加载设备数量（静默加载，不显示loading）
   */
  loadDeviceCount(force = false) {
    const app = getApp()
    if (!app.globalData.isLoggedIn) return;

    const { userDevicesApi } = require('../../utils/api.js');
    fetchWithCache({
      storageKey: CACHE_KEYS.deviceCount,
      requestKey: 'mine:deviceCount',
      ttl: CACHE_TTL.menuCount,
      force,
      fetcher: async () => {
        const res = await userDevicesApi.getList()
        if (res && res.success && Array.isArray(res.data)) {
          return res.data.length
        }
        return 0
      }
    })
      .then(({ data }) => {
        this.setData({
          deviceCount: Number(data) || 0,
          menuCountsLoading: false
        });
      })
      .catch(error => {
        console.error('获取设备数量失败:', error);
        this.setData({ menuCountsLoading: false });
      })
  },

  /**
   * 检查订阅状态（从通知设置判断）
   */
  checkSubscription() {
    const settings = wx.getStorageSync('appSettings') || {}
    const subscribed = settings.orderNotify || settings.progressNotify || settings.quoteNotify || false
    this.setData({
      subscribed: subscribed
    })
  },

  /**
   * 编辑个人信息
   */
  editProfile() {
    // 检查是否已登录
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: '/pages/profile-edit/profile-edit'
    })
  },

  /**
   * 查看订单（所有用户查看自己发起的订单）
   */
  goToOrders(e) {
    const status = e.currentTarget.dataset.status || 'all'
    wx.navigateTo({
      url: `/pages/orders/orders?status=${status}`
    })
  },

  /**
   * 加载待确认报价的订单数量
   */
  async loadQuotedCount(force = false) {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      this.syncQuotedCount(0);
      return;
    }

    try {
      const { data: count } = await fetchWithCache({
        storageKey: CACHE_KEYS.quotedCount,
        requestKey: 'mine:quotedCount',
        ttl: CACHE_TTL.badge,
        force,
        fetcher: async () => {
          const token = wx.getStorageSync('token');
          const baseUrl = getDefaultBaseUrl() || 'http://8.155.24.202:3001';
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
      this.syncQuotedCount(count)
    } catch (err) {
      console.error('获取报价数量失败:', err);
    }
  },

  syncQuotedCount(count) {
    const nextCount = Number(count) || 0;
    setCache(CACHE_KEYS.quotedCount, nextCount)
    this.setData({ quotedCount: nextCount });
    this.syncBadgeToTabBar(nextCount, this.data.progressUnreadCount)
  },

  /**
   * 跳转到待确认报价的订单列表
   */
  goToQuotedOrders() {
    wx.navigateTo({
      url: '/pages/orders/orders?status=quoted'
    });
  },

  /**
   * 跳转到待确认报价的订单列表
   */
  goToUnreadQuotedOrders() {
    this.goToQuotedOrders();
  },

  /**
   * 加载未读进度更新的订单数量
   */
  async loadProgressUnreadCount(force = false) {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      this.syncProgressUnreadCount(0);
      return;
    }

    try {
      const { orderApi } = require('../../utils/api.js');
      const { data: count } = await fetchWithCache({
        storageKey: CACHE_KEYS.progressUnreadCount,
        requestKey: 'mine:progressUnreadCount',
        ttl: CACHE_TTL.badge,
        force,
        fetcher: async () => {
          const res = await orderApi.getProgressUnreadList();
          if (res && res.success) {
            return getUnreadProgressOrders(res.data || []).length
          }
          throw new Error('获取未读进度数量失败')
        }
      })
      this.syncProgressUnreadCount(count)
    } catch (err) {
      console.error('获取未读进度数量失败:', err);
    }
  },

  syncProgressUnreadCount(count) {
    const nextCount = Number(count) || 0
    setCache(CACHE_KEYS.progressUnreadCount, nextCount)
    this.setData({ progressUnreadCount: nextCount })
    this.syncBadgeToTabBar(this.data.quotedCount, nextCount)
  },

  syncBadgeToTabBar(quotedCount, progressUnreadCount) {
    const app = getApp()
    const nextQuoted = Number(quotedCount) || 0
    const nextProgress = Number(progressUnreadCount) || 0

    app.globalData.quotedCount = nextQuoted
    app.globalData.progressUnreadCount = nextProgress
    app.globalData.badgeTotal = nextQuoted + nextProgress

    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabBar = this.getTabBar()
      tabBar.setData({
        quotedCount: nextQuoted,
        progressUnreadCount: nextProgress
      })
      tabBar.recomputeBadge()
    }
  },

  /**
   * 跳转到有进度更新的订单列表
   */
  goToProgressOrders() {
    wx.navigateTo({
      url: '/pages/orders/orders?unreadType=progress'
    });
  },

  /**
   * 地址管理
   */
  goToAddress() {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/address/address'
    })
  },

  /**
   * 单位管理
   */
  goToUnits() {
    wx.navigateTo({
      url: '/pages/units/units'
    })
  },

  /**
   * 设备管理
   */
  goToDevices() {
    wx.navigateTo({
      url: '/pages/my-devices/my-devices'
    })
  },

  /**
   * 消息订阅管理（引导到设置中管理通知开关）
   */
  manageSubscription() {
    this.showSettings()
  },

  /**
   * 联系客服
   */
  goToService() {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    wx.switchTab({
      url: '/pages/service/service'
    })
  },

  /**
   * 进度申请
   */
  goToProgressApply() {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/progress-apply-list/progress-apply-list'
    })
  },

  /**
   * 内部人员：跳转到维修申请页（免付款）
   */
  goToInternalRepair() {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/repair/repair?internal=1'
    })
  },

  /**
   * 内部人员：跳转到回收申请页（免付款）
   */
  goToInternalRecycle() {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/repair/repair?internal=1&tab=recycle'
    })
  },

  /**
   * 进入管理员页面（根据role跳转到对应页面）
   */
  goToAdmin() {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.role === 'super_admin') {
      // 超级管理员跳转到超级管理员页面
      wx.navigateTo({
        url: '/pages/super-admin/super-admin'
      })
    } else if (userInfo && userInfo.role === 'admin') {
      // 普通管理员跳转到管理员页面
      wx.navigateTo({
        url: '/pages/admin/admin'
      })
    } else {
      wx.showToast({
        title: '无权访问',
        icon: 'none'
      })
    }
  },

  /**
   * 关于我们
   */
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '电子维修服务平台\n\n联系我们：\n电话：15570836828\n公司地址：深圳市南山区国际创新谷1栋B座\n邮箱：3125845799@qq.com',
      showCancel: false
    })
  },

  /**
   * 意见反馈
   */
  showFeedback() {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    wx.switchTab({
      url: '/pages/service/service'
    })
  },

  /**
   * 设置
   */
  showSettings() {
    this.setData({ showSettingsPanel: true })
  },

  /**
   * 关闭设置面板
   */
  closeSettings() {
    this.setData({ showSettingsPanel: false })
  },

  /**
   * 加载设置（从本地存储）
   */
  loadSettings() {
    const settings = wx.getStorageSync('appSettings')
    if (settings) {
      this.setData({ settings })
    }
  },

  /**
   * 保存设置到本地存储
   */
  saveSettings() {
    wx.setStorageSync('appSettings', this.data.settings)
  },

  /**
   * 切换订单通知
   */
  toggleOrderNotify(e) {
    const enabled = e.detail.value
    if (enabled) {
      // 用户开启通知，请求订阅
      wx.requestSubscribeMessage({
        tmplIds: [], // 请在此处填入订单通知的模板ID
        success: (res) => {
          if (res.errMsg === 'requestSubscribeMessage:ok') {
            this.setData({ 'settings.orderNotify': true })
            this.saveSettings()
            wx.showToast({ title: '已开启订单通知', icon: 'success' })
          }
        },
        fail: () => {
          // 用户拒绝订阅，恢复开关状态
          this.setData({ 'settings.orderNotify': false })
          wx.showToast({ title: '订阅被拒绝，无法开启通知', icon: 'none' })
        }
      })
    } else {
      // 用户关闭通知，直接保存设置
      this.setData({ 'settings.orderNotify': false })
      this.saveSettings()
      wx.showToast({ title: '已关闭订单通知', icon: 'none' })
    }
  },

  /**
   * 切换维修进度通知
   */
  toggleProgressNotify(e) {
    const enabled = e.detail.value
    if (enabled) {
      wx.requestSubscribeMessage({
        tmplIds: [], // 请在此处填入进度通知的模板ID
        success: (res) => {
          if (res.errMsg === 'requestSubscribeMessage:ok') {
            this.setData({ 'settings.progressNotify': true })
            this.saveSettings()
            wx.showToast({ title: '已开启进度通知', icon: 'success' })
          }
        },
        fail: () => {
          this.setData({ 'settings.progressNotify': false })
          wx.showToast({ title: '订阅被拒绝，无法开启通知', icon: 'none' })
        }
      })
    } else {
      this.setData({ 'settings.progressNotify': false })
      this.saveSettings()
      wx.showToast({ title: '已关闭进度通知', icon: 'none' })
    }
  },

  /**
   * 切换报价通知
   */
  toggleQuoteNotify(e) {
    const enabled = e.detail.value
    if (enabled) {
      wx.requestSubscribeMessage({
        tmplIds: [], // 请在此处填入报价通知的模板ID
        success: (res) => {
          if (res.errMsg === 'requestSubscribeMessage:ok') {
            this.setData({ 'settings.quoteNotify': true })
            this.saveSettings()
            wx.showToast({ title: '已开启报价通知', icon: 'success' })
          }
        },
        fail: () => {
          this.setData({ 'settings.quoteNotify': false })
          wx.showToast({ title: '订阅被拒绝，无法开启通知', icon: 'none' })
        }
      })
    } else {
      this.setData({ 'settings.quoteNotify': false })
      this.saveSettings()
      wx.showToast({ title: '已关闭报价通知', icon: 'none' })
    }
  },

  /**
   * 计算缓存大小
   */
  calculateCacheSize() {
    try {
      const res = wx.getStorageInfoSync()
      const sizeKB = res.currentSize
      let sizeText = ''
      if (sizeKB < 1024) {
        sizeText = sizeKB + 'KB'
      } else {
        sizeText = (sizeKB / 1024).toFixed(1) + 'MB'
      }
      this.setData({ cacheSize: sizeText })
    } catch (e) {
      this.setData({ cacheSize: '未知' })
    }
  },

  /**
   * 清除缓存
   */
  clearCache() {
    const app = getApp()
    wx.showModal({
      title: '清除缓存',
      content: '将清除本地缓存数据（不会清除登录状态和账号信息），确定继续？',
      confirmText: '确定清除',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          // 保留登录态相关数据
          const token = wx.getStorageSync('token')
          const userInfo = wx.getStorageSync('userInfo')
          const agreedToDisclaimer = wx.getStorageSync('agreedToDisclaimer')
          const appSettings = wx.getStorageSync('appSettings')

          wx.clearStorageSync()

          // 恢复登录态
          if (token) wx.setStorageSync('token', token)
          if (userInfo) wx.setStorageSync('userInfo', userInfo)
          if (agreedToDisclaimer) wx.setStorageSync('agreedToDisclaimer', agreedToDisclaimer)
          if (appSettings) wx.setStorageSync('appSettings', appSettings)

          this.calculateCacheSize()
          wx.showToast({ title: '缓存已清除', icon: 'success' })
        }
      }
    })
  },

  /**
   * 用户协议
   */
  showUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '欢迎使用电子维修服务平台！\n\n1. 本平台提供电子设备维修信息发布与对接服务。\n2. 用户应确保提交的维修信息真实有效。\n3. 维修价格仅供参考，最终价格以实际检测为准。\n4. 用户应遵守相关法律法规，文明使用平台。\n5. 本平台有权对违规用户进行限制处理。\n\n如有疑问请联系客服。',
      showCancel: false,
      confirmText: '我已知晓'
    })
  },

  /**
   * 隐私政策
   */
  showPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私保护：\n\n1. 个人信息仅用于提供服务，不会出售给第三方。\n2. 位置信息仅在您授权时使用，用于地址选择功能。\n3. 相机/相册权限仅用于上传维修照片和头像。\n4. 您可随时在设置中关闭通知权限。\n5. 注销账号后，我们将删除您的所有个人数据。\n\n如有疑问请联系客服。',
      showCancel: false,
      confirmText: '我已知晓'
    })
  },

  /**
   * 注销账号确认
   */
  showDeleteAccountConfirm() {
    wx.showModal({
      title: '注销账号',
      content: '注销后您的所有数据将被永久删除，无法恢复！\n\n如有未完成的订单，请先处理完毕。\n\n确定要注销账号吗？',
      confirmText: '确认注销',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          this.deleteAccount()
        }
      }
    })
  },

  /**
   * 执行注销账号
   */
  async deleteAccount() {
    wx.showLoading({ title: '注销中...' })
    try {
      const app = getApp()
      const token = wx.getStorageSync('token')
      const baseUrl = app.globalData.baseUrl || app.globalData.apiUrl

      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${baseUrl}/api/user/delete-account`,
          method: 'DELETE',
          header: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          success: resolve,
          fail: reject
        })
      })

      wx.hideLoading()

      if (res.statusCode === 200 && res.data && res.data.success) {
        // 清除本地所有数据
        wx.clearStorageSync()
        app.globalData.isLoggedIn = false
        app.globalData.userInfo = null

        wx.showToast({ title: '账号已注销', icon: 'success' })
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/welcome/welcome' })
        }, 1500)
      } else {
        wx.showToast({ title: res.data?.error || '注销失败', icon: 'none' })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('注销账号失败:', error)
      wx.showToast({ title: '注销失败，请稍后重试', icon: 'none' })
    }
  },

  /**
   * 查看订单详情
   */
  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.orderId;
    if (!orderId) {
      wx.showToast({
        title: '订单ID无效',
        icon: 'none'
      });
      return;
    }

    console.log('查看订单详情:', orderId);

    // 跳转到订单详情页面
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${orderId}`
    });
  },

  /**
   * 评价订单
   */
  reviewOrder(e) {
    const orderId = e.currentTarget.dataset.orderId;
    const orderIdNum = e.currentTarget.dataset.id; // 数据库ID
    const orderInfo = e.currentTarget.dataset;

    console.log('========== 点击评价按钮 ==========');
    console.log('orderId (订单号):', orderId);
    console.log('orderId (数据库ID):', orderIdNum);

    if (!orderId) {
      console.log('✗ orderId无效');
      wx.showToast({
        title: '订单ID无效',
        icon: 'none'
      });
      console.log('===================================\n');
      return;
    }

    console.log('评价订单:', orderId);

    // 获取当前订单的详细信息
    const order = this.data.recentOrders.find(item => item.orderId === orderId);
    if (!order) {
      console.log('✗ 订单不存在于列表中');
      console.log('当前订单列表:', this.data.recentOrders.map(o => ({
        orderId: o.orderId,
        id: o.id,
        status: o.status
      })));
      wx.showToast({
        title: '订单信息不存在',
        icon: 'none'
      });
      console.log('===================================\n');
      return;
    }

    console.log('找到订单:', {
      orderId: order.orderId,
      id: order.id,
      status: order.status,
      deviceType: order.deviceType,
      price: order.price
    });

    // 跳转到订单评价页面,传递订单信息。order-review页面会优先从API加载真实价格
    const url = `/pages/order-review/order-review?orderId=${orderId}&orderType=${order.orderType || 'repair'}&deviceType=${order.deviceType || 1}&price=${order.price || ''}&problemDescription=${encodeURIComponent(order.problemDescription || '')}`;
    console.log('跳转URL:', url);
    console.log('===================================\n');

    wx.navigateTo({
      url: url
    });
  },

  /**
   * 退出登录
   */
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 内联退出逻辑，避免依赖 app.logout（防止旧编译包/缓存导致 app 实例方法缺失）
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('userAvatarUrl')
          wx.removeStorageSync('token')
          try {
            const app = getApp()
            if (app && typeof app.logout === 'function') {
              app.logout()
            } else if (app && app.globalData) {
              app.globalData.userInfo = null
              app.globalData.isLoggedIn = false
            }
          } catch (e) {
            console.warn('退出登录获取 app 实例失败:', e)
          }
          wx.redirectTo({
            url: '/pages/login/login'
          })
        }
      }
    })
  }
})
