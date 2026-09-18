<template>
  <div class="screen" v-loading="loading" element-loading-background="rgba(4,12,20,0.8)">
    <!-- 背景装饰：网格 + 光晕 -->
    <div class="bg-grid"></div>
    <div class="glow glow-a"></div>
    <div class="glow glow-b"></div>

    <!-- 顶部标题栏 -->
    <header class="screen-header">
      <div class="corner left"></div>
      <div class="corner right"></div>
      <div class="header-title">
        <span class="title-dot"></span>
        电子产品回收综合服务平台 · 数据大屏
        <span class="title-dot"></span>
      </div>
      <div class="header-side left-side">
        <span class="live-tag"><span class="live-dot"></span>实时监控</span>
      </div>
      <div class="header-side right-side">
        <span class="clock">{{ clock.time }}</span>
        <span class="date">{{ clock.date }} {{ clock.week }}</span>
        <el-button class="ghost-btn" size="small" @click="toggleFullscreen">
          <el-icon style="margin-right:4px"><FullScreen /></el-icon>全屏
        </el-button>
      </div>
      <div class="scan-line"></div>
    </header>

    <!-- KPI 数字带 -->
    <section class="kpi-row">
      <div class="kpi" v-for="k in kpis" :key="k.label">
        <div class="kpi-icon" :style="{ '--c': k.color }"><el-icon><component :is="k.icon" /></el-icon></div>
        <div class="kpi-body">
          <div class="kpi-value" :style="{ '--c': k.color }">{{ k.text }}<small v-if="k.unit">{{ k.unit }}</small></div>
          <div class="kpi-label">{{ k.label }}</div>
        </div>
      </div>
    </section>

    <!-- 主体：纵向流式排布，可上下滚动查看 -->
    <section class="main-flow">
      <div class="panel trend-panel">
        <div class="panel-title">近 30 天回收趋势</div>
        <div ref="trendEl" class="chart"></div>
      </div>

      <div class="grid-2">
        <div class="panel rose-panel">
          <div class="panel-title">设备类型分布（近 180 天）</div>
          <div ref="roseEl" class="chart"></div>
        </div>

        <div class="panel top-panel">
          <div class="panel-title">热门回收机型 TOP6</div>
          <div ref="topEl" class="chart"></div>
        </div>
      </div>

      <div class="panel eco-panel">
        <div class="panel-title">绿色环保贡献</div>
        <div class="eco-list">
          <div class="eco-item">
            <el-icon><Monitor /></el-icon>
            <div><b>{{ ecoText.devices }}</b><span>台设备重获新生</span></div>
          </div>
          <div class="eco-item">
            <el-icon><Cloudy /></el-icon>
            <div><b>{{ ecoText.co2 }}</b><span>kg 减碳排放</span></div>
          </div>
          <div class="eco-item">
            <el-icon><Timer /></el-icon>
            <div><b>{{ ecoText.trees }}</b><span>棵等效植树</span></div>
          </div>
          <div class="eco-item">
            <el-icon><Lightning /></el-icon>
            <div><b>{{ ecoText.energy }}</b><span>kWh 节省电能</span></div>
          </div>
        </div>
      </div>

      <div class="panel recent-panel">
        <div class="panel-title">最新回收订单</div>
        <div class="recent-list">
          <div class="recent-head">
            <span>订单号</span><span>型号</span><span>客户</span><span>状态</span><span>时间</span>
          </div>
          <transition-group name="roll" tag="div" class="recent-body">
            <div class="recent-row" v-for="o in recentOrders" :key="o.id">
              <span class="oid">{{ o.order_id }}</span>
              <span>{{ o.device_model || '-' }}</span>
              <span>{{ o.real_name || o.nickname || '-' }}</span>
              <span :class="['st', o.status]">{{ statusLabel(o.status) }}</span>
              <span class="tm">{{ shortTime(o.created_at) }}</span>
            </div>
          </transition-group>
        </div>
      </div>
    </section>

    <footer class="screen-footer">数据每 60 秒自动刷新 · 回收综合服务平台 V1.0</footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { Monitor, Cloudy, Timer, Lightning, FullScreen } from '@element-plus/icons-vue'
import { getDashboard } from '../api'
import { useCountUp } from '../utils/countUp'

const loading = ref(true)
const summary = ref({})
const eco = ref({ devices: 0, co2Kg: 0, trees: 0, energyKwh: 0 })
const recentOrders = ref([])
const topModels = ref([])

// ===== 实时时钟 =====
const clock = ref({ time: '--:--:--', date: '', week: '' })
const WEEKS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
let clockTimer = null
const tickClock = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  clock.value = {
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    week: WEEKS[d.getDay()]
  }
}

// ===== KPI 数字滚动 =====
const cTotal = useCountUp(computed(() => Number(summary.value.totalOrders || 0)))
const cPending = useCountUp(computed(() => Number(summary.value.pendingCount || 0)))
const cMonth = useCountUp(computed(() => Number(summary.value.monthCount || 0)))
const cAmount = useCountUp(computed(() => Number(summary.value.totalCompletedAmount || 0)))
const cEco = useCountUp(computed(() => Number(eco.value.co2Kg || 0)), { decimals: 1 })
const num = (v) => Number(v || 0).toLocaleString('zh-CN', { maximumFractionDigits: 1 })

const kpis = computed(() => [
  { label: '回收订单总量', text: num(cTotal.value), unit: '单', icon: 'Tickets', color: '#22d3ee' },
  { label: '待确认订单', text: num(cPending.value), unit: '单', icon: 'Bell', color: '#fbbf24' },
  { label: '本月订单数', text: num(cMonth.value), unit: '单', icon: 'Calendar', color: '#34d399' },
  { label: '累计回收成交额', text: '¥' + num(cAmount.value), icon: 'Wallet', color: '#f472b6' },
  { label: '累计碳减排', text: num(cEco.value), unit: 'kg', icon: 'Cloudy', color: '#a78bfa' }
])

const ecoText = computed(() => ({
  devices: num(eco.value.devices),
  co2: num(eco.value.co2Kg),
  trees: num(eco.value.trees),
  energy: num(eco.value.energyKwh)
}))

const statusLabel = (s) =>
  ({ pending: '待确认', quoted: '已报价', confirmed: '已确认', processing: '处理中', completed: '已完成', review: '待评价', cancelled: '已取消' }[s] || s)
const shortTime = (t) => (t ? dayjs(t).format('MM-DD HH:mm') : '-')

// ===== 图表（大屏固定深色配色，不随主题） =====
const trendEl = ref(null)
const roseEl = ref(null)
const topEl = ref(null)
let charts = []
let refreshTimer = null

const AXIS = '#3b5668'
const LABEL = '#8fb3c6'
const SPLIT = 'rgba(59, 86, 104, 0.35)'
const TOOLTIP = { backgroundColor: 'rgba(6, 18, 28, 0.92)', borderColor: '#1d4a5f', textStyle: { color: '#d7ecf5' } }

function renderCharts(data) {
  charts.forEach((c) => c.dispose())
  charts = []

  // 趋势：渐变柱 + 发光面积线
  const map = new Map((data.trend || []).map((r) => [String(r.date).slice(0, 10), r]))
  const dates = []
  const counts = []
  const amounts = []
  for (let i = 29; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
    dates.push(d.slice(5))
    const row = map.get(d)
    counts.push(row ? Number(row.orders) : 0)
    amounts.push(row ? Number(row.amount) : 0)
  }
  if (trendEl.value) {
    const c = echarts.init(trendEl.value)
    charts.push(c)
    c.setOption({
      tooltip: { trigger: 'axis', ...TOOLTIP },
      legend: { data: ['订单数', '成交金额(元)'], textStyle: { color: LABEL }, top: 4, right: 10 },
      grid: { left: 44, right: 52, top: 40, bottom: 26 },
      xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: AXIS } }, axisLabel: { color: LABEL, fontSize: 10 } },
      yAxis: [
        { type: 'value', minInterval: 1, axisLabel: { color: LABEL }, splitLine: { lineStyle: { color: SPLIT } } },
        { type: 'value', axisLabel: { color: LABEL }, splitLine: { show: false } }
      ],
      series: [
        {
          name: '订单数', type: 'bar', data: counts, barMaxWidth: 12,
          itemStyle: { borderRadius: [3, 3, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#22d3ee' }, { offset: 1, color: 'rgba(34,211,238,0.08)' }]) }
        },
        {
          name: '成交金额(元)', type: 'line', yAxisIndex: 1, data: amounts, smooth: true, symbol: 'none',
          lineStyle: { width: 2.5, color: '#fbbf24', shadowColor: 'rgba(251,191,36,0.6)', shadowBlur: 12 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(251,191,36,0.3)' }, { offset: 1, color: 'rgba(251,191,36,0.01)' }]) }
        }
      ]
    })
  }

  // 玫瑰图：霓虹描边
  if (roseEl.value) {
    const c = echarts.init(roseEl.value)
    charts.push(c)
    c.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)', ...TOOLTIP },
      legend: { bottom: 0, type: 'scroll', textStyle: { color: LABEL }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie', roseType: 'area', radius: ['22%', '72%'], center: ['50%', '46%'],
        data: (data.deviceTypeDist || []).map((r) => ({ name: r.name, value: r.count })),
        itemStyle: { borderRadius: 6, borderColor: 'rgba(34,211,238,0.25)', borderWidth: 1 },
        label: { color: '#bfe3ef', fontSize: 10, formatter: '{b}' }
      }]
    })
  }

  // TOP 机型：横向渐变能量条
  if (topEl.value) {
    const top = [...(data.topModels || [])].slice(0, 6).reverse()
    const c = echarts.init(topEl.value)
    charts.push(c)
    c.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...TOOLTIP },
      grid: { left: 108, right: 34, top: 8, bottom: 20 },
      xAxis: { type: 'value', minInterval: 1, axisLabel: { color: LABEL }, splitLine: { lineStyle: { color: SPLIT } } },
      yAxis: { type: 'category', data: top.map((r) => r.model), axisLabel: { color: '#cfe7f0', fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false } },
      series: [{
        type: 'bar', data: top.map((r) => r.count), barMaxWidth: 12,
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: 'rgba(52,211,153,0.15)' }, { offset: 1, color: '#34d399' }])
        },
        label: { show: true, position: 'right', color: '#8ff0c6', fontSize: 11 }
      }]
    })
  }
}

async function load() {
  loading.value = true
  try {
    const res = await getDashboard()
    const data = res.data
    summary.value = data.summary || {}
    eco.value = data.eco || eco.value
    recentOrders.value = (data.recentOrders || []).slice(0, 8)
    topModels.value = data.topModels || []
    await nextTick()
    renderCharts(data)
  } finally {
    loading.value = false
  }
}

function resizeAll() { charts.forEach((c) => c.resize()) }
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen()
  else document.documentElement.requestFullscreen()
}

onMounted(() => {
  tickClock()
  clockTimer = setInterval(tickClock, 1000)
  load()
  refreshTimer = setInterval(load, 60000)
  window.addEventListener('resize', resizeAll)
})
onBeforeUnmount(() => {
  clearInterval(clockTimer)
  clearInterval(refreshTimer)
  window.removeEventListener('resize', resizeAll)
  charts.forEach((c) => c.dispose())
})
</script>

<style scoped>
.screen {
  position: relative;
  min-height: calc(100vh - 92px);
  background: radial-gradient(1100px 700px at 18% -10%, #0d2b3d 0%, transparent 55%),
    radial-gradient(900px 600px at 88% 110%, #0a2a22 0%, transparent 55%),
    linear-gradient(160deg, #050f18 0%, #071a26 50%, #06131d 100%);
  color: #d7ecf5;
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  padding: 0 18px 12px;
}

/* 细网格背景 */
.bg-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(64, 150, 190, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(64, 150, 190, 0.06) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse at 50% 30%, #000 40%, transparent 80%);
}
.glow { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; pointer-events: none; }
.glow-a { width: 420px; height: 420px; top: -140px; left: -100px; background: radial-gradient(circle, rgba(34,211,238,0.35), transparent 70%); }
.glow-b { width: 380px; height: 380px; bottom: -120px; right: -80px; background: radial-gradient(circle, rgba(52,211,153,0.3), transparent 70%); }

/* ===== 顶部 ===== */
.screen-header {
  position: relative;
  height: 64px;
  display: flex; align-items: center; justify-content: center;
  border-bottom: 1px solid rgba(64, 150, 190, 0.25);
  background: linear-gradient(180deg, rgba(13, 42, 60, 0.55), rgba(13, 42, 60, 0));
}
.corner { position: absolute; bottom: -1px; width: 26px; height: 26px; border: 2px solid #22d3ee; opacity: 0.8; }
.corner.left { left: 8px; border-right: none; border-top: none; }
.corner.right { right: 8px; border-left: none; border-top: none; }
.header-title {
  font-size: 22px; font-weight: 800; letter-spacing: 6px;
  background: linear-gradient(90deg, #7ee7ff, #e8fffa 45%, #8ff0c6);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  text-shadow: 0 0 26px rgba(34, 211, 238, 0.35);
  display: flex; align-items: center; gap: 14px;
}
.title-dot { width: 8px; height: 8px; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 12px #22d3ee; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1);} 50% { opacity: 0.4; transform: scale(0.7);} }
.header-side { position: absolute; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 12px; }
.header-side.left-side { left: 52px; }
.header-side.right-side { right: 52px; }
.live-tag { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #8ff0c6; border: 1px solid rgba(52, 211, 153, 0.4); border-radius: 999px; padding: 3px 10px; background: rgba(52, 211, 153, 0.08); }
.live-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; box-shadow: 0 0 8px #34d399; animation: pulse 1.6s infinite; }
.clock { font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; color: #7ee7ff; letter-spacing: 2px; text-shadow: 0 0 16px rgba(34, 211, 238, 0.4); }
.date { font-size: 12px; color: #8fb3c6; }
.ghost-btn { background: rgba(34, 211, 238, 0.08); border-color: rgba(34, 211, 238, 0.35); color: #9fdcec; }
.ghost-btn:hover { background: rgba(34, 211, 238, 0.18); border-color: #22d3ee; color: #c9f2ff; }

/* 扫描线 */
.scan-line {
  position: absolute; left: 0; right: 0; top: 64px; height: 2px; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.5), transparent);
  animation: scan 6s linear infinite;
}
@keyframes scan { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} }

/* ===== KPI ===== */
.kpi-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin: 14px 0; }
.kpi {
  position: relative; display: flex; align-items: center; gap: 12px;
  padding: 14px 18px; border-radius: 12px;
  background: linear-gradient(160deg, rgba(16, 42, 60, 0.75), rgba(9, 26, 38, 0.6));
  border: 1px solid rgba(64, 150, 190, 0.22);
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  transition: box-shadow 0.25s ease;
}
.kpi:hover { box-shadow: 0 0 24px rgba(34, 211, 238, 0.18) inset, 0 6px 20px rgba(0, 0, 0, 0.4); }
.kpi-icon {
  width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 21px;
  color: var(--c); background: color-mix(in srgb, var(--c) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--c) 35%, transparent);
  box-shadow: 0 0 14px color-mix(in srgb, var(--c) 25%, transparent);
}
.kpi-value { font-size: 27px; font-weight: 800; color: var(--c); font-variant-numeric: tabular-nums; line-height: 1.1; text-shadow: 0 0 18px color-mix(in srgb, var(--c) 45%, transparent); }
.kpi-value small { font-size: 12px; font-weight: 500; opacity: 0.75; margin-left: 3px; }
.kpi-label { font-size: 12px; color: #8fb3c6; margin-top: 3px; letter-spacing: 1px; }

/* ===== 主体：纵向流式，随页面滚动 ===== */
.main-flow { display: flex; flex-direction: column; gap: 16px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 960px) { .grid-2 { grid-template-columns: 1fr; } }
.panel {
  position: relative; border-radius: 12px; padding: 12px 14px;
  background: linear-gradient(165deg, rgba(14, 38, 54, 0.72), rgba(8, 22, 33, 0.62));
  border: 1px solid rgba(64, 150, 190, 0.2);
  display: flex; flex-direction: column; min-height: 0; overflow: hidden;
}
.panel::before {
  content: ''; position: absolute; top: 0; left: 14px; right: 14px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.55), transparent);
}
.panel-title { font-size: 13px; font-weight: 700; letter-spacing: 2px; color: #9fdcec; margin-bottom: 8px; }
.panel-title::before { content: '▮ '; color: #22d3ee; }
.trend-panel { padding-bottom: 16px; }
.trend-panel .chart { height: 360px; }
.rose-panel .chart { height: 340px; }
.top-panel .chart { height: 340px; }

/* 环保贡献：横向四宫格 */
.eco-panel .eco-list { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
@media (max-width: 960px) { .eco-panel .eco-list { grid-template-columns: repeat(2, 1fr); } }
.eco-item {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 10px;
  background: rgba(52, 211, 153, 0.06); border: 1px solid rgba(52, 211, 153, 0.18);
}
.eco-item .el-icon { font-size: 24px; color: #34d399; }
.eco-item b { display: block; font-size: 20px; color: #8ff0c6; font-variant-numeric: tabular-nums; }
.eco-item span { font-size: 12px; color: #7da899; }

/* 最新订单滚动 */
.recent-list { font-size: 12px; }
.recent-head, .recent-row { display: grid; grid-template-columns: 1.5fr 1fr 0.8fr 0.7fr 0.9fr; gap: 6px; padding: 8px 10px; }
.recent-head { color: #6f95a8; border-bottom: 1px solid rgba(64, 150, 190, 0.2); }
.recent-body { display: flex; flex-direction: column; }
.recent-row { color: #bcd8e4; border-bottom: 1px dashed rgba(64, 150, 190, 0.12); }
.recent-row .oid { color: #7ee7ff; }
.recent-row .tm { color: #6f95a8; }
.st { font-weight: 600; }
.st.pending { color: #fbbf24; }
.st.quoted, .st.processing { color: #22d3ee; }
.st.completed, .st.review { color: #34d399; }
.st.cancelled { color: #f4729b; }
.roll-enter-active { transition: all 0.5s ease; }
.roll-enter-from { opacity: 0; transform: translateY(-14px); }

.screen-footer { text-align: center; font-size: 11px; color: #587a8c; letter-spacing: 2px; padding-top: 8px; }
</style>
