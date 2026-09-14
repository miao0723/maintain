/**
 * 操作日志记录
 */
const db = require('../database');

async function writeOpLog(req, module, action, detail) {
  try {
    await db.query(
      `INSERT INTO recycle_operation_logs (admin_id, admin_name, module, action, detail, ip)
       VALUES (?,?,?,?,?,?)`,
      [
        req.admin ? req.admin.id : null,
        req.admin ? (req.admin.name || req.admin.username) : '',
        module,
        action,
        typeof detail === 'string' ? detail.slice(0, 1000) : JSON.stringify(detail || {}).slice(0, 1000),
        req.ip || ''
      ]
    );
  } catch (e) {
    console.error('[oplog] 写入失败:', e.message);
  }
}

module.exports = { writeOpLog };
