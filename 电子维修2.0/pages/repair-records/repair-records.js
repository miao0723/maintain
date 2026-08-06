// pages/repair-records/repair-records.js
const app = getApp();

Page({
  data: {
    orderId: null,
    orderDetail: null,
    loading: true,
    submitting: false,
    baseUrl: '',

    // 维修记录列表
    records: [],

    // 添加维修记录弹窗
    showAddModal: false,
    addFormData: {
      stage: '',
      title: '',
      description: '',
      images: [],
      videos: [],
      parts: []
    },
    addFormDataPartsTotal: '0.00',

    // 阶段选项
    stageOptions: [
      { value: '接单', label: '接单确认' },
      { value: '检测', label: '故障检测' },
      { value: '维修', label: '维修处理' },
      { value: '测试', label: '功能测试' },
      { value: '完成', label: '维修完成' }
    ],

    // 配件列表
    partsList: [],

    token: null
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
      baseUrl: app.globalData.baseUrl || ''
    });

    this.loadOrderDetail();
    this.loadRepairRecords();
  },

  /**
   * 加载订单详情
   */
  async loadOrderDetail() {
    try {
      const res = await wx.request({
        url: `${app.globalData.baseUrl}/api/orders/${this.data.orderId}/detail`,
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
   * 加载维修记录
   */
  async loadRepairRecords() {
    try {
      const res = await wx.request({
        url: `${app.globalData.baseUrl}/api/repair-records/order/${this.data.orderId}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.statusCode === 200 && res.data && res.data.success) {
        const stageClassMap = {
          '接单': 'jiedan',
          '检测': 'jiance',
          '维修': 'weixiu',
          '测试': 'ceshi',
          '完成': 'wancheng'
        };
        const records = (res.data.data.records || []).map(record => ({
          ...record,
          stageClass: stageClassMap[record.stage] || '',
          partsTotal: record.parts_used ? record.parts_used.reduce((sum, p) => sum + (p.quantity * p.price), 0).toFixed(2) : '0.00',
          parts_used: (record.parts_used || []).map(part => ({
            ...part,
            subtotal: ((part.quantity || 0) * (part.price || 0)).toFixed(2)
          }))
        }));
        this.setData({ records });
      }
    } catch (error) {
      console.error('加载维修记录失败:', error);
    }
  },

  /**
   * 打开添加记录弹窗
   */
  openAddModal() {
    this.setData({
      showAddModal: true,
      addFormData: {
        stage: '',
        title: '',
        description: '',
        images: [],
        videos: [],
        parts: []
      },
      addFormDataPartsTotal: '0.00'
    });
  },

  /**
   * 关闭添加记录弹窗
   */
  closeAddModal() {
    this.setData({
      showAddModal: false
    });
  },

  stopPropagation() {},

  /**
   * 选择阶段
   */
  selectStage(e) {
    const stage = e.currentTarget.dataset.stage;
    this.setData({
      'addFormData.stage': stage
    });
    this.generateTitle(stage);
  },

  /**
   * 根据阶段生成标题
   */
  generateTitle(stage) {
    const titles = {
      '接单': '已接单，准备开始检测',
      '检测': '完成故障检测',
      '维修': '正在维修处理中',
      '测试': '功能测试完成',
      '完成': '维修完成，准备配送'
    };

    this.setData({
      'addFormData.title': titles[stage] || ''
    });
  },

  /**
   * 标题输入
   */
  onTitleInput(e) {
    this.setData({
      'addFormData.title': e.detail.value
    });
  },

  /**
   * 描述输入
   */
  onDescInput(e) {
    this.setData({
      'addFormData.description': e.detail.value
    });
  },

  /**
   * 选择图片
   */
  chooseImages() {
    const { addFormData } = this.data;
    const remainingCount = 10 - addFormData.images.length - addFormData.videos.length;

    if (remainingCount <= 0) {
      wx.showToast({ title: '已达到上传上限', icon: 'none' });
      return;
    }

    wx.chooseImage({
      count: remainingCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.uploadFiles(res.tempFilePaths, 'image');
      }
    });
  },

  /**
   * 选择视频
   */
  chooseVideo() {
    const { addFormData } = this.data;
    const remainingCount = 10 - addFormData.images.length - addFormData.videos.length;

    if (remainingCount <= 0) {
      wx.showToast({ title: '已达到上传上限', icon: 'none' });
      return;
    }

    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 300, // 5分钟
      success: (res) => {
        this.uploadFiles([res.tempFilePath], 'video');
      }
    });
  },

  /**
   * 上传文件
   */
  async uploadFiles(filePaths, type) {
    wx.showLoading({ title: '上传中...' });

    try {
      const uploadPromises = filePaths.map(filePath => {
        return new Promise((resolve, reject) => {
          wx.uploadFile({
            url: `${app.globalData.baseUrl}/api/upload/repair`,
            filePath: filePath,
            name: 'files',
            header: {
              'Authorization': `Bearer ${this.data.token}`
            },
            success: (uploadRes) => {
              try {
                const data = JSON.parse(uploadRes.data);
                if (data.success && data.data && data.data.length > 0) {
                  resolve(data.data[0]);
                } else {
                  reject(new Error('上传失败'));
                }
              } catch (e) {
                reject(e);
              }
            },
            fail: reject
          });
        });
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      if (type === 'image') {
        this.setData({
          'addFormData.images': [...this.data.addFormData.images, ...uploadedFiles]
        });
      } else {
        this.setData({
          'addFormData.videos': [...this.data.addFormData.videos, ...uploadedFiles]
        });
      }

      wx.hideLoading();
      wx.showToast({ title: '上传成功', icon: 'success' });
    } catch (error) {
      wx.hideLoading();
      console.error('上传文件失败:', error);
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  /**
   * 删除图片
   */
  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.addFormData.images.filter((_, i) => i !== index);
    this.setData({ 'addFormData.images': images });
  },

  /**
   * 删除视频
   */
  removeVideo(e) {
    const index = e.currentTarget.dataset.index;
    const videos = this.data.addFormData.videos.filter((_, i) => i !== index);
    this.setData({ 'addFormData.videos': videos });
  },

  /**
   * 添加配件
   */
  addPart() {
    const { addFormData } = this.data;
    const part = {
      id: Date.now(),
      name: '',
      quantity: 1,
      price: 0
    };

    this.setData({
      'addFormData.parts': [...addFormData.parts, part],
      addFormDataPartsTotal: this.calculatePartsTotal([...addFormData.parts, part])
    });
  },

  /**
   * 配件信息输入
   */
  onPartInput(e) {
    const { index, field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const parts = [...this.data.addFormData.parts];

    if (field === 'quantity' || field === 'price') {
      parts[index][field] = parseFloat(value) || 0;
    } else {
      parts[index][field] = value;
    }

    this.setData({
      'addFormData.parts': parts,
      addFormDataPartsTotal: this.calculatePartsTotal(parts)
    });
  },

  /**
   * 删除配件
   */
  removePart(e) {
    const index = e.currentTarget.dataset.index;
    const parts = this.data.addFormData.parts.filter((_, i) => i !== index);
    this.setData({
      'addFormData.parts': parts,
      addFormDataPartsTotal: this.calculatePartsTotal(parts)
    });
  },

  /**
   * 计算配件总价
   */
  calculatePartsTotal(parts) {
    const partsToCalculate = parts || this.data.addFormData.parts;
    return partsToCalculate.reduce((total, part) => {
      return total + (part.quantity * part.price);
    }, 0);
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const index = Number(e.currentTarget.dataset.index || 0);
    const images = this.data.addFormData.images.map(img => this.buildMediaUrl(img.url));

    wx.previewImage({
      current: images[index],
      urls: images
    });
  },

  previewRecordImage(e) {
    const images = (e.currentTarget.dataset.urls || []).map(item => this.buildMediaUrl(item.url || item));
    const current = this.buildMediaUrl(e.currentTarget.dataset.url);

    if (!images.length || !current) return;

    wx.previewImage({
      current,
      urls: images
    });
  },

  /**
   * 预览视频
   */
  previewVideo(e) {
    const index = Number(e.currentTarget.dataset.index || 0);
    const video = this.data.addFormData.videos[index];
    if (!video || !video.url) return;

    wx.navigateTo({
      url: `/pages/video-player/video-player?url=${encodeURIComponent(this.buildMediaUrl(video.url))}`
    });
  },

  previewRecordVideo(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;

    wx.navigateTo({
      url: `/pages/video-player/video-player?url=${encodeURIComponent(this.buildMediaUrl(url))}`
    });
  },

  buildMediaUrl(url) {
    if (!url) return '';
    if (/^https?:\/\//.test(url)) return url;
    return `${this.data.baseUrl}${url}`;
  },

  /**
   * 提交维修记录
   */
  async submitRecord() {
    if (this.data.submitting) return;

    const { orderId, addFormData } = this.data;

    if (!addFormData.stage || !addFormData.title) {
      wx.showToast({ title: '请选择阶段并填写标题', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中...', mask: true });
    this.setData({ submitting: true });

    try {
      const res = await wx.request({
        url: `${app.globalData.baseUrl}/api/repair-records`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${this.data.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          order_id: parseInt(orderId),
          stage: addFormData.stage,
          title: addFormData.title,
          description: addFormData.description,
          images: addFormData.images,
          videos: addFormData.videos,
          parts_used: addFormData.parts
        }
      });

      wx.hideLoading();

      if (res.statusCode === 200 && res.data && res.data.success) {
        wx.showToast({ title: '添加成功', icon: 'success' });
        this.closeAddModal();
        this.loadRepairRecords();

        // 如果是完成阶段，询问是否分配配送
        if (addFormData.stage === '完成') {
          setTimeout(() => {
            this.askAboutDelivery();
          }, 1500);
        }
      } else {
        wx.showToast({ title: res.data?.error || '添加失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('提交维修记录失败:', error);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  /**
   * 询问是否分配配送
   */
  askAboutDelivery() {
    wx.showModal({
      title: '维修已完成',
      content: '是否立即分配配送员？',
      confirmText: '去分配',
      cancelText: '稍后',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/delivery-assign/delivery-assign?orderId=${this.data.orderId}`
          });
        }
      }
    });
  },

  /**
   * 删除记录
   */
  async deleteRecord(e) {
    const recordId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条维修记录吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });

          try {
            const response = await wx.request({
              url: `${app.globalData.baseUrl}/api/repair-records/${recordId}`,
              method: 'DELETE',
              header: {
                'Authorization': `Bearer ${this.data.token}`,
                'Content-Type': 'application/json'
              }
            });

            wx.hideLoading();

            if (response.statusCode === 200 && response.data && response.data.success) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadRepairRecords();
            } else {
              wx.showToast({ title: response.data?.error || '删除失败', icon: 'none' });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('删除记录失败:', error);
            wx.showToast({ title: '网络错误', icon: 'none' });
          }
        }
      }
    });
  },

  /**
   * 返回订单详情
   */
  goToOrderDetail() {
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${this.data.orderId}`
    });
  }
});
