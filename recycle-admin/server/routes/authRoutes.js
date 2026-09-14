/**
 * 认证路由：登录 / 当前信息 / 修改密码
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../database');
const { signToken, authenticate } = require('../middleware/auth');
const { writeOpLog } = require('../utils/oplog');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请输入账号和密码' });
    }
    const rows = await db.query(
      'SELECT * FROM recycle_admins WHERE username = ?',
      [String(username).trim()]
    );
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: '账号或密码错误' });
    }
    const admin = rows[0];
    if (admin.status !== 1) {
      return res.status(403).json({ success: false, message: '账号已禁用，请联系超级管理员' });
    }
    if (!bcrypt.compareSync(String(password), admin.password_hash)) {
      return res.status(401).json({ success: false, message: '账号或密码错误' });
    }
    await db.query('UPDATE recycle_admins SET last_login_at = NOW() WHERE id = ?', [admin.id]);
    const token = signToken(admin);
    req.admin = admin;
    req.ip = req.ip;
    await writeOpLog(req, 'auth', 'login', `管理员 ${admin.username} 登录`);
    res.json({
      success: true,
      data: {
        token,
        admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role }
      }
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const { id, username, name, role, last_login_at } = req.admin;
  res.json({ success: true, data: { id, username, name, role, last_login_at } });
});

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '请填写原密码和新密码' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: '新密码至少6位' });
    }
    const rows = await db.query('SELECT password_hash FROM recycle_admins WHERE id = ?', [req.admin.id]);
    if (!bcrypt.compareSync(String(oldPassword), rows[0].password_hash)) {
      return res.status(400).json({ success: false, message: '原密码错误' });
    }
    await db.query('UPDATE recycle_admins SET password_hash = ? WHERE id = ?', [
      bcrypt.hashSync(String(newPassword), 10), req.admin.id
    ]);
    await writeOpLog(req, 'auth', 'change_password', '修改登录密码');
    res.json({ success: true, message: '密码已修改' });
  } catch (err) {
    console.error('[auth/change-password]', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
