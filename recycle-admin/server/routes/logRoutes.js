/**
 * 操作日志查询：记录回收后台所有写操作（登录/报价/流转/调价/配置等）
 * 数据由 writeOpLog 写入 recycle_operation_logs，这里提供查询界面支撑
 */
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate } = require('../middleware/auth');

// GET /api/logs?module=&keyword=&startDate=&endDate=&page=&pageSize=
router.get('/', authenticate, async (req, res) => {
  try {
    const { module = '', keyword = '', startDate = '', endDate = '', page = 1, pageSize = 20 } = req.query;
    const where = [];
    const params = [];

    if (module) {
      where.push('module = ?');
      params.push(String(module));
    }
    if (keyword) {
      where.push('(admin_name LIKE ? OR detail LIKE ? OR action LIKE ?)');
      const kw = `%${String(keyword).trim()}%`;
      params.push(kw, kw, kw);
    }
    if (startDate) {
      where.push('created_at >= ?');
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      where.push('created_at <= ?');
      params.push(`${endDate} 23:59:59`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const cntRows = await db.query(`SELECT COUNT(*) AS c FROM recycle_operation_logs ${whereSql}`, params);
    const total = Number(cntRows[0].c) || 0;

    const limit = Math.min(parseInt(pageSize) || 20, 100);
    const offset = ((parseInt(page) || 1) - 1) * limit;
    const list = await db.query(
      `SELECT id, admin_id, admin_name, module, action, detail, ip, created_at
         FROM recycle_operation_logs ${whereSql}
        ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ success: true, data: { list, total } });
  } catch (err) {
    console.error('[logs]', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
