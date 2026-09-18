/**
 * 估价系数档位补充：为 6 个因子增加更贴近真实回收场景的档位
 * （仅插入尚不存在的文案，可重复执行）
 */
const db = require('./database')

// [factor_key, label, rate] —— rate 插入后落在同组现有档位之间，保持价格合理性
const EXTRA = [
  ['condition', '近乎全新（仅拆封）', 0.95],
  ['condition', '外观有明显磕碰', 0.62],
  ['screen', '轻微烧屏/泛黄', 0.82],
  ['screen', '外屏碎裂但显示正常', 0.55],
  ['function', '仅个别小问题（不影响日常）', 0.88],
  ['version', '有锁机（运营商锁）', 0.60],
  ['accessories', '包装齐全但配件非原装', 0.96],
  ['accessories', '缺少关键配件', 0.88],
  ['repair-history', '换过电池', 0.90],
  ['repair-history', '换过屏幕/主板等大件', 0.60]
]

async function main() {
  let inserted = 0
  for (const [key, label, rate] of EXTRA) {
    const dup = await db.query(
      'SELECT id FROM recycle_condition_rates WHERE factor_key = ? AND label = ?',
      [key, label]
    )
    if (dup.length > 0) continue
    const existRows = await db.query(
      'SELECT factor_name FROM recycle_condition_rates WHERE factor_key = ? LIMIT 1',
      [key]
    )
    const factorName = existRows[0]?.factor_name || key
    const maxRow = await db.query(
      'SELECT COALESCE(MAX(sort_order), 0) AS m FROM recycle_condition_rates WHERE factor_key = ?',
      [key]
    )
    // value 为小程序端选项匹配编码，新增档位生成唯一编码即可
    const value = `opt_${key}_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
    await db.query(
      'INSERT INTO recycle_condition_rates (factor_key, factor_name, label, value, rate, sort_order) VALUES (?,?,?,?,?,?)',
      [key, factorName, label, value, rate, Number(maxRow[0].m) + 1]
    )
    inserted++
  }
  const rows = await db.query('SELECT factor_key, COUNT(*) AS c FROM recycle_condition_rates GROUP BY factor_key')
  console.log(`[seed-rates] 新增 ${inserted} 个档位；各组现有：`, JSON.stringify(rows))
  process.exit(0)
}

main().catch((e) => { console.error('[seed-rates] 失败:', e.message); process.exit(1) })
