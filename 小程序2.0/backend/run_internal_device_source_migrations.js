/**
 * 执行内部人员免付款 + 设备来源相关迁移（007 / 008）
 *
 * 幂等：列、枚举值、表已存在时跳过，可重复运行。
 *
 * 用法（在 backend 目录）：
 *   node run_internal_device_source_migrations.js
 *
 * 连接优先级：
 *   1) 命令行 --host / --port / --user / --password / --database
 *   2) 环境变量 DB_*
 *   3) sqfe2-mysql-1 解析失败时自动回退 127.0.0.1
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  fs.readFileSync(filePath, 'utf8').split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx < 0) return;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  });
  return out;
}

const backendEnv = loadEnvFile(path.join(__dirname, '.env'));
const projectEnv = loadEnvFile(path.join(__dirname, '..', '.env'));
Object.assign(process.env, projectEnv, backendEnv, process.env);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0].cnt) > 0;
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [table]
  );
  return Number(rows[0].cnt) > 0;
}

async function enumHasValue(conn, table, column, value) {
  const [rows] = await conn.query(
    `SELECT COLUMN_TYPE AS columnType
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (!rows.length) return false;
  return String(rows[0].columnType || '').includes(`'${value}'`);
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const configuredHost = args.host || process.env.DB_HOST || '127.0.0.1';
  const config = {
    host: configuredHost,
    port: parseInt(args.port || process.env.DB_PORT || '3306', 10),
    user: args.user || process.env.DB_USER || 'root',
    password: args.password != null ? args.password : (process.env.DB_PASSWORD || ''),
    database: args.database || process.env.DB_NAME || 'repair',
    multipleStatements: true,
    charset: 'utf8mb4',
    connectTimeout: 8000
  };

  console.log('========================================');
  console.log('内部人员 / 设备来源迁移');
  console.log(`目标库: ${config.user}@${config.host}:${config.port}/${config.database}`);
  console.log('========================================');

  const candidates = [config];
  if (config.host !== '127.0.0.1' && config.host !== 'localhost') {
    candidates.push({ ...config, host: '127.0.0.1' });
  }
  // 服务器账号连不上本机时，回退项目根 .env 的本地账号
  if (projectEnv.DB_USER && (projectEnv.DB_USER !== config.user || projectEnv.DB_HOST !== config.host)) {
    candidates.push({
      ...config,
      host: projectEnv.DB_HOST === 'localhost' ? '127.0.0.1' : (projectEnv.DB_HOST || '127.0.0.1'),
      port: parseInt(projectEnv.DB_PORT || String(config.port), 10),
      user: projectEnv.DB_USER,
      password: projectEnv.DB_PASSWORD || '',
      database: projectEnv.DB_NAME || config.database
    });
  }

  let conn;
  let lastErr;
  for (const candidate of candidates) {
    try {
      console.log(`尝试连接 ${candidate.user}@${candidate.host}:${candidate.port}/${candidate.database} ...`);
      conn = await mysql.createConnection(candidate);
      Object.assign(config, candidate);
      break;
    } catch (err) {
      lastErr = err;
      console.warn(`连接失败: ${err.code || err.message}`);
    }
  }
  if (!conn) throw lastErr;

  try {
    const [dbRow] = await conn.query('SELECT DATABASE() AS db');
    console.log(`已连接数据库: ${dbRow[0].db}`);

    // ---------- 007 users.role ----------
    if (await enumHasValue(conn, 'users', 'role', 'internal')) {
      console.log('[007] users.role 已包含 internal，跳过');
    } else {
      await conn.query(`
        ALTER TABLE users
          MODIFY COLUMN \`role\` enum('user','admin','super_admin','internal')
          CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'user'
          COMMENT '用户角色: user-普通用户, admin-管理员, super_admin-超级管理员, internal-公司内部人员'
      `);
      console.log('[007] 已扩展 users.role += internal');
    }

    // ---------- 007 orders.status ----------
    if (await enumHasValue(conn, 'orders', 'status', 'internal_pending')) {
      console.log('[007] orders.status 已包含 internal_pending，跳过');
    } else {
      await conn.query(`
        ALTER TABLE orders
          MODIFY COLUMN \`status\` enum('pending','quoted','confirmed','processing','completed','review','cancelled','internal_pending')
          CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending'
          COMMENT '订单状态: pending-待处理, quoted-待确认报价, confirmed-已确认报价, processing-维修/处理中, completed-已完成, review-待评价, cancelled-已取消, internal_pending-内部免付款申请待确认'
      `);
      console.log('[007] 已扩展 orders.status += internal_pending');
    }

    // ---------- 007 orders.is_internal ----------
    if (await columnExists(conn, 'orders', 'is_internal')) {
      console.log('[007] orders.is_internal 已存在，跳过');
    } else {
      const afterCol = (await columnExists(conn, 'orders', 'payment_status')) ? 'payment_status' : null;
      const afterSql = afterCol ? ` AFTER \`${afterCol}\`` : '';
      await conn.query(`
        ALTER TABLE orders
          ADD COLUMN \`is_internal\` TINYINT(1) NULL DEFAULT 0 COMMENT '是否内部人员免付款订单: 0-否, 1-是'${afterSql}
      `);
      console.log('[007] 已新增 orders.is_internal');
    }

    // ---------- 007 orders.confirmed_by / confirmed_at ----------
    if (await columnExists(conn, 'orders', 'confirmed_by')) {
      console.log('[007] orders.confirmed_by 已存在，跳过');
    } else {
      await conn.query(`
        ALTER TABLE orders
          ADD COLUMN \`confirmed_by\` INT NULL COMMENT '内部订单确认管理员ID' AFTER \`is_internal\`
      `);
      console.log('[007] 已新增 orders.confirmed_by');
    }

    if (await columnExists(conn, 'orders', 'confirmed_at')) {
      console.log('[007] orders.confirmed_at 已存在，跳过');
    } else {
      await conn.query(`
        ALTER TABLE orders
          ADD COLUMN \`confirmed_at\` TIMESTAMP NULL COMMENT '内部订单确认时间' AFTER \`confirmed_by\`
      `);
      console.log('[007] 已新增 orders.confirmed_at');
    }

    // ---------- 007 internal_orders_log ----------
    if (await tableExists(conn, 'internal_orders_log')) {
      console.log('[007] internal_orders_log 已存在，跳过');
    } else {
      await conn.query(`
        CREATE TABLE \`internal_orders_log\` (
          \`id\` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
          \`order_id\` int NOT NULL COMMENT '关联订单ID',
          \`confirmed_by\` int NULL DEFAULT NULL COMMENT '确认管理员ID',
          \`confirmed_at\` datetime NULL DEFAULT NULL COMMENT '确认时间',
          \`remark\` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '确认备注',
          \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          PRIMARY KEY (\`id\`) USING BTREE,
          INDEX \`idx_internal_log_order_id\`(\`order_id\` ASC) USING BTREE,
          INDEX \`idx_internal_log_confirmed_by\`(\`confirmed_by\` ASC) USING BTREE,
          CONSTRAINT \`fk_internal_log_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
        ) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '内部免付款订单确认记录表' ROW_FORMAT = DYNAMIC
      `);
      console.log('[007] 已创建 internal_orders_log');
    }

    // ---------- 008 device_source ----------
    if (await columnExists(conn, 'orders', 'device_source')) {
      console.log('[008] orders.device_source 已存在，跳过');
    } else {
      const afterSql = (await columnExists(conn, 'orders', 'is_internal'))
        ? ' AFTER `is_internal`'
        : '';
      await conn.query(`
        ALTER TABLE orders
          ADD COLUMN \`device_source\` varchar(30) NULL
          COMMENT '内部人员设备来源: project_return-项目返修, warehouse-仓库, fixed_asset-固定资产'${afterSql}
      `);
      console.log('[008] 已新增 orders.device_source');
    }

    const [verify] = await conn.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND (
          (TABLE_NAME = 'users' AND COLUMN_NAME = 'role')
          OR (TABLE_NAME = 'orders' AND COLUMN_NAME IN ('status','is_internal','device_source','confirmed_by','confirmed_at'))
        )
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `);
    console.log('----------------------------------------');
    console.log('校验结果:');
    verify.forEach((row) => {
      console.log(`  ${row.COLUMN_NAME}: ${row.COLUMN_TYPE} | ${row.COLUMN_COMMENT}`);
    });
    console.log('========================================');
    console.log('迁移完成');
  } finally {
    if (conn) await conn.end();
  }
}

run().catch((err) => {
  console.error('迁移失败:', err.message);
  if (err.code) console.error('错误码:', err.code);
  process.exit(1);
});
