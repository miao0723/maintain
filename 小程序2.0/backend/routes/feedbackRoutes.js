// backend/routes/feedbackRoutes.js —— 用户意见反馈（用户端）
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database.js');

// 反馈类型映射
const FEEDBACK_TYPE_MAP = {
  suggestion: '功能建议',
  complaint: '问题投诉',
  other: '其他'
};

// 反馈状态映射
const FEEDBACK_STATUS_MAP = {
  pending: { label: '待处理', color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
  replied: { label: '已回复', color: '#10b981', bg: '#d1fae5', icon: '💬' },
  closed: { label: '已关闭', color: '#9ca3af', bg: '#f3f4f6', icon: '🔒' }
};

// 补充展示字段（状态文案/颜色等）
function decorateFeedback(row) {
  const st = FEEDBACK_STATUS_MAP[row.status] || FEEDBACK_STATUS_MAP.pending;
  return {
    ...row,
    type_text: FEEDBACK_TYPE_MAP[row.type] || row.type,
    status_label: st.label,
    status_color: st.color,
    status_bg: st.bg,
    status_icon: st.icon
  };
}

/**
 * 提交意见反馈
 * POST /api/feedback
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, content, contact } = req.body || {};

    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, error: '请填写反馈内容' });
    }
    const text = String(content).trim();
    if (text.length > 1000) {
      return res.status(400).json({ success: false, error: '反馈内容不能超过1000字' });
    }

    const validTypes = ['suggestion', 'complaint', 'other'];
    const reqType = validTypes.includes(type) ? type : 'suggestion';
    const contactText = String(contact || '').trim().slice(0, 64);

    const insertRes = await db.query(
      `INSERT INTO feedback (user_id, type, content, contact, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [userId, reqType, text, contactText]
    );

    const created = await db.query('SELECT * FROM feedback WHERE id = ?', [insertRes.insertId]);
    res.json({ success: true, data: decorateFeedback(created[0]), message: '反馈已提交，感谢您的建议' });
  } catch (error) {
    console.error('提交意见反馈错误:', error);
    res.status(500).json({ success: false, error: '提交反馈失败' });
  }
});

/**
 * 我的反馈历史（含管理员回复）
 * GET /api/feedback/my
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await db.query(
      `SELECT * FROM feedback WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    const list = rows.map(decorateFeedback);
    res.json({ success: true, data: { list } });
  } catch (error) {
    console.error('查询我的反馈错误:', error);
    res.status(500).json({ success: false, error: '获取反馈记录失败' });
  }
});

module.exports = router;
