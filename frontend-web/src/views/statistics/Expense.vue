<template>
  <div class="expense-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="时间范围"><el-date-picker v-model="filterForm.date_range" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 280px;" /></el-form-item>
        <el-form-item label="分类"><el-select v-model="filterForm.category" placeholder="全部" clearable style="width: 150px;"><el-option label="全部" value="" /><el-option label="采购支出" value="purchase" /><el-option label="人员工资" value="salary" /><el-option label="运营费用" value="operation" /><el-option label="其他支出" value="other" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="handleFilter">查询</el-button><el-button @click="handleReset">重置</el-button><el-button type="success" @click="handleExport" :loading="exporting" :disabled="exporting">导出PDF</el-button></el-form-item>
      </el-form>

      <el-row :gutter="20" class="stats-row">
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-icon" style="background: #ecf5ff;"><el-icon :size="24" color="#409EFF"><Wallet /></el-icon></div><div class="stat-content"><div class="stat-label">总支出</div><div class="stat-value">¥{{ Number(statistics.total_expense || 0).toFixed(2) }}</div></div></div></el-card></el-col>
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-icon" style="background: #f0f9ff;"><el-icon :size="24" color="#67C23A"><ShoppingCart /></el-icon></div><div class="stat-content"><div class="stat-label">采购支出</div><div class="stat-value">¥{{ Number(statistics.purchase_expense || 0).toFixed(2) }}</div></div></div></el-card></el-col>
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-icon" style="background: #fef0f0;"><el-icon :size="24" color="#F56C6C"><User /></el-icon></div><div class="stat-content"><div class="stat-label">人员工资</div><div class="stat-value">¥{{ Number(statistics.salary_expense || 0).toFixed(2) }}</div></div></div></el-card></el-col>
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-icon" style="background: #fdf6ec;"><el-icon :size="24" color="#E6A23C"><Memo /></el-icon></div><div class="stat-content"><div class="stat-label">运营费用</div><div class="stat-value">¥{{ Number(statistics.operation_expense || 0).toFixed(2) }}</div></div></div></el-card></el-col>
      </el-row>

      <el-row :gutter="20" class="charts-row">
        <el-col :span="16"><el-card shadow="never"><template #header><span>支出趋势</span></template><div id="trend-chart" style="height: 350px;"></div></el-card></el-col>
        <el-col :span="8"><el-card shadow="never"><template #header><span>支出构成</span></template><div id="composition-chart" style="height: 350px;"></div></el-card></el-col>
      </el-row>

      <el-card shadow="never" class="table-card">
        <template #header><span>支出明细</span></template>
        <el-table :data="tableData" v-loading="loading" border stripe>
          <el-table-column prop="expense_date" label="日期" width="120" />
          <el-table-column prop="category" label="分类" width="120"><template #default="{ row: r }">{{ getCategoryText(r.category) }}</template></el-table-column>
          <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
          <el-table-column prop="amount" label="金额" width="120"><template #default="{ row: r }"><span class="amount-text">¥{{ Number(r.amount || 0).toFixed(2) }}</span></template></el-table-column>
          <el-table-column prop="payment_method" label="支付方式" width="100" />
          <el-table-column prop="operator" label="经办人" width="100" />
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
import { Wallet, ShoppingCart, User, Memo } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getExpenseStatistics, generateExpenseSummary } from '@/api/statistics'
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
const filterForm = reactive({ date_range: [fmt(start), fmt(today)], category: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const statistics = ref({ total_expense: 0, purchase_expense: 0, salary_expense: 0, operation_expense: 0 })
const tableData = ref([])
const timeline = ref([])
let trendChart = null
let compositionChart = null

const getCategoryText = (category) => ({ purchase: '采购支出', salary: '人员工资', operation: '运营费用', other: '其他支出' }[category] || '未知')

const fetchData = async () => {
  loading.value = true
  const [start_date, end_date] = filterForm.date_range || []
  const res = await getExpenseStatistics({ start_date, end_date, category: filterForm.category, page: pagination.page, page_size: pagination.pageSize })
  statistics.value = res.data.statistics || statistics.value
  timeline.value = res.data.timeline || []
  tableData.value = res.data.table || []
  pagination.total = res.data.pagination?.total || 0
  loading.value = false
  nextTick(initCharts)
}

const initCharts = () => {
  trendChart?.dispose(); compositionChart?.dispose()
  trendChart = echarts.init(document.getElementById('trend-chart'))
  trendChart.setOption({ tooltip: { trigger: 'axis' }, legend: { data: ['采购支出', '人员工资', '运营费用'] }, xAxis: { type: 'category', data: timeline.value.map(i => i.date) }, yAxis: { type: 'value', name: '金额(元)' }, series: [{ name: '采购支出', type: 'bar', data: timeline.value.map(i => i.purchase), itemStyle: { color: '#67C23A' } }, { name: '人员工资', type: 'bar', data: timeline.value.map(i => i.salary), itemStyle: { color: '#F56C6C' } }, { name: '运营费用', type: 'bar', data: timeline.value.map(i => i.operation), itemStyle: { color: '#E6A23C' } }] })
  compositionChart = echarts.init(document.getElementById('composition-chart'))
  compositionChart.setOption({ tooltip: { trigger: 'item', formatter: '{b}: {c}元 ({d}%)' }, legend: { orient: 'vertical', right: 10, top: 'center' }, series: [{ type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'], data: [{ value: statistics.value.purchase_expense, name: '采购支出', itemStyle: { color: '#67C23A' } }, { value: statistics.value.salary_expense, name: '人员工资', itemStyle: { color: '#F56C6C' } }, { value: statistics.value.operation_expense, name: '运营费用', itemStyle: { color: '#E6A23C' } }, { value: statistics.value.other_expense || 0, name: '其他支出', itemStyle: { color: '#909399' } }] }] })
}

const handleFilter = () => { pagination.page = 1; fetchData() }
const handleReset = () => { filterForm.date_range = [fmt(start), fmt(today)]; filterForm.category = ''; handleFilter() }

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
    const res = await generateExpenseSummary({ start_date, end_date, category: filterForm.category })

    if (res.code === 200 && res.data.summary) {
      const summary = res.data.summary

      const data = {
        statistics: statistics.value,
        timeline: timeline.value
      }

      const fileName = `开支统计_${start_date}_至_${end_date}.pdf`

      exportProgressText.value = '正在生成PDF文件...'

      await exportStatisticsToPdf('开支统计报表', data, summary, fileName, (progress, text) => {
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

onMounted(() => { fetchData(); window.addEventListener('resize', () => { trendChart?.resize(); compositionChart?.resize() }) })
</script>

<style lang="scss" scoped>
.expense-container { .filter-form { margin-bottom: 20px; } .stats-row { margin-bottom: 20px; .stat-card { display: flex; align-items: center; gap: 15px; .stat-icon { width: 50px; height: 50px; border-radius: 8px; display: flex; align-items: center; justify-content: center; } .stat-content { flex: 1; .stat-label { color: #909399; font-size: 14px; margin-bottom: 5px; } .stat-value { font-size: 20px; font-weight: bold; color: #303133; } } } } .charts-row { margin-bottom: 20px; } .table-card { .amount-text { color: #F56C6C; font-weight: 500; } :deep(.el-pagination) { margin-top: 20px; justify-content: flex-end; } } }

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
