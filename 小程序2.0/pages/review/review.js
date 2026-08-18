// pages/review/review.js
const { orderApi } = require('../../utils/api.js');
const { getMpApiBaseUrl } = require('../../utils/mpApi.js');

// 评分对应的表情
const RATING_EMOJIS = { 1: '😡', 2: '☹️', 3: '😐', 4: '😊', 5: '🤩' };
// 评分对应的描述
const RATING_DESCS = { 1: '非常不满意', 2: '不满意', 3: '一般般', 4: '满意', 5: '非常满意' };
// 评分对应的快捷标签
const RATING_TAGS = {
  1: ['服务态度差', '技术不行', '价格太贵', '速度太慢', '维修不彻底'],
  2: ['有待改进', '服务一般', '价格偏高', '沟通不畅'],
  3: ['中规中矩', '还可以', '技术还行', '价格适中'],
  4: ['服务不错', '技术专业', '价格合理', '速度快', '态度好'],
  5: ['非常满意', '技术专业', '服务周到', '价格合理', '速度快', '态度热情', '维修彻底']
};
// 评分对应的评价占位提示
const RATING_PLACEHOLDERS = {
  1: '请告诉我们哪里做得不好，我们一定改进...',
  2: '有哪些方面让您不满意？请告诉我们...',
  3: '请分享您的使用体验和建议...',
  4: '满意的话就分享一下吧！😊',
  5: '分享一下愉快的维修体验吧！🎉'
};

Page({
  data: {
    orderId: '',
    order: null,
    rating: 5,
    ratingEmoji: '🤩',
    ratingDesc: '非常满意',
    comment: '',
    commentPlaceholder: '分享一下愉快的维修体验吧！🎉',
    images: [],
    quickTags: [],
    isLoading: false,
    isSubmitting: false
  },

  /**
   * 更新评分相关显示（表情、描述、标签、占位符）
   */
  updateRatingDisplay(rating) {
    const tags = (RATING_TAGS[rating] || []).map(text => ({ text, selected: false }));
    this.setData({
      ratingEmoji: RATING_EMOJIS[rating] || '😐',
      ratingDesc: RATING_DESCS[rating] || '一般般',
      commentPlaceholder: RATING_PLACEHOLDERS[rating] || '请输入您的评价...',
      quickTags: tags
    });
  },

  onLoad(options) {
    const orderId = options.orderId;
    if (!orderId) {
      wx.showToast({
        title: '订单不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({
      orderId: orderId
    });

    this.loadOrderDetail(orderId);
  },

  /**
   * 加载订单详情
   */
  async loadOrderDetail(orderId) {
    this.setData({ isLoading: true });

    try {
      const response = await orderApi.getOrderDetail(orderId);

      if (response && response.success && response.data) {
        // API返回结构: response.data.order 才是订单对象（backend返回的格式）
        const rawOrder = response.data.order || response.data;

        // 格式化订单数据
        const orderType = rawOrder.order_type || rawOrder.repair_type || 'repair';
        const deviceType = rawOrder.device_type || 1;

        // 价格处理：优先使用 actual_price > quote_price > estimated_price
        let price = rawOrder.actual_price || rawOrder.quote_price || rawOrder.estimated_price || '';
        if (price) {
          price = parseFloat(price).toFixed(2);
        }

        const formattedOrder = {
          orderId: rawOrder.order_no || rawOrder.order_id || `ORD${rawOrder.id}`,
          orderNo: rawOrder.order_no || rawOrder.order_id || `ORD${rawOrder.id}`,
          orderType: this.getOrderTypeText(orderType),
          orderTypeRaw: orderType,
          deviceType: this.getDeviceTypeText(deviceType),
          deviceTypeRaw: deviceType,
          deviceModel: rawOrder.device_model || '未知型号',
          brandName: rawOrder.brand_name || rawOrder.brandName || '',
          problemDescription: rawOrder.problem_description || rawOrder.fault_desc || '暂无描述',
          customDescription: rawOrder.custom_description || '',
          price: price,
          hasPrice: !!price,
          estimatedPrice: rawOrder.estimated_price || '',
          actualPrice: rawOrder.actual_price || '',
          quotePrice: rawOrder.quote_price || '',
          createdAt: this.formatTime(rawOrder.created_at || rawOrder.createdAt),
          serviceType: rawOrder.service_type || rawOrder.serviceType || '',
          serviceTypeText: rawOrder.service_type === 'shop' ? '到店维修' : rawOrder.service_type === 'home' ? '上门服务' : '',
          images: rawOrder.images || []
        };

        this.setData({
          order: formattedOrder,
          isLoading: false
        });

        // 初始化评分显示（默认5星）
        this.updateRatingDisplay(this.data.rating);

        console.log('订单详情加载成功:', formattedOrder);
      } else {
        throw new Error('订单详情数据格式错误');
      }
    } catch (error) {
      console.error('加载订单详情失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });

      this.setData({
        isLoading: false
      });
    }
  },

  /**
   * 选择评分
   */
  selectRating(e) {
    const rating = parseInt(e.currentTarget.dataset.rating);
    if (rating >= 1 && rating <= 5) {
      this.setData({ rating });
      this.updateRatingDisplay(rating);
    }
  },

  /**
   * 切换快捷标签选中状态，选中标签文字追加到评价内容
   */
  toggleTag(e) {
    const tagText = e.currentTarget.dataset.tag;
    const tags = this.data.quickTags.map(t => {
      if (t.text === tagText) {
        return { ...t, selected: !t.selected };
      }
      return t;
    });
    // 收集所有选中的标签文字，拼接到评价内容中
    const selectedTexts = tags.filter(t => t.selected).map(t => t.text);
    const tagStr = selectedTexts.join('，');
    let comment = this.data.comment;
    // 替换评论中已有的标签部分
    comment = comment.replace(/^【[^】]*】\s*/, '');
    if (tagStr) {
      comment = `【${tagStr}】 ${comment}`;
    }
    this.setData({ quickTags: tags, comment });
  },

  /**
   * 输入评价内容
   */
  onCommentInput(e) {
    this.setData({
      comment: e.detail.value
    });
  },

  /**
   * 选择图片
   */
  chooseImage() {
    const remaining = 3 - this.data.images.length;
    if (remaining <= 0) {
      wx.showToast({
        title: '最多上传3张图片',
        icon: 'none'
      });
      return;
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles.map(file => file.tempFilePath);
        this.setData({
          images: [...this.data.images, ...tempFiles]
        });
      }
    });
  },

  /**
   * 删除图片
   */
  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  /**
   * 提交评价
   */
  async submitReview() {
    const { orderId, rating, comment, images } = this.data;

    // 验证输入
    if (!comment.trim()) {
      wx.showToast({
        title: '请输入评价内容',
        icon: 'none'
      });
      return;
    }

    if (comment.trim().length < 5) {
      wx.showToast({
        title: '评价内容至少5个字',
        icon: 'none'
      });
      return;
    }

    // 获取用户ID
    const userInfo = wx.getStorageSync('userInfo');
    const userId = userInfo?.id || 4;

    this.setData({ isSubmitting: true });

    try {
      // 上传图片(如果有本地图片需要上传)
      let uploadedImages = images;
      if (images && images.length > 0) {
        // 检查是否有本地临时文件路径需要上传
        const localFiles = images.filter(img => img.startsWith('wxfile://') || img.startsWith('http://tmp/') || img.startsWith('https://tmp/'));
        if (localFiles.length > 0) {
          uploadedImages = [];
          for (const image of images) {
            if (image.startsWith('wxfile://') || image.startsWith('http://tmp/') || image.startsWith('https://tmp/')) {
              try {
                const uploadResult = await this.uploadImage(image);
                if (uploadResult && uploadResult.url) {
                  uploadedImages.push(uploadResult.url);
                } else if (uploadResult && typeof uploadResult === 'string') {
                  uploadedImages.push(uploadResult);
                }
              } catch (error) {
                console.error('上传图片失败:', error);
              }
            } else {
              // 已经是URL，直接使用
              uploadedImages.push(image);
            }
          }
        }
      }

      const response = await orderApi.submitReview({
        orderId,
        userId,
        rating,
        comment: comment.trim(),
        images: uploadedImages
      });

      if (response && response.success) {
        wx.showToast({
          title: '评价成功',
          icon: 'success'
        });

        // 返回订单列表，并刷新数据
        setTimeout(() => {
          wx.navigateBack({
            delta: 1,
            success: () => {
              // 刷新上一个页面（订单列表）
              const pages = getCurrentPages();
              const prevPage = pages[pages.length - 2];
              if (prevPage && prevPage.loadOrders) {
                prevPage.loadOrders();
              }
            }
          });
        }, 1500);
      } else {
        throw new Error(response?.message || '提交失败');
      }
    } catch (error) {
      console.error('提交评价失败:', error);
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  /**
   * 上传单张图片
   */
  uploadImage(filePath) {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token') || '';
      const app = getApp();
      const baseUrl = app.globalData.apiUrl || app.globalData.baseUrl;

      wx.uploadFile({
        url: `${getMpApiBaseUrl()}/upload/image`,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.success && data.data) {
              resolve(data.data);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch (error) {
            reject(error);
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  /**
   * 获取订单类型文本
   */
  getOrderTypeText(type) {
    if (type === 'repair') return '维修';
    if (type === 'recycle') return '回收';
    return type || '未知类型';
  },

  /**
   * 获取设备类型文本
   */
  getDeviceTypeText(deviceType) {
    const deviceTypes = {
      1: '手机',
      2: '电脑',
      3: '平板',
      4: '手表',
      5: '耳机',
      6: '相机',
      7: '游戏机',
      8: '其他'
    };
    return deviceTypes[deviceType] || `类型${deviceType}`;
  },

  /**
   * 格式化时间
   */
  formatTime(timestamp) {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return String(timestamp);
      const pad = n => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } catch (e) {
      return String(timestamp);
    }
  },

  /**
   * 返回
   */
  goBack() {
    wx.navigateBack();
  }
});