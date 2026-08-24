const app = getApp();
const { getProgressStamp, syncProgressUnreadState } = require('../../utils/progressUnread.js');
const { getMpApiBaseUrl } = require('../../utils/mpApi.js');
const { normalizeMediaUrl } = require('../../utils/mediaUrl.js');

Page({
  data: {
    orderId: null,
    orderInfo: null,
    token: null,

    // 进度
    progress: 50,

    // 描述
    description: '',

    // 图片 - 使用本地临时路径预览，提交时才上传
    localImages: [],      // 本地临时路径，用于预览
    uploadedImages: [],   // 已上传的服务器URL
    maxImages: 9,

    // 视频 - 使用本地临时路径预览，提交时才上传
    localVideo: null,     // 本地临时路径，用于预览
    uploadedVideo: null,  // 已上传的服务器URL
    videoTitle: '',
    localVideoCover: '',  // 截取的视频第一帧封面（本地临时路径），提交时随视频一起上传

    // 只读模式（用户查看进度时使用）
    readonly: false,

    // 来源页面
    from: '',

    // 只读模式下自动打开最新未读反馈
    focusLatestFeedback: false,
    autoOpenedLatestFeedback: false,

    // 加载状态
    loading: false,
    uploading: false,

    // 历史记录
    history: [],
    historyLoaded: false
  },

  onLoad(options) {
    const orderId = options.orderId || options.id;
    const readonly = options.readonly === 'true';
    const from = options.from || '';
    const focusLatestFeedback = options.focusLatestFeedback === 'true';
    // 兼容普通用户token和管理员token
    const token = wx.getStorageSync('token') || wx.getStorageSync('admin_token');
    const userInfo = wx.getStorageSync('userInfo') || wx.getStorageSync('admin_info');

    if (!token || !userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/login/login' });
      }, 1500);
      return;
    }

    if (!orderId) {
      wx.showToast({ title: '订单ID无效', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    console.log('[进度反馈] orderId:', orderId, '用户角色:', userInfo.role, '只读模式:', readonly, '来源:', from);

    this.setData({
      orderId: orderId,
      token: token,
      readonly: readonly,
      from: from,
      focusLatestFeedback: focusLatestFeedback
    });

    // 只读模式下修改导航栏标题
    if (readonly) {
      wx.setNavigationBarTitle({ title: '维修进度' });
    }

    this.loadOrderInfo();
    this.loadHistory();
  },

  /**
   * 加载订单信息
   */
  loadOrderInfo() {
    wx.request({
      url: `${getMpApiBaseUrl()}/orders/${this.data.orderId}/detail`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${this.data.token}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('[进度反馈] loadOrderInfo 响应:', res.statusCode, res.data);

        if (res.statusCode === 200 && res.data && res.data.data && res.data.data.order) {
          const order = res.data.data.order;
          const hadUnread = Number(order.progress_unread) === 1;
          this.setData({
            orderInfo: order,
            progress: order.progress || 0
          });
          if (this.data.readonly && hadUnread) {
            this.markProgressRead();
          }
        } else {
          const errorMsg = (res.data && res.data.error) || '获取订单信息失败';
          console.error('[进度反馈] loadOrderInfo 失败:', res.statusCode, res.data);
          wx.showToast({ title: errorMsg, icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('[进度反馈] loadOrderInfo 请求失败:', err);
        wx.showToast({ title: '网络异常，请检查网络连接', icon: 'none' });
      }
    });
  },

  /**
   * 跳转到发起进度申请页面（用户在无进度记录时引导发起申请）
   */
  goToApplyProgress() {
    const orderId = this.data.orderId;
    if (!orderId) {
      wx.showToast({ title: '订单信息异常', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/progress-apply-create/progress-apply-create?orderId=${orderId}`
    });
  },

  markProgressRead() {
    if (!this.data.token || !this.data.orderId) return;
    if (Number(this.data.orderInfo?.progress_unread) !== 1) return;
    wx.request({
      url: `${getMpApiBaseUrl()}/orders/${this.data.orderId}/progress-read`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${this.data.token}`,
        'Content-Type': 'application/json'
      },
      success: () => {
        syncProgressUnreadState(this.data.orderId, getProgressStamp(this.data.orderInfo || {}), { wasUnread: true });
      }
    });
  },

  /**
   * 加载历史记录（使用分组API，失败时回退到旧API）
   */
  loadHistory() {
    wx.request({
      url: `${getMpApiBaseUrl()}/progress/feedbacks/${this.data.orderId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${this.data.token}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('[进度反馈] loadHistory 响应:', res.statusCode, res.data);
        if (res.statusCode === 200 && res.data && res.data.success && res.data.data) {
          const feedbacks = res.data.data.map(fb => {
            // 处理照片URL
            const photos = (fb.photos || []).map(img => normalizeMediaUrl(img)).filter(img => img);

            // 处理视频URL
            let video = null;
            if (fb.video) {
              const videoUrl = normalizeMediaUrl(fb.video.video_url || '');
              const coverUrl = normalizeMediaUrl(fb.video.cover_url || '');
              video = {
                video_url: videoUrl,
                video_title: fb.video.video_title || '',
                cover_url: coverUrl,
                duration: fb.video.duration || 0
              };
            }

            return {
              id: fb.feedback_group_id,
              feedback_group_id: fb.feedback_group_id,
              description: fb.description || '',
              photos: photos,
              displayPhotos: [...photos],
              video: video,
              uploaded_by_name: fb.uploaded_by_name || '维修人员',
              created_at: fb.created_at,
              formatted_time: this.formatTimeFriendly(fb.created_at),
              photo_count: photos.length,
              has_video: !!video
            };
          });

          this.setData({
            history: feedbacks,
            historyLoaded: true
          });
          this.preloadHistoryPhotos(feedbacks);
          this.autoOpenLatestFeedbackIfNeeded(feedbacks);
        } else {
          // feedbacks API失败，回退到旧API
          console.log('[进度反馈] feedbacks API不可用，回退到旧API');
          this.loadHistoryFallback();
        }
      },
      fail: (err) => {
        console.error('加载历史记录失败:', err);
        // 网络失败也尝试回退
        this.loadHistoryFallback();
      }
    });
  },

  /**
   * 旧版加载历史记录（分别获取照片和视频）
   */
  loadHistoryFallback() {
    const token = this.data.token;
    const orderId = this.data.orderId;

    let photosData = [];
    let videosData = [];

    const processResults = () => {
      const groupMap = new Map();

      // 处理照片
      photosData.forEach(photo => {
        const groupId = photo.feedback_group_id || `photo_${photo.id}`;
        if (!groupMap.has(groupId)) {
          let images = photo.images || [];
          if (typeof images === 'string') {
            try { images = JSON.parse(images); } catch (e) { images = []; }
          }
          if (!Array.isArray(images)) images = [];
          images = images.map(img => normalizeMediaUrl(img)).filter(img => img);

          groupMap.set(groupId, {
            id: groupId,
            feedback_group_id: groupId,
            description: photo.description || '',
            photos: images,
            displayPhotos: [...images],
            video: null,
            uploaded_by_name: photo.uploaded_by_name || '维修人员',
            created_at: photo.created_at,
            formatted_time: this.formatTimeFriendly(photo.created_at),
            photo_count: images.length,
            has_video: false
          });
        } else {
          // 合并同组的图片
          let images = photo.images || [];
          if (typeof images === 'string') {
            try { images = JSON.parse(images); } catch (e) { images = []; }
          }
          if (!Array.isArray(images)) images = [];
          images = images.map(img => normalizeMediaUrl(img)).filter(img => img);
          const group = groupMap.get(groupId);
          group.photos = group.photos.concat(images);
          group.displayPhotos = group.photos.slice();
          group.photo_count = group.photos.length;
        }
      });

      // 处理视频
      videosData.forEach(video => {
        const groupId = video.feedback_group_id || `video_${video.id}`;
        let videoUrl = normalizeMediaUrl(video.video_url || '');
        let coverUrl = normalizeMediaUrl(video.cover_url || video.cover || '');

        const videoInfo = {
          video_url: videoUrl,
          video_title: video.video_title || '',
          cover_url: coverUrl,
          duration: video.duration || 0
        };

        if (groupMap.has(groupId)) {
          groupMap.get(groupId).video = videoInfo;
          groupMap.get(groupId).has_video = true;
        } else {
          groupMap.set(groupId, {
            id: groupId,
            feedback_group_id: groupId,
            description: video.description || '',
            photos: [],
            displayPhotos: [],
            video: videoInfo,
            uploaded_by_name: video.uploaded_by_name || '维修人员',
            created_at: video.created_at,
            formatted_time: this.formatTimeFriendly(video.created_at),
            photo_count: 0,
            has_video: true
          });
        }
      });

      const feedbacks = Array.from(groupMap.values());
      feedbacks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      this.setData({
        history: feedbacks,
        historyLoaded: true
      });
      this.preloadHistoryPhotos(feedbacks);
      this.autoOpenLatestFeedbackIfNeeded(feedbacks);
    };

    // 并行请求照片和视频
    let photosLoaded = false;
    let videosLoaded = false;

    wx.request({
      url: `${getMpApiBaseUrl()}/progress/photos/${orderId}`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.data) {
          photosData = res.data.data;
        }
      },
      fail: () => {},
      complete: () => {
        photosLoaded = true;
        if (photosLoaded && videosLoaded) processResults();
      }
    });

    wx.request({
      url: `${getMpApiBaseUrl()}/progress/videos/${orderId}`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.data) {
          videosData = res.data.data;
        }
      },
      fail: () => {},
      complete: () => {
        videosLoaded = true;
        if (photosLoaded && videosLoaded) processResults();
      }
    });
  },

  /**
   * 进度滑块变化
   */
  onProgressChange(e) {
    this.setData({ progress: e.detail.value });
  },

  /**
   * 选择快速进度
   */
  selectQuickProgress(e) {
    const progress = parseInt(e.currentTarget.dataset.progress);
    this.setData({ progress });
  },

  /**
   * 描述输入
   */
  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  /**
   * 拍照 - 只保存本地路径，不上传
   */
  chooseImageCamera() {
    const totalCount = this.data.localImages.length + this.data.uploadedImages.length;
    if (totalCount >= this.data.maxImages) {
      wx.showToast({ title: `最多上传${this.data.maxImages}张图片`, icon: 'none' });
      return;
    }

    const remainCount = this.data.maxImages - totalCount;
    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const files = res.files || res.tempFiles || [];
        const newLocalImages = files.map(file => file.tempFilePath || file.path || file);
        if (newLocalImages.length > 0) {
          this.setData({
            localImages: [...this.data.localImages, ...newLocalImages]
          });
        }
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          console.error('拍照失败:', err);
        }
      }
    });
  },

  /**
   * 从相册选择图片 - 只保存本地路径，不上传
   */
  chooseImageAlbum() {
    const totalCount = this.data.localImages.length + this.data.uploadedImages.length;
    if (totalCount >= this.data.maxImages) {
      wx.showToast({ title: `最多上传${this.data.maxImages}张图片`, icon: 'none' });
      return;
    }

    const remainCount = this.data.maxImages - totalCount;
    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album'],
      sizeType: ['compressed'],
      success: (res) => {
        const files = res.files || res.tempFiles || [];
        const newLocalImages = files.map(file => file.tempFilePath || file.path || file);
        if (newLocalImages.length > 0) {
          this.setData({
            localImages: [...this.data.localImages, ...newLocalImages]
          });
        }
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          console.error('选择图片失败:', err);
        }
      }
    });
  },

  /**
   * 删除本地图片
   */
  deleteLocalImage(e) {
    const index = e.currentTarget.dataset.index;
    const localImages = this.data.localImages;
    localImages.splice(index, 1);
    this.setData({ localImages });
  },

  /**
   * 删除已上传图片
   */
  deleteUploadedImage(e) {
    const index = e.currentTarget.dataset.index;
    const uploadedImages = this.data.uploadedImages;
    uploadedImages.splice(index, 1);
    this.setData({ uploadedImages });
  },

  /**
   * 拍摄视频 - 只保存本地路径，不上传
   */
  chooseVideoCamera() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['camera'],
      maxDuration: 60,
      camera: 'back',
      success: (res) => {
        const files = res.files || res.tempFiles || [];
        if (files.length > 0) {
          const videoFile = files[0];
          const tempFilePath = videoFile.tempFilePath || videoFile.path;
          this.setData({
            localVideo: tempFilePath,
            videoTitle: this.data.videoTitle || '维修视频 ' + new Date().toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          });
        }
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          console.error('拍摄视频失败:', err);
        }
      }
    });
  },

  /**
   * 从相册选择视频 - 只保存本地路径，不上传
   */
  chooseVideoAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album'],
      maxDuration: 60,
      camera: 'back',
      success: (res) => {
        const files = res.files || res.tempFiles || [];
        if (files.length > 0) {
          const videoFile = files[0];
          const tempFilePath = videoFile.tempFilePath || videoFile.path;
          this.setData({
            localVideo: tempFilePath,
            videoTitle: this.data.videoTitle || '维修视频 ' + new Date().toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          });
        }
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          console.error('选择视频失败:', err);
        }
      }
    });
  },

  /**
   * 删除本地视频
   */
  deleteVideo() {
    this.setData({
      localVideo: null,
      uploadedVideo: null,
      videoTitle: '',
      localVideoCover: ''
    });
  },

  /**
   * 视频标题输入
   */
  onVideoTitleInput(e) {
    this.setData({ videoTitle: e.detail.value });
  },

  /**
   * 生成反馈组ID
   */
  generateFeedbackGroupId() {
    return 'fb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * 上传单张图片到服务器
   */
  uploadSingleImage(filePath, feedbackGroupId) {
    return new Promise((resolve) => {
      wx.uploadFile({
        url: `${getMpApiBaseUrl()}/progress/photos/upload`,
        filePath: filePath,
        name: 'images',
        formData: {
          order_id: String(this.data.orderId),
          description: this.data.description || '',
          feedback_group_id: feedbackGroupId || ''
        },
        header: {
          'Authorization': `Bearer ${this.data.token}`
        },
        success: (res) => {
          console.log('[进度反馈] 上传图片响应:', res.statusCode);
          try {
            const data = JSON.parse(res.data);
            if (data.success && data.data && data.data.photos && data.data.photos.length > 0) {
              const relativePath = data.data.photos[0];
              const fullUrl = normalizeMediaUrl(relativePath);
              resolve({ success: true, url: fullUrl, relativePath: relativePath });
            } else {
              console.error('[进度反馈] 上传图片返回失败:', data);
              resolve({ success: false, error: data.error || '上传图片失败' });
            }
          } catch (e) {
            console.error('[进度反馈] 解析图片上传响应失败:', e);
            resolve({ success: false, error: '服务器响应格式错误' });
          }
        },
        fail: (err) => {
          console.error('[进度反馈] 上传图片网络失败:', err);
          resolve({ success: false, error: '网络异常，上传失败' });
        }
      });
    });
  },

  /**
   * 截取视频第一帧作为封面（本地临时路径）
   * 复用页面里已经加载了元数据的预览 <video id="captureVideo">，
   * 等到可绘制时 seek 到 0.1s（0s 处部分视频为黑帧），把画面绘制到隐藏 canvas 2d 再导出。
   * 任何一步失败都静默降级为无封面（resolve('')），不影响视频上传。
   * @param {string} videoPath 本地视频路径
   * @returns {Promise<string>} 封面临时文件路径，失败返回 ''
   */
  captureVideoCover(videoPath) {
    return new Promise((resolve) => {
      let settled = false;
      let failSafe = null;
      const finish = (val) => {
        if (settled) return;
        settled = true;
        if (failSafe) clearTimeout(failSafe);
        resolve(val || '');
      };
      failSafe = setTimeout(() => finish(''), 8000); // 8s 总超时兜底

      if (!videoPath) { finish(''); return; }

      try {
        const q = wx.createSelectorQuery().in(this);
        q.select('#captureVideo').fields({ node: true, size: true }).exec((vRes) => {
          const videoNode = vRes && vRes[0] && vRes[0].node;
          if (!videoNode) { finish(''); return; }
          q.select('#captureCanvas').fields({ node: true, size: true }).exec((cRes) => {
            const canvas = cRes && cRes[0] && cRes[0].node;
            if (!canvas) { finish(''); return; }

            const cw = (cRes[0] && cRes[0].width) || 320;
            const ch = (cRes[0] && cRes[0].height) || 180;
            try {
              canvas.width = cw;
              canvas.height = ch;
            } catch (e) {}
            const ctx = canvas.getContext('2d');

            let drawn = false;
            const drawAndFinish = () => {
              if (drawn) return;
              drawn = true;
              try {
                ctx.drawImage(videoNode, 0, 0, cw, ch);
                wx.canvasToTempFilePath({
                  canvas: canvas, // type=2d 画布传节点
                  x: 0, y: 0,
                  width: cw, height: ch,
                  destWidth: cw, destHeight: ch,
                  success: (res) => finish(res.tempFilePath),
                  fail: () => finish('')
                }, this);
              } catch (e) {
                finish('');
              }
            };

            const onMetadataReady = () => {
              try {
                // 元数据已就绪：seek 到 0.1s 取第一帧（0s 部分视频为黑帧）
                if (videoNode.currentTime > 0.15 || videoNode.currentTime === 0) {
                  videoNode.currentTime = 0.1;
                }
                videoNode.addEventListener('seeked', drawAndFinish);
                videoNode.addEventListener('timeupdate', drawAndFinish);
                // 兜底：seek 事件不触发时，最多等 1.5s 后直接绘制当前帧
                setTimeout(drawAndFinish, 1500);
              } catch (e) {
                finish('');
              }
            };

            if (videoNode.readyState >= 1) {
              // 元数据已加载（预览阶段通常已加载），直接截取
              onMetadataReady();
            } else {
              // 等待元数据加载完成后再截取，避免截到黑屏
              videoNode.addEventListener('loadedmetadata', onMetadataReady);
              try { videoNode.currentTime = 0.1; } catch (e) {}
              // 某些平台不触发 loadedmetadata，做一次超时重试
              setTimeout(onMetadataReady, 2000);
            }

            // 部分环境需要 play 才会解码出帧；muted 视频可自动播放
            try {
              if (videoNode.paused && videoNode.play) {
                const p = videoNode.play();
                if (p && p.catch) p.catch(() => {});
              }
            } catch (e) {}
          });
        });
      } catch (e) {
        finish('');
      }
    });
  },

  /**
   * 把截取的封面图片上传到服务器，返回封面相对路径（失败返回 ''）
   */
  uploadCoverImage(coverPath) {
    return new Promise((resolve) => {
      if (!coverPath) { resolve(''); return; }
      wx.uploadFile({
        url: `${getMpApiBaseUrl()}/progress/videos/cover`,
        filePath: coverPath,
        name: 'cover',
        formData: {
          order_id: String(this.data.orderId)
        },
        header: {
          'Authorization': `Bearer ${this.data.token}`
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.success && data.data) {
              resolve(data.data.url || data.data.cover_url || '');
            } else {
              console.warn('[进度反馈] 封面上传返回失败:', data);
              resolve('');
            }
          } catch (e) {
            console.warn('[进度反馈] 解析封面上传响应失败:', e);
            resolve('');
          }
        },
        fail: () => resolve('')
      });
    });
  },

  /**
   * 确保拿到视频封面：无封面则先截帧，再上传，返回封面相对路径（失败返回 ''）
   */
  ensureVideoCover(filePath) {
    const run = (coverPath) => {
      if (!coverPath) return Promise.resolve('');
      this.setData({ localVideoCover: coverPath });
      return this.uploadCoverImage(coverPath);
    };
    if (this.data.localVideoCover) {
      return run(this.data.localVideoCover);
    }
    return this.captureVideoCover(filePath).then(run);
  },

  /**
   * 上传视频到服务器
   * 先截取并上传第一帧封面，再把封面相对路径通过 cover_url 随视频一起提交，避免封面黑屏。
   */
  async uploadVideoFile(filePath, feedbackGroupId) {
    let coverUrl = '';
    try {
      coverUrl = await this.ensureVideoCover(filePath);
    } catch (e) {
      console.warn('[进度反馈] 生成视频封面失败，继续上传视频:', e);
      coverUrl = '';
    }

    return new Promise((resolve) => {
      wx.uploadFile({
        url: `${getMpApiBaseUrl()}/progress/videos/upload`,
        filePath: filePath,
        name: 'video',
        formData: {
          order_id: String(this.data.orderId),
          video_title: this.data.videoTitle || '维修视频',
          feedback_group_id: feedbackGroupId || '',
          cover_url: coverUrl || ''
        },
        header: {
          'Authorization': `Bearer ${this.data.token}`
        },
        success: (res) => {
          console.log('[进度反馈] 上传视频响应:', res.statusCode);
          try {
            const data = JSON.parse(res.data);
            if (data.success && data.data) {
              const videoUrl = data.data.videoUrl || data.data.video_url;
              const fullUrl = normalizeMediaUrl(videoUrl);
              resolve({ success: true, url: fullUrl, relativePath: videoUrl });
            } else {
              console.error('[进度反馈] 上传视频返回失败:', data);
              resolve({ success: false, error: data.error || '上传视频失败' });
            }
          } catch (e) {
            console.error('[进度反馈] 解析视频上传响应失败:', e);
            resolve({ success: false, error: '服务器响应格式错误' });
          }
        },
        fail: (err) => {
          console.error('[进度反馈] 上传视频网络失败:', err);
          resolve({ success: false, error: '网络异常，上传失败' });
        }
      });
    });
  },

  /**
   * 提交进度 - 先上传所有文件，再更新进度
   */
  async submitProgress() {
    const { progress, description, localImages, uploadedImages, localVideo, uploadedVideo } = this.data;
    const videoTitle = this.data.videoTitle || '';

    const hasImages = localImages.length > 0 || uploadedImages.length > 0;
    const hasVideo = localVideo || uploadedVideo;

    // 验证
    if (!progress && progress !== 0) {
      wx.showToast({ title: '请设置进度', icon: 'none' });
      return;
    }

    if (!description && !hasImages && !hasVideo) {
      wx.showToast({ title: '请填写描述或上传图片/视频', icon: 'none' });
      return;
    }

    if ((localVideo || uploadedVideo) && !videoTitle.trim()) {
      wx.showToast({ title: '请输入视频标题', icon: 'none' });
      return;
    }

    this.setData({ uploading: true });
    wx.showLoading({ title: '提交中...', mask: true });

    // 生成本次反馈的组ID
    const feedbackGroupId = this.generateFeedbackGroupId();

    try {
      // 第一步：上传本地图片
      let allImageUrls = [...uploadedImages]; // 已上传的URL
      if (localImages.length > 0) {
        for (let i = 0; i < localImages.length; i++) {
          wx.showLoading({ title: `上传图片 ${i + 1}/${localImages.length}`, mask: true });
          try {
            const result = await this.uploadSingleImage(localImages[i], feedbackGroupId);
            if (result.success) {
              allImageUrls.push(result.url);
            } else {
              console.error(`图片${i + 1}上传失败:`, result.error);
            }
          } catch (imgErr) {
            console.error(`图片${i + 1}上传异常:`, imgErr);
          }
        }
      }

      // 第二步：上传本地视频
      let finalVideoUrl = uploadedVideo;
      if (localVideo) {
        wx.showLoading({ title: '上传视频中...', mask: true });
        try {
          const videoResult = await this.uploadVideoFile(localVideo, feedbackGroupId);
          if (videoResult.success) {
            finalVideoUrl = videoResult.url;
          } else {
            console.error('视频上传失败:', videoResult.error);
            wx.hideLoading();
            this.setData({ uploading: false });
            wx.showToast({ title: videoResult.error || '视频上传失败', icon: 'none' });
            return;
          }
        } catch (videoErr) {
          console.error('视频上传异常:', videoErr);
          wx.hideLoading();
          this.setData({ uploading: false });
          wx.showToast({ title: '视频上传异常', icon: 'none' });
          return;
        }
      }

      // 第三步：更新订单进度
      wx.showLoading({ title: '更新进度...', mask: true });
      const progressRes = await new Promise((resolve) => {
        wx.request({
          url: `${getMpApiBaseUrl()}/orders/${this.data.orderId}/progress`,
          method: 'PUT',
          header: {
            'Authorization': `Bearer ${this.data.token}`,
            'Content-Type': 'application/json'
          },
          data: { progress: progress },
          success: (res) => resolve(res),
          fail: (err) => resolve({ statusCode: 0, data: { success: false, error: '网络请求失败' } })
        });
      });

      console.log('[进度反馈] submitProgress 响应:', progressRes.statusCode, progressRes.data);

      if (progressRes.statusCode !== 200 || !progressRes.data || !progressRes.data.success) {
        const errorMsg = (progressRes.data && progressRes.data.error) || '更新进度失败';
        console.error('[进度反馈] submitProgress 失败:', progressRes.statusCode, progressRes.data);
        wx.hideLoading();
        this.setData({ uploading: false });
        wx.showToast({ title: errorMsg, icon: 'none' });
        return;
      }

      wx.hideLoading();
      this.setData({ uploading: false });
      wx.showToast({ title: '进度反馈成功', icon: 'success' });

      // 如果从工单管理页面进入，提交后返回工单管理页面
      if (this.data.from === 'admin-orders') {
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        return;
      }

      // 刷新历史记录
      setTimeout(() => {
        this.loadHistory();
        // 清空表单
        this.setData({
          description: '',
          localImages: [],
          uploadedImages: [],
          localVideo: null,
          uploadedVideo: null,
          videoTitle: ''
        });
      }, 1500);

    } catch (error) {
      console.error('提交进度失败:', error);
      wx.hideLoading();
      this.setData({ uploading: false });
      wx.showToast({ title: (error && error.message) || '提交失败', icon: 'none' });
    }
  },

  /**
   * 预览本地图片
   */
  previewLocalImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: this.data.localImages,
      current: url
    });
  },

  /**
   * 预览已上传图片
   */
  previewUploadedImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: this.data.uploadedImages,
      current: url
    });
  },

  /**
   * 查看反馈详情
   */
  viewFeedbackDetail(e) {
    const index = e.currentTarget.dataset.index;
    const feedback = this.data.history[index];
    if (!feedback) return;
    this.openFeedbackDetail(feedback);
  },

  openFeedbackDetail(feedback) {
    if (!feedback) return;
    const encodedData = encodeURIComponent(JSON.stringify(feedback));
    wx.navigateTo({
      url: `/pages/progress-detail/progress-detail?data=${encodedData}`
    });
  },

  autoOpenLatestFeedbackIfNeeded(feedbacks = []) {
    if (!this.data.readonly || !this.data.focusLatestFeedback || this.data.autoOpenedLatestFeedback) {
      return;
    }
    if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
      return;
    }

    this.setData({ autoOpenedLatestFeedback: true });
    this.openFeedbackDetail(feedbacks[0]);
  },

  preloadHistoryPhotos(feedbacks = []) {
    feedbacks.forEach((item, feedbackIndex) => {
      (item.photos || []).forEach((url, photoIndex) => {
        if (!url) return;
        wx.getImageInfo({
          src: url,
          success: (res) => {
            this.setData({
              [`history[${feedbackIndex}].displayPhotos[${photoIndex}]`]: res.path || url
            });
          },
          fail: () => {
            this.setData({
              [`history[${feedbackIndex}].displayPhotos[${photoIndex}]`]: url
            });
          }
        });
      });
    });
  },

  /**
   * 预览历史图片合集
   */
  previewHistoryPhotos(e) {
    const images = e.currentTarget.dataset.images;
    const current = e.currentTarget.dataset.current || (images && images[0]);
    if (!images || images.length === 0) return;
    wx.previewImage({
      urls: images,
      current: current
    });
  },

  /**
   * 播放视频
   */
  playVideo(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({ title: '视频地址无效', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/video-player/video-player?url=${encodeURIComponent(url)}`
    });
  },

  /**
   * 播放历史视频
   */
  playHistoryVideo(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({ title: '视频地址无效', icon: 'none' });
      return;
    }

    const normalizedUrl = normalizeMediaUrl(url);

    if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
      wx.navigateTo({
        url: `/pages/video-player/video-player?url=${encodeURIComponent(normalizedUrl)}`
      });
    } else {
      wx.showLoading({ title: '加载中...' });
      wx.downloadFile({
        url: normalizedUrl,
        success: (res) => {
          wx.hideLoading();
          if (res.statusCode === 200) {
            wx.navigateTo({
              url: `/pages/video-player/video-player?url=${encodeURIComponent(res.tempFilePath)}`
            });
          } else {
            wx.showToast({ title: '视频下载失败', icon: 'none' });
          }
        },
        fail: () => {
          wx.hideLoading();
          wx.showToast({ title: '视频加载失败', icon: 'none' });
        }
      });
    }
  },

  /**
   * 格式化时间
   */
  formatTime(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const pad = n => String(n).padStart(2, '0');
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hour = pad(d.getHours());
      const minute = pad(d.getMinutes());
      return `${d.getFullYear()}-${month}-${day} ${hour}:${minute}`;
    } catch (e) {
      return dateStr;
    }
  },

  /**
   * 格式化时间为更友好的显示
   */
  formatTimeFriendly(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const pad = n => String(n).padStart(2, '0');
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const diffDays = Math.floor((today - target) / (24 * 60 * 60 * 1000));

      const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

      if (diffDays === 0) {
        return `今天 ${timeStr}`;
      } else if (diffDays === 1) {
        return `昨天 ${timeStr}`;
      } else if (diffDays < 7) {
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `${weekDays[d.getDay()]} ${timeStr}`;
      } else {
        return `${d.getMonth() + 1}月${d.getDate()}日 ${timeStr}`;
      }
    } catch (e) {
      return dateStr;
    }
  },

  /**
   * 格式化视频时长
   */
  formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${secs}s`;
    }
  }
});
