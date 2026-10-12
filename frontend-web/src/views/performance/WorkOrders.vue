<template>
  <div class="perf-workorders">
    <!-- 筛选栏 -->
    <el-card shadow="never" class="filter-card">
        <el-alert v-if="isWorker" type="success" show-icon :closable="false" class="worker-banner"
        :title="`您正在查看个人工单（${myContext.engineer?.name || ''} · ${myContext.engineer?.team || ''}）`"
        description="本页仅展示您本人的维修工单；管理员可查看全部人员工单并进行验收评分与合格判定。" />
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="时间范围">
          <el-date-picker v-model="filters.date_range" type="daterange" range-separator="至"
            start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 260px;" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 130px;">
            <el-option v-for="(label, val) in statusMap" :key="val" :label="label" :value="val" />
          </el-select>
        </el-form-item>
        <el-form-item label="班组" v-if="!isWorker">
          <el-select v-model="filters.team" placeholder="全部" clearable style="width: 130px;">
            <el-option v-for="t in teams" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="维修人员" v-if="!isWorker">
          <el-select v-model="filters.engineer_id" placeholder="全部" clearable filterable style="width: 150px;">
            <el-option v-for="e in engineers" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="工单号/设备/故障" clearable style="width: 180px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter"><el-icon><Search /></el-icon>查询</el-button>
          <el-button @click="handleReset"><el-icon><RefreshLeft /></el-icon>重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 工单列表 -->
    <el-card shadow="never">
      <template #header>
        <div class="table-head">
          <span class="card-title">维修工单明细</span>
          <el-tag v-if="!isWorker && waitingCount > 0" type="warning" effect="light" class="waiting-tag" @click="filterWaiting" style="cursor:pointer">
            待验收 {{ waitingCount }} 单 · 点击筛选
          </el-tag>
          <div class="export-btns" v-if="!isWorker">
            <el-button :loading="exporting" @click="exportDoc"><el-icon><Document /></el-icon>导出考核报告</el-button>
            <el-button type="primary" :loading="exporting" @click="exportXlsx"><el-icon><Download /></el-icon>导出工单(xlsx)</el-button>
          </div>
        </div>
      </template>
      <el-table :data="tableData" v-loading="loading" border stripe @row-click="openDetail" :row-class-name="rowClassName" class="click-row">
        <el-table-column prop="order_no" label="工单编号" width="150" fixed="left" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-tag :type="statusTag(row.status)" effect="light">{{ statusMap[row.status] }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="device_name" label="设备名称" min-width="130" show-overflow-tooltip />
        <el-table-column prop="device_area" label="所属区域" width="110" />
        <el-table-column prop="engineer_name" label="维修人员" width="100">
          <template #default="{ row }">{{ row.engineer_name || '—' }}</template>
        </el-table-column>
        <el-table-column prop="team" label="班组" width="90">
          <template #default="{ row }">{{ row.engineer_team || '—' }}</template>
        </el-table-column>
        <el-table-column prop="report_time" label="报修时间" width="150" />
        <el-table-column prop="complete_time" label="完成时间" width="150">
          <template #default="{ row }">{{ row.complete_time || '—' }}</template>
        </el-table-column>
        <el-table-column label="预计/实际(天)" width="130" align="center">
          <template #default="{ row }">
            <span>{{ row.est_days ?? '-' }}</span>
            <span class="arrow"> → </span>
            <span :class="row.actual_days > (row.est_days||0) ? 'over' : 'ok'">{{ row.actual_days ?? '-' }}</span>
            <el-tag v-if="row.is_overdue_open" type="danger" size="small" effect="plain" class="overdue-tag">超期</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="repair_count" label="返修" width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.repair_count > 0" type="danger" size="small" effect="plain">{{ row.repair_count }}</el-tag>
            <span v-else>0</span>
          </template>
        </el-table-column>
        <el-table-column label="验收评分" width="130" align="center">
          <template #default="{ row }">
            <el-rate v-if="row.review_score" :model-value="row.review_score" disabled size="small" />
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="工人自评" width="110" align="center">
          <template #default="{ row }">
            <el-rate v-if="row.self_score" :model-value="row.self_score" disabled size="small" />
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="是否符合" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.is_qualified === 1" type="success" size="small" effect="light">符合</el-tag>
            <el-tag v-else-if="row.is_qualified === 0" type="danger" size="small" effect="light">不符合</el-tag>
            <span v-else class="muted">待判定</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="openDetail(row)">详情</el-button>
            <el-button link type="warning" v-if="row.status === 'waiting' && !isWorker" @click.stop="openReview(row)">验收评分</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination class="pager" v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
        :total="pagination.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" background
        @size-change="fetchData" @current-change="fetchData" />
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" :title="`工单详情 ${current.order_no || ''}`" size="560px" destroy-on-close>
      <template v-if="current.id">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单编号">{{ current.order_no }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="statusTag(current.status)" effect="light">{{ statusMap[current.status] }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ current.device_name }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ current.device_type || '—' }}</el-descriptions-item>
          <el-descriptions-item label="所属区域">{{ current.device_area }}</el-descriptions-item>
          <el-descriptions-item label="优先级"><el-tag size="small" :type="priorityTag(current.priority)">{{ priorityMap[current.priority] || current.priority }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="维修人员">{{ current.engineer_name || '—' }}</el-descriptions-item>
          <el-descriptions-item label="所属班组">{{ current.engineer_team || '—' }}</el-descriptions-item>
          <el-descriptions-item label="报修时间">{{ current.report_time }}</el-descriptions-item>
          <el-descriptions-item label="接单时间">{{ current.accept_time || '—' }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ current.complete_time || '—' }}</el-descriptions-item>
          <el-descriptions-item label="预计/实际天数">{{ current.est_days ?? '-' }} / {{ current.actual_days ?? '-' }} 天</el-descriptions-item>
          <el-descriptions-item label="返修次数">{{ current.repair_count }}</el-descriptions-item>
          <el-descriptions-item label="验收评分" :span="2">
            <el-rate v-if="current.review_score" :model-value="current.review_score" disabled />
            <span v-else>待验收</span>
          </el-descriptions-item>
          <el-descriptions-item label="工人自评" :span="2">
            <el-rate v-if="current.self_score" :model-value="current.self_score" disabled />
            <span v-else>未自评</span>
          </el-descriptions-item>
          <el-descriptions-item label="完成说明" :span="2">{{ current.completion_note || '—' }}</el-descriptions-item>
          <el-descriptions-item label="故障描述" :span="2">{{ current.fault_desc || '—' }}</el-descriptions-item>
          <el-descriptions-item label="延期原因" :span="2">{{ current.delay_reason || '—' }}</el-descriptions-item>
          <el-descriptions-item label="验收评价" :span="2">{{ current.review_comment || '—' }}</el-descriptions-item>
          <el-descriptions-item label="是否符合" :span="2">
            <el-tag v-if="current.is_qualified === 1" type="success" size="small">符合</el-tag>
            <el-tag v-else-if="current.is_qualified === 0" type="danger" size="small">不符合</el-tag>
            <span v-else class="muted">待判定</span>
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ current.remark || '—' }}</el-descriptions-item>
        </el-descriptions>

        <div class="progress-title">维修进度</div>
        <el-steps :active="stepActive(current)" align-center finish-status="success" class="progress-steps">
          <el-step title="报修" :description="current.report_time || ''" />
          <el-step title="接单" :description="current.accept_time || '未接单'" />
          <el-step title="完成" :description="current.complete_time || '未完成'" />
          <el-step title="验收" :description="current.review_score ? `${current.review_score}分` : '待验收'" />
        </el-steps>
      </template>
    </el-drawer>

    <!-- 验收评分弹窗（管理员/老板） -->
    <el-dialog v-model="reviewVisible" title="验收评分" width="480px">
      <el-alert type="warning" :closable="false" class="mb12"
        :title="`工单 ${rRow?.order_no || ''} · 维修人员 ${rRow?.engineer_name || ''}`"
        description="验收后工单置为「已完成」，并计入该维修人员的绩效（合格率 / 验收评分）。" />
      <el-form :model="rForm" label-width="90px" ref="rFormRef">
        <el-form-item label="判定结果" prop="is_qualified">
          <el-radio-group v-model="rForm.is_qualified">
            <el-radio :value="1">符合</el-radio>
            <el-radio :value="0">不符合</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="验收评分">
          <el-rate v-model="rForm.review_score" :max="5" />
          <span class="hint">1-5 分，作为该工单的验收质量分</span>
        </el-form-item>
        <el-form-item label="验收评价">
          <el-input v-model="rForm.review_comment" type="textarea" :rows="3" placeholder="验收评价 / 说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitReview">保存验收</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import { getPerformanceWorkOrders, getPerformanceWorkOrderDetail, getPerformanceTeams, getPerformanceEngineers, getPerformanceContext, reviewWorkOrder } from '@/api/performance'
import { useMenuBadgeStore } from '@/stores/menuBadge'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const teams = ref([])
const engineers = ref([])
const detailVisible = ref(false)
const current = ref({})
const filters = reactive({ date_range: [], status: '', team: '', engineer_id: '', keyword: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
// 工人视角：自动收敛到本人工单
const myContext = ref({ is_worker: false, engineer: null })
const isWorker = ref(false)

const route = useRoute()
const menuBadgeStore = useMenuBadgeStore()

// 从提醒徽标「前往处理」带 order_id 跳来时，高亮并自动打开该工单详情
const highlightId = ref(null)
const rowClassName = ({ row }) => (row.id === highlightId.value ? 'badge-target-row' : '')
const focusOrderFromQuery = () => {
  const qid = route.query.order_id
  if (qid == null) return
  const id = Number(qid)
  const row = tableData.value.find(o => o.id === id)
  if (row) {
    highlightId.value = id
    openDetail(row)
  }
}

const statusMap = { pending: '待接单', to_repair: '待维修', processing: '维修中', waiting: '待验收', completed: '已完成', timeout: '已超时' }
const priorityMap = { low: '低', normal: '普通', high: '高', urgent: '紧急' }
const statusTag = (s) => ({ pending: 'info', to_repair: 'warning', processing: 'warning', waiting: 'primary', completed: 'success', timeout: 'danger' }[s] || 'info')
const priorityTag = (p) => ({ low: 'info', normal: '', high: 'warning', urgent: 'danger' }[p] || 'info')
const stepActive = (o) => {
  if (o.review_score) return 4
  if (o.complete_time) return 3
  if (o.accept_time) return 2
  if (o.report_time) return 1
  return 0
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPerformanceWorkOrders({
      start_date: filters.date_range?.[0] || '',
      end_date: filters.date_range?.[1] || '',
      status: filters.status,
      team: isWorker.value ? '' : filters.team,
      engineer_id: isWorker.value && myContext.value.engineer ? myContext.value.engineer.id : filters.engineer_id,
      keyword: filters.keyword,
      page: pagination.page,
      page_size: pagination.pageSize
    })
    tableData.value = res.data.list
    pagination.total = res.data.pagination.total
    // 带 order_id 跳来时，定位并高亮目标工单
    focusOrderFromQuery()
  } finally {
    loading.value = false
  }
}

const openDetail = async (row) => {
  const res = await getPerformanceWorkOrderDetail(row.id)
  current.value = res.data
  detailVisible.value = true
}

// 验收评分（管理员/老板）
const reviewVisible = ref(false)
const rRow = ref(null)
const rFormRef = ref()
const rForm = reactive({ is_qualified: 1, review_score: 5, review_comment: '' })

const openReview = (row) => {
  rRow.value = row
  rForm.is_qualified = 1
  rForm.review_score = 5
  rForm.review_comment = ''
  reviewVisible.value = true
}
const submitReview = async () => {
  submitting.value = true
  try {
    await reviewWorkOrder(rRow.value.id, { ...rForm })
    ElMessage.success('验收评分已保存')
    reviewVisible.value = false
    await fetchData()
    loadWaitingCount()
    menuBadgeStore.fetch() // 验收后工单进入终态，即时刷新侧边栏提醒徽标
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '验收失败')
  } finally {
    submitting.value = false
  }
}

const handleFilter = () => { pagination.page = 1; fetchData() }
const handleReset = () => {
  filters.date_range = []; filters.status = ''; filters.keyword = ''
  if (!isWorker.value) { filters.team = ''; filters.engineer_id = '' }
  pagination.page = 1; fetchData()
}

// 老板视角：待验收数量 + 快捷筛选
const waitingCount = ref(0)
const loadWaitingCount = async () => {
  if (isWorker.value) return
  try {
    const res = await getPerformanceWorkOrders({ status: 'waiting', page: 1, page_size: 1 })
    waitingCount.value = res.data.pagination.total
  } catch (e) {}
}
const filterWaiting = () => {
  filters.status = 'waiting'
  pagination.page = 1
  fetchData()
}

// ===================== 导出功能（管理员/老板） =====================
const exporting = ref(false)

// 当前筛选条件下取全部工单（不分页），供导出使用
const buildExportParams = () => ({
  start_date: filters.date_range?.[0] || '',
  end_date: filters.date_range?.[1] || '',
  status: filters.status,
  team: isWorker.value ? '' : filters.team,
  engineer_id: isWorker.value && myContext.value.engineer ? myContext.value.engineer.id : filters.engineer_id,
  keyword: filters.keyword,
  page: 1,
  page_size: 100000
})

const fetchAllRows = async () => {
  const res = await getPerformanceWorkOrders(buildExportParams())
  return res.data?.list || []
}

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
const statusText = (s) => statusMap[s] || s
const qualifiedText = (q) => (q === 1 ? '符合' : (q === 0 ? '不符合' : '待判定'))

// 聚合指标
const aggregate = (rows) => {
  let completed = 0, waiting = 0, open = 0, overdue = 0, qualified = 0, unqualified = 0, scoreSum = 0, scoreCnt = 0
  rows.forEach((o) => {
    if (o.status === 'completed') completed++
    else if (o.status === 'waiting') waiting++
    else open++
    if (o.is_overdue_open) overdue++
    if (o.is_qualified === 1) qualified++
    else if (o.is_qualified === 0) unqualified++
    if (o.review_score) { scoreSum += Number(o.review_score); scoreCnt++ }
  })
  const judged = qualified + unqualified
  const passRate = judged ? (qualified / judged * 100).toFixed(1) + '%' : '—'
  const avgScore = scoreCnt ? (scoreSum / scoreCnt).toFixed(1) : '—'
  return { total: rows.length, completed, waiting, open, overdue, qualified, unqualified, passRate, avgScore }
}

// 导出工单为 xlsx
const exportXlsx = async () => {
  exporting.value = true
  try {
    const list = await fetchAllRows()
    if (!list.length) { ElMessage.warning('当前筛选条件下没有工单可导出'); return }
    const rows = list.map((o) => ({
      '工单编号': o.order_no,
      '状态': statusText(o.status),
      '设备名称': o.device_name || '',
      '所属区域': o.device_area || '',
      '维修人员': o.engineer_name || '—',
      '班组': o.engineer_team || '—',
      '报修时间': o.report_time || '',
      '接单时间': o.accept_time || '',
      '完成时间': o.complete_time || '',
      '预计天数': o.est_days ?? '',
      '实际天数': o.actual_days ?? '',
      '返修次数': o.repair_count ?? 0,
      '验收评分': o.review_score ?? '',
      '工人自评': o.self_score ?? '',
      '是否符合': qualifiedText(o.is_qualified),
      '验收评价': o.review_comment || '',
      '故障描述': o.fault_desc || ''
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '维修工单')
    XLSX.writeFile(wb, `维修工单_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`)
    ElMessage.success(`已导出 ${list.length} 条工单`)
  } catch (e) {
    ElMessage.error('导出失败：' + (e.message || e))
  } finally {
    exporting.value = false
  }
}

// 构建考核报告 HTML（Word 兼容）
const buildReportHtml = (list) => {
  const now = dayjs().format('YYYY-MM-DD HH:mm')
  const overall = aggregate(list)
  const groups = {}
  list.forEach((o) => {
    const key = o.engineer_name || '未分配'
    if (!groups[key]) groups[key] = { name: o.engineer_name || '未分配', team: o.engineer_team || '—', level: o.engineer_level || '—', rows: [] }
    groups[key].rows.push(o)
  })
  const groupHtml = Object.values(groups).map((g) => {
    const m = aggregate(g.rows)
    const rows = g.rows.map((o) => `<tr>
      <td>${esc(o.order_no)}</td>
      <td>${statusText(o.status)}</td>
      <td>${esc(o.device_name)}</td>
      <td>${o.report_time || ''}</td>
      <td>${o.complete_time || '—'}</td>
      <td>${o.est_days ?? '—'} / ${o.actual_days ?? '—'}</td>
      <td>${o.repair_count ?? 0}</td>
      <td>${o.review_score ?? '—'}</td>
      <td>${qualifiedText(o.is_qualified)}</td>
    </tr>`).join('')
    return `<h3>${esc(g.name)}（班组：${esc(g.team)} · 等级：${esc(g.level)}）</h3>
    <p class="sub">工单总数 ${m.total} ｜ 已完成 ${m.completed} ｜ 待验收 ${m.waiting} ｜ 进行中 ${m.open} ｜ 超期 ${m.overdue} ｜ 合格率 ${m.passRate} ｜ 平均验收分 ${m.avgScore}</p>
    <table border="1" cellspacing="0" cellpadding="5">
      <thead><tr><th>工单编号</th><th>状态</th><th>设备</th><th>报修时间</th><th>完成时间</th><th>预计/实际(天)</th><th>返修</th><th>验收分</th><th>是否符合</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
  }).join('<br/>')

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>维修人员绩效考核报告</title>
<style>
  body{font-family:"Microsoft YaHei","SimSun",sans-serif;font-size:13px;color:#222;line-height:1.6;}
  h1{text-align:center;font-size:20px;margin:12px 0;}
  h2{font-size:16px;border-left:4px solid #409EFF;padding-left:8px;margin:18px 0 8px;}
  h3{font-size:14px;margin:14px 0 4px;}
  .sub{color:#555;margin:2px 0 8px;}
  table{border-collapse:collapse;width:100%;margin-bottom:6px;}
  th,td{border:1px solid #bbb;padding:4px 6px;text-align:center;font-size:12px;}
  th{background:#f2f6fc;}
</style></head>
<body>
  <h1>维修人员绩效考核报告</h1>
  <p style="text-align:center;color:#888">生成时间：${now}</p>
  <h2>一、整体概况</h2>
  <p class="sub">工单总数 ${overall.total} ｜ 已完成 ${overall.completed} ｜ 待验收 ${overall.waiting} ｜ 进行中 ${overall.open} ｜ 超期 ${overall.overdue} ｜ 合格率 ${overall.passRate} ｜ 平均验收分 ${overall.avgScore}</p>
  <h2>二、各维修人员进度与考核结果</h2>
  ${groupHtml}
  <p style="margin-top:24px;color:#999;font-size:12px">本报告由系统自动生成，统计范围以当前筛选条件为准。</p>
</body></html>`
}

// 导出考核报告为 Word 文档（.doc）
const exportDoc = async () => {
  exporting.value = true
  try {
    const list = await fetchAllRows()
    if (!list.length) { ElMessage.warning('当前筛选条件下没有数据可导出'); return }
    const html = buildReportHtml(list)
    const blob = new Blob(['﻿' + html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `维修绩效考核报告_${dayjs().format('YYYYMMDD_HHmmss')}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success('考核报告已导出')
  } catch (e) {
    ElMessage.error('导出失败：' + (e.message || e))
  } finally {
    exporting.value = false
  }
}

onMounted(async () => {
  try {
    const ctx = await getPerformanceContext().then(r => r.data || { is_worker: false, engineer: null })
    myContext.value = ctx
    if (ctx.is_worker && ctx.engineer) { isWorker.value = true; filters.engineer_id = ctx.engineer.id }
  } catch (e) {}
  try { teams.value = await getPerformanceTeams().then(r => r.data || []) } catch (e) {}
  try { engineers.value = await getPerformanceEngineers().then(r => r.data || []) } catch (e) {}
  fetchData()
  loadWaitingCount()
})

// 从提醒「前往处理」带 order_id 跳来（组件已挂载、query 变化）时，重新定位
watch(() => route.query.order_id, () => {
  if (tableData.value.length) focusOrderFromQuery()
})
</script>

<style lang="scss" scoped>
.perf-workorders {
  .filter-card { margin-bottom: 16px; }
  .worker-banner { margin-bottom: 16px; }
  .filter-form { margin-bottom: -10px; }
  .card-title { font-weight: 600; color: #303133; }
  .table-head { display: flex; align-items: center; gap: 12px; }
  .export-btns { margin-left: auto; display: flex; gap: 8px; }
  .waiting-tag { font-weight: 600; }
  .pager { margin-top: 16px; justify-content: flex-end; }
  .click-row :deep(.el-table__row) { cursor: pointer; }
  // 从提醒「前往处理」跳来时高亮目标工单行
  :deep(.badge-target-row) > td {
    background-color: #fff7e6 !important;
  }
  .arrow { color: #c0c4cc; }
  .muted { color: #aaa; }
  .over { color: #F56C6C; font-weight: 600; }
  .ok { color: #67C23A; font-weight: 600; }
  .overdue-tag { margin-left: 4px; vertical-align: middle; }
  .progress-title { font-weight: 600; color: #303133; margin: 24px 0 12px; }
  .progress-steps { padding: 8px 0 0; }
}
</style>
