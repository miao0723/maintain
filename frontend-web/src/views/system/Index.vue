<template>
  <div class="system-page">
    <el-card>
      <el-result icon="info" title="系统管理模块开发中" sub-title="该功能正在开发中，敬请期待">
        <template #extra>
          <el-button type="primary" @click="$router.push({ name: 'Dashboard' })">返回首页</el-button>
        </template>
      </el-result>
    </el-card>
  </div>
</template>

<script setup>
// 系统管理模块 - 待开发
</script>

<style lang="scss" scoped>
.system-page {
  padding: 20px;
}
</style>
