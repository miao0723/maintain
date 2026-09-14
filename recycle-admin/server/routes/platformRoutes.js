/**
 * 回收平台信息管理 + 采购链接管理（含跳转统计）
 */
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate, requireWrite } = require('../middleware/auth');
const { writeOpLog } = require('../utils/oplog');

const PLATFORM_TYPE_LABELS = { recycle: '回收平台', procurement: '采购渠道', compare: '比价参考' };

// ============ 回收平台 ============
router.get('/', authenticate, async (req, res) => {
  try {
    const { type = '', keyword = '' } = req.query;
    const where = ['1=1'];
    const params = [];
    if (type && PLATFORM_TYPE_LABELS[type]) { where.push('type = ?'); params.push(type); }
    if (keyword) { where.push('(name LIKE ? OR description LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`); }
    const rows = await db.query(
      `SELECT * FROM recycle_platforms WHERE ${where.join(' AND ')} ORDER BY sort_order, id`,
      params
    );
    res.json({ success: true, data: rows.map((r) => ({ ...r, typeLabel: PLATFORM_TYPE_LABELS[r.type] })) });
  } catch (err) {
    console.error('[platforms/list]', err);
    res.status(500).json({ success: false, message: '查询平台失败' });
  }
});

router.post('/', authenticate, requireWrite, async (req, res) => {
  try {
    const {
      name, url = '', type = 'recycle', logoText = '', logoColor = '#5B9E8A',
      description = '', serviceMode = '', settlement = '', commissionDesc = '',
      contact = '', sortOrder = 0
    } = req.body || {};
    if (!name) return res.status(400).json({ success: false, message: '请填写平台名称' });
    if (url && !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ success: false, message: '网址需以 http:// 或 https:// 开头' });
    }
    await db.query(
      `INSERT INTO recycle_platforms (name, url, type, logo_text, logo_color, description, service_mode, settlement, commission_desc, contact, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [name, url, type, logoText || name.substring(0, 1), logoColor, description, serviceMode, settlement, commissionDesc, contact, parseInt(sortOrder) || 0]
    );
    await writeOpLog(req, 'platform', 'create', `新增平台「${name}」`);
    res.json({ success: true, message: '平台已创建' });
  } catch (err) {
    console.error('[platforms/create]', err);
    res.status(500).json({ success: false, message: '创建平台失败' });
  }
});

router.put('/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name, url, type, logoText, logoColor, description, serviceMode,
      settlement, commissionDesc, contact, sortOrder, status
    } = req.body || {};
    const sets = [];
    const params = [];
    if (name != null) { sets.push('name = ?'); params.push(name); }
    if (url != null) {
      if (url && !/^https?:\/\//i.test(url)) {
        return res.status(400).json({ success: false, message: '网址需以 http:// 或 https:// 开头' });
      }
      sets.push('url = ?'); params.push(url);
    }
    if (type != null && PLATFORM_TYPE_LABELS[type]) { sets.push('type = ?'); params.push(type); }
    if (logoText != null) { sets.push('logo_text = ?'); params.push(logoText); }
    if (logoColor != null) { sets.push('logo_color = ?'); params.push(logoColor); }
    if (description != null) { sets.push('description = ?'); params.push(description); }
    if (serviceMode != null) { sets.push('service_mode = ?'); params.push(serviceMode); }
    if (settlement != null) { sets.push('settlement = ?'); params.push(settlement); }
    if (commissionDesc != null) { sets.push('commission_desc = ?'); params.push(commissionDesc); }
    if (contact != null) { sets.push('contact = ?'); params.push(contact); }
    if (sortOrder != null) { sets.push('sort_order = ?'); params.push(parseInt(sortOrder) || 0); }
    if (status != null) { sets.push('status = ?'); params.push(parseInt(status) ? 1 : 0); }
    if (sets.length === 0) return res.status(400).json({ success: false, message: '无更新内容' });
    params.push(id);
    await db.query(`UPDATE recycle_platforms SET ${sets.join(', ')} WHERE id = ?`, params);
    await writeOpLog(req, 'platform', 'update', `修改平台 #${id}`);
    res.json({ success: true, message: '平台已更新' });
  } catch (err) {
    console.error('[platforms/update]', err);
    res.status(500).json({ success: false, message: '更新平台失败' });
  }
});

router.delete('/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.query('DELETE FROM recycle_platforms WHERE id = ?', [id]);
    await writeOpLog(req, 'platform', 'delete', `删除平台 #${id}`);
    res.json({ success: true, message: '平台已删除' });
  } catch (err) {
    console.error('[platforms/delete]', err);
    res.status(500).json({ success: false, message: '删除平台失败' });
  }
});

/**
 * POST /api/platforms/:id/click 记录平台跳转点击（返回真实地址供前端打开）
 */
router.post('/:id/click', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.query('SELECT * FROM recycle_platforms WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: '平台不存在' });
    const platform = rows[0];
    await db.query('UPDATE recycle_platforms SET click_count = click_count + 1 WHERE id = ?', [id]);
    await db.query(
      "INSERT INTO recycle_click_logs (target_type, target_id, target_name, source) VALUES ('platform', ?, ?, 'admin')",
      [id, platform.name]
    );
    res.json({ success: true, data: { url: platform.url } });
  } catch (err) {
    console.error('[platforms/click]', err);
    res.status(500).json({ success: false, message: '记录跳转失败' });
  }
});

module.exports = { router, PLATFORM_TYPE_LABELS };
