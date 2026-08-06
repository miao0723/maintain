import { defineStore } from 'pinia'
import { login, logout, getProfile } from '@/api/auth'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: (() => {
      try {
        const data = localStorage.getItem('userInfo')
        if (!data || data === 'undefined' || data === 'null') return null
        return JSON.parse(data)
      } catch (error) {
        console.error('解析 userInfo 失败:', error)
        localStorage.removeItem('userInfo')
        return null
      }
    })(),
    permissions: (() => {
      try {
        const data = localStorage.getItem('permissions')
        if (!data || data === 'undefined') return []
        return JSON.parse(data)
      } catch (error) {
        console.error('解析 permissions 失败:', error)
        localStorage.removeItem('permissions')
        return []
      }
    })()
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,

    userRole: (state) => {
      const roleMap = {
        1: '管理员',
        2: '部门经理',
        3: '维修工程师',
        4: '普通用户'
      }
      return roleMap[state.userInfo?.role_type] || '未知'
    },

    hasPermission: (state) => (module, action) => {
      if (state.userInfo?.role_type === 1) return true // 管理员拥有所有权限
      const modulePerms = state.permissions.find(p => p.module === module)
      return modulePerms?.actions?.includes(action) || false
    }
  },

  actions: {
    async login(username, password) {
      try {
        console.log('正在登录...', username)
        const res = await login({ username, password })

        console.log('登录响应完整数据:', res)
        console.log('res.data:', res.data)
        console.log('res.token:', res.token)
        console.log('res.access_token:', res.access_token)

        // 由于 request.js 现在返回整个 res，需要检查 res.data
        const data = res.data || res
        const token = data.token || data.access_token || res.token || res.access_token
        const user = data.user || res.user

        console.log('提取的 token:', token)
        console.log('提取的 user:', user)

        this.token = token
        this.userInfo = user
        this.permissions = data.permissions || res.permissions || []

        if (token) {
          localStorage.setItem('token', token)
        }
        if (user) {
          localStorage.setItem('userInfo', JSON.stringify(user))
        }
        localStorage.setItem('permissions', JSON.stringify(this.permissions))

        console.log('登录成功，token 已保存')
        return true
      } catch (error) {
        console.error('登录失败:', error)
        ElMessage.error(error.message || '登录失败')
        return false
      }
    },

    async logout() {
      try {
        await logout()
      } catch (error) {
        console.error('登出失败', error)
      } finally {
        this.token = ''
        this.userInfo = null
        this.permissions = []
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        localStorage.removeItem('permissions')
      }
    },

    async fetchUserInfo() {
      try {
        const res = await getProfile()
        console.log('fetchUserInfo 响应:', res)

        // 后端 profile 返回的是 data 对象本身，包含 id, username, real_name 等字段
        const userData = res.data?.user || res.data || res

        this.userInfo = {
          id: userData.id,
          username: userData.username,
          real_name: userData.real_name,
          phone: userData.phone,
          email: userData.email,
          role_type: userData.role_type,
          department_id: userData.department_id,
          department_name: userData.department_name
        }
        this.permissions = res.permissions || []

        localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
        localStorage.setItem('permissions', JSON.stringify(this.permissions))

        console.log('用户信息已更新:', this.userInfo)
      } catch (error) {
        console.error('获取用户信息失败', error)
      }
    },

    loadAuthFromStorage() {
      const token = localStorage.getItem('token')
      const userInfo = localStorage.getItem('userInfo')
      const permissions = localStorage.getItem('permissions')

      if (token && userInfo && userInfo !== 'undefined' && userInfo !== 'null') {
        try {
          this.token = token
          this.userInfo = JSON.parse(userInfo)
          this.permissions = permissions && permissions !== 'undefined' ? JSON.parse(permissions) : []
        } catch (error) {
          console.error('解析 localStorage 失败:', error)
          // 清空无效数据
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          localStorage.removeItem('permissions')
          this.token = ''
          this.userInfo = null
          this.permissions = []
        }
      }
    }
  }
})
