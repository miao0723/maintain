<template>
  <div class="order-analytics">
    <el-card shadow="never">
      <div class="page-header">
        <div>
          <h2>小程序订单分析</h2>
          <p>基于 repair 数据库小程序订单数据的多维度展示与分析。</p>
        </div>
        <div class="header-actions">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>

      <!-- 统计卡片 -->
      <el-row :gutter="16" class="stats-row" v-loading="loading">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #ecf5ff">
              <el-icon :size="24" color="#409EFF"><Tickets /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">订单总数</div>
              <div class="stat-value">{{ summary.total }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #fdf6ec">
              <el-icon :size="24" color="#E6A23C"><Calendar /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">今日新增 / 本月</div>
              <div class="stat-value">{{ summary.today }} <span class="sub">/ {{ summary.month }}</span></div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #f0f9eb">
              <el-icon :size="24" color="#67C23A"><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">已完成 / 完成率</div>
              <div class="stat-value stat-success">{{ summary.completed }} <span class="sub">/ {{ summary.completion_rate }}%</span></div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #fef0f0">
              <el-icon :size="24" color="#F56C6C"><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">已完成金额</div>
              <div class="stat-value stat-danger">¥{{ formatMoney(summary.completed_amount) }}</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="stats-row stats-row--sub" v-loading="loading">
        <el-col :span="6">
          <div class="mini-stat">
            <span class="mini-label">待处理</span>
            <span class="mini-value" style="color: #909399">{{ summary.pending }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="mini-stat">
            <span class="mini-label">维修中</span>
            <span class="mini-value" style="color: #E6A23C">{{ summary.processing }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="mini-stat">
            <span class="mini-label">平均客单价</span>
            <span class="mini-value" style="color: #F56C6C">¥{{ formatMoney(summary.avg_amount) }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="mini-stat">
            <span class="mini-label">预估金额合计</span>
            <span class="mini-value" style="color: #409EFF">¥{{ formatMoney(summary.estimated_amount) }}</span>
          </div>
        </el-col>
      </el-row>

      <!-- 趋势图 -->
      <el-card shadow="never" class="chart-card">
        <template #header><span>订单量 / 完成金额趋势</span></template>
        <div ref="trendRef" style="height: 320px"></div>
      </el-card>

      <!-- 分布图表 -->
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <el-card shadow="never" class="chart-card">
            <template #header><span>订单状态分布</span></template>
            <div ref="statusRef" style="height: 300px"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" class="chart-card">
            <template #header><span>设备类型分布</span></template>
            <div ref="deviceRef" style="height: 300px"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="charts-row">
        <el-col :span="8">
          <el-card shadow="never" class="chart-card">
            <template #header><span>服务方式</span></template>
            <div ref="serviceRef" style="height: 280px"></div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never" class="chart-card">
            <template #header><span>优先级分布</span></template>
            <div ref="priorityRef" style="height: 280px"></div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never" class="chart-card">
            <template #header><span>热门品牌 Top5</span></template>
            <div ref="brandRef" style="height: 280px"></div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Tickets, Calendar, CircleCheck, Money } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import axios from 'axios'

const API_BASE = '/api'
const getHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const loading = ref(false)
const dateRange = ref([])

const summary = reactive({
  total: 0,
  today: 0,
  month: 0,
  month_amount: 0,
  pending: 0,
  processing: 0,
  completed: 0,
  cancelled: 0,
  completed_amount: 0,
  estimated_amount: 0,
  avg_amount: 0,
  completion_rate: 0
})

const analytics = reactive({
  status_distribution: [],
  device_type_distribution: [],
  service_type_distribution: [],
  order_type_distribution: [],
  priority_distribution: [],
  daily_trend: [],
  top_brands: []
})

// 图表 DOM 引用
const trendRef = ref(null)
const statusRef = ref(null)
const deviceRef = ref(null)
const serviceRef = ref(null)
const priorityRef = ref(null)
const brandRef = ref(null)

let trendChart = null
let statusChart = null
let deviceChart = null
let serviceChart = null
let priorityChart = null
let brandChart = null

const statusColorMap = {
  pending: '#909399',
  quoted: '#E6A23C',
  confirmed: '#409EFF',
  processing: '#E6A23C',
  review: '#67C23A',
  completed: '#67C23A',
  cancelled: '#F56C6C'
}

const pieColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9B59B6', '#1ABC9C']

const formatMoney = (val) => Number(val || 0).toFixed(2)

const loadData = async () => {
  loading.value = true
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.date_range = dateRange.value.join(',')
    }
    const res = await axios.get(`${API_BASE}/payment/online/analytics`, {
      headers: getHeaders(),
      params
    })
    if (res.data.code === 200) {
      const data = res.data.data || {}
      Object.assign(summary, data.summary || {})
      analytics.status_distribution = data.status_distribution || []
      analytics.device_type_distribution = data.device_type_distribution || []
      analytics.service_type_distribution = data.service_type_distribution || []
      analytics.order_type_distribution = data.order_type_distribution || []
      analytics.priority_distribution = data.priority_distribution || []
      analytics.daily_trend = data.daily_trend || []
      analytics.top_brands = data.top_brands || []
      nextTick(renderCharts)
    }
  } catch (error) {
    console.error('获取订单分析数据失败:', error)
    ElMessage.error('获取订单分析数据失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  dateRange.value = []
  loadData()
}

const renderCharts = () => {
  renderTrend()
  renderStatus()
  renderDevice()
  renderService()
  renderPriority()
  renderBrand()
}

const renderTrend = () => {
  if (!trendRef.value) return
  trendChart = trendChart || echarts.init(trendRef.value)
  const trend = analytics.daily_trend
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单量', '完成金额'] },
    grid: { left: 50, right: 60, top: 40, bottom: 40 },
    xAxis: { type: 'category', data: trend.map(i => i.date) },
    yAxis: [
      { type: 'value', name: '订单量' },
      { type: 'value', name: '金额(元)', position: 'right' }
    ],
    series: [
      {
        name: '订单量',
        type: 'bar',
        data: trend.map(i => i.count),
        itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 24
      },
      {
        name: '完成金额',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: trend.map(i => i.amount),
        itemStyle: { color: '#F56C6C' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 108, 108, 0.25)' },
            { offset: 1, color: 'rgba(245, 108, 108, 0.02)' }
          ])
        }
      }
    ]
  })
}

const renderStatus = () => {
  if (!statusRef.value) return
  statusChart = statusChart || echarts.init(statusRef.value)
  statusChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['38%', '50%'],
      avoidLabelOverlap: true,
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: analytics.status_distribution.map(i => ({
        value: i.count,
        name: i.label,
        itemStyle: { color: statusColorMap[i.key] || '#909399' }
      }))
    }]
  })
}

const renderDevice = () => {
  if (!deviceRef.value) return
  deviceChart = deviceChart || echarts.init(deviceRef.value)
  deviceChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: '65%',
      center: ['38%', '50%'],
      data: analytics.device_type_distribution.map((i, idx) => ({
        value: i.count,
        name: i.label,
        itemStyle: { color: pieColors[idx % pieColors.length] }
      }))
    }]
  })
}

const renderService = () => {
  if (!serviceRef.value) return
  serviceChart = serviceChart || echarts.init(serviceRef.value)
  serviceChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      data: analytics.service_type_distribution.map((i, idx) => ({
        value: i.count,
        name: i.label,
        itemStyle: { color: pieColors[idx % pieColors.length] }
      }))
    }]
  })
}

const renderPriority = () => {
  if (!priorityRef.value) return
  priorityChart = priorityChart || echarts.init(priorityRef.value)
  const list = analytics.priority_distribution
  priorityChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: list.map(i => i.label) },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: list.map(i => i.count),
      itemStyle: { color: '#E6A23C', borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 40
    }]
  })
}

const renderBrand = () => {
  if (!brandRef.value) return
  brandChart = brandChart || echarts.init(brandRef.value)
  const list = [...analytics.top_brands].reverse()
  brandChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 70, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: list.map(i => i.label) },
    series: [{
      type: 'bar',
      data: list.map(i => i.count),
      itemStyle: { color: '#67C23A', borderRadius: [0, 4, 4, 0] },
      barMaxWidth: 20
    }]
  })
}

const resizeCharts = () => {
  trendChart?.resize()
  statusChart?.resize()
  deviceChart?.resize()
  serviceChart?.resize()
  priorityChart?.resize()
  brandChart?.resize()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  ;[trendChart, statusChart, deviceChart, serviceChart, priorityChart, brandChart]
    .forEach(c => c?.dispose())
})
</script>

<style lang="scss" scoped>
.order-analytics {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;

    h2 {
      margin: 0;
      font-size: 20px;
    }

    p {
      margin: 8px 0 0;
      color: #64748b;
      font-size: 13px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }
  }

  .stats-row {
    margin-bottom: 16px;

    .stat-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px;
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 8px;

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stat-content {
        flex: 1;

        .stat-label {
          color: #909399;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 22px;
          font-weight: bold;
          color: #303133;

          .sub {
            font-size: 14px;
            color: #909399;
            font-weight: normal;
          }
        }

        .stat-success { color: #67C23A; }
        .stat-danger { color: #F56C6C; }
      }
    }
  }

  .stats-row--sub {
    .mini-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 18px;
      background: #f8fafc;
      border-radius: 8px;

      .mini-label {
        color: #909399;
        font-size: 13px;
      }

      .mini-value {
        font-size: 18px;
        font-weight: bold;
      }
    }
  }

  .chart-card {
    margin-bottom: 16px;
  }

  .charts-row {
    margin-bottom: 0;
  }
}
</style>
