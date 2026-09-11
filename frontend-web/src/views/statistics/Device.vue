<template>
  <div class="device-report-container">
    <el-card shadow="never" v-loading="loading">
      <!-- 统计卡片 -->
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="12">
          <el-statistic title="用户设备总数" :value="cards.device_total" />
        </el-col>
        <el-col :span="12">
          <el-statistic title="设备类型数" :value="cards.device_type_count" />
        </el-col>
      </el-row>

      <!-- 统计图表 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-container">
            <h4>各类型订单量</h4>
            <div id="order-chart" style="height: 300px"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <h4>各类型收入</h4>
            <div id="income-chart" style="height: 300px"></div>
          </div>
        </el-col>
      </el-row>

      <!-- 详细数据表格 -->
      <div class="table-container">
        <h4>设备类型明细</h4>
        <el-table :data="tableData" border stripe>
          <el-table-column prop="device_name" label="设备类型" min-width="140" show-overflow-tooltip />
          <el-table-column prop="order_count" label="订单数" width="100" />
          <el-table-column prop="completed_count" label="完成数" width="100" />
          <el-table-column prop="fault_rate" label="故障率" width="110">
            <template #default="{ row }">
              <span v-if="row.fault_rate != null">{{ Number(row.fault_rate).toFixed(2) }}%</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="income" label="收入" width="130" align="right">
            <template #default="{ row }">
              <span v-if="row.income != null" class="amount-text">¥{{ Number(row.income).toFixed(2) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="avg_rating" label="平均评分" width="110">
            <template #default="{ row }">
              <span v-if="row.avg_rating != null && row.avg_rating !== ''">{{ Number(row.avg_rating).toFixed(1) }} 分</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无设备数据" />
          </template>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getRepairDeviceReport } from '@/api/statistics'

const loading = ref(false)
const cards = ref({ device_total: 0, device_type_count: 0 })
const orderBar = ref([])
const incomeBar = ref([])
const tableData = ref([])

let charts = []

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getRepairDeviceReport()
    const data = res.data || {}
    cards.value = data.cards || cards.value
    orderBar.value = data.order_bar || []
    incomeBar.value = data.income_bar || []
    tableData.value = data.list || []
    nextTick(initCharts)
  } catch (error) {
    console.error('获取设备报表数据失败:', error)
  } finally {
    loading.value = false
  }
}

const initCharts = () => {
  charts.forEach(c => c.dispose())
  charts = []

  // 各类型订单量柱状图
  const orderChart = echarts.init(document.getElementById('order-chart'))
  orderChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: orderBar.value.map(i => i.name),
      axisLabel: { interval: 0, rotate: orderBar.value.length > 6 ? 30 : 0 }
    },
    yAxis: { type: 'value', name: '订单数' },
    series: [
      {
        name: '订单数',
        type: 'bar',
        barWidth: '40%',
        data: orderBar.value.map(i => i.value),
        itemStyle: { color: '#409EFF' }
      }
    ]
  })
  charts.push(orderChart)

  // 各类型收入柱状图
  const incomeChart = echarts.init(document.getElementById('income-chart'))
  incomeChart.setOption({
    tooltip: { trigger: 'axis', valueFormatter: (v) => `¥${Number(v || 0).toFixed(2)}` },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: incomeBar.value.map(i => i.name),
      axisLabel: { interval: 0, rotate: incomeBar.value.length > 6 ? 30 : 0 }
    },
    yAxis: { type: 'value', name: '收入(元)', axisLabel: { formatter: '¥{value}' } },
    series: [
      {
        name: '收入',
        type: 'bar',
        barWidth: '40%',
        data: incomeBar.value.map(i => i.value),
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
  charts.push(incomeChart)
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
.device-report-container {
  .chart-container {
    padding: 20px;
    background: #fff;
    border-radius: 4px;

    h4 {
      margin: 0 0 15px 0;
      font-size: 16px;
      color: #303133;
    }
  }

  .table-container {
    margin-top: 20px;

    h4 {
      margin: 0 0 15px 0;
      font-size: 16px;
      color: #303133;
    }

    .amount-text {
      color: #409EFF;
      font-weight: 500;
    }
  }
}
</style>
