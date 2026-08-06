<template>
  <div class="mini-login">
    <div class="mini-login-panel">
      <div class="mini-login-brand">
        <div class="mini-login-kicker">WeChat Mini Program</div>
        <h1>小程序后台管理系统</h1>
        <p>独立账号登录，统一接管订单、进度、用户与运营数据。</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="mini-login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="后台账号" size="large" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="登录密码" size="large" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button class="mini-login-btn" type="primary" size="large" :loading="loading" @click="handleLogin">
            登录小程序后台
          </el-button>
        </el-form-item>
      </el-form>

      <div class="mini-login-footer">
        默认账号：miniadmin / miniadmin123
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMiniAdminAuthStore } from '@/stores/miniAdminAuth'

const router = useRouter()
const route = useRoute()
const authStore = useMiniAdminAuthStore()

const loading = ref(false)
const loginFormRef = ref(null)
const loginForm = reactive({
  username: 'miniadmin',
  password: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入后台账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入登录密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  const valid = await loginFormRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const success = await authStore.login(loginForm.username, loginForm.password)
    if (success) {
      router.push(route.query.redirect || '/mini-admin/dashboard')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.mini-login {
  width: 100%;
  height: 100vh;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at top left, rgba(36, 99, 235, 0.26), transparent 28%),
    radial-gradient(circle at bottom right, rgba(22, 163, 74, 0.22), transparent 32%),
    linear-gradient(135deg, #e9f1fb 0%, #f8fafc 42%, #eef6ee 100%);
  padding: 24px;
}

.mini-login-panel {
  width: min(460px, 100%);
  padding: 36px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.72);
}

.mini-login-brand {
  margin-bottom: 28px;

  h1 {
    margin: 10px 0 12px;
    font-size: 30px;
    line-height: 1.1;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #475569;
    line-height: 1.6;
  }
}

.mini-login-kicker {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mini-login-btn {
  width: 100%;
  height: 48px;
}

.mini-login-footer {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
}
</style>
