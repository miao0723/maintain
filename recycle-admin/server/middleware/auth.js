/**
 * 回收后台 JWT 认证与角色控制
 */
const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = () => process.env.JWT_SECRET || 'recycle-admin-jwt-secret-change-in-production';

function signToken(admin) {
  return jwt.sign(
    { adminId: admin.id, username: admin.username, role: admin.role },
    JWT_SECRET(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
}

/** 解析并校验 token（支持 Authorization 头与 ?token= 查询参数，后者用于文件导出等新窗口场景） */
async function authenticate(req, res, next) {
  try {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : (req.query.token || '');
    if (!token) {
      return res.status(401).json({ success: false, message: '未登录' });
    }
    const decoded = jwt.verify(token, JWT_SECRET());
    const rows = await db.query(
      'SELECT id, username, name, role, status, last_login_at FROM recycle_admins WHERE id = ?',
      [decoded.adminId]
    );
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: '账号不存在' });
    }
    const admin = rows[0];
    if (admin.status !== 1) {
      return res.status(403).json({ success: false, message: '账号已禁用' });
    }
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
  }
}

/** 写操作需要 admin 或 super 角色（viewer 只读） */
function requireWrite(req, res, next) {
  if (!req.admin) return res.status(401).json({ success: false, message: '未登录' });
  if (req.admin.role === 'viewer') {
    return res.status(403).json({ success: false, message: '只读账号无权执行该操作' });
  }
  next();
}

/** super 专属（管理员管理、危险操作） */
function requireSuper(req, res, next) {
  if (!req.admin) return res.status(401).json({ success: false, message: '未登录' });
  if (req.admin.role !== 'super') {
    return res.status(403).json({ success: false, message: '需要超级管理员权限' });
  }
  next();
}

module.exports = { signToken, authenticate, requireWrite, requireSuper };
