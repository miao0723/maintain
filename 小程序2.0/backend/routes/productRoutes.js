const express = require('express');
const router = express.Router();
const db = require('../database');

/**
 * 测试数据库连接和表状态
 */
router.get('/test/db-status', async (req, res) => {
  try {
    // 检查 products 表是否存在
    const tables = await db.query("SHOW TABLES LIKE 'products'");
    const productsTableExists = tables.length > 0;

    let productsCount = 0;
    let sampleProduct = null;

    if (productsTableExists) {
      // 检查产品数量
      const countResult = await db.query('SELECT COUNT(*) as count FROM products');
      productsCount = countResult[0].count;

      // 获取一个示例产品
      if (productsCount > 0) {
        const samples = await db.query('SELECT * FROM products LIMIT 1');
        sampleProduct = samples[0];
      }
    }

    // 检查 knowledge_base 表
    const kbTables = await db.query("SHOW TABLES LIKE 'knowledge_base'");
    const kbTableExists = kbTables.length > 0;

    let kbCount = 0;
    if (kbTableExists) {
      const kbCountResult = await db.query('SELECT COUNT(*) as count FROM knowledge_base');
      kbCount = kbCountResult[0].count;
    }

    res.json({
      success: true,
      data: {
        products: {
          exists: productsTableExists,
          count: productsCount,
          sample: sampleProduct
        },
        knowledge_base: {
          exists: kbTableExists,
          count: kbCount
        },
        database: {
          connected: true,
          name: process.env.DB_NAME
        }
      }
    });
  } catch (error) {
    console.error('数据库状态检查失败:', error);
    res.status(500).json({
      success: false,
      message: '数据库状态检查失败',
      error: error.message
    });
  }
});

/**
 * 搜索产品
 */
router.get('/search/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const query = `
      SELECT * FROM products 
      WHERE name LIKE ? OR brand LIKE ? OR model LIKE ? OR category LIKE ?
      ORDER BY id ASC
    `;
    const searchPattern = `%${keyword}%`;

    const products = await db.query(query, [searchPattern, searchPattern, searchPattern, searchPattern]);

    // 格式化 JSON 字段，添加安全检查
    const formattedProducts = products.map(product => {
      try {
        return {
          ...product,
          repair_types: product.repair_types ? JSON.parse(product.repair_types) : [],
          common_issues: product.common_issues ? JSON.parse(product.common_issues) : []
        };
      } catch (parseError) {
        console.error('解析产品JSON失败:', product.id, parseError);
        return {
          ...product,
          repair_types: [],
          common_issues: []
        };
      }
    });

    res.json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    console.error('搜索产品失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索产品失败'
    });
  }
});

/**
 * 获取产品列表
 */
router.get('/', async (req, res) => {
  try {
    const { category, brand } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (brand) {
      query += ' AND brand = ?';
      params.push(brand);
    }

    query += ' ORDER BY id ASC';

    console.log('执行产品查询:', query, params);
    const products = await db.query(query, params);
    console.log('查询到产品数量:', products.length);

    // 格式化 JSON 字段，添加安全检查
    const formattedProducts = products.map(product => {
      try {
        return {
          ...product,
          repair_types: product.repair_types ? JSON.parse(product.repair_types) : [],
          common_issues: product.common_issues ? JSON.parse(product.common_issues) : []
        };
      } catch (parseError) {
        console.error('解析产品JSON失败:', product.id, parseError);
        return {
          ...product,
          repair_types: [],
          common_issues: []
        };
      }
    });

    res.json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    console.error('获取产品列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品列表失败'
    });
  }
});

module.exports = router;
