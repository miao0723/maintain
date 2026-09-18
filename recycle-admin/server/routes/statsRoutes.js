/**
 * 数据统计：仪表盘概览 + 回收订单趋势/分类占比/机型排行
 */
const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticate } = require('../middleware/auth');

/** GET /api/stats/dashboard 仪表盘概览 */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const [summary] = await db.query(
      `SELECT
         COUNT(*) AS totalOrders,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingCount,
         SUM(CASE WHEN status = 'quoted' THEN 1 ELSE 0 END) AS quotedCount,
         SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processingCount,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedCount,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelledCount,
         SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS todayCount,
         SUM(CASE WHEN created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN 1 ELSE 0 END) AS monthCount,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN actual_price ELSE 0 END), 0) AS totalCompletedAmount,
         COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN actual_price ELSE 0 END), 0) AS monthCompletedAmount
       FROM orders WHERE order_type = 'recycle'`
    );

    const [trend, topModels, deviceTypeRows, recentOrders, catalogCount, clickSummary] = await Promise.all([
      db.query(
        `SELECT DATE(created_at) AS date, COUNT(*) AS orders,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN actual_price ELSE 0 END), 0) AS amount
         FROM orders
         WHERE order_type = 'recycle' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
         GROUP BY DATE(created_at) ORDER BY date`
      ),
      db.query(
        `SELECT COALESCE(NULLIF(device_model, ''), '未填写') AS model, COUNT(*) AS count
         FROM orders WHERE order_type = 'recycle' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)
         GROUP BY model ORDER BY count DESC LIMIT 10`
      ),
      db.query(
        `SELECT device_type, COUNT(*) AS count FROM orders
         WHERE order_type = 'recycle' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)
         GROUP BY device_type ORDER BY count DESC`
      ),
      db.query(
        `SELECT o.id, o.order_id, o.device_model, o.status, o.estimated_price, o.actual_price,
                o.created_at, u.nickname, u.real_name
         FROM orders o LEFT JOIN users u ON u.id = o.user_id
         WHERE o.order_type = 'recycle'
         ORDER BY o.created_at DESC LIMIT 8`
      ),
      db.query(
        `SELECT (SELECT COUNT(*) FROM recycle_categories WHERE status = 1) AS categories,
                (SELECT COUNT(*) FROM recycle_models WHERE status = 1) AS models,
                (SELECT COUNT(*) FROM recycle_platforms WHERE status = 1) AS platforms,
                (SELECT COUNT(*) FROM recycle_procurement_links WHERE status = 1) AS links,
                (SELECT COALESCE(SUM(click_count), 0) FROM recycle_platforms) AS platformClicks,
                (SELECT COALESCE(SUM(click_count), 0) FROM recycle_procurement_links) AS linkClicks`
      ),
      db.query(
        `SELECT DATE(created_at) AS date, COUNT(*) AS clicks
         FROM recycle_click_logs
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
         GROUP BY DATE(created_at) ORDER BY date`
      )
    ]);

    const deviceTypeNames = {
      1: '手机', 2: '电脑', 3: '平板', 4: '手表/穿戴', 5: '耳机音频', 6: '相机',
      7: '游戏机', 8: '无人机', 99: '其他', 0: '自定义'
    };

    // 环保贡献：以累计回收完成台数为基础，按系统设置中的行业换算系数折算
    const ecoRows = await db.query(
      `SELECT config_key, config_value FROM recycle_settings
        WHERE config_key IN ('eco_co2_per_device', 'eco_tree_co2_year', 'eco_energy_per_device')`
    );
    const ecoCfg = Object.fromEntries(ecoRows.map((r) => [r.config_key, Number(r.config_value)]));
    const co2PerDevice = ecoCfg.eco_co2_per_device || 25;
    const treeCo2Year = ecoCfg.eco_tree_co2_year || 18;
    const energyPerDevice = ecoCfg.eco_energy_per_device || 8.7;
    const ecoDevices = Number(summary.completedCount || 0);
    const eco = {
      devices: ecoDevices,
      co2Kg: Math.round(ecoDevices * co2PerDevice * 10) / 10,
      trees: Math.round((ecoDevices * co2PerDevice / treeCo2Year) * 10) / 10,
      energyKwh: Math.round(ecoDevices * energyPerDevice * 10) / 10
    };

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders: Number(summary.totalOrders || 0),
          pendingCount: Number(summary.pendingCount || 0),
          quotedCount: Number(summary.quotedCount || 0),
          processingCount: Number(summary.processingCount || 0),
          completedCount: Number(summary.completedCount || 0),
          cancelledCount: Number(summary.cancelledCount || 0),
          todayCount: Number(summary.todayCount || 0),
          monthCount: Number(summary.monthCount || 0),
          totalCompletedAmount: Number(summary.totalCompletedAmount || 0),
          monthCompletedAmount: Number(summary.monthCompletedAmount || 0)
        },
        eco,
        trend,
        topModels,
        deviceTypeDist: deviceTypeRows.map((r) => ({
          name: deviceTypeNames[r.device_type] || `类型${r.device_type}`,
          count: Number(r.count)
        })),
        recentOrders,
        catalog: catalogCount[0],
        clickTrend: clickSummary
      }
    });
  } catch (err) {
    console.error('[stats/dashboard]', err);
    res.status(500).json({ success: false, message: '查询统计失败' });
  }
});

/**
 * GET /api/stats/orders 自定义区间订单统计
 * query: startDate, endDate(默认近90天), granularity=day|month
 */
router.get('/orders', authenticate, async (req, res) => {
  try {
    const { startDate = '', endDate = '', granularity = 'day' } = req.query;
    const start = startDate || new Date(Date.now() - 89 * 86400000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);
    const groupExpr = granularity === 'month' ? "DATE_FORMAT(created_at, '%Y-%m')" : 'DATE(created_at)';

    const [trend, statusDist, conditionDist, priceSeg, topModels] = await Promise.all([
      db.query(
        `SELECT ${groupExpr} AS date, COUNT(*) AS orders,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN actual_price ELSE 0 END), 0) AS amount,
                COALESCE(AVG(estimated_price), 0) AS avgEstimate
         FROM orders
         WHERE order_type = 'recycle' AND created_at >= ? AND created_at <= ? + INTERVAL 1 DAY
         GROUP BY ${groupExpr} ORDER BY date`,
        [start, end]
      ),
      db.query(
        `SELECT status, COUNT(*) AS count FROM orders
         WHERE order_type = 'recycle' AND created_at >= ? AND created_at <= ? + INTERVAL 1 DAY
         GROUP BY status`,
        [start, end]
      ),
      db.query(
        `SELECT COALESCE(NULLIF(device_condition, ''), 'unknown') AS conditionKey, COUNT(*) AS count
         FROM orders
         WHERE order_type = 'recycle' AND created_at >= ? AND created_at <= ? + INTERVAL 1 DAY
         GROUP BY conditionKey`,
        [start, end]
      ),
      db.query(
        `SELECT
           SUM(CASE WHEN COALESCE(actual_price, estimated_price) < 500 THEN 1 ELSE 0 END) AS lt500,
           SUM(CASE WHEN COALESCE(actual_price, estimated_price) >= 500 AND COALESCE(actual_price, estimated_price) < 2000 THEN 1 ELSE 0 END) AS gte500,
           SUM(CASE WHEN COALESCE(actual_price, estimated_price) >= 2000 AND COALESCE(actual_price, estimated_price) < 5000 THEN 1 ELSE 0 END) AS gte2000,
           SUM(CASE WHEN COALESCE(actual_price, estimated_price) >= 5000 THEN 1 ELSE 0 END) AS gte5000
         FROM orders
         WHERE order_type = 'recycle' AND created_at >= ? AND created_at <= ? + INTERVAL 1 DAY`,
        [start, end]
      ),
      db.query(
        `SELECT COALESCE(NULLIF(device_model, ''), '未填写') AS model, COUNT(*) AS count,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN actual_price ELSE 0 END), 0) AS amount
         FROM orders
         WHERE order_type = 'recycle' AND created_at >= ? AND created_at <= ? + INTERVAL 1 DAY
         GROUP BY model ORDER BY count DESC LIMIT 15`,
        [start, end]
      )
    ]);

    res.json({
      success: true,
      data: {
        range: { start, end },
        trend,
        statusDist,
        conditionDist,
        priceSeg: priceSeg[0],
        topModels
      }
    });
  } catch (err) {
    console.error('[stats/orders]', err);
    res.status(500).json({ success: false, message: '查询统计失败' });
  }
});

module.exports = router;
