/**
 * E2E 全流程测试：三入口下单 -> 报价/确认 -> 支付(模拟) -> 进度反馈 -> 完成订单
 * 运行: node test_e2e_flow.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const fs = require('fs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const BASE = 'http://localhost:3001';
const results = [];
function log(step, ok, info = '') {
  results.push({ step, ok, info });
  console.log(`${ok ? '[PASS]' : '[FAIL]'} ${step}${info ? ' | ' + info : ''}`);
}

async function api(method, url, token, body) {
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const opts = { method, headers };
  if (body instanceof FormData) {
    opts.body = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + url, opts);
  let data = {};
  try { data = await res.json(); } catch (e) {}
  return { status: res.status, data };
}

async function ensureUser(openid, nickname, role) {
  const rows = await db.query('SELECT id FROM users WHERE openid = ?', [openid]);
  let id;
  if (rows.length) {
    id = rows[0].id;
    await db.query('UPDATE users SET role = ?, status = 1 WHERE id = ?', [role, id]);
  } else {
    const r = await db.query(
      `INSERT INTO users (openid, nickname, role, status) VALUES (?, ?, ?, 1)`,
      [openid, nickname, role]
    );
    id = r.insertId;
  }
  const token = jwt.sign({ userId: id, openid, nickname, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { id, token };
}

async function getOrder(id) {
  const rows = await db.query(
    'SELECT id, status, quote_status, quote_price, payment_status, pay_amount, progress, assigned_to, progress_unread, quote_unread FROM orders WHERE id = ?',
    [id]
  );
  return rows[0];
}

// 完整生命周期：报价 -> 确认 -> 支付 -> 处理 -> 进度 -> 完成
async function runLifecycle(orderId, user, admin, label, opts = {}) {
  const L = (s) => `[${label}] ${s}`;

  if (opts.acceptFirst) {
    // 管理员先接单（pending -> processing）
    const acc = await api('PUT', `/api/admin/orders/${orderId}/accept`, admin.token);
    log(L('管理员接单 accept'), acc.status === 200 && acc.data.success, JSON.stringify(acc.data));
  }

  // 管理员报价
  const q = await api('PUT', `/api/admin/orders/${orderId}/quote`, admin.token, {
    quote_price: 199.5,
    quote_description: `${label} 测试报价：更换故障部件`
  });
  let o = await getOrder(orderId);
  log(L('管理员报价 quote'), q.status === 200 && o.status === 'quoted' && o.quote_status === 'pending',
    `http=${q.status}, status=${o.status}, quote_status=${o.quote_status}, quote_price=${o.quote_price}`);

  if (opts.testReject) {
    // 用户拒绝报价 -> 回到 pending，管理员重新报价
    const rej = await api('PUT', `/api/orders/${orderId}/reject-quote`, user.token, { reason: '价格太贵' });
    o = await getOrder(orderId);
    log(L('用户拒绝报价 reject-quote'), rej.status === 200 && o.status === 'pending' && o.quote_status === 'rejected',
      `http=${rej.status}, status=${o.status}, quote_status=${o.quote_status}`);
    const q2 = await api('PUT', `/api/admin/orders/${orderId}/quote`, admin.token, {
      quote_price: 149.5,
      quote_description: `${label} 二次报价：优惠价`
    });
    o = await getOrder(orderId);
    log(L('管理员二次报价'), q2.status === 200 && o.status === 'quoted',
      `http=${q2.status}, status=${o.status}, quote_price=${o.quote_price}`);
  }

  // 用户查看订单详情（含报价）
  const det = await api('GET', `/api/orders/${orderId}/detail`, user.token);
  log(L('用户查看订单详情(报价)'), det.status === 200 && det.data.success,
    `http=${det.status}, status=${det.data?.data?.status}, quote_price=${det.data?.data?.quote_price}`);

  // 用户标记报价已读
  const qr = await api('PUT', `/api/orders/${orderId}/quote-read`, user.token);
  log(L('用户标记报价已读'), qr.status === 200, `http=${qr.status}`);

  // 用户接受报价 -> confirmed
  const acc = await api('PUT', `/api/orders/${orderId}/accept-quote`, user.token);
  o = await getOrder(orderId);
  log(L('用户确认报价 accept-quote'), acc.status === 200 && o.status === 'confirmed' && o.quote_status === 'accepted' && o.payment_status === 'unpaid',
    `http=${acc.status}, status=${o.status}, quote_status=${o.quote_status}, payment=${o.payment_status}, pay_amount=${o.pay_amount}`);

  // 未支付时管理员不能开始处理（校验守卫）
  const p0 = await api('PUT', `/api/admin/orders/${orderId}/process`, admin.token);
  log(L('未支付时禁止开始处理(守卫)'), p0.status === 400, `http=${p0.status}, msg=${p0.data?.error}`);

  // 模拟微信支付成功（测试环境无法真实支付）
  await db.query(`UPDATE orders SET payment_status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = ?`, [orderId]);
  log(L('模拟支付成功(SQL置paid)'), true);

  // 管理员开始处理 -> processing
  const p1 = await api('PUT', `/api/admin/orders/${orderId}/process`, admin.token);
  o = await getOrder(orderId);
  log(L('管理员开始处理 process'), p1.status === 200 && o.status === 'processing',
    `http=${p1.status}, status=${o.status}`);

  // 维修工上报进度 30% -> 70%
  const pr1 = await api('PUT', `/api/orders/${orderId}/progress`, admin.token, { progress: 30 });
  const pr2 = await api('PUT', `/api/orders/${orderId}/progress`, admin.token, { progress: 70 });
  o = await getOrder(orderId);
  log(L('上报进度 30%->70%'), pr1.status === 200 && pr2.status === 200 && Number(o.progress) === 70,
    `http=${pr1.status}/${pr2.status}, progress=${o.progress}`);

  // 上传进度照片（实时反馈）
  const imgPath = opts.imagePath;
  if (imgPath && fs.existsSync(imgPath)) {
    const fd = new FormData();
    fd.append('orderId', String(orderId));
    fd.append('description', `${label} 维修进度反馈：部件已更换，正在测试`);
    fd.append('images', new Blob([fs.readFileSync(imgPath)], { type: 'image/jpeg' }), 'e2e_progress.jpg');
    const up = await api('POST', '/api/progress/photos/upload', admin.token, fd);
    log(L('上传进度照片'), up.status === 200 && up.data.success, `http=${up.status}, ${JSON.stringify(up.data?.data?.images || up.data?.error || '')}`);
  } else {
    log(L('上传进度照片'), false, '未找到测试图片');
  }

  // 用户查看进度反馈
  const fb = await api('GET', `/api/progress/feedbacks/${orderId}`, user.token);
  const fbCount = Array.isArray(fb.data?.data) ? fb.data.data.length : (fb.data?.data?.feedbacks?.length ?? 'N/A');
  log(L('用户查看进度反馈列表'), fb.status === 200 && fb.data.success, `http=${fb.status}, 条数=${fbCount}`);

  // 用户未读进度提醒
  const unread = await api('GET', '/api/orders/progress-unread-count', user.token);
  log(L('用户未读进度提醒计数'), unread.status === 200 && unread.data.success, `count=${JSON.stringify(unread.data?.data)}`);

  // 用户标记进度已读
  const pread = await api('PUT', `/api/orders/${orderId}/progress-read`, user.token);
  log(L('用户标记进度已读'), pread.status === 200, `http=${pread.status}`);

  // 管理员完成订单
  const comp = await api('PUT', `/api/admin/orders/${orderId}/complete`, admin.token);
  o = await getOrder(orderId);
  log(L('管理员完成订单 complete'), comp.status === 200 && o.status === 'completed' && Number(o.progress) === 100,
    `http=${comp.status}, status=${o.status}, progress=${o.progress}`);

  // 用户查看已完成订单
  const det2 = await api('GET', `/api/orders/${orderId}/detail`, user.token);
  log(L('用户查看完成后详情'), det2.status === 200 && det2.data?.data?.status === 'completed',
    `status=${det2.data?.data?.status}`);
}

async function main() {
  console.log('========== E2E 全流程测试开始 ==========\n');

  // 0. 健康检查
  const health = await api('GET', '/health');
  log('后端健康检查 /health', health.status === 200, JSON.stringify(health.data));
  const dbh = await api('GET', '/db-health');
  log('数据库健康检查 /db-health', dbh.status === 200, JSON.stringify(dbh.data));

  // 1. 准备测试账号
  const user = await ensureUser('e2e_test_user_openid', 'E2E测试用户', 'user');
  const admin = await ensureUser('e2e_test_admin_openid', 'E2E测试维修工', 'admin');
  log('准备测试账号', true, `user_id=${user.id}, admin_id=${admin.id}`);

  // 找一张测试图片
  const progressDir = path.join(__dirname, '../uploads/progress');
  let imagePath = null;
  try {
    const dirs = fs.readdirSync(progressDir);
    outer: for (const d of dirs) {
      const sub = path.join(progressDir, d);
      if (fs.statSync(sub).isDirectory()) {
        for (const f of fs.readdirSync(sub)) {
          if (/\.(jpg|jpeg|png)$/i.test(f)) { imagePath = path.join(sub, f); break outer; }
        }
      }
    }
  } catch (e) {}

  console.log('\n---------- 入口A：AI故障自检(diagnose) -> 下单 ----------');
  const diag = await api('POST', '/api/diagnose/analyze', user.token, {
    deviceType: '手机', brand: '苹果', symptom: '无法开机', details: '进水后无法开机'
  });
  log('[A] AI故障自检 /diagnose/analyze', diag.status === 200 && diag.data.success,
    `http=${diag.status}, summary=${(diag.data?.data?.summary || '').slice(0, 40)}...`);

  const orderA = await api('POST', '/api/orders/create', user.token, {
    orderType: 'repair', deviceType: '手机', deviceId: 1,
    problem: '无法开机', description: `AI自检结论：${diag.data?.data?.summary || '疑似主板故障'}`,
    serviceType: 'shop', brand: '苹果', model: 'iPhone 15', estimatedPrice: 300, deviceCondition: '九成新'
  });
  const orderAId = orderA.data?.data?.order_id_numeric;
  log('[A] 自检结论预填下单 /orders/create', orderA.status === 200 && orderA.data.success && !!orderAId,
    `http=${orderA.status}, orderId=${orderAId}, status=${orderA.data?.data?.order?.status}`);

  console.log('\n---------- 入口B：扫码识别(scan) -> 下单 ----------');
  let scanOK = false, scanInfo = '';
  if (imagePath) {
    const fd = new FormData();
    fd.append('image', new Blob([fs.readFileSync(imagePath)], { type: 'image/jpeg' }), 'e2e_scan.jpg');
    const scan = await api('POST', '/api/scan/identify', user.token, fd);
    scanOK = scan.status === 200 && scan.data.success;
    scanInfo = `http=${scan.status}, ${JSON.stringify(scan.data?.data?.device_type_name || scan.data?.error || scan.data?.message || '').slice(0, 80)}`;
  } else {
    scanInfo = '无测试图片';
  }
  log('[B] 扫码识别 /scan/identify', scanOK, scanInfo);

  const orderB = await api('POST', '/api/orders/create', user.token, {
    orderType: 'repair', deviceType: '笔记本电脑', deviceId: 2,
    problem: '键盘失灵', description: '扫码识别设备后发起维修（source: scan）',
    serviceType: 'home', brand: '联想', model: 'ThinkPad X1', estimatedPrice: 200, deviceCondition: '八成新',
    address: { contactName: 'E2E测试', contactPhone: '13800138000', province: '广东省', city: '深圳市', district: '南山区', detail: '科技园1号楼' }
  });
  const orderBId = orderB.data?.data?.order_id_numeric;
  log('[B] 扫码预填下单 /orders/create', orderB.status === 200 && orderB.data.success && !!orderBId,
    `http=${orderB.status}, orderId=${orderBId}`);

  console.log('\n---------- 入口C：维修表单直接下单 ----------');
  const orderC = await api('POST', '/api/orders/create', user.token, {
    orderType: 'repair', deviceType: '手机', deviceId: 0, deviceTypeName: '游戏掌机',
    problem: '屏幕碎裂', description: '摔落导致屏幕碎裂，触摸失灵',
    serviceType: 'shop', brand: '', model: 'Steam Deck', estimatedPrice: 0, deviceCondition: '七成新',
    isWaitingPrice: true
  });
  const orderCId = orderC.data?.data?.order_id_numeric;
  log('[C] 维修表单下单 /orders/create', orderC.status === 200 && orderC.data.success && !!orderCId,
    `http=${orderC.status}, orderId=${orderCId}, status=${orderC.data?.data?.order?.status}`);

  // 用户订单列表可见
  const list = await api('GET', '/api/orders/my?page=1&pageSize=20', user.token);
  const listArr = list.data?.data?.orders || list.data?.data?.list || list.data?.data || [];
  log('用户订单列表 /orders/my', list.status === 200 && list.data.success,
    `http=${list.status}, 数量=${Array.isArray(listArr) ? listArr.length : 'N/A'}`);

  // 2. 完整生命周期
  if (orderCId) {
    console.log('\n---------- 订单C 完整流程（含拒绝报价分支 + 未支付守卫） ----------');
    await runLifecycle(orderCId, user, admin, '订单C', { testReject: true, imagePath });
  }
  if (orderAId) {
    console.log('\n---------- 订单A 完整流程（直接报价路径） ----------');
    await runLifecycle(orderAId, user, admin, '订单A', { imagePath });
  }
  if (orderBId) {
    console.log('\n---------- 订单B 完整流程（先接单再报价路径） ----------');
    await runLifecycle(orderBId, user, admin, '订单B', { acceptFirst: true, imagePath });
  }

  // 3. 汇总
  console.log('\n========== 测试汇总 ==========');
  const pass = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok);
  console.log(`通过: ${pass}/${results.length}`);
  if (fail.length) {
    console.log('失败项:');
    fail.forEach(f => console.log(`  - ${f.step} | ${f.info}`));
  }

  // 4. 清理测试数据
  console.log('\n---------- 清理测试数据 ----------');
  const ids = [orderAId, orderBId, orderCId].filter(Boolean);
  if (ids.length) {
    const ph = ids.map(() => '?').join(',');
    await db.query(`DELETE FROM order_progress_photos WHERE order_id IN (${ph})`, ids).catch(() => {});
    await db.query(`DELETE FROM transaction_income WHERE order_id IN (${ph})`, ids).catch(() => {});
    await db.query(`DELETE FROM orders WHERE id IN (${ph})`, ids).catch(() => {});
    for (const id of ids) {
      const dir = path.join(progressDir, String(id));
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  await db.query(`DELETE FROM user_addresses WHERE user_id = ?`, [user.id]).catch(() => {});
  await db.query(`DELETE FROM users WHERE openid IN ('e2e_test_user_openid', 'e2e_test_admin_openid')`).catch(() => {});
  console.log('测试订单/账号/照片已清理');

  process.exit(fail.length ? 1 : 0);
}

main().catch(e => { console.error('测试脚本异常:', e); process.exit(1); });
