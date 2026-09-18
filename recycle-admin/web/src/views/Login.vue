<template>
  <div class="login-page">
    <!-- 背景装饰：柔光斑 + 网格 -->
    <div class="bg-grid"></div>
    <div class="bg-orb orb-a"></div>
    <div class="bg-orb orb-b"></div>
    <div class="bg-orb orb-c"></div>

    <div class="login-box">
      <div class="login-brand">
        <div class="brand-mark">♻️</div>
        <h1>电子产品回收综合服务平台</h1>
        <p>回 收 综 合 服 务 平 台 · 管 理 后 台</p>
      </div>

      <!-- 维修后台单点登录：同源 localStorage 里有主系统 token 时自动进入 -->
      <div v-if="ssoState !== 'off'" class="sso-panel" :class="ssoState">
        <template v-if="ssoState === 'loading'">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>检测到维修后台登录，正在自动进入...</span>
        </template>
        <template v-else-if="ssoState === 'failed'">
          <el-icon color="#e6a23c"><WarningFilled /></el-icon>
          <span>自动登录失败（{{ ssoMessage }}），请使用回收后台账号登录</span>
        </template>
      </div>

      <el-form :model="form" size="large" @keyup.enter="handleLogin">
        <el-form-item>
          <el-input v-model="form.username" placeholder="管理员账号" :prefix-icon="User" clearable />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>
      </el-form>
      <div class="login-tip">与维修后台同一账号体系 · 从维修后台首页可直接免密进入</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Loading, WarningFilled } from '@element-plus/icons-vue'
import { login, ssoLogin } from '../api'

const router = useRouter()
const route = useRoute()
// 登录（手动/SSO）成功后回到进入登录页前的目标页
const redirectAfterLogin = () => (route.query.redirect ? String(route.query.redirect) : '/dashboard')
const form = ref({ username: '', password: '' })
const loading = ref(false)
// off=不尝试 / loading=SSO进行中 / failed=回退到手动登录
const ssoState = ref('off')
const ssoMessage = ref('')

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    const res = await login(form.value)
    localStorage.setItem('recycle_admin_token', res.data.token)
    localStorage.setItem('recycle_admin_info', JSON.stringify(res.data.admin))
    ElMessage.success(`欢迎，${res.data.admin.name || res.data.admin.username}`)
    router.push(redirectAfterLogin())
  } finally {
    loading.value = false
  }
}

// 与维修后台同源部署，主系统 token 在 localStorage['token']；
// 有则换取回收系统会话直接进入，失败则回退到账号密码登录
async function trySsoLogin() {
  const mainToken = localStorage.getItem('token')
  if (!mainToken || localStorage.getItem('recycle_admin_token')) return
  ssoState.value = 'loading'
  try {
    const res = await ssoLogin(mainToken)
    localStorage.setItem('recycle_admin_token', res.data.token)
    localStorage.setItem('recycle_admin_info', JSON.stringify(res.data.admin))
    ElMessage.success(`已自动登录，欢迎 ${res.data.admin.name || res.data.admin.username}`)
    router.replace(redirectAfterLogin())
  } catch (e) {
    ssoState.value = 'failed'
    ssoMessage.value = e?.response?.data?.message || '维修后台凭证无效'
  }
}

function onKey(e) {
  if (e.key === 'Enter') handleLogin()
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
  trySsoLogin()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.login-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(900px 600px at 18% 22%, rgba(103, 194, 58, 0.22), transparent 60%),
    radial-gradient(800px 500px at 82% 78%, rgba(45, 212, 191, 0.16), transparent 60%),
    linear-gradient(135deg, #12291c 0%, #1f3d2b 55%, #2d5a40 100%);
}

/* 细网格，增强科技感 */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
}

/* 漂浮光斑 */
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.5;
  animation: orb-float 14s ease-in-out infinite alternate;
}
.orb-a {
  width: 420px;
  height: 420px;
  top: -120px;
  right: -80px;
  background: radial-gradient(circle, rgba(149, 212, 117, 0.5), transparent 70%);
}
.orb-b {
  width: 360px;
  height: 360px;
  bottom: -100px;
  left: -90px;
  background: radial-gradient(circle, rgba(45, 212, 191, 0.35), transparent 70%);
  animation-delay: -5s;
}
.orb-c {
  width: 240px;
  height: 240px;
  top: 55%;
  left: 60%;
  background: radial-gradient(circle, rgba(230, 220, 120, 0.25), transparent 70%);
  animation-delay: -9s;
}

@keyframes orb-float {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(30px, -24px) scale(1.08); }
}

.login-box {
  position: relative;
  z-index: 1;
  width: 400px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 18px;
  padding: 40px 40px 28px;
  box-shadow:
    0 20px 60px rgba(6, 24, 14, 0.45),
    0 4px 16px rgba(6, 24, 14, 0.18);
  animation: box-in 0.5s ease-out;
}

@keyframes box-in {
  from { opacity: 0; transform: translateY(18px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.login-brand {
  text-align: center;
  margin-bottom: 24px;
}
.brand-mark {
  width: 68px;
  height: 68px;
  margin: 0 auto 16px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  background: linear-gradient(135deg, #67c23a 0%, #3a9d5d 55%, #2d5a40 100%);
  box-shadow:
    0 10px 24px rgba(58, 157, 93, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.login-brand h1 {
  font-size: 20px;
  color: #1f3d2b;
  margin: 0 0 6px;
}
.login-brand p {
  font-size: 12px;
  color: #8a9b90;
  letter-spacing: 2px;
}
.login-btn {
  width: 100%;
  margin-top: 4px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 6px;
  background: linear-gradient(135deg, #67c23a 0%, #3a9d5d 100%);
  box-shadow: 0 8px 20px rgba(58, 157, 93, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.login-btn:hover,
.login-btn:focus {
  background: linear-gradient(135deg, #79d04f 0%, #43a96a 100%);
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(58, 157, 93, 0.45);
}
.login-btn:active {
  transform: translateY(0);
}
.login-tip {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #a0aea6;
}
.sso-panel {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
}
.sso-panel.loading {
  background: #f0f9eb;
  color: #67c23a;
}
.sso-panel.failed {
  background: #fdf6ec;
  color: #b88230;
}
</style>
