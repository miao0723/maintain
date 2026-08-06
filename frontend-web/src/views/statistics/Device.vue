<template>
  <div class="device-report-container">
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
        <el-form-item label="设备分类">
          <el-select v-model="searchForm.category_id" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleExport">导出报表</el-button>
        </el-form-item>
      </el-form>

      <!-- 统计图表 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-container">
            <h4>设备故障率趋势</h4>
            <div id="failure-chart" style="height: 300px"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <h4>设备维修成本</h4>
            <div id="cost-chart" style="height: 300px"></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <div class="chart-container">
            <h4>设备利用率</h4>
            <div id="utilization-chart" style="height: 300px"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <h4>设备维修时长</h4>
            <div id="duration-chart" style="height: 300px"></div>
          </div>
        </el-col>
      </el-row>

      <!-- 详细数据表格 -->
      <div class="table-container">
        <h4>设备详细报表</h4>
        <el-table :data="tableData" border stripe>
          <el-table-column prop="device_name" label="设备名称" />
          <el-table-column prop="device_code" label="设备编号" />
          <el-table-column prop="category" label="分类" />
          <el-table-column prop="total_orders" label="总工单数" />
          <el-table-column prop="failure_count" label="故障次数" />
          <el-table-column prop="failure_rate" label="故障率">
            <template #default="{ row }">
              {{ (row.failure_rate * 100).toFixed(2) }}%
            </template>
          </el-table-column>
          <el-table-column prop="avg_duration" label="平均维修时长(小时)" />
          <el-table-column prop="total_cost" label="总成本">
            <template #default="{ row }">
              ¥{{ row.total_cost.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="utilization" label="利用率">
            <template #default="{ row }">
              {{ (row.utilization * 100).toFixed(2) }}%
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
  category_id: ''
})

const categories = ref([])
const tableData = ref([])

let charts = []

const fetchData = async () => {
  try {
    // TODO: 调用API获取设备报表数据
    tableData.value = [
      {
        device_name: '中央空调A',
        device_code: 'DEV001',
        category: '暖通设备',
        total_orders: 12,
        failure_count: 3,
        failure_rate: 0.25,
        avg_duration: 4.5,
        total_cost: 3500.00,
        utilization: 0.85
      },
      {
        device_name: '电梯B',
        device_code: 'DEV002',
        category: '电梯设备',
        total_orders: 8,
        failure_count: 2,
        failure_rate: 0.25,
        avg_duration: 6.0,
        total_cost: 5000.00,
        utilization: 0.92
      }
    ]
  } catch (error) {
    console.error('获取报表数据失败:', error)
  }
}

const initCharts = () => {
  // 故障率趋势图
  const failureChart = echarts.init(document.getElementById('failure-chart'))
  failureChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}%' }
    },
    series: [
      {
        name: '故障率',
        type: 'line',
        data: [5, 4, 6, 3, 4, 5],
        smooth: true,
        itemStyle: { color: '#F56C6C' }
      }
    ]
  })
  charts.push(failureChart)

  // 维修成本图
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
        name: '维修成本',
        type: 'bar',
        data: [5000, 4500, 6000, 5500, 4800, 5200],
        itemStyle: { color: '#409EFF' }
      }
    ]
  })
  charts.push(costChart)

  // 设备利用率饼图
  const utilizationChart = echarts.init(document.getElementById('utilization-chart'))
  utilizationChart.setOption({
    tooltip: { trigger: 'item' },
    series: [
      {
        name: '设备状态',
        type: 'pie',
        radius: '60%',
        data: [
          { value: 120, name: '运行中' },
          { value: 15, name: '维护中' },
          { value: 10, name: '停机' },
          { value: 11, name: '报废' }
        ]
      }
    ]
  })
  charts.push(utilizationChart)

  // 维修时长图
  const durationChart = echarts.init(document.getElementById('duration-chart'))
  durationChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['中央空调', '电梯', '水泵', '发电机', '空压机']
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}小时' }
    },
    series: [
      {
        name: '平均维修时长',
        type: 'bar',
        data: [4.5, 6.0, 3.5, 5.0, 4.0],
        itemStyle: { color: '#67C23A' }
      }
    ]
  })
  charts.push(durationChart)
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
.device-report-container {
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
