<template>
  <div class="mini-dashboard">
    <el-row :gutter="16">
      <el-col :span="6" v-for="card in cards" :key="card.title">
        <el-card shadow="hover" class="dashboard-card">
          <div class="dashboard-value">{{ card.value }}</div>
          <div class="dashboard-title">{{ card.title }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import { getMiniAdminProgressStatistics, getMiniAdminUsers, getMiniAdminOrders } from '@/api/miniAdmin'

const state = reactive({
  orderTotal: 0,
  pending: 0,
  completed: 0,
  userTotal: 0
})

const cards = computed(() => [
  { title: '订单总数', value: state.orderTotal },
  { title: '待处理订单', value: state.pending },
  { title: '已完成订单', value: state.completed },
  { title: '小程序用户', value: state.userTotal }
])

onMounted(async () => {
  try {
    const [statsRes, usersRes, ordersRes] = await Promise.all([
      getMiniAdminProgressStatistics(),
      getMiniAdminUsers({ page: 1, pageSize: 1 }),
      getMiniAdminOrders({ page: 1, pageSize: 1 })
    ])

    const stats = statsRes.data || {}
    state.orderTotal = ordersRes.data?.total || 0
    state.pending = stats.pending || 0
    state.completed = stats.completed || 0
    state.userTotal = usersRes.data?.total || 0
  } catch {
    // ignore dashboard fetch errors
  }
})
</script>

<style scoped lang="scss">
.dashboard-card {
  min-height: 124px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.dashboard-value {
  font-size: 36px;
  font-weight: 700;
  color: #0f172a;
}

.dashboard-title {
  margin-top: 8px;
  color: #64748b;
}
</style>
