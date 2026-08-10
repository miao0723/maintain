// pages/service/service.js
const { DEFAULT_AVATAR_URL: defaultAvatarUrl, normalizeAvatarUrl } = require('../../utils/avatar.js')
const { chatApi, productApi, knowledgeApi } = require('../../utils/api.js')

const REPAIR_JUMP_LINK = {
  text: '前往维修下单',
  path: '/pages/repair/repair'
}

const RECYCLE_JUMP_LINK = {
  text: '前往回收评估',
  path: '/pages/recycle/recycle'
}

const DEVICE_TYPE_RULES = [
  { id: 1, name: '手机', keywords: ['手机', 'iphone', '安卓', '折叠屏'] },
  { id: 2, name: '电脑/笔记本', keywords: ['笔记本', '电脑', 'macbook', '台式机', '主机', 'imac', 'xps', 'thinkpad', 'surface laptop'] },
  { id: 3, name: '平板', keywords: ['平板', 'ipad', 'matepad', 'galaxy tab'] },
  { id: 4, name: '手表/手环', keywords: ['手表', '手环', 'watch', 'apple watch'] },
  { id: 5, name: '耳机/音响', keywords: ['耳机', '音响', 'airpods', 'buds', 'headphone', 'homepod'] },
  { id: 6, name: '相机/摄像机', keywords: ['相机', '摄像机', '微单', '单反', 'gopro', '镜头'] },
  { id: 7, name: '游戏机', keywords: ['游戏机', 'ps5', 'ps4', 'switch', 'xbox', '掌机'] },
  { id: 9, name: '无人机/航拍', keywords: ['无人机', '航拍', 'mavic', 'avata', '图传', '炸机'] },
  { id: 10, name: '智能家居', keywords: ['门锁', '扫地机器人', '智能音箱', '智能摄像头', '智能家居'] },
  { id: 11, name: '打印机/办公设备', keywords: ['打印机', '复印机', '扫描仪', '办公设备'] }
]

const BRAND_CONTEXT_RULES = [
  { brand: '苹果', keywords: ['apple', '苹果', 'iphone', 'ipad', 'macbook', 'airpods', 'apple watch'] },
  { brand: '华为', keywords: ['huawei', '华为', 'matebook', 'matepad', 'watch gt'] },
  { brand: '小米', keywords: ['xiaomi', 'redmi', '小米', '红米'] },
  { brand: '三星', keywords: ['samsung', '三星', 'galaxy'] },
  { brand: '索尼', keywords: ['sony', '索尼', 'playstation', 'ps5', 'ps4'] },
  { brand: '大疆', keywords: ['dji', '大疆', 'mavic', 'avata', 'osmo'] },
  { brand: '联想', keywords: ['lenovo', '联想', 'thinkpad', '小新', '拯救者'] },
  { brand: '戴尔', keywords: ['dell', '戴尔', 'xps', 'alienware'] },
  { brand: '佳能', keywords: ['canon', '佳能', 'eos'] },
  { brand: 'OPPO', keywords: ['oppo'] },
  { brand: 'vivo', keywords: ['vivo', 'iqoo'] },
  { brand: '荣耀', keywords: ['honor', '荣耀'] },
  { brand: '任天堂', keywords: ['nintendo', '任天堂', 'switch'] },
  { brand: '微软', keywords: ['microsoft', '微软', 'xbox', 'surface'] }
]

const ISSUE_CONTEXT_RULES = [
  { label: '屏幕破损/碎屏/显示异常', keywords: ['碎屏', '屏幕碎', '花屏', '黑屏', '闪屏', '绿线', '显示异常'] },
  { label: '电池续航/充电问题', keywords: ['电池', '续航', '耗电', '充不进电', '无法充电', '不充电'] },
  { label: '无法开机/死机/重启', keywords: ['不开机', '无法开机', '死机', '重启', '卡死'] },
  { label: '系统/软件故障', keywords: ['系统', '卡顿', '软件', '闪退'] },
  { label: '摄像头/拍照问题', keywords: ['摄像头', '拍照', '镜头', '对焦'] },
  { label: '信号/WiFi/蓝牙问题', keywords: ['wifi', '蓝牙', '信号', '联网', '无网络'] },
  { label: '声音/扬声器/听筒问题', keywords: ['没声音', '扬声器', '听筒', '杂音', '单耳无声'] },
  { label: '按键/接口/卡槽损坏', keywords: ['按键', '接口', '充电口', '卡槽', 'hdmi', 'usb'] },
  { label: '进水/受潮', keywords: ['进水', '受潮', '泡水'] },
  { label: '主板/芯片故障', keywords: ['主板', '芯片', '短路'] },
  { label: '云台/相机故障', keywords: ['云台', '图传', '炸机', '电机'] },
  { label: '卡纸/进纸故障', keywords: ['卡纸', '进纸'] }
]

const CATEGORY_TO_DEVICE_TYPE = {
  '手机维修': 1,
  '笔记本维修': 2,
  '电脑维修': 2,
  '一体机维修': 2,
  '台式机维修': 2,
  '平板维修': 3,
  '智能手表维修': 4,
  '手表维修': 4,
  '手环维修': 4,
  '耳机维修': 5,
  '智能设备维修': 10,
  '智能家居': 10,
  '相机维修': 6,
  '云台相机维修': 6,
  '摄影器材维修': 6,
  '游戏机维修': 7,
  '无人机维修': 9,
  '显示器维修': 2,
  '办公设备维修': 11
}

const BRAND_NAME_MAP = {
  'Apple': '苹果',
  'Huawei': '华为',
  'Xiaomi': '小米',
  'Redmi': '小米',
  'Samsung': '三星',
  'Sony': '索尼',
  'DJI': '大疆',
  'Lenovo': '联想',
  'Dell': '戴尔',
  'Canon': '佳能',
  'OPPO': 'OPPO',
  'vivo': 'vivo',
  'Honor': '荣耀',
  'ASUS': '华硕',
  'Microsoft': '微软',
  'Google': '谷歌',
  'Nintendo': '任天堂',
  'Nikon': '尼康',
  'Fujifilm': '富士',
  'OnePlus': '一加/真我',
  'realme': '一加/真我'
}

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl
    },

    // 当前视图：'chat' 聊天界面 | 'history' 历史记录
    currentView: 'chat',

    // 统一的消息列表
    messages: [
      {
        id: 1,
        type: 'service',
        content: '您好，我是修小宝。这里可以帮您判断故障方向、了解维修方式和价格区间，也能帮您查订单进度和设备回收估价。您直接说设备和问题现象就行，不用刻意组织术语。',
        time: '刚刚'
      }
    ],

    // 输入框
    inputText: '',
    canSend: false,
    isSending: false,
    voiceSupported: false,
    voiceRecording: false,
    voiceRecognizing: false,
    voiceButtonText: '语音',
    voiceHint: '',
    voiceDraft: '',
    showQuickPhrases: false,
    quickPhrases: [
      // === 维修类 ===
      '营业时间是什么时候？',
      '一般维修需要多长时间？',
      '手机屏幕碎了怎么修？',
      '手机电池不耐用了怎么办？',
      '手机进水了怎么处理？',
      '笔记本无法开机怎么办？',
      '笔记本散热不好怎么解决？',
      '平板屏幕摔碎了能修吗？',
      '平板充不进电怎么办？',
      '维修费用大概是多少？',
      '维修有保修吗？',
      '支持上门取件吗？',
      '支持邮寄维修吗？',
      '相机镜头故障能修吗？',
      '相机无法对焦怎么办？',
      '无人机炸机了怎么修？',
      '无人机图传信号差能修吗？',
      '耳机充不上电怎么办？',
      '耳机一只不响了能修吗？',
      '智能手表屏幕能换吗？',
      '游戏机手柄漂移能修吗？',
      '显示器花屏是什么原因？',
      '台式机不开机怎么排查？',
      '打印机卡纸能修吗？',
      '数据能恢复吗？',
      // === 回收类 ===
      '旧手机能回收多少钱？',
      '笔记本电脑回收怎么估价？',
      '怎么看设备成色？',
      '以旧换新怎么操作？',
      '平板回收价格是多少？',
      '相机能折价回收吗？',
      '无人机回收估价流程？',
      '回收后数据会泄露吗？',
      '回收支持上门取件吗？',
      '手表回收价格怎么判断？'
    ],

    // 产品面板
    showProductPanel: false,
    scrollToView: '',
    productSearchKey: '',

    // 产品列表（从后端加载）
    productList: [],
    groupedProducts: [],
    filteredGroupedProducts: null,
    productListLoading: false,

    // 品牌Logo映射
    brandLogoMap: {
      'Apple': '',
      'Huawei': '',
      'Xiaomi': '',
      'Samsung': '',
      'Sony': '',
      'DJI': '',
      'Lenovo': '',
      'Dell': '',
      'Canon': '',
      'OPPO': '',
      'vivo': '',
      'Honor': ''
    },

    // 当前选中的产品
    selectedProduct: null,
    repairContext: null,
    serviceTyping: false,
    pendingReplyCount: 0,

    // 客服状态
    conversationId: '',
    isTransferring: false,
    queueInfo: null,
    humanConnected: false,
    currentAgentInfo: null,
    humanSocketConnected: false,

    // 快捷建议操作
    suggestedActions: [],

    // 历史记录相关
    conversations: [],
    conversationsLoading: false
  },

  onLoad() {
    this.initVoiceRecognition()
    this.loadUserInfo()
    this.loadProductList()
    // 生成初始会话ID
    this.setData({
      conversationId: Date.now().toString()
    })
  },

  async onShow() {
    this.loadUserInfo()
    // 确保本地存储中有完整的用户信息（含 id）
    await this.ensureUserInfoComplete()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabBar = this.getTabBar()
      tabBar.setData({ selected: 2 })
      tabBar.refreshBadge()
    }
    // 每次显示时加载历史会话列表
    this.loadConversations()
    this.restoreHumanServiceState()

    // 处理来自故障自检的诊断数据（立即 + 延迟重试）
    this.checkPendingDiagnose()
    // 延迟再检查一次，防止 switchTab 过渡期间数据未就绪
    setTimeout(() => {
      this.checkPendingDiagnose()
    }, 500)
  },

  onUnload() {
    this.stopVoiceInput({ silent: true })
    this.closeHumanSocket()
  },

  initVoiceRecognition() {
    if (typeof wx.getRecorderManager !== 'function') {
      this.setData({
        voiceSupported: false,
        voiceHint: '当前环境不支持语音录入'
      })
      return
    }

    this.recorderManager = wx.getRecorderManager()

    this.recorderManager.onStart(() => {
      this.setData({
        voiceRecording: true,
        voiceRecognizing: true,
        voiceHint: '正在录音，结束后提交给语音模型转写'
      })
    })

    this.recorderManager.onStop(async (res) => {
      await this.handleVoiceRecordStop(res)
    })

    this.recorderManager.onError((error) => {
      console.error('[Service] 录音失败:', error)
      const errorMsg = error && (error.errMsg || error.msg) ? (error.errMsg || error.msg) : ''
      this.setData({
        voiceRecording: false,
        voiceRecognizing: false,
        voiceButtonText: '语音',
        voiceDraft: '',
        voiceHint: errorMsg && !/cancel/i.test(errorMsg) ? `录音失败：${errorMsg}` : '语音录入已取消'
      })

      if (errorMsg && !/cancel/i.test(errorMsg)) {
        wx.showToast({
          title: '录音失败',
          icon: 'none'
        })
      }
    })

    this.setData({
      voiceSupported: true,
      voiceHint: '点击语音按钮开始录音，系统会用语音模型自动转文字'
    })
  },

  /**
   * 确保本地存储中的 userInfo 包含完整字段（id 等）
   */
  async ensureUserInfoComplete() {
    try {
      const app = getApp()
      if (app.globalData.isLoggedIn) {
        const storedInfo = wx.getStorageSync('userInfo') || {}
        // 如果本地存储缺少 id，调用 API 拉取最新信息
        if (!storedInfo.id) {
          console.log('[Service] userInfo 缺少 id，从 API 拉取完整信息...')
          await app.fetchUserInfoFromAPI()
        }
      }
    } catch (e) {
      console.warn('[Service] 拉取完整用户信息失败（非关键）:', e)
    }
  },

  /**
   * 检查并处理来自故障自检的诊断数据（双来源检测）
   */
  checkPendingDiagnose() {
    try {
      // 优先从 globalData 获取（最可靠），其次从本地存储
      const app = getApp()
      let data = app.globalData.pendingDiagnoseData
      if (!data || !data.message) {
        data = wx.getStorageSync('pendingDiagnoseData')
      }

      if (!data || !data.message) {
        console.log('[Service] 无待处理诊断数据')
        return
      }

      // 防止处理过期数据（超过30秒的视为无效）
      if (data.timestamp && Date.now() - data.timestamp > 30000) {
        console.warn('[Service] 诊断数据已过期，忽略')
        app.globalData.pendingDiagnoseData = null
        wx.removeStorageSync('pendingDiagnoseData')
        return
      }

      console.log('[Service] 检测到待发送诊断数据，消息长度:', data.message.length)

      this.setRepairContext(this.buildRepairContextFromDiagnose(data))

      // 清除标记，防止重复发送
      app.globalData.pendingDiagnoseData = null
      wx.removeStorageSync('pendingDiagnoseData')

      // 将诊断信息作为用户消息发送
      const message = {
        id: Date.now(),
        type: 'user',
        content: data.message,
        time: this.getCurrentTime()
      }

      const messages = this.data.messages.concat(message)
      this.setComposerState('', {
        messages,
        scrollToView: '',
        currentView: 'chat'
      })
      // 滚动到底部
      wx.nextTick(() => {
        this.setData({ scrollToView: 'msg-' + message.id })
      })

      // 调用客服接口发送
      console.log('[Service] 开始发送诊断消息给客服')
      this.sendMessageToService(data.message)
    } catch (e) {
      console.error('[Service] 处理诊断数据失败:', e)
    }
  },

  /**
   * 加载历史会话列表
   */
  async loadConversations() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const app = getApp()
    const userId = userInfo.id || app.globalData.userInfo?.id || ''
    console.log('[Service] loadConversations - userId:', userId)
    if (!userId) {
      console.warn('[Service] 无法加载历史记录 - userId 为空')
      return
    }

    this.setData({ conversationsLoading: true })
    try {
      const response = await chatApi.getConversations(userId)
      const resData = response.data || response
      console.log('[Service] getConversations 响应:', JSON.stringify(resData).substring(0, 200))
      const list = (resData.conversations || resData.data?.conversations || []).map(c => ({
        ...c,
        _displayTime: this.formatHistoryTime(c.last_activity || c.created_at)
      }))
      this.setData({ conversations: list })
    } catch (error) {
      console.error('加载会话列表失败:', error)
    } finally {
      this.setData({ conversationsLoading: false })
    }
  },

  /**
   * 切换视图（聊天 / 历史记录）
   */
  switchView(e) {
    const view = e.currentTarget.dataset.view
    if (view === this.data.currentView) return

    this.setData({ currentView: view })

    if (view === 'history') {
      this.loadConversations()
    }
  },

  /**
   * 新建对话
   */
  startNewChat() {
    // 切换到聊天视图
    this.setComposerState('', {
      currentView: 'chat',
      messages: [
        {
          id: Date.now(),
          type: 'service',
          content: '您好！我是修小宝，您的电子维修智能助手。我可以帮您解答手机、电脑、相机、无人机等各类设备的维修问题，也能帮您查询订单进度和维修报价。还支持设备回收估价和以旧换新哦~ 点击📦选择产品，或直接输入问题即可开始咨询~',
          time: this.getCurrentTime()
        }
      ],
      conversationId: Date.now().toString(),
      selectedProduct: null,
      suggestedActions: [],
      repairContext: null,
      isSending: false,
      serviceTyping: false,
      pendingReplyCount: 0
    })
  },

  /**
   * 删除历史会话
   */
  async deleteConversation(e) {
    const conversationId = e.currentTarget.dataset.id
    if (!conversationId) return

    wx.showModal({
      title: '删除确认',
      content: '确定要删除这条对话记录吗？删除后无法恢复。',
      confirmText: '删除',
      confirmColor: '#e53e3e',
      success: async (res) => {
        if (!res.confirm) return

        const nextConversations = (this.data.conversations || []).filter(item => item.id !== conversationId)

        try {
          const response = await chatApi.deleteConversation(conversationId)

          if (response && response.success) {
            this.setData({ conversations: nextConversations })
            if (this.data.conversationId === conversationId) {
              this.startNewChat()
            }
            wx.showToast({ title: '已删除', icon: 'success' })
          } else {
            // 后端返回失败
            this.loadConversations()
            wx.showToast({ 
              title: response?.message || '删除失败，请重试', 
              icon: 'none' 
            })
          }
        } catch (error) {
          // 网络错误或请求失败，恢复列表
          this.loadConversations()
          wx.showToast({ 
            title: '网络错误，删除失败', 
            icon: 'none' 
          })
        }
      }
    })
  },

  /**
   * 打开历史会话
   */
  async openConversation(e) {
    const conversationId = e.currentTarget.dataset.id
    if (!conversationId) return

    wx.showLoading({ title: '加载中...' })
    try {
      const response = await chatApi.getConversationHistory(conversationId)
      const resData = response.data || response
      const history = resData.history || resData.data?.history || []

      // 将历史消息转换为页面消息格式
      const messages = history.map(msg => ({
        id: msg.id || Date.now(),
        type: msg.sender_type === 'user' ? 'user' : 'service',
        content: msg.content || '',
        time: this.formatHistoryTime(msg.created_at)
      }))

      this.setComposerState('', {
        currentView: 'chat',
        conversationId,
        messages: messages.length > 0 ? messages : [
          {
            id: Date.now(),
            type: 'service',
            content: '您好！我是修小宝，欢迎继续咨询~',
            time: this.getCurrentTime()
          }
        ],
        selectedProduct: null,
        suggestedActions: [],
        repairContext: null,
        isSending: false,
        serviceTyping: false,
        pendingReplyCount: 0
      })
    } catch (error) {
      console.error('加载历史消息失败:', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 格式化历史时间
   */
  formatHistoryTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')

    // 非常近的时间
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'

    // 按自然日判断：今天 / 昨天 / 更早
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart.getTime() - 86400000)
    const tomorrowStart = new Date(todayStart.getTime() + 86400000)

    if (date >= todayStart && date < tomorrowStart) {
      return '今天 ' + hour + ':' + minute
    }
    if (date >= yesterdayStart && date < todayStart) {
      return '昨天 ' + hour + ':' + minute
    }

    const month = date.getMonth() + 1
    const day = date.getDate()
    return month + '月' + day + '日 ' + hour + ':' + minute
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    // 从本地存储获取用户信息（包含登录时上传的头像）
    const userInfo = wx.getStorageSync('userInfo')
    // 兼容 avatar_url 和 avatarUrl 两种字段名
    const avatarUrl = normalizeAvatarUrl(userInfo && (userInfo.avatar_url || userInfo.avatarUrl))
    this.setData({
      'userInfo.avatarUrl': avatarUrl
    })
  },

  onAvatarError() {
    if (this.data.userInfo.avatarUrl !== defaultAvatarUrl) {
      this.setData({
        'userInfo.avatarUrl': defaultAvatarUrl
      })
    }
  },

  /**
   * 选择头像
   */
  chooseAvatar() {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: function(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath

        // 更新当前页面的头像
        that.setData({
          'userInfo.avatarUrl': tempFilePath
        })

        // 保存到本地存储
        const userInfo = wx.getStorageSync('userInfo') || {}
        userInfo.avatarUrl = tempFilePath
        wx.setStorageSync('userInfo', userInfo)

        // 更新所有消息中的用户头像
        const messages = that.data.messages.map(msg => {
          if (msg.type === 'user') {
            msg.avatarUrl = tempFilePath
          }
          return msg
        })

        that.setData({ messages })

        wx.showToast({
          title: '头像更新成功',
          icon: 'success',
          duration: 2000
        })
      },
      fail: function(err) {
        console.error('选择头像失败:', err)
        if (err.errMsg.includes('cancel')) {
          // 用户取消选择，不显示错误提示
          return
        }
        wx.showToast({
          title: '头像选择失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 加载产品列表
   */
  async loadProductList() {
    if (this.data.productListLoading) return

    this.setData({ productListLoading: true })

    try {
      const products = await productApi.getProductList()
      // 格式化产品数据
      let formattedProducts = (products.data || []).map(p => ({
        id: p.id,
        icon: p.icon || '📱',
        name: p.name,
        brand: p.brand || '其他',
        model: p.model,
        category: p.category,
        price: p.price_range,
        repair_types: p.repair_types || [],
        common_issues: p.common_issues || []
      }))

      // 去重：同名+同分类的只保留第一条
      const seen = new Set()
      formattedProducts = formattedProducts.filter(p => {
        const key = `${p.name}_${p.category}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }).map(p => {
        // 如果没有 repair_types，尝试从 common_issues 提取；否则用 category 生成默认标签
        if (!p.repair_types || p.repair_types.length === 0) {
          if (p.common_issues && p.common_issues.length > 0) {
            p.repair_types = p.common_issues.slice(0, 4)
          } else if (p.category) {
            // 根据分类生成通用标签
            const categoryTags = {
              '手机维修': ['屏幕更换', '电池维修', '摄像头维修'],
              '笔记本维修': ['屏幕维修', '键盘更换', '电池更换'],
              '平板维修': ['屏幕更换', '电池维修', '触控失灵'],
              '耳机维修': ['降噪故障', '充电盒维修'],
              '智能手表维修': ['屏幕更换', '电池更换'],
              '相机维修': ['镜头维修', '传感器维修'],
              '无人机维修': ['云台维修', '桨叶更换'],
              '游戏机维修': ['光驱维修', '手柄漂移'],
              '显示器维修': ['屏幕维修', '电源板维修'],
              '台式机维修': ['主板维修', '显卡维修'],
              '办公设备维修': ['喷头清洗', '走纸故障']
            }
            p.repair_types = categoryTags[p.category] || [p.category]
          }
        }
        return p
      })

      // 按品牌分组
      const groups = {}
      formattedProducts.forEach(product => {
        const brand = product.brand
        if (!groups[brand]) {
          groups[brand] = {
            brand,
            brandLogo: this.data.brandLogoMap[brand] || '',
            products: []
          }
        }
        groups[brand].products.push(product)
      })
      const groupedProducts = Object.values(groups).sort((a, b) => a.brand.localeCompare(b.brand))

      this.setData({
        productList: formattedProducts,
        groupedProducts
      })
    } catch (error) {
      console.error('加载产品列表失败:', error)
      // 使用默认产品列表 - 覆盖多品牌多类型产品
      const defaultProducts = [
        // Apple 产品线
        { id: 1, icon: '📱', name: 'iPhone 15 Pro Max', brand: 'Apple', category: '手机维修', price: '¥9999起', repair_types: ['屏幕更换', '电池维修', '摄像头维修', '充电口维修'] },
        { id: 2, icon: '💻', name: 'MacBook Pro 14"', brand: 'Apple', category: '笔记本维修', price: '¥14999起', repair_types: ['屏幕维修', '键盘更换', '电池更换', '主板维修'] },
        { id: 3, icon: '📟', name: 'iPad Pro M2', brand: 'Apple', category: '平板维修', price: '¥6799起', repair_types: ['屏幕更换', '电池维修', '充电口维修'] },
        { id: 4, icon: '⌚', name: 'Apple Watch Ultra', brand: 'Apple', category: '智能手表维修', price: '¥5999起', repair_types: ['屏幕更换', '电池更换', '表带卡扣'] },
        { id: 5, icon: '🎧', name: 'AirPods Pro 2', brand: 'Apple', category: '耳机维修', price: '¥1899起', repair_types: ['降噪故障', '充电盒维修', '连接异常'] },
        { id: 6, icon: '🖥️', name: 'iMac 24"', brand: 'Apple', category: '一体机维修', price: '¥9999起', repair_types: ['屏幕维修', '主板维修', '硬盘升级'] },
        // 华为产品线
        { id: 7, icon: '📱', name: 'Mate 60 Pro+', brand: 'Huawei', category: '手机维修', price: '¥8999起', repair_types: ['屏幕更换', '电池维修', '卫星通信模块', '摄像头维修'] },
        { id: 8, icon: '💻', name: 'MateBook X Pro', brand: 'Huawei', category: '笔记本维修', price: '¥11999起', repair_types: ['屏幕维修', '键盘更换', '电池更换', '指纹模块'] },
        { id: 9, icon: '📟', name: 'MatePad Pro', brand: 'Huawei', category: '平板维修', price: '¥4699起', repair_types: ['屏幕更换', '电池维修', '触控失灵'] },
        { id: 10, icon: '⌚', name: 'Watch GT 4', brand: 'Huawei', category: '智能手表维修', price: '¥2488起', repair_types: ['屏幕更换', '电池更换', '心率传感器'] },
        { id: 11, icon: '🎧', name: 'FreeBuds Pro 3', brand: 'Huawei', category: '耳机维修', price: '¥1499起', repair_types: ['降噪故障', '充电盒维修', '单耳无声'] },
        // 小米产品线
        { id: 12, icon: '📱', name: '小米14 Ultra', brand: 'Xiaomi', category: '手机维修', price: '¥6499起', repair_types: ['屏幕更换', '电池维修', '徕卡镜头维修', '充电口维修'] },
        { id: 13, icon: '💻', name: 'RedmiBook Pro 15', brand: 'Xiaomi', category: '笔记本维修', price: '¥5499起', repair_types: ['屏幕维修', '键盘更换', '散热清理', '硬盘升级'] },
        { id: 14, icon: '📟', name: '小米平板6 Max', brand: 'Xiaomi', category: '平板维修', price: '¥3699起', repair_types: ['屏幕更换', '电池维修', '触控失灵'] },
        { id: 15, icon: '🏠', name: '小米智能音箱', brand: 'Xiaomi', category: '智能设备维修', price: '¥299起', repair_types: ['语音模块', '扬声器维修', '电源维修'] },
        { id: 16, icon: '📷', name: '小米运动相机', brand: 'Xiaomi', category: '相机维修', price: '¥1699起', repair_types: ['镜头维修', '屏幕更换', '防水密封'] },
        // 三星产品线
        { id: 17, icon: '📱', name: 'Galaxy S24 Ultra', brand: 'Samsung', category: '手机维修', price: '¥9699起', repair_types: ['屏幕更换', '电池维修', 'S Pen维修', '摄像头维修'] },
        { id: 18, icon: '📟', name: 'Galaxy Tab S9', brand: 'Samsung', category: '平板维修', price: '¥5999起', repair_types: ['屏幕更换', '电池维修', '触控笔维修'] },
        { id: 19, icon: '⌚', name: 'Galaxy Watch 6', brand: 'Samsung', category: '智能手表维修', price: '¥2199起', repair_types: ['屏幕更换', '电池更换', '传感器维修'] },
        { id: 20, icon: '🎧', name: 'Galaxy Buds2 Pro', brand: 'Samsung', category: '耳机维修', price: '¥1299起', repair_types: ['降噪故障', '充电盒维修', '触控失灵'] },
        // 索尼产品线
        { id: 21, icon: '📷', name: 'A7M4 微单相机', brand: 'Sony', category: '相机维修', price: '¥16999起', repair_types: ['CMOS传感器', '快门组件', '镜头卡口', '对焦模块'] },
        { id: 22, icon: '🎮', name: 'PlayStation 5', brand: 'Sony', category: '游戏机维修', price: '¥3899起', repair_types: ['光驱维修', '散热风扇', 'HDMI接口', '手柄漂移'] },
        { id: 23, icon: '🎧', name: 'WH-1000XM5 头戴耳机', brand: 'Sony', category: '耳机维修', price: '¥2699起', repair_types: ['降噪故障', '耳罩更换', '蓝牙模块', '充电口维修'] },
        { id: 24, icon: '📺', name: 'Bravia OLED 电视', brand: 'Sony', category: '显示器维修', price: '¥12999起', repair_types: ['屏幕维修', '主板维修', '背光维修'] },
        // 大疆产品线
        { id: 25, icon: '🚁', name: 'Mavic 3 Pro 无人机', brand: 'DJI', category: '无人机维修', price: '¥13888起', repair_types: ['云台维修', '桨叶更换', '图传模块', '电池维修'] },
        { id: 26, icon: '📹', name: 'Osmo Pocket 3', brand: 'DJI', category: '云台相机维修', price: '¥3499起', repair_types: ['云台卡顿', '镜头维修', '屏幕更换', '电池更换'] },
        { id: 27, icon: '🎬', name: 'Ronin 4D 稳定器', brand: 'DJI', category: '摄影器材维修', price: '¥18888起', repair_types: ['电机维修', '跟焦器', '图传模块'] },
        // 联想产品线
        { id: 28, icon: '💻', name: 'ThinkPad X1 Carbon', brand: 'Lenovo', category: '笔记本维修', price: '¥10999起', repair_types: ['屏幕维修', '键盘更换', '电池更换', '指纹识别'] },
        { id: 29, icon: '🖥️', name: '拯救者台式机', brand: 'Lenovo', category: '台式机维修', price: '¥7999起', repair_types: ['显卡维修', '主板维修', '散热清理', '硬盘升级'] },
        { id: 30, icon: '📟', name: '小新Pad Pro', brand: 'Lenovo', category: '平板维修', price: '¥2499起', repair_types: ['屏幕更换', '电池维修', '触控失灵'] },
        // 戴尔产品线
        { id: 31, icon: '💻', name: 'XPS 15 笔记本', brand: 'Dell', category: '笔记本维修', price: '¥12999起', repair_types: ['屏幕维修', '键盘更换', '电池更换', '主板维修'] },
        { id: 32, icon: '🖥️', name: 'OptiPlex 台式机', brand: 'Dell', category: '台式机维修', price: '¥5999起', repair_types: ['主板维修', '电源更换', '硬盘升级'] },
        { id: 33, icon: '📺', name: 'UltraSharp 显示器', brand: 'Dell', category: '显示器维修', price: '¥3999起', repair_types: ['屏幕维修', '电源板维修', '接口维修'] },
        // 佳能产品线
        { id: 34, icon: '📷', name: 'EOS R5 微单', brand: 'Canon', category: '相机维修', price: '¥25999起', repair_types: ['CMOS传感器', '快门组件', '镜头卡口', '对焦模块'] },
        { id: 35, icon: '🖨️', name: 'PIXMA 打印机', brand: 'Canon', category: '办公设备维修', price: '¥1999起', repair_types: ['喷头清洗', '走纸故障', '墨路维修', '连接故障'] },
        // OPPO/vivo产品线
        { id: 36, icon: '📱', name: 'Find X7 Ultra', brand: 'OPPO', category: '手机维修', price: '¥5999起', repair_types: ['屏幕更换', '电池维修', '潜望镜头维修', '充电口维修'] },
        { id: 37, icon: '🎧', name: 'Enco X2 耳机', brand: 'OPPO', category: '耳机维修', price: '¥999起', repair_types: ['降噪故障', '充电盒维修', '触控失灵'] },
        { id: 38, icon: '📱', name: 'X100 Pro', brand: 'vivo', category: '手机维修', price: '¥4999起', repair_types: ['屏幕更换', '电池维修', '蔡司镜头维修', '充电口维修'] },
        { id: 39, icon: '🎧', name: 'TWS 3 耳机', brand: 'vivo', category: '耳机维修', price: '¥699起', repair_types: ['降噪故障', '充电盒维修', '连接异常'] },
        // 荣耀产品线
        { id: 40, icon: '📱', name: 'Magic6 Pro', brand: 'Honor', category: '手机维修', price: '¥5699起', repair_types: ['屏幕更换', '电池维修', '鹰眼相机维修', '充电口维修'] },
        { id: 41, icon: '💻', name: 'MagicBook Pro', brand: 'Honor', category: '笔记本维修', price: '¥6499起', repair_types: ['屏幕维修', '键盘更换', '电池更换', '硬盘升级'] },
        { id: 42, icon: '📟', name: '荣耀平板9', brand: 'Honor', category: '平板维修', price: '¥1999起', repair_types: ['屏幕更换', '电池维修', '触控失灵'] }
      ]

      // 按品牌分组
      const groups = {}
      defaultProducts.forEach(product => {
        const brand = product.brand
        if (!groups[brand]) {
          groups[brand] = {
            brand,
            brandLogo: this.data.brandLogoMap[brand] || '',
            products: []
          }
        }
        groups[brand].products.push(product)
      })
      const groupedProducts = Object.values(groups).sort((a, b) => a.brand.localeCompare(b.brand))

      this.setData({
        productList: defaultProducts,
        groupedProducts
      })
    } finally {
      this.setData({ productListLoading: false })
    }
  },

  /**
   * 切换聊天模式（已废弃，统一为一个模式）
   */
  switchChatMode(e) {
    // 不再需要模式切换，保留方法以防旧代码调用
    console.log('模式切换功能已统一，忽略此调用')
  },

  /**
   * 输入框内容变化
   */
  onInputChange(e) {
    this.setComposerState(e.detail.value, {
      showQuickPhrases: false,
      suggestedActions: [] // 隐藏快捷建议
    })
  },

  /**
   * 切换快捷短语显示
   */
  toggleQuickPhrases() {
    this.setData({
      showQuickPhrases: !this.data.showQuickPhrases
    })
  },

  async toggleVoiceInput() {
    if (!this.data.voiceSupported) {
      wx.showToast({
        title: '当前设备不支持语音',
        icon: 'none'
      })
      return
    }

    if (this.data.voiceRecording) {
      this.stopVoiceInput()
      return
    }

    try {
      await this.ensureRecordPermission()
    } catch (error) {
      wx.showModal({
        title: '无法使用语音输入',
        content: '请在小程序授权中开启麦克风权限后重试。',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) {
            wx.openSetting({})
          }
        }
      })
      return
    }

    try {
      this.recorderManager.start({
        duration: 60000,
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 48000,
        format: 'mp3'
      })
      this.setData({
        voiceButtonText: '结束',
        voiceDraft: '',
        voiceHint: '正在录音，结束后提交给语音模型转写',
        showQuickPhrases: false,
        suggestedActions: []
      })
    } catch (error) {
      console.error('[Service] 启动录音失败:', error)
      wx.showToast({
        title: '启动语音失败',
        icon: 'none'
      })
    }
  },

  stopVoiceInput(options = {}) {
    if (!this.recorderManager || !this.data.voiceRecording) {
      return
    }

    try {
      this.recorderManager.stop()
    } catch (error) {
      if (!options.silent) {
        console.warn('[Service] 停止录音失败:', error)
      }
    }

    this.setData({
      voiceRecording: false,
      voiceButtonText: '语音',
      voiceHint: '录音完成，正在调用语音模型转写'
    })
  },

  ensureRecordPermission() {
    return new Promise((resolve, reject) => {
      wx.authorize({
        scope: 'scope.record',
        success: resolve,
        fail: reject
      })
    })
  },

  applyVoiceResult(result) {
    const finalText = (result || this.data.voiceDraft || '').trim()
    const nextInput = this.mergeVoiceText(this.data.inputText, finalText)

    this.setComposerState(nextInput, {
      voiceRecording: false,
      voiceRecognizing: false,
      voiceButtonText: '语音',
      voiceDraft: '',
      voiceHint: finalText ? '语音已转成文字，可直接发送或继续补充' : '未识别到有效语音，请重试'
    })

    if (!finalText) {
      wx.showToast({
        title: '未识别到内容',
        icon: 'none'
      })
    }
  },

  mergeVoiceText(currentText = '', voiceText = '') {
    const base = String(currentText || '').trim()
    const addition = String(voiceText || '').trim()

    if (!addition) {
      return base
    }

    if (!base) {
      return addition
    }

    const connector = /[，。！？；,.!?;]$/.test(base) ? '' : '，'
    return `${base}${connector}${addition}`
  },

  async handleVoiceRecordStop(res) {
    const filePath = res && res.tempFilePath ? res.tempFilePath : ''
    const duration = res && res.duration ? res.duration : 0

    if (!filePath) {
      this.applyVoiceResult('')
      return
    }

    this.setData({
      voiceRecording: false,
      voiceRecognizing: true,
      voiceHint: '正在调用语音模型转写，请稍候'
    })

    try {
      const response = await chatApi.transcribeAudio(filePath, {
        durationMs: String(duration || 0),
        scene: 'service'
      })
      const resData = response.data || response
      this.applyVoiceResult(resData.text || '')
    } catch (error) {
      console.error('[Service] 语音模型转写失败:', error)
      this.setData({
        voiceRecording: false,
        voiceRecognizing: false,
        voiceButtonText: '语音',
        voiceDraft: '',
        voiceHint: '语音模型转写失败，请重试'
      })
      wx.showToast({
        title: '语音转写失败',
        icon: 'none'
      })
    }
  },

  /**
   * 手机确认键发送
   */
  onInputConfirm(e) {
    const inputValue = (e.detail && typeof e.detail.value === 'string')
      ? e.detail.value
      : this.data.inputText

    this.sendMessage(inputValue)
  },

  /**
   * 点击发送按钮 / 表单提交发送
   */
  onSendSubmit(e) {
    const inputValue = this.data.inputText

    this.sendMessage(inputValue)
  },

  /**
   * 统一发送消息
   */
  sendMessage(inputValue) {
    const rawInput = typeof inputValue === 'string' ? inputValue : this.data.inputText
    const trimmedInput = rawInput.trim();
    if (!trimmedInput) {
      return
    }

    this.syncRepairContextFromMessage(trimmedInput)

    // 立即更新界面，确保响应迅速
    const message = {
      id: Date.now(),
      type: 'user',
      content: trimmedInput,
      time: this.getCurrentTime()
    }

    // 使用concat快速添加消息到列表
    const messages = this.data.messages.concat(message)

    // 立即更新界面状态，先清除 scrollToView 确保后续能触发滚动
    const targetId = `msg-${message.id}`;
    this.setComposerState('', {
      messages: messages,
      scrollToView: '',
      voiceHint: this.data.voiceSupported ? '点击语音按钮开始录音，系统会用语音模型自动转文字' : this.data.voiceHint,
      suggestedActions: [] // 隐藏快捷建议
    })

    // 滚动到最新消息
    wx.nextTick(() => {
      this.setData({
        scrollToView: targetId
      })
    })

    if (this.data.humanConnected || this.data.humanSocketConnected || this.data.isTransferring || this.data.queueInfo) {
      this.sendMessageToHumanSocket(trimmedInput)
      return
    }

    // 异步发送给客服，不阻塞界面更新
    this.sendMessageToService(trimmedInput)
  },

  setComposerState(inputText, extraState = {}) {
    const nextInput = typeof inputText === 'string' ? inputText : this.data.inputText
    this.setData({
      inputText: nextInput,
      canSend: !!nextInput.trim(),
      ...extraState
    })
  },

  buildContextQuickReplies() {
    const context = this.getActiveRepairContext()
    if (!context) {
      return []
    }

    return [
      { type: 'quick_reply', text: '这个故障大概多少钱？' },
      { type: 'quick_reply', text: '一般多久可以修好？' },
      { type: 'quick_reply', text: '需要先预约下单吗？' },
      { type: 'quick_reply', text: '这个设备能回收吗？' }
    ]
  },

  /**
   * 获取当前时间
   */
  getCurrentTime() {
    const now = new Date()
    const hour = now.getHours().toString().padStart(2, '0')
    const minute = now.getMinutes().toString().padStart(2, '0')
    return `${hour}:${minute}`
  },

  /**
   * 发送消息给客服（客服会转给智能体）
   */
  async sendMessageToService(userMessage) {
    try {
      const nextPendingReplyCount = this.data.pendingReplyCount + 1
      this.setData({
        isSending: true,
        pendingReplyCount: nextPendingReplyCount,
        serviceTyping: true
      })

      // 当开始等待回复时，滚动到底部显示 typing 动画
      wx.nextTick(() => {
        this.setData({ scrollToView: 'typing-indicator' })
      })

      // 获取当前上下文（订单信息等）
      const context = this.getCurrentContext();

      // 确保发送的数据格式正确
      const requestData = {
        message: userMessage,
        conversationId: this.data.conversationId || '',
        context: context,
        mode: 'unified'
      };

      console.log('[Service] 发送聊天消息:', {
        message: userMessage.substring(0, 50),
        conversationId: requestData.conversationId,
        userId: context.userId
      });

      // 发送消息给客服
      const response = await chatApi.sendMessage(requestData);

      // 提取返回数据
      const resData = response.data || response;

      // 更新会话ID
      if (resData.conversationId && resData.conversationId !== this.data.conversationId) {
        this.setData({ conversationId: resData.conversationId });
      }

      // 显示客服回复（DeepSeek AI的回答）
      if (resData.reply) {
        this.addServiceMessage(resData.reply);
      }

      // 允许渲染的按钮类操作（含查询型智能体返回的入口）
      const allowedButtonActions = ['submit_order', 'submit_recycle', 'book_repair', 'query_order', 'show_my_devices'];
      this.setData({
        suggestedActions: (resData.suggestedActions || []).filter(action =>
          (action.type !== 'navigate' && action.type !== 'button') || allowedButtonActions.includes(action.action)
        )
      })

      // 检查是否需要转人工
      if (resData.requiresHuman) {
        await this.transferToHuman();
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      // 本地回退
      this.addServiceMessage('抱歉，我暂时无法处理您的请求，请稍后重试或联系人工客服。');
    } finally {
      const nextPendingReplyCount = Math.max(0, this.data.pendingReplyCount - 1)
      this.setData({
        isSending: nextPendingReplyCount > 0,
        pendingReplyCount: nextPendingReplyCount,
        serviceTyping: nextPendingReplyCount > 0
      })
    }
  },

  /**
   * 获取当前上下文
   */
  getCurrentContext() {
    // 多级 fallback 获取 userId：本地存储 → globalData → API 拉取
    const userInfo = wx.getStorageSync('userInfo') || {}
    const app = getApp()
    const userId = userInfo.id
      || app.globalData.userInfo?.id
      || ''
    const openid = userInfo.openid
      || app.globalData.userInfo?.openid
      || ''
    return {
      userId,
      openid,
      productId: this.data.selectedProduct?.id || '',
      productName: this.data.selectedProduct?.name || '',
      repairContext: this.data.repairContext ? this.data.repairContext.device : null,
      mode: 'unified'
    };
  },

  /**
   * 添加客服消息
   */
  addServiceMessage(content) {
    let jumpLink = null;
    const repairLink = this.shouldOfferRepairEntry(content) ? { ...REPAIR_JUMP_LINK } : null;
    const recycleLink = this._detectJumpLink(content);
    // 优先使用回收链接，其次维修链接
    if (recycleLink && recycleLink.path === '/pages/recycle/recycle') {
      jumpLink = recycleLink;
    } else if (repairLink) {
      jumpLink = repairLink;
    }

    const reply = {
      id: Date.now(),
      type: 'service',
      content: content,
      time: this.getCurrentTime()
    };
    if (jumpLink) {
      reply.jumpLink = jumpLink;
    }

    const messages = this.data.messages.concat(reply);
    const targetId = `msg-${reply.id}`;
    // 先清除 scrollToView，再延时设置，确保每次客服回复都能触发滚动到底部
    this.setData({ messages: messages, scrollToView: '' });
    wx.nextTick(() => {
      this.setData({ scrollToView: targetId });
    });
  },

  /**
   * 检测消息内容是否需要路由跳转链接
   */
  _detectJumpLink(content) {
    const repairKeywords = [
      '下单', '下维修单', '怎么下单', '如何下单', '如何维修',
      '怎么维修', '我要维修', '我想维修', '怎么下单', '如何下单',
      '在哪里下单', '下单流程', '维修流程', '开始下单',
      '怎样下单', '如何提交', '怎么提交', '提交订单'
    ];
    const repairMatched = repairKeywords.some(kw => content.includes(kw));
    if (repairMatched) {
      return { ...REPAIR_JUMP_LINK };
    }

    const recycleKeywords = [
      '回收', '卖掉', '折价', '以旧换新', '换新', '估价',
      '值多少钱', '能卖多少', '估价回收', '回收流程', '怎么回收',
      '如何回收', '回收价格', '回收估价', '我要回收', '我想回收',
      '回收旧机', '旧机回收', '二手回收', '设备回收'
    ];
    const recycleMatched = recycleKeywords.some(kw => content.includes(kw));
    if (recycleMatched) {
      return { ...RECYCLE_JUMP_LINK };
    }

    return null;
  },

  shouldOfferRepairEntry(content = '') {
    return !!this.getActiveRepairContext() || !!this._detectJumpLink(content)
  },

  getActiveRepairContext() {
    if (this.data.repairContext) {
      return this.data.repairContext
    }

    if (this.data.selectedProduct) {
      return this.buildRepairContextFromProduct(this.data.selectedProduct)
    }

    return null
  },

  setRepairContext(context) {
    if (!context) {
      this.setData({ repairContext: null })
      return
    }

    const device = context.device || {}
    const normalized = {
      source: context.source || 'chat',
      summary: context.summary || [device.brand_name, device.device_model || device.device_type_name].filter(Boolean).join(' '),
      device: {
        device_type_id: Number(device.device_type_id) || 0,
        device_type_name: (device.device_type_name || '').trim(),
        brand_name: (device.brand_name || '').trim(),
        device_model: (device.device_model || '').trim(),
        device_nickname: (device.device_nickname || '').trim(),
        device_condition: (device.device_condition || '').trim(),
        problem_name: (device.problem_name || '').trim(),
        problem_description: (device.problem_description || '').trim(),
        diagnose_summary: (device.diagnose_summary || '').trim(),
        estimated_cost: (device.estimated_cost || '').trim()
      }
    }

    if (!normalized.summary) {
      normalized.summary = [normalized.device.brand_name, normalized.device.device_type_name].filter(Boolean).join(' ') || '当前咨询设备'
    }

    this.setData({ repairContext: normalized })
  },

  syncRepairContextFromMessage(message) {
    if (this.data.selectedProduct) {
      this.setRepairContext(this.buildRepairContextFromProduct(this.data.selectedProduct))
      return
    }

    const inferred = this.buildRepairContextFromMessage(message)
    if (inferred) {
      this.setRepairContext(inferred)
    }
  },

  buildRepairContextFromDiagnose(data) {
    const deviceType = (data.deviceType || '').trim()
    const brand = (data.brand || '').trim()
    const symptom = (data.symptom || '').trim()
    const details = (data.details || '').trim()
    const diagnoseSummary = (data.result && data.result.summary) || ''
    const estimatedCost = (data.result && data.result.estimatedCost) || ''
    const typeRule = DEVICE_TYPE_RULES.find(rule => deviceType && rule.name.includes(deviceType))

    return {
      source: 'diagnose',
      summary: [brand, deviceType].filter(Boolean).join(' ') || '自检设备',
      device: {
        device_type_id: typeRule ? typeRule.id : 0,
        device_type_name: typeRule ? typeRule.name : deviceType,
        brand_name: brand,
        device_model: '',
        problem_name: symptom,
        problem_description: details,
        diagnose_summary: diagnoseSummary,
        estimated_cost: estimatedCost
      }
    }
  },

  buildRepairContextFromProduct(product) {
    if (!product) return null

    const category = (product.category || '').trim()
    const deviceTypeId = CATEGORY_TO_DEVICE_TYPE[category] || 0
    const brandName = BRAND_NAME_MAP[product.brand] || product.brand || ''

    return {
      source: 'product',
      summary: [brandName, product.name].filter(Boolean).join(' '),
      device: {
        device_type_id: deviceTypeId,
        device_type_name: category || '维修设备',
        brand_name: brandName,
        device_model: product.name || '',
        problem_name: '',
        problem_description: product.category ? `客服咨询设备：${product.category}` : ''
      }
    }
  },

  buildRepairContextFromMessage(message = '') {
    const raw = message.trim()
    if (!raw) return null

    const normalized = raw.toLowerCase()
    const deviceRule = DEVICE_TYPE_RULES.find(rule => rule.keywords.some(keyword => normalized.includes(keyword.toLowerCase())))
    const brandRule = BRAND_CONTEXT_RULES.find(rule => rule.keywords.some(keyword => normalized.includes(keyword.toLowerCase())))
    const issueRule = ISSUE_CONTEXT_RULES.find(rule => rule.keywords.some(keyword => normalized.includes(keyword.toLowerCase())))

    if (!deviceRule && !brandRule) {
      return null
    }

    const modelHint = this.extractModelHintFromMessage(raw)

    return {
      source: 'message',
      summary: [brandRule ? brandRule.brand : '', modelHint || (deviceRule ? deviceRule.name : '')].filter(Boolean).join(' ') || raw.slice(0, 18),
      device: {
        device_type_id: deviceRule ? deviceRule.id : 0,
        device_type_name: deviceRule ? deviceRule.name : '',
        brand_name: brandRule ? brandRule.brand : '',
        device_model: modelHint,
        problem_name: issueRule ? issueRule.label : '',
        problem_description: raw
      }
    }
  },

  extractModelHintFromMessage(message = '') {
    const patterns = [
      /\b(iPhone\s?[A-Za-z0-9+\- ]{0,18})/i,
      /\b(iPad\s?[A-Za-z0-9+\- ]{0,18})/i,
      /\b(MacBook\s?[A-Za-z0-9+\- ]{0,18})/i,
      /\b(Mate\s?\d+[A-Za-z0-9+\- ]{0,12})/i,
      /\b(Pura\s?\d+[A-Za-z0-9+\- ]{0,12})/i,
      /\b(Galaxy\s?[A-Za-z0-9+\- ]{0,18})/i,
      /\b(PS5|PS4|Switch(?:\sOLED)?|Xbox\s?[A-Za-z0-9+\- ]{0,10})/i,
      /\b(Mavic\s?[A-Za-z0-9+\- ]{0,18})/i
    ]

    for (let i = 0; i < patterns.length; i += 1) {
      const match = message.match(patterns[i])
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    return ''
  },

  /**
   * 处理建议操作
   */
  handleSuggestedActions(suggestedActions, mode) {
    // 显示快捷按钮
    if (suggestedActions && suggestedActions.length > 0) {
      this.setData({ suggestedActions });
    }
  },

  /**
   * 点击快捷建议
   */
  selectSuggestedAction(e) {
    const action = e.currentTarget.dataset.action;
    if (action.type === 'quick_reply') {
      this.setComposerState(action.text);
    } else if (action.type === 'navigate') {
      // 导航到对应页面
      if (action.action === 'submit_recycle') {
        this.goToRecycle();
      } else {
        this.goToRepair();
      }
    } else if (action.text) {
      // button类型，点击执行对应操作
      if (action.action === 'submit_recycle') {
        this.goToRecycle();
      } else if (action.action === 'submit_order' || action.action === 'book_repair') {
        this.goToRepair();
      } else if (action.action === 'query_order') {
        this.goToMyOrders();
      } else if (action.action === 'show_my_devices') {
        this.goToMyDevices();
      }
    }
  },

  /**
   * 跳转到我的订单页面
   */
  goToMyOrders() {
    wx.switchTab({
      url: '/pages/my-orders/my-orders',
      fail: () => {
        wx.navigateTo({ url: '/pages/my-orders/my-orders' });
      }
    });
  },

  /**
   * 跳转到我的设备页面
   */
  goToMyDevices() {
    wx.navigateTo({
      url: '/pages/my-devices/my-devices',
      fail: () => {
        wx.switchTab({
          url: '/pages/my-devices/my-devices',
          fail: () => { wx.showToast({ title: '请手动前往我的设备', icon: 'none' }); }
        });
      }
    });
  },

  /**
   * 跳转到预约维修页面，并自动填充产品信息
   */
  goToRepair() {
    const app = getApp();
    const repairContext = this.getActiveRepairContext()

    if (repairContext) {
      app.globalData.prefillDeviceData = {
        type: 'repair',
        device: repairContext.device
      }
    }

    wx.switchTab({
      url: '/pages/repair/repair',
      fail: () => {
        wx.navigateTo({ url: '/pages/repair/repair' });
      }
    });
  },

  /**
   * 跳转到回收评估页面
   */
  goToRecycle() {
    const app = getApp();
    const repairContext = this.getActiveRepairContext()

    if (repairContext) {
      app.globalData.prefillRecycleData = {
        type: 'recycle',
        device: repairContext.device
      }
    }

    wx.navigateTo({
      url: '/pages/recycle/recycle',
      fail: () => {
        // 如果导航失败（可能在tabBar上），尝试switchTab
        wx.switchTab({
          url: '/pages/recycle/recycle',
          fail: () => {
            wx.showToast({ title: '请手动前往回收页面', icon: 'none' });
          }
        });
      }
    });
  },

  /**
   * 转人工客服
   */
  async transferToHuman() {
    this.setData({ isTransferring: true });

    try {
      const app = getApp()
      const userInfo = wx.getStorageSync('userInfo') || app.globalData.userInfo || {}
      const response = await chatApi.transferToHuman({
        conversationId: this.data.conversationId,
        reason: 'user_requested',
        userId: userInfo.id || '',
        userOpenid: userInfo.openid || ''
      });

      const resData = response.data || response;

      this.setData({
        conversationId: resData.conversationId || this.data.conversationId,
        queueInfo: resData,
        humanConnected: false
      });

      this.addServiceMessage('正在为您转接人工客服，请稍候...');
      this.connectHumanSocket(resData.conversationId || this.data.conversationId, userInfo.id || '')
    } catch (error) {
      wx.showToast({ title: '转接失败，请稍后重试', icon: 'none' });
      this.setData({ isTransferring: false });
    }
  },

  getChatSocketUrl() {
    const app = getApp()
    const baseUrl = app.globalData.baseUrl || app.globalData.apiUrl || ''
    return baseUrl.replace(/^http/i, 'ws').replace(/\/+$/, '') + '/ws/chat'
  },

  connectHumanSocket(conversationId, userId) {
    if (!conversationId) return
    this.closeHumanSocket()

    const socketTask = wx.connectSocket({
      url: this.getChatSocketUrl()
    })

    this.humanSocketTask = socketTask

    socketTask.onOpen(() => {
      this.setData({ humanSocketConnected: true })
      socketTask.send({
        data: JSON.stringify({
          type: 'auth_user',
          conversationId,
          userId
        })
      })
    })

    socketTask.onMessage((event) => {
      try {
        const payload = JSON.parse(event.data)
        this.handleHumanSocketMessage(payload)
      } catch (error) {
        console.error('解析人工客服消息失败:', error)
      }
    })

    socketTask.onClose(() => {
      this.setData({ humanSocketConnected: false })
    })

    socketTask.onError((error) => {
      console.error('人工客服 Socket 连接失败:', error)
      this.setData({ humanSocketConnected: false })
    })
  },

  closeHumanSocket() {
    if (this.humanSocketTask) {
      try {
        this.humanSocketTask.close({})
      } catch (error) {}
      this.humanSocketTask = null
    }
    this.setData({ humanSocketConnected: false })
  },

  handleHumanSocketMessage(payload) {
    if (!payload || !payload.type) return

    if (payload.type === 'human_connected') {
      const agentInfo = payload.agentInfo || {}
      this.setData({
        humanConnected: true,
        isTransferring: false,
        queueInfo: null,
        currentAgentInfo: agentInfo
      })
      this.addServiceMessage(`您好！我是${agentInfo.name || '人工客服'}，很高兴为您服务！`)
      return
    }

    if (payload.type === 'chat_message' && payload.message) {
      if (payload.message.sender_type === 'human' || payload.message.sender_type === 'system') {
        this.addServiceMessage(payload.message.content)
      }
      return
    }

    if (payload.type === 'conversation_completed') {
      this.setData({
        humanConnected: false,
        currentAgentInfo: null,
        queueInfo: null,
        isTransferring: false
      })
      this.addServiceMessage('人工客服会话已结束，已恢复智能客服服务。')
      return
    }

    if (payload.type === 'human_session_inactive') {
      this.setData({
        humanConnected: false,
        currentAgentInfo: null,
        queueInfo: null,
        isTransferring: false
      })
      this.addServiceMessage('人工客服当前未在线，已切回智能客服继续为您服务。')
    }
  },

  sendMessageToHumanSocket(content) {
    if (!this.humanSocketTask || !this.data.humanSocketConnected) {
      wx.showToast({ title: '人工客服连接中，请稍后', icon: 'none' })
      return
    }

    const app = getApp()
    const userInfo = wx.getStorageSync('userInfo') || app.globalData.userInfo || {}
    this.humanSocketTask.send({
      data: JSON.stringify({
        type: 'user_message',
        conversationId: this.data.conversationId,
        userId: userInfo.id || '',
        content
      })
    })
  },

  /**
   * 轮询人工客服状态
   */
  pollHumanAgentStatus() {
    const pollInterval = setInterval(async () => {
      try {
        const response = await chatApi.getHumanStatus(this.data.conversationId);

        if (response.data.status === 'connected') {
          clearInterval(pollInterval);
          this.setData({
            humanConnected: true,
            isTransferring: false,
            queueInfo: null
          });

          // 添加人工客服已接入消息
          this.addServiceMessage(`您好！我是${response.data.agentInfo.name}，很高兴为您服务！`);
        } else if (response.data.status === 'completed') {
          clearInterval(pollInterval);
          this.setData({
            humanConnected: false,
            isTransferring: false,
            queueInfo: null
          });
        }
      } catch (error) {
        console.error('查询人工客服状态失败:', error);
        // 继续轮询或处理错误
      }
    }, 3000); // 每3秒查询一次
  },

  /**
   * 打开产品选择面板
   */
  openProductPanel() {
    this.setData({
      showProductPanel: true,
      productSearchKey: '',
      filteredGroupedProducts: null
    })
  },

  /**
   * 关闭产品选择面板
   */
  closeProductPanel() {
    this.setData({
      showProductPanel: false,
      productSearchKey: '',
      filteredGroupedProducts: null
    })
  },

  /**
   * 产品搜索
   */
  onProductSearch(e) {
    const keyword = e.detail.value.trim().toLowerCase()
    this.setData({ productSearchKey: e.detail.value })

    if (!keyword) {
      this.setData({ filteredGroupedProducts: null })
      return
    }

    const groupedProducts = this.data.groupedProducts
    const filtered = groupedProducts.map(group => {
      const matchedProducts = group.products.filter(p =>
        p.name.toLowerCase().includes(keyword) ||
        p.brand.toLowerCase().includes(keyword) ||
        (p.category && p.category.toLowerCase().includes(keyword))
      )
      if (matchedProducts.length > 0) {
        return { ...group, products: matchedProducts }
      }
      return null
    }).filter(Boolean)

    this.setData({ filteredGroupedProducts: filtered })
  },

  /**
   * 搜索无结果时点击咨询客服
   */
  onSearchEmptyConsult() {
    const keyword = this.data.productSearchKey.trim()
    const consultMessage = keyword ? `我想维修${keyword}，请问能修吗？` : ''
    this.setComposerState('', {
      showProductPanel: false,
      productSearchKey: '',
      filteredGroupedProducts: null
    })
    if (!consultMessage) {
      return
    }

    this.syncRepairContextFromMessage(consultMessage)

    const message = {
      id: Date.now(),
      type: 'user',
      content: consultMessage,
      time: this.getCurrentTime()
    }

    const targetId = `msg-${message.id}`;
    this.setData({
      messages: this.data.messages.concat(message),
      scrollToView: '',
      suggestedActions: this.buildContextQuickReplies()
    })
    wx.nextTick(() => {
      this.setData({ scrollToView: targetId })
    })

    this.sendMessageToService(consultMessage)
  },

  /**
   * 选择产品
   */
  async selectProduct(e) {
    const product = e.currentTarget.dataset.product

    // 设置当前选中产品
    this.setData({
      selectedProduct: product,
      showProductPanel: false,
      productSearchKey: '',
      filteredGroupedProducts: null
    })
    this.setRepairContext(this.buildRepairContextFromProduct(product))

    // 添加产品卡片到聊天记录
    const message = {
      id: Date.now(),
      type: 'product',
      data: product,
      time: this.getCurrentTime()
    }

    const messages = this.data.messages.concat(message)
    const targetId = `msg-${message.id}`;
    this.setData({
      messages: messages,
      scrollToView: '',
      suggestedActions: this.buildContextQuickReplies()
    })
    wx.nextTick(() => {
      this.setData({ scrollToView: targetId })
    })

    // 自动发送产品咨询消息
    await this.sendMessageToService(`我想咨询${product.name}的维修服务`)
  },

  /**
   * 选择快捷短语
   */
  selectQuickPhrase(e) {
    const phrase = e.currentTarget.dataset.phrase
    this.setComposerState(phrase, {
      showQuickPhrases: false,
      suggestedActions: []
    })
  },

  /**
   * 获取分组后的产品列表
   */
  getGroupedProducts() {
    const products = this.data.productList || []
    const groups = {}

    products.forEach(product => {
      const brand = product.brand || '其他'
      if (!groups[brand]) {
        groups[brand] = {
          brand,
          products: []
        }
      }
      groups[brand].products.push(product)
    })

    // 转换为数组并按品牌名排序
    return Object.values(groups).sort((a, b) => a.brand.localeCompare(b.brand))
  },

  /**
   * 清空对话历史
   */
  async clearChatHistory() {
    try {
      await chatApi.clearHistory(this.data.conversationId)
      this.setComposerState('', {
        messages: [
          {
            id: Date.now(),
            type: 'service',
            content: '您好！我是修小宝，您的电子维修智能助手。我可以帮您解答手机、电脑、相机、无人机等各类设备的维修问题，也能查询订单进度和维修报价，还支持设备回收估价。点击📦选择产品，或直接输入问题即可开始咨询~',
            time: this.getCurrentTime()
          }
        ],
        selectedProduct: null,
        suggestedActions: [],
        repairContext: null,
        isSending: false,
        serviceTyping: false,
        pendingReplyCount: 0
      })
      wx.showToast({ title: '对话已重置', icon: 'success' })
    } catch (error) {
      console.error('清空对话失败:', error)
    }
  },

  /**
   * 点击路由跳转链接
   */
  onJumpLink(e) {
    const path = e.currentTarget.dataset.path;
    if (!path) return;

    if (path === '/pages/repair/repair') {
      this.goToRepair()
      return
    }

    if (path === '/pages/recycle/recycle') {
      this.goToRecycle()
      return
    }

    // 使用 switchTab 跳转到 tab 页面
    wx.switchTab({
      url: path,
      fail: () => {
        // 如果不是 tab 页面，使用 navigateTo
        wx.navigateTo({ url: path });
      }
    });
  },

  async restoreHumanServiceState() {
    if (!this.data.conversationId) return
    try {
      const res = await chatApi.getHumanStatus(this.data.conversationId)
      const data = res.data || res || {}
      if (data.status === 'waiting' || data.status === 'connected') {
        const app = getApp()
        const userInfo = wx.getStorageSync('userInfo') || app.globalData.userInfo || {}
        this.setData({
          queueInfo: data.status === 'waiting' ? data : null,
          humanConnected: data.status === 'connected',
          currentAgentInfo: data.agentInfo || null,
          isTransferring: data.status === 'waiting'
        })
        this.connectHumanSocket(this.data.conversationId, userInfo.id || '')
      }
    } catch (error) {
      console.warn('[Service] 恢复人工客服状态失败:', error)
    }
  }
})
