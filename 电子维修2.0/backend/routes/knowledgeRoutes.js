const express = require('express');
const router = express.Router();
const db = require('../database');

/**
 * RAG 知识检索
 * 根据用户问题检索相关知识
 */
router.post('/retrieve', async (req, res) => {
  try {
    const { query, productId, category } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: '查询内容不能为空'
      });
    }

    // 构建检索SQL - 支持关键词匹配和分类筛选
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

    // 关键词匹配：在标题、内容、关键词中搜索
    const keywords = extractKeywords(query);
    if (keywords.length > 0) {
      const keywordConditions = keywords.map(() => `
        (title LIKE ? OR content LIKE ? OR JSON_CONTAINS(keywords, ?))
      `).join(' OR ');
      sql += ` AND (${keywordConditions})`;
      keywords.forEach(kw => {
        const pattern = `%${kw}%`;
        params.push(pattern, pattern, JSON.stringify(kw));
      });
    }

    sql += ' ORDER BY id ASC LIMIT 5';

    const [knowledgeItems] = await db.query(sql, params);

    // 格式化返回结果
    const formattedItems = knowledgeItems.map(item => ({
      id: item.id,
      category: item.category,
      title: item.title,
      content: item.content,
      keywords: item.keywords ? JSON.parse(item.keywords) : [],
      relevanceScore: calculateRelevanceScore(query, item)
    }));

    // 按相关性排序
    formattedItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

    res.json({
      success: true,
      data: formattedItems
    });
  } catch (error) {
    console.error('知识检索失败:', error);
    res.status(500).json({
      success: false,
      message: '知识检索失败'
    });
  }
});

/**
 * 获取所有知识分类
 */
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM knowledge_base
      GROUP BY category
      ORDER BY category ASC
    `);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取知识分类失败:', error);
    res.status(500).json({
      success: false,
      message: '获取知识分类失败'
    });
  }
});

/**
 * 根据分类获取知识
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const [knowledgeItems] = await db.query(
      'SELECT * FROM knowledge_base WHERE category = ? ORDER BY id ASC',
      [category]
    );

    const formattedItems = knowledgeItems.map(item => ({
      ...item,
      keywords: item.keywords ? JSON.parse(item.keywords) : [],
      related_products: item.related_products ? JSON.parse(item.related_products) : []
    }));

    res.json({
      success: true,
      data: formattedItems
    });
  } catch (error) {
    console.error('获取知识失败:', error);
    res.status(500).json({
      success: false,
      message: '获取知识失败'
    });
  }
});

/**
 * 提取关键词
 */
function extractKeywords(text) {
  const stopWords = ['的', '了', '是', '在', '和', '有', '我', '你', '他', '她', '它', '吗', '呢', '吧', '啊'];
  const words = text.split(/[\s,，。！?？]+/).filter(word => {
    return word.length > 1 && !stopWords.includes(word);
  });
  return [...new Set(words)].slice(0, 5); // 最多返回5个关键词
}

/**
 * 计算相关性得分
 */
function calculateRelevanceScore(query, knowledgeItem) {
  let score = 0;
  const keywords = extractKeywords(query);
  const title = knowledgeItem.title || '';
  const content = knowledgeItem.content || '';
  const itemKeywords = knowledgeItem.keywords ? JSON.parse(knowledgeItem.keywords) : [];

  // 标题匹配权重最高
  keywords.forEach(kw => {
    if (title.includes(kw)) {
      score += 10;
    }
  });

  // 内容匹配
  keywords.forEach(kw => {
    const matches = (content.match(new RegExp(kw, 'gi')) || []).length;
    score += matches * 3;
  });

  // 关键词匹配
  itemKeywords.forEach(kw => {
    if (query.includes(kw)) {
      score += 5;
    }
  });

  return score;
}

module.exports = router;
