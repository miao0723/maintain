<template>
  <div v-loading="loading">
    <!-- 绿色环保贡献：以真实回收完成量为基准的行业换算（系数可在系统设置调整） -->
    <div class="eco-row">
      <div class="eco-card eco-devices">
        <div class="eco-icon"><el-icon><Monitor /></el-icon></div>
        <div class="eco-body">
          <div class="eco-value">{{ ecoDevicesText }}<small> 台</small></div>
          <div class="eco-label">累计回收设备</div>
          <div class="eco-sub">每一台都远离了填埋与焚烧</div>
        </div>
      </div>
      <div class="eco-card eco-co2">
        <div class="eco-icon"><el-icon><Cloudy /></el-icon></div>
        <div class="eco-body">
          <div class="eco-value">{{ ecoCo2Text }}<small> kg</small></div>
          <div class="eco-label">减少碳排放 CO₂e</div>
          <div class="eco-sub">相当于少开车绕城 {{ ecoCo2Text }} 公里</div>
        </div>
      </div>
      <div class="eco-card eco-tree">
        <div class="eco-icon"><el-icon><Timer /></el-icon></div>
        <div class="eco-body">
          <div class="eco-value">{{ ecoTreesText }}<small> 棵</small></div>
          <div class="eco-label">等效一年植树量</div>
          <div class="eco-sub">地球为此说声谢谢</div>
        </div>
      </div>
      <div class="eco-card eco-energy">
        <div class="eco-icon"><el-icon><Lightning /></el-icon></div>
        <div class="eco-body">
          <div class="eco-value">{{ ecoEnergyText }}<small> kWh</small></div>
          <div class="eco-label">节省电能</div>
          <div class="eco-sub">约等于 {{ ecoEnergyText }} 度生活用电</div>
        </div>
      </div>
    </div>

    <div class="stat-card-grid">
      <div class="stat-card">
        <div>
          <div class="stat-value">{{ summary.totalOrders }}</div>
          <div class="stat-label">回收订单总量</div>
        </div>
        <div class="stat-icon c-green"><el-icon><List /></el-icon></div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-value">{{ summary.pendingCount }}</div>
          <div class="stat-label">待确认订单</div>
        </div>
        <div class="stat-icon c-amber"><el-icon><Bell /></el-icon></div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-value">{{ summary.monthCount }}</div>
          <div class="stat-label">本月订单数</div>
        </div>
        <div class="stat-icon c-blue"><el-icon><Calendar /></el-icon></div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-value">¥{{ fmtMoney(summary.totalCompletedAmount) }}</div>
          <div class="stat-label">累计回收成交额</div>
        </div>
        <div class="stat-icon c-lime"><el-icon><Wallet /></el-icon></div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-value">{{ catalog.models || 0 }}</div>
          <div class="stat-label">在售配价机型</div>
        </div>
        <div class="stat-icon c-purple"><el-icon><PriceTag /></el-icon></div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-value">{{ Number(catalog.platformClicks || 0) + Number(catalog.linkClicks || 0) }}</div>
          <div class="stat-label">平台/链接跳转次数</div>
        </div>
        <div class="stat-icon c-red"><el-icon><Link /></el-icon></div>
      </div>
    </div>

    <div class="chart-grid" style="margin-bottom:16px">
      <div class="chart-box">
        <div class="chart-title">近30天回收订单趋势</div>
        <div ref="trendChartEl" class="chart-el"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">设备类型分布（近180天）</div>
        <div ref="deviceChartEl" class="chart-el"></div>
      </div>
    </div>

    <div class="chart-grid">
      <div class="chart-box">
        <div class="chart-title">最新回收订单</div>
        <el-table :data="recentOrders" size="small" @row-click="(row) => $router.push(`/orders?focus=${row.id}`)">
          <el-table-column prop="order_id" label="订单号" min-width="180" show-overflow-tooltip />
          <el-table-column prop="device_model" label="设备型号" min-width="110" show-overflow-tooltip />
          <el-table-column label="客户" min-width="90">
            <template #default="{ row }">{{ row.real_name || row.nickname || '-' }}</template>
          </el-table-column>
          <el-table-column label="预估价" width="100" align="right">
            <template #default="{ row }"><span class="price-text">¥{{ fmtMoney(row.estimated_price) }}</span></template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="150" show-overflow-tooltip />
        </el-table>
      </div>
      <div class="chart-box">
        <div class="chart-title">热门回收机型 TOP10（近180天）</div>
        <el-table :data="topModels" size="small">
          <el-table-column type="index" label="#" width="44" />
          <el-table-column prop="model" label="机型" min-width="120" show-overflow-tooltip />
          <el-table-column prop="count" label="单量" width="70" align="center" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { getDashboard } from '../api'
import { useCountUp } from '../utils/countUp'
import { chartTheme, isDarkNow } from '../utils/theme'

const loading = ref(true)
const summary = ref({})
const catalog = ref({})
const recentOrders = ref([])
const topModels = ref([])
const eco = ref({ devices: 0, co2Kg: 0, trees: 0, energyKwh: 0 })

// 环保数字滚动动画
const ecoDevices = useCountUp(computed(() => eco.value.devices))
const ecoCo2 = useCountUp(computed(() => eco.value.co2Kg), { decimals: 1 })
const ecoTrees = useCountUp(computed(() => eco.value.trees), { decimals: 1 })
const ecoEnergy = useCountUp(computed(() => eco.value.energyKwh), { decimals: 1 })
const fmt = (v) => Number(v || 0).toLocaleString('zh-CN', { maximumFractionDigits: 1 })
const ecoDevicesText = computed(() => fmt(ecoDevices.value))
const ecoCo2Text = computed(() => fmt(ecoCo2.value))
const ecoTreesText = computed(() => fmt(ecoTrees.value))
const ecoEnergyText = computed(() => fmt(ecoEnergy.value))

const statusMap = { pending: '待确认', quoted: '已报价', confirmed: '已确认', processing: '处理中', completed: '已完成', review: '待评价', cancelled: '已取消' }
const statusLabel = (s) => statusMap[s] || s
const statusTag = (s) => ({ pending: 'warning', quoted: 'primary', confirmed: 'info', processing: 'primary', completed: 'success', review: 'info', cancelled: 'danger' }[s] || 'info')
const fmtMoney = (v) => Number(v || 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 })

const trendChartEl = ref(null)
const deviceChartEl = ref(null)
let trendChart = null
let deviceChart = null
// 图表原始数据缓存：主题切换时无需重新请求即可重绘配色
const chartData = ref({ dates: [], counts: [], amounts: [], deviceDist: [] })

async function load() {
  loading.value = true
  try {
    const res = await getDashboard()
    const data = res.data
    summary.value = data.summary
    eco.value = data.eco || { devices: 0, co2Kg: 0, trees: 0, energyKwh: 0 }
    catalog.value = data.catalog || {}
    recentOrders.value = data.recentOrders || []
    topModels.value = data.topModels || []

    // 趋势图：补齐30天连续日期
    const trendMap = new Map((data.trend || []).map((r) => [String(r.date).slice(0, 10), r]))
    const dates = []
    const counts = []
    const amounts = []
    for (let i = 29; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
      dates.push(d.slice(5))
      const row = trendMap.get(d)
      counts.push(row ? Number(row.orders) : 0)
      amounts.push(row ? Number(row.amount) : 0)
    }
    chartData.value = { dates, counts, amounts, deviceDist: data.deviceTypeDist || [] }

    await nextTick()
    renderCharts()
  } finally {
    loading.value = false
  }
}

/** 渲染两张图表（配色随主题，主题切换时可直接重绘） */
function renderCharts() {
  const { dates, counts, amounts, deviceDist } = chartData.value
  if (trendChartEl.value) {
    const t = chartTheme()
    trendChart = trendChart || echarts.init(trendChartEl.value)
    trendChart.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: t.tooltipBg,
        borderColor: t.tooltipBorder,
        textStyle: { color: t.tooltipText }
      },
      legend: {
        data: ['订单数', '成交金额(元)'],
        textStyle: { color: t.axisLabel }
      },
      grid: { left: 40, right: 50, top: 40, bottom: 24 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: t.axisLine } },
        axisLabel: { color: t.axisLabel }
      },
      yAxis: [
        { type: 'value', name: '订单数', minInterval: 1, axisLabel: { color: t.axisLabel }, splitLine: { lineStyle: { color: t.splitLine } } },
        { type: 'value', name: '金额(元)', axisLabel: { color: t.axisLabel }, splitLine: { show: false } }
      ],
      series: [
        {
          name: '订单数',
          type: 'bar',
          data: counts,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#95d475' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.25)' }
            ])
          }
        },
        {
          name: '成交金额(元)',
          type: 'line',
          yAxisIndex: 1,
          data: amounts,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#e6a23c' },
          lineStyle: { width: 2.5, color: '#e6a23c' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(230, 162, 60, 0.28)' },
              { offset: 1, color: 'rgba(230, 162, 60, 0.02)' }
            ])
          }
        }
      ]
    })
  }
  if (deviceChartEl.value) {
    const t = chartTheme()
    deviceChart = deviceChart || echarts.init(deviceChartEl.value)
    deviceChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
      legend: { bottom: 0, type: 'scroll', textStyle: { color: t.axisLabel } },
      series: [{
        type: 'pie',
        // 南丁格尔玫瑰图：扇区半径随数值变化，回收设备分布更有表现力
        roseType: 'area',
        radius: ['18%', '70%'],
        center: ['50%', '44%'],
        data: deviceDist.map((r) => ({ name: r.name, value: r.count })),
        itemStyle: { borderRadius: 5, borderColor: t.dark ? '#1d1d1d' : '#fff', borderWidth: 2 },
        label: { color: t.text, formatter: '{b}\n{c}单' }
      }]
    })
  }
}

function resize() {
  trendChart && trendChart.resize()
  deviceChart && deviceChart.resize()
}

// 主题切换：图表配色跟随（数据不重新请求）
const onThemeChanged = () => renderCharts()

onMounted(() => {
  load()
  window.addEventListener('resize', resize)
  window.addEventListener('theme-changed', onThemeChanged)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  window.removeEventListener('theme-changed', onThemeChanged)
  trendChart && trendChart.dispose()
  deviceChart && deviceChart.dispose()
  trendChart = null
  deviceChart = null
})
</script>

<style scoped>
/* 绿色环保贡献卡片：深色渐变底 + 悬浮光效，数字进入时滚动 */
.eco-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.eco-card {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 14px;
  color: #fff;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.eco-card::after {
  content: '';
  position: absolute;
  top: -60%;
  right: -30px;
  width: 160px;
  height: 200%;
  background: linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.14) 50%, transparent 70%);
  transform: skewX(-18deg);
  transition: right 0.5s ease;
}
.eco-card:hover {
  transform: translateY(-3px);
}
.eco-card:hover::after {
  right: 60px;
}
.eco-card .eco-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: rgba(255, 255, 255, 0.18);
  flex-shrink: 0;
}
.eco-card .eco-value {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}
.eco-card .eco-value small {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.85;
  margin-left: 2px;
}
.eco-card .eco-label {
  font-size: 13px;
  font-weight: 600;
  margin-top: 2px;
  opacity: 0.95;
}
.eco-card .eco-sub {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.7;
}
.eco-devices { background: linear-gradient(135deg, #14532d 0%, #166534 55%, #15803d 100%); box-shadow: 0 6px 18px rgba(21, 128, 61, 0.28); }
.eco-co2    { background: linear-gradient(135deg, #0f3b4c 0%, #155e75 55%, #0891b2 100%); box-shadow: 0 6px 18px rgba(8, 145, 178, 0.28); }
.eco-tree   { background: linear-gradient(135deg, #14532d 0%, #3f6212 55%, #65a30d 100%); box-shadow: 0 6px 18px rgba(101, 163, 13, 0.26); }
.eco-energy { background: linear-gradient(135deg, #422006 0%, #92400e 55%, #d97706 100%); box-shadow: 0 6px 18px rgba(217, 119, 6, 0.28); }
</style>
