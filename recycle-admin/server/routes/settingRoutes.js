/**
 * 系统设置：估价系数 / 系统参数 / 管理员账号 / 操作日志
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticate, requireWrite, requireSuper } = require('../middleware/auth');
const { writeOpLog } = require('../utils/oplog');

// ============ 系统参数 ============
router.get('/settings', authenticate, async (req, res) => {
  try {
    const rows = await db.query('SELECT config_key, config_value, description, updated_at FROM recycle_settings ORDER BY id');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[settings/list]', err);
    res.status(500).json({ success: false, message: '查询参数失败' });
  }
});

router.put('/settings', authenticate, requireWrite, async (req, res) => {
  try {
    const { items = [] } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: '无更新内容' });
    }
    for (const item of items) {
      if (!item.key) continue;
      await db.query(
        'INSERT INTO recycle_settings (config_key, config_value, description, updated_by) VALUES (?,?,?,?) ' +
        'ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_by = VALUES(updated_by)',
        [String(item.key), String(item.value ?? ''), item.description || '', req.admin.id]
      );
    }
    await writeOpLog(req, 'setting', 'update', `更新参数 ${items.length} 项`);
    res.json({ success: true, message: '参数已保存' });
  } catch (err) {
    console.error('[settings/update]', err);
    res.status(500).json({ success: false, message: '保存参数失败' });
  }
});

// ============ 估价系数 ============
router.get('/condition-rates', authenticate, async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM recycle_condition_rates ORDER BY factor_key, sort_order, id');
    const grouped = {};
    for (const r of rows) {
      if (!grouped[r.factor_key]) grouped[r.factor_key] = { key: r.factor_key, name: r.factor_name, options: [] };
      grouped[r.factor_key].options.push(r);
    }
    res.json({ success: true, data: Object.values(grouped) });
  } catch (err) {
    console.error('[settings/conditionRates]', err);
    res.status(500).json({ success: false, message: '查询估价系数失败' });
  }
});

router.put('/condition-rates/:id', authenticate, requireWrite, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { label, rate } = req.body || {};
    const rateNum = Number(rate);
    if (!Number.isFinite(rateNum) || rateNum < 0 || rateNum > 2) {
      return res.status(400).json({ success: false, message: '系数需在 0~2 之间' });
    }
    const sets = [];
    const params = [];
    if (label != null) { sets.push('label = ?'); params.push(label); }
    sets.push('rate = ?');
    params.push(rateNum);
    params.push(id);
    await db.query(`UPDATE recycle_condition_rates SET ${sets.join(', ')} WHERE id = ?`, params);
    await writeOpLog(req, 'setting', 'rate_update', `修改估价系数 #${id} → ${rateNum}`);
    res.json({ success: true, message: '系数已更新' });
  } catch (err) {
    console.error('[settings/updateRate]', err);
    res.status(500).json({ success: false, message: '更新系数失败' });
  }
});

// ============ 管理员管理（super 专属） ============
router.get('/admins', authenticate, requireSuper, async (req, res) => {
  try {
    const rows = await db.query(
      'SELECT id, username, name, role, status, last_login_at, created_at FROM recycle_admins ORDER BY id'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[settings/admins]', err);
    res.status(500).json({ success: false, message: '查询管理员失败' });
  }
});

router.post('/admins', authenticate, requireSuper, async (req, res) => {
  try {
    const { username, password, name = '', role = 'admin' } = req.body || {};
    if (!username || !password) return res.status(400).json({ success: false, message: '请填写账号和密码' });
    if (String(password).length < 6) return res.status(400).json({ success: false, message: '密码至少6位' });
    if (!['super', 'admin', 'viewer'].includes(role)) return res.status(400).json({ success: false, message: '角色无效' });
    await db.query(
      'INSERT INTO recycle_admins (username, password_hash, name, role) VALUES (?,?,?,?)',
      [String(username).trim(), bcrypt.hashSync(String(password), 10), name, role]
    );
    await writeOpLog(req, 'setting', 'admin_create', `新增管理员「${username}」(${role})`);
    res.json({ success: true, message: '管理员已创建' });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '账号已存在' });
    }
    console.error('[settings/createAdmin]', err);
    res.status(500).json({ success: false, message: '创建管理员失败' });
  }
});

router.put('/admins/:id', authenticate, requireSuper, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, role, status, password } = req.body || {};
    const sets = [];
    const params = [];
    if (name != null) { sets.push('name = ?'); params.push(name); }
    if (role != null) {
      if (!['super', 'admin', 'viewer'].includes(role)) return res.status(400).json({ success: false, message: '角色无效' });
      sets.push('role = ?'); params.push(role);
    }
    if (status != null) { sets.push('status = ?'); params.push(parseInt(status) ? 1 : 0); }
    if (password) {
      if (String(password).length < 6) return res.status(400).json({ success: false, message: '密码至少6位' });
      sets.push('password_hash = ?'); params.push(bcrypt.hashSync(String(password), 10));
    }
    if (sets.length === 0) return res.status(400).json({ success: false, message: '无更新内容' });
    if (req.admin.id === id && status === 0) {
      return res.status(400).json({ success: false, message: '不能禁用自己的账号' });
    }
    params.push(id);
    await db.query(`UPDATE recycle_admins SET ${sets.join(', ')} WHERE id = ?`, params);
    await writeOpLog(req, 'setting', 'admin_update', `修改管理员 #${id}`);
    res.json({ success: true, message: '管理员已更新' });
  } catch (err) {
    console.error('[settings/updateAdmin]', err);
    res.status(500).json({ success: false, message: '更新管理员失败' });
  }
});

router.delete('/admins/:id', authenticate, requireSuper, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.admin.id) return res.status(400).json({ success: false, message: '不能删除自己的账号' });
    const count = await db.query("SELECT COUNT(*) AS c FROM recycle_admins WHERE role = 'super' AND id != ?", [id]);
    const target = await db.query('SELECT role FROM recycle_admins WHERE id = ?', [id]);
    if (target.length > 0 && target[0].role === 'super' && Number(count[0].c) === 0) {
      return res.status(400).json({ success: false, message: '系统至少保留一个超级管理员' });
    }
    await db.query('DELETE FROM recycle_admins WHERE id = ?', [id]);
    await writeOpLog(req, 'setting', 'admin_delete', `删除管理员 #${id}`);
    res.json({ success: true, message: '管理员已删除' });
  } catch (err) {
    console.error('[settings/deleteAdmin]', err);
    res.status(500).json({ success: false, message: '删除管理员失败' });
  }
});

// ============ 操作日志 ============
router.get('/operation-logs', authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, module = '' } = req.query;
    const where = module ? 'module = ?' : '1=1';
    const params = module ? [module] : [];
    const limit = Math.min(parseInt(pageSize) || 20, 100);
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;
    const [rows, countRows] = await Promise.all([
      db.query(
        `SELECT * FROM recycle_operation_logs WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      db.query(`SELECT COUNT(*) AS total FROM recycle_operation_logs WHERE ${where}`, params)
    ]);
    res.json({ success: true, data: { list: rows, total: Number(countRows[0].total) } });
  } catch (err) {
    console.error('[settings/opLogs]', err);
    res.status(500).json({ success: false, message: '查询日志失败' });
  }
});

module.exports = router;
