const db = require('../database');

/**
 * 待评价订单自动过期：
 * 状态为 'review' 且进入待评价状态超过 3 天的订单，
 * 自动转为 'completed'（纳入已完成列表）。
 *
 * 计时基准：优先使用 completed_at（订单完成时间），
 * 若为空则使用 updated_at（状态变更为 review 的时间）。
 */
async function expireOldReviewOrders() {
  try {
    const result = await db.query(
      `UPDATE orders
       SET status = 'completed', updated_at = NOW()
       WHERE status = 'review'
         AND COALESCE(completed_at, updated_at) < NOW() - INTERVAL 3 DAY`
    );
    const affected = result && result.affectedRows ? result.affectedRows : 0;
    if (affected > 0) {
      console.log(`[待评价过期] 已将 ${affected} 笔超过3天的待评价订单自动转为已完成`);
    }
    return affected;
  } catch (error) {
    console.error('[待评价过期] 执行失败:', error.message);
    return 0;
  }
}

module.exports = { expireOldReviewOrders };
