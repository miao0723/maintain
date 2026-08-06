<template>
  <div class="inventory-page">
    <el-card>
      <el-result icon="info" title="备件库存管理模块开发中" sub-title="该功能正在开发中，敬请期待">
        <template #extra>
          <el-button type="primary" @click="$router.push({ name: 'Dashboard' })">返回首页</el-button>
        </template>
      </el-result>
    </el-card>
  </div>
</template>

<script setup>
// 备件库存管理模块 - 待开发
</script>

<style lang="scss" scoped>
.inventory-page {
  padding: 20px;
}
</style>
