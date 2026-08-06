const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database.js');

/**
 * 生成申请编号
 */
function generateApplyNo() {
  const now = new Date();
  const dateStr = now.getFullYear().toString()
    + String(now.getMonth() + 1).padStart(2, '0')
    + String(now.getDate()).padStart(2, '0')
    + String(now.getHours()).padStart(2, '0')
    + String(now.getMinutes()).padStart(2, '0')
    + String(now.getSeconds()).padStart(2, '0');
  const rand = Math.floor(100 + Math.random() * 900);
  return 'PA' + dateStr + rand;
}

/**
 * 获取进度申请统计
 * GET /api/progress-apply/statistics
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const totalResult = await db.query('SELECT COUNT(*) as total FROM progress_apply');
    const pendingResult = await db.query("SELECT COUNT(*) as total FROM progress_apply WHERE approval_status = 'pending'");
    const approvedResult = await db.query("SELECT COUNT(*) as total FROM progress_apply WHERE approval_status = 'approved'");
    const rejectedResult = await db.query("SELECT COUNT(*) as total FROM progress_apply WHERE approval_status = 'rejected'");

    res.json({
      success: true,
      data: {
        total: totalResult[0]?.total || 0,
        pending: pendingResult[0]?.total || 0,
        approved: approvedResult[0]?.total || 0,
        rejected: rejectedResult[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('获取进度申请统计失败:', error);
    res.status(500).json({ success: false, error: '获取统计失败: ' + error.message });
  }
});

/**
 * 获取进度申请列表 (支持分页和筛选)
 * GET /api/progress-apply
 * 管理员: 查看所有; 普通用户: 只看自己的
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role || 'user';
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // 普通用户只能看自己的申请
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      whereClause += ' AND pa.user_id = ?';
      params.push(userId);
    }

    // 筛选条件
    if (req.query.apply_no) {
      whereClause += ' AND pa.apply_no LIKE ?';
      params.push('%' + req.query.apply_no + '%');
    }
    if (req.query.approval_status) {
      whereClause += ' AND pa.approval_status = ?';
      params.push(req.query.approval_status);
    }
    if (req.query.order_id) {
      whereClause += ' AND pa.order_id = ?';
      params.push(parseInt(req.query.order_id));
    }
    if (req.query.user_id && (userRole === 'admin' || userRole === 'super_admin')) {
      whereClause += ' AND pa.user_id = ?';
      params.push(parseInt(req.query.user_id));
    }

    // 查询总数
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM progress_apply pa ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    // 查询列表 (关联订单和设备信息)
    const list = await db.query(
      `SELECT pa.*, o.device_model as order_device_model, o.status as order_status,
              u.nickname as user_nickname, u.real_name as user_real_name
       FROM progress_apply pa
       LEFT JOIN orders o ON pa.order_id = o.id
       LEFT JOIN users u ON pa.user_id = u.id
       ${whereClause}
       ORDER BY pa.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      success: true,
      data: {
        list: list,
        total: total,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取进度申请列表失败:', error);
    res.status(500).json({ success: false, error: '获取列表失败: ' + error.message });
  }
});

/**
 * 获取当前用户的进度申请列表 (必须在/:id之前注册)
 * GET /api/progress-apply/my/list
 */
router.get('/my/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const status = req.query.approval_status || '';

    let whereClause = 'WHERE pa.user_id = ?';
    const params = [userId];

    if (status) {
      whereClause += ' AND pa.approval_status = ?';
      params.push(status);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM progress_apply pa ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const list = await db.query(
      `SELECT pa.*, o.device_model as order_device_model, o.status as order_status,
              o.device_type, o.problem_description as order_fault_desc
       FROM progress_apply pa
       LEFT JOIN orders o ON pa.order_id = o.id
       ${whereClause}
       ORDER BY pa.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      success: true,
      data: {
        list: list,
        total: total,
        page: page,
        pageSize: pageSize
      }
    });
  } catch (error) {
    console.error('获取我的申请列表失败:', error);
    res.status(500).json({ success: false, error: '获取失败: ' + error.message });
  }
});

/**
 * 获取进度申请详情
 * GET /api/progress-apply/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role || 'user';

    const rows = await db.query(
      `SELECT pa.*, o.device_model as order_device_model, o.status as order_status,
              o.device_type as order_device_type, o.problem_description as order_fault_desc,
              u.nickname as user_nickname, u.real_name as user_real_name,
              u.avatar_url as user_avatar_url
       FROM progress_apply pa
       LEFT JOIN orders o ON pa.order_id = o.id
       LEFT JOIN users u ON pa.user_id = u.id
       WHERE pa.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: '申请记录不存在' });
    }

    const apply = rows[0];

    // 权限检查: 管理员可查看所有, 普通用户只能看自己的
    if (userRole !== 'admin' && userRole !== 'super_admin' && apply.user_id !== userId) {
      return res.status(403).json({ success: false, error: '无权查看此申请' });
    }

    res.json({ success: true, data: apply });
  } catch (error) {
    console.error('获取申请详情失败:', error);
    res.status(500).json({ success: false, error: '获取详情失败: ' + error.message });
  }
});

/**
 * 创建进度申请 (用户发起)
 * POST /api/progress-apply
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_id, customer_name, phone, device_name, device_model,
            progress_type, apply_reason, expected_time } = req.body;

    // 必填字段校验
    if (!order_id) {
      return res.status(400).json({ success: false, error: '请选择关联订单' });
    }
    if (!customer_name) {
      return res.status(400).json({ success: false, error: '客户姓名不能为空' });
    }
    if (!phone) {
      return res.status(400).json({ success: false, error: '联系电话不能为空' });
    }
    if (!progress_type) {
      return res.status(400).json({ success: false, error: '进度类型不能为空' });
    }
    if (!apply_reason) {
      return res.status(400).json({ success: false, error: '申请原因不能为空' });
    }

    // 验证订单是否存在且属于该用户
    const orderCheck = await db.query(
      'SELECT id, user_id, device_model, device_type, status FROM orders WHERE id = ?',
      [order_id]
    );

    if (orderCheck.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const order = orderCheck[0];

    // 检查: 用户只能对自己发起的订单或分配给自己的订单申请进度
    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, error: '无权对此订单申请进度' });
    }

    // 检查: 只有维修中的订单可以申请进度
    if (order.status !== 'processing' && order.status !== 'confirmed') {
      return res.status(400).json({ success: false, error: '只能对维修中或已确认的订单申请进度' });
    }

    // 生成申请编号
    const applyNo = generateApplyNo();
    const deviceName = device_name || '';
    const deviceModel = device_model || order.device_model || '';

    const result = await db.query(
      `INSERT INTO progress_apply (apply_no, order_id, user_id, customer_name, phone,
        device_name, device_model, progress_type, apply_reason, expected_time,
        approval_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [applyNo, order_id, userId, customer_name, phone,
       deviceName, deviceModel, progress_type, apply_reason,
       expected_time || null]
    );

    // 查询新创建的记录
    const newApply = await db.query(
      'SELECT * FROM progress_apply WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: '进度申请已提交，请等待审核',
      data: newApply[0]
    });
  } catch (error) {
    console.error('创建进度申请失败:', error);
    res.status(500).json({ success: false, error: '创建失败: ' + error.message });
  }
});

/**
 * 审批通过
 * POST /api/progress-apply/:id/approve
 */
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const approverId = req.user.id;
    const userRole = req.user.role || 'user';
    const { approval_remark } = req.body;

    // 仅管理员可审批
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return res.status(403).json({ success: false, error: '无权审批，需要管理员权限' });
    }

    const rows = await db.query('SELECT * FROM progress_apply WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: '申请记录不存在' });
    }

    if (rows[0].approval_status !== 'pending') {
      return res.status(400).json({ success: false, error: '该申请已处理，不能重复审批' });
    }

    await db.query(
      `UPDATE progress_apply SET approval_status = 'approved',
        approval_remark = ?, approval_at = NOW(),
        approver_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [approval_remark || '同意申请', approverId, id]
    );

    const updated = await db.query('SELECT * FROM progress_apply WHERE id = ?', [id]);

    res.json({ success: true, message: '审批通过', data: updated[0] });
  } catch (error) {
    console.error('审批通过失败:', error);
    res.status(500).json({ success: false, error: '操作失败: ' + error.message });
  }
});

/**
 * 审批拒绝
 * POST /api/progress-apply/:id/reject
 */
router.post('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const approverId = req.user.id;
    const userRole = req.user.role || 'user';
    const { approval_remark } = req.body;

    // 仅管理员可审批
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return res.status(403).json({ success: false, error: '无权审批，需要管理员权限' });
    }

    if (!approval_remark) {
      return res.status(400).json({ success: false, error: '拒绝原因不能为空' });
    }

    const rows = await db.query('SELECT * FROM progress_apply WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: '申请记录不存在' });
    }

    if (rows[0].approval_status !== 'pending') {
      return res.status(400).json({ success: false, error: '该申请已处理，不能重复审批' });
    }

    await db.query(
      `UPDATE progress_apply SET approval_status = 'rejected',
        approval_remark = ?, approval_at = NOW(),
        approver_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [approval_remark, approverId, id]
    );

    const updated = await db.query('SELECT * FROM progress_apply WHERE id = ?', [id]);

    res.json({ success: true, message: '已拒绝申请', data: updated[0] });
  } catch (error) {
    console.error('审批拒绝失败:', error);
    res.status(500).json({ success: false, error: '操作失败: ' + error.message });
  }
});

/**
 * 删除进度申请
 * DELETE /api/progress-apply/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role || 'user';

    const rows = await db.query('SELECT * FROM progress_apply WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: '申请记录不存在' });
    }

    // 只有申请人本人或管理员可以删除
    if (rows[0].user_id !== userId && userRole !== 'admin' && userRole !== 'super_admin') {
      return res.status(403).json({ success: false, error: '无权删除此申请' });
    }

    await db.query('DELETE FROM progress_apply WHERE id = ?', [id]);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除申请失败:', error);
    res.status(500).json({ success: false, error: '删除失败: ' + error.message });
  }
});

module.exports = router;