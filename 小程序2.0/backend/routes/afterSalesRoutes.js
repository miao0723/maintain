// backend/routes/afterSalesRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const db = require('../database.js');
const { computeWarranty, warrantyStatus, generateAdvice } = require('../utils/afterSales');

// 售后类型映射
const AFTER_SALES_TYPE_MAP = {
  repair: '维修',
  replace: '换货',
  return: '退货',
  other: '其他'
};

/**
 * 售后状态映射
 */
const AFTER_SALES_STATUS_MAP = {
  pending: { label: '待处理', color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
  processing: { label: '处理中', color: '#3b82f6', bg: '#dbeafe', icon: '🔧' },
  resolved: { label: '已解决', color: '#10b981', bg: '#d1fae5', icon: '✅' },
  rejected: { label: '已拒绝', color: '#ef4444', bg: '#fee2e2', icon: '❌' }
};

// 解析 images JSON
function parseImages(imgs) {
  if (!imgs) return [];
  if (Array.isArray(imgs)) return imgs;
  try {
    const arr = JSON.parse(imgs);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

/**
 * 发起售后申请（针对已完成 / 待评价订单的具体产品）
 * POST /api/after-sales/request
 */
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_id, product_name, product_model, type, description, contact_phone, images } = req.body;

    if (!order_id) {
      return res.status(400).json({ success: false, error: '缺少订单ID' });
    }
    if (!product_name || !String(product_name).trim()) {
      return res.status(400).json({ success: false, error: '请填写售后产品' });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ success: false, error: '请填写问题描述' });
    }

    const orders = await db.query(
      'SELECT id, status, order_id, device_model, user_id FROM orders WHERE id = ?',
      [order_id]
    );
    if (orders.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }
    const order = orders[0];
    if (order.status !== 'completed' && order.status !== 'review') {
      return res.status(400).json({ success: false, error: '仅已完成或待评价的订单可申请售后' });
    }

    const validTypes = ['repair', 'replace', 'return', 'other'];
    const reqType = validTypes.includes(type) ? type : 'repair';

    const insertRes = await db.query(
      `INSERT INTO after_sales_requests
        (order_id, user_id, product_name, product_model, type, description, contact_phone, images, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        order_id,
        userId,
        String(product_name).trim(),
        product_model || order.device_model || '',
        reqType,
        String(description).trim(),
        contact_phone || '',
        images || []
      ]
    );

    const created = await db.query('SELECT * FROM after_sales_requests WHERE id = ?', [insertRes.insertId]);
    res.json({ success: true, data: created[0], message: '售后申请已提交，管理员会尽快处理' });
  } catch (error) {
    console.error('创建售后申请错误:', error);
    res.status(500).json({ success: false, error: '提交售后申请失败' });
  }
});

/**
 * 售后申请统计（用于红点提醒）
 * GET /api/after-sales/requests/stats
 */
router.get('/requests/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rows = await db.query(
      'SELECT status, COUNT(*) as count FROM after_sales_requests GROUP BY status'
    );
    const stats = { total: 0, pending: 0, processing: 0, resolved: 0, rejected: 0 };
    rows.forEach(r => {
      if (stats[r.status] !== undefined) stats[r.status] = r.count;
      stats.total += r.count;
    });
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('售后统计错误:', error);
    res.status(500).json({ success: false, error: '获取售后统计失败' });
  }
});

/**
 * 售后申请列表（管理员 / 超级管理员）
 * GET /api/after-sales/requests
 */
router.get('/requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, keyword, page = 1, pageSize = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const size = Math.min(100, parseInt(pageSize) || 20);
    const offset = (pageNum - 1) * size;

    const where = [];
    const params = [];
    if (status) {
      where.push('r.status = ?');
      params.push(status);
    }
    if (keyword) {
      const kw = `%${keyword}%`;
      where.push('(o.order_id LIKE ? OR r.product_name LIKE ? OR u.nickname LIKE ? OR u.real_name LIKE ?)');
      params.push(kw, kw, kw, kw);
    }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const list = await db.query(
      `SELECT r.*, o.order_id as order_no, o.device_model as order_device_model, o.status as order_status,
              u.nickname as user_nickname, u.real_name as user_real_name, u.phone as user_phone
       FROM after_sales_requests r
       LEFT JOIN orders o ON o.id = r.order_id
       LEFT JOIN users u ON u.id = r.user_id
       ${whereSql}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, size, offset]
    );

    const [totalRow] = await db.query(
      `SELECT COUNT(*) as total FROM after_sales_requests r ${whereSql}`,
      params
    );

    const rows = list.map(r => ({
      ...r,
      images: parseImages(r.images),
      type_text: AFTER_SALES_TYPE_MAP[r.type] || r.type,
      status_label: (AFTER_SALES_STATUS_MAP[r.status] || {}).label || r.status,
      status_color: (AFTER_SALES_STATUS_MAP[r.status] || {}).color || '#999',
      status_bg: (AFTER_SALES_STATUS_MAP[r.status] || {}).bg || '#eee',
      status_icon: (AFTER_SALES_STATUS_MAP[r.status] || {}).icon || '•',
      applicant_name: r.user_real_name || r.user_nickname || ('用户' + r.user_id)
    }));

    res.json({ success: true, data: { list: rows, total: totalRow.total } });
  } catch (error) {
    console.error('售后列表错误:', error);
    res.status(500).json({ success: false, error: '获取售后列表失败' });
  }
});

/**
 * 售后申请详情
 * GET /api/after-sales/requests/:id
 */
router.get('/requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const list = await db.query(
      `SELECT r.*, o.order_id as order_no, o.device_model as order_device_model, o.status as order_status,
              u.nickname as user_nickname, u.real_name as user_real_name, u.phone as user_phone
       FROM after_sales_requests r
       LEFT JOIN orders o ON o.id = r.order_id
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.id = ?`,
      [id]
    );
    if (list.length === 0) {
      return res.status(404).json({ success: false, error: '售后申请不存在' });
    }
    const r = list[0];
    const data = {
      ...r,
      images: parseImages(r.images),
      type_text: AFTER_SALES_TYPE_MAP[r.type] || r.type,
      status_label: (AFTER_SALES_STATUS_MAP[r.status] || {}).label || r.status,
      applicant_name: r.user_real_name || r.user_nickname || ('用户' + r.user_id)
    };
    res.json({ success: true, data });
  } catch (error) {
    console.error('售后详情错误:', error);
    res.status(500).json({ success: false, error: '获取售后详情失败' });
  }
});

/**
 * 解决售后申请（管理员填写处理说明）
 * POST /api/after-sales/requests/:id/resolve
 */
router.post('/requests/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { admin_remark } = req.body;

    const exist = await db.query('SELECT id FROM after_sales_requests WHERE id = ?', [id]);
    if (exist.length === 0) {
      return res.status(404).json({ success: false, error: '售后申请不存在' });
    }

    await db.query(
      `UPDATE after_sales_requests
       SET status = 'resolved', admin_remark = ?, resolved_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [admin_remark || '', id]
    );
    res.json({ success: true, message: '售后申请已解决' });
  } catch (error) {
    console.error('解决售后错误:', error);
    res.status(500).json({ success: false, error: '操作失败' });
  }
});

/**
 * 拒绝售后申请（需填写原因）
 * POST /api/after-sales/requests/:id/reject
 */
router.post('/requests/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { admin_remark } = req.body;

    if (!admin_remark || !String(admin_remark).trim()) {
      return res.status(400).json({ success: false, error: '请填写拒绝原因' });
    }

    const exist = await db.query('SELECT id FROM after_sales_requests WHERE id = ?', [id]);
    if (exist.length === 0) {
      return res.status(404).json({ success: false, error: '售后申请不存在' });
    }

    await db.query(
      `UPDATE after_sales_requests
       SET status = 'rejected', admin_remark = ?, resolved_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [String(admin_remark).trim(), id]
    );
    res.json({ success: true, message: '已拒绝该售后申请' });
  } catch (error) {
    console.error('拒绝售后错误:', error);
    res.status(500).json({ success: false, error: '操作失败' });
  }
});

/**
 * 用户查看自己发起的售后申请
 * GET /api/after-sales/my
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await db.query(
      `SELECT r.*, o.order_id as order_no, o.status as order_status
       FROM after_sales_requests r
       LEFT JOIN orders o ON o.id = r.order_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );
    const list = rows.map(r => ({
      ...r,
      images: parseImages(r.images),
      type_text: AFTER_SALES_TYPE_MAP[r.type] || r.type,
      status_label: (AFTER_SALES_STATUS_MAP[r.status] || {}).label || r.status,
      status_color: (AFTER_SALES_STATUS_MAP[r.status] || {}).color || '#999',
      status_bg: (AFTER_SALES_STATUS_MAP[r.status] || {}).bg || '#eee',
      status_icon: (AFTER_SALES_STATUS_MAP[r.status] || {}).icon || '•'
    }));
    res.json({ success: true, data: { list } });
  } catch (error) {
    console.error('查询我的售后错误:', error);
    res.status(500).json({ success: false, error: '获取售后列表失败' });
  }
});

/**
 * 内部：构建某设备的售后总览（设备信息 + 质保 + 维修履历 + 建议）
 */
async function buildDeviceSummary(deviceId, userId) {
  const dev = await db.query(
    'SELECT * FROM user_devices WHERE id = ? AND user_id = ?',
    [deviceId, userId]
  );
  if (dev.length === 0) return null;
  const device = dev[0];

  const orders = await db.query(
    `SELECT id, order_id, status, problem_description, custom_description,
            created_at, completed_at, updated_at, is_warranty, device_model
     FROM orders WHERE device_id = ? ORDER BY created_at DESC`,
    [deviceId]
  );

  for (const o of orders) {
    const recs = await db.query(
      `SELECT id, stage, title, description, created_at
       FROM repair_records WHERE order_id = ? ORDER BY created_at ASC`,
      [o.id]
    );
    o.repair_records = recs;
  }

  // 质保：取最近一笔已完成订单
  let warranty = { status: 'none', remaining_days: 0 };
  const completed = orders.filter(o => o.status === 'completed');
  if (completed.length > 0) {
    const latest = completed[0];
    let wInfo = await db.query(
      'SELECT warranty_start_date, warranty_end_date, warranty_period_days, warranty_type FROM orders WHERE id = ?',
      [latest.id]
    );
    wInfo = wInfo[0] || {};
    if (!wInfo.warranty_end_date) {
      const ww = computeWarranty(latest, device.warranty_months);
      await db.query(
        `UPDATE orders SET warranty_start_date=?, warranty_end_date=?, warranty_period_days=?, warranty_type=?
         WHERE id=?`,
        [ww.warranty_start_date, ww.warranty_end_date, ww.warranty_period_days, ww.warranty_type, latest.id]
      ).catch(() => {});
      wInfo = { ...wInfo, ...ww };
    }
    const st = warrantyStatus(wInfo.warranty_end_date);
    warranty = {
      status: st.status,
      remaining_days: st.remaining_days,
      warranty_start_date: wInfo.warranty_start_date,
      warranty_end_date: wInfo.warranty_end_date,
      warranty_type: wInfo.warranty_type
    };
  }

  const advice = generateAdvice(device, orders, warranty);
  return { device, warranty, history: orders, advice };
}

/**
 * 设备售后总览
 * GET /api/after-sales/device/:deviceId
 */
router.get('/device/:deviceId', authenticateToken, async (req, res) => {
  try {
    const deviceId = parseInt(req.params.deviceId);
    const userId = req.user.id;
    const data = await buildDeviceSummary(deviceId, userId);
    if (!data) {
      return res.status(403).json({ success: false, error: '无权访问该设备或无此设备' });
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('设备售后总览错误:', error);
    res.status(500).json({ success: false, error: '获取设备售后总览失败' });
  }
});

/**
 * 仅获取保养 / 换新建议
 * GET /api/after-sales/advice/:deviceId
 */
router.get('/advice/:deviceId', authenticateToken, async (req, res) => {
  try {
    const deviceId = parseInt(req.params.deviceId);
    const userId = req.user.id;
    const data = await buildDeviceSummary(deviceId, userId);
    if (!data) {
      return res.status(403).json({ success: false, error: '无权访问该设备' });
    }
    res.json({ success: true, data: { advice: data.advice } });
  } catch (error) {
    console.error('获取建议错误:', error);
    res.status(500).json({ success: false, error: '获取建议失败' });
  }
});

/**
 * 按订单查询质保状态（懒生成）
 * GET /api/after-sales/warranty/order/:orderId
 */
router.get('/warranty/order/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const w = await db.query(
      `SELECT id, device_id, status, completed_at, updated_at, is_warranty,
              warranty_start_date, warranty_end_date, warranty_period_days, warranty_type
       FROM orders WHERE id = ?`,
      [orderId]
    );
    if (w.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }
    const o = w[0];
    if (o.status !== 'completed') {
      return res.json({ success: true, data: { status: 'none', remaining_days: 0 } });
    }
    let info = o;
    if (!info.warranty_end_date) {
      const dev = await db.query('SELECT warranty_months FROM user_devices WHERE id = ?', [o.device_id]).catch(() => []);
      const ww = computeWarranty(o, dev[0] && dev[0].warranty_months);
      await db.query(
        `UPDATE orders SET warranty_start_date=?, warranty_end_date=?, warranty_period_days=?, warranty_type=?
         WHERE id=?`,
        [ww.warranty_start_date, ww.warranty_end_date, ww.warranty_period_days, ww.warranty_type, o.id]
      ).catch(() => {});
      info = { ...info, ...ww };
    }
    const st = warrantyStatus(info.warranty_end_date);
    res.json({
      success: true,
      data: {
        status: st.status,
        remaining_days: st.remaining_days,
        warranty_start_date: info.warranty_start_date,
        warranty_end_date: info.warranty_end_date,
        warranty_type: info.warranty_type
      }
    });
  } catch (error) {
    console.error('订单质保查询错误:', error);
    res.status(500).json({ success: false, error: '查询质保失败' });
  }
});

/**
 * 客服侧：某用户的售后总览（设备 + 质保 + 近期维修）
 * GET /api/after-sales/customer-summary/:userId
 */
router.get('/customer-summary/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const devices = await db.query(
      `SELECT id, device_nickname, device_model, brand_name, device_type_id, device_type_name,
              purchase_date, warranty_months
       FROM user_devices WHERE user_id = ? ORDER BY is_default DESC, updated_at DESC`,
      [userId]
    );

    for (const d of devices) {
      const w = await db.query(
        `SELECT id, status, completed_at, updated_at, is_warranty, warranty_end_date, warranty_period_days
         FROM orders WHERE device_id = ? AND status = 'completed'
         ORDER BY COALESCE(completed_at, updated_at) DESC LIMIT 1`,
        [d.id]
      );
      if (w[0]) {
        let info = w[0];
        if (!info.warranty_end_date) {
          const ww = computeWarranty(info, d.warranty_months);
          await db.query(
            `UPDATE orders SET warranty_start_date=?, warranty_end_date=?, warranty_period_days=?, warranty_type=?
             WHERE id=?`,
            [ww.warranty_start_date, ww.warranty_end_date, ww.warranty_period_days, ww.warranty_type, info.id]
          ).catch(() => {});
          info = { ...info, ...ww };
        }
        const st = warrantyStatus(info.warranty_end_date);
        d.warranty = { status: st.status, remaining_days: st.remaining_days, warranty_end_date: info.warranty_end_date };
        d.last_order_id = info.id;
      } else {
        d.warranty = { status: 'none', remaining_days: 0 };
      }
    }

    const recentOrders = await db.query(
      `SELECT id, order_id, device_model, status, created_at, is_warranty
       FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    res.json({ success: true, data: { devices, recentOrders } });
  } catch (error) {
    console.error('客服售后总览错误:', error);
    res.status(500).json({ success: false, error: '获取客服售后总览失败' });
  }
});

module.exports = router;
