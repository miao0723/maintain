const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 角色常量定义
const ROLES = {
  USER: 'user',           // 普通用户
  ADMIN: 'admin',         // 管理员
  SUPER_ADMIN: 'super_admin', // 超级管理员
  INTERNAL: 'internal'    // 公司内部人员（发起维修/回收订单免付款，仅需申请）
};

// 权限等级映射（数值越大权限越高）
const ROLE_LEVELS = {
  [ROLES.USER]: 1,
  [ROLES.INTERNAL]: 1,    // 内部人员视为普通用户等级（仅免付款下单，无管理权限）
  [ROLES.ADMIN]: 2,
  [ROLES.SUPER_ADMIN]: 3
};

/**
 * 生成JWT Token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      openid: user.openid,
      role: user.role || ROLES.USER,
      nickname: user.nickname
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * JWT验证中间件 - 通用认证
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '需要提供访问令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '无效或过期的令牌' });
    }
    req.user = user;
    next();
  });
};

/**
 * 角色验证中间件 - 检查用户是否具有指定角色
 */
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证用户' });
    }

    const userRole = req.user.role || ROLES.USER;
    const userLevel = ROLE_LEVELS[userRole] || 0;

    // 检查用户角色是否在允许的角色列表中，或权限等级是否足够
    const hasAccess = allowedRoles.some(role => {
      const allowedLevel = ROLE_LEVELS[role] || 0;
      return userLevel >= allowedLevel;
    });

    if (!hasAccess) {
      return res.status(403).json({ 
        error: '权限不足', 
        required: allowedRoles, 
        userRole: userRole 
      });
    }

    next();
  };
};

/**
 * 仅限超级管理员访问
 */
const superAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.SUPER_ADMIN) {
    return res.status(403).json({ error: '需要超级管理员权限' });
  }
  next();
};

module.exports = {
  ROLES,
  authenticateToken,
  authorizeRole,
  superAdminOnly,
  generateToken
};
