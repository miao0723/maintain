<template>
  <div class="finance-report-container">
    <el-card shadow="never" v-loading="loading">
      <!-- 支出数据源提示 -->
      <el-alert
        title="支出数据源暂缺，仅展示收入口径"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 20px"
      />

      <!-- 统计卡片 -->
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <el-statistic title="总收入" :value="cards.total_income" :precision="2" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="本月收入" :value="cards.month_income" :precision="2" prefix="¥">
            <template #suffix>
              <span style="color: #67C23A">↗</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="累计退款" :value="cards.refund_amount" :precision="2" prefix="¥">
            <template #suffix>
              <span style="color: #F56C6C">↗</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="净收入" :value="cards.profit" :precision="2" prefix="¥">
            <template #suffix>
              <span style="color: #409EFF">↗</span>
            </template>
          </el-statistic>
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-container">
            <h4>收入趋势</h4>
            <div id="trend-chart" style="height: 300px"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <h4>收入构成</h4>
            <div id="income-chart" style="height: 300px"></div>
          </div>
        </el-col>
      </el-row>

      <!-- 支出区域（数据源暂缺提示） -->
      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="24">
          <div class="chart-container expense-empty">
            <h4>支出构成</h4>
            <el-empty description="支出数据源暂缺，仅展示收入口径" :image-size="100" />
          </div>
        </el-col>
      </el-row>

      <!-- 详细数据表格 -->
      <div class="table-container">
        <h4>收入明细</h4>
        <el-table :data="tableData" border stripe>
          <el-table-column prop="order_no" label="订单号" min-width="170" show-overflow-tooltip />
          <el-table-column prop="order_type" label="订单类型" width="100">
            <template #default="{ row }">{{ getOrderTypeText(row.order_type) }}</template>
          </el-table-column>
          <el-table-column prop="income_type" label="收入类型" width="110">
            <template #default="{ row }">
              <el-tag :type="getIncomeTypeTag(row.income_type)">{{ getIncomeTypeText(row.income_type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120" align="right">
            <template #default="{ row }">
              <span class="amount-text">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="payment_channel" label="支付渠道" width="110">
            <template #default="{ row }">{{ getChannelText(row.payment_channel) }}</template>
          </el-table-column>
          <el-table-column prop="payment_status" label="支付状态" width="100">
            <template #default="{ row }">{{ row.payment_status || '-' }}</template>
          </el-table-column>
          <el-table-column prop="paid_at" label="支付时间" width="160">
            <template #default="{ row }">{{ row.paid_at || '-' }}</template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无收入数据" />
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
import { getRepairFinanceReport } from '@/api/statistics'

const loading = ref(false)
const cards = ref({ total_income: 0, month_income: 0, refund_amount: 0, total_expense: 0, profit: 0, profit_rate: 0 })
const expenseAvailable = ref(false)
const trend = ref([])
const incomePie = ref([])
const tableData = ref([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

let charts = []

const getOrderTypeText = (type) => ({ repair: '维修', recycle: '回收' }[type] || type || '-')
const getIncomeTypeText = (type) => ({ order: '订单收入', adjust: '调整', compensation: '赔付' }[type] || type || '-')
const getIncomeTypeTag = (type) => ({ order: 'success', adjust: 'warning', compensation: 'danger' }[type] || 'info')
const getChannelText = (channel) => ({ wechat: '微信支付' }[channel] || channel || '-')

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getRepairFinanceReport({ page: pagination.page, page_size: pagination.pageSize })
    const data = res.data || {}
    cards.value = data.cards || cards.value
    expenseAvailable.value = !!data.expense_available
    trend.value = data.trend || []
    incomePie.value = data.income_pie || []
    tableData.value = data.list?.items || []
    pagination.total = data.list?.total || 0
    nextTick(initCharts)
  } catch (error) {
    console.error('获取财务报表数据失败:', error)
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

  // 收入趋势折线图
  const trendChart = echarts.init(document.getElementById('trend-chart'))
  trendChart.setOption({
    tooltip: { trigger: 'axis', valueFormatter: (v) => `¥${Number(v || 0).toFixed(2)}` },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: trend.value.map(i => i.month) },
    yAxis: { type: 'value', name: '收入(元)', axisLabel: { formatter: '¥{value}' } },
    series: [
      {
        name: '收入',
        type: 'line',
        data: trend.value.map(i => i.income),
        smooth: true,
        itemStyle: { color: '#67C23A' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        }
      }
    ]
  })
  charts.push(trendChart)

  // 收入构成饼图
  const incomeChart = echarts.init(document.getElementById('income-chart'))
  incomeChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '收入构成',
        type: 'pie',
        radius: '55%',
        data: incomePie.value
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
.finance-report-container {
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

  .expense-empty {
    min-height: 160px;
  }

  .table-container {
    margin-top: 20px;

    h4 {
      margin: 0 0 15px 0;
      font-size: 16px;
      color: #303133;
    }

    .amount-text {
      color: #67C23A;
      font-weight: 500;
    }

    :deep(.el-pagination) {
      margin-top: 20px;
      justify-content: flex-end;
    }
  }
}
</style>
