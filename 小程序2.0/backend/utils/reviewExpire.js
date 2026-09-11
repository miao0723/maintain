const db = require('../database');
const { recordOrderIncome } = require('../services/incomeService');

/**
 * 待评价订单自动过期：
 * 状态为 'review' 且进入待评价状态超过 3 天的订单，
 * 自动转为 'completed'（纳入已完成列表），并补记交易收入。
 *
 * 计时基准：优先使用 completed_at（订单完成时间），
 * 若为空则使用 updated_at（状态变更为 review 的时间）。
 *
 * 收入说明：完成接口写入的是 review 状态，incomeService 仅在
 * status='completed' 时入账，因此完成那一步不会记账；此处把
 * review 转 completed 后需补记收入，否则过期订单将永远不入账。
 * recordOrderIncome 基于 order_id 唯一键幂等，重复调用不会重复插入。
 */
async function expireOldReviewOrders() {
  try {
    const rows = await db.query(
      `SELECT id FROM orders
       WHERE status = 'review'
         AND COALESCE(completed_at, updated_at) < NOW() - INTERVAL 3 DAY`
    );
    if (!rows.length) return 0;

    const ids = rows.map((r) => r.id);

    // 逐笔转为已完成并补记收入（订单量小，循环足够且避免 IN 数组兼容问题）
    for (const id of ids) {
      await db
        .query(
          `UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = ?`,
          [id]
        )
        .catch((e) => console.error('[待评价过期] 更新状态失败:', e));
      await recordOrderIncome(id).catch((e) =>
        console.error('[待评价过期] 记录收入失败:', e)
      );
    }

    console.log(
      `[待评价过期] 已将 ${ids.length} 笔超过3天的待评价订单自动转为已完成`
    );
    return ids.length;
  } catch (error) {
    console.error('[待评价过期] 执行失败:', error.message);
    return 0;
  }
}

module.exports = { expireOldReviewOrders };
