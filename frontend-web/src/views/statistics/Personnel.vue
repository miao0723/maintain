<template>
  <div class="personnel-report-container">
    <el-card shadow="never" v-loading="loading">
      <!-- 统计卡片 -->
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <el-statistic title="工程师总数" :value="cards.engineer_count" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="累计工单" :value="cards.total_orders" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="累计完成" :value="cards.total_completed">
            <template #suffix>
              <span style="color: #67C23A">↗</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="平均评分" :value="cards.avg_rating" :precision="1" suffix="分" />
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <div class="chart-container">
            <h4>工程师绩效排名</h4>
            <div id="performance-chart" style="height: 300px"></div>
          </div>
        </el-col>
      </el-row>

      <!-- 详细数据表格 -->
      <div class="table-container">
        <h4>工程师绩效详情</h4>
        <el-table :data="engineers" border stripe>
          <el-table-column type="index" label="排名" width="80" />
          <el-table-column prop="name" label="姓名" min-width="120" />
          <el-table-column prop="order_count" label="工单总数" width="120" />
          <el-table-column prop="completed_count" label="完成工单" width="120" />
          <el-table-column prop="avg_rating" label="平均评分" width="120">
            <template #default="{ row }">
              <span v-if="row.avg_rating != null && row.avg_rating !== ''">{{ Number(row.avg_rating).toFixed(1) }} 分</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无工程师数据" />
          </template>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getRepairPersonnelReport } from '@/api/statistics'

const loading = ref(false)
const cards = ref({ engineer_count: 0, total_orders: 0, total_completed: 0, avg_rating: 0 })
const engineers = ref([])

let charts = []

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getRepairPersonnelReport()
    const data = res.data || {}
    cards.value = data.cards || cards.value
    engineers.value = data.engineers || []
    nextTick(initCharts)
  } catch (error) {
    console.error('获取人员报表数据失败:', error)
  } finally {
    loading.value = false
  }
}

const initCharts = () => {
  charts.forEach(c => c.dispose())
  charts = []

  // 绩效排名柱状图
  const performanceChart = echarts.init(document.getElementById('performance-chart'))
  performanceChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['工单总数', '完成工单'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: engineers.value.map(i => i.name),
      axisLabel: { interval: 0, rotate: engineers.value.length > 8 ? 30 : 0 }
    },
    yAxis: { type: 'value', name: '工单数' },
    series: [
      {
        name: '工单总数',
        type: 'bar',
        data: engineers.value.map(i => i.order_count),
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '完成工单',
        type: 'bar',
        data: engineers.value.map(i => i.completed_count),
        itemStyle: { color: '#67C23A' }
      }
    ]
  })
  charts.push(performanceChart)
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
.personnel-report-container {
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
  }
}
</style>
