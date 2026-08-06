<template>
  <div class="module-container">
    <!-- 横向 Tab 导航 -->
    <el-menu
      class="module-top-menu"
      mode="horizontal"
      :default-active="activeTab"
      @select="handleMenuSelect"
    >
      <el-menu-item v-for="tab in tabs" :key="tab.name" :index="tab.name">
        {{ tab.title }}
      </el-menu-item>
    </el-menu>

    <!-- 内容区域 -->
    <div class="module-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const tabs = [
  { name: 'categories', title: '机械种类管理', path: '/repair/categories' },
  { name: 'machines', title: '机械名称管理', path: '/repair/machines' },
  { name: 'orders', title: '订单管理', path: '/repair/orders/miniprogram' },
  { name: 'test-report', title: '检测报告', path: '/repair/test-report/records' },
  { name: 'measure-report', title: '测试报告', path: '/repair/measure-report' },
  { name: 'repair-report', title: '维修报告', path: '/repair/repair-report' },
  { name: 'contract', title: '合同管理', path: '/repair/contract' },
  { name: 'reminder', title: '维修提醒', path: '/repair/reminder' },
  { name: 'external', title: '联动维修', path: '/repair/external' },
  { name: 'progress', title: '维修进度', path: '/repair/progress/apply' }
]

const activeTab = computed(() => {
  const path = route.path
  if (path.startsWith('/repair/orders')) {
    return 'orders'
  }
  if (path.startsWith('/repair/test-report')) {
    return 'test-report'
  }
  if (path.startsWith('/repair/progress')) {
    return 'progress'
  }
  if (path.startsWith('/repair/contract')) {
    return 'contract'
  }
  const tab = tabs.find(t => path.startsWith(t.path))
  if (tab) {
    return tab.name
  }
  return 'categories'
})

const handleMenuSelect = (name) => {
  const tab = tabs.find(t => t.name === name)
  if (!tab) return
  if (route.path.startsWith(tab.path)) return
  router.push(tab.path).catch(() => {})
}
</script>

<style lang="scss" scoped>
@import './module-common.scss';
</style>
