<template>
  <div class="finance-report-container">
    <el-card shadow="never">
      <!-- 查询条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="统计类型">
          <el-select v-model="searchForm.type" placeholder="请选择">
            <el-option label="按月" value="month" />
            <el-option label="按季度" value="quarter" />
            <el-option label="按年" value="year" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleExport">导出报表</el-button>
        </el-form-item>
      </el-form>

      <!-- 统计卡片 -->
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <el-statistic title="总收入" :value="statistics.total_income" precision="2" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="总支出" :value="statistics.total_expense" precision="2" prefix="¥">
            <template #suffix>
              <span style="color: #F56C6C">↗</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="净利润" :value="statistics.profit" precision="2" prefix="¥">
            <template #suffix>
              <span style="color: #67C23A">↗</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="利润率" :value="statistics.profit_rate" suffix="%" />
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-container">
            <h4>收支趋势</h4>
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

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <div class="chart-container">
            <h4>支出构成</h4>
            <div id="expense-chart" style="height: 300px"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <h4>利润分析</h4>
            <div id="profit-chart" style="height: 300px"></div>
          </div>
        </el-col>
      </el-row>

      <!-- 详细数据表格 -->
      <div class="table-container">
        <h4>收支明细</h4>
        <el-table :data="tableData" border stripe>
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'income' ? 'success' : 'danger'">
                {{ row.type === 'income' ? '收入' : '支出' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="150" />
          <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="{ row }">
              <span :style="{ color: row.type === 'income' ? '#67C23A' : '#F56C6C', fontWeight: 'bold' }">
                {{ row.type === 'income' ? '+' : '-' }}¥{{ row.amount.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="operator" label="操作人" width="100" />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const searchForm = reactive({
  date_range: [],
  type: 'month'
})

const statistics = ref({
  total_income: 256800.00,
  total_expense: 185600.00,
  profit: 71200.00,
  profit_rate: 27.7
})

const tableData = ref([])

let charts = []

const fetchData = async () => {
  try {
    // TODO: 调用API获取财务报表数据
    tableData.value = [
      {
        date: '2024-03-24',
        type: 'income',
        category: '维修服务',
        description: '中央空调维修费',
        amount: 800.00,
        operator: '张三'
      },
      {
        date: '2024-03-24',
        type: 'expense',
        category: '备件采购',
        description: '采购空气滤芯',
        amount: 2500.00,
        operator: '李四'
      }
    ]
  } catch (error) {
    console.error('获取报表数据失败:', error)
  }
}

const initCharts = () => {
  // 收支趋势图
  const trendChart = echarts.init(document.getElementById('trend-chart'))
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出', '利润'] },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '¥{value}' }
    },
    series: [
      {
        name: '收入',
        type: 'bar',
        data: [42000, 45000, 43000, 48000, 46000, 50000],
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '支出',
        type: 'bar',
        data: [30000, 32000, 31000, 35000, 33000, 36000],
        itemStyle: { color: '#F56C6C' }
      },
      {
        name: '利润',
        type: 'line',
        data: [12000, 13000, 12000, 13000, 13000, 14000],
        smooth: true,
        itemStyle: { color: '#409EFF' }
      }
    ]
  })
  charts.push(trendChart)

  // 收入构成饼图
  const incomeChart = echarts.init(document.getElementById('income-chart'))
  incomeChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '收入构成',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 180000, name: '维修服务' },
          { value: 45000, name: '保养服务' },
          { value: 25000, name: '备件销售' },
          { value: 6800, name: '其他收入' }
        ]
      }
    ]
  })
  charts.push(incomeChart)

  // 支出构成饼图
  const expenseChart = echarts.init(document.getElementById('expense-chart'))
  expenseChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '支出构成',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 120000, name: '备件采购' },
          { value: 35000, name: '人员工资' },
          { value: 20000, name: '设备折旧' },
          { value: 10600, name: '其他支出' }
        ]
      }
    ]
  })
  charts.push(expenseChart)

  // 利润分析柱状图
  const profitChart = echarts.init(document.getElementById('profit-chart'))
  profitChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '¥{value}' }
    },
    series: [
      {
        name: '利润',
        type: 'bar',
        data: [12000, 13000, 12000, 13000, 13000, 14000],
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
  charts.push(profitChart)
}

const handleSearch = () => {
  fetchData()
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

const handleResize = () => {
  charts.forEach(chart => chart.resize())
}

onMounted(() => {
  fetchData()
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  charts.forEach(chart => chart.dispose())
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.finance-report-container {
  .search-form {
    margin-bottom: 20px;
  }

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
