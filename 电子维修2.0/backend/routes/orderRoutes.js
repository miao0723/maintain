const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database.js');
const { ensureOrderPaymentColumns, isMissingColumnError: isPaymentMissingColumnError } = require('../services/orderPaymentSchema');
const { computeWarranty, warrantyStatus } = require('../utils/afterSales');
const { expireOldReviewOrders } = require('../utils/reviewExpire');
const { recordOrderIncome } = require('../services/incomeService');

async function hasOrderColumn(columnName) {
  const columns = await db.query(
    `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = ?`,
    [columnName]
  );
  return columns.length > 0;
}

async function ensureQuoteUnreadColumn() {
  const exists = await hasOrderColumn('quote_unread');
  if (exists) {
    return;
  }

  try {
    await db.query(
      `ALTER TABLE orders
       ADD COLUMN quote_unread TINYINT(1) NULL DEFAULT 0 COMMENT '用户是否有未读报价提醒: 0-已读, 1-未读'`
    );
  } catch (error) {
    const duplicateColumn = error && (error.code === 'ER_DUP_FIELDNAME' || error.errno === 1060 || String(error.message || '').includes('Duplicate column'));
    if (!duplicateColumn) {
      throw error;
    }
  }
}

async function ensureOrderPaymentColumnsIfNeeded(error) {
  const isMissingColumn = isPaymentMissingColumnError(error);
  if (!isMissingColumn) {
    throw error;
  }
  await ensureOrderPaymentColumns();
}

async function ensureRepairReportFilesColumn() {
  try {
    await db.query(
      `ALTER TABLE orders
       ADD COLUMN repair_report_files JSON NULL COMMENT '维修报告返回文件列表'`
    );
  } catch (error) {
    const duplicateColumn = error && (error.code === 'ER_DUP_FIELDNAME' || error.errno === 1060 || String(error.message || '').includes('Duplicate column'));
    if (!duplicateColumn) {
      throw error;
    }
  }
}

function parseJsonFiles(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return [];
    }
  }
  return [];
}

async function tryMarkQuoteUnread(orderId, unreadValue) {
  await ensureQuoteUnreadColumn();

  try {
    await db.query(
      'UPDATE orders SET quote_unread = ?, updated_at = NOW() WHERE id = ?',
      [unreadValue ? 1 : 0, orderId]
    );
  } catch (error) {
    const isMissingColumn = error && (error.code === 'ER_BAD_FIELD_ERROR' || error.errno === 1054 || String(error.message || '').includes('Unknown column'));
    if (!isMissingColumn) {
      throw error;
    }
    await ensureQuoteUnreadColumn();
    await db.query(
      'UPDATE orders SET quote_unread = ?, updated_at = NOW() WHERE id = ?',
      [unreadValue ? 1 : 0, orderId]
    );
  }
}

/**
 * 创建订单
 * POST /api/orders/create
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      orderType,
      deviceType,
      deviceId,
      userDeviceId,
      isWarranty,
      originalOrderId,
      problem,
      description,
      images,
      serviceType,
      brand,
      model,
      estimatedPrice,
      address,
      addressId: frontendAddressId,
      deviceCondition,
      isWaitingPrice,
      deviceTypeName
    } = req.body;

    console.log('创建订单 - 完整请求数据:', JSON.stringify(req.body, null, 2));
    console.log('userId:', userId, 'orderType:', orderType, 'problem:', problem, 'description:', description);

    // 验证必填字段 - 检查 problem 或 description 至少有一个有值
    const hasDescription = (problem && problem.trim() !== '') || (description && description.trim() !== '');

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '用户ID不能为空'
      });
    }

    if (!orderType) {
      return res.status(400).json({
        success: false,
        error: '订单类型不能为空'
      });
    }

    if (!hasDescription) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段，请填写故障描述'
      });
    }

    // 生成订单号
    const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 处理设备类型ID
    let deviceTypeId = 8; // 默认值（其他设备）
    let customDeviceTypeName = null; // 自定义设备类型名称

    // 将 deviceId 转换为数字（可能是字符串型号ID，如 'iphone-17-pro-max'）
    const numericDeviceId = Number(deviceId);
    const isValidNumericId = deviceId !== null && deviceId !== undefined && !isNaN(numericDeviceId);

    if (isValidNumericId && numericDeviceId === 0) {
      // 自定义设备类型：device_type 存 0，名称存 device_type_name
      deviceTypeId = 0;
      customDeviceTypeName = deviceTypeName || deviceType || '自定义设备';
    } else if (isValidNumericId) {
      // deviceId 是有效数字（如维修订单）
      deviceTypeId = numericDeviceId;
    }

    // deviceTypeId 仍是默认值时，尝试通过 deviceType 名称查找
    if (deviceTypeId === 8 && deviceType) {
      if (typeof deviceType === 'number' && deviceType !== 0) {
        deviceTypeId = deviceType;
      } else if (typeof deviceType === 'string' && deviceType.trim() !== '') {
        try {
          const deviceTypeResult = await db.query(
            'SELECT id FROM device_types WHERE name = ? LIMIT 1',
            [deviceType]
          );
          if (deviceTypeResult.length > 0) {
            deviceTypeId = deviceTypeResult[0].id;
          } else {
            console.log('[订单创建] 未找到设备类型:', deviceType, '使用默认值: 8');
          }
        } catch (err) {
          console.log('[订单创建] 查询设备类型失败:', err.message, '使用默认值: 8');
        }
      }
    }

    console.log('[订单创建] deviceType:', deviceType, 'deviceId:', deviceId, 'numericDeviceId:', numericDeviceId, '最终deviceTypeId:', deviceTypeId, 'deviceTypeName:', deviceTypeName);

    // 获取品牌ID（如果有品牌名称）
    let brandId = null;
    if (brand) {
      const brandResult = await db.query(
        'SELECT id FROM brands WHERE name = ? LIMIT 1',
        [brand]
      );
      if (brandResult.length > 0) {
        brandId = brandResult[0].id;
      }
    }

    // 处理地址
    let addressId = frontendAddressId || null;

    // 如果 serviceType 是上门且传入了地址对象，尝试匹配或创建地址
    if (serviceType === 'home' && address && !addressId) {
      // address 可以是格式化字符串或对象
      if (typeof address === 'string') {
        // 字符串格式的地址，尝试解析
        const nameMatch = address.match(/^(\S+)\s/);
        const phoneMatch = address.match(/(\d{11})/);
        if (nameMatch && phoneMatch) {
          const addressResult = await db.query(
            `SELECT id FROM user_addresses
             WHERE user_id = ? AND contact_name = ? AND contact_phone = ?
             LIMIT 1`,
            [userId, nameMatch[1], phoneMatch[1]]
          );
          if (addressResult.length > 0) {
            addressId = addressResult[0].id;
          }
        }
      } else if (typeof address === 'object') {
        // 对象格式的地址
        try {
          const addressResult = await db.query(
            `SELECT id FROM user_addresses
             WHERE user_id = ?
             AND contact_name = ?
             AND contact_phone = ?
             AND province = ?
             AND city = ?
             AND district = ?
             AND detail_address = ?
             LIMIT 1`,
            [
              userId,
              address.contactName,
              address.contactPhone,
              address.province,
              address.city,
              address.district,
              address.detail
            ]
          );

          if (addressResult.length > 0) {
            addressId = addressResult[0].id;
          } else {
            // 创建新地址
            const insertAddressResult = await db.query(
              `INSERT INTO user_addresses (
                user_id, contact_name, contact_phone, province, city, district,
                detail_address, is_default, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                userId,
                address.contactName,
                address.contactPhone,
                address.province,
                address.city,
                address.district,
                address.detail,
                false
              ]
            );
            addressId = insertAddressResult.insertId;
          }
        } catch (err) {
          console.log('[订单创建] 地址处理失败:', err.message);
        }
      }
    }

    console.log('[订单创建] 最终 addressId:', addressId);

    // 处理图片数据
    const imagesJson = Array.isArray(images) ? JSON.stringify(images) : (images ? JSON.stringify([images]) : null);

    // 处理设备状态（将中文映射为数据库枚举值）
    let conditionValue = deviceCondition || '';
    const conditionMap = {
      '全新未使用': 'good',
      '九成新': 'good',
      '八成新': 'normal',
      '七成新': 'fair',
      '六成新及以下': 'poor',
      'good': 'good',
      'normal': 'normal',
      'fair': 'fair',
      'poor': 'poor'
    };
    if (conditionMap[conditionValue]) {
      conditionValue = conditionMap[conditionValue];
    } else if (conditionValue && !['good', 'normal', 'fair', 'poor'].includes(conditionValue)) {
      // 无法映射的中文值，默认为 normal
      conditionValue = 'normal';
    }

    // 插入订单
    const insertResult = await db.query(
      `INSERT INTO orders (
        order_id, user_id, device_id, order_type, device_type, device_type_name, problem_description,
        custom_description, images, service_type, brand_id, device_model,
        device_condition, estimated_price, status, address_id, created_at, updated_at, progress, priority,
        is_warranty, original_order_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW(), 0, 0, ?, ?)`,
      [
        orderNo,
        userId,
        userDeviceId ? parseInt(userDeviceId) : null,
        orderType,
        deviceTypeId,
        customDeviceTypeName,
        problem,
        description || '',
        imagesJson,
        serviceType || 'shop',
        brandId,
        model || '',
        conditionValue || 'normal',
        estimatedPrice || 0,
        addressId,
        isWarranty ? 1 : 0,
        originalOrderId ? parseInt(originalOrderId) : null
      ]
    );

    const orderId = insertResult.insertId;

    // 查询创建的订单信息
    const orderResult = await db.query(
      `SELECT
        o.id,
        o.order_id as order_no,
        o.user_id,
        o.order_type,
        o.device_type,
        o.problem_description,
        o.custom_description,
        o.images,
        o.service_type,
        o.brand_id,
        o.device_model,
        o.device_condition,
        o.estimated_price,
        o.actual_price,
        o.status,
        o.address_id,
        o.created_at,
        o.updated_at,
        o.progress,
        o.priority,
        CASE WHEN o.device_type = 0 THEN o.device_type_name ELSE d.name END as device_type_name,
        b.name as brand_name
       FROM orders o
       LEFT JOIN device_types d ON o.device_type = d.id
       LEFT JOIN brands b ON o.brand_id = b.id
       WHERE o.id = ?`,
      [orderId]
    );

    const order = orderResult[0];

    // 处理图片数据
    if (order.images) {
      try {
        order.images = typeof order.images === 'string'
          ? JSON.parse(order.images)
          : order.images;
      } catch (e) {
        order.images = [];
      }
    }

    res.json({
      success: true,
      message: '订单创建成功',
      data: {
        order_id: orderNo,
        order_id_numeric: orderId,
        estimated_price: estimatedPrice || 0,
        order: order
      }
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({
      success: false,
      error: '创建订单失败: ' + error.message
    });
  }
});

/**
 * 获取用户待确认报价的订单数量
 * GET /api/orders/quoted-count
 */
router.get('/quoted-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND status = 'quoted'`,
      [userId]
    );

    const count = result[0]?.count || 0;
    res.json({ success: true, count });
  } catch (error) {
    console.error('获取报价数量错误:', error);
    res.status(500).json({ success: false, error: '获取报价数量失败' });
  }
});

/**
 * 获取用户未读进度更新的订单数量
 * GET /api/orders/progress-unread-count
 */
router.get('/progress-unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 查询有未读进度更新的订单数量（兼容列不存在的情况）
    let count = 0;
    try {
      const result = await db.query(
        `SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND progress_unread = 1 AND status IN ('processing', 'completed')`,
        [userId]
      );
      count = result[0]?.count || 0;
    } catch (dbErr) {
      // 如果 progress_unread 列不存在，回退到基于 updated_at 的判断
      if (dbErr.code === 'ER_BAD_FIELD_ERROR') {
        console.warn('[progress-unread-count] progress_unread列不存在，使用回退方案');
        const result = await db.query(
          `SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND status = 'processing' AND progress > 0`,
          [userId]
        );
        count = result[0]?.count || 0;
      } else {
        throw dbErr;
      }
    }

    res.json({ success: true, count });
  } catch (error) {
    console.error('获取未读进度数量错误:', error);
    res.status(500).json({ success: false, error: '获取未读进度数量失败' });
  }
});

/**
 * 获取用户未读进度更新的订单列表（简要信息）
 * GET /api/orders/progress-unread-list
 */
router.get('/progress-unread-list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    let orders = [];
    try {
      orders = await db.query(
        `SELECT o.id, o.order_id as order_no, o.device_model, o.progress, o.progress_updated_at,
                o.status, o.problem_description, o.progress_unread, o.quote_unread,
                d.name as device_type_name
         FROM orders o
         LEFT JOIN device_types d ON o.device_type = d.id
         WHERE o.user_id = ? AND o.progress_unread = 1 AND o.status IN ('processing', 'completed')
         ORDER BY o.progress_updated_at DESC`,
        [userId]
      );
    } catch (dbErr) {
      if (dbErr.code === 'ER_BAD_FIELD_ERROR') {
        console.warn('[progress-unread-list] progress_unread列不存在，使用回退方案');
        orders = await db.query(
          `SELECT o.id, o.order_id as order_no, o.device_model, o.progress,
                  o.status, o.problem_description, o.updated_at as progress_updated_at,
                  1 as progress_unread, 0 as quote_unread,
                  d.name as device_type_name
           FROM orders o
           LEFT JOIN device_types d ON o.device_type = d.id
           WHERE o.user_id = ? AND o.status = 'processing' AND o.progress > 0
           ORDER BY o.updated_at DESC`,
          [userId]
        );
      } else {
        throw dbErr;
      }
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('获取未读进度列表错误:', error);
    res.status(500).json({ success: false, error: '获取未读进度列表失败' });
  }
});

/**
 * 标记订单进度为已读
 * PUT /api/orders/:orderId/progress-read
 */
router.put('/:orderId/progress-read', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId) || 0;

    if (!orderId) {
      return res.status(400).json({ success: false, error: '无效的订单ID' });
    }

    // 标记进度为已读 - 不阻塞，不校验权限（只是辅助标记）
    // 即使失败也不影响主要功能，前端有 .catch(() => {}) 处理
    try {
      // 不校验订单存在性和权限，直接尝试更新
      // 如果 progress_unread 列不存在，会静默处理
      await db.query(
        'UPDATE orders SET progress_unread = 0 WHERE id = ?',
        [orderId]
      );
    } catch (dbErr) {
      const columnNotFoundCodes = ['ER_BAD_FIELD_ERROR', 'ER_BAD_FIELD', '1054'];
      const isColumnError = dbErr.code === 'ER_BAD_FIELD_ERROR'
        || (dbErr.errno === 1054)
        || dbErr.message?.includes('Unknown column');
      if (isColumnError) {
        console.warn('[progress-read] progress_unread列不存在，跳过标记');
      } else {
        // 其他错误也静默处理（表可能被锁定、连接问题等）
        console.warn('[progress-read] 标记已读时发生非致命错误:', dbErr.message || dbErr);
      }
    }

    res.json({ success: true, message: '已标记为已读' });
  } catch (error) {
    // 最外层兜底：不返回500，避免前端控制台报错
    console.warn('[progress-read] 非致命异常:', error.message || error);
    res.json({ success: true, message: '已处理' });
  }
});

/**
 * 标记订单报价为已读
 * PUT /api/orders/:orderId/quote-read
 */
router.put('/:orderId/quote-read', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId) || 0;
    if (!orderId) {
      return res.status(400).json({ success: false, error: '无效的订单ID' });
    }

    await tryMarkQuoteUnread(orderId, 0);
    res.json({ success: true, message: '报价已标记为已读' });
  } catch (error) {
    console.warn('[quote-read] 非致命异常:', error.message || error);
    res.json({ success: true, message: '已处理' });
  }
});

/**
 * 获取订单详情（包含所有关联数据）
 * GET /api/orders/:id/detail
 */
router.get('/:id/detail', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const isMissingColumnError = (error) => {
      return error && (
        error.code === 'ER_BAD_FIELD_ERROR' ||
        error.errno === 1054 ||
        String(error.message || '').includes('Unknown column')
      );
    };

    // 查询订单基本信息
    let orderResult;
    try {
      orderResult = await db.query(
        `SELECT
          o.id,
          o.order_id as order_no,
          o.user_id,
          o.order_type,
          o.device_type,
          o.problem_description,
          o.custom_description,
          o.images,
          o.service_type,
          o.brand_id,
          o.device_model,
          o.device_condition,
          o.estimated_price,
          o.actual_price,
          o.status,
          o.address_id,
          o.unit_id,
          o.created_at,
          o.updated_at,
          o.completed_at,
          o.assigned_to,
          o.assigned_at,
          o.progress,
          o.priority,
          o.progress_updated_at,
          o.progress_unread,
          o.quote_price,
          o.quote_description,
          o.quote_files,
          o.repair_report_files,
          o.quote_status,
          o.quote_unread,
          o.quote_created_at,
          o.quote_created_by,
          o.quote_rejected_reason,
          o.payment_status,
          o.pay_amount,
          o.out_trade_no,
          o.wechat_transaction_id,
          o.paid_at,
          o.refund_status,
          o.refund_amount,
          o.refund_no,
          o.refunded_at,
          CASE WHEN o.device_type = 0 THEN o.device_type_name ELSE d.name END as device_type_name,
          d.icon as device_type_icon,
          b.name as brand_name,
          ua.contact_name,
          ua.contact_phone,
          ua.province,
          ua.city,
          ua.district,
          ua.detail_address,
          ua.tags,
          ua.is_default as address_default,
          uu.name as unit_name,
          uu.address as unit_address,
          uu.contact_name as unit_contact_name,
          uu.contact_phone as unit_contact_phone,
          uu.is_default as unit_default
         FROM orders o
         LEFT JOIN device_types d ON o.device_type = d.id
         LEFT JOIN brands b ON o.brand_id = b.id
         LEFT JOIN user_addresses ua ON o.address_id = ua.id
         LEFT JOIN user_units uu ON o.unit_id = uu.id
         WHERE o.id = ?`,
        [orderId]
      );
    } catch (queryError) {
      console.error('[订单详情查询] 详细SQL错误:', queryError.message);
      if (!isMissingColumnError(queryError)) {
        throw queryError;
      }

      await ensureOrderPaymentColumnsIfNeeded(queryError).catch(() => {});

      orderResult = await db.query(
        `SELECT
          o.id,
          o.order_id as order_no,
          o.user_id,
          o.order_type,
          o.device_type,
          o.problem_description,
          o.custom_description,
          o.images,
          o.service_type,
          o.brand_id,
          o.device_model,
          o.device_condition,
          o.estimated_price,
          o.actual_price,
          o.status,
          o.address_id,
          o.unit_id,
          o.created_at,
          o.updated_at,
          o.completed_at,
          o.assigned_to,
          o.assigned_at,
          o.progress,
          o.priority,
          NULL as progress_updated_at,
          0 as progress_unread,
          o.quote_price,
          NULL as quote_description,
          NULL as quote_files,
          NULL as repair_report_files,
          NULL as quote_status,
          0 as quote_unread,
          NULL as quote_created_at,
          NULL as quote_created_by,
          NULL as quote_rejected_reason,
          'unpaid' as payment_status,
          0.00 as pay_amount,
          NULL as out_trade_no,
          NULL as wechat_transaction_id,
          NULL as paid_at,
          'none' as refund_status,
          0.00 as refund_amount,
          NULL as refund_no,
          NULL as refunded_at,
          CASE WHEN o.device_type = 0 THEN o.device_type_name ELSE d.name END as device_type_name,
          d.icon as device_type_icon,
          b.name as brand_name,
          ua.contact_name,
          ua.contact_phone,
          ua.province,
          ua.city,
          ua.district,
          ua.detail_address,
          ua.tags,
          ua.is_default as address_default,
          uu.name as unit_name,
          uu.address as unit_address,
          uu.contact_name as unit_contact_name,
          uu.contact_phone as unit_contact_phone,
          uu.is_default as unit_default
         FROM orders o
         LEFT JOIN device_types d ON o.device_type = d.id
         LEFT JOIN brands b ON o.brand_id = b.id
         LEFT JOIN user_addresses ua ON o.address_id = ua.id
         LEFT JOIN user_units uu ON o.unit_id = uu.id
         WHERE o.id = ?`,
        [orderId]
      );
    }

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const order = orderResult[0];

    // 权限检查：订单所有者或管理员才能查看
    const userId = req.user.id;
    const role = req.user.role;
    if (order.user_id !== userId && role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: '无权访问该订单'
      });
    }

    // 售后：质保信息（独立查询，字段缺失时静默跳过）
    try {
      const wRes = await db.query(
        'SELECT device_id, is_warranty, original_order_id, warranty_start_date, warranty_end_date, warranty_period_days, warranty_type FROM orders WHERE id = ?',
        [orderId]
      );
      const w = wRes[0];
      if (w) {
        order.device_id = w.device_id;
        order.is_warranty = !!w.is_warranty;
        order.original_order_id = w.original_order_id;
        if (order.status === 'completed') {
          if (!w.warranty_end_date) {
            const dev = await db.query('SELECT warranty_months FROM user_devices WHERE id = ?', [w.device_id]).catch(() => []);
            const ww = computeWarranty(order, dev[0] && dev[0].warranty_months);
            await db.query(
              'UPDATE orders SET warranty_start_date=?, warranty_end_date=?, warranty_period_days=?, warranty_type=? WHERE id=?',
              [ww.warranty_start_date, ww.warranty_end_date, ww.warranty_period_days, ww.warranty_type, order.id]
            ).catch(() => {});
            Object.assign(order, ww);
          } else {
            order.warranty_start_date = w.warranty_start_date;
            order.warranty_end_date = w.warranty_end_date;
            order.warranty_period_days = w.warranty_period_days;
            order.warranty_type = w.warranty_type;
          }
          const st = warrantyStatus(order.warranty_end_date);
          order.warranty_status = st.status;
          order.warranty_remaining_days = st.remaining_days;
        }
      }
    } catch (e) {
      console.warn('[订单详情] 质保信息查询失败(已忽略):', e.message);
    }

    // 查询用户信息
    const userResult = await db.query(
      `SELECT
        id,
        openid,
        nickname,
        avatar_url,
        real_name,
        phone,
        email,
        gender,
        country,
        province,
        city,
        language,
        status,
        created_at,
        updated_at,
        last_login_at
       FROM users
       WHERE id = ?`,
      [order.user_id]
    );

    // 查询分配的管理员信息
    let assignedUser = null;
    if (order.assigned_to) {
      const assignedResult = await db.query(
        `SELECT
          id,
          nickname,
          real_name,
          phone,
          avatar_url
         FROM users
         WHERE id = ?`,
        [order.assigned_to]
      );

      if (assignedResult.length > 0) {
        assignedUser = assignedResult[0];
      }
    }

    // 查询订单评价
    const reviewResult = await db.query(
      `SELECT
        id,
        order_id,
        user_id,
        rating,
        comment,
        images,
        created_at
       FROM order_reviews
       WHERE order_id = ?`,
      [orderId]
    );

    const review = reviewResult.length > 0 ? reviewResult[0] : null;

    // 处理图片数据
    if (order.images) {
      try {
        order.images = typeof order.images === 'string'
          ? JSON.parse(order.images)
          : order.images;
      } catch (e) {
        order.images = [];
      }
    }

    // 处理地址标签
    if (order.tags) {
      try {
        order.tags = typeof order.tags === 'string'
          ? JSON.parse(order.tags)
          : order.tags;
      } catch (e) {
        order.tags = [];
      }
    }

    // 处理评价图片
    if (review && review.images) {
      try {
        review.images = typeof review.images === 'string'
          ? JSON.parse(review.images)
          : review.images;
      } catch (e) {
        review.images = [];
      }
    }

    order.quote_files = parseJsonFiles(order.quote_files);
    order.repair_report_files = parseJsonFiles(order.repair_report_files);

    res.json({
      success: true,
      data: {
        order: order,
        user: userResult[0] || {},
        assignedUser: assignedUser,
        review: review
      }
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      success: false,
      error: '获取订单详情失败'
    });
  }
});

/**
 * 获取指定用户的订单列表
 * GET /api/orders/user/:userId?status=pending
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
  let userId;
  try {
    userId = parseInt(req.params.userId) || 0;
    const status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(1, parseInt(req.query.pageSize) || 20);
    const offset = (page - 1) * pageSize;

    console.log('[用户订单查询] userId:', userId, 'status:', status);

    // 待评价订单超过3天自动转为已完成（纳入已完成列表）
    await expireOldReviewOrders();

    // 构建查询条件
    let whereClause = 'WHERE o.user_id = ?';
    const params = [userId];

    if (status && status !== 'all') {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    // 查询总数
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    console.log('[用户订单查询] 总数:', total);

    const isMissingColumnError = (error) => {
      return error && (
        error.code === 'ER_BAD_FIELD_ERROR' ||
        error.errno === 1054 ||
        String(error.message || '').includes('Unknown column')
      );
    };

    // 查询订单列表 - 使用参数化查询
    let orders;
    try {
      orders = await db.query(
      `SELECT
          o.id,
          o.order_id as order_no,
          o.user_id,
          o.order_type,
          o.device_type,
          o.device_model,
          o.problem_description,
          o.custom_description,
          o.images,
          o.service_type,
          o.brand_id,
          o.device_condition,
          o.estimated_price,
          o.quote_price,
          o.actual_price,
          o.status,
          o.address_id,
          o.created_at,
          o.updated_at,
          o.completed_at,
          o.assigned_to,
          o.assigned_at,
          o.progress,
          o.priority,
          o.progress_updated_at,
          o.progress_unread,
          o.quote_unread,
          o.payment_status,
          o.pay_amount,
          o.out_trade_no,
          o.wechat_transaction_id,
          o.paid_at,
          o.refund_status,
          o.refund_amount,
          o.repair_report_files,
          d.name as device_type_name,
          d.icon as device_type_icon,
          b.name as brand_name,
          u.nickname as user_name,
          u.phone as user_phone
         FROM orders o
         LEFT JOIN device_types d ON o.device_type = d.id
         LEFT JOIN brands b ON o.brand_id = b.id
         LEFT JOIN users u ON o.user_id = u.id
         ${whereClause}
         ORDER BY o.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );
    } catch (queryError) {
      console.error('[用户订单查询] 详细SQL错误:', queryError.message);

      if (!isMissingColumnError(queryError)) {
        throw queryError;
      }

      await ensureOrderPaymentColumnsIfNeeded(queryError).catch(() => {});

      // 回退到更简单的查询（兼容旧数据库缺少提醒/维修报告字段的情况）
      orders = await db.query(
        `SELECT
          o.id,
          o.order_id as order_no,
          o.user_id,
          o.order_type,
          o.device_type,
          o.device_model,
          o.problem_description,
          o.custom_description,
          o.images,
          o.service_type,
          o.brand_id,
          o.device_condition,
          o.estimated_price,
          o.quote_price,
          o.actual_price,
          o.status,
          o.address_id,
          o.created_at,
          o.updated_at,
          o.completed_at,
          o.assigned_to,
          o.assigned_at,
          o.progress,
          o.priority,
          NULL as progress_updated_at,
          0 as progress_unread,
          0 as quote_unread,
          'unpaid' as payment_status,
          0.00 as pay_amount,
          NULL as out_trade_no,
          NULL as wechat_transaction_id,
          NULL as paid_at,
          'none' as refund_status,
          0.00 as refund_amount,
          NULL as repair_report_files,
          d.name as device_type_name,
          d.icon as device_type_icon,
          b.name as brand_name,
          u.nickname as user_name,
          u.phone as user_phone
         FROM orders o
         LEFT JOIN device_types d ON o.device_type = d.id
         LEFT JOIN brands b ON o.brand_id = b.id
         LEFT JOIN users u ON o.user_id = u.id
         ${whereClause}
         ORDER BY o.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );
    }

    // 处理图片 JSON
    orders.forEach(order => {
      if (order.images) {
        try {
          order.images = typeof order.images === 'string'
            ? JSON.parse(order.images)
            : order.images;
        } catch (e) {
          order.images = [];
        }
      }
      order.repair_report_files = parseJsonFiles(order.repair_report_files)
    });

    res.json({
      success: true,
      data: {
        orders,
        total,
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('[获取用户订单列表错误] userId:', userId, 'error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: '获取用户订单列表失败: ' + error.message
    });
  }
});

/**
 * 获取全部订单列表（包含关联数据）
 * GET /api/orders/all
 */
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;
    const status = req.query.status;
    const orderType = req.query.orderType;
    const keyword = req.query.keyword;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    const params = [];

    // 超级管理员查看所有订单，普通用户只查看自己的订单
    if (userRole !== 'super_admin') {
      whereClause += ' AND o.user_id = ?';
      params.push(userId);
    }

    if (status && status !== 'all') {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    if (orderType && orderType !== 'all') {
      whereClause += ' AND o.order_type = ?';
      params.push(orderType);
    }

    if (keyword) {
      whereClause += ' AND (o.order_id LIKE ? OR u.nickname LIKE ? OR u.phone LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    // 查询总数
    const countResult = await db.query(
      `SELECT COUNT(*) as total
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ${whereClause}`,
      params
    );

    const total = countResult[0].total;

    // 查询订单列表
    const orders = await db.query(
      `SELECT
        o.id,
        o.order_id as order_no,
        o.user_id,
        u.nickname as user_name,
        u.phone as user_phone,
        o.order_type,
        o.device_type,
        d.name as device_name,
        d.icon as device_icon,
        o.problem_description,
        o.custom_description,
        o.images,
        o.service_type,
        o.brand_id,
        b.name as brand_name,
        o.device_model,
        o.device_condition,
        o.estimated_price,
        o.actual_price,
        o.status,
        o.address_id,
        ua.province as address_province,
        ua.city as address_city,
        ua.district as address_district,
        ua.detail_address,
        ua.contact_name as address_contact_name,
        ua.contact_phone as address_contact_phone,
        o.unit_id,
        uu.name as unit_name,
        o.created_at,
        o.updated_at,
        o.completed_at,
        o.assigned_to,
        au.nickname as assigned_name,
        au.phone as assigned_phone,
        o.assigned_at,
        o.progress,
        o.priority,
        o.progress_updated_at,
        o.progress_unread
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN users au ON o.assigned_to = au.id
       LEFT JOIN device_types d ON o.device_type = d.id
       LEFT JOIN brands b ON o.brand_id = b.id
       LEFT JOIN user_addresses ua ON o.address_id = ua.id
       LEFT JOIN user_units uu ON o.unit_id = uu.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    // 查询状态统计
    let statsResult;
    const statsWhereClause = userRole === 'super_admin' ? '1=1' : 'o.user_id = ?';
    const statsParams = userRole === 'super_admin' ? [] : [userId];

    statsResult = await db.query(
      `SELECT
        status,
        COUNT(*) as count
       FROM orders o
       WHERE ${statsWhereClause}
       GROUP BY status`,
      statsParams
    );

    const statusCounts = {
      pending: 0,
      processing: 0,
      completed: 0,
      review: 0,
      cancelled: 0
    };

    statsResult.forEach(stat => {
      if (statusCounts.hasOwnProperty(stat.status)) {
        statusCounts[stat.status] = stat.count;
      }
    });

    // 处理图片数据
    orders.forEach(order => {
      if (order.images) {
        try {
          order.images = typeof order.images === 'string'
            ? JSON.parse(order.images)
            : order.images;
        } catch (e) {
          order.images = [];
        }
      }

      // 组合地址信息
      if (order.address_province) {
        order.address_info = `${order.address_province}${order.address_city}${order.address_district}${order.detail_address}`;
      }
    });

    res.json({
      success: true,
      data: {
        orders,
        total,
        page,
        pageSize,
        statusCounts
      }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取订单列表失败'
    });
  }
});

/**
 * 获取订单评价
 * GET /api/orders/:id/review
 */
router.get('/:id/review', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;

    const reviewResult = await db.query(
      `SELECT
        orv.id,
        orv.order_id,
        orv.user_id,
        orv.rating,
        orv.comment,
        orv.images,
        orv.created_at,
        u.nickname as user_nickname,
        u.avatar_url as user_avatar
       FROM order_reviews orv
       LEFT JOIN users u ON orv.user_id = u.id
       WHERE orv.order_id = ?`,
      [orderId]
    );

    if (reviewResult.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    const review = reviewResult[0];

    // 处理图片数据
    if (review.images) {
      try {
        review.images = typeof review.images === 'string'
          ? JSON.parse(review.images)
          : review.images;
      } catch (e) {
        review.images = [];
      }
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('获取订单评价错误:', error);
    res.status(500).json({
      success: false,
      error: '获取订单评价失败'
    });
  }
});

/**
 * 用户编辑订单（仅待处理状态）
 * PUT /api/orders/:orderId/edit
 */
router.put('/:orderId/edit', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId) || 0;
    const userId = req.user.id;
    const {
      contact_name, contact_phone, province, city, district, detail_address,
      problem_description, custom_description
    } = req.body;

    // 检查订单是否存在且属于当前用户
    const orderResult = await db.query(
      `SELECT id, user_id, status, address_id FROM orders WHERE id = ?`,
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const order = orderResult[0];

    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, error: '无权编辑此订单' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, error: '只能编辑待处理的订单' });
    }

    // 更新订单描述信息
    if (problem_description !== undefined) {
      await db.query(
        `UPDATE orders SET problem_description = ?, updated_at = NOW() WHERE id = ?`,
        [problem_description, orderId]
      );
    }

    if (custom_description !== undefined) {
      await db.query(
        `UPDATE orders SET custom_description = ?, updated_at = NOW() WHERE id = ?`,
        [custom_description, orderId]
      );
    }

    // 更新地址信息
    if (contact_name || contact_phone || province || city || district || detail_address) {
      if (order.address_id) {
        // 更新现有地址
        await db.query(
          `UPDATE user_addresses
           SET contact_name = COALESCE(?, contact_name),
               contact_phone = COALESCE(?, contact_phone),
               province = COALESCE(?, province),
               city = COALESCE(?, city),
               district = COALESCE(?, district),
               detail_address = COALESCE(?, detail_address),
               updated_at = NOW()
           WHERE id = ?`,
          [contact_name || null, contact_phone || null, province || null,
           city || null, district || null, detail_address || null, order.address_id]
        );
      } else if (contact_name && contact_phone && province && city && district && detail_address) {
        // 创建新地址
        const insertResult = await db.query(
          `INSERT INTO user_addresses (user_id, contact_name, contact_phone, province, city, district, detail_address, is_default, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, false, NOW(), NOW())`,
          [userId, contact_name, contact_phone, province, city, district, detail_address]
        );
        // 关联地址到订单
        await db.query(
          `UPDATE orders SET address_id = ?, updated_at = NOW() WHERE id = ?`,
          [insertResult.insertId, orderId]
        );
      }
    }

    res.json({ success: true, message: '订单更新成功' });
  } catch (error) {
    console.error('用户编辑订单错误:', error);
    res.status(500).json({ success: false, error: '编辑订单失败' });
  }
});

/**
 * 用户申请退款（仅待处理状态）
 * POST /api/orders/:orderId/refund
 */
router.post('/:orderId/refund', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId) || 0;
    const userId = req.user.id;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, error: '请选择退款原因' });
    }

    // 检查订单是否存在且属于当前用户
    const orderResult = await db.query(
      `SELECT id, user_id, status FROM orders WHERE id = ?`,
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const order = orderResult[0];

    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, error: '无权操作此订单' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, error: '只有待处理的订单可以申请退款' });
    }

    // 更新订单状态为已取消，记录退款原因
    await db.query(
      `UPDATE orders
       SET status = 'cancelled',
           cancel_reason = ?,
           cancel_description = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [reason, description || '', orderId]
    );

    res.json({ success: true, message: '退款申请成功，订单已取消' });
  } catch (error) {
    console.error('用户申请退款错误:', error);
    res.status(500).json({ success: false, error: '退款申请失败' });
  }
});

/**
 * 用户取消订单
 * POST /api/orders/:orderId/cancel
 */
router.post('/:orderId/cancel', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId) || 0;
    const userId = req.user.id;

    // 检查订单是否存在且属于当前用户
    const orderResult = await db.query(
      `SELECT id, user_id, status FROM orders WHERE id = ?`,
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const order = orderResult[0];

    // 只有待处理或待确认报价的订单可以取消
    if (order.status !== 'pending' && order.status !== 'quoted') {
      return res.status(400).json({ success: false, error: '只有待处理或待确认报价的订单可以取消' });
    }

    // 更新订单状态
    await db.query(
      `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = ?`,
      [orderId]
    );

    res.json({ success: true, message: '订单已取消' });
  } catch (error) {
    console.error('取消订单错误:', error);
    res.status(500).json({ success: false, error: '取消订单失败' });
  }
});

/**
 * 用户提交评价
 * POST /api/orders/submit-review
 */
router.post('/submit-review', authenticateToken, async (req, res) => {
  try {
    const { orderId, rating, comment, images } = req.body;
    const userId = req.user.id;

    if (!orderId || !rating) {
      return res.status(400).json({ success: false, error: '订单ID和评分不能为空' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: '评分必须在1-5之间' });
    }

    // 检查订单是否存在且属于当前用户
    const orderResult = await db.query(
      `SELECT id, user_id, status FROM orders WHERE id = ?`,
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const order = orderResult[0];

    // 只有已完成或待评价的订单可以评价
    if (order.status !== 'completed' && order.status !== 'review') {
      return res.status(400).json({ success: false, error: '该订单状态不可评价' });
    }

    // 检查是否已评价
    const existingReview = await db.query(
      `SELECT id FROM order_reviews WHERE order_id = ?`,
      [orderId]
    );

    if (existingReview.length > 0) {
      return res.status(400).json({ success: false, error: '该订单已评价' });
    }

    // 插入评价
    const imagesJson = images ? JSON.stringify(images) : null;
    await db.query(
      `INSERT INTO order_reviews (order_id, user_id, rating, comment, images) VALUES (?, ?, ?, ?, ?)`,
      [orderId, userId, rating, comment || '', imagesJson]
    );

    // 更新订单状态为已完成，并写入完成时间（供订单时间线使用）
    await db.query(
      `UPDATE orders SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [orderId]
    );

    // 记录交易收入（已支付且未全额退款的订单）
    await recordOrderIncome(orderId).catch((e) => console.error('记录收入失败:', e));

    res.json({ success: true, message: '评价提交成功' });
  } catch (error) {
    console.error('提交评价错误:', error);
    res.status(500).json({ success: false, error: '提交评价失败' });
  }
});

/**
 * 用户接受报价
 * PUT /api/orders/:orderId/accept-quote
 */
router.put('/:orderId/accept-quote', authenticateToken, async (req, res) => {
  try {
    await ensureOrderPaymentColumns();
    const orderId = parseInt(req.params.orderId) || 0;
    const userId = req.user.id;

    // 检查订单是否存在且属于当前用户
    const orderResult = await db.query(
      `SELECT id, user_id, status, quote_status, quote_price FROM orders WHERE id = ?`,
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const order = orderResult[0];
    console.log('[accept-quote] 订单信息:', JSON.stringify({ id: order.id, user_id: order.user_id, status: order.status, quote_status: order.quote_status, quote_price: order.quote_price }));

    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, error: '无权操作此订单' });
    }

    // 允许 quote_status 为 'pending' 或 NULL（兼容旧数据），同时要求订单状态为 'quoted'
    if (order.status !== 'quoted' && order.quote_status !== 'pending') {
      console.log('[accept-quote] 状态检查失败: status=', order.status, 'quote_status=', order.quote_status);
      return res.status(400).json({ success: false, error: '当前状态不允许接受报价', detail: { status: order.status, quote_status: order.quote_status } });
    }

    // 更新订单报价状态和实际价格，状态变为 confirmed（用户已确认报价，等待管理员开始处理）
    await db.query(
      `UPDATE orders
       SET quote_status = 'accepted',
           actual_price = quote_price,
           pay_amount = quote_price,
           payment_status = 'unpaid',
           status = 'confirmed',
           updated_at = NOW()
       WHERE id = ?`,
      [orderId]
    );

    res.json({ success: true, message: '已接受报价' });
  } catch (error) {
    console.error('接受报价错误:', error);
    res.status(500).json({ success: false, error: '接受报价失败' });
  }
});

/**
 * 用户拒绝报价
 * PUT /api/orders/:orderId/reject-quote
 */
router.put('/:orderId/reject-quote', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId) || 0;
    const userId = req.user.id;
    const { reason } = req.body;

    // 检查订单是否存在且属于当前用户
    const orderResult = await db.query(
      `SELECT id, user_id, status, quote_status FROM orders WHERE id = ?`,
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const order = orderResult[0];

    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, error: '无权操作此订单' });
    }

    // 允许 quote_status 为 'pending' 或 NULL（兼容旧数据），同时要求订单状态为 'quoted'
    if (order.status !== 'quoted' && order.quote_status !== 'pending') {
      return res.status(400).json({ success: false, error: '当前状态不允许拒绝报价' });
    }

    // 更新订单报价状态，将状态改回 pending 以便管理员重新报价
    await db.query(
      `UPDATE orders
       SET quote_status = 'rejected',
           quote_rejected_reason = ?,
           status = 'pending',
           updated_at = NOW()
       WHERE id = ?`,
      [reason || '', orderId]
    );

    res.json({ success: true, message: '已拒绝报价' });
  } catch (error) {
    console.error('拒绝报价错误:', error);
    res.status(500).json({ success: false, error: '拒绝报价失败' });
  }
});

/**
 * 获取订单的进度照片
 * GET /api/orders/:orderId/progress-photos
 */
router.get('/:orderId/progress-photos', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId) || 0;
    const userId = req.user.id;

    // 验证订单权限
    const orderResult = await db.query(
      'SELECT id, user_id, assigned_to FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const order = orderResult[0];
    // 权限检查：订单所有者、被分配的维修人员、或管理员/超级管理员
    if (order.user_id !== userId && order.assigned_to !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: '无权查看此订单的进度照片'
      });
    }

    // 从主数据库查询进度照片
    const photosResult = await db.query(
      'SELECT * FROM order_progress_photos WHERE order_id = ? ORDER BY created_at ASC',
      [orderId]
    );

    // 处理JSON字段（mysql2对JSON列可能已自动解析）
    photosResult.forEach(photo => {
      if (Array.isArray(photo.images)) {
        // mysql2 已自动解析，无需再 parse
      } else if (photo.images && typeof photo.images === 'string') {
        try {
          photo.images = JSON.parse(photo.images);
        } catch (e) {
          photo.images = [];
        }
      } else {
        photo.images = [];
      }
    });

    res.json({
      success: true,
      data: photosResult
    });
  } catch (error) {
    console.error('获取进度照片错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败: ' + error.message
    });
  }
});

/**
 * 获取订单的进度视频
 * GET /api/orders/:orderId/progress-videos
 */
router.get('/:orderId/progress-videos', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId) || 0;
    const userId = req.user.id;

    // 验证订单权限
    const orderResult = await db.query(
      'SELECT id, user_id, assigned_to FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const order = orderResult[0];
    // 权限检查：订单所有者、被分配的维修人员、或管理员/超级管理员
    if (order.user_id !== userId && order.assigned_to !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: '无权查看此订单的进度视频'
      });
    }

    // 从主数据库查询进度视频
    const videosResult = await db.query(
      'SELECT * FROM order_progress_videos WHERE order_id = ? ORDER BY created_at ASC',
      [orderId]
    );

    // 处理视频数据，统一字段名
    const processedVideos = videosResult.map(video => {
      // 兼容两种字段名：cover_url 或 cover
      const coverUrl = video.cover_url || video.cover || '';
      return {
        ...video,
        cover_url: coverUrl
      };
    });

    res.json({
      success: true,
      data: processedVideos
    });
  } catch (error) {
    console.error('获取进度视频错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败: ' + error.message
    });
  }
});

/**
 * 更新订单进度（普通用户/维修人员）
 * PUT /api/orders/:orderId/progress
 */
router.put('/:orderId/progress', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { progress } = req.body;
    const userId = req.user.id;

    // 验证进度值
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        error: '进度值必须在0-100之间'
      });
    }

    // 验证订单权限
    const orderResult = await db.query(
      'SELECT id, user_id, assigned_to, status FROM orders WHERE id = ?',
      [orderId]
    );

    if (orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const order = orderResult[0];
    // 只有订单创建者、分配的维修人员或管理员/超级管理员可以更新进度
    if (order.user_id !== userId && order.assigned_to !== userId && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: '无权更新此订单的进度'
      });
    }

    // 更新订单进度
    await db.query(
      'UPDATE orders SET progress = ? WHERE id = ?',
      [progress, orderId]
    );

    res.json({
      success: true,
      message: '进度更新成功',
      data: { progress }
    });
  } catch (error) {
    console.error('更新订单进度错误:', error);
    res.status(500).json({
      success: false,
      error: '更新进度失败'
    });
  }
});

module.exports = router;
