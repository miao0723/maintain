const crypto = require('crypto');
const db = require('../database');

function generateId() {
  return Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
}

function normalizeJsonField(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  if (typeof value === 'object') {
    return value;
  }

  return fallback;
}

async function getConversationById(conversationId) {
  if (!conversationId) return null;
  const rows = await db.query(
    `SELECT * FROM chat_conversations WHERE id = ? LIMIT 1`,
    [conversationId]
  );
  return rows[0] || null;
}

async function getHumanQueueByConversationId(conversationId) {
  if (!conversationId) return null;
  const rows = await db.query(
    `SELECT * FROM human_queue WHERE conversation_id = ? LIMIT 1`,
    [conversationId]
  );
  return rows[0] || null;
}

async function createConversation({ conversationId, userId, userOpenid = '', initialMessage = '' }) {
  const id = conversationId || generateId();
  const summary = initialMessage
    ? (initialMessage.length > 50 ? `${initialMessage.substring(0, 50)}...` : initialMessage)
    : '';

  await db.query(
    `INSERT INTO chat_conversations (id, user_id, user_openid, status, context, last_activity, summary)
     VALUES (?, ?, ?, 'active', '{}', CURRENT_TIMESTAMP, ?)`,
    [id, userId, userOpenid, summary]
  );

  return getConversationById(id);
}

async function ensureConversation({ conversationId, userId, userOpenid = '', initialMessage = '' }) {
  let conversation = await getConversationById(conversationId);
  if (conversation) {
    await db.query(
      `UPDATE chat_conversations SET last_activity = CURRENT_TIMESTAMP WHERE id = ?`,
      [conversation.id]
    );
    return getConversationById(conversation.id);
  }

  if (!userId) {
    return null;
  }

  return createConversation({ conversationId, userId, userOpenid, initialMessage });
}

async function saveMessage(conversationId, senderType, content, extra = {}) {
  const messageId = generateId();
  const {
    entities = {},
    intent = '',
    confidence = 0,
    suggestedActions = [],
    replyToId = ''
  } = extra;

  await db.query(
    `INSERT INTO chat_messages (id, conversation_id, sender_type, content, entities, intent, confidence, suggested_actions, reply_to_id, is_read)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      messageId,
      conversationId,
      senderType,
      content,
      JSON.stringify(entities || {}),
      intent || '',
      Number(confidence) || 0,
      JSON.stringify(suggestedActions || []),
      replyToId || '',
      senderType === 'user' ? 0 : 1
    ]
  );

  await db.query(
    `UPDATE chat_conversations
     SET last_activity = CURRENT_TIMESTAMP,
         summary = CASE
           WHEN summary = '' AND ? = 'user' THEN LEFT(?, 50)
           ELSE summary
         END
     WHERE id = ?`,
    [senderType, content || '', conversationId]
  );

  return {
    id: messageId,
    conversation_id: conversationId,
    sender_type: senderType,
    content,
    created_at: new Date().toISOString(),
    suggested_actions: suggestedActions || []
  };
}

async function getConversationHistory(conversationId, limit = 50) {
  const messages = await db.query(
    `SELECT id, conversation_id, sender_type, content, suggested_actions, created_at
     FROM chat_messages
     WHERE conversation_id = ?
     ORDER BY created_at ASC
     LIMIT ?`,
    [conversationId, Number(limit) || 50]
  );

  return messages.map(item => ({
    ...item,
    suggested_actions: normalizeJsonField(item.suggested_actions, [])
  }));
}

async function transferConversationToHuman({ conversationId, userId, userOpenid = '', initialMessage = '', reason = 'user_requested' }) {
  const conversation = await ensureConversation({ conversationId, userId, userOpenid, initialMessage });
  if (!conversation) {
    throw new Error('会话不存在');
  }

  const existingRows = await db.query(
    `SELECT * FROM human_queue WHERE conversation_id = ? LIMIT 1`,
    [conversation.id]
  );

  if (existingRows[0]) {
    return getHumanServiceState(conversation.id);
  }

  await db.query(
    `INSERT INTO human_queue (conversation_id, user_id, status, priority, reason, queue_position, estimated_wait_time)
     VALUES (?, ?, 'waiting', 'normal', ?, 0, 0)`,
    [conversation.id, userId, reason]
  );

  await db.query(
    `UPDATE chat_conversations SET status = 'transferred', last_activity = CURRENT_TIMESTAMP WHERE id = ?`,
    [conversation.id]
  );

  await saveMessage(conversation.id, 'system', '用户已发起人工客服请求');

  return refreshQueuePositions(conversation.id);
}

async function refreshQueuePositions(targetConversationId = '') {
  const waitingRows = await db.query(
    `SELECT id, conversation_id
     FROM human_queue
     WHERE status = 'waiting'
     ORDER BY created_at ASC`
  );

  for (let index = 0; index < waitingRows.length; index += 1) {
    await db.query(
      `UPDATE human_queue SET queue_position = ?, estimated_wait_time = ? WHERE id = ?`,
      [index + 1, index * 180, waitingRows[index].id]
    );
  }

  if (!targetConversationId) {
    return null;
  }

  return getHumanServiceState(targetConversationId);
}

async function getHumanServiceState(conversationId) {
  const rows = await db.query(
    `SELECT conversation_id, user_id, status, queue_position, estimated_wait_time, assigned_admin_id, assigned_admin_name
     FROM human_queue
     WHERE conversation_id = ?
     LIMIT 1`,
    [conversationId]
  );

  const row = rows[0];
  if (!row) {
    return {
      conversationId,
      status: 'active'
    };
  }

  const payload = {
    conversationId: row.conversation_id,
    userId: row.user_id,
    status: row.status,
    queuePosition: row.queue_position || 0,
    estimatedWaitTime: row.estimated_wait_time || 0
  };

  if (row.assigned_admin_id) {
    payload.agentInfo = {
      id: row.assigned_admin_id,
      name: row.assigned_admin_name || '人工客服'
    };
  }

  return payload;
}

async function claimConversation({ conversationId, adminId, adminName }) {
  const queueRows = await db.query(
    `SELECT * FROM human_queue WHERE conversation_id = ? LIMIT 1`,
    [conversationId]
  );
  const queueItem = queueRows[0];
  if (!queueItem) {
    throw new Error('人工会话不存在');
  }

  if (queueItem.status === 'connected' && queueItem.assigned_admin_id && queueItem.assigned_admin_id !== adminId) {
    throw new Error('该会话已被其他客服接入');
  }

  await db.query(
    `UPDATE human_queue
     SET status = 'connected',
         assigned_admin_id = ?,
         assigned_admin_name = ?,
         connected_at = COALESCE(connected_at, CURRENT_TIMESTAMP),
         queue_position = 0,
         estimated_wait_time = 0
     WHERE conversation_id = ?`,
    [String(adminId), adminName || '人工客服', conversationId]
  );

  await db.query(
    `UPDATE chat_conversations SET status = 'transferred', last_activity = CURRENT_TIMESTAMP WHERE id = ?`,
    [conversationId]
  );

  await saveMessage(conversationId, 'system', `${adminName || '人工客服'} 已接入会话`);
  await refreshQueuePositions();

  return getHumanServiceState(conversationId);
}

async function completeConversation({ conversationId }) {
  await db.query(
    `UPDATE human_queue
     SET status = 'completed', completed_at = CURRENT_TIMESTAMP
     WHERE conversation_id = ?`,
    [conversationId]
  );

  await db.query(
    `UPDATE chat_conversations
     SET status = 'active',
         end_reason = 'human_completed',
         last_activity = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [conversationId]
  );

  await saveMessage(conversationId, 'system', '人工客服会话已结束，已恢复智能客服服务');
}

async function listHumanServiceConversations() {
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
     WHERE hq.status IN ('waiting', 'connected')
     ORDER BY
       CASE WHEN hq.status = 'waiting' THEN 0 ELSE 1 END,
       hq.created_at ASC`
  );

  return rows;
}

module.exports = {
  generateId,
  getConversationById,
  getHumanQueueByConversationId,
  ensureConversation,
  saveMessage,
  getConversationHistory,
  transferConversationToHuman,
  getHumanServiceState,
  claimConversation,
  completeConversation,
  listHumanServiceConversations
};
