<template>
  <div class="order-management">
    <el-card>
      <!-- 子菜单导航 -->
      <el-radio-group v-model="activeTab" @change="handleTabChange" class="order-tabs">
        <el-radio-button value="miniprogram">小程序订单</el-radio-button>
        <el-radio-button value="manual">手动创建订单</el-radio-button>
      </el-radio-group>

      <!-- 内容区域 -->
      <div class="order-content">
        <router-view />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = ref('miniprogram')

const updateActiveTab = () => {
  const path = route.path
  if (path.includes('/miniprogram')) {
    activeTab.value = 'miniprogram'
  } else if (path.includes('/manual')) {
    activeTab.value = 'manual'
  }
}

onMounted(() => {
  updateActiveTab()
})

watch(() => route.path, () => {
  updateActiveTab()
})

const handleTabChange = (tab) => {
  if (tab === 'miniprogram') {
    router.push('/repair/orders/miniprogram')
  } else if (tab === 'manual') {
    router.push('/repair/orders/manual')
  }
}
</script>

<style lang="scss" scoped>
.order-management {
  .order-tabs {
    margin-bottom: 20px;
  }

  .order-content {
    min-height: 400px;
  }
}
</style>
