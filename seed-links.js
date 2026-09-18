/**
 * 采购链接管理测试数据种子（recycle_procurement_links，当前表为空）
 * 16 条：覆盖手机/电脑/平板/穿戴/游戏机/无人机分类 + 通用，
 * 绑定爱回收/转转/闲鱼/回收宝平台，含点击量与近期跳转记录，2 条下架状态。
 *
 * 清理：DELETE FROM recycle_procurement_links WHERE id BETWEEN <起始id> AND <结束id>;
 *       （脚本运行结束会打印实际 id 区间）
 */
const db = require('./database');

const pad = (n) => String(n).padStart(2, '0')
const daysAgoStr = (d, h = 15) => {
  const t = new Date()
  t.setDate(t.getDate() - d)
  t.setHours(h, rand(0, 59), 0, 0)
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`
}
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// [name, url, categoryId(null=通用), platformId, model_keyword, price_range, notes, clicks, daysAgoOfLastClick(null=无), status]
const LINKS = [
  ['闲鱼 iPhone 交易比价', 'https://www.goofish.com/search?keyword=iPhone', 1, 3, 'iPhone', '1500-8000元', '个人卖家多，价格上限高，注意验机风险', 156, 1, 1],
  ['转转官方回收 - 手机', 'https://www.zhuanzhuan.com/recycle', 1, 2, 'iPhone/华为/小米', '500-7000元', '官方质检，回款快，适合走量', 132, 2, 1],
  ['爱回收在线估价', 'https://www.aihuishou.com', 1, 1, 'iPhone', '300-9000元', '京东旗下，上门/邮寄均可，一口价', 128, 1, 1],
  ['京东以旧换新', 'https://mai.jd.com', 1, null, 'iPhone/华为', '200-8000元', '换新补贴高，成交后以京券形式发放', 96, 3, 1],
  ['Apple 官方折抵换购', 'https://www.apple.com.cn/shop/trade-in', 1, null, 'iPhone', '500-6000元', '官方折抵价偏低但省心，可作价格下限参考', 61, 5, 1],
  ['华为官网以旧换新', 'https://www.vmall.com/recycle', 1, null, '华为 Mate/P', '400-5500元', 'Mate 系列补贴活动频繁，关注大促节点', 44, 6, 1],
  ['小米以旧换新', 'https://www.mi.com/tradein', 1, null, '小米/Redmi', '100-3000元', '换小米新机时叠加补贴最划算', 27, 9, 1],
  ['找靓机 - 二手苹果采购', 'https://www.zhaoliangji.com', 1, null, 'iPhone', '1200-7500元', 'B2C 二手商，成色分级明确，可作采购渠道', 38, 4, 1],
  ['拍机堂 B2B 批发', 'https://www.paijitang.com', 1, null, 'iPhone/安卓', '300-6000元', '批次拿货价，量大从优，需商家资质', 19, 12, 1],
  ['正二品 - 官翻 Mac', 'https://www.zheng2pin.com', 2, null, 'MacBook', '2500-12000元', '苹果官翻渠道，电脑采购比价必备', 22, 8, 1],
  ['转转 - 笔记本回收', 'https://www.zhuanzhuan.com/recycle/laptop', 2, 2, 'MacBook/ThinkPad', '800-10000元', '笔记本估价普遍高于爱回收，建议双平台比价', 51, 3, 1],
  ['爱回收 - iPad 回收', 'https://www.aihuishou.com/item/ipad', 3, 1, 'iPad', '400-6500元', 'iPad Pro 保值率高，新旧款差价大', 47, 2, 1],
  ['闲鱼 Switch 交易比价', 'https://www.goofish.com/search?keyword=switch', 8, 3, 'Switch', '600-2200元', '游戏机二手活跃，OLED 版流通量最大', 33, 5, 1],
  ['大疆官方以旧换新', 'https://store.dji.com/cn/trade-in', 9, null, '大疆 Mini/Air/Mavic', '900-7500元', '换新购机抵扣，官方渠道放心', 15, null, 1],
  ['回收宝 - 穿戴设备回收', 'https://www.huishoubao.net', 4, 4, 'Apple Watch/AirPods', '100-2200元', '手表耳机小件回收，运费平台承担', 41, 4, 1],
  ['51回收网 - 全网比价', 'https://www.51hsd.com', null, null, '', '0-99999元', '聚合多家回收商报价，一键比价入口', 0, null, 0]
]

async function main() {
  const before = await db.query('SELECT COALESCE(MAX(id),0) AS mx FROM recycle_procurement_links')
  const startId = before[0].mx + 1

  let i = 0
  for (const [name, url, categoryId, platformId, keyword, priceRange, notes, clicks, lastDays, status] of LINKS) {
    i++
    await db.query(
      `INSERT INTO recycle_procurement_links
         (name, url, category_id, platform_id, model_keyword, price_range, notes,
          click_count, last_click_at, status, sort_order, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        name, url, categoryId, platformId, keyword, priceRange, notes,
        clicks, lastDays == null ? null : daysAgoStr(lastDays),
        status, i, daysAgoStr(30 - Math.floor(i / 2)), daysAgoStr(Math.min(lastDays == null ? 30 : lastDays, 3) === 0 ? 0 : Math.max(lastDays == null ? 0 : lastDays - 1, 0))
      ]
    )
  }

  const after = await db.query('SELECT COUNT(*) AS c, MIN(id) AS mn, MAX(id) AS mx FROM recycle_procurement_links')
  console.log(`[seed-links] 已插入 ${i} 条采购链接，id 区间: ${after[0].mn} ~ ${after[0].mx}`)
  console.log(`[seed-links] 清理 SQL: DELETE FROM recycle_procurement_links WHERE id BETWEEN ${after[0].mn} AND ${after[0].mx};`)
  process.exit(0)
}

main().catch((e) => { console.error('[seed-links] 失败:', e.message); process.exit(1) })
