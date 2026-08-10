// pages/address-edit/address-edit.js
const { addressApi, locationApi } = require('../../utils/api.js')

Page({
  data: {
    mode: 'add',
    addressId: null,
    saving: false,
    formData: {
      contactName: '',
      contactPhone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      postalCode: '',
      isDefault: false
    },
    regionText: '',
    regionValue: [0, 0, 0],
    regionCode: [],
    selectedTags: [],
    // 位置信息
    longitude: null,
    latitude: null,
    formattedAddress: '',
    locationAccuracy: ''
  },

  onLoad(options) {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    const { mode, id } = options
    this.setData({
      mode: mode || 'add',
      addressId: id
    })

    if (mode === 'edit' && id) {
      this.loadAddress(id)
    } else if (mode === 'add') {
      // 新增地址时智能定位：精确定位优先 -> IP定位兜底
      this.smartLocate()
    }
  },

  /**
   * 智能定位：优先申请精确定位，经纬度失败时再退回IP定位
   */
  async smartLocate() {
    const preciseLocation = await this.getPreciseLocation()

    if (preciseLocation) {
      await this.applyPreciseLocation(preciseLocation)
      return
    }

    // 经纬度定位不可用时，退回到IP城市级定位
    this.getIpLocation()
  },

  /**
   * 获取精确定位
   * 未授权时主动申请，已拒绝时不反复打扰，直接返回null
   */
  getPreciseLocation() {
    return new Promise((resolve) => {
      wx.getSetting({
        success: (res) => {
          const scope = res.authSetting['scope.userLocation']

          if (scope === false) {
            resolve(null)
            return
          }

          const getLocation = () => {
            wx.getLocation({
              type: 'gcj02',
              isHighAccuracy: true,
              highAccuracyExpireTime: 10000,
              success: resolve,
              fail: () => resolve(null)
            })
          }

          if (scope === true) {
            getLocation()
            return
          }

          wx.authorize({
            scope: 'scope.userLocation',
            success: getLocation,
            fail: () => resolve(null)
          })
        },
        fail: () => resolve(null)
      })
    })
  },

  /**
   * 应用精确定位结果
   */
  async applyPreciseLocation(location) {
    try {
      const { longitude, latitude, accuracy } = location
      const result = await locationApi.regeocode(longitude, latitude)

      if (result && result.success && result.data) {
        const {
          province,
          city,
          district,
          township,
          street,
          streetNumber,
          formattedAddress
        } = result.data

        const currentDetail = (this.data.formData.detail || '').trim()
        const generatedDetail = [township, street, streetNumber].filter(Boolean).join('')

        this.setData({
          longitude,
          latitude,
          formattedAddress: formattedAddress || '',
          locationAccuracy: accuracy ? `定位精度约 ${Math.round(accuracy)} 米` : '已使用精确定位',
          formData: {
            ...this.data.formData,
            province: province || '',
            city: city || '',
            district: district || '',
            detail: currentDetail || generatedDetail || this.data.formData.detail
          },
          regionText: `${province || ''} ${city || ''} ${district || ''}`.trim()
        })

        wx.showToast({ title: '已定位到当前位置', icon: 'success', duration: 1500 })
        return
      }
    } catch (e) {
      console.log('精确定位逆地理编码失败，尝试IP定位')
    }

    this.getIpLocation()
  },

  /**
   * 获取IP定位
   */
  async getIpLocation() {
    try {
      const result = await locationApi.getIpLocation()

      if (result && result.success && result.data) {
        const { province, city, district, latitude, longitude } = result.data

        this.setData({
          longitude,
          latitude,
          locationAccuracy: '当前为IP城市级定位，建议点击地图选点修正',
          formData: {
            ...this.data.formData,
            province: province || '',
            city: city || '',
            district: district || ''
          },
          regionText: `${province || ''} ${city || ''} ${district || ''}`
        })

        if (province || city) {
          wx.showToast({ title: '已自动定位到城市', icon: 'success', duration: 1500 })
        }
      }
      // IP定位失败时不再设置默认"北京市"，让用户自己选择地区
    } catch (error) {
      console.error('IP定位失败:', error)
      // 定位失败时不再设置默认"北京市"，让用户自己选择
    }
  },

  /**
   * 加载地址信息
   */
  loadAddress(id) {
    const app = getApp()
    const userId = app.globalData.userInfo.id
    if (!userId) {
      wx.showToast({ title: '用户信息不完整', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    wx.showLoading({ title: '加载中...' })

    addressApi.getAddressList()
      .then(addresses => {
        const address = (addresses || []).find(a => String(a.id) === String(id) && a.user_id === userId)
        if (address) {
          this.setData({
            formData: {
              contactName: address.contact_name || '',
              contactPhone: address.contact_phone || '',
              province: address.province || '',
              city: address.city || '',
              district: address.district || '',
              detail: address.detail_address || '',
              postalCode: address.postal_code || '',
              isDefault: address.is_default || false
            },
            regionText: `${address.province || ''} ${address.city || ''} ${address.district || ''}`,
            selectedTags: address.tags ? (typeof address.tags === 'string' ? JSON.parse(address.tags) : address.tags) : []
          })
        } else {
          wx.showToast({ title: '地址未找到', icon: 'none' })
          setTimeout(() => wx.navigateBack(), 1500)
        }
      })
      .catch(err => {
        console.error('加载地址失败:', err)
        // 回退到本地存储
        const addresses = wx.getStorageSync('addresses') || []
        const address = addresses.find(a => String(a.id) === String(id))
        if (address) {
          this.setData({
            formData: {
              contactName: address.contactName || address.contact_name || '',
              contactPhone: address.contactPhone || address.contact_phone || '',
              province: address.province || '',
              city: address.city || '',
              district: address.district || '',
              detail: address.detail || address.detail_address || '',
              postalCode: address.postalCode || address.postal_code || '',
              isDefault: address.isDefault || address.is_default || false
            },
            regionText: `${address.province || ''} ${address.city || ''} ${address.district || ''}`,
            selectedTags: address.tags || []
          })
        }
      })
      .finally(() => wx.hideLoading())
  },

  /**
   * 输入框变化
   */
  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ [`formData.${field}`]: value })
  },

  /**
   * 地区选择器变化
   */
  onRegionChange(e) {
    const region = e.detail.value
    this.setData({
      regionText: region[0] + ' ' + region[1] + ' ' + region[2],
      'formData.province': region[0],
      'formData.city': region[1],
      'formData.district': region[2],
      regionValue: e.detail.code || []
    })
  },

  chooseRegion() {},

  /**
   * 切换标签
   */
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag
    let selectedTags = [...this.data.selectedTags]
    const index = selectedTags.indexOf(tag)
    if (index !== -1) {
      selectedTags.splice(index, 1)
    } else {
      selectedTags.push(tag)
    }
    this.setData({ selectedTags })
  },

  /**
   * 切换默认地址
   */
  toggleDefault() {
    this.setData({ 'formData.isDefault': !this.data.formData.isDefault })
  },

  /**
   * 打开地图选择
   */
  openMapPicker() {
    const { longitude, latitude } = this.data

    if (longitude && latitude) {
      // 如果已有位置，传递给地图页面
      wx.navigateTo({
        url: `/pages/map-picker/map-picker?longitude=${longitude}&latitude=${latitude}`
      })
    } else {
      // 没有位置，跳转到地图页面使用IP定位
      wx.navigateTo({
        url: '/pages/map-picker/map-picker'
      })
    }
  },

  /**
   * 地图选择回调
   */
  onMapLocationSelect(locationData) {
    console.log('地图选择回调接收到的数据:', locationData)

    const { longitude, latitude, province, city, district, township, street, streetNumber, formattedAddress } = locationData

    // 如果没有获取到详细地址，只更新经纬度
    if (!formattedAddress) {
      this.setData({
        longitude,
        latitude,
        formattedAddress: `位置: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      })
      wx.showToast({
        title: '位置已选择（详细地址需手动填写）',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 构建详细地址：如果有省市区信息，去除重复部分
    let detailAddress = `${township || ''}${street || ''}${streetNumber || ''}`.trim()

    // 如果formattedAddress包含省市区，可以从完整地址中提取详细部分
    if (formattedAddress && province && city) {
      const prefix = `${province}${city}${district || ''}`
      if (formattedAddress.startsWith(prefix)) {
        detailAddress = formattedAddress.substring(prefix.length).trim()
      } else if (formattedAddress.includes(`${city}${district || ''}`)) {
        // 尝试用市+区作为前缀
        const cityPrefix = `${city}${district || ''}`
        detailAddress = formattedAddress.substring(formattedAddress.indexOf(cityPrefix) + cityPrefix.length).trim()
      }
    }

    // 如果提取的详细地址为空，使用完整格式化地址
    if (!detailAddress && formattedAddress) {
      detailAddress = formattedAddress
    }

    // 更新表单数据
    this.setData({
      longitude,
      latitude,
      formattedAddress,
      locationAccuracy: '位置已通过地图精确选择',
      'formData.province': province || this.data.formData.province || '',
      'formData.city': city || this.data.formData.city || '',
      'formData.district': district || this.data.formData.district || '',
      'formData.detail': detailAddress,
      regionText: `${province || this.data.formData.province || ''} ${city || this.data.formData.city || ''} ${district || this.data.formData.district || ''}`
    })

    console.log('更新后的表单数据:', {
      province: this.data.formData.province,
      city: this.data.formData.city,
      district: this.data.formData.district,
      detail: this.data.formData.detail
    })

    wx.showToast({
      title: '位置已选择',
      icon: 'success'
    })
  },

  /**
   * 保存地址
   */
  saveAddress() {
    if (this.data.saving) return

    const { formData, selectedTags, mode, addressId } = this.data

    // 验证
    if (!formData.contactName.trim()) {
      wx.showToast({ title: '请输入联系人', icon: 'none' })
      return
    }
    if (!formData.contactPhone.trim()) {
      wx.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(formData.contactPhone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }
    if (!formData.province || !formData.city || !formData.district) {
      wx.showToast({ title: '请选择所在地区', icon: 'none' })
      return
    }
    if (!formData.detail.trim()) {
      wx.showToast({ title: '请输入详细地址', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...', mask: true })
    this.setData({ saving: true })

    const addressData = {
      contact_name: formData.contactName,
      contact_phone: formData.contactPhone,
      province: formData.province,
      city: formData.city,
      district: formData.district,
      detail_address: formData.detail,
      postal_code: formData.postalCode,
      is_default: formData.isDefault,
      tags: selectedTags
    }

    if (mode === 'edit') {
      addressApi.updateAddress(addressId, addressData)
        .then(() => {
          wx.hideLoading()
          wx.showToast({ title: '更新成功', icon: 'success' })
          setTimeout(() => {
            this.navigateBackWithRefresh()
          }, 1500)
        })
        .catch(err => {
          console.error('更新地址失败:', err)
          wx.hideLoading()
          this.saveAddressToLocal(addressData, addressId, true)
        })
        .finally(() => {
          this.setData({ saving: false })
        })
    } else {
      addressApi.createAddress(addressData)
        .then(() => {
          wx.hideLoading()
          wx.showToast({ title: '保存成功', icon: 'success' })
          setTimeout(() => {
            this.navigateBackWithRefresh()
          }, 1500)
        })
        .catch(err => {
          console.error('保存地址失败:', err)
          wx.hideLoading()
          this.saveAddressToLocal(addressData, null, false)
        })
        .finally(() => {
          this.setData({ saving: false })
        })
    }
  },

  /**
   * 保存地址到本地存储（回退方案）
   */
  saveAddressToLocal(addressData, addressId, isEdit) {
    const app = getApp()
    const userId = app.globalData.userInfo.id
    if (!userId) {
      wx.showToast({ title: '用户信息不完整', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    const address = {
      id: isEdit ? parseInt(addressId) : Date.now(),
      user_id: userId,
      contactName: addressData.contact_name,
      contactPhone: addressData.contact_phone,
      province: addressData.province,
      city: addressData.city,
      district: addressData.district,
      detail: addressData.detail_address,
      postalCode: addressData.postal_code,
      isDefault: addressData.is_default,
      tags: addressData.tags || []
    }

    let addresses = wx.getStorageSync('addresses') || []
    if (address.isDefault) {
      addresses = addresses.map(addr => ({ ...addr, isDefault: false }))
    }

    if (isEdit) {
      const index = addresses.findIndex(addr => addr.id === address.id)
      if (index !== -1) addresses[index] = address
    } else {
      addresses.unshift(address)
    }

    wx.setStorageSync('addresses', addresses)
    wx.showToast({ title: isEdit ? '更新成功（本地）' : '保存成功（本地）', icon: 'success' })
    setTimeout(() => {
      this.navigateBackWithRefresh()
    }, 1500)
  },

  /**
   * 返回上一页并刷新地址列表（如果上一页是维修页面）
   */
  navigateBackWithRefresh() {
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

    wx.navigateBack();
  },

  openLocationSettings() {
    wx.openSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation']) {
          this.smartLocate()
        }
      }
    })
  }
})
