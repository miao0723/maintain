<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409eff;">
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
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e6a23c;">
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
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67c23a;">
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
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f56c6c;">
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
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最新工单</span>
              <el-button type="primary" link @click="goToOrders">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" style="width: 100%">
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
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getDashboardStatistics } from '@/api/dashboard'

const router = useRouter()

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
  window.addEventListener('resize', handleResize)
  window.addEventListener('theme-changed', handleThemeChange)
})

onUnmounted(() => {
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
  .stats-row {
    margin-bottom: 20px;
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

  .charts-row {
    margin-bottom: 20px;
  }

  .chart-card {
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

:global(.dark) {
  .dashboard {
    .stat-card {
      .stat-content {
        .stat-info {
          .stat-value {
            color: #e0e0e0;
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
