const { normalizeMediaUrl } = require('../../utils/mediaUrl.js');

Page({
  data: {
    videoUrl: ''
  },

  onLoad(options) {
    const url = normalizeMediaUrl(decodeURIComponent(options.url || ''));
    this.setData({ videoUrl: url });
  }
});
