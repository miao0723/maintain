// pages/address/address.js
const { addressApi } = require('../../utils/api.js')

Page({
  data: {
    addressList: [],
    isLoading: false
  },

  onLoad() {
    this.loadAddresses()
  },

  onShow() {
    this.loadAddresses()
  },

  /**
   * 加载地址列表
   */
  loadAddresses() {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return;
    }

    // 获取当前用户ID
    const userId = app.globalData.userInfo?.id;
    if (!userId) {
      // 尝试从本地存储获取地址列表
      const addresses = wx.getStorageSync('addresses') || [];
      this.setData({
        addressList: addresses
      });
      return;
    }

    if (this.data.isLoading) return;

    this.setData({ isLoading: true });

    wx.showLoading({ title: '加载中...' });

    addressApi.getAddressList()
      .then(addresses => {
        // 确保地址数据格式正确
        const formattedAddresses = (addresses || []).map(addr => ({
          ...addr,
          id: addr.id || addr.address_id, // 兼容不同字段名
          contactName: addr.contact_name || addr.contactName,
          contactPhone: addr.contact_phone || addr.contactPhone,
          province: addr.province,
          city: addr.city,
          district: addr.district,
          detail: addr.detail_address || addr.detail,
          postalCode: addr.postal_code || addr.postalCode,
          tags: addr.tags ? (typeof addr.tags === 'string' ? JSON.parse(addr.tags) : addr.tags) : [],
          isDefault: addr.is_default || addr.isDefault || false,
          createTime: addr.created_at || addr.createTime
        }));

        // 验证所有地址都属于当前用户
        const userAddresses = formattedAddresses.filter(addr =>
          addr.user_id === userId || !addr.hasOwnProperty('user_id')
        );

        this.setData({
          addressList: userAddresses
        });
      })
      .catch(err => {
        console.error('加载地址列表失败', err);
        // 如果API失败，回退到本地存储
        const addresses = wx.getStorageSync('addresses') || [];
        this.setData({
          addressList: addresses
        });
      })
      .finally(() => {
        this.setData({ isLoading: false });
        wx.hideLoading();
      });
  },

  /**
   * 添加地址 - 提供两种方式
   */
  addAddress() {
    const itemList = ['从微信地址导入', '手动填写地址']
    wx.showActionSheet({
      itemList,
      success: (res) => {
        if (res.tapIndex === 0) {
          this.chooseWeChatAddress()
        } else {
          wx.navigateTo({
            url: '/pages/address-edit/address-edit?mode=add'
          })
        }
      }
    })
  },

  /**
   * 返回上一页并通知刷新（如果上一页是维修页面）
   */
  onUnload() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const prevPage = pages[pages.length - 2];

    // 检查上一页是否是维修页面
    if (prevPage && prevPage.route && prevPage.route.includes('repair/repair')) {
      // 触发维修页面刷新地址列表
      if (prevPage.loadAddressList && typeof prevPage.loadAddressList === 'function') {
        prevPage.loadAddressList();
      }
    }
  },

  /**
   * 调用微信地址选择
   */
  chooseWeChatAddress() {
    wx.chooseAddress({
      success: (res) => {
        const newAddress = {
          contact_name: res.userName,
          contact_phone: res.telNumber,
          province: res.provinceName,
          city: res.cityName,
          district: res.countyName,
          detail_address: res.detailInfo,
          postal_code: res.postalCode,
          tags: this.generateTags(res.detailInfo),
          is_default: this.data.addressList.length === 0
        }
        this.createAddressToServer(newAddress)
      },
      fail: (err) => {
        if (err.errMsg.includes('cancel')) return
        wx.navigateTo({
          url: '/pages/address-edit/address-edit?mode=add'
        })
      }
    })
  },

  /**
   * 生成地址标签
   */
  generateTags(detail) {
    const tags = []
    if (detail.includes('家')) tags.push('家')
    if (detail.includes('公司') || detail.includes('单位')) tags.push('公司')
    if (detail.includes('学校')) tags.push('学校')
    return tags
  },

  /**
   * 通过API创建地址
   */
  createAddressToServer(address) {
    wx.showLoading({ title: '保存中...', mask: true })

    addressApi.createAddress(address)
      .then(() => {
        this.loadAddresses()
        wx.showToast({ title: '保存成功', icon: 'success' })
      })
      .catch(err => {
        console.error('保存地址失败', err)
        // 回退到本地存储
        const app = getApp()
        let addresses = wx.getStorageSync('addresses') || []
        if (address.is_default) {
          addresses = addresses.map(addr => ({ ...addr, isDefault: false }))
        }
        addresses.unshift({
          id: Date.now(),
          user_id: app.globalData.userInfo.id,
          contactName: address.contact_name,
          contactPhone: address.contact_phone,
          province: address.province,
          city: address.city,
          district: address.district,
          detail: address.detail_address,
          postalCode: address.postal_code,
          isDefault: address.is_default,
          tags: address.tags || []
        })
        wx.setStorageSync('addresses', addresses)
        this.setData({ addressList: addresses })
        wx.showToast({ title: '保存成功（本地）', icon: 'success' })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  /**
   * 编辑地址
   */
  editAddress(e) {
    const address = e.currentTarget.dataset.address
    wx.navigateTo({
      url: `/pages/address-edit/address-edit?mode=edit&id=${address.id}`
    })
  },

  /**
   * 设为默认
   */
  setDefault(e) {
    const id = e.currentTarget.dataset.id
    wx.showLoading({ title: '设置中...' })

    addressApi.setDefaultAddress(id)
      .then(() => {
        this.loadAddresses()
        wx.showToast({ title: '设置成功', icon: 'success' })
      })
      .catch(err => {
        console.error('设置默认地址失败', err)
        let addresses = this.data.addressList.map(addr => ({
          ...addr,
          isDefault: addr.id === id
        }))
        wx.setStorageSync('addresses', addresses)
        this.setData({ addressList: addresses })
        wx.showToast({ title: '设置成功（本地）', icon: 'success' })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  /**
   * 删除地址
   */
  deleteAddress(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '提示',
      content: '确定要删除这个地址吗？',
      confirmText: '删除',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })

          addressApi.deleteAddress(id)
            .then(() => {
              this.loadAddresses()
              wx.showToast({ title: '删除成功', icon: 'success' })
            })
            .catch(err => {
              console.error('删除地址失败', err)
              let addresses = this.data.addressList.filter(addr => addr.id !== id)
              if (addresses.length > 0 && this.data.addressList.some(addr => addr.id === id && addr.isDefault)) {
                addresses[0].isDefault = true
              }
              wx.setStorageSync('addresses', addresses)
              this.setData({ addressList: addresses })
              wx.showToast({ title: '删除成功（本地）', icon: 'success' })
            })
            .finally(() => {
              wx.hideLoading()
            })
        }
      }
    })
  }
})
