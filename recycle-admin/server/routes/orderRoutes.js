/**
 * 回收订单管理
 * 数据来源：业务库 orders 表（order_type='recycle'），与小程序共用同一份数据。
 */
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate, requireWrite } = require('../middleware/auth');
const { writeOpLog } = require('../utils/oplog');

const STATUS_LABELS = {
  pending: '待确认',
  quoted: '已报价',
  confirmed: '已确认',
  processing: '处理中',
  completed: '已完成',
  review: '待评价',
  cancelled: '已取消'
};

const CONDITION_LABELS = { good: '优', normal: '良', fair: '中', poor: '差', excellent: '优+', mint: '全新' };

/** 组装订单查询字段（兼容不同环境的 orders 可选列） */
async function orderSelect() {
  const cols = await db.orderColumns();
  const fields = [
    'o.id', 'o.order_id', 'o.user_id', 'o.device_type', 'o.problem_description',
    'o.custom_description', 'o.images', 'o.service_type', 'o.brand_id',
    'o.device_model', 'o.device_condition', 'o.estimated_price', 'o.actual_price',
    'o.status', 'o.created_at', 'o.updated_at', 'o.completed_at', 'o.cancel_reason',
    'o.cancel_description', 'o.progress', 'o.quote_price', 'o.quote_description',
    'o.quote_status', 'o.payment_status',
    'u.nickname', 'u.real_name', 'u.phone'
  ];
  if (cols.has('device_type_name')) fields.push('o.device_type_name');
  if (cols.has('admin_unread')) fields.push('o.admin_unread');
  if (cols.has('user_unread')) fields.push('o.user_unread');
  if (cols.has('is_internal')) fields.push('o.is_internal');
  if (cols.has('device_source')) fields.push('o.device_source');
  return fields;
}

/**
 * GET /api/orders
 * 查询参数: keyword(订单号/型号/用户), status, condition, startDate, endDate, page, pageSize
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      keyword = '', status = '', condition = '', startDate = '', endDate = '',
      page = 1, pageSize = 15
    } = req.query;
    const where = ["o.order_type = 'recycle'"];
    const params = [];

    if (keyword) {
      where.push('(o.order_id LIKE ? OR o.device_model LIKE ? OR u.nickname LIKE ? OR u.real_name LIKE ? OR u.phone LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw, kw, kw);
    }
    if (status && STATUS_LABELS[status]) {
      where.push('o.status = ?');
      params.push(status);
    }
    if (condition) {
      where.push('o.device_condition = ?');
      params.push(condition);
    }
    if (startDate) {
      where.push('o.created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      where.push('o.created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    const fields = await orderSelect();
    const whereSql = where.join(' AND ');
    const limit = Math.min(parseInt(pageSize) || 15, 100);
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

    const listSql = `
      SELECT ${fields.join(', ')}
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE ${whereSql}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?`;
    const countSql = `
      SELECT COUNT(*) AS total,
             COALESCE(SUM(CASE WHEN o.status IN ('completed') THEN o.actual_price ELSE 0 END), 0) AS completedAmount
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE ${whereSql}`;

    const [rows, countRows] = await Promise.all([
      db.query(listSql, [...params, limit, offset]),
      db.query(countSql, params)
    ]);

    const list = rows.map((r) => ({
      ...r,
      statusLabel: STATUS_LABELS[r.status] || r.status,
      conditionLabel: CONDITION_LABELS[r.device_condition] || r.device_condition || '',
      images: parseImages(r.images),
      realPrice: r.actual_price != null ? Number(r.actual_price) : null
    }));

    res.json({
      success: true,
      data: {
        list,
        total: Number(countRows[0].total),
        completedAmount: Number(countRows[0].completedAmount),
        page: Math.max(parseInt(page) || 1, 1),
        pageSize: limit
      }
    });
  } catch (err) {
    console.error('[orders/list]', err);
    res.status(500).json({ success: false, message: '查询订单失败' });
  }
});

/** GET /api/orders/:id 详情（含用户联系信息与收货地址） */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: '参数错误' });

    const fields = await orderSelect();
    const rows = await db.query(
      `SELECT ${fields.join(', ')},
              a.contact_name, a.contact_phone, a.province, a.city, a.district, a.detail
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN user_addresses a ON a.id = o.address_id
       WHERE o.id = ? AND o.order_type = 'recycle'`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '回收订单不存在' });
    }
    const o = rows[0];
    o.statusLabel = STATUS_LABELS[o.status] || o.status;
    o.conditionLabel = CONDITION_LABELS[o.device_condition] || o.device_condition || '';
    o.images = parseImages(o.images);
    o.address = o.contact_name
      ? `${o.province || ''}${o.city || ''}${o.district || ''} ${o.detail || ''}（${o.contact_name} ${o.contact_phone || ''}）`
      : '';
    res.json({ success: true, data: o });
  } catch (err) {
    console.error('[orders/detail]', err);
    res.status(500).json({ success: false, message: '查询详情失败' });
  }
});

/**
 * POST /api/orders/:id/quote 提交回收报价
 * body: { price, description }
 * 更新 actual_price/quote_price，状态置为 quoted，用户端将看到最新报价。
 */
router.post('/:id/quote', authenticate, requireWrite, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { price, description = '' } = req.body || {};
    const priceNum = Number(price);
    if (!id) return res.status(400).json({ success: false, message: '参数错误' });
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return res.status(400).json({ success: false, message: '报价金额无效' });
    }

    const rows = await db.query(
      "SELECT id, order_id, device_model, status FROM orders WHERE id = ? AND order_type = 'recycle'",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '回收订单不存在' });
    }
    if (rows[0].status === 'completed' || rows[0].status === 'cancelled') {
      return res.status(400).json({ success: false, message: '订单已完结，不能报价' });
    }

    const cols = await db.orderColumns();
    await db.query(
      `UPDATE orders SET
         actual_price = ?, quote_price = ?, quote_description = ?,
         quote_status = 'pending', quote_created_at = NOW()${cols.has('quote_created_by') ? ', quote_created_by = ?' : ''},
         status = 'quoted', updated_at = NOW()
       WHERE id = ?`,
      cols.has('quote_created_by')
        ? [priceNum, priceNum, description, req.admin.id, id]
        : [priceNum, priceNum, description, id]
    );

    await writeOpLog(req, 'order', 'quote', `订单 ${rows[0].order_id} 报价 ¥${priceNum}${description ? '：' + description : ''}`);
    res.json({ success: true, message: '报价已提交' });
  } catch (err) {
    console.error('[orders/quote]', err);
    res.status(500).json({ success: false, message: '报价失败' });
  }
});

/**
 * POST /api/orders/:id/status 状态流转
 * body: { status, reason? }
 * 回收订单链路: pending → quoted → confirmed → processing → completed；任意非完结态可 cancelled。
 */
router.post('/:id/status', authenticate, requireWrite, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, reason = '' } = req.body || {};
    if (!id || !STATUS_LABELS[status]) {
      return res.status(400).json({ success: false, message: '目标状态无效' });
    }
    const rows = await db.query(
      "SELECT id, order_id, status FROM orders WHERE id = ? AND order_type = 'recycle'",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '回收订单不存在' });
    }
    const current = rows[0].status;
    if (current === 'completed' || current === 'cancelled') {
      return res.status(400).json({ success: false, message: '订单已完结，不能变更状态' });
    }
    if (status === current) {
      return res.status(400).json({ success: false, message: '订单已处于该状态' });
    }

    const sets = ['status = ?', 'updated_at = NOW()'];
    const params = [status];
    if (status === 'completed') {
      sets.push('completed_at = NOW()', 'progress = 100');
    }
    if (status === 'cancelled') {
      sets.push('cancelled_at = NOW()', 'cancel_reason = ?', 'cancel_description = ?');
      params.push('admin_cancel', reason || '后台取消');
    }
    params.push(id);
    await db.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, params);

    await writeOpLog(req, 'order', 'status', `订单 ${rows[0].order_id}: ${STATUS_LABELS[current]} → ${STATUS_LABELS[status]}${reason ? '（' + reason + '）' : ''}`);
    res.json({ success: true, message: `状态已更新为「${STATUS_LABELS[status]}」` });
  } catch (err) {
    console.error('[orders/status]', err);
    res.status(500).json({ success: false, message: '状态更新失败' });
  }
});

/**
 * POST /api/orders 手动创建回收订单（登记线下回收）
 * body: { userId, deviceModel, condition, estimatedPrice, description, serviceType }
 */
router.post('/', authenticate, requireWrite, async (req, res) => {
  try {
    const {
      userId, deviceModel, condition = 'normal', estimatedPrice = 0,
      description = '', serviceType = 'shop'
    } = req.body || {};
    if (!userId || !deviceModel) {
      return res.status(400).json({ success: false, message: '请选择用户并填写设备型号' });
    }
    const users = await db.query('SELECT id FROM users WHERE id = ?', [parseInt(userId)]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: '用户不存在' });
    }
    const orderNo = `REC${Date.now()}${Math.floor(Math.random() * 90 + 10)}`;
    await db.query(
      `INSERT INTO orders (
         order_id, user_id, order_type, device_type, problem_description, custom_description,
         images, service_type, device_model, device_condition, estimated_price,
         status, created_at, updated_at, progress, priority
       ) VALUES (?, ?, 'recycle', 1, '线下回收登记', ?, NULL, ?, ?, ?, ?, 'pending', NOW(), NOW(), 0, 0)`,
      [orderNo, parseInt(userId), description, serviceType, String(deviceModel).slice(0, 100), condition, Number(estimatedPrice) || 0]
    );
    await writeOpLog(req, 'order', 'create', `手动创建回收订单 ${orderNo}（${deviceModel}）`);
    res.json({ success: true, message: '回收订单已创建', data: { orderNo } });
  } catch (err) {
    console.error('[orders/create]', err);
    res.status(500).json({ success: false, message: '创建订单失败' });
  }
});

/** GET /api/orders/export/list 导出筛选结果为 CSV（Excel 可直接打开） */
router.get('/export/list', authenticate, async (req, res) => {
  try {
    const { keyword = '', status = '', startDate = '', endDate = '' } = req.query;
    const where = ["o.order_type = 'recycle'"];
    const params = [];
    if (keyword) {
      where.push('(o.order_id LIKE ? OR o.device_model LIKE ? OR u.phone LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }
    if (status && STATUS_LABELS[status]) {
      where.push('o.status = ?');
      params.push(status);
    }
    if (startDate) { where.push('o.created_at >= ?'); params.push(`${startDate} 00:00:00`); }
    if (endDate) { where.push('o.created_at <= ?'); params.push(`${endDate} 23:59:59`); }

    const rows = await db.query(
      `SELECT o.order_id, o.device_model, o.device_condition, o.estimated_price, o.actual_price,
              o.status, o.created_at, o.completed_at, u.nickname, u.real_name, u.phone
       FROM orders o LEFT JOIN users u ON u.id = o.user_id
       WHERE ${where.join(' AND ')}
       ORDER BY o.created_at DESC LIMIT 5000`,
      params
    );

    const header = ['订单号', '设备型号', '成色', '预估价', '成交价', '状态', '客户', '联系电话', '创建时间', '完成时间'];
    const lines = rows.map((r) => [
      r.order_id, r.device_model || '', CONDITION_LABELS[r.device_condition] || r.device_condition || '',
      r.estimated_price ?? '', r.actual_price ?? '', STATUS_LABELS[r.status] || r.status,
      r.real_name || r.nickname || '', r.phone || '', r.created_at || '', r.completed_at || ''
    ]);
    const csv = [header, ...lines]
      .map((cols) => cols.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    await writeOpLog(req, 'order', 'export', `导出回收订单 ${rows.length} 条`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=recycle-orders-${Date.now()}.csv`);
    res.send('\uFEFF' + csv);
  } catch (err) {
    console.error('[orders/export]', err);
    res.status(500).json({ success: false, message: '导出失败' });
  }
});

/** GET /api/orders/meta/options 用户下拉（手动创建订单时选择） */
router.get('/meta/options', authenticate, async (req, res) => {
  try {
    const { keyword = '' } = req.query;
    const params = [];
    let where = '1=1';
    if (keyword) {
      where = '(nickname LIKE ? OR real_name LIKE ? OR phone LIKE ?)';
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }
    const rows = await db.query(
      `SELECT id, nickname, real_name, phone FROM users WHERE ${where} ORDER BY id DESC LIMIT 30`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[orders/options]', err);
    res.status(500).json({ success: false, message: '查询用户失败' });
  }
});

function parseImages(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

module.exports = router;
