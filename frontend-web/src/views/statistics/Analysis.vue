<template>
  <div class="analysis-container">
    <el-row :gutter="20">
      <!-- 统计卡片 -->
      <el-col :span="6" v-for="stat in statistics" :key="stat.title">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" :style="{ background: stat.color }">
              <el-icon :size="30">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>工单趋势分析</span>
          </template>
          <div id="trend-chart" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>设备状态分布</span>
          </template>
          <div id="device-chart" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>维修类型统计</span>
          </template>
          <div id="type-chart" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>工程师绩效排名</span>
          </template>
          <div id="performance-chart" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <span>备件消耗排行</span>
      </template>
      <el-table :data="topParts" border stripe>
        <el-table-column type="index" label="排名" width="80" />
        <el-table-column prop="name" label="备件名称" />
        <el-table-column prop="code" label="备件编号" />
        <el-table-column prop="consumption" label="消耗数量" />
        <el-table-column prop="amount" label="消耗金额">
          <template #default="{ row }">
            ¥{{ row.amount.toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const statistics = ref([
  { title: '设备总数', value: '156', icon: 'Monitor', color: '#409EFF' },
  { title: '本月工单', value: '42', icon: 'Tickets', color: '#67C23A' },
  { title: '完成工单', value: '38', icon: 'CircleCheck', color: '#E6A23C' },
  { title: '待处理', value: '4', icon: 'Clock', color: '#F56C6C' }
])

const topParts = ref([
  { name: '空气滤芯', code: 'PART001', consumption: 120, amount: 3000.00 },
  { name: '机油滤芯', code: 'PART002', consumption: 85, amount: 2550.00 },
  { name: '刹车片', code: 'PART003', consumption: 45, amount: 4500.00 },
  { name: '火花塞', code: 'PART004', consumption: 60, amount: 1800.00 },
  { name: '皮带', code: 'PART005', consumption: 30, amount: 900.00 }
])

let charts = []

const initCharts = () => {
  // 工单趋势图
  const trendChart = echarts.init(document.getElementById('trend-chart'))
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['新建', '完成', '进行中'] },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '新建',
        type: 'line',
        data: [35, 42, 38, 45, 40, 42],
        smooth: true
      },
      {
        name: '完成',
        type: 'line',
        data: [30, 38, 35, 42, 38, 38],
        smooth: true
      },
      {
        name: '进行中',
        type: 'line',
        data: [5, 4, 3, 3, 2, 4],
        smooth: true
      }
    ]
  })
  charts.push(trendChart)

  // 设备状态饼图
  const deviceChart = echarts.init(document.getElementById('device-chart'))
  deviceChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '设备状态',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 120, name: '正常' },
          { value: 25, name: '维修中' },
          { value: 11, name: '报废' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  })
  charts.push(deviceChart)

  // 维修类型柱状图
  const typeChart = echarts.init(document.getElementById('type-chart'))
  typeChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['预防性维护', '故障维修', '定期巡检', '紧急维修', '升级改造']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '工单数',
        type: 'bar',
        data: [15, 18, 8, 12, 5],
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
  charts.push(typeChart)

  // 工程师绩效柱状图
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
        data: [25, 22, 20, 18, 15],
        itemStyle: { color: '#67C23A' }
      }
    ]
  })
  charts.push(performanceChart)
}

const handleResize = () => {
  charts.forEach(chart => chart.resize())
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  charts.forEach(chart => chart.dispose())
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.analysis-container {
  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        margin-right: 15px;
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
        }

        .stat-title {
          font-size: 14px;
          color: #909399;
          margin-top: 5px;
        }
      }
    }
  }
}
</style>
