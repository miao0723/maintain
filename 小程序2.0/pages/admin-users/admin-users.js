// pages/admin-users/admin-users.js
const { adminApi } = require('../../utils/api.js')
const { normalizeAvatarUrl, DEFAULT_AVATAR_URL } = require('../../utils/avatar.js')

const ROLE_OPTIONS = ['user', 'admin', 'super_admin']
const ROLE_LABELS = { user: '普通用户', admin: '管理员', super_admin: '超级管理员' }

Page({
  data: {
    users: [],
    total: 0,
    page: 1,
    pageSize: 20,
    loading: false,
    keyword: '',
    roleFilter: 'all',
    roleLabels: ROLE_LABELS
  },

  onLoad() { this.loadUsers() },
  onShow() { this.loadUsers() },

  async loadUsers() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const res = await adminApi.getAllUsers({
        page: this.data.page,
        pageSize: this.data.pageSize,
        keyword: this.data.keyword,
        role: this.data.roleFilter
      })
      if (res && res.success && res.data) {
        const users = (res.data.users || []).map(u => ({
          ...u,
          avatar: normalizeAvatarUrl(u.avatar_url || u.avatarUrl, DEFAULT_AVATAR_URL),
          roleLabel: ROLE_LABELS[u.role] || '普通用户',
          statusLabel: u.status === 0 ? '已禁用' : '正常',
          statusClass: u.status === 0 ? 'disabled' : 'normal',
          createdAt: (u.created_at || '').slice(0, 10)
        }))
        this.setData({ users, total: res.data.total || 0 })
      }
    } catch (e) {
      console.error('加载用户失败', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onSearchInput(e) { this.setData({ keyword: e.detail.value }) },
  onSearch() { this.setData({ page: 1 }); this.loadUsers() },
  onRoleFilter(e) {
    this.setData({ roleFilter: e.currentTarget.dataset.role, page: 1 })
    this.loadUsers()
  },

  async changeRole(e) {
    const { id, role } = e.currentTarget.dataset
    const idx = ROLE_OPTIONS.indexOf(role)
    const next = ROLE_OPTIONS[(idx + 1) % ROLE_OPTIONS.length]
    wx.showModal({
      title: '修改角色',
      content: `将「${ROLE_LABELS[role]}」改为「${ROLE_LABELS[next]}」？`,
      success: async (r) => {
        if (!r.confirm) return
        try {
          await adminApi.updateUserRole(id, next)
          wx.showToast({ title: '已更新', icon: 'success' })
          this.loadUsers()
        } catch (err) { wx.showToast({ title: '操作失败', icon: 'none' }) }
      }
    })
  },

  async toggleStatus(e) {
    const { id, status } = e.currentTarget.dataset
    const next = status === 0 ? 1 : 0
    wx.showModal({
      title: next === 0 ? '禁用用户' : '启用用户',
      content: next === 0 ? '禁用后该用户将无法登录' : '确认启用该用户？',
      success: async (r) => {
        if (!r.confirm) return
        try {
          await adminApi.toggleUserStatus(id, next)
          wx.showToast({ title: '已更新', icon: 'success' })
          this.loadUsers()
        } catch (err) { wx.showToast({ title: '操作失败', icon: 'none' }) }
      }
    })
  },

  async deleteUser(e) {
    const { id, name } = e.currentTarget.dataset
    wx.showModal({
      title: '删除用户',
      content: `确认删除用户「${name || '该用户'}」？此操作不可恢复`,
      confirmColor: '#ff4757',
      success: async (r) => {
        if (!r.confirm) return
        try {
          await adminApi.deleteUser(id)
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadUsers()
        } catch (err) { wx.showToast({ title: '删除失败', icon: 'none' }) }
      }
    })
  },

  onAvatarError(e) {
    const idx = e.currentTarget.dataset.index
    if (idx === undefined || idx === null) return
    const key = `users[${idx}].avatar`
    this.setData({ [key]: DEFAULT_AVATAR_URL })
  }
})
