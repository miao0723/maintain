/**
 * 回收系统看板测试数据种子
 *
 * 写入 68 笔回收测试订单（orders 表，order_type='recycle'，is_internal=1），
 * 近 30 天每天都有 1-4 单（30 天趋势图饱满），其余回填到 170 天内
 * （设备类型玫瑰图 / 热门机型榜 / 环保贡献有层次）。
 *
 * 清理方式（按需执行）：
 *   DELETE FROM orders WHERE order_type='recycle' AND is_internal=1;
 *   DELETE FROM recycle_price_logs WHERE reason LIKE '%测试%';
 */
const db = require('./database');

const MODELS = {
  1: ['iPhone 15 Pro Max', 'iPhone 15', 'iPhone 14 Pro', 'iPhone 13', '华为 Mate 60 Pro', '华为 P60', '小米 14', 'OPPO Find X7', 'vivo X100'],
  2: ['MacBook Air M2', 'MacBook Pro 14', '联想 ThinkPad X1', '华为 MateBook X Pro'],
  3: ['iPad Pro M4', 'iPad Air 5', '华为 MatePad Pro', '小米平板 6'],
  4: ['Apple Watch S9', '华为 Watch GT4', '小米手表 S3'],
  5: ['AirPods Pro 2', '索尼 WH-1000XM5', '华为 FreeBuds Pro 3'],
  7: ['Switch OLED', 'Steam Deck', 'PS5 Slim'],
  8: ['大疆 Mini 4 Pro', '大疆 Air 3']
}
const TYPE_NAMES = { 1: '手机', 2: '电脑', 3: '平板', 4: '手表/穿戴', 5: '耳机音频', 7: '游戏机', 8: '无人机' }
// 各类型价格区间（基准价档次）
const PRICE_RANGE = { 1: [600, 6500], 2: [1800, 9500], 3: [1200, 7800], 4: [500, 2800], 5: [300, 1600], 7: [900, 3800], 8: [2200, 6800] }
const CONDITIONS = ['good', 'normal', 'fair', 'poor', 'excellent']
const COND_DESC = {
  good: '外观良好，功能正常，轻微使用痕迹',
  normal: '正常使用痕迹，功能完好',
  fair: '明显使用痕迹，边框有磕碰',
  poor: '屏幕划痕明显/电池效率低',
  excellent: '近乎全新，全程贴膜带壳'
}
const USERS = [1, 2, 3, 4] // 张三/李四光/王五/微信用户

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const pad = (n) => String(n).padStart(2, '0')
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

// 状态分布：pending 8 / quoted 6 / confirmed 5 / processing 7 / completed 32 / review 4 / cancelled 6
function buildPlan() {
  const plan = []
  // 近 30 天：每天 1-4 单
  for (let i = 29; i >= 0; i--) {
    const n = i < 3 ? rand(2, 4) : rand(1, 3) // 最近几天密一些
    for (let k = 0; k < n; k++) plan.push({ daysAgo: i, hour: rand(9, 21) })
  }
  // 31~170 天回填（越近越密）
  for (let i = 31; i <= 170; i += rand(2, 6)) plan.push({ daysAgo: i, hour: rand(9, 20) })
  return plan // ~30*2 + ~35 ≈ 68 单
}

async function main() {
  const plan = buildPlan()
  // 状态分配：近 5 天内多为 pending/quoted，较早日多为 completed/cancelled
  const recentPool = ['pending', 'pending', 'quoted', 'quoted', 'processing', 'confirmed', 'completed', 'review']
  const oldPool = ['completed', 'completed', 'completed', 'completed', 'completed', 'cancelled', 'review', 'processing']

  let inserted = 0
  for (const slot of plan) {
    const created = new Date()
    created.setDate(created.getDate() - slot.daysAgo)
    created.setHours(slot.hour, rand(0, 59), rand(0, 59), 0)

    const deviceType = Number(pick(Object.keys(MODELS)))
    const model = pick(MODELS[deviceType])
    const [lo, hi] = PRICE_RANGE[deviceType]
    const estimated = rand(lo, hi)
    const cond = pick(CONDITIONS)

    const status = slot.daysAgo <= 5 ? pick(recentPool) : pick(oldPool)
    let actualPrice = null
    let completedAt = null
    let progress = 0
    let quotePrice = null
    let quoteDescription = null
    let quoteStatus = null
    let confirmedAt = null
    let paymentStatus = 'unpaid'
    let payAmount = 0
    let cancelReason = null
    let cancelledAt = null

    if (status === 'completed') {
      actualPrice = Math.round(estimated * (rand(65, 95) / 100))
      const done = new Date(created)
      done.setDate(done.getDate() + rand(2, 9))
      if (done > new Date()) done.setTime(Date.now() - 3600000)
      completedAt = fmtDate(done)
      progress = 100
      paymentStatus = 'paid'
      payAmount = actualPrice
      quotePrice = actualPrice
      quoteStatus = 'accepted'
      quoteDescription = '验机后按实际成色定价'
      confirmedAt = fmtDate(new Date(created.getTime() + 86400000))
    } else if (status === 'quoted') {
      quotePrice = Math.round(estimated * (rand(70, 92) / 100))
      quoteStatus = 'pending'
      quoteDescription = pick(['屏幕轻微划痕，整体良好', '电池健康度偏低，酌情减价', '功能全好，价格可谈', '边框磕碰，小幅折价'])
    } else if (status === 'confirmed' || status === 'processing') {
      progress = status === 'confirmed' ? rand(10, 30) : rand(40, 85)
      quotePrice = Math.round(estimated * (rand(72, 92) / 100))
      quoteStatus = 'accepted'
      confirmedAt = fmtDate(new Date(created.getTime() + 86400000))
    } else if (status === 'review') {
      actualPrice = Math.round(estimated * (rand(70, 90) / 100))
      progress = 100
      quotePrice = actualPrice
      quoteStatus = 'accepted'
      paymentStatus = 'paid'
      payAmount = actualPrice
    } else if (status === 'cancelled') {
      cancelReason = pick(['用户取消', '价格未谈拢', '设备与描述不符', '用户改自留'])
      cancelledAt = fmtDate(new Date(created.getTime() + 86400000 * rand(1, 3)))
    }

    const orderId = `RECTEST${created.getFullYear()}${pad(created.getMonth() + 1)}${pad(created.getDate())}${pad(created.getHours())}${pad(created.getMinutes())}${rand(10, 99)}`
    const userId = pick(USERS)

    await db.query(
      `INSERT INTO orders (order_id, user_id, order_type, device_type, device_model, device_condition,
        problem_description, service_type, estimated_price, actual_price, status, progress,
        quote_price, quote_description, quote_status, confirmed_at, completed_at,
        cancel_reason, cancelled_at, payment_status, pay_amount, is_internal, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
      [
        orderId, userId, 'recycle', deviceType, model, cond,
        `${TYPE_NAMES[deviceType]}回收：${COND_DESC[cond]}`, pick(['home', 'shop']), estimated, actualPrice, status, progress,
        quotePrice, quoteDescription, quoteStatus, confirmedAt, completedAt,
        cancelReason, cancelledAt, paymentStatus, payAmount,
        fmtDate(created), fmtDate(created)
      ]
    )
    inserted++
  }
  console.log(`[seed] 已插入 ${inserted} 笔回收测试订单 (is_internal=1)`)

  // 配价库补几条调价流水，让"价格走势"弹窗更有层次（同样便于清理）
  const logs = [
    ['iPhone 15 Pro Max', 6200, 5980, '新品降价跟随调整'],
    ['iPhone 15 Pro Max', 5980, 6350, '市场需求回暖上调'],
    ['华为 Mate 60 Pro', 5200, 4950, '竞品促销应对'],
    ['iPad Pro M4', 7300, 7650, '供应收紧上调'],
    ['MacBook Air M2', 3600, 3450, '迭代机型清库']
  ]
  for (let i = 0; i < logs.length; i++) {
    const [name, oldP, newP, reason] = logs[i]
    const rows = await db.query('SELECT id FROM recycle_models WHERE name = ? LIMIT 1', [name])
    const modelId = rows[0]?.id
    if (!modelId) { console.log(`[seed] 跳过（型号不存在）: ${name}`); continue }
    const when = new Date()
    when.setDate(when.getDate() - (60 - i * 12))
    await db.query(
      `INSERT INTO recycle_price_logs (model_id, model_name, old_price, new_price, reason, admin_id, admin_name, created_at)
       VALUES (?,?,?,?,?,1,'系统管理员',?)`,
      [modelId, name, oldP, newP, `${reason}（测试）`, fmtDate(when)]
    )
  }
  console.log(`[seed] 已补充 ${logs.length} 条调价流水（reason 含“测试”）`)

  // 汇总核对
  const cnt = await db.query(
    `SELECT status, COUNT(*) AS c, COALESCE(SUM(actual_price),0) AS amt
       FROM orders WHERE order_type='recycle' GROUP BY status`
  )
  console.log('[seed] 当前回收订单分布:', JSON.stringify(cnt))
  process.exit(0)
}

main().catch((e) => { console.error('[seed] 失败:', e.message); process.exit(1) })
