const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const db = require('../database.js');

/**
 * 获取配送员列表
 * GET /api/delivery/persons
 */
router.get('/persons', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const isAvailable = req.query.available;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (isAvailable === 'true') {
      whereClause += ' AND is_available = 1';
    }

    // 查询总数
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM delivery_persons ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询配送员列表
    const persons = await db.query(
      `SELECT
        dp.id,
        dp.user_id,
        dp.name,
        dp.phone,
        dp.vehicle_type,
        dp.vehicle_plate,
        dp.is_available,
        dp.rating,
        dp.total_deliveries,
        dp.current_orders,
        u.nickname as user_nickname,
        u.avatar_url as user_avatar,
        dp.created_at
       FROM delivery_persons dp
       LEFT JOIN users u ON dp.user_id = u.id
       ${whereClause}
       ORDER BY dp.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      success: true,
      data: {
        persons,
        total,
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('获取配送员列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取配送员列表失败: ' + error.message
    });
  }
});

/**
 * 添加配送员
 * POST /api/delivery/persons
 */
router.post('/persons', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      user_id,
      name,
      phone,
      id_card,
      vehicle_type,
      vehicle_plate,
      is_available
    } = req.body;

    // 验证必填字段
    if (!user_id || !name || !phone) {
      return res.status(400).json({
        success: false,
        error: '用户ID、姓名和电话不能为空'
      });
    }

    // 检查用户是否存在
    const user = await db.query(
      'SELECT id, role FROM users WHERE id = ?',
      [user_id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    // 检查是否已经是配送员
    const existing = await db.query(
      'SELECT id FROM delivery_persons WHERE user_id = ?',
      [user_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: '该用户已经是配送员'
      });
    }

    // 插入配送员
    const result = await db.query(
      `INSERT INTO delivery_persons (
        user_id, name, phone, id_card, vehicle_type,
        vehicle_plate, is_available, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        user_id,
        name,
        phone,
        id_card || '',
        vehicle_type || '',
        vehicle_plate || '',
        is_available !== undefined ? (is_available ? 1 : 0) : 1
      ]
    );

    res.json({
      success: true,
      message: '配送员添加成功',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('添加配送员错误:', error);
    res.status(500).json({
      success: false,
      error: '添加配送员失败: ' + error.message
    });
  }
});

/**
 * 更新配送员信息
 * PUT /api/delivery/persons/:id
 */
router.put('/persons/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const {
      name,
      phone,
      id_card,
      vehicle_type,
      vehicle_plate,
      is_available
    } = req.body;

    // 检查配送员是否存在
    const person = await db.query(
      'SELECT id FROM delivery_persons WHERE id = ?',
      [personId]
    );

    if (person.length === 0) {
      return res.status(404).json({
        success: false,
        error: '配送员不存在'
      });
    }

    // 更新配送员信息
    await db.query(
      `UPDATE delivery_persons
       SET name = ?,
           phone = ?,
           id_card = ?,
           vehicle_type = ?,
           vehicle_plate = ?,
           is_available = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        name || '',
        phone || '',
        id_card || '',
        vehicle_type || '',
        vehicle_plate || '',
        is_available !== undefined ? (is_available ? 1 : 0) : undefined,
        personId
      ]
    );

    res.json({
      success: true,
      message: '配送员信息更新成功'
    });
  } catch (error) {
    console.error('更新配送员错误:', error);
    res.status(500).json({
      success: false,
      error: '更新配送员失败: ' + error.message
    });
  }
});

/**
 * 分配配送员
 * PUT /api/delivery/orders/:orderId/assign
 */
router.put('/orders/:orderId/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { delivery_person_id, delivery_address_id, delivery_fee } = req.body;

    // 验证必填字段
    if (!delivery_person_id) {
      return res.status(400).json({
        success: false,
        error: '配送员ID不能为空'
      });
    }

    // 检查订单是否存在
    const order = await db.query(
      'SELECT id, status, user_id, delivery_status FROM orders WHERE id = ?',
      [orderId]
    );

    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    if (order[0].status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: '只有已完成的订单可以分配配送'
      });
    }

    if (order[0].delivery_status === 'delivered') {
      return res.status(400).json({
        success: false,
        error: '订单已送达，无法重新分配'
      });
    }

    // 检查配送员是否存在且可用
    const deliveryPerson = await db.query(
      'SELECT id, name, phone, is_available, current_orders FROM delivery_persons WHERE id = ?',
      [delivery_person_id]
    );

    if (deliveryPerson.length === 0) {
      return res.status(404).json({
        success: false,
        error: '配送员不存在'
      });
    }

    if (!deliveryPerson[0].is_available) {
      return res.status(400).json({
        success: false,
        error: '配送员当前不可用'
      });
    }

    // 更新订单配送信息
    await db.query(
      `UPDATE orders
       SET delivery_status = 'assigned',
           delivery_address_id = ?,
           delivery_person_id = ?,
           delivery_person_name = ?,
           delivery_person_phone = ?,
           delivery_fee = ?,
           delivery_assigned_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [
        delivery_address_id || null,
        delivery_person_id,
        deliveryPerson[0].name,
        deliveryPerson[0].phone,
        delivery_fee || 0,
        orderId
      ]
    );

    // 增加配送员的当前订单数
    await db.query(
      'UPDATE delivery_persons SET current_orders = current_orders + 1 WHERE id = ?',
      [delivery_person_id]
    );

    res.json({
      success: true,
      message: '配送员分配成功'
    });
  } catch (error) {
    console.error('分配配送员错误:', error);
    res.status(500).json({
      success: false,
      error: '分配配送员失败: ' + error.message
    });
  }
});

/**
 * 更新配送状态
 * PUT /api/delivery/orders/:orderId/status
 */
router.put('/orders/:orderId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { status, tracking_number, delivery_notes } = req.body;

    // 验证状态
    const validStatuses = ['pending', 'assigned', 'shipped', 'delivered', 'returned'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: '无效的配送状态'
      });
    }

    // 检查订单是否存在
    const order = await db.query(
      'SELECT id, delivery_status, delivery_person_id FROM orders WHERE id = ?',
      [orderId]
    );

    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const currentStatus = order[0].delivery_status;

    // 状态转换验证
    const statusTransitions = {
      'none': ['pending', 'assigned'],
      'pending': ['assigned', 'returned'],
      'assigned': ['shipped', 'returned'],
      'shipped': ['delivered', 'returned'],
      'delivered': [], // 已送达不能再改变状态
      'returned': [] // 已退回不能再改变状态
    };

    if (currentStatus && !statusTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `无法从 ${currentStatus} 状态变更为 ${status} 状态`
      });
    }

    // 更新订单配送状态
    let updateFields = [
      'delivery_status = ?',
      'updated_at = NOW()'
    ];
    let updateValues = [status];

    if (status === 'shipped') {
      updateFields.push('delivery_shipped_at = NOW()');
    } else if (status === 'delivered') {
      updateFields.push('delivery_delivered_at = NOW()');
    }

    if (tracking_number) {
      updateFields.push('tracking_number = ?');
      updateValues.push(tracking_number);
    }

    if (delivery_notes) {
      updateFields.push('delivery_notes = ?');
      updateValues.push(delivery_notes);
    }

    updateValues.push(orderId);

    await db.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // 如果订单已送达，减少配送员的当前订单数并增加总配送次数
    if (status === 'delivered' && order[0].delivery_person_id) {
      await db.query(
        `UPDATE delivery_persons
         SET current_orders = GREATEST(current_orders - 1, 0),
             total_deliveries = total_deliveries + 1
         WHERE id = ?`,
        [order[0].delivery_person_id]
      );
    }

    res.json({
      success: true,
      message: '配送状态更新成功'
    });
  } catch (error) {
    console.error('更新配送状态错误:', error);
    res.status(500).json({
      success: false,
      error: '更新配送状态失败: ' + error.message
    });
  }
});

/**
 * 获取订单的配送信息
 * GET /api/delivery/orders/:orderId
 */
router.get('/orders/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const userId = req.user.id;
    const userRole = req.user.role;

    // 检查订单权限
    const order = await db.query(
      'SELECT id, user_id, delivery_person_id FROM orders WHERE id = ?',
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
    const isDeliveryPerson = order[0].delivery_person_id === userId;

    if (!isAdmin && !isOwner && !isDeliveryPerson) {
      return res.status(403).json({
        success: false,
        error: '无权限查看此订单的配送信息'
      });
    }

    // 查询订单配送信息
    const orders = await db.query(
      `SELECT
        o.id as order_id,
        o.order_id as order_no,
        o.delivery_status,
        o.delivery_address_id,
        o.delivery_person_id,
        o.delivery_person_name,
        o.delivery_person_phone,
        o.tracking_number,
        o.delivery_fee,
        o.delivery_assigned_at,
        o.delivery_shipped_at,
        o.delivery_delivered_at,
        o.delivery_notes,
        ua.contact_name as addr_contact_name,
        ua.contact_phone as addr_contact_phone,
        ua.province as addr_province,
        ua.city as addr_city,
        ua.district as addr_district,
        ua.detail_address as addr_detail,
        dp.vehicle_type,
        dp.vehicle_plate
       FROM orders o
       LEFT JOIN user_addresses ua ON o.delivery_address_id = ua.id
       LEFT JOIN delivery_persons dp ON o.delivery_person_id = dp.id
       WHERE o.id = ?`,
      [orderId]
    );

    const deliveryInfo = orders[0];

    res.json({
      success: true,
      data: deliveryInfo
    });
  } catch (error) {
    console.error('获取配送信息错误:', error);
    res.status(500).json({
      success: false,
      error: '获取配送信息失败: ' + error.message
    });
  }
});

/**
 * 获取配送员的工作订单列表
 * GET /api/delivery/persons/:personId/orders
 */
router.get('/persons/:personId/orders', authenticateToken, async (req, res) => {
  try {
    const personId = parseInt(req.params.personId);
    const userId = req.user.id;
    const userRole = req.user.role;

    // 检查权限
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';
    const isDeliveryPerson = userId === personId;

    if (!isAdmin && !isDeliveryPerson) {
      return res.status(403).json({
        success: false,
        error: '无权限查看此配送员的工作订单'
      });
    }

    // 查询配送员的工作订单
    const orders = await db.query(
      `SELECT
        o.id,
        o.order_id as order_no,
        o.user_id,
        o.status as order_status,
        o.delivery_status,
        o.delivery_fee,
        o.delivery_assigned_at,
        o.delivery_shipped_at,
        o.delivery_delivered_at,
        o.delivery_notes,
        u.nickname as user_name,
        u.phone as user_phone,
        ua.contact_name as addr_contact_name,
        ua.contact_phone as addr_contact_phone,
        ua.province as addr_province,
        ua.city as addr_city,
        ua.district as addr_district,
        ua.detail_address as addr_detail
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN user_addresses ua ON o.delivery_address_id = ua.id
       WHERE o.delivery_person_id = ?
       ORDER BY o.delivery_assigned_at DESC`,
      [personId]
    );

    res.json({
      success: true,
      data: {
        orders,
        total: orders.length
      }
    });
  } catch (error) {
    console.error('获取配送员工作订单错误:', error);
    res.status(500).json({
      success: false,
      error: '获取配送员工作订单失败: ' + error.message
    });
  }
});

module.exports = router;
