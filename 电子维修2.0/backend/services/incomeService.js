const db = require('../database');
const { ensureOrderPaymentColumns, isMissingColumnError } = require('../services/orderPaymentSchema');

const INCOME_TABLE = 'transaction_income';

async function ensureIncomeTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${INCOME_TABLE} (
      id INT NOT NULL AUTO_INCREMENT,
      order_id INT NOT NULL,
      order_no VARCHAR(64) NULL,
      user_id INT NULL,
      order_type VARCHAR(20) NULL COMMENT 'repair/recycle',
      service_type VARCHAR(20) NULL COMMENT 'shop/door-to-door',
      income_type VARCHAR(20) NOT NULL DEFAULT 'order' COMMENT 'order/adjust/compensation',
      amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '实际入账金额(已扣除退款)',
      currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
      payment_channel VARCHAR(32) NULL,
      payment_status VARCHAR(20) NOT NULL DEFAULT 'paid' COMMENT 'paid/partial_refunded/refunded',
      out_trade_no VARCHAR(64) NULL,
      wechat_transaction_id VARCHAR(64) NULL,
      paid_at DATETIME NULL,
      refunded_at DATETIME NULL,
      settle_status VARCHAR(20) NOT NULL DEFAULT 'unsettled' COMMENT 'unsettled/settled',
      settled_at DATETIME NULL,
      remark VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_order_id (order_id),
      KEY idx_paid_at (paid_at),
      KEY idx_order_type (order_type),
      KEY idx_settle_status (settle_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='交易收入表'
  `);
}

/**
 * 订单完成（已收款）时记录收入。
 * 规则：已完成(status='completed') 且未全额退款的订单全部入账；
 *       已退款(refund_status/payment_status='refunded') 的不计入。
 * 金额：优先已支付金额，其次实际成交价/报价/预估价。
 * 幂等：基于 order_id 唯一键，重复调用不会重复插入。
 */
async function recordOrderIncome(orderId) {
  await ensureIncomeTable();
  // 确保 orders 表的支付相关字段存在（pay_amount / payment_channel 等
  // 由支付模块按需创建，记录收入前必须先保证这些列存在，否则查询会抛
  // "Unknown column" 导致整批回填失败、金额无法入账。
  await ensureOrderPaymentColumns();

  const selectSql =
    `SELECT id, order_id, user_id, order_type, service_type, status,
            payment_status, pay_amount, refund_status, refund_amount,
            actual_price, quote_price, estimated_price,
            out_trade_no, wechat_transaction_id, payment_channel,
            paid_at, completed_at
     FROM orders WHERE id = ?`;

  let rows;
  try {
    rows = await db.query(selectSql, [orderId]);
  } catch (err) {
    // 列缺失时兜底再确保一次后重试
    if (isMissingColumnError(err)) {
      await ensureOrderPaymentColumns();
      rows = await db.query(selectSql, [orderId]);
    } else {
      throw err;
    }
  }
  if (!rows.length) return null;

  const o = rows[0];
  // 仅记录已完成订单
  if (o.status !== 'completed') return null;
  // 已全额退款的不计入
  if (o.refund_status === 'refunded' || o.payment_status === 'refunded') return null;

  // 收入金额：优先已支付金额，其次实际成交价/报价/预估
  const payAmount = Number(o.pay_amount || 0);
  const actualPrice = Number(o.actual_price || 0);
  const quotePrice = Number(o.quote_price || 0);
  const estimatedPrice = Number(o.estimated_price || 0);
  const amount = payAmount > 0 ? payAmount
    : actualPrice > 0 ? actualPrice
    : quotePrice > 0 ? quotePrice
    : estimatedPrice;
  if (amount <= 0) return null; // 无金额则不计入

  const refundAmount = Number(o.refund_amount || 0);
  // 已完成订单即视为收入已实收。订单侧 payment_status 可能因历史线下/现金收款
  // 而停留在 'unpaid'（pay_amount=0），不能据此把收入标记为未支付，否则收入
  // 统计(sum 仅计入 payment_status='paid')会把这笔金额算成 0。
  // 规则：有退款金额记为部分退款，否则一律记为已收款 'paid'。
  const paymentStatus = refundAmount > 0 ? 'partial_refunded' : 'paid';

  // 支付时间为空（如现金/线下完成的订单）时，回退到完成时间/更新时间，
  // 保证列表排序与展示正常。
  const paidAt = o.paid_at || o.completed_at || o.updated_at || o.created_at || null;

  const insertResult = await db.query(
    `INSERT INTO ${INCOME_TABLE}
       (order_id, order_no, user_id, order_type, service_type, income_type,
        amount, currency, payment_channel, payment_status,
        out_trade_no, wechat_transaction_id, paid_at)
     SELECT ?, o.order_id, o.user_id, o.order_type, o.service_type, 'order',
        ?, 'CNY', o.payment_channel, ?,
        o.out_trade_no, o.wechat_transaction_id, ?
     FROM orders o
     WHERE o.id = ? AND NOT EXISTS (
       SELECT 1 FROM ${INCOME_TABLE} ti WHERE ti.order_id = ?
     )`,
    [orderId, amount.toFixed(2), paymentStatus, paidAt, orderId, orderId]
  );

  return insertResult.insertId || null;
}

/**
 * 退款后同步收入记录：
 * - 全额退款(refunded)：删除收入记录（不计入）
 * - 部分退款(partial/refunding 且有退款金额)：金额扣减为 pay_amount - refund_amount
 * - 退款失败(failed)：保持不变
 */
async function syncOrderIncomeOnRefund(orderId) {
  await ensureIncomeTable();
  await ensureOrderPaymentColumns();

  let rows;
  try {
    rows = await db.query(
      `SELECT payment_status, pay_amount, refund_status, refund_amount, refunded_at
       FROM orders WHERE id = ?`,
      [orderId]
    );
  } catch (err) {
    if (isMissingColumnError(err)) {
      await ensureOrderPaymentColumns();
      rows = await db.query(
        `SELECT payment_status, pay_amount, refund_status, refund_amount, refunded_at
         FROM orders WHERE id = ?`,
        [orderId]
      );
    } else {
      throw err;
    }
  }
  if (!rows.length) return;

  const o = rows[0];
  const payAmount = Number(o.pay_amount || 0);
  const refundAmount = Number(o.refund_amount || 0);
  const netAmount = Math.max(0, payAmount - refundAmount);

  if (o.refund_status === 'refunded') {
    // 全额退款：直接移除收入记录
    await db.query(`DELETE FROM ${INCOME_TABLE} WHERE order_id = ?`, [orderId]);
    return;
  }

  if (refundAmount > 0) {
    // 部分退款：更新金额与状态
    await db.query(
      `UPDATE ${INCOME_TABLE}
       SET amount = ?, payment_status = 'partial_refunded', refunded_at = ?, updated_at = NOW()
       WHERE order_id = ?`,
      [netAmount.toFixed(2), o.refunded_at || null, orderId]
    );
  }
}

/**
 * 历史数据回填：把所有"已完成且未全额退款"且尚未入账的订单写入收入表。
 * 启动或手动调用，幂等。
 */
async function backfillIncome() {
  await ensureIncomeTable();
  await ensureOrderPaymentColumns();

  const rows = await db.query(
    `SELECT o.id
     FROM orders o
     WHERE o.status = 'completed'
       AND COALESCE(o.refund_status, '') <> 'refunded'
       AND COALESCE(o.payment_status, '') <> 'refunded'
       AND NOT EXISTS (SELECT 1 FROM ${INCOME_TABLE} ti WHERE ti.order_id = o.id)`
  );
  let count = 0;
  for (const r of rows) {
    try {
      const id = await recordOrderIncome(r.id);
      if (id) count += 1;
    } catch (e) {
      // 单条订单出错不影响其余订单回填
      console.error('[backfill] 订单', r.id, '收入记录失败:', e.message);
    }
  }

  // 兜底修正：历史上已写入但 payment_status 仍为 'unpaid' 的收入记录。
  // 这些订单已完成、未退款，应视为已收款，否则收入统计(sum 仅计入 'paid')
  // 会把它们算成 0，表现为"金额没有录入"。
  const fixed = await db.query(
    `UPDATE ${INCOME_TABLE} ti
     JOIN orders o ON o.id = ti.order_id
     SET ti.payment_status = 'paid',
         ti.paid_at = COALESCE(ti.paid_at, o.completed_at, o.updated_at, o.created_at),
         ti.updated_at = NOW()
     WHERE o.status = 'completed'
       AND COALESCE(o.refund_status, '') <> 'refunded'
       AND COALESCE(o.payment_status, '') <> 'refunded'
       AND ti.payment_status = 'unpaid'`
  );
  const fixedCount = fixed.affectedRows || 0;

  return { inserted: count, fixed: fixedCount };
}

/**
 * 收入统计（可按天/月/类型汇总），供管理端后续使用。
 */
async function getIncomeStats({ startDate, endDate, orderType } = {}) {
  const where = [];
  const params = [];
  if (startDate) { where.push('paid_at >= ?'); params.push(startDate); }
  if (endDate) { where.push('paid_at <= ?'); params.push(endDate); }
  if (orderType) { where.push('order_type = ?'); params.push(orderType); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = await db.query(
    `SELECT
       COUNT(*) as record_count,
       COALESCE(SUM(amount), 0) as total_income,
       COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) as full_paid_income,
       COALESCE(SUM(CASE WHEN payment_status = 'partial_refunded' THEN amount ELSE 0 END), 0) as partial_income
     FROM ${INCOME_TABLE} ${whereSql}`,
    params
  );
  return rows[0] || { record_count: 0, total_income: 0, full_paid_income: 0, partial_income: 0 };
}

module.exports = {
  INCOME_TABLE,
  ensureIncomeTable,
  recordOrderIncome,
  syncOrderIncomeOnRefund,
  backfillIncome,
  getIncomeStats
};
