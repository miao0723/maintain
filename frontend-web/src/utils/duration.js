/**
 * 维修时长格式化（小时口径，2026-10-13 起全链路时长单位为小时）
 * 规则：
 *   null/undefined/'' -> '—'（未规划/未完成）
 *   < 1 分钟          -> '<1分钟'
 *   < 1 小时          -> 'X分钟'
 *   < 24 小时         -> 'X小时'（最多 1 位小数，整数不带小数点）
 *   >= 24 小时        -> 'X.X天'（最多 1 位小数，整数不带小数点）
 */
export function fmtDuration(hours) {
  if (hours === null || hours === undefined || hours === '') return '—'
  const h = Number(hours)
  if (!Number.isFinite(h) || h < 0) return '—'
  if (h === 0) return '0小时'
  if (h < 1 / 60) return '<1分钟'
  if (h < 1) return Math.round(h * 60) + '分钟'
  if (h < 24) {
    const v = Math.round(h * 10) / 10
    return (Number.isInteger(v) ? v : v.toFixed(1)) + '小时'
  }
  const d = Math.round((h / 24) * 10) / 10
  return (Number.isInteger(d) ? d : d.toFixed(1)) + '天'
}

/** 工单默认预计工时（小时）：半个工作日 */
export const DEFAULT_EST_HOURS = 8
