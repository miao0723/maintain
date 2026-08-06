// pages/unit-edit/unit-edit.js
const { unitApi } = require('../../utils/api.js');

Page({
  data: {
    mode: 'add', // add 或 edit
    unitId: null,
    formData: {
      name: '',
      address: '',
      contactName: '',
      contactPhone: '',
      isDefault: false
    }
  },

  onLoad(options) {
    const { mode, id } = options

    this.setData({
      mode: mode || 'add',
      unitId: id
    })

    if (mode === 'edit' && id) {
      this.loadUnit(id)
    }
  },

  /**
   * 加载单位信息
   */
  loadUnit(id) {
    const units = wx.getStorageSync('units') || []
    const unit = units.find(u => u.id == id)

    if (unit) {
      this.setData({
        formData: unit
      })
      return
    }

    // 如果本地存储没有，尝试从API获取
    unitApi.getUnitList()
      .then(units => {
        const unit = units.find(u => u.id == id)
        if (unit) {
          this.setData({
            formData: {
              name: unit.name,
              address: unit.address,
              contactName: unit.contact_name,
              contactPhone: unit.contact_phone,
              isDefault: unit.is_default,
              createTime: unit.created_at
            }
          })
        }
      })
      .catch(err => {
        console.error('加载单位信息失败', err)
      })
  },

  /**
   * 输入框变化
   */
  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value

    this.setData({
      [`formData.${field}`]: value
    })
  },

  /**
   * 切换默认单位
   */
  toggleDefault() {
    this.setData({
      'formData.isDefault': !this.data.formData.isDefault
    })
  },

  /**
   * 保存单位
   */
  saveUnit() {
    const { formData, mode, unitId } = this.data

    // 验证
    if (!formData.name.trim()) {
      wx.showToast({
        title: '请输入单位名称',
        icon: 'none'
      })
      return
    }

    if (!formData.contactName.trim()) {
      wx.showToast({
        title: '请输入联系人',
        icon: 'none'
      })
      return
    }

    if (!formData.contactPhone.trim()) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      })
      return
    }

    if (!/^1[3-9]\d{9}$/.test(formData.contactPhone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      })
      return
    }

    if (!formData.address.trim()) {
      wx.showToast({
        title: '请输入单位地址',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '保存中...',
      mask: true
    })

    const unitData = {
      name: formData.name,
      address: formData.address,
      contact_name: formData.contactName,
      contact_phone: formData.contactPhone,
      is_default: formData.isDefault
    }

    let savePromise

    if (mode === 'edit') {
      // 编辑模式
      savePromise = unitApi.updateUnit(unitId, unitData)
    } else {
      // 新增模式
      savePromise = unitApi.createUnit(unitData)
    }

    savePromise
      .then(result => {
        wx.hideLoading()
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })

        // 通知上一页刷新单位列表
        const pages = getCurrentPages()
        console.log('当前页面栈长度:', pages.length);

        if (pages.length >= 2) {
          const prevPage = pages[pages.length - 2]
          console.log('上一页:', prevPage);

          // 检查上一页是否有 loadUnitList 方法
          if (prevPage.loadUnitList && typeof prevPage.loadUnitList === 'function') {
            console.log('调用上一页的 loadUnitList 方法');
            setTimeout(() => {
              prevPage.loadUnitList()
            }, 100)
          } else {
            console.log('上一页没有 loadUnitList 方法');
          }
        } else {
          console.log('页面栈长度不足2，无法通知上一页');
        }

        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      })
      .catch(err => {
        wx.hideLoading()
        console.error('保存单位失败:', err)
        wx.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        })
      })
  }
})