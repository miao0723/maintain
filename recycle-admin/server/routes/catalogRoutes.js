/**
 * 设备配价库管理：分类 → 品牌 → 型号（基准回收价）
 */
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate, requireWrite } = require('../middleware/auth');
const { writeOpLog } = require('../utils/oplog');

/** GET /api/catalog/tree 完整目录树（含每个型号配价） */
router.get('/tree', authenticate, async (req, res) => {
  try {
    const [cats, brands, models] = await Promise.all([
      db.query('SELECT * FROM recycle_categories ORDER BY sort_order, id'),
      db.query('SELECT * FROM recycle_brands ORDER BY sort_order, id'),
      db.query('SELECT id, brand_id, name, specs, base_price, market_price, hot, status, sort_order, updated_at FROM recycle_models ORDER BY sort_order, id')
    ]);
    const modelMap = new Map();
    for (const m of models) {
      if (!modelMap.has(m.brand_id)) modelMap.set(m.brand_id, []);
      modelMap.get(m.brand_id).push(m);
    }
    const brandMap = new Map();
    for (const b of brands) {
      if (!brandMap.has(b.category_id)) brandMap.set(b.category_id, []);
      brandMap.get(b.category_id).push({ ...b, models: modelMap.get(b.id) || [] });
    }
    const tree = cats.map((c) => ({ ...c, brands: brandMap.get(c.id) || [] }));
    res.json({ success: true, data: tree });
  } catch (err) {
    console.error('[catalog/tree]', err);
    res.status(500).json({ success: false, message: '查询配价库失败' });
  }
});

/** GET /api/catalog/models 分页查询型号（支持按分类/品牌/关键词筛选，用于配价调价表格） */
router.get('/models', authenticate, async (req, res) => {  try {
    const { categoryId = '', brandId = '', keyword = '', status = '', hot = '', page = 1, pageSize = 20 } = req.query;
    const where = ['1=1'];
    const params = [];
    if (categoryId) { where.push('b.category_id = ?'); params.push(parseInt(categoryId)); }
    if (brandId) { where.push('m.brand_id = ?'); params.push(parseInt(brandId)); }
    if (keyword) { where.push('(m.name LIKE ? OR m.specs LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`); }
    if (status !== '') { where.push('m.status = ?'); params.push(parseInt(status)); }
    if (hot !== '') { where.push('m.hot = ?'); params.push(parseInt(hot)); }

    const limit = Math.min(parseInt(pageSize) || 20, 100);
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;
    const whereSql = where.join(' AND ');

    const [rows, countRows] = await Promise.all([
      db.query(
        `SELECT m.*, b.name AS brand_name, c.name AS category_name, c.id AS category_id
         FROM recycle_models m
         JOIN recycle_brands b ON b.id = m.brand_id
         JOIN recycle_categories c ON c.id = b.category_id
         WHERE ${whereSql}
         ORDER BY c.sort_order, b.sort_order, m.sort_order, m.id
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      db.query(
        `SELECT COUNT(*) AS total
         FROM recycle_models m
         JOIN recycle_brands b ON b.id = m.brand_id
         JOIN recycle_categories c ON c.id = b.category_id
         WHERE ${whereSql}`,
        params
      )
    ]);
    res.json({
      success: true,
      data: { list: rows, total: Number(countRows[0].total), page: Math.max(parseInt(page) || 1, 1), pageSize: limit }
    });
  } catch (err) {
    console.error('[catalog/models]', err);
    res.status(500).json({ success: false, message: '查询型号失败' });
  }
});

// GET /api/catalog/export/models —— 配价库全量导出 CSV（Excel 可直接打开）
// 鉴权支持 ?token=，供前端新窗口直接下载
router.get('/export/models', authenticate, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT c.name AS category, b.name AS brand, m.name AS model, m.specs,
              m.base_price, m.market_price, m.hot, m.status, m.updated_at
         FROM recycle_models m
         JOIN recycle_brands b ON b.id = m.brand_id
         JOIN recycle_categories c ON c.id = b.category_id
        ORDER BY c.sort_order, b.sort_order, m.sort_order, m.id`
    );
    const esc = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ['分类', '品牌', '型号', '规格说明', '回收基准价', '市场参考价', '热门', '状态', '更新时间'];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push(
        [r.category, r.brand, r.model, r.specs, r.base_price, r.market_price, Number(r.hot) ? '是' : '否', Number(r.status) ? '上架' : '下架', r.updated_at]
          .map(esc)
          .join(',')
      );
    }
    // BOM 保证 Excel 识别 UTF-8 中文
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="recycle-catalog-${Date.now()}.csv"`);
    res.send('\uFEFF' + lines.join('\r\n'));
  } catch (err) {
    console.error('[catalog/export]', err);
    res.status(500).json({ success: false, message: '导出失败' });
  }
});

// ============ 分类 ============
router.post('/categories', authenticate, requireWrite, async (req, res) => {
  try {
    const { code, name, icon = '', color = '#5B9E8A', sortOrder = 0 } = req.body || {};
    if (!code || !name) return res.status(400).json({ success: false, message: '请填写分类编码和名称' });
    await db.query(
      'INSERT INTO recycle_categories (code, name, icon, color, sort_order) VALUES (?,?,?,?,?)',
      [String(code).trim(), name, icon, color, parseInt(sortOrder) || 0]
    );
    await writeOpLog(req, 'catalog', 'category_create', `新增分类「${name}」`);
    res.json({ success: true, message: '分类已创建' });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '分类编码已存在' });
    }
    console.error('[catalog/createCategory]', err);
    res.status(500).json({ success: false, message: '创建分类失败' });
  }
});

router.put('/categories/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, icon, color, sortOrder, status } = req.body || {};
    const sets = [];
    const params = [];
    if (name != null) { sets.push('name = ?'); params.push(name); }
    if (icon != null) { sets.push('icon = ?'); params.push(icon); }
    if (color != null) { sets.push('color = ?'); params.push(color); }
    if (sortOrder != null) { sets.push('sort_order = ?'); params.push(parseInt(sortOrder) || 0); }
    if (status != null) { sets.push('status = ?'); params.push(parseInt(status) ? 1 : 0); }
    if (sets.length === 0) return res.status(400).json({ success: false, message: '无更新内容' });
    params.push(id);
    await db.query(`UPDATE recycle_categories SET ${sets.join(', ')} WHERE id = ?`, params);
    await writeOpLog(req, 'catalog', 'category_update', `修改分类 #${id}`);
    res.json({ success: true, message: '分类已更新' });
  } catch (err) {
    console.error('[catalog/updateCategory]', err);
    res.status(500).json({ success: false, message: '更新分类失败' });
  }
});

router.delete('/categories/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const used = await db.query(
      'SELECT (SELECT COUNT(*) FROM recycle_brands WHERE category_id = ?) AS brands', [id]
    );
    if (Number(used[0].brands) > 0) {
      return res.status(400).json({ success: false, message: '分类下仍有品牌，请先清空品牌' });
    }
    await db.query('DELETE FROM recycle_categories WHERE id = ?', [id]);
    await writeOpLog(req, 'catalog', 'category_delete', `删除分类 #${id}`);
    res.json({ success: true, message: '分类已删除' });
  } catch (err) {
    console.error('[catalog/deleteCategory]', err);
    res.status(500).json({ success: false, message: '删除分类失败' });
  }
});

// ============ 品牌 ============
router.post('/brands', authenticate, requireWrite, async (req, res) => {
  try {
    const { categoryId, name, logoText = '', logoColor = '#666666', sortOrder = 0 } = req.body || {};
    if (!categoryId || !name) return res.status(400).json({ success: false, message: '请选择分类并填写品牌名称' });
    await db.query(
      'INSERT INTO recycle_brands (category_id, name, logo_text, logo_color, sort_order) VALUES (?,?,?,?,?)',
      [parseInt(categoryId), name, logoText || name.substring(0, 2), logoColor, parseInt(sortOrder) || 0]
    );
    await writeOpLog(req, 'catalog', 'brand_create', `新增品牌「${name}」`);
    res.json({ success: true, message: '品牌已创建' });
  } catch (err) {
    console.error('[catalog/createBrand]', err);
    res.status(500).json({ success: false, message: '创建品牌失败' });
  }
});

router.put('/brands/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, logoText, logoColor, sortOrder, status } = req.body || {};
    const sets = [];
    const params = [];
    if (name != null) { sets.push('name = ?'); params.push(name); }
    if (logoText != null) { sets.push('logo_text = ?'); params.push(logoText); }
    if (logoColor != null) { sets.push('logo_color = ?'); params.push(logoColor); }
    if (sortOrder != null) { sets.push('sort_order = ?'); params.push(parseInt(sortOrder) || 0); }
    if (status != null) { sets.push('status = ?'); params.push(parseInt(status) ? 1 : 0); }
    if (sets.length === 0) return res.status(400).json({ success: false, message: '无更新内容' });
    params.push(id);
    await db.query(`UPDATE recycle_brands SET ${sets.join(', ')} WHERE id = ?`, params);
    await writeOpLog(req, 'catalog', 'brand_update', `修改品牌 #${id}`);
    res.json({ success: true, message: '品牌已更新' });
  } catch (err) {
    console.error('[catalog/updateBrand]', err);
    res.status(500).json({ success: false, message: '更新品牌失败' });
  }
});

router.delete('/brands/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const used = await db.query('SELECT COUNT(*) AS c FROM recycle_models WHERE brand_id = ?', [id]);
    if (Number(used[0].c) > 0) {
      return res.status(400).json({ success: false, message: '品牌下仍有型号，请先清空型号' });
    }
    await db.query('DELETE FROM recycle_brands WHERE id = ?', [id]);
    await writeOpLog(req, 'catalog', 'brand_delete', `删除品牌 #${id}`);
    res.json({ success: true, message: '品牌已删除' });
  } catch (err) {
    console.error('[catalog/deleteBrand]', err);
    res.status(500).json({ success: false, message: '删除品牌失败' });
  }
});

// ============ 型号（配价） ============
router.post('/models', authenticate, requireWrite, async (req, res) => {
  try {
    const { brandId, name, specs = '', basePrice = 0, marketPrice = null, hot = 0 } = req.body || {};
    if (!brandId || !name) return res.status(400).json({ success: false, message: '请选择品牌并填写型号名称' });
    const result = await db.query(
      `INSERT INTO recycle_models (brand_id, name, specs, base_price, market_price, hot, updated_by)
       VALUES (?,?,?,?,?,?,?)`,
      [parseInt(brandId), name, specs, Number(basePrice) || 0, marketPrice != null && marketPrice !== '' ? Number(marketPrice) : null, hot ? 1 : 0, req.admin.id]
    );
    await db.query(
      `INSERT INTO recycle_price_logs (model_id, model_name, old_price, new_price, reason, admin_id, admin_name)
       VALUES (?, ?, NULL, ?, '新增型号', ?, ?)`,
      [result.insertId, name, Number(basePrice) || 0, req.admin.id, req.admin.name || req.admin.username]
    );
    await writeOpLog(req, 'catalog', 'model_create', `新增型号「${name}」基准价 ¥${Number(basePrice) || 0}`);
    res.json({ success: true, message: '型号已创建' });
  } catch (err) {
    console.error('[catalog/createModel]', err);
    res.status(500).json({ success: false, message: '创建型号失败' });
  }
});

/** 单个型号调价（记录调价日志，受 max_price_adjust_percent 约束提示） */
router.put('/models/:id/price', authenticate, requireWrite, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { basePrice, reason = '' } = req.body || {};
    const priceNum = Number(basePrice);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return res.status(400).json({ success: false, message: '价格无效' });
    }
    const rows = await db.query('SELECT * FROM recycle_models WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: '型号不存在' });
    const model = rows[0];
    const oldPrice = Number(model.base_price);

    const settingRows = await db.query(
      "SELECT config_value FROM recycle_settings WHERE config_key = 'max_price_adjust_percent'"
    );
    const maxPercent = Number(settingRows[0]?.config_value || 20);
    const force = !!req.body.force;
    if (!force && oldPrice > 0 && Math.abs(priceNum - oldPrice) / oldPrice * 100 > maxPercent) {
      return res.status(400).json({
        success: false,
        needConfirm: true,
        message: `调价幅度超过 ${maxPercent}%（¥${oldPrice} → ¥${priceNum}），请确认是否继续`
      });
    }

    await db.query('UPDATE recycle_models SET base_price = ?, updated_by = ? WHERE id = ?', [priceNum, req.admin.id, id]);
    await db.query(
      `INSERT INTO recycle_price_logs (model_id, model_name, old_price, new_price, reason, admin_id, admin_name)
       VALUES (?,?,?,?,?,?,?)`,
      [id, model.name, oldPrice, priceNum, reason || '手动调价', req.admin.id, req.admin.name || req.admin.username]
    );
    await writeOpLog(req, 'catalog', 'price_update', `「${model.name}」配价 ¥${oldPrice} → ¥${priceNum}${reason ? '：' + reason : ''}`);
    res.json({ success: true, message: `配价已更新为 ¥${priceNum}` });
  } catch (err) {
    console.error('[catalog/updatePrice]', err);
    res.status(500).json({ success: false, message: '调价失败' });
  }
});

router.put('/models/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, specs, basePrice, marketPrice, hot, status, sortOrder } = req.body || {};
    const sets = [];
    const params = [];
    if (name != null) { sets.push('name = ?'); params.push(name); }
    if (specs != null) { sets.push('specs = ?'); params.push(specs); }
    if (basePrice != null) { sets.push('base_price = ?'); params.push(Number(basePrice) || 0); }
    if (marketPrice !== undefined) { sets.push('market_price = ?'); params.push(marketPrice === '' || marketPrice == null ? null : Number(marketPrice)); }
    if (hot != null) { sets.push('hot = ?'); params.push(hot ? 1 : 0); }
    if (status != null) { sets.push('status = ?'); params.push(parseInt(status) ? 1 : 0); }
    if (sortOrder != null) { sets.push('sort_order = ?'); params.push(parseInt(sortOrder) || 0); }
    if (sets.length === 0) return res.status(400).json({ success: false, message: '无更新内容' });
    sets.push('updated_by = ?');
    params.push(req.admin.id);
    params.push(id);
    await db.query(`UPDATE recycle_models SET ${sets.join(', ')} WHERE id = ?`, params);
    await writeOpLog(req, 'catalog', 'model_update', `修改型号 #${id}`);
    res.json({ success: true, message: '型号已更新' });
  } catch (err) {
    console.error('[catalog/updateModel]', err);
    res.status(500).json({ success: false, message: '更新型号失败' });
  }
});

router.delete('/models/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.query('SELECT name FROM recycle_models WHERE id = ?', [id]);
    await db.query('DELETE FROM recycle_models WHERE id = ?', [id]);
    await writeOpLog(req, 'catalog', 'model_delete', `删除型号「${rows[0]?.name || id}」`);
    res.json({ success: true, message: '型号已删除' });
  } catch (err) {
    console.error('[catalog/deleteModel]', err);
    res.status(500).json({ success: false, message: '删除型号失败' });
  }
});

/**
 * POST /api/catalog/models/batch-price 批量调价
 * body: { modelIds: [1,2], mode: 'percent'|'fixed', value: 10, reason }
 *  - percent: 在现价基础上上浮/下调百分比（value 可为负）
 *  - fixed:   统一设置为固定值
 */
router.post('/models/batch-price', authenticate, requireWrite, async (req, res) => {
  try {
    const { modelIds = [], mode = 'percent', value = 0, reason = '' } = req.body || {};
    if (!Array.isArray(modelIds) || modelIds.length === 0) {
      return res.status(400).json({ success: false, message: '请选择型号' });
    }
    const numValue = Number(value);
    if (!Number.isFinite(numValue)) {
      return res.status(400).json({ success: false, message: '调整值无效' });
    }
    const placeholders = modelIds.map(() => '?').join(',');
    const models = await db.query(
      `SELECT id, name, base_price FROM recycle_models WHERE id IN (${placeholders})`,
      modelIds.map((x) => parseInt(x))
    );
    if (models.length === 0) return res.status(400).json({ success: false, message: '型号不存在' });

    for (const m of models) {
      const oldPrice = Number(m.base_price);
      let newPrice;
      if (mode === 'fixed') {
        newPrice = Math.max(0, Math.round(numValue));
      } else {
        newPrice = Math.max(0, Math.round(oldPrice * (1 + numValue / 100)));
      }
      await db.query('UPDATE recycle_models SET base_price = ?, updated_by = ? WHERE id = ?', [newPrice, req.admin.id, m.id]);
      await db.query(
        `INSERT INTO recycle_price_logs (model_id, model_name, old_price, new_price, reason, admin_id, admin_name)
         VALUES (?,?,?,?,?,?,?)`,
        [m.id, m.name, oldPrice, newPrice, reason || `批量调价(${mode === 'fixed' ? '固定值' : numValue + '%'})`, req.admin.id, req.admin.name || req.admin.username]
      );
    }
    await writeOpLog(req, 'catalog', 'batch_price', `批量调价 ${models.length} 个型号（${mode}/${numValue}）`);
    res.json({ success: true, message: `已调整 ${models.length} 个型号` });
  } catch (err) {
    console.error('[catalog/batchPrice]', err);
    res.status(500).json({ success: false, message: '批量调价失败' });
  }
});

/** GET /api/catalog/category-factors 各回收品类的估价系数（含型号统计） */
router.get('/category-factors', authenticate, async (req, res) => {
  try {
    const [cats, settings, stats] = await Promise.all([
      db.query('SELECT id, code, name, icon FROM recycle_categories ORDER BY sort_order, id'),
      db.query(`SELECT config_key, config_value FROM recycle_settings WHERE config_key LIKE 'cat_factor_%'`),
      db.query(`SELECT b.category_id AS category_id, COUNT(*) AS models, AVG(m.base_price) AS avgPrice
                  FROM recycle_models m
                  JOIN recycle_brands b ON b.id = m.brand_id
                 GROUP BY b.category_id`)
    ]);
    const factorMap = Object.fromEntries(settings.map((r) => [r.config_key.replace('cat_factor_', ''), Number(r.config_value)]));
    const statMap = Object.fromEntries(stats.map((r) => [r.category_id, r]));
    res.json({
      success: true,
      data: cats.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        icon: c.icon || '',
        factor: factorMap[String(c.id)] ?? 1,
        models: Number(statMap[c.id]?.models || 0),
        avgPrice: Math.round(Number(statMap[c.id]?.avgPrice || 0))
      }))
    });
  } catch (err) {
    console.error('[catalog/categoryFactors]', err);
    res.status(500).json({ success: false, message: '查询品类系数失败' });
  }
});

/** PUT /api/catalog/category-factors/:id 修改品类估价系数 */
router.put('/category-factors/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const factorNum = Number((req.body || {}).factor);
    if (!Number.isFinite(factorNum) || factorNum < 0.1 || factorNum > 2) {
      return res.status(400).json({ success: false, message: '品类系数需在 0.1~2 之间' });
    }
    const cats = await db.query('SELECT name FROM recycle_categories WHERE id = ?', [id]);
    if (cats.length === 0) {
      return res.status(404).json({ success: false, message: '品类不存在' });
    }
    await db.query(
      `INSERT INTO recycle_settings (config_key, config_value, description, updated_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_by = VALUES(updated_by)`,
      [`cat_factor_${id}`, String(factorNum), `品类估价系数 - ${cats[0].name}`, req.admin.id]
    );
    await writeOpLog(req, 'catalog', 'category_factor', `品类「${cats[0].name}」估价系数调整为 ${factorNum}`);
    res.json({ success: true, message: '品类系数已更新' });
  } catch (err) {
    console.error('[catalog/updateCategoryFactor]', err);
    res.status(500).json({ success: false, message: '更新品类系数失败' });
  }
});

/** GET /api/catalog/price-logs 调价记录（支持 modelId 过滤，用于价格走势） */
router.get('/price-logs', authenticate, async (req, res) => {
  try {
    const { modelId = '', page = 1, pageSize = 20 } = req.query;
    const limit = Math.min(parseInt(pageSize) || 20, 100);
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;
    const where = [];
    const params = [];
    if (modelId) {
      where.push('model_id = ?');
      params.push(parseInt(modelId));
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows, countRows] = await Promise.all([
      db.query(`SELECT * FROM recycle_price_logs ${whereSql} ORDER BY id ${modelId ? 'ASC' : 'DESC'} LIMIT ? OFFSET ?`, [...params, limit, offset]),
      db.query(`SELECT COUNT(*) AS total FROM recycle_price_logs ${whereSql}`, params)
    ]);
    res.json({ success: true, data: { list: rows, total: Number(countRows[0].total) } });
  } catch (err) {
    console.error('[catalog/priceLogs]', err);
    res.status(500).json({ success: false, message: '查询调价记录失败' });
  }
});

module.exports = router;
