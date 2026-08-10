const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const sharp = require('sharp');
const INVALID_QLOGO_PATTERN = /(I6Gqy){2,}/;

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.userId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// JWT验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

/**
 * 智能压缩图片 - 根据图片质量和尺寸动态调整压缩策略
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputPath - 输出文件路径
 * @param {object} options - 压缩选项
 * @returns {Promise<{originalSize: number, compressedSize: number, compressionRatio: string}>}
 */
async function smartCompressImage(inputPath, outputPath, options = {}) {
  const {
    maxWidth = 200,
    maxHeight = 200,
    quality = 75,
    format = 'jpeg',
    maxSize = 50 * 1024 // 目标最大50KB
  } = options;

  const metadata = await sharp(inputPath).metadata();
  const originalSize = fs.statSync(inputPath).size;

  // 动态计算压缩策略
  let targetWidth = maxWidth;
  let targetHeight = maxHeight;
  let targetQuality = quality;

  // 如果图片尺寸已经很小，适当提高质量
  if (metadata.width <= maxWidth && metadata.height <= maxHeight) {
    targetQuality = Math.min(85, quality + 10);
  }

  // 如果原始图片很大，适当降低质量
  if (originalSize > 500 * 1024) {
    targetQuality = Math.max(70, quality - 5);
  }

  // 第一次压缩
  let image = sharp(inputPath)
    .resize(targetWidth, targetHeight, {
      fit: 'cover',
      position: 'center',
      withoutEnlargement: true
    });

  if (format === 'jpeg') {
    image = image.jpeg({
      quality: targetQuality,
      mozjpeg: true,
      progressive: true,
      optimizeScans: true
    });
  } else if (format === 'webp') {
    image = image.webp({
      quality: targetQuality,
      nearLossless: false,
      smartSubsample: true
    });
  }

  await image.toFile(outputPath);
  let compressedSize = fs.statSync(outputPath).size;

  // 如果压缩后仍然超过目标大小,逐步降低质量重新压缩
  let attempts = 0;
  while (compressedSize > maxSize && targetQuality > 50 && attempts < 3) {
    targetQuality -= 10;
    attempts++;

    await sharp(inputPath)
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true
      })
      .jpeg({
        quality: targetQuality,
        mozjpeg: true,
        progressive: true
      })
      .toFile(outputPath);

    compressedSize = fs.statSync(outputPath).size;
  }

  const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

  return {
    originalSize,
    compressedSize,
    compressionRatio
  };
}

/**
 * 下载并压缩微信头像
 * @param {string} avatarUrl - 微信头像URL
 * @param {string} userId - 用户ID
 * @returns {Promise<string>} 压缩后的头像URL
 */
async function downloadAndSaveAvatar(avatarUrl, userId) {
  if (!avatarUrl) return null;

  try {
    // 创建临时文件名
    const tempFileName = `temp-${userId}-${Date.now()}.tmp`;
    const tempFilePath = path.join(uploadDir, tempFileName);

    // 下载头像
    const response = await axios({
      method: 'GET',
      url: avatarUrl,
      responseType: 'stream',
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    // 保存到临时文件
    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // 智能压缩图片
    const compressedFileName = `wechat-${userId}-${Date.now()}.jpg`;
    const compressedFilePath = path.join(uploadDir, compressedFileName);

    const result = await smartCompressImage(tempFilePath, compressedFilePath, {
      maxWidth: 150,
      maxHeight: 150,
      quality: 75,
      format: 'jpeg',
      maxSize: 40 * 1024 // 目标40KB
    });

    console.log(`微信头像压缩完成: ${(result.originalSize / 1024).toFixed(2)} KB → ${(result.compressedSize / 1024).toFixed(2)} KB (压缩率 ${result.compressionRatio}%)`);

    // 删除临时文件
    fs.unlinkSync(tempFilePath);

    // 返回压缩后的URL（使用公网地址，保证小程序端可访问）
    const host = getPublicBaseUrl();
    return `${host}/uploads/avatars/${compressedFileName}`;
  } catch (error) {
    console.error('下载并压缩头像失败:', error);
    // 下载失败时不要继续持久化失效外链，交给前端使用默认头像兜底
    try { if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch (e) {}
    return null;
  }
}

/**
 * 返回对外可访问的基础地址（优先使用环境变量配置的公网地址，
 * 避免容器/Nginx 反代下 req.headers.host 变成内网地址导致头像无法加载）
 */
function getPublicBaseUrl() {
  const envHost = process.env.PUBLIC_BASE_URL || process.env.HOST
  if (envHost) {
    return envHost.replace(/\/+$/, '')
  }
  return 'http://192.168.8.72:3001'
}

function sanitizeAvatarUrl(avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return null;
  }

  const trimmedUrl = avatarUrl.trim();
  if (!trimmedUrl) {
    return null;
  }

  if (
    trimmedUrl.startsWith('wxfile://') ||
    trimmedUrl.startsWith('http://tmp/') ||
    trimmedUrl.startsWith('/uploads/') ||
    trimmedUrl.startsWith('http://') ||
    trimmedUrl.startsWith('https://')
  ) {
    const ensureLocalAvatarExists = (url) => {
      try {
        let avatarPath = '';

        if (url.startsWith('/uploads/')) {
          avatarPath = url;
        } else if (url.includes('/uploads/')) {
          avatarPath = new URL(url).pathname;
        }

        if (!avatarPath.startsWith('/uploads/avatars/')) {
          return true;
        }

        const fileName = path.basename(avatarPath);
        const absolutePath = path.join(uploadDir, fileName);
        return fs.existsSync(absolutePath);
      } catch (e) {
        return false;
      }
    };

    if (
      trimmedUrl.includes('thirdwx.qlogo.cn') &&
      INVALID_QLOGO_PATTERN.test(trimmedUrl)
    ) {
      return null;
    }

    if (!ensureLocalAvatarExists(trimmedUrl)) {
      return null;
    }

    return trimmedUrl;
  }

  return null;
}

// 微信登录接口
router.post('/login', async (req, res) => {
  try {
    const { code, userInfo } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // 调用微信API获取openid
    const wechatResponse = await axios.get(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}&js_code=${code}&grant_type=authorization_code`
    );

    const wxData = wechatResponse.data || {};
    const { openid, unionid, session_key, errcode, errmsg } = wxData;

    // 微信jscode2session返回了错误码（如40013 AppID无效 / 40125 AppSecret错误 / 40163 code已使用）
    if (errcode || !openid) {
      console.error('[微信登录] jscode2session 返回异常:', wxData);
      return res.status(401).json({
        error: 'WeChat login failed',
        wechat: { errcode: errcode || null, errmsg: errmsg || 'no openid' }
      });
    }

    // 检查用户是否已存在
    let user = await db.query(
      'SELECT * FROM users WHERE openid = ?',
      [openid]
    );

    if (user.length === 0) {
      // 创建新用户
      // 判断头像URL是否为本地临时文件（wx.chooseMedia返回的临时路径）
      let avatarUrl = sanitizeAvatarUrl(userInfo?.avatarUrl);

      // 如果是本地临时文件路径，直接使用（等待前端后续上传）
      // 微信小程序的临时文件路径以 http://tmp/ 或 wxfile:// 开头
      if (avatarUrl && (avatarUrl.startsWith('http://tmp/') || avatarUrl.startsWith('wxfile://'))) {
        avatarUrl = avatarUrl; // 临时保存临时路径，等待后续上传
      } else if (avatarUrl && avatarUrl.startsWith('http')) {
        // 如果是网络URL，下载并保存
        avatarUrl = await downloadAndSaveAvatar(avatarUrl, 'temp');
      }

      const result = await db.query(
        `INSERT INTO users (openid, unionid, nickname, avatar_url, real_name, phone, email, gender, country, province, city, language, role, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          openid,
          unionid || null,
          userInfo?.nickName || '微信用户',
          avatarUrl,
          userInfo?.realName || '',
          userInfo?.phone || '',
          userInfo?.email || '',
          userInfo?.gender || 0,
          userInfo?.country || '',
          userInfo?.province || '',
          userInfo?.city || '',
          userInfo?.language || 'zh_CN',
          'user',  // 默认角色为普通用户
          1       // 默认状态为启用
        ]
      );

      user = await db.query(
        'SELECT * FROM users WHERE id = ?',
        [result.insertId]
      );
    } else {
      // 更新用户信息（如果提供了新的用户信息）
      if (userInfo) {
        let avatarUrlToUpdate = sanitizeAvatarUrl(user[0].avatar_url);

        // 判断是否提供了新的头像
        const incomingAvatarUrl = sanitizeAvatarUrl(userInfo.avatarUrl);
        if (incomingAvatarUrl && incomingAvatarUrl !== user[0].avatar_url) {
          // 如果是本地临时文件路径，直接使用
          if (incomingAvatarUrl.startsWith('http://tmp/') || incomingAvatarUrl.startsWith('wxfile://')) {
            avatarUrlToUpdate = incomingAvatarUrl;
          } else if (incomingAvatarUrl.startsWith('http')) {
            // 如果是网络URL，下载并保存
            avatarUrlToUpdate = await downloadAndSaveAvatar(incomingAvatarUrl, user[0].id);
          }
        }

        await db.query(
          `UPDATE users SET
           nickname = ?, avatar_url = ?, real_name = ?, phone = ?, email = ?,
           gender = ?, country = ?, province = ?, city = ?, language = ?,
           last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE openid = ?`,
          [
            userInfo.nickName || user[0].nickname,
            avatarUrlToUpdate,
            userInfo.realName || user[0].real_name,
            userInfo.phone || user[0].phone,
            userInfo.email || user[0].email,
            userInfo.gender || user[0].gender,
            userInfo.country || user[0].country,
            userInfo.province || user[0].province,
            userInfo.city || user[0].city,
            userInfo.language || user[0].language,
            openid
          ]
        );

        user = await db.query(
          'SELECT * FROM users WHERE openid = ?',
          [openid]
        );
      }
    }

    // 生成JWT token - 包含角色信息
    const { generateToken, ROLES } = require('../middleware/auth');
    const token = generateToken(user[0]);

    // 返回用户信息和token
    res.json({
      success: true,
      token,
      user: {
        id: user[0].id,
        openid: user[0].openid,
        nickname: user[0].nickname,
        avatar_url: sanitizeAvatarUrl(user[0].avatar_url),
        real_name: user[0].real_name,
        phone: user[0].phone,
        email: user[0].email,
        role: user[0].role,  // 返回用户角色
        created_at: user[0].created_at,
        last_login_at: user[0].last_login_at
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      success: false,
      error: '登录失败，服务器内部错误',
      message: error.message || '未知错误'
    });
  }
});

// 获取用户信息
router.get('/info', authenticateToken, async (req, res) => {
  try {
    const user = await db.query(
      'SELECT id, openid, nickname, avatar_url, real_name, phone, email, role, created_at, last_login_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...user[0],
      avatar_url: sanitizeAvatarUrl(user[0].avatar_url)
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

// 更新用户信息
router.put('/info', authenticateToken, async (req, res) => {
  try {
    const { nickname, avatar_url, real_name, phone, email } = req.body;
    const sanitizedAvatarUrl = avatar_url !== undefined ? sanitizeAvatarUrl(avatar_url) : undefined;

    // 验证手机号格式（简单验证）
    if (phone && !/^\d{11}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // 验证邮箱格式
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // 动态构建更新语句，只更新提供的字段
    const updates = [];
    const values = [];

    if (nickname !== undefined) { updates.push('nickname = ?'); values.push(nickname); }
    if (avatar_url !== undefined) { updates.push('avatar_url = ?'); values.push(sanitizedAvatarUrl); }
    if (real_name !== undefined) { updates.push('real_name = ?'); values.push(real_name); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.userId);

    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await db.query(
      'SELECT id, openid, nickname, avatar_url, real_name, phone, email, role, status, created_at, last_login_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    res.json({
      ...updatedUser[0],
      avatar_url: sanitizeAvatarUrl(updatedUser[0].avatar_url)
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: 'Failed to update user info' });
  }
});

// 上传头像（带智能压缩）
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image' });
    }

    const uploadedFilePath = req.file.path;
    const fileDir = path.dirname(uploadedFilePath);
    const fileName = path.basename(uploadedFilePath, path.extname(uploadedFilePath));

    // 获取原始文件大小
    const originalSize = fs.statSync(uploadedFilePath).size;

    // 使用智能压缩函数
    const compressedFileName = fileName + '.jpg';
    const compressedFilePath = path.join(fileDir, compressedFileName);

    const result = await smartCompressImage(uploadedFilePath, compressedFilePath, {
      maxWidth: 150,
      maxHeight: 150,
      quality: 75,
      format: 'jpeg',
      maxSize: 40 * 1024 // 目标最大40KB
    });

    console.log(`头像智能压缩完成: 原始 ${(result.originalSize / 1024).toFixed(2)} KB → 压缩后 ${(result.compressedSize / 1024).toFixed(2)} KB (压缩率 ${result.compressionRatio}%)`);

    // 删除原始未压缩的文件
    fs.unlinkSync(uploadedFilePath);

    // 构建完整的图片URL（使用公网地址，保证小程序端可访问）
    const avatarUrl = `${getPublicBaseUrl()}/uploads/avatars/${compressedFileName}`;

    // 更新数据库中的 avatar_url
    await db.query(
      'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [avatarUrl, req.user.userId]
    );

    const updatedUser = await db.query(
      'SELECT id, openid, nickname, avatar_url, real_name, phone, email, created_at, last_login_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    res.json({
      success: true,
      avatar_url: avatarUrl,
      user: {
        ...updatedUser[0],
        avatar_url: sanitizeAvatarUrl(updatedUser[0].avatar_url)
      },
      compression: {
        originalSize: `${(result.originalSize / 1024).toFixed(2)} KB`,
        compressedSize: `${(result.compressedSize / 1024).toFixed(2)} KB`,
        compressionRatio: `${result.compressionRatio}%`
      }
    });
  } catch (error) {
    console.error('上传头像错误:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

/**
 * 注销账号
 * DELETE /api/user/delete-account
 */
router.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // 检查是否有进行中的订单
    const activeOrders = await db.query(
      "SELECT id FROM orders WHERE user_id = ? AND status IN ('pending', 'processing', 'quoted')",
      [userId]
    );

    if (activeOrders.length > 0) {
      return res.status(400).json({
        success: false,
        error: '您有进行中的订单，请先处理完毕后再注销账号'
      });
    }

    // 删除用户相关数据（按依赖顺序）
    // 1. 删除绑定的设备
    await db.query('DELETE FROM user_devices WHERE user_id = ?', [userId]);
    // 2. 删除地址
    await db.query('DELETE FROM user_addresses WHERE user_id = ?', [userId]);
    // 3. 删除单位
    await db.query('DELETE FROM user_units WHERE user_id = ?', [userId]);
    // 4. 将用户订单的 user_id 置空（保留订单记录用于统计）
    await db.query('UPDATE orders SET user_id = NULL WHERE user_id = ?', [userId]);
    // 5. 删除用户
    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: '账号已注销'
    });
  } catch (error) {
    console.error('注销账号错误:', error);
    res.status(500).json({
      success: false,
      error: '注销账号失败，请稍后重试'
    });
  }
});

module.exports = router;
