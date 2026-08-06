const {
  ensureConversation,
  saveMessage,
  claimConversation,
  completeConversation,
  getHumanQueueByConversationId
} = require('./chatService');

class SocketHub {
  constructor() {
    this.wss = null;
    this.conversationRooms = new Map();
    this.adminSockets = new Set();
  }

  attach(wss) {
    this.wss = wss;
    this.wss.on('connection', ws => {
      ws.meta = { role: '', conversationId: '', adminId: '', adminName: '', userId: '' };

      ws.on('message', async raw => {
        let payload = null;
        try {
          payload = JSON.parse(raw.toString());
        } catch (error) {
          this.send(ws, { type: 'error', message: '消息格式错误' });
          return;
        }

        await this.handleMessage(ws, payload);
      });

      ws.on('close', () => {
        this.leaveConversation(ws, ws.meta.conversationId);
        this.adminSockets.delete(ws);
      });
    });
  }

  async handleMessage(ws, payload) {
    switch (payload.type) {
      case 'auth_user':
        ws.meta.role = 'user';
        ws.meta.userId = String(payload.userId || '');
        ws.meta.conversationId = String(payload.conversationId || '');
        this.joinConversation(ws, ws.meta.conversationId);
        this.send(ws, { type: 'authed', role: 'user', conversationId: ws.meta.conversationId });
        return;
      case 'auth_admin':
        ws.meta.role = 'admin';
        ws.meta.adminId = String(payload.adminId || '');
        ws.meta.adminName = payload.adminName || '人工客服';
        this.adminSockets.add(ws);
        this.send(ws, { type: 'authed', role: 'admin' });
        return;
      case 'join_conversation':
        ws.meta.conversationId = String(payload.conversationId || '');
        this.joinConversation(ws, ws.meta.conversationId);
        this.send(ws, { type: 'joined', conversationId: ws.meta.conversationId });
        return;
      case 'claim_conversation': {
        const state = await claimConversation({
          conversationId: payload.conversationId,
          adminId: payload.adminId,
          adminName: payload.adminName
        });
        ws.meta.conversationId = String(payload.conversationId || '');
        this.joinConversation(ws, ws.meta.conversationId);
        this.broadcastConversation(ws.meta.conversationId, {
          type: 'human_connected',
          conversationId: ws.meta.conversationId,
          agentInfo: state.agentInfo || { id: payload.adminId, name: payload.adminName }
        });
        this.broadcastAdmins({ type: 'queue_updated' });
        return;
      }
      case 'user_message':
      case 'admin_message': {
        const senderType = payload.type === 'admin_message' ? 'human' : 'user';
        const conversation = await ensureConversation({
          conversationId: payload.conversationId,
          userId: payload.userId,
          initialMessage: payload.content || ''
        });
        if (!conversation) {
          this.send(ws, { type: 'error', message: '会话不存在' });
          return;
        }

        const humanQueue = await getHumanQueueByConversationId(conversation.id);
        const humanActive = humanQueue && ['waiting', 'connected'].includes(humanQueue.status);

        if (payload.type === 'user_message' && !humanActive) {
          this.send(ws, {
            type: 'human_session_inactive',
            conversationId: conversation.id
          });
          return;
        }

        if (payload.type === 'admin_message' && !humanActive) {
          this.send(ws, {
            type: 'error',
            message: '人工会话已结束'
          });
          return;
        }

        const saved = await saveMessage(conversation.id, senderType, payload.content || '');
        this.broadcastConversation(conversation.id, {
          type: 'chat_message',
          conversationId: conversation.id,
          message: saved
        });
        this.broadcastAdmins({ type: 'queue_updated' });
        return;
      }
      case 'complete_conversation':
        await completeConversation({ conversationId: payload.conversationId });
        this.broadcastConversation(payload.conversationId, {
          type: 'conversation_completed',
          conversationId: payload.conversationId
        });
        this.broadcastAdmins({ type: 'queue_updated' });
        return;
      default:
        this.send(ws, { type: 'error', message: '未知消息类型' });
    }
  }

  joinConversation(ws, conversationId) {
    if (!conversationId) return;
    this.leaveConversation(ws, ws.meta.conversationId);
    if (!this.conversationRooms.has(conversationId)) {
      this.conversationRooms.set(conversationId, new Set());
    }
    this.conversationRooms.get(conversationId).add(ws);
  }

  leaveConversation(ws, conversationId) {
    if (!conversationId) return;
    const room = this.conversationRooms.get(conversationId);
    if (!room) return;
    room.delete(ws);
    if (room.size === 0) {
      this.conversationRooms.delete(conversationId);
    }
  }

  broadcastConversation(conversationId, payload) {
    const room = this.conversationRooms.get(conversationId);
    if (!room) return;
    room.forEach(ws => this.send(ws, payload));
  }

  broadcastAdmins(payload) {
    this.adminSockets.forEach(ws => this.send(ws, payload));
  }

  send(ws, payload) {
    if (!ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify(payload));
  }
}

module.exports = new SocketHub();
