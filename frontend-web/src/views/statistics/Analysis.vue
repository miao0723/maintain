<template>
  <div class="analysis-container">
    <el-row :gutter="20" class="stats-flex">
      <!-- 统计卡片 -->
      <el-col class="stats-flex-item" v-for="stat in statCards" :key="stat.title">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" :style="{ background: stat.color }">
              <el-icon :size="30" color="#fff">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>工单趋势分析</span>
          </template>
          <div id="trend-chart" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>订单状态分布</span>
          </template>
          <div id="status-chart" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>订单类型统计</span>
          </template>
          <div id="type-chart" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>工程师绩效排名</span>
          </template>
          <div id="performance-chart" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Monitor, Tickets, CircleCheck, Clock, Star } from '@element-plus/icons-vue'
import { getRepairAnalysis } from '@/api/statistics'

const loading = ref(false)
const cards = ref({ device_total: 0, month_orders: 0, month_completed: 0, month_pending: 0, avg_rating: 0 })
const trend = ref([])
const statusPie = ref([])
const typeBar = ref([])
const engineers = ref([])

const statCards = computed(() => [
  { title: '设备总数', value: cards.value.device_total, icon: Monitor, color: '#409EFF' },
  { title: '本月工单', value: cards.value.month_orders, icon: Tickets, color: '#67C23A' },
  { title: '本月完成', value: cards.value.month_completed, icon: CircleCheck, color: '#E6A23C' },
  { title: '本月待处理', value: cards.value.month_pending, icon: Clock, color: '#F56C6C' },
  { title: '平均评分', value: `${Number(cards.value.avg_rating || 0).toFixed(1)} 分`, icon: Star, color: '#9B59B6' }
])

let charts = []

const initCharts = () => {
  charts.forEach(c => c.dispose())
  charts = []

  // 工单趋势折线图
  const trendChart = echarts.init(document.getElementById('trend-chart'))
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单总数', '已完成'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: trend.value.map(i => i.month) },
    yAxis: { type: 'value', name: '订单数' },
    series: [
      {
        name: '订单总数',
        type: 'line',
        data: trend.value.map(i => i.total),
        smooth: true,
        itemStyle: { color: '#409EFF' },
        areaStyle: { color: 'rgba(64, 158, 255, 0.15)' }
      },
      {
        name: '已完成',
        type: 'line',
        data: trend.value.map(i => i.completed),
        smooth: true,
        itemStyle: { color: '#67C23A' },
        areaStyle: { color: 'rgba(103, 194, 58, 0.15)' }
      }
    ]
  })
  charts.push(trendChart)

  // 订单状态饼图
  const statusChart = echarts.init(document.getElementById('status-chart'))
  statusChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '订单状态',
        type: 'pie',
        radius: '55%',
        data: statusPie.value,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  })
  charts.push(statusChart)

  // 订单类型柱状图
  const typeChart = echarts.init(document.getElementById('type-chart'))
  typeChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: typeBar.value.map(i => i.name) },
    yAxis: { type: 'value', name: '订单数' },
    series: [
      {
        name: '订单数',
        type: 'bar',
        barWidth: '40%',
        data: typeBar.value.map(i => i.value),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }
    ]
  })
  charts.push(typeChart)

  // 工程师绩效柱状图
  const performanceChart = echarts.init(document.getElementById('performance-chart'))
  performanceChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: engineers.value.map(i => i.name), axisLabel: { interval: 0, rotate: engineers.value.length > 6 ? 30 : 0 } },
    yAxis: { type: 'value', name: '完成工单' },
    series: [
      {
        name: '完成工单',
        type: 'bar',
        barWidth: '40%',
        data: engineers.value.map(i => i.completed_count),
        itemStyle: { color: '#67C23A' }
      }
    ]
  })
  charts.push(performanceChart)
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getRepairAnalysis()
    const data = res.data || {}
    cards.value = data.cards || cards.value
    trend.value = data.trend || []
    statusPie.value = data.status_pie || []
    typeBar.value = data.type_bar || []
    engineers.value = data.engineers || []
    nextTick(initCharts)
  } catch (error) {
    console.error('获取综合分析数据失败:', error)
  } finally {
    loading.value = false
  }
}

const handleResize = () => {
  charts.forEach(chart => chart.resize())
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  charts.forEach(chart => chart.dispose())
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.analysis-container {
  .stats-flex {
    display: flex;
    flex-wrap: wrap;

    .stats-flex-item {
      flex: 1 1 0;
      min-width: 200px;
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
        color: white;
        margin-right: 15px;
        flex-shrink: 0;
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
        }

        .stat-title {
          font-size: 14px;
          color: #909399;
          margin-top: 5px;
        }
      }
    }
  }
}
</style>
