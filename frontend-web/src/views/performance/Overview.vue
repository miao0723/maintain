<template>
  <div class="perf-overview">
    <!-- 筛选栏 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="时间范围">
          <el-date-picker v-model="filters.date_range" type="daterange" range-separator="至"
            start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 280px;" />
        </el-form-item>
        <el-form-item label="维修人员" v-if="!isWorker">
          <el-select v-model="filters.engineer_id" placeholder="全部人员" clearable filterable style="width: 160px;">
            <el-option v-for="e in engineers" :key="e.id" :label="e.name" :value="e.id" />
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
      :title="`您正在查看个人绩效（${myContext.engineer?.name || ''}）`"
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
                {{ kpiValue(kpi) }}<span class="kpi-unit">{{ kpi.unit }}</span>
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
        判定规则：统计周期内闭环工单 ≥ 最低样本量（{{ overview.standard_summary?.min_orders || 3 }} 单）且综合得分 ≥ 达标线（{{ overview.standard_summary?.pass_score || 80 }} 分），方为「符合标准」；样本不足暂不评级，单项是否达标见「绩效排行」红绿灯。
      </el-alert>
    </el-card>

    <!-- 不达标预警名单 -->
    <el-card shadow="never" class="alert-card" v-if="!isWorker && overview.alerts?.length">
      <template #header>
        <span class="card-title">不达标预警（{{ overview.alerts.length }} 人）</span>
      </template>
      <el-table :data="overview.alerts" border stripe>
        <el-table-column prop="name" label="姓名" width="110" />
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
      <el-col :span="24">
        <el-card shadow="never" class="chart-card">
          <template #header><span class="card-title">人员绩效 Top 5</span></template>
          <div ref="topRef" style="height: 320px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import { getPerformanceOverview, getPerformanceEngineers, getPerformanceContext } from '@/api/performance'
import { fmtDuration } from '@/utils/duration'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
// 图表配色随主题切换：深色用浅字/暗轴，护眼与浅色用默认深字
const chartTheme = computed(() => {
  const dark = themeStore.isDark
  return {
    text: dark ? '#c0c4cc' : '#606266',
    axisLine: dark ? '#4d4d4d' : '#e0e0e0',
    splitLine: dark ? '#2c2c2c' : '#f0f0f0',
    legend: dark ? '#c0c4cc' : '#606266'
  }
})

const loading = ref(false)
const filters = reactive({ date_range: [], engineer_id: '' })
const engineers = ref([])
const overview = ref({ kpis: {}, status_distribution: [], trend: [], top_engineers: [], team_summary: [] })
// 工人视角：登录账号关联绩效档案时，自动收敛到本人
const myContext = ref({ is_worker: false, engineer: null })
const isWorker = ref(false)

const trendRef = ref(null)
const statusRef = ref(null)
const topRef = ref(null)
let charts = []
let destroyed = false

const statusColor = { pending: '#909399', processing: '#E6A23C', waiting: '#409EFF', completed: '#67C23A', timeout: '#F56C6C' }

// 综合得分配色（与 Ranking 保持一致）；预警名单表格会用到
const scoreColor = (s) => (s >= 85 ? '#67C23A' : s >= 70 ? '#409EFF' : s >= 60 ? '#E6A23C' : '#F56C6C')

const kpiCards = ref([
  { key: 'score', label: '综合绩效得分', icon: 'Medal', color: 'var(--c-primary)', bg: 'var(--c-bg-info-soft)', unit: ' 分' },
  { key: 'total', label: '工单总数', icon: 'Tickets', color: 'var(--c-text-primary)', bg: 'var(--c-bg-muted)', unit: ' 单' },
  { key: 'on_time_rate', label: '按时完成率', icon: 'CircleCheck', color: 'var(--c-success)', bg: 'var(--c-bg-success-soft)', unit: ' %' },
  { key: 'avg_duration', label: '平均维修时长', icon: 'Timer', color: 'var(--c-warning)', bg: 'var(--c-bg-warning-soft)', unit: '' },
  { key: 'completed_count', label: '工单完成量', icon: 'Finished', color: 'var(--c-primary)', bg: 'var(--c-bg-info-soft)', unit: ' 单' },
  { key: 'rework_rate', label: '返修率', icon: 'RefreshLeft', color: 'var(--c-danger)', bg: 'var(--c-bg-danger-soft)', unit: ' %' },
  { key: 'first_fix_rate', label: '一次修复率', icon: 'Aim', color: 'var(--c-success)', bg: 'var(--c-bg-success-soft)', unit: ' %' },
  { key: 'qualified_rate', label: '合格率', icon: 'CircleCheckFilled', color: 'var(--c-primary)', bg: 'var(--c-bg-info-soft)', unit: ' %' },
  { key: 'avg_review', label: '平均验收评分', icon: 'Star', color: 'var(--c-warning)', bg: 'var(--c-bg-warning-soft)', unit: ' 分' }
])

// KPI 值渲染：平均维修时长为小时口径，走智能格式（X分钟/X小时/X.X天）
const kpiValue = (kpi) => {
  const v = overview.value.kpis[kpi.key]
  if (kpi.key === 'avg_duration') return fmtDuration(v)
  return v ?? '—'
}

const standardCards = computed(() => {
  const ss = overview.value.standard_summary || {}
  const total = ss.total || 0
  const rate = total > 0 ? Math.round((ss.qualified || 0) / total * 100) : 0
  return [
    { label: '达标人数', value: ss.qualified || 0, color: 'var(--c-success)', bg: 'var(--c-bg-success-soft)' },
    { label: '不达标人数', value: ss.unqualified || 0, color: 'var(--c-danger)', bg: 'var(--c-bg-danger-soft)' },
    { label: '样本不足', value: ss.insufficient || 0, color: 'var(--c-text-secondary)', bg: 'var(--c-bg-muted)' },
    { label: '整体达标率', value: rate + '%', color: 'var(--c-primary)', bg: 'var(--c-bg-info-soft)' },
    { label: '超期未交付', value: overview.value.overdue_open_total || 0, color: 'var(--c-warning)', bg: 'var(--c-bg-warning-soft)' }
  ]
})

const buildParams = () => ({
  start_date: filters.date_range?.[0] || '',
  end_date: filters.date_range?.[1] || '',
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
  // 组件已卸载（如退出登录、快速切换路由）时，DOM ref 已为 null，
  // 此时 echarts.init(null) 会抛 "Cannot read properties of null (reading 'getAttribute')"
  if (destroyed) return
  if (!trendRef.value || !statusRef.value || !topRef.value) return
  charts.forEach(c => c?.dispose())
  charts = []

  // 趋势
  const trend = overview.value.trend || []
  const ct = chartTheme.value
  const trendChart = echarts.init(trendRef.value)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['工单量', '按时完成率', '平均维修时长'], textStyle: { color: ct.legend } },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: trend.map(t => t.period),
      axisLine: { lineStyle: { color: ct.axisLine } },
      axisLabel: { color: ct.text }
    },
    yAxis: [
      { type: 'value', name: '工单量/时长(小时)', position: 'left', nameTextStyle: { color: ct.text }, axisLine: { lineStyle: { color: ct.axisLine } }, axisLabel: { color: ct.text }, splitLine: { lineStyle: { color: ct.splitLine } } },
      { type: 'value', name: '完成率%', position: 'right', max: 100, min: 0, nameTextStyle: { color: ct.text }, axisLine: { lineStyle: { color: ct.axisLine } }, axisLabel: { color: ct.text }, splitLine: { show: false } }
    ],
    series: [
      { name: '工单量', type: 'bar', data: trend.map(t => t.order_count), itemStyle: { color: '#409EFF' }, barWidth: 18 },
      { name: '平均维修时长(小时)', type: 'line', yAxisIndex: 0, data: trend.map(t => t.avg_duration), itemStyle: { color: '#E6A23C' }, smooth: true },
      { name: '按时完成率', type: 'line', yAxisIndex: 1, data: trend.map(t => t.on_time_rate), itemStyle: { color: '#67C23A' }, smooth: true }
    ]
  })
  charts.push(trendChart)

  // 状态分布
  const dist = overview.value.status_distribution || []
  const statusChart = echarts.init(statusRef.value)
  statusChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 单 ({d}%)' },
    legend: { bottom: 0, textStyle: { color: ct.legend } },
    series: [{
      type: 'pie', radius: ['42%', '70%'],
      label: { color: ct.text },
      data: dist.map(d => ({ name: d.label, value: d.count, itemStyle: { color: statusColor[d.status] } }))
    }]
  })
  charts.push(statusChart)

  // Top5
  const top = (overview.value.top_engineers || []).slice().reverse()
  const topChart = echarts.init(topRef.value)
  topChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => `${p[0].name}<br/>得分：${p[0].value}` },
    grid: { left: 70, right: 40, top: 20, bottom: 30 },
    xAxis: { type: 'value', max: 100, axisLine: { lineStyle: { color: ct.axisLine } }, axisLabel: { color: ct.text }, splitLine: { lineStyle: { color: ct.splitLine } } },
    yAxis: { type: 'category', data: top.map(t => t.name), axisLine: { lineStyle: { color: ct.axisLine } }, axisLabel: { color: ct.text }, splitLine: { lineStyle: { color: ct.splitLine } } },
    series: [{
      type: 'bar',
      data: top.map(t => t.score),
      itemStyle: { color: '#67C23A', borderRadius: [0, 4, 4, 0] }, barWidth: 18,
      label: { show: true, position: 'right', formatter: '{c}', color: ct.text }
    }]
  })
  charts.push(topChart)
}

// 主题切换（阳光/护眼/夜间）时重绘图表，使坐标轴/图例文字随主题变深或变浅
watch(() => themeStore.theme, () => { if (!destroyed) nextTick(renderCharts) })

const handleReset = () => {
  filters.date_range = []
  if (!isWorker.value) {
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
  try { engineers.value = await getPerformanceEngineers().then(r => r.data || []) } catch (e) {}
  fetchData()
  window.addEventListener('resize', resize)
})
onBeforeUnmount(() => {
  destroyed = true
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
  .std-label { font-size: 13px; color: var(--c-text-regular); margin-top: 4px; }
  .std-tip { margin-top: 14px; }
  .alert-card { margin-bottom: 16px; }
  .alert-reason { color: var(--c-warning); font-size: 13px; }
  .kpi-card {
    margin-bottom: 16px;
    .kpi-inner { display: flex; align-items: center; gap: 14px; }
    .kpi-icon { width: 46px; height: 46px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
    .kpi-body { min-width: 0; }
    .kpi-label { color: var(--c-text-secondary); font-size: 13px; margin-bottom: 4px; }
    .kpi-value { font-size: 22px; font-weight: 700; line-height: 1; }
    .kpi-unit { font-size: 13px; font-weight: 400; margin-left: 2px; }
  }
  .chart-row { margin-bottom: 16px; }
  .chart-card { margin-bottom: 0; }
  .card-title { font-weight: 600; color: var(--c-text-primary); }
}
</style>
