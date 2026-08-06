<template>
  <div class="order-stats-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="时间范围"><el-date-picker v-model="filterForm.date_range" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 280px;" /></el-form-item>
        <el-form-item label="订单状态"><el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 150px;"><el-option label="全部" value="" /><el-option label="待处理" value="pending" /><el-option label="处理中" value="processing" /><el-option label="已完成" value="completed" /><el-option label="已取消" value="cancelled" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="handleFilter">查询</el-button><el-button @click="handleReset">重置</el-button><el-button type="success" @click="handleExport" :loading="exporting" :disabled="exporting">导出PDF</el-button></el-form-item>
      </el-form>

      <el-row :gutter="20" class="stats-row">
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-icon" style="background: #f4f4f5;"><el-icon :size="24" color="#909399"><Tickets /></el-icon></div><div class="stat-content"><div class="stat-label">总订单数</div><div class="stat-value">{{ statistics.total_orders }}</div></div></div></el-card></el-col>
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-icon" style="background: #e1f3d8;"><el-icon :size="24" color="#67C23A"><CircleCheck /></el-icon></div><div class="stat-content"><div class="stat-label">已完成</div><div class="stat-value stat-success">{{ statistics.completed_orders }}</div></div></div></el-card></el-col>
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-icon" style="background: #fef0f0;"><el-icon :size="24" color="#F56C6C"><Clock /></el-icon></div><div class="stat-content"><div class="stat-label">处理中</div><div class="stat-value stat-warning">{{ statistics.processing_orders }}</div></div></div></el-card></el-col>
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-icon" style="background: #ecf5ff;"><el-icon :size="24" color="#409EFF"><TrendCharts /></el-icon></div><div class="stat-content"><div class="stat-label">完成率</div><div class="stat-value stat-info">{{ statistics.completion_rate }}%</div></div></div></el-card></el-col>
      </el-row>

      <el-row :gutter="20" class="charts-row">
        <el-col :span="12"><el-card shadow="never"><template #header><span>订单趋势</span></template><div id="trend-chart" style="height: 300px;"></div></el-card></el-col>
        <el-col :span="12"><el-card shadow="never"><template #header><span>订单状态分布</span></template><div id="status-chart" style="height: 300px;"></div></el-card></el-col>
      </el-row>

      <el-card shadow="never" class="table-card">
        <template #header><span>订单明细</span></template>
        <el-table :data="tableData" v-loading="loading" border stripe>
          <el-table-column prop="order_no" label="订单号" min-width="180" />
          <el-table-column prop="customer_name" label="客户名称" width="150" />
          <el-table-column prop="machine_type" label="机械类型" width="120" />
          <el-table-column prop="fault_desc" label="故障描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="amount" label="金额" width="100"><template #default="{ row: r }"><span class="amount-text">¥{{ Number(r.amount || 0).toFixed(2) }}</span></template></el-table-column>
          <el-table-column prop="status" label="状态" width="100"><template #default="{ row: r }"><el-tag :type="getStatusType(r.status)">{{ getStatusText(r.status) }}</el-tag></template></el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="160" />
        </el-table>
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @size-change="fetchData" @current-change="fetchData" />
      </el-card>
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
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Tickets, CircleCheck, Clock, TrendCharts } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getOrderStatistics, generateOrderSummary } from '@/api/statistics'
import { exportStatisticsToPdf } from '@/utils/pdfExport'

const today = new Date()
const start = new Date(today)
start.setDate(today.getDate() - 9)
const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const loading = ref(false)
const exporting = ref(false)
const exportDialogVisible = ref(false)
const exportProgress = ref(0)
const exportProgressText = ref('')
const exportStatus = ref('')
const filterForm = reactive({ date_range: [fmt(start), fmt(today)], status: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const tableData = ref([])
const statistics = ref({ total_orders: 0, completed_orders: 0, processing_orders: 0, completion_rate: 0 })
const timeline = ref([])
const statusStats = ref([])
let trendChart = null
let statusChart = null

const getStatusType = (status) => ({ pending: 'info', processing: 'warning', completed: 'success', cancelled: 'danger' }[status] || 'info')
const getStatusText = (status) => ({ pending: '待处理', processing: '处理中', completed: '已完成', cancelled: '已取消' }[status] || '未知')

const fetchData = async () => {
  loading.value = true
  const [start_date, end_date] = filterForm.date_range || []
  const res = await getOrderStatistics({ start_date, end_date, status: filterForm.status, page: pagination.page, page_size: pagination.pageSize })
  statistics.value = res.data.statistics || statistics.value
  timeline.value = res.data.timeline || []
  statusStats.value = res.data.status_stats || []
  tableData.value = res.data.table || []
  pagination.total = res.data.pagination?.total || 0
  loading.value = false
  nextTick(initCharts)
}

const initCharts = () => {
  trendChart?.dispose(); statusChart?.dispose()
  trendChart = echarts.init(document.getElementById('trend-chart'))
  trendChart.setOption({ tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: timeline.value.map(i => i.date) }, yAxis: { type: 'value', name: '订单数' }, series: [{ name: '订单数量', type: 'line', data: timeline.value.map(i => i.count), smooth: true, itemStyle: { color: '#409EFF' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(64, 158, 255, 0.3)' }, { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }]) } }] })
  statusChart = echarts.init(document.getElementById('status-chart'))
  statusChart.setOption({ tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' }, legend: { orient: 'vertical', right: 10, top: 'center' }, series: [{ type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'], data: statusStats.value.map(item => ({ value: item.count, name: getStatusText(item.status), itemStyle: { color: { completed: '#67C23A', processing: '#E6A23C', pending: '#909399', cancelled: '#F56C6C' }[item.status] } })) }] })
}

const handleFilter = () => { pagination.page = 1; fetchData() }
const handleReset = () => { filterForm.date_range = [fmt(start), fmt(today)]; filterForm.status = ''; handleFilter() }

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

    const [start_date, end_date] = filterForm.date_range || []
    const res = await generateOrderSummary({ start_date, end_date, status: filterForm.status })

    if (res.code === 200 && res.data.summary) {
      const summary = res.data.summary

      const data = {
        statistics: statistics.value,
        timeline: timeline.value,
        status_stats: statusStats.value
      }

      const fileName = `订单统计_${start_date}_至_${end_date}.pdf`

      exportProgressText.value = '正在生成PDF文件...'

      await exportStatisticsToPdf('订单统计报表', data, summary, fileName, (progress, text) => {
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

onMounted(() => { fetchData(); window.addEventListener('resize', () => { trendChart?.resize(); statusChart?.resize() }) })
</script>

<style lang="scss" scoped>
.order-stats-container { .filter-form { margin-bottom: 20px; } .stats-row { margin-bottom: 20px; .stat-card { display: flex; align-items: center; gap: 15px; .stat-icon { width: 50px; height: 50px; border-radius: 8px; display: flex; align-items: center; justify-content: center; } .stat-content { flex: 1; .stat-label { color: #909399; font-size: 14px; margin-bottom: 5px; } .stat-value { font-size: 20px; font-weight: bold; color: #303133; } .stat-success { color: #67C23A; } .stat-warning { color: #E6A23C; } .stat-info { color: #409EFF; } } } } .charts-row { margin-bottom: 20px; } .table-card { .amount-text { color: #409EFF; font-weight: 500; } :deep(.el-pagination) { margin-top: 20px; justify-content: flex-end; } } }

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
