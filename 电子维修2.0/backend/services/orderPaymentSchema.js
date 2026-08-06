const db = require('../database');

const PAYMENT_COLUMNS = [
  {
    name: 'payment_status',
    sql: `ALTER TABLE orders
          ADD COLUMN payment_status VARCHAR(20) NULL DEFAULT 'unpaid' COMMENT '支付状态: unpaid/paying/paid/refunding/refunded/failed'`
  },
  {
    name: 'pay_amount',
    sql: `ALTER TABLE orders
          ADD COLUMN pay_amount DECIMAL(10,2) NULL DEFAULT 0.00 COMMENT '待支付金额'`
  },
  {
    name: 'out_trade_no',
    sql: `ALTER TABLE orders
          ADD COLUMN out_trade_no VARCHAR(64) NULL COMMENT '商户支付单号'`
  },
  {
    name: 'wechat_transaction_id',
    sql: `ALTER TABLE orders
          ADD COLUMN wechat_transaction_id VARCHAR(64) NULL COMMENT '微信支付单号'`
  },
  {
    name: 'payment_channel',
    sql: `ALTER TABLE orders
          ADD COLUMN payment_channel VARCHAR(32) NULL DEFAULT 'wechat_miniapp' COMMENT '支付渠道'`
  },
  {
    name: 'paid_at',
    sql: `ALTER TABLE orders
          ADD COLUMN paid_at DATETIME NULL COMMENT '支付成功时间'`
  },
  {
    name: 'payment_notify_raw',
    sql: `ALTER TABLE orders
          ADD COLUMN payment_notify_raw LONGTEXT NULL COMMENT '支付回调原始报文'`
  },
  {
    name: 'refund_status',
    sql: `ALTER TABLE orders
          ADD COLUMN refund_status VARCHAR(20) NULL DEFAULT 'none' COMMENT '退款状态: none/refunding/refunded/failed'`
  },
  {
    name: 'refund_no',
    sql: `ALTER TABLE orders
          ADD COLUMN refund_no VARCHAR(64) NULL COMMENT '商户退款单号'`
  },
  {
    name: 'wechat_refund_id',
    sql: `ALTER TABLE orders
          ADD COLUMN wechat_refund_id VARCHAR(64) NULL COMMENT '微信退款单号'`
  },
  {
    name: 'refund_amount',
    sql: `ALTER TABLE orders
          ADD COLUMN refund_amount DECIMAL(10,2) NULL DEFAULT 0.00 COMMENT '退款金额'`
  },
  {
    name: 'refund_reason',
    sql: `ALTER TABLE orders
          ADD COLUMN refund_reason VARCHAR(255) NULL COMMENT '退款原因'`
  },
  {
    name: 'refunded_at',
    sql: `ALTER TABLE orders
          ADD COLUMN refunded_at DATETIME NULL COMMENT '退款成功时间'`
  }
];

function isDuplicateColumnError(error) {
  return !!(error && (
    error.code === 'ER_DUP_FIELDNAME' ||
    error.errno === 1060 ||
    String(error.message || '').includes('Duplicate column')
  ));
}

function isMissingColumnError(error) {
  return !!(error && (
    error.code === 'ER_BAD_FIELD_ERROR' ||
    error.errno === 1054 ||
    String(error.message || '').includes('Unknown column')
  ));
}

let ensurePromise = null;

async function ensureOrderPaymentColumns() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    for (const column of PAYMENT_COLUMNS) {
      try {
        await db.query(column.sql);
      } catch (error) {
        if (!isDuplicateColumnError(error)) {
          throw error;
        }
      }
    }
  })();

  try {
    await ensurePromise;
  } finally {
    ensurePromise = null;
  }
}

module.exports = {
  ensureOrderPaymentColumns,
  isMissingColumnError
};
