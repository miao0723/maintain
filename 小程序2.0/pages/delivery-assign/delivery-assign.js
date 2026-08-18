// pages/delivery-assign/delivery-assign.js
const app = getApp();
const { getMpApiBaseUrl } = require('../../utils/mpApi.js');

Page({
  data: {
    orderId: null,
    orderDetail: null,
    loading: true,
    submitting: false,

    // 配送员列表
    deliveryPersons: [],
    selectedPersonId: null,
    selectedPerson: null,

    // 地址选择
    addressList: [],
    selectedAddressId: null,
    selectedAddress: null,

    // 配送费用
    deliveryFee: 0,

    token: null,
    baseUrl: ''
  },

  onLoad(options) {
    const orderId = options.orderId;

    if (!orderId) {
      wx.showToast({ title: '订单ID缺失', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({
      orderId: orderId,
      token: wx.getStorageSync('token'),
      baseUrl: app.globalData.baseUrl
    });

    this.loadOrderDetail();
    this.loadDeliveryPersons();
    this.loadAddressList();
  },

  /**
   * 加载订单详情
   */
  async loadOrderDetail() {
    try {
      const res = await wx.request({
        url: `${getMpApiBaseUrl()}/orders/${this.data.orderId}/detail`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.statusCode === 200 && res.data && res.data.success) {
        this.setData({
          orderDetail: res.data.data.order,
          loading: false
        });
      } else {
        wx.showToast({ title: '加载订单失败', icon: 'none' });
      }
    } catch (error) {
      console.error('加载订单详情失败:', error);
      wx.showToast({ title: '网络错误', icon: 'none' });
    }
  },

  /**
   * 加载可用配送员列表
   */
  async loadDeliveryPersons() {
    try {
      const res = await wx.request({
        url: `${getMpApiBaseUrl()}/delivery/persons`,
        method: 'GET',
        data: {
          available: 'true'
        },
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.statusCode === 200 && res.data && res.data.success) {
        this.setData({
          deliveryPersons: res.data.data.persons || []
        });
      }
    } catch (error) {
      console.error('加载配送员失败:', error);
    }
  },

  /**
   * 加载用户地址列表
   */
  async loadAddressList() {
    try {
      const { addressApi } = require('../../utils/api.js');
      const addresses = await addressApi.getAddressList();

      this.setData({
        addressList: addresses || []
      });
    } catch (error) {
      console.error('加载地址失败:', error);
      const addresses = wx.getStorageSync('addresses') || [];
      this.setData({ addressList: addresses });
    }
  },

  /**
   * 选择配送员
   */
  selectDeliveryPerson(e) {
    const personId = String(e.currentTarget.dataset.id);
    const person = this.data.deliveryPersons.find(p => String(p.id) === personId);

    if (person) {
      this.setData({
        selectedPersonId: personId,
        selectedPerson: person
      });
    }
  },

  /**
   * 选择地址
   */
  selectAddress(e) {
    const addressId = String(e.currentTarget.dataset.id);
    const address = this.data.addressList.find(a => String(a.id) === addressId);

    if (address) {
      this.setData({
        selectedAddressId: addressId,
        selectedAddress: address
      });
    }
  },

  /**
   * 配送费输入
   */
  onDeliveryFeeInput(e) {
    const value = parseFloat(e.detail.value) || 0;
    this.setData({
      deliveryFee: value
    });
  },

  /**
   * 提交配送分配
   */
  async submit() {
    if (this.data.submitting) return;

    const { orderId, selectedPersonId, selectedAddressId, deliveryFee } = this.data;

    if (!selectedPersonId) {
      wx.showToast({ title: '请选择配送员', icon: 'none' });
      return;
    }

    if (!selectedAddressId) {
      wx.showToast({ title: '请选择配送地址', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认配送分配',
      content: `配送员：${this.data.selectedPerson.name}\n配送费：¥${deliveryFee.toFixed(2)}`,
      success: async (res) => {
        if (!res.confirm) return;

        wx.showLoading({ title: '分配中...', mask: true });
        this.setData({ submitting: true });

        try {
          const response = await wx.request({
            url: `${getMpApiBaseUrl()}/delivery/orders/${orderId}/assign`,
            method: 'PUT',
            header: {
              'Authorization': `Bearer ${this.data.token}`,
              'Content-Type': 'application/json'
            },
            data: {
              delivery_person_id: selectedPersonId,
              delivery_address_id: selectedAddressId,
              delivery_fee: deliveryFee
            }
          });

          wx.hideLoading();

          if (response.statusCode === 200 && response.data && response.data.success) {
            wx.showToast({ title: '分配成功', icon: 'success' });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } else {
            wx.showToast({ title: response.data?.error || '分配失败', icon: 'none' });
          }
        } catch (error) {
          wx.hideLoading();
          console.error('配送分配失败:', error);
          wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        } finally {
          this.setData({ submitting: false });
        }
      }
    });
  },

  /**
   * 添加新地址
   */
  addNewAddress() {
    wx.navigateTo({
      url: '/pages/address/address'
    });
  },

  /**
   * 返回
   */
  goBack() {
    wx.navigateBack();
  }
});
