/**
 * 配价种子数据生成脚本
 * 从小程序端 utils/recycleData.js 导出「分类→品牌→型号」目录结构为 catalog.json，
 * 供回收后台服务首次启动时导入 recycle_categories / recycle_brands / recycle_models 表。
 *
 * 用法: node scripts/gen-catalog.js
 */
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', '..', '..', '小程序2.0', 'utils', 'recycleData.js');
const TARGET = path.join(__dirname, '..', 'data', 'catalog.json');

const { categories, guideQuestions, conditionRates } = require(SOURCE);

const catalog = {
  generatedAt: new Date().toISOString(),
  categories: categories.map((cat, ci) => ({
    code: cat.id,
    name: cat.name,
    icon: cat.icon || '',
    color: cat.color || '#5B9E8A',
    sortOrder: ci + 1,
    brands: cat.brands.map((brand, bi) => ({
      name: brand.name,
      logoText: brand.logoText || brand.name.substring(0, 2),
      logoColor: brand.logoColor || '#666666',
      sortOrder: bi + 1,
      models: brand.models.map((model, mi) => ({
        name: model.name,
        specs: model.specs || '',
        basePrice: model.basePrice || 0,
        marketPrice: model.basePrice || 0,
        hot: ci === 0 && bi === 0 && mi < 3 ? 1 : 0,
        sortOrder: mi + 1
      }))
    }))
  })),
  // 估价问题（成色系数）种子
  guideQuestions,
  conditionRates
};

fs.mkdirSync(path.dirname(TARGET), { recursive: true });
fs.writeFileSync(TARGET, JSON.stringify(catalog, null, 2), 'utf8');

const brandCount = catalog.categories.reduce((s, c) => s + c.brands.length, 0);
const modelCount = catalog.categories.reduce(
  (s, c) => s + c.brands.reduce((ss, b) => ss + b.models.length, 0),
  0
);
console.log(`已生成 ${TARGET}`);
console.log(`分类 ${catalog.categories.length} 个 / 品牌 ${brandCount} 个 / 型号 ${modelCount} 个`);
