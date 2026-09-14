<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-brand">
        <div class="brand-icon">♻️</div>
        <h1>电子产品回收综合服务平台</h1>
        <p>回 收 综 合 服 务 平 台 · 管 理 后 台</p>
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
      <div class="login-tip">独立于维修后台管理系统 · 默认账号 admin / admin123</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '../api'

const router = useRouter()
const form = ref({ username: '', password: '' })
const loading = ref(false)

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
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}

function onKey(e) {
  if (e.key === 'Enter') handleLogin()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.login-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f3d2b 0%, #2d5a40 55%, #3a7d54 100%);
  position: relative;
  overflow: hidden;
}
.login-page::before {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  top: -200px;
  right: -150px;
}
.login-page::after {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  bottom: -120px;
  left: -100px;
}
.login-box {
  width: 400px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 14px;
  padding: 38px 40px 28px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.25);
  z-index: 1;
}
.login-brand {
  text-align: center;
  margin-bottom: 26px;
}
.brand-icon {
  font-size: 46px;
}
.login-brand h1 {
  font-size: 20px;
  color: #1f3d2b;
  margin: 8px 0 4px;
}
.login-brand p {
  font-size: 12px;
  color: #8a9b90;
  letter-spacing: 2px;
}
.login-btn {
  width: 100%;
  margin-top: 4px;
  background: #2d5a40;
  border-color: #2d5a40;
}
.login-btn:hover {
  background: #3a7d54;
  border-color: #3a7d54;
}
.login-tip {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #a0aea6;
}
</style>
