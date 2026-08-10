const express = require('express');
const router = express.Router();
const db = require('../database');
const {
  listHumanServiceConversations,
  getConversationHistory,
  claimConversation,
  completeConversation,
  getHumanServiceState
} = require('../services/chatService');

/**
 * 获取活跃的人工会话列表（待接入/已接入）
 */
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await listHumanServiceConversations();
    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('获取人工客服会话列表失败:', error);
    res.status(500).json({ success: false, message: '获取人工会话失败' });
  }
});

/**
 * 获取所有人工客服会话（包括已完成/已取消的）
 */
router.get('/conversations/all', async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT
        hq.conversation_id,
        hq.user_id,
        hq.status,
        hq.queue_position,
        hq.estimated_wait_time,
        hq.assigned_admin_id,
        hq.assigned_admin_name,
        hq.created_at,
        hq.connected_at,
        hq.completed_at,
        cc.summary,
        cc.last_activity,
        (
          SELECT content
          FROM chat_messages cm
          WHERE cm.conversation_id = hq.conversation_id
          ORDER BY cm.created_at DESC
          LIMIT 1
        ) AS last_message
      FROM human_queue hq
      JOIN chat_conversations cc ON cc.id = hq.conversation_id
      ORDER BY hq.created_at DESC
      LIMIT 100`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('获取所有人工客服会话失败:', error);
    res.status(500).json({ success: false, message: '获取所有人工会话失败' });
  }
});

/**
 * 获取转人工等待中的会话数量（用于红点提示）
 */
router.get('/pending-count', async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT COUNT(*) as count FROM human_queue WHERE status = 'waiting'`
    );
    res.json({ success: true, data: { count: rows[0]?.count || 0 } });
  } catch (error) {
    console.error('获取待接入数量失败:', error);
    res.status(500).json({ success: false, message: '获取待接入数量失败' });
  }
});

router.get('/history/:conversationId', async (req, res) => {
  try {
    const history = await getConversationHistory(req.params.conversationId, 200);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('获取人工客服历史失败:', error);
    res.status(500).json({ success: false, message: '获取会话历史失败' });
  }
});

router.post('/claim', async (req, res) => {
  try {
    const { conversationId, adminId, adminName } = req.body;
    const data = await claimConversation({ conversationId, adminId, adminName });
    res.json({ success: true, data });
  } catch (error) {
    console.error('接入人工会话失败:', error);
    res.status(500).json({ success: false, message: error.message || '接入失败' });
  }
});

router.post('/complete', async (req, res) => {
  try {
    const { conversationId } = req.body;
    await completeConversation({ conversationId });
    res.json({ success: true });
  } catch (error) {
    console.error('结束人工会话失败:', error);
    res.status(500).json({ success: false, message: '结束会话失败' });
  }
});

router.get('/status/:conversationId', async (req, res) => {
  try {
    const data = await getHumanServiceState(req.params.conversationId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('获取人工会话状态失败:', error);
    res.status(500).json({ success: false, message: '获取状态失败' });
  }
});

module.exports = router;
