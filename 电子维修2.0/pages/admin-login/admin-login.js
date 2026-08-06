// pages/admin-login/admin-login.js
const app = getApp();

Page({
  data: {
    phone: '',
    loading: false
  },

  onLoad() {
    // 检查是否已登录
    const token = wx.getStorageSync('admin_token');
    const userInfo = wx.getStorageSync('admin_info');

    if (token && userInfo && userInfo.role === 'admin') {
      wx.redirectTo({
        url: '/pages/admin/admin'
      });
    }
  },

  // 手机号输入
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 登录
  onLogin() {
    const { phone } = this.data;

    // 验证手机号
    if (!phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      });
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    wx.request({
      url: `${(app.globalData.baseUrl || app.globalData.apiUrl)}/api/admin/login`,
      method: 'POST',
      data: { phone },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.data.success) {
          // 保存token和用户信息
          wx.setStorageSync('admin_token', res.data.token);
          wx.setStorageSync('admin_info', res.data.user);

          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });

          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/admin/admin'
            });
          }, 1500);
        } else {
          wx.showToast({
            title: res.data.error || '登录失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('登录失败:', err);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 返回首页
  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({
          url: '/pages/home/home'
        });
      }
    });
  }
});
