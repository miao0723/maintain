// pages/device-edit/device-edit.js
const { userDevicesApi } = require('../../utils/api.js')
const { deviceTypes, deviceBrands } = require('../../utils/deviceData.js')

Page({
  data: {
    mode: 'add',           // add | edit
    deviceId: null,
    deviceTypes: deviceTypes,
    // 当前选择的
    selectedTypeId: null,
    isCustomType: false,   // 是否选择了自定义类型
    customTypeName: '',    // 自定义设备类型名称
    customBrandName: '',   // 自定义品牌名称
    selectedBrandIndex: -1,
    selectedBrandName: '',
    selectedModelIndex: -1,
    // 品牌和型号列表
    brandList: [],
    brandNames: [],
    modelList: [],
    modelNames: [],
    // 表单数据
    deviceModel: '',
    deviceNickname: '',
    serialNumber: '',
    deviceCondition: '',
    purchaseDate: '',
    isDefault: false,
    // 设备用途：repair=仅维修，recycle=仅回收，both=均可（默认）
    devicePurpose: 'both',
    purposeOptions: [
      { value: 'both', label: '均可' },
      { value: 'repair', label: '仅维修' },
      { value: 'recycle', label: '仅回收' }
    ],
    todayDate: '',
    canSubmit: false
  },

  onLoad(options) {
    const mode = options.mode || 'add'
    const deviceId = options.id

    // 设置今天的日期
    const now = new Date()
    const todayDate = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-')

    this.setData({ mode, deviceId, todayDate })

    if (mode === 'edit') {
      wx.setNavigationBarTitle({ title: '编辑设备' })
      this.loadDeviceDetail(deviceId)
    } else {
      wx.setNavigationBarTitle({ title: '绑定设备' })
    }
  },

  onShow() {
    // 编辑模式下从列表页返回后重新加载，确保数据最新
    if (this.data.mode === 'edit' && this.data.deviceId && !this.data.deviceModel) {
      this.loadDeviceDetail(this.data.deviceId)
    }
  },

  /**
   * 加载设备详情（编辑模式）
   */
  async loadDeviceDetail(id) {
    wx.showLoading({ title: '加载中...', mask: true })
    try {
      const res = await userDevicesApi.getDetail(id)
      if (res && res.success && res.data) {
        const d = res.data
        const typeId = d.device_type_id

        // 自定义类型（device_type_id === 0）
        if (typeId === 0) {
          this.setData({
            isCustomType: true,
            selectedTypeId: null,
            customTypeName: d.device_type_name || '',
            customBrandName: d.brand_name || '',
            deviceId: d.id,
            deviceModel: d.device_model || '',
            deviceNickname: d.device_nickname || '',
            serialNumber: d.serial_number || '',
            deviceCondition: d.device_condition || '',
            purchaseDate: d.purchase_date || '',
            isDefault: !!d.is_default,
            devicePurpose: d.device_purpose || 'both'
          })
          this.checkCanSubmit()
          wx.hideLoading()
          return
        }

        // 预设类型
        this.setData({ selectedTypeId: typeId, isCustomType: false })
        this.updateBrandList(typeId)

        // 匹配品牌
        const brandIndex = this.data.brandList.findIndex(b => b.name === d.brand_name)
        if (brandIndex >= 0) {
          this.setData({
            selectedBrandIndex: brandIndex,
            selectedBrandName: d.brand_name
          })
          this.updateModelList(brandIndex)
        }

        // 匹配型号
        const modelIndex = this.data.modelList.findIndex(m => m.name === d.device_model)
        this.setData({
          deviceId: d.id,
          deviceModel: d.device_model || '',
          deviceNickname: d.device_nickname || '',
          serialNumber: d.serial_number || '',
          deviceCondition: d.device_condition || '',
          purchaseDate: d.purchase_date || '',
          isDefault: !!d.is_default,
          devicePurpose: d.device_purpose || 'both',
          selectedModelIndex: modelIndex >= 0 ? modelIndex : -1
        })
        this.checkCanSubmit()
      }
    } catch (err) {
      console.error('加载设备详情失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 选择设备类型
   */
  selectType(e) {
    const typeId = e.currentTarget.dataset.id
    // 自定义类型：id 为 'custom'
    if (typeId === 'custom') {
      this.setData({
        isCustomType: true,
        selectedTypeId: null,
        selectedBrandIndex: -1,
        selectedBrandName: '',
        selectedModelIndex: -1,
        modelList: [],
        modelNames: [],
        deviceModel: '',
        brandList: [],
        brandNames: [],
        customTypeName: '',
        customBrandName: ''
      })
      this.checkCanSubmit()
      return
    }

    const numericId = parseInt(typeId)
    this.setData({
      isCustomType: false,
      selectedTypeId: numericId,
      selectedBrandIndex: -1,
      selectedBrandName: '',
      selectedModelIndex: -1,
      modelList: [],
      modelNames: [],
      deviceModel: '',
      brandList: [],
      brandNames: [],
      customTypeName: '',
      customBrandName: ''
    })
    this.updateBrandList(numericId)
    this.checkCanSubmit()
  },

  /**
   * 更新品牌列表
   */
  updateBrandList(typeId) {
    const brandList = deviceBrands[typeId] || []
    const brandNames = brandList.map(b => b.name)
    this.setData({ brandList, brandNames })
  },

  /**
   * 选择品牌
   */
  selectBrand(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      selectedBrandIndex: index,
      selectedBrandName: this.data.brandNames[index],
      selectedModelIndex: -1,
      modelList: [],
      modelNames: []
    })
    this.updateModelList(index)
  },

  /**
   * 更新型号列表（基于当前品牌）
   */
  updateModelList(brandIndex) {
    const brand = this.data.brandList[brandIndex]
    if (brand && brand.models) {
      const modelNames = brand.models.map(m => m.name)
      this.setData({ modelList: brand.models, modelNames })
    }
  },

  /**
   * 选择型号
   */
  selectModel(e) {
    const index = parseInt(e.detail.value)
    const modelName = this.data.modelNames[index]
    this.setData({
      selectedModelIndex: index,
      deviceModel: modelName
    })
    this.checkCanSubmit()
  },

  /**
   * 手动输入自定义类型名称
   */
  onCustomTypeInput(e) {
    this.setData({ customTypeName: e.detail.value })
    this.checkCanSubmit()
  },

  /**
   * 手动输入自定义品牌名称
   */
  onCustomBrandInput(e) {
    this.setData({ customBrandName: e.detail.value })
    this.checkCanSubmit()
  },

  /**
   * 手动输入型号
   */
  onModelInput(e) {
    this.setData({
      deviceModel: e.detail.value,
      selectedModelIndex: -1
    })
    this.checkCanSubmit()
  },

  onNicknameInput(e) {
    this.setData({ deviceNickname: e.detail.value })
  },

  onSerialInput(e) {
    this.setData({ serialNumber: e.detail.value })
  },

  onConditionInput(e) {
    this.setData({ deviceCondition: e.detail.value })
  },

  selectDate(e) {
    this.setData({ purchaseDate: e.detail.value })
  },

  toggleDefault(e) {
    this.setData({ isDefault: e.detail.value })
  },

  // 选择设备用途（维修/回收/均可）
  selectPurpose(e) {
    this.setData({ devicePurpose: e.currentTarget.dataset.value })
  },

  /**
   * 检查是否可以提交
   */
  checkCanSubmit() {
    if (this.data.isCustomType) {
      // 自定义类型：需要填写类型名称和型号
      const canSubmit = !!this.data.customTypeName.trim() && !!this.data.deviceModel.trim()
      this.setData({ canSubmit })
    } else {
      const canSubmit = !!this.data.selectedTypeId && !!this.data.deviceModel.trim()
      this.setData({ canSubmit })
    }
  },

  /**
   * 提交表单
   */
  async submitForm() {
    if (!this.data.canSubmit) {
      const msg = this.data.isCustomType ? '请填写设备类型名称和型号' : '请选择设备类型并填写型号'
      wx.showToast({ title: msg, icon: 'none' })
      return
    }

    const data = {
      device_type_id: this.data.isCustomType ? 0 : this.data.selectedTypeId,
      device_type_name: this.data.isCustomType ? this.data.customTypeName.trim() : null,
      brand_name: this.data.isCustomType
        ? (this.data.customBrandName.trim() || null)
        : (this.data.selectedBrandName || null),
      device_model: this.data.deviceModel.trim(),
      device_nickname: this.data.deviceNickname.trim() || null,
      serial_number: this.data.serialNumber.trim() || null,
      device_condition: this.data.deviceCondition.trim() || null,
      purchase_date: this.data.purchaseDate || null,
      is_default: this.data.isDefault,
      device_purpose: this.data.devicePurpose || 'both'
    }

    wx.showLoading({ title: this.data.mode === 'edit' ? '保存中...' : '绑定中...', mask: true })

    try {
      let res
      if (this.data.mode === 'edit') {
        res = await userDevicesApi.update(this.data.deviceId, data)
      } else {
        res = await userDevicesApi.create(data)
      }

      if (res && res.success) {
        wx.showToast({
          title: this.data.mode === 'edit' ? '保存成功' : '绑定成功',
          icon: 'success'
        })
        setTimeout(() => { wx.navigateBack() }, 1500)
      } else {
        wx.showToast({ title: res?.error || '操作失败', icon: 'none' })
      }
    } catch (err) {
      console.error('提交设备失败:', err)
      wx.showToast({ title: '网络异常，请重试', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  }
})
