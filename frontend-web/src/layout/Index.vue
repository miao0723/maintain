<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '240px'" class="sidebar">
      <div class="logo">
        <el-icon v-if="!isCollapse" :size="32" color="#409EFF">
          <Tools />
        </el-icon>
        <span v-if="!isCollapse">CMMS</span>
        <span v-else>CM</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-menu-item
            v-if="!route.meta?.hidden"
            :index="route.fullPath"
          >
            <el-icon v-if="route.meta?.icon">
              <component :is="route.meta.icon" />
            </el-icon>
            <template #title>
              <span class="menu-title-wrap">
                <span class="menu-title-text">{{ route.meta?.title }}</span>
                <!-- 待办徽标：该模块有待办/新内容时在标题右侧显示，悬停查看明细 -->
                <el-popover
                  v-if="getMenuBadge(route.name)"
                  placement="right-start"
                  :width="340"
                  trigger="hover"
                  :show-arrow="false"
                  :offset="6"
                  popper-class="menu-badge-popper"
                >
                  <template #reference>
                    <span
                      class="menu-badge"
                      :class="getMenuBadge(route.name).overdue_count > 0 ? 'is-danger' : 'is-warning'"
                    >{{ getMenuBadge(route.name).count > 99 ? '99+' : getMenuBadge(route.name).count }}</span>
                  </template>

                  <div class="badge-panel">
                    <div class="badge-panel-header">
                      <span class="badge-panel-title">{{ getMenuBadge(route.name).title || '待办提醒' }}</span>
                      <span v-if="getMenuBadge(route.name).count > 0" class="badge-panel-count">
                        {{ getMenuBadge(route.name).count }} 项待处理
                      </span>
                    </div>
                    <div class="badge-panel-list">
                      <div
                        v-for="item in getMenuBadge(route.name).items"
                        :key="item.key"
                        class="badge-item"
                        @click="goBadgeRoute(item)"
                      >
                        <div class="badge-item-head">
                          <el-tag
                            size="small"
                            :type="item.severity === 'overdue' ? 'danger' : 'warning'"
                            effect="light"
                            round
                          >
                            {{ item.severity === 'overdue' ? '已超时' : '即将超时' }}
                          </el-tag>
                          <span class="badge-item-remain">{{ item.remain_text }}</span>
                        </div>
                        <div class="badge-item-title">{{ item.title }}</div>
                        <div v-if="item.desc" class="badge-item-desc">{{ item.desc }}</div>
                        <div class="badge-item-deadline">截止：{{ item.deadline }}</div>
                      </div>
                    </div>
                    <div class="badge-panel-footer">
                      <el-button link type="primary" size="small" @click="goBadgeRoute(getMenuBadge(route.name))">
                        前往处理
                        <el-icon><ArrowRight /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </el-popover>
              </span>
            </template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <!-- 主体内容 -->
    <el-container>
      <!-- 顶部栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="item in breadcrumbs"
              :key="item.path"
              :to="{ path: item.path }"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 主题切换：阳光 / 护眼 / 夜间 三选一 -->
          <el-dropdown trigger="click" @command="onThemeCommand" popper-class="theme-dropdown">
            <button class="theme-trigger" :aria-label="`当前主题：${themeLabel}`">
              <el-icon class="trigger-ico"><component :is="themeIcon" /></el-icon>
              <span class="trigger-label">{{ themeLabel }}</span>
              <el-icon class="trigger-caret"><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="t in THEMES"
                  :key="t.key"
                  :command="t.key"
                  :class="{ 'is-active': themeStore.theme === t.key }"
                >
                  <el-icon class="theme-opt-ico"><component :is="t.icon" /></el-icon>
                  <span class="theme-opt-label">{{ t.label }}</span>
                  <span class="theme-opt-desc">{{ t.desc }}</span>
                  <el-icon v-if="themeStore.theme === t.key" class="theme-opt-check"><Check /></el-icon>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 通知 -->
          <el-popover
            v-model:visible="noticeVisible"
            placement="bottom-end"
            :width="380"
            trigger="click"
            popper-class="notice-popper"
            :offset="8"
            :show-arrow="false"
            :popper-options="{ strategy: 'fixed' }"
            @show="onNoticeShow"
          >
            <template #reference>
              <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" class="notice-badge">
                <el-icon class="header-icon">
                  <Bell />
                </el-icon>
              </el-badge>
            </template>

            <div v-loading="noticeLoading" class="notice-panel">
              <div class="notice-panel-header">
                <div class="notice-title">
                  <span>消息通知</span>
                  <span v-if="unreadCount > 0" class="notice-count">{{ unreadCount > 99 ? '99+' : unreadCount }} 条未读</span>
                </div>
                <el-link
                  v-if="unreadCount > 0"
                  type="primary"
                  :underline="false"
                  class="notice-mark-all"
                  @click="handleMarkAllAsRead"
                >全部已读</el-link>
              </div>

              <el-tabs v-model="noticeTab" class="notice-tabs">
                <el-tab-pane :label="unreadList.length ? `未读 (${unreadList.length})` : '未读'" name="unread">
                  <div v-if="unreadList.length" class="notice-list">
                    <div
                      v-for="item in unreadList"
                      :key="item.id"
                      class="notice-item unread"
                      @click="handleNoticeClick(item)"
                    >
                      <el-icon class="notice-item-icon"><component :is="noticeIcon(item.type)" /></el-icon>
                      <div class="notice-item-body">
                        <div class="notice-item-title">{{ item.title }}</div>
                        <div class="notice-item-content">{{ item.content }}</div>
                        <div class="notice-item-time">{{ formatNoticeTime(item.created_at) }}</div>
                      </div>
                      <span class="notice-dot"></span>
                    </div>
                  </div>
                  <el-empty v-else :image-size="60" description="暂无未读消息" />
                </el-tab-pane>
                <el-tab-pane label="历史" name="history">
                  <div v-if="historyList.length" class="notice-list">
                    <div
                      v-for="item in historyList"
                      :key="item.id"
                      class="notice-item"
                      @click="handleNoticeClick(item)"
                    >
                      <el-icon class="notice-item-icon"><component :is="noticeIcon(item.type)" /></el-icon>
                      <div class="notice-item-body">
                        <div class="notice-item-title">{{ item.title }}</div>
                        <div class="notice-item-content">{{ item.content }}</div>
                        <div class="notice-item-time">{{ formatNoticeTime(item.created_at) }}</div>
                      </div>
                    </div>
                  </div>
                  <el-empty v-else :image-size="60" description="暂无历史消息" />
                </el-tab-pane>
              </el-tabs>

              <div class="notice-panel-footer">
                <el-button text type="primary" size="small" class="notice-view-all" @click="goToNotifications">
                  查看全部消息
                  <el-icon class="notice-view-all-icon"><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </el-popover>

          <!-- 用户菜单 -->
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="userInfo.avatar">
                {{ userInfo.real_name?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="username">{{ userInfo.real_name || userInfo.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="500px"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="旧密码" prop="old_password">
          <el-input v-model="passwordForm.old_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="passwordForm.new_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm_password">
          <el-input v-model="passwordForm.confirm_password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePasswordSubmit">确定</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore, THEMES } from '@/stores/theme'
import { ElMessageBox, ElMessage, ElNotification } from 'element-plus'
import {
  Tools,
  User,
  Bell,
  Menu,
  Setting,
  Odometer,
  Tickets,
  Monitor,
  Box,
  View,
  Document,
  Reading,
  Van,
  DataAnalysis,
  ChatDotSquare,
  Fold,
  Expand,
  ArrowDown,
  ArrowRight,
  Lock,
  SwitchButton,
  Check
} from '@element-plus/icons-vue'
import { changePassword } from '@/api/auth'
import { getUnreadCount, getNotifications, markAsRead, markAllAsRead } from '@/api/notification'
import { useMenuBadgeStore } from '@/stores/menuBadge'
import { usePermStore } from '@/stores/permission'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const badgeStore = useMenuBadgeStore()

// 主题切换：阳光 / 护眼 / 夜间
const themeLabel = computed(() => THEMES.find(t => t.key === themeStore.theme)?.label || '阳光')
const themeIcon = computed(() => THEMES.find(t => t.key === themeStore.theme)?.icon || 'Sunny')
const onThemeCommand = (key) => themeStore.setTheme(key)
const permStore = usePermStore()

const isCollapse = ref(false)
const unreadCount = ref(0)
const passwordDialogVisible = ref(false)
const passwordFormRef = ref(null)

// 通知相关
const noticeVisible = ref(false)
const noticeTab = ref('unread')
const recentNotifications = ref([])
const noticeLoading = ref(false)
let unreadTimer = null
let badgeTimer = null

const unreadList = computed(() => recentNotifications.value.filter(n => !n.is_read))
const historyList = computed(() => recentNotifications.value.filter(n => n.is_read))

const iconMap = {
  order: Tickets,
  knowledge: Document,
  device: Monitor,
  stock: Box,
  contract: Document,
  repair: Tools,
  maintenance: Setting,
  inspection: View,
  system: Bell
}
const noticeIcon = (type) => iconMap[type] || Bell

const fetchUnreadCount = async () => {
  // 未登录（含退出登录过程中）时不发请求，避免触发 401 连环弹窗
  if (!authStore.isLoggedIn) return
  try {
    const res = await getUnreadCount()
    if (res.code === 200 || res.code === 0 || (res.code >= 200 && res.code < 300)) {
      unreadCount.value = res.data?.count || 0
    }
  } catch (e) {
    // 忽略通知计数异常
  }
}

const fetchRecent = async () => {
  try {
    const res = await getNotifications({ page: 1, pageSize: 30 })
    if (res.code === 200 || res.code === 0 || (res.code >= 200 && res.code < 300)) {
      recentNotifications.value = res.data?.list || []
    }
  } catch (e) {
    // 忽略
  }
}

// 打开消息面板时锁定页面滚动（body + 主内容区），
// 保证滚轮只在面板内部生效，不会把页面滚走、露出页面外的留白
const NOTICE_OPEN_CLASS = 'notice-panel-open'
watch(noticeVisible, (visible) => {
  document.documentElement.classList.toggle(NOTICE_OPEN_CLASS, visible)
})

const onNoticeShow = async () => {
  noticeLoading.value = true
  try {
    await Promise.all([fetchRecent(), fetchUnreadCount()])
  } finally {
    noticeLoading.value = false
  }
}

const handleNoticeClick = async (item) => {
  if (!item.is_read) {
    try {
      await markAsRead(item.id)
      item.is_read = true
      if (unreadCount.value > 0) unreadCount.value -= 1
    } catch (e) {
      // 忽略
    }
  }
}

const handleMarkAllAsRead = async () => {
  try {
    const res = await markAllAsRead()
    if (res.code === 200 || res.code === 0 || (res.code >= 200 && res.code < 300)) {
      recentNotifications.value.forEach(n => { n.is_read = true })
      unreadCount.value = 0
    }
  } catch (e) {
    // 忽略
  }
}

const formatNoticeTime = (time) => {
  if (!time) return ''
  const date = new Date(time.replace(/-/g, '/'))
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// ===================== 菜单徽标（新内容 / 待办提醒） =====================

// 路由 name => 徽标 key（snake_case，如 RepairTasks => repair_tasks）
const badgeKeyOf = (name) =>
  (name || '').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()

const getMenuBadge = (name) => badgeStore.badges[badgeKeyOf(name)] || null

// 跳转到徽标对应的处理页面，并带 order_id 定位到具体工单；
// 同时把该事项标记为「已点击前往处理」（本机不再重复弹窗，徽标红点保留到真正处理完）
const goBadgeRoute = (target) => {
  if (!target) return
  const path = target.route
  const id = target.id != null
    ? target.id
    : (target.items && target.items[0] ? target.items[0].id : null)
  const key = target.key || (target.items && target.items[0] ? target.items[0].key : null)
  if (!path) return
  let full = path
  if (id != null) full += (full.includes('?') ? '&' : '?') + 'order_id=' + id
  router.push(full)
  if (key) ackBadge(key)
}

// 本次浏览器会话内已弹过的提醒 key，避免同一事项反复骚扰
const NOTIFIED_KEY = 'menu_badge_notified'
const notifiedKeys = new Set()
try {
  const saved = JSON.parse(sessionStorage.getItem(NOTIFIED_KEY) || '[]')
  if (Array.isArray(saved)) saved.forEach(k => notifiedKeys.add(k))
} catch (e) {
  // 忽略解析失败
}
const persistNotified = () => {
  try {
    // 仅保留最近 200 条，避免 sessionStorage 无限增长
    sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify(Array.from(notifiedKeys).slice(-200)))
  } catch (e) {
    // 忽略写入失败（隐私模式等）
  }
}

// 用户「点击前往处理」后，本机持久化标记该事项「已读」：
// 徽标红点仍保留（直到真正处理完后端不再返回），但弹窗不再重复弹出，避免反复打扰。
const ACK_KEY = 'menu_badge_ack'
const ackKeys = new Set()
try {
  const saved = JSON.parse(localStorage.getItem(ACK_KEY) || '[]')
  if (Array.isArray(saved)) saved.forEach(k => ackKeys.add(k))
} catch (e) {
  // 忽略解析失败
}
const ackBadge = (key) => {
  if (!key) return
  ackKeys.add(key)
  try { localStorage.setItem(ACK_KEY, JSON.stringify(Array.from(ackKeys).slice(-200))) } catch (e) {}
}

// 对「即将超时 / 已超时」的工单弹一次性提醒，点击通知可直达处理页面
const notifyDueItems = () => {
  if (!authStore.isLoggedIn) return
  const items = []
  Object.values(badgeStore.badges).forEach(b => {
    (b.items || []).forEach(it => items.push(it))
  })
  // 已超时优先，每次最多弹 3 条，避免轰炸
  items
    .sort((a, b) => (a.severity === b.severity ? 0 : (a.severity === 'overdue' ? -1 : 1)))
    .slice(0, 3)
    .forEach(it => {
      // 已弹过、或用户已点击前往处理（本机已读）的，均不再弹
      if (!it.key || notifiedKeys.has(it.key) || ackKeys.has(it.key)) return
      notifiedKeys.add(it.key)
      persistNotified()
      const overdue = it.severity === 'overdue'
      ElNotification({
        title: overdue ? '维修工单已超时' : '维修工单即将超时',
        message: `${it.title}${it.remain_text ? `（${it.remain_text}）` : ''}${it.desc ? `，${it.desc}` : ''}`,
        type: overdue ? 'error' : 'warning',
        duration: overdue ? 0 : 10000, // 已超时不自动消失，需手动关闭
        position: 'bottom-right',
        showClose: true,
        onClick: () => goBadgeRoute(it)
      })
    })
  // 清理已处理完（不再出现在徽标中）的「已读」标记，避免无限增长
  const liveKeys = new Set(items.map(i => i.key))
  let changed = false
  Array.from(ackKeys).forEach(k => {
    if (!liveKeys.has(k)) { ackKeys.delete(k); changed = true }
  })
  if (changed) {
    try { localStorage.setItem(ACK_KEY, JSON.stringify(Array.from(ackKeys))) } catch (e) {}
  }
}

// 徽标数据变化（含首次拉取）时触发一次性弹窗
watch(() => badgeStore.badges, notifyDueItems, { deep: true })

const fetchBadges = async () => {
  // 未登录（含退出登录过程中）时不发请求，避免触发 401 连环弹窗
  if (!authStore.isLoggedIn) return
  await badgeStore.fetch()
}

onMounted(() => {
  // 确保权限载荷已加载（刷新页面/直进时从后端补齐三角色菜单/按钮权限）
  permStore.ensureLoaded()
  fetchUnreadCount()
  unreadTimer = setInterval(fetchUnreadCount, 30000)
  fetchBadges()
  badgeTimer = setInterval(fetchBadges, 60000)
})

onBeforeUnmount(() => {
  if (unreadTimer) clearInterval(unreadTimer)
  if (badgeTimer) clearInterval(badgeTimer)
  document.documentElement.classList.remove(NOTICE_OPEN_CLASS)
})

// 路由切换后刷新未读角标与菜单徽标（如处理完工单返回）
watch(() => route.fullPath, () => {
  fetchUnreadCount()
  fetchBadges()
})

const userInfo = computed(() => authStore.userInfo || {})

// 菜单路由 - 只显示一级主模块
const menuRoutes = computed(() => {
  const routes = router.getRoutes()
  const indexRoute = routes.find(r => r.name === 'Index')

  // 过滤出主模块路由（有children的路由，或者Dashboard）
  const mainRoutes = indexRoute?.children?.filter(r =>
    r.meta?.title &&
    !r.meta?.hidden &&
    (r.name === 'Dashboard' || r.children?.length > 0)
  ) || []

  // 角色过滤（三级鉴权之菜单级）：
  // - 老板/超管：显示全部模块，排除 hideForAdmin（如「维修作业」工人端）
  // - 维修人员：按权限命名空间显示（repair/inventory/statistics 等，来自 repair.* 授权）
  // - 其他人员：仅无关只读页面（首页、知识库），禁止人事/维修/配置类菜单
  // 命名空间通过路由 meta.perm 声明；知识库/首页无 perm，作为通用只读对全体登录用户可见
  const allowedRoutes = mainRoutes.filter((r) => {
    if (permStore.isBoss || authStore.isAdmin) {
      return !r.meta?.hideForAdmin
    }
    if (r.name === 'Dashboard') return true
    if (r.name === 'Knowledge') return true // 通用只读
    const perm = r.meta?.perm
    if (perm) return permStore.canNamespace(perm)
    return false
  })

  return allowedRoutes.map((route) => ({
    ...route,
    fullPath: `/${route.path}`
  }))
})

// 当前激活菜单
const activeMenu = computed(() => {
  // 获取当前路径，如果是首页则返回/dashboard
  if (route.path === '/' || route.name === 'Dashboard') {
    return '/dashboard'
  }
  // 其他情况直接返回当前路径
  return route.path
})

// 面包屑
const breadcrumbs = computed(() => {
  return route.matched.map(r => ({
    path: r.path,
    title: r.meta?.title || '首页'
  }))
})

// 切换侧边栏
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

// 跳转到通知页面
const goToNotifications = () => {
  noticeVisible.value = false
  router.push({ name: 'Notifications' })
}

// 用户下拉菜单操作
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'password':
      passwordDialogVisible.value = true
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await authStore.logout()
    router.push({ name: 'Login' })
  } catch (error) {
    // 用户取消
  }
}

// 修改密码表单
const passwordForm = ref({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.value.new_password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  old_password: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 提交修改密码
const handlePasswordSubmit = async () => {
  const valid = await passwordFormRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    await changePassword({
      old_password: passwordForm.value.old_password,
      new_password: passwordForm.value.new_password
    })
    ElMessage.success('密码修改成功，请重新登录')
    passwordDialogVisible.value = false
    await authStore.logout()
    router.push({ name: 'Login' })
  } catch (error) {
    // 错误已在拦截器中处理
  }
}
</script>

<style lang="scss" scoped>
.layout-container {
  width: 100%;
  height: 100vh;
  // 移动端浏览器动态视口适配
  height: 100dvh;
}

.sidebar {
  background: #304156;
  transition: width 0.3s;
  overflow: hidden;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2b3a4b;
    color: #fff;
    font-size: 20px;
    font-weight: bold;
    transition: all 0.3s;

    img {
      width: 32px;
      height: 32px;
      margin-right: 10px;
    }
  }

  .sidebar-menu {
    border-right: none;
    background: #304156;
  }

  :deep(.el-menu) {
    background: #304156;
  }

  :deep(.el-menu-item) {
    color: #bfcbd9;

    &:hover {
      background: #263445;
    }

    &.is-active {
      background: #409eff !important;
      color: #fff !important;
    }
  }

  // 菜单标题 + 徽标（红点数字）同行排列
  .menu-title-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  .menu-title-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // 自定义徽标（替代 el-badge 的绝对定位，避免偏下）：
  // 用 inline-flex 药丸 + 父级 align-items:center 实现精确垂直居中
  .menu-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    margin-left: auto; // 推到标题右侧
    box-sizing: border-box;
    border-radius: 9px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    color: #fff;
    cursor: pointer;
    user-select: none;
    transition: transform 0.15s ease;

    &:hover {
      transform: scale(1.08);
    }

    &.is-danger {
      background: #f56c6c;
    }

    &.is-warning {
      background: #e6a23c;
    }
  }

  // 让 popover 触发包裹层不撑高、与徽标一起垂直居中
  :deep(.el-popover__reference) {
    display: inline-flex;
    align-items: center;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;

  .header-left {
    display: flex;
    align-items: center;

    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      margin-right: 20px;

      &:hover {
        color: #409eff;
      }
    }
  }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;

      .header-icon {
        font-size: 20px;
        cursor: pointer;
        transition: color 0.3s;

        &:hover {
          color: #409eff;
        }
      }

      // 主题切换触发器：图标 + 文字 + 下拉箭头 的胶囊按钮
      .theme-trigger {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 32px;
        padding: 0 10px;
        border: 1px solid var(--c-border);
        border-radius: 999px;
        background: var(--c-bg-card);
        color: var(--c-text-regular);
        cursor: pointer;
        font-size: 13px;
        line-height: 1;
        transition: all 0.2s ease;

        &:hover {
          border-color: var(--c-primary);
          color: var(--c-primary);
        }

        &:focus-visible {
          outline: 2px solid var(--c-primary);
          outline-offset: 2px;
        }

        .trigger-ico {
          font-size: 16px;
        }

        .trigger-label {
          font-weight: 600;
          white-space: nowrap;
        }

        .trigger-caret {
          font-size: 12px;
          opacity: 0.7;
        }
      }

    .notice-badge {
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      .header-icon {
        font-size: 20px;

        &:hover {
          color: #409eff;
        }
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 0 10px;
      transition: background 0.3s;

      .username {
        margin: 0 8px;
        font-size: 14px;
      }

      &:hover {
        background: #f5f5f5;
        border-radius: 4px;
      }
    }
  }
}

.main-content {
  background: var(--c-bg-page);
  padding: 20px;
  overflow-y: auto;
  // 锁定滚动时防止滚动条消失导致的页面抖动
  scrollbar-gutter: stable;
}

// 暗色模式覆盖见文件末尾非 scoped 样式块（scoped 中 :global 嵌套会被编译器丢弃）。

// 页面切换动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<!--
  通知面板会随 el-popover 一起被传送（teleport）到 body 下，
  因此样式必须写在非 scoped 的样式块中，否则不会生效（面板会被撑开、溢出到系统可视区之外）。
-->
<style lang="scss">
.el-popper.notice-popper {
  padding: 0 !important;
  border-radius: 10px;
  overflow: hidden;
}

// 消息面板打开期间锁定整页滚动：
// 1. body 锁定 —— 防止某些页面内容超出时滚轮把文档滚出可视区、露出底部留白
// 2. 主内容区锁定 —— 防止滚轮在面板头部/底部等非列表区域滚动时穿透到背后的页面
html.notice-panel-open {
  body,
  .main-content {
    overflow: hidden !important;
  }
}

.notice-popper {
  .notice-panel {
    display: flex;
    flex-direction: column;
    // 固定长度：无论消息多少面板高度恒定，消息在内部滚动；
    // 小屏（笔记本/分屏）时按视口收缩，保证不超出屏幕
    height: min(480px, calc(100vh - 120px));
    height: min(480px, calc(100dvh - 120px));
    box-sizing: border-box;
    overflow: hidden;
  }

  .notice-panel-header {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px 10px;
    border-bottom: 1px solid #f0f0f0;
    background: #fff;

    .notice-title {
      display: flex;
      align-items: baseline;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
    }

    .notice-count {
      font-size: 12px;
      font-weight: 400;
      color: #f56c6c;
      background: #fef0f0;
      border-radius: 10px;
      padding: 1px 8px;
      line-height: 18px;
    }

    .notice-mark-all {
      font-size: 13px;
    }
  }

  .notice-tabs {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 0 12px;

    .el-tabs__header {
      margin: 0;
      flex: 0 0 auto;
    }

    .el-tabs__nav-wrap {
      padding: 0 2px;

      &::after {
        height: 1px;
        background-color: #f0f0f0;
      }
    }

    .el-tabs__item {
      height: 38px;
      line-height: 38px;
      font-size: 14px;
    }

    .el-tabs__content {
      flex: 1 1 auto;
      min-height: 0;
      // 真正的滚动容器：面板高度固定，这里内部滚动
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: #dcdfe6;
        border-radius: 3px;

        &:hover {
          background: #c0c4cc;
        }
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }
    }

    .el-tab-pane {
      padding-bottom: 4px;
    }
  }

  .notice-list {
    padding: 4px 2px 0;
  }

  .notice-item {
    display: flex;
    align-items: flex-start;
    padding: 10px 10px 10px 8px;
    border-bottom: 1px solid #f5f5f5;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    transition: background 0.2s;

    &:hover {
      background: #f5f7fa;
    }

    &.unread {
      background: #fbfcff;

      .notice-item-title {
        color: #303133;
        font-weight: 600;
      }
    }

    .notice-item-icon {
      flex: 0 0 auto;
      font-size: 18px;
      color: #409eff;
      margin-right: 10px;
      margin-top: 2px;
    }

    .notice-item-body {
      flex: 1;
      min-width: 0;

      .notice-item-title {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .notice-item-content {
        font-size: 13px;
        color: #606266;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-word;
      }

      .notice-item-time {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }
    }

    .notice-dot {
      flex: 0 0 auto;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f56c6c;
      margin: 5px 0 0 8px;
    }
  }

  .el-empty {
    padding: 24px 0;
  }

  .notice-panel-footer {
    flex: 0 0 auto;
    border-top: 1px solid #f0f0f0;
    text-align: center;
    background: #fff;

    .notice-view-all {
      width: 100%;
      height: 40px;
      margin: 0;
      font-size: 13px;

      .notice-view-all-icon {
        margin-left: 2px;
        transition: transform 0.2s;
      }

      &:hover .notice-view-all-icon {
        transform: translateX(2px);
      }
    }
  }
}

// 菜单徽标明细弹层（悬停菜单红点显示）
.el-popper.menu-badge-popper {
  padding: 0 !important;
  border-radius: 10px;
  overflow: hidden;

  .badge-panel {
    display: flex;
    flex-direction: column;
    max-height: min(420px, calc(100vh - 160px));
    box-sizing: border-box;
    overflow: hidden;
  }

  .badge-panel-header {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid #f0f0f0;
    background: #fff;

    .badge-panel-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }

    .badge-panel-count {
      font-size: 12px;
      color: #f56c6c;
      background: #fef0f0;
      border-radius: 10px;
      padding: 1px 8px;
      line-height: 18px;
    }
  }

  .badge-panel-list {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 6px 10px;
  }

  .badge-item {
    padding: 8px 8px 8px 6px;
    border-bottom: 1px solid #f5f5f5;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: #f5f7fa;
    }

    .badge-item-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
    }

    .badge-item-remain {
      font-size: 12px;
      font-weight: 600;
      color: #e6a23c;
      white-space: nowrap;
    }

    .badge-item-title {
      font-size: 13px;
      font-weight: 500;
      color: #303133;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge-item-desc {
      font-size: 12px;
      color: #606266;
      line-height: 1.5;
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge-item-deadline {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }

  .badge-panel-footer {
    flex: 0 0 auto;
    border-top: 1px solid #f0f0f0;
    text-align: center;
    background: #fff;
    padding: 4px 0;
  }
}

// 暗色模式下的通知面板
html.dark {
  // 框架暗色（侧边栏/顶栏/内容区）。
  // 与上面通知面板同因：必须写在这个非 scoped 全局块里才能命中。
  .layout-container {
    .sidebar {
      background: #141414;

      .logo {
        background: #0f0f0f;
        color: #e0e0e0;
      }

      .sidebar-menu,
      .el-menu {
        background: #141414;
      }

      .el-menu-item {
        color: #a3a6ad;

        &:hover {
          background: #1f1f1f;
        }

        &.is-active {
          background: #409eff;
          color: #fff;
        }
      }
    }

    .header {
      background: #1d1d1d;
      border-bottom-color: #2c2c2c;

      .el-breadcrumb__inner {
        color: #cfd3dc;

        &:hover {
          color: #409eff;
        }
      }

      .el-breadcrumb__item:last-child .el-breadcrumb__inner {
        color: #909399;
      }

      .user-info {
        color: #e0e0e0;

        &:hover {
          background: #2c2c2c;
        }
      }
    }

    .main-content {
      background: var(--c-bg-page);
    }
  }

  .el-popper.notice-popper {
    background: #1f1f1f;
    border-color: #2c2c2c;
  }

  // 暗色下的菜单徽标弹层
  .el-popper.menu-badge-popper {
    background: #1f1f1f;
    border-color: #2c2c2c;

    .badge-panel-header {
      background: #1f1f1f;
      border-bottom-color: #2c2c2c;

      .badge-panel-title {
        color: #e5eaf3;
      }

      .badge-panel-count {
        color: #f78989;
        background: rgba(245, 108, 108, 0.16);
      }
    }

    .badge-item {
      border-bottom-color: #2c2c2c;

      &:hover {
        background: #262626;
      }

      .badge-item-title {
        color: #e5eaf3;
      }

      .badge-item-desc {
        color: #a3a6ad;
      }

      .badge-item-deadline {
        color: #7b7f87;
      }
    }

    .badge-panel-footer {
      background: #1f1f1f;
      border-top-color: #2c2c2c;
    }
  }

  .notice-popper {
    .notice-panel-header {
      background: #1f1f1f;
      border-bottom-color: #2c2c2c;

      .notice-title {
        color: #e5eaf3;
      }

      .notice-count {
        color: #f78989;
        background: rgba(245, 108, 108, 0.16);
      }
    }

    .notice-tabs {
      .el-tabs__item {
        color: #c0c4cc;

        &.is-active {
          color: #409eff;
        }
      }

      .el-tabs__nav-wrap::after {
        background-color: #2c2c2c;
      }

      .el-tabs__content::-webkit-scrollbar-thumb {
        background: #4c4d4f;
      }
    }

    .notice-item {
      border-bottom-color: #2c2c2c;

      &:hover {
        background: #262626;
      }

      &.unread {
        background: rgba(64, 158, 255, 0.08);

        &:hover {
          background: rgba(64, 158, 255, 0.14);
        }
      }

      .notice-item-title {
        color: #e5eaf3;
      }

      .notice-item-content {
        color: #a3a6ad;
      }

      .notice-item-time {
        color: #7b7f87;
      }
    }

    .notice-panel-footer {
      background: #1f1f1f;
      border-top-color: #2c2c2c;
    }
  }
}

// 护眼主题下的框架配色（侧边栏保持深色铬，顶栏/内容区转暖色）
html.theme-eye {
  .layout-container {
    .header {
      background: var(--c-bg-card);
      border-bottom-color: var(--c-border-light);

      .el-breadcrumb__inner {
        color: var(--c-text-regular);

        &:hover {
          color: var(--c-primary);
        }
      }

      .el-breadcrumb__item:last-child .el-breadcrumb__inner {
        color: var(--c-text-secondary);
      }

      .user-info {
        color: var(--c-text-primary);

        &:hover {
          background: var(--c-bg-muted);
        }
      }
    }

    .main-content {
      background: var(--c-bg-page);
    }
  }

  // 护眼下的通知/徽标弹层（复用暖色 token）
  .el-popper.notice-popper,
  .el-popper.menu-badge-popper {
    background: var(--c-bg-card);
    border-color: var(--c-border-light);

    .notice-panel-header,
    .badge-panel-header {
      background: var(--c-bg-card);
      border-bottom-color: var(--c-border-light);

      .notice-title,
      .badge-panel-title {
        color: var(--c-text-primary);
      }
    }

    .notice-tabs {
      .el-tabs__item {
        color: var(--c-text-regular);

        &.is-active {
          color: var(--c-primary);
        }
      }

      .el-tabs__nav-wrap::after {
        background-color: var(--c-border-light);
      }
    }

    .notice-item {
      border-bottom-color: var(--c-border-light);

      &:hover {
        background: var(--c-bg-muted);
      }

      .notice-item-title {
        color: var(--c-text-primary);
      }

      .notice-item-content {
        color: var(--c-text-regular);
      }

      .notice-item-time {
        color: var(--c-text-secondary);
      }
    }

    .badge-item {
      border-bottom-color: var(--c-border-light);

      &:hover {
        background: var(--c-bg-muted);
      }

      .badge-item-title {
        color: var(--c-text-primary);
      }

      .badge-item-desc {
        color: var(--c-text-regular);
      }

      .badge-item-deadline {
        color: var(--c-text-secondary);
      }
    }

    .notice-panel-footer,
    .badge-panel-footer {
      background: var(--c-bg-card);
      border-top-color: var(--c-border-light);
    }
  }
}

// 主题下拉选项布局（图标 + 名称 + 说明 + 选中勾）
.theme-dropdown {
  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 224px;
    padding: 9px 12px;

    &.is-active {
      background: var(--c-bg-soft);
      color: var(--c-primary);
    }

    .theme-opt-ico {
      font-size: 16px;
      flex: 0 0 auto;
    }

    .theme-opt-label {
      flex: 0 0 auto;
      font-size: 14px;
      font-weight: 600;
    }

    .theme-opt-desc {
      flex: 1 1 auto;
      font-size: 12px;
      color: var(--c-text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .theme-opt-check {
      flex: 0 0 auto;
      font-size: 14px;
    }
  }
}
</style>
