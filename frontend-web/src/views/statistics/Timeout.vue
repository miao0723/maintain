<template>
  <div class="timeout-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="时间范围"><el-date-picker v-model="filterForm.date_range" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 280px;" /></el-form-item>
        <el-form-item label="超时类型"><el-select v-model="filterForm.timeout_type" placeholder="全部" clearable style="width: 150px;"><el-option label="全部" value="" /><el-option label="响应超时" value="response" /><el-option label="维修超时" value="repair" /><el-option label="交付超时" value="delivery" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="handleFilter">查询</el-button><el-button @click="handleReset">重置</el-button><el-button type="warning" @click="handleExport">导出预警</el-button></el-form-item>
      </el-form>

      <el-row :gutter="20" class="stats-row">
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-icon" style="background: #fef0f0;"><el-icon :size="24" color="#F56C6C"><Warning /></el-icon></div><div class="stat-content"><div class="stat-label">超时总数</div><div class="stat-value stat-danger">{{ statistics.total_timeouts }}</div></div></div></el-card></el-col>
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-icon" style="background: #fdf6ec;"><el-icon :size="24" color="#E6A23C"><Clock /></el-icon></div><div class="stat-content"><div class="stat-label">响应超时</div><div class="stat-value stat-warning">{{ statistics.response_timeouts }}</div></div></div></el-card></el-col>
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-icon" style="background: #ecf5ff;"><el-icon :size="24" color="#409EFF"><Tools /></el-icon></div><div class="stat-content"><div class="stat-label">维修超时</div><div class="stat-value stat-info">{{ statistics.repair_timeouts }}</div></div></div></el-card></el-col>
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-icon" style="background: #f4f4f5;"><el-icon :size="24" color="#909399"><Van /></el-icon></div><div class="stat-content"><div class="stat-label">交付超时</div><div class="stat-value">{{ statistics.delivery_timeouts }}</div></div></div></el-card></el-col>
      </el-row>

      <el-row :gutter="20" class="charts-row">
        <el-col :span="16"><el-card shadow="never"><template #header><span>超时趋势</span></template><div id="trend-chart" style="height: 350px;"></div></el-card></el-col>
        <el-col :span="8"><el-card shadow="never"><template #header><span>超时原因分析</span></template><div id="reason-chart" style="height: 350px;"></div></el-card></el-col>
      </el-row>

      <el-card shadow="never" class="table-card">
        <template #header><span>超时明细</span></template>
        <el-table :data="tableData" v-loading="loading" border stripe>
          <el-table-column prop="order_no" label="订单号" min-width="180" />
          <el-table-column prop="customer_name" label="客户名称" width="150" />
          <el-table-column prop="timeout_type" label="超时类型" width="120"><template #default="{ row }"><el-tag :type="getTimeoutTypeColor(row.timeout_type)">{{ getTimeoutTypeText(row.timeout_type) }}</el-tag></template></el-table-column>
          <el-table-column prop="timeout_duration" label="超时时长" width="120"><template #default="{ row }"><span class="duration-text">{{ row.timeout_duration }}</span></template></el-table-column>
          <el-table-column prop="reason" label="超时原因" min-width="200" show-overflow-tooltip />
          <el-table-column prop="responsible" label="责任人" width="100" />
          <el-table-column prop="created_at" label="创建时间" width="160" />
          <el-table-column label="操作" width="150" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="handleView(row)">查看</el-button><el-button link type="warning" @click="handleFollow(row)">跟进</el-button></template></el-table-column>
        </el-table>
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @size-change="fetchData" @current-change="fetchData" />
      </el-card>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="超时详情" width="700px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="订单号">{{ currentRecord.order_no }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ currentRecord.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="超时类型"><el-tag :type="getTimeoutTypeColor(currentRecord.timeout_type)">{{ getTimeoutTypeText(currentRecord.timeout_type) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="超时时长">{{ currentRecord.timeout_duration }}</el-descriptions-item>
        <el-descriptions-item label="超时原因" :span="2">{{ currentRecord.reason }}</el-descriptions-item>
        <el-descriptions-item label="责任人">{{ currentRecord.responsible }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentRecord.created_at }}</el-descriptions-item>
        <el-descriptions-item label="处理措施" :span="2">{{ currentRecord.solution || '待制定' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 导出预警对话框 -->
    <el-dialog v-model="exportDialogVisible" title="导出超时预警" width="600px" :close-on-click-modal="false" :close-on-press-escape="false">
      <!-- 步骤1：输入邮箱 -->
      <div v-if="exportStep === 1" class="export-step">
        <div class="step-content">
          <el-icon class="step-icon" :size="60" color="#409EFF"><Message /></el-icon>
          <div class="step-text">
            <h3>请输入接收预警报告的邮箱</h3>
            <p>系统将基于当前筛选条件生成详细的超时预警报告，并发送至指定邮箱。</p>
          </div>
          <el-form :model="{ email: exportEmail }" label-width="0" style="margin-top: 30px;">
            <el-form-item>
              <el-input
                v-model="exportEmail"
                placeholder="请输入邮箱地址"
                size="large"
                prefix-icon="Message"
                clearable
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 步骤2：生成总结 -->
      <div v-if="exportStep === 2" class="export-step">
        <div class="step-content">
          <div class="loading-spinner">
            <svg viewBox="0 0 50 50" class="spinner">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#67C23A" stroke-width="4" stroke-linecap="round" stroke-dasharray="80 40" class="spinner-path"/>
            </svg>
          </div>
          <div class="step-text">
            <h3>正在生成超时预警报告...</h3>
            <p>系统正在调用 AI 分析超时数据，这里可能需要 10-30 秒。</p>
          </div>
          <el-progress :percentage="exportProgress" :stroke-width="12" :show-text="false" style="margin-top: 30px;">
            <template #default="{ percentage }">
              <span class="progress-text">{{ percentage }}%</span>
            </template>
          </el-progress>
          <div class="progress-status">
            <span v-if="exportProgress < 20">正在连接 AI 服务...</span>
            <span v-else-if="exportProgress < 50">正在分析超时数据...</span>
            <span v-else-if="exportProgress < 80">正在生成详细报告...</span>
            <span v-else>报告生成完成！</span>
          </div>
        </div>
      </div>

      <!-- 步骤3：发送邮件 -->
      <div v-if="exportStep === 3" class="export-step">
        <div class="step-content">
          <div class="loading-spinner" style="--spinner-color: #409EFF;">
            <svg viewBox="0 0 50 50" class="spinner">
              <circle cx="25" cy="25" r="20" fill="none" stroke="#409EFF" stroke-width="4" stroke-linecap="round" stroke-dasharray="80 40" class="spinner-path"/>
            </svg>
          </div>
          <div class="step-text">
            <h3>正在发送邮件...</h3>
            <p>预警报告已生成，正在发送至 {{ exportEmail }}</p>
          </div>
          <el-progress :percentage="exportProgress" :stroke-width="12" status="success" :show-text="false" style="margin-top: 30px;">
            <template #default="{ percentage }">
              <span class="progress-text">{{ percentage }}%</span>
            </template>
          </el-progress>
          <div class="progress-status">
            <span v-if="exportProgress < 90">正在处理邮件内容...</span>
            <span v-else>邮件发送中...</span>
          </div>
        </div>
      </div>

      <!-- 步骤4：成功 -->
      <div v-if="exportStep === 4" class="export-step">
        <div class="step-content">
          <el-icon class="step-icon" :size="60" color="#67C23A"><CircleCheck /></el-icon>
          <div class="step-text">
            <h3>发送成功！</h3>
            <p>超时预警报告已成功发送至 {{ exportEmail }}</p>
          </div>
        </div>
      </div>

      <template #footer v-if="exportStep === 1">
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="generateSummary" :loading="exportLoading">
          生成并发送
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning, Clock, Tools, Van, Message, Promotion, CircleCheck } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getTimeoutStatistics, generateTimeoutSummary, sendTimeoutEmail } from '@/api/statistics'

const today = new Date(); const start = new Date(today); start.setDate(today.getDate() - 9)
const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const loading = ref(false)
const detailDialogVisible = ref(false)
const currentRecord = ref(null)
const filterForm = reactive({ date_range: [fmt(start), fmt(today)], timeout_type: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const tableData = ref([])
const statistics = ref({ total_timeouts: 0, response_timeouts: 0, repair_timeouts: 0, delivery_timeouts: 0 })
const timeline = ref([])
const reasonStats = ref([])
let trendChart = null
let reasonChart = null

const getTimeoutTypeColor = (type) => ({ response: 'warning', repair: 'danger', delivery: 'info' }[type] || 'info')
const getTimeoutTypeText = (type) => ({ response: '响应超时', repair: '维修超时', delivery: '交付超时' }[type] || '未知')

const fetchData = async () => {
  loading.value = true
  const [start_date, end_date] = filterForm.date_range || []
  const res = await getTimeoutStatistics({ start_date, end_date, timeout_type: filterForm.timeout_type, page: pagination.page, page_size: pagination.pageSize })
  statistics.value = res.data.statistics || statistics.value
  timeline.value = res.data.timeline || []
  reasonStats.value = res.data.reason_stats || []
  tableData.value = res.data.table || []
  pagination.total = res.data.pagination?.total || 0
  loading.value = false
  nextTick(initCharts)
}

const initCharts = () => {
  trendChart?.dispose(); reasonChart?.dispose()
  trendChart = echarts.init(document.getElementById('trend-chart'))
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['响应超时', '维修超时', '交付超时'] },
    xAxis: { type: 'category', data: timeline.value.map(i => i.date) },
    yAxis: { type: 'value', name: '超时次数' },
    series: [
      { name: '响应超时', type: 'bar', stack: 'total', data: timeline.value.map(i => i.response), itemStyle: { color: '#E6A23C' } },
      { name: '维修超时', type: 'bar', stack: 'total', data: timeline.value.map(i => i.repair), itemStyle: { color: '#F56C6C' } },
      { name: '交付超时', type: 'bar', stack: 'total', data: timeline.value.map(i => i.delivery), itemStyle: { color: '#909399' } }
    ]
  })
  reasonChart = echarts.init(document.getElementById('reason-chart'))
  reasonChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      data: reasonStats.value.map((item, idx) => ({ ...item, itemStyle: { color: ['#F56C6C', '#E6A23C', '#409EFF', '#67C23A', '#909399'][idx % 5] } }))
    }]
  })
}

const handleFilter = () => { pagination.page = 1; fetchData() }
const handleReset = () => { filterForm.date_range = [fmt(start), fmt(today)]; filterForm.timeout_type = ''; handleFilter() }
const handleView = (row) => { currentRecord.value = row; detailDialogVisible.value = true }
const handleFollow = () => ElMessage.success('已创建跟进任务')

const exportDialogVisible = ref(false)
const exportEmail = ref('')
const exportLoading = ref(false)
const exportSummary = ref('')
const exportStep = ref(1) // 1: 输入邮箱, 2: 生成总结, 3: 发送邮件, 4: 完成
const exportProgress = ref(0)

const handleExport = async () => {
  exportEmail.value = ''
  exportSummary.value = ''
  exportStep.value = 1
  exportProgress.value = 0
  exportDialogVisible.value = true
}

const generateSummary = async () => {
  if (!exportEmail.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(exportEmail.value)) {
    ElMessage.error('请输入有效的邮箱地址')
    return
  }

  exportStep.value = 2
  exportLoading.value = true
  exportProgress.value = 10

  try {
    const [start_date, end_date] = filterForm.date_range || []

    // 模拟进度更新
    const progressInterval = setInterval(() => {
      if (exportProgress.value < 50) {
        exportProgress.value += 5
      }
    }, 500)

    const res = await generateTimeoutSummary({
      start_date,
      end_date,
      timeout_type: filterForm.timeout_type
    })

    clearInterval(progressInterval)
    exportProgress.value = 60
    exportSummary.value = res.data.summary || ''
    exportStep.value = 3
    exportProgress.value = 70

    // 自动发送邮件
    await sendEmail()
  } catch (error) {
    console.error('生成总结失败:', error)
    clearInterval(window.exportProgressInterval)
    const errorMsg = error.response?.data?.message || error.message || '生成总结失败'
    ElMessage.error(errorMsg)
    exportLoading.value = false
    exportStep.value = 1
    exportProgress.value = 0
  }
}

const sendEmail = async () => {
  try {
    exportProgress.value = 80

    // 模拟进度更新
    const progressInterval = setInterval(() => {
      if (exportProgress.value < 95) {
        exportProgress.value += 2
      }
    }, 200)

    await sendTimeoutEmail({
      email: exportEmail.value,
      summary: exportSummary.value
    })

    clearInterval(progressInterval)
    exportProgress.value = 100
    exportLoading.value = false
    exportStep.value = 4
    ElMessage.success('超时预警报告已发送至 ' + exportEmail.value)

    setTimeout(() => {
      exportDialogVisible.value = false
    }, 3000)
  } catch (error) {
    console.error('发送邮件失败:', error)
    clearInterval(window.exportProgressInterval)
    ElMessage.error(error.response?.data?.message || '发送邮件失败')
    exportLoading.value = false
    exportStep.value = 3
  }
}

onMounted(() => { fetchData(); window.addEventListener('resize', () => { trendChart?.resize(); reasonChart?.resize() }) })
</script>

<style lang="scss" scoped>
.timeout-container { .filter-form { margin-bottom: 20px; } .stats-row { margin-bottom: 20px; .stat-card { display: flex; align-items: center; gap: 15px; .stat-icon { width: 50px; height: 50px; border-radius: 8px; display: flex; align-items: center; justify-content: center; } .stat-content { flex: 1; .stat-label { color: #909399; font-size: 14px; margin-bottom: 5px; } .stat-value { font-size: 20px; font-weight: bold; color: #303133; } .stat-danger { color: #F56C6C; } .stat-warning { color: #E6A23C; } .stat-info { color: #409EFF; } } } } .charts-row { margin-bottom: 20px; } .table-card { .duration-text { color: #E6A23C; font-weight: 500; } :deep(.el-pagination) { margin-top: 20px; justify-content: flex-end; } } }

.export-step {
  padding: 20px 0;

  .step-content {
    text-align: center;
    padding: 30px 20px;

    .loading-spinner {
      margin-bottom: 20px;
      width: 60px;
      height: 60px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .spinner {
      width: 100%;
      height: 100%;
      animation: rotate 1.5s linear infinite;
    }

    .spinner-path {
      stroke: var(--spinner-color, #67C23A);
      animation: dash 1.5s ease-in-out infinite;
    }

    .step-icon {
      margin-bottom: 20px;
      animation: pulse 2s ease-in-out infinite;
    }

    .step-text {
      h3 {
        font-size: 20px;
        color: #303133;
        margin-bottom: 10px;
      }

      p {
        font-size: 14px;
        color: #606266;
        line-height: 1.6;
      }
    }

    .el-progress {
      margin: 40px 0 20px;

      :deep(.el-progress__text) {
        .progress-text {
          font-size: 18px;
          font-weight: bold;
        }
      }
    }

    .progress-status {
      margin-top: 15px;
      font-size: 14px;
      color: #409EFF;
      font-weight: 500;
    }

    .el-input {
      :deep(.el-input__wrapper) {
        border-radius: 8px;
        padding: 12px 15px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
    }
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes dash {
  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}
</style>
