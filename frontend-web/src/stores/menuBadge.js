import { defineStore } from 'pinia'
import { getMenuBadges } from '@/api/menuBadge'

/**
 * 菜单徽标 Store
 * 轮询 /notifications/menu-badges，驱动：
 * 1. 侧边栏一级菜单红点数字；
 * 2. 悬停徽标的待办明细面板；
 * 3. 即将超时/已超时工单的一次性弹窗提醒（见 layout/Index.vue）。
 */
export const useMenuBadgeStore = defineStore('menuBadge', {
  state: () => ({
    // { repair_tasks: { count, overdue_count, soon_count, title, route, items: [...] }, ... }
    badges: {},
    updatedAt: null
  }),

  getters: {
    // 全部菜单待办总数
    totalCount: (state) =>
      Object.values(state.badges).reduce((sum, b) => sum + (b.count || 0), 0),

    // 是否存在已超时事项（用于更醒目的提示样式）
    hasOverdue: (state) =>
      Object.values(state.badges).some((b) => (b.overdue_count || 0) > 0)
  },

  actions: {
    async fetch() {
      try {
        const res = await getMenuBadges()
        if (res.code === 200 || res.code === 0) {
          this.badges = res.data || {}
          this.updatedAt = Date.now()
        }
      } catch (e) {
        // 徽标失败静默处理：可能是未登录/网络波动，不影响主流程
      }
    }
  }
})
