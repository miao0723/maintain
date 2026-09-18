/**
 * 质检中心种子数据
 *
 * 用法: node scripts/seed-qc.js
 * 1. 创建示例质检模板（手机回收质检标准）：6 个质检项 + 4 档成色标准，并发布 V1 版本
 * 2. 挑选最近的回收订单，生成 5 张覆盖不同状态（待质检/质检中/已定级/复核中/已完成）的示例质检单
 *
 * 幂等：模板已存在则跳过；每个订单只生成一张示例质检单。
 */
const db = require('../database');
const { ensureTables } = require('../routes/qcRoutes');

const TEMPLATE_NAME = '手机回收质检标准（示例）';

function safeParseArray(raw) {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function safeParseSnapshot(raw) {
  try {
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

const ITEMS = [
  { name: '屏幕显示', category: '屏幕', check_method: '目测', scoring_type: 'pass_fail', fault_options: ['花屏', '漏液', '闪烁', '划痕', '外裂'], required: 1, sort_order: 1 },
  { name: '外观成色', category: '外观', check_method: '目测', scoring_type: 'score', fault_options: ['边框磕碰', '背壳划痕', '弯曲'], required: 1, sort_order: 2 },
  { name: '电池健康', category: '电池', check_method: '仪器检测', scoring_type: 'score', fault_options: ['健康度<80%', '鼓包', '无法充电'], required: 1, sort_order: 3 },
  { name: '功能按键', category: '功能', check_method: '功能测试', scoring_type: 'pass_fail', fault_options: [' Home 失灵', '音量键失灵', '静音键失灵'], required: 1, sort_order: 4 },
  { name: '摄像头', category: '功能', check_method: '功能测试', scoring_type: 'pass_fail', fault_options: ['对焦异常', '黑斑', '进灰'], required: 0, sort_order: 5 },
  { name: '充电口 / 接口', category: '功能', check_method: '功能测试', scoring_type: 'pass_fail', fault_options: ['接触不良', '无法识别'], required: 0, sort_order: 6 }
];

const GRADES = [
  { grade_key: 'good', grade_name: '优（几乎全新）', min_score: 90, max_score: 100, price_coefficient: 1.00, sort_order: 1, fault_standard: '无功能故障，外观无肉眼可见划痕磕碰，电池健康度 ≥ 90%' },
  { grade_key: 'normal', grade_name: '良（轻微使用痕迹）', min_score: 75, max_score: 89, price_coefficient: 0.85, sort_order: 2, fault_standard: '功能全部正常，轻微划痕 ≤ 3 处，电池健康度 80%-89%' },
  { grade_key: 'fair', grade_name: '中（明显使用痕迹）', min_score: 60, max_score: 74, price_coefficient: 0.65, sort_order: 3, fault_standard: '功能正常但外观磨损明显，或电池健康度 70%-79%' },
  { grade_key: 'poor', grade_name: '差（故障/重度磨损）', min_score: 0, max_score: 59, price_coefficient: 0.40, sort_order: 4, fault_standard: '存在功能故障、屏幕外裂、电池鼓包或严重外观损伤' }
];

async function main() {
  await ensureTables();
  console.log('▶ 质检表已就绪');

  // 1. 模板（幂等）
  let tplRows = await db.query('SELECT id FROM qc_templates WHERE name = ?', [TEMPLATE_NAME]);
  if (!tplRows.length) {
    const ins = await db.query('INSERT INTO qc_templates (name, description) VALUES (?,?)', [TEMPLATE_NAME, '示例模板：覆盖屏幕/外观/电池/功能等 6 项检查，四档成色对应回收价系数']);
    const templateId = ins.insertId;
    for (const it of ITEMS) {
      await db.query(
        `INSERT INTO qc_items (template_id, name, category, check_method, scoring_type, fault_options, required, sort_order)
         VALUES (?,?,?,?,?,?,?,?)`,
        [templateId, it.name, it.category, it.check_method, it.scoring_type,
          JSON.stringify(it.fault_options), it.required, it.sort_order]
      );
    }
    for (const g of GRADES) {
      await db.query(
        `INSERT INTO qc_grade_rules (template_id, grade_key, grade_name, min_score, max_score, price_coefficient, fault_standard, sort_order)
         VALUES (?,?,?,?,?,?,?,?)`,
        [templateId, g.grade_key, g.grade_name, g.min_score, g.max_score, g.price_coefficient, g.fault_standard, g.sort_order]
      );
    }
    await db.query(
      `UPDATE qc_standards SET status='archived' WHERE template_id=? AND status='active'`, [templateId]
    );
    const items = await db.query('SELECT * FROM qc_items WHERE template_id=? AND status=1 ORDER BY sort_order', [templateId]);
    const grades = await db.query('SELECT * FROM qc_grade_rules WHERE template_id=? ORDER BY sort_order', [templateId]);
    await db.query(
      `INSERT INTO qc_standards (template_id, version_no, snapshot, changelog, status, published_at) VALUES (?,?,?,?,?,NOW())`,
      [templateId, 'V1', JSON.stringify({ template_name: TEMPLATE_NAME, items, grades }), '示例初始版本', 'active']
    );
    tplRows = await db.query('SELECT id FROM qc_templates WHERE name = ?', [TEMPLATE_NAME]);
    console.log(`✔ 已创建模板「${TEMPLATE_NAME}」（${ITEMS.length} 个质检项 / ${GRADES.length} 档成色）并发布 V1`);
  } else {
    console.log('• 模板已存在，跳过');
  }
  const templateId = tplRows[0].id;

  // 2. 示例质检单：挑最近的回收订单
  const orders = await db.query(
    `SELECT id, order_id, device_model, estimated_price, actual_price FROM orders
     WHERE order_type = 'recycle' ORDER BY id DESC LIMIT 5`
  );
  if (!orders.length) {
    console.log('⚠ 数据库中没有回收订单，跳过示例质检单（可先在小程序或回收后台创建回收单后再跑一次）');
    return;
  }

  const std = await db.query(`SELECT id, snapshot FROM qc_standards WHERE template_id=? AND status='active' LIMIT 1`, [templateId]);
  // mysql2 会自动解析 JSON 列：snapshot 可能已是对象
  const rawSnapshot = std.length ? std[0].snapshot : null;
  const snapshot = typeof rawSnapshot === 'string' ? safeParseSnapshot(rawSnapshot) : (rawSnapshot || { items: [], grades: [] });
  const stdItems = snapshot.items || [];

  // 每张单的剧本：状态 / 成色 / 扣分映射 / 是否复核
  const scripts = [
    { status: 'pending', condition: null, note: null },
    { status: 'in_progress', condition: null, note: null },
    { status: 'graded', condition: 'good', note: '整体成色很好，仅电池健康度略低' },
    { status: 'review', condition: 'fair', note: '屏幕有轻微划痕，边框一处磕碰' },
    { status: 'completed', condition: 'normal', note: '常规使用痕迹，功能全部正常' }
  ];

  let created = 0;
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const script = scripts[i % scripts.length];
    const dup = await db.query('SELECT COUNT(*) AS c FROM qc_orders WHERE order_id = ?', [order.id]);
    if (Number(dup[0].c) > 0) continue;

    const qcNo = `QC${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(900 + i + 1)}`;
    const base = Number(order.actual_price || order.estimated_price || 0);
    const score = script.condition ? (script.condition === 'good' ? 92 : script.condition === 'normal' ? 80 : 65) : null;
    const coefficient = script.condition === 'good' ? 1.0 : script.condition === 'normal' ? 0.85 : 0.65;
    const finalPrice = script.condition ? Math.round(base * coefficient * 100) / 100 : null;

    const ins = await db.query(
      `INSERT INTO qc_orders (qc_no, order_id, template_id, standard_id, status, inspector_name, grade_score, graded_condition, final_price, grade_note, started_at, graded_at, completed_at, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,NOW(), NOW(), NOW(), DATE_SUB(NOW(), INTERVAL ? HOUR))`,
      [qcNo, order.id, templateId, std[0] ? std[0].id : null, script.status,
        script.status === 'pending' ? null : '质检员小李',
        score, script.condition, finalPrice, script.note, 24 - i * 4]
    );
    const qcId = ins.insertId;

    // 已定级的单：写逐项结果
    if (script.condition) {
      for (const item of stdItems) {
        const isFault = (item.name === '电池健康' && script.condition !== 'good');
        const deduction = isFault ? 8 : 0;
        // fault_options 可能是字符串（快照里）也可能是数组（mysql2 自动解析 JSON 列）
        const faultOptions = typeof item.fault_options === 'string'
          ? safeParseArray(item.fault_options)
          : (Array.isArray(item.fault_options) ? item.fault_options : []);
        await db.query(
          `INSERT INTO qc_results (qc_order_id, qc_item_id, item_name, result, fault_tag, fault_note, deduction)
           VALUES (?,?,?,?,?,?,?)`,
          [qcId, item.id, item.name,
            item.scoring_type === 'pass_fail' ? (isFault ? 'fail' : 'pass') : String(isFault ? 7 : 9),
            isFault ? (faultOptions[0] || null) : null,
            isFault ? `${item.name}检测不达标` : null, deduction]
        );
      }
      // 示例图片
      await db.query(
        `INSERT INTO qc_media (qc_order_id, type, url, note) VALUES (?,?,?,?)`,
        [qcId, 'image', 'https://placeholder.example/qc/screen-front.jpg', '屏幕正面特写']
      );
    }

    // 复核中的单：写复核记录
    if (script.status === 'review') {
      await db.query(
        `INSERT INTO qc_reviews (qc_order_id, type, reason, status) VALUES (?,?,?,?)`,
        [qcId, 'review', '客户对「中」档定级有异议，认为划痕属于轻微范围', 'open']
      );
    }
    created++;
    console.log(`✔ 示例质检单 ${qcNo}（${order.order_id}，状态 ${script.status}）`);
  }

  console.log(created ? `✔ 共生成 ${created} 张示例质检单` : '• 每个订单都已有质检单，跳过');
  console.log('✅ 质检种子数据完成');
  process.exit(0);
}

main().catch((err) => {
  console.error('✖ 种子数据失败:', err.message);
  process.exit(1);
});
