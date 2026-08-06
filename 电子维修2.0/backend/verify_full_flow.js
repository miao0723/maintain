/**
 * 全功能流程验证（修正版）：覆盖 地址/单位/下单(到店+上门)/真实订单列表/
 * 报价-拒绝-重报-接受/支付守卫/开始处理/进度上报/进度照片落盘/完成/评价/取消/未读计数
 * 运行: node verify_full_flow.js   (默认打向 http://localhost:3001)
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });

const BASE = process.env.TEST_BASE || 'http://localhost:3001';
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
  const c = await pool.getConnection();
  const [rows] = await c.query('SELECT id FROM users WHERE openid = ?', [openid]);
  let id;
  if (rows.length) {
    id = rows[0].id;
    await c.query('UPDATE users SET role = ?, status = 1 WHERE id = ?', [role, id]);
  } else {
    const r = await c.query(
      'INSERT INTO users (openid, nickname, role, status, created_at) VALUES (?, ?, ?, 1, NOW())',
      [openid, nickname, role]
    );
    id = r[0].insertId;
  }
  c.release();
  const token = jwt.sign({ userId: id, openid, nickname, role }, process.env.JWT_SECRET, { expiresIn: '2h' });
  return { id, token };
}

async function getOrder(id) {
  const [rows] = await pool.query(
    'SELECT id, status, quote_status, quote_price, payment_status, pay_amount, progress, assigned_to FROM orders WHERE id = ?',
    [id]
  );
  return rows[0];
}

const pool = mysql.createPool({
  host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  connectionLimit: 5, charset: 'utf8mb4'
});

async function main() {
  console.log('========== 全功能流程验证开始 (BASE=' + BASE + ') ==========\n');
  const U = 'verify_user_' + Date.now();
  const A = 'verify_admin_' + Date.now();

  // 0. 健康
  const h = await api('GET', '/health');
  log('健康检查 /health', h.status === 200, JSON.stringify(h.data));
  const dh = await api('GET', '/db-health');
  log('数据库健康 /db-health', dh.status === 200, JSON.stringify(dh.data));

  const user = await ensureUser(U, '验证用户', 'user');
  const admin = await ensureUser(A, '验证维修工', 'admin');
  log('准备测试账号', true, `user_id=${user.id}, admin_id=${admin.id}`);

  // 1. 地址管理
  const addr = await api('POST', '/api/addresses', user.token, {
    contact_name: '验证收货人', contact_phone: '13800138000',
    province: '广东省', city: '深圳市', district: '南山区', detail_address: '科技园验证楼1号', is_default: true
  });
  const addrId = addr.data?.id;
  log('地址-新增 /api/addresses', addr.status === 200 && !!addrId, `http=${addr.status}, id=${addrId}`);
  const addrList = await api('GET', '/api/addresses', user.token);
  log('地址-列表 /api/addresses', addrList.status === 200, `http=${addrList.status}, 数量=${Array.isArray(addrList.data) ? addrList.data.length : JSON.stringify(addrList.data).slice(0,40)}`);
  if (addrId) {
    const df = await api('POST', `/api/addresses/${addrId}/default`, user.token);
    const up = await api('PUT', `/api/addresses/${addrId}`, user.token, { contact_name: '验证收货人改', contact_phone: '13800138000', province: '广东省', city: '深圳市', district: '南山区', detail_address: '科技园验证楼2号' });
    log('地址-设默认/编辑', df.status === 200 && up.status === 200, `default=${df.status}, update=${up.status}`);
  }

  // 2. 单位管理
  const unit = await api('POST', '/api/units', user.token, {
    name: '验证单位公司', address: '验证路1号', contact_name: '李经理', contact_phone: '13900139000', is_default: true
  });
  const unitId = unit.data?.id;
  log('单位-新增 /api/units', unit.status === 200 && !!unitId, `http=${unit.status}, id=${unitId}`);
  const unitList = await api('GET', '/api/units', user.token);
  log('单位-列表 /api/units', unitList.status === 200, `http=${unitList.status}, 数量=${Array.isArray(unitList.data) ? unitList.data.length : JSON.stringify(unitList.data).slice(0,40)}`);

  // 3. 下单：到店（无地址）
  const oShop = await api('POST', '/api/orders/create', user.token, {
    orderType: 'repair', deviceType: 1, deviceId: 1, problem: '无法开机',
    description: '进水后无法开机', serviceType: 'shop', brand: '苹果', model: 'iPhone 15', estimatedPrice: 300, deviceCondition: '九成新'
  });
  const oShopId = oShop.data?.data?.order_id_numeric;
  log('下单-到店 /orders/create', oShop.status === 200 && oShop.data?.success && !!oShopId, `http=${oShop.status}, id=${oShopId}, status=${oShop.data?.data?.order?.status}`);

  // 4. 下单：上门（带地址ID）
  const oHome = await api('POST', '/api/orders/create', user.token, {
    orderType: 'repair', deviceType: 2, deviceId: 2, problem: '键盘失灵',
    description: '部分按键失灵', serviceType: 'home', brand: '联想', model: 'ThinkPad X1', estimatedPrice: 200, deviceCondition: '八成新', addressId: addrId
  });
  const oHomeId = oHome.data?.data?.order_id_numeric;
  log('下单-上门(带地址) /orders/create', oHome.status === 200 && oHome.data?.success && !!oHomeId, `http=${oHome.status}, id=${oHomeId}`);
  if (oHomeId) {
    const det = await api('GET', `/api/orders/${oHomeId}/detail`, user.token);
    const od = det.data?.data?.order;
    log('下单-上门地址落库校验', !!od && od.address_id && od.contact_name === '验证收货人改', `address_id=${od?.address_id}, contact=${od?.contact_name}`);
  }

  // 5. 真实"我的订单"列表（前端 api.js 用的是 /orders/user/:userId）
  const mylist = await api('GET', `/api/orders/user/${user.id}`, user.token);
  const arr = mylist.data?.data?.orders || mylist.data?.data?.list || mylist.data?.data || [];
  const hasShop = Array.isArray(arr) && arr.some(o => o.id === oShopId);
  const hasHome = Array.isArray(arr) && arr.some(o => o.id === oHomeId);
  log('我的订单列表 /orders/user/:userId', mylist.status === 200 && hasShop && hasHome, `http=${mylist.status}, 数量=${Array.isArray(arr) ? arr.length : 'N/A'}`);

  // 6. 完整生命周期（含 拒绝->重报） on oShop
  if (oShopId) {
    const q = await api('PUT', `/api/admin/orders/${oShopId}/quote`, admin.token, { quote_price: 199.5, quote_description: '更换故障部件' });
    let o = await getOrder(oShopId);
    log('管理员报价 quote', q.status === 200 && o.status === 'quoted' && o.quote_status === 'pending', `status=${o.status}, quote_status=${o.quote_status}`);

    const det = await api('GET', `/api/orders/${oShopId}/detail`, user.token);
    const od = det.data?.data?.order;
    log('用户查看详情(正确路径 data.data.order.status)', det.status === 200 && od && od.status === 'quoted' && od.quote_price == 199.5, `status=${od?.status}, quote_price=${od?.quote_price}`);

    const rej = await api('PUT', `/api/orders/${oShopId}/reject-quote`, user.token, { reason: '价格偏高' });
    o = await getOrder(oShopId);
    log('用户拒绝报价 reject-quote', rej.status === 200 && o.status === 'pending' && o.quote_status === 'rejected', `status=${o.status}, quote_status=${o.quote_status}`);

    const q2 = await api('PUT', `/api/admin/orders/${oShopId}/quote`, admin.token, { quote_price: 149.5, quote_description: '优惠价重报' });
    o = await getOrder(oShopId);
    log('管理员重报(二次报价)', q2.status === 200 && o.status === 'quoted' && o.quote_price == 149.5, `status=${o.status}, quote_price=${o.quote_price}`);

    const acc = await api('PUT', `/api/orders/${oShopId}/accept-quote`, user.token);
    o = await getOrder(oShopId);
    log('用户接受报价 accept-quote', acc.status === 200 && o.status === 'confirmed' && o.quote_status === 'accepted' && o.payment_status === 'unpaid', `status=${o.status}, payment=${o.payment_status}`);

    const guard = await api('PUT', `/api/admin/orders/${oShopId}/process`, admin.token);
    log('未支付禁止开始处理(守卫)', guard.status === 400, `http=${guard.status}, msg=${guard.data?.error}`);

    await pool.query("UPDATE orders SET payment_status='paid', paid_at=NOW(), updated_at=NOW() WHERE id=?", [oShopId]);
    const p1 = await api('PUT', `/api/admin/orders/${oShopId}/process`, admin.token);
    o = await getOrder(oShopId);
    log('管理员开始处理 process', p1.status === 200 && o.status === 'processing', `status=${o.status}`);

    const pr1 = await api('PUT', `/api/orders/${oShopId}/progress`, admin.token, { progress: 30 });
    const pr2 = await api('PUT', `/api/orders/${oShopId}/progress`, admin.token, { progress: 70 });
    o = await getOrder(oShopId);
    log('维修进度上报 30->70', pr1.status === 200 && pr2.status === 200 && Number(o.progress) === 70, `progress=${o.progress}`);

    // 进度照片上传（真实文件，校验落盘）
    const imgPath = 'D:/maintain/电子维修2.0/uploads/progress/25/1779522114199-38925454.jpg';
    let uploadOk = false, savedPath = '';
    if (fs.existsSync(imgPath)) {
      const fd = new FormData();
      fd.append('orderId', String(oShopId));
      fd.append('description', '维修进度反馈：部件已更换');
      fd.append('images', new Blob([fs.readFileSync(imgPath)], { type: 'image/jpeg' }), 'verify_progress.jpg');
      const up = await api('POST', '/api/progress/photos/upload', admin.token, fd);
      const imgs = up.data?.data?.images || up.data?.images || [];
      uploadOk = up.status === 200 && imgs.length > 0;
      savedPath = Array.isArray(imgs) ? imgs[0] : '';
      log('进度照片上传(校验落盘)', uploadOk, `http=${up.status}, files=${JSON.stringify(imgs).slice(0,80)}`);
      if (savedPath) {
        const localFile = path.join(__dirname, '..', savedPath.replace(/^\/+/, ''));
        const onDisk = fs.existsSync(localFile);
        log('   └ 文件真实落盘校验', onDisk, `path=${localFile}`);
      }
    } else {
      log('进度照片上传(校验落盘)', false, '未找到测试图片');
    }

    const fb = await api('GET', `/api/progress/feedbacks/${oShopId}`, user.token);
    const fbList = fb.data?.data || fb.data?.data?.feedbacks || [];
    log('用户查看进度反馈列表', fb.status === 200 && fb.data?.success, `http=${fb.status}, 条数=${Array.isArray(fbList) ? fbList.length : 'N/A'}`);

    const unread = await api('GET', '/api/orders/progress-unread-count', user.token);
    log('未读进度提醒计数', unread.status === 200 && unread.data?.success, `count=${JSON.stringify(unread.data?.data)}`);

    const read = await api('PUT', `/api/orders/${oShopId}/progress-read`, user.token);
    log('标记进度已读', read.status === 200, `http=${read.status}`);

    const comp = await api('PUT', `/api/admin/orders/${oShopId}/complete`, admin.token);
    o = await getOrder(oShopId);
    log('管理员完成订单 complete', comp.status === 200 && o.status === 'completed' && Number(o.progress) === 100, `status=${o.status}, progress=${o.progress}`);

    const rev = await api('POST', '/api/orders/submit-review', user.token, { orderId: oShopId, rating: 5, comment: '维修很满意', images: [] });
    o = await getOrder(oShopId);
    log('用户提交评价 submit-review', rev.status === 200 && rev.data?.success, `http=${rev.status}, 评价后status=${o.status}`);
  }

  // 7. 取消订单流程
  const oCancel = await api('POST', '/api/orders/create', user.token, {
    orderType: 'repair', deviceType: 1, deviceId: 1, problem: '屏幕碎裂', description: '测试取消', serviceType: 'shop', brand: '苹果', model: 'iPhone 13'
  });
  const oCancelId = oCancel.data?.data?.order_id_numeric;
  if (oCancelId) {
    const c = await api('POST', `/api/orders/${oCancelId}/cancel`, user.token);
    const o = await getOrder(oCancelId);
    log('取消订单 cancel (pending->cancelled)', c.status === 200 && o.status === 'cancelled', `status=${o.status}`);
    // 已完成订单不能取消
    const c2 = await api('POST', `/api/orders/${oShopId}/cancel`, user.token);
    log('已完成订单禁止取消(守卫)', c2.status === 400, `http=${c2.status}, msg=${c2.data?.error}`);
  }

  // 8. 诊断/扫码（尽力而为，不阻断）
  const diag = await api('POST', '/api/diagnose/analyze', user.token, { deviceType: '手机', brand: '苹果', symptom: '无法开机', details: '进水' });
  log('AI故障自检 /diagnose/analyze', diag.status === 200, `http=${diag.status}, success=${diag.data?.success}, ${JSON.stringify(diag.data?.data?.summary || diag.data?.error || diag.data?.message || '').slice(0,60)}`);
  const scanImg = 'D:/maintain/电子维修2.0/uploads/progress/25/1779522114199-38925454.jpg';
  if (fs.existsSync(scanImg)) {
    const sfd = new FormData();
    sfd.append('image', new Blob([fs.readFileSync(scanImg)], { type: 'image/jpeg' }), 'verify_scan.jpg');
    const scan = await api('POST', '/api/scan/identify', user.token, sfd);
    log('扫码识别 /scan/identify', scan.status === 200, `http=${scan.status}, ${JSON.stringify(scan.data?.data?.device_type_name || scan.data?.error || scan.data?.message || '').slice(0,60)}`);
  }

  // 9. 汇总
  console.log('\n========== 验证汇总 ==========');
  const pass = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok);
  console.log(`通过: ${pass}/${results.length}`);
  if (fail.length) { console.log('失败项:'); fail.forEach(f => console.log(`  - ${f.step} | ${f.info}`)); }

  // 10. 清理
  console.log('\n---------- 清理测试数据 ----------');
  const ids = [oShopId, oHomeId, oCancelId].filter(Boolean);
  if (ids.length) {
    const ph = ids.map(() => '?').join(',');
    await pool.query(`DELETE FROM order_progress_photos WHERE order_id IN (${ph})`, ids).catch(()=>{});
    await pool.query(`DELETE FROM transaction_income WHERE order_id IN (${ph})`, ids).catch(()=>{});
    await pool.query(`DELETE FROM orders WHERE id IN (${ph})`, ids).catch(()=>{});
  }
  await pool.query('DELETE FROM user_addresses WHERE user_id = ?', [user.id]).catch(()=>{});
  await pool.query('DELETE FROM user_units WHERE user_id = ?', [user.id]).catch(()=>{});
  await pool.query('DELETE FROM users WHERE openid IN (?, ?)', [U, A]).catch(()=>{});
  console.log('测试账号/订单/地址/单位已清理(进度照片目录遗留请用 bash rm 清理)');
  await pool.end();
  process.exit(fail.length ? 1 : 0);
}
main().catch(e => { console.error('验证脚本异常:', e); process.exit(1); });
