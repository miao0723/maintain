// components/confirm-modal/confirm-modal.js
// 统一的「确定 / 拒绝」确认弹窗组件。
// 通过 app.js 中对 wx.showModal 的包裹，自动接管全小程序的确认弹窗，
// 对外暴露 showModal(options) 方法，options 与 wx.showModal 保持一致：
//   { title, content, showCancel, cancelText, confirmText, confirmColor, cancelColor, success, fail, complete }
// 返回的 Promise resolve 值为 { confirm, cancel }，与 wx.showModal 的 success 回调参数一致。
Component({
  data: {
    visible: false,
    closing: false,
    title: '',
    content: '',
    showCancel: true,
    cancelText: '取消',
    confirmText: '确定',
    cancelColor: '#64748b',
    confirmBg: '#4f6b84',
    confirmColor: '#ffffff',
    iconType: 'none', // none | success | warning | error | question
    iconText: ''
  },

  methods: {
    /**
     * 兼容 wx.showModal 调用方式的入口。
     */
    showModal(options) {
      options = options || {}
      const confirmText = options.confirmText || '确定'
      const type = this._resolveType(options, confirmText)

      return new Promise((resolve) => {
        const resolver = (res) => {
          if (typeof options.success === 'function') {
            try { options.success(res) } catch (e) { /* 忽略回调异常，避免阻塞 UI */ }
          }
          if (typeof options.complete === 'function') {
            try { options.complete(res) } catch (e) { /* 忽略回调异常 */ }
          }
          resolve(res)
        }

        this._resolver = resolver

        // 危险操作（删除 / 解绑等）自动使用警示图标 + 红色确认按钮
        const isDanger = type === 'danger'
        const iconType = isDanger ? 'warning' : (options.icon || 'none')

        this.setData({
          visible: true,
          closing: false,
          title: options.title || '',
          content: options.content || '',
          showCancel: options.showCancel !== false,
          cancelText: options.cancelText || '取消',
          confirmText: confirmText,
          cancelColor: options.cancelColor || '#64748b',
          confirmBg: options.confirmColor || (isDanger ? '#ef4444' : '#4f6b84'),
          confirmColor: options.confirmColor ? '#ffffff' : '#ffffff',
          iconType: iconType,
          iconText: isDanger ? '!' : (options.iconText || '')
        })
      })
    },

    /**
     * 根据文案推断弹窗类型（默认 / 危险）。
     * 危险类确认（删除 / 移除 / 解绑 / 注销等）使用红色按钮 + 警示图标。
     */
    _resolveType(options, confirmText) {
      if (options.type === 'danger' || options.type === 'warning') return options.type
      if (options.type === 'success' || options.type === 'error' || options.type === 'question') return options.type

      const dangerKeywords = ['删除', '移除', '清空', '注销', '解绑', '退订', '残忍', '永久']
      const haystack = (confirmText || '') + '|' + (options.title || '')
      for (let i = 0; i < dangerKeywords.length; i++) {
        if (haystack.indexOf(dangerKeywords[i]) !== -1) return 'danger'
      }
      return 'none'
    },

    onConfirm() {
      this._close({ confirm: true, cancel: false })
    },

    onCancel() {
      this._close({ confirm: false, cancel: true })
    },

    _close(res) {
      if (!this._resolver) return
      const resolver = this._resolver
      this._resolver = null

      // 先播放退场动画，再隐藏节点
      this.setData({ closing: true })
      setTimeout(() => {
        this.setData({ visible: false, closing: false })
      }, 180)

      // 立即触发回调 / resolve，保证业务逻辑时序与原生一致
      resolver(res)
    },

    // 点击遮罩不关闭（与原生行为一致，避免误触）
    noop() {}
  }
})
