const express = require('express');
const router = express.Router();
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const db = require('../database');

dotenv.config({ path: path.join(__dirname, '../.env') });

const DEEPSEEK_API_KEY = process.env.Deepseek_api_key || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * 回收公开数据接口（供小程序端读取回收后台维护的配价库/平台/配置）
 * 数据表由独立的「回收综合服务平台后台」（recycle-admin，端口3005）维护，
 * 本服务只读共享同一 MySQL 库；表不存在或未初始化时返回 managed=false，
 * 小程序端自动回退到本地内置数据，保证离线可用。
 */

/** recycle_* 表是否已初始化 */
async function isRecycleCatalogReady() {
  try {
    const rows = await db.query(
      `SELECT COUNT(*) AS c FROM recycle_categories WHERE status = 1`
    );
    return Number(rows[0]?.c || 0) > 0;
  } catch (e) {
    return false;
  }
}

/**
 * GET /api/recycle/catalog - 配价目录（分类→品牌→型号，仅上架）
 * 返回结构与小程序 utils/recycleData.js 的 categories 完全一致
 */
router.get('/catalog', async (req, res) => {
  try {
    if (!(await isRecycleCatalogReady())) {
      return res.json({ success: true, managed: false, data: null });
    }
    const [cats, brands, models] = await Promise.all([
      db.query('SELECT * FROM recycle_categories WHERE status = 1 ORDER BY sort_order, id'),
      db.query('SELECT * FROM recycle_brands WHERE status = 1 ORDER BY sort_order, id'),
      db.query('SELECT * FROM recycle_models WHERE status = 1 ORDER BY sort_order, id')
    ]);

    const modelMap = new Map();
    for (const m of models) {
      if (!modelMap.has(m.brand_id)) modelMap.set(m.brand_id, []);
      modelMap.get(m.brand_id).push({
        id: `db-${m.id}`,
        name: m.name,
        specs: m.specs || '',
        basePrice: Number(m.base_price) || 0,
        hot: m.hot === 1
      });
    }
    const brandMap = new Map();
    for (const b of brands) {
      if (!brandMap.has(b.category_id)) brandMap.set(b.category_id, []);
      brandMap.get(b.category_id).push({
        id: `db-${b.id}`,
        name: b.name,
        logoText: b.logo_text || b.name.substring(0, 2),
        logoColor: b.logo_color || '#666666',
        models: modelMap.get(b.id) || []
      });
    }

    const categories = cats.map((c) => ({
      id: c.code || `db-${c.id}`,
      name: c.name,
      icon: c.icon || '📦',
      color: c.color || '#5B9E8A',
      brands: brandMap.get(c.id) || []
    }));

    res.json({ success: true, managed: true, data: categories });
  } catch (error) {
    console.error('[recycle/catalog]', error.message);
    res.json({ success: true, managed: false, data: null });
  }
});

/**
 * GET /api/recycle/platforms - 启用中的回收平台（小程序「平台比价」数据源）
 */
router.get('/platforms', async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT id, name, url, type, logo_text, logo_color, description, service_mode, settlement
       FROM recycle_platforms WHERE status = 1 ORDER BY sort_order, id LIMIT 20`
    );
    const platforms = rows.map((r) => ({
      id: r.id,
      name: r.name,
      url: r.url,
      type: r.type,
      typeLabel: r.type === 'procurement' ? '采购渠道' : r.type === 'compare' ? '比价参考' : '回收平台',
      logoText: r.logo_text || r.name.substring(0, 1),
      logoColor: r.logo_color || '#5B9E8A',
      description: r.description || '',
      serviceMode: r.service_mode || '',
      settlement: r.settlement || ''
    }));
    res.json({ success: true, data: platforms });
  } catch (e) {
    // 表未初始化时返回空列表，小程序端隐藏比价区
    res.json({ success: true, data: [] });
  }
});

/**
 * POST /api/recycle/click - 记录小程序端平台跳转点击
 * body: { platformId } 或 { linkId }
 */
router.post('/click', async (req, res) => {
  try {
    const { platformId, linkId } = req.body || {};
    if (platformId) {
      await db.query('UPDATE recycle_platforms SET click_count = click_count + 1 WHERE id = ?', [parseInt(platformId)]);
      await db.query(
        "INSERT INTO recycle_click_logs (target_type, target_id, target_name, source) VALUES ('platform', ?, '', 'mini')",
        [parseInt(platformId)]
      );
    } else if (linkId) {
      await db.query('UPDATE recycle_procurement_links SET click_count = click_count + 1, last_click_at = NOW() WHERE id = ?', [parseInt(linkId)]);
      await db.query(
        "INSERT INTO recycle_click_logs (target_type, target_id, target_name, source) VALUES ('link', ?, '', 'mini')",
        [parseInt(linkId)]
      );
    } else {
      return res.status(400).json({ success: false, message: '缺少平台/链接ID' });
    }
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});

/**
 * GET /api/recycle/config - 回收估价配置（系数+参数）
 * 小程序估价页用后台配置实时覆盖本地默认系数；未初始化时返回 managed=false。
 */
router.get('/config', async (req, res) => {
  try {
    const [settings, rates] = await Promise.all([
      db.query('SELECT config_key, config_value FROM recycle_settings'),
      db.query('SELECT factor_key, label, value, rate FROM recycle_condition_rates ORDER BY factor_key, sort_order, id')
    ]);
    const config = {};
    for (const s of settings) {
      config[s.config_key] = s.config_value;
    }
    const factors = {};
    for (const r of rates) {
      if (!factors[r.factor_key]) factors[r.factor_key] = [];
      factors[r.factor_key].push({ label: r.label, value: r.value, rate: Number(r.rate) });
    }
    res.json({ success: true, managed: true, data: { settings: config, factors } });
  } catch (e) {
    res.json({ success: true, managed: false, data: null });
  }
});

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
