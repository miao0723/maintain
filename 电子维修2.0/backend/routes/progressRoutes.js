const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');

// 统一落盘到小程序项目根目录 uploads/progress/{orderId}
const sharedUploadsRoot = path.join(__dirname, '../../uploads');
const uploadDir = path.join(sharedUploadsRoot, 'progress');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 为每个订单创建独立目录
const getUploadDir = (orderId) => {
  const orderDir = path.join(uploadDir, String(orderId));
  if (!fs.existsSync(orderDir)) {
    fs.mkdirSync(orderDir, { recursive: true });
  }
  return orderDir;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // multer在destination回调中body可能未完全解析，使用默认目录
    // 文件保存后会在处理逻辑中移动到正确的订单目录
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

/**
 * 上传进度照片
 * POST /api/progress/photos/upload
 */
router.post('/photos/upload', authenticateToken, upload.array('images', 9), async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.body.orderId || req.body.order_id;
    const description = req.body.description || '';
    const feedbackGroupId = req.body.feedback_group_id || null;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: '订单ID不能为空'
      });
    }

    // 验证订单是否存在
    const orderResult = await db.query(
      'SELECT id, user_id, assigned_to FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const order = orderResult[0];

    // 验证权限：订单所有者、被分配的维修人员、或管理员/超级管理员
    if (order.user_id !== userId && order.assigned_to !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: '无权上传此订单的进度照片'
      });
    }

    // 处理上传的文件
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请至少上传一张照片'
      });
    }

    // 将文件移动到订单子目录
    const orderDir = getUploadDir(orderId);
    const imageUrls = req.files.map(file => {
      const destPath = path.join(orderDir, file.filename);
      fs.renameSync(file.path, destPath);
      return `/uploads/progress/${orderId}/${file.filename}`;
    });

    // 获取用户姓名
    const userResult = await db.query(
      'SELECT nickname, real_name FROM users WHERE id = ?',
      [userId]
    );
    const userName = userResult[0]?.real_name || userResult[0]?.nickname || '维修人员';

    // 标记用户有未读进度更新
    try {
      await db.query(
        `UPDATE orders SET progress_updated_at = NOW(), progress_unread = 1, updated_at = NOW() WHERE id = ?`,
        [orderId]
      );
    } catch (updateErr) {
      console.warn('[进度照片] 更新progress_unread失败:', updateErr.message);
    }

    // 插入进度照片记录（兼容feedback_group_id列是否存在）
    let insertResult;
    try {
      insertResult = await db.query(
        `INSERT INTO order_progress_photos (
          order_id, feedback_group_id, description, images, uploaded_by, uploaded_by_name, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          orderId,
          feedbackGroupId,
          description || '',
          JSON.stringify(imageUrls),
          userId,
          userName
        ]
      );
    } catch (insertErr) {
      // 如果feedback_group_id列不存在，回退到不含该列的INSERT
      if (insertErr.code === 'ER_BAD_FIELD_ERROR') {
        console.warn('[进度照片] feedback_group_id列不存在，使用兼容模式插入');
        insertResult = await db.query(
          `INSERT INTO order_progress_photos (
            order_id, description, images, uploaded_by, uploaded_by_name, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            orderId,
            description || '',
            JSON.stringify(imageUrls),
            userId,
            userName
          ]
        );
      } else {
        throw insertErr;
      }
    }

    // 记录同步日志
    await db.query(
      `INSERT INTO cmms_sync_log (
        order_id, sync_type, sync_status, synced_at
      ) VALUES (?, 'photo', 'success', NOW())`,
      [orderId]
    );

    // 触发CMMS同步（异步）
    syncToCmms(orderId, 'photo', {
      photos: imageUrls,
      description: description || '',
      uploadedBy: userId,
      uploadedByName: userName
    }).catch(err => {
      console.error('CMMS同步失败:', err);
      // 记录同步失败
      db.query(
        `INSERT INTO cmms_sync_log (
          order_id, sync_type, sync_status, sync_error, synced_at
        ) VALUES (?, 'photo', 'failed', ?, NOW())`,
        [orderId, err.message]
      ).catch(e => console.error('记录同步日志失败:', e));
    });

    res.json({
      success: true,
      message: '进度照片上传成功',
      data: {
        id: insertResult.insertId,
        photos: imageUrls,
        photo: imageUrls[0], // 单张图片的快捷访问
        url: imageUrls[0] // URL快捷访问
      }
    });
  } catch (error) {
    console.error('上传进度照片错误:', error);
    res.status(500).json({
      success: false,
      error: '上传失败: ' + error.message
    });
  }
});

/**
 * 上传进度视频
 * POST /api/progress/videos/upload
 */
router.post('/videos/upload', authenticateToken, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user.id;
    const { video_title, description } = req.body;
    const orderId = req.body.orderId || req.body.order_id;
    const feedbackGroupId = req.body.feedback_group_id || null;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: '订单ID不能为空'
      });
    }

    if (!video_title) {
      return res.status(400).json({
        success: false,
        error: '视频标题不能为空'
      });
    }

    // 验证订单是否存在
    const orderResult = await db.query(
      'SELECT id, user_id, assigned_to FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const order = orderResult[0];

    // 验证权限：订单所有者、被分配的维修人员、或管理员/超级管理员
    if (order.user_id !== userId && order.assigned_to !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: '无权上传此订单的进度视频'
      });
    }

    // 验证视频文件
    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        error: '请上传视频文件'
      });
    }

    // 将文件移动到订单子目录
    const orderDir = getUploadDir(orderId);

    const videoFile = Array.isArray(req.files.video) ? req.files.video[0] : req.files.video;

    // 验证文件类型
    const allowedVideoTypes = ['video/mp4', 'video/quicktime'];
    if (!allowedVideoTypes.includes(videoFile.mimetype)) {
      // 删除不符合类型的文件
      try { fs.unlinkSync(videoFile.path); } catch (e) {}
      return res.status(400).json({
        success: false,
        error: '只支持上传MP4格式的视频文件'
      });
    }

    // 移动视频文件到订单目录
    const videoDestPath = path.join(orderDir, videoFile.filename);
    fs.renameSync(videoFile.path, videoDestPath);

    // 生成文件URL（包含orderId子目录）
    const videoUrl = `/uploads/progress/${orderId}/${videoFile.filename}`;
    let coverUrl = '';

    // 处理封面
    if (req.files.cover && req.files.cover.length > 0) {
      const coverFile = Array.isArray(req.files.cover) ? req.files.cover[0] : req.files.cover;
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      if (allowedImageTypes.includes(coverFile.mimetype)) {
        const coverDestPath = path.join(orderDir, coverFile.filename);
        fs.renameSync(coverFile.path, coverDestPath);
        coverUrl = `/uploads/progress/${orderId}/${coverFile.filename}`;
      } else {
        try { fs.unlinkSync(coverFile.path); } catch (e) {}
      }
    }

    // 估算视频时长（可根据实际需求集成ffmpeg）
    const duration = Math.ceil(videoFile.size / (1024 * 1024) * 3); // 每1MB约3秒

    // 获取用户姓名
    const userResult = await db.query(
      'SELECT nickname, real_name FROM users WHERE id = ?',
      [userId]
    );
    const userName = userResult[0]?.real_name || userResult[0]?.nickname || '维修人员';

    // 标记用户有未读进度更新
    try {
      await db.query(
        `UPDATE orders SET progress_updated_at = NOW(), progress_unread = 1, updated_at = NOW() WHERE id = ?`,
        [orderId]
      );
    } catch (updateErr) {
      console.warn('[进度视频] 更新progress_unread失败:', updateErr.message);
    }

    // 插入进度视频记录（兼容feedback_group_id列是否存在）
    let insertResult;
    try {
      insertResult = await db.query(
        `INSERT INTO order_progress_videos (
          order_id, feedback_group_id, video_title, description, video_url, cover_url,
          duration, file_size, uploaded_by, uploaded_by_name, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          orderId,
          feedbackGroupId,
          video_title,
          description || '',
          videoUrl,
          coverUrl,
          duration,
          videoFile.size,
          userId,
          userName
        ]
      );
    } catch (insertErr) {
      // 如果feedback_group_id列不存在，回退到不含该列的INSERT
      if (insertErr.code === 'ER_BAD_FIELD_ERROR') {
        console.warn('[进度视频] feedback_group_id列不存在，使用兼容模式插入');
        insertResult = await db.query(
          `INSERT INTO order_progress_videos (
            order_id, video_title, description, video_url, cover_url,
            duration, file_size, uploaded_by, uploaded_by_name, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            orderId,
            video_title,
            description || '',
            videoUrl,
            coverUrl,
            duration,
            videoFile.size,
            userId,
            userName
          ]
        );
      } else {
        throw insertErr;
      }
    }

    // 记录同步日志
    await db.query(
      `INSERT INTO cmms_sync_log (
        order_id, sync_type, sync_status, synced_at
      ) VALUES (?, 'video', 'success', NOW())`,
      [orderId]
    );

    // 触发CMMS同步（异步）
    syncToCmms(orderId, 'video', {
      videoTitle: video_title,
      description: description || '',
      videoUrl: videoUrl,
      coverUrl: coverUrl,
      duration: duration,
      fileSize: videoFile.size,
      uploadedBy: userId,
      uploadedByName: userName
    }).catch(err => {
      console.error('CMMS同步失败:', err);
      // 记录同步失败
      db.query(
        `INSERT INTO cmms_sync_log (
          order_id, sync_type, sync_status, sync_error, synced_at
        ) VALUES (?, 'video', 'failed', ?, NOW())`,
        [orderId, err.message]
      ).catch(e => console.error('记录同步日志失败:', e));
    });

    res.json({
      success: true,
      message: '进度视频上传成功',
      data: {
        id: insertResult.insertId,
        videoUrl: videoUrl,
        video_url: videoUrl,
        url: videoUrl, // 兼容 url 字段
        coverUrl: coverUrl,
        cover_url: coverUrl,
        cover: coverUrl, // 兼容 cover 字段
        duration: duration,
        file_size: videoFile.size
      }
    });
  } catch (error) {
    console.error('上传进度视频错误:', error);
    res.status(500).json({
      success: false,
      error: '上传失败: ' + error.message
    });
  }
});

/**
 * 获取订单的进度照片列表
 * GET /api/progress/photos/:orderId
 */
router.get('/photos/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId) || 0;
    const userId = req.user.id;

    // 验证订单权限
    const orderResult = await db.query(
      'SELECT id, user_id, assigned_to FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const order = orderResult[0];
    // 权限检查：订单所有者、被分配的维修人员、或管理员/超级管理员
    if (order.user_id !== userId && order.assigned_to !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: '无权查看此订单的进度照片'
      });
    }

    // 查询进度照片
    const photosResult = await db.query(
      'SELECT * FROM order_progress_photos WHERE order_id = ? ORDER BY created_at DESC',
      [orderId]
    );

    // 处理JSON字段（mysql2对JSON列可能已自动解析）
    photosResult.forEach(photo => {
      if (Array.isArray(photo.images)) {
        // mysql2 已自动解析，无需再 parse
      } else if (photo.images && typeof photo.images === 'string') {
        try {
          photo.images = JSON.parse(photo.images);
        } catch (e) {
          photo.images = [];
        }
      } else {
        photo.images = [];
      }
    });

    res.json({
      success: true,
      data: photosResult
    });
  } catch (error) {
    console.error('获取进度照片错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败: ' + error.message
    });
  }
});

/**
 * 获取订单的进度视频列表
 * GET /api/progress/videos/:orderId
 */
router.get('/videos/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId) || 0;
    const userId = req.user.id;

    // 验证订单权限
    const orderResult = await db.query(
      'SELECT id, user_id, assigned_to FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const order = orderResult[0];
    // 权限检查：订单所有者、被分配的维修人员、或管理员/超级管理员
    if (order.user_id !== userId && order.assigned_to !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: '无权查看此订单的进度视频'
      });
    }

    // 查询进度视频
    const videosResult = await db.query(
      'SELECT * FROM order_progress_videos WHERE order_id = ? ORDER BY created_at DESC',
      [orderId]
    );

    res.json({
      success: true,
      data: videosResult
    });
  } catch (error) {
    console.error('获取进度视频错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败: ' + error.message
    });
  }
});

/**
 * 获取订单的分组进度反馈列表
 * GET /api/progress/feedbacks/:orderId
 * 将同一次提交的照片和视频合并为一条反馈记录
 */
router.get('/feedbacks/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId) || 0;
    const userId = req.user.id;

    // 验证订单权限
    const orderResult = await db.query(
      'SELECT id, user_id, assigned_to FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const order = orderResult[0];
    if (order.user_id !== userId && order.assigned_to !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: '无权查看此订单的进度反馈'
      });
    }

    // 查询所有照片
    const photosResult = await db.query(
      'SELECT * FROM order_progress_photos WHERE order_id = ? ORDER BY created_at ASC',
      [orderId]
    );

    // 解析照片的images JSON（mysql2对JSON列可能已自动解析）
    photosResult.forEach(photo => {
      if (Array.isArray(photo.images)) {
        // mysql2 已自动解析，无需再 parse
      } else if (photo.images && typeof photo.images === 'string') {
        try {
          photo.images = JSON.parse(photo.images);
        } catch (e) {
          photo.images = [];
        }
      } else {
        photo.images = [];
      }
    });

    // 查询所有视频
    const videosResult = await db.query(
      'SELECT * FROM order_progress_videos WHERE order_id = ? ORDER BY created_at ASC',
      [orderId]
    );

    // 按 feedback_group_id 分组
    const groupMap = new Map();

    // 处理照片 - 按 feedback_group_id 合并
    photosResult.forEach(photo => {
      const groupId = photo.feedback_group_id || `photo_${photo.id}`;
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          feedback_group_id: groupId,
          order_id: orderId,
          description: photo.description || '',
          photos: [],
          video: null,
          uploaded_by: photo.uploaded_by,
          uploaded_by_name: photo.uploaded_by_name || '维修人员',
          created_at: photo.created_at,
          has_feedback_group_id: !!photo.feedback_group_id
        });
      }
      const group = groupMap.get(groupId);
      // 合并图片（每条photo记录的images可能有多张）
      if (photo.images && photo.images.length > 0) {
        group.photos.push(...photo.images);
      }
      // 使用最新的描述（避免重复）
      if (photo.description && !group.description) {
        group.description = photo.description;
      }
    });

    // 处理视频 - 按 feedback_group_id 关联到照片组
    videosResult.forEach(video => {
      const groupId = video.feedback_group_id || `video_${video.id}`;
      const videoInfo = {
        video_url: video.video_url,
        video_title: video.video_title,
        cover_url: video.cover_url,
        duration: video.duration,
        file_size: video.file_size,
        description: video.description || ''
      };

      if (groupMap.has(groupId)) {
        // 关联到已有的照片组
        groupMap.get(groupId).video = videoInfo;
      } else {
        // 视频独立成组
        groupMap.set(groupId, {
          feedback_group_id: groupId,
          order_id: orderId,
          description: video.description || '',
          photos: [],
          video: videoInfo,
          uploaded_by: video.uploaded_by,
          uploaded_by_name: video.uploaded_by_name || '维修人员',
          created_at: video.created_at,
          has_feedback_group_id: !!video.feedback_group_id
        });
      }
    });

    // 转换为数组并按时间倒序排列
    const feedbacks = Array.from(groupMap.values());
    feedbacks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    console.error('获取分组进度反馈错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败: ' + error.message
    });
  }
});

/**
 * 同步数据到CMMS（异步函数）
 * @param {number} orderId - 小程序订单ID
 * @param {string} type - 同步类型
 * @param {object} data - 同步数据
 */
async function syncToCmms(orderId, type, data) {
  // CMMS同步已禁用 - 后续通过数据库直接读取
  console.log(`[CMMS] 同步已跳过: orderId=${orderId}, type=${type}`);
  return;
}

module.exports = router;
