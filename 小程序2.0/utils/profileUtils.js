// utils/profileUtils.js
/**
 * 个人资料展示层工具
 * 1) 角色以「中文标识 + 英文标识」映射展示（避免直接把 DB 里的 role 枚举暴露给用户）
 * 2) 手机号中间四位掩码，保护隐私
 */

/**
 * 角色元数据表（key 为数据库 role 枚举）
 * label: 中文标识   en: 英文标识   desc: 角色说明（注销/权限提示用）
 */
const ROLE_META = {
  user: {
    key: 'user',
    label: '客户',
    en: 'Customer',
    icon: '👤',
    theme: 'user',
    desc: '可提交维修/回收订单并跟踪进度'
  },
  internal: {
    key: 'internal',
    label: '内部人员',
    en: 'Internal',
    icon: '🏢',
    theme: 'internal',
    desc: '可提交免付款的内部维修/回收申请'
  },
  repair: {
    key: 'repair',
    label: '维修工程师',
    en: 'Technician',
    icon: '🔧',
    theme: 'repair',
    desc: '承接并反馈维修工单进度'
  },
  admin: {
    key: 'admin',
    label: '管理员',
    en: 'Admin',
    icon: '🛡️',
    theme: 'admin',
    desc: '负责订单、报价与运营审核'
  },
  super_admin: {
    key: 'super_admin',
    label: '超级管理员',
    en: 'Super Admin',
    icon: '👑',
    theme: 'super-admin',
    desc: '拥有系统全部治理权限'
  }
}

const FALLBACK_ROLE = {
  key: 'unknown',
  label: '未分配角色',
  en: 'Unknown',
  icon: '❓',
  theme: 'unknown',
  desc: '账号尚未分配可见角色'
}

/**
 * 取角色展示元数据（未知角色回退，不会抛错）
 * @param {string} role
 * @returns {{key:string,label:string,en:string,icon:string,theme:string,desc:string}}
 */
function getRoleMeta(role) {
  return ROLE_META[role] || FALLBACK_ROLE
}

/**
 * 角色中英文拼接展示，如 "客户 / Customer"
 * @param {string} role
 * @param {string} separator 默认 ' / '
 */
function formatRoleText(role, separator) {
  const meta = getRoleMeta(role)
  return `${meta.label}${separator === undefined ? ' / ' : separator}${meta.en}`
}

/**
 * 手机号中间四位掩码：13812345678 → 138****5678
 * - 非 11 位手机号（空值、座机、异常数据）按最小可用策略脱敏：保留前 3 后 2，其余打码
 * - 完全非数字或不合法输入原样返回，避免误展示
 * @param {string|number} phone
 * @returns {string}
 */
function maskPhone(phone) {
  if (phone === null || phone === undefined) return ''
  const raw = String(phone).trim()
  if (!raw) return ''

  // 标准 11 位手机号：前三 + **** + 后四
  if (/^\d{11}$/.test(raw)) {
    return `${raw.slice(0, 3)}****${raw.slice(7)}`
  }

  // 含国家码（如 +8613812345678）取末 11 位处理：
  // 仅当显式带 "+" 或长度落在 12~14 位（国家码 + 手机号）时才按国家码解析，避免把超长座机误判
  const digits = raw.replace(/\D/g, '')
  // 仅「纯数字」或「带 + 前缀」按国家码解析；含 -/空格等分隔符的（如座机 0755-12345678）走通用脱敏
  const isPlainNumber = raw.trim().startsWith('+') || /^\d+$/.test(raw.trim())
  const looksLikeCountryCode = isPlainNumber && digits.length >= 12 && digits.length <= 14
  if (looksLikeCountryCode && digits.length > 11) {
    const tail = digits.slice(-11)
    const countryCode = digits.slice(0, digits.length - 11)
    const prefix = countryCode ? `+${countryCode} ` : ''
    return `${prefix}${tail.slice(0, 3)}****${tail.slice(7)}`
  }

  // 其它长度：至少保留首 3 位与末 2 位，中间打码
  if (digits.length >= 6) {
    return `${digits.slice(0, 3)}****${digits.slice(-2)}`
  }
  if (digits.length > 0) {
    return `${digits.slice(0, 1)}****`
  }
  return raw
}

/**
 * 是否已绑定手机号
 */
function hasPhone(phone) {
  return !!(phone && String(phone).trim())
}

/**
 * 由后端返回的 profile 组装「个人资料展示视图模型」
 * 统一在此处做角色映射与脱敏，避免各页面各写一套导致口径不一致
 * @param {object} profile 后端 /user/info 返回（含 role、phone、nickname 等）
 */
function buildProfileView(profile) {
  const p = profile || {}
  const role = p.role || 'user'
  const meta = getRoleMeta(role)
  const phone = p.phone || ''

  return {
    roleKey: meta.key,
    roleLabel: meta.label,
    roleEn: meta.en,
    roleIcon: meta.icon,
    roleTheme: meta.theme,
    roleDesc: meta.desc,
    roleText: `${meta.label} / ${meta.en}`,
    hasPhone: hasPhone(phone),
    maskedPhone: maskPhone(phone),
    phoneTail: /^\d{11}$/.test(String(phone)) ? String(phone).slice(-4) : ''
  }
}

module.exports = {
  ROLE_META,
  FALLBACK_ROLE,
  getRoleMeta,
  formatRoleText,
  maskPhone,
  hasPhone,
  buildProfileView
}
