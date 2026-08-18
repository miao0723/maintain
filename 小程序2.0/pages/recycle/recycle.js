// pages/recycle/recycle.js
const { categories } = require('../../utils/recycleData.js');

const CATEGORY_VISUALS = {
  phone:    { icon: '📱', scene: '双摄旗舰', badge: '手机', imageUrl: '/pages/recycle/images/phone.webp' },
  computer: { icon: '💻', scene: '轻薄性能', badge: '电脑', imageUrl: '/pages/recycle/images/computer.webp' },
  tablet:   { icon: '📟', scene: '大屏便携', badge: '平板', imageUrl: '/pages/recycle/images/tablet.webp' },
  wearable: { icon: '⌚', scene: '腕上智能', badge: '穿戴', imageUrl: '/pages/recycle/images/wearable.webp' },
  display:  { icon: '🖥️', scene: '高清大屏', badge: '显示器', imageUrl: '/pages/recycle/images/display.webp' },
  home:     { icon: '🎧', scene: '生活设备', badge: '数码', imageUrl: '/pages/recycle/images/home.webp' },
  camera:   { icon: '📷', scene: '影像器材', badge: '相机', imageUrl: '/pages/recycle/images/camera.webp' },
  gaming:   { icon: '🎮', scene: '娱乐主机', badge: '游戏', imageUrl: '/pages/recycle/images/gaming.webp' },
  drone:    { icon: '🚁', scene: '航拍飞行', badge: '无人机', imageUrl: '/pages/recycle/images/drone.webp' },
  server:   { icon: '🖥️', scene: '企业算力', badge: '服务器', imageUrl: '/pages/recycle/images/server.webp' },
  network:  { icon: '📡', scene: '网络互联', badge: '网络设备', imageUrl: '/pages/recycle/images/network.webp' },
  gpu:      { icon: '🎛️', scene: '图形算力', badge: '显卡', imageUrl: '/pages/recycle/images/gpu.webp' }
};

function getCategoryVisual(category) {
  return CATEGORY_VISUALS[category.id] || {
    icon: category.icon || '📦',
    scene: category.name.replace('回收', ''),
    badge: '精选'
  };
}

function buildModelVisual(model, category) {
  const visual = getCategoryVisual(category);
  const specsText = model.specs || '';
  const specs = specsText.split('·').map(item => item.trim()).filter(Boolean);
  const familyLabel = (model.name || '')
    .replace(/\s+/g, ' ')
    .split(' ')
    .slice(0, 2)
    .join(' ')
    .slice(0, 18);

  return {
    ...model,
    specs,
    specsText,
    visualIcon: visual.icon,
    visualImageUrl: visual.imageUrl,
    visualScene: visual.scene,
    visualBadge: visual.badge,
    familyLabel: familyLabel || model.name,
    heroTone: model.color || category.color || '#5b9e8a'
  };
}

Page({
  data: {
    categories: [],
    currentCategory: null,
    currentCategoryIndex: 0,
    selectedBrandIndex: -1,
    scrollToBrand: '',

    // ===== 搜索相关 =====
    searchKeyword: '',        // 输入框文本
    searchResults: [],        // 搜索结果列表
    searchHistory: [],        // 搜索历史
    showSearchPanel: false    // 是否显示搜索面板
  },

  onLoad() {
    // 处理分类数据，只保留必要的字段
    const processedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      visual: getCategoryVisual(cat),
      brands: cat.brands.map(brand => ({
        id: brand.id,
        name: brand.name,
        logo: brand.logo,
        logoText: brand.logoText || brand.name.substring(0, 1),
        logoColor: brand.logoColor || '#666',
        models: brand.models.map(model => {
          const visualModel = buildModelVisual({
            id: model.id,
            name: model.name,
            specs: model.specs,
            price: model.basePrice,
            color: model.color,
            bgColor: model.color || '#5b9e8a'
          }, cat);
          return visualModel;
        })
      }))
    }));

    // 构建全局搜索索引（扁平化所有型号，附带分类/品牌信息）
    const searchIndex = [];
    categories.forEach(cat => {
      cat.brands.forEach(brand => {
        brand.models.forEach(model => {
          searchIndex.push({
            modelId: model.id,
            modelName: model.name,
            modelSpecs: model.specs,
            modelPrice: model.basePrice,
            modelColor: model.color,
            modelBgColor: model.color || '#5b9e8a',
            modelVisualIcon: getCategoryVisual(cat).icon,
            modelVisualImageUrl: getCategoryVisual(cat).imageUrl,
            modelVisualScene: getCategoryVisual(cat).scene,
            modelVisualBadge: getCategoryVisual(cat).badge,
            modelFamilyLabel: (model.name || '').split(' ').slice(0, 2).join(' '),
            brandId: brand.id,
            brandName: brand.name,
            brandLogoText: brand.logoText || brand.name.substring(0, 1),
            brandLogoColor: brand.logoColor || '#666',
            categoryId: cat.id,
            categoryName: cat.name,
            categoryIcon: cat.icon
          });
        });
      });
    });

    // 读取搜索历史
    const history = wx.getStorageSync('recycle_search_history') || [];

    this.setData({
      categories: processedCategories,
      currentCategory: processedCategories[0],
      currentCategoryIndex: 0,
      searchIndex,
      searchHistory: history
    });
  },

  /**
   * 分类图标加载失败时，显示 emoji 兜底
   */
  onCategoryImgError(e) {
    const index = e.currentTarget.dataset.index;
    const categories = this.data.categories;
    if (categories && categories[index] && categories[index].visual) {
      const key = `categories[${index}].visual.imageUrl`;
      this.setData({ [key]: '' });
    }
  },

  onCategoryTap(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentCategoryIndex: index,
      currentCategory: this.data.categories[index],
      selectedBrandIndex: -1,
      scrollToBrand: ''
    });
  },

  onBrandTap(e) {
    const brandId = e.currentTarget.dataset.brandId;
    const index = e.currentTarget.dataset.index;
    this.setData({
      selectedBrandIndex: index,
      scrollToBrand: `brand-${brandId}`
    });
    // 延迟滚动确保视图更新
    setTimeout(() => {
      this.setData({ scrollToBrand: '' });
    }, 300);
  },

  onModelTap(e) {
    const { model, brand } = e.currentTarget.dataset;
    const category = this.data.currentCategory;

    // 构建跳转参数
    const params = {
      categoryId: category.id,
      categoryName: category.name.replace('回收', ''),
      brandId: brand.id,
      brandName: brand.name,
      brandLogoText: brand.logoText || '',
      brandLogoColor: brand.logoColor || '',
      modelId: model.id,
      modelName: model.name,
      modelPrice: model.price,
      modelSpecs: model.specsText || model.specs,
      modelColor: model.color,
      modelBgColor: model.bgColor || '',
      modelVisualIcon: model.visualIcon || '',
      modelVisualScene: model.visualScene || ''
    };

    wx.showLoading({ title: '正在加载...', mask: true });
    wx.navigateTo({
      url: `/pages/recycle-guide/recycle-guide?${this.buildQuery(params)}`
    });
  },

  buildQuery(params) {
    return Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
  },

  // ===============================================
  //  搜索相关方法
  // ===============================================

  /** 空操作 — 仅用于 catchtap 阻止事件冒泡 */
  noop() {},

  /** 点击搜索栏 — 打开搜索面板 */
  onSearchBarTap() {
    this.setData({ showSearchPanel: true });
  },

  /** 输入框内容变化 — 防抖搜索 */
  onSearchInput(e) {
    // 保留原始值（含空格）同步给输入框，避免输入空格被吃掉
    const rawValue = e.detail.value;
    this.setData({ searchKeyword: rawValue });

    const keyword = rawValue.trim();

    // 清空输入 → 清空结果
    if (!keyword) {
      this.setData({ searchResults: [] });
      return;
    }

    // 防抖
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.doSearch(keyword);
    }, 300);
  },

  /**
   * 执行模糊搜索
   * 支持：多关键词 AND 匹配、忽略空格差异（iphone17 = iphone 17）、不区分大小写
   */
  doSearch(keyword) {
    const kw = keyword.toLowerCase().trim();
    // 按空格拆分成多个搜索词，全部匹配才算命中
    const tokens = kw.split(/\s+/);
    // 去除所有空格的版本，用于「无空格模糊匹配」
    const kwNoSpace = kw.replace(/\s+/g, '');

    const results = this.data.searchIndex.filter(item => {
      // 拼接全部可搜索字段
      const combined = (
        item.modelName + ' ' +
        item.brandName + ' ' +
        item.modelSpecs + ' ' +
        item.categoryName
      ).toLowerCase();
      // 去空格版本
      const combinedNoSpace = combined.replace(/\s+/g, '');

      // 匹配策略：
      // 1) 多关键词 AND —— 每个词都在 combined 中出现
      // 2) 无空格模糊 —— 去掉空格后整体匹配（输入 iphone17 能命中 iPhone 17）
      const matchAllTokens = tokens.every(t => combined.includes(t));
      const matchNoSpace = combinedNoSpace.includes(kwNoSpace);

      return matchAllTokens || matchNoSpace;
    }).slice(0, 50); // 最多展示50条

    this.setData({ searchResults: results });
  },

  /** 软键盘确认搜索 — 保存历史 */
  onSearchConfirm() {
    const kw = this.data.searchKeyword.trim();
    if (!kw) return;
    this.saveSearchHistory(kw);
  },

  /** 点击搜索结果 */
  onSearchResultTap(e) {
    const item = e.currentTarget.dataset.item;

    // 保存搜索历史
    this.saveSearchHistory(this.data.searchKeyword);

    // 关闭搜索面板
    this.setData({ showSearchPanel: false });

    // 显示加载指示器
    wx.showLoading({ title: '正在加载...', mask: true });

    // 跳转到估价引导页
    const params = {
      categoryId: item.categoryId,
      categoryName: item.categoryName.replace('回收', ''),
      brandId: item.brandId,
      brandName: item.brandName,
      brandLogoText: item.brandLogoText || '',
      brandLogoColor: item.brandLogoColor || '',
      modelId: item.modelId,
      modelName: item.modelName,
      modelPrice: item.modelPrice,
      modelSpecs: item.modelSpecs,
      modelColor: item.modelColor,
      modelBgColor: item.modelBgColor || '',
      modelVisualIcon: item.modelVisualIcon || '',
      modelVisualScene: item.modelVisualScene || ''
    };

    wx.navigateTo({
      url: `/pages/recycle-guide/recycle-guide?${this.buildQuery(params)}`
    });
  },

  /** 点击历史搜索词 */
  onHistoryTap(e) {
    const word = e.currentTarget.dataset.word;
    this.setData({ searchKeyword: word });
    this.doSearch(word);
  },

  /** 保存搜索历史（去重、最多10条） */
  saveSearchHistory(keyword) {
    let history = this.data.searchHistory.filter(h => h !== keyword);
    history.unshift(keyword);
    history = history.slice(0, 10);
    this.setData({ searchHistory: history });
    wx.setStorageSync('recycle_search_history', history);
  },

  /** 清空搜索历史 */
  onClearHistory() {
    wx.showModal({
      title: '清空搜索历史',
      content: '确定要清空所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ searchHistory: [] });
          wx.removeStorageSync('recycle_search_history');
        }
      }
    });
  },

  /** 清空输入框 */
  onClearInput() {
    this.setData({
      searchKeyword: '',
      searchResults: []
    });
  },

  /** 关闭搜索面板 */
  onSearchCancel() {
    clearTimeout(this._searchTimer);
    this.setData({
      showSearchPanel: false,
      searchKeyword: '',
      searchResults: []
    });
  },

});
