/**
 * 超级管理员路由
 * 包含电子维修业务的核心功能模块
 */
const express = require('express');
const router = express.Router();
const db = require('../database');
const { ROLES, authenticateToken, requireSuperAdmin, authorizeRole, generateToken } = require('../middleware/auth');
const { recordOrderIncome, backfillIncome } = require('../services/incomeService');
// 复用 userRoutes 的头像 URL 归一化：把历史裸域名 /uploads/... 改写为相对路径 /uploads/...，
// 交给前端 normalizeAvatarUrl 拼正确网关前缀，避免后台列表直接渲染脏数据导致 404。
const { sanitizeAvatarUrl } = require('./userRoutes');

/**
 * 后台权限中间件
 * 日常运营（订单/维修/进度/统计等）：admin 与 super_admin 均可访问。
 * 治理性操作（改角色/删用户/删库存/改价格/回填收入等）：仅 super_admin。
 * 用法：router.get('/xxx', authenticateToken, requireManager, ...)   -> 运营级
 *      router.delete('/xxx', authenticateToken, requireSuperAdmin, ...) -> 治理级
 */
const requireManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: '需要先登录' });
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
 * 设备类型ID到名称的映射
 */
const DEVICE_TYPE_MAP = {
  1: '手机', 2: '电脑', 3: '平板', 4: '手表',
  5: '耳机', 6: '相机', 7: '游戏机', 8: '其他'
};

/**
 * 获取设备类型名称
 */
function getDeviceTypeName(typeId, customName) {
  if (typeId === null || typeId === undefined || typeId === '') return '未知';
  // 如果已经是字符串名称，直接返回
  if (typeof typeId === 'string' && isNaN(Number(typeId))) return typeId;
  // 自定义类型（id=0），使用用户填写的名称
  if (Number(typeId) === 0) return (customName && customName.trim()) || '自定义设备';
  return DEVICE_TYPE_MAP[Number(typeId)] || `设备(${typeId})`;
}

/**
 * 格式化金额
 */
function formatMoney(amount) {
  if (amount === null || amount === undefined) return '0.00';
  return Number(amount).toFixed(2);
}

/**
 * 超级管理员登录接口
 * POST /api/super-admin/login
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

    // 验证是否为超级管理员
    if (user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: '无超级管理员权限',
        currentRole: user.role
      });
    }

    // 更新最后登录时间
    await db.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    ).catch(() => {}); // 忽略更新时间失败

    // 生成JWT令牌
    const token = generateToken(user);

    res.json({
      success: true,
      message: '超级管理员登录成功',
      token,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar_url: sanitizeAvatarUrl(user.avatar_url),
        real_name: user.real_name,
        role: user.role,
        phone: user.phone,
        email: user.email
      }
    });
  } catch (error) {
    console.error('超级管理员登录错误:', error);
    res.status(500).json({
      success: false,
      error: '登录失败',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 获取超级管理员个人信息
 * GET /api/super-admin/profile
 */
router.get('/profile', authenticateToken, requireManager, async (req, res) => {
  try {
    const user = await db.query(
      'SELECT id, openid, nickname, avatar_url, real_name, phone, email, role, status, created_at, last_login_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    res.json({
      success: true,
      user: { ...user[0], avatar_url: sanitizeAvatarUrl(user[0].avatar_url) }
    });
  } catch (error) {
    console.error('获取超级管理员信息错误:', error);
    res.status(500).json({
      success: false,
      error: '获取信息失败'
    });
  }
});

/**
 * =============================
 * 维修工单管理模块
 * =============================
 */

/**
 * 获取维修工单列表（分页、搜索、过滤）
 * GET /api/super-admin/repair-orders
 */
router.get('/repair-orders', authenticateToken, requireManager, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    // 搜索条件
    let whereClause = 'WHERE 1=1';
    let params = [];

    // 关键词搜索（订单号、手机号、客户姓名）
    if (req.query.keyword) {
      whereClause += ' AND (o.order_id LIKE ? OR u.phone LIKE ? OR u.real_name LIKE ? OR u.nickname LIKE ?)';
      params.push(`%${req.query.keyword}%`, `%${req.query.keyword}%`, `%${req.query.keyword}%`, `%${req.query.keyword}%`);
    }

    // 状态筛选
    if (req.query.status) {
      whereClause += ' AND o.status = ?';
      params.push(req.query.status);
    }

    // 设备类型筛选
    if (req.query.deviceType) {
      whereClause += ' AND o.device_type = ?';
      params.push(Number(req.query.deviceType));
    }

    // 日期范围筛选
    if (req.query.startDate) {
      whereClause += ' AND o.created_at >= ?';
      params.push(req.query.startDate);
    }
    if (req.query.endDate) {
      whereClause += ' AND o.created_at <= ?';
      params.push(req.query.endDate);
    }

    // 获取总数
    const countRows = await db.query(
      `SELECT COUNT(*) as total
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ${whereClause}`,
      params
    );

    // 获取工单列表（包含分配人员信息）
    const orders = await db.query(
      `SELECT
        o.id, o.order_id, o.user_id, o.order_type, o.device_type, o.device_type_name, o.device_model,
        o.problem_description, o.custom_description, o.service_type, o.status,
        o.estimated_price, o.actual_price, o.created_at, o.updated_at, o.progress,
        o.assigned_to, o.priority,
        u.nickname, u.phone, u.real_name as customer_name, u.avatar_url as customer_avatar,
        t.nickname as assigned_name, t.real_name as assigned_real_name, t.phone as assigned_phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN users t ON o.assigned_to = t.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    // 转换设备类型为名称
    const totalCount = countRows && countRows[0] ? countRows[0].total : 0;
    const processedOrders = (orders || []).map(order => {
      // 合并问题描述字段
      const problemDesc = order.problem_description || order.custom_description || '';
      // 获取分配人员显示名称
      const assignedDisplayName = order.assigned_name || order.assigned_real_name || '';

      return {
        ...order,
        customer_avatar: sanitizeAvatarUrl(order.customer_avatar),
        device_type_name: getDeviceTypeName(order.device_type, order.device_type_name),
        problem_description: problemDesc,
        estimated_price: formatMoney(order.estimated_price),
        actual_price: formatMoney(order.actual_price),
        progress: order.progress || 0,
        device_model: order.device_model || '未知设备',
        assigned_display_name: assignedDisplayName
      };
    });

    res.json({
      success: true,
      data: {
        orders: processedOrders,
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });
  } catch (error) {
    console.error('获取维修工单列表错误:', error);
    console.error('SQL错误:', error.message);
    res.status(500).json({
      success: false,
      error: '获取工单列表失败: ' + error.message
    });
  }
});

/**
 * 获取单个维修工单详情
 * GET /api/super-admin/repair-orders/:orderId
 */
router.get('/repair-orders/:orderId', authenticateToken, requireManager, async (req, res) => {
  try {
    const { orderId } = req.params;

    // 获取工单基本信息
    const order = await db.query(
      `SELECT
        o.*,
        u.nickname, u.phone, u.real_name as customer_name, u.avatar_url as customer_avatar,
        t.nickname as assigned_name, t.real_name as assigned_real_name,
        a.contact_name as address_name, a.contact_phone as address_phone,
        a.province, a.city, a.district, a.detail_address
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN users t ON o.assigned_to = t.id
       LEFT JOIN user_addresses a ON o.address_id = a.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        error: '工单不存在'
      });
    }

    const orderData = order[0];
    const problemDesc = orderData.problem_description || orderData.custom_description || '';

    const processedOrder = {
      ...orderData,
      customer_avatar: sanitizeAvatarUrl(orderData.customer_avatar),
      device_type_name: getDeviceTypeName(orderData.device_type, orderData.device_type_name),
      problem_description: problemDesc,
      device_model: orderData.device_model || '未知设备',
      estimated_price: formatMoney(orderData.estimated_price),
      actual_price: formatMoney(orderData.actual_price),
      progress: orderData.progress || 0,
      assigned_name: orderData.assigned_name || orderData.assigned_real_name || '未分配'
    };

    res.json({
      success: true,
      order: processedOrder
    });
  } catch (error) {
    console.error('获取工单详情错误:', error);
    res.status(500).json({
      success: false,
      error: '获取工单详情失败'
    });
  }
});

/**
 * 更新工单状态
 * PUT /api/super-admin/repair-orders/:orderId/status
 */
router.put('/repair-orders/:orderId/status', authenticateToken, requireManager, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // 验证状态值
    const validStatuses = ['pending', 'quoted', 'confirmed', 'processing', 'completed', 'cancelled', 'review'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: '无效的状态值'
      });
    }

    const result = await db.query(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '工单不存在'
      });
    }

    // 手动置为已完成时，记录交易收入
    if (status === 'completed') {
      await recordOrderIncome(orderId).catch((e) => console.error('记录收入失败:', e));
    }

    res.json({
      success: true,
      message: '工单状态更新成功'
    });
  } catch (error) {
    console.error('更新工单状态错误:', error);
    res.status(500).json({
      success: false,
      error: '更新状态失败'
    });
  }
});

/**
 * 更新工单价格
 * PUT /api/super-admin/repair-orders/:orderId/price
 */
router.put('/repair-orders/:orderId/price', authenticateToken, requireManager, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { estimatedPrice, actualPrice } = req.body;

    const updates = [];
    const values = [];

    if (estimatedPrice !== undefined) {
      updates.push('estimated_price = ?');
      values.push(estimatedPrice);
    }

    if (actualPrice !== undefined) {
      updates.push('actual_price = ?');
      values.push(actualPrice);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有提供价格信息'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(orderId);

    const result = await db.query(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '工单不存在'
      });
    }

    res.json({
      success: true,
      message: '工单价格更新成功'
    });
  } catch (error) {
    console.error('更新工单价格错误:', error);
    res.status(500).json({
      success: false,
      error: '更新价格失败'
    });
  }
});

/**
 * 更新工单进度
 * PUT /api/super-admin/repair-orders/:orderId/progress
 */
router.put('/repair-orders/:orderId/progress', authenticateToken, requireManager, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { progress } = req.body;

    // 验证进度值
    if (progress === undefined || progress === null || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        error: '进度值必须在0-100之间'
      });
    }

    // 尝试更新
    const result = await db.query(
      `UPDATE orders SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [Number(progress), orderId]
    ).catch(() => ({ affectedRows: 0 }));

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '工单不存在或更新失败'
      });
    }

    res.json({
      success: true,
      message: '工单进度更新成功'
    });
  } catch (error) {
    console.error('更新工单进度错误:', error);
    res.status(500).json({
      success: false,
      error: '更新工单进度失败'
    });
  }
});

/**
 * 分配工单给维修人员
 * PUT /api/super-admin/repair-orders/:orderId/assign
 */
router.put('/repair-orders/:orderId/assign', authenticateToken, requireManager, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        success: false,
        error: '维修人员ID不能为空'
      });
    }

    // 验证维修人员是否存在且为admin角色
    const technician = await db.query(
      'SELECT id, role FROM users WHERE id = ?',
      [technicianId]
    );

    if (technician.length === 0) {
      return res.status(404).json({
        success: false,
        error: '维修人员不存在'
      });
    }

    if (technician[0].role !== 'admin' && technician[0].role !== 'super_admin') {
      return res.status(400).json({
        success: false,
        error: '该用户不是维修人员'
      });
    }

    // 尝试更新（assigned_to字段可能不存在）
    // 分配后不自动改为处理中，被分配的维修人员需要先报价
    const result = await db.query(
      `UPDATE orders SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [technicianId, orderId]
    ).catch(() => ({ affectedRows: 0 }));

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '工单不存在或更新失败（可能缺少assigned_to字段）'
      });
    }

    res.json({
      success: true,
      message: '工单分配成功'
    });
  } catch (error) {
    console.error('分配工单错误:', error);
    res.status(500).json({
      success: false,
      error: '分配工单失败'
    });
  }
});

/**
 * =============================
 * 设备状态监控模块
 * =============================
 */

/**
 * 获取设备状态统计
 * GET /api/super-admin/device-stats
 */
router.get('/device-stats', authenticateToken, requireManager, async (req, res) => {
  try {
    // 设备类型分布
    const deviceDistribution = await db.query(`
      SELECT
        device_type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM orders
      GROUP BY device_type
      ORDER BY count DESC
    `);

    // 转换设备类型名称
    const processedDistribution = deviceDistribution.map(item => ({
      ...item,
      device_type_name: getDeviceTypeName(item.device_type)
    }));

    // 今日工单统计
    const todayStats = await db.query(`
      SELECT
        COUNT(*) as total_today,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_today,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_today,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_today
      FROM orders
      WHERE DATE(created_at) = CURDATE()
    `);

    // 本月工单统计
    const monthStats = await db.query(`
      SELECT
        COUNT(*) as total_month,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_month,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_month,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_month,
        SUM(CASE WHEN status = 'completed' THEN actual_price ELSE 0 END) as revenue_month
      FROM orders
      WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())
    `);

    // 故障类型统计（使用 problem_description 代替 fault_desc）
    const faultStats = await db.query(`
      SELECT
        COALESCE(problem_description, custom_description) as fault_short,
        COUNT(*) as count
      FROM orders
      WHERE (problem_description IS NOT NULL AND problem_description != '')
         OR (custom_description IS NOT NULL AND custom_description != '')
      GROUP BY fault_short
      ORDER BY count DESC
      LIMIT 10
    `).catch(() => []);

    // 订单类型统计
    const orderTypeStats = await db.query(`
      SELECT
        order_type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN actual_price ELSE 0 END), 0) as completed_revenue
      FROM orders
      GROUP BY order_type
    `).catch(() => []);

    // 周趋势（最近7天）
    const weekTrend = await db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).catch(() => []);

    res.json({
      success: true,
      data: {
        deviceDistribution: processedDistribution,
        todayStats: todayStats[0] || { total_today: 0, pending_today: 0, processing_today: 0, completed_today: 0 },
        monthStats: monthStats[0] || { total_month: 0, pending_month: 0, processing_month: 0, completed_month: 0, revenue_month: 0 },
        faultStats,
        orderTypeStats,
        weekTrend
      }
    });
  } catch (error) {
    console.error('获取设备统计错误:', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * =============================
 * 备件库存查询模块
 * =============================
 */

/**
 * 获取备件库存列表
 * GET /api/super-admin/parts-inventory
 */
router.get('/parts-inventory', authenticateToken, requireManager, async (req, res) => {
  try {
    const parts = await db.query(`
      SELECT
        id, name, model, category, quantity, unit_price,
        min_quantity, supplier, location, status,
        created_at, updated_at
      FROM parts_inventory
      WHERE 1=1
      ORDER BY created_at DESC
    `).catch(() => []);

    // 如果表不存在或查询失败，返回空数组
    if (!parts || parts.length === 0) {
      return res.json({
        success: true,
        data: {
          parts: [],
          total: 0,
          warningCount: 0
        }
      });
    }

    // 统计库存预警数量
    const warningCount = parts.filter(p => p.quantity <= p.min_quantity).length;

    // 格式化价格
    const processedParts = parts.map(p => ({
      ...p,
      unit_price: formatMoney(p.unit_price)
    }));

    res.json({
      success: true,
      data: {
        parts: processedParts,
        total: processedParts.length,
        warningCount
      }
    });
  } catch (error) {
    console.error('获取备件库存错误:', error);
    res.status(500).json({
      success: false,
      error: '获取库存信息失败'
    });
  }
});

/**
 * 添加备件
 * POST /api/super-admin/parts-inventory
 */
router.post('/parts-inventory', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const {
      name, model, category, quantity, unit_price,
      min_quantity, supplier, location, status
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: '备件名称不能为空'
      });
    }

    const result = await db.query(
      `INSERT INTO parts_inventory
       (name, model, category, quantity, unit_price, min_quantity, supplier, location, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, model, category, quantity || 0, unit_price || 0, min_quantity || 5, supplier, location, status || 'active']
    );

    res.json({
      success: true,
      message: '备件添加成功',
      partId: result.insertId
    });
  } catch (error) {
    console.error('添加备件错误:', error);
    res.status(500).json({
      success: false,
      error: '添加备件失败',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 更新备件库存
 * PUT /api/super-admin/parts-inventory/:partId
 */
router.put('/parts-inventory/:partId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { partId } = req.params;
    const { quantity, unit_price, min_quantity, status, name, model, category, supplier, location } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (model !== undefined) { updates.push('model = ?'); values.push(model); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (quantity !== undefined) { updates.push('quantity = ?'); values.push(quantity); }
    if (unit_price !== undefined) { updates.push('unit_price = ?'); values.push(unit_price); }
    if (min_quantity !== undefined) { updates.push('min_quantity = ?'); values.push(min_quantity); }
    if (supplier !== undefined) { updates.push('supplier = ?'); values.push(supplier); }
    if (location !== undefined) { updates.push('location = ?'); values.push(location); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有提供更新信息'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(partId);

    const result = await db.query(
      `UPDATE parts_inventory SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '备件不存在'
      });
    }

    res.json({
      success: true,
      message: '备件更新成功'
    });
  } catch (error) {
    console.error('更新备件错误:', error);
    res.status(500).json({
      success: false,
      error: '更新备件失败'
    });
  }
});

/**
 * 删除备件
 * DELETE /api/super-admin/parts-inventory/:partId
 */
router.delete('/parts-inventory/:partId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { partId } = req.params;

    const result = await db.query(
      'DELETE FROM parts_inventory WHERE id = ?',
      [partId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '备件不存在'
      });
    }

    res.json({
      success: true,
      message: '备件删除成功'
    });
  } catch (error) {
    console.error('删除备件错误:', error);
    res.status(500).json({
      success: false,
      error: '删除备件失败'
    });
  }
});

/**
 * =============================
 * 维修人员调度模块
 * =============================
 */

/**
 * 获取维修人员列表
 * GET /api/super-admin/technicians
 */
router.get('/technicians', authenticateToken, requireManager, async (req, res) => {
  try {
    // 从users表中查询admin和super_admin角色的用户
    const technicians = await db.query(`
      SELECT
        id, nickname, real_name, phone, email,
        role, status, avatar_url, created_at
      FROM users
      WHERE role IN ('admin', 'super_admin')
      ORDER BY created_at DESC
    `);

    // 为每个维修人员获取工作统计（assigned_to字段可能不存在）
    const technicianStats = await Promise.all(
      technicians.map(async (tech) => {
        const stats = await db.query(`
          SELECT
            COUNT(*) as total_orders,
            SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as active_orders,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
            SUM(CASE WHEN status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as completed_week
          FROM orders
          WHERE assigned_to = ?
        `, [tech.id]).catch(() => [{ total_orders: 0, active_orders: 0, completed_orders: 0, completed_week: 0 }]);

        return {
          ...tech,
          avatar_url: sanitizeAvatarUrl(tech.avatar_url),
          processing_orders: stats[0]?.active_orders || 0,
          completed_orders: stats[0]?.completed_orders || 0,
          total_orders: stats[0]?.total_orders || 0,
          completed_week: stats[0]?.completed_week || 0
        };
      })
    );

    res.json({
      success: true,
      data: {
        technicians: technicianStats,
        total: technicianStats.length
      }
    });
  } catch (error) {
    console.error('获取维修人员列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取维修人员列表失败',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * =============================
 * 综合统计模块
 * =============================
 */

/**
 * 获取综合统计数据
 * GET /api/super-admin/dashboard
 */
router.get('/dashboard', authenticateToken, requireManager, async (req, res) => {
  try {
    // 用户统计
    const userStats = await db.query(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'user' OR role IS NULL THEN 1 ELSE 0 END) as normal_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
        SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as super_admin_users,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_users_week,
        SUM(CASE WHEN last_login_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as active_users_day
      FROM users
    `);

    // 订单统计
    const orderStats = await db.query(`
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as review_orders,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_orders_week
      FROM orders
    `);

    // 收入统计（以交易收入表为准，与"收入"页一致）
    const revenueStats = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND paid_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN amount ELSE 0 END), 0) as monthly_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND paid_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN amount ELSE 0 END), 0) as weekly_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND DATE(paid_at) = CURDATE() THEN amount ELSE 0 END), 0) as daily_revenue
      FROM transaction_income
    `).catch(() => [{ total_revenue: 0, monthly_revenue: 0, weekly_revenue: 0, daily_revenue: 0 }]);

    // 备件库存统计（表可能不存在）
    const partsStats = await db.query(`
      SELECT
        COUNT(*) as total_parts,
        SUM(CASE WHEN quantity <= min_quantity THEN 1 ELSE 0 END) as low_stock_parts,
        SUM(quantity) as total_quantity,
        SUM(quantity * unit_price) as total_value
      FROM parts_inventory
    `).catch(() => [{ total_parts: 0, low_stock_parts: 0, total_quantity: 0, total_value: 0 }]);

    // 最近订单（最近5条）
    const recentOrders = await db.query(`
      SELECT
        o.id, o.order_id, o.device_type, o.device_model, o.status,
        o.estimated_price, o.actual_price, o.created_at,
        u.nickname as customer_name, u.phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `).catch(() => []);

    // 最近注册用户（最近5个）
    const recentUsers = await db.query(`
      SELECT id, nickname, phone, role, avatar_url, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `).catch(() => []);

    res.json({
      success: true,
      data: {
        users: userStats[0],
        orders: orderStats[0],
        revenue: revenueStats[0],
        parts: partsStats[0],
        recentOrders: recentOrders.map(o => ({
          ...o,
          device_type_name: getDeviceTypeName(o.device_type)
        })),
        recentUsers,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('获取综合统计错误:', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * =============================
 * 交易收入模块
 * =============================
 */

/**
 * 获取交易收入汇总与明细列表
 * GET /api/super-admin/income
 * query: page, pageSize, orderType(repair|recycle), keyword(订单号)
 */
router.get('/income', authenticateToken, requireManager, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    const orderType = req.query.orderType || '';
    const keyword = (req.query.keyword || '').trim();
    const offset = (page - 1) * pageSize;

    // 关联 orders 表，以支持按"维修产品(device_model)、绑定订单ID、用户名"模糊搜索
    const joinsSql = `
      LEFT JOIN orders o ON ti.order_id = o.id
      LEFT JOIN users u ON ti.user_id = u.id`;

    const where = [];
    const params = [];
    if (orderType) { where.push('ti.order_type = ?'); params.push(orderType); }
    if (keyword) {
      // 模糊匹配：绑定订单ID、订单号、维修产品、用户名
      const kw = `%${keyword}%`;
      where.push('(ti.order_id LIKE ? OR ti.order_no LIKE ? OR o.device_model LIKE ? OR u.nickname LIKE ? OR u.real_name LIKE ?)');
      params.push(kw, kw, kw, kw, kw);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRows = await db.query(
      `SELECT COUNT(*) AS c FROM transaction_income ti ${joinsSql} ${whereSql}`,
      params
    );
    const total = totalRows[0].c;

    const list = await db.query(
      `SELECT
         ti.id, ti.order_id, ti.order_no, ti.user_id, ti.order_type, ti.service_type,
         ti.income_type, ti.amount, ti.payment_status, ti.out_trade_no, ti.paid_at,
         u.nickname, u.real_name
       FROM transaction_income ti ${joinsSql}
       ${whereSql}
       ORDER BY ti.paid_at DESC, ti.id DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const stats = await db.query(
      `SELECT
         COUNT(*) AS record_count,
         COALESCE(SUM(ti.amount), 0) AS total_income,
         COALESCE(SUM(CASE WHEN ti.payment_status = 'paid' THEN ti.amount ELSE 0 END), 0) AS paid_income,
         COALESCE(SUM(CASE WHEN ti.payment_status = 'partial_refunded' THEN ti.amount ELSE 0 END), 0) AS refunded_income,
         COALESCE(SUM(CASE WHEN DATE(ti.paid_at) = CURDATE() THEN ti.amount ELSE 0 END), 0) AS daily_income,
         COALESCE(SUM(CASE WHEN ti.paid_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN ti.amount ELSE 0 END), 0) AS monthly_income,
         COALESCE(SUM(CASE WHEN ti.order_type = 'repair' THEN ti.amount ELSE 0 END), 0) AS repair_income,
         COALESCE(SUM(CASE WHEN ti.order_type = 'recycle' THEN ti.amount ELSE 0 END), 0) AS recycle_income,
         COALESCE(SUM(CASE WHEN ti.service_type = 'shop' THEN ti.amount ELSE 0 END), 0) AS shop_income,
         COALESCE(SUM(CASE WHEN ti.service_type = 'door-to-door' THEN ti.amount ELSE 0 END), 0) AS door_to_door_income,
         COALESCE(AVG(ti.amount), 0) AS avg_amount
       FROM transaction_income ti ${joinsSql} ${whereSql}`,
      params
    );

    // 按支付渠道分布
    const byChannel = await db.query(
      `SELECT
         COALESCE(ti.payment_channel, 'unknown') AS channel,
         COUNT(*) AS cnt,
         COALESCE(SUM(ti.amount), 0) AS amount
       FROM transaction_income ti ${joinsSql} ${whereSql}
       GROUP BY ti.payment_channel
       ORDER BY amount DESC`,
      params
    );

    // 近 6 个月收入趋势
    const monthlyTrend = await db.query(
      `SELECT
         DATE_FORMAT(ti.paid_at, '%Y-%m') AS month,
         COUNT(*) AS cnt,
         COALESCE(SUM(ti.amount), 0) AS amount
       FROM transaction_income ti ${joinsSql} ${whereSql}
       ${whereSql ? 'AND' : 'WHERE'} ti.paid_at IS NOT NULL
       GROUP BY DATE_FORMAT(ti.paid_at, '%Y-%m')
       ORDER BY month DESC
       LIMIT 6`,
      params
    );

    const s = stats[0] || {};
    const num = (v) => Number(v || 0).toFixed(2);
    res.json({
      success: true,
      data: {
        list: list.map((it) => ({
          ...it,
          customer_name: it.real_name || it.nickname || '客户',
          amount: Number(it.amount || 0).toFixed(2)
        })),
        stats: {
          record_count: s.record_count || 0,
          total_income: num(s.total_income),
          paid_income: num(s.paid_income),
          refunded_income: num(s.refunded_income),
          daily_income: num(s.daily_income),
          monthly_income: num(s.monthly_income),
          repair_income: num(s.repair_income),
          recycle_income: num(s.recycle_income),
          shop_income: num(s.shop_income),
          door_to_door_income: num(s.door_to_door_income),
          avg_amount: num(s.avg_amount)
        },
        by_channel: (byChannel || []).map((c) => ({
          channel: c.channel,
          cnt: c.cnt || 0,
          amount: num(c.amount)
        })),
        // 近 6 个月收入趋势：补齐最近 6 个自然月（无数据的月份记为 0），
        // 避免出现“跨年重复月份(如两个3月)”或不足 6 个月的问题
        monthly_trend: (() => {
          const monthMap = {};
          (monthlyTrend || []).forEach((m) => { monthMap[m.month] = m; });
          const filled = [];
          const now = new Date();
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const src = monthMap[key];
            filled.push({
              month: key,
              month_label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
              cnt: src ? (src.cnt || 0) : 0,
              amount: num(src ? src.amount : 0)
            });
          }
          return filled;
        })(),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取收入数据错误:', error);
    res.status(500).json({ success: false, error: '获取收入数据失败' });
  }
});

/**
 * 手动触发历史订单收入回填
 * POST /api/super-admin/income/backfill
 */
router.post('/income/backfill', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const result = await backfillIncome();
    const { inserted = 0, fixed = 0 } = result || {};
    const parts = [];
    if (inserted > 0) parts.push(`新增 ${inserted} 条`);
    if (fixed > 0) parts.push(`修正 ${fixed} 条`);
    const message = parts.length ? `收入回填完成：${parts.join('，')}` : '没有需要回填的收入';
    res.json({ success: true, message, data: { count: inserted + fixed, inserted, fixed } });
  } catch (error) {
    console.error('收入回填错误:', error);
    res.status(500).json({ success: false, error: '收入回填失败' });
  }
});

/**
 * =============================
 * 用户管理模块
 * =============================
 */

/**
 * 获取用户列表
 * GET /api/super-admin/users
 */
router.get('/users', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const role = req.query.role;
    const keyword = req.query.keyword;

    let whereClause = 'WHERE 1=1';
    let params = [];

    // 角色筛选
    if (role && role !== 'all' && role !== '') {
      whereClause += ' AND (role = ? OR role IS NULL)';
      params.push(role);
    }

    // 关键词搜索
    if (keyword && keyword.trim()) {
      whereClause += ' AND (nickname LIKE ? OR phone LIKE ? OR real_name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    // 获取总数
    const countRows = await db.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );

    // 获取用户列表
    const users = await db.query(
      `SELECT 
        id, openid, nickname, avatar_url, real_name, phone, email, 
        IFNULL(role, 'user') as role, IFNULL(status, 1) as status, 
        created_at, last_login_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      params
    );

    const totalCount = countRows && countRows[0] ? countRows[0].total : 0;

    const sanitizedUsers = (users || []).map(u => ({
      ...u,
      avatar_url: sanitizeAvatarUrl(u.avatar_url)
    }));

    res.json({
      success: true,
      data: {
        users: sanitizedUsers,
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    console.error('SQL错误:', error.message);
    res.status(500).json({
      success: false,
      error: '获取用户列表失败: ' + error.message
    });
  }
});

/**
 * 修改用户角色
 * PUT /api/super-admin/users/:userId/role
 */
router.put('/users/:userId/role', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin', 'internal', 'repair'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: '无效的角色值'
      });
    }

    // 不允许将用户设置为超级管理员
    if (role === 'super_admin') {
      return res.status(400).json({
        success: false,
        error: '不能将用户设置为超级管理员'
      });
    }

    // 不允许修改自己的角色
    if (Number(userId) === Number(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: '不能修改自己的角色'
      });
    }

    // 超级管理员角色受保护，不允许被修改
    const targetRows = await db.query('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (targetRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    if (targetRows[0].role === 'super_admin') {
      return res.status(400).json({
        success: false,
        error: '不能修改超级管理员的角色'
      });
    }

    const result = await db.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '角色更新成功'
    });
  } catch (error) {
    console.error('修改用户角色错误:', error);
    res.status(500).json({
      success: false,
      error: '修改角色失败'
    });
  }
});

/**
 * 禁用/启用用户
 * PUT /api/super-admin/users/:userId/status
 */
router.put('/users/:userId/status', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // 不允许禁用自己
    if (Number(userId) === Number(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: '不能禁用自己'
      });
    }

    // 超级管理员账号受保护，不允许被禁用
    const targetRows = await db.query('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (targetRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    if (targetRows[0].role === 'super_admin') {
      return res.status(400).json({
        success: false,
        error: '不能禁用超级管理员账号'
      });
    }

    const result = await db.query(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: status === 0 ? '用户已禁用' : '用户已启用'
    });
  } catch (error) {
    console.error('修改用户状态错误:', error);
    res.status(500).json({
      success: false,
      error: '修改用户状态失败'
    });
  }
});

/**
 * 获取用户详情
 * GET /api/super-admin/users/:userId
 */
router.get('/users/:userId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const users = await db.query(
      `SELECT 
        id, openid, nickname, avatar_url, real_name, phone, email, 
        gender, country, province, city, language, role, status,
        created_at, updated_at, last_login_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: { ...users[0], avatar_url: sanitizeAvatarUrl(users[0].avatar_url) }
    });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({
      success: false,
      error: '获取用户详情失败'
    });
  }
});

/**
 * 编辑用户信息
 * PUT /api/super-admin/users/:userId
 */
router.put('/users/:userId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { nickname, real_name, phone, email, gender, country, province, city, role, status } = req.body;

    // 验证手机号格式
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: '手机号格式不正确'
      });
    }

    // 验证邮箱格式
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: '邮箱格式不正确'
      });
    }

    // 验证角色（不允许设置为超级管理员）
    if (role && !['user', 'admin', 'internal', 'repair'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: '无效的角色值'
      });
    }
    if (role === 'super_admin') {
      return res.status(400).json({
        success: false,
        error: '不能将用户设置为超级管理员'
      });
    }

    // 验证状态
    if (status !== undefined && ![0, 1].includes(status)) {
      return res.status(400).json({
        success: false,
        error: '无效的状态值'
      });
    }

    // 不允许修改自己的角色和状态
    if (Number(userId) === Number(req.user.id)) {
      if (role !== undefined || status !== undefined) {
        return res.status(400).json({
          success: false,
          error: '不能修改自己的角色和状态'
        });
      }
    }

    // 检查用户是否存在
    const existingUser = await db.query(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    // 检查手机号是否已被其他用户使用
    if (phone) {
      const phoneExists = await db.query(
        'SELECT id FROM users WHERE phone = ? AND id != ?',
        [phone, userId]
      );

      if (phoneExists.length > 0) {
        return res.status(400).json({
          success: false,
          error: '手机号已被其他用户使用'
        });
      }
    }

    // 检查邮箱是否已被其他用户使用
    if (email) {
      const emailExists = await db.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (emailExists.length > 0) {
        return res.status(400).json({
          success: false,
          error: '邮箱已被其他用户使用'
        });
      }
    }

    // 构建更新字段
    const updates = [];
    const values = [];

    if (nickname !== undefined) {
      updates.push('nickname = ?');
      values.push(nickname);
    }

    if (real_name !== undefined) {
      updates.push('real_name = ?');
      values.push(real_name);
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }

    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }

    if (gender !== undefined) {
      updates.push('gender = ?');
      values.push(gender);
    }

    if (country !== undefined) {
      updates.push('country = ?');
      values.push(country);
    }

    if (province !== undefined) {
      updates.push('province = ?');
      values.push(province);
    }

    if (city !== undefined) {
      updates.push('city = ?');
      values.push(city);
    }

    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: '用户信息更新成功'
    });
  } catch (error) {
    console.error('编辑用户信息错误:', error);
    res.status(500).json({
      success: false,
      error: '编辑用户信息失败'
    });
  }
});

/**
 * 创建新用户
 * POST /api/super-admin/users
 */
router.post('/users', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { nickname, real_name, phone, email, gender, country, province, city, role, status } = req.body;

    // 验证必填字段
    if (!nickname || !nickname.trim()) {
      return res.status(400).json({
        success: false,
        error: '昵称不能为空'
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        error: '手机号不能为空'
      });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: '手机号格式不正确'
      });
    }

    // 验证邮箱格式
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: '邮箱格式不正确'
      });
    }

    // 验证角色（创建用户不允许设置为超级管理员）
    if (role && !['user', 'admin', 'internal', 'repair'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: '无效的角色值'
      });
    }
    if (role === 'super_admin') {
      return res.status(400).json({
        success: false,
        error: '不能创建超级管理员账号'
      });
    }

    // 验证状态
    if (status !== undefined && ![0, 1].includes(status)) {
      return res.status(400).json({
        success: false,
        error: '无效的状态值'
      });
    }

    // 检查手机号是否已存在
    const phoneExists = await db.query(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    );

    if (phoneExists.length > 0) {
      return res.status(400).json({
        success: false,
        error: '手机号已被使用'
      });
    }

    // 检查邮箱是否已存在
    if (email) {
      const emailExists = await db.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (emailExists.length > 0) {
        return res.status(400).json({
          success: false,
          error: '邮箱已被使用'
        });
      }
    }

    // 创建用户
    const result = await db.query(
      `INSERT INTO users (
        openid, nickname, avatar_url, real_name, phone, email,
        gender, country, province, city, language, role, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        '', // openid - 暂时为空，后续可以通过微信登录填充
        nickname.trim(),
        '', // avatar_url - 使用默认头像
        real_name ? real_name.trim() : null,
        phone.trim(),
        email ? email.trim() : null,
        gender !== undefined ? gender : 0,
        country || null,
        province || null,
        city || null,
        'zh',
        role || 'user',
        status !== undefined ? status : 1
      ]
    );

    res.json({
      success: true,
      message: '用户创建成功',
      data: {
        userId: result.insertId
      }
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      success: false,
      error: '创建用户失败'
    });
  }
});

/**
 * 删除用户
 * DELETE /api/super-admin/users/:userId
 */
router.delete('/users/:userId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // 不允许删除自己
    if (Number(userId) === Number(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: '不能删除自己'
      });
    }

    // 检查用户是否存在
    const existingUser = await db.query(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    // 不允许删除超级管理员账号
    if (existingUser[0].role === 'super_admin') {
      return res.status(400).json({
        success: false,
        error: '不能删除超级管理员账号'
      });
    }

    await db.query(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      error: '删除用户失败'
    });
  }
});

/**
 * 获取系统日志/操作记录
 * GET /api/super-admin/activity-log
 */
router.get('/activity-log', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    // 获取最近的订单变更作为活动日志
    const recentOrders = await db.query(`
      SELECT
        o.id, o.order_id, o.status, o.updated_at as action_time,
        o.device_type, o.problem_description,
        u.nickname as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.updated_at DESC
      LIMIT ? OFFSET ?
    `, [pageSize, offset]).catch(() => []);

    // 获取最近的用户注册
    const recentUsers = await db.query(`
      SELECT id, nickname, role, created_at as action_time, 'user_register' as action_type
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `).catch(() => []);

    res.json({
      success: true,
      data: {
        recentOrders: recentOrders.map(o => ({
          ...o,
          device_type_name: getDeviceTypeName(o.device_type)
        })),
        recentUsers,
        total: recentOrders.length + recentUsers.length
      }
    });
  } catch (error) {
    console.error('获取活动日志错误:', error);
    res.status(500).json({
      success: false,
      error: '获取活动日志失败'
    });
  }
});

// ===================== 设备类型管理 =====================
// device_types 表由 repair.sql 创建，这里提供 CRUD 供管理员维护设备目录
router.get('/device-types', authenticateToken, requireManager, async (req, res) => {
  try {
    const rows = await db.query(
      'SELECT id, name, icon, created_at FROM device_types ORDER BY id ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('获取设备类型失败:', err);
    res.status(500).json({ success: false, message: '获取设备类型失败' });
  }
});

router.post('/device-types', authenticateToken, requireManager, async (req, res) => {
  try {
    const { name, icon } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: '设备类型名称不能为空' });
    }
    const result = await db.query(
      'INSERT INTO device_types (name, icon) VALUES (?, ?)',
      [String(name).trim(), icon || '']
    );
    res.json({ success: true, data: { id: result.insertId, name: String(name).trim(), icon: icon || '' } });
  } catch (err) {
    console.error('创建设备类型失败:', err);
    res.status(500).json({ success: false, message: '创建设备类型失败' });
  }
});

router.put('/device-types/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const { name, icon } = req.body || {};
    await db.query(
      'UPDATE device_types SET name = ?, icon = ? WHERE id = ?',
      [name, icon || '', req.params.id]
    );
    res.json({ success: true, data: { id: Number(req.params.id), name, icon } });
  } catch (err) {
    console.error('更新设备类型失败:', err);
    res.status(500).json({ success: false, message: '更新设备类型失败' });
  }
});

router.delete('/device-types/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    await db.query('DELETE FROM device_types WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除设备类型失败:', err);
    res.status(500).json({ success: false, message: '删除设备类型失败' });
  }
});

// ===================== 维修价格管理 =====================
// prices 表由 migrations/009_prices_table.sql 创建
router.get('/prices', authenticateToken, requireManager, async (req, res) => {
  try {
    const rows = await db.query(
      'SELECT id, device_type, fault_category, device_model, price, description, created_at, updated_at FROM prices ORDER BY id DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('获取价格失败:', err);
    res.status(500).json({ success: false, message: '获取价格失败' });
  }
});

router.post('/prices', authenticateToken, requireManager, async (req, res) => {
  try {
    const { device_type, fault_category, device_model, price, description } = req.body || {};
    if (!device_type || !fault_category) {
      return res.status(400).json({ success: false, message: '设备类型和故障类别不能为空' });
    }
    const result = await db.query(
      'INSERT INTO prices (device_type, fault_category, device_model, price, description) VALUES (?, ?, ?, ?, ?)',
      [device_type, fault_category, device_model || '', price || 0, description || '']
    );
    res.json({
      success: true,
      data: { id: result.insertId, device_type, fault_category, device_model, price, description }
    });
  } catch (err) {
    console.error('创建价格失败:', err);
    res.status(500).json({ success: false, message: '创建价格失败' });
  }
});

router.put('/prices/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const { device_type, fault_category, device_model, price, description } = req.body || {};
    await db.query(
      'UPDATE prices SET device_type = ?, fault_category = ?, device_model = ?, price = ?, description = ? WHERE id = ?',
      [device_type, fault_category, device_model || '', price || 0, description || '', req.params.id]
    );
    res.json({
      success: true,
      data: { id: Number(req.params.id), device_type, fault_category, device_model, price, description }
    });
  } catch (err) {
    console.error('更新价格失败:', err);
    res.status(500).json({ success: false, message: '更新价格失败' });
  }
});

router.delete('/prices/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    await db.query('DELETE FROM prices WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除价格失败:', err);
    res.status(500).json({ success: false, message: '删除价格失败' });
  }
});

module.exports = router;
