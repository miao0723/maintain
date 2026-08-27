const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const db = require('../database');
const { faqAgent } = require('../agents/faqAgent');
const { customerServiceRouter } = require('../agents/routerAgent');
const {
  ensureConversation,
  saveMessage,
  transferConversationToHuman,
  getHumanServiceState,
  getHumanQueueByConversationId
} = require('../services/chatService');

// DeepSeek API 配置
const DEEPSEEK_API_KEY = process.env.Deepseek_api_key;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const voiceUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

function readEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {}
    }
    const content = fs.readFileSync(filePath, 'utf8')
    return dotenv.parse(content)
  } catch (error) {
    console.warn('读取环境变量文件失败:', filePath, error.message)
    return {}
  }
}

function resolveVoiceConfig() {
  const rootEnvPath = path.join(__dirname, '../../.env')
  const backendEnvPath = path.join(__dirname, '../.env')
  const rootEnv = readEnvFile(rootEnvPath)
  const backendEnv = readEnvFile(backendEnvPath)
  // 合并优先级（高 -> 低）：
  //   1. process.env        —— 部署时通过环境变量/密钥注入，永远最优先，
  //                            可覆盖镜像内 COPY 进来的陈旧 .env（无需重新构建镜像即可生效）
  //   2. backend/.env       —— 后端目录下的 .env（开发/单机部署常用）
  //   3. 根目录 .env         —— 根目录下的 .env
  // 注意：早期实现把 process.env 放在最低优先级，导致 Docker 容器内 COPY 进来的旧 .env
  // 始终覆盖部署环境变量，改了 backend/.env 后容器内仍报“缺少 DASHSCOPE_API_KEY”。
  const merged = {
    ...rootEnv,
    ...backendEnv,
    ...process.env
  }

  const provider = merged.VOICE_PROVIDER || 'qwen'
  const apiKey = merged.DASHSCOPE_API_KEY || merged.VOICE_API_KEY || ''
  const region = merged.DASHSCOPE_REGION || 'cn-beijing'
  const workspaceId = merged.DASHSCOPE_WORKSPACE_ID || ''
  const model = merged.VOICE_MODEL || 'qwen3-asr-flash'
  const defaultCompatibleBaseUrl = region === 'ap-southeast-1'
    ? 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
    : 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  const workspaceBaseUrl = workspaceId
    ? `https://${workspaceId}.${region}.maas.aliyuncs.com/compatible-mode/v1`
    : ''
  const apiBaseUrl = (
    merged.VOICE_API_BASE_URL
    || defaultCompatibleBaseUrl
  ).replace(/\/+$/, '')

  return {
    provider,
    apiKey,
    region,
    workspaceId,
    model,
    apiBaseUrl,
    workspaceBaseUrl
  }
}

async function transcribeAudioWithLLM(file) {
  const voiceConfig = resolveVoiceConfig()

  if (!voiceConfig.apiKey) {
    throw new Error('缺少 DASHSCOPE_API_KEY，请检查 backend/.env 或项目根目录 .env');
  }

  if (voiceConfig.provider === 'qwen') {
    const mimeType = file.mimetype || detectAudioMimeType(file.originalname || '') || 'audio/mpeg';
    const dataUri = `data:${mimeType};base64,${file.buffer.toString('base64')}`;
    const endpoints = [
      voiceConfig.apiBaseUrl,
      voiceConfig.workspaceBaseUrl
    ].filter((item, index, arr) => item && arr.indexOf(item) === index)

    let lastError = ''
    let lastEmpty = false

    for (const baseUrl of endpoints) {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${voiceConfig.apiKey}`
        },
        body: JSON.stringify({
          model: voiceConfig.model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_audio',
                  input_audio: {
                    data: dataUri
                  }
                }
              ]
            }
          ],
          stream: false,
          asr_options: {
            enable_itn: false
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('通义语音模型转写失败:', response.status, baseUrl, errorText);
        lastError = `端点 ${baseUrl} 请求失败(${response.status})：${errorText}`
        continue
      }

      const data = await response.json();
      const text = extractTranscriptText(data);
      if (!text) {
        lastError = `端点 ${baseUrl} 返回空结果：${JSON.stringify(data)}`
        lastEmpty = true
        continue
      }

      return text;
    }

    // 所有可用端点都返回空结果，通常是录音中没有有效语音（如静音/用户没说话）
    if (lastEmpty) {
      throw new Error('NO_SPEECH');
    }

    throw new Error(lastError || '通义语音模型请求失败');
  }

  throw new Error(`不支持的语音服务提供方：${voiceConfig.provider}`);
}

function extractTranscriptText(payload) {
  const messageContent = payload?.choices?.[0]?.message?.content;
  if (typeof messageContent === 'string') {
    return messageContent.trim();
  }

  if (Array.isArray(messageContent)) {
    return messageContent
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item.text === 'string') return item.text;
        return '';
      })
      .join('')
      .trim();
  }

  if (typeof payload?.text === 'string') {
    return payload.text.trim();
  }

  return '';
}

function detectAudioMimeType(filename = '') {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeMap = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    amr: 'audio/amr',
    oga: 'audio/ogg',
    ogg: 'audio/ogg'
  };

  return mimeMap[ext] || '';
}

/**
 * 检测是否为问候语
 */
function isGreeting(message) {
  const greetingPatterns = [
    /^(你好|您好|嗨|hello|hi|hey|在吗|在不在|有人在吗|你好啊|您好啊)[\s~!！。.]*$/i,
    /^(早上好|中午好|下午好|晚上好|早啊|早|晚安)[\s~!！。.]*$/i,
    /^(hello|hi|hey)\b/i
  ];
  return greetingPatterns.some(pattern => pattern.test(message.trim()));
}

/**
 * 生成基于规则的智能回复
 */
function generateRuleBasedReply(intent, entities, knowledgeContext, productContext) {
  const device = entities.deviceType || '您的设备';
  const problem = entities.problemDescription || '这个问题';

  const replies = {
    greeting: '您好！我是修小宝，您身边的电子维修智能助手。我可以帮您解答手机、电脑、平板、相机、无人机、游戏机等各类设备的维修问题，也能帮您查订单进度。您直接说设备和问题现象就行，也可以点击📦按钮选择产品。请问有什么可以帮您的？',
    repair: `您好！关于${device}的${problem}，建议您先到店进行免费检测，我们的技术人员会为您提供专业的维修方案。`,
    progress: entities.orderId
      ? `好的，我来帮您查询订单 ${entities.orderId} 的维修进度。`
      : '请提供您的订单号，我可以帮您查询维修进度。',
    pricing: productContext
      ? `${productContext.name}的维修费用根据具体故障情况而定，建议您先到店免费检测，我们会给出准确报价。`
      : '维修费用根据设备类型和故障情况而定，建议您先到店进行免费检测。',
    parts: '我们使用原厂正品配件，质量有保证，所有配件都享受质保服务。',
    time: '门店营业时间：周一至周日 9:00-21:00，节假日照常营业。',
    warranty: '所有维修服务均享受90天质保，主板维修享受180天质保，质保期内免费返修。',
    aftersale: '售后问题可以继续帮您跟进。请告诉我订单号或具体故障现象，我会先帮您判断返修、保修或重新报价的处理路径。',
    address: '您可以到店维修，也可以预约上门服务。需要到店维修还是上门服务？',
    contact: '您可以直接通过小程序继续咨询，我们也支持电话联系、门店到访和上门取件。告诉我您想联系哪一类服务，我会继续引导您。',
    data: '维修前建议您备份重要数据，我们会尽全力保护您的隐私和数据安全。',
    water: '设备进水请立即关机，不要充电或尝试开机！建议您尽快到店处理，我们有专业的进水维修技术。',
    product: productContext
      ? `${productContext.name}支持多种维修服务，包括${productContext.repair_types.join('、')}，请问您具体需要什么服务？`
      : '我们的服务涵盖手机、平板、电脑等多种电子设备，请问您需要咨询哪款设备？',
    appointment: '您可以通过我们的小程序预约维修，或者直接到店咨询。',
    delivery: '我们支持邮寄维修服务，您可以联系客服获取邮寄地址和注意事项。',
    payment: '付款、补款、退款、开票这类问题我也可以先帮您判断流程。您可以告诉我订单号和当前状态，我会继续为您梳理下一步。',
    recycle: '我们支持多种电子设备回收与折价评估，包括手机、电脑、平板、手表、相机、无人机等。您可以告诉我设备品牌、型号、成色和是否有维修史，我会帮您判断回收流程。也可以直接到回收页面提交设备信息，我们会有专业人员为您估价。',
    recycle_price: '设备回收价格取决于品牌、型号、成色、维修史和市场行情。一般近新品可按原价55%-85%回收，良好品35%-60%，有明显使用痕迹的15%-35%，有故障品5%-20%。具体价格还需专业检测后才能确定。您可以在回收页面提交设备信息获取准确估价，提交评估不产生任何费用。',
    emergency: '紧急情况我们会优先处理，请您先到店或电话联系我们，我们会立即为您安排。',
    complaint: '非常抱歉给您带来不便，我理解您的心情，让我为您转接人工客服来处理您的问题。',
    refund: '关于退款问题，建议您转接人工客服，我们会根据具体情况为您处理。',
    general: '我是修小宝，您的电子维修智能助手~ 我可以帮您解答手机、电脑、平板、相机、无人机、游戏机等设备的维修与回收问题，也能查订单进度、安排上门或邮寄取件。您直接说设备型号+故障现象，或点下方选项选您想了解的内容，我马上为您解答😊'
  };

  // 如果有相关知识库内容，尝试从知识库中提取答案
  if (knowledgeContext && knowledgeContext.length > 0) {
    const relevantKnowledge = knowledgeContext[0];
    return `${relevantKnowledge.content}`;
  }

  return replies[intent] || replies.general;
}

function buildFallbackActions(intent, entities = {}) {
  const commonActions = [
    { type: 'quick_reply', text: '营业时间' },
    { type: 'quick_reply', text: '维修流程' },
    { type: 'button', text: '预约维修', action: 'book_repair' },
    { type: 'button', text: '转人工客服', action: 'transfer_human' }
  ];

  const actionMap = {
    repair: [
      { type: 'quick_reply', text: '这个故障大概多少钱？' },
      { type: 'quick_reply', text: '一般多久修好？' },
      { type: 'button', text: '预约维修', action: 'book_repair' }
    ],
    progress: [
      { type: 'quick_reply', text: '我想查询订单进度' },
      { type: 'quick_reply', text: '订单现在是什么状态？' },
      { type: 'button', text: '查询订单', action: 'query_order' }
    ],
    pricing: [
      { type: 'quick_reply', text: '维修大概要多少钱？' },
      { type: 'quick_reply', text: '可以先检测再报价吗？' },
      { type: 'button', text: '查看价格表', action: 'show_pricing' }
    ],
    warranty: [
      { type: 'quick_reply', text: '保修期多久？' },
      { type: 'quick_reply', text: '返修怎么处理？' },
      { type: 'button', text: '联系售后', action: 'contact_after_sale' }
    ],
    aftersale: [
      { type: 'quick_reply', text: '返修怎么处理？' },
      { type: 'quick_reply', text: '保修期内还能修吗？' },
      { type: 'button', text: '转人工客服', action: 'transfer_human' }
    ],
    appointment: [
      { type: 'quick_reply', text: '上门取件怎么预约？' },
      { type: 'quick_reply', text: '门店地址在哪？' },
      { type: 'button', text: '在线预约', action: 'book_online' }
    ],
    delivery: [
      { type: 'quick_reply', text: '寄修流程是什么？' },
      { type: 'quick_reply', text: '邮寄地址在哪？' },
      { type: 'button', text: '寄修流程', action: 'show_delivery' }
    ],
    address: [
      { type: 'quick_reply', text: '门店地址在哪？' },
      { type: 'quick_reply', text: '支持上门吗？' },
      { type: 'button', text: '查看门店地址', action: 'show_location' }
    ],
    contact: [
      { type: 'quick_reply', text: '客服电话是多少？' },
      { type: 'quick_reply', text: '营业时间是什么时候？' },
      { type: 'button', text: '转人工客服', action: 'transfer_human' }
    ],
    payment: [
      { type: 'quick_reply', text: '订单怎么付款？' },
      { type: 'quick_reply', text: '退款流程是什么？' },
      { type: 'button', text: '查询订单', action: 'query_order' }
    ],
    recycle: [
      { type: 'quick_reply', text: '回收怎么估价？' },
      { type: 'quick_reply', text: '设备成色怎么判断？' },
      { type: 'button', text: '提交回收申请', action: 'submit_recycle' }
    ],
    recycle_price: [
      { type: 'quick_reply', text: '手机回收价大概多少？' },
      { type: 'quick_reply', text: '判断成色标准是什么？' },
      { type: 'button', text: '提交回收评估', action: 'submit_recycle' }
    ],
    data: [
      { type: 'quick_reply', text: '数据会丢吗？' },
      { type: 'quick_reply', text: '如何提前备份？' },
      { type: 'button', text: '预约维修', action: 'book_repair' }
    ],
    emergency: [
      { type: 'quick_reply', text: '今天能加急吗？' },
      { type: 'quick_reply', text: '最快多久能处理？' },
      { type: 'button', text: '紧急预约', action: 'emergency_booking' }
    ],
    product: [
      { type: 'quick_reply', text: '这个设备常见故障有哪些？' },
      { type: 'quick_reply', text: '这个设备维修多少钱？' },
      { type: 'button', text: '预约维修', action: 'book_repair' }
    ],
    general: commonActions
  };

  const actions = actionMap[intent] || commonActions;
  if (entities.orderId && intent !== 'progress') {
    return [{ type: 'quick_reply', text: '我想查询这个订单进度' }, ...actions].slice(0, 3);
  }

  return actions;
}

function buildNoResultNode(message, intent, entities = {}, productContext = null, knowledgeContext = []) {
  const focus = entities.orderId
    || entities.deviceType
    || entities.deviceBrand
    || message;

  let reply = `暂时没有查到和“${focus}”完全对应的结果，但我可以继续帮您处理。`;

  if (intent === 'progress') {
    reply += ' 如果您是在查订单，请再提供一次订单号、手机号后四位，或者告诉我是维修订单还是回收订单，我会继续帮您核对。';
  } else if (intent === 'pricing' || intent === 'repair' || intent === 'product') {
    reply += ' 如果您是在咨询维修，您可以继续补充设备品牌、型号、故障现象、是否进水/摔过，我会先给您做范围判断和报价引导。';
  } else if (intent === 'recycle' || intent === 'recycle_price') {
    reply += ' 如果您是在咨询回收，您可以告诉我设备的品牌、型号、购买时间、成色情况（有无划痕、磕碰、维修史），我会帮您判断回收价格范围。';
  } else if (intent === 'appointment' || intent === 'delivery' || intent === 'address') {
    reply += ' 如果您是在问预约、寄修、地址或上门服务，可以直接告诉我所在城市、想上门还是到店、或想预约的时间段。';
  } else if (intent === 'payment' || intent === 'refund' || intent === 'aftersale') {
    reply += ' 如果您是在处理付款、退款或售后，请告诉我订单号、当前状态和您遇到的具体问题，我会继续给您分流。';
  } else if (intent === 'general') {
    reply += ' 您可以继续问我订单进度、维修报价、故障判断、营业时间、客服电话、寄修流程、质保政策、系统配置等内容。';
  } else {
    reply += ' 您可以继续补充更具体的信息，我会换一种方式继续查询或给您下一步建议。';
  }

  if (productContext && productContext.name) {
    reply += ` 当前咨询设备是 ${productContext.name}，如果方便，您也可以直接描述该设备的具体故障。`;
  }

  if (knowledgeContext.length === 0 && !entities.orderId && !entities.deviceType && !entities.deviceBrand) {
    reply += ' 目前您的问题信息还比较泛，补充一个订单号、设备型号、故障现象或想查询的配置项，会更容易命中结果。';
  }

  return {
    reply,
    suggestedActions: buildFallbackActions(intent, entities)
  };
}

function sanitizeNonServiceReply(reply, intent, entities = {}) {
  if (!reply) return reply;

  const inventoryLikePattern = /(库存|供应商|低库存|全部库存|供应商排行|库存排行)/i;
  if (!inventoryLikePattern.test(reply)) {
    return reply;
  }

  const fallbackNode = buildNoResultNode(
    entities.problemDescription || entities.deviceType || entities.deviceBrand || '当前问题',
    intent,
    entities,
    null,
    []
  );

  return fallbackNode.reply;
}

/**
 * 调用 DeepSeek 大模型
 */
async function callDeepSeekLLM(systemPrompt, userMessage, conversationHistory = []) {
  try {
    // 构建消息数组
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // 添加历史对话（最近3轮）
    const recentHistory = conversationHistory.slice(-6);
    recentHistory.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    });

    // 添加当前用户消息
    messages.push({ role: 'user', content: userMessage });

    console.log('调用 DeepSeek API, 消息数:', messages.length);

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API 错误:', response.status, errorText);
      throw new Error(`DeepSeek API 调用失败: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;
    console.log('DeepSeek 回复成功');

    return {
      reply,
      isAI: true
    };
  } catch (error) {
    console.error('DeepSeek 调用异常:', error.message);
    throw error;
  }
}

/**
 * 增强的 RAG 知识检索 - 多维度智能匹配
 */
async function retrieveKnowledge(query, productId = null, category = null, intent = null) {
  try {
    let sql = `
      SELECT * FROM knowledge_base
      WHERE 1=1
    `;
    const params = [];

    // 如果指定了分类
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    // 如果指定了产品，查找相关产品的知识
    if (productId) {
      sql += ' AND JSON_CONTAINS(related_products, ?)';
      params.push(JSON.stringify(parseInt(productId)));
    }

    // 根据意图优先匹配相关分类
    const intentCategoryMap = {
      repair: ['屏幕维修', '电池更换', '主板维修', '维修流程'],
      warranty: ['质保政策', '返修流程'],
      parts: ['配件质量', '配件说明'],
      address: ['上门服务'],
      data: ['数据安全', '数据保护'],
      water: ['防水处理', '进水维修'],
      time: ['服务时间'],
      pricing: ['价格说明'],
      appointment: ['预约流程'],
      delivery: ['寄修流程'],
      emergency: ['紧急服务']
    };

    if (intent && intentCategoryMap[intent]) {
      const categoryCondition = intentCategoryMap[intent].map(() => 'category = ?').join(' OR ');
      sql += ` AND (${categoryCondition})`;
      params.push(...intentCategoryMap[intent]);
    }

    // 关键词匹配 - 增强的关键词提取和匹配
    const keywords = extractKeywords(query);

    if (keywords.length > 0) {
      // 构建多条件 OR 查询，匹配标题、内容和关键词字段
      const keywordConditions = keywords.map(() => `
        (title LIKE ? OR content LIKE ? OR JSON_CONTAINS(keywords, ?))
      `).join(' OR ');
      sql += ` AND (${keywordConditions})`;
      keywords.forEach(kw => {
        const pattern = `%${kw}%`;
        params.push(pattern, pattern, JSON.stringify(kw));
      });
    }

    sql += ' ORDER BY id ASC LIMIT 8'; // 增加返回数量以提供更多上下文

    const [knowledgeItems] = await db.query(sql, params);

    // 为每个知识项计算综合相关性得分
    const formattedItems = knowledgeItems.map(item => ({
      category: item.category,
      title: item.title,
      content: item.content,
      keywords: item.keywords ? JSON.parse(item.keywords) : [],
      relevanceScore: calculateEnhancedRelevanceScore(query, item, intent)
    }));

    // 按相关性排序并过滤低相关性结果
    formattedItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // 只返回相关性得分大于 5 的结果
    return formattedItems.filter(item => item.relevanceScore > 5).slice(0, 5);
  } catch (error) {
    console.error('知识检索失败:', error);
    return [];
  }
}

/**
 * 获取产品信息
 */
async function getProductInfo(productId) {
  try {
    if (!productId) return null;
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    if (products.length === 0) return null;

    const product = products[0];
    return {
      name: product.name,
      brand: product.brand,
      model: product.model,
      category: product.category,
      repair_types: product.repair_types ? JSON.parse(product.repair_types) : [],
      common_issues: product.common_issues ? JSON.parse(product.common_issues) : []
    };
  } catch (error) {
    console.error('获取产品信息失败:', error);
    return null;
  }
}

/**
 * 增强的关键词提取 - 支持同义词和组合词
 */
function extractKeywords(text) {
  const stopWords = ['的', '了', '是', '在', '和', '有', '我', '你', '他', '她', '它', '吗', '呢', '吧', '啊', '啊', '呀', '哦', '嗯', '吧', '了'];

  // 常见同义词映射
  const synonymMap = {
    'iphone': ['苹果', 'apple', '苹果手机'],
    'ipad': ['平板', '苹果平板'],
    'macbook': ['苹果电脑', '笔记本'],
    '小米': ['红米', 'mi'],
    '华为': ['huawei'],
    'OPPO': ['oppo'],
    'vivo': ['vivo'],
    '修理': ['维修', '修'],
    '费用': ['价格', '钱', '多少钱'],
    '保修': ['质保', '质量保证'],
    '换屏': ['屏幕', '玻璃', '显示屏', '换屏幕'],
    '电池': ['充电', '电池续航', '电量'],
    '进水': ['泡水', '淋雨', '防水', '掉水里'],
    '数据': ['资料', '照片', '联系人', '隐私', '信息安全']
  };

  let words = text.split(/[\s,，。！?？、]+/).filter(word => {
    return word.length > 0 && !stopWords.includes(word);
  });

  // 扩展同义词
  let expandedKeywords = [];
  words.forEach(word => {
    expandedKeywords.push(word);

    // 检查同义词
    for (const [key, synonyms] of Object.entries(synonymMap)) {
      if (word.toLowerCase() === key || synonyms.includes(word)) {
        expandedKeywords.push(key);
        expandedKeywords.push(...synonyms);
      }
    }
  });

  // 去重并返回
  return [...new Set(expandedKeywords)].slice(0, 8);
}

/**
 * 增强的相关性得分计算 - 多维度综合评分
 */
function calculateEnhancedRelevanceScore(query, knowledgeItem, intent = null) {
  let score = 0;
  const keywords = extractKeywords(query);
  const title = knowledgeItem.title || '';
  const content = knowledgeItem.content || '';
  const itemKeywords = knowledgeItem.keywords ? JSON.parse(knowledgeItem.keywords) : [];
  const itemCategory = knowledgeItem.category || '';

  // 1. 标题完全匹配（权重最高）
  const titleLower = title.toLowerCase();
  keywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    if (titleLower.includes(kwLower)) {
      score += 15; // 完全包含
      if (titleLower === kwLower) {
        score += 10; // 完全匹配
      }
    }
  });

  // 2. 标题短语匹配（连续匹配）
  const queryWords = query.split(/\s+/);
  for (let i = 0; i < queryWords.length - 1; i++) {
    const phrase = queryWords[i] + queryWords[i + 1];
    if (titleLower.includes(phrase.toLowerCase())) {
      score += 12;
    }
  }

  // 3. 内容匹配（基于关键词出现频率）
  const contentLower = content.toLowerCase();
  keywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    const matches = (contentLower.match(new RegExp(kwLower, 'gi')) || []).length;
    score += matches * 5; // 每次匹配5分
  });

  // 4. 知识项关键词匹配（权重次之）
  itemKeywords.forEach(kw => {
    const kwLower = kw.toLowerCase();
    if (query.toLowerCase().includes(kwLower)) {
      score += 8;
    }
  });

  // 5. 意图与分类匹配（如果提供了意图）
  if (intent) {
    const intentCategoryPriority = {
      repair: ['屏幕维修', '电池更换', '主板维修'],
      warranty: ['质保政策', '返修流程'],
      parts: ['配件质量'],
      data: ['数据安全', '数据保护'],
      water: ['防水处理', '进水维修'],
      time: ['服务时间'],
      pricing: ['价格说明'],
      address: ['上门服务']
    };

    const priorityCategories = intentCategoryPriority[intent] || [];
    if (priorityCategories.includes(itemCategory)) {
      score += 10; // 意图匹配的分类优先级加分
    }
  }

  // 6. 长度惩罚（内容过长但匹配度不高的情况）
  if (content.length > 500 && score < 20) {
    score *= 0.8;
  }

  // 7. 确保最小相关性得分
  return Math.max(score, 0);
}

/**
 * 增强的意图识别 - 基于关键词权重的多维度匹配
 */
function intentRecognition(message) {
  const lowerMsg = message.toLowerCase();

  // 意图关键词映射，按权重排序
  const intentKeywords = {
    repair: {
      keywords: [
        { word: '修', weight: 8 },
        { word: '坏', weight: 7 },
        { word: '故障', weight: 9 },
        { word: '不能用', weight: 8 },
        { word: '屏幕', weight: 10 },
        { word: '电池', weight: 10 },
        { word: '充电', weight: 9 },
        { word: '开机', weight: 8 },
        { word: '死机', weight: 8 },
        { word: '换屏', weight: 9 },
        { word: '换电池', weight: 9 },
        { word: '不显示', weight: 8 },
        { word: '不亮', weight: 8 },
        { word: '触控', weight: 9 },
        { word: '失灵', weight: 9 },
        { word: '维修', weight: 10 },
        { word: '修好', weight: 8 },
        { word: '坏了', weight: 7 }
      ],
      threshold: 15
    },
    progress: {
      keywords: [
        { word: '进度', weight: 10 },
        { word: '状态', weight: 10 },
        { word: '好了吗', weight: 8 },
        { word: '完成', weight: 9 },
        { word: '订单', weight: 9 },
        { word: '维修到哪了', weight: 10 },
        { word: '什么时候好', weight: 9 },
        { word: '修完没', weight: 8 },
        { word: '到什么程度', weight: 8 },
        { word: '修得怎么样', weight: 8 }
      ],
      threshold: 12
    },
    pricing: {
      keywords: [
        { word: '价格', weight: 10 },
        { word: '费用', weight: 10 },
        { word: '多少钱', weight: 10 },
        { word: '贵', weight: 7 },
        { word: '便宜', weight: 7 },
        { word: '报价', weight: 9 },
        { word: '收费', weight: 9 },
        { word: '大概', weight: 6 },
        { word: '预算', weight: 6 },
        { word: '多少钱', weight: 10 },
        { word: '怎么收费', weight: 9 }
      ],
      threshold: 12
    },
    parts: {
      keywords: [
        { word: '配件', weight: 10 },
        { word: '零件', weight: 10 },
        { word: '原装', weight: 9 },
        { word: '真伪', weight: 9 },
        { word: '更换', weight: 8 },
        { word: '质量', weight: 9 },
        { word: '原厂', weight: 9 },
        { word: '副厂', weight: 8 },
        { word: '什么配件', weight: 8 },
        { word: '配件怎么样', weight: 8 }
      ],
      threshold: 12
    },
    time: {
      keywords: [
        { word: '时间', weight: 9 },
        { word: '几点', weight: 9 },
        { word: '营业', weight: 10 },
        { word: '开门', weight: 10 },
        { word: '关门', weight: 10 },
        { word: '多久', weight: 9 },
        { word: '要多久', weight: 9 },
        { word: '营业时间', weight: 10 },
        { word: '工作日', weight: 8 },
        { word: '周末', weight: 8 }
      ],
      threshold: 12
    },
    warranty: {
      keywords: [
        { word: '质保', weight: 10 },
        { word: '保修', weight: 10 },
        { word: '返修', weight: 9 },
        { word: '坏了', weight: 7 },
        { word: '又坏', weight: 9 },
        { word: '免费', weight: 8 },
        { word: '保修期', weight: 10 },
        { word: '保多久', weight: 9 },
        { word: '质量保证', weight: 9 },
        { word: '坏了能修吗', weight: 8 }
      ],
      threshold: 12
    },
    address: {
      keywords: [
        { word: '地址', weight: 10 },
        { word: '在哪里', weight: 10 },
        { word: '位置', weight: 10 },
        { word: '怎么去', weight: 9 },
        { word: '上门', weight: 10 },
        { word: '到家', weight: 9 },
        { word: '门店', weight: 9 },
        { word: '店址', weight: 9 },
        { word: '地址在哪', weight: 10 }
      ],
      threshold: 12
    },
    data: {
      keywords: [
        { word: '数据', weight: 10 },
        { word: '隐私', weight: 10 },
        { word: '备份', weight: 10 },
        { word: '资料', weight: 10 },
        { word: '照片', weight: 9 },
        { word: '联系人', weight: 9 },
        { word: '信息安全', weight: 9 },
        { word: '资料会丢吗', weight: 10 },
        { word: '数据会丢吗', weight: 10 }
      ],
      threshold: 12
    },
    water: {
      keywords: [
        { word: '进水', weight: 10 },
        { word: '防水', weight: 9 },
        { word: '淋雨', weight: 9 },
        { word: '泡水', weight: 10 },
        { word: '溅水', weight: 8 },
        { word: '腐蚀', weight: 9 },
        { word: '掉水里', weight: 10 },
        { word: '掉水里了', weight: 10 }
      ],
      threshold: 12
    },
    product: {
      keywords: [
        { word: 'iPhone', weight: 10 },
        { word: 'iPad', weight: 10 },
        { word: 'MacBook', weight: 10 },
        { word: 'Apple', weight: 9 },
        { word: '苹果', weight: 9 },
        { word: '小米', weight: 9 },
        { word: '华为', weight: 9 },
        { word: 'OPPO', weight: 9 },
        { word: 'vivo', weight: 9 },
        { word: '索尼', weight: 9 },
        { word: '佳能', weight: 9 },
        { word: '尼康', weight: 9 },
        { word: '相机', weight: 8 },
        { word: '手机', weight: 7 },
        { word: '电脑', weight: 7 },
        { word: '平板', weight: 7 },
        { word: '手表', weight: 7 },
        { word: '耳机', weight: 7 }
      ],
      threshold: 15
    },
    appointment: {
      keywords: [
        { word: '预约', weight: 10 },
        { word: '可以预约', weight: 9 },
        { word: '需要预约', weight: 9 },
        { word: '怎么预约', weight: 10 },
        { word: '提前预约', weight: 8 },
        { word: '现在能来', weight: 8 },
        { word: '什么时候可以来', weight: 9 }
      ],
      threshold: 12
    },
    delivery: {
      keywords: [
        { word: '送修', weight: 10 },
        { word: '寄修', weight: 10 },
        { word: '邮寄', weight: 10 },
        { word: '快递', weight: 9 },
        { word: '怎么寄', weight: 9 },
        { word: '寄到哪', weight: 9 },
        { word: '可以寄修', weight: 10 }
      ],
      threshold: 12
    },
    emergency: {
      keywords: [
        { word: '紧急', weight: 10 },
        { word: '急', weight: 9 },
        { word: '马上', weight: 10 },
        { word: '今天', weight: 9 },
        { word: '立刻', weight: 10 },
        { word: '工作', weight: 8 },
        { word: '急用', weight: 10 },
        { word: '能不能快', weight: 8 }
      ],
      threshold: 12
    },
    complaint: {
      keywords: [
        { word: '投诉', weight: 10 },
        { word: '不满意', weight: 9 },
        { word: '差评', weight: 10 },
        { word: '气死', weight: 8 },
        { word: '太差', weight: 8 },
        { word: '什么服务', weight: 8 },
        { word: '态度', weight: 7 },
        { word: '不靠谱', weight: 8 }
      ],
      threshold: 12
    },
    refund: {
      keywords: [
        { word: '退款', weight: 10 },
        { word: '赔偿', weight: 10 },
        { word: '退钱', weight: 9 },
        { word: '可以退', weight: 9 },
        { word: '要求退款', weight: 10 },
        { word: '不修了', weight: 8 },
        { word: '要退', weight: 9 }
      ],
      threshold: 12
    },
    aftersale: {
      keywords: [
        { word: '售后', weight: 10 },
        { word: '返修', weight: 10 },
        { word: '复修', weight: 9 },
        { word: '重新维修', weight: 8 },
        { word: '同样问题', weight: 8 },
        { word: '维修后', weight: 8 },
        { word: '修完又坏', weight: 10 }
      ],
      threshold: 12
    },
    contact: {
      keywords: [
        { word: '电话', weight: 10 },
        { word: '客服电话', weight: 10 },
        { word: '联系方式', weight: 10 },
        { word: '联系你们', weight: 8 },
        { word: '微信', weight: 8 },
        { word: '怎么联系', weight: 10 }
      ],
      threshold: 12
    },
    payment: {
      keywords: [
        { word: '付款', weight: 10 },
        { word: '支付', weight: 10 },
        { word: '补款', weight: 9 },
        { word: '尾款', weight: 9 },
        { word: '定金', weight: 8 },
        { word: '开票', weight: 8 },
        { word: '发票', weight: 9 }
      ],
      threshold: 12
    },
    recycle: {
      keywords: [
        { word: '回收', weight: 10 },
        { word: '折价', weight: 9 },
        { word: '卖掉', weight: 8 },
        { word: '二手', weight: 7 },
        { word: '估价', weight: 8 },
        { word: '置换', weight: 9 },
        { word: '以旧换新', weight: 10 }
      ],
      threshold: 12
    },
    recycle_price: {
      keywords: [
        { word: '回收价', weight: 10 },
        { word: '能卖多少', weight: 10 },
        { word: '值多少钱', weight: 10 },
        { word: '回收价格', weight: 10 },
        { word: '还值多少', weight: 9 },
        { word: '估个价', weight: 9 }
      ],
      threshold: 12
    }
  };

  // 计算每个意图的得分
  const intentScores = {};

  for (const [intent, config] of Object.entries(intentKeywords)) {
    let score = 0;
    for (const { word, weight } of config.keywords) {
      if (message.includes(word) || lowerMsg.includes(word.toLowerCase())) {
        score += weight;
      }
    }
    if (score >= config.threshold) {
      intentScores[intent] = score;
    }
  }

  // 如果有匹配的意图，返回得分最高的
  if (Object.keys(intentScores).length > 0) {
    const bestIntent = Object.entries(intentScores)
      .sort((a, b) => b[1] - a[1])[0];
    return {
      intent: bestIntent[0],
      confidence: Math.min(bestIntent[1] / 30, 0.95)
    };
  }

  return { intent: 'general', confidence: 0.5 };
}

/**
 * 实体提取（增强版：支持从诊断消息中提取结构化信息）
 */
function entityExtraction(message, intent) {
  const entities = {};

  // 检测是否为诊断消息，尝试解析结构化格式
  const isDiagnoseMsg = /故障自检/.test(message);
  if (isDiagnoseMsg) {
    // 解析"设备：品牌 型号"
    const deviceMatch = message.match(/设备[：:]\s*(.+)/);
    if (deviceMatch) {
      const deviceInfo = deviceMatch[1].trim();
      const parts = deviceInfo.split(/\s+/);
      if (parts.length >= 2) {
        entities.deviceBrand = parts[0];
        entities.deviceType = parts.slice(1).join(' ');
      } else {
        entities.deviceType = parts[0];
      }
    }

    // 解析"故障：XXX"
    const symptomMatch = message.match(/故障[：:]\s*(.+)/);
    if (symptomMatch) {
      entities.symptom = symptomMatch[1].trim();
      entities.faultType = entities.symptom;
    }

    // 解析"详情：XXX"
    const detailsMatch = message.match(/详情[：:]\s*(.+)/);
    if (detailsMatch) {
      entities.details = detailsMatch[1].trim();
    }

    // 解析"诊断结论：XXX"
    const conclusionMatch = message.match(/诊断结论[：:]\s*(.+)/);
    if (conclusionMatch) {
      entities.diagnoseConclusion = conclusionMatch[1].trim();
    }

    // 提取预估费用
    const costMatch = message.match(/预估费用[：:]\s*(.+)/);
    if (costMatch) {
      entities.estimatedCost = costMatch[1].trim();
    }

    // 提取维修建议
    const repairMatch = message.match(/维修建议[：:]\s*(.+)/);
    if (repairMatch) {
      entities.repairPlan = repairMatch[1].trim();
    }

    // 问题描述使用诊断信息摘要
    const infoParts = [];
    if (entities.deviceBrand && entities.deviceType) infoParts.push(`${entities.deviceBrand} ${entities.deviceType}`);
    if (entities.symptom) infoParts.push(`故障：${entities.symptom}`);
    if (entities.diagnoseConclusion) infoParts.push(`结论：${entities.diagnoseConclusion}`);
    entities.problemDescription = infoParts.join('，');
  }

  // 通用提取逻辑（诊断消息和非诊断消息都适用）
  // 订单号
  const orderMatch = message.match(/(?:订单|单号)[：:]\s*(\w+)/i);
  if (orderMatch) entities.orderId = orderMatch[1];

  // 设备类型（如果诊断消息未解析出）
  if (!entities.deviceType) {
    const deviceMap = {
      'iPhone': 'iPhone', '苹果': 'Apple', 'iPad': 'iPad', 'MacBook': 'MacBook',
      '电脑': '电脑', '笔记本': '笔记本', '手机': '手机', '平板': '平板',
      '手表': 'Apple Watch', '耳机': 'AirPods', '相机': '相机',
      '无人机': '无人机', '游戏机': '游戏机', '显示器': '显示器',
      '打印机': '打印机', '路由器': '路由器'
    };
    for (const [key, value] of Object.entries(deviceMap)) {
      if (message.includes(key)) {
        entities.deviceType = value;
        break;
      }
    }
  }

  // 品牌（如果诊断消息未解析出）
  if (!entities.deviceBrand) {
    const brands = ['苹果', 'Apple', '华为', '荣耀', '小米', '红米', 'OPPO', 'vivo',
                    '三星', 'Samsung', '索尼', '佳能', '尼康', '大疆', 'DJI',
                    '戴尔', '联想', '惠普', '华硕', '微软', '任天堂'];
    for (const brand of brands) {
      if (message.includes(brand)) {
        entities.deviceBrand = brand;
        break;
      }
    }
  }

  // 问题描述（非诊断消息）
  if (!entities.problemDescription && ['repair', 'pricing', 'aftersale', 'recycle'].includes(intent)) {
    entities.problemDescription = message;
  }

  return entities;
}

/**
 * 增强的转人工判断 - 基于用户情绪和问题复杂度的多因素评估
 */
function shouldTransferToHuman(message, conversationHistory = []) {
  // 诊断类消息（来自故障自检）：用户刚完成自检，携带设备故障信息来咨询价格/时间，
  // 此时不应转人工，应由 AI 提取信息直接回答。完全跳过所有自动转人工条件。
  if (/故障自检/.test(message)) {
    return false;
  }

  const transferConditions = [
    // 明确要求人工
    /(人工|真人|客服|专员|转接|活人|要人工|找人工)/.test(message),

    // 情绪类问题
    /(投诉|退款|赔偿|法律|起诉|不满意|差评|气死|太差|垃圾|诈骗|坑人)/.test(message),

    // 技术复杂度高的关键词
    /(主板级|芯片级|BGA|植球|飞线|刷机|越狱|root|硬解|拆机|焊接)/.test(message),

    // 紧急情况判断
    /(紧急|马上|今天|立刻|工作|急用|着急)/.test(message) && /(不能用|坏了|无法|不工作|开不了机|无法启动)/.test(message)
  ];

  // 检查连续失败次数 - 增强判断逻辑
  const recentFailures = conversationHistory.slice(-6).filter(msg =>
    msg.role === 'assistant' && msg.content && (
      msg.content.includes('抱歉') ||
      msg.content.includes('无法') ||
      msg.content.includes('建议您') ||
      msg.content.includes('这个问题')
    )
  ).length;

  // 检查用户情绪 - 连续负面反馈
  const negativeFeedback = conversationHistory.slice(-6).filter(msg =>
    msg.role === 'user' && (
      /(不对|不是|错了|差|慢|烦|不想|不高兴|失望)/.test(msg.content) ||
      /(听不懂|没说清楚|不明白)/.test(msg.content)
    )
  ).length;

  // 检查是否在短时间内重复问同样的问题
  const recentUserMessages = conversationHistory
    .filter(msg => msg.role === 'user')
    .slice(-4);

  const hasRepeatedQuestions = recentUserMessages.length >= 3 &&
    recentUserMessages.every((msg, i, arr) => {
      if (i === 0) return true;
      const similarity = calculateTextSimilarity(msg.content, arr[i - 1].content);
      return similarity > 0.7;
    });

  // 多因素综合判断
  const shouldTransfer =
    transferConditions.some(condition => condition) ||
    recentFailures >= 2 ||
    negativeFeedback >= 3 ||
    hasRepeatedQuestions;

  if (shouldTransfer) {
    console.log('触发转人工条件:', {
      hasDirectRequest: transferConditions.some(condition => condition),
      recentFailures,
      negativeFeedback,
      hasRepeatedQuestions
    });
  }

  return shouldTransfer;
}

/**
 * 计算文本相似度（用于检测重复问题）
 */
function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));

  const intersection = [...words1].filter(word => words2.has(word)).length;
  const union = new Set([...words1, ...words2]).size;

  return union === 0 ? 0 : intersection / union;
}

/**
 * 增强的系统提示词构建 - 根据意图和上下文动态调整
 */
function buildSystemPrompt(knowledgeContext, productContext, intent, userMessage = '') {
  let prompt = `你是一家专业电子维修服务的智能客服助手，名字叫"修小宝"。

你的职责：
- 回答用户关于电子维修的咨询
- 提供维修服务相关的专业建议
- 引导用户进行维修预约或在线咨询
- 以友好、专业的态度服务每一位用户

服务范围：
- 手机维修/回收：iPhone、小米、华为、OPPO、vivo等品牌
- 电脑维修/回收：MacBook、Windows笔记本、台式机
- 平板维修/回收：iPad、安卓平板
- 穿戴设备维修/回收：手表、手环
- 数码设备维修/回收：耳机、相机、无人机、游戏机等

`;

  // 根据意图添加特定提示
  const intentSpecificPrompts = {
    repair: '当前用户咨询的是设备维修问题，请提供专业的故障诊断和维修建议。\n',
    progress: '当前用户咨询的是订单进度问题，请引导用户查询订单状态。\n',
    pricing: '当前用户咨询的是价格问题，请提供清晰的收费标准说明。\n',
    parts: '当前用户咨询的是配件问题，请说明我们使用的配件质量和保修政策。\n',
    time: '当前用户咨询的是时间相关的问题，请提供准确的服务时间信息。\n',
    warranty: '当前用户咨询的是保修问题，请详细说明我们的保修政策和返修流程。\n',
    aftersale: '当前用户咨询的是售后或返修问题，请优先梳理订单、故障是否复发、是否在质保期内，并给出明确下一步。\n',
    address: '当前用户咨询的是地址问题，请提供门店地址和交通指引。\n',
    contact: '当前用户想联系人工或获取联系方式，请提供合适的联系方式、营业时间和联系建议。\n',
    data: '当前用户关心的是数据安全，请强调我们的数据保护措施。\n',
    water: '当前用户遇到的是进水问题，请提供紧急处理建议和维修方案。\n',
    product: '当前用户咨询的是产品相关问题，请提供准确的产品信息和维修建议。\n',
    appointment: '当前用户想要预约服务，请引导用户进行预约。\n',
    delivery: '当前用户想了解寄修服务，请说明寄修流程和注意事项。\n',
    payment: '当前用户咨询的是付款、补款、退款或开票问题，请优先核对订单信息并说明处理流程。\n',
    recycle: '当前用户咨询的是设备回收或折价问题，请说明估价所需信息和回收流程。\n',
    emergency: '当前用户遇到紧急情况，请优先处理并快速响应。\n',
    complaint: '当前用户有投诉情绪，请表达理解并真诚道歉，同时积极寻求解决方案。\n',
    refund: '当前用户要求退款，请说明退款流程并协助处理。\n'
  };

  if (intent && intentSpecificPrompts[intent]) {
    prompt += intentSpecificPrompts[intent];
  }

  // 添加知识库上下文
  if (knowledgeContext && knowledgeContext.length > 0) {
    prompt += `\n【相关知识库信息】\n`;
    knowledgeContext.forEach((item, index) => {
      prompt += `${index + 1}. 【${item.title}】${item.content}\n`;
    });
    prompt += `\n`;
  }

  // 添加产品上下文
  if (productContext) {
    prompt += `\n【当前咨询产品信息】\n`;
    prompt += `产品：${productContext.name}（${productContext.brand} ${productContext.model}）\n`;
    prompt += `分类：${productContext.category}\n`;
    prompt += `支持的维修类型：${productContext.repair_types.join('、')}\n`;
    if (productContext.common_issues && productContext.common_issues.length > 0) {
      prompt += `常见问题：${productContext.common_issues.join('、')}\n`;
    }
    prompt += `\n`;
  }

  // 通用回答要求
  prompt += `【回答要求】
1. 使用友好、专业的语气，称呼用户为"您"
2. 基于上述知识库信息准确回答，不要编造信息
3. 如果知识库中没有完整信息，优先说明还需要什么信息，或告诉用户下一步应提供订单号、型号、故障、时间、地址等，不要只说查不到
4. 回复要简洁明了，控制在150字以内
5. 遇到复杂问题、情绪化用户或连续不满意回复时，主动建议转人工客服
6. 保持对话连贯性，参考历史对话上下文
7. 提供实用的建议和明确的下一步指引
8. 适当使用表情符号增强亲和力

`;

  // 如果是故障自检消息，追加特殊处理指令
  if (/故障自检/.test(userMessage)) {
    prompt += `【特殊指令 - 故障自检消息处理】
用户刚刚通过故障自检功能发送了诊断信息。用户消息中已经包含了以下结构化信息：
- 设备品牌和型号
- 故障现象和描述
- 诊断结论（可能包含可能原因、维修建议、预估费用等）

请你这样做：
1. 首先确认用户的设备信息（品牌型号）和故障现象，让用户知道你已充分理解情况
2. 针对用户提问（通常是维修价格和时长），结合诊断信息给出具体专业的回答
3. 参考诊断中的预估费用，给出价格区间和说明
4. 不要引导用户重新描述问题（用户已经通过自检完成了）
5. 最后自然地引导用户提交订单获取精确报价

重要：用户问什么就答什么，简洁明了，不要啰嗦也不要回避。`;
  }

  return prompt;
}

// 模拟对话历史存储（生产环境应使用数据库）
const conversationStore = new Map();

/**
 * 语音转文字接口
 */
router.post('/transcribe', voiceUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传音频文件'
      });
    }

    const transcript = await transcribeAudioWithLLM(req.file);
    res.json({
      success: true,
      data: {
        text: transcript
      }
    });
  } catch (error) {
    console.error('语音转写失败:', error);
    const isNoSpeech = error.message === 'NO_SPEECH';
    res.status(isNoSpeech ? 422 : 500).json({
      success: false,
      code: isNoSpeech ? 'NO_SPEECH' : 'TRANSCRIBE_FAILED',
      // 不直接把后端原始报错暴露给用户，统一返回可操作的提示文案
      message: isNoSpeech ? '未识别到说话，请重试' : '语音服务暂时不可用，请稍后重试'
    });
  }
});

/**
 * 发送消息接口
 */
router.post('/message', async (req, res) => {
  try {
    const { message, conversationId, context = {}, mode = 'normal' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    const userId = context.userId || req.body.userId || '';
    const userOpenid = context.openid || req.body.userOpenid || '';
    const persistedConversation = await ensureConversation({
      conversationId,
      userId,
      userOpenid,
      initialMessage: message
    });

    const actualConversationId = persistedConversation ? persistedConversation.id : conversationId;
    let conversationHistory = conversationStore.get(actualConversationId) || [];
    const humanQueue = actualConversationId ? await getHumanQueueByConversationId(actualConversationId) : null;
    const humanActive = humanQueue && ['waiting', 'connected'].includes(humanQueue.status);

    if (humanActive) {
      await saveMessage(actualConversationId, 'user', message, { entities: {}, intent: 'human_transfer', confidence: 1 });
      return res.json({
        success: true,
        data: {
          messageId: Date.now().toString(),
          conversationId: actualConversationId,
          reply: humanQueue.status === 'connected'
            ? '人工客服已接入，您的新消息已转交给客服处理。'
            : '已为您排队转人工，您的新消息已加入当前会话。',
          suggestedActions: [],
          requiresHuman: true,
          confidence: 1,
          intent: 'human_transfer'
        }
      });
    }

    // 检测问候语 - 优先回复友好问候
    if (isGreeting(message)) {
      const greetingReply = generateRuleBasedReply('greeting', {}, [], null);
      conversationHistory.push({ role: 'user', content: message });
      conversationHistory.push({ role: 'assistant', content: greetingReply });
      conversationStore.set(actualConversationId, conversationHistory);
      if (actualConversationId) {
        await saveMessage(actualConversationId, 'user', message, { entities: {}, intent: 'greeting', confidence: 1 });
        await saveMessage(actualConversationId, 'ai', greetingReply, { suggestedActions: buildFallbackActions('general', {}) });
      }

      return res.json({
        success: true,
        data: {
          messageId: Date.now().toString(),
          conversationId: actualConversationId,
          reply: greetingReply,
          suggestedActions: buildFallbackActions('general', {}),
          requiresHuman: false,
          confidence: 1,
          intent: 'greeting',
          entities: {}
        }
      });
    }

    // FAQ 常见问题优先匹配（保证页面上展示的常见问题一定能得到回答，不再出现「查不到对应结果」）
    const faqResult = faqAgent.buildReply(message);
    if (faqResult) {
      conversationHistory.push({ role: 'user', content: message });
      conversationHistory.push({ role: 'assistant', content: faqResult.reply });
      conversationStore.set(actualConversationId, conversationHistory);
      if (actualConversationId) {
        await saveMessage(actualConversationId, 'user', message, { entities: {}, intent: faqResult.intent, confidence: faqResult.confidence });
        await saveMessage(actualConversationId, 'ai', faqResult.reply, { suggestedActions: faqResult.suggestedActions });
      }

      return res.json({
        success: true,
        data: {
          messageId: Date.now().toString(),
          conversationId: actualConversationId,
          reply: faqResult.reply,
          suggestedActions: faqResult.suggestedActions,
          requiresHuman: false,
          confidence: faqResult.confidence,
          intent: faqResult.intent,
          entities: {},
          node: 'faq'
        }
      });
    }

    // 意图识别和实体提取
    const { intent, confidence } = intentRecognition(message);
    const entities = entityExtraction(message, intent);

    // 检查是否需要转人工
    if (shouldTransferToHuman(message, conversationHistory)) {
      const reply = '我理解您的需求，让我为您转接专业的人工客服，请稍候...';
      conversationHistory.push({ role: 'user', content: message });
      conversationHistory.push({ role: 'assistant', content: reply });
      conversationStore.set(actualConversationId, conversationHistory);
      if (actualConversationId) {
        await saveMessage(actualConversationId, 'user', message, { entities, intent, confidence });
        await saveMessage(actualConversationId, 'system', reply);
      }

      return res.json({
        success: true,
        data: {
          messageId: Date.now().toString(),
          conversationId: actualConversationId,
          reply,
          suggestedActions: [],
          requiresHuman: true,
          confidence: 0.0,
          intent: 'human_transfer'
        }
      });
    }

    // ===== 智能体路由：维修/回收专业回答 或 订单/进度/设备查询 =====
    let agentResult;
    try {
      agentResult = await customerServiceRouter.processMessage(message, conversationHistory, userId);
    } catch (agentErr) {
      console.error('智能体处理失败，回退规则回复:', agentErr.message);
      agentResult = {
        reply: generateRuleBasedReply('general', {}, [], null),
        suggestedActions: buildFallbackActions('general', {}),
        requiresHuman: false,
        confidence: 0.5,
        intent: 'general',
        entities: {},
        agent: 'fallback'
      };
    }

    const reply = agentResult.reply;
    const suggestedActions = agentResult.suggestedActions || [];
    const agentIntent = agentResult.intent;
    const agentEntities = agentResult.entities || {};
    const agentConfidence = agentResult.confidence;
    const requiresHuman = !!agentResult.requiresHuman;

    conversationHistory.push({ role: 'user', content: message });
    conversationHistory.push({ role: 'assistant', content: reply });
    conversationStore.set(actualConversationId, conversationHistory);

    if (actualConversationId) {
      await saveMessage(actualConversationId, 'user', message, { entities: agentEntities, intent: agentIntent, confidence: agentConfidence });
      await saveMessage(actualConversationId, 'ai', reply, { suggestedActions, agent: agentResult.agent });
    }

    return res.json({
      success: true,
      data: {
        messageId: Date.now().toString(),
        conversationId: actualConversationId,
        reply,
        suggestedActions,
        requiresHuman,
        confidence: agentConfidence,
        intent: agentIntent,
        entities: agentEntities,
        agent: agentResult.agent
      }
    });

  } catch (error) {
    console.error('AI客服处理失败:', error);
    res.status(500).json({
      success: false,
      message: '客服系统暂时不可用，请稍后重试'
    });
  }
});

/**
 * 转人工客服接口
 */
router.post('/transfer-to-human', async (req, res) => {
  try {
    const { conversationId, reason = 'user_requested', userId = '', userOpenid = '' } = req.body;
    const result = await transferConversationToHuman({
      conversationId,
      userId,
      userOpenid,
      reason
    });

    // 通知所有在线的管理员有新的转人工请求
    try {
      const socketHub = require('../services/socketHub');
      socketHub.broadcastAdmins({
        type: 'new_transfer',
        conversationId: result.conversationId,
        userId: userId,
        queuePosition: result.queuePosition || 0,
        timestamp: new Date().toISOString()
      });
      socketHub.broadcastAdmins({ type: 'queue_updated' });
    } catch (socketError) {
      console.error('Socket通知失败（非关键）:', socketError.message);
    }

    res.json({
      success: true,
      data: {
        conversationId: result.conversationId,
        queuePosition: result.queuePosition || 0,
        estimatedWaitTime: result.estimatedWaitTime || 0,
        status: result.status || 'waiting'
      }
    });
  } catch (error) {
    console.error('转人工客服失败:', error);
    res.status(500).json({
      success: false,
      message: '转接人工客服失败，请稍后重试'
    });
  }
});

/**
 * 查询人工客服状态接口
 */
router.get('/human-status', async (req, res) => {
  try {
    const { conversationId } = req.query;
    const state = await getHumanServiceState(conversationId);
    res.json({
      success: true,
      data: state
    });
  } catch (error) {
    console.error('查询人工客服状态失败:', error);
    res.status(500).json({
      success: false,
      message: '查询状态失败'
    });
  }
});

/**
 * 清空对话历史（用于测试）
 */
router.post('/clear-history', async (req, res) => {
  try {
    const { conversationId } = req.body;
    conversationStore.delete(conversationId);
    res.json({ success: true, message: '对话历史已清空' });
  } catch (error) {
    res.status(500).json({ success: false, message: '清空失败' });
  }
});

module.exports = router;
