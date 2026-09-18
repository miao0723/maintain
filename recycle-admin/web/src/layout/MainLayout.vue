<template>
  <el-container class="layout-root">
    <el-aside :width="collapsed ? '64px' : '220px'" class="layout-aside">
      <div class="logo-area" @click="$router.push('/dashboard')">
        <span class="logo-icon">♻️</span>
        <transition name="fade">
          <span v-if="!collapsed" class="logo-text">回收综合服务平台</span>
        </transition>
      </div>
      <el-menu
        :default-active="$route.path"
        :collapse="collapsed"
        :collapse-transition="false"
        background-color="#1f3d2b"
        text-color="#c8d8cd"
        active-text-color="#67c23a"
        router
      >
        <el-menu-item v-for="item in menus" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
      <div class="aside-footer" v-if="!collapsed">电子产品回收综合服务平台 V1.0</div>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="collapsed = !collapsed">
            <Expand v-if="collapsed" />
            <Fold v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>回收综合服务平台</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <!-- 主题切换：日夜滑块（与维修后台共用主题，两边同步） -->
          <button
            class="theme-switch"
            :class="{ 'is-dark': isDark }"
            aria-label="切换主题"
            :title="isDark ? '切换到白天模式' : '切换到夜间模式'"
            @click="onToggleTheme"
          >
            <span class="switch-track">
              <el-icon class="ico ico-moon"><Moon /></el-icon>
              <el-icon class="ico ico-sun"><Sunny /></el-icon>
              <span class="switch-knob"></span>
            </span>
          </button>

          <!-- 返回维修后台：同源部署，主系统会话仍在，直接进入 -->
          <el-button class="back-main-btn" text bg @click="backToMain">
            <el-icon style="margin-right:4px"><Back /></el-icon>
            返回维修系统
          </el-button>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="30" style="background:#67c23a">{{ adminName.substring(0, 1) }}</el-avatar>
              <span class="user-name">{{ adminName }}</span>
              <el-tag size="small" type="success">{{ roleLabel }}</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>

    <el-dialog v-model="pwdDialog" title="修改密码" width="420px">
      <el-form label-width="80px">
        <el-form-item label="原密码">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="至少6位" />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="pwdForm.confirm" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialog = false">取消</el-button>
        <el-button type="primary" :loading="pwdLoading" @click="submitPassword">确定</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { changePassword } from '../api'
import { toggleTheme, isDarkNow } from '../utils/theme'

const router = useRouter()
const collapsed = ref(false)

// ===== 主题切换 =====
const isDark = ref(isDarkNow())
const onToggleTheme = () => {
  toggleTheme()
  isDark.value = isDarkNow()
}
const onThemeChanged = () => { isDark.value = isDarkNow() }
onMounted(() => window.addEventListener('theme-changed', onThemeChanged))
onBeforeUnmount(() => window.removeEventListener('theme-changed', onThemeChanged))

const menus = [
  { path: '/dashboard', title: '数据看板', icon: 'Odometer' },
  { path: '/screen', title: '数据大屏', icon: 'DataLine' },
  { path: '/orders', title: '回收订单', icon: 'List' },
  { path: '/qc-orders', title: '质检单', icon: 'CircleCheck' },
  { path: '/qc-templates', title: '质检模板与标准', icon: 'SetUp' },
  { path: '/catalog', title: '设备配价库', icon: 'PriceTag' },
  { path: '/platforms', title: '回收平台管理', icon: 'Shop' },
  { path: '/links', title: '采购链接管理', icon: 'Link' },
  { path: '/pricing', title: '估价配置', icon: 'SetUp' },
  { path: '/logs', title: '操作日志', icon: 'Notebook' },
  { path: '/settings', title: '系统设置', icon: 'Setting' }
]

const adminInfo = JSON.parse(localStorage.getItem('recycle_admin_info') || '{}')
const adminName = computed(() => adminInfo.name || adminInfo.username || '管理员')
const roleLabel = computed(() => ({ super: '超级管理员', admin: '管理员', viewer: '只读' }[adminInfo.role] || '管理员'))

const pwdDialog = ref(false)
const pwdLoading = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '', confirm: '' })

// 与维修后台同源部署，根路径即主系统入口；主系统会话仍在，直接进入
function backToMain() {
  window.location.href = '/'
}

function handleCommand(cmd) {
  if (cmd === 'logout') {
    ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' }).then(() => {
      localStorage.removeItem('recycle_admin_token')
      localStorage.removeItem('recycle_admin_info')
      router.push('/login')
    }).catch(() => {})
  } else if (cmd === 'password') {
    pwdForm.value = { oldPassword: '', newPassword: '', confirm: '' }
    pwdDialog.value = true
  }
}

async function submitPassword() {
  const { oldPassword, newPassword, confirm } = pwdForm.value
  if (!oldPassword || !newPassword) return ElMessage.warning('请填写完整')
  if (newPassword !== confirm) return ElMessage.warning('两次输入的新密码不一致')
  pwdLoading.value = true
  try {
    await changePassword({ oldPassword, newPassword })
    ElMessage.success('密码已修改，下次登录请使用新密码')
    pwdDialog.value = false
  } finally {
    pwdLoading.value = false
  }
}
</script>

<style scoped>
.layout-root {
  height: 100%;
}
.layout-aside {
  background: #1f3d2b;
  transition: width 0.2s;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.logo-icon {
  font-size: 24px;
}
.logo-text {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}
.layout-aside :deep(.el-menu) {
  border-right: none;
  flex: 1;
}
.aside-footer {
  padding: 12px 10px;
  color: #7d9384;
  font-size: 11px;
  text-align: center;
  white-space: nowrap;
}
.layout-header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  height: 60px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}
/* 日夜切换滑块（与维修后台同款交互） */
.theme-switch {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  line-height: 1;
}
.theme-switch:focus-visible {
  outline: 2px solid #67c23a;
  outline-offset: 3px;
  border-radius: 999px;
}
.theme-switch .switch-track {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 58px;
  height: 28px;
  padding: 0 6px;
  box-sizing: border-box;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffd591, #ff9c3e);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.18);
  transition: background 0.35s ease;
}
.theme-switch .ico {
  position: relative;
  z-index: 1;
  font-size: 14px;
  transition: color 0.3s ease;
}
.theme-switch .ico-moon { color: rgba(255, 255, 255, 0.6); }
.theme-switch .ico-sun { color: #fff; }
.theme-switch .switch-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
  transition: transform 0.35s cubic-bezier(0.4, 2, 0.6, 1), background 0.35s ease;
}
.theme-switch.is-dark .switch-track { background: linear-gradient(135deg, #3b4b8f, #1c2657); }
.theme-switch.is-dark .ico-moon { color: #ffd86b; }
.theme-switch.is-dark .ico-sun { color: rgba(255, 255, 255, 0.45); }
.theme-switch.is-dark .switch-knob {
  transform: translateX(30px);
  background: radial-gradient(circle at 35% 35%, #f5f7ff, #c9d2f5);
}
.back-main-btn {
  color: #2d5a40;
  --el-button-bg-color: #f0f9eb;
  --el-button-hover-bg-color: #e1f3d8;
  --el-button-hover-border-color: #c2e7b0;
}
.header-right .user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.user-name {
  font-size: 14px;
  color: #303133;
}
.layout-main {
  padding: 16px;
  overflow-y: auto;
}
</style>
