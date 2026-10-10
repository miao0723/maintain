<template>
  <div class="perf-overview">
    <!-- 筛选栏 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="时间范围">
          <el-date-picker v-model="filters.date_range" type="daterange" range-separator="至"
            start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 280px;" />
        </el-form-item>
        <el-form-item label="班组" v-if="!isWorker">
          <el-select v-model="filters.team" placeholder="全部班组" clearable style="width: 150px;">
            <el-option v-for="t in teams" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="维修人员" v-if="!isWorker">
          <el-select v-model="filters.engineer_id" placeholder="全部人员" clearable filterable style="width: 160px;">
            <el-option v-for="e in engineers" :key="e.id" :label="`${e.name}（${e.team}）`" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData"><el-icon><Search /></el-icon>查询</el-button>
          <el-button @click="handleReset"><el-icon><RefreshLeft /></el-icon>重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-alert
      v-if="isWorker"
      type="success"
      show-icon
      :closable="false"
      class="worker-banner"
      :title="`您正在查看个人绩效（${myContext.engineer?.name || ''} · ${myContext.engineer?.team || ''}）`"
      description="作为维修人员，本页仅展示您本人的绩效数据；管理员可在「工单明细 / 绩效排行」中查看全部人员。"
    />

    <!-- KPI 卡片 -->
    <el-row :gutter="16" class="kpi-row" v-loading="loading">
      <el-col :span="6" v-for="kpi in kpiCards" :key="kpi.key">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-inner">
            <div class="kpi-icon" :style="{ background: kpi.bg }">
              <el-icon :size="22" :color="kpi.color"><component :is="kpi.icon" /></el-icon>
            </div>
            <div class="kpi-body">
              <div class="kpi-label">{{ kpi.label }}</div>
              <div class="kpi-value" :style="{ color: kpi.color }">
                {{ overview.kpis[kpi.key] ?? '—' }}<span class="kpi-unit">{{ kpi.unit }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 达标概览（老板视角：人员是否符合标准） -->
    <el-card shadow="never" class="standard-card" v-if="!isWorker">
      <template #header><span class="card-title">达标概览 · 人员是否符合标准</span></template>
      <el-row :gutter="16">
        <el-col :span="4" v-for="s in standardCards" :key="s.label">
          <div class="std-block" :style="{ background: s.bg }">
            <div class="std-num" :style="{ color: s.color }">{{ s.value }}</div>
            <div class="std-label">{{ s.label }}</div>
          </div>
        </el-col>
      </el-row>
      <el-alert type="info" :closable="false" class="std-tip">
        判定规则：统计周期内闭环工单 ≥ 最低样本量（{{ overview.standard_summary?.min_orders || 3 }} 单）且综合得分 ≥ 达标线（{{ overview.standard_summary?.pass_score || 80 }} 分）且合格率达标，方为「符合标准」；否则「不符合」。
      </el-alert>
    </el-card>

    <!-- 不达标预警名单 -->
    <el-card shadow="never" class="alert-card" v-if="!isWorker && overview.alerts?.length">
      <template #header>
        <span class="card-title">不达标预警（{{ overview.alerts.length }} 人）</span>
      </template>
      <el-table :data="overview.alerts" border stripe>
        <el-table-column prop="name" label="姓名" width="110" />
        <el-table-column prop="team" label="班组" width="100" />
        <el-table-column prop="score" label="综合得分" width="110" align="center">
          <template #default="{ row }"><span :style="{ color: scoreColor(row.score), fontWeight: 700 }">{{ row.score }}</span></template>
        </el-table-column>
        <el-table-column label="不达标原因" min-width="300">
          <template #default="{ row }"><span class="alert-reason">{{ row.reason }}</span></template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 图表区 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :span="16">
        <el-card shadow="never" class="chart-card">
          <template #header><span class="card-title">绩效趋势（按月）</span></template>
          <div ref="trendRef" style="height: 340px;"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="chart-card">
          <template #header><span class="card-title">工单状态分布</span></template>
          <div ref="statusRef" style="height: 340px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="12">
        <el-card shadow="never" class="chart-card">
          <template #header><span class="card-title">各班组综合得分</span></template>
          <div ref="teamRef" style="height: 320px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="chart-card">
          <template #header><span class="card-title">人员绩效 Top 5</span></template>
          <div ref="topRef" style="height: 320px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { getPerformanceOverview, getPerformanceTeams, getPerformanceEngineers, getPerformanceContext } from '@/api/performance'

const loading = ref(false)
const filters = reactive({ date_range: [], team: '', engineer_id: '' })
const teams = ref([])
const engineers = ref([])
const overview = ref({ kpis: {}, status_distribution: [], trend: [], top_engineers: [], team_summary: [] })
// 工人视角：登录账号关联绩效档案时，自动收敛到本人
const myContext = ref({ is_worker: false, engineer: null })
const isWorker = ref(false)

const trendRef = ref(null)
const statusRef = ref(null)
const teamRef = ref(null)
const topRef = ref(null)
let charts = []

const statusColor = { pending: '#909399', processing: '#E6A23C', waiting: '#409EFF', completed: '#67C23A', timeout: '#F56C6C' }

// 综合得分配色（与 Ranking 保持一致）；预警名单表格会用到
const scoreColor = (s) => (s >= 85 ? '#67C23A' : s >= 70 ? '#409EFF' : s >= 60 ? '#E6A23C' : '#F56C6C')

const kpiCards = ref([
  { key: 'score', label: '综合绩效得分', icon: 'Medal', color: '#409EFF', bg: '#ecf5ff', unit: ' 分' },
  { key: 'total', label: '工单总数', icon: 'Tickets', color: '#303133', bg: '#f4f4f5', unit: ' 单' },
  { key: 'on_time_rate', label: '按时完成率', icon: 'CircleCheck', color: '#67C23A', bg: '#f0f9eb', unit: ' %' },
  { key: 'avg_duration', label: '平均维修时长', icon: 'Timer', color: '#E6A23C', bg: '#fdf6ec', unit: ' 天' },
  { key: 'completed_count', label: '工单完成量', icon: 'Finished', color: '#409EFF', bg: '#ecf5ff', unit: ' 单' },
  { key: 'rework_rate', label: '返修率', icon: 'RefreshLeft', color: '#F56C6C', bg: '#fef0f0', unit: ' %' },
  { key: 'first_fix_rate', label: '一次修复率', icon: 'Aim', color: '#67C23A', bg: '#f0f9eb', unit: ' %' },
  { key: 'qualified_rate', label: '合格率', icon: 'CircleCheckFilled', color: '#409EFF', bg: '#ecf5ff', unit: ' %' },
  { key: 'avg_review', label: '平均验收评分', icon: 'Star', color: '#E6A23C', bg: '#fdf6ec', unit: ' 分' }
])

const standardCards = computed(() => {
  const ss = overview.value.standard_summary || {}
  const total = ss.total || 0
  const rate = total > 0 ? Math.round((ss.qualified || 0) / total * 100) : 0
  return [
    { label: '达标人数', value: ss.qualified || 0, color: '#67C23A', bg: '#f0f9eb' },
    { label: '不达标人数', value: ss.unqualified || 0, color: '#F56C6C', bg: '#fef0f0' },
    { label: '样本不足', value: ss.insufficient || 0, color: '#909399', bg: '#f4f4f5' },
    { label: '整体达标率', value: rate + '%', color: '#409EFF', bg: '#ecf5ff' },
    { label: '超期未交付', value: overview.value.overdue_open_total || 0, color: '#E6A23C', bg: '#fdf6ec' }
  ]
})

const buildParams = () => ({
  start_date: filters.date_range?.[0] || '',
  end_date: filters.date_range?.[1] || '',
  team: isWorker.value ? '' : filters.team,
  engineer_id: isWorker.value && myContext.value.engineer ? myContext.value.engineer.id : filters.engineer_id
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPerformanceOverview(buildParams())
    overview.value = res.data
  } finally {
    loading.value = false
    nextTick(renderCharts)
  }
}

const renderCharts = () => {
  charts.forEach(c => c?.dispose())
  charts = []

  // 趋势
  const trend = overview.value.trend || []
  const trendChart = echarts.init(trendRef.value)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['工单量', '按时完成率', '平均维修时长'] },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: trend.map(t => t.period) },
    yAxis: [
      { type: 'value', name: '工单量/时长', position: 'left' },
      { type: 'value', name: '完成率%', position: 'right', max: 100, min: 0 }
    ],
    series: [
      { name: '工单量', type: 'bar', data: trend.map(t => t.order_count), itemStyle: { color: '#409EFF' }, barWidth: 18 },
      { name: '平均维修时长', type: 'line', yAxisIndex: 0, data: trend.map(t => t.avg_duration), itemStyle: { color: '#E6A23C' }, smooth: true },
      { name: '按时完成率', type: 'line', yAxisIndex: 1, data: trend.map(t => t.on_time_rate), itemStyle: { color: '#67C23A' }, smooth: true }
    ]
  })
  charts.push(trendChart)

  // 状态分布
  const dist = overview.value.status_distribution || []
  const statusChart = echarts.init(statusRef.value)
  statusChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 单 ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['42%', '70%'],
      data: dist.map(d => ({ name: d.label, value: d.count, itemStyle: { color: statusColor[d.status] } }))
    }]
  })
  charts.push(statusChart)

  // 班组得分
  const teamsData = overview.value.team_summary || []
  const teamChart = echarts.init(teamRef.value)
  teamChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 60, right: 30, top: 20, bottom: 30 },
    xAxis: { type: 'value', max: 100 },
    yAxis: { type: 'category', data: teamsData.map(t => t.team).reverse() },
    series: [{
      type: 'bar', data: teamsData.map(t => t.score).reverse(),
      itemStyle: { color: '#409EFF', borderRadius: [0, 4, 4, 0] }, barWidth: 18,
      label: { show: true, position: 'right', formatter: '{c}' }
    }]
  })
  charts.push(teamChart)

  // Top5
  const top = (overview.value.top_engineers || []).slice().reverse()
  const topChart = echarts.init(topRef.value)
  topChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => `${p[0].name}<br/>得分：${p[0].value}<br/>班组：${p[0].data.team || ''}` },
    grid: { left: 70, right: 40, top: 20, bottom: 30 },
    xAxis: { type: 'value', max: 100 },
    yAxis: { type: 'category', data: top.map(t => t.name) },
    series: [{
      type: 'bar',
      data: top.map(t => ({ value: t.score, team: t.team })),
      itemStyle: { color: '#67C23A', borderRadius: [0, 4, 4, 0] }, barWidth: 18,
      label: { show: true, position: 'right', formatter: '{c}' }
    }]
  })
  charts.push(topChart)
}

const handleReset = () => {
  filters.date_range = []
  if (!isWorker.value) {
    filters.team = ''
    filters.engineer_id = ''
  }
  fetchData()
}

const resize = () => charts.forEach(c => c?.resize())
onMounted(async () => {
  try {
    const ctx = await getPerformanceContext().then(r => r.data || { is_worker: false, engineer: null })
    myContext.value = ctx
    if (ctx.is_worker && ctx.engineer) {
      isWorker.value = true
      filters.engineer_id = ctx.engineer.id
    }
  } catch (e) {}
  try { teams.value = await getPerformanceTeams().then(r => r.data || []) } catch (e) {}
  try { engineers.value = await getPerformanceEngineers().then(r => r.data || []) } catch (e) {}
  fetchData()
  window.addEventListener('resize', resize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  charts.forEach(c => c?.dispose())
})
</script>

<style lang="scss" scoped>
.perf-overview {
  .filter-card { margin-bottom: 16px; }
  .worker-banner { margin-bottom: 16px; }
  .filter-form { margin-bottom: -10px; }
  .kpi-row { margin-bottom: 16px; }
  .standard-card { margin-bottom: 16px; }
  .std-block { border-radius: 10px; padding: 16px; text-align: center; }
  .std-num { font-size: 28px; font-weight: 800; line-height: 1.1; }
  .std-label { font-size: 13px; color: #606266; margin-top: 4px; }
  .std-tip { margin-top: 14px; }
  .alert-card { margin-bottom: 16px; }
  .alert-reason { color: #e6a23c; font-size: 13px; }
  .kpi-card {
    margin-bottom: 16px;
    .kpi-inner { display: flex; align-items: center; gap: 14px; }
    .kpi-icon { width: 46px; height: 46px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
    .kpi-body { min-width: 0; }
    .kpi-label { color: #909399; font-size: 13px; margin-bottom: 4px; }
    .kpi-value { font-size: 22px; font-weight: 700; line-height: 1; }
    .kpi-unit { font-size: 13px; font-weight: 400; margin-left: 2px; }
  }
  .chart-row { margin-bottom: 16px; }
  .chart-card { margin-bottom: 0; }
  .card-title { font-weight: 600; color: #303133; }
}
</style>
