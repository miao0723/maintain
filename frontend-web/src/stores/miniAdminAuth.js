import { defineStore } from 'pinia'
import { miniAdminLogin, miniAdminLogout, getMiniAdminProfile } from '@/api/miniAdminAuth'

export const useMiniAdminAuthStore = defineStore('miniAdminAuth', {
  state: () => ({
    token: localStorage.getItem('mini_admin_token') || '',
    userInfo: (() => {
      try {
        const data = localStorage.getItem('mini_admin_user')
        return data ? JSON.parse(data) : null
      } catch {
        return null
      }
    })(),
    permissions: (() => {
      try {
        const data = localStorage.getItem('mini_admin_permissions')
        return data ? JSON.parse(data) : []
      } catch {
        return []
      }
    })()
  }),

  getters: {
    isLoggedIn: state => !!state.token,
    menuPermissions: state => state.permissions.filter(item => item.type === 'menu')
  },

  actions: {
    async login(username, password) {
      const res = await miniAdminLogin({ username, password })
      const data = res.data || res
      this.token = data.access_token || ''
      this.userInfo = data.user || null
      this.permissions = data.permissions || []

      localStorage.setItem('mini_admin_token', this.token)
      localStorage.setItem('mini_admin_user', JSON.stringify(this.userInfo))
      localStorage.setItem('mini_admin_permissions', JSON.stringify(this.permissions))
      return true
    },

    async logout() {
      try {
        await miniAdminLogout()
      } catch {
        // ignore
      } finally {
        this.clear()
      }
    },

    async fetchProfile() {
      const res = await getMiniAdminProfile()
      const data = res.data || res
      this.userInfo = data.user || null
      this.permissions = data.permissions || []
      localStorage.setItem('mini_admin_user', JSON.stringify(this.userInfo))
      localStorage.setItem('mini_admin_permissions', JSON.stringify(this.permissions))
    },

    loadFromStorage() {
      this.token = localStorage.getItem('mini_admin_token') || ''
      try {
        this.userInfo = JSON.parse(localStorage.getItem('mini_admin_user') || 'null')
      } catch {
        this.userInfo = null
      }
      try {
        this.permissions = JSON.parse(localStorage.getItem('mini_admin_permissions') || '[]')
      } catch {
        this.permissions = []
      }
    },

    clear() {
      this.token = ''
      this.userInfo = null
      this.permissions = []
      localStorage.removeItem('mini_admin_token')
      localStorage.removeItem('mini_admin_user')
      localStorage.removeItem('mini_admin_permissions')
    }
  }
})
