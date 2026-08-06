/**
 * 综合功能验证脚本
 * 走一遍小程序后端前端(utils/api.js)调用的核心 API
 * 运行: node verify_all_apis.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const jwt = require('jsonwebtoken');
const db = require('./database');

const BASE = 'http://localhost:3001';
const results = [];
let USER_TOKEN, ADMIN_TOKEN, SUPER_TOKEN;
let TEST_USER_ID, TEST_DEVICE_ID, TEST_ADDRESS_ID, TEST_UNIT_ID, TEST_ORDER_ID;

function log(step, ok, info = '') {
  results.push({ step, ok, info });
  console.log(`${ok ? '[PASS]' : '[FAIL]'} ${step}${info ? ' | ' + info : ''}`);
}

async function api(method, url, token, body, raw = false) {
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const opts = { method, headers };
  if (body !== undefined) {
    if (body instanceof FormData) {
      opts.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(BASE + url, opts);
  let data = {};
  if (!raw) { try { data = await res.json(); } catch (e) {} }
  else { data = await res.text(); }
  return { status: res.status, data };
}

function makeToken(user) {
  return jwt.sign({ userId: user.id, openid: user.openid, nickname: user.nickname, role: user.role },
    process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function ensureUser(openid, nickname, role, phone) {
  const rows = await db.query('SELECT id FROM users WHERE openid = ?', [openid]);
  let id;
  if (rows.length) {
    id = rows[0].id;
    await db.query('UPDATE users SET role = ?, status = 1, phone = ? WHERE id = ?', [role, phone || null, id]);
  } else {
    const r = await db.query(
      `INSERT INTO users (openid, nickname, role, status, phone) VALUES (?, ?, ?, 1, ?)`,
      [openid, nickname, role, phone || null]
    );
    id = r.insertId;
  }
  const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return user[0];
}

async function main() {
  console.log('========== 综合功能验证开始 ==========\n');

  // 0. 健康检查
  const health = await api('GET', '/health');
  log('后端健康检查', health.status === 200, JSON.stringify(health.data));
  const dbh = await api('GET', '/db-health');
  log('数据库健康检查', dbh.status === 200 && dbh.data.status === 'OK', JSON.stringify(dbh.data));

  // 1. 管理员登录（真实接口）
  console.log('\n---- 1. 管理员登录 ----');
  const login = await api('POST', '/api/admin/login', null, { phone: '13800138000' });
  ADMIN_TOKEN = login.data?.token;
  log('超级管理员登录(13800138000)', login.status === 200 && !!ADMIN_TOKEN && login.data.user?.role === 'super_admin',
    `role=${login.data?.user?.role}`);
  const login2 = await api('POST', '/api/admin/login', null, { phone: '13800138001' });
  const admin2Token = login2.data?.token;
  log('普通管理员登录(13800138001)', login2.status === 200 && !!admin2Token, `role=${login2.data?.user?.role}`);

  // 准备测试用户
  const testUser = await ensureUser('verify_test_user', '验证测试用户', 'user', '13900000001');
  TEST_USER_ID = testUser.id;
  USER_TOKEN = makeToken(testUser);
  log('准备测试用户', !!USER_TOKEN, `id=${TEST_USER_ID}`);
  const adminUser = await ensureUser('verify_test_admin', '验证测试维修工', 'admin', '13900000002');
  const adminToken = makeToken(adminUser);
  log('准备测试维修工', !!adminToken, `id=${adminUser.id}`);

  // 2. 用户模块
  console.log('\n---- 2. 用户模块 ----');
  const uinfo = await api('GET', '/api/user/info', USER_TOKEN);
  log('获取用户信息', uinfo.status === 200, `id=${uinfo.data?.id}, role=${uinfo.data?.role}`);
  const upinfo = await api('PUT', '/api/user/info', USER_TOKEN, { nickname: '验证测试用户·改', phone: '13900000001' });
  log('更新用户信息', upinfo.status === 200, `nickname=${upinfo.data?.nickname}`);
  // 非法手机号应拒绝
  const badPhone = await api('PUT', '/api/user/info', USER_TOKEN, { phone: '123' });
  log('非法手机号校验', badPhone.status === 400, `http=${badPhone.status}`);

  // 3. 地址模块
  console.log('\n---- 3. 地址模块 ----');
  const addrCreate = await api('POST', '/api/addresses', USER_TOKEN,
    { contact_name: '测试联系人', contact_phone: '13900000001', province: '广东省', city: '深圳市', district: '南山区', detail_address: '科技园测试路1号' });
  TEST_ADDRESS_ID = addrCreate.data?.id;
  log('创建地址', addrCreate.status === 200 && !!TEST_ADDRESS_ID, `id=${TEST_ADDRESS_ID}`);
  const addrList = await api('GET', '/api/addresses', USER_TOKEN);
  log('获取地址列表', addrList.status === 200 && Array.isArray(addrList.data), `count=${Array.isArray(addrList.data) ? addrList.data.length : 'N/A'}`);
  if (TEST_ADDRESS_ID) {
    const addrUpd = await api('PUT', `/api/addresses/${TEST_ADDRESS_ID}`, USER_TOKEN, { contact_name: '测试联系人改' });
    log('更新地址', addrUpd.status === 200, `http=${addrUpd.status}`);
    const addrDefault = await api('POST', `/api/addresses/${TEST_ADDRESS_ID}/default`, USER_TOKEN, {});
    log('设置默认地址', addrDefault.status === 200, `http=${addrDefault.status}`);
  }

  // 4. 用户设备模块
  console.log('\n---- 4. 用户设备模块 ----');
  const devCreate = await api('POST', '/api/user-devices', USER_TOKEN,
    { device_type_id: 1, device_type_name: '手机', brand_name: '苹果', device_model: 'iPhone 15', device_nickname: '我的iPhone', device_purpose: 'repair' });
  TEST_DEVICE_ID = devCreate.data?.data?.id;
  log('创建设备', devCreate.status === 201 && !!TEST_DEVICE_ID, `id=${TEST_DEVICE_ID}`);
  const devList = await api('GET', '/api/user-devices', USER_TOKEN);
  log('获取设备列表', devList.status === 200, `count=${Array.isArray(devList.data?.data) ? devList.data.data.length : 'N/A'}`);
  if (TEST_DEVICE_ID) {
    const devDetail = await api('GET', `/api/user-devices/${TEST_DEVICE_ID}`, USER_TOKEN);
    log('获取设备详情', devDetail.status === 200, `http=${devDetail.status}`);
    const devDefault = await api('POST', `/api/user-devices/${TEST_DEVICE_ID}/default`, USER_TOKEN, {});
    log('设置默认设备', devDefault.status === 200, `http=${devDefault.status}`);
  }

  // 5. 单位模块
  console.log('\n---- 5. 单位模块 ----');
  const unitCreate = await api('POST', '/api/units', USER_TOKEN,
    { name: '测试单位', address: '深圳市南山区', contact_name: '单位联系人', contact_phone: '13900000001' });
  TEST_UNIT_ID = unitCreate.data?.id;
  log('创建单位', unitCreate.status === 200 && !!TEST_UNIT_ID, `id=${TEST_UNIT_ID}`);
  const unitList = await api('GET', '/api/units', USER_TOKEN);
  log('获取单位列表', unitList.status === 200, `http=${unitList.status}`);

  // 6. 产品模块
  console.log('\n---- 6. 产品模块 ----');
  const prodList = await api('GET', '/api/products', USER_TOKEN);
  log('获取产品列表', prodList.status === 200, `count=${Array.isArray(prodList.data?.data) ? prodList.data.data.length : (prodList.data?.data?.products?.length ?? 'N/A')}`);

  // 7. AI诊断 + 扫码
  console.log('\n---- 7. AI诊断 / 扫码 ----');
  const diag = await api('POST', '/api/diagnose/analyze', USER_TOKEN,
    { deviceType: '手机', brand: '华为', symptom: '屏幕碎了', details: '摔落屏幕碎裂' });
  log('AI故障诊断', diag.status === 200, `http=${diag.status}, summary=${(diag.data?.data?.summary || '').slice(0, 30)}`);

  // 8. 订单创建 + 查询
  console.log('\n---- 8. 订单模块 ----');
  const orderCreate = await api('POST', '/api/orders/create', USER_TOKEN, {
    orderType: 'repair', deviceType: '手机', deviceId: TEST_DEVICE_ID || 0,
    problem: '屏幕碎裂', description: '验证脚本下单',
    serviceType: 'shop', brand: '苹果', model: 'iPhone 15', estimatedPrice: 300,
    deviceCondition: '九成新', addressId: TEST_ADDRESS_ID
  });
  TEST_ORDER_ID = orderCreate.data?.data?.order_id_numeric || orderCreate.data?.data?.order?.id || orderCreate.data?.data?.id;
  log('创建维修订单', orderCreate.status === 200 && !!TEST_ORDER_ID, `orderId=${TEST_ORDER_ID}`);
  if (TEST_ORDER_ID) {
    const orderList = await api('GET', `/api/orders/user/${TEST_USER_ID}?page=1&pageSize=20`, USER_TOKEN);
    log('获取用户订单列表', orderList.status === 200 && orderList.data?.success, `http=${orderList.status}`);
    const orderDetail = await api('GET', `/api/orders/${TEST_ORDER_ID}/detail`, USER_TOKEN);
    log('获取订单详情', orderDetail.status === 200 && orderDetail.data?.data?.order?.status, `status=${orderDetail.data?.data?.order?.status}`);
    // 管理员报价
    const quote = await api('PUT', `/api/admin/orders/${TEST_ORDER_ID}/quote`, ADMIN_TOKEN,
      { quote_price: 299, quote_description: '综合验证报价' });
    log('管理员报价', quote.status === 200, `http=${quote.status}`);
    // 用户确认报价
    const acceptQ = await api('PUT', `/api/orders/${TEST_ORDER_ID}/accept-quote`, USER_TOKEN);
    log('用户确认报价', acceptQ.status === 200, `http=${acceptQ.status}`);
    // 管理员接单/处理
    const process = await api('PUT', `/api/admin/orders/${TEST_ORDER_ID}/process`, ADMIN_TOKEN);
    log('管理员开始处理(未支付应被拒)', process.status === 400, `http=${process.status}, msg=${process.data?.error || process.data?.message}`);
  }

  // 9. 管理员功能
  console.log('\n---- 9. 管理员功能 ----');
  const dash = await api('GET', '/api/admin/dashboard-stats', ADMIN_TOKEN);
  log('仪表板统计', dash.status === 200, `http=${dash.status}`);
  const allOrders = await api('GET', '/api/admin/all-orders?page=1&pageSize=10', ADMIN_TOKEN);
  log('管理员全部订单', allOrders.status === 200, `http=${allOrders.status}, total=${allOrders.data?.data?.total ?? allOrders.data?.total}`);
  const pending = await api('GET', '/api/admin/pending-count', ADMIN_TOKEN);
  log('待处理计数', pending.status === 200, `http=${pending.status}`);
  const admins = await api('GET', '/api/admin/admins', ADMIN_TOKEN);
  log('管理员列表', admins.status === 200, `count=${Array.isArray(admins.data?.data) ? admins.data.data.length : 'N/A'}`);

  // 10. 超级管理员功能（若 super admin）
  console.log('\n---- 10. 超级管理员 ----');
  const superList = await api('GET', '/api/super-admin/users', ADMIN_TOKEN).catch(e => ({ status: 0 }));
  if (superList.status === 200 || superList.status > 0) {
    log('超级管理员-用户列表', superList.status === 200, `http=${superList.status}`);
  } else {
    log('超级管理员-用户列表', false, '请求异常');
  }

  // 11. 进度申请
  console.log('\n---- 11. 进度申请 ----');
  const applyCreate = await api('POST', '/api/progress-apply', USER_TOKEN,
    { order_id: TEST_ORDER_ID, customer_name: '验证测试用户', phone: '13900000001', device_name: 'iPhone 15', device_model: 'iPhone 15', progress_type: 'query', apply_reason: '想了解维修情况', expected_time: '2026-08-05' });
  log('创建进度申请', applyCreate.status === 201 || applyCreate.status === 200, `http=${applyCreate.status}, ${JSON.stringify(applyCreate.data?.error || applyCreate.data?.message || '')}`);
  const applyList = await api('GET', '/api/progress-apply/my/list', USER_TOKEN);
  log('我的进度申请列表', applyList.status === 200, `http=${applyList.status}`);

  // 12. 售后
  console.log('\n---- 12. 售后 ----');
  if (TEST_DEVICE_ID) {
    const aft = await api('GET', `/api/after-sales/device/${TEST_DEVICE_ID}`, USER_TOKEN);
    log('设备售后总览', aft.status === 200, `http=${aft.status}`);
  }

  // 13. 知识库
  console.log('\n---- 13. 知识库 ----');
  const kbCats = await api('GET', '/api/knowledge/categories', USER_TOKEN);
  log('知识库分类', kbCats.status === 200, `http=${kbCats.status}`);

  // 14. 位置服务
  console.log('\n---- 14. 位置服务 ----');
  const geo = await api('GET', '/api/location/ip-location', USER_TOKEN);
  log('IP定位', geo.status === 200, `http=${geo.status}`);

  // 15. 产品搜索
  console.log('\n---- 15. 其他 ----');
  const prodSearch = await api('GET', '/api/products/search/手机', USER_TOKEN);
  log('产品搜索', prodSearch.status === 200, `http=${prodSearch.status}`);

  // 汇总
  console.log('\n========== 验证汇总 ==========');
  const pass = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok);
  console.log(`通过: ${pass}/${results.length}`);
  if (fail.length) {
    console.log('失败项:');
    fail.forEach(f => console.log(`  - ${f.step} | ${f.info}`));
  }
  process.exit(fail.length ? 1 : 0);
}

main().catch(e => { console.error('脚本异常:', e); process.exit(1); });
