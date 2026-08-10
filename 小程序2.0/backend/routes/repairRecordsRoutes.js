const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const db = require('../database.js');

/**
 * 添加维修记录
 * POST /api/repair-records
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const {
      order_id,
      stage,
      title,
      description,
      images,
      videos,
      parts_used,
      duration
    } = req.body;

    // 验证必填字段
    if (!order_id || !stage || !title) {
      return res.status(400).json({
        success: false,
        error: '订单ID、维修阶段和标题不能为空'
      });
    }

    // 检查订单是否存在且属于当前管理员
    const order = await db.query(
      'SELECT id, assigned_to FROM orders WHERE id = ?',
      [order_id]
    );

    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    if (order[0].assigned_to !== adminId) {
      return res.status(403).json({
        success: false,
        error: '无权限操作此订单'
      });
    }

    // 处理JSON字段
    const imagesJson = Array.isArray(images) && images.length > 0 ? JSON.stringify(images) : null;
    const videosJson = Array.isArray(videos) && videos.length > 0 ? JSON.stringify(videos) : null;
    const partsJson = Array.isArray(parts_used) && parts_used.length > 0 ? JSON.stringify(parts_used) : null;

    // 插入维修记录
    const result = await db.query(
      `INSERT INTO repair_records (
        order_id, admin_id, stage, title, description,
        images, videos, parts_used, duration, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        order_id,
        adminId,
        stage,
        title,
        description || '',
        imagesJson,
        videosJson,
        partsJson,
        duration || null
      ]
    );

    // 获取插入的记录
    const insertedRecord = await db.query(
      `SELECT
        rr.id,
        rr.order_id,
        rr.admin_id,
        u.nickname as admin_name,
        rr.stage,
        rr.title,
        rr.description,
        rr.images,
        rr.videos,
        rr.parts_used,
        rr.duration,
        rr.created_at
       FROM repair_records rr
       LEFT JOIN users u ON rr.admin_id = u.id
       WHERE rr.id = ?`,
      [result.insertId]
    );

    const record = insertedRecord[0];

    // 处理JSON字段
    if (record.images) record.images = JSON.parse(record.images);
    if (record.videos) record.videos = JSON.parse(record.videos);
    if (record.parts_used) record.parts_used = JSON.parse(record.parts_used);

    res.json({
      success: true,
      message: '维修记录添加成功',
      data: record
    });
  } catch (error) {
    console.error('添加维修记录错误:', error);
    res.status(500).json({
      success: false,
      error: '添加维修记录失败: ' + error.message
    });
  }
});

/**
 * 获取订单的维修记录列表
 * GET /api/repair-records/order/:orderId
 */
router.get('/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const userId = req.user.id;
    const userRole = req.user.role;

    // 检查权限：管理员或订单所有者
    const order = await db.query(
      'SELECT id, user_id, assigned_to FROM orders WHERE id = ?',
      [orderId]
    );

    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const isAdmin = userRole === 'admin' || userRole === 'super_admin';
    const isOwner = order[0].user_id === userId;
    const isAssigned = order[0].assigned_to === userId;

    if (!isAdmin && !isOwner && !isAssigned) {
      return res.status(403).json({
        success: false,
        error: '无权限查看此订单的维修记录'
      });
    }

    // 查询维修记录
    const records = await db.query(
      `SELECT
        rr.id,
        rr.order_id,
        rr.admin_id,
        u.nickname as admin_name,
        u.avatar_url as admin_avatar,
        rr.stage,
        rr.title,
        rr.description,
        rr.images,
        rr.videos,
        rr.parts_used,
        rr.duration,
        rr.created_at
       FROM repair_records rr
       LEFT JOIN users u ON rr.admin_id = u.id
       WHERE rr.order_id = ?
       ORDER BY rr.created_at ASC`,
      [orderId]
    );

    // 处理JSON字段
    records.forEach(record => {
      if (record.images) {
        try {
          record.images = JSON.parse(record.images);
        } catch (e) {
          record.images = [];
        }
      }
      if (record.videos) {
        try {
          record.videos = JSON.parse(record.videos);
        } catch (e) {
          record.videos = [];
        }
      }
      if (record.parts_used) {
        try {
          record.parts_used = JSON.parse(record.parts_used);
        } catch (e) {
          record.parts_used = [];
        }
      }
    });

    res.json({
      success: true,
      data: {
        records,
        total: records.length
      }
    });
  } catch (error) {
    console.error('获取维修记录错误:', error);
    res.status(500).json({
      success: false,
      error: '获取维修记录失败: ' + error.message
    });
  }
});

/**
 * 获取维修详情
 * GET /api/repair-records/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const recordId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    // 查询维修记录
    const records = await db.query(
      `SELECT
        rr.id,
        rr.order_id,
        rr.admin_id,
        u.nickname as admin_name,
        u.avatar_url as admin_avatar,
        rr.stage,
        rr.title,
        rr.description,
        rr.images,
        rr.videos,
        rr.parts_used,
        rr.duration,
        rr.created_at,
        o.user_id as order_user_id,
        o.assigned_to as order_assigned_to
       FROM repair_records rr
       LEFT JOIN users u ON rr.admin_id = u.id
       LEFT JOIN orders o ON rr.order_id = o.id
       WHERE rr.id = ?`,
      [recordId]
    );

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        error: '维修记录不存在'
      });
    }

    const record = records[0];

    // 检查权限
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';
    const isOwner = record.order_user_id === userId;
    const isAssigned = record.order_assigned_to === userId;

    if (!isAdmin && !isOwner && !isAssigned) {
      return res.status(403).json({
        success: false,
        error: '无权限查看此维修记录'
      });
    }

    // 处理JSON字段
    if (record.images) {
      try {
        record.images = JSON.parse(record.images);
      } catch (e) {
        record.images = [];
      }
    }
    if (record.videos) {
      try {
        record.videos = JSON.parse(record.videos);
      } catch (e) {
        record.videos = [];
      }
    }
    if (record.parts_used) {
      try {
        record.parts_used = JSON.parse(record.parts_used);
      } catch (e) {
        record.parts_used = [];
      }
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('获取维修详情错误:', error);
    res.status(500).json({
      success: false,
      error: '获取维修详情失败: ' + error.message
    });
  }
});

/**
 * 删除维修记录
 * DELETE /api/repair-records/:id
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const recordId = parseInt(req.params.id);
    const adminId = req.user.id;

    // 检查记录是否存在且属于当前管理员
    const record = await db.query(
      'SELECT id, admin_id FROM repair_records WHERE id = ?',
      [recordId]
    );

    if (record.length === 0) {
      return res.status(404).json({
        success: false,
        error: '维修记录不存在'
      });
    }

    if (record[0].admin_id !== adminId) {
      return res.status(403).json({
        success: false,
        error: '无权限删除此维修记录'
      });
    }

    // 删除记录
    await db.query(
      'DELETE FROM repair_records WHERE id = ?',
      [recordId]
    );

    res.json({
      success: true,
      message: '维修记录已删除'
    });
  } catch (error) {
    console.error('删除维修记录错误:', error);
    res.status(500).json({
      success: false,
      error: '删除维修记录失败: ' + error.message
    });
  }
});

module.exports = router;
