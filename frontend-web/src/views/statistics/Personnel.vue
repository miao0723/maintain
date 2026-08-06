<template>
  <div class="personnel-report-container">
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
        <el-form-item label="部门">
          <el-select v-model="searchForm.department_id" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
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
          <el-statistic title="人员总数" :value="statistics.total" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="在岗人数" :value="statistics.active" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="本月完成工单" :value="statistics.completed_orders" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="平均评分" :value="statistics.avg_rating" :precision="1" />
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-container">
            <h4>人员绩效排名</h4>
            <div id="performance-chart" style="height: 300px"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <h4>工单完成趋势</h4>
            <div id="trend-chart" style="height: 300px"></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <div class="chart-container">
            <h4>技能等级分布</h4>
            <div id="skill-chart" style="height: 300px"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-container">
            <h4>工作量分布</h4>
            <div id="workload-chart" style="height: 300px"></div>
          </div>
        </el-col>
      </el-row>

      <!-- 详细数据表格 -->
      <div class="table-container">
        <h4>人员绩效详情</h4>
        <el-table :data="tableData" border stripe>
          <el-table-column type="index" label="排名" width="80" />
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="department" label="部门" width="120" />
          <el-table-column prop="completed_orders" label="完成工单" width="100" />
          <el-table-column prop="total_hours" label="总工时(小时)" width="120" />
          <el-table-column prop="avg_response_time" label="平均响应(分钟)" width="130" />
          <el-table-column prop="avg_duration" label="平均时长(小时)" width="130" />
          <el-table-column prop="avg_rating" label="平均评分" width="100">
            <template #default="{ row }">
              <el-rate v-model="row.avg_rating" disabled />
            </template>
          </el-table-column>
          <el-table-column prop="satisfaction" label="满意度" width="100">
            <template #default="{ row }">
              {{ (row.satisfaction * 100).toFixed(1) }}%
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
  department_id: ''
})

const statistics = ref({
  total: 25,
  active: 22,
  completed_orders: 385,
  avg_rating: 4.6
})

const tableData = ref([])
const departments = ref([])

let charts = []

const fetchData = async () => {
  try {
    // TODO: 调用API获取人员报表数据
    tableData.value = [
      {
        name: '张三',
        department: '维修部',
        completed_orders: 45,
        total_hours: 180,
        avg_response_time: 15,
        avg_duration: 4.0,
        avg_rating: 4.8,
        satisfaction: 0.95
      },
      {
        name: '李四',
        department: '维修部',
        completed_orders: 42,
        total_hours: 168,
        avg_response_time: 18,
        avg_duration: 4.0,
        avg_rating: 4.6,
        satisfaction: 0.92
      },
      {
        name: '王五',
        department: '工程部',
        completed_orders: 38,
        total_hours: 152,
        avg_response_time: 20,
        avg_duration: 4.0,
        avg_rating: 4.5,
        satisfaction: 0.90
      }
    ]
    departments.value = [
      { id: 1, name: '维修部' },
      { id: 2, name: '工程部' }
    ]
  } catch (error) {
    console.error('获取报表数据失败:', error)
  }
}

const initCharts = () => {
  // 绩效排名柱状图
  const performanceChart = echarts.init(document.getElementById('performance-chart'))
  performanceChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['张三', '李四', '王五', '赵六', '孙七']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '完成工单',
        type: 'bar',
        data: [45, 42, 38, 35, 30],
        itemStyle: { color: '#67C23A' }
      }
    ]
  })
  charts.push(performanceChart)

  // 工单完成趋势图
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
        name: '完成工单',
        type: 'line',
        data: [60, 65, 62, 70, 68, 75],
        smooth: true
      }
    ]
  })
  charts.push(trendChart)

  // 技能等级饼图
  const skillChart = echarts.init(document.getElementById('skill-chart'))
  skillChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '技能等级',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 5, name: '专家工程师' },
          { value: 8, name: '高级工程师' },
          { value: 10, name: '中级工程师' },
          { value: 2, name: '初级工程师' }
        ]
      }
    ]
  })
  charts.push(skillChart)

  // 工作量柱状图
  const workloadChart = echarts.init(document.getElementById('workload-chart'))
  workloadChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['张三', '李四', '王五', '赵六', '孙七']
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}小时' }
    },
    series: [
      {
        name: '总工时',
        type: 'bar',
        data: [180, 168, 152, 145, 130],
        itemStyle: { color: '#409EFF' }
      }
    ]
  })
  charts.push(workloadChart)
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
.personnel-report-container {
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
