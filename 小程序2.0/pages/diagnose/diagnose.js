// pages/diagnose/diagnose.js
const { diagnoseApi } = require('../../utils/api.js')

// 设备品牌映射
const brandMap = {
  '手机': ['Apple/苹果', 'Huawei/华为', 'Xiaomi/小米', 'Samsung/三星', 'OPPO', 'vivo', 'Honor/荣耀', 'OnePlus/一加', 'realme', '其他品牌'],
  '笔记本': ['Apple/苹果', 'Lenovo/联想', 'Huawei/华为', 'Dell/戴尔', 'HP/惠普', 'ASUS/华硕', 'Xiaomi/小米', 'Acer/宏碁', 'Honor/荣耀', '其他品牌'],
  '平板': ['Apple/苹果', 'Huawei/华为', 'Xiaomi/小米', 'Samsung/三星', 'Lenovo/联想', 'Honor/荣耀', '其他品牌'],
  '手表': ['Apple/苹果', 'Huawei/华为', 'Samsung/三星', 'Xiaomi/小米', 'OPPO', 'Amazfit/华米', '其他品牌'],
  '耳机': ['Apple/苹果', 'Sony/索尼', 'Huawei/华为', 'Samsung/三星', 'Bose', 'Sennheiser/森海塞尔', 'OPPO', 'Xiaomi/小米', '其他品牌'],
  '相机': ['Canon/佳能', 'Sony/索尼', 'Nikon/尼康', 'Fujifilm/富士', 'Panasonic/松下', '其他品牌'],
  '无人机': ['DJI/大疆', '其他品牌'],
  '游戏机': ['Sony/索尼 PlayStation', 'Nintendo/任天堂', 'Microsoft/微软 Xbox', '其他品牌'],
  '显示器': ['Dell/戴尔', 'Samsung/三星', 'LG', 'ASUS/华硕', 'BenQ/明基', '其他品牌'],
  '其他设备': ['请手动输入品牌']
}

// 故障现象映射
const symptomMap = {
  '手机': ['屏幕碎裂/花屏', '无法开机', '电池耗电快', '无法充电', '摄像头故障', '扬声器/听筒无声', '触屏失灵', '信号差/无网络', '进水', '机身发热', '按键失灵', '其他故障'],
  '笔记本': ['无法开机', '屏幕花屏/黑屏', '电池不充电', '键盘失灵', '散热异常/过热关机', '运行卡顿', '无法联网', 'USB接口故障', '进水', '异响', '其他故障'],
  '平板': ['屏幕碎裂', '触屏失灵', '无法开机', '无法充电', '电池不耐用', '卡顿死机', '扬声器故障', '其他故障'],
  '手表': ['屏幕不亮', '电池不耐用', '无法充电', '触屏失灵', '无法开机', '表冠/按键失灵', '蓝牙连接异常', '其他故障'],
  '耳机': ['单耳无声', '降噪失效', '充电仓不工作', '连接不稳定', '续航短', '触控失灵', '音质变差', '其他故障'],
  '相机': ['无法开机', '镜头无法伸出', '拍照模糊', '对焦失灵', '闪光灯不亮', '屏幕花屏', '无法读取存储卡', '机身进水', '其他故障'],
  '无人机': ['无法起飞', '飞不稳/漂移', '图传丢失', '云台抖动', '电池鼓包', '遥控器失灵', '电机不转', '炸机损坏', '其他故障'],
  '游戏机': ['不读碟', '无法开机', '手柄漂移', '散热异响', '蓝屏/红灯', '无法联网', 'HDMI无输出', '其他故障'],
  '显示器': ['屏幕花屏/条纹', '无显示/黑屏', '背光不亮', '图像闪烁', '偏色', '接口故障', '其他故障'],
  '其他设备': ['无法开机', '电源故障', '功能异常', '连接故障', '外观损坏', '其他故障']
}

Page({
  data: {
    // 诊断步骤: 1-设备类型, 2-品牌, 3-故障现象, 4-补充详情, 5-分析中, 6-结果
    step: 1,
    totalSteps: 4,

    // 用户选择
    deviceType: '',
    brand: '',
    customBrand: '',
    symptom: '',
    customSymptom: '',
    details: '',

    // 选项列表
    deviceTypes: [
      { name: '手机', icon: '📱', imageUrl: 'https://img.icons8.com/color/144/smartphone--v1.png' },
      { name: '笔记本', icon: '💻', imageUrl: 'https://img.icons8.com/color/144/laptop--v1.png' },
      { name: '平板', icon: '📟', imageUrl: 'https://img.icons8.com/color/144/ipad-pro--v1.png' },
      { name: '手表', icon: '⌚', imageUrl: 'https://img.icons8.com/color/144/smartwatch--v1.png' },
      { name: '耳机', icon: '🎧', imageUrl: 'https://img.icons8.com/color/144/headphones--v1.png' },
      { name: '相机', icon: '📷', imageUrl: 'https://img.icons8.com/color/144/camera--v1.png' },
      { name: '无人机', icon: '🚁', imageUrl: 'https://img.icons8.com/color/144/drone--v1.png' },
      { name: '游戏机', icon: '🎮', imageUrl: 'https://img.icons8.com/color/144/xbox-controller--v1.png' },
      { name: '显示器', icon: '🖥', imageUrl: 'https://img.icons8.com/color/144/monitor--v1.png' },
      { name: '其他设备', icon: '🔧', imageUrl: 'https://img.icons8.com/color/144/maintenance--v1.png' }
    ],
    brands: [],
    symptoms: [],

    // 自定义输入
    showCustomBrand: false,
    showCustomSymptom: false,

    // 按钮状态
    canNext: false,

    // 诊断结果
    diagnosing: false,
    result: null
  },

  onLoad() {
    this.setData({ totalSteps: 4 })
  },

  /**
   * 选项图标加载失败时，显示 emoji 兜底
   */
  onOptionImgError(e) {
    const index = e.currentTarget.dataset.index;
    const deviceTypes = this.data.deviceTypes;
    if (deviceTypes && deviceTypes[index]) {
      const key = `deviceTypes[${index}].imageUrl`;
      this.setData({ [key]: '' });
    }
  },

  /**
   * 刷新导航按钮状态（下一步是否可点击）
   */
  refreshNavState() {
    const { step, deviceType, brand, symptom, showCustomBrand, showCustomSymptom, customBrand, customSymptom } = this.data
    let canNext = false

    if (step === 1) {
      canNext = !!deviceType
    } else if (step === 2) {
      if (showCustomBrand) {
        canNext = !!customBrand.trim()
      } else {
        canNext = !!brand
      }
    } else if (step === 3) {
      if (showCustomSymptom) {
        canNext = !!customSymptom.trim()
      } else {
        canNext = !!symptom
      }
    }

    this.setData({ canNext })
  },

  /**
   * 选择设备类型（只高亮，不自动跳转）
   */
  selectDeviceType(e) {
    const type = e.currentTarget.dataset.type
    const brands = brandMap[type] || ['其他品牌']

    this.setData({
      deviceType: type,
      brand: '',
      showCustomBrand: false,
      customBrand: '',
      brands: brands.map(b => ({
        name: b,
        display: b.includes('/') ? b.split('/')[1] : b
      }))
    })
    this.refreshNavState()
  },

  /**
   * 选择品牌（只高亮，不自动跳转）
   */
  selectBrand(e) {
    const brand = e.currentTarget.dataset.brand

    // "其他品牌" 和 "请手动输入品牌" 都触发自定义输入
    if (brand === '其他品牌' || brand === '请手动输入品牌') {
      this.setData({ showCustomBrand: true, brand: '', customBrand: '', canNext: false })
      return
    }

    const brandDisplay = brand.includes('/') ? brand.split('/')[1] : brand
    this.setData({
      brand: brandDisplay,
      showCustomBrand: false,
      customBrand: ''
    })
    this.refreshNavState()
  },

  /**
   * 自定义品牌输入（实时更新按钮状态）
   */
  onCustomBrandInput(e) {
    this.setData({ customBrand: e.detail.value })
    this.refreshNavState()
  },

  /**
   * 自定义品牌输入确认（触发下一步）
   */
  confirmCustomBrand() {
    const val = this.data.customBrand.trim()
    if (!val) {
      wx.showToast({ title: '请输入品牌', icon: 'none' })
      return
    }
    this.setData({ brand: val, showCustomBrand: false })
    this.forwardToStep3()
  },

  /**
   * 前进到步骤3 - 加载故障现象列表
   */
  forwardToStep3() {
    const symptoms = symptomMap[this.data.deviceType] || symptomMap['其他设备']

    this.setData({
      step: 3,
      symptom: '',
      showCustomSymptom: false,
      customSymptom: '',
      symptoms: symptoms.map(s => ({ name: s })),
      canNext: false
    })
  },

  /**
   * 选择故障现象（只高亮，不自动跳转）
   */
  selectSymptom(e) {
    const symptom = e.currentTarget.dataset.symptom

    if (symptom === '其他故障') {
      this.setData({ showCustomSymptom: true, symptom: '', customSymptom: '', canNext: false })
      return
    }

    this.setData({
      symptom,
      showCustomSymptom: false,
      customSymptom: ''
    })
    this.refreshNavState()
  },

  /**
   * 自定义故障输入（实时更新按钮状态）
   */
  onCustomSymptomInput(e) {
    this.setData({ customSymptom: e.detail.value })
    this.refreshNavState()
  },

  /**
   * 自定义故障输入确认（触发下一步）
   */
  confirmCustomSymptom() {
    const val = this.data.customSymptom.trim()
    if (!val) {
      wx.showToast({ title: '请描述故障现象', icon: 'none' })
      return
    }
    this.setData({ symptom: val, showCustomSymptom: false })
    this.forwardToStep4()
  },

  /**
   * 前进到步骤4 - 补充详情
   */
  forwardToStep4() {
    this.setData({ step: 4, details: '' })
  },

  /**
   * 补充详情输入
   */
  onDetailsInput(e) {
    this.setData({ details: e.detail.value })
  },

  /**
   * 跳过补充详情，直接开始诊断
   */
  skipDetails() {
    this.startDiagnose()
  },

  /**
   * 开始诊断
   */
  async startDiagnose() {
    this.setData({ step: 5, diagnosing: true, result: null })

    try {
      const response = await diagnoseApi.analyze({
        deviceType: this.data.deviceType,
        brand: this.data.brand,
        symptom: this.data.symptom,
        details: this.data.details
      })

      this.setData({ step: 6, diagnosing: false, result: response.data || response })
    } catch (error) {
      console.error('[Diagnose] 诊断失败:', error)
      const errMsg = (error && (error.message || error.errMsg)) || ''
      const title = errMsg.includes('同一 Wi-Fi')
        ? '请让手机和电脑连接同一Wi-Fi'
        : '诊断失败，请稍后重试'
      wx.showToast({ title, icon: 'none' })
      this.setData({ step: 4, diagnosing: false })
    }
  },

  /**
   * 重新诊断
   */
  restartDiagnose() {
    this.setData({
      step: 1,
      deviceType: '',
      brand: '',
      customBrand: '',
      symptom: '',
      customSymptom: '',
      details: '',
      showCustomBrand: false,
      showCustomSymptom: false,
      canNext: false,
      brands: [],
      symptoms: [],
      result: null
    })
  },

  /**
   * 返回上一步
   */
  goBack() {
    const step = this.data.step
    if (step <= 1) {
      wx.navigateBack()
      return
    }

    // 诊断中(step 5)返回修改
    if (step === 5) {
      this.setData({ step: 4, diagnosing: false })
      return
    }

    const newStep = step <= 4 ? step - 1 : 4

    if (newStep === 3) {
      // 回到步骤3，保留已选设备类型和品牌，清空故障现象
      const symptoms = symptomMap[this.data.deviceType] || symptomMap['其他设备']
      this.setData({
        step: 3,
        symptom: '',
        showCustomSymptom: false,
        customSymptom: '',
        symptoms: symptoms.map(s => ({ name: s })),
        details: '',
        canNext: false
      })
    } else if (newStep === 2) {
      // 回到步骤2，保留已选设备类型，清空品牌
      const brands = brandMap[this.data.deviceType] || ['其他品牌']
      this.setData({
        step: 2,
        brand: '',
        showCustomBrand: false,
        customBrand: '',
        brands: brands.map(b => ({
          name: b,
          display: b.includes('/') ? b.split('/')[1] : b
        })),
        canNext: false
      })
    } else if (newStep === 1) {
      this.setData({ step: 1, deviceType: '', canNext: false })
    } else {
      this.setData({ step: newStep, canNext: false })
    }
  },

  /**
   * 进入下一步（统一入口，带校验）
   */
  goNext() {
    const { step, showCustomBrand, showCustomSymptom, brand, symptom, deviceType, customBrand, customSymptom } = this.data

    // 步骤1 → 步骤2
    if (step === 1) {
      if (!deviceType) {
        wx.showToast({ title: '请先选择设备类型', icon: 'none' })
        return
      }
      this.setData({ step: 2, canNext: !!brand })
      return
    }

    // 步骤2 → 步骤3
    if (step === 2) {
      if (showCustomBrand) {
        this.confirmCustomBrand()
        return
      }
      if (!brand) {
        wx.showToast({ title: '请先选择品牌或输入自定义品牌', icon: 'none' })
        return
      }
      this.forwardToStep3()
      return
    }

    // 步骤3 → 步骤4
    if (step === 3) {
      if (showCustomSymptom) {
        this.confirmCustomSymptom()
        return
      }
      if (!symptom) {
        wx.showToast({ title: '请先选择故障现象或输入描述', icon: 'none' })
        return
      }
      this.forwardToStep4()
      return
    }
  },

  /**
   * 立即咨询客服 - 携带诊断结果跳转
   */
  goToService() {
    const { deviceType, brand, symptom, details, result } = this.data

    // 构建诊断结果的文本描述
    let resultText = ''
    if (result) {
      resultText += '诊断结论：' + (result.summary || '分析完成') + '\n'
      if (result.causes && result.causes.length > 0) {
        resultText += '可能原因：\n'
        result.causes.slice(0, 3).forEach((cause, i) => {
          resultText += `${i + 1}. ${cause.reason}（${cause.probability}%）\n`
        })
      }
      if (result.repairPlan) resultText += '维修建议：' + result.repairPlan + '\n'
      if (result.estimatedCost) resultText += '预估费用：' + result.estimatedCost + '\n'
      if (result.notes) resultText += '注意事项：' + result.notes + '\n'
    }

    // 组装完整诊断信息
    const message = `我刚做了故障自检，设备信息如下：\n设备：${brand} ${deviceType}\n故障：${symptom}${details ? '\n详情：' + details : ''}\n\n${resultText}\n请问这个情况维修下来大概需要多少钱？需要多长时间？`

    const pendingData = {
      message,
      deviceType,
      brand,
      symptom,
      details,
      result,
      timestamp: Date.now()
    }

    // 双重存储：globalData + 本地存储
    const app = getApp()
    app.globalData.pendingDiagnoseData = pendingData
    wx.setStorageSync('pendingDiagnoseData', pendingData)

    console.log('[Diagnose] 诊断数据已缓存，准备跳转客服，消息长度:', message.length)
    wx.switchTab({ url: '/pages/service/service' })
  }
})
