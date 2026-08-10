const mysql = require('mysql2/promise');
require('dotenv').config();

class Database {
  constructor() {
    this.pool = null;
    this.isInitializing = false;
    this.initPromise = null;
    this.retryTimer = null;
    this.init();
  }

  // 连接失败时进行指数退避重试，待 MySQL 恢复后自动重连（不再让进程崩溃）
  scheduleRetry() {
    if (this.retryTimer) return;
    const delay = 5000;
    console.log(`[DB] ${delay / 1000}s 后尝试重新连接数据库...`);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.init().catch(() => {});
    }, delay);
  }

  async init() {
    // 如果已经在初始化，返回相同的Promise
    if (this.isInitializing) {
      return this.initPromise;
    }

    // 如果已经初始化成功，直接返回
    if (this.pool) {
      return Promise.resolve();
    }

    this.isInitializing = true;

    this.initPromise = (async () => {
      try {
        console.log('开始初始化数据库连接池...');
        console.log(`数据库配置: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

        this.pool = mysql.createPool({
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT) || 3306,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
          connectTimeout: 10000,
          charset: 'utf8mb4',
          timezone: '+08:00',
          dateStrings: true,
          multipleStatements: false,
          waitForConnections: true,
          queueLimit: 0,
          namedPlaceholders: false
        });

        // 测试连接
        const connection = await this.pool.getConnection();
        await connection.ping();

        // 自动创建必要的表（如果不存在）
        await this.ensureTables(connection);

        connection.release();

        console.log('数据库连接池初始化成功');
        this.isInitializing = false;
      } catch (error) {
        console.error('数据库连接池初始化失败（将自动重试）:', error.message);
        this.pool = null;
        this.isInitializing = false;
        // 吞掉异常，避免未捕获的 Promise 拒绝导致进程退出；改用定时重试
        this.scheduleRetry();
        throw error;
      }
    })();

    // 防止构造函数里首次 init 的拒绝变成未捕获异常而崩溃进程
    this.initPromise.catch(() => {});

    return this.initPromise;
  }

  async getConnection() {
    // 等待初始化完成
    if (this.isInitializing) {
      await this.initPromise;
    }

    if (!this.pool) {
      throw new Error('数据库连接池未初始化，请检查数据库配置');
    }

    try {
      const connection = await this.pool.getConnection();

      // 统一数据库会话时区为东八区，避免 NOW()/CURRENT_TIMESTAMP 与业务时间不一致。
      if (!connection.__timeZoneInitialized) {
        await connection.query("SET time_zone = '+08:00'");
        connection.__timeZoneInitialized = true;
      }

      return connection;
    } catch (error) {
      console.error('获取数据库连接失败:', error);
      throw new Error('无法获取数据库连接: ' + error.message);
    }
  }

  async query(sql, params = []) {
    const connection = await this.getConnection();
    try {
      console.log('数据库查询 - SQL:', sql.replace(/\s+/g, ' ').trim());
      console.log('数据库查询 - 参数:', params);
      console.log('数据库查询 - 参数类型:', params.map(p => typeof p));
      
      const [rows] = await connection.query(sql, params);
      return rows;
    } catch (error) {
      console.error('数据库查询错误:', error);
      console.error('SQL:', sql);
      console.error('参数:', params);
      console.error('错误代码:', error.code);
      console.error('错误号:', error.errno);
      console.error('SQL状态:', error.sqlState);
      console.error('SQL消息:', error.sqlMessage);
      throw error;
    } finally {
      connection.release();
    }
  }

  async transaction(callback) {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 自动建表（幂等，不存在才创建）
  async ensureTables(connection) {
    const tables = [
      // 聊天会话表
      `CREATE TABLE IF NOT EXISTS chat_conversations (
        id VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        user_openid VARCHAR(128) DEFAULT '',
        status ENUM('active', 'transferred', 'completed') DEFAULT 'active',
        summary VARCHAR(512) DEFAULT '',
        context JSON,
        end_reason VARCHAR(64) DEFAULT '',
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_last_activity (last_activity)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      // 聊天消息表
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(64) PRIMARY KEY,
        conversation_id VARCHAR(64) NOT NULL,
        sender_type ENUM('user', 'ai', 'human', 'system') NOT NULL,
        content TEXT NOT NULL,
        entities JSON,
        intent VARCHAR(128) DEFAULT '',
        confidence DECIMAL(5,4) DEFAULT 0,
        suggested_actions JSON,
        reply_to_id VARCHAR(64) DEFAULT '',
        is_read TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conversation_id (conversation_id),
        INDEX idx_sender_type (sender_type),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      // 人工客服队列表
      `CREATE TABLE IF NOT EXISTS human_queue (
        id INT PRIMARY KEY AUTO_INCREMENT,
        conversation_id VARCHAR(64) NOT NULL,
        user_id INT NOT NULL,
        status ENUM('waiting', 'connected', 'completed', 'cancelled') DEFAULT 'waiting',
        priority VARCHAR(20) DEFAULT 'normal',
        reason VARCHAR(64) DEFAULT '',
        queue_position INT DEFAULT 0,
        estimated_wait_time INT DEFAULT 0,
        assigned_admin_id VARCHAR(64) DEFAULT '',
        assigned_admin_name VARCHAR(128) DEFAULT '',
        connected_at DATETIME NULL,
        completed_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_conversation (conversation_id),
        INDEX idx_status (status),
        INDEX idx_assigned_admin_id (assigned_admin_id),
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];

    for (const sql of tables) {
      try {
        await connection.query(sql);
      } catch (err) {
        console.error('建表警告（已忽略）:', err.message);
      }
    }

    await this.ensureChatServiceSchema(connection);
    await this.ensureAfterSalesSchema(connection);
    await this.ensureAdminCreatedSchema(connection);

    // 同步设备类型表，使其与前端 deviceData.js 的 deviceTypes 保持一致
    // （扫描识别/添加设备时，前端按 deviceData.js 的 id 传 device_type_id，
    //   若数据库缺少对应类型会导致添加设备 400 "设备类型不存在"）
    await this.ensureDeviceTypes(connection);
  }

  /**
   * 将 device_types 表与前端 utils/deviceData.js 的 deviceTypes 对齐（幂等）。
   * - 表不存在则创建
   * - 已存在的 id 更新名称/图标，不存在的 id 插入
   * - 保留 id=0（自定义设备）
   */
  async ensureDeviceTypes(connection) {
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS device_types (
          id INT PRIMARY KEY,
          name VARCHAR(64) NOT NULL,
          icon VARCHAR(16) DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 确保 id=0 自定义设备存在
      await connection.query(
        `INSERT IGNORE INTO device_types (id, name, icon) VALUES (0, '自定义设备', '✏️')`
      );

      const SHOP = require('../utils/deviceData.js');
      const types = SHOP.deviceTypes || [];
      for (const t of types) {
        await connection.query(
          `INSERT INTO device_types (id, name, icon) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon)`,
          [t.id, t.name, t.icon || '']
        );
      }
      console.log(`[DB] device_types 已与 deviceData.js 同步，共 ${types.length} 个类型`);
    } catch (err) {
      console.error('[DB] 同步 device_types 失败（已忽略）:', err.message);
    }
  }

  /**
   * 管理员代客下单相关字段（幂等）
   * - orders 增加 is_admin_created / admin_created_by / admin_created_at
   * - status 为 VARCHAR，admin_created 直接可作为状态值使用，无需改表结构
   */
  async ensureAdminCreatedSchema(connection) {
    const alter = [];
    if (!await this.columnExists(connection, 'orders', 'is_admin_created')) {
      alter.push(`ALTER TABLE orders ADD COLUMN is_admin_created TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否管理员代客下单（跳过报价环节，直接设定金额）'`);
    }
    if (!await this.columnExists(connection, 'orders', 'admin_created_by')) {
      alter.push(`ALTER TABLE orders ADD COLUMN admin_created_by INT NULL COMMENT '代客下单的管理员ID'`);
    }
    if (!await this.columnExists(connection, 'orders', 'admin_created_at')) {
      alter.push(`ALTER TABLE orders ADD COLUMN admin_created_at DATETIME NULL COMMENT '代客下单时间'`);
    }

    for (const sql of alter) {
      try {
        await connection.query(sql);
      } catch (err) {
        console.error('[DB] 代客下单表结构修正警告（已忽略）:', err.message);
      }
    }
    if (alter.length > 0) {
      console.log('[DB] 已为 orders 表增加管理员代客下单字段');
    }
  }

  async columnExists(connection, tableName, columnName) {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?`,
      [tableName, columnName]
    );
    return Number(rows[0]?.count || 0) > 0;
  }

  async indexExists(connection, tableName, indexName) {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND INDEX_NAME = ?`,
      [tableName, indexName]
    );
    return Number(rows[0]?.count || 0) > 0;
  }

  async ensureChatServiceSchema(connection) {
    const alterStatements = [];

    if (await this.columnExists(connection, 'human_queue', 'reason') === false) {
      alterStatements.push(`ALTER TABLE human_queue ADD COLUMN reason VARCHAR(64) DEFAULT '' AFTER priority`);
    }

    if (await this.columnExists(connection, 'human_queue', 'assigned_admin_id') === false) {
      alterStatements.push(`ALTER TABLE human_queue ADD COLUMN assigned_admin_id VARCHAR(64) DEFAULT '' AFTER estimated_wait_time`);
    }

    if (await this.columnExists(connection, 'human_queue', 'assigned_admin_name') === false) {
      alterStatements.push(`ALTER TABLE human_queue ADD COLUMN assigned_admin_name VARCHAR(128) DEFAULT '' AFTER assigned_admin_id`);
    }

    if (await this.columnExists(connection, 'human_queue', 'connected_at') === false) {
      alterStatements.push(`ALTER TABLE human_queue ADD COLUMN connected_at DATETIME NULL AFTER assigned_admin_name`);
    }

    if (await this.columnExists(connection, 'human_queue', 'completed_at') === false) {
      alterStatements.push(`ALTER TABLE human_queue ADD COLUMN completed_at DATETIME NULL AFTER connected_at`);
    }

    alterStatements.push(
      `ALTER TABLE human_queue MODIFY COLUMN status ENUM('waiting','assigned','connected','completed','cancelled') DEFAULT 'waiting'`
    );

    if (await this.indexExists(connection, 'human_queue', 'uniq_conversation') === false) {
      alterStatements.push(`ALTER TABLE human_queue ADD UNIQUE INDEX uniq_conversation (conversation_id)`);
    }

    if (await this.indexExists(connection, 'human_queue', 'idx_assigned_admin_id') === false) {
      alterStatements.push(`ALTER TABLE human_queue ADD INDEX idx_assigned_admin_id (assigned_admin_id)`);
    }

    for (const sql of alterStatements) {
      try {
        await connection.query(sql);
      } catch (err) {
        console.error('客服表结构修正警告（已忽略）:', err.message);
      }
    }
  }

  /**
   * 售后/质保相关表结构（幂等）
   * - orders 增加 device_id（关联用户设备）、质保字段、是否质保单/原单关联
   * - user_devices 增加默认质保月数
   */
  async ensureAfterSalesSchema(connection) {
    const alter = [];
    if (!await this.columnExists(connection, 'orders', 'device_id')) {
      alter.push(`ALTER TABLE orders ADD COLUMN device_id INT NULL COMMENT '关联用户设备ID(user_devices.id)' AFTER user_id`);
    }
    if (!await this.columnExists(connection, 'orders', 'warranty_start_date')) {
      alter.push(`ALTER TABLE orders ADD COLUMN warranty_start_date DATE NULL COMMENT '质保起始日'`);
    }
    if (!await this.columnExists(connection, 'orders', 'warranty_end_date')) {
      alter.push(`ALTER TABLE orders ADD COLUMN warranty_end_date DATE NULL COMMENT '质保到期日'`);
    }
    if (!await this.columnExists(connection, 'orders', 'warranty_period_days')) {
      alter.push(`ALTER TABLE orders ADD COLUMN warranty_period_days INT NULL COMMENT '质保天数'`);
    }
    if (!await this.columnExists(connection, 'orders', 'warranty_type')) {
      alter.push(`ALTER TABLE orders ADD COLUMN warranty_type VARCHAR(32) NULL COMMENT '质保类型: 整备/返修'`);
    }
    if (!await this.columnExists(connection, 'orders', 'is_warranty')) {
      alter.push(`ALTER TABLE orders ADD COLUMN is_warranty TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否质保/返修单'`);
    }
    if (!await this.columnExists(connection, 'orders', 'original_order_id')) {
      alter.push(`ALTER TABLE orders ADD COLUMN original_order_id INT NULL COMMENT '原始订单ID(返修关联)'`);
    }
    if (!await this.columnExists(connection, 'user_devices', 'warranty_months')) {
      alter.push(`ALTER TABLE user_devices ADD COLUMN warranty_months INT NULL DEFAULT 3 COMMENT '默认质保月数'`);
    }
    // 设备用途标签：repair=仅用于维修，recycle=仅用于回收，both=维修/回收均可（默认）
    // 同一台设备只存一条记录，维修设备清单与回收设备清单都是它的视图，天然同步一致
    if (!await this.columnExists(connection, 'user_devices', 'device_purpose')) {
      alter.push(`ALTER TABLE user_devices ADD COLUMN device_purpose VARCHAR(16) NOT NULL DEFAULT 'both' COMMENT '设备用途: repair维修/recycle回收/both均可'`);
    }

    for (const sql of alter) {
      try {
        await connection.query(sql);
      } catch (err) {
        console.error('[DB] 售后表结构修正警告（已忽略）:', err.message);
      }
    }

    // 售后申请工单表（用户/管理员针对已完成、待评价订单的具体产品发起售后）
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS after_sales_requests (
          id INT PRIMARY KEY AUTO_INCREMENT,
          order_id INT NOT NULL COMMENT '关联订单ID',
          user_id INT NOT NULL COMMENT '发起人ID(用户或管理员)',
          product_name VARCHAR(255) NOT NULL COMMENT '具体产品名称',
          product_model VARCHAR(255) DEFAULT '' COMMENT '产品型号',
          type VARCHAR(32) NOT NULL DEFAULT 'repair' COMMENT '售后类型: repair维修/replace换货/return退货/other其他',
          description TEXT COMMENT '问题描述',
          contact_phone VARCHAR(32) DEFAULT '' COMMENT '联系电话',
          images JSON COMMENT '图片凭证',
          status ENUM('pending','processing','resolved','rejected') NOT NULL DEFAULT 'pending' COMMENT '状态',
          admin_remark TEXT COMMENT '处理说明/解决方案',
          resolved_at DATETIME NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_order_id (order_id),
          INDEX idx_status (status),
          INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[DB] after_sales_requests 表已就绪');
    } catch (err) {
      console.error('[DB] 创建 after_sales_requests 表警告（已忽略）:', err.message);
    }
  }

  // 检查连接状态
  async checkConnection() {
    if (!this.pool) {
      return { connected: false, error: '连接池未初始化' };
    }

    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      return { connected: true };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
}

module.exports = new Database();
