<template>
  <div class="coming-soon-container">
    <el-card shadow="never">
      <el-result
        icon="clock"
        title="引流管理模块"
        sub-title="该功能正在开发中，敬请期待"
      >
        <template #extra>
          <el-space direction="vertical" :size="20">
            <div class="feature-list">
              <h4>即将上线功能：</h4>
              <ul>
                <li>营销活动管理</li>
                <li>优惠券管理</li>
                <li>客户来源追踪</li>
                <li>渠道管理</li>
                <li>推广效果分析</li>
                <li>客户转化漏斗</li>
              </ul>
            </div>
            <el-button type="primary" @click="goBack">返回首页</el-button>
          </el-space>
        </template>
      </el-result>
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push({ name: 'Dashboard' })
}
</script>

<style lang="scss" scoped>
.coming-soon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;

  .el-card {
    width: 100%;
    max-width: 600px;
  }

  .feature-list {
    text-align: left;
    background: #f5f7fa;
    padding: 20px;
    border-radius: 8px;

    h4 {
      margin: 0 0 15px 0;
      color: #303133;
    }

    ul {
      margin: 0;
      padding-left: 20px;
      color: #606266;

      li {
        margin-bottom: 8px;
      }
    }
  }
}
</style>
