/**
 * 采购网站平台链接管理（存储 + 跳转 + 点击统计）
 */
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate, requireWrite } = require('../middleware/auth');
const { writeOpLog } = require('../utils/oplog');

const LINK_SELECT = `
  SELECT l.*, c.name AS category_name, p.name AS platform_name
  FROM recycle_procurement_links l
  LEFT JOIN recycle_categories c ON c.id = l.category_id
  LEFT JOIN recycle_platforms p ON p.id = l.platform_id`;

router.get('/', authenticate, async (req, res) => {
  try {
    const { categoryId = '', keyword = '', status = '' } = req.query;
    const where = ['1=1'];
    const params = [];
    if (categoryId) { where.push('l.category_id = ?'); params.push(parseInt(categoryId)); }
    if (status !== '') { where.push('l.status = ?'); params.push(parseInt(status)); }
    if (keyword) {
      where.push('(l.name LIKE ? OR l.url LIKE ? OR l.model_keyword LIKE ? OR l.notes LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw, kw);
    }
    const rows = await db.query(
      `${LINK_SELECT} WHERE ${where.join(' AND ')} ORDER BY l.sort_order, l.id`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[links/list]', err);
    res.status(500).json({ success: false, message: '查询采购链接失败' });
  }
});

router.post('/', authenticate, requireWrite, async (req, res) => {
  try {
    const {
      name, url, categoryId = null, platformId = null, modelKeyword = '',
      priceRange = '', notes = '', sortOrder = 0
    } = req.body || {};
    if (!name || !url) return res.status(400).json({ success: false, message: '请填写链接名称和地址' });
    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ success: false, message: '链接需以 http:// 或 https:// 开头' });
    }
    await db.query(
      `INSERT INTO recycle_procurement_links (name, url, category_id, platform_id, model_keyword, price_range, notes, sort_order)
       VALUES (?,?,?,?,?,?,?,?)`,
      [name, url, categoryId ? parseInt(categoryId) : null, platformId ? parseInt(platformId) : null,
       modelKeyword, priceRange, notes, parseInt(sortOrder) || 0]
    );
    await writeOpLog(req, 'link', 'create', `新增采购链接「${name}」`);
    res.json({ success: true, message: '链接已创建' });
  } catch (err) {
    console.error('[links/create]', err);
    res.status(500).json({ success: false, message: '创建链接失败' });
  }
});

router.put('/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, url, categoryId, platformId, modelKeyword, priceRange, notes, sortOrder, status } = req.body || {};
    const sets = [];
    const params = [];
    if (name != null) { sets.push('name = ?'); params.push(name); }
    if (url != null) {
      if (!/^https?:\/\//i.test(url)) {
        return res.status(400).json({ success: false, message: '链接需以 http:// 或 https:// 开头' });
      }
      sets.push('url = ?'); params.push(url);
    }
    if (categoryId !== undefined) {
      sets.push('category_id = ?');
      params.push(categoryId ? parseInt(categoryId) : null);
    }
    if (platformId !== undefined) {
      sets.push('platform_id = ?');
      params.push(platformId ? parseInt(platformId) : null);
    }
    if (modelKeyword != null) { sets.push('model_keyword = ?'); params.push(modelKeyword); }
    if (priceRange != null) { sets.push('price_range = ?'); params.push(priceRange); }
    if (notes != null) { sets.push('notes = ?'); params.push(notes); }
    if (sortOrder != null) { sets.push('sort_order = ?'); params.push(parseInt(sortOrder) || 0); }
    if (status != null) { sets.push('status = ?'); params.push(parseInt(status) ? 1 : 0); }
    if (sets.length === 0) return res.status(400).json({ success: false, message: '无更新内容' });
    params.push(id);
    await db.query(`UPDATE recycle_procurement_links SET ${sets.join(', ')} WHERE id = ?`, params);
    await writeOpLog(req, 'link', 'update', `修改采购链接 #${id}`);
    res.json({ success: true, message: '链接已更新' });
  } catch (err) {
    console.error('[links/update]', err);
    res.status(500).json({ success: false, message: '更新链接失败' });
  }
});

router.delete('/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.query('DELETE FROM recycle_procurement_links WHERE id = ?', [id]);
    await writeOpLog(req, 'link', 'delete', `删除采购链接 #${id}`);
    res.json({ success: true, message: '链接已删除' });
  } catch (err) {
    console.error('[links/delete]', err);
    res.status(500).json({ success: false, message: '删除链接失败' });
  }
});

/** POST /api/links/:id/click 记录跳转并返回链接地址 */
router.post('/:id/click', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.query('SELECT * FROM recycle_procurement_links WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: '链接不存在' });
    const link = rows[0];
    await db.query(
      'UPDATE recycle_procurement_links SET click_count = click_count + 1, last_click_at = NOW() WHERE id = ?',
      [id]
    );
    await db.query(
      "INSERT INTO recycle_click_logs (target_type, target_id, target_name, source) VALUES ('link', ?, ?, 'admin')",
      [id, link.name]
    );
    res.json({ success: true, data: { url: link.url } });
  } catch (err) {
    console.error('[links/click]', err);
    res.status(500).json({ success: false, message: '记录跳转失败' });
  }
});

/** GET /api/links/click-stats 跳转点击统计（按天，近30天） */
router.get('/click-stats', authenticate, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS clicks
       FROM recycle_click_logs
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date`
    );
    const top = await db.query(
      `SELECT target_type, target_name, COUNT(*) AS clicks
       FROM recycle_click_logs
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY target_type, target_id, target_name
       ORDER BY clicks DESC
       LIMIT 10`
    );
    res.json({ success: true, data: { trend: rows, top } });
  } catch (err) {
    console.error('[links/clickStats]', err);
    res.status(500).json({ success: false, message: '查询统计失败' });
  }
});

module.exports = router;
