<template>
  <div class="workorder-report-container">
    <el-card shadow="never" v-loading="loading">
      <!-- 统计卡片 -->
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <el-statistic title="工单总数" :value="cards.total" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="已完成" :value="cards.completed">
            <template #suffix>
              <span style="color: #67C23A">↗</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="完成率" :value="cards.completion_rate" suffix="%" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="平均处理时长" :value="cards.avg_hours" suffix="小时" />
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-container">
            <h4>工单趋势分析</h4>
            <div id="trend-chart" style="height: 300px"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <h4>工单状态分布</h4>
            <div id="status-chart" style="height: 300px"></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <div class="chart-container">
            <h4>工单类型统计</h4>
            <div id="type-chart" style="height: 300px"></div>
          </div>
        </el-col>
      </el-row>

      <!-- 详细数据表格 -->
      <div class="table-container">
        <h4>工单详细数据</h4>
        <el-table :data="tableData" border stripe>
          <el-table-column prop="order_id" label="工单编号" min-width="160" show-overflow-tooltip />
          <el-table-column prop="user_name" label="客户" width="110" show-overflow-tooltip />
          <el-table-column prop="order_type" label="类型" width="90">
            <template #default="{ row }">
              <el-tag :type="row.order_type === 'repair' ? 'primary' : 'warning'">
                {{ getOrderTypeText(row.order_type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="device_model" label="设备型号" min-width="130" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="progress" label="进度" width="90">
            <template #default="{ row }">
              <span v-if="row.progress != null">{{ row.progress }}%</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="actual_price" label="金额" width="110" align="right">
            <template #default="{ row }">
              <span v-if="row.actual_price != null" class="amount-text">¥{{ Number(row.actual_price).toFixed(2) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="160" />
          <el-table-column prop="completed_at" label="完成时间" width="160">
            <template #default="{ row }">{{ row.completed_at || '-' }}</template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无工单数据" />
          </template>
        </el-table>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getRepairOrderReport } from '@/api/statistics'

const loading = ref(false)
const cards = ref({ total: 0, completed: 0, cancelled: 0, completion_rate: 0, avg_hours: 0 })
const trend = ref([])
const statusPie = ref([])
const typeBar = ref([])
const tableData = ref([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

let charts = []

const STATUS_MAP = {
  pending: { text: '待处理', type: 'info' },
  quoted: { text: '已报价', type: 'warning' },
  confirmed: { text: '已确认', type: 'primary' },
  processing: { text: '维修中', type: 'warning' },
  completed: { text: '已完成', type: 'success' },
  review: { text: '待评价', type: 'info' },
  cancelled: { text: '已取消', type: 'danger' }
}

const getStatusText = (status) => STATUS_MAP[status]?.text || status || '未知'
const getStatusType = (status) => STATUS_MAP[status]?.type || 'info'
const getOrderTypeText = (type) => ({ repair: '维修', recycle: '回收' }[type] || type || '-')

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getRepairOrderReport({ page: pagination.page, page_size: pagination.pageSize })
    const data = res.data || {}
    cards.value = data.cards || cards.value
    trend.value = data.trend || []
    statusPie.value = data.status_pie || []
    typeBar.value = data.type_bar || []
    tableData.value = data.list?.items || []
    pagination.total = data.list?.total || 0
    nextTick(initCharts)
  } catch (error) {
    console.error('获取工单报表数据失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = () => {
  pagination.page = 1
  fetchData()
}

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
    yAxis: { type: 'value', name: '工单数' },
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
        itemStyle: { color: '#67C23A' }
      }
    ]
  })
  charts.push(trendChart)

  // 工单状态饼图
  const statusChart = echarts.init(document.getElementById('status-chart'))
  statusChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '工单状态',
        type: 'pie',
        radius: '55%',
        data: statusPie.value
      }
    ]
  })
  charts.push(statusChart)

  // 工单类型柱状图
  const typeChart = echarts.init(document.getElementById('type-chart'))
  typeChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: typeBar.value.map(i => i.name) },
    yAxis: { type: 'value', name: '工单数' },
    series: [
      {
        name: '工单数',
        type: 'bar',
        barWidth: '40%',
        data: typeBar.value.map(i => i.value),
        itemStyle: { color: '#409EFF' }
      }
    ]
  })
  charts.push(typeChart)
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
.workorder-report-container {
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

    :deep(.el-pagination) {
      margin-top: 20px;
      justify-content: flex-end;
    }
  }
}
</style>
