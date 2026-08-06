<template>
  <div class="income-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="日期范围">
          <el-date-picker v-model="searchForm.date_range" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="统计类型">
          <el-radio-group v-model="searchForm.type">
            <el-radio-button value="day">按日</el-radio-button>
            <el-radio-button value="month">按月</el-radio-button>
            <el-radio-button value="year">按年</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button type="success" @click="handleExport" :loading="exporting" :disabled="exporting">导出PDF</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6"><el-statistic title="总收入" :value="statistics.total_income" precision="2" prefix="¥"><template #suffix><span style="color: #67C23A">↗ {{ statistics.growth_rate }}%</span></template></el-statistic></el-col>
        <el-col :span="6"><el-statistic title="在线支付收入" :value="statistics.online_income" precision="2" prefix="¥" /></el-col>
        <el-col :span="6"><el-statistic title="转账收入" :value="statistics.transfer_income" precision="2" prefix="¥" /></el-col>
        <el-col :span="6"><el-statistic title="平均订单金额" :value="statistics.avg_amount" precision="2" prefix="¥" /></el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="16"><div class="chart-container"><h4>收入趋势</h4><div id="trend-chart" style="height: 350px"></div></div></el-col>
        <el-col :span="8"><div class="chart-container"><h4>收入构成</h4><div id="composition-chart" style="height: 350px"></div></div></el-col>
      </el-row>

      <div class="table-container">
        <h4>收入明细</h4>
        <el-table :data="tableData" border stripe>
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="order_count" label="订单数量" width="100" />
          <el-table-column prop="online_income" label="在线支付" width="120"><template #default="{ row: r }">¥{{ Number(r.online_income || 0).toFixed(2) }}</template></el-table-column>
          <el-table-column prop="transfer_income" label="转账收入" width="120"><template #default="{ row: r }">¥{{ Number(r.transfer_income || 0).toFixed(2) }}</template></el-table-column>
          <el-table-column prop="total_income" label="总收入" width="120"><template #default="{ row: r }"><span style="color: #67C23A; font-weight: bold">¥{{ Number(r.total_income || 0).toFixed(2) }}</span></template></el-table-column>
          <el-table-column prop="growth_rate" label="增长率" width="100"><template #default="{ row: r }"><span :style="{ color: r.growth_rate >= 0 ? '#67C23A' : '#F56C6C' }">{{ r.growth_rate >= 0 ? '+' : '' }}{{ r.growth_rate }}%</span></template></el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 导出进度对话框 -->
    <el-dialog v-model="exportDialogVisible" title="正在生成PDF" :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false" width="400px" center>
      <div class="export-progress">
        <el-progress :percentage="exportProgress" :status="exportStatus" />
        <p class="progress-text">{{ exportProgressText }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getIncomeStatistics, generateIncomeSummary } from '@/api/statistics'
import { exportStatisticsToPdf } from '@/utils/pdfExport'

const today = new Date()
const start = new Date(today)
start.setDate(today.getDate() - 9)
const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const searchForm = reactive({ date_range: [fmt(start), fmt(today)], type: 'day' })
const statistics = ref({ total_income: 0, online_income: 0, transfer_income: 0, avg_amount: 0, growth_rate: 0 })
const tableData = ref([])
const timeline = ref([])
const exporting = ref(false)
const exportDialogVisible = ref(false)
const exportProgress = ref(0)
const exportProgressText = ref('')
const exportStatus = ref('')

let charts = []

const fetchData = async () => {
  const [start_date, end_date] = searchForm.date_range || []
  const res = await getIncomeStatistics({ start_date, end_date, group_by: searchForm.type })
  statistics.value = res.data.statistics || statistics.value
  tableData.value = res.data.table || []
  timeline.value = res.data.timeline || []
  nextTick(initCharts)
}

const initCharts = () => {
  charts.forEach(c => c.dispose())
  charts = []
  const trendChart = echarts.init(document.getElementById('trend-chart'))
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['在线支付', '转账收入', '总收入'] },
    xAxis: { type: 'category', data: timeline.value.map(i => i.date) },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [
      { name: '在线支付', type: 'bar', data: timeline.value.map(i => i.online_income), itemStyle: { color: '#409EFF' } },
      { name: '转账收入', type: 'bar', data: timeline.value.map(i => i.transfer_income), itemStyle: { color: '#67C23A' } },
      { name: '总收入', type: 'line', data: timeline.value.map(i => i.total_income), smooth: true, itemStyle: { color: '#E6A23C' } }
    ]
  })
  const compositionChart = echarts.init(document.getElementById('composition-chart'))
  compositionChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{ type: 'pie', radius: '60%', data: [{ value: statistics.value.online_income, name: '在线支付' }, { value: statistics.value.transfer_income, name: '转账收入' }] }]
  })
  charts.push(trendChart, compositionChart)
}

const handleSearch = () => fetchData()

const handleExport = async () => {
  if (exporting.value) return

  exporting.value = true
  exportDialogVisible.value = true
  exportProgress.value = 0
  exportProgressText.value = '正在准备...'
  exportStatus.value = ''

  try {
    exportProgress.value = 20
    exportProgressText.value = '正在调用AI分析...'

    const [start_date, end_date] = searchForm.date_range || []
    const res = await generateIncomeSummary({ start_date, end_date, group_by: searchForm.type })

    if (res.code === 200 && res.data.summary) {
      const summary = res.data.summary

      const data = {
        statistics: statistics.value,
        timeline: timeline.value
      }

      const fileName = `收入统计_${start_date}_至_${end_date}.pdf`

      exportProgressText.value = '正在生成PDF文件...'

      await exportStatisticsToPdf('收入统计报表', data, summary, fileName, (progress, text) => {
        exportProgress.value = Math.floor(progress)
        exportProgressText.value = text
      })

      exportProgress.value = 100
      exportProgressText.value = '完成!'
      exportStatus.value = 'success'

      setTimeout(() => {
        exportDialogVisible.value = false
        ElMessage.success('PDF导出成功!')
      }, 1000)
    } else {
      exportProgressText.value = 'AI分析报告生成失败'
      exportStatus.value = 'exception'
      ElMessage.error('AI分析报告生成失败')
      setTimeout(() => {
        exportDialogVisible.value = false
      }, 2000)
    }
  } catch (error) {
    console.error('导出失败:', error)
    exportProgressText.value = '导出失败: ' + (error.message || '未知错误')
    exportStatus.value = 'exception'
    ElMessage.error('导出失败: ' + (error.message || '未知错误'))
    setTimeout(() => {
      exportDialogVisible.value = false
    }, 2000)
  } finally {
    exporting.value = false
  }
}

const handleResize = () => charts.forEach(chart => chart.resize())

onMounted(() => { fetchData(); window.addEventListener('resize', handleResize) })
onUnmounted(() => { charts.forEach(chart => chart.dispose()); window.removeEventListener('resize', handleResize) })
</script>

<style lang="scss" scoped>
.income-container {
  .search-form { margin-bottom: 20px; }
  .chart-container { padding: 20px; background: #fff; border-radius: 4px; h4 { margin: 0 0 15px 0; font-size: 16px; color: #303133; } }
  .table-container { margin-top: 20px; h4 { margin: 0 0 15px 0; font-size: 16px; color: #303133; } }
}

.export-progress {
  text-align: center;
  padding: 20px 0;

  .progress-text {
    margin-top: 15px;
    color: #606266;
    font-size: 14px;
  }
}
</style>
