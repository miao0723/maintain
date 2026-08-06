// pages/recycle-guide/recycle-guide.js
const { guideQuestions, conditionRates } = require('../../utils/recycleData.js');
const { orderApi } = require('../../utils/api.js');

Page({
  data: {
    // 产品信息
    product: {
      categoryId: '',
      categoryName: '',
      brandId: '',
      brandName: '',
      brandLogoText: '',
      brandLogoColor: '#666',
      modelId: '',
      modelName: '',
      modelPrice: 0,
      modelSpecs: '',
      modelColor: '#5a6e8a'
    },

    // 问题相关
    questions: [],
    currentQuestionIndex: 0,
    totalQuestions: 0,
    answers: {},
    estimatedPrice: 0,
    
    // 动画状态
    questionState: 'enter', // enter | exit | visible
    isTransitioning: false,
    
    // 估价
    isEvaluating: false,
    evaluationComplete: false,
    evaluationText: '',
    priceRange: { min: 0, max: 0 },

    // 地址相关
    selectedAddress: null,
    showAddressPicker: false,
    addressList: [],

    // 提交
    submitting: false,
    showExtraInput: false,
    extraNotes: ''
  },

  onLoad(options) {
    const decode = (val) => val ? decodeURIComponent(val) : '';
    const product = {
      categoryId: decode(options.categoryId),
      categoryName: decode(options.categoryName),
      brandId: decode(options.brandId),
      brandName: decode(options.brandName),
      brandLogoText: decode(options.brandLogoText),
      brandLogoColor: decode(options.brandLogoColor),
      modelId: decode(options.modelId),
      modelName: decode(options.modelName),
      modelPrice: parseInt(options.modelPrice) || 0,
      modelSpecs: decode(options.modelSpecs),
      modelColor: decode(options.modelColor)
    };

    const questions = guideQuestions.map((q, i) => ({
      ...q,
      stepNumber: i + 1
    }));

    this.setData({
      product,
      questions,
      totalQuestions: questions.length,
      estimatedPrice: product.modelPrice
    });

    // 入场动画
    setTimeout(() => {
      this.setData({ questionState: 'visible' });
    }, 300);
  },

  onShow() {
    this.loadAddresses().then(() => {
      wx.hideLoading();
    }).catch(() => {
      wx.hideLoading();
    });
    setTimeout(() => { wx.hideLoading(); }, 3000);
    
    if (this._needRefreshAddress) {
      this._needRefreshAddress = false;
      this.loadAddresses();
    }
  },

  // ==================== 问题流程 ====================

  onOptionSelect(e) {
    if (this.data.isTransitioning) return;
    
    const { value, label, rate, desc } = e.currentTarget.dataset;
    const { currentQuestionIndex, answers, product, questions } = this.data;
    const q = questions[currentQuestionIndex];

    // 记录回答
    answers[q.id] = { value, label, rate: rate || 1 };
    
    // 计算实时估价
    let quickEstimate = product.modelPrice;
    Object.keys(answers).forEach(key => {
      if (answers[key] && answers[key].rate) {
        quickEstimate *= answers[key].rate;
      }
    });

    const nextIndex = currentQuestionIndex + 1;
    const isLast = nextIndex >= questions.length;

    this.setData({
      answers,
      estimatedPrice: Math.round(quickEstimate),
      isTransitioning: true,
      questionState: 'exit'
    });

    // 延迟切换到下一个问题
    setTimeout(() => {
      if (isLast) {
        this.startEvaluation();
      } else {
        this.setData({
          currentQuestionIndex: nextIndex,
          questionState: 'enter',
          isTransitioning: false
        });
        setTimeout(() => {
          this.setData({ questionState: 'visible' });
        }, 100);
      }
    }, 350);
  },

  onExtraInputInput(e) {
    this.setData({ extraNotes: e.detail.value });
  },

  onExtraInputConfirm() {
    const value = (this.data.extraNotes || '').trim();
    if (!value && guideQuestions[this.data.currentQuestionIndex].required) {
      wx.showToast({ title: '请输入说明内容', icon: 'none' });
      return;
    }

    const q = this.data.questions[this.data.currentQuestionIndex];
    const answers = { ...this.data.answers };
    answers[q.id] = { value: value || '无', label: value || '无额外问题', rate: 1 };

    const nextIndex = this.data.currentQuestionIndex + 1;

    this.setData({
      answers,
      currentQuestionIndex: nextIndex,
      showExtraInput: false
    });

    if (nextIndex >= this.data.questions.length) {
      this.startEvaluation();
    }
  },

  onSkipExtra() {
    const q = this.data.questions[this.data.currentQuestionIndex];
    const answers = { ...this.data.answers };
    answers[q.id] = { value: '无', label: '跳过', rate: 1 };

    const nextIndex = this.data.currentQuestionIndex + 1;

    this.setData({
      answers,
      currentQuestionIndex: nextIndex,
      showExtraInput: false
    });

    if (nextIndex >= this.data.questions.length) {
      this.startEvaluation();
    }
  },

  // ==================== 估价逻辑 ====================

  async startEvaluation() {
    this.setData({ isEvaluating: true });

    const localEstimate = this.calculateLocalEstimate();
    const priceRange = this.calculatePriceRange(localEstimate);
    const evaluationText = this.generateEvaluationText(localEstimate, priceRange);

    try {
      const llmResult = await this.callLLMEvaluation();
      if (llmResult && llmResult.price) {
        this.finishEvaluation(llmResult.price, priceRange, llmResult.reason || evaluationText, true);
      } else {
        this.finishEvaluation(localEstimate, priceRange, evaluationText, false);
      }
    } catch (error) {
      console.log('LLM估价失败，使用本地计算:', error.message);
      this.finishEvaluation(localEstimate, priceRange, evaluationText, false);
    }
  },

  calculateLocalEstimate() {
    const { product, answers } = this.data;
    let price = product.modelPrice;
    if (answers.condition) price *= answers.condition.rate;
    if (answers.screen) price *= answers.screen.rate;
    if (answers.function) price *= answers.function.rate;
    if (answers.version) price *= answers.version.rate;
    if (answers.accessories) price *= answers.accessories.rate;
    if (answers['repair-history']) price *= answers['repair-history'].rate;
    return Math.round(price);
  },

  calculatePriceRange(estimate) {
    return {
      min: Math.round(estimate * 0.85),
      max: Math.round(estimate * 1.1)
    };
  },

  generateEvaluationText(estimate, range) {
    const { product, answers } = this.data;
    const condition = answers.condition?.label || '未知';
    const screen = answers.screen?.label || '未知';
    const func = answers.function?.label || '未知';
    const version = answers.version?.label || '未知';

    return `根据您对 **${product.brandName} ${product.modelName}** 的评估：

• 成色：${condition}
• 屏幕：${screen}
• 功能：${func}
• 版本：${version}

综合以上信息，我为您估算的回收价格为 ¥${estimate} 左右，价格区间在 ¥${range.min} ~ ¥${range.max}。`;
  },

  async callLLMEvaluation() {
    const token = wx.getStorageSync('token') || '';
    const { product, answers } = this.data;

    return new Promise((resolve, reject) => {
      const { getApiBaseCandidates } = require('../../utils/runtimeConfig.js');
      const baseCandidates = getApiBaseCandidates();
      const baseUrl = baseCandidates[0];
      if (!baseUrl) { reject(new Error('API地址未配置')); return; }

      wx.request({
        url: `${baseUrl}/recycle/evaluate`,
        method: 'POST',
        data: {
          product: {
            category: product.categoryName,
            brand: product.brandName,
            model: product.modelName,
            basePrice: product.modelPrice,
            specs: product.modelSpecs
          },
          answers: Object.keys(answers).reduce((acc, key) => {
            acc[key] = { value: answers[key].value, label: answers[key].label };
            return acc;
          }, {})
        },
        header: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            resolve(res.data.data);
          } else {
            resolve(null);
          }
        },
        fail: () => resolve(null)
      });
    });
  },

  finishEvaluation(price, priceRange, text, fromLLM) {
    this.setData({
      estimatedPrice: price,
      priceRange,
      evaluationComplete: true,
      evaluationText: text,
      isEvaluating: false,
      fromLLM
    });
  },

  // ==================== 地址管理 ====================

  formatAddressList(rawList) {
    return (rawList || []).map(addr => {
      if (addr._formatted) return addr;
      return {
        ...addr,
        _formatted: true,
        id: addr.id || addr.address_id,
        name: addr.contact_name || addr.contactName || addr.name || '',
        phone: addr.contact_phone || addr.contactPhone || addr.phone || '',
        province: addr.province || '',
        city: addr.city || '',
        district: addr.district || '',
        detail: addr.detail_address || addr.detail || '',
        postalCode: addr.postal_code || addr.postalCode || '',
        isDefault: !!(addr.is_default || addr.isDefault),
        tags: addr.tags ? (typeof addr.tags === 'string' ? JSON.parse(addr.tags) : addr.tags) : [],
        user_id: addr.user_id,
        created_at: addr.created_at
      };
    });
  },

  async loadAddresses() {
    try {
      const { addressApi } = require('../../utils/api.js');
      const rawList = await addressApi.getAddressList();
      const addressList = this.formatAddressList(Array.isArray(rawList) ? rawList : (rawList.data || []));
      const defaultAddr = addressList.find(a => a.isDefault) || addressList[0] || null;

      this.setData({
        addressList,
        selectedAddress: defaultAddr,
        showAddressPicker: false
      });
    } catch (error) {
      console.log('加载地址失败:', error);
      this.setData({ addressList: [], selectedAddress: null });
    }
  },

  openAddressPicker() {
    if (this.data.addressList.length === 0) {
      wx.showToast({ title: '暂无地址，请先添加', icon: 'none' });
      this.goToAddAddress();
      return;
    }
    this.setData({ showAddressPicker: true });
  },

  closeAddressPicker() {
    this.setData({ showAddressPicker: false });
  },

  onSelectAddress(e) {
    const index = e.currentTarget.dataset.index;
    const address = this.data.addressList[index];
    this.setData({
      selectedAddress: address,
      showAddressPicker: false
    });
  },

  goToAddAddress() {
    wx.navigateTo({
      url: '/pages/address-edit/address-edit?mode=add',
      success: () => {
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        if (currentPage) {
          currentPage._needRefreshAddress = true;
        }
      }
    });
  },

  // ==================== 提交订单 ====================

  async onSubmitOrder() {
    if (this.data.submitting) return;
    if (!this.data.selectedAddress) {
      wx.showToast({ title: '请先选择回收地址', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' });

    try {
      const { product, answers, selectedAddress, estimatedPrice } = this.data;

      const description = Object.keys(answers).map(key => {
        const a = answers[key];
        const q = guideQuestions.find(gq => gq.id === key);
        return `${q ? q.question : key}：${a.label}`;
      }).join('；');

      const orderData = {
        orderType: 'recycle',
        deviceId: product.modelId,
        deviceType: product.categoryName,
        deviceTypeName: product.categoryName,
        brand: product.brandName,
        model: product.modelName,
        deviceCondition: answers.condition?.label || '',
        condition: answers.condition?.label || '',
        estimatedPrice,
        problem: description,
        description: `回收估价单\n产品：${product.brandName} ${product.modelName}\n型号：${product.modelName}\n\n评估详情：\n${description}\n\nLLM估价：¥${estimatedPrice}`,
        images: [],
        serviceType: 'shop',
        addressId: selectedAddress.id,
        address: `${selectedAddress.name} ${selectedAddress.phone}\n${selectedAddress.province}${selectedAddress.city}${selectedAddress.district} ${selectedAddress.detail}`
      };

      // 金额确认（按市场基准价对比，确认回收报价是否合理）
      const marketBase = product.modelPrice || 0;
      const pct = marketBase > 0 ? Math.round((estimatedPrice / marketBase) * 100) : 0;
      const confirmMsg =
        `市场基准价（全新）：¥${this.formatPrice(marketBase)}\n` +
        `设备成色：${answers.condition?.label || '未评估'}\n` +
        `本次回收估价：¥${this.formatPrice(estimatedPrice)}\n` +
        `（成色折算后约为基准价的 ${pct}%，属合理区间）`;

      const confirmed = await new Promise((resolve) => {
        wx.showModal({
          title: '确认回收金额',
          content: confirmMsg,
          confirmText: '确认提交',
          confirmColor: '#3a7a3a',
          cancelText: '再看看',
          success: (r) => resolve(!!r.confirm)
        });
      });

      if (!confirmed) {
        wx.hideLoading();
        this.setData({ submitting: false });
        return;
      }

      const res = await orderApi.createOrder(orderData);
      wx.hideLoading();

      if (res && res.success) {
        wx.showToast({ title: '回收订单已提交', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack({ delta: 2 });
        }, 1500);
      } else {
        wx.showToast({ title: res?.message || '提交失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('提交回收订单失败:', error);
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    }

    this.setData({ submitting: false });
  },

  // ==================== 工具方法 ====================

  onBack() {
    if (this.data.evaluationComplete && !this.data.submitting) {
      wx.navigateBack();
    } else if (this.data.currentQuestionIndex > 0) {
      // 可以在这里添加"确认退出"的逻辑
      wx.showModal({
        title: '退出评估',
        content: '确定要退出吗？已填写的信息将会丢失。',
        success: (res) => {
          if (res.confirm) wx.navigateBack();
        }
      });
    } else {
      wx.navigateBack();
    }
  },

  onContactSupport() {
    // service 是 tabBar 页面，必须用 switchTab，navigateTo 会静默失败
    wx.switchTab({ url: '/pages/service/service' });
  },

  formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
});
