const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const BASE = 'http://localhost:3001';
async function api(m, u, t, b) {
  const h = {}; if (t) h['Authorization'] = 'Bearer ' + t;
  const o = { method: m, headers: h };
  if (b instanceof FormData) o.body = b; else if (b !== undefined) { h['Content-Type'] = 'application/json'; o.body = JSON.stringify(b); }
  const r = await fetch(BASE + u, o); let d = {}; try { d = await r.json(); } catch (e) {}
  return { status: r.status, data: d };
}
const pool = mysql.createPool({ host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT)||3306, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, connectionLimit: 3, charset: 'utf8mb4' });
(async () => {
  const openid = 'photo_verify_' + Date.now();
  const c = await pool.getConnection();
  const r = await c.query("INSERT INTO users (openid,nickname,role,status,created_at) VALUES (?,?,?,1,NOW())", [openid,'照片验证','admin']);
  const uid = r[0].insertId; c.release();
  const token = jwt.sign({ userId: uid, openid, nickname: '照片验证', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const o = await api('POST', '/api/orders/create', token, { orderType:'repair', deviceType:1, deviceId:1, problem:'测试照片', description:'照片上传验证', serviceType:'shop', brand:'苹果', model:'iPhone' });
  const oid = o.data?.data?.order_id_numeric;
  console.log('创建订单:', oid);
  const img = 'D:/maintain/电子维修2.0/uploads/progress/25/1779522114199-38925454.jpg';
  const fd = new FormData();
  fd.append('orderId', String(oid));
  fd.append('description', '复跑验证');
  fd.append('images', new Blob([fs.readFileSync(img)], { type: 'image/jpeg' }), 'verify2.jpg');
  const up = await api('POST', '/api/progress/photos/upload', token, fd);
  const photos = up.data?.data?.photos || [];
  console.log('[上传返回] http=', up.status, 'success=', up.data?.success, 'photos=', JSON.stringify(photos));
  let onDisk = false, localFile = '';
  if (photos[0]) {
    localFile = path.join(__dirname, '..', photos[0].replace(/^\/+/, ''));
    onDisk = fs.existsSync(localFile);
    console.log('[落盘校验]', onDisk, '->', localFile, fs.existsSync(localFile) ? fs.statSync(localFile).size + ' bytes' : '');
  }
  const fb = await api('GET', `/api/progress/feedbacks/${oid}`, token);
  console.log('[反馈列表] http=', fb.status, '条数=', Array.isArray(fb.data?.data) ? fb.data.data.length : 'N/A');
  console.log(up.status===200 && photos.length>0 && onDisk ? '\n结果: 进度照片上传功能 PASS ✅' : '\n结果: 进度照片上传功能 FAIL ❌');
  await pool.query('DELETE FROM order_progress_photos WHERE order_id=?',[oid]).catch(()=>{});
  await pool.query('DELETE FROM orders WHERE id=?',[oid]).catch(()=>{});
  await pool.query('DELETE FROM users WHERE openid=?',[openid]).catch(()=>{});
  await pool.end();
  process.exit(up.status===200 && photos.length>0 && onDisk ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
