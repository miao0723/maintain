Page({
  data: {
    videoUrl: ''
  },

  onLoad(options) {
    const url = decodeURIComponent(options.url || '');
    this.setData({ videoUrl: url });
  }
});
