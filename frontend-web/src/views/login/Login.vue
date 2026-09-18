<template>
  <div class="login-container">
    <!-- 背景装饰：柔光斑 + 网格 -->
    <div class="bg-grid"></div>
    <div class="bg-orb orb-a"></div>
    <div class="bg-orb orb-b"></div>
    <div class="bg-orb orb-c"></div>

    <div class="login-box">
      <div class="login-header">
        <div class="logo-mark">
          <el-icon><Tools /></el-icon>
        </div>
        <h1>CMMS维修全流程管理系统</h1>
        <p>Computerized Maintenance Management System</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>电子设备维修 · 回收 · 全流程数字化管理平台</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  const valid = await loginFormRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const success = await authStore.login(loginForm.username, loginForm.password)
    if (success) {
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(900px 600px at 15% 20%, rgba(59, 130, 246, 0.25), transparent 60%),
    radial-gradient(800px 500px at 85% 80%, rgba(45, 212, 191, 0.18), transparent 60%),
    linear-gradient(135deg, #0b1e3f 0%, #10316b 55%, #164691 100%);
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
  background: radial-gradient(circle, rgba(96, 165, 250, 0.55), transparent 70%);
}
.orb-b {
  width: 360px;
  height: 360px;
  bottom: -100px;
  left: -90px;
  background: radial-gradient(circle, rgba(45, 212, 191, 0.4), transparent 70%);
  animation-delay: -5s;
}
.orb-c {
  width: 240px;
  height: 240px;
  top: 55%;
  left: 60%;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.35), transparent 70%);
  animation-delay: -9s;
}

@keyframes orb-float {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(30px, -24px) scale(1.08); }
}

.login-box {
  position: relative;
  z-index: 1;
  width: 420px;
  padding: 44px 42px 32px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(18px);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow:
    0 20px 60px rgba(4, 15, 40, 0.45),
    0 4px 16px rgba(4, 15, 40, 0.18);

  animation: box-in 0.5s ease-out;
}

@keyframes box-in {
  from { opacity: 0; transform: translateY(18px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.login-header {
  text-align: center;
  margin-bottom: 34px;

  .logo-mark {
    width: 68px;
    height: 68px;
    margin: 0 auto 18px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 55%, #0ea5e9 100%);
    box-shadow:
      0 10px 24px rgba(37, 99, 235, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);

    .el-icon {
      font-size: 34px;
    }
  }

  h1 {
    font-size: 23px;
    font-weight: 700;
    color: #1a2b4a;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  p {
    font-size: 12px;
    color: #8b9bb4;
    letter-spacing: 2.5px;
    text-transform: uppercase;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 22px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    padding: 4px 14px;
    box-shadow: 0 0 0 1px #dce3ee inset;

    &:hover {
      box-shadow: 0 0 0 1px #b9c8e0 inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px #2563eb inset, 0 0 0 3px rgba(37, 99, 235, 0.12);
    }
  }
}

.login-btn {
  width: 100%;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 6px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover,
  &:focus {
    background: linear-gradient(135deg, #4f92f8 0%, #2b6ef0 100%);
    transform: translateY(-1px);
    box-shadow: 0 12px 26px rgba(37, 99, 235, 0.45);
  }

  &:active {
    transform: translateY(0);
  }
}

.login-footer {
  margin-top: 18px;
  text-align: center;

  p {
    font-size: 12px;
    color: #a3b0c4;
    letter-spacing: 1px;
  }
}
</style>
