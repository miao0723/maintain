<template>
  <div class="dashboard">
    <!-- 维修 / 回收 快捷跳转入口（带未读消息提醒） -->
    <el-card class="quick-entry-card" shadow="never">
      <div class="quick-entry">
        <div
          class="entry-item repair"
          @click="goRepair"
          :title="`维修工作台：${repairCountText} 笔小程序维修单待处理`"
        >
          <el-badge :value="pendingRepairCount" :hidden="!pendingRepairCount" :max="99">
            <div class="entry-icon">
              <el-icon><Tools /></el-icon>
            </div>
          </el-badge>
          <div class="entry-text">
            <div class="entry-title">
              维修工作台
              <el-icon class="entry-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="entry-desc">小程序维修订单 / 进度 / 评价管理</div>
          </div>
        </div>
        <div
          class="entry-item recycle"
          @click="goRecycle"
          :title="`回收管理平台：${recycleCountText} 笔回收单待确认报价（角标为待办数，非未读消息）`"
        >
          <el-badge :value="pendingRecycleCount" :hidden="!pendingRecycleCount" :max="99">
            <div class="entry-icon">
              <el-icon><Sell /></el-icon>
            </div>
          </el-badge>
          <div class="entry-text">
            <div class="entry-title">
              回收管理平台
              <el-icon class="entry-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="entry-desc">配价库 / 回收订单管理（独立网页）</div>
          </div>
        </div>
        <div class="entry-todos">
          <div class="todo-chip repair" @click="goPendingRepairOrders" title="查看待处理维修订单">
            待处理维修 <b>{{ repairCountText }}</b>
          </div>
          <div class="todo-chip recycle" @click="goPendingRecycleOrders" title="查看待报价回收订单">
            待报价回收 <b>{{ recycleCountText }}</b>
          </div>
        </div>
        <div class="entry-actions">
          <div
            class="entry-tip"
            :class="{ active: unreadCount > 0 }"
            @click="goNotifications"
            title="查看通知消息"
          >
            <el-icon><Bell /></el-icon>
            <span v-if="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }} 条未读</span>
            <span v-else>暂无未读</span>
          </div>
          <el-button class="refresh-btn" :icon="Refresh" circle :loading="loading" title="刷新数据" @click="refreshAll" />
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card clickable" shadow="hover" @click="goToOrders">
          <div class="stat-content">
            <div class="stat-icon icon-blue">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.total_orders || 0 }}</div>
              <div class="stat-label">总工单数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card clickable" shadow="hover" @click="goToOrders">
          <div class="stat-content">
            <div class="stat-icon icon-orange">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.pending_orders || 0 }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card clickable" shadow="hover" @click="goToOrders">
          <div class="stat-content">
            <div class="stat-icon icon-green">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.completed_orders || 0 }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon icon-red">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.total_devices || 0 }}</div>
              <div class="stat-label">设备总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>近6个月工单趋势</span>
          </template>
          <div ref="trendChartRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>故障类型分布</span>
          </template>
          <div ref="faultChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>设备状态分布</span>
          </template>
          <div ref="deviceChartRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>维修工程师工单量</span>
          </template>
          <div ref="engineerChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>最新工单</span>
              <el-button type="primary" link @click="goToOrders">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" v-loading="loading" style="width: 100%">
            <el-table-column prop="order_id" label="订单号" width="170" />
            <el-table-column prop="device_model" label="设备型号" min-width="160" />
            <el-table-column prop="problem_description" label="问题描述" min-width="220" show-overflow-tooltip />
            <el-table-column prop="priority" label="优先级" width="100">
              <template #default="{ row }">
                <el-tag :type="getPriorityType(row.priority)" size="small">
                  {{ getPriorityText(row.priority) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { Bell, Refresh } from '@element-plus/icons-vue'
import { getDashboardStatistics } from '@/api/dashboard'
import { getUnreadCount } from '@/api/notification'
import { getMiniAdminOrders } from '@/api/miniAdmin'

const router = useRouter()

const unreadCount = ref(0)
// null = 尚未取到（显示 — 而非误导性的 0）；取数失败保留 null，等待下次刷新
const pendingRepairCount = ref(null)
const pendingRecycleCount = ref(null)
const loading = ref(false)
// 未读消息与待办订单每 60 秒自动刷新一次
const UNREAD_REFRESH_INTERVAL = 60000
let unreadTimer = null

const fetchUnreadCount = async () => {
  try {
    const res = await getUnreadCount()
    unreadCount.value = Number(res.data?.count ?? res.data ?? 0) || 0
  } catch (error) {
    console.warn('[Dashboard] 获取未读消息数失败:', error)
  }
}

// 小程序订单真实待办数：待处理维修单 / 待报价回收单
// 失败时不回退为 0 —— “明明有单却显示 0”会造成漏单，保持 null 由模板显示占位符
const fetchPendingOrders = async () => {
  try {
    const [repairRes, recycleRes] = await Promise.all([
      getMiniAdminOrders({ page: 1, pageSize: 1, order_type: 'repair', status: 'pending' }),
      getMiniAdminOrders({ page: 1, pageSize: 1, order_type: 'recycle', status: 'pending' })
    ])
    pendingRepairCount.value = Number(repairRes.data?.total ?? 0) || 0
    pendingRecycleCount.value = Number(recycleRes.data?.total ?? 0) || 0
  } catch (error) {
    console.warn('[Dashboard] 获取待办订单数失败:', error)
  }
}

// 模板显示用：null → '—'
const repairCountText = computed(() => (pendingRepairCount.value === null ? '—' : pendingRepairCount.value))
const recycleCountText = computed(() => (pendingRecycleCount.value === null ? '—' : pendingRecycleCount.value))

const refreshAll = async () => {
  loading.value = true
  try {
    await Promise.all([loadDashboardData(), fetchUnreadCount(), fetchPendingOrders()])
  } finally {
    loading.value = false
  }
}

// 维修：系统内跳转到维修订单管理
const goRepair = () => {
  router.push('/repair/orders/miniprogram')
}

// 回收：新标签打开独立的回收综合服务网页（经网关 /recycle-admin/ 子路径）。
// 两系统同源，回收登录页检测到主系统 token 会自动单点登录，无需重复输密码
const goRecycle = () => {
  window.open('/recycle-admin/', '_blank')
}

// 未读提醒：跳转通知中心
const goNotifications = () => {
  router.push('/notifications')
}

// 深链到筛选好的订单列表（MiniprogramOrders 支持从 query 预填筛选条件）
const goPendingRepairOrders = () => {
  router.push({ path: '/repair/orders/miniprogram', query: { order_type: 'repair', status: 'pending' } })
}

const goPendingRecycleOrders = () => {
  router.push({ path: '/repair/orders/miniprogram', query: { order_type: 'recycle', status: 'pending' } })
}

const trendChartRef = ref(null)
const faultChartRef = ref(null)
const deviceChartRef = ref(null)
const engineerChartRef = ref(null)

let trendChart = null
let faultChart = null
let deviceChart = null
let engineerChart = null

const statistics = ref({
  total_orders: 0,
  pending_orders: 0,
  completed_orders: 0,
  total_devices: 0
})

const chartData = ref({
  trend: [],
  fault_types: [],
  device_status: [],
  engineer_workloads: []
})

const recentOrders = ref([])

const repairStatusMap = {
  pending: '待处理',
  processing: '维修中',
  completed: '已完成',
  review: '待验收',
  cancelled: '已取消'
}

const repairStatusTypeMap = {
  pending: 'warning',
  processing: 'primary',
  completed: 'success',
  review: '',
  cancelled: 'info'
}

const repairPriorityMap = {
  low: '低',
  medium: '中',
  high: '高'
}

const repairPriorityTypeMap = {
  low: '',
  medium: 'info',
  high: 'danger'
}

const initCharts = () => {
  if (trendChartRef.value && !trendChart) trendChart = echarts.init(trendChartRef.value)
  if (faultChartRef.value && !faultChart) faultChart = echarts.init(faultChartRef.value)
  if (deviceChartRef.value && !deviceChart) deviceChart = echarts.init(deviceChartRef.value)
  if (engineerChartRef.value && !engineerChart) engineerChart = echarts.init(engineerChartRef.value)
}

const getThemeColors = () => {
  const isDark = document.documentElement.classList.contains('dark')
  return {
    text: isDark ? '#e0e0e0' : '#333',
    axisLine: isDark ? '#4d4d4d' : '#e0e0e0',
    axisLabel: isDark ? '#909399' : '#999',
    splitLine: isDark ? '#2c2c2c' : '#f0f0f0'
  }
}

const renderCharts = () => {
  initCharts()

  const colors = getThemeColors()

  trendChart?.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: document.documentElement.classList.contains('dark') ? '#2c2c2c' : '#fff',
      borderColor: document.documentElement.classList.contains('dark') ? '#4d4d4d' : '#e0e0e0',
      textStyle: {
        color: document.documentElement.classList.contains('dark') ? '#e0e0e0' : '#333'
      }
    },
    xAxis: {
      type: 'category',
      data: chartData.value.trend.map(item => item.month),
      axisLine: { lineStyle: { color: colors.axisLine } },
      axisLabel: { color: colors.axisLabel }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: colors.axisLine } },
      axisLabel: { color: colors.axisLabel },
      splitLine: { lineStyle: { color: colors.splitLine } }
    },
    series: [{
      data: chartData.value.trend.map(item => item.count),
      type: 'line',
      smooth: true,
      areaStyle: { color: 'rgba(64, 158, 255, 0.15)' },
      itemStyle: { color: '#409eff' }
    }]
  })

  faultChart?.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: document.documentElement.classList.contains('dark') ? '#2c2c2c' : '#fff',
      borderColor: document.documentElement.classList.contains('dark') ? '#4d4d4d' : '#e0e0e0',
      textStyle: {
        color: document.documentElement.classList.contains('dark') ? '#e0e0e0' : '#333'
      }
    },
    series: [{
      type: 'pie',
      radius: '60%',
      label: {
        color: colors.text
      },
      data: chartData.value.fault_types.length ? chartData.value.fault_types : [{ name: '暂无数据', value: 0 }]
    }]
  })

  deviceChart?.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: document.documentElement.classList.contains('dark') ? '#2c2c2c' : '#fff',
      borderColor: document.documentElement.classList.contains('dark') ? '#4d4d4d' : '#e0e0e0',
      textStyle: {
        color: document.documentElement.classList.contains('dark') ? '#e0e0e0' : '#333'
      }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '60%'],
      label: {
        color: colors.text
      },
      data: (chartData.value.device_status.length ? chartData.value.device_status : [{ name: '暂无数据', value: 0 }]).map((item) => ({
        ...item,
        itemStyle: {
          color: {
            正常: '#67c23a',
            维修中: '#e6a23c',
            报废: '#909399',
            未知: '#f56c6c',
            暂无数据: '#dcdfe6'
          }[item.name] || '#409eff'
        }
      }))
    }]
  })

  engineerChart?.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: document.documentElement.classList.contains('dark') ? '#2c2c2c' : '#fff',
      borderColor: document.documentElement.classList.contains('dark') ? '#4d4d4d' : '#e0e0e0',
      textStyle: {
        color: document.documentElement.classList.contains('dark') ? '#e0e0e0' : '#333'
      }
    },
    xAxis: {
      type: 'category',
      data: chartData.value.engineer_workloads.map(item => item.name),
      axisLine: { lineStyle: { color: colors.axisLine } },
      axisLabel: { color: colors.axisLabel }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: colors.axisLine } },
      axisLabel: { color: colors.axisLabel },
      splitLine: { lineStyle: { color: colors.splitLine } }
    },
    series: [{
      data: chartData.value.engineer_workloads.map(item => item.value),
      type: 'bar',
      itemStyle: { color: '#409eff' }
    }]
  })
}

const loadDashboardData = async () => {
  try {
    const res = await getDashboardStatistics()
    const data = res?.data || {}

    statistics.value = data.statistics || statistics.value
    chartData.value = {
      trend: data.charts?.trend || [],
      fault_types: data.charts?.fault_types || [],
      device_status: data.charts?.device_status || [],
      engineer_workloads: data.charts?.engineer_workloads || []
    }
    recentOrders.value = data.recent_orders || []

    await nextTick()
    renderCharts()
  } catch (error) {
    console.error('加载首页数据失败', error)
  }
}

const handleResize = () => {
  trendChart?.resize()
  faultChart?.resize()
  deviceChart?.resize()
  engineerChart?.resize()
}

const goToOrders = () => {
  router.push('/repair/orders/miniprogram')
}

const getPriorityType = (priority) => repairPriorityTypeMap[priority] || ''
const getPriorityText = (priority) => repairPriorityMap[priority] || '中'
const getStatusType = (status) => repairStatusTypeMap[status] || ''
const getStatusText = (status) => repairStatusMap[status] || '未知'

const handleThemeChange = () => {
  renderCharts()
}

onMounted(async () => {
  await loadDashboardData()
  fetchUnreadCount()
  fetchPendingOrders()
  unreadTimer = setInterval(() => {
    fetchUnreadCount()
    fetchPendingOrders()
  }, UNREAD_REFRESH_INTERVAL)
  window.addEventListener('resize', handleResize)
  window.addEventListener('theme-changed', handleThemeChange)
})

onUnmounted(() => {
  if (unreadTimer) {
    clearInterval(unreadTimer)
    unreadTimer = null
  }
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('theme-changed', handleThemeChange)
  trendChart?.dispose()
  faultChart?.dispose()
  deviceChart?.dispose()
  engineerChart?.dispose()
})
</script>

<style lang="scss" scoped>
.dashboard {
  .quick-entry-card {
    margin-bottom: 20px;
    // 渐变描边：白底卡片 + 蓝→绿描边，呼应两个入口的主题色
    background:
      linear-gradient(#fff, #fff) padding-box,
      linear-gradient(120deg, rgba(47, 132, 245, 0.85), rgba(45, 190, 100, 0.85)) border-box;
    border: 1px solid transparent;
    box-shadow: 0 4px 16px rgba(23, 92, 160, 0.08);

    .quick-entry {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      row-gap: 12px;
    }

    .entry-item {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1 1 240px;
      max-width: 330px;
      min-height: 74px;
      padding: 12px 16px;
      box-sizing: border-box;
      border-radius: 12px;
      background: #f7f9fc;
      border: 1px solid #ebeef5;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;

      .entry-icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;

        .el-icon {
          font-size: 24px;
        }
      }

      .entry-text {
        flex: 1;
        min-width: 0;
      }

      .entry-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
        line-height: 1.3;

        .entry-arrow {
          font-size: 14px;
          color: #909399;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
      }

      .entry-desc {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      &.repair {
        .entry-icon {
          background: linear-gradient(135deg, #409eff, #66b1ff);
          box-shadow: 0 4px 10px rgba(64, 158, 255, 0.28);
        }

        &:hover {
          background: rgba(64, 158, 255, 0.06);
          border-color: rgba(64, 158, 255, 0.45);
          box-shadow: 0 6px 16px rgba(64, 158, 255, 0.16);

          .entry-arrow {
            opacity: 1;
            transform: translateX(0);
          }
        }
      }

      &.recycle {
        .entry-icon {
          background: linear-gradient(135deg, #67c23a, #95d475);
          box-shadow: 0 4px 10px rgba(103, 194, 58, 0.28);
        }

        &:hover {
          background: rgba(103, 194, 58, 0.06);
          border-color: rgba(103, 194, 58, 0.45);
          box-shadow: 0 6px 16px rgba(103, 194, 58, 0.16);

          .entry-arrow {
            opacity: 1;
            transform: translateX(0);
          }
        }
      }
    }

    .entry-todos {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 8px;

      .todo-chip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        font-size: 13px;
        line-height: 1;
        padding: 8px 14px;
        border-radius: 999px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        white-space: nowrap;

        b {
          font-size: 14px;
          font-weight: 700;
        }

        &.repair {
          color: #409eff;
          background: rgba(64, 158, 255, 0.08);

          &:hover {
            background: rgba(64, 158, 255, 0.16);
            border-color: rgba(64, 158, 255, 0.4);
          }
        }

        &.recycle {
          color: #67c23a;
          background: rgba(103, 194, 58, 0.08);

          &:hover {
            background: rgba(103, 194, 58, 0.16);
            border-color: rgba(103, 194, 58, 0.4);
          }
        }
      }
    }

    .entry-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .entry-tip {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #909399;
      cursor: pointer;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid #ebeef5;
      background: #f7f9fc;
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover {
        color: #606266;
        border-color: #dcdfe6;
      }

      &.active {
        color: #f56c6c;
        font-weight: 600;
        background: rgba(245, 108, 108, 0.08);
        border-color: rgba(245, 108, 108, 0.35);

        .el-icon {
          animation: bell-ring 2s ease-in-out infinite;
        }

        &:hover {
          background: rgba(245, 108, 108, 0.14);
        }
      }
    }

    .refresh-btn {
      flex-shrink: 0;
    }

    @keyframes bell-ring {
      0%, 100% { transform: rotate(0deg); }
      10% { transform: rotate(12deg); }
      20% { transform: rotate(-12deg); }
      30% { transform: rotate(8deg); }
      40% { transform: rotate(-8deg); }
      50% { transform: rotate(0deg); }
    }
  }

  .stats-row {
    margin-bottom: 20px;
  }

  .stat-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border-radius: 10px;

    &.clickable {
      cursor: pointer;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.09);
      }
    }

    .stat-icon {
      border-radius: 12px;

      &.icon-blue { background: linear-gradient(135deg, #409eff, #66b1ff); box-shadow: 0 6px 14px rgba(64, 158, 255, 0.32); }
      &.icon-orange { background: linear-gradient(135deg, #e6a23c, #f0c78a); box-shadow: 0 6px 14px rgba(230, 162, 60, 0.32); }
      &.icon-green { background: linear-gradient(135deg, #67c23a, #95d475); box-shadow: 0 6px 14px rgba(103, 194, 58, 0.32); }
      &.icon-red { background: linear-gradient(135deg, #f56c6c, #f89898); box-shadow: 0 6px 14px rgba(245, 108, 108, 0.32); }
    }
  }

  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20px;

        .el-icon {
          font-size: 28px;
          color: #fff;
        }
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 14px;
          color: #999;
        }
      }
    }
  }

  // 数字跟随图标配色做渐变，一眼区分指标
  .stat-content .icon-blue + .stat-info .stat-value {
    background: linear-gradient(135deg, #409eff, #79bbff);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .stat-content .icon-orange + .stat-info .stat-value {
    background: linear-gradient(135deg, #e6a23c, #f3d19e);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .stat-content .icon-green + .stat-info .stat-value {
    background: linear-gradient(135deg, #67c23a, #b3e19d);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .stat-content .icon-red + .stat-info .stat-value {
    background: linear-gradient(135deg, #f56c6c, #fab6b6);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .charts-row {
    margin-bottom: 20px;
  }

  .chart-card {
    :deep(.el-card__header) {
      padding: 14px 20px;
    }

    // 标题前的渐变竖条，统一图表卡片的视觉锚点
    :deep(.el-card__header) span {
      position: relative;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      padding-left: 12px;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 15px;
        border-radius: 2px;
        background: linear-gradient(180deg, #409eff, #67c23a);
      }
    }

    .chart {
      height: 300px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

// 暗色模式覆盖见文件末尾的非 scoped 样式块。
// 注意：scoped 样式中 :global(.dark){ 嵌套 } 会被编译器丢弃嵌套选择器，
// 只剩裸 .dark{...} 作用到 <html> 上，暗色覆盖全部失效，必须用全局扁平写法。
</style>

<style lang="scss">
// 暗色模式（全局块，html.dark 扁平选择器才能正确命中组件内部元素）
html.dark {
  .dashboard {
    .quick-entry-card {
      background:
        linear-gradient(#1d1d1d, #1d1d1d) padding-box,
        linear-gradient(120deg, rgba(47, 132, 245, 0.6), rgba(45, 190, 100, 0.6)) border-box;
      box-shadow: none;

      .entry-item {
        background: #262727;
        border-color: #414243;

        .entry-title {
          color: #e0e0e0;
        }

        &.repair:hover {
          background: rgba(64, 158, 255, 0.12);
        }

        &.recycle:hover {
          background: rgba(103, 194, 58, 0.12);
        }
      }

      .entry-tip {
        background: #262727;
        border-color: #414243;

        &:hover {
          color: #c0c4cc;
        }
      }
    }

    .chart-card {
      .el-card__header span {
        color: #e0e0e0;
      }
    }

    .stat-card {
      .stat-content {
        .stat-info {
          .stat-value {
            color: #e5eaf3;
          }

          .stat-label {
            color: #909399;
          }
        }
      }
    }
  }
}
</style>
