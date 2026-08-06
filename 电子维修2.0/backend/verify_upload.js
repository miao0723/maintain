// 验证图片上传功能 + 共享 uploads 目录
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const jwt = require('jsonwebtoken');
const db = require('./database');

const BASE = 'http://localhost:3001';

async function main() {
  // 取测试用户
  const users = await db.query("SELECT * FROM users WHERE openid='verify_test_user'");
  const user = users[0];
  if (!user) { console.log('测试用户不存在'); return; }
  const token = jwt.sign({ userId: user.id, openid: user.openid, nickname: user.nickname, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // 生成一张最小 PNG
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const tmp = path.join(__dirname, '_test_upload.png');
  fs.writeFileSync(tmp, png);

  // 上传单图
  const fd = new FormData();
  fd.append('file', new Blob([png], { type: 'image/png' }), 'test_upload.png');
  const res = await fetch(BASE + '/api/upload/image', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: fd
  });
  const data = await res.json();
  console.log(`[上传单图] http=${res.status} url=${JSON.stringify(data.data || data.url || data.path)}`);

  // 上传多图
  const fd2 = new FormData();
  fd2.append('files', new Blob([png], { type: 'image/png' }), 'a.png');
  fd2.append('files', new Blob([png], { type: 'image/png' }), 'b.png');
  const res2 = await fetch(BASE + '/api/upload/images', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: fd2
  });
  const data2 = await res2.json();
  console.log(`[上传多图] http=${res2.status} urls=${JSON.stringify(data2.data || data2.urls)}`);

  // 验证上传目录（容器内 /uploads 与 php、nginx 共享）
  const dir = '/uploads';
  const exists = fs.existsSync(dir);
  const files = exists ? fs.readdirSync(dir).filter(f => f.includes('test_upload') || f.endsWith('.png')) : [];
  console.log(`[共享目录核对] /uploads 存在=${exists}, 上传后文件数=${fs.readdirSync(dir).length}`);
  fs.unlinkSync(tmp);

  process.exit(0);
}
main().catch(e => { console.error('异常:', e.message); process.exit(1); });
