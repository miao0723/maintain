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
            :width="360"
            trigger="click"
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
                <span class="notice-title">消息通知</span>
                <div class="notice-actions">
                  <el-link
                    v-if="unreadCount > 0"
                    type="primary"
                    :underline="false"
                    @click="handleMarkAllAsRead"
                  >全部已读</el-link>
                  <el-link type="info" :underline="false" @click="goToNotifications">查看全部</el-link>
                </div>
              </div>

              <el-tabs v-model="noticeTab" class="notice-tabs">
                <el-tab-pane label="未读" name="unread">
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

      .header-icon {
        font-size: 20px;

        &:hover {
          color: #409eff;
        }
      }
    }

    // 通知下拉面板
    .notice-panel {
      .notice-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 8px;
        border-bottom: 1px solid #f0f0f0;

        .notice-title {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }

        .notice-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
      }

      .notice-tabs {
        :deep(.el-tabs__header) {
          margin-top: 8px;
          margin-bottom: 4px;
        }

        .notice-list {
          max-height: 360px;
          overflow-y: auto;
        }

        .notice-item {
          display: flex;
          align-items: flex-start;
          padding: 10px 8px;
          border-bottom: 1px solid #f5f5f5;
          cursor: pointer;
          position: relative;
          transition: background 0.2s;

          &:hover {
            background: #f5f7fa;
          }

          &.unread {
            background: #fbfcff;
          }

          .notice-item-icon {
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
            }

            .notice-item-content {
              font-size: 13px;
              color: #606266;
              line-height: 1.5;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }

            .notice-item-time {
              font-size: 12px;
              color: #909399;
              margin-top: 4px;
            }
          }

          .notice-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #f56c6c;
            position: absolute;
            top: 14px;
            right: 4px;
          }
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
