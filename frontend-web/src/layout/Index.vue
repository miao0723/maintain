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
            <template #title>{{ route.meta?.title }}</template>
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
          <!-- 主题切换 -->
          <el-tooltip content="切换主题" placement="bottom">
            <el-icon class="header-icon" @click="themeStore.toggleTheme">
              <Moon v-if="themeStore.isDark" />
              <Sunny v-else />
            </el-icon>
          </el-tooltip>

          <!-- 通知 -->
          <el-popover
            v-model:visible="noticeVisible"
            placement="bottom-end"
            :width="380"
            trigger="click"
            popper-class="notice-popper"
            :offset="8"
            :show-arrow="false"
            @show="onNoticeShow"
          >
            <template #reference>
              <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" class="notice-badge">
                <el-icon class="header-icon">
                  <Bell />
                </el-icon>
              </el-badge>
            </template>

            <div class="notice-panel">
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
import { useThemeStore } from '@/stores/theme'
import { ElMessageBox, ElMessage } from 'element-plus'
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
  Sunny,
  Moon
} from '@element-plus/icons-vue'
import { changePassword } from '@/api/auth'
import { getUnreadCount, getNotifications, markAsRead, markAllAsRead } from '@/api/notification'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const isCollapse = ref(false)
const unreadCount = ref(0)
const passwordDialogVisible = ref(false)
const passwordFormRef = ref(null)

// 通知相关
const noticeVisible = ref(false)
const noticeTab = ref('unread')
const recentNotifications = ref([])
let unreadTimer = null

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

const onNoticeShow = () => {
  fetchRecent()
  fetchUnreadCount()
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

onMounted(() => {
  fetchUnreadCount()
  unreadTimer = setInterval(fetchUnreadCount, 30000)
})

onBeforeUnmount(() => {
  if (unreadTimer) clearInterval(unreadTimer)
})

// 路由切换后刷新未读角标（如从通知详情页返回）
watch(() => route.fullPath, () => {
  fetchUnreadCount()
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

  return mainRoutes.map(route => ({
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
      // 打开个人中心
      ElMessage.info('个人中心功能开发中')
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
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

// 暗色模式
:global(.dark) {
  .header {
    background: #1a1a1a;
    border-bottom-color: #2c2c2c;

    .header-left .collapse-btn:hover {
      color: #409eff;
    }

    .header-right {
      .header-icon:hover {
        color: #409eff;
      }

      .user-info {
        color: #e0e0e0;

        &:hover {
          background: #2c2c2c;
        }
      }
    }

    .el-breadcrumb {
      :deep(.el-breadcrumb__item) {
        .el-breadcrumb__inner {
          color: #e0e0e0;

          &:hover {
            color: #409eff;
          }
        }

        &:last-child .el-breadcrumb__inner {
          color: #909399;
        }
      }
    }
  }

  .main-content {
    background: #121212;
  }
}

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

.notice-popper {
  .notice-panel {
    display: flex;
    flex-direction: column;
    // 面板总高度上限：不超过视口，避免消息过多时撑出屏幕
    // （第一行为老浏览器兜底，不支持 min() 时忽略第二行）
    max-height: 520px;
    max-height: min(520px, calc(100vh - 90px));
    box-sizing: border-box;
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

// 暗色模式下的通知面板
html.dark {
  .el-popper.notice-popper {
    background: #1f1f1f;
    border-color: #2c2c2c;
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
</style>
