/**
 * 质检中心（服务小程序回收定级/估价）
 *
 * 数据在业务库 repair：qc_templates / qc_items / qc_grade_rules / qc_standards /
 * qc_orders / qc_results / qc_media / qc_reviews（首次访问自动建表，幂等）。
 * 质检单关联 orders（回收单），定级成色与小程序 device_condition 同语义，
 * 成色标准携带回收价系数，定级时联动估价建议。
 */
const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireWrite } = require('../middleware/auth');
const { writeOpLog } = require('../utils/oplog');

const STATUS_LABELS = {
  pending: '待质检',
  in_progress: '质检中',
  graded: '已定级',
  review: '复核中',
  disputed: '争议中',
  completed: '已完成'
};
const CONDITION_KEYS = ['good', 'normal', 'fair', 'poor'];

const DDL = [
  `CREATE TABLE IF NOT EXISTS qc_templates (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '模板名称',
    device_category_id INT NULL DEFAULT NULL COMMENT '适用配价库分类(recycle_categories.id)，空=通用',
    description VARCHAR(255) NULL DEFAULT NULL,
    status TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检模板'`,
  `CREATE TABLE IF NOT EXISTS qc_items (
    id INT NOT NULL AUTO_INCREMENT,
    template_id INT NOT NULL,
    name VARCHAR(100) NOT NULL COMMENT '质检项名称',
    category VARCHAR(50) NULL DEFAULT NULL COMMENT '分类：外观/屏幕/功能/电池等',
    check_method VARCHAR(50) NULL DEFAULT NULL COMMENT '检查方式',
    scoring_type VARCHAR(20) NOT NULL DEFAULT 'pass_fail' COMMENT 'pass_fail/score',
    fault_options JSON NULL COMMENT '可选故障标签',
    required TINYINT NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY idx_qc_items_template (template_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检项'`,
  `CREATE TABLE IF NOT EXISTS qc_grade_rules (
    id INT NOT NULL AUTO_INCREMENT,
    template_id INT NOT NULL,
    grade_key VARCHAR(20) NOT NULL COMMENT 'good/normal/fair/poor',
    grade_name VARCHAR(50) NOT NULL,
    min_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    max_score DECIMAL(5,2) NOT NULL DEFAULT 100,
    price_coefficient DECIMAL(5,2) NOT NULL DEFAULT 1.00 COMMENT '回收价系数',
    fault_standard VARCHAR(500) NULL DEFAULT NULL COMMENT '判定标准',
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY idx_qc_grades_template (template_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成色/故障定级标准'`,
  `CREATE TABLE IF NOT EXISTS qc_standards (
    id INT NOT NULL AUTO_INCREMENT,
    template_id INT NOT NULL,
    version_no VARCHAR(20) NOT NULL,
    snapshot JSON NOT NULL COMMENT 'items+grades 快照',
    changelog VARCHAR(500) NULL DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active/archived',
    published_at DATETIME NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY idx_qc_standards_template (template_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检标准版本'`,
  `CREATE TABLE IF NOT EXISTS qc_orders (
    id INT NOT NULL AUTO_INCREMENT,
    qc_no VARCHAR(32) NOT NULL,
    order_id INT NOT NULL COMMENT '关联 orders.id(回收单)',
    template_id INT NOT NULL,
    standard_id INT NULL DEFAULT NULL COMMENT '锁定使用的标准版本',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    inspector_name VARCHAR(100) NULL DEFAULT NULL COMMENT '质检员',
    grade_score DECIMAL(5,2) NULL DEFAULT NULL,
    graded_condition VARCHAR(20) NULL DEFAULT NULL,
    final_price DECIMAL(10,2) NULL DEFAULT NULL COMMENT '建议回收价',
    grade_note VARCHAR(500) NULL DEFAULT NULL,
    started_at DATETIME NULL DEFAULT NULL,
    graded_at DATETIME NULL DEFAULT NULL,
    completed_at DATETIME NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id), UNIQUE KEY uk_qc_no (qc_no),
    KEY idx_qc_orders_order (order_id), KEY idx_qc_orders_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检单'`,
  `CREATE TABLE IF NOT EXISTS qc_results (
    id INT NOT NULL AUTO_INCREMENT,
    qc_order_id INT NOT NULL,
    qc_item_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    result VARCHAR(20) NOT NULL,
    fault_tag VARCHAR(100) NULL DEFAULT NULL,
    fault_note VARCHAR(500) NULL DEFAULT NULL,
    deduction DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY idx_qc_results_order (qc_order_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检项结果'`,
  `CREATE TABLE IF NOT EXISTS qc_media (
    id INT NOT NULL AUTO_INCREMENT,
    qc_order_id INT NOT NULL,
    type VARCHAR(10) NOT NULL DEFAULT 'image',
    url VARCHAR(500) NOT NULL,
    note VARCHAR(255) NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY idx_qc_media_order (qc_order_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检图片/视频'`,
  `CREATE TABLE IF NOT EXISTS qc_reviews (
    id INT NOT NULL AUTO_INCREMENT,
    qc_order_id INT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'review' COMMENT 'review/dispute',
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' COMMENT 'open/agreed/rejected/resolved',
    handler_remark VARCHAR(500) NULL DEFAULT NULL,
    resolved_at DATETIME NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY idx_qc_reviews_order (qc_order_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检复核/争议'`
];

let tablesReady = null;
async function ensureTables() {
  if (!tablesReady) {
    tablesReady = (async () => {
      for (const ddl of DDL) {
        await db.query(ddl);
      }
    })();
  }
  await tablesReady;
}

function parseJsonArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  try {
    const v = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function httpError(res, err, status = 400) {
  console.error('[qc]', err.message || err);
  res.status(status).json({ success: false, message: err.message || String(err) });
}

// ================================================================ 质检单

/** GET /api/qc/orders */
router.get('/orders', async (req, res) => {
  try {
    await ensureTables();
    const { keyword = '', status = '', graded_condition = '', startDate = '', endDate = '', page = 1, pageSize = 15 } = req.query;
    const where = ['1=1'];
    const params = [];
    if (keyword) {
      where.push('(q.qc_no LIKE ? OR o.order_id LIKE ? OR o.device_model LIKE ? OR u.nickname LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw, kw);
    }
    if (status && STATUS_LABELS[status]) { where.push('q.status = ?'); params.push(status); }
    if (graded_condition) { where.push('q.graded_condition = ?'); params.push(graded_condition); }
    if (startDate) { where.push('q.created_at >= ?'); params.push(`${startDate} 00:00:00`); }
    if (endDate) { where.push('q.created_at <= ?'); params.push(`${endDate} 23:59:59`); }
    const whereSql = where.join(' AND ');
    const limit = Math.min(parseInt(pageSize) || 15, 100);
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

    const listSql = `
      SELECT q.*, o.order_id AS order_no, o.order_type, o.device_model, o.device_condition,
        o.estimated_price, o.actual_price, o.status AS biz_order_status,
        u.nickname AS user_name, u.phone AS user_phone, t.name AS template_name
      FROM qc_orders q
      LEFT JOIN orders o ON o.id = q.order_id
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN qc_templates t ON t.id = q.template_id
      WHERE ${whereSql}
      ORDER BY q.id DESC
      LIMIT ? OFFSET ?`;
    const countSql = `
      SELECT COUNT(*) AS total FROM qc_orders q
      LEFT JOIN orders o ON o.id = q.order_id
      LEFT JOIN users u ON u.id = o.user_id
      WHERE ${whereSql}`;
    const [rows, countRows] = await Promise.all([
      db.query(listSql, [...params, limit, offset]),
      db.query(countSql, params)
    ]);
    const summaryRows = await db.query(
      `SELECT status, COUNT(*) AS c FROM qc_orders GROUP BY status`
    );
    const summary = { pending: 0, in_progress: 0, graded: 0, review: 0, disputed: 0, completed: 0 };
    summaryRows.forEach((r) => { summary[r.status] = Number(r.c); });

    res.json({
      success: true,
      data: { list: rows, total: Number(countRows[0].total), page: Math.max(parseInt(page) || 1, 1), pageSize: limit, summary }
    });
  } catch (err) { httpError(res, err, 500); }
});

/** POST /api/qc/orders 创建质检单（关联回收订单） */
router.post('/orders', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    const orderId = parseInt(req.body.order_id) || 0;
    const templateId = parseInt(req.body.template_id) || 0;
    if (!orderId || !templateId) throw new Error('订单和质检模板不能为空');

    const order = await db.query('SELECT id FROM orders WHERE id = ?', [orderId]);
    if (!order.length) throw new Error('订单不存在');
    const tpl = await db.query('SELECT id, name FROM qc_templates WHERE id = ? AND status = 1', [templateId]);
    if (!tpl.length) throw new Error('质检模板不存在或已停用');

    const exists = await db.query(
      `SELECT COUNT(*) AS c FROM qc_orders WHERE order_id = ? AND status NOT IN ('completed','disputed')`, [orderId]
    );
    if (Number(exists[0].c) > 0) throw new Error('该订单已有进行中的质检单');

    const std = await db.query(
      'SELECT id FROM qc_standards WHERE template_id = ? AND status = ? ORDER BY id DESC LIMIT 1', [templateId, 'active']
    );
    const qcNo = `QC${dateStr()}${String(Math.floor(Math.random() * 899) + 100)}`;
    const result = await db.query(
      'INSERT INTO qc_orders (qc_no, order_id, template_id, standard_id, status, inspector_name) VALUES (?,?,?,?,?,?)',
      [qcNo, orderId, templateId, std[0] ? std[0].id : null, 'pending', req.admin?.name || req.admin?.username || null]
    );
    await writeOpLog(req, 'qc', 'create', `创建质检单 ${qcNo}`);
    res.json({ success: true, data: { id: result.insertId, qc_no: qcNo }, message: '质检单已创建' });
  } catch (err) { httpError(res, err); }
});

/** GET /api/qc/orders/:id 详情（标准快照+结果+媒体+复核） */
router.get('/orders/:id', async (req, res) => {
  try {
    await ensureTables();
    res.json({ success: true, data: await loadDetail(parseInt(req.params.id)) });
  } catch (err) { httpError(res, err, 404); }
});

/** GET /api/qc/orders/:id/report 质检报告 */
router.get('/orders/:id/report', async (req, res) => {
  try {
    await ensureTables();
    const detail = await loadDetail(parseInt(req.params.id));
    detail.report_no = `QR-${detail.qc.qc_no}`;
    detail.generated_at = formatNow();
    res.json({ success: true, data: detail });
  } catch (err) { httpError(res, err, 404); }
});

/** PUT /api/qc/orders/:id/start 开始质检 */
router.put('/orders/:id/start', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    const id = parseInt(req.params.id);
    const qc = await mustFindQc(id);
    if (qc.status !== 'pending') throw new Error('仅待质检状态可开始');
    await db.query('UPDATE qc_orders SET status = ?, started_at = NOW() WHERE id = ?', ['in_progress', id]);
    await writeOpLog(req, 'qc', 'start', `开始质检 ${qc.qc_no}`);
    res.json({ success: true, data: await loadDetail(id), message: '已开始质检' });
  } catch (err) { httpError(res, err); }
});

/** GET /api/qc/orders/:id/price-suggestion 定级价格建议 */
router.get('/orders/:id/price-suggestion', async (req, res) => {
  try {
    await ensureTables();
    const id = parseInt(req.params.id);
    const gradeKey = String(req.query.grade_key || '');
    const qc = await mustFindQc(id);
    const std = qc.standard_id
      ? await db.query('SELECT snapshot FROM qc_standards WHERE id = ?', [qc.standard_id])
      : [];
    const snapshot = std.length ? parseSnapshot(std[0].snapshot) : null;
    const rule = snapshot ? (snapshot.grades || []).find((g) => g.grade_key === gradeKey) : null;
    if (!rule) throw new Error('当前标准里没有该成色档位');
    const orders = await db.query(
      'SELECT estimated_price, actual_price FROM orders WHERE id = ?', [qc.order_id]
    );
    const base = Number(orders[0].actual_price || orders[0].estimated_price || 0);
    res.json({
      success: true,
      data: {
        base_price: base,
        coefficient: Number(rule.price_coefficient),
        suggested_price: Math.round(base * Number(rule.price_coefficient) * 100) / 100,
        grade_name: rule.grade_name
      }
    });
  } catch (err) { httpError(res, err); }
});

/** PUT /api/qc/orders/:id/grade 提交定级 */
router.put('/orders/:id/grade', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    const id = parseInt(req.params.id);
    const qc = await mustFindQc(id);
    if (!['in_progress', 'graded', 'review', 'disputed'].includes(qc.status)) {
      throw new Error('请先开始质检再定级');
    }
    const { results = [], grade_score = 0, graded_condition = '', final_price = null, grade_note = '' } = req.body;
    if (!Array.isArray(results) || !results.length) throw new Error('质检项结果不能为空');
    if (!CONDITION_KEYS.includes(graded_condition)) throw new Error('定级成色必须为 good/normal/fair/poor');

    await db.query('DELETE FROM qc_results WHERE qc_order_id = ?', [id]);
    for (const r of results) {
      if (!r.qc_item_id || !r.item_name) continue;
      await db.query(
        `INSERT INTO qc_results (qc_order_id, qc_item_id, item_name, result, fault_tag, fault_note, deduction)
         VALUES (?,?,?,?,?,?,?)`,
        [id, r.qc_item_id, r.item_name, String(r.result ?? ''), r.fault_tag || null, r.fault_note || null, Number(r.deduction) || 0]
      );
    }
    await db.query(
      `UPDATE qc_orders SET status='graded', grade_score=?, graded_condition=?, final_price=?, grade_note=?, graded_at=NOW() WHERE id=?`,
      [Math.min(100, Math.max(0, Number(grade_score) || 0)), graded_condition,
        final_price != null ? Math.round(Number(final_price) * 100) / 100 : null, grade_note || null, id]
    );
    await writeOpLog(req, 'qc', 'grade', `质检单 ${qc.qc_no} 定级 ${graded_condition}`);
    res.json({ success: true, data: await loadDetail(id), message: '定级已提交' });
  } catch (err) { httpError(res, err); }
});

/** PUT /api/qc/orders/:id/complete 完结 */
router.put('/orders/:id/complete', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    const id = parseInt(req.params.id);
    const qc = await mustFindQc(id);
    if (!['graded', 'review'].includes(qc.status)) throw new Error('仅已定级/复核完成的质检单可完结');
    await db.query(`UPDATE qc_orders SET status='completed', completed_at=NOW() WHERE id=?`, [id]);
    await writeOpLog(req, 'qc', 'complete', `完结质检单 ${qc.qc_no}`);
    res.json({ success: true, data: await loadDetail(id), message: '质检单已完成' });
  } catch (err) { httpError(res, err); }
});

// ================================================================ 媒体 / 复核

/** POST /api/qc/orders/:id/media */
router.post('/orders/:id/media', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    const qcOrderId = parseInt(req.params.id);
    await mustFindQc(qcOrderId);
    const url = String(req.body.url || '').trim();
    if (!url) throw new Error('媒体地址不能为空');
    const type = req.body.type === 'video' ? 'video' : 'image';
    const result = await db.query(
      'INSERT INTO qc_media (qc_order_id, type, url, note) VALUES (?,?,?,?)',
      [qcOrderId, type, url, req.body.note || null]
    );
    res.json({ success: true, data: { id: result.insertId }, message: '已添加' });
  } catch (err) { httpError(res, err); }
});

/** DELETE /api/qc/media/:id */
router.delete('/media/:id', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    await db.query('DELETE FROM qc_media WHERE id = ?', [parseInt(req.params.id)]);
    res.json({ success: true, message: '已删除' });
  } catch (err) { httpError(res, err); }
});

/** POST /api/qc/orders/:id/reviews 发起复核/争议 */
router.post('/orders/:id/reviews', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    const qcOrderId = parseInt(req.params.id);
    const qc = await mustFindQc(qcOrderId);
    if (!['graded', 'review', 'disputed'].includes(qc.status)) throw new Error('仅已定级的质检单可发起复核/争议');
    const type = req.body.type === 'dispute' ? 'dispute' : 'review';
    const reason = String(req.body.reason || '').trim();
    if (!reason) throw new Error('请填写发起原因');
    const result = await db.query(
      'INSERT INTO qc_reviews (qc_order_id, type, reason, status) VALUES (?,?,?,?)',
      [qcOrderId, type, reason, 'open']
    );
    await db.query('UPDATE qc_orders SET status = ? WHERE id = ?', [type === 'dispute' ? 'disputed' : 'review', qcOrderId]);
    await writeOpLog(req, 'qc', type, `质检单 ${qc.qc_no} 发起${type === 'dispute' ? '争议' : '复核'}：${reason}`);
    res.json({ success: true, data: { id: result.insertId }, message: '已提交' });
  } catch (err) { httpError(res, err); }
});

/** PUT /api/qc/reviews/:id 处理复核/争议 */
router.put('/reviews/:id', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    const id = parseInt(req.params.id);
    const rows = await db.query('SELECT * FROM qc_reviews WHERE id = ?', [id]);
    if (!rows.length) throw new Error('复核记录不存在');
    if (rows[0].status !== 'open') throw new Error('该记录已处理');
    const status = String(req.body.status || '');
    if (!['agreed', 'rejected', 'resolved'].includes(status)) throw new Error('处理结果无效');
    await db.query(
      'UPDATE qc_reviews SET status=?, handler_remark=?, resolved_at=NOW() WHERE id=?',
      [status, req.body.handler_remark || null, id]
    );
    const qcOrderId = rows[0].qc_order_id;
    if (status === 'agreed') {
      await db.query(`UPDATE qc_orders SET status='graded' WHERE id=?`, [qcOrderId]);
    } else if (status === 'resolved') {
      await db.query(`UPDATE qc_orders SET status='completed', completed_at=NOW() WHERE id=?`, [qcOrderId]);
    }
    await writeOpLog(req, 'qc', 'resolve', `处理复核/争议 #${id} → ${status}`);
    res.json({ success: true, data: await loadDetail(qcOrderId), message: '已处理' });
  } catch (err) { httpError(res, err); }
});

// ================================================================ 模板 / 质检项 / 成色标准 / 版本

/** GET /api/qc/templates */
router.get('/templates', async (req, res) => {
  try {
    await ensureTables();
    const { keyword = '', status = '', page = 1, pageSize = 15 } = req.query;
    const where = ['1=1'];
    const params = [];
    if (keyword) { where.push('name LIKE ?'); params.push(`%${keyword}%`); }
    if (status !== '') { where.push('status = ?'); params.push(Number(status)); }
    const whereSql = where.join(' AND ');
    const limit = Math.min(parseInt(pageSize) || 15, 100);
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;
    const [rows, countRows] = await Promise.all([
      db.query(`SELECT * FROM qc_templates WHERE ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
      db.query(`SELECT COUNT(*) AS total FROM qc_templates WHERE ${whereSql}`, params)
    ]);
    for (const row of rows) {
      const [items, grades, stds, used] = await Promise.all([
        db.query(`SELECT COUNT(*) AS c FROM qc_items WHERE template_id=? AND status=1`, [row.id]),
        db.query(`SELECT COUNT(*) AS c FROM qc_grade_rules WHERE template_id=?`, [row.id]),
        db.query(`SELECT id, version_no, status, changelog, published_at FROM qc_standards WHERE template_id=? AND status='active' ORDER BY id DESC LIMIT 1`, [row.id]),
        db.query(`SELECT COUNT(*) AS c FROM qc_orders WHERE template_id=?`, [row.id])
      ]);
      row.item_count = Number(items[0].c);
      row.grade_count = Number(grades[0].c);
      row.current_version = stds[0] || null;
      row.order_count = Number(used[0].c);
    }
    res.json({ success: true, data: { list: rows, total: Number(countRows[0].total), page: Math.max(parseInt(page) || 1, 1), pageSize: limit } });
  } catch (err) { httpError(res, err, 500); }
});

/** GET /api/qc/templates/:id 详情 */
router.get('/templates/:id', async (req, res) => {
  try {
    await ensureTables();
    res.json({ success: true, data: await loadTemplate(parseInt(req.params.id)) });
  } catch (err) { httpError(res, err, 404); }
});

/** POST /api/qc/templates */
router.post('/templates', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    const name = String(req.body.name || '').trim();
    if (!name) throw new Error('模板名称不能为空');
    const result = await db.query(
      'INSERT INTO qc_templates (name, device_category_id, description) VALUES (?,?,?)',
      [name, req.body.device_category_id || null, req.body.description || null]
    );
    await writeOpLog(req, 'qc', 'template-create', `新建质检模板 ${name}`);
    res.json({ success: true, data: await loadTemplate(result.insertId), message: '模板已创建' });
  } catch (err) { httpError(res, err); }
});

/** PUT /api/qc/templates/:id */
router.put('/templates/:id', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    const id = parseInt(req.params.id);
    const tpl = await db.query('SELECT * FROM qc_templates WHERE id = ?', [id]);
    if (!tpl.length) throw new Error('模板不存在');
    const fields = [];
    const params = [];
    if (req.body.name !== undefined && String(req.body.name).trim()) { fields.push('name=?'); params.push(String(req.body.name).trim()); }
    if (req.body.device_category_id !== undefined) { fields.push('device_category_id=?'); params.push(req.body.device_category_id || null); }
    if (req.body.description !== undefined) { fields.push('description=?'); params.push(req.body.description || null); }
    if (req.body.status !== undefined) { fields.push('status=?'); params.push(Number(req.body.status) ? 1 : 0); }
    if (fields.length) {
      params.push(id);
      await db.query(`UPDATE qc_templates SET ${fields.join(', ')} WHERE id=?`, params);
    }
    res.json({ success: true, data: await loadTemplate(id), message: '模板已更新' });
  } catch (err) { httpError(res, err); }
});

/** DELETE /api/qc/templates/:id */
router.delete('/templates/:id', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    const id = parseInt(req.params.id);
    const used = await db.query('SELECT COUNT(*) AS c FROM qc_orders WHERE template_id=?', [id]);
    if (Number(used[0].c) > 0) throw new Error('该模板已有质检单使用，只能停用不能删除');
    await db.query('DELETE FROM qc_templates WHERE id=?', [id]);
    await db.query('DELETE FROM qc_items WHERE template_id=?', [id]);
    await db.query('DELETE FROM qc_grade_rules WHERE template_id=?', [id]);
    await writeOpLog(req, 'qc', 'template-delete', `删除质检模板 #${id}`);
    res.json({ success: true, message: '模板已删除' });
  } catch (err) { httpError(res, err); }
});

/** POST /api/qc/templates/:id/items */
router.post('/templates/:id/items', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    const templateId = parseInt(req.params.id);
    const name = String(req.body.name || '').trim();
    if (!name) throw new Error('质检项名称不能为空');
    const result = await db.query(
      `INSERT INTO qc_items (template_id, name, category, check_method, scoring_type, fault_options, required, sort_order)
       VALUES (?,?,?,?,?,?,?,?)`,
      [templateId, name, req.body.category || null, req.body.check_method || null,
        req.body.scoring_type === 'score' ? 'score' : 'pass_fail',
        Array.isArray(req.body.fault_options) && req.body.fault_options.length ? JSON.stringify(req.body.fault_options) : null,
        req.body.required === false ? 0 : 1, parseInt(req.body.sort_order) || 0]
    );
    res.json({ success: true, data: { id: result.insertId }, message: '质检项已添加' });
  } catch (err) { httpError(res, err); }
});

/** PUT /api/qc/items/:id */
router.put('/items/:id', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    const id = parseInt(req.params.id);
    const item = await db.query('SELECT id FROM qc_items WHERE id=?', [id]);
    if (!item.length) throw new Error('质检项不存在');
    const fields = [];
    const params = [];
    const strFields = ['name', 'category', 'check_method'];
    for (const f of strFields) {
      if (req.body[f] !== undefined) { fields.push(`${f}=?`); params.push(req.body[f] || null); }
    }
    if (req.body.scoring_type !== undefined) { fields.push('scoring_type=?'); params.push(req.body.scoring_type === 'score' ? 'score' : 'pass_fail'); }
    if (req.body.fault_options !== undefined) {
      fields.push('fault_options=?');
      params.push(Array.isArray(req.body.fault_options) && req.body.fault_options.length ? JSON.stringify(req.body.fault_options) : null);
    }
    if (req.body.required !== undefined) { fields.push('required=?'); params.push(req.body.required ? 1 : 0); }
    if (req.body.sort_order !== undefined) { fields.push('sort_order=?'); params.push(parseInt(req.body.sort_order) || 0); }
    if (req.body.status !== undefined) { fields.push('status=?'); params.push(Number(req.body.status) ? 1 : 0); }
    if (fields.length) {
      params.push(id);
      await db.query(`UPDATE qc_items SET ${fields.join(', ')} WHERE id=?`, params);
    }
    res.json({ success: true, message: '质检项已更新' });
  } catch (err) { httpError(res, err); }
});

/** DELETE /api/qc/items/:id */
router.delete('/items/:id', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    await db.query('DELETE FROM qc_items WHERE id=?', [parseInt(req.params.id)]);
    res.json({ success: true, message: '质检项已删除' });
  } catch (err) { httpError(res, err); }
});

/** POST /api/qc/templates/:id/grades */
router.post('/templates/:id/grades', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    const templateId = parseInt(req.params.id);
    const gradeKey = String(req.body.grade_key || '');
    if (!CONDITION_KEYS.includes(gradeKey)) throw new Error('成色键必须为 good/normal/fair/poor');
    const result = await db.query(
      `INSERT INTO qc_grade_rules (template_id, grade_key, grade_name, min_score, max_score, price_coefficient, fault_standard, sort_order)
       VALUES (?,?,?,?,?,?,?,?)`,
      [templateId, gradeKey, req.body.grade_name || gradeKey,
        Number(req.body.min_score) || 0, Number(req.body.max_score) || 100,
        Math.min(1.5, Math.max(0, Number(req.body.price_coefficient) ?? 1)),
        req.body.fault_standard || null, parseInt(req.body.sort_order) || 0]
    );
    res.json({ success: true, data: { id: result.insertId }, message: '成色标准已添加' });
  } catch (err) { httpError(res, err); }
});

/** PUT /api/qc/grades/:id */
router.put('/grades/:id', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    const id = parseInt(req.params.id);
    const rule = await db.query('SELECT id FROM qc_grade_rules WHERE id=?', [id]);
    if (!rule.length) throw new Error('成色标准不存在');
    const fields = [];
    const params = [];
    if (req.body.grade_name !== undefined) { fields.push('grade_name=?'); params.push(String(req.body.grade_name)); }
    if (req.body.min_score !== undefined) { fields.push('min_score=?'); params.push(Number(req.body.min_score)); }
    if (req.body.max_score !== undefined) { fields.push('max_score=?'); params.push(Number(req.body.max_score)); }
    if (req.body.price_coefficient !== undefined) { fields.push('price_coefficient=?'); params.push(Math.min(1.5, Math.max(0, Number(req.body.price_coefficient)))); }
    if (req.body.fault_standard !== undefined) { fields.push('fault_standard=?'); params.push(req.body.fault_standard || null); }
    if (req.body.sort_order !== undefined) { fields.push('sort_order=?'); params.push(parseInt(req.body.sort_order) || 0); }
    if (fields.length) {
      params.push(id);
      await db.query(`UPDATE qc_grade_rules SET ${fields.join(', ')} WHERE id=?`, params);
    }
    res.json({ success: true, message: '成色标准已更新' });
  } catch (err) { httpError(res, err); }
});

/** DELETE /api/qc/grades/:id */
router.delete('/grades/:id', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    await db.query('DELETE FROM qc_grade_rules WHERE id=?', [parseInt(req.params.id)]);
    res.json({ success: true, message: '成色标准已删除' });
  } catch (err) { httpError(res, err); }
});

/** POST /api/qc/templates/:id/publish 发布标准版本（快照） */
router.post('/templates/:id/publish', requireWrite, async (req, res) => {
  try {
    await ensureTables();
    const templateId = parseInt(req.params.id);
    const tpl = await db.query('SELECT * FROM qc_templates WHERE id=?', [templateId]);
    if (!tpl.length) throw new Error('模板不存在');
    const items = await db.query('SELECT * FROM qc_items WHERE template_id=? AND status=1 ORDER BY sort_order, id', [templateId]);
    const grades = await db.query('SELECT * FROM qc_grade_rules WHERE template_id=? ORDER BY sort_order, id', [templateId]);
    if (!items.length || !grades.length) throw new Error('模板缺少质检项或成色标准，无法发布');

    const count = await db.query('SELECT COUNT(*) AS c FROM qc_standards WHERE template_id=?', [templateId]);
    const versionNo = `V${Number(count[0].c) + 1}`;
    await db.query(`UPDATE qc_standards SET status='archived' WHERE template_id=? AND status='active'`, [templateId]);
    const snapshot = JSON.stringify({ template_name: tpl[0].name, items, grades });
    const result = await db.query(
      `INSERT INTO qc_standards (template_id, version_no, snapshot, changelog, status, published_at) VALUES (?,?,?,?,?,NOW())`,
      [templateId, versionNo, snapshot, req.body.changelog || null, 'active']
    );
    await writeOpLog(req, 'qc', 'publish', `发布质检标准 ${tpl[0].name} ${versionNo}`);
    res.json({ success: true, data: { id: result.insertId, version_no: versionNo }, message: `版本 ${versionNo} 已发布` });
  } catch (err) { httpError(res, err); }
});

// ================================================================ 内部

async function mustFindQc(id) {
  const rows = await db.query('SELECT * FROM qc_orders WHERE id=?', [id]);
  if (!rows.length) throw new Error('质检单不存在');
  return rows[0];
}

function parseSnapshot(raw) {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

async function loadDetail(id) {
  const qcRows = await db.query(
    `SELECT q.*, o.order_id AS order_no, o.order_type, o.device_model, o.brand_name,
      o.device_condition, o.problem_description, o.estimated_price, o.actual_price,
      o.status AS biz_order_status,
      u.nickname AS user_name, u.phone AS user_phone, t.name AS template_name
    FROM qc_orders q
    LEFT JOIN orders o ON o.id = q.order_id
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN qc_templates t ON t.id = q.template_id
    WHERE q.id = ? LIMIT 1`, [id]
  );
  if (!qcRows.length) throw new Error('质检单不存在');
  const qc = qcRows[0];

  let standard = null;
  if (qc.standard_id) {
    const std = await db.query('SELECT * FROM qc_standards WHERE id=?', [qc.standard_id]);
    if (std.length) {
      const snap = parseSnapshot(std[0].snapshot) || {};
      standard = {
        id: std[0].id,
        version_no: std[0].version_no,
        published_at: std[0].published_at,
        items: snap.items || [],
        grades: snap.grades || []
      };
    }
  }

  const [results, media, reviews] = await Promise.all([
    db.query('SELECT * FROM qc_results WHERE qc_order_id=?', [id]),
    db.query('SELECT * FROM qc_media WHERE qc_order_id=? ORDER BY id DESC', [id]),
    db.query('SELECT * FROM qc_reviews WHERE qc_order_id=? ORDER BY id DESC', [id])
  ]);
  return { qc, standard, results, media, reviews };
}

async function loadTemplate(id) {
  const rows = await db.query('SELECT * FROM qc_templates WHERE id=?', [id]);
  if (!rows.length) throw new Error('模板不存在');
  const tpl = rows[0];
  const [items, grades, versions] = await Promise.all([
    db.query('SELECT * FROM qc_items WHERE template_id=? ORDER BY sort_order, id', [id]),
    db.query('SELECT * FROM qc_grade_rules WHERE template_id=? ORDER BY sort_order, id', [id]),
    db.query('SELECT id, version_no, changelog, status, published_at FROM qc_standards WHERE template_id=? ORDER BY id DESC', [id])
  ]);
  tpl.items = items.map((it) => ({ ...it, fault_options: parseJsonArray(it.fault_options) }));
  tpl.grades = grades;
  tpl.versions = versions;
  return tpl;
}

function dateStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function formatNow() {
  return new Date().toLocaleString('zh-CN', { hour12: false });
}

module.exports = router;
