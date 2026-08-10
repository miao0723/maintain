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

    if (!orderId) {
      return res.status(400).json({ success: false, error: '缺少订单ID' });
    }

    const rows = await safeQuery(
      `SELECT
         o.id, o.order_id, o.user_id, o.order_type, o.device_model, o.status,
         o.quote_status, o.actual_price, o.quote_price, o.estimated_price,
         o.payment_status, o.out_trade_no, o.pay_amount,
         u.openid, u.nickname
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

    const outTradeNo = order.out_trade_no || makeOutTradeNo(order.id);
    const amountFen = formatAmountToFen(amountYuan);
    const description = `${order.order_type === 'recycle' ? '回收' : '维修'}订单 ${order.order_id || order.id}${order.device_model ? ` - ${order.device_model}` : ''}`;

    await safeQuery(
      `UPDATE orders
       SET out_trade_no = ?,
           pay_amount = ?,
           payment_status = 'paying',
           updated_at = NOW()
       WHERE id = ?`,
      [outTradeNo, amountYuan.toFixed(2), order.id]
    );

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
    console.error('创建支付订单失败:', error?.response?.data || error);
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

    const wxOrder = await queryTransactionByOutTradeNo(order.out_trade_no);
    const tradeState = wxOrder.trade_state || '';
    let nextStatus = order.payment_status || 'unpaid';

    if (tradeState === 'SUCCESS') {
      nextStatus = 'paid';
      await safeQuery(
        `UPDATE orders
         SET payment_status = 'paid',
             wechat_transaction_id = ?,
             paid_at = COALESCE(paid_at, NOW()),
             updated_at = NOW()
         WHERE id = ?`,
        [wxOrder.transaction_id || '', order.id]
      );
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
    console.error('查询支付状态失败:', error?.response?.data || error);
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

    const totalAmount = formatAmountToFen(order.pay_amount);
    const actualRefundFen = refundAmount
      ? formatAmountToFen(refundAmount)
      : totalAmount;

    if (actualRefundFen <= 0 || actualRefundFen > totalAmount) {
      return res.status(400).json({ success: false, error: '退款金额无效' });
    }

    const refundNo = makeRefundNo(order.id);
    const refundResult = await createRefund({
      outTradeNo: order.out_trade_no,
      refundNo,
      reason: reason || '订单退款',
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
      [refundNo, formatFenToAmount(actualRefundFen), reason || '订单退款', order.id]
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
    console.error('申请退款失败:', error?.response?.data || error);
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
    const parsed = parseNotify(req.headers, req.body || '');
    const resource = parsed.resource || {};
    const outTradeNo = resource.out_trade_no;
    const transactionId = resource.transaction_id || '';

    if (!outTradeNo) {
      return res.status(400).json({ code: 'FAIL', message: '缺少商户单号' });
    }

    await safeQuery(
      `UPDATE orders
       SET payment_status = 'paid',
           wechat_transaction_id = ?,
           payment_notify_raw = ?,
           paid_at = COALESCE(paid_at, NOW()),
           updated_at = NOW()
       WHERE out_trade_no = ?`,
      [transactionId, JSON.stringify(parsed.envelope), outTradeNo]
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
    const parsed = parseNotify(req.headers, req.body || '');
    const resource = parsed.resource || {};
    const refundNo = resource.out_refund_no;

    if (!refundNo) {
      return res.status(400).json({ code: 'FAIL', message: '缺少退款单号' });
    }

    const refundStatus = resource.refund_status === 'SUCCESS' ? 'refunded' : 'failed';
    await safeQuery(
      `UPDATE orders
       SET refund_status = ?,
           wechat_refund_id = ?,
           refunded_at = CASE WHEN ? = 'refunded' THEN COALESCE(refunded_at, NOW()) ELSE refunded_at END,
           payment_status = CASE WHEN ? = 'refunded' THEN 'refunded' ELSE payment_status END,
           status = CASE WHEN ? = 'refunded' AND status <> 'completed' THEN 'cancelled' ELSE status END,
           updated_at = NOW()
       WHERE refund_no = ?`,
      [refundStatus, resource.refund_id || '', refundStatus, refundStatus, refundStatus, refundNo]
    );

    // 同步收入表：全额退款移除记录，部分退款扣减金额
    if (refundStatus === 'refunded') {
      const orderRows = await safeQuery('SELECT id FROM orders WHERE refund_no = ?', [refundNo]);
      if (orderRows.length) {
        await syncOrderIncomeOnRefund(orderRows[0].id).catch((e) => console.error('同步收入失败:', e));
      }
    }

    res.json({ code: 'SUCCESS', message: '成功' });
  } catch (error) {
    console.error('退款回调处理失败:', error);
    res.status(500).json({ code: 'FAIL', message: '处理失败' });
  }
});

module.exports = router;
