const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { ensureOrderPaymentColumns, isMissingColumnError } = require('../services/orderPaymentSchema');
const {
  createJsapiTransaction,
  queryTransactionByOutTradeNo,
  createRefund,
  parseNotify
} = require('../services/wechatPayService');
const { syncOrderIncomeOnRefund } = require('../services/incomeService');

function formatAmountToFen(amount) {
  return Math.round(Number(amount || 0) * 100);
}

function formatFenToAmount(fen) {
  return (Number(fen || 0) / 100).toFixed(2);
}

function makeOutTradeNo(orderId) {
  return `WXORD${orderId}${Date.now()}`;
}

function makeRefundNo(orderId) {
  return `WXRF${orderId}${Date.now()}`;
}

function truncateUtf8(text, maxBytes) {
  let result = String(text || '');
  while (Buffer.byteLength(result, 'utf8') > maxBytes) {
    result = result.slice(0, result.length - 1);
  }
  return result;
}

function buildPayDescription(order) {
  const serviceName = order.order_type === 'recycle' ? '回收' : '维修';
  const device = order.device_model ? ` - ${order.device_model}` : '';
  return truncateUtf8(`${serviceName}订单 ${order.order_id || order.id}${device}`, 120);
}

async function isTransactionNotFound(error) {
  return error?.status === 404 || error?.wechatPayResponse?.code === 'RESOURCE_NOT_EXISTS';
}

async function queryExistingTransaction(outTradeNo) {
  try {
    return await queryTransactionByOutTradeNo(outTradeNo);
  } catch (error) {
    if (isTransactionNotFound(error)) return null;
    throw error;
  }
}

async function markOrderPaid(order, transaction) {
  const transactionTotalFen = Number(transaction.amount?.total || 0);
  const orderTotalFen = formatAmountToFen(order.pay_amount);
  if (orderTotalFen > 0 && transactionTotalFen > 0 && transactionTotalFen !== orderTotalFen) {
    throw new Error(`微信支付金额不一致: 订单 ${orderTotalFen} 分，微信 ${transactionTotalFen} 分`);
  }

  if (transaction.appid && transaction.appid !== String(process.env.WECHAT_APP_ID || '').trim()) {
    throw new Error('微信支付回调 appid 与配置不一致');
  }
  if (transaction.mchid && transaction.mchid !== String(process.env.WECHAT_MCH_ID || '').trim()) {
    throw new Error('微信支付回调商户号与配置不一致');
  }

  await safeQuery(
    `UPDATE orders
     SET payment_status = 'paid',
         payment_channel = 'wechat_miniapp',
         wechat_transaction_id = ?,
         paid_at = COALESCE(paid_at, NOW()),
         updated_at = NOW()
     WHERE id = ?`,
    [transaction.transaction_id || '', order.id]
  );
}

async function safeQuery(sql, params) {
  try {
    return await db.query(sql, params);
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }
    await ensureOrderPaymentColumns();
    return db.query(sql, params);
  }
}

router.post('/create', authenticateToken, async (req, res) => {
  try {
    await ensureOrderPaymentColumns();

    const userId = req.user.id;
    const { orderId } = req.body;
    let paymentClaimed = false;

    if (!orderId) {
      return res.status(400).json({ success: false, error: '缺少订单ID' });
    }

    const rows = await safeQuery(
      `SELECT
         o.id, o.order_id, o.user_id, o.order_type, o.device_model, o.status,
         o.quote_status, o.actual_price, o.quote_price, o.estimated_price,
         o.payment_status, o.out_trade_no, o.pay_amount,
         o.is_internal, u.openid, u.nickname
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const order = rows[0];
    if (Number(order.user_id) !== Number(userId)) {
      return res.status(403).json({ success: false, error: '无权操作此订单' });
    }

    if (!order.openid) {
      return res.status(400).json({ success: false, error: '当前用户缺少微信openid，无法发起支付' });
    }

    if (order.status !== 'confirmed') {
      return res.status(400).json({ success: false, error: '只有已确认报价的订单可以支付' });
    }

    // 内部人员免付款订单（payment_status = 'waived'）无需发起支付
    if (order.payment_status === 'waived' || order.is_internal) {
      return res.status(400).json({ success: false, error: '该订单为免付款内部订单，无需支付' });
    }

    if (order.quote_status && order.quote_status !== 'accepted') {
      return res.status(400).json({ success: false, error: '当前报价尚未确认，不能支付' });
    }

    if (order.payment_status === 'paid') {
      return res.json({
        success: true,
        message: '订单已支付',
        data: {
          alreadyPaid: true,
          paymentStatus: 'paid'
        }
      });
    }

    const amountYuan = Number(order.actual_price || order.quote_price || order.estimated_price || 0);
    if (!Number.isFinite(amountYuan) || amountYuan <= 0) {
      return res.status(400).json({ success: false, error: '当前订单支付金额无效' });
    }

    let outTradeNo = order.out_trade_no || makeOutTradeNo(order.id);

    // 支付回调可能晚于用户返回小程序。发起支付前先主动查一次微信侧终态，
    // 避免用户已付款但本地仍停留在 paying 时重复拉起收银台。
    if (order.out_trade_no) {
      const existingTransaction = await queryExistingTransaction(order.out_trade_no);
      if (existingTransaction?.trade_state === 'SUCCESS') {
        await markOrderPaid(order, existingTransaction);
        return res.json({
          success: true,
          message: '订单已支付',
          data: {
            alreadyPaid: true,
            paymentStatus: 'paid',
            transactionId: existingTransaction.transaction_id || ''
          }
        });
      }

      if (
        order.payment_status === 'failed' ||
        ['CLOSED', 'PAYERROR', 'REVOKED'].includes(existingTransaction?.trade_state || '')
      ) {
        outTradeNo = makeOutTradeNo(order.id);
      }
    }

    const amountFen = formatAmountToFen(amountYuan);
    const description = buildPayDescription(order);

    const claimResult = await safeQuery(
      `UPDATE orders
       SET out_trade_no = ?,
           pay_amount = ?,
           payment_status = 'paying',
           updated_at = NOW()
       WHERE id = ? AND (
         payment_status IS NULL OR payment_status IN ('unpaid', 'failed')
         OR (payment_status = 'paying' AND out_trade_no = ?)
       )`,
      [outTradeNo, amountYuan.toFixed(2), order.id, outTradeNo]
    );
    if (!claimResult?.affectedRows) {
      return res.status(409).json({ success: false, error: '支付单正在创建，请稍后刷新再试' });
    }
    paymentClaimed = true;

    const payResult = await createJsapiTransaction({
      description,
      outTradeNo,
      amount: amountFen,
      openid: order.openid,
      attach: JSON.stringify({ orderId: order.id, userId })
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        outTradeNo,
        amount: amountYuan.toFixed(2),
        paymentStatus: 'paying',
        payParams: payResult.payParams
      }
    });
  } catch (error) {
    console.error('创建支付订单失败:', error?.wechatPayResponse || error?.response?.data || error);
    if (paymentClaimed && typeof orderId !== 'undefined') {
      await safeQuery(
        `UPDATE orders
         SET payment_status = 'unpaid', updated_at = NOW()
         WHERE id = ? AND payment_status = 'paying'`,
        [orderId]
      ).catch(() => {});
    }
    res.status(500).json({
      success: false,
      error: '创建支付订单失败',
      message: process.env.NODE_ENV === 'development'
        ? (error?.response?.data?.message || error.message)
        : undefined
    });
  }
});

router.get('/query/:orderId', authenticateToken, async (req, res) => {
  try {
    await ensureOrderPaymentColumns();

    const userId = req.user.id;
    const orderId = parseInt(req.params.orderId, 10) || 0;
    const rows = await safeQuery(
      `SELECT id, user_id, out_trade_no, payment_status, paid_at, pay_amount, wechat_transaction_id
       FROM orders WHERE id = ?`,
      [orderId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const order = rows[0];
    if (Number(order.user_id) !== Number(userId) && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: '无权查看此订单支付状态' });
    }

    if (!order.out_trade_no) {
      return res.json({
        success: true,
        data: {
          paymentStatus: order.payment_status || 'unpaid',
          paidAt: order.paid_at || null,
          amount: order.pay_amount || '0.00',
          transactionId: order.wechat_transaction_id || ''
        }
      });
    }

    if (order.payment_status === 'paid') {
      return res.json({
        success: true,
        data: {
          paymentStatus: 'paid',
          tradeState: 'SUCCESS',
          paidAt: order.paid_at || null,
          amount: order.pay_amount || '0.00',
          transactionId: order.wechat_transaction_id || ''
        }
      });
    }

    const wxOrder = await queryTransactionByOutTradeNo(order.out_trade_no);
    const tradeState = wxOrder.trade_state || '';
    let nextStatus = order.payment_status || 'unpaid';

    if (tradeState === 'SUCCESS') {
      nextStatus = 'paid';
      await markOrderPaid(order, wxOrder);
    } else if (tradeState === 'NOTPAY') {
      nextStatus = 'unpaid';
      await safeQuery(
        `UPDATE orders
         SET payment_status = 'unpaid',
             updated_at = NOW()
         WHERE id = ? AND payment_status <> 'paid'`,
        [order.id]
      );
    } else if (tradeState === 'USERPAYING') {
      nextStatus = 'paying';
    } else if (tradeState === 'CLOSED' || tradeState === 'PAYERROR' || tradeState === 'REVOKED') {
      nextStatus = 'failed';
      await safeQuery(
        `UPDATE orders
         SET payment_status = 'failed',
             updated_at = NOW()
         WHERE id = ? AND payment_status <> 'paid'`,
        [order.id]
      );
    }

    res.json({
      success: true,
      data: {
        paymentStatus: nextStatus,
        tradeState,
        paidAt: wxOrder.success_time || order.paid_at || null,
        amount: formatFenToAmount(wxOrder.amount?.payer_total || formatAmountToFen(order.pay_amount)),
        transactionId: wxOrder.transaction_id || order.wechat_transaction_id || ''
      }
    });
  } catch (error) {
    console.error('查询支付状态失败:', error?.wechatPayResponse || error?.response?.data || error);
    res.status(500).json({
      success: false,
      error: '查询支付状态失败',
      message: process.env.NODE_ENV === 'development'
        ? (error?.response?.data?.message || error.message)
        : undefined
    });
  }
});

router.post('/refund/apply', authenticateToken, async (req, res) => {
  try {
    await ensureOrderPaymentColumns();

    const userId = req.user.id;
    const { orderId, reason, refundAmount } = req.body;

    const rows = await safeQuery(
      `SELECT id, user_id, status, payment_status, out_trade_no, pay_amount, refund_status
       FROM orders WHERE id = ?`,
      [orderId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const order = rows[0];
    const canManage = Number(order.user_id) === Number(userId) || req.user.role === 'admin' || req.user.role === 'super_admin';
    if (!canManage) {
      return res.status(403).json({ success: false, error: '无权申请退款' });
    }

    if (order.payment_status !== 'paid') {
      return res.status(400).json({ success: false, error: '只有已支付订单才能发起真实退款' });
    }

    if (!order.out_trade_no) {
      return res.status(400).json({ success: false, error: '订单缺少支付单号，无法退款' });
    }

    if (order.refund_status === 'refunding') {
      return res.status(400).json({ success: false, error: '退款申请处理中，请稍后查看' });
    }

    if (order.refund_status === 'refunded') {
      return res.status(400).json({ success: false, error: '该订单退款已完成，请勿重复申请' });
    }

    const totalAmount = formatAmountToFen(order.pay_amount);
    const actualRefundFen = refundAmount
      ? formatAmountToFen(refundAmount)
      : totalAmount;

    if (actualRefundFen <= 0 || actualRefundFen > totalAmount) {
      return res.status(400).json({ success: false, error: '退款金额无效' });
    }

    const refundNo = makeRefundNo(order.id);
    const refundReason = truncateUtf8(reason || '订单退款', 80);
    const refundResult = await createRefund({
      outTradeNo: order.out_trade_no,
      refundNo,
      reason: refundReason,
      refundAmount: actualRefundFen,
      totalAmount
    });

    await safeQuery(
      `UPDATE orders
       SET refund_status = 'refunding',
           refund_no = ?,
           refund_amount = ?,
           refund_reason = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [refundNo, formatFenToAmount(actualRefundFen), refundReason, order.id]
    );

    res.json({
      success: true,
      message: '退款申请已提交',
      data: {
        refundNo,
        refundStatus: 'refunding',
        wechatRefundId: refundResult.refund_id || ''
      }
    });
  } catch (error) {
    console.error('申请退款失败:', error?.wechatPayResponse || error?.response?.data || error);
    res.status(500).json({
      success: false,
      error: '申请退款失败',
      message: process.env.NODE_ENV === 'development'
        ? (error?.response?.data?.message || error.message)
        : undefined
    });
  }
});

router.post('/notify', async (req, res) => {
  try {
    await ensureOrderPaymentColumns();
    const parsed = await parseNotify(req.headers, req.body || '');
    const resource = parsed.resource || {};
    const outTradeNo = resource.out_trade_no;

    if (!outTradeNo) {
      return res.status(400).json({ code: 'FAIL', message: '缺少商户单号' });
    }

    if (resource.trade_state !== 'SUCCESS') {
      if (['CLOSED', 'PAYERROR', 'REVOKED'].includes(resource.trade_state)) {
        await safeQuery(
          `UPDATE orders
           SET payment_status = 'failed', updated_at = NOW()
           WHERE out_trade_no = ? AND payment_status <> 'paid'`,
          [outTradeNo]
        );
      }
      return res.json({ code: 'SUCCESS', message: '成功' });
    }

    const rows = await safeQuery(
      `SELECT id, pay_amount, payment_status FROM orders WHERE out_trade_no = ?`,
      [outTradeNo]
    );
    if (!rows.length) {
      return res.status(404).json({ code: 'FAIL', message: '订单不存在' });
    }

    await markOrderPaid(rows[0], resource);
    await safeQuery(
      `UPDATE orders
       SET payment_notify_raw = ?, updated_at = NOW()
       WHERE id = ?`,
      [JSON.stringify(parsed.envelope), rows[0].id]
    );

    res.json({ code: 'SUCCESS', message: '成功' });
  } catch (error) {
    console.error('支付回调处理失败:', error);
    res.status(500).json({ code: 'FAIL', message: '处理失败' });
  }
});

router.post('/refund/notify', async (req, res) => {
  try {
    await ensureOrderPaymentColumns();
    const parsed = await parseNotify(req.headers, req.body || '');
    const resource = parsed.resource || {};
    const refundNo = resource.out_refund_no;

    if (!refundNo) {
      return res.status(400).json({ code: 'FAIL', message: '缺少退款单号' });
    }

    const orderRows = await safeQuery(
      `SELECT id, pay_amount, refund_amount, status, payment_status FROM orders WHERE refund_no = ?`,
      [refundNo]
    );
    if (!orderRows.length) {
      return res.status(404).json({ code: 'FAIL', message: '退款订单不存在' });
    }

    const order = orderRows[0];
    const refundFen = Number(resource.amount?.refund || formatAmountToFen(order.refund_amount));
    const totalFen = Number(resource.amount?.total || formatAmountToFen(order.pay_amount));
    const isFullRefund = refundFen > 0 && totalFen > 0 && refundFen >= totalFen;
    const refundState = resource.refund_status;
    const refundStatus = refundState === 'SUCCESS'
      ? 'refunded'
      : ['CLOSED', 'ABNORMAL'].includes(refundState) ? 'failed' : 'refunding';

    await safeQuery(
      `UPDATE orders
         SET refund_status = ?,
          refund_amount = ?,
          refund_notify_raw = ?,
             wechat_refund_id = ?,
             refunded_at = CASE WHEN ? = 'refunded' THEN COALESCE(refunded_at, NOW()) ELSE refunded_at END,
             payment_status = CASE WHEN ? = 'refunded' AND ? = 1 THEN 'refunded' ELSE 'paid' END,
             status = CASE
                        WHEN ? = 'refunded' AND ? = 1 AND status IN ('confirmed', 'processing')
                        THEN 'cancelled'
                        ELSE status
                      END,
             updated_at = NOW()
       WHERE refund_no = ?`,
      [
        refundStatus,
        formatFenToAmount(refundFen),
        JSON.stringify(parsed.envelope),
        resource.refund_id || '',
        refundStatus,
        refundStatus,
        isFullRefund ? 1 : 0,
        refundStatus,
        isFullRefund ? 1 : 0,
        refundNo
      ]
    );

    // 同步收入表：全额退款移除记录，部分退款扣减金额
    if (refundStatus === 'refunded') {
      await syncOrderIncomeOnRefund(order.id).catch((e) => console.error('同步收入失败:', e));
    }

    res.json({ code: 'SUCCESS', message: '成功' });
  } catch (error) {
    console.error('退款回调处理失败:', error);
    res.status(500).json({ code: 'FAIL', message: '处理失败' });
  }
});

module.exports = router;
