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
        </div>
      </template>
      <el-table :data="tableData" v-loading="loading" border stripe @row-click="openDetail" class="click-row">
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPerformanceWorkOrders, getPerformanceWorkOrderDetail, getPerformanceTeams, getPerformanceEngineers, getPerformanceContext, reviewWorkOrder } from '@/api/performance'

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
</script>

<style lang="scss" scoped>
.perf-workorders {
  .filter-card { margin-bottom: 16px; }
  .worker-banner { margin-bottom: 16px; }
  .filter-form { margin-bottom: -10px; }
  .card-title { font-weight: 600; color: #303133; }
  .table-head { display: flex; align-items: center; gap: 12px; }
  .waiting-tag { font-weight: 600; }
  .pager { margin-top: 16px; justify-content: flex-end; }
  .click-row :deep(.el-table__row) { cursor: pointer; }
  .arrow { color: #c0c4cc; }
  .muted { color: #aaa; }
  .over { color: #F56C6C; font-weight: 600; }
  .ok { color: #67C23A; font-weight: 600; }
  .overdue-tag { margin-left: 4px; vertical-align: middle; }
  .progress-title { font-weight: 600; color: #303133; margin: 24px 0 12px; }
  .progress-steps { padding: 8px 0 0; }
}
</style>
