<template>
  <div class="maintenance-report-container">
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
        <el-form-item label="维保类型">
          <el-select v-model="searchForm.type" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="预防性维护" value="preventive" />
            <el-option label="定期巡检" value="inspection" />
            <el-option label="故障维修" value="repair" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleExport">导出报表</el-button>
        </el-form-item>
      </el-form>

      <!-- 统计卡片 -->
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="维保工单总数" :value="statistics.total" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="已完成" :value="statistics.completed">
            <template #suffix>
              <span style="color: #67C23A">↗</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="进行中" :value="statistics.ongoing">
            <template #suffix>
              <span style="color: #E6A23C">↗</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="完成率" :value="statistics.completion_rate" suffix="%" />
        </el-col>
      </el-row>

      <!-- 统计图表 -->
      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <div class="chart-container">
            <h4>维保工单趋势</h4>
            <div id="trend-chart" style="height: 300px"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <h4>维保类型分布</h4>
            <div id="type-chart" style="height: 300px"></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <div class="chart-container">
            <h4>响应时间分析</h4>
            <div id="response-chart" style="height: 300px"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <h4>维保成本分析</h4>
            <div id="cost-chart" style="height: 300px"></div>
          </div>
        </el-col>
      </el-row>

      <!-- 详细数据表格 -->
      <div class="table-container">
        <h4>维保详细记录</h4>
        <el-table :data="tableData" border stripe>
          <el-table-column prop="order_no" label="工单编号" width="150" />
          <el-table-column prop="device_name" label="设备名称" width="150" />
          <el-table-column prop="type" label="维保类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getTypeTag(row.type)">
                {{ getTypeText(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="engineer" label="工程师" width="100" />
          <el-table-column prop="start_time" label="开始时间" width="160" />
          <el-table-column prop="end_time" label="完成时间" width="160" />
          <el-table-column prop="duration" label="耗时(小时)" width="100" />
          <el-table-column prop="cost" label="成本" width="100">
            <template #default="{ row }">
              ¥{{ row.cost.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'completed' ? 'success' : 'warning'">
                {{ row.status === 'completed' ? '已完成' : '进行中' }}
              </el-tag>
            </template>
          </el-table-column>
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
  type: ''
})

const statistics = ref({
  total: 156,
  completed: 142,
  ongoing: 14,
  completion_rate: 91.0
})

const tableData = ref([])

let charts = []

const getTypeTag = (type) => {
  const map = {
    preventive: 'success',
    inspection: 'info',
    repair: 'warning'
  }
  return map[type] || ''
}

const getTypeText = (type) => {
  const map = {
    preventive: '预防性维护',
    inspection: '定期巡检',
    repair: '故障维修'
  }
  return map[type] || type
}

const fetchData = async () => {
  try {
    // TODO: 调用API获取维保报表数据
    tableData.value = [
      {
        order_no: 'WO20240324001',
        device_name: '中央空调A',
        type: 'preventive',
        engineer: '张三',
        start_time: '2024-03-24 09:00:00',
        end_time: '2024-03-24 12:00:00',
        duration: 3,
        cost: 300.00,
        status: 'completed'
      }
    ]
  } catch (error) {
    console.error('获取报表数据失败:', error)
  }
}

const initCharts = () => {
  // 维保工单趋势图
  const trendChart = echarts.init(document.getElementById('trend-chart'))
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['预防性维护', '定期巡检', '故障维修'] },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '预防性维护',
        type: 'line',
        data: [15, 18, 16, 20, 18, 22],
        smooth: true
      },
      {
        name: '定期巡检',
        type: 'line',
        data: [8, 10, 9, 11, 10, 12],
        smooth: true
      },
      {
        name: '故障维修',
        type: 'line',
        data: [12, 14, 13, 15, 14, 16],
        smooth: true
      }
    ]
  })
  charts.push(trendChart)

  // 维保类型饼图
  const typeChart = echarts.init(document.getElementById('type-chart'))
  typeChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '维保类型',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 109, name: '预防性维护' },
          { value: 60, name: '定期巡检' },
          { value: 84, name: '故障维修' }
        ]
      }
    ]
  })
  charts.push(typeChart)

  // 响应时间图
  const responseChart = echarts.init(document.getElementById('response-chart'))
  responseChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}分钟' }
    },
    series: [
      {
        name: '平均响应时间',
        type: 'bar',
        data: [15, 18, 12, 14, 16, 13],
        itemStyle: { color: '#409EFF' }
      }
    ]
  })
  charts.push(responseChart)

  // 维保成本图
  const costChart = echarts.init(document.getElementById('cost-chart'))
  costChart.setOption({
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
        name: '维保成本',
        type: 'line',
        data: [5000, 5500, 4800, 6000, 5200, 5800],
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
          ])
        }
      }
    ]
  })
  charts.push(costChart)
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
.maintenance-report-container {
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
