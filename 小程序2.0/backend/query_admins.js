// 查询数据库中的管理员账号（仅用于验证）
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const db = require('./database');

setTimeout(async () => {
  try {
    const rows = await db.query(
      "SELECT id, nickname, phone, role, status FROM users WHERE role IN ('admin','super_admin') LIMIT 20"
    );
    console.log('ADMINS=' + JSON.stringify(rows));
    const cnt = await db.query('SELECT COUNT(*) c FROM users');
    console.log('TOTAL_USERS=' + cnt[0].c);
    // 列出所有表
    const tables = await db.query("SHOW TABLES");
    console.log('TABLES=' + JSON.stringify(tables.map(t => Object.values(t)[0])));
  } catch (e) {
    console.error('ERR=' + e.message);
  }
  process.exit(0);
}, 1500);
