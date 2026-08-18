const { adminServiceApi, chatApi, afterSalesApi } = require('../../utils/api.js');

Page({
  data: {
    conversationId: '',
    messages: [],
    inputText: '',
    voiceSupported: false,
    voiceRecording: false,
    voiceRecognizing: false,
    voiceHint: '',
    socketConnected: false,
    currentAdmin: null,
    currentConversation: null,
    humanConnected: false,
    customerSummary: null,
    showAfterSales: false,
    quickReplies: [
      '您好，很高兴为您服务～',
      '请描述一下设备的具体故障现象',
      '已为您安排工程师，请稍候',
      '方便提供一下设备型号吗？',
      '报价已确认，可点击下方链接支付',
      '维修进度可在「我的订单」查看'
    ]
  },

  onLoad(options) {
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!(userInfo.role === 'admin' || userInfo.role === 'super_admin')) {
      wx.showToast({ title: '需要管理员权限', icon: 'none' });
      wx.navigateBack();
      return;
    }

    const conversationId = decodeURIComponent(options.conversationId || '');
    this.setData({
      conversationId,
      currentAdmin: {
        id: String(userInfo.id || ''),
        name: userInfo.real_name || userInfo.nickname || '人工客服'
      }
    });

    this.initVoiceRecognition();
    this.connectSocket();
    this.openConversation();
  },

  onUnload() {
    this.stopVoiceInput(true);
    this.closeSocket();
  },

  initVoiceRecognition() {
    if (typeof wx.getRecorderManager !== 'function') {
      this.setData({ voiceHint: '当前环境不支持语音录入' });
      return;
    }

    this.recorderManager = wx.getRecorderManager();

    this.recorderManager.onStart(() => {
      this.setData({
        voiceSupported: true,
        voiceRecording: true,
        voiceRecognizing: true,
        voiceHint: '正在录音，结束后提交给语音模型转写'
      });
    });

    this.recorderManager.onStop(async (res) => {
      await this.handleVoiceRecordStop(res);
    });

    this.recorderManager.onError((error) => {
      console.error('[adminservice-chat] 录音失败:', error);
      const errorMsg = error && (error.errMsg || error.msg) ? (error.errMsg || error.msg) : '';
      this.setData({
        voiceRecording: false,
        voiceRecognizing: false,
        voiceHint: errorMsg && !/cancel/i.test(errorMsg) ? `录音失败：${errorMsg}` : '语音录入已取消'
      });

      if (errorMsg && !/cancel/i.test(errorMsg)) {
        wx.showToast({ title: '录音失败', icon: 'none' });
      }
    });

    this.setData({
      voiceSupported: true,
      voiceHint: '点击麦克风开始录音，系统会用语音模型转文字'
    });
  },

  getSocketUrl() {
    const app = getApp();
    const baseUrl = app.globalData.baseUrl || app.globalData.apiUrl || '';
    return baseUrl.replace(/^http/i, 'ws').replace(/\/+$/, '') + '/ws/chat';
  },

  connectSocket() {
    // 本轮会话已确认连不上（服务端未开启 /ws/chat），不再反复重连刷错误
    if (this._socketFailed) {
      this.setData({ socketConnected: false });
      return;
    }
    this.closeSocket();

    const socketTask = wx.connectSocket({
      url: this.getSocketUrl()
    });

    this.socketTask = socketTask;
    this._socketOpened = false;

    socketTask.onOpen(() => {
      this._socketOpened = true;
      this._socketFailed = false;
      this.setData({ socketConnected: true });
      socketTask.send({
        data: JSON.stringify({
          type: 'auth_admin',
          adminId: this.data.currentAdmin.id,
          adminName: this.data.currentAdmin.name
        })
      });
    });

    socketTask.onMessage((event) => {
      try {
        const payload = JSON.parse(event.data);
        this.handleSocketMessage(payload);
      } catch (error) {
        console.error('解析人工客服消息失败:', error);
      }
    });

    socketTask.onClose(() => {
      this._socketOpened = false;
      this.setData({ socketConnected: false });
    });

    socketTask.onError((error) => {
      // 标记失败并静默：连不上不影响该客服页主流程，避免调试器刷 WebSocket 错误
      this._socketOpened = false;
      this._socketFailed = true;
      console.warn('[adminservice-chat] 人工客服 Socket 连接失败（已忽略）:', error);
      this.setData({ socketConnected: false });
    });
  },

  closeSocket() {
    if (this.socketTask) {
      const task = this.socketTask;
      this.socketTask = null;
      // 只有真正建立过连接（onOpen 触发过）才调用 close，否则会抛 closeSocket:fail task not found
      if (this._socketOpened) {
        try { task.close({}); } catch (error) {}
      }
    }
    this._socketOpened = false;
    this.setData({ socketConnected: false });
  },

  async openConversation() {
    const conversationId = this.data.conversationId;
    if (!conversationId) return;

    try {
      // 获取会话状态
      const statusRes = await adminServiceApi.getStatus(conversationId);
      const state = statusRes.data || statusRes || {};
      const isActive = state.status === 'waiting' || state.status === 'connected';

      // 只有活跃会话才尝试接入
      if (state.status === 'waiting' && this.socketTask && this.data.socketConnected) {
        this.socketTask.send({
          data: JSON.stringify({
            type: 'claim_conversation',
            conversationId,
            adminId: this.data.currentAdmin.id,
            adminName: this.data.currentAdmin.name
          })
        });
      } else if (state.status === 'waiting') {
        await adminServiceApi.claimConversation({
          conversationId,
          adminId: this.data.currentAdmin.id,
          adminName: this.data.currentAdmin.name
        });
      }

      if (this.socketTask && this.data.socketConnected && (state.status === 'connected' || state.status === 'waiting')) {
        this.socketTask.send({
          data: JSON.stringify({
            type: 'join_conversation',
            conversationId
          })
        });
      }

      // 加载历史消息（所有状态都能加载）
      const response = await adminServiceApi.getHistory(conversationId);
      const history = response.data || response || [];
      console.log('[adminservice-chat] 加载历史消息:', conversationId, '消息数:', history.length);
      this.setData({
        currentConversation: state,
        messages: history,
        humanConnected: isActive && (state.status === 'connected' || state.assigned_admin_id)
      });

      // 客服侧：加载该用户的售后总览（设备/质保/近期维修）
      if (state.user_id) {
        this.loadCustomerSummary(state.user_id);
      }
    } catch (error) {
      console.error('加载人工客服历史失败:', error);
      // 即使获取状态失败，也尝试加载历史消息
      try {
        const response = await adminServiceApi.getHistory(conversationId);
        const history = response.data || response || [];
        this.setData({ messages: history, humanConnected: false });
      } catch (historyError) {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    }
  },

  async loadCustomerSummary(userId) {
    if (!userId) return;
    try {
      const res = await afterSalesApi.getCustomerSummary(userId);
      if (res && res.success && res.data) {
        this.setData({ customerSummary: res.data });
      }
    } catch (e) {
      console.warn('[adminservice-chat] 加载售后总览失败:', e);
    }
  },

  toggleAfterSales() {
    this.setData({ showAfterSales: !this.data.showAfterSales });
  },

  handleSocketMessage(payload) {
    if (!payload) return;

    if (payload.type === 'human_connected') {
      this.setData({
        humanConnected: true,
        currentConversation: {
          ...(this.data.currentConversation || {}),
          status: 'connected',
          agentInfo: payload.agentInfo || null
        }
      });
      return;
    }

    if (payload.type === 'chat_message' && payload.conversationId === this.data.conversationId) {
      const message = payload.message;
      if (!message) return;
      this.setData({
        messages: this.data.messages.concat(message)
      });
      return;
    }

    if (payload.type === 'conversation_completed') {
      this.setData({ humanConnected: false });
      wx.showToast({ title: '人工会话已结束', icon: 'none' });
    }
  },

  onInputChange(e) {
    this.setData({ inputText: e.detail.value });
  },

  // 点击快捷问题：填入输入框并直接发送
  tapQuickReply(e) {
    const text = (e.currentTarget.dataset.text || '').trim();
    if (!text) return;
    this.setData({ inputText: text });
    this.sendMessage();
  },

  async toggleVoiceInput() {
    if (!this.data.voiceSupported) {
      wx.showToast({ title: '当前设备不支持语音', icon: 'none' });
      return;
    }

    if (this.data.voiceRecording) {
      this.stopVoiceInput();
      return;
    }

    try {
      await this.ensureRecordPermission();
      this.recorderManager.start({
        duration: 60000,
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 48000,
        format: 'mp3'
      });
      this.setData({
        voiceHint: '正在录音，结束后提交给语音模型转写'
      });
    } catch (error) {
      wx.showModal({
        title: '无法使用语音输入',
        content: '请在小程序授权中开启麦克风权限后重试。',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) {
            wx.openSetting({});
          }
        }
      });
    }
  },

  stopVoiceInput(silent = false) {
    if (!this.recorderManager || !this.data.voiceRecording) {
      return;
    }

    try {
      this.recorderManager.stop();
    } catch (error) {
      if (!silent) {
        console.warn('[adminservice-chat] 停止录音失败:', error);
      }
    }

    this.setData({
      voiceRecording: false,
      voiceHint: '录音完成，正在调用语音模型转写'
    });
  },

  ensureRecordPermission() {
    return new Promise((resolve, reject) => {
      wx.authorize({
        scope: 'scope.record',
        success: resolve,
        fail: reject
      });
    });
  },

  applyVoiceResult(result) {
    const finalText = String(result || '').trim();
    const merged = finalText ? (this.data.inputText ? `${this.data.inputText}${/[，。！？；,.!?;]$/.test(this.data.inputText) ? '' : '，'}${finalText}` : finalText) : this.data.inputText;
    this.setData({
      inputText: merged,
      voiceRecording: false,
      voiceRecognizing: false,
      voiceHint: finalText ? '语音已转文字，可直接发送' : '未识别到有效语音，请重试'
    });

    if (!finalText) {
      wx.showToast({ title: '未识别到内容', icon: 'none' });
    }
  },

  async handleVoiceRecordStop(res) {
    const filePath = res && res.tempFilePath ? res.tempFilePath : '';
    const duration = res && res.duration ? res.duration : 0;

    if (!filePath) {
      this.applyVoiceResult('');
      return;
    }

    this.setData({
      voiceRecording: false,
      voiceRecognizing: true,
      voiceHint: '正在调用语音模型转写，请稍候'
    });

    try {
      const response = await chatApi.transcribeAudio(filePath, {
        durationMs: String(duration || 0),
        scene: 'adminservice'
      });
      const resData = response.data || response;
      this.applyVoiceResult(resData.text || '');
    } catch (error) {
      console.error('[adminservice-chat] 语音模型转写失败:', error);
      this.setData({
        voiceRecording: false,
        voiceRecognizing: false,
        voiceHint: '语音模型转写失败，请重试'
      });
      wx.showToast({ title: '语音转写失败', icon: 'none' });
    }
  },

  sendMessage() {
    const content = (this.data.inputText || '').trim();
    if (!content || !this.data.humanConnected || !this.socketTask || !this.data.socketConnected) {
      return;
    }

    this.setData({
      inputText: '',
      voiceHint: this.data.voiceSupported ? '点击麦克风开始录音，系统会用语音模型转文字' : this.data.voiceHint
    });

    this.socketTask.send({
      data: JSON.stringify({
        type: 'admin_message',
        conversationId: this.data.conversationId,
        content
      })
    });
  },

  async completeConversation() {
    if (!this.data.conversationId) return;
    try {
      if (this.socketTask && this.data.socketConnected) {
        this.socketTask.send({
          data: JSON.stringify({
            type: 'complete_conversation',
            conversationId: this.data.conversationId
          })
        });
      } else {
        await adminServiceApi.completeConversation(this.data.conversationId);
      }
      this.setData({ humanConnected: false });
      wx.showToast({ title: '已结束人工会话', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: '结束失败', icon: 'none' });
    }
  }
});
