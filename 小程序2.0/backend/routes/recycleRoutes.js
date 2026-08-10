const express = require('express');
const router = express.Router();
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const DEEPSEEK_API_KEY = process.env.Deepseek_api_key || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * POST /api/recycle/evaluate - LLM回收估价
 * Body: { product: {...}, answers: {...} }
 */
router.post('/evaluate', async (req, res) => {
  try {
    const { product, answers } = req.body;

    if (!product || !answers) {
      return res.status(400).json({
        success: false,
        message: '缺少产品信息或评估答案'
      });
    }

    const estimatedPrice = await evaluateWithLLM(product, answers);

    res.json({
      success: true,
      data: {
        price: estimatedPrice.price,
        reason: estimatedPrice.reason,
        confidence: estimatedPrice.confidence
      }
    });
  } catch (error) {
    console.error('回收估价失败:', error.message);
    // 降级：让前端使用本地计算
    res.status(500).json({
      success: false,
      message: 'AI估价暂时不可用，请使用本地估价'
    });
  }
});

/**
 * 使用Deepseek LLM进行回收估价
 */
async function evaluateWithLLM(product, answers) {
  const answersSummary = Object.entries(answers)
    .map(([key, val]) => `- ${getQuestionLabel(key)}：${val.label}`)
    .join('\n');

  const systemPrompt = `你是一个专业的电子产品回收估价专家。你需要根据用户提供的产品信息和设备状况，给出一个合理的回收估价。

估价时请综合考虑以下因素：
1. 产品型号和当前市场二手价格
2. 设备成色和使用痕迹
3. 屏幕状况
4. 功能完好程度
5. 配件齐全程度
6. 是否有维修史
7. 版本（国行/港版/国际版均影响价格）

请严格按照JSON格式返回，不要包含其他内容：
{
  "price": 数字（预估回收价，单位元，整数）,
  "reason": "估价说明文字（200字以内，简洁专业）",
  "confidence": "high" | "medium" | "low"
}`;

  const userPrompt = `请对以下二手${product.category}进行回收估价：

【产品信息】
品牌：${product.brand}
型号：${product.model}
最高回收价参考：¥${product.basePrice}
规格：${product.specs || '未知'}

【设备状况评估】
${answersSummary}

请基于以上信息，给出一个合理的回收估价。请严格以JSON格式返回。`;

  // 如果没有配置API key，跳过LLM调用
  if (!DEEPSEEK_API_KEY) {
    throw new Error('Deepseek API key not configured');
  }

  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      timeout: 15000
    }
  );

  const content = response.data?.choices?.[0]?.message?.content || '';
  
  // 解析JSON响应
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('LLM响应格式错误');
  }

  const result = JSON.parse(jsonMatch[0]);
  
  if (!result.price || typeof result.price !== 'number') {
    throw new Error('LLM返回的价格无效');
  }

  return {
    price: Math.round(result.price),
    reason: result.reason || `根据市场行情和您提供的设备状况评估，预估回收价格为 ¥${result.price}。`,
    confidence: result.confidence || 'medium'
  };
}

function getQuestionLabel(key) {
  const labels = {
    'condition': '设备成色',
    'screen': '屏幕状况',
    'function': '功能状况',
    'version': '设备版本',
    'accessories': '配件状况',
    'repair-history': '维修史',
    'extra': '补充说明'
  };
  return labels[key] || key;
}

module.exports = router;
