/**
 * 回收综合服务平台 - 数据库连接与表结构管理
 *
 * 独立于维修后台管理系统运行，但共用同一个 MySQL 实例/库：
 * - 回收订单读取业务库现有 orders 表（order_type='recycle'），不重复建表
 * - 配价库/平台/链接/配置等为本系统专属表（recycle_ 前缀），首次启动自动建表并灌入种子数据
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class Database {
  constructor() {
    this.pool = null;
    this.readyPromise = null;
  }

  async init() {
    if (this.readyPromise) return this.readyPromise;
    this.readyPromise = this._init();
    return this.readyPromise;
  }

  async _init() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'repair',
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
      connectTimeout: 10000,
      charset: 'utf8mb4',
      timezone: '+08:00',
      dateStrings: true,
      waitForConnections: true,
      queueLimit: 0
    });

    this.pool.on('error', (err) => {
      console.error('[DB] 连接池错误:', err.code || err.message);
    });

    const conn = await this.pool.getConnection();
    try {
      await conn.ping();
      await this.ensureTables(conn);
      await this.seedDefaults(conn);
    } finally {
      conn.release();
    }
    console.log(`[DB] 已连接 ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  }

  async query(sql, params = []) {
    await this.init();
    const [rows] = await this.pool.query(sql, params);
    return rows;
  }

  /**
   * 业务库 orders 表结构随小程序后端迭代，可选列在此登记，
   * 查询订单前调用，避免本地/服务器结构差异导致 500。
   */
  async orderColumns() {
    if (this._orderColumns) return this._orderColumns;
    const rows = await this.query(
      `SELECT COLUMN_NAME AS name FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'`
    );
    this._orderColumns = new Set(rows.map((r) => r.name));
    return this._orderColumns;
  }

  async ensureTables(conn) {
    const ddl = [
      // 管理员（本系统独立账号体系）
      `CREATE TABLE IF NOT EXISTS recycle_admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(64) NOT NULL COMMENT '登录账号',
        password_hash VARCHAR(128) NOT NULL COMMENT 'bcrypt密码',
        name VARCHAR(64) NOT NULL DEFAULT '' COMMENT '姓名',
        role ENUM('super','admin','viewer') NOT NULL DEFAULT 'admin' COMMENT '角色: super超管/admin管理员/viewer只读',
        status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态: 1启用 0禁用',
        last_login_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回收后台管理员'`,

      // 设备配价库：分类
      `CREATE TABLE IF NOT EXISTS recycle_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(32) NOT NULL COMMENT '分类编码',
        name VARCHAR(64) NOT NULL COMMENT '分类名称',
        icon VARCHAR(16) DEFAULT '' COMMENT '图标(emoji)',
        color VARCHAR(16) DEFAULT '#5B9E8A' COMMENT '主题色',
        sort_order INT DEFAULT 0 COMMENT '排序',
        status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态: 1上架 0下架',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_code (code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回收设备分类'`,

      // 设备配价库：品牌
      `CREATE TABLE IF NOT EXISTS recycle_brands (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category_id INT NOT NULL COMMENT '所属分类ID',
        name VARCHAR(64) NOT NULL COMMENT '品牌名称',
        logo_text VARCHAR(16) DEFAULT '' COMMENT '品牌字标',
        logo_color VARCHAR(16) DEFAULT '#666666' COMMENT '品牌色',
        sort_order INT DEFAULT 0,
        status TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category_id),
        CONSTRAINT fk_recycle_brand_cat FOREIGN KEY (category_id) REFERENCES recycle_categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回收设备品牌'`,

      // 设备配价库：型号（配价核心表）
      `CREATE TABLE IF NOT EXISTS recycle_models (
        id INT PRIMARY KEY AUTO_INCREMENT,
        brand_id INT NOT NULL COMMENT '所属品牌ID',
        name VARCHAR(128) NOT NULL COMMENT '型号名称',
        specs VARCHAR(255) DEFAULT '' COMMENT '规格说明',
        base_price DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '回收基准价(最高回收价)',
        market_price DECIMAL(10,2) NULL COMMENT '二手市场参考价',
        hot TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否热门机型',
        status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态: 1上架 0下架',
        sort_order INT DEFAULT 0,
        updated_by INT NULL COMMENT '最后调价管理员',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_brand (brand_id),
        INDEX idx_status_hot (status, hot),
        CONSTRAINT fk_recycle_model_brand FOREIGN KEY (brand_id) REFERENCES recycle_brands(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回收设备型号配价'`,

      // 调价记录（配价审计）
      `CREATE TABLE IF NOT EXISTS recycle_price_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        model_id INT NOT NULL,
        model_name VARCHAR(128) DEFAULT '',
        old_price DECIMAL(10,2) NULL,
        new_price DECIMAL(10,2) NOT NULL,
        reason VARCHAR(255) DEFAULT '',
        admin_id INT NULL,
        admin_name VARCHAR(64) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_model (model_id),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配价调整记录'`,

      // 回收平台信息（爱回收/转转等回收网站与平台档案）
      `CREATE TABLE IF NOT EXISTS recycle_platforms (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(64) NOT NULL COMMENT '平台名称',
        url VARCHAR(255) NOT NULL DEFAULT '' COMMENT '平台网址',
        type ENUM('recycle','procurement','compare') NOT NULL DEFAULT 'recycle' COMMENT '类型: recycle回收平台/procurement采购渠道/compare比价参考',
        logo_text VARCHAR(16) DEFAULT '',
        logo_color VARCHAR(16) DEFAULT '#5B9E8A',
        description VARCHAR(500) DEFAULT '' COMMENT '平台说明',
        service_mode VARCHAR(128) DEFAULT '' COMMENT '服务方式: 上门/邮寄/到店',
        settlement VARCHAR(128) DEFAULT '' COMMENT '结算方式',
        commission_desc VARCHAR(128) DEFAULT '' COMMENT '佣金/费率说明',
        contact VARCHAR(128) DEFAULT '' COMMENT '联系方式',
        click_count INT NOT NULL DEFAULT 0 COMMENT '跳转点击量',
        status TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回收/采购平台信息'`,

      // 采购链接（按设备分类/机型存储的外部采购与比价链接，支持一键跳转）
      `CREATE TABLE IF NOT EXISTS recycle_procurement_links (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(128) NOT NULL COMMENT '链接名称',
        url VARCHAR(500) NOT NULL COMMENT '链接地址',
        category_id INT NULL COMMENT '适用设备分类(空=通用)',
        platform_id INT NULL COMMENT '关联平台',
        model_keyword VARCHAR(128) DEFAULT '' COMMENT '适用型号关键词',
        price_range VARCHAR(64) DEFAULT '' COMMENT '参考价格区间',
        notes VARCHAR(500) DEFAULT '' COMMENT '备注',
        click_count INT NOT NULL DEFAULT 0 COMMENT '跳转点击量',
        last_click_at DATETIME NULL,
        status TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='采购网站平台链接'`,

      // 链接/平台跳转日志
      `CREATE TABLE IF NOT EXISTS recycle_click_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        target_type ENUM('platform','link') NOT NULL,
        target_id INT NOT NULL,
        target_name VARCHAR(128) DEFAULT '',
        source VARCHAR(32) DEFAULT 'admin' COMMENT '来源: admin后台/mini小程序',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_target (target_type, target_id),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='跳转点击日志'`,

      // 估价配置（成色/屏幕/功能等系数项）
      `CREATE TABLE IF NOT EXISTS recycle_condition_rates (
        id INT PRIMARY KEY AUTO_INCREMENT,
        factor_key VARCHAR(32) NOT NULL COMMENT '因子: condition/screen/function/version/accessories/repair_history',
        factor_name VARCHAR(32) NOT NULL COMMENT '因子名称',
        label VARCHAR(64) NOT NULL COMMENT '选项文案',
        value VARCHAR(32) NOT NULL COMMENT '选项值',
        rate DECIMAL(5,2) NOT NULL DEFAULT 1.00 COMMENT '价格系数',
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_factor (factor_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='估价系数配置'`,

      // 系统参数
      `CREATE TABLE IF NOT EXISTS recycle_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        config_key VARCHAR(64) NOT NULL,
        config_value TEXT,
        description VARCHAR(255) DEFAULT '',
        updated_by INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_key (config_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回收系统参数'`,

      // 操作日志
      `CREATE TABLE IF NOT EXISTS recycle_operation_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        admin_id INT NULL,
        admin_name VARCHAR(64) DEFAULT '',
        module VARCHAR(32) NOT NULL COMMENT '模块: order/catalog/platform/link/setting/auth',
        action VARCHAR(64) NOT NULL COMMENT '操作',
        detail VARCHAR(1000) DEFAULT '',
        ip VARCHAR(64) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_module (module),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='后台操作日志'`
    ];

    for (const sql of ddl) {
      await conn.query(sql);
    }
    console.log('[DB] recycle_* 表结构已就绪');
  }

  /**
   * 首次启动种子数据（均为幂等：仅在对应表为空时写入）
   */
  async seedDefaults(conn) {
    // 1. 默认管理员
    const [adminRows] = await conn.query('SELECT COUNT(*) AS c FROM recycle_admins');
    if (Number(adminRows[0].c) === 0) {
      const hash = bcrypt.hashSync(
        process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
        10
      );
      await conn.query(
        `INSERT INTO recycle_admins (username, password_hash, name, role)
         VALUES (?, ?, ?, 'super')`,
        [process.env.DEFAULT_ADMIN_USERNAME || 'admin', hash, process.env.DEFAULT_ADMIN_NAME || '系统管理员']
      );
      console.log('[DB] 已创建默认管理员');
    }

    // 2. 配价目录（分类→品牌→型号）
    const [catRows] = await conn.query('SELECT COUNT(*) AS c FROM recycle_categories');
    if (Number(catRows[0].c) === 0) {
      const catalogFile = path.join(__dirname, 'data', 'catalog.json');
      if (fs.existsSync(catalogFile)) {
        const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
        for (const cat of catalog.categories || []) {
          const [catRes] = await conn.query(
            `INSERT INTO recycle_categories (code, name, icon, color, sort_order) VALUES (?,?,?,?,?)`,
            [cat.code, cat.name, cat.icon, cat.color, cat.sortOrder]
          );
          for (const brand of cat.brands || []) {
            const [brandRes] = await conn.query(
              `INSERT INTO recycle_brands (category_id, name, logo_text, logo_color, sort_order) VALUES (?,?,?,?,?)`,
              [catRes.insertId, brand.name, brand.logoText, brand.logoColor, brand.sortOrder]
            );
            for (const model of brand.models || []) {
              await conn.query(
                `INSERT INTO recycle_models (brand_id, name, specs, base_price, market_price, hot, sort_order)
                 VALUES (?,?,?,?,?,?,?)`,
                [brandRes.insertId, model.name, model.specs, model.basePrice, model.marketPrice, model.hot, model.sortOrder]
              );
            }
          }
        }
        const [cnt] = await conn.query(
          `SELECT (SELECT COUNT(*) FROM recycle_categories) AS cats,
                  (SELECT COUNT(*) FROM recycle_brands) AS brands,
                  (SELECT COUNT(*) FROM recycle_models) AS models`
        );
        console.log(`[DB] 已导入配价种子: ${cnt[0].cats}分类/${cnt[0].brands}品牌/${cnt[0].models}型号`);
      }
    }

    // 3. 估价系数
    const [rateRows] = await conn.query('SELECT COUNT(*) AS c FROM recycle_condition_rates');
    if (Number(rateRows[0].c) === 0) {
      const catalogFile = path.join(__dirname, 'data', 'catalog.json');
      const factorNames = {
        condition: '设备成色', screen: '屏幕状况', function: '功能状况',
        version: '设备版本', accessories: '配件状况', 'repair-history': '维修史'
      };
      if (fs.existsSync(catalogFile)) {
        const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
        let idx = 0;
        for (const q of catalog.guideQuestions || []) {
          if (!q.options) continue;
          for (const opt of q.options) {
            idx += 1;
            await conn.query(
              `INSERT INTO recycle_condition_rates (factor_key, factor_name, label, value, rate, sort_order)
               VALUES (?,?,?,?,?,?)`,
              [q.id, factorNames[q.id] || q.id, opt.label, opt.value, opt.rate || 1, idx]
            );
          }
        }
        console.log('[DB] 已导入估价系数配置');
      }
    }

    // 4. 系统参数默认值
    const defaultSettings = [
      ['base_factor', '0.9', '二手回收基准系数（即便全新也按此折扣收）'],
      ['ai_evaluate_enabled', '1', '小程序端 AI 估价开关: 1开 0关'],
      ['price_valid_days', '3', '配价有效期(天)，超期需重新询价'],
      ['service_phone', '400-888-8888', '回收服务电话'],
      ['recycle_notice', '回收前请备份数据并退出账号；工程师验机后确定最终价格。', '回收须知'],
      ['max_price_adjust_percent', '20', '单次调价幅度上限(%)，超过需二次确认']
    ];
    for (const [key, value, desc] of defaultSettings) {
      await conn.query(
        'INSERT IGNORE INTO recycle_settings (config_key, config_value, description) VALUES (?,?,?)',
        [key, value, desc]
      );
    }

    // 5. 示例回收平台（可编辑/删除）
    const [pfRows] = await conn.query('SELECT COUNT(*) AS c FROM recycle_platforms');
    if (Number(pfRows[0].c) === 0) {
      const samples = [
        ['爱回收', 'https://www.aihuishou.com', 'recycle', '爱', '#00C29A', '京东旗下二手回收平台，支持上门/邮寄/到店', '上门/邮寄/到店', '验机后打款', '按机型一口价', '官方客服'],
        ['转转回收', 'https://www.zhuanzhuan.com', 'recycle', '转', '#FF5A5F', '二手交易平台，可自主挂卖或官方回收', '邮寄/到店', '确认收货后打款', '平台服务费约1%', '官方客服'],
        ['闲鱼', 'https://www.goofish.com', 'compare', '闲', '#FFAA00', '阿里旗下闲置交易，适合自主定价出售比价', '线上交易', '买家确认后打款', '无(个人交易)', '—'],
        ['回收宝', 'https://www.huishoubao.net', 'recycle', '宝', '#4A90D9', '二手数码回收平台，与多家门店合作', '上门/邮寄', '验机后24h打款', '按机型一口价', '官方客服']
      ];
      let i = 0;
      for (const s of samples) {
        i += 1;
        await conn.query(
          `INSERT INTO recycle_platforms (name, url, type, logo_text, logo_color, description, service_mode, settlement, commission_desc, contact, sort_order)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [...s, i]
        );
      }
      console.log('[DB] 已写入示例回收平台');
    }
  }
}

module.exports = new Database();
