const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, generateToken, ROLES } = require('../middleware/auth');
const db = require('../database.js');
const { ensureOrderPaymentColumns } = require('../services/orderPaymentSchema');
const { expireOldReviewOrders } = require('../utils/reviewExpire');
const { recordOrderIncome } = require('../services/incomeService');

async function hasOrderColumn(columnName) {
  const columns = await db.query(
    `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = ?`,
    [columnName]
  );
  return columns.length > 0;
}

async function ensureQuoteUnreadColumn() {
  const exists = await hasOrderColumn('quote_unread');
  if (exists) {
    return;
  }

  try {
    await db.query(
      `ALTER TABLE orders
       ADD COLUMN quote_unread TINYINT(1) NULL DEFAULT 0 COMMENT '用户是否有未读报价提醒: 0-已读, 1-未读'`
    );
  } catch (error) {
    const duplicateColumn = error && (error.code === 'ER_DUP_FIELDNAME' || error.errno === 1060 || String(error.message || '').includes('Duplicate column'));
    if (!duplicateColumn) {
      throw error;
    }
  }
}

async function ensureRepairReportFilesColumn() {
  try {
    await db.query(
      `ALTER TABLE orders
       ADD COLUMN repair_report_files JSON NULL COMMENT '维修报告返回文件列表'`
    );
  } catch (error) {
    const duplicateColumn = error && (error.code === 'ER_DUP_FIELDNAME' || error.errno === 1060 || String(error.message || '').includes('Duplicate column'));
    if (!duplicateColumn) {
      throw error;
    }
  }
}

function parseJsonFiles(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return [];
    }
  }
  return [];
}

async function submitQuoteWithUnreadFlag(params) {
  await ensureQuoteUnreadColumn();

  const sql = `UPDATE orders
       SET quote_price = ?,
           quote_description = ?,
           quote_files = ?,
           quote_status = 'pending',
           quote_unread = 1,
           quote_created_at = NOW(),
           quote_created_by = ?,
           status = 'quoted',
           assigned_to = ?,
           assigned_at = IF(assigned_to IS NULL OR assigned_to = 0, NOW(), assigned_at),
           updated_at = NOW()
       WHERE id = ?`;

  try {
    await db.query(sql, params);
  } catch (error) {
    const isMissingColumn = error && (error.code === 'ER_BAD_FIELD_ERROR' || error.errno === 1054 || String(error.message || '').includes('Unknown column'));
    if (!isMissingColumn) {
      throw error;
    }
    await ensureQuoteUnreadColumn();
    await db.query(sql, params);
  }
}

/**
 * 管理员登录接口
 * POST /api/admin/login
 */
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: '手机号不能为空'
      });
    }

    // 查询用户
    const users = await db.query(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    const user = users[0];

    // 检查用户状态
    if (user.status !== 1) {
      return res.status(403).json({
        success: false,
        error: '用户已被禁用'
      });
    }

    // 验证是否为管理员或超级管理员
    if (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: '无管理员权限',
        currentRole: user.role
      });
    }

    // 更新最后登录时间
    await db.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    ).catch(() => {});

    // 生成JWT令牌
    const token = generateToken(user);

    res.json({
      success: true,
      message: '管理员登录成功',
      token,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        real_name: user.real_name,
        role: user.role,
        phone: user.phone,
        email: user.email
      }
    });
  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({
      success: false,
      error: '登录失败',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 获取分配给当前管理员的订单列表
 * 支持超级管理员查看所有订单
 * GET /api/admin/my-orders
 */
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const status = req.query.status;
    const keyword = req.query.keyword;
    const filter = req.query.filter;

    // 确保分页参数是正整数
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(1, parseInt(req.query.pageSize) || 10);
    const offset = Math.max(0, (page - 1) * pageSize);

    console.log('[我的订单查询] userId:', userId, 'role:', userRole, 'status:', status, 'keyword:', keyword, 'filter:', filter);

    // 待评价订单超过3天自动转为已完成（纳入已完成列表）
    await expireOldReviewOrders();

    // 超级管理员可以查看所有订单，普通管理员只能查看分配给自己的订单
    // 当 filter=mine 时，始终只显示分配给自己的订单
    const isSuperAdmin = userRole === 'super_admin';
    const filterMine = filter === 'mine';
    const showOnlyMine = !isSuperAdmin || filterMine;
    // 代客下单的订单（admin_created）即使未分配，也展示给创建它的管理员
    let whereClause = showOnlyMine
      ? 'WHERE (o.assigned_to = ? OR (o.is_admin_created = 1 AND o.admin_created_by = ?))'
      : 'WHERE 1=1';
    const params = showOnlyMine ? [userId, userId] : [];

    // 关键词搜索
    if (keyword) {
      whereClause += ' AND (o.order_id LIKE ? OR u.nickname LIKE ? OR u.phone LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    // 状态筛选
    if (status && status !== 'all') {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    // 查询总数
    const countResult = await db.query(
      `SELECT COUNT(*) as total
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ${whereClause}`,
      params
    );

    const total = { total: 0 };
    if (countResult && countResult[0]) {
      total.total = countResult[0].total;
    }

    const isMissingColumnError = (error) => {
      return error && (
        error.code === 'ER_BAD_FIELD_ERROR' ||
        error.errno === 1054 ||
        String(error.message || '').includes('Unknown column')
      );
    };

    // 查询订单列表（包含分配人员信息）
    let orders;
    try {
      orders = await db.query(
        `SELECT
          o.id,
          o.order_id,
          o.user_id,
          o.order_type,
          o.device_type,
          o.device_model,
          o.problem_description,
          o.custom_description,
          o.images,
          o.service_type,
          o.brand_id,
          o.device_condition,
          o.status,
          o.assigned_to,
          o.created_at,
          o.updated_at,
          o.completed_at,
          o.estimated_price,
          o.actual_price,
          o.progress,
          o.priority,
          o.quote_status,
          o.quote_price,
          o.quote_description,
          o.quote_rejected_reason,
          o.repair_report_files,
          (SELECT COUNT(*) FROM progress_apply pa WHERE pa.order_id = o.id AND pa.approval_status = 'approved') as approved_progress_count,
          u.nickname,
          u.phone,
          u.real_name as customer_name,
          u.avatar_url as customer_avatar,
          t.nickname as assigned_name,
          t.real_name as assigned_real_name
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.id
         LEFT JOIN users t ON o.assigned_to = t.id
         ${whereClause}
         ORDER BY o.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );
    } catch (queryError) {
      console.error('[查询订单列表错误]', queryError);

      if (!isMissingColumnError(queryError)) {
        throw queryError;
      }

      // 回退到兼容旧数据库的查询
      orders = await db.query(
        `SELECT
          o.id,
          o.order_id,
          o.user_id,
          o.order_type,
          o.device_type,
          o.device_model,
          o.problem_description,
          o.custom_description,
          o.images,
          o.service_type,
          o.brand_id,
          o.device_condition,
          o.status,
          o.assigned_to,
          o.created_at,
          o.updated_at,
          o.completed_at,
          o.estimated_price,
          o.actual_price,
          o.progress,
          o.priority,
          o.quote_status,
          NULL as quote_price,
          NULL as quote_description,
          NULL as quote_rejected_reason,
          NULL as repair_report_files,
          (SELECT COUNT(*) FROM progress_apply pa WHERE pa.order_id = o.id AND pa.approval_status = 'approved') as approved_progress_count,
          u.nickname,
          u.phone,
          u.real_name as customer_name,
          u.avatar_url as customer_avatar,
          t.nickname as assigned_name,
          t.real_name as assigned_real_name
         FROM orders o
         LEFT JOIN users u ON o.user_id = u.id
         LEFT JOIN users t ON o.assigned_to = t.id
         ${whereClause}
         ORDER BY o.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );
    }
    orders = (orders || []).map(order => {
      const assignedDisplayName = order.assigned_name || order.assigned_real_name || '';
      return {
        id: order.id,
        order_id: order.order_id,
        user_id: order.user_id,
        order_type: order.order_type,
        device_type: order.device_type,
        device_model: order.device_model || '未知设备',
        problem_description: order.problem_description || order.custom_description || '无',
        images: order.images,
        service_type: order.service_type,
        brand_id: order.brand_id,
        device_condition: order.device_condition,
        status: order.status,
        assigned_to: order.assigned_to,
        assigned_name: assignedDisplayName,
        assigned_display_name: assignedDisplayName,
        created_at: order.created_at,
        updated_at: order.updated_at,
        completed_at: order.completed_at,
        estimated_price: order.estimated_price != null ? parseFloat(order.estimated_price).toFixed(2) : '0.00',
        actual_price: order.actual_price != null ? parseFloat(order.actual_price).toFixed(2) : '0.00',
        progress: order.progress || 0,
        priority: order.priority || 2,
        repair_report_files: parseJsonFiles(order.repair_report_files),
        approved_progress_count: parseInt(order.approved_progress_count) || 0,
        customer_name: order.customer_name || order.nickname || '未知用户',
        customer_phone: order.phone || '',
        customer_avatar: order.customer_avatar || ''
      };
    });

    console.log('[我的订单查询成功] 返回', orders.length, '条订单，总计', total.total, '条');

    res.json({
      success: true,
      data: {
        orders,
        total: total.total,
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('[获取我的订单列表错误]', error);
    res.status(500).json({
      success: false,
      error: '获取订单列表失败',
      details: error.message
    });
  }
});

/**
 * 接单
 * PUT /api/admin/orders/:orderId/accept
 */
router.put('/orders/:orderId/accept', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminId = req.user.id;

    // 检查订单是否存在且状态为待处理
    const order = await db.query(
      'SELECT id, status, assigned_to FROM orders WHERE id = ?',
      [orderId]
    );

    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    if (order[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: '订单状态不正确，无法接单'
      });
    }

    if (order[0].assigned_to && order[0].assigned_to !== adminId) {
      return res.status(400).json({
        success: false,
        error: '订单已被其他管理员接单'
      });
    }

    // 更新订单状态
    await db.query(
      `UPDATE orders
       SET status = 'processing',
           assigned_to = ?,
           assigned_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [adminId, orderId]
    );

    res.json({
      success: true,
      message: '接单成功'
    });
  } catch (error) {
    console.error('接单错误:', error);
    res.status(500).json({
      success: false,
      error: '接单失败'
    });
  }
});

/**
 * 开始处理订单
 * PUT /api/admin/orders/:orderId/process
 */
router.put('/orders/:orderId/process', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await ensureOrderPaymentColumns();
    const { orderId } = req.params;
    const adminId = req.user.id;

    // 检查订单
    const order = await db.query(
      'SELECT id, status, assigned_to, payment_status FROM orders WHERE id = ?',
      [orderId]
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

    if (order[0].status !== 'pending' && order[0].status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: '订单状态不正确，需要用户确认报价后才能开始处理'
      });
    }

    if (order[0].status === 'confirmed' && order[0].payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: '用户尚未完成支付，不能开始处理'
      });
    }

    // 更新订单状态
    await db.query(
      `UPDATE orders
       SET status = 'processing',
           assigned_to = ?,
           assigned_at = NOW(),
           progress = 0,
           updated_at = NOW()
       WHERE id = ?`,
      [adminId, orderId]
    );

    res.json({
      success: true,
      message: '开始处理'
    });
  } catch (error) {
    console.error('开始处理订单错误:', error);
    res.status(500).json({
      success: false,
      error: '操作失败'
    });
  }
});

/**
 * 完成订单
 * PUT /api/admin/orders/:orderId/complete
 */
router.put('/orders/:orderId/complete', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminId = req.user.id;

    // 检查订单
    const order = await db.query(
      'SELECT id, status, assigned_to FROM orders WHERE id = ?',
      [orderId]
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

    if (order[0].status !== 'processing') {
      return res.status(400).json({
        success: false,
        error: '订单状态不正确'
      });
    }

    // 更新订单状态
    await db.query(
      `UPDATE orders
       SET status = 'completed',
           progress = 100,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [orderId]
    );

    // 记录交易收入（已支付且未全额退款的订单）
    await recordOrderIncome(orderId).catch((e) => console.error('记录收入失败:', e));

    res.json({
      success: true,
      message: '订单已完成'
    });
  } catch (error) {
    console.error('完成订单错误:', error);
    res.status(500).json({
      success: false,
      error: '操作失败'
    });
  }
});

/**
 * 取消订单
 * PUT /api/admin/orders/:orderId/cancel
 */
router.put('/orders/:orderId/cancel', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminId = req.user.id;

    // 检查订单
    const order = await db.query(
      'SELECT id, status, assigned_to FROM orders WHERE id = ?',
      [orderId]
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

    if (order[0].status === 'completed' || order[0].status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: '订单状态不允许取消'
      });
    }

    // 更新订单状态
    await db.query(
      `UPDATE orders
       SET status = 'cancelled',
           updated_at = NOW()
       WHERE id = ?`,
      [orderId]
    );

    res.json({
      success: true,
      message: '订单已取消'
    });
  } catch (error) {
    console.error('取消订单错误:', error);
    res.status(500).json({
      success: false,
      error: '操作失败'
    });
  }
});

/**
 * 更新订单进度
 * PUT /api/admin/orders/:orderId/progress
 */
router.put('/orders/:orderId/progress', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { progress } = req.body;
    const adminId = req.user.id;

    // 验证进度值
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        error: '进度值必须在0-100之间'
      });
    }

    // 检查订单
    const order = await db.query(
      'SELECT id, status, assigned_to FROM orders WHERE id = ?',
      [orderId]
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

    if (order[0].status !== 'processing') {
      return res.status(400).json({
        success: false,
        error: '订单状态不正确'
      });
    }

    // 更新进度，同时标记用户有未读进度更新
    await db.query(
      `UPDATE orders
       SET progress = ?,
           progress_updated_at = NOW(),
           progress_unread = 1,
           updated_at = NOW()
       WHERE id = ?`,
      [progress, orderId]
    );

    res.json({
      success: true,
      message: '进度已更新'
    });
  } catch (error) {
    console.error('更新进度错误:', error);
    res.status(500).json({
      success: false,
      error: '更新失败'
    });
  }
});

/**
 * 获取订单详情
 * GET /api/admin/orders/:orderId
 */
router.get('/orders/:orderId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminId = req.user.id;
    const userRole = req.user.role;

    // 超级管理员可以查看所有订单，普通管理员可以查看分配给自己的订单或已完成订单
    const isSuperAdmin = userRole === 'super_admin';
    // 对于已完成订单（status = 'completed'），允许查看
    const whereClause = isSuperAdmin ? 'WHERE o.id = ?' : 'WHERE o.id = ? AND (o.assigned_to = ? OR o.status = "completed")';
    const params = isSuperAdmin ? [orderId] : [orderId, adminId];

    // 查询订单详情
    const orders = await db.query(
      `SELECT
        o.id,
        o.order_id as orderNo,
        o.order_type as orderType,
        o.user_id as userId,
        o.device_type as deviceType,
        o.device_type_name,
        o.device_model as deviceModel,
        o.problem_description,
        o.custom_description,
        o.images,
        o.service_type as serviceType,
        o.brand_id as brandId,
        o.device_condition as deviceCondition,
        o.status,
        o.assigned_to as assignedTo,
        o.assigned_at as assignedAt,
        o.completed_at as completedAt,
        o.estimated_price as estimatedPrice,
        o.actual_price as actualPrice,
        o.progress,
        o.priority,
        o.address_id as addressId,
        o.unit_id as unitId,
        o.created_at as createdAt,
        o.updated_at as updatedAt,
        o.quote_status,
        o.quote_price,
        o.quote_description,
        o.quote_files,
        o.repair_report_files,
        o.quote_created_at,
        o.quote_created_by,
        o.quote_rejected_reason,
        CASE WHEN o.device_type = 0 THEN o.device_type_name ELSE d.name END as deviceTypeName,
        d.icon as deviceTypeIcon,
        b.name as brandName,
        u.nickname as userName,
        u.phone as userPhone,
        u.real_name as userRealName,
        u.email as userEmail,
        u.gender as userGender,
        u.province as userProvince,
        u.city as userCity
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN device_types d ON o.device_type = d.id
       LEFT JOIN brands b ON o.brand_id = b.id
       ${whereClause}`,
      params
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在或无权限访问'
      });
    }

    const order = orders[0];

    // 处理 images 字段
    if (order.images) {
      try {
        order.images = typeof order.images === 'string' ? JSON.parse(order.images) : order.images;
      } catch (e) {
        order.images = [];
      }
    } else {
      order.images = [];
    }

    order.quote_files = parseJsonFiles(order.quote_files);
    order.repair_report_files = parseJsonFiles(order.repair_report_files);

    // 处理价格字段
    if (order.estimatedPrice != null) {
      order.estimated_price = parseFloat(order.estimatedPrice).toFixed(2);
    }
    if (order.actualPrice != null) {
      order.actual_price = parseFloat(order.actualPrice).toFixed(2);
    }

    res.json({
      success: true,
      data: {
        order: order,
        user: {
          id: order.userId,
          nickname: order.userName || '',
          real_name: order.userRealName || '',
          phone: order.userPhone || '',
          email: order.userEmail || '',
          gender: order.userGender,
          province: order.userProvince || '',
          city: order.userCity || ''
        },
        deviceType: {
          id: order.deviceType,
          name: order.deviceTypeName || '未知设备',
          icon: order.deviceTypeIcon || '📱'
        },
        brand: order.brandId ? { id: order.brandId, name: order.brandName || '' } : null,
        address: null,
        unit: null,
        assignedUser: null,
        review: null
      }
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      success: false,
      error: '获取订单详情失败'
    });
  }
});

/**
 * 返回维修报告文件给用户
 * PUT /api/admin/orders/:orderId/repair-report
 */
router.put('/orders/:orderId/repair-report', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminId = req.user.id;
    const userRole = req.user.role;
    const { repair_report_files } = req.body;

    if (!Array.isArray(repair_report_files) || repair_report_files.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请先上传维修报告文件'
      });
    }

    const rows = await db.query(
      'SELECT id, status, assigned_to FROM orders WHERE id = ?',
      [orderId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const order = rows[0];
    const isSuperAdmin = userRole === 'super_admin';

    if (!isSuperAdmin && order.assigned_to && Number(order.assigned_to) !== Number(adminId)) {
      return res.status(403).json({
        success: false,
        error: '无权操作该订单'
      });
    }

    if (order.status !== 'completed' && order.status !== 'review') {
      return res.status(400).json({
        success: false,
        error: '只有已完成订单才能返回维修报告'
      });
    }

    const filesJson = JSON.stringify(repair_report_files);

    try {
      await db.query(
        `UPDATE orders
         SET repair_report_files = ?, updated_at = NOW()
         WHERE id = ?`,
        [filesJson, orderId]
      );
    } catch (error) {
      const isMissingColumn = error && (error.code === 'ER_BAD_FIELD_ERROR' || error.errno === 1054 || String(error.message || '').includes('Unknown column'));
      if (!isMissingColumn) throw error;
      await ensureRepairReportFilesColumn();
      await db.query(
        `UPDATE orders
         SET repair_report_files = ?, updated_at = NOW()
         WHERE id = ?`,
        [filesJson, orderId]
      );
    }

    res.json({
      success: true,
      message: '维修报告已返回给用户'
    });
  } catch (error) {
    console.error('返回维修报告失败:', error);
    res.status(500).json({
      success: false,
      error: '返回维修报告失败'
    });
  }
});

/**
 * 获取所有待分配订单列表（管理员工单管理模块）
 * GET /api/admin/all-orders
 */
router.get('/all-orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 待评价订单超过3天自动转为已完成
    await expireOldReviewOrders();

    const adminId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const status = req.query.status;
    const keyword = req.query.keyword;

    // 构建查询条件
    let whereClause = 'WHERE (o.assigned_to IS NULL OR o.assigned_to = ?)';
    const params = [adminId];

    if (status && status !== 'all') {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    if (keyword) {
      whereClause += ' AND (o.order_id LIKE ? OR u.nickname LIKE ? OR u.phone LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    // 查询总数
    const countResult = await db.query(
      `SELECT COUNT(*) as total
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ${whereClause}`,
      params
    );

    const total = countResult[0].total;

    // 查询订单列表（包含分配信息）
    const orders = await db.query(
      `SELECT
        o.id,
        o.order_id as orderNo,
        o.user_id,
        u.nickname as userName,
        u.phone as userPhone,
        o.device_type as deviceType,
        o.device_type_name,
        o.device_model as deviceModel,
        o.problem_description,
        o.custom_description,
        o.status,
        o.assigned_to as assignedTo,
        o.assigned_at as assignedAt,
        o.completed_at as completedAt,
        o.estimated_price as estimatedPrice,
        o.actual_price as actualPrice,
        o.progress,
        o.priority,
        o.service_type as serviceType,
        o.brand_id as brandId,
        o.device_condition as deviceCondition,
        o.images,
        o.created_at as createdAt,
        o.updated_at as updatedAt,
        d.name as deviceTypeName,
        d.icon as deviceTypeIcon,
        b.name as brandName,
        a.nickname as assignedToName,
        a.phone as assignedToPhone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN device_types d ON o.device_type = d.id
       LEFT JOIN brands b ON o.brand_id = b.id
       LEFT JOIN users a ON o.assigned_to = a.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      success: true,
      data: {
        orders,
        total,
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取订单列表失败'
    });
  }
});

/**
 * 分配订单给指定管理员
 * PUT /api/admin/orders/:orderId/assign
 */
router.put('/orders/:orderId/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { targetAdminId } = req.body;
    const currentAdminId = req.user.id;

    // 验证目标管理员
    const targetAdmin = await db.query(
      'SELECT id, role FROM users WHERE id = ? AND role IN ("admin", "super_admin")',
      [targetAdminId]
    );

    if (targetAdmin.length === 0) {
      return res.status(404).json({
        success: false,
        error: '目标管理员不存在或权限不足'
      });
    }

    // 检查订单状态
    const order = await db.query(
      'SELECT id, status, assigned_to FROM orders WHERE id = ?',
      [orderId]
    );

    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    if (order[0].status === 'completed' || order[0].status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: '订单已完成或取消，无法分配'
      });
    }

    // 更新订单分配
    await db.query(
      `UPDATE orders
       SET assigned_to = ?,
           assigned_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [targetAdminId, orderId]
    );

    // 如果当前是待处理状态，不自动改为处理中（需要先报价）
    // 新流程：分配后，被分配的管理员需要先提交报价

    res.json({
      success: true,
      message: '订单分配成功'
    });
  } catch (error) {
    console.error('分配订单错误:', error);
    res.status(500).json({
      success: false,
      error: '分配订单失败'
    });
  }
});

/**
 * 获取可用的管理员列表
 * GET /api/admin/admins
 */
router.get('/admins', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const admins = await db.query(
      `SELECT id, nickname, real_name, phone, role, created_at
       FROM users
       WHERE role IN ('admin', 'super_admin')
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error('获取管理员列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取管理员列表失败'
    });
  }
});

/**
 * 获取管理员订单统计
 * GET /api/admin/dashboard-stats
 * 超级管理员可以查看所有订单统计，普通管理员只查看分配给自己的订单统计
 */
router.get('/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const adminId = req.user.id;
    const userRole = req.user.role;
    const isSuperAdmin = userRole === 'super_admin';

    let stats;
    if (isSuperAdmin) {
      // 超级管理员查看所有订单统计
      stats = await db.query(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'quoted' THEN 1 ELSE 0 END) as quoted,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
         FROM orders`
      );
      // 单独统计代客待支付订单
      const adminCreated = await db.query(
        `SELECT COUNT(*) as count FROM orders WHERE status = 'admin_created'`
      );
      stats[0].admin_created = adminCreated[0].count;
    } else {
      // 普通管理员只查看分配给自己的订单统计
      stats = await db.query(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'quoted' THEN 1 ELSE 0 END) as quoted,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
         FROM orders
         WHERE assigned_to = ? OR (is_admin_created = 1 AND admin_created_by = ?)`,
        [adminId, adminId]
      );
      stats[0].admin_created = 0;
    }

    // 统计待接单数量（未分配的订单）
    const unassigned = await db.query(
      `SELECT COUNT(*) as count
       FROM orders
       WHERE status = 'pending' AND assigned_to IS NULL`
    );

    res.json({
      success: true,
      data: {
        ...stats[0],
        unassigned: unassigned[0].count
      }
    });
  } catch (error) {
    console.error('获取统计错误:', error);
    res.status(500).json({
      success: false,
      error: '获取统计失败'
    });
  }
});

/**
 * 编辑订单信息
 * PUT /api/admin/orders/:orderId/edit
 */
router.put('/orders/:orderId/edit', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const {
      customer_name,
      customer_phone,
      address_id,
      address,
      estimated_price,
      actual_price,
      problem_description,
      custom_description,
      priority
    } = req.body;

    // 验证订单是否存在
    const orderResult = await db.query(
      'SELECT id, user_id, address_id FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const order = orderResult[0];

    // 如果需要更新客户信息,先更新用户表
    if (customer_name || customer_phone) {
      const updateFields = [];
      const updateValues = [];

      if (customer_name) {
        updateFields.push('real_name = ?');
        updateValues.push(customer_name);
      }
      if (customer_phone) {
        updateFields.push('phone = ?');
        updateValues.push(phone);
      }

      if (updateFields.length > 0) {
        await db.query(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
          [...updateValues, order.user_id]
        );
      }
    }

    // 如果需要更新地址信息
    if (address && (address.contact_name || address.contact_phone || address.province || address.city || address.district || address.detail_address)) {
      if (address_id) {
        // 更新现有地址
        const addressUpdateFields = [];
        const addressUpdateValues = [];

        if (address.contact_name) {
          addressUpdateFields.push('contact_name = ?');
          addressUpdateValues.push(address.contact_name);
        }
        if (address.contact_phone) {
          addressUpdateFields.push('contact_phone = ?');
          addressUpdateValues.push(address.contact_phone);
        }
        if (address.province) {
          addressUpdateFields.push('province = ?');
          addressUpdateValues.push(address.province);
        }
        if (address.city) {
          addressUpdateFields.push('city = ?');
          addressUpdateValues.push(address.city);
        }
        if (address.district) {
          addressUpdateFields.push('district = ?');
          addressUpdateValues.push(address.district);
        }
        if (address.detail_address) {
          addressUpdateFields.push('detail_address = ?');
          addressUpdateValues.push(address.detail_address);
        }

        if (addressUpdateFields.length > 0) {
          addressUpdateFields.push('updated_at = CURRENT_TIMESTAMP');
          await db.query(
            `UPDATE user_addresses SET ${addressUpdateFields.join(', ')} WHERE id = ?`,
            [...addressUpdateValues, address_id]
          );
        }
      } else if (address.contact_name && address.contact_phone && address.province && address.city && address.district && address.detail_address) {
        // 创建新地址
        const insertAddressResult = await db.query(
          `INSERT INTO user_addresses (
            user_id, contact_name, contact_phone, province, city, district,
            detail_address, is_default, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            order.user_id,
            address.contact_name,
            address.contact_phone,
            address.province,
            address.city,
            address.district,
            address.detail_address,
            false
          ]
        );
        address_id = insertAddressResult.insertId;
      }
    }

    // 更新订单信息
    const orderUpdateFields = [];
    const orderUpdateValues = [];

    if (address_id !== undefined && address_id !== null) {
      orderUpdateFields.push('address_id = ?');
      orderUpdateValues.push(address_id);
    }
    if (problem_description !== undefined) {
      orderUpdateFields.push('problem_description = ?');
      orderUpdateValues.push(problem_description);
    }
    if (custom_description !== undefined) {
      orderUpdateFields.push('custom_description = ?');
      orderUpdateValues.push(custom_description);
    }
    if (estimated_price !== undefined && estimated_price !== null) {
      orderUpdateFields.push('estimated_price = ?');
      orderUpdateValues.push(parseFloat(estimated_price));
    }
    if (actual_price !== undefined && actual_price !== null) {
      orderUpdateFields.push('actual_price = ?');
      orderUpdateValues.push(parseFloat(actual_price));
    }
    if (priority !== undefined) {
      orderUpdateFields.push('priority = ?');
      orderUpdateValues.push(parseInt(priority));
    }

    if (orderUpdateFields.length > 0) {
      orderUpdateFields.push('updated_at = CURRENT_TIMESTAMP');
      await db.query(
        `UPDATE orders SET ${orderUpdateFields.join(', ')} WHERE id = ?`,
        [...orderUpdateValues, orderId]
      );
    }

    // 查询更新后的订单信息
    const updatedOrderResult = await db.query(
      `SELECT
        o.id,
        o.order_id as orderNo,
        o.user_id,
        u.nickname as userName,
        u.phone as userPhone,
        u.real_name,
        o.device_type as deviceType,
        o.device_type_name,
        o.device_model as deviceModel,
        o.problem_description,
        o.custom_description,
        o.status,
        o.estimated_price,
        o.actual_price,
        o.address_id,
        o.priority,
        o.created_at,
        o.updated_at,
        ua.contact_name,
        ua.contact_phone,
        ua.province,
        ua.city,
        ua.district,
        ua.detail_address
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN user_addresses ua ON o.address_id = ua.id
       WHERE o.id = ?`,
      [orderId]
    );

    const updatedOrder = updatedOrderResult[0];

    res.json({
      success: true,
      message: '订单更新成功',
      data: {
        ...updatedOrder,
        address: ua.contact_name ? {
          contactName: ua.contact_name,
          contactPhone: ua.contact_phone,
          province: ua.province,
          city: ua.city,
          district: ua.district,
          detail: ua.detail_address
        } : null
      }
    });
  } catch (error) {
    console.error('编辑订单错误:', error);
    res.status(500).json({
      success: false,
      error: '编辑订单失败: ' + error.message
    });
  }
});

/**
 * 申请退款
 * PUT /api/admin/orders/:orderId/refund
 */
router.put('/orders/:orderId/refund', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: '请选择退款原因'
      });
    }

    // 检查订单是否存在
    const order = await db.query(
      'SELECT id, status, user_id FROM orders WHERE id = ?',
      [orderId]
    );

    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    if (order[0].status === 'completed' || order[0].status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: '当前订单状态不允许退款'
      });
    }

    // 更新订单状态为已取消，记录退款原因
    await db.query(
      `UPDATE orders
       SET status = 'cancelled',
           cancel_reason = ?,
           cancel_description = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [reason, description || '', orderId]
    );

    res.json({
      success: true,
      message: '退款申请成功，订单已取消'
    });
  } catch (error) {
    console.error('退款申请错误:', error);
    res.status(500).json({
      success: false,
      error: '退款申请失败'
    });
  }
});

/**
 * 管理员提交报价
 * PUT /api/admin/orders/:orderId/quote
 */
router.put('/orders/:orderId/quote', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminId = req.user.id;
    const { quote_price, quote_description, quote_files } = req.body;

    // 验证必填字段
    if (!quote_price || quote_price <= 0) {
      return res.status(400).json({
        success: false,
        error: '报价金额必须大于0'
      });
    }

    // 检查订单是否存在
    const order = await db.query(
      'SELECT id, status, assigned_to FROM orders WHERE id = ?',
      [orderId]
    );

    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    // 允许 pending 或 processing 状态的订单报价
    if (order[0].status !== 'pending' && order[0].status !== 'processing') {
      return res.status(400).json({
        success: false,
        error: '当前订单状态不允许报价'
      });
    }

    // 检查权限：已分配的订单只能由分配人报价，pending订单任何人可报价
    if (order[0].assigned_to && order[0].assigned_to !== adminId) {
      return res.status(403).json({
        success: false,
        error: '无权限操作此订单'
      });
    }

    // 处理文件列表
    let filesJson = null;
    if (quote_files && Array.isArray(quote_files) && quote_files.length > 0) {
      filesJson = JSON.stringify(quote_files);
    }

    // 更新订单报价信息，并将状态设为 quoted（等待用户确认报价）
    // 如果是 pending 订单，同时分配给当前管理员
    await submitQuoteWithUnreadFlag([
      parseFloat(quote_price),
      quote_description || '',
      filesJson,
      adminId,
      adminId,
      orderId
    ]);

    res.json({
      success: true,
      message: '报价提交成功'
    });
  } catch (error) {
    console.error('提交报价错误:', error);
    res.status(500).json({
      success: false,
      error: '提交报价失败: ' + error.message
    });
  }
});

/**
 * 获取管理员待处理事项计数
 * GET /api/admin/pending-count
 */
router.get('/pending-count', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [pendingProgress] = await db.query(
      `SELECT COUNT(*) as count FROM progress_apply WHERE approval_status = 'pending'`
    );

    const [pendingOrders] = await db.query(
      `SELECT COUNT(*) as count FROM orders WHERE status = 'pending' AND assigned_to IS NULL`
    );

    const [pendingQuote] = await db.query(
      `SELECT COUNT(*) as count FROM orders WHERE quote_status = 'pending'`
    );

    const [pendingInternal] = await db.query(
      `SELECT COUNT(*) as count FROM orders WHERE status = 'internal_pending'`
    );

    res.json({
      success: true,
      data: {
        pendingProgress: pendingProgress[0]?.count || 0,
        pendingOrders: pendingOrders[0]?.count || 0,
        pendingQuote: pendingQuote[0]?.count || 0,
        pendingInternal: pendingInternal[0]?.count || 0,
        total: (pendingProgress[0]?.count || 0) + (pendingOrders[0]?.count || 0) + (pendingQuote[0]?.count || 0) + (pendingInternal[0]?.count || 0)
      }
    });
  } catch (error) {
    console.error('获取待处理计数失败:', error);
    res.status(500).json({ success: false, error: '获取待处理计数失败' });
  }
});

/**
 * 管理员确认内部人员免付款订单
 * 内部人员提交的维修/回收申请，管理员确认后正式建单（免付款），并记录确认人/时间
 * PUT /api/admin/orders/:orderId/internal-confirm
 */
router.put('/orders/:orderId/internal-confirm', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId) || 0;
    const adminId = req.user.id;
    const { actual_price, remark } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ success: false, error: '无效的订单ID' });
    }

    const order = await db.query(
      'SELECT id, order_type, status, is_internal, user_id FROM orders WHERE id = ?',
      [orderId]
    );

    if (order.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const o = order[0];

    if (!o.is_internal) {
      return res.status(400).json({ success: false, error: '该订单不是内部免付款订单' });
    }

    if (o.status !== 'internal_pending') {
      return res.status(400).json({ success: false, error: '当前订单状态不可确认（仅 internal_pending 可确认）' });
    }

    // 确认后：
    // - 维修订单 -> processing（进入正常维修流程，免付款）
    // - 回收订单 -> completed（回收完成，免付款）
    const nextStatus = o.order_type === 'recycle' ? 'completed' : 'processing';
    const finalActualPrice = Number(actual_price) >= 0 ? Number(actual_price) : (o.actual_price || 0);

    await db.query(
      `UPDATE orders
       SET status = ?,
           is_internal = 1,
           payment_status = 'waived',
           pay_amount = 0,
           actual_price = ?,
           confirmed_by = ?,
           confirmed_at = NOW(),
           completed_at = IF(? = 'completed', NOW(), completed_at),
           updated_at = NOW()
       WHERE id = ?`,
      [nextStatus, finalActualPrice, adminId, nextStatus, orderId]
    );

    // 记录内部订单确认日志（写入内部订单记录表，便于审计）
    try {
      await db.query(
        `INSERT INTO internal_orders_log (order_id, confirmed_by, confirmed_at, remark, created_at)
         VALUES (?, ?, NOW(), ?, NOW())`,
        [orderId, adminId, remark || '']
      );
    } catch (logErr) {
      // 日志表不存在或其他错误不阻断主流程
      console.warn('[内部订单确认] 写入日志失败(已忽略):', logErr.message);
    }

    res.json({
      success: true,
      message: '内部免付款订单已确认',
      data: {
        order_id: orderId,
        status: nextStatus,
        payment_status: 'waived'
      }
    });
  } catch (error) {
    console.error('确认内部订单错误:', error);
    res.status(500).json({ success: false, error: '确认内部订单失败: ' + error.message });
  }
});

/**
 * 管理员代客下单（无需报价/确认金额）
 * 管理员通过电话或微信联系用户后，按手机号找到目标用户，直接创建产品订单并设定金额，
 * 订单状态为 admin_created（待用户填写地址并支付）。管理员可将订单转发给用户。
 * POST /api/admin/orders/create-by-admin
 */
router.post('/orders/create-by-admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const {
      // 目标用户：手机号（必填），用于查找已有微信用户
      customer_phone,
      // 订单基础信息
      order_type,          // repair / recycle
      device_type,         // 设备类型ID
      device_type_name,    // 自定义设备类型名称
      brand,
      device_model,
      service_type,        // shop / home
      problem_description,
      custom_description,
      images,
      device_condition,
      // 直接设定的金额（无需报价）
      amount,
      remark
    } = req.body;

    if (!customer_phone || !/^1[3-9]\d{9}$/.test(String(customer_phone))) {
      return res.status(400).json({ success: false, error: '请填写正确的客户手机号' });
    }

    if (!order_type || !['repair', 'recycle'].includes(order_type)) {
      return res.status(400).json({ success: false, error: '请选择订单类型（维修/回收）' });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: '请填写有效的订单金额（大于0）' });
    }

    // 查找目标用户（优先按手机号；用户需已注册过微信小程序）
    const users = await db.query(
      'SELECT id, openid, nickname, real_name, phone, status FROM users WHERE phone = ? LIMIT 1',
      [customer_phone]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '未找到该手机号对应的用户，请确认对方是否已使用微信小程序注册/登录过'
      });
    }

    const targetUser = users[0];
    if (targetUser.status !== 1) {
      return res.status(403).json({ success: false, error: '该用户已被禁用，无法代客下单' });
    }

    const userId = targetUser.id;

    // 生成订单号
    const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 设备类型解析
    let deviceTypeId = 8; // 其他设备（默认）
    if (device_type !== undefined && device_type !== null && Number(device_type) !== 0) {
      deviceTypeId = Number(device_type);
    }
    let customDeviceTypeName = null;
    if (deviceTypeId === 0 || deviceTypeId === 8) {
      customDeviceTypeName = device_type_name || (typeof device_type === 'string' ? device_type : null);
    }

    // 品牌解析
    let brandId = null;
    if (brand) {
      const brandResult = await db.query('SELECT id FROM brands WHERE name = ? LIMIT 1', [brand]);
      if (brandResult.length > 0) brandId = brandResult[0].id;
    }

    // 设备状态映射
    let conditionValue = device_condition || 'normal';
    const conditionMap = {
      '全新未使用': 'good', '九成新': 'good', '八成新': 'normal',
      '七成新': 'fair', '六成新及以下': 'poor',
      'good': 'good', 'normal': 'normal', 'fair': 'fair', 'poor': 'poor'
    };
    if (conditionMap[conditionValue]) conditionValue = conditionMap[conditionValue];
    else if (!['good', 'normal', 'fair', 'poor'].includes(conditionValue)) conditionValue = 'normal';

    const imagesJson = Array.isArray(images) ? JSON.stringify(images) : (images ? JSON.stringify([images]) : null);
    const amountNum = Number(amount).toFixed(2);

    const insertResult = await db.query(
      `INSERT INTO orders (
        order_id, user_id, order_type, device_type, device_type_name, problem_description,
        custom_description, images, service_type, brand_id, device_model,
        device_condition, status, is_admin_created, admin_created_by, admin_created_at,
        estimated_price, actual_price, payment_status, pay_amount, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin_created', 1, ?, NOW(), ?, ?, 'unpaid', ?, NOW(), NOW())`,
      [
        orderNo, userId, order_type, deviceTypeId, customDeviceTypeName,
        problem_description || '', custom_description || '', imagesJson,
        service_type || 'shop', brandId, device_model || '',
        conditionValue, adminId, amountNum, amountNum, amountNum
      ]
    );

    const orderId = insertResult.insertId;

    res.json({
      success: true,
      message: '代客下单成功，订单已生成，可转发给用户填写地址并支付',
      data: {
        order_id: orderId,
        order_no: orderNo,
        user_id: userId,
        customer_phone: customer_phone,
        amount: amountNum,
        status: 'admin_created'
      }
    });
  } catch (error) {
    console.error('管理员代客下单错误:', error);
    res.status(500).json({ success: false, error: '代客下单失败: ' + error.message });
  }
});

/**
 * 用户确认管理员代客下单的订单（填写地址后确认，进入待支付）
 * 管理员代客创建的订单（admin_created），用户在前端填写地址并提交后，
 * 订单变为 confirmed（待支付），管理员可直接开始处理。
 * PUT /api/admin/orders/:orderId/user-confirm
 */
router.put('/orders/:orderId/user-confirm', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId) || 0;
    const userId = req.user.id;
    const { address, address_id } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ success: false, error: '无效的订单ID' });
    }

    const order = await db.query(
      'SELECT id, user_id, status, is_admin_created, address_id FROM orders WHERE id = ?',
      [orderId]
    );

    if (order.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const o = order[0];

    if (Number(o.user_id) !== Number(userId)) {
      return res.status(403).json({ success: false, error: '无权操作此订单' });
    }

    if (!o.is_admin_created || o.status !== 'admin_created') {
      return res.status(400).json({ success: false, error: '该订单不是待用户确认的代客订单' });
    }

    // 若传了地址则写入/关联地址
    let addressId = o.address_id || null;

    // 情况1：用户选择已有地址（前端从地址列表带过来 address_id），直接关联
    if (!addressId && address_id) {
      const existAddr = await db.query(
        'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
        [address_id, userId]
      );
      if (existAddr.length > 0) {
        addressId = existAddr[0].id;
      }
    }

    // 情况2：用户填写了新地址，写入（或更新已有地址）
    if (address && address.contact_name && address.contact_phone && address.province && address.city && address.district && address.detail_address) {
      if (addressId) {
        await db.query(
          `UPDATE user_addresses
           SET contact_name = ?, contact_phone = ?, province = ?, city = ?, district = ?, detail_address = ?, updated_at = NOW()
           WHERE id = ?`,
          [address.contact_name, address.contact_phone, address.province, address.city, address.district, address.detail_address, addressId]
        );
      } else {
        const insertAddress = await db.query(
          `INSERT INTO user_addresses (user_id, contact_name, contact_phone, province, city, district, detail_address, is_default, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [userId, address.contact_name, address.contact_phone, address.province, address.city, address.district, address.detail_address, false]
        );
        addressId = insertAddress.insertId;
      }
    } else if (!addressId) {
      // 代客订单要求用户填写地址，地址不存在则提示
      return res.status(400).json({ success: false, error: '请先填写收货/服务地址' });
    }

    await db.query(
      `UPDATE orders
       SET status = 'confirmed', address_id = ?, updated_at = NOW() WHERE id = ?`,
      [addressId, orderId]
    );

    res.json({
      success: true,
      message: '已确认订单，请完成支付',
      data: { order_id: orderId, status: 'confirmed' }
    });
  } catch (error) {
    console.error('用户确认代客订单错误:', error);
    res.status(500).json({ success: false, error: '确认失败: ' + error.message });
  }
});

/**
 * 获取内部人员免付款待确认订单列表
 * GET /api/admin/internal-orders?status=internal_pending
 */
router.get('/internal-orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const status = req.query.status || 'internal_pending';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(1, parseInt(req.query.pageSize) || 20);
    const offset = (page - 1) * pageSize;

    const whereClause = 'WHERE o.is_internal = 1 AND o.status = ?';
    const params = [status];

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const orders = await db.query(
      `SELECT
         o.id, o.order_id as order_no, o.user_id, o.order_type, o.device_type,
         o.device_model, o.problem_description, o.custom_description, o.images,
         o.service_type, o.device_condition, o.estimated_price, o.actual_price,
         o.status, o.payment_status, o.created_at, o.updated_at,
         u.nickname as user_name, u.phone as user_phone, u.real_name as user_real_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    orders.forEach(order => {
      if (order.images) {
        try {
          order.images = typeof order.images === 'string' ? JSON.parse(order.images) : order.images;
        } catch (e) {
          order.images = [];
        }
      }
    });

    res.json({ success: true, data: { orders, total, page, pageSize } });
  } catch (error) {
    console.error('获取内部订单列表错误:', error);
    res.status(500).json({ success: false, error: '获取内部订单列表失败' });
  }
});

module.exports = router;
