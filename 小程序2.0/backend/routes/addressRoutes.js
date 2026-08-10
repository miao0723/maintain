// backend/routes/addressRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// 获取地址列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('获取地址列表 - userId:', req.user.id);
    const addresses = await db.query(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );

    console.log('查询到的地址数量:', addresses.length);
    res.json(addresses || []);
  } catch (error) {
    console.error('获取地址列表失败:', error);
    console.error('错误详情:', error.message);
    res.status(500).json({ error: '获取地址列表失败', message: error.message });
  }
});

// 创建地址
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { contact_name, contact_phone, province, city, district, detail_address, postal_code, tags, is_default } = req.body;

    // 验证必填字段
    if (!contact_name || !contact_phone || !province || !city || !district || !detail_address) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    // 如果设置为默认地址，先取消其他地址的默认状态
    if (is_default) {
      await db.query(
        'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
        [req.user.id]
      );
    }

    const result = await db.query(
      `INSERT INTO user_addresses (user_id, contact_name, contact_phone, province, city, district, detail_address, postal_code, tags, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        contact_name,
        contact_phone,
        province,
        city,
        district,
        detail_address,
        postal_code,
        JSON.stringify(tags || []),
        is_default || false
      ]
    );

    const newAddress = await db.query(
      'SELECT * FROM user_addresses WHERE id = ?',
      [result.insertId]
    );

    res.json(newAddress[0]);
  } catch (error) {
    console.error('创建地址失败:', error);
    res.status(500).json({ error: '创建地址失败', message: error.message });
  }
});

// 更新地址
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const addressId = req.params.id;
    const { contact_name, contact_phone, province, city, district, detail_address, postal_code, tags, is_default } = req.body;

    // 验证地址是否属于当前用户
    const existingAddress = await db.query(
      'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, req.user.id]
    );

    if (existingAddress.length === 0) {
      return res.status(404).json({ error: '地址不存在' });
    }

    // 如果设置为默认地址，先取消其他地址的默认状态
    if (is_default) {
      await db.query(
        'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
        [req.user.id]
      );
    }

    await db.query(
      `UPDATE user_addresses
       SET contact_name = ?, contact_phone = ?, province = ?, city = ?, district = ?, detail_address = ?, postal_code = ?, tags = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        contact_name,
        contact_phone,
        province,
        city,
        district,
        detail_address,
        postal_code,
        JSON.stringify(tags || []),
        is_default || false,
        addressId
      ]
    );

    const updatedAddress = await db.query(
      'SELECT * FROM user_addresses WHERE id = ?',
      [addressId]
    );

    res.json(updatedAddress[0]);
  } catch (error) {
    console.error('更新地址失败:', error);
    res.status(500).json({ error: '更新地址失败', message: error.message });
  }
});

// 删除地址
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const addressId = req.params.id;

    // 验证地址是否属于当前用户
    const existingAddress = await db.query(
      'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, req.user.id]
    );

    if (existingAddress.length === 0) {
      return res.status(404).json({ error: '地址不存在' });
    }

    await db.query(
      'DELETE FROM user_addresses WHERE id = ?',
      [addressId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('删除地址失败:', error);
    res.status(500).json({ error: '删除地址失败', message: error.message });
  }
});

// 设置默认地址
router.post('/:id/default', authenticateToken, async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.user.id;

    console.log('[设置默认地址] addressId:', addressId, 'userId:', userId);

    // 验证地址是否属于当前用户
    const existingAddress = await db.query(
      'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, userId]
    );

    if (existingAddress.length === 0) {
      return res.status(404).json({ success: false, error: '地址不存在' });
    }

    // 使用事务保证原子性
    await db.transaction(async (connection) => {
      // 取消该用户所有地址的默认状态
      await connection.query(
        'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
        [userId]
      );

      // 设置当前地址为默认
      await connection.query(
        'UPDATE user_addresses SET is_default = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [addressId]
      );
    });

    res.json({ success: true });
  } catch (error) {
    console.error('设置默认地址失败:', error);
    res.status(500).json({ success: false, error: '设置默认地址失败', message: error.message });
  }
});

module.exports = router;
