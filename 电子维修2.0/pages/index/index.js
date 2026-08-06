// pages/index/index.js
const { DEFAULT_AVATAR_URL, normalizeAvatarUrl } = require('../../utils/avatar.js')

Page({
  data: {
    userInfo: {
      avatarUrl: DEFAULT_AVATAR_URL,
      nickName: '微信用户',
      role: 'user'
    },
    userReady: false,
    loadingUserInfo: false,
    businessScope: [
      { id: 1, icon: '📱', name: '手机维修', imageUrl: 'https://img.icons8.com/color/144/smartphone--v1.png' },
      { id: 2, icon: '💻', name: '电脑维修', imageUrl: 'https://img.icons8.com/color/144/laptop--v1.png' },
      { id: 3, icon: '📟', name: '平板维修', imageUrl: 'https://img.icons8.com/color/144/ipad-pro--v1.png' },
      { id: 4, icon: '⌚', name: '智能手表', imageUrl: 'https://img.icons8.com/color/144/smartwatch--v1.png' },
      { id: 5, icon: '🎧', name: '耳机设备', imageUrl: 'https://img.icons8.com/color/144/headphones--v1.png' },
      { id: 6, icon: '📷', name: '相机设备', imageUrl: 'https://img.icons8.com/color/144/camera--v1.png' },
      { id: 7, icon: '🎮', name: '游戏机', imageUrl: 'https://img.icons8.com/color/144/xbox-controller--v1.png' },
      { id: 8, icon: '🖥️', name: '显示器', imageUrl: 'https://img.icons8.com/color/144/monitor--v1.png' },
      { id: 9, icon: '🔊', name: '音响设备', imageUrl: 'https://img.icons8.com/color/144/speaker--v1.png' },
      { id: 10, icon: '📡', name: '网络设备', imageUrl: 'https://img.icons8.com/color/144/router--v1.png' },
      { id: 11, icon: '🚁', name: '无人机', imageUrl: 'https://img.icons8.com/color/144/drone--v1.png' },
      { id: 12, icon: '🔧', name: '其他设备', imageUrl: 'https://img.icons8.com/color/144/maintenance--v1.png' },
      { id: 13, icon: '📽️', name: '投影仪', imageUrl: 'https://img.icons8.com/color/144/projector.png' },
      { id: 14, icon: '🕶️', name: 'VR/AR设备', imageUrl: 'https://img.icons8.com/color/144/virtual-reality.png' },
      { id: 15, icon: '🎥', name: '监控安防', imageUrl: 'https://img.icons8.com/color/144/cctv-camera.png' },
      { id: 16, icon: '🔋', name: '充电宝', imageUrl: 'https://img.icons8.com/color/144/power-bank.png' },
      { id: 17, icon: '📖', name: '电子书阅读器', imageUrl: 'https://img.icons8.com/color/144/ereader.png' },
      { id: 18, icon: '🚗', name: '车载电子', imageUrl: 'https://img.icons8.com/color/144/car.png' }
    ],
    successCases: [
      {
        id: 1,
        icon: '📱',
        title: 'iPhone主板修复',
        desc: '成功修复无法开机问题，数据完好无损',
        tag: '透明报价后维修'
      },
      {
        id: 2,
        icon: '💻',
        title: 'MacBook数据恢复',
        desc: '硬盘故障导致数据丢失，100%恢复',
        tag: '检测后实时同步'
      },
      {
        id: 3,
        icon: '📟',
        title: 'iPad屏幕更换',
        desc: '碎屏更换，原厂品质，手感如新',
        tag: '报价确认后开修'
      },
      {
        id: 4,
        icon: '⌚',
        title: 'Apple Watch修复',
        desc: '进水损坏修复，功能完全恢复',
        tag: '多节点反馈'
      },
      {
        id: 5,
        icon: '🎮',
        title: 'PS5散热与蓝屏修复',
        desc: '拆机清洁与故障定位后恢复稳定运行',
        tag: '全品类接修'
      },
      {
        id: 6,
        icon: '🚁',
        title: '无人机云台校准',
        desc: '云台抖动与图传异常处理后恢复飞行拍摄',
        tag: '特殊设备受理'
      }
    ],
    partners: [
      { id: 1, logo: '🏢', name: '华为科技' },
      { id: 2, logo: '🏛️', name: '小米集团' },
      { id: 3, logo: '🏬', name: 'OPPO公司' },
      { id: 4, logo: '🏭', name: 'vivo科技' },
      { id: 5, logo: '🏗️', name: '三星电子' },
      { id: 6, logo: '🏰', name: '联想集团' }
    ],
    companyProfile: {
      name: '深圳市众云信息科技有限公司',
      intro: '我们专注于电子设备检测、维修、报价确认与进度反馈，面向个人和企业用户提供统一受理服务。',
      description: '当前支持手机、电脑、平板、相机、耳机、游戏机、无人机、投影仪、VR/AR、监控安防、充电宝、电子书阅读器、车载电子等设备维修。用户可以先通过 AI 故障自检快速判断问题，再联系在线客服复核，确认后直接提交维修订单。整个维修流程支持节点反馈与透明报价，尽量让每一步都清楚可追踪。'
    },
    companyHighlights: [
      { id: 1, title: '服务对象', value: '个人 / 企业' },
      { id: 2, title: '服务内容', value: '检测 / 维修 / 报价 / 回收' },
      { id: 3, title: '流程特点', value: '透明 / 可追踪' }
    ],
    contactInfo: {
      company: '深圳市众云信息科技有限公司',
      phone: '15570836828',
      address: '深圳市南山区国际创新谷1栋B座',
      email: '3125845799@qq.com'
    }
  },

  onLoad() {
    if (!this.checkLogin()) {
      return
    }
    this.hydrateUserInfo()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabBar = this.getTabBar()
      tabBar.setData({ selected: 0 })
      tabBar.refreshBadge()
    }

    if (!this.checkLogin()) {
      return
    }
    this.hydrateUserInfo()
  },

  /**
   * 业务范围图标加载失败时，显示 emoji 兜底
   */
  onScopeImgError(e) {
    const index = e.currentTarget.dataset.index;
    const businessScope = this.data.businessScope;
    if (businessScope && businessScope[index]) {
      const key = `businessScope[${index}].imageUrl`;
      this.setData({ [key]: '' });
    }
  },

  /**
   * 检查登录状态
   */
  checkLogin() {
    const token = wx.getStorageSync('token')

    if (!token) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return false
    }

    return true
  },

  getDisplayUserInfo(source = {}) {
    return {
      avatarUrl: normalizeAvatarUrl(source.avatar_url || source.avatarUrl),
      nickName: source.nickname || source.nickName || '微信用户',
      role: source.role || 'user'
    }
  },

  async hydrateUserInfo() {
    const app = getApp()
    const localUserInfo = wx.getStorageSync('userInfo') || app.globalData.userInfo

    if (localUserInfo) {
      const displayUserInfo = this.getDisplayUserInfo(localUserInfo)
      this.setData({
        userInfo: displayUserInfo,
        userReady: true
      })
    }

    if (this.data.loadingUserInfo) {
      return
    }

    this.setData({ loadingUserInfo: true })

    try {
      app.globalData.isLoggedIn = true
      if (localUserInfo) {
        app.globalData.userInfo = localUserInfo
      }

      const latestUserInfo = await app.fetchUserInfoFromAPI()
      if (latestUserInfo) {
        const displayUserInfo = this.getDisplayUserInfo(latestUserInfo)
        this.setData({
          userInfo: displayUserInfo,
          userReady: true
        })
      }
    } catch (error) {
      console.error('首页加载用户信息失败:', error)
    } finally {
      this.setData({ loadingUserInfo: false })
    }
  },

  onAvatarError() {
    if (this.data.userInfo.avatarUrl !== DEFAULT_AVATAR_URL) {
      this.setData({
        'userInfo.avatarUrl': DEFAULT_AVATAR_URL
      })
    }
  },

  goToMine() {
    wx.switchTab({
      url: '/pages/mine/mine'
    })
  },

  /**
   * 跳转到 AI 故障自检页面
   */
  goToDiagnose() {
    wx.navigateTo({
      url: '/pages/diagnose/diagnose'
    })
  },

  /**
   * 跳转到物品回收页面
   */
  goToRecycle() {
    wx.navigateTo({
      url: '/pages/recycle/recycle'
    })
  }
})
