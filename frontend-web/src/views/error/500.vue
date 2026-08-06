<template>
  <div class="server-error">
    <div class="content">
      <div class="error-illustration">
        <el-icon :size="100" color="#e6a23c">
          <WarningFilled />
        </el-icon>
      </div>
      <h1>服务器错误</h1>
      <p>抱歉，服务器出现了一些问题</p>
      <p class="error-detail">{{ errorMessage || '请稍后重试或联系系统管理员' }}</p>
      <div class="action-buttons">
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <el-button @click="goBack">返回上一页</el-button>
      </div>
      <div class="help-text">
        <p>如果问题持续存在，请联系技术支持</p>
        <p class="contact-info">技术支持电话：400-XXX-XXXX</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()
const errorMessage = ref('')

onMounted(() => {
  // 从路由参数或存储中获取错误信息
  errorMessage.value = router.currentRoute.value.query.message || ''
})

const goHome = () => {
  router.push({ name: 'Dashboard' })
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    goHome()
  }
}
</script>

<style lang="scss" scoped>
.server-error {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff5f5 0%, #ffeef0 100%);
  position: relative;
  overflow: hidden;

  // 添加装饰性背景元素
  &::before {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(230, 162, 60, 0.1) 0%, rgba(230, 162, 60, 0.05) 100%);
    top: -200px;
    right: -200px;
  }

  &::after {
    content: '';
    position: absolute;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(245, 108, 108, 0.1) 0%, rgba(245, 108, 108, 0.05) 100%);
    bottom: -150px;
    left: -150px;
  }

  .content {
    text-align: center;
    position: relative;
    z-index: 1;
    animation: fadeInUp 0.6s ease-out;
    max-width: 600px;
    padding: 20px;

    .error-illustration {
      margin-bottom: 30px;
      animation: shake 2.5s ease-in-out infinite;
    }

    h1 {
      font-size: 48px;
      color: #e6a23c;
      margin-bottom: 20px;
      font-weight: 700;
    }

    p {
      font-size: 18px;
      color: #606266;
      margin-bottom: 30px;
      font-weight: 500;

      &.error-detail {
        font-size: 16px;
        color: #e6a23c;
        background: rgba(230, 162, 60, 0.1);
        padding: 12px 20px;
        border-radius: 8px;
        margin-bottom: 20px;
      }
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 30px;

      .el-button {
        padding: 12px 32px;
        font-size: 16px;
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }
      }
    }

    .help-text {
      background: rgba(255, 255, 255, 0.8);
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      p {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;

        &.contact-info {
          font-weight: 600;
          color: #606266;
        }
      }
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-3deg);
  }
  75% {
    transform: rotate(3deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .server-error {
    .content {
      h1 {
        font-size: 36px;
      }

      p {
        font-size: 16px;
      }

      .action-buttons {
        flex-direction: column;

        .el-button {
          width: 100%;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .server-error {
    .content {
      h1 {
        font-size: 28px;
      }

      p {
        font-size: 14px;
      }

      .help-text {
        padding: 15px;
      }
    }
  }
}
</style>
