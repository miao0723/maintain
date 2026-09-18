/**
 * 认证路由：登录 / 当前信息 / 修改密码 / 维修后台单点登录
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const https = require('https');
const router = express.Router();
const db = require('../database');
const { signToken, authenticate } = require('../middleware/auth');
const { writeOpLog } = require('../utils/oplog');

/**
 * 拿维修后台的 access_token 去主系统换用户信息（服务端对服务端，走网关）。
 * 主系统校验通过才认可该 token，本系统不持有主系统的 JWT 密钥。
 */
function fetchMainProfile(mainToken) {
  const base = new URL(process.env.MAIN_API_BASE || 'https://nginx/api');
  const host = process.env.MAIN_API_HOST || 'zych.net.cn';
  return new Promise((resolve) => {
    const req = https.request(
      {
        protocol: base.protocol,
        hostname: base.hostname,
        port: base.port || 443,
        path: `${base.pathname.replace(/\/$/, '')}/auth/profile`,
        method: 'GET',
        servername: host,
        headers: {
          Authorization: `Bearer ${mainToken}`,
          Host: host,
          Accept: 'application/json'
        },
        // 网关证书签给 zych.net.cn，容器内用服务名 nginx 访问，域名对不上
        rejectUnauthorized: false
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode !== 200) return resolve(null);
          try {
            const json = JSON.parse(body);
            resolve(json && json.code === 200 ? json.data || null : null);
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on('error', (e) => {
      console.error('[auth/sso] 调用主系统失败:', e.message);
      resolve(null);
    });
    req.setTimeout(8000, () => req.destroy(new Error('timeout')));
    req.end();
  });
}

/**
 * POST /api/auth/sso —— 维修后台单点登录
 * 前端两个后台同源部署，维修后台 token 存于 localStorage['token']，
 * 回收后台取到后交给本接口换取回收系统会话。
 * 回收系统账号按 username 匹配；不存在则自动开通（默认 admin 角色，
 * 随机密码，仅可经 SSO 进入），实现“登录一遍、切换免登”。
 */
router.post('/sso', async (req, res) => {
  try {
    const header = req.headers['authorization'] || '';
    const mainToken = (header.startsWith('Bearer ') ? header.slice(7) : '') || (req.body && req.body.token) || '';
    if (!mainToken) {
      return res.status(401).json({ success: false, message: '缺少维修后台登录凭证' });
    }
    const profile = await fetchMainProfile(mainToken);
    if (!profile || !profile.username) {
      return res.status(401).json({ success: false, message: '维修后台登录已过期，请先登录维修后台' });
    }

    let rows = await db.query('SELECT * FROM recycle_admins WHERE username = ?', [String(profile.username)]);
    let admin = rows[0];
    if (!admin) {
      const result = await db.query(
        `INSERT INTO recycle_admins (username, password_hash, name, role, status)
         VALUES (?, ?, ?, 'admin', 1)`,
        [
          String(profile.username),
          bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 10),
          profile.real_name || String(profile.username)
        ]
      );
      rows = await db.query('SELECT * FROM recycle_admins WHERE id = ?', [result.insertId]);
      admin = rows[0];
      console.log(`[auth/sso] 已为维修后台用户 ${profile.username} 自动开通回收后台账号`);
    }
    if (admin.status !== 1) {
      return res.status(403).json({ success: false, message: '账号已禁用，请联系超级管理员' });
    }

    await db.query('UPDATE recycle_admins SET last_login_at = NOW() WHERE id = ?', [admin.id]);
    const token = signToken(admin);
    req.admin = admin;
    req.ip = req.ip;
    await writeOpLog(req, 'auth', 'sso_login', `管理员 ${admin.username} 从维修后台单点登录`);
    res.json({
      success: true,
      data: {
        token,
        admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role }
      }
    });
  } catch (err) {
    console.error('[auth/sso]', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

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
