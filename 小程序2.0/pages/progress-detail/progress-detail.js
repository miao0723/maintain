const app = getApp();
const { normalizeMediaUrl } = require('../../utils/mediaUrl.js');

Page({
  data: {
    feedback: null,
    loading: true
  },

  onLoad(options) {
    // 从页面参数中读取反馈数据
    if (options.data) {
      try {
        const feedback = JSON.parse(decodeURIComponent(options.data));
        // 进度照片 / 视频地址后端返回的是相对路径 /uploads/...，
        // 小程序必须用完整 HTTPS 地址才能加载。这里统一归一化，
        // 无论上游是否拼过域名都安全（幂等）。
        const photos = (Array.isArray(feedback.photos) ? feedback.photos : []).map(normalizeMediaUrl);
        feedback.photos = photos;
        feedback.displayPhotos = [...photos];
        if (feedback.video) {
          feedback.video.video_url = normalizeMediaUrl(feedback.video.video_url || '');
          feedback.video.cover_url = normalizeMediaUrl(feedback.video.cover_url || '');
        }
        this.setData({
          feedback: feedback,
          loading: false
        });
        this.preloadPhotos(feedback.photos || []);
        wx.setNavigationBarTitle({ title: feedback.formatted_time || '反馈详情' });
      } catch (e) {
        console.error('解析反馈数据失败:', e);
        wx.showToast({ title: '数据加载失败', icon: 'none' });
        this.setData({ loading: false });
      }
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  /**
   * 预览照片
   */
  previewPhoto(e) {
    const url = e.currentTarget.dataset.url;
    const photos = this.data.feedback.photos || [];
    wx.previewImage({
      urls: photos,
      current: url
    });
  },

  preloadPhotos(photos = []) {
    photos.forEach((url, index) => {
      if (!url) return;
      wx.getImageInfo({
        src: url,
        success: (res) => {
          this.setData({
            [`feedback.displayPhotos[${index}]`]: res.path || url
          });
        },
        fail: () => {
          this.setData({
            [`feedback.displayPhotos[${index}]`]: url
          });
        }
      });
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
   * 格式化时长
   */
  formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0s';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  }
});
