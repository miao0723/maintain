/**
 * 辅助模块冒烟测试：维修记录 / 售后申请 / 配送 / 回收估价 / 管理员维修报告
 * 运行: node verify_aux.js
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const BASE = 'http://localhost:3001';
const results = [];
function log(step, ok, info = '') { results.push({ step, ok, info }); console.log(`${ok ? '[PASS]' : '[FAIL]'} ${step}${info ? ' | ' + info : ''}`); }
async function api(m, u, t, b) {
  const h = {}; if (t) h['Authorization'] = 'Bearer ' + t;
  const o = { method: m, headers: h };
  if (b instanceof FormData) o.body = b; else if (b !== undefined) { h['Content-Type'] = 'application/json'; o.body = JSON.stringify(b); }
  const r = await fetch(BASE + u, o); let d = {}; try { d = await r.json(); } catch (e) {}
  return { status: r.status, data: d };
}
const pool = mysql.createPool({ host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT) || 3306, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, connectionLimit: 5, charset: 'utf8mb4' });
async function ensureUser(openid, nickname, role) {
  const c = await pool.getConnection();
  const [rows] = await c.query('SELECT id FROM users WHERE openid = ?', [openid]);
  let id;
  if (rows.length) { id = rows[0].id; await c.query('UPDATE users SET role=?, status=1 WHERE id=?', [role, id]); }
  else { const r = await c.query('INSERT INTO users (openid,nickname,role,status,created_at) VALUES (?,?,?,1,NOW())', [openid, nickname, role]); id = r[0].insertId; }
  c.release();
  return { id, token: jwt.sign({ userId: id, openid, nickname, role }, process.env.JWT_SECRET, { expiresIn: '2h' }) };
}
async function getOrder(id) { const [r] = await pool.query('SELECT status, assigned_to, delivery_status FROM orders WHERE id=?', [id]); return r[0]; }

(async () => {
  console.log('========== 辅助模块冒烟测试开始 ==========\n');
  const U = 'aux_user_' + Date.now(), A = 'aux_admin_' + Date.now();
  const user = await ensureUser(U, '辅助验证用户', 'user');
  const admin = await ensureUser(A, '辅助验证管理员', 'admin');

  // 造一个已完成订单
  const o = await api('POST', '/api/orders/create', user.token, { orderType: 'repair', deviceType: 1, deviceId: 1, problem: '屏幕碎裂', description: '辅助测试', serviceType: 'shop', brand: '苹果', model: 'iPhone 15' });
  const oId = o.data?.data?.order_id_numeric;
  await api('PUT', `/api/admin/orders/${oId}/quote`, admin.token, { quote_price: 100, quote_description: '换屏' });
  await api('PUT', `/api/orders/${oId}/accept-quote`, user.token);
  await pool.query("UPDATE orders SET payment_status='paid', paid_at=NOW(), updated_at=NOW() WHERE id=?", [oId]);
  await api('PUT', `/api/admin/orders/${oId}/process`, admin.token);
  await api('PUT', `/api/admin/orders/${oId}/complete`, admin.token);
  let od = await getOrder(oId);
  log('前置-完成订单', od.status === 'completed', `status=${od.status}`);

  // 管理员把订单分配给自己（维修记录需要 assigned_to=自己）
  const assign = await api('PUT', `/api/admin/orders/${oId}/assign`, admin.token, { adminId: admin.id });
  log('管理员分配订单 assign', assign.status === 200, `http=${assign.status}, ${JSON.stringify(assign.data).slice(0,60)}`);

  // 1. 维修记录
  const rr = await api('POST', '/api/repair-records', admin.token, { order_id: oId, stage: '拆机检测', title: '检测主板故障', description: '发现进水腐蚀' });
  const rrId = rr.data?.data?.id;
  log('维修记录-新增 /repair-records', rr.status === 200 && rr.data?.success && !!rrId, `http=${rr.status}, id=${rrId}`);
  const rrList = await api('GET', `/api/repair-records/order/${oId}`, user.token);
  log('维修记录-按订单查询', rrList.status === 200 && Array.isArray(rrList.data?.data) && rrList.data.data.length > 0, `http=${rrList.status}, 条数=${rrList.data?.data?.length}`);

  // 2. 售后申请
  const as = await api('POST', '/api/after-sales/request', user.token, { order_id: oId, product_name: 'iPhone 15', product_model: 'iPhone 15', type: 'repair', description: '换屏后触控失灵', contact_phone: '13800138000' });
  const asId = as.data?.data?.id;
  log('售后-申请 /after-sales/request', as.status === 200 && as.data?.success && !!asId, `http=${as.status}, id=${asId}`);
  const asMy = await api('GET', '/api/after-sales/my', user.token);
  log('售后-我的申请列表', asMy.status === 200, `http=${asMy.status}, ${Array.isArray(asMy.data?.data) ? '条数='+asMy.data.data.length : JSON.stringify(asMy.data).slice(0,40)}`);

  // 3. 配送
  const dp = await api('POST', '/api/delivery/persons', admin.token, { user_id: admin.id, name: '配送员甲', phone: '13700137000' });
  const dpId = dp.data?.data?.id;
  log('配送-新增配送员 /delivery/persons', dp.status === 200 && dp.data?.success && !!dpId, `http=${dp.status}, id=${dpId}`);
  const dpList = await api('GET', '/api/delivery/persons', admin.token);
  log('配送-配送员列表', dpList.status === 200 && dpList.data?.success, `http=${dpList.status}`);
  const dAssign = await api('PUT', `/api/delivery/orders/${oId}/assign`, admin.token, { delivery_person_id: dpId, delivery_fee: 10 });
  log('配送-分配订单', dAssign.status === 200 && dAssign.data?.success, `http=${dAssign.status}, ${JSON.stringify(dAssign.data).slice(0,60)}`);
  const dStatus = await api('PUT', `/api/delivery/orders/${oId}/status`, admin.token, { status: 'assigned', tracking_number: 'SF123', delivery_notes: '已取件' });
  log('配送-更新状态 assigned', dStatus.status === 200 && dStatus.data?.success, `http=${dStatus.status}, ${JSON.stringify(dStatus.data).slice(0,60)}`);

  // 4. 管理员维修报告
  const rep = await api('PUT', `/api/admin/orders/${oId}/repair-report`, admin.token, { report: '已更换屏幕总成，功能正常', files: [] });
  log('管理员-维修报告 repair-report', rep.status === 200 && rep.data?.success, `http=${rep.status}`);

  // 5. 回收估价（开放接口，依赖Deepseek，尽力而为）
  const rec = await api('POST', '/api/recycle/evaluate', null, { product: { category: '手机', brand: '苹果', model: 'iPhone 13', basePrice: 3000, specs: '256G' }, answers: { screen: { label: '完好' }, body: { label: '轻微划痕' } } });
  log('回收估价 /recycle/evaluate', rec.status === 200, `http=${rec.status}, success=${rec.data?.success}, price=${rec.data?.data?.price || rec.data?.message || ''}`);

  // 汇总
  console.log('\n========== 辅助模块汇总 ==========');
  const pass = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok);
  console.log(`通过: ${pass}/${results.length}`);
  if (fail.length) { console.log('失败项:'); fail.forEach(f => console.log(`  - ${f.step} | ${f.info}`)); }

  // 清理
  console.log('\n---------- 清理 ----------');
  await pool.query('DELETE FROM repair_records WHERE order_id=?', [oId]).catch(()=>{});
  await pool.query('DELETE FROM after_sales_requests WHERE order_id=?', [oId]).catch(()=>{});
  await pool.query('DELETE FROM delivery_persons WHERE user_id=?', [admin.id]).catch(()=>{});
  await pool.query('DELETE FROM orders WHERE id=?', [oId]).catch(()=>{});
  await pool.query('DELETE FROM users WHERE openid IN (?,?)', [U, A]).catch(()=>{});
  await pool.end();
  process.exit(fail.length ? 1 : 0);
})().catch(e => { console.error('异常:', e); process.exit(1); });
