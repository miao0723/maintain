// pages/admin-login/admin-login.js
const app = getApp();
const { getApiBaseCandidates } = require('../../utils/runtimeConfig.js')
const { normalizeBaseUrl } = require('../../utils/networkConfig.js')

Page({
  data: {
    phone: '',
    loading: false
  },

  onLoad() {
    // 检查是否已登录（兼容手机号登录的 admin_token 与统一后台的 token）
    const token = wx.getStorageSync('admin_token') || wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('admin_info') || wx.getStorageSync('userInfo');

    if (token && userInfo && (userInfo.role === 'admin' || userInfo.role === 'super_admin')) {
      wx.redirectTo({
        url: '/pages/super-admin/super-admin'
      });
    }

    // 诊断：打印当前 API 配置
    const diagBaseUrl = app.globalData.baseUrl || '未设置'
    const diagStored = wx.getStorageSync('apiBaseUrl') || '无'
    console.log('========== 管理员登录诊断 ==========')
    console.log('baseUrl:', diagBaseUrl)
    console.log('stored apiBaseUrl:', diagStored)
    console.log('candidates:', getApiBaseCandidates())
    console.log('=====================================')
  },

  // 手机号输入
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 登录
  async onLogin() {
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

    // 使用带候选地址重试的请求方式（与 api.js 一致）
    const candidates = getApiBaseCandidates();
    const diagInfo = 'baseUrl: ' + (app.globalData.baseUrl || '未设置') +
      '\ncandidates: ' + JSON.stringify(candidates);

    const tryLogin = (index) => {
      if (index >= candidates.length) {
        this.setData({ loading: false });
        wx.showModal({
          title: '管理员登录诊断',
          content: '所有 API 地址均已尝试失败\n\n' + diagInfo,
          showCancel: false
        });
        return;
      }

      const baseUrl = candidates[index];
      const fullUrl = baseUrl + '/admin/login';
      console.log('管理员登录尝试:', fullUrl, 'index:', index);

      wx.request({
        url: fullUrl,
        method: 'POST',
        data: { phone },
        timeout: 15000,
        header: {
          'content-type': 'application/json'
        },
        success: (res) => {
          if (res.data && res.data.success) {
            // 保存token和用户信息（兼容统一后台 super-admin 的取钥约定）
            wx.setStorageSync('admin_token', res.data.token);
            wx.setStorageSync('admin_info', res.data.user);
            wx.setStorageSync('token', res.data.token);
            wx.setStorageSync('userInfo', res.data.user);

            wx.showToast({
              title: '登录成功',
              icon: 'success'
            });

            setTimeout(() => {
              wx.redirectTo({
                url: '/pages/super-admin/super-admin'
              });
            }, 1500);
            this.setData({ loading: false });
          } else {
            // 业务层错误（如手机号未注册）
            this.setData({ loading: false });
            wx.showModal({
              title: '管理员登录诊断',
              content: '服务器返回:\nerror: ' + (res.data.error || res.data.message || '登录失败') +
                '\nURL: ' + fullUrl,
              showCancel: false
            });
          }
        },
        fail: (err) => {
          console.error('登录请求失败:', fullUrl, err);
          if (index < candidates.length - 1) {
            console.log('尝试下一个地址:', candidates[index + 1]);
            tryLogin(index + 1);
          } else {
            this.setData({ loading: false });
            wx.showModal({
              title: '管理员登录诊断',
              content: '网络请求失败\n\nerrMsg: ' + (err.errMsg || '未知') +
                '\n最后尝试 URL: ' + fullUrl +
                '\n\n' + diagInfo,
              showCancel: false
            });
          }
        }
      });
    };

    tryLogin(0);
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
