<template>
  <div class="mini-dashboard">
    <!-- 维修 / 回收 快捷跳转入口（带待办数提醒），与主后台首页保持一致 -->
    <el-card class="quick-entry-card" shadow="never">
      <div class="quick-entry">
        <div class="entry-item repair" @click="goRepair" title="进入维修订单管理">
          <el-badge :value="pendingRepairCount" :hidden="pendingRepairCount === 0" :max="99">
            <div class="entry-inner">
              <span class="entry-icon">🔧</span>
              <div class="entry-text">
                <div class="entry-title">维修工作台</div>
                <div class="entry-desc">小程序维修订单 / 进度 / 评价管理</div>
              </div>
            </div>
          </el-badge>
        </div>
        <div class="entry-item recycle" @click="goRecycle" title="新窗口打开回收综合服务平台">
          <el-badge :value="pendingRecycleCount" :hidden="pendingRecycleCount === 0" :max="99">
            <div class="entry-inner">
              <span class="entry-icon">♻️</span>
              <div class="entry-text">
                <div class="entry-title">回收管理平台</div>
                <div class="entry-desc">配价库 / 回收订单管理（独立网页）</div>
              </div>
            </div>
          </el-badge>
        </div>
        <div class="entry-todos">
          <div class="todo-chip repair" @click="goPendingOrders('repair')" title="查看待处理维修订单">
            待处理维修 <b>{{ pendingRepairCount }}</b>
          </div>
          <div class="todo-chip recycle" @click="goPendingOrders('recycle')" title="查看待报价回收订单">
            待报价回收 <b>{{ pendingRecycleCount }}</b>
          </div>
        </div>
      </div>
    </el-card>

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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getMiniAdminProgressStatistics, getMiniAdminUsers, getMiniAdminOrders } from '@/api/miniAdmin'

const router = useRouter()

const state = reactive({
  orderTotal: 0,
  pending: 0,
  completed: 0,
  userTotal: 0
})

// 待办数：待处理维修单 / 待报价回收单（与主后台首页口径一致）
const pendingRepairCount = ref(0)
const pendingRecycleCount = ref(0)

const cards = computed(() => [
  { title: '订单总数', value: state.orderTotal },
  { title: '待处理订单', value: state.pending },
  { title: '已完成订单', value: state.completed },
  { title: '小程序用户', value: state.userTotal }
])

// 维修：跳转小程序管理工作台的订单管理
const goRepair = () => {
  router.push('/mini-admin/orders')
}

// 回收：新标签打开独立的回收综合服务网页（经 443 网关 /recycle-admin/ 子路径）
const goRecycle = () => {
  window.open('/recycle-admin/', '_blank')
}

// 深链到筛选好的订单列表（MiniprogramOrders 支持从 query 预填筛选条件）
const goPendingOrders = (orderType) => {
  router.push({ path: '/mini-admin/orders', query: { order_type: orderType, status: 'pending' } })
}

onMounted(async () => {
  try {
    const [statsRes, usersRes, ordersRes, repairRes, recycleRes] = await Promise.all([
      getMiniAdminProgressStatistics(),
      getMiniAdminUsers({ page: 1, pageSize: 1 }),
      getMiniAdminOrders({ page: 1, pageSize: 1 }),
      getMiniAdminOrders({ page: 1, pageSize: 1, order_type: 'repair', status: 'pending' }),
      getMiniAdminOrders({ page: 1, pageSize: 1, order_type: 'recycle', status: 'pending' })
    ])

    const stats = statsRes.data || {}
    state.orderTotal = ordersRes.data?.total || 0
    state.pending = stats.pending || 0
    state.completed = stats.completed || 0
    state.userTotal = usersRes.data?.total || 0
    pendingRepairCount.value = Number(repairRes.data?.total ?? 0) || 0
    pendingRecycleCount.value = Number(recycleRes.data?.total ?? 0) || 0
  } catch {
    // ignore dashboard fetch errors
  }
})
</script>

<style scoped lang="scss">
.quick-entry-card {
  margin-bottom: 16px;
  border: none;
  background: linear-gradient(135deg, #f0f7ff 0%, #f6fbf4 100%);

  .quick-entry {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .entry-item {
    display: flex;
    align-items: center;
    padding: 16px 26px;
    border-radius: 14px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

    .entry-inner {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .entry-icon {
      font-size: 32px;
      line-height: 1;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12));
    }

    .entry-title {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .entry-desc {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }

    &.repair {
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.10), rgba(64, 158, 255, 0.04));

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(64, 158, 255, 0.25);
        border-color: rgba(64, 158, 255, 0.5);
      }
    }

    &.recycle {
      background: linear-gradient(135deg, rgba(103, 194, 58, 0.10), rgba(103, 194, 58, 0.04));

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(103, 194, 58, 0.25);
        border-color: rgba(103, 194, 58, 0.5);
      }
    }
  }

  .entry-todos {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .todo-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;

      b {
        font-size: 14px;
      }

      &.repair {
        color: #409eff;
        background: rgba(64, 158, 255, 0.08);

        &:hover {
          background: rgba(64, 158, 255, 0.18);
          border-color: rgba(64, 158, 255, 0.4);
        }
      }

      &.recycle {
        color: #67c23a;
        background: rgba(103, 194, 58, 0.08);

        &:hover {
          background: rgba(103, 194, 58, 0.18);
          border-color: rgba(103, 194, 58, 0.4);
        }
      }
    }
  }
}

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
