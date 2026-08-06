<template>
  <div class="workorder-report-container">
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
        <el-form-item label="工单状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="待派单" value="pending" />
            <el-option label="已派单" value="assigned" />
            <el-option label="维修中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
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
          <el-statistic title="工单总数" :value="statistics.total" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="已完成" :value="statistics.completed">
            <template #suffix>
              <span style="color: #67C23A">↗</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="完成率" :value="statistics.completion_rate" suffix="%" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="平均处理时长" :value="statistics.avg_duration" suffix="小时" />
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
        <el-col :span="12">
          <div class="chart-container">
            <h4>响应时间分析</h4>
            <div id="response-chart" style="height: 300px"></div>
          </div>
        </el-col>
      </el-row>

      <!-- 详细数据表格 -->
      <div class="table-container">
        <h4>工单详细数据</h4>
        <el-table :data="tableData" border stripe>
          <el-table-column prop="order_no" label="工单编号" width="150" />
          <el-table-column prop="device_name" label="设备名称" width="150" />
          <el-table-column prop="fault_description" label="故障描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="priority" label="优先级" width="100">
            <template #default="{ row }">
              <el-tag :type="getPriorityType(row.priority)">
                {{ getPriorityText(row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="160" />
          <el-table-column prop="completed_at" label="完成时间" width="160" />
          <el-table-column prop="duration" label="处理时长(小时)" width="120" />
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
  status: ''
})

const statistics = ref({
  total: 156,
  completed: 142,
  completion_rate: 91.0,
  avg_duration: 4.5
})

const tableData = ref([])

let charts = []

const getPriorityType = (priority) => {
  const map = { low: 'info', medium: 'warning', high: 'danger' }
  return map[priority] || 'info'
}

const getPriorityText = (priority) => {
  const map = { low: '低', medium: '中', high: '高' }
  return map[priority] || priority
}

const getStatusType = (status) => {
  const map = {
    pending: 'info',
    assigned: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待派单',
    assigned: '已派单',
    processing: '维修中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const fetchData = async () => {
  try {
    // TODO: 调用API获取工单报表数据
    tableData.value = [
      {
        order_no: 'WO20240324001',
        device_name: '中央空调A',
        fault_description: '不制冷，需要添加制冷剂',
        priority: 'medium',
        status: 'completed',
        created_at: '2024-03-24 09:00:00',
        completed_at: '2024-03-24 12:00:00',
        duration: 3
      }
    ]
  } catch (error) {
    console.error('获取报表数据失败:', error)
  }
}

const initCharts = () => {
  // 工单趋势图
  const trendChart = echarts.init(document.getElementById('trend-chart'))
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '工单数',
        type: 'line',
        data: [35, 42, 38, 45, 40, 42],
        smooth: true
      }
    ]
  })
  charts.push(trendChart)

  // 工单状态饼图
  const statusChart = echarts.init(document.getElementById('status-chart'))
  statusChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '工单状态',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 142, name: '已完成' },
          { value: 8, name: '维修中' },
          { value: 4, name: '待派单' },
          { value: 2, name: '已取消' }
        ]
      }
    ]
  })
  charts.push(statusChart)

  // 工单类型柱状图
  const typeChart = echarts.init(document.getElementById('type-chart'))
  typeChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['故障维修', '预防性维护', '定期巡检', '安装调试', '其他']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '工单数',
        type: 'bar',
        data: [65, 35, 28, 15, 13],
        itemStyle: { color: '#409EFF' }
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
        type: 'line',
        data: [15, 18, 12, 14, 16, 13],
        smooth: true,
        itemStyle: { color: '#67C23A' }
      }
    ]
  })
  charts.push(responseChart)
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
.workorder-report-container {
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
