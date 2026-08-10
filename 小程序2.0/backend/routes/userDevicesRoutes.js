const express = require('express');
const router = express.Router();
const db = require('../database');
const jwt = require('jsonwebtoken');
const { computeWarranty, warrantyStatus } = require('../utils/afterSales');

// JWT验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: '未登录，请先登录' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: '登录已过期，请重新登录' });
    }
    req.user = user;
    next();
  });
};

/**
 * GET /api/user-devices
 * 获取当前用户的设备列表
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    // purpose=repair|recycle 时只返回"可用于该用途"的设备（含 both）
    const purpose = req.query.purpose;
    let purposeFilter = '';
    const params = [userId];
    if (purpose === 'repair' || purpose === 'recycle') {
      purposeFilter = ' AND (d.device_purpose = ? OR d.device_purpose = \'both\')';
      params.push(purpose);
    }

    const devices = await db.query(
      `SELECT d.*,
              CASE WHEN d.device_type_id = 0 THEN d.device_type_name ELSE dt.name END AS device_type_name,
              dt.icon AS device_type_icon
       FROM user_devices d
       LEFT JOIN device_types dt ON d.device_type_id = dt.id
       WHERE d.user_id = ?${purposeFilter}
       ORDER BY d.is_default DESC, d.updated_at DESC`,
      params
    );

    // 计算每个设备的质保状态（取最近一笔已完成订单）
    for (const d of devices) {
      try {
        const w = await db.query(
          `SELECT id, completed_at, updated_at, warranty_end_date, warranty_period_days
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
          d.warranty_status = st.status;
          d.warranty_remaining_days = st.remaining_days;
          d.warranty_end_date = info.warranty_end_date;
          d.last_order_id = info.id;
        } else {
          d.warranty_status = 'none';
          d.warranty_remaining_days = 0;
        }
      } catch (e) {
        d.warranty_status = 'none';
        d.warranty_remaining_days = 0;
      }
    }

    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    console.error('获取设备列表失败:', error);
    res.status(500).json({ success: false, error: '获取设备列表失败' });
  }
});

/**
 * GET /api/user-devices/:id
 * 获取单个设备详情
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const deviceId = req.params.id;

    const devices = await db.query(
      `SELECT d.*,
              CASE WHEN d.device_type_id = 0 THEN d.device_type_name ELSE dt.name END AS device_type_name,
              dt.icon AS device_type_icon
       FROM user_devices d
       LEFT JOIN device_types dt ON d.device_type_id = dt.id
       WHERE d.id = ? AND d.user_id = ?`,
      [deviceId, userId]
    );

    if (devices.length === 0) {
      return res.status(404).json({ success: false, error: '设备不存在' });
    }

    res.json({
      success: true,
      data: devices[0]
    });
  } catch (error) {
    console.error('获取设备详情失败:', error);
    res.status(500).json({ success: false, error: '获取设备详情失败' });
  }
});

/**
 * POST /api/user-devices
 * 添加用户设备
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      device_type_id,
      device_type_name,
      brand_name,
      device_model,
      device_nickname,
      serial_number,
      device_condition,
      purchase_date,
      is_default,
      device_purpose
    } = req.body;

    // 设备用途标签校验（repair/recycle/both，默认 both）
    const PURPOSE_VALUES = ['repair', 'recycle', 'both'];
    const normalizedPurpose = PURPOSE_VALUES.includes(device_purpose) ? device_purpose : 'both';

    // 校验必填字段（注意：device_type_id 可以为 0，表示自定义类型）
    if (device_type_id === null || device_type_id === undefined || device_type_id === '') {
      return res.status(400).json({ success: false, error: '请选择设备类型' });
    }
    if (!device_model || !device_model.trim()) {
      return res.status(400).json({ success: false, error: '请输入设备型号' });
    }
    // 自定义类型必须提供类型名称
    if (device_type_id === 0 && (!device_type_name || !device_type_name.trim())) {
      return res.status(400).json({ success: false, error: '请输入设备类型名称' });
    }

    // 校验设备类型是否存在（自定义类型 id=0 跳过）
    if (device_type_id !== 0) {
      const deviceType = await db.query('SELECT id FROM device_types WHERE id = ?', [device_type_id]);
      if (deviceType.length === 0) {
        return res.status(400).json({ success: false, error: '设备类型不存在' });
      }
    }

    // 统计当前用户已绑定的设备数量（最多10个）
    const countResult = await db.query(
      'SELECT COUNT(*) AS count FROM user_devices WHERE user_id = ?',
      [userId]
    );
    if (countResult[0].count >= 10) {
      return res.status(400).json({ success: false, error: '最多绑定10个设备，请先删除不再使用的设备' });
    }

    // 如果设为默认，先将该用户其他设备取消默认
    if (is_default) {
      await db.query('UPDATE user_devices SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    const result = await db.query(
      `INSERT INTO user_devices (user_id, device_type_id, device_type_name, brand_name, device_model, device_nickname, serial_number, device_condition, purchase_date, is_default, device_purpose)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        device_type_id,
        device_type_id === 0 ? (device_type_name || '').trim() : null,
        brand_name || null,
        device_model.trim(),
        device_nickname || null,
        serial_number || null,
        device_condition || null,
        purchase_date || null,
        is_default ? 1 : 0,
        normalizedPurpose
      ]
    );

    const newDevice = await db.query(
      `SELECT d.*,
              CASE WHEN d.device_type_id = 0 THEN d.device_type_name ELSE dt.name END AS device_type_name
       FROM user_devices d
       LEFT JOIN device_types dt ON d.device_type_id = dt.id
       WHERE d.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: '设备添加成功',
      data: newDevice[0]
    });
  } catch (error) {
    console.error('添加设备失败:', error);
    res.status(500).json({ success: false, error: '添加设备失败' });
  }
});

/**
 * PUT /api/user-devices/:id
 * 更新用户设备
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const deviceId = req.params.id;
    const {
      device_type_id,
      device_type_name,
      brand_name,
      device_model,
      device_nickname,
      serial_number,
      device_condition,
      purchase_date,
      is_default,
      device_purpose
    } = req.body;

    // 设备用途标签校验（repair/recycle/both，默认 both）
    const PURPOSE_VALUES = ['repair', 'recycle', 'both'];
    const normalizedPurpose = PURPOSE_VALUES.includes(device_purpose) ? device_purpose : 'both';

    // 校验设备是否存在且属于当前用户
    const existing = await db.query(
      'SELECT * FROM user_devices WHERE id = ? AND user_id = ?',
      [deviceId, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: '设备不存在' });
    }

    // 校验必填字段（注意：device_type_id 可以为 0，表示自定义类型）
    if (device_type_id === null || device_type_id === undefined || device_type_id === '') {
      return res.status(400).json({ success: false, error: '请选择设备类型' });
    }
    if (!device_model || !device_model.trim()) {
      return res.status(400).json({ success: false, error: '请输入设备型号' });
    }
    // 自定义类型必须提供类型名称
    if (device_type_id === 0 && (!device_type_name || !device_type_name.trim())) {
      return res.status(400).json({ success: false, error: '请输入设备类型名称' });
    }

    // 如果设为默认，先将该用户其他设备取消默认
    if (is_default) {
      await db.query('UPDATE user_devices SET is_default = 0 WHERE user_id = ? AND id != ?', [userId, deviceId]);
    }

    await db.query(
      `UPDATE user_devices SET
       device_type_id = ?, device_type_name = ?, brand_name = ?, device_model = ?, device_nickname = ?,
       serial_number = ?, device_condition = ?, purchase_date = ?, is_default = ?, device_purpose = ?
       WHERE id = ? AND user_id = ?`,
      [
        device_type_id,
        device_type_id === 0 ? (device_type_name || '').trim() : null,
        brand_name || null,
        device_model.trim(),
        device_nickname || null,
        serial_number || null,
        device_condition || null,
        purchase_date || null,
        is_default ? 1 : 0,
        normalizedPurpose,
        deviceId,
        userId
      ]
    );

    const updatedDevice = await db.query(
      `SELECT d.*,
              CASE WHEN d.device_type_id = 0 THEN d.device_type_name ELSE dt.name END AS device_type_name
       FROM user_devices d
       LEFT JOIN device_types dt ON d.device_type_id = dt.id
       WHERE d.id = ?`,
      [deviceId]
    );

    res.json({
      success: true,
      message: '设备更新成功',
      data: updatedDevice[0]
    });
  } catch (error) {
    console.error('更新设备失败:', error);
    res.status(500).json({ success: false, error: '更新设备失败' });
  }
});

/**
 * DELETE /api/user-devices/:id
 * 删除用户设备
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const deviceId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ success: false, error: '用户身份验证失败' });
    }
    if (!deviceId || isNaN(deviceId)) {
      return res.status(400).json({ success: false, error: '无效的设备ID' });
    }

    console.log(`[DELETE /user-devices] userId=${userId}, deviceId=${deviceId}`);

    // 先检查设备是否存在
    const existing = await db.query(
      'SELECT id, device_model FROM user_devices WHERE id = ? AND user_id = ?',
      [deviceId, userId]
    );
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: '设备不存在或无权操作' });
    }

    const deviceName = existing[0].device_model || '设备';
    console.log(`[DELETE /user-devices] 找到设备: ${deviceName}, 准备删除...`);

    // 执行删除
    const deleteResult = await db.query(
      'DELETE FROM user_devices WHERE id = ? AND user_id = ?',
      [deviceId, userId]
    );
    console.log(`[DELETE /user-devices] 删除结果:`, deleteResult);

    res.json({
      success: true,
      message: '设备已删除',
      data: { id: deviceId, name: deviceName }
    });
  } catch (error) {
    // 详细记录错误信息
    console.error('删除设备失败 ====================');
    console.error('错误消息:', error.message);
    console.error('错误代码:', error.code);
    console.error('错误号:', error.errno);
    console.error('SQL状态:', error.sqlState);
    console.error('SQL消息:', error.sqlMessage);
    console.error('完整错误:', error);
    console.error('==================================');

    // 外键约束错误
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(409).json({
        success: false,
        error: '该设备已被关联到维修工单，无法删除。请先删除相关工单后再试。'
      });
    }

    // 其他数据库错误
    res.status(500).json({
      success: false,
      error: '删除设备失败，请稍后重试',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/user-devices/:id/default
 * 设置默认设备
 */
router.post('/:id/default', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const deviceId = req.params.id;

    const existing = await db.query(
      'SELECT * FROM user_devices WHERE id = ? AND user_id = ?',
      [deviceId, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: '设备不存在' });
    }

    // 先将该用户所有设备取消默认
    await db.query('UPDATE user_devices SET is_default = 0 WHERE user_id = ?', [userId]);
    // 设置当前设备为默认
    await db.query('UPDATE user_devices SET is_default = 1 WHERE id = ? AND user_id = ?', [deviceId, userId]);

    res.json({
      success: true,
      message: '已设为默认设备'
    });
  } catch (error) {
    console.error('设置默认设备失败:', error);
    res.status(500).json({ success: false, error: '设置默认设备失败' });
  }
});

module.exports = router;
