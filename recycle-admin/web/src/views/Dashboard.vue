<template>
  <div v-loading="loading">
    <div class="stat-card-grid">
      <div class="stat-card">
        <div>
          <div class="stat-value">{{ summary.totalOrders }}</div>
          <div class="stat-label">回收订单总量</div>
        </div>
        <div class="stat-icon" style="background:#e8f3ec;color:#2d5a40"><el-icon><List /></el-icon></div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-value">{{ summary.pendingCount }}</div>
          <div class="stat-label">待确认订单</div>
        </div>
        <div class="stat-icon" style="background:#fdf6ec;color:#e6a23c"><el-icon><Bell /></el-icon></div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-value">{{ summary.monthCount }}</div>
          <div class="stat-label">本月订单数</div>
        </div>
        <div class="stat-icon" style="background:#ecf5ff;color:#409eff"><el-icon><Calendar /></el-icon></div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-value">¥{{ fmtMoney(summary.totalCompletedAmount) }}</div>
          <div class="stat-label">累计回收成交额</div>
        </div>
        <div class="stat-icon" style="background:#f0f9eb;color:#67c23a"><el-icon><Wallet /></el-icon></div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-value">{{ catalog.models || 0 }}</div>
          <div class="stat-label">在售配价机型</div>
        </div>
        <div class="stat-icon" style="background:#f4ecfa;color:#8e5b8c"><el-icon><PriceTag /></el-icon></div>
      </div>
      <div class="stat-card">
        <div>
          <div class="stat-value">{{ Number(catalog.platformClicks || 0) + Number(catalog.linkClicks || 0) }}</div>
          <div class="stat-label">平台/链接跳转次数</div>
        </div>
        <div class="stat-icon" style="background:#fef0f0;color:#f56c6c"><el-icon><Link /></el-icon></div>
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
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { getDashboard } from '../api'

const loading = ref(true)
const summary = ref({})
const catalog = ref({})
const recentOrders = ref([])
const topModels = ref([])

const statusMap = { pending: '待确认', quoted: '已报价', confirmed: '已确认', processing: '处理中', completed: '已完成', review: '待评价', cancelled: '已取消' }
const statusLabel = (s) => statusMap[s] || s
const statusTag = (s) => ({ pending: 'warning', quoted: 'primary', confirmed: 'info', processing: 'primary', completed: 'success', review: 'info', cancelled: 'danger' }[s] || 'info')
const fmtMoney = (v) => Number(v || 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 })

const trendChartEl = ref(null)
const deviceChartEl = ref(null)
let trendChart = null
let deviceChart = null

async function load() {
  loading.value = true
  try {
    const res = await getDashboard()
    const data = res.data
    summary.value = data.summary
    catalog.value = data.catalog || {}
    recentOrders.value = data.recentOrders || []
    topModels.value = data.topModels || []

    await nextTick()
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
    if (trendChartEl.value) {
      trendChart = echarts.init(trendChartEl.value)
      trendChart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['订单数', '成交金额(元)'] },
        grid: { left: 40, right: 50, top: 40, bottom: 24 },
        xAxis: { type: 'category', data: dates },
        yAxis: [
          { type: 'value', name: '订单数', minInterval: 1 },
          { type: 'value', name: '金额(元)' }
        ],
        series: [
          { name: '订单数', type: 'bar', data: counts, itemStyle: { color: '#67c23a' } },
          { name: '成交金额(元)', type: 'line', yAxisIndex: 1, data: amounts, smooth: true, itemStyle: { color: '#e6a23c' } }
        ]
      })
    }
    if (deviceChartEl.value) {
      deviceChart = echarts.init(deviceChartEl.value)
      deviceChart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
        legend: { bottom: 0, type: 'scroll' },
        series: [{
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '44%'],
          data: (data.deviceTypeDist || []).map((r) => ({ name: r.name, value: r.count })),
          label: { formatter: '{b}\n{c}单' }
        }]
      })
    }
  } finally {
    loading.value = false
  }
}

function resize() {
  trendChart && trendChart.resize()
  deviceChart && deviceChart.resize()
}

onMounted(() => {
  load()
  window.addEventListener('resize', resize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  trendChart && trendChart.dispose()
  deviceChart && deviceChart.dispose()
})
</script>
