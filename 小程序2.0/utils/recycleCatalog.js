// utils/recycleCatalog.js - 回收目录云端加载器
// 配价库由独立的「回收综合服务平台后台」维护，小程序优先使用云端最新配价；
// 云端不可用或未初始化时自动回退到本地 utils/recycleData.js 内置数据，保证离线可用。
const localData = require('./recycleData.js');
const { request } = require('./api.js');

const CATALOG_CACHE_KEY = 'recycle_catalog_cache';
const CATALOG_CACHE_TTL = 10 * 60 * 1000; // 配价缓存10分钟

let inflightCatalog = null;

/**
 * 拉取云端配价目录（分类→品牌→型号），结构与 recycleData.categories 一致
 * @returns {Promise<{managed: boolean, categories: Array}>}
 */
function loadCatalog() {
  if (inflightCatalog) return inflightCatalog;

  inflightCatalog = (async () => {
    // 先用最近一次的缓存，避免每次进入页面都等网络
    try {
      const cached = wx.getStorageSync(CATALOG_CACHE_KEY);
      if (cached && cached.expiredAt > Date.now() && Array.isArray(cached.categories)) {
        return { managed: true, categories: cached.categories };
      }
    } catch (e) { /* 缓存读取失败忽略 */ }

    try {
      const res = await request('/recycle/catalog', 'GET', null, { timeout: 8000, suppressErrorToast: true, resolveOnHttpError: true });
      if (res && res.success && res.managed && Array.isArray(res.data) && res.data.length > 0) {
        // 本地有的可视化信息（分类图片等）按分类编码合并，云端目录保持轻量
        const merged = mergeVisuals(res.data);
        try {
          wx.setStorageSync(CATALOG_CACHE_KEY, { expiredAt: Date.now() + CATALOG_CACHE_TTL, categories: merged });
        } catch (e) { /* 存储失败忽略 */ }
        return { managed: true, categories: merged };
      }
    } catch (e) { /* 网络失败走本地 */ }

    return { managed: false, categories: localData.categories };
  })().finally(() => {
    inflightCatalog = null;
  });

  return inflightCatalog;
}

/** 用本地目录的分类视觉资源（图片/场景文案）补齐云端目录 */
function mergeVisuals(cloudCategories) {
  const localByCode = {};
  for (const cat of localData.categories) localByCode[cat.id] = cat;

  return cloudCategories.map((cat) => {
    const localCat = localByCode[cat.id];
    if (!localCat) return cat;
    const localBrandMap = {};
    for (const b of localCat.brands || []) localBrandMap[b.name] = b;

    return {
      ...cat,
      brands: (cat.brands || []).map((brand) => {
        const localBrand = localBrandMap[brand.name];
        // 云端型号未带 color 时沿用同品牌本地第一个型号的颜色，保持卡片观感
        const fallbackColor = (localBrand && localBrand.models && localBrand.models[0] && localBrand.models[0].color) || cat.color;
        return {
          ...brand,
          logo: localBrand ? localBrand.logo : '🏷️',
          models: (brand.models || []).map((m) => ({
            ...m,
            color: m.color || fallbackColor
          }))
        };
      })
    };
  });
}

/**
 * 拉取回收平台列表（平台比价区数据源）
 * @returns {Promise<Array>} 平台数组；失败返回 []
 */
async function loadPlatforms() {
  try {
    const res = await request('/recycle/platforms', 'GET', null, { timeout: 8000, suppressErrorToast: true, resolveOnHttpError: true });
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
  } catch (e) { /* 忽略 */ }
  return [];
}

/**
 * 记录平台跳转点击（后台统计跳转来源）
 */
function reportPlatformClick(platformId) {
  if (!platformId) return;
  request('/recycle/click', 'POST', { platformId }, { suppressErrorToast: true, resolveOnHttpError: true }).catch(() => {});
}

/**
 * 拉取估价配置（后台维护的系数与参数）
 * @returns {Promise<{managed: boolean, baseFactor: number, aiEnabled: boolean, notice: string}>}
 */
async function loadValuationConfig() {
  const fallback = {
    managed: false,
    baseFactor: 0.9,
    aiEnabled: true,
    notice: ''
  };
  try {
    const res = await request('/recycle/config', 'GET', null, { timeout: 8000, suppressErrorToast: true, resolveOnHttpError: true });
    if (res && res.success && res.managed && res.data) {
      const s = res.data.settings || {};
      return {
        managed: true,
        baseFactor: parseFloat(s.base_factor) > 0 ? parseFloat(s.base_factor) : 0.9,
        aiEnabled: s.ai_evaluate_enabled !== '0',
        notice: s.recycle_notice || '',
        factors: res.data.factors || {}
      };
    }
  } catch (e) { /* 忽略 */ }
  return fallback;
}

module.exports = {
  loadCatalog,
  loadPlatforms,
  reportPlatformClick,
  loadValuationConfig,
  mergeVisuals
};
