const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');

// LangGraph智能体模拟实现
class ChatAgent {
  constructor() {
    this.intents = {
      repair: /(修|坏|故障|不能用|屏幕|电池|充电|开机|死机)/,
      progress: /(进度|状态|好了吗|完成|订单|维修到哪了)/,
      pricing: /(价格|费用|多少钱|贵|便宜|报价|收费)/,
      parts: /(配件|零件|原装|真伪|更换|质量)/,
      general: /.*/
    };

    this.responses = {
      repair: [
        '您好！请问您的设备遇到了什么问题？',
        '我们可以为您提供专业的维修服务，请描述一下故障情况。',
        '请提供您的设备型号和具体故障现象，以便我们更好地帮助您。'
      ],
      progress: [
        '请提供您的订单号，我可以帮您查询维修进度。',
        '您可以告诉我订单ID，我会立即为您查看当前状态。',
        '需要查询哪个订单的进度呢？请提供订单编号。'
      ],
      pricing: [
        '维修费用根据设备类型和故障情况而定，我们可以先进行免费检测。',
        '不同设备的维修价格不同，建议您先到店或在线咨询具体报价。',
        '我们的价格透明，检测免费，维修前会告知具体费用。'
      ],
      parts: [
        '我们使用原厂配件，质量有保证。',
        '配件库存充足，大部分常用配件当天可更换。',
        '所有配件都享有90天质保，请放心使用。'
      ],
      general: [
        '感谢您的咨询！请问还有什么可以帮您？',
        '您好！欢迎咨询电子维修服务，请问有什么可以帮您？',
        '很高兴为您服务！请告诉我您的需求。'
      ]
    };
  }

  // 意图识别节点
  intentRecognition(message) {
    const lowerMsg = message.toLowerCase();

    for (const [intent, pattern] of Object.entries(this.intents)) {
      if (pattern.test(lowerMsg)) {
        return { intent, confidence: intent === 'general' ? 0.6 : 0.85 };
      }
    }

    return { intent: 'general', confidence: 0.5 };
  }

  // 实体提取节点
  entityExtraction(message, intent) {
    const entities = {};

    // 提取订单号
    const orderMatch = message.match(/(?:订单|单号)[：:]\s*(\w+)/i);
    if (orderMatch) {
      entities.orderId = orderMatch[1];
    }

    // 提取设备类型
    const deviceTypes = ['iPhone', 'iPad', 'MacBook', '电脑', '手机', '平板', '手表'];
    for (const device of deviceTypes) {
      if (message.includes(device)) {
        entities.deviceType = device;
        break;
      }
    }

    // 提取故障描述
    if (intent === 'repair') {
      entities.problemDescription = message;
    }

    return entities;
  }

  // 知识检索节点
  knowledgeRetrieval(intent, entities) {
    // 实际项目中这里会查询知识库
    // 简化处理：直接返回意图相关的信息
    return {
      knowledge: `关于${intent}的相关信息`,
      context: entities
    };
  }

  // 响应生成节点
  responseGeneration(intent, knowledge, conversationHistory) {
    const responses = this.responses[intent] || this.responses.general;
    const randomReply = responses[Math.floor(Math.random() * responses.length)];

    // 生成建议操作
    let suggestedActions = [];
    if (intent === 'repair') {
      suggestedActions = [
        { type: 'quick_reply', text: 'iPhone屏幕碎了' },
        { type: 'quick_reply', text: '电脑无法开机' },
        { type: 'button', text: '查看服务类型', action: 'show_services' }
      ];
    } else if (intent === 'progress') {
      suggestedActions = [
        { type: 'button', text: '查询订单', action: 'query_order' }
      ];
    } else if (intent === 'pricing') {
      suggestedActions = [
        { type: 'quick_reply', text: '手机维修价格' },
        { type: 'quick_reply', text: '电脑维修价格' }
      ];
    }

    return {
      reply: randomReply,
      suggestedActions,
      requiresHuman: false
    };
  }

  // 人工转接节点
  humanTransfer(message, conversationHistory) {
    // 转人工判断逻辑
    const transferConditions = [
      // 1. 用户明确要求转人工
      /(人工|真人|客服|专员|转接|活人)/.test(message),
      // 2. 敏感话题
      /(投诉|退款|赔偿|法律|起诉|不满意|差评)/.test(message),
      // 3. 技术复杂度高
      /(主板|芯片|数据恢复|进水|烧毁|短路|电路)/.test(message),
      // 4. 紧急情况
      (/(紧急|马上|今天|立刻|工作)/.test(message) && /(不能用|坏了|无法)/.test(message)),
      // 5. 多次未解决（简化：消息长度过长可能表示复杂问题）
      message.length > 100
    ];

    return transferConditions.some(condition => condition);
  }

  // 主要处理流程
  async processMessage(message, conversationHistory = []) {
    try {
      // 1. 意图识别
      const { intent, confidence } = this.intentRecognition(message);

      // 2. 检查是否需要转人工
      const requiresHuman = this.humanTransfer(message, conversationHistory);
      if (requiresHuman) {
        return {
          reply: '正在为您转接人工客服，请稍候...',
          suggestedActions: [],
          requiresHuman: true,
          confidence: 0.0,
          intent: 'human_transfer'
        };
      }

      // 3. 实体提取
      const entities = this.entityExtraction(message, intent);

      // 4. 知识检索
      const knowledge = this.knowledgeRetrieval(intent, entities);

      // 5. 响应生成
      const response = this.responseGeneration(intent, knowledge, conversationHistory);

      return {
        ...response,
        confidence,
        intent,
        entities
      };
    } catch (error) {
      console.error('LangGraph智能体处理失败:', error);
      return {
        reply: '抱歉，我暂时无法处理您的请求，请稍后重试或联系人工客服。',
        suggestedActions: [],
        requiresHuman: true,
        confidence: 0.0,
        intent: 'error'
      };
    }
  }
}

// 创建全局智能体实例
const chatAgent = new ChatAgent();

/**
 * 处理AI客服消息（集成LangGraph智能体）
 */
router.post('/message', authenticateToken, async (req, res) => {
  try {
    const { message, conversationId, context = {} } = req.body;
    const userId = req.user.id;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    // 获取对话历史（实际项目中从数据库查询）
    const conversationHistory = []; // 简化处理

    // 使用LangGraph智能体处理消息
    const agentResponse = await chatAgent.processMessage(message, conversationHistory);

    res.json({
      success: true,
      data: {
        messageId: Date.now().toString(),
        reply: agentResponse.reply,
        suggestedActions: agentResponse.suggestedActions,
        requiresHuman: agentResponse.requiresHuman,
        confidence: agentResponse.confidence,
        intent: agentResponse.intent,
        entities: agentResponse.entities
      }
    });
  } catch (error) {
    console.error('AI客服处理失败:', error);
    res.status(500).json({
      success: false,
      message: '客服系统暂时不可用'
    });
  }
});

// 保留其他路由...
module.exports = router;
