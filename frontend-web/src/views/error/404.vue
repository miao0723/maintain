<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <p>抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push({ name: 'Dashboard' })
}
</script>

<style lang="scss" scoped>
.not-found {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ed 100%);
  position: relative;
  overflow: hidden;

  // 添加装饰性背景元素
  &::before {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
    top: -200px;
    right: -200px;
  }

  &::after {
    content: '';
    position: absolute;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(103, 194, 58, 0.1) 0%, rgba(103, 194, 58, 0.05) 100%);
    bottom: -150px;
    left: -150px;
  }

  .content {
    text-align: center;
    position: relative;
    z-index: 1;
    animation: fadeInUp 0.6s ease-out;

    h1 {
      font-size: 120px;
      color: #409eff;
      margin-bottom: 20px;
      font-weight: 800;
      text-shadow: 0 4px 8px rgba(64, 158, 255, 0.2);
      letter-spacing: -5px;
    }

    p {
      font-size: 18px;
      color: #606266;
      margin-bottom: 30px;
      font-weight: 500;
    }

    .el-button {
      padding: 12px 32px;
      font-size: 16px;
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(64, 158, 255, 0.3);
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

// 响应式设计
@media (max-width: 768px) {
  .not-found {
    .content {
      h1 {
        font-size: 80px;
      }

      p {
        font-size: 16px;
      }

      .el-button {
        padding: 10px 24px;
        font-size: 14px;
      }
    }
  }
}

@media (max-width: 480px) {
  .not-found {
    .content {
      h1 {
        font-size: 60px;
      }

      p {
        font-size: 14px;
      }
    }
  }
}
</style>
