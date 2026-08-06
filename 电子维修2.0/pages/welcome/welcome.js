// pages/welcome/welcome.js
Page({
  data: {},

  /**
   * 不同意协议
   */
  onDisagree() {
    wx.showModal({
      title: '提示',
      content: '您需要同意免责协议才能使用本服务',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  /**
   * 同意协议
   */
  onAgree() {
    // 保存用户已同意协议
    wx.setStorageSync('agreedToDisclaimer', true)

    // 跳转到登录授权页面
    wx.redirectTo({
      url: '/pages/login/login'
    })
  }
})
