// backend/routes/unitRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// 获取单位列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const units = await db.query(
      'SELECT * FROM user_units WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );

    res.json(units);
  } catch (error) {
    console.error('获取单位列表失败:', error);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

// 创建单位
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, address, contact_name, contact_phone, is_default } = req.body;

    // 验证必填字段
    if (!name || !address || !contact_name || !contact_phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 如果设置为默认单位，先取消其他单位的默认状态
    if (is_default) {
      await db.query(
        'UPDATE user_units SET is_default = FALSE WHERE user_id = ?',
        [req.user.id]
      );
    }

    const result = await db.query(
      `INSERT INTO user_units (user_id, name, address, contact_name, contact_phone, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        name,
        address,
        contact_name,
        contact_phone,
        is_default || false
      ]
    );

    const newUnit = await db.query(
      'SELECT * FROM user_units WHERE id = ?',
      [result.insertId]
    );

    res.json(newUnit[0]);
  } catch (error) {
    console.error('创建单位失败:', error);
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

// 更新单位
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const unitId = req.params.id;
    const { name, address, contact_name, contact_phone, is_default } = req.body;

    // 验证单位是否属于当前用户
    const existingUnit = await db.query(
      'SELECT * FROM user_units WHERE id = ? AND user_id = ?',
      [unitId, req.user.id]
    );

    if (existingUnit.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // 如果设置为默认单位，先取消其他单位的默认状态
    if (is_default) {
      await db.query(
        'UPDATE user_units SET is_default = FALSE WHERE user_id = ?',
        [req.user.id]
      );
    }

    await db.query(
      `UPDATE user_units
       SET name = ?, address = ?, contact_name = ?, contact_phone = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name,
        address,
        contact_name,
        contact_phone,
        is_default || false,
        unitId
      ]
    );

    const updatedUnit = await db.query(
      'SELECT * FROM user_units WHERE id = ?',
      [unitId]
    );

    res.json(updatedUnit[0]);
  } catch (error) {
    console.error('更新单位失败:', error);
    res.status(500).json({ error: 'Failed to update unit' });
  }
});

// 删除单位
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const unitId = req.params.id;

    // 验证单位是否属于当前用户
    const existingUnit = await db.query(
      'SELECT * FROM user_units WHERE id = ? AND user_id = ?',
      [unitId, req.user.id]
    );

    if (existingUnit.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    await db.query(
      'DELETE FROM user_units WHERE id = ?',
      [unitId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('删除单位失败:', error);
    res.status(500).json({ error: 'Failed to delete unit' });
  }
});

// 设置默认单位
router.post('/:id/default', authenticateToken, async (req, res) => {
  try {
    const unitId = req.params.id;

    // 验证单位是否属于当前用户
    const existingUnit = await db.query(
      'SELECT * FROM user_units WHERE id = ? AND user_id = ?',
      [unitId, req.user.id]
    );

    if (existingUnit.length === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // 取消其他单位的默认状态
    await db.query(
      'UPDATE user_units SET is_default = FALSE WHERE user_id = ?',
      [req.user.id]
    );

    // 设置当前单位为默认
    await db.query(
      'UPDATE user_units SET is_default = TRUE WHERE id = ?',
      [unitId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('设置默认单位失败:', error);
    res.status(500).json({ error: 'Failed to set default unit' });
  }
});

module.exports = router;