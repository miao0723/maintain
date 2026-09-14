<template>
  <div v-loading="loading">
    <div class="page-card">
      <div class="filter-bar">
        <span style="font-weight:600">回收订单统计</span>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:250px" />
        <el-radio-group v-model="granularity">
          <el-radio-button value="day">按日</el-radio-button>
          <el-radio-button value="month">按月</el-radio-button>
        </el-radio-group>
        <el-button type="primary" :icon="Search" @click="load">查询</el-button>
      </div>
    </div>

    <div class="chart-grid" style="margin-top:14px">
      <div class="chart-box">
        <div class="chart-title">订单量与成交金额趋势</div>
        <div ref="trendEl" class="chart-el"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">订单状态分布</div>
        <div ref="statusEl" class="chart-el"></div>
      </div>
    </div>

    <div class="chart-grid" style="margin-top:14px">
      <div class="chart-box">
        <div class="chart-title">回收价格段分布</div>
        <div ref="segEl" class="chart-el"></div>
      </div>
      <div class="chart-box">
        <div class="chart-title">设备成色分布</div>
        <div ref="condEl" class="chart-el"></div>
      </div>
    </div>

    <div class="chart-box" style="margin-top:14px">
      <div class="chart-title">热门回收机型 TOP15</div>
      <div ref="topEl" style="width:100%;height:380px"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { Search } from '@element-plus/icons-vue'
import { getOrderStats } from '../api'

const loading = ref(false)
const dateRange = ref(null)
const granularity = ref('month')

const trendEl = ref(null)
const statusEl = ref(null)
const segEl = ref(null)
const condEl = ref(null)
const topEl = ref(null)
let charts = []

const statusMap = { pending: '待确认', quoted: '已报价', confirmed: '已确认', processing: '处理中', completed: '已完成', review: '待评价', cancelled: '已取消' }
const condMap = { good: '优', normal: '良', fair: '中', poor: '差', excellent: '优+', mint: '全新', unknown: '未知' }

async function load() {
  loading.value = true
  try {
    const params = { granularity: granularity.value }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getOrderStats(params)
    const data = res.data

    charts.forEach((c) => c.dispose())
    charts = []

    if (trendEl.value) {
      const chart = echarts.init(trendEl.value)
      charts.push(chart)
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['订单数', '成交金额(元)'] },
        grid: { left: 45, right: 55, top: 42, bottom: 28 },
        xAxis: { type: 'category', data: data.trend.map((r) => r.date) },
        yAxis: [{ type: 'value', name: '订单', minInterval: 1 }, { type: 'value', name: '金额(元)' }],
        series: [
          { name: '订单数', type: 'bar', data: data.trend.map((r) => Number(r.orders)), itemStyle: { color: '#67c23a' } },
          { name: '成交金额(元)', type: 'line', yAxisIndex: 1, smooth: true, data: data.trend.map((r) => Number(r.amount)), itemStyle: { color: '#e6a23c' } }
        ]
      })
    }
    if (statusEl.value) {
      const chart = echarts.init(statusEl.value)
      charts.push(chart)
      chart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
        legend: { bottom: 0 },
        series: [{
          type: 'pie', radius: ['40%', '66%'], center: ['50%', '44%'],
          data: data.statusDist.map((r) => ({ name: statusMap[r.status] || r.status, value: Number(r.count) })),
          label: { formatter: '{b}\n{c}单' }
        }]
      })
    }
    if (segEl.value) {
      const chart = echarts.init(segEl.value)
      charts.push(chart)
      const seg = data.priceSeg || {}
      chart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
        legend: { bottom: 0 },
        series: [{
          type: 'pie', radius: ['40%', '66%'], center: ['50%', '44%'],
          data: [
            { name: '500元以下', value: Number(seg.lt500 || 0) },
            { name: '500-2000元', value: Number(seg.gte500 || 0) },
            { name: '2000-5000元', value: Number(seg.gte2000 || 0) },
            { name: '5000元以上', value: Number(seg.gte5000 || 0) }
          ],
          label: { formatter: '{b}\n{c}单' }
        }]
      })
    }
    if (condEl.value) {
      const chart = echarts.init(condEl.value)
      charts.push(chart)
      chart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
        legend: { bottom: 0 },
        series: [{
          type: 'pie', radius: ['40%', '66%'], center: ['50%', '44%'],
          data: data.conditionDist.map((r) => ({ name: condMap[r.conditionKey] || r.conditionKey, value: Number(r.count) })),
          label: { formatter: '{b}\n{c}单' }
        }]
      })
    }
    if (topEl.value) {
      const chart = echarts.init(topEl.value)
      charts.push(chart)
      const top = [...(data.topModels || [])].reverse()
      chart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 140, right: 40, top: 16, bottom: 28 },
        xAxis: { type: 'value', minInterval: 1 },
        yAxis: { type: 'category', data: top.map((r) => r.model) },
        series: [{ name: '订单数', type: 'bar', data: top.map((r) => Number(r.count)), itemStyle: { color: '#409eff' }, barMaxWidth: 22 }]
      })
    }
  } finally {
    loading.value = false
  }
}

function resize() { charts.forEach((c) => c.resize()) }
onMounted(() => {
  load()
  window.addEventListener('resize', resize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  charts.forEach((c) => c.dispose())
})
</script>
