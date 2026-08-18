const express = require('express');
const router = express.Router();
const db = require('../database');
const crypto = require('crypto');

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
}

/**
 * 创建或获取会话
 * @param {string} userId 用户ID
 * @param {string} userOpenid 用户OpenID
 * @param {string} initialMessage 首条消息内容（作为历史记录标题）
 */
async function getOrCreateConversation(userId, userOpenid, initialMessage = '') {
  // 先查找最近活跃的会话
  // 注意：db.query() 直接返回 rows 数组（database.js 已解构 [rows, fields]）
  const rows = await db.query(
    `SELECT id FROM chat_conversations
     WHERE user_id = ? AND status = 'active'
     ORDER BY last_activity DESC LIMIT 1`,
    [userId]
  );
  const existingConversation = rows[0];

  if (existingConversation) {
    // 更新最后活动时间
    await db.query(
      `UPDATE chat_conversations SET last_activity = CURRENT_TIMESTAMP WHERE id = ?`,
      [existingConversation.id]
    );
    return existingConversation.id;
  }

  // 创建新会话，用户发送的第一句话作为历史记录标题
  const title = initialMessage
    ? (initialMessage.length > 50 ? initialMessage.substring(0, 50) + '...' : initialMessage)
    : '';
  const conversationId = generateId();
  await db.query(
    `INSERT INTO chat_conversations (id, user_id, user_openid, status, context, last_activity, summary)
     VALUES (?, ?, ?, 'active', '{}', CURRENT_TIMESTAMP, ?)`,
    [conversationId, userId, userOpenid, title]
  );

  return conversationId;
}

/**
 * 保存用户消息
 */
async function saveUserMessage(conversationId, message, entities = {}, intent = null, confidence = 0) {
  const messageId = generateId();
  await db.query(
    `INSERT INTO chat_messages (id, conversation_id, sender_type, content, entities, intent, confidence)
     VALUES (?, ?, 'user', ?, ?, ?, ?)`,
    [messageId, conversationId, message, JSON.stringify(entities), intent, confidence]
  );
  return messageId;
}

/**
 * 保存AI或人工客服消息
 */
async function saveAssistantMessage(conversationId, content, senderType = 'ai', suggestedActions = [], replyToId = null) {
  const messageId = generateId();
  await db.query(
    `INSERT INTO chat_messages (id, conversation_id, sender_type, content, suggested_actions, reply_to_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [messageId, conversationId, senderType, content, JSON.stringify(suggestedActions), replyToId]
  );
  return messageId;
}

/**
 * 获取会话历史
 */
async function getConversationHistory(conversationId, limit = 20) {
  const messages = await db.query(
    `SELECT id, sender_type, content, intent, confidence, suggested_actions, created_at
     FROM chat_messages
     WHERE conversation_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [conversationId, limit]
  );
  return messages.reverse();
}

/**
 * 更新会话摘要
 */
async function updateConversationSummary(conversationId, summary) {
  await db.query(
    `UPDATE chat_conversations SET summary = ? WHERE id = ?`,
    [summary, conversationId]
  );
}

/**
 * 结束会话
 */
async function endConversation(conversationId, endReason = 'inactivity') {
  await db.query(
    `UPDATE chat_conversations SET status = 'completed', end_reason = ? WHERE id = ?`,
    [endReason, conversationId]
  );
}

/**
 * 标记消息已读
 */
async function markMessagesAsRead(conversationId, senderType = 'ai') {
  await db.query(
    `UPDATE chat_messages SET is_read = TRUE
     WHERE conversation_id = ? AND sender_type = ? AND is_read = FALSE`,
    [conversationId, senderType]
  );
}

/**
 * 获取未读消息数量
 */
async function getUnreadCount(userId) {
  const rows = await db.query(
    `SELECT COUNT(*) as count FROM chat_messages cm
     JOIN chat_conversations cc ON cm.conversation_id = cc.id
     WHERE cc.user_id = ? AND cm.sender_type != 'user' AND cm.is_read = FALSE`,
    [userId]
  );
  return rows[0]?.count || 0;
}

/**
 * 获取用户的会话列表
 */
async function getUserConversations(userId, limit = 10) {
  const conversations = await db.query(
    `SELECT cc.id, cc.status, cc.summary, cc.created_at, cc.last_activity, cc.end_reason,
            (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = cc.id) as message_count,
            (SELECT cm.content FROM chat_messages cm WHERE cm.conversation_id = cc.id ORDER BY cm.created_at DESC, cm.id DESC LIMIT 1) as last_message,
            (SELECT cm.sender_type FROM chat_messages cm WHERE cm.conversation_id = cc.id ORDER BY cm.created_at DESC, cm.id DESC LIMIT 1) as last_sender,
            COALESCE(
              (SELECT cm.content FROM chat_messages cm WHERE cm.conversation_id = cc.id AND cm.sender_type = 'user' ORDER BY cm.created_at ASC, cm.id ASC LIMIT 1),
              (SELECT cm.content FROM chat_messages cm WHERE cm.conversation_id = cc.id ORDER BY cm.created_at ASC, cm.id ASC LIMIT 1)
            ) as first_message,
            COALESCE(
              (SELECT cm.sender_type FROM chat_messages cm WHERE cm.conversation_id = cc.id AND cm.sender_type = 'user' ORDER BY cm.created_at ASC, cm.id ASC LIMIT 1),
              (SELECT cm.sender_type FROM chat_messages cm WHERE cm.conversation_id = cc.id ORDER BY cm.created_at ASC, cm.id ASC LIMIT 1)
            ) as first_sender
     FROM chat_conversations cc
     WHERE cc.user_id = ?
     ORDER BY cc.last_activity DESC
     LIMIT ?`,
    [userId, limit]
  );
  return conversations;
}

/**
 * 转接人工客服
 */
async function transferToHuman(conversationId, userId, priority = 'normal') {
  // 将会话添加到人工队列
  const result = await db.query(
    `INSERT INTO human_queue (conversation_id, user_id, priority, status)
     VALUES (?, ?, 'normal', 'waiting')`,
    [conversationId, userId]
  );

  // 更新会话状态
  await db.query(
    `UPDATE chat_conversations SET status = 'transferred' WHERE id = ?`,
    [conversationId]
  );

  // 估算等待时间（假设每个坐席处理时间平均5分钟）
  const queueRows = await db.query(
    `SELECT COUNT(*) as position, SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting
     FROM human_queue WHERE status = 'waiting' AND created_at <= ?`,
    [new Date()]
  );
  const queueInfo = queueRows[0] || { position: 0, waiting: 0 };

  const estimatedWaitTime = queueInfo.waiting * 5 * 60; // 秒
  await db.query(
    `UPDATE human_queue SET queue_position = ?, estimated_wait_time = ? WHERE id = ?`,
    [queueInfo.position, estimatedWaitTime, result.insertId]
  );

  return {
    queueId: result.insertId,
    position: queueInfo.position,
    estimatedWaitTime
  };
}

// ==================== API 路由 ====================

/**
 * 获取或创建会话
 */
router.get('/conversation/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { openid } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空'
      });
    }

    const conversationId = await getOrCreateConversation(userId, openid);
    const history = await getConversationHistory(conversationId);

    res.json({
      success: true,
      data: {
        conversationId,
        history,
        unreadCount: await getUnreadCount(userId)
      }
    });
  } catch (error) {
    console.error('获取会话失败:', error);
    res.status(500).json({
      success: false,
      message: '获取会话失败'
    });
  }
});

/**
 * 发送消息
 */
router.post('/message', async (req, res) => {
  try {
    const {
      message,
      conversationId,
      userId,
      userOpenid,
      context = {},
      mode = 'normal',
      replyToId = null,
      intent = null,
      confidence = 0,
      entities = {}
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    // 获取或创建会话，首条消息作为标题
    let actualConversationId = conversationId;
    if (!actualConversationId && userId) {
      actualConversationId = await getOrCreateConversation(userId, userOpenid, message);
    }

    if (!actualConversationId) {
      return res.status(400).json({
        success: false,
        message: '会话ID或用户ID不能为空'
      });
    }

    // 保存用户消息
    const userMessageId = await saveUserMessage(
      actualConversationId,
      message,
      entities,
      intent,
      confidence
    );

    // TODO: 这里应该调用原有的聊天逻辑生成回复
    // const reply = await generateReply(message, context);

    // 模拟回复
    const reply = '收到您的消息，正在为您处理...';
    const suggestedActions = [
      { type: 'button', text: '预约维修', action: 'book_repair' }
    ];

    // 保存回复消息
    const assistantMessageId = await saveAssistantMessage(
      actualConversationId,
      reply,
      'ai',
      suggestedActions,
      replyToId
    );

    // 标记AI消息为已读（因为是即时回复）
    await markMessagesAsRead(actualConversationId);

    res.json({
      success: true,
      data: {
        conversationId: actualConversationId,
        userMessageId,
        assistantMessageId,
        reply,
        suggestedActions,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({
      success: false,
      message: '发送消息失败'
    });
  }
});

/**
 * 获取会话列表
 */
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const conversations = await getUserConversations(userId, parseInt(limit));

    res.json({
      success: true,
      data: {
        conversations,
        unreadCount: await getUnreadCount(userId)
      }
    });
  } catch (error) {
    console.error('获取会话列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取会话列表失败'
    });
  }
});

/**
 * 获取会话历史
 */
router.get('/history/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50 } = req.query;

    const history = await getConversationHistory(conversationId, parseInt(limit));

    // 标记消息为已读
    await markMessagesAsRead(conversationId);

    res.json({
      success: true,
      data: {
        conversationId,
        history
      }
    });
  } catch (error) {
    console.error('获取历史记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取历史记录失败'
    });
  }
});

/**
 * 标记消息已读
 */
router.post('/read/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    await markMessagesAsRead(conversationId);

    res.json({
      success: true,
      message: '标记成功'
    });
  } catch (error) {
    console.error('标记已读失败:', error);
    res.status(500).json({
      success: false,
      message: '标记已读失败'
    });
  }
});

/**
 * 删除会话及关联消息
 */
router.delete('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: '会话ID不能为空'
      });
    }

    // 检查会话是否存在
    const conversations = await db.query(
      `SELECT id FROM chat_conversations WHERE id = ? LIMIT 1`,
      [conversationId]
    );
    
    if (!conversations || conversations.length === 0) {
      return res.status(404).json({
        success: false,
        message: '会话不存在或已删除'
      });
    }

    // 使用事务 + 临时禁用外键检查，确保删除不会因 FK 约束失败
    await db.transaction(async (connection) => {
      // 临时禁用所有外键检查
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');

      // Step 1: 清除 human_agents 中的引用（SET NULL）
      try {
        const [haResult] = await connection.query(
          `UPDATE human_agents SET current_conversation_id = NULL WHERE current_conversation_id = ?`,
          [conversationId]
        );
        if (haResult.affectedRows > 0) {
          console.log('[ChatPersistence] 已清除坐席引用:', haResult.affectedRows);
        }
      } catch (e) {
        if (!(e.code === 'ER_NO_SUCH_TABLE' || String(e.message).includes("doesn't exist"))) {
          console.error('[ChatPersistence] 清除坐席引用失败:', e.message);
        }
      }

      // Step 2: 删除人工客服队列记录
      try {
        const [hqResult] = await connection.query(
          `DELETE FROM human_queue WHERE conversation_id = ?`,
          [conversationId]
        );
        if (hqResult.affectedRows > 0) {
          console.log('[ChatPersistence] 已删除人工队列记录:', hqResult.affectedRows);
        }
      } catch (e) {
        if (!(e.code === 'ER_NO_SUCH_TABLE' || String(e.message).includes("doesn't exist"))) {
          console.error('[ChatPersistence] 删除人工队列记录失败:', e.message);
        }
      }

      // Step 3: 删除聊天消息记录
      const [msgResult] = await connection.query(
        `DELETE FROM chat_messages WHERE conversation_id = ?`,
        [conversationId]
      );
      console.log('[ChatPersistence] 已删除消息记录:', msgResult.affectedRows);

      // Step 4: 删除会话本身
      const [convResult] = await connection.query(
        `DELETE FROM chat_conversations WHERE id = ?`,
        [conversationId]
      );
      console.log('[ChatPersistence] 已删除会话:', conversationId, 'affectedRows:', convResult.affectedRows);

      // 恢复外键检查
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    });

    res.json({
      success: true,
      message: '会话已删除'
    });
  } catch (error) {
    console.error('[ChatPersistence] 删除会话失败:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: '删除会话失败: ' + (error.message || '未知错误')
    });
  }
});

/**
 * 结束会话
 */
router.post('/end/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { reason = 'user_logout' } = req.body;

    await endConversation(conversationId, reason);

    res.json({
      success: true,
      message: '会话已结束'
    });
  } catch (error) {
    console.error('结束会话失败:', error);
    res.status(500).json({
      success: false,
      message: '结束会话失败'
    });
  }
});

/**
 * 转接人工客服
 */
router.post('/transfer/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId, priority = 'normal' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空'
      });
    }

    const result = await transferToHuman(conversationId, userId, priority);

    res.json({
      success: true,
      data: {
        queueId: result.queueId,
        position: result.position,
        estimatedWaitTime: result.estimatedWaitTime,
        estimatedWaitText: Math.floor(result.estimatedWaitTime / 60) + '分钟'
      }
    });
  } catch (error) {
    console.error('转接人工失败:', error);
    res.status(500).json({
      success: false,
      message: '转接人工失败'
    });
  }
});

/**
 * 获取未读消息数
 */
router.get('/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await getUnreadCount(userId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('获取未读数失败:', error);
    res.status(500).json({
      success: false,
      message: '获取未读数失败'
    });
  }
});

module.exports = router;
