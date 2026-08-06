const jwt = require('jsonwebtoken');
const db = require('../database');

/**
 * 角色常量
 */
const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

/**
 * JWT验证中间件
 * 验证Token是否有效，并将用户信息解析到 req.user
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // 格式: Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: '需要提供访问令牌'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    
    // 从数据库获取最新用户信息
    const users = await db.query(
      'SELECT id, openid, nickname, real_name, phone, email, avatar_url, role, status FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: '用户不存在'
      });
    }

    const user = users[0];

    if (user.status !== 1) {
      return res.status(403).json({
        success: false,
        error: '用户已被禁用'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Token验证错误:', error);
    return res.status(401).json({
      success: false,
      error: '无效或过期的令牌'
    });
  }
};

/**
 * 生成JWT Token
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    openid: user.openid,
    nickname: user.nickname,
    role: user.role
  };
  
  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key-change-in-production', options);
};

/**
 * 管理员权限验证中间件
 * 只有管理员角色才能访问
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: '需要先登录'
    });
  }

  if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
    return res.status(403).json({
      success: false,
      error: '需要管理员权限',
      currentRole: req.user.role
    });
  }

  next();
};

/**
 * 超级管理员权限验证中间件
 * 只有超级管理员角色才能访问
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: '需要先登录'
    });
  }

  if (req.user.role !== ROLES.SUPER_ADMIN) {
    return res.status(403).json({
      success: false,
      error: '需要超级管理员权限',
      currentRole: req.user.role
    });
  }

  next();
};

/**
 * 角色权限验证中间件
 * @param {string|Array} allowedRoles - 允许的角色或角色数组
 */
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '需要先登录'
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: '权限不足',
        currentRole: req.user.role,
        allowedRoles: roles
      });
    }

    next();
  };
};

module.exports = {
  ROLES,
  authenticateToken,
  generateToken,
  requireAdmin,
  requireSuperAdmin,
  authorizeRole
};
