// pages/scan/scan.js - 拍照识别设备
const { userDevicesApi } = require('../../utils/api.js')
const { deviceTypes } = require('../../utils/deviceData.js')
const { getMpApiBaseUrl } = require('../../utils/mpApi.js')

Page({
  data: {
    phase: 'select',       // select | identifying | result | error
    selectedImage: '',
    resultImage: '',
    stepActive: 0,         // 识别步骤: 0,1,2,3
    deviceInfo: {},        // 识别结果
    selectedModel: '',     // 用户在候选型号中选择的设备类型
    showModelDrawer: false, // 设备型号选择抽屉是否展开
    errorMessage: '',
    uploadTask: null,      // 上传任务引用，用于取消
    submitting: false      // 是否正在提交（防止重复点击）
  },

  onLoad() {
    // 检查登录状态
    if (!getApp().globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        wx.navigateBack({ delta: 1 })
      }, 1500)
    }
  },

  onUnload() {
    // 页面卸载时取消上传任务
    if (this.data.uploadTask) {
      this.data.uploadTask.abort()
    }
  },

  // ========== 拍照 ==========
  takePhoto() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: (res) => {
        this.setData({
          selectedImage: res.tempFilePaths[0]
        })
      },
      fail: (err) => {
        if (err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '拍照失败，请重试', icon: 'none' })
        }
      }
    })
  },

  // ========== 从相册选择 ==========
  chooseFromAlbum() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        this.setData({
          selectedImage: res.tempFilePaths[0]
        })
      },
      fail: (err) => {
        if (err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '选择失败，请重试', icon: 'none' })
        }
      }
    })
  },

  // ========== 重新选择 ==========
  reselect() {
    this.setData({
      phase: 'select',
      selectedImage: '',
      resultImage: '',
      stepActive: 0,
      deviceInfo: {},
      showModelDrawer: false,
      errorMessage: ''
    })
  },

  // ========== 开始识别 ==========
  async startIdentify() {
    if (!this.data.selectedImage) {
      wx.showToast({ title: '请先选择设备图片', icon: 'none' })
      return
    }

    this.setData({ phase: 'identifying', stepActive: 0 })

    // 模拟步骤动画
    const simulateSteps = async () => {
      await this._delay(400)
      this.setData({ stepActive: 1 })  // 上传图片
      await this._delay(1200)
      this.setData({ stepActive: 2 })  // AI分析
    }

    simulateSteps()

    try {
      // 上传图片到服务器
      const uploadResult = await this._uploadImage(this.data.selectedImage)
      
      if (!uploadResult) {
        throw new Error('图片上传失败')
      }

      // 调用 AI 识别
      const identifyResult = await this._identifyDevice(uploadResult)
      
      this.setData({ stepActive: 3 })  // 匹配型号
      await this._delay(600)

      // 处理识别结果
      const deviceInfo = this._processIdentifyResult(identifyResult)
      
      this.setData({
        phase: 'result',
        resultImage: this.data.selectedImage,
        deviceInfo: deviceInfo,
        selectedModel: '',
        showModelDrawer: false
      })

    } catch (err) {
      console.error('识别失败:', err)
      this.setData({
        phase: 'error',
        errorMessage: err.message || '识别失败，请重试'
      })
    }
  },

  // ========== 取消识别 ==========
  cancelIdentify() {
    if (this.data.uploadTask) {
      this.data.uploadTask.abort()
    }
    this.setData({
      phase: 'select',
      stepActive: 0
    })
  },

  // ========== 上传图片 ==========
  _uploadImage(filePath) {
    return new Promise((resolve, reject) => {
      const baseUrl = getApp().globalData.baseUrl || getApp().globalData.apiUrl
      const token = wx.getStorageSync('token')

      const uploadTask = wx.uploadFile({
        url: `${getMpApiBaseUrl()}/scan/identify`,
        filePath: filePath,
        name: 'image',
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.success) {
              resolve(data.data || data.result || data)
            } else {
              reject(new Error(data.message || '识别失败'))
            }
          } catch (e) {
            reject(new Error('服务器返回数据异常'))
          }
        },
        fail: (err) => {
          if (err.errMsg && err.errMsg.indexOf('abort') !== -1) {
            reject(new Error('已取消'))
          } else {
            reject(new Error('网络连接失败，请检查网络'))
          }
        }
      })

      this.setData({ uploadTask })
      uploadTask.onProgressUpdate?.((res) => {
        if (res.progress > 0 && this.data.stepActive < 1) {
          this.setData({ stepActive: 0.5 })
        }
      })
    })
  },

  // ========== AI 识别设备 ==========
  async _identifyDevice(uploadResult) {
    // uploadResult 可能直接就是识别结果，也可能需要二次调用
    // 如果 uploadResult 已经包含设备信息，直接返回
    if (uploadResult.deviceType || uploadResult.device) {
      return uploadResult
    }
    return uploadResult
  },

  // ========== 处理识别结果 ==========
  _processIdentifyResult(result) {
    const raw = result.device || result.deviceInfo || result
    
    // 从 deviceData 中匹配设备类型
    const matchedType = this._matchDeviceType(raw.type, raw.name, raw.category)
    
    // 判断是否为自定义类型：
    // 1. AI 标记为 _isCustom
    // 2. 或者前端关键词匹配也找不到
    const isCustom = raw._isCustom || (!matchedType && raw.type && raw.type !== '自定义')
    
    const info = {
      icon: matchedType ? matchedType.icon : (raw.icon || '📱'),
      name: raw.name || raw.deviceName || raw.model || '未识别设备',
      brand: raw.brand || raw.manufacturer || '',
      model: raw.model || raw.specificModel || '',
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 
                  (typeof raw.probability === 'number' ? raw.probability : 0.5),
      category: isCustom ? '自定义' : (matchedType ? matchedType.name : (raw.type || '')),
      matchedType: isCustom ? null : matchedType,
      isCustom: isCustom,
      // 规则匹配增强字段
      matchedSeries: raw.matchedSeries || raw.series || '',
      ruleMatched: !!raw.ruleMatched,
      modelHint: raw.modelHint || '',
      suggestedModels: raw.suggestedModels || [],
      // 店铺真实可维修产品（来自 deviceData.js），作为候选型号供用户选择
      shopModels: raw.shopModels || [],
      shopBrand: raw.shopBrand || '',
      shopType: raw.shopType || '',
      // 候选设备类型（结合品牌+类型从产品目录取出，含 AI 识别到的具体型号），供用户点选确认
      candidates: raw.candidates && raw.candidates.length ? raw.candidates : (raw.shopModels || []),
      details: [],
      rawData: raw
    }

    // 构建设备详情
    if (info.brand) info.details.push({ label: '品牌', value: info.brand })
    if (info.model) info.details.push({ label: '型号', value: info.model })
    if (info.matchedSeries) info.details.push({ label: '识别系列', value: info.matchedSeries, highlight: true })
    if (info.modelHint) info.details.push({ label: '特征判断', value: info.modelHint, secondary: true })
    if (raw.color) info.details.push({ label: '颜色', value: raw.color })
    if (raw.description) info.details.push({ label: 'AI 描述', value: raw.description })
    if (isCustom) info.details.push({ label: '类型', value: '自定义设备（不在预设列表中）' })

    return info
  },

  // ========== 匹配设备类型 ==========
  _matchDeviceType(typeName, deviceName, category) {
    if (!deviceTypes || !deviceTypes.length) return null

    const rawType = (typeName || '').trim()
    const searchStr = ((typeName || '') + (deviceName || '') + (category || '')).toLowerCase()

    // 第一优先：后端已归一化的类型名与产品目录类型精确匹配（最可靠，不受品牌词干扰）
    if (rawType) {
      const exact = deviceTypes.find(t => t.name === rawType)
      if (exact) return { id: exact.id, name: exact.name, icon: exact.icon }
    }

    // 第二优先：设备"专属类型关键词"（不含品牌名），避免"小米路由器"被品牌词误判成手机
    const strongKeywordMap = {
      '手机': ['手机', 'phone', 'iphone', 'smartphone', '智能手机'],
      '电脑/笔记本': ['电脑', '笔记本', 'laptop', 'macbook', 'thinkpad', 'notebook', 'computer', '一体机', '台式机'],
      '平板': ['平板', 'ipad', 'tablet', 'matepad', '平板电脑'],
      '手表/手环': ['手表', '手环', '穿戴', 'watch', 'smartwatch', '智能手表'],
      '耳机/音响': ['耳机', '音响', '音箱', 'earphone', 'headphone', 'speaker', 'airpods', 'headset', 'earbuds', 'tws'],
      '相机/摄像机': ['相机', '摄像机', '摄像', 'camera', '单反', '微单'],
      '游戏机': ['游戏机', '掌机', 'switch', 'ps5', 'ps4', 'xbox', 'playstation'],
      '传感器/仪器': ['传感器', '仪器', '仪表', 'sensor', 'plc', '示波器', '万用表'],
      '无人机/航拍': ['无人机', '航拍', 'drone', 'quadcopter'],
      '智能家居': ['智能家居', '扫地机', '扫地机器人', '门锁', '摄像头', '智能音箱', '智能门铃'],
      '打印机/办公设备': ['打印机', '办公', 'printer', '投影', 'projector', '复印', '一体机'],
      '服务器': ['服务器', 'server', '机架', 'rack', 'poweredge', 'proliant', 'thinksystem', '刀片', '塔式服务器'],
      '路由器/网络设备': ['路由器', '路由', 'router', '交换机', 'switch', '网关', '中继', 'mesh', '网络设备', '无线ap'],
      '显卡/电脑硬件': ['显卡', '显示卡', 'gpu', 'graphics', '显存', 'rtx', 'gtx', 'radeon', '独显']
    }
    for (const type of deviceTypes) {
      const keywords = strongKeywordMap[type.name] || []
      for (const kw of keywords) {
        if (searchStr.indexOf(kw.toLowerCase()) !== -1) {
          return { id: type.id, name: type.name, icon: type.icon }
        }
      }
    }

    // 第三优先（兜底）：品牌关键词。仅当上面都未命中时才用品牌推断大类，
    // 主要用于只识别到品牌、无明确类型词的手机/电脑等场景。
    const brandKeywordMap = {
      '手机': ['iphone', 'android', 'oppo', 'vivo', 'oneplus', '一加', 'redmi', '红米'],
      '电脑/笔记本': ['联想', 'lenovo', 'dell', '戴尔', 'hp', '惠普', 'asus', '华硕', 'acer', '宏碁', 'thinkpad'],
      '相机/摄像机': ['gopro', '佳能', 'canon', 'nikon', '尼康', 'fujifilm', '富士'],
      '游戏机': ['nintendo', '任天堂', 'steam', 'rog ally'],
      '无人机/航拍': ['dji', '大疆', 'autel', '道通'],
      '智能家居': ['小爱', '天猫精灵', '小度', 'alexa', 'google home', '萤石', '石头', '追觅'],
      '显卡/电脑硬件': ['nvidia', 'amd显卡', '英伟达'],
      '服务器': ['浪潮', 'inspur', 'fusion server'],
      '路由器/网络设备': ['网件', 'netgear', 'tp-link', 'tplink', '华三', 'h3c', 'cisco', '思科']
    }
    for (const type of deviceTypes) {
      const keywords = brandKeywordMap[type.name] || []
      for (const kw of keywords) {
        if (searchStr.indexOf(kw.toLowerCase()) !== -1) {
          return { id: type.id, name: type.name, icon: type.icon }
        }
      }
    }

    return null
  },

  // ========== 打开/关闭设备型号抽屉 ==========
  openModelDrawer() {
    this.setData({ showModelDrawer: true })
  },

  closeModelDrawer() {
    this.setData({ showModelDrawer: false })
  },

  // 阻止抽屉内部点击冒泡到遮罩
  noop() {},

  // ========== 选择设备型号 ==========
  selectModel(e) {
    const model = e.currentTarget.dataset.model
    // 选中后收起抽屉（collapse）
    this.setData({ selectedModel: model, showModelDrawer: false })
  },

  // ========== 获取最终生效的设备型号 ==========
  _getActiveModel() {
    const info = this.data.deviceInfo
    return (this.data.selectedModel || info.model || info.name || '').trim()
  },

  // ========== 添加到设备管理 ==========
  async addToDevices() {
    // 防止重复点击导致多次请求
    if (this.data.submitting) return
    const info = this.data.deviceInfo
    if (!info) return

    const deviceModel = this._getActiveModel()
    if (!deviceModel) {
      wx.showToast({ title: '设备型号未知，请手动添加', icon: 'none' })
      this._navigateToManualAdd(info)
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '添加中...', mask: true })

    try {
      // 后端期望的字段名：brand_name, device_model, device_nickname, device_condition
      const deviceData = {
        device_type_id: info.matchedType ? info.matchedType.id : 0,
        device_type_name: info.matchedType ? info.matchedType.name : (info.category || '其他电子设备'),
        brand_name: info.brand || '',
        device_model: deviceModel,
        device_nickname: this.data.selectedModel || info.name || info.model || '扫码添加的设备',
        serial_number: info.rawData?.serialNumber || info.rawData?.sn || '',
        device_condition: info.rawData?.condition || '良好'
      }

      const res = await userDevicesApi.create(deviceData, { timeout: 15000 })

      wx.hideLoading()

      if (res && res.success) {
        wx.showToast({ title: '已添加到设备管理', icon: 'success' })

        // 跳转到设备管理页
        setTimeout(() => {
          wx.navigateTo({ url: '/pages/my-devices/my-devices' })
        }, 800)
      } else {
        // 兼容 res.message、res.error、res.msg 等不同格式
        const errMsg = res.message || res.error || res.msg || '添加失败'
        wx.showToast({ title: errMsg, icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('添加设备失败:', err)
      // 网络/超时等异常：提示用户重试，停留在当前页，不再自动跳转到手动添加
      const msg = (err && err.message && err.message.includes('超时')) ? '添加超时，请重试' : '添加失败，请重试'
      wx.showToast({ title: msg, icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  /** 导航到手动添加页并预填数据 */
  _navigateToManualAdd(info) {
    const params = []
    if (info.matchedType) params.push(`typeName=${encodeURIComponent(info.matchedType.name)}`)
    if (info.brand) params.push(`brand=${encodeURIComponent(info.brand)}`)
    if (info.model) params.push(`model=${encodeURIComponent(info.model)}`)
    if (info.name) params.push(`nickname=${encodeURIComponent(info.name)}`)
    
    const url = '/pages/device-edit/device-edit?mode=add' + (params.length ? '&' + params.join('&') : '')
    wx.navigateTo({ url })
  },

  // ========== 立即发起维修 ==========
  gotoRepair() {
    const info = this.data.deviceInfo
    const model = this._getActiveModel()

    // 将识别出的设备类型信息封装成维修表单可消费的预填数据
    // 注意字段名需与 repair.js 的 prefillRepair 对齐：device.brand_name / device_model / device_nickname ...
    const app = getApp()
    app.globalData.prefillDeviceData = {
      type: 'repair',
      device: {
        device_type_id: info.matchedType ? info.matchedType.id : 0,
        device_type_name: info.matchedType ? info.matchedType.name : (info.category || '其他电子设备'),
        brand_name: info.brand || '',
        device_model: model,
        device_nickname: this.data.selectedModel || info.name || info.model || '',
        serial_number: info.rawData?.serialNumber || info.rawData?.sn || '',
        device_condition: info.rawData?.condition || '良好',
        source: 'scan'
      }
    }

    wx.switchTab({ url: '/pages/repair/repair' })
  },

  // ========== 立即发起回收 ==========
  gotoRecycle() {
    const info = this.data.deviceInfo
    const model = this._getActiveModel()

    // 将识别出的设备类型信息封装成回收表单可消费的预填数据
    // 复用维修页的回收 Tab（prefillRecycle），其字段名与 prefillRepair 一致
    const app = getApp()
    app.globalData.prefillDeviceData = {
      type: 'recycle',
      device: {
        device_type_id: info.matchedType ? info.matchedType.id : 0,
        device_type_name: info.matchedType ? info.matchedType.name : (info.category || ''),
        brand_name: info.brand || '',
        device_model: model,
        device_nickname: this.data.selectedModel || info.name || info.model || '',
        serial_number: info.rawData?.serialNumber || info.rawData?.sn || '',
        device_condition: info.rawData?.condition || '良好',
        source: 'scan'
      }
    }

    // 跳转到维修页的"回收"Tab，复用其回收表单与预填逻辑
    wx.switchTab({ url: '/pages/repair/repair' })
  },

  // ========== 手动添加 ==========
  manualAdd() {
    wx.navigateTo({ url: '/pages/device-edit/device-edit?mode=add' })
  },

  // ========== 工具方法 ==========
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
})
