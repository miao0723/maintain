// pages/order-review/order-review.js
const { orderApi } = require('../../utils/api.js');
const { getMpApiBaseUrl } = require('../../utils/mpApi.js');

Page({
  data: {
    orderId: '',
    orderInfo: null,
    rating: 5,
    comment: '',
    selectedImages: [],
    maxImages: 3,
    ratingStars: [1, 2, 3, 4, 5],
    starSize: 60,
    starColor: '#e0e0e0',
    activeStarColor: '#ff4757',
    isSubmitting: false,
    isLoading: true
  },

  onLoad(options) {
    console.log('========== 评价页面加载 ==========');
    console.log('接收到的参数:', options);

    const orderId = options.orderId;
    if (!orderId) {
      console.log('✗ 缺少订单ID');
      wx.showToast({
        title: '订单不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      console.log('===================================\n');
      return;
    }

    this.setData({ orderId: orderId });

    // 先尝试从API加载真实订单数据
    this.loadOrderDetail(orderId, options);
  },

  /**
   * 从API加载订单详情，options中的参数作为备选
   */
  async loadOrderDetail(orderId, options) {
    try {
      const response = await orderApi.getOrderDetail(orderId);

      if (response && response.success && response.data) {
        const rawOrder = response.data.order || response.data;

        // 价格处理：优先使用 actual_price > quote_price > estimated_price
        let price = rawOrder.actual_price || rawOrder.quote_price || rawOrder.estimated_price || '';
        if (price) {
          price = parseFloat(price).toFixed(2);
        }

        const orderInfo = {
          orderId: rawOrder.order_no || rawOrder.order_id || orderId,
          orderType: rawOrder.order_type || options.orderType || 'repair',
          deviceType: rawOrder.device_type || parseInt(options.deviceType) || 1,
          deviceTypeRaw: rawOrder.device_type || parseInt(options.deviceType) || 1,
          deviceModel: rawOrder.device_model || '未知型号',
          brandName: rawOrder.brand_name || rawOrder.brandName || '',
          price: price,
          hasPrice: !!price,
          estimatedPrice: rawOrder.estimated_price || '',
          actualPrice: rawOrder.actual_price || '',
          quotePrice: rawOrder.quote_price || '',
          problemDescription: rawOrder.problem_description || decodeURIComponent(options.problemDescription || '') || '暂无描述',
          customDescription: rawOrder.custom_description || '',
          createdAt: this.formatTime(rawOrder.created_at || rawOrder.createdAt),
          serviceType: rawOrder.service_type || rawOrder.serviceType || '',
          serviceTypeText: rawOrder.service_type === 'shop' ? '到店维修' : rawOrder.service_type === 'home' ? '上门服务' : ''
        };

        this.setData({
          orderInfo: orderInfo,
          isLoading: false
        });
        console.log('✓ 从API加载订单数据成功:', orderInfo);
      } else {
        // API加载失败，使用URL参数中的data
        this.loadFromOptions(options);
      }
    } catch (error) {
      console.warn('API加载失败，使用参数中的数据:', error.message);
      this.loadFromOptions(options);
    }
  },

  /**
   * 从URL参数加载订单数据（备选方案）
   */
  loadFromOptions(options) {
    const price = parseFloat(options.price) || '';
    const orderInfo = {
      orderId: options.orderId,
      orderType: options.orderType || 'repair',
      deviceType: parseInt(options.deviceType) || 1,
      price: price ? parseFloat(price).toFixed(2) : '',
      hasPrice: !!price,
      problemDescription: decodeURIComponent(options.problemDescription || '') || '暂无描述'
    };

    this.setData({
      orderInfo: orderInfo,
      isLoading: false
    });
    console.log('使用参数中的订单数据:', orderInfo);
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
   * 获取设备类型名称
   */
  getDeviceTypeName(deviceType) {
    const names = { 1: '手机', 2: '电脑', 3: '平板', 4: '手表', 5: '耳机', 6: '相机', 7: '游戏机' };
    return names[deviceType] || `设备(${deviceType})`;
  },

  /**
   * 选择评分
   */
  selectRating(e) {
    const rating = e.currentTarget.dataset.rating;
    this.setData({
      rating: rating
    });
    console.log('选择评分:', rating);
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
    const remaining = this.data.maxImages - this.data.selectedImages.length;
    if (remaining <= 0) {
      wx.showToast({
        title: `最多上传${this.data.maxImages}张图片`,
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
          selectedImages: [...this.data.selectedImages, ...tempFiles]
        });
      }
    });
  },

  /**
   * 删除图片
   */
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const selectedImages = [...this.data.selectedImages];
    selectedImages.splice(index, 1);
    this.setData({
      selectedImages: selectedImages
    });
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.selectedImages[index],
      urls: this.data.selectedImages
    });
  },

  /**
   * 提交评价
   */
  async submitReview() {
    console.log('========== 开始提交评价 ==========');

    // 验证评分
    if (!this.data.rating || this.data.rating < 1 || this.data.rating > 5) {
      console.log('✗ 评分验证失败');
      wx.showToast({
        title: '请选择评分',
        icon: 'none'
      });
      console.log('===================================\n');
      return;
    }

    // 验证评价内容
    if (!this.data.comment || this.data.comment.trim().length === 0) {
      console.log('✗ 评价内容为空');
      wx.showToast({
        title: '请输入评价内容',
        icon: 'none'
      });
      console.log('===================================\n');
      return;
    }

    if (this.data.comment.trim().length < 5) {
      console.log('✗ 评价内容太短');
      wx.showToast({
        title: '评价内容至少5个字',
        icon: 'none'
      });
      console.log('===================================\n');
      return;
    }

    console.log('✓ 验证通过');
    console.log('1. 评分:', this.data.rating);
    console.log('2. 评价内容:', this.data.comment);
    console.log('3. 图片数量:', this.data.selectedImages.length);

    this.setData({ isSubmitting: true });

    try {
      // 获取用户信息
      const userInfo = wx.getStorageSync('userInfo');
      const userId = userInfo?.id || 4;
      console.log('4. 用户信息:', userInfo);
      console.log('5. 使用userId:', userId, '(类型:', typeof userId, ')');

      // 构建评价数据
      const reviewData = {
        orderId: this.data.orderId,
        userId: userId,
        rating: this.data.rating,
        comment: this.data.comment,
        images: this.data.selectedImages
      };

      console.log('6. 提交的数据:', JSON.stringify(reviewData, null, 2));
      console.log('===================================\n');

      // 上传图片(如果有)
      if (this.data.selectedImages.length > 0) {
        const uploadedImages = [];
        for (const image of this.data.selectedImages) {
          try {
            const uploadResult = await this.uploadImage(image);
            if (uploadResult && uploadResult.url) {
              uploadedImages.push(uploadResult.url);
            }
          } catch (error) {
            console.error('上传图片失败:', error);
          }
        }
        reviewData.images = uploadedImages;
      }

      // 提交评价
      const response = await orderApi.submitReview(reviewData);

      if (response && response.success) {
        wx.showToast({
          title: '评价成功',
          icon: 'success'
        });

        // 延迟返回
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        throw new Error(response?.message || '评价失败');
      }
    } catch (error) {
      console.error('提交评价失败:', error);
      wx.showToast({
        title: error.message || '评价失败',
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
      const baseUrl = app.globalData.baseUrl || app.globalData.apiUrl;

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
   * 返回
   */
  goBack() {
    wx.navigateBack();
  }
});
