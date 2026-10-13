import { defineStore } from 'pinia'
import { getMyPermissions } from '@/api/auth'

/**
 * 权限 Store（菜单级 / 按钮级 / 接口级共用）
 *
 * 载荷来自后端 GET /auth/my-permissions：
 *   { is_boss, role:{id,code,name}, role_type, codes:[...], menus:[...] }
 * - is_boss：老板/超管，拥有全部权限
 * - codes ：按钮/接口权限码列表（支持通配符 repair.*）
 */

const STORAGE_KEY = 'permProfile'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw || raw === 'undefined' || raw === 'null') return null
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

export const usePermStore = defineStore('perm', {
  state: () => ({
    profile: load()
  }),

  getters: {
    isBoss: (state) => !!state.profile?.is_boss,
    roleCode: (state) => state.profile?.role?.code || null,
    roleName: (state) => state.profile?.role?.name || '',
    codes: (state) => state.profile?.codes || [],
    menus: (state) => state.profile?.menus || []
  },

  actions: {
    setProfile(p) {
      this.profile = p || null
      if (p) localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
      else localStorage.removeItem(STORAGE_KEY)
    },

    reset() {
      this.profile = null
      localStorage.removeItem(STORAGE_KEY)
    },

    /**
     * 单个权限码匹配（按钮/接口级）。支持通配符：repair.* 命中 repair.orders.create；* 命中全部。
     */
    can(code) {
      if (!code) return true
      if (this.isBoss) return true
      return this.codes.some((g) => matchCode(g, code))
    },

    /**
     * 命名空间匹配（菜单级）。如命名空间 repair 命中授权 repair.*
     */
    canNamespace(ns) {
      if (!ns) return true
      if (this.isBoss) return true
      return this.codes.some((g) => matchCode(g, ns))
    },

    /**
     * 确保权限已加载：无 profile 时拉取一次（供刷新页面/直接进入时使用）
     */
    async ensureLoaded() {
      if (this.profile) return
      try {
        const res = await getMyPermissions()
        this.setProfile(res?.data || res || null)
      } catch (e) {
        // 静默：未登录或失败时保持空
      }
    }
  }
})

/**
 * 授权码 g 是否覆盖目标码 required（菜单/按钮/接口通用，与后端 PermissionService::match 一致）
 */
function matchCode(g, required) {
  if (!g) return false
  if (g === '*') return true
  if (g === required) return true
  // 通配符：repair.* -> repair.
  if (/\*$/.test(g)) {
    const prefix = g.replace(/\*.*$/, '') // 'repair.*' => 'repair.'
    if (required.startsWith(prefix)) return true
    if (prefix.replace(/\.$/, '') === required.replace(/\.$/, '')) return true
    return false
  }
  // 模块祖先：授予 repair.orders 覆盖 repair.orders.view
  if ((required + '.').startsWith(g + '.')) return true
  // 命名空间：授予 system.users 覆盖命名空间 system
  if ((g + '.').startsWith(required + '.')) return true
  return false
}
