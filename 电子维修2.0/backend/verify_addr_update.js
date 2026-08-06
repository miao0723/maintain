// 用完整字段验证地址更新接口
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const jwt = require('jsonwebtoken');
const db = require('./database');

const BASE = 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET;

async function main() {
  // 找测试用户的最新地址
  const addr = await db.query(
    'SELECT id, user_id FROM user_addresses ORDER BY id DESC LIMIT 1'
  );
  if (!addr.length) { console.log('无地址可测'); return process.exit(0); }
  const user = await db.query('SELECT * FROM users WHERE id = ?', [addr[0].user_id]);
  const token = jwt.sign({ userId: user[0].id, openid: user[0].openid, nickname: user[0].nickname, role: user[0].role }, JWT_SECRET, { expiresIn: '1h' });

  // 完整字段更新
  const full = await fetch(BASE + `/api/addresses/${addr[0].id}`, {
    method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contact_name: '完整字段更新', contact_phone: '13900000001',
      province: '广东省', city: '深圳市', district: '南山区',
      detail_address: '完整测试地址', postal_code: '518000', tags: ['家', '公司'], is_default: true
    })
  });
  const fullData = await full.json();
  console.log(`[完整字段] http=${full.status} contact_name=${fullData.contact_name} tags=${JSON.stringify(fullData.tags)} is_default=${fullData.is_default}`);

  // 验证 DB 实际更新
  const dbRow = await db.query('SELECT * FROM user_addresses WHERE id = ?', [addr[0].id]);
  console.log(`[DB核对] contact_name=${dbRow[0].contact_name} is_default=${dbRow[0].is_default} tags=${dbRow[0].tags}`);

  process.exit(0);
}
main().catch(e => { console.error('异常:', e.message); process.exit(1); });
